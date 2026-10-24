# Ticket 005: Modular Emscripten Runtime (`/revcdos/modules/**`): XHR Telemetry Instrumentation (`modules/fetch.js`), Universal Host-Check Bypass (`modules/asm_consts/*.js`), and F3 Cheat Menu (`modules/cheats.js`)

- **Ticket ID**: `ticket-005`
- **Title**: Modular Emscripten Runtime (`/revcdos/modules/**`): XHR Telemetry Instrumentation (`modules/fetch.js`), Universal Host-Check Bypass (`modules/asm_consts/*.js`), and F3 Cheat Menu (`modules/cheats.js`)
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-003`, `ticket-004`
- **Blocks**: `ticket-006`

## 1. Decision Question

How should the 15 modular Emscripten runtime scripts under `/revcdos/modules/**` be staged and instrumented so that:
1. On-demand XHR asset streaming (`modules/fetch.js`) updates `window.__REVCDOS_STATUS__.fetchedAssetsCount`, `failedFetchesCount`, `lastFetchedUrl`, and `lastError` accurately;
2. The WASM engine's compiled host-lock check (`ASM_CONSTS[980182]` in `en.js` and `ASM_CONSTS[980198]` in `ru.js`) passes on any local IP (`10.0.0.62`, `0.0.0.0`, `localhost`, `127.0.0.1`), Cloudflare tunnel, or static host; and
3. All preloaded filesystem slices (`packages/en.js`, `packages/ru.js`), WebGL2/WebAudio bindings (`graphics.js`, `audio.js`, `events.js`, `fs.js`, `loader.js`, `runtime.js`, `syscalls.js`, `main.js`), and the `F3` cheat menu (`cheats.js`) operate without errors?

## 2. Authoritative Architectural Decision

### 2.1 Root-Cause Remediation in `revcdos/modules/asm_consts/en.js` & `ru.js` (`INV-ROOT-CAUSE-AGENCY-01`)
Diffing `th3w33knd/reVCDOS/dist/modules/asm_consts/en.js` against `Lolendor/reVCDOS/dist/modules/asm_consts/en.js` (`assets/20261024T194153-999-2zne/plan-modules-diff.txt`) exposed a critical hostname restriction in `th3w33knd`'s copy:
- `th3w33knd/reVCDOS/dist/modules/asm_consts/en.js` lines 25–30 restricted `ASM_CONSTS[980182]` to `localhost`, `127.0.0.1`, `192.168.*`, or `dos.zone`, which would fail when accessed via the Server SSH Mac `10.0.0.62:3002`, `0.0.0.0:3002`, Cloudflare tunnels (`*.trycloudflare.com`), or GitHub Pages (`*.github.io`).
- `Lolendor/reVCDOS/dist/modules/asm_consts/en.js` line 25 resolves this at the root cause with:
  ```javascript
  980182: ($0, $1) => 1,
  ```
  and `Lolendor/reVCDOS/dist/modules/asm_consts/ru.js` line 25 resolves the Russian binary equivalent with:
  ```javascript
  980198: ($0, $1) => 1,
  ```
The `implement` stage must use `980182: ($0, $1) => 1` in `revcdos/modules/asm_consts/en.js` and `980198: ($0, $1) => 1` in `revcdos/modules/asm_consts/ru.js`.

### 2.2 Telemetry Instrumentation in `revcdos/modules/fetch.js`
In `revcdos/modules/fetch.js` (`assets/20261024T194153-999-2zne/plan-hf-dist-modules-fetch.js.txt`):
1. At line 40 inside `fetchXHR(fetch, onsuccess, onerror, onprogress, onreadystatechange)`:
   - `var url_ = replaceFetch(UTF8ToString(url));`
2. Inside `xhr.onload` (lines 108–118):
   - When `xhr.status >= 200 && xhr.status < 300`:
     ```javascript
     if (typeof window !== "undefined" && window.__REVCDOS_STATUS__) {
         window.__REVCDOS_STATUS__.fetchedAssetsCount = (window.__REVCDOS_STATUS__.fetchedAssetsCount || 0) + 1;
         window.__REVCDOS_STATUS__.lastFetchedUrl = url_;
     }
     onsuccess(fetch, xhr, e);
     ```
   - When `xhr.status < 200 || xhr.status >= 300`:
     ```javascript
     if (typeof window !== "undefined" && window.__REVCDOS_STATUS__) {
         window.__REVCDOS_STATUS__.failedFetchesCount = (window.__REVCDOS_STATUS__.failedFetchesCount || 0) + 1;
         window.__REVCDOS_STATUS__.lastFetchedUrl = url_;
         window.__REVCDOS_STATUS__.lastError = `HTTP ${xhr.status} for ${url_}`;
     }
     onerror(fetch, e);
     ```
3. Inside `xhr.onerror` (lines 119–125) and `xhr.ontimeout` (lines 126–131):
   - Increment `window.__REVCDOS_STATUS__.failedFetchesCount`, record `window.__REVCDOS_STATUS__.lastFetchedUrl = url_`, and set `window.__REVCDOS_STATUS__.lastError`.
4. Inside `fetchLoadCachedData` (lines 217–231):
   - When `if (event.target.result)` hits in `IndexedDB` (`emscripten_filesystem` `FILES` store), increment `window.__REVCDOS_STATUS__.fetchedAssetsCount` and set `window.__REVCDOS_STATUS__.lastFetchedUrl = replaceFetch(pathStr)` so warm IndexedDB asset loads are also reflected in `fetchedAssetsCount`. (Do not increment `failedFetchesCount` on IndexedDB cache miss in `fetchLoadCachedData`, because an IndexedDB cache miss is the normal trigger that invokes `performCachedXhr` $\rightarrow$ `fetchXHR`).

### 2.3 Complete `/revcdos/modules/**` File Inventory
Acquire and stage all 15 modular runtime files under `revcdos/modules/`:
1. `revcdos/modules/runtime.js` (`95,224` B)
2. `revcdos/modules/loader.js` (`9,469` B)
3. `revcdos/modules/fs.js` (`99,817` B)
4. `revcdos/modules/audio.js` (`90,186` B)
5. `revcdos/modules/graphics.js` (`105,045` B)
6. `revcdos/modules/events.js` (`54,881` B)
7. `revcdos/modules/fetch.js` (`~14 KB`, instrumented per §2.2)
8. `revcdos/modules/syscalls.js` (`16,459` B)
9. `revcdos/modules/main.js` (`37` B)
10. `revcdos/modules/cheats.js` (`69,259` B from `Lolendor/reVCDOS/dist/modules/cheats.js` with full F3 Cheat Menu, AirBreak, GodMode, and +$9999999 Money button)
11. `revcdos/modules/asm_consts/en.js` (`~14.3 KB` with `980182: ($0, $1) => 1`)
12. `revcdos/modules/asm_consts/ru.js` (`~16.0 KB` with `980198: ($0, $1) => 1`)
13. `revcdos/modules/packages/en.js` (`243,191` B — slices `135,355,111`-byte `vc-sky-en-v6.data` into `/vc-assets/local/...`)
14. `revcdos/modules/packages/ru.js` (`244,121` B)

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `revcdos/modules/runtime.js`
- `revcdos/modules/loader.js`
- `revcdos/modules/fs.js`
- `revcdos/modules/audio.js`
- `revcdos/modules/graphics.js`
- `revcdos/modules/events.js`
- `revcdos/modules/fetch.js`
- `revcdos/modules/syscalls.js`
- `revcdos/modules/main.js`
- `revcdos/modules/cheats.js`
- `revcdos/modules/asm_consts/en.js`
- `revcdos/modules/asm_consts/ru.js`
- `revcdos/modules/packages/en.js`
- `revcdos/modules/packages/ru.js`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_043.md`
- `assets/20261024T194153-999-2zne/plan-hf-dist-tree.json`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-fetch.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-loader.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-fs.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-asm_consts-en.js.txt`
- `assets/20261024T194153-999-2zne/plan-lolendor-dist-modules-asm_consts-en.js.txt`
- `assets/20261024T194153-999-2zne/plan-modules-diff.txt`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify all 14 files under `revcdos/modules/` exist and load in sequence via `revcdos/index.js` without syntax or network errors.
- Verify `revcdos/modules/fetch.js` increments `window.__REVCDOS_STATUS__.fetchedAssetsCount` on `HTTP 200` on-demand asset fetches and keeps `window.__REVCDOS_STATUS__.failedFetchesCount === 0`.
- Verify `revcdos/modules/asm_consts/en.js` has `980182: ($0, $1) => 1` so execution succeeds on any host/IP.
