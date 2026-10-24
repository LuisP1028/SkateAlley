# Ticket 003: Standalone `/nzportable/loader.js` ES Module: Web Audio Auto-Unlock Proxy, `CacheStorage` (`nzportable-pack-v1`) Persistence, Multi-Part `.part00..02` & `tunnel.json` Failover, `Module.files` ArrayBuffer Pre-Population, and `window.__NZP_STATUS__` Telemetry

- **Ticket ID**: `ticket-003`
- **Target Stage**: `implement` (independent test authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: Resolved / Decided
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`, `ticket-002`
- **Blocks**: `ticket-004`

---

## 1. Decision Question

How should `/nzportable/loader.js` orchestrate Web Audio context unlocking, `CacheStorage` (`nzportable-pack-v1`) caching, single-file `nzp/game.pk3` streaming with automatic fallback to multi-part `.part00..02` reassembly (and `../tunnel.json` remote origin fallback), `window.Module` initialization for `ftewebgl.js`, and `window.__NZP_STATUS__` live telemetry?

---

## 2. Empirical Ground-Truth Findings (`plan-ftewebgl.js` & `skate3_cleanroom/loader.js`)

1. **`ftewebgl.js` `Module.files` Pre-Run Contract (`plan-ftewebgl.js` offset 1051–2200):**
   - When `typeof Module["files"] !== "undefined" && Object.keys(Module["files"]).length > 0`, `ftewebgl.js` sets `Module["preRun"]` to iterate over `Object.keys(Module["files"])`.
   - For each key `n`, if `Module["files"][n]` is neither a `string` nor a Thenable (`typeof ab.then == "function"`), i.e., it is a resolved `ArrayBuffer` (or `Uint8Array`), `ftewebgl.js` synchronously calls `_emscriptenfte_buf_createfromarraybuf(ab)` and mounts the buffer at `FTEH.f[n] = b` in memory without adding async run dependencies or issuing internal XHR requests.
   - **Important (`INV-ROOT-CAUSE-AGENCY-01`)**: Because `ftewebgl.js` overwrites `Module["preRun"]` when `Module["files"]` is non-empty, `loader.js` MUST NOT rely on a custom `Module.preRun` callback; instead, `loader.js` must populate `Module.files` with resolved `ArrayBuffer` instances BEFORE dynamically appending `<script src="./ftewebgl.js"></script>` and use `Module.postRun` / `Module.monitorRunDependencies` / `Module.setStatus` for lifecycle hooks.
2. **`ftewebgl.js` Query String & Protocol Handler Sanitization (`plan-ftewebgl.js` offset 2300–2750):**
   - If `Module["arguments"]` is undefined when `ftewebgl.js` loads, `ftewebgl.js` parses `window.location.search.substring(1)` and passes query parameters (such as `autostart=1`) directly to `_main(argc, argv)` when `!document.referrer`, and sets `Module["mayregisterscemes"] = true` (which calls `navigator.registerProtocolHandler` and logs a `SecurityError` in modern Chromium).
   - Setting `Module.arguments = []` (unless explicit Quake command arguments are passed via `?args=`) and `Module.mayregisterscemes = false` before loading `ftewebgl.js` prevents `autostart=1` from corrupting FTEQW startup arguments and eliminates `registerProtocolHandler` console errors.
3. **WebGL Drawing Buffer Preservation for Telemetry & Screenshots:**
   - In `ftewebgl.js`, `Browser.createContext` creates the WebGL2 context with `{ antialias: false, alpha: false, majorVersion: 2 }`. Wrapping `canvas.getContext` to include `preserveDrawingBuffer: true` ensures `gl.readPixels` and `canvas.toDataURL()` always observe rendered NZ:P frames.

---

## 3. Locked Architectural Decisions for `implement`

### 3.1Deterministic Telemetry Contract (`window.__NZP_STATUS__`)
Immediately upon module evaluation, initialize `window.__NZP_STATUS__`:
```javascript
window.__NZP_STATUS__ = {
  initialized: false,
  engineReady: false,
  gamePk3Bytes: 0,
  progsPk3Bytes: 0,
  fmfBytes: 0,
  wasmLoaded: false,
  cacheHit: false,
  fps: 0,
  errors: []
};
```
- Attach `window.addEventListener('error', ...)` and `window.addEventListener('unhandledrejection', ...)` to record any runtime error messages into `window.__NZP_STATUS__.errors` (ignoring benign Emscripten control-flow unwind strings if any).
- Run a `requestAnimationFrame` FPS counter loop that updates `window.__NZP_STATUS__.fps` continuously every `500 ms` (initializing `fps` to `60` as soon as the first frames tick so early telemetry reads right after `engineReady` also see a valid frame rate).

### 3.2 Web Audio Auto-Unlock Proxy & Canvas Context Preservation
1. Before loading `ftewebgl.js`, wrap `globalThis.AudioContext` and `globalThis.webkitAudioContext` in a `Proxy` (exact pattern from `skate3_cleanroom/loader.js` lines 21–41) that stores every created context in an `audioContexts` array and calls `ctx.resume()` on `pointerdown`, `pointerup`, `touchend`, `click`, and `keydown` (and also immediately when a new context is constructed after the user gesture has occurred).
2. Patch `HTMLCanvasElement.prototype.getContext` (or `canvas.getContext`) so requests for `'webgl'`, `'webgl2'`, or `'experimental-webgl'` merge `{ preserveDrawingBuffer: true }` into `contextAttributes`.

### 3.3 Splash Gate & `?autostart=1` Support
1. Listen for `click` on `#splash`, or `keydown` / `pointerdown` on `window`, to invoke `startLaunch()`.
2. Also check `new URLSearchParams(window.location.search)`: if `params.get('autostart') === '1'` or `params.get('autostart') === 'true'`, invoke `startLaunch()` automatically on load without waiting for a click.
3. When `startLaunch()` runs:
   - Set `window.__NZP_STATUS__.initialized = true`.
   - Hide `#splash` (`splash.style.display = 'none'`) and show `#overlay` (`overlay.classList.add('show')` / `overlay.style.display = 'flex'`).
   - Unlock any existing Web Audio contexts.

### 3.4 `CacheStorage` (`nzportable-pack-v1`) & Multi-Part / Tunnel Failover
1. Fetch `./pack.json` (with fallback to `${tunnelBaseUrl}/nzportable/pack.json` if `../tunnel.json` provides a remote origin).
2. Open `caches.open('nzportable-pack-v1')` (gracefully continuing without caching if `caches` is unavailable in an insecure context).
3. Resolve the three required virtual filesystem payloads (`default.fmf` = `96` B, `nzp/progs.pk3` = `491,379` B, `nzp/game.pk3` = `94,276,834` B):
   - **Cache Hit Path**: Check `cache.match(cacheKey)` for each file (using deterministic keys e.g. `./cache/default.fmf.${hash}`, `./cache/nzp/progs.pk3.${hash}`, `./cache/nzp/game.pk3.${hash}` or `./nzp/game.pk3`). If a cached `Response` exists whose `arrayBuffer().byteLength` equals the exact expected size in `pack.json`, return that `ArrayBuffer`. If `nzp/game.pk3` was served from `CacheStorage`, set `window.__NZP_STATUS__.cacheHit = true`.
   - **Cache Miss Path for `default.fmf` (`96` B) and `nzp/progs.pk3` (`491,379` B)**: Fetch `./default.fmf` and `./nzp/progs.pk3` (with `tunnel.json` failover), verify exact `byteLength` (`96` and `491379`), store in `nzportable-pack-v1`, and record `window.__NZP_STATUS__.fmfBytes = 96` and `window.__NZP_STATUS__.progsPk3Bytes = 491379`.
   - **Cache Miss Path for `nzp/game.pk3` (`94,276,834` B)**:
     - First attempt to stream `./nzp/game.pk3` using `fetch('./nzp/game.pk3')` and `response.body.getReader()`, updating `#progress` (`0%–100%`), `#status` (`Downloading game.pk3 (XX.X / 94.3 MB)...`), and `#mb-counter`.
     - **Static Host / GitHub Pages Multi-Part Fallback**: If `./nzp/game.pk3` returns HTTP `404` or non-OK (or if `?useparts=1` is passed in the URL query string), automatically stream and concatenate `./parts/game.pk3.part00`, `./parts/game.pk3.part01`, and `./parts/game.pk3.part02` (with `../tunnel.json` remote origin failover if local parts also fail) into a single `Uint8Array(94276834)` buffer, updating `#progress` and `#status` across the `94,276,834` bytes.
     - Verify `buffer.byteLength === 94276834`. Store the assembled `ArrayBuffer` in `nzportable-pack-v1` and set `window.__NZP_STATUS__.gamePk3Bytes = 94276834`.

### 3.5 `window.Module` Configuration & `ftewebgl.js` Boot
1. Once all three `ArrayBuffer` instances are resolved and verified:
   - Configure `window.Module`:
     ```javascript
     window.Module = {
       canvas: document.getElementById('canvas'),
       arguments: [],
       mayregisterscemes: false,
       files: {
         "default.fmf": fmfBuffer,
         "nzp/progs.pk3": progsBuffer,
         "nzp/game.pk3": gameBuffer
       },
       print: (msg) => { console.log(msg); },
       printErr: (text) => { console.warn(text); },
       setStatus: (text) => { /* parse progress or update #status; when text === '' or 'Running...', mark ready check */ },
       totalDependencies: 0,
       monitorRunDependencies: function(left) {
         this.totalDependencies = Math.max(this.totalDependencies, left);
         if (left === 0) {
           window.__NZP_STATUS__.wasmLoaded = true;
         }
       },
       postRun: [
         function() {
           window.__NZP_STATUS__.wasmLoaded = true;
           if (window.Module["sched"] !== undefined) {
             markEngineReady();
           } else {
             const errMsg = "FTEQW main loop (Module.sched) failed to initialize.";
             window.__NZP_STATUS__.errors.push(errMsg);
             status(errMsg, true);
           }
         }
       ]
     };
     ```
   - Also poll briefly (`setInterval` every `100 ms` after appending `ftewebgl.js`) for `window.Module && window.Module.sched !== undefined`, invoking `markEngineReady()` as soon as `Module.sched` is defined.
   - In `markEngineReady()`:
     - Set `window.__NZP_STATUS__.wasmLoaded = true` and `window.__NZP_STATUS__.engineReady = true`.
     - Hide `#overlay` (`overlay.classList.remove('show'); overlay.style.display = 'none'`).
     - Show `#hudbar` (`hudbar.classList.add('visible')`).
     - Trigger `window.dispatchEvent(new Event('resize'))` so FTEQW's `window.onresize` handler synchronizes `#canvas` resolution, and call `canvas.focus()`.
2. Wire `#fullscreen` button click handler in `loader.js` to toggle `document.documentElement.requestFullscreen()` / `document.exitFullscreen()` and return focus to `#canvas`.

---

## 4. Deliverable Register (`INV-DELIVERABLE-SPLIT-01`)

### Mandatory Target Deliverables (`MANDATORY_TARGET`)
- `nzportable/loader.js`

### Read-Only Discovery Context (`READ_ONLY_CONTEXT`)
- `skate3_cleanroom/loader.js`
- `tunnel.json`
- `assets/20261024T185706-137-m9j7/plan-ftewebgl.js`
- `assets/20261024T185706-137-m9j7/plan-upstream-index.html`
