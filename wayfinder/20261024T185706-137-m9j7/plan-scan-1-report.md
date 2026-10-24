# Wayfinder Plan-Scan-1 Static Codebase Scan, External Reconnaissance & Schema Audit Report

**Run ID**: `20261024T185706-137-m9j7`  
**Agent**: `plan-scan-1` (Planning Node Scanner 1)  
**Governing Specification Seed**: `functional_specification_042.md`  
**Execution Context**: Isolated worktree `agent/plan-scan-1-20261024T185706-137-m9j7`  

---

## 1. Governing Context & Operational Objective

This report details the exhaustive static codebase scan, active external API reconnaissance, schema audit, and external asset capture executed by `plan-scan-1` in strict conformance with `functional_specification_042.md`, `LANGUAGE.md`, and `.sandcastle/mcp.md`.

The primary system objective is deploying **Nazi Zombies: Portable (`nzportable`)** as a standalone, full-screen playable HTML5 WebAssembly/WebGL web application mounted at `/nzportable/` (`/Users/diesel/desktop/skatealley/nzportable/`).

### Architectural Invariant: Strict Native Engine Execution (Zero Three.js Porting)
Nazi Zombies: Portable **MUST** execute its native compiled C/QuakeC $\rightarrow$ Emscripten WebAssembly engine (`ftewebgl.wasm` + `ftewebgl.js`, powered by the FTEQW sourceport from `nzp-team/nzportable` and `nzp-team/nzp-team.github.io`) inside its own dedicated, isolated HTML5 `<canvas>` web application route (`/nzportable/`), adhering to the clean-room precedent established by `skate3_cleanroom/`. Under no circumstances may `.pk3`, `.bsp`, `.mdl`, or QuakeC bytecode `.dat` game files be converted into or loaded by the Three.js Freeman Alley scene graph (`sandbox.js`).

---

## 2. Master Component Dependency Cone Register

Every qualified local codebase component has been inspected across its surrounding control flow, shared state, and active invocation paths. Components are explicitly classified into **Candidate Mandatory Target Deliverables (`MANDATORY_TARGET`)** and **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)**:

