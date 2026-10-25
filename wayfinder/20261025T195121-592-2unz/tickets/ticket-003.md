# Ticket 003: Standalone WebApp Shell (`tkdr/index.html` & `tkdr/tkdr.html`): Zero-Friction Local Stream Auto-Start, EBOOT Fallback, Web Audio Unlock & `window.__TKDR_STATUS__` Telemetry

- **Ticket ID**: `ticket-003`
- **Title**: Standalone WebApp Shell (`tkdr/index.html` & `tkdr/tkdr.html`): Zero-Friction Local Stream Auto-Start, EBOOT Fallback, Web Audio Unlock & `window.__TKDR_STATUS__` Telemetry
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`, `ticket-002`
- **Blocks**: `ticket-004`

## 1. Decision Question

How should `tkdr/index.html` and `tkdr/tkdr.html` be structured so that opening `/tkdr/` (or `/tkdr/tkdr.html`) automatically discovers local `./game.iso` (`HTTP 206` byte-range streaming) and `./eboot.bin` (`HTTP 200`), recompiles the `13,809` guest MIPS functions into WebAssembly in the background Worker (or loads from IndexedDB), boots directly into *Tekken: Dark Resurrection* without manual file selection, unlocks Web Audio on user interaction, supplies `./eboot.bin` as a fallback if an ISO-only file is dropped, and exposes deterministic runtime telemetry on `window.__TKDR_STATUS__`?

## 2. Authoritative Architectural Decision

### 2.1 Base Shell & Strict Standalone Isolation
- Both `tkdr/index.html` and `tkdr/tkdr.html` must be created with identical content based on `runtime/web/shell.html` (`deploy:site/tkdr.html`, captured in `assets/20261025T195121-592-2unz/plan-upstream-shell-reference.html`), with `var DYNAMIC = true;` and `<script async src="tkdr.js"></script>` before `</body>`.
- **Strict Standalone Invariant**: Neither root `index.html` nor `sandbox.js` may be modified. All *Tekken: Dark Resurrection* execution is self-contained inside `/tkdr/`.

### 2.2 Observable Telemetry Contract (`window.__TKDR_STATUS__`)
Initialize `window.__TKDR_STATUS__` immediately at the start of the main `<script>` block:
```javascript
var tkdrStatus = window.__TKDR_STATUS__ = {
  crossOriginIsolated: Boolean(window.crossOriginIsolated),
  runtimeReady: false,
  isoReady: false,
  ebootSha1: "",
  recompiledFunctions: 0,
  wasmCodeBytes: 0,
  started: false,
  frames: 0,
  guestTimeSec: 0,
  errors: []
};
function recordTkdrError(msg) {
  var text = String(msg && msg.message || msg);
  if (tkdrStatus.errors.indexOf(text) === -1) tkdrStatus.errors.push(text);
  statusEl.textContent = text;
}
function syncTkdrTelemetry() {
  tkdrStatus.crossOriginIsolated = Boolean(window.crossOriginIsolated);
  tkdrStatus.runtimeReady = Boolean(ready.runtime);
  tkdrStatus.isoReady = Boolean(ready.iso);
  tkdrStatus.started = Boolean(started);
  if (started && typeof Module._web_frames === 'function') {
    try { tkdrStatus.frames = Module._web_frames() >>> 0; } catch (_) {}
  }
  if (started && typeof Module._web_time === 'function') {
    try { tkdrStatus.guestTimeSec = Number(Module._web_time()) || 0; } catch (_) {}
  }
}
setInterval(syncTkdrTelemetry, 50);
```

### 2.3 Cross-Origin Isolation (`COOP`/`COEP`) Fail-Fast Diagnostic (Spec §6.3)
Immediately after initializing `window.__TKDR_STATUS__`, verify `window.crossOriginIsolated`:
```javascript
if (!window.crossOriginIsolated) {
  recordTkdrError('Cross-Origin Isolation (COOP/COEP) is required for SharedArrayBuffer pthreads');
}
```

### 2.4 Recompiler & Startup Telemetry Wiring (`prepareGame`, `tryStart`, `go`, `useDisc`)
1. In `Module.onRuntimeInitialized`:
   ```javascript
   Module.onRuntimeInitialized = function () {
     ready.runtime = true;
     tkdrStatus.runtimeReady = true;
     tryStart();
   };
   ```
2. In `useDisc(disc)`:
   ```javascript
   function useDisc(disc) {
     Module.discRead = disc.read;
     ready.iso = true;
     tkdrStatus.isoReady = true;
     tryStart();
   }
   ```
3. In `prepareGame(bytes)`:
   - Compute `var hash = await rc.sha1(bytes);`.
   - If `hash !== rc.EBOOT_SHA1`: call `recordTkdrError('This is not the decrypted EBOOT of ULUS-10139 v1.00 (sha1 ' + hash + ').'); return;`.
   - Set `tkdrStatus.ebootSha1 = hash;` (`"b9a0e3292738a833f4f8077e3959c3a0652c42cd"`).
   - After loading `game` from IndexedDB (`cached`) or the Worker (`./recomp/worker.mjs`), set:
     ```javascript
     tkdrStatus.recompiledFunctions = Number(game.functions) || 13809;
     tkdrStatus.wasmCodeBytes = game.code ? game.code.byteLength : 0;
     ready.game = true;
     tryStart();
     ```
   - Wrap Worker errors in `try / catch (err)` calling `recordTkdrError(err)`.
4. In `tryStart()` and `go()`:
   - On `WebAssembly.compile(game.code)` failure: call `recordTkdrError('compile failed: ' + e)`.
   - In `go()`:
     ```javascript
     function go() {
       startPlay();
       tkdrStatus.started = true;
       Module.canvas.focus();
       Module.callMain([]);
       syncTkdrTelemetry();
     }
     ```

### 2.5 Auto-Start Local Stream Discovery & Zero-Friction Boot (Spec §3.3 & §4.2.3)
- When `?iso=` is explicitly provided in query parameters:
  - Set `Module.isoUrl = params.get('iso'); ready.iso = true; tkdrStatus.isoReady = true;`.
- When `?eboot=` is explicitly provided in query parameters:
  - Fetch `params.get('eboot')` and pass `new Uint8Array(b)` to `prepareGame(...)`.
- When `?iso=` or `?eboot=` is NOT explicitly provided, automatically probe the local server before falling back to `savedFiles()` / `config.json` / `#pick`:
  ```javascript
  async function probeLocalServerAssets() {
    try {
      var needIso = !ready.iso;
      var needEboot = DYNAMIC && !params.get('eboot');
      var isoOk = !needIso;
      var ebootOk = !needEboot;
      if (needIso) {
        var isoProbe = await fetch('./game.iso', { headers: { Range: 'bytes=0-0' }, cache: 'no-store' });
        if (isoProbe.status === 206) {
          isoOk = true;
          if (isoProbe.body && isoProbe.body.cancel) isoProbe.body.cancel().catch(function () {});
        }
      }
      if (needEboot) {
        var ebProbe = await fetch('./eboot.bin', { method: 'HEAD', cache: 'no-store' });
        if (ebProbe.ok) ebootOk = true;
      }
      if (isoOk && ebootOk) {
        document.getElementById('pick').style.display = 'none';
        document.getElementById('server').style.display = 'none';
        document.getElementById('resume').style.display = 'none';
        if (needIso) {
          Module.isoUrl = './game.iso';
          ready.iso = true;
          tkdrStatus.isoReady = true;
        }
        if (needEboot) {
          statusEl.textContent = 'loading decrypted EBOOT…';
          var ebResp = await fetch('./eboot.bin', { cache: 'no-store' });
          if (!ebResp.ok) throw new Error('Failed to fetch ./eboot.bin: HTTP ' + ebResp.status);
          var ebBuf = await ebResp.arrayBuffer();
          await prepareGame(new Uint8Array(ebBuf));
        }
        tryStart();
        return true;
      }
    } catch (err) {
      console.warn('Local stream auto-probe fallback:', err);
    }
    return false;
  }
  ```
