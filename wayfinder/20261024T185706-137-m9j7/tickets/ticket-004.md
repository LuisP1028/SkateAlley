# Ticket 004: Unified HTTP Server MIME/Health Integration (`scripts/serve_skatealley.py`) and Freeman Alley 3D Portfolio HUD Launcher (`index.html`)

- **Ticket ID**: `ticket-004`
- **Target Stage**: `implement` (independent test authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: Resolved / Decided
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`, `ticket-002`, `ticket-003`
- **Blocks**: None

---

## 1. Decision Question

How should `scripts/serve_skatealley.py` and `index.html` be updated so that the unified SkateAlley HTTP server serves all `/nzportable/` binary and multi-part assets with proper MIME types, CORS headers, and HTTP `206 Partial Content` support, reports `nzportable_webapp` readiness in `/api/health`, and provides one-click navigation from the Freeman Alley 3D Portfolio HUD to `./nzportable/`?

---

## 2. Empirical Ground-Truth Findings (`scripts/serve_skatealley.py` & `index.html`)

1. **MIME Type Resolution in `scripts/serve_skatealley.py` (lines 206–260):**
   - `SkateAlleyRequestHandler.guess_type(self, path)` splits the file extension via `_, ext = os.path.splitext(path)` and looks up `ext.lower()` in `CUSTOM_MIME_TYPES`.
   - For multi-part files named `game.pk3.part00`, `game.pk3.part01`, `game.pk3.part02`, `os.path.splitext(path)` returns `.part00`, `.part01`, `.part02` (not `.part`).
   - Additionally, `functional_specification_042.md` §6.1 references `EXTRA_MIME_TYPES` containing `.pk3`, `.fmf`, and `.part00`..`.part99` mapped to `application/octet-stream` and `.wasm` mapped to `application/wasm`.
2. **Health Endpoint Schema Reconciliation in `scripts/serve_skatealley.py` (lines 426–448, `INV-ROOT-CAUSE-AGENCY-01`):**
   - `functional_specification_042.md` §2 (`{correct required outputs}` item 3) specifies reporting `"nzportable_webapp": true` in `/api/health`, while §6.1 specifies verifying the existence of `/nzportable/index.html`, `/nzportable/ftewebgl.wasm`, and `/nzportable/nzp/progs.pk3` and reporting `"nzportable_webapp"` in the `services` list (alongside the existing `"components"` list in `_serve_health`).
   - Including `"nzportable_webapp": nzp_ready` as a top-level boolean AND including `"nzportable_webapp"` inside both `"services"` and `"components"` arrays when those files exist satisfies all callers and specification clauses simultaneously.
3. **Freeman Alley HUD Sidebar Launcher Placement in `index.html` (lines 2234–2242):**
   - Inside `<aside id="sandbox-hud">`, lines 2234–2241 define the launcher row containing `#hud-enter-skateroom-btn` (`🛹 Enter SkateRoom (Skate 3)`) and `#hud-portfolio-home-link` (`↗ Portfolio Hub`). Adding a dedicated launcher link/button for `./nzportable/` (`🧟 NZ: Portable (Zombies)`) right below or alongside that row provides immediate one-click navigation from the 3D portfolio to `/nzportable/`.

---

## 3. Locked Architectural Decisions for `implement`

### 3.1 `EXTRA_MIME_TYPES` & `CUSTOM_MIME_TYPES` in `scripts/serve_skatealley.py`
In `scripts/serve_skatealley.py` (around lines 206–230):
1. Define `EXTRA_MIME_TYPES` containing:
   - `".wasm": "application/wasm"`
   - `".pk3": "application/octet-stream"`
   - `".fmf": "application/octet-stream"`
   - `".part": "application/octet-stream"`
   - `{f".part{i:02d}": "application/octet-stream" for i in range(100)}` (covering `.part00` through `.part99`)
2. Merge `EXTRA_MIME_TYPES` into `CUSTOM_MIME_TYPES` (`CUSTOM_MIME_TYPES.update(EXTRA_MIME_TYPES)`) and register all entries with `mimetypes.add_type(mime, ext)`.
3. In `SkateAlleyRequestHandler.guess_type(self, path)`, check both `CUSTOM_MIME_TYPES` and `EXTRA_MIME_TYPES` (plus a fallback regex check `re.match(r"^\.part\d+$", ext_lower)` returning `"application/octet-stream"`).

### 3.2 `/api/health` Readiness Check in `scripts/serve_skatealley.py`
In `SkateAlleyRequestHandler._serve_health(self, head_only=False)` (lines 426–448):
1. Check whether `nzportable/index.html`, `nzportable/ftewebgl.wasm`, and `nzportable/nzp/progs.pk3` exist as files relative to `os.getcwd()`:
   ```python
   nzp_required = (
       os.path.join(os.getcwd(), "nzportable", "index.html"),
       os.path.join(os.getcwd(), "nzportable", "ftewebgl.wasm"),
       os.path.join(os.getcwd(), "nzportable", "nzp", "progs.pk3"),
   )
   nzportable_ready = all(os.path.isfile(p) for p in nzp_required)
   ```
2. Build `components` and `services` lists:
   ```python
   components = [
       "freeman_alley_3d_portfolio",
       "skate3_cleanroom_skateroom",
       "doom_head_llm_proxy",
   ]
   if nzportable_ready:
       components.append("nzportable_webapp")
   ```
3. Include in the `/api/health` JSON response dict:
   - `"nzportable_webapp": nzportable_ready`
   - `"services": list(components)`
   - `"components": components`

### 3.3 Freeman Alley HUD Launcher Link in `index.html`
In `index.html` (immediately after line 2241 inside `<div class="hud-section">` of `#sandbox-hud-body`):
Add a `.hud-row` containing an anchor/button linking directly to `./nzportable/`:
```html
      <div class="hud-row" style="margin-top: 6px;">
        <a id="hud-enter-nzportable-btn" class="hud-btn" href="./nzportable/" style="flex: 1; background: linear-gradient(135deg, rgba(220, 38, 38, 0.32), rgba(245, 158, 11, 0.28)); border-color: #f59e0b; color: #fef3c7; font-weight: 800; font-size: 11px; padding: 5px 8px; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center;" title="Launch Standalone Nazi Zombies: Portable (FTEQW WebGL/WASM Clean-Room Build)">
          🧟 NZ: Portable (Zombies)
        </a>
      </div>
```

---

## 4. Deliverable Register (`INV-DELIVERABLE-SPLIT-01`)

### Mandatory Target Deliverables (`MANDATORY_TARGET`)
- `scripts/serve_skatealley.py`
- `index.html`

### Read-Only Discovery Context (`READ_ONLY_CONTEXT`)
- `sandbox.js`
- `skate3_cleanroom/index.html`
