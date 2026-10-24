# Wayfinder Scan & Reconnaissance Report (Agent 2 / plan-scan-2)
**Run ID:** `20261024T185706-137-m9j7`  
**Governing Specification:** [`functional_specification_042.md`](file:///Users/diesel/Desktop/SkateAlley/functional_specification_042.md)  
**Authoritative Vocabulary:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/LANGUAGE.md)  
**Host MCP Protocol:** [`.sandcastle/mcp.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/mcp.md)  

---

## 1. Governing Context & Invariants

This report captures the static codebase scan, external API reconnaissance, upstream asset capture, and schema audit conducted by Agent 2 (`plan-scan-2`) in an isolated worktree (`agent/plan-scan-2-20261024T185706-137-m9j7`).

- **Causal Independence & Disjoint Output Paths (`INV-PARALLEL-01`):** Agent 2 executes concurrently without reading `wayfinder/20261024T185706-137-m9j7/map.md` or `wayfinder/20261024T185706-137-m9j7/tickets/*`. It writes its report strictly to [`wayfinder/20261024T185706-137-m9j7/plan-scan-2-report.md`](file:///Users/diesel/Desktop/SkateAlley/wayfinder/20261024T185706-137-m9j7/plan-scan-2-report.md), saves downloaded assets prefixed with `plan-scan-2-` in [`assets/20261024T185706-137-m9j7/`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/), and atomically overwrites [`handoff/20261024T185706-137-m9j7/plan-scan-2.txt`](file:///Users/diesel/Desktop/SkateAlley/handoff/20261024T185706-137-m9j7/plan-scan-2.txt).
- **Single Seed Specification Binding (`INV-HANDOFF-01`):** Bound strictly and exclusively to [`functional_specification_042.md`](file:///Users/diesel/Desktop/SkateAlley/functional_specification_042.md) ("Standalone Playable WebAssembly/WebGL Web Application for Nazi Zombies: Portable (`/nzportable/`)").
- **Strict Implementation Gate (`INV-BOUNDARY-01`):** DO NOT CODE YET. No production implementation code, test code, or structural edits were written.

---

## 2. Master Component Dependency Cone Register

Every file inspected is classified as either a **Candidate Mandatory Target Deliverable (`MANDATORY_TARGET`)** (a production file, caller, or adjacent configuration requiring edits to satisfy Spec 042) or **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** (reference architecture, schemas, or captured assets).

| Component Path | Classification | Verbatim Symbols / Interfaces | Grounding & Operational Role |
| :--- | :--- | :--- | :--- |
| [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | `MANDATORY_TARGET` | `CUSTOM_MIME_TYPES` (L206-227), `guess_type` (L255-260), `_serve_health` (L426-448), `do_GET` (L456-500) | Server routing for `.pk3`, `.fmf`, and `.part00`..`.part99` (`application/octet-stream`), `.wasm` (`application/wasm`), range requests (`HTTP 206`), and `/api/health` status reporting `"nzportable_webapp": true`. |
| [`.gitignore`](file:///Users/diesel/Desktop/SkateAlley/.gitignore) | `MANDATORY_TARGET` | Lines 38-49 | Must be updated with `nzportable/nzp/game.pk3` to enforce Git file ceiling ($\le 35\text{ MB}$ per tracked file, zero files $> 45\text{ MB}$), while tracking split parts `nzportable/parts/game.pk3.part00..02`. |
| [`index.html`](file:///Users/diesel/Desktop/SkateAlley/index.html) | `MANDATORY_TARGET` | `#sandbox-hud-body` (L2202), `.hud-section` (L2203-2242), `#hud-enter-skateroom-btn` (L2235), `#hud-portfolio-home-link` (L2238) | Freeman Alley HUD sidebar navigation. A launcher link/button pointing to `./nzportable/` (`NZ: Portable (Zombies)`) must be mounted in the HUD row next to the SkateRoom button. |
| [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/sandbox.js) | `READ_ONLY_CONTEXT` | `enterSkateRoomHudBtn` (L16432-16437) | Inspected to verify event binding patterns. Zero Three.js porting or scene graph coupling is permitted per Spec 042 Architectural Invariant. |
| [`skate3_cleanroom/index.html`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/index.html) | `READ_ONLY_CONTEXT` | `#splash` (L34-65, L106-118), `#overlay` (L67-78, L120-127), `#mapbar` (L79-97, L129-139), `#return-alley-btn` (L130), `#fullscreen` (L138) | Primary architectural clean-room precedent for dark HTML shell, click-to-launch splash screen, smooth loading progress bar, and bottom-right HUD bar (`← 3D Portfolio (Alley)` and `Fullscreen`). |
| [`skate3_cleanroom/loader.js`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/loader.js) | `READ_ONLY_CONTEXT` | `audioContexts`, `unlockAudio` (L21-41), `openCache` (L247-251), `resolveServerTunnelBaseUrl` (L255-282), `fetchSinglePartWithFailover` (L311-328), `fetchParts` (L330-340) | Proven implementation patterns for Web Audio Proxy constructor interception, `CacheStorage` caching, multi-part chunk reassembly via `ReadableStream`, and `tunnel.json` remote failover. |
| [`skate3_cleanroom/pack.json`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/pack.json) | `READ_ONLY_CONTEXT` | `version`, `engine.parts`, `engine.size`, `core.parts`, `hash` (L1-67) | Precedent manifest schema for multi-part binary staging and byte integrity validation. |
| [`skate3_cleanroom/manifest.webmanifest`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/manifest.webmanifest) | `READ_ONLY_CONTEXT` | Web app manifest configuration | PWA shell metadata reference. |
| [`skate3_cleanroom/touch.js`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/touch.js) | `READ_ONLY_CONTEXT` | Touch input handling | Reference for mobile / touch pointer events. |
| [`skate3_cleanroom/skate3rust.js`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/skate3rust.js) | `READ_ONLY_CONTEXT` | Wasm glue code | Reference for wasm loading boundary. |
| [`tunnel.json`](file:///Users/diesel/Desktop/SkateAlley/tunnel.json) | `READ_ONLY_CONTEXT` | `url: "https://oriented-radiation-shown-revenue.trycloudflare.com"` | Active remote origin configuration for Server Mac `egg@10.0.0.62` failover when running on static hosts. Probed and confirmed live (`HTTP/2 200`). |

---

## 3. Candidate External Datasource & Schema Audit Register

All candidate endpoints and repositories were probed and audited with live read-only requests. Exact byte counts and SHA-256 digests were computed from downloaded artifacts.

### 3.1 Upstream Meta-Repository: `nzp-team/nzportable`
- **Reconnaissance URLs:**
  - `https://raw.githubusercontent.com/nzp-team/nzportable/main/README.md` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzportable/main/generate-nightly.sh` (`HTTP/2 200 OK`)
- **Captured Artifacts:**
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-nzportable-README.md`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-nzportable-README.md) (3,433 B, SHA-256: `cd334baa2e8e599a68144a532af046fbeea50e3dc04c1d1e9980667d7d0e4b7e`)
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-nzportable-generate-nightly.sh`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-nzportable-generate-nightly.sh) (9,083 B, SHA-256: `4ec4c31a7d79bea8180fab65ac991401f13a0aead126f250d4ddb96c491343ea`)
- **Verified Architectural Structure:**
  - Engine: FTEQW WebGL sourceport (`nzp-team/fteqw`, hosted at `https://nzp.gay`).
  - QuakeC Game Logic: `standard-nzp-qc` compiled into `nzp/progs.pk3` (containing `csprogs.dat`, `menu.dat`, `qwprogs.dat`, `csprogs.lno`).
  - Assets: `pc-nzp-assets` compiled into `nzp/game.pk3` (containing maps e.g. `ndu.bsp`, models, sounds).

### 3.2 Authoritative WebGL Build Repository: `nzp-team/nzp-team.github.io`
- **Reconnaissance URLs & API Endpoints:**
  - `https://api.github.com/repos/nzp-team/nzp-team.github.io/contents` (`HTTP/2 200 OK`)
  - `https://api.github.com/repos/nzp-team/nzp-team.github.io/contents/nzp` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/default.fmf` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/index.html` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.js` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.wasm` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/progs.pk3` (`HTTP/2 200 OK`)
  - `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/game.pk3` (`HTTP/2 200 OK`)
- **Captured Artifacts & Verified Schemas:**
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-github-io-contents.json`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-github-io-contents.json) (8,756 B, SHA-256: `b10e3ccda09c3fc631fd351b55885497ba73a4fc34bc4fa3799cf3ddbf5b8028`): Official GitHub Contents API schema listing root files (`default.fmf`, `ftewebgl.js`, `ftewebgl.wasm`, `index.html`, `nzportable.ico`).
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-github-io-nzp-contents.json`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-github-io-nzp-contents.json) (1,838 B, SHA-256: `293dce328527d90db4f4d760efeb9fb5c3858478fe1d6df7481a8309a138e975`): Official GitHub Contents API schema listing `nzp/` files (`game.pk3` size: 94,276,834; `progs.pk3` size: 491,379).
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-upstream-default.fmf`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-upstream-default.fmf) (96 B, SHA-256: `d3e89c92ff2b43b83e4a461a79b7986e3fd7ca3126ec1842588a688c539b3979`): FTEQW engine configuration (`game nzp`, `name "Nazi Zombies Portable"`, `basegame nzp`, `mainconfig "nzportable.cfg"`, `disablehomedir 1`).
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-upstream-index.html`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-upstream-index.html) (7,239 B, SHA-256: `dedaa120a171eb571e7826112749bf6e542ce8d80fe4d4f19ae0bd19d382a9b1`): Demonstrates the stock `Module` definition, status regex, and file dropper.
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-upstream-ftewebgl.js`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-upstream-ftewebgl.js) (165,608 B, SHA-256: `7ae5352b39e21c5dc83dd2c27d0f49f842ce89462402400775ccb055a2d9da46`): Emscripten JS runtime.
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-upstream-ftewebgl.wasm`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-upstream-ftewebgl.wasm) (5,178,106 B, SHA-256: `523141c46f2898fe1f4bb175eca6035ff8aed981e8f770993f98d15d7a2199e2`): Compiled FTEQW WebAssembly binary.
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-upstream-progs.pk3`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-upstream-progs.pk3) (491,379 B, SHA-256: `47bc82fa1335f5748ac08372c2daf24c57f29e56f046ad0fa125eec90c9bf832`): QuakeC bytecode archive containing `csprogs.dat` (710,614 B uncompressed), `menu.dat` (503,170 B), `qwprogs.dat` (844,430 B), and `csprogs.lno` (67,396 B).
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-nzportable.ico`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-nzportable.ico) (12,862 B, SHA-256: `e06c7e3f9479b1df0bb2ec0cb66ae8cfbe929a2444ee035c9a41ff5194916a24`): Official game icon.
  - [`assets/20261024T185706-137-m9j7/plan-scan-2-game-pk3-headers.txt`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/plan-scan-2-game-pk3-headers.txt) (901 B, SHA-256: `61b85da4136b3677f597b74f1306c7f74b6f2c6eabbb9e7d534cf65a9fdf0c94`): Live HTTP response headers verifying `content-length: 94276834`, `accept-ranges: bytes`, `etag: "54332e520638ab74224d043e169e92b15a2e657ebba342891d2f2b55790fb893"`, `access-control-allow-origin: *`, and `cross-origin-resource-policy: cross-origin`. Slicing probe verified standard ZIP magic `PK\x03\x04` (`504b 0304`).

### 3.3 Emscripten & FTEQW Execution Contract Verification
Static audit of `plan-scan-2-upstream-ftewebgl.js` line 1 revealed the exact virtual filesystem ingestion logic:
1. **`Module.files` Resolution:**
   ```javascript
   if (typeof ab == "string") {
       addRunDependency(n);
       let xhr = new XMLHttpRequest;
       xhr.open("GET", ab);
       ...
   } else if (typeof ab.then == "function") {
       addRunDependency(n);
       ab.then(value => { ... removeRunDependency(n); });
   } else {
       let b = FTEH.h[_emscriptenfte_buf_createfromarraybuf(ab)];
       b.n = n;
       FTEH.f[b.n] = b;
   }
   ```
   **Key Finding:** When `ab` is an instantiated `ArrayBuffer`, FTEQW calls `_emscriptenfte_buf_createfromarraybuf(ab)` synchronously and stores it into `FTEH.f[n]` without firing any XHR download or incrementing Emscripten run dependencies. This proves that pre-populating `Module.files` with resolved `ArrayBuffer` instances completely avoids internal duplicate network requests.
2. **`Module.sched` Verification:**
   Inside `_emscriptenfte_setupmainloop`:
   ```javascript
   Module["sched"] = FTEC.step;
   ```
   `Module["sched"]` is set to `FTEC.step` when the main loop scheduler is active. Checking `Module["sched"] !== undefined` in `Module.postRun` provides an absolute, deterministic test that the engine reached an operational state.
3. **Canvas Mouse Calibration:**
   `#canvas` requires `border: 0px none; width: 100%; height: 100%; padding: 0; margin: 0; display: block;` so that FTEQW pointer lock and mouse coordinate mapping match window pixels 1:1.

---

## 4. Explicit Deficiency & Systemic Obstacle Register

| Deficient / Obstructing Component | Nature of Gap | Root Cause & Systemic Obstacle | Recommended Remediation (`MANDATORY_TARGET`) |
| :--- | :--- | :--- | :--- |
| [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | Missing MIME types | `CUSTOM_MIME_TYPES` lacks `.pk3`, `.fmf`, and `.part00`..`.part99`. Python's `os.path.splitext('game.pk3.part00')` returns `.part00`, which causes the server to return default MIME type or fail. | Add `.pk3`, `.fmf`, and `.part00`..`.part99` (or regex matching `.part\d+$`) mapping to `application/octet-stream`. |
| [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | Incomplete `/api/health` | `_serve_health` only reports static portfolio and skate3 components without checking `/nzportable/` assets. | Add filesystem check for `/nzportable/index.html`, `/nzportable/ftewebgl.wasm`, and `/nzportable/nzp/progs.pk3`, returning `"nzportable_webapp": true` in JSON response. |
| [`.gitignore`](file:///Users/diesel/Desktop/SkateAlley/.gitignore) | Missing Git exclusion rule | `nzportable/nzp/game.pk3` (94,276,834 B) is not listed in `.gitignore`. Directly committing it would violate GitHub's $\le 35\text{ MB}$ single-file limit. | Add `nzportable/nzp/game.pk3` to `.gitignore`, ensuring split chunks `parts/game.pk3.part00..02` ($\le 35\text{ MB}$ each) remain tracked. |
| [`index.html`](file:///Users/diesel/Desktop/SkateAlley/index.html) | Missing navigation link | No UI mechanism exists in the 3D portfolio to open `/nzportable/`. | Add a styled launcher button/link (`NZ: Portable (Zombies)`) to `./nzportable/` in `#sandbox-hud-body` next to `#hud-enter-skateroom-btn`. |
| `/nzportable/` directory | Missing web application route | The `/nzportable/` directory does not yet exist in the repository. | Provision standalone webapp shell (`index.html`, `loader.js`, `pack.json`, `default.fmf`, `ftewebgl.js`, `ftewebgl.wasm`, `nzp/progs.pk3`, `nzp/game.pk3`, `parts/game.pk3.part00..02`). |

---

## 5. Sufficiency & Scan Certification

- **Dependency Cone Exhaustiveness:** Every relevant internal codebase component touching server routing, git ignore policies, portfolio HUD navigation, and clean-room precedents has been cataloged with line numbers and verbatim symbols.
- **Empirical Grounding:** All external endpoints were verified live via HTTP/2 probes, returning `HTTP 200 OK`. Reference artifacts, schemas, headers, and hashes were downloaded into `assets/20261024T185706-137-m9j7/plan-scan-2-*`.
- **Zero Hallucination:** All byte sizes (`default.fmf` = 96 B, `progs.pk3` = 491,379 B, `game.pk3` = 94,276,834 B, `ftewebgl.js` = 165,608 B, `ftewebgl.wasm` = 5,178,106 B) and runtime properties (`Module.files`, `Module.sched`) match observed data.

---

## 6. Handoff Manifest Affirmation

The dedicated role handoff manifest at [`handoff/20261024T185706-137-m9j7/plan-scan-2.txt`](file:///Users/diesel/Desktop/SkateAlley/handoff/20261024T185706-137-m9j7/plan-scan-2.txt) is atomically overwritten with:
- All identified and reviewed codebase component files.
- The scan report path [`wayfinder/20261024T185706-137-m9j7/plan-scan-2-report.md`](file:///Users/diesel/Desktop/SkateAlley/wayfinder/20261024T185706-137-m9j7/plan-scan-2-report.md).
- All downloaded external files, schemas, and assets in [`assets/20261024T185706-137-m9j7/plan-scan-2-*`](file:///Users/diesel/Desktop/SkateAlley/assets/20261024T185706-137-m9j7/).

---

## 7. Coding Gate Affirmation

**DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.**