- Only if `probeLocalServerAssets()` resolves to `false` does the page display `#resume` (from `savedFiles()`), `#server` (from `config.json`), or `#pick`.

### 2.6 Local `./eboot.bin` Fallback for ISO-Only Manual Drops (Spec §6.1)
In `handleFiles(list)`, after checking `sorted.ebootCandidates`:
```javascript
if (!eboot) {
  try {
    var fallbackResp = await fetch('./eboot.bin', { cache: 'no-store' });
    if (fallbackResp.ok) {
      var fallbackBytes = new Uint8Array(await fallbackResp.arrayBuffer());
      if ((await rc.sha1(fallbackBytes)) === rc.EBOOT_SHA1) eboot = fallbackBytes;
    }
  } catch (_) {}
}
```
This guarantees that dropping the user's raw ISO-only `.zip` or `.iso` onto `#pick` succeeds seamlessly when `./eboot.bin` is hosted on the server.

### 2.7 Web Audio Auto-Unlock on User Gesture (Spec §4.2.4)
Track all constructed `AudioContext` / `webkitAudioContext` instances and resume them on `pointerdown`, `click`, `keydown`, and `touchstart`:
```javascript
(function () {
  var trackedAudioContexts = [];
  ['AudioContext', 'webkitAudioContext'].forEach(function (name) {
    var Orig = window[name];
    if (typeof Orig !== 'function') return;
    function WrappedAudioContext(opts) {
      var ctx = opts !== undefined ? new Orig(opts) : new Orig();
      trackedAudioContexts.push(ctx);
      return ctx;
    }
    WrappedAudioContext.prototype = Orig.prototype;
    window[name] = WrappedAudioContext;
  });
  function unlockAudio() {
    if (Module && Module.SDL2 && Module.SDL2.audioContext && trackedAudioContexts.indexOf(Module.SDL2.audioContext) === -1) {
      trackedAudioContexts.push(Module.SDL2.audioContext);
    }
    for (var i = 0; i < trackedAudioContexts.length; i++) {
      var ctx = trackedAudioContexts[i];
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(function () {});
      }
    }
  }
  ['pointerdown', 'click', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, unlockAudio, { capture: true, passive: true });
  });
})();
```

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `tkdr/index.html`
- `tkdr/tkdr.html`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_057.md`
- `index.html` (strictly read-only; zero Three.js Alley modifications)
- `sandbox.js` (strictly read-only; zero Three.js Alley modifications)
- `assets/20261025T195121-592-2unz/plan-upstream-shell-reference.html`
- `assets/20261025T195121-592-2unz/plan-tkdr-runtime-and-crypto-manifest.json`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `tkdr/index.html` and `tkdr/tkdr.html` exist and are byte-identical.
- Verify in Playwright Chromium that navigating to `http://localhost:3002/tkdr/` (with zero query parameters and zero manual file selection) automatically sets `window.crossOriginIsolated === true`, `window.__TKDR_STATUS__.ebootSha1 === "b9a0e3292738a833f4f8077e3959c3a0652c42cd"`, `window.__TKDR_STATUS__.recompiledFunctions === 13809`, `window.__TKDR_STATUS__.wasmCodeBytes === 23544922`, `window.__TKDR_STATUS__.started === true`, `document.body.classList.contains("started") === true`, `Module._web_frames() > 60`, `Module._web_time() > 1.0`, and `window.__TKDR_STATUS__.errors.length === 0`.
