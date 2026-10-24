# Ticket 006: Unified HTTP Server (`scripts/serve_skatealley.py`) MIME Types, Case-Insensitive `/revcdos/vcsky/` Resolver, Auto-Materialization & `/api/health` + Freeman Alley HUD Link (`index.html`)

- **Ticket ID**: `ticket-006`
- **Title**: Unified HTTP Server (`scripts/serve_skatealley.py`) MIME Types, Case-Insensitive `/revcdos/vcsky/` Resolver, Auto-Materialization & `/api/health` + Freeman Alley HUD Link (`index.html`)
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`, `ticket-002`, `ticket-003`, `ticket-005`
- **Blocks**: `None`

## 1. Decision Question

What exact modifications are required in `scripts/serve_skatealley.py` and the Freeman Alley 3D Portfolio entry page (`index.html`) so that:
1. `scripts/serve_skatealley.py` serves all `reVCDOS` game binary and asset extensions with accurate MIME types, CORS headers, and `HTTP 206 Partial Content` byte-range support;
2. `scripts/serve_skatealley.py` auto-materializes `revcdos/vcbr/vc-sky-en-v6.data` (`135,355,111 B`) from `revcdos/parts/vc-sky-en-v6.data.part00..03` on startup if absent on disk;
3. `scripts/serve_skatealley.py` resolves any request under `/revcdos/vcsky/` case-insensitively on disk before returning `404`;
4. `/api/health` reports `"revcdos_webapp": true` and includes `"revcdos_webapp"` in `services` and `components`; and
5. The Freeman Alley HUD sidebar (`index.html`) provides a direct launcher link to `./revcdos/` (`GTA: Vice City (reVCDOS)`)?

## 2. Authoritative Architectural Decision

### 2.1 `scripts/serve_skatealley.py` — MIME Types Registration (Lines 206–241)
In `scripts/serve_skatealley.py`:
- Define `REVCDOS_DATA_EXPECTED_SIZE = 135355111` alongside `NZP_GAME_PK3_EXPECTED_SIZE = 94276834`.
- Register the following extensions in `EXTRA_MIME_TYPES` and `CUSTOM_MIME_TYPES`:
  - `.wasm`: `"application/wasm"`
  - `.mp3`: `"audio/mpeg"`
  - `.wav`: `"audio/wav"`
  - `.mp4`: `"video/mp4"`
  - `.data`, `.txd`, `.dff`, `.col`, `.img`, `.dir`, `.dat`, `.scm`, `.gxt`, `.raw`, `.adf`, `.ifp`, `.sdt`, `.ide`, `.ipl`, `.zon`, `.fxt`, `.cfg`, `.ini`, `.part`, `.part00`..`.part99`: `"application/octet-stream"`

### 2.2 `scripts/serve_skatealley.py` — Startup Auto-Materialization (`ensure_revcdos_data`) (Lines 243–292, 595)
Following the exact pattern of `ensure_nzportable_game_pk3(base_dir=None)`:
- Implement `ensure_revcdos_data(base_dir=None)`:
  - Checks if `<root>/revcdos/vcbr/vc-sky-en-v6.data` exists and has `os.path.getsize(target_path) == REVCDOS_DATA_EXPECTED_SIZE` (`135355111`). If so, returns `True`.
  - Otherwise checks for `<root>/revcdos/parts/vc-sky-en-v6.data.part00..03`. If all 4 parts exist, streams them into a temporary file `<target_path>.tmp.<pid>`, verifies `total_written == 135355111`, and atomically replaces `target_path` via `os.replace(tmp_path, target_path)`.
- Call `ensure_revcdos_data(...)` at module import time (alongside `ensure_nzportable_game_pk3`) and in `main()` after `os.chdir(os.path.abspath(args.dir))`.

### 2.3 `scripts/serve_skatealley.py` — Case-Insensitive Path Resolver for `/revcdos/vcsky/`
Override `translate_path(self, path)` in `SkateAlleyRequestHandler`:
1. Compute `resolved = super().translate_path(path)`.
2. If `os.path.exists(resolved)` is `True`, return `resolved` immediately (O(1) fast path).
3. If `os.path.exists(resolved)` is `False`, check if the URL path (stripped of query string and normalized) starts with `/revcdos/vcsky/` (case-insensitively):
   - Walk each path component from `os.getcwd()` down the relative path components.
   - For each component `part`, if `os.path.join(curr, part)` exists, advance `curr`; otherwise, if `os.path.isdir(curr)`, scan `os.listdir(curr)` for a case-insensitive match `entry.lower() == part.lower()`.
   - If all components match, return the matched on-disk path; otherwise return `resolved`.
Because both `do_GET` / `do_HEAD` (via `SimpleHTTPRequestHandler.send_head`) and `_try_serve_range` call `self.translate_path(self.path)`, overriding `translate_path` provides seamless case-insensitive resolution for both standard `HTTP 200` and `HTTP 206 Partial Content` range requests under `/revcdos/vcsky/`.

### 2.4 `scripts/serve_skatealley.py` — `/api/health` Telemetry Contract (Lines 492–525)
In `_serve_health(self, head_only=False)`:
- Check the three required `reVCDOS` readiness paths relative to `os.getcwd()`:
  1. `os.path.isfile(os.path.join(os.getcwd(), "revcdos", "index.html"))`
  2. `os.path.isfile(os.path.join(os.getcwd(), "revcdos", "vcbr", "vc-sky-en-v6.wasm"))`
  3. `os.path.isdir(os.path.join(os.getcwd(), "revcdos", "vcsky", "fetched"))`
- Set `revcdos_ready = bool(...)`.
- If `revcdos_ready` is `True`, append `"revcdos_webapp"` to `components` (which populates both `"services"` and `"components"` in the JSON response).
- Include `"revcdos_webapp": revcdos_ready` as a top-level boolean key in the `/api/health` JSON response object alongside `"nzportable_webapp": nzportable_ready`.

### 2.5 Freeman Alley HUD Sidebar Link (`index.html`, Lines 2242–2248)
In root `index.html` inside `#sandbox-hud-body` right after the `#hud-enter-nzportable-btn` row (line 2246), add a clean launcher button pointing to `./revcdos/`:
```html
      <div class="hud-row" style="margin-top: 6px; gap: 4px;">
        <a id="hud-enter-revcdos-btn" class="hud-btn" href="./revcdos/" style="flex: 1; background: linear-gradient(135deg, rgba(255, 65, 147, 0.32), rgba(36, 158, 245, 0.28)); border-color: #ff4193; color: #fdf2f8; font-weight: 800; font-size: 11px; padding: 5px 8px; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center;" title="Launch Standalone GTA: Vice City (reVCDOS WebAssembly/WebGL2 Clean-Room Port)">
          🌴 GTA: Vice City (reVCDOS)
        </a>
      </div>
```
 strictly preserving 100% of the Freeman Alley Three.js scene and `sandbox.js` untouched.

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `scripts/serve_skatealley.py`
- `index.html`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_043.md`
- `assets/20261024T194153-999-2zne/plan-hf-server.py.txt`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `GET /api/health` returns `HTTP 200` with `"revcdos_webapp": true` and `"revcdos_webapp"` in `"services"` and `"components"`.
- Verify `GET /revcdos/vcbr/vc-sky-en-v6.wasm` returns `Content-Type: application/wasm` and `7,625,877` bytes, and `GET /revcdos/vcbr/vc-sky-en-v6.data` (including `Range: bytes=0-1023`) returns `HTTP 200` / `HTTP 206` with `Content-Type: application/octet-stream`.
- Verify a mixed-case request such as `GET /revcdos/vcsky/fetched/AUDIO/AirHornL.wav` resolves case-insensitively to `revcdos/vcsky/fetched/audio/airhornl.wav` with `HTTP 200 OK`.
- Verify root `index.html` contains `#hud-enter-revcdos-btn` with `href="./revcdos/"` and text `GTA: Vice City (reVCDOS)`.
