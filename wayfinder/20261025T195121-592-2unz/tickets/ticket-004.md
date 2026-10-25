# Ticket 004: HTTP Server Cross-Origin Isolation (`COOP`/`COEP`/`CORP`), `1 MiB` Chunked `HTTP 206` Byte-Range Streaming, Multi-Worktree Auto-Materialization & `/api/health` (`scripts/serve_skatealley.py` & `tkdr/tools/serve.py`)

- **Ticket ID**: `ticket-004`
- **Title**: HTTP Server Cross-Origin Isolation (`COOP`/`COEP`/`CORP`), `1 MiB` Chunked `HTTP 206` Byte-Range Streaming, Multi-Worktree Auto-Materialization & `/api/health` (`scripts/serve_skatealley.py` & `tkdr/tools/serve.py`)
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`, `ticket-002`, `ticket-003`
- **Blocks**: `None`

## 1. Decision Question

How should `scripts/serve_skatealley.py` and `tkdr/tools/serve.py` be implemented/updated to guarantee:
1. Deterministic `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, and `Cross-Origin-Resource-Policy: same-origin` headers on all `/tkdr/*` responses without breaking non-`/tkdr/` routes on `scripts/serve_skatealley.py`,
2. Constant-memory `1 MiB` chunked `HTTP 206 Partial Content` streaming for `1.75 GB` `/tkdr/game.iso` range requests (`GET` and `HEAD`),
3. Automatic multi-worktree materialization (`ensure_tkdr_assets`) of git-ignored `tkdr/game.iso`, `tkdr/eboot.bin`, `tkdr/ULUS10139_EBOOT.BIN`, and `tkdr/game.zip` when `scripts/serve_skatealley.py` starts in any Sandcastle worktree, and
4. `"tkdr_webapp": true` reporting in `/api/health`?

## 2. Authoritative Architectural Decision

### 2.1 Modifications to `scripts/serve_skatealley.py`

1. **Constants & MIME Types (`L216–L272` of `scripts/serve_skatealley.py`)**:
   - Define:
     ```python
     TKDR_ISO_EXPECTED_SIZE = 1750237184
     TKDR_EBOOT_EXPECTED_SIZE = 4836160
     ```
   - Add `.iso`, `.cso`, `.bin`, `.elf`, `.prx`, `.zip` to `EXTRA_MIME_TYPES` (`"application/octet-stream"` for `.iso`, `.cso`, `.bin`, `.elf`, `.prx`, and `"application/zip"` for `.zip`).

2. **Multi-Worktree Asset Materialization (`ensure_tkdr_assets(base_dir=None)`, after `ensure_revcdos_luis_player` at `L455`)**:
   - **Root-Cause Rationale (`INV-ROOT-CAUSE-AGENCY-01`)**: Because `tkdr/game.iso` (`1,750,237,184` B), `tkdr/eboot.bin` (`4,836,160` B), `tkdr/ULUS10139_EBOOT.BIN`, and `tkdr/game.zip` are excluded from Git via `.gitignore`, fresh Sandcastle worktrees (`review`, `tester`) created via `git worktree` will not have those git-ignored files unless materialized from the shared workspace cache `/Users/diesel/Desktop/SkateAlley/tkdr/` (analogous to `ensure_revcdos_vcsky` at `L379–L417`).
   - Implement `ensure_tkdr_assets(base_dir=None)`:
     - Resolve `root = os.path.abspath(base_dir or os.getcwd())` and `target_tkdr = os.path.join(root, "tkdr")`.
     - Check candidate shared cache directories (`/Users/diesel/Desktop/SkateAlley/tkdr` and `os.path.abspath(os.path.join(root, "..", "..", "..", "tkdr"))`).
     - If `game.iso` (`1,750,237,184` B) or `eboot.bin` (`4,836,160` B) is missing in both `target_tkdr` and the shared cache, import and invoke `provision_tkdr(root)` from `scripts/provision_tkdr.py`.
     - Ensure `game.iso`, `eboot.bin`, `ULUS10139_EBOOT.BIN`, and `game.zip` (plus tracked `tkdr/` files if serving from `/Users/diesel/Desktop/SkateAlley`) are linked (`os.link` with `shutil.copy2` fallback) between the shared cache and `target_tkdr`.
   - Call `ensure_tkdr_assets(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))` and `ensure_tkdr_assets(os.getcwd())` at module load AND inside `main()` after `os.chdir(os.path.abspath(args.dir))`.

3. **Scoped Cross-Origin Isolation Headers in `SkateAlleyRequestHandler.end_headers(self)` (`L1131–L1140`)**:
   - Inspect the request path before `super().end_headers()`:
     ```python
     req_path = getattr(self, "path", "").split("?", 1)[0].split("#", 1)[0]
     is_tkdr_route = (
         req_path == "/tkdr"
         or req_path.startswith("/tkdr/")
         or os.path.basename(os.getcwd()) == "tkdr"
     )
     if is_tkdr_route:
         self.send_header("Cross-Origin-Opener-Policy", "same-origin")
         self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
         self.send_header("Cross-Origin-Resource-Policy", "same-origin")
     ```
   - This guarantees `window.crossOriginIsolated === true` on all `/tkdr/*` documents, Worker modules, WebAssembly binaries, and range streams without altering COOP/COEP behavior on `/` or other routes.

