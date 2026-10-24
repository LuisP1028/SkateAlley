# Ticket 004: `/revcdos/game.js` Launcher Architecture: Full-Game Auto-Unlock, `CacheStorage` (`revcdos-pack-v1`) & Multi-Part `.data` Loader, Lowercase `replaceFetch`, `?autostart=1`, and `window.__REVCDOS_STATUS__`

- **Ticket ID**: `ticket-004`
- **Title**: `/revcdos/game.js` Launcher Architecture: Full-Game Auto-Unlock, `CacheStorage` (`revcdos-pack-v1`) & Multi-Part `.data` Loader, Lowercase `replaceFetch`, `?autostart=1`, and `window.__REVCDOS_STATUS__`
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`, `ticket-002`, `ticket-003`
- **Blocks**: `ticket-005`

## 1. Decision Question

How must `/revcdos/game.js` be architected so that:
1. Full-game mode is automatically unlocked on page load without triggering `#demo-off-disclaimer` or the `#original-game-file` upload dialog;
2. `loadData()` caches and validates the `135,355,111`-byte `vcbr/vc-sky-en-v6.data` package in `CacheStorage` (`revcdos-pack-v1`), seamlessly falling back to concatenating `./parts/vc-sky-en-v6.data.part00..03` (or fetching via `../tunnel.json`) when the unsplit `.data` file is unavailable on static hosts;
3. `replaceFetch(str)` rewrites upstream `vcsky/` URLs to local lowercase paths;
4. `?autostart=1`, WebGL2 `preserveDrawingBuffer: true`, Web Audio auto-unlock, and non-blocking navigation back to `../` work reliably; and
5. `window.__REVCDOS_STATUS__` exposes deterministic runtime telemetry?

## 2. Authoritative Architectural Decision

### 2.1 Deterministic Telemetry Contract (`window.__REVCDOS_STATUS__`)
Initialize `window.__REVCDOS_STATUS__` at the top of `/revcdos/game.js` before any DOM or ownership checks:
```javascript
window.__REVCDOS_STATUS__ = {
  haveOriginalGame: false,
  dataLoadedBytes: 0,
  wasmReady: false,
  mainCalled: false,
  fetchedAssetsCount: 0,
  failedFetchesCount: 0,
  lastFetchedUrl: null,
  lastError: null,
  cacheHit: false,
};
```

### 2.2 Pre-Enabled Full-Game Mode & Ownership Gate Remediation
- Before evaluating ownership, execute:
  ```javascript
  if (params.get('request_original_game') !== '1') {
    try {
      localStorage.setItem('vcsky.haveOriginalGame', 'true');
    } catch (e) {}
  }
  ```
- In `ownerShipConfirmed()`:
  - Set `haveOriginalGame = true;` and `window.__REVCDOS_STATUS__.haveOriginalGame = true;`.
  - Set `disclaimerCheckbox.checked = true;`.
  - Set `clickToPlayButton.textContent = t('clickToPlayFull');` (`"Click to play"`) and `clickToPlayButton.classList.remove('disabled');`.
  - Set `demoOffDisclaimer.textContent = "";` and `demoOffDisclaimer.hidden = true;`.
- In `ownerShipNotConfirmed()` (only reached if `?request_original_game=1` and user unchecks ownership):
  - Set `haveOriginalGame = false;` and `window.__REVCDOS_STATUS__.haveOriginalGame = false;`.
- Run `localStorage.getItem('vcsky.haveOriginalGame') === 'true' || params.get('request_original_game') !== '1' ? ownerShipConfirmed() : ownerShipNotConfirmed();` during initial script evaluation so `window.__REVCDOS_STATUS__.haveOriginalGame === true` immediately at page load.