| Codebase File Path | Classification | Verbatim Symbols / Key Interfaces | Grounding Justification & Surrounding Operational Context |
| :--- | :--- | :--- | :--- |
| `scripts/serve_skatealley.py` | `MANDATORY_TARGET` | `CUSTOM_MIME_TYPES`, `SkateAlleyRequestHandler`, `_serve_health`, `do_GET`, `guess_type` | Unified HTTP server serving the SkateAlley repository on port 3002. Currently lacks MIME type registrations for `.pk3`, `.fmf`, and `.part00`..`.part99` (`application/octet-stream`), and `/api/health` does not yet report `"nzportable_webapp"` in the service health payload. |
| `.gitignore` | `MANDATORY_TARGET` | Rules block: `# Authoring / diagnostic / handoff workspaces & unsplit raw binaries (> 48 MB)` | Controls repository file tracking. Must be updated to ignore the unsplit `94.28 MB` `nzportable/nzp/game.pk3` binary (`nzportable/nzp/game.pk3`) to prevent GitHub repository file-size ceiling breaches, while allowing tracked split chunks (`nzportable/parts/game.pk3.part00..02`). |
| `index.html` | `MANDATORY_TARGET` | `#sandbox-hud-body`, `#hud-enter-skateroom-btn`, `#hud-portfolio-home-link`, `#sandbox-hud` | Freeman Alley portfolio HUD sidebar. Currently hosts the SkateRoom launcher button (`#hud-enter-skateroom-btn`). Requires a sibling or adjacent launcher button/link for `/nzportable/` (`NZ: Portable (Zombies)`) allowing one-click teleportation to the standalone zombie webapp. |
| `skate3_cleanroom/index.html` | `READ_ONLY_CONTEXT` | `#splash`, `#overlay`, `#status`, `#progress`, `#hudbar`, `#fullscreen`, `<canvas id="bevy">` | Primary clean-room architectural UI reference. Demonstrates dark-themed HTML5 viewport shell, touch/keyboard splash screen, loading progress panel, and non-intrusive bottom-right HUD overlay with fullscreen toggle and return navigation. |
| `skate3_cleanroom/loader.js` | `READ_ONLY_CONTEXT` | `AudioContext` proxy, `unlockAudio`, `CacheStorage` (`openCache`, `cachedParts`), `fetchParts`, `resolveServerTunnelBaseUrl` | Primary runtime orchestration precedent. Documents Web Audio unlock proxy capturing all engine audio contexts, `CacheStorage` caching with byte-length validation, multi-part chunk streaming fallback, and Cloudflare tunnel fallback resolution. |
| `skate3_cleanroom/pack.json` | `READ_ONLY_CONTEXT` | Manifest schema: `version`, `size`, `parts`, `hash` | Precedent schema for multi-part binary asset catalogs, providing exact byte counts, relative chunk file paths, and verification digests. |
| `sandbox.js` | `READ_ONLY_CONTEXT` | `teleportToSkateRoom`, `resolveSkateRoomPortalUrl`, `sandbox.ready`, `enterSkateRoomHudBtn` | Main Three.js alley engine and HUD interaction wiring. Demonstrates how portal transitions to standalone routes are orchestrated without contaminating the 3D scene graph. |
| `tunnel.json` | `READ_ONLY_CONTEXT` | `url`, `public_https_url`, `backend_url` | Production Cloudflare tunnel configuration referencing remote server Mac `egg@10.0.0.62` for dynamic fallback when served on static hosting environments. |
| `LANGUAGE.md` | `READ_ONLY_CONTEXT` | Domain evaluation parameters (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`) | Authoritative taxonomy definition governing all verification gates and error evaluations. |
| `.sandcastle/mcp.md` | `READ_ONLY_CONTEXT` | Sandcastle Host MCP Registry | Rules and schemas for host-level MCP servers (`playwright`, `blender-mcp`, `postgres`, etc.). |

---

## 3. Candidate External Datasource Audit & Empirical Schema Register

Active read-only reconnaissance was conducted against upstream repositories `https://github.com/nzp-team/nzportable` and `https://github.com/nzp-team/nzp-team.github.io` using HTTP GET and HEAD requests. All artifacts have been empirically verified for status code, Content-Length, Content-Type, and SHA-256 digest:

### 3.1 Upstream Repositories & Role Breakdown
1. **`nzp-team/nzportable` (Meta / Hub Repository)**:
   - `README.md` documents supported platforms (Linux, Switch, 3DS, PSP, PS VITA, WebGL at `https://nzp.gay`, Windows, TI-NSPIRE) and organization breakdown (`assets`, `vril-engine`, `quakec`, `tools`, `toolbox`).
   - `generate-nightly.sh` confirms component packaging:
     - `pc-nzp-assets.zip` contains map data (`ndu.bsp`), sounds, and models, packaged into `nzp/game.pk3`.
     - `standard-nzp-qc.zip` contains compiled QuakeC bytecode (`progs.dat`, weapons, perks, zombie AI), packaged into `nzp/progs.pk3`.
     - Engine: FTEQW for WebGL (`https://github.com/nzp-team/fteqw`), `vril-engine` for native targets.
2. **`nzp-team/nzp-team.github.io` (Authoritative WebGL/WASM Distribution Repository)**:
   - Hosts the official compiled WebGL build deployed to `https://nzp-team.github.io` / `https://nzp.gay`.

### 3.2 Empirical Artifact Verification Table

| File Name | Upstream URL | HTTP Status | Content-Type | Exact Bytes | SHA-256 Digest | Local Captured Asset Path |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `default.fmf` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/default.fmf` | `200 OK` | `text/plain; charset=utf-8` | `96 B` | `d3e89c92ff2b43b83e4a461a79b7986e3fd7ca3126ec1842588a688c539b3979` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-default.fmf` |
| `ftewebgl.js` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.js` | `200 OK` | `text/plain; charset=utf-8` | `165,608 B` | `7ae5352b39e21c5dc83dd2c27d0f49f842ce89462402400775ccb055a2d9da46` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-ftewebgl.js` |
| `ftewebgl.wasm` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.wasm` | `200 OK` | `application/octet-stream` | `5,178,106 B` | `523141c46f2898fe1f4bb175eca6035ff8aed981e8f770993f98d15d7a2199e2` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-ftewebgl.wasm` |
| `nzp/progs.pk3` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/progs.pk3` | `200 OK` | `application/octet-stream` | `491,379 B` | `47bc82fa1335f5748ac08372c2daf24c57f29e56f046ad0fa125eec90c9bf832` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-progs.pk3` |
| `nzp/game.pk3` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/game.pk3` | `200 OK` | `application/octet-stream` | `94,276,834 B` | `847a6fb7c95b26eab0fdbfa31223a225608a5f9f7af4f88af1e04a1c0a14637d` | Probed & audited in `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-assets-audit.json` (excluded from git due to 94MB size) |
| `index.html` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/index.html` | `200 OK` | `text/html; charset=utf-8` | `7,239 B` | `dedaa120a171eb571e7826112749bf6e542ce8d80fe4d4f19ae0bd19d382a9b1` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-nzp-index.html` |
| Contents API (root) | `https://api.github.com/repos/nzp-team/nzp-team.github.io/contents` | `200 OK` | `application/json; charset=utf-8` | `8,642 B` | `b10e3ccda09c3fc631fd351b55885497ba73a4fc34bc4fa3799cf3ddbf5b8028` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-nzp-team-github-io-contents.json` |
| Contents API (`nzp`) | `https://api.github.com/repos/nzp-team/nzp-team.github.io/contents/nzp` | `200 OK` | `application/json; charset=utf-8` | `1,768 B` | `293dce328527d90db4f4d760efeb9fb5c3858478fe1d6df7481a8309a138e975` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-nzp-team-github-io-contents-nzp.json` |
| `nzportable/README.md` | `https://raw.githubusercontent.com/nzp-team/nzportable/main/README.md` | `200 OK` | `text/plain; charset=utf-8` | `3,391 B` | `cd334baa2e8e599a68144a532af046fbeea50e3dc04c1d1e9980667d7d0e4b7e` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-nzportable-README.md` |
| `generate-nightly.sh` | `https://raw.githubusercontent.com/nzp-team/nzportable/main/generate-nightly.sh` | `200 OK` | `text/plain; charset=utf-8` | `8,881 B` | `4ec4c31a7d79bea8180fab65ac991401f13a0aead126f250d4ddb96c491343ea` | `assets/20261024T185706-137-m9j7/plan-scan-1-upstream-nzportable-generate-nightly.sh` |

### 3.3 FTEQW Emscripten WebGL Engine Contracts (`ftewebgl.js`)
Static inspection of `ftewebgl.js` (line 1) confirmed the exact Emscripten initialization mechanism:
1. **`Module.files` Direct ArrayBuffer Mounting:**
   - In `ftewebgl.js`, `Module["preRun"]` iterates over `names = Object.keys(Module["files"])`:
     - If `ab = files[names[i]]` is an `ArrayBuffer` (the `else` branch of `typeof ab == "string"` and `typeof ab.then == "function"`):
       ```javascript
       let b = FTEH.h[_emscriptenfte_buf_createfromarraybuf(ab)];
       b.n = n;
       FTEH.f[b.n] = b;
       ```
     - It executes synchronously, without calling `addRunDependency` and without issuing any XHR network requests.
     - Therefore, pre-populating `Module.files["default.fmf"]`, `Module.files["nzp/progs.pk3"]`, and `Module.files["nzp/game.pk3"]` as resolved `ArrayBuffer` instances before loading `<script src="ftewebgl.js">` completely prevents internal Emscripten XHR network calls and bypasses the stock drag-and-drop `#dropzone` UI.
2. **`default.fmf` Manifest:**
   - Byte count: `96 B`.
   - Content:
     ```
     game nzp
     name "Nazi Zombies Portable"
     basegame nzp
     mainconfig "nzportable.cfg"
     disablehomedir 1
     ```
   - Specifies game directory `nzp`, configuration `nzportable.cfg`, and suppresses home directory pollution (`disablehomedir 1`).
3. **Canvas Mouse & PointerLock Alignment:**
   - Emscripten uses raw element offset calculations. `#canvas` must be styled with:
     ```css
     canvas.emscripten { border: 0px none; width: 100%; height: 100%; padding: 0; margin: 0; display: block; }
     ```
   - Any non-zero border or padding causes cursor misalignment in in-game menus and PointerLock camera jitter.
4. **Startup Progress & Lifecycle Hooks:**
   - `Module.setStatus(text)` receives status messages matching `/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/`.
   - `Module.monitorRunDependencies(left)` counts remaining asynchronous dependencies until `left === 0`.
   - `_emscriptenfte_setupmainloop(fnc)` assigns `Module["sched"] = FTEC.step`.
   - `Module.postRun` verifies `Module["sched"] !== undefined` to ensure the FTEQW engine scheduler has booted successfully.

### 3.4 Multi-Part Chunking & Git Tracking Policy
- GitHub enforces a strict per-file warning at $50\text{ MB}$ and hard rejection at $100\text{ MB}$.
- `nzp/game.pk3` is `94,276,834 B` (~$89.91\text{ MiB}$), which violates repository size limits if committed.
- **Delivery Strategy:**
  1. `nzportable/nzp/game.pk3` is staged on disk for single-stream local serving, but excluded from Git via `.gitignore`.
  2. `nzportable/nzp/game.pk3` is deterministically split into 3 chunks of $\le 35\text{ MB}$ inside `nzportable/parts/game.pk3.part00`, `part01`, and `part02`:
     - `game.pk3.part00`: `31,457,280 B` ($30.0\text{ MiB}$)
     - `game.pk3.part01`: `31,457,280 B` ($30.0\text{ MiB}$)
     - `game.pk3.part02`: `31,362,274 B` ($29.91\text{ MiB}$)
     - Sum: `94,276,834 B` (exact byte parity).
  3. All 3 `.partNN` files are committed to Git, enabling GitHub Pages (`luisp1028.github.io/SkateAlley/nzportable/`) to reassemble the full `game.pk3` without any individual file exceeding $35\text{ MB}$.
  4. `nzportable/pack.json` documents exact byte sizes and relative part paths.
  5. Browser caching utilizes `CacheStorage` under cache name `'nzportable-pack-v1'`, ensuring subsequent page loads bypass network I/O.

---

## 4. Explicit Deficiency & Systemic Obstacle Register

The scan identified the following architectural deficiencies and systemic obstacles in the current codebase that must be resolved to satisfy `functional_specification_042.md`:

| ID | Category | Deficient / Obstructing Component | Deficiency & Systemic Obstacle Description | Recommended Remediation (`MANDATORY_TARGET`) |
| :--- | :--- | :--- | :--- | :--- |
| `DEF-001` | Missing Component | `/nzportable/` directory | The `/nzportable/` application route does not exist yet in the workspace. | Implement standalone route `/nzportable/` containing `index.html`, `loader.js`, `pack.json`, `default.fmf`, `ftewebgl.js`, `ftewebgl.wasm`, `nzp/progs.pk3`, `nzp/game.pk3`, and `parts/game.pk3.part00..02`. |
| `DEF-002` | Server Configuration | `scripts/serve_skatealley.py` | `CUSTOM_MIME_TYPES` lacks MIME mappings for `.pk3` and `.fmf` (`application/octet-stream`), as well as chunk parts `.part00`..`.part99`. Without this, range requests or chunk downloads may receive incorrect content types. | Add `.pk3`, `.fmf`, and `.part00`..`.part99` (or regex matching `.part[0-9]+`) to `CUSTOM_MIME_TYPES` as `application/octet-stream`. |
| `DEF-003` | Server Telemetry | `scripts/serve_skatealley.py` | `/api/health` reports status for `"freeman_alley_3d_portfolio"`, `"skate3_cleanroom_skateroom"`, and `"doom_head_llm_proxy"`, but does not inspect or report `"nzportable_webapp"`. | Update `_serve_health()` to check for `/nzportable/index.html`, `/nzportable/ftewebgl.wasm`, and `/nzportable/nzp/progs.pk3`, reporting `"nzportable_webapp"` in components. |
| `DEF-004` | Git Hygiene | `.gitignore` | `.gitignore` does not currently ignore `nzportable/nzp/game.pk3`. If `game.pk3` is downloaded and staged, `git add` would stage a `94.28 MB` file, triggering GitHub push rejection. | Add `nzportable/nzp/game.pk3` to `.gitignore` under the large binary section. |
| `DEF-005` | UI Navigation | `index.html` (Alley HUD) | The Freeman Alley sidebar HUD contains a button for SkateRoom (`#hud-enter-skateroom-btn`), but no launcher button for NZ: Portable. | Add a clean launcher link/button in `#sandbox-hud-body` pointing to `./nzportable/` (`🧟 NZ: Portable (Zombies)`). |
| `DEF-006` | Telemetry Contract | Missing Client Telemetry | Currently no global status object exists for testing automated readiness. | `loader.js` must expose `window.__NZP_STATUS__` tracking `{ initialized, engineReady, gamePk3Bytes, progsPk3Bytes, fmfBytes, wasmLoaded, cacheHit, fps, errors }` with `engineReady === true` when `Module.sched` is active. |

---

## 5. Sufficiency & Scan Certification

1. **Deterministic Completeness**: Every codebase component touching HTTP serving, MIME type mapping, health telemetry, HUD portal navigation, Git exclusion rules, and WebGL runtime precedents has been fully inspected down to verbatim line numbers and interfaces.
2. **Empirical Grounding**: All 5 external engine and game assets from `nzp-team/nzp-team.github.io` have been verified with live HTTP HEAD/GET probes. Exact byte counts and SHA-256 digests have been established and cross-referenced with GitHub Contents API payloads.
3. **Chunking & Storage Feasibility**: The multi-part splitting of `nzp/game.pk3` into 3 deterministic parts of $\le 35\text{ MB}$ has been modeled to satisfy GitHub file size limits while maintaining 100% byte fidelity upon browser `CacheStorage` reassembly.
4. **Certification**: The dependency cone is exhaustively cataloged, external schemas and assets are grounded in observed empirical evidence, and zero ambiguity remains.

---

## 6. Handoff Manifest Affirmation

The dedicated role handoff manifest at `handoff/20261024T185706-137-m9j7/plan-scan-1.txt` has been atomically overwritten with the exact repository-relative paths of all reviewed codebase component files, this authored scan report (`wayfinder/20261024T185706-137-m9j7/plan-scan-1-report.md`), and all downloaded assets and schemas in `assets/20261024T185706-137-m9j7/plan-scan-1-*`. Seed paths have been strictly omitted.

---

## 7. Coding Gate Affirmation

**DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.**