4. **Bounded `1 MiB` Chunked Streaming in `SkateAlleyRequestHandler._try_serve_range(self, head_only=False)` (`L1520–L1563`)**:
   - Replace the single-allocation `data = f.read(length)` (which spikes memory when an open-ended `Range: bytes=0-` request is issued against the `1.75 GB` ISO) with bounded `1 MiB` (`1024 * 1024` B) chunked streaming:
     ```python
     try:
         self.send_response(206)
         self.send_header("Content-Type", ctype)
         self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
         self.send_header("Content-Length", str(length))
         self.end_headers()
         if not head_only:
             chunk_size = 1024 * 1024
             with open(path, "rb") as f:
                 f.seek(start)
                 remaining = length
                 while remaining > 0:
                     chunk = f.read(min(chunk_size, remaining))
                     if not chunk:
                         break
                     self.wfile.write(chunk)
                     remaining -= len(chunk)
     except (BrokenPipeError, ConnectionResetError):
         pass
     return True
     ```

5. **`/api/health` Component Verification in `SkateAlleyRequestHandler._serve_health(self, head_only=False)` (`L1472–L1519`)**:
   - Check:
     ```python
     tkdr_iso_path = os.path.join(os.getcwd(), "tkdr", "game.iso")
     tkdr_eboot_path = os.path.join(os.getcwd(), "tkdr", "eboot.bin")
     tkdr_ready = (
         os.path.isfile(os.path.join(os.getcwd(), "tkdr", "index.html"))
         and os.path.isfile(os.path.join(os.getcwd(), "tkdr", "tkdr.wasm"))
         and os.path.isfile(tkdr_iso_path)
         and os.path.getsize(tkdr_iso_path) == TKDR_ISO_EXPECTED_SIZE
         and os.path.isfile(tkdr_eboot_path)
         and os.path.getsize(tkdr_eboot_path) == TKDR_EBOOT_EXPECTED_SIZE
     )
     ```
   - When `tkdr_ready` is `True`, append `"tkdr_webapp"` to `components`, and include `"tkdr_webapp": tkdr_ready` in the `/api/health` JSON response object.

### 2.2 Standalone Server `tkdr/tools/serve.py`
Create `tkdr/tools/serve.py` (enhancing upstream `tools/serve.py`) so that running `python3 tkdr/tools/serve.py [DIR] [PORT] [--iso PATH] [--eboot PATH] [--zip PATH]` provides full parity:
1. Emits `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, `Cross-Origin-Resource-Policy: same-origin`, `Accept-Ranges: bytes`, and `Cache-Control: no-store` on every response.
2. Supports both `/<subpath>` and `/tkdr/<subpath>` paths (stripping a leading `/tkdr/` prefix when serving the `tkdr/` directory directly), plus `/api/health` returning `{"ok": True, "status": "ok", "tkdr_webapp": True, "components": ["tkdr_webapp"]}`.
3. Supports `HTTP 206 Partial Content` `Range: bytes=<start>-<end>` requests (with `416` on out-of-bounds ranges and `1 MiB` chunked streaming) on **both `GET` and `HEAD`** for any file in `directory` as well as explicit `--iso`, `--eboot`, and `--zip` overrides.
4. Defaults `directory` to the `tkdr/` folder (`os.path.dirname(os.path.dirname(os.path.abspath(__file__)))`) and `port` to `8080` when not passed on the command line, and binds `http.server.ThreadingHTTPServer`.

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `scripts/serve_skatealley.py`
- `tkdr/tools/serve.py`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_057.md`
- `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/tkdr-recomp/tools/serve.py`
- `assets/20261025T195121-592-2unz/plan-tkdr-runtime-and-crypto-manifest.json`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `GET /api/health` returns `HTTP 200 OK` with `"tkdr_webapp": true` and `"tkdr_webapp"` in `"components"`.
- Verify `HEAD /tkdr/` and `HEAD /tkdr/tkdr.html` and `HEAD /tkdr/tkdr.wasm` return `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, and `Cross-Origin-Resource-Policy: same-origin`.
- Verify `GET /tkdr/game.iso` with `Range: bytes=32768-34815` returns `HTTP 206 Partial Content`, `Content-Range: bytes 32768-34815/1750237184`, `Content-Length: 2048`, and payload starting with `b"\x01CD001\x01\x00PSP GAME"`.
- Verify `HEAD /tkdr/game.iso` with `Range: bytes=0-262143` returns `HTTP 206 Partial Content`, `Content-Range: bytes 0-262143/1750237184`, `Content-Length: 262144`, and empty body.