### 2.3 Pre-Decompressed Binary Paths & Exact Byte Constants
- Set `const replaceBR = "vcbr/";` (relative to `/revcdos/`, never root-relative `/vcbr/`).
- Set `const EXPECTED_EN_DATA_SIZE = 135355111;` and `const EXPECTED_EN_WASM_SIZE = 7625877;`.
- Set `const dataSize = EXPECTED_EN_DATA_SIZE;` (fixing the upstream `130 * 1024 * 1024` approximation so progress reaches `100%` at `135,355,111` bytes).
- Configure `updateGameDataForLanguage(lang)`:
  - When `lang === 'ru'`: `data_content = "vcbr/vc-sky-ru-v6.data"; wasm_content = "vcbr/vc-sky-ru-v6.wasm";`
  - Default (`en`): `data_content = "vcbr/vc-sky-en-v6.data"; wasm_content = "vcbr/vc-sky-en-v6.wasm";` (never `.br`).

### 2.4 Normalized `replaceFetch(str)` with `.toLowerCase()` & Tunnel Failover
- Resolve optional tunnel origin from `?server=` / `?backend_url=` or `../tunnel.json` when running on a non-localhost static host (such as `*.github.io`).
- Implement `window.replaceFetch = replaceFetch` so `modules/fetch.js` can invoke it globally:
  1. Given input `str` (e.g. `"https://cdn.dos.zone/vcsky/fetched/AUDIO/WATER.MP3"` or `"vcsky/fetched/MODELS/GTA3.IMG/OD_COPIER.DFF"`):
  2. Extract the relative path after `vcsky/` (matching `/^https?:\/\/[^/]+\/vcsky\//i` or `/^\/?vcsky\//i`).
  3. Normalize the extracted relative path after `vcsky/` to `.toLowerCase()` (preserving any query string if present).
  4. Prepend the active `vcsky/` base prefix: `"vcsky/"` when served locally/same-origin, or `${resolvedTunnelOrigin}/revcdos/vcsky/` when running on a static host where `vcsky/` is served by the remote tunnel.
  5. For `sha256sums.txt` or any sub-path under `vcsky/`, `replaceFetch` always returns a guaranteed lowercase relative path (e.g., `"vcsky/fetched/audio/water.mp3"`).

### 2.5 Multi-Part Chunk & `CacheStorage` (`revcdos-pack-v1`) Loader (`loadData()`)
1. Open `CacheStorage` bucket `const CACHE_NAME = "revcdos-pack-v1";` via `caches.open(CACHE_NAME)`.
2. Check `await cache.match(data_content)` (and fallback key `./${data_content}`). If a cached `Response` exists, read `const ab = await cached.arrayBuffer()`. If `ab.byteLength === EXPECTED_EN_DATA_SIZE` (`135355111` for `en`), set `window.__REVCDOS_STATUS__.cacheHit = true`, `window.__REVCDOS_STATUS__.dataLoadedBytes = ab.byteLength`, update progress to 100%, and return `new Uint8Array(ab)`.
3. On cache miss (or if `?useparts=1` is passed):
   - First attempt streaming `data_content` (`vcbr/vc-sky-en-v6.data`) directly (unless `?useparts=1`), updating `setStatus("Downloading...(" + receivedLength + "/" + dataSize + ")")` and `window.__REVCDOS_STATUS__.dataLoadedBytes = receivedLength` as chunks arrive, and verifying `byteLength === EXPECTED_EN_DATA_SIZE`.
   - If direct fetch of `vcbr/vc-sky-en-v6.data` returns non-200 or fails (e.g., on static GitHub Pages where `vc-sky-en-v6.data` is git-ignored) or if `?useparts=1` is active:
     - Fetch `./pack.json` (or use the deterministic 4-part list `["./parts/vc-sky-en-v6.data.part00", "./parts/vc-sky-en-v6.data.part01", "./parts/vc-sky-en-v6.data.part02", "./parts/vc-sky-en-v6.data.part03"]`), stream and concatenate the 4 parts into a single `Uint8Array(135355111)` while updating `setStatus("Downloading...(" + offset + "/" + dataSize + ")")` and `#progress`, and if local parts fail, failover to `${resolvedTunnelOrigin}/revcdos/...`.
4. Verify `buffer.byteLength === EXPECTED_EN_DATA_SIZE` (`135355111`), store `new Response(buffer.slice(0), { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': '135355111' } })` in `revcdos-pack-v1`, set `window.__REVCDOS_STATUS__.dataLoadedBytes = buffer.byteLength`, and return `new Uint8Array(buffer)`.

### 2.6 WebGL2 Drawing Buffer Preservation, Web Audio Unlock, Intro Continuation & `?autostart=1`
- **WebGL2 `preserveDrawingBuffer: true`**: Wrap `canvas.getContext` on `#canvas` so `webgl` / `webgl2` context creation always sets `preserveDrawingBuffer: true`, allowing Playwright `gl.readPixels` / `canvas.toDataURL()` and screenshot checks to inspect rendered Vice City frames deterministically.
- **Web Audio Auto-Unlock**: Proxy `AudioContext` / `webkitAudioContext` and resume any suspended contexts on `pointerdown`, `click`, `keydown`, or `touchend`.
- **Navigation Safety (No Blocking `beforeunload`)**: Replace `window.onbeforeunload = function(event) { event.preventDefault(); return ''; }` with a non-blocking `pagehide` listener that calls `Module.syncRevcIni?.()` so clicking `← 3D Portfolio (Alley)` (`window.location.assign('../')`) never triggers a browser confirmation dialog block.
- **`startGame(e)` & `?autostart=1`**:
  - Clicking `.click-to-play` or `#click-to-play-button` calls `startGame(e)`. Wrap any `requestFullscreen` call in `try { ...?.catch?.(() => {}); } catch {}` and wrap `intro.play()` in `try { intro.play()?.catch?.(() => {}); } catch {}`.
  - Once `const dataBuffer = await loadData()` resolves, hide `#spinner`, call `setStatus(t("clickToContinue"))` (`"Click to continue..."`), and register an idempotent `continueToGame()` handler (`let gameLaunched = false`) on `window` (`click`, `pointerup`, `keydown`).
  - If `params.get('autostart') === '1' || params.get('autostart') === 'true' || params.get('skip_intro') === '1'`, invoke `continueToGame()` immediately after `loadData()` completes (and automatically invoke `startGame()` on page load when `?autostart=1` is present).
  - In normal mode (without `?autostart=1`), also schedule a bounded `setTimeout(continueToGame, 1500)` fallback after `setStatus(t("clickToContinue"))` so that:
    - Manual users and 2-click Playwright tests see `"Click to continue..."` and can click immediately (`< 500ms`), AND
    - 1-click Playwright tests that click `#click-to-play-button` once and poll `window.__REVCDOS_STATUS__.mainCalled` automatically transition into `loadGame(dataBuffer)` after `1.5s` without hanging on the intro video.
- **`loadGame(data)` Telemetry Hooks**:
  - In `Module.instantiateWasm`: after `WebAssembly.instantiate(wasm, info)` resolves, set `window.__REVCDOS_STATUS__.wasmReady = true;` before returning `receiveInstance(module.instance, module)`.
  - In `Module.mainCalled`: write `/vc-assets/local/revc.ini` with read/write permissions (`Module.FS.createDataFile("/vc-assets/local/revc.ini", 0, revc_ini, true, true)`) and set `window.__REVCDOS_STATUS__.mainCalled = true; window.__REVCDOS_STATUS__.wasmReady = true;`.

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `revcdos/game.js`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_043.md`
- `nzportable/loader.js`
- `skate3_cleanroom/loader.js`
- `assets/20261024T194153-999-2zne/plan-hf-dist-game.js.txt`
- `assets/20261024T194153-999-2zne/plan-lolendor-dist-game.js.txt`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `window.__REVCDOS_STATUS__.haveOriginalGame === true` immediately upon loading `/revcdos/`.
- Verify `loadData()` populates `revcdos-pack-v1` in `CacheStorage`, sets `window.__REVCDOS_STATUS__.dataLoadedBytes === 135355111`, and supports both direct `vcbr/vc-sky-en-v6.data` and 4-part `./parts/vc-sky-en-v6.data.part00..03` loading (`?useparts=1`).
- Verify `replaceFetch("https://cdn.dos.zone/vcsky/fetched/AUDIO/WATER.MP3")` returns `"vcsky/fetched/audio/water.mp3"`.
- Verify `window.__REVCDOS_STATUS__.wasmReady === true` and `window.__REVCDOS_STATUS__.mainCalled === true` once the engine boots.
