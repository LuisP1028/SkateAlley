# Master Component-to-Edit Matrix — Run `20261024T194153-999-2zne` (Functional Specification 043: `/revcdos/`)

This matrix establishes the authoritative separation between **Mandatory Target Deliverables (`MANDATORY_TARGET`)** that the `implement` stage must create or modify and mark `CHANGED` in `handoff/20261024T194153-999-2zne/implementer-status.txt`, and **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** inspected during reconnaissance and planning (`INV-DELIVERABLE-SPLIT-01`, `INV-NO-SELF-TEST-01`).

---

## Mandatory Target Deliverables (MANDATORY_TARGET)

All production files listed below must be created or modified by the `implement` stage to fulfill `functional_specification_043.md` end-to-end:

| Repository-Relative Path | Action | Line Range / Scope | Target Symbols / Structural Transformation | Governing Ticket |
| :--- | :---: | :---: | :--- | :---: |
| `.gitignore` | `MODIFY` | `L50–L55` | Append `revcdos/vcbr/vc-sky-en-v6.data`, `revcdos/vcbr/vc-sky-ru-v6.data`, `revcdos/vcsky/`, and `*.zip` so unsplit `135.36 MB` `.data` and `~748 MB` `vcsky/` streaming directory are never committed to Git while `revcdos/parts/vc-sky-en-v6.data.part00..03` remain tracked. | `ticket-001`, `ticket-002` |
| `scripts/serve_skatealley.py` | `MODIFY` | `L206–L292`, `L317–L327`, `L492–L596` | 1. Add `REVCDOS_DATA_EXPECTED_SIZE = 135355111` and register `.data`, `.txd`, `.dff`, `.col`, `.img`, `.dir`, `.dat`, `.scm`, `.gxt`, `.raw`, `.adf`, `.ifp`, `.sdt`, `.ide`, `.ipl`, `.zon`, `.fxt`, `.cfg`, `.ini`, `.part00`..`.part99` as `application/octet-stream`, `.wasm` as `application/wasm`, and `.mp3` as `audio/mpeg` in `EXTRA_MIME_TYPES` & `CUSTOM_MIME_TYPES`.<br/>2. Implement and invoke `ensure_revcdos_data(base_dir=None)` to auto-materialize `revcdos/vcbr/vc-sky-en-v6.data` (`135,355,111 B`) from `revcdos/parts/vc-sky-en-v6.data.part00..03` if absent on disk.<br/>3. Override `SkateAlleyRequestHandler.translate_path(self, path)` with component-wise case-insensitive path resolution for any request under `/revcdos/vcsky/`.<br/>4. Update `_serve_health()` to verify `revcdos/index.html`, `revcdos/vcbr/vc-sky-en-v6.wasm`, and `revcdos/vcsky/fetched`, reporting `"revcdos_webapp": true` and appending `"revcdos_webapp"` to `"services"` and `"components"`. | `ticket-006` |
| `index.html` | `MODIFY` | `L2242–L2248` | Add a launcher button `#hud-enter-revcdos-btn` (`href="./revcdos/"`, label `🌴 GTA: Vice City (reVCDOS)`) in `#sandbox-hud-body` immediately below `#hud-enter-nzportable-btn`, without modifying `sandbox.js` or the Three.js scene graph. | `ticket-006` |
| `revcdos/index.html` | `CREATE` | `L1–L745` | Standalone HTML5 application shell for GTA: Vice City (`reVCDOS`), preserving all DOS.Zone Team credits, `.start-container`, `#click-to-play-button`, `#demo-off-disclaimer`, `#config-panel`, `.intro-container`, `.loader-container`, `<canvas id="canvas">`, `.touch-controls-wrapper`, relative `url(cover.jpg)`, zero `cdn.dos.zone` URLs, and a fixed `← 3D Portfolio (Alley)` HUD button (`#revcdos-back-to-alley-btn`, `onclick="window.location.assign('../'); return false;"`). | `ticket-003` |
| `revcdos/game.js` | `CREATE` | `L1–L890` | Enhanced launcher script: initializes `window.__REVCDOS_STATUS__`, sets `localStorage.setItem('vcsky.haveOriginalGame', 'true')` (unless `?request_original_game=1`) and runs `ownerShipConfirmed()` at load, configures `vcbr/vc-sky-en-v6.data` (`135,355,111 B`) and `vcbr/vc-sky-en-v6.wasm` (`7,625,877 B`), implements `loadData()` with `CacheStorage` (`revcdos-pack-v1`) and 4-part `./parts/vc-sky-en-v6.data.part00..03` + `../tunnel.json` fallback, normalizes `replaceFetch(str)` to lowercase `vcsky/...` paths, preserves WebGL2 drawing buffer on `#canvas`, unlocks Web Audio, replaces blocking `onbeforeunload` with `pagehide` `syncRevcIni`, and supports `?autostart=1` + bounded intro auto-continuation. | `ticket-004` |
| `revcdos/index.js` | `CREATE` | `L1–L35` | Sequential module loader for `modules/runtime.js`, `modules/packages/{en,ru}.js`, `modules/loader.js`, `modules/fs.js`, `modules/audio.js`, `modules/graphics.js`, `modules/events.js`, `modules/fetch.js`, `modules/asm_consts/{en,ru}.js`, `modules/main.js`, and optional `modules/cheats.js`. | `ticket-003` |
| `revcdos/pack.json` | `CREATE` | `L1–L68` | JSON asset manifest specifying `cacheName: "revcdos-pack-v1"`, `engine` (`vcbr/vc-sky-en-v6.wasm`, `7,625,877 B`), `data` (`vcbr/vc-sky-en-v6.data`, `135,355,111 B`), and 4 split chunks (`./parts/vc-sky-en-v6.data.part00..03` with `partSizes` and `partSha256`). | `ticket-001` |
| `revcdos/GamepadEmulator.js` | `CREATE` | Binary/JS (`35,089 B`) | Mobile touch joystick and virtual gamepad button emulator for `reVCDOS`. | `ticket-003` |
| `revcdos/idbfs.js` | `CREATE` | Binary/JS (`7,962 B`) | Emscripten `IDBFS` wrapper for `/vc-assets/local/userfiles` save persistence. | `ticket-003` |
| `revcdos/jsdos-cloud-sdk.js` | `CREATE` | Binary/JS (`22,490 B`) | Cloud save SDK script. | `ticket-003` |
| `revcdos/jsdos-cloud-sdk-local.js` | `CREATE` | Binary/JS (`21,920 B`) | Local custom save SDK script (`?custom_saves=1`). | `ticket-003` |
| `revcdos/cover.jpg` | `CREATE` | Binary (`105,208 B`) | GTA: Vice City start-screen cover artwork. | `ticket-003` |
| `revcdos/intro.mp4` | `CREATE` | Binary (`8,019,046 B`) | Startup intro video played during background `.data` streaming. | `ticket-003` |
| `revcdos/vcbr/vc-sky-en-v6.wasm` | `CREATE` | Binary (`7,625,877 B`) | Native compiled `reVC` Emscripten WebAssembly binary (SHA-256 `db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2`). | `ticket-001` |
| `revcdos/parts/vc-sky-en-v6.data.part00` | `CREATE` | Binary (`33,838,778 B`) | Chunk 0 (`bytes 0..33838777`) of `vc-sky-en-v6.data` (`<= 35 MB`). | `ticket-001` |
| `revcdos/parts/vc-sky-en-v6.data.part01` | `CREATE` | Binary (`33,838,778 B`) | Chunk 1 (`bytes 33838778..67677555`) of `vc-sky-en-v6.data` (`<= 35 MB`). | `ticket-001` |
| `revcdos/parts/vc-sky-en-v6.data.part02` | `CREATE` | Binary (`33,838,778 B`) | Chunk 2 (`bytes 67677556..101516333`) of `vc-sky-en-v6.data` (`<= 35 MB`). | `ticket-001` |
| `revcdos/parts/vc-sky-en-v6.data.part03` | `CREATE` | Binary (`33,838,777 B`) | Chunk 3 (`bytes 101516334..135355110`) of `vc-sky-en-v6.data` (`<= 35 MB`). | `ticket-001` |
| `revcdos/modules/runtime.js` | `CREATE` | JS (`95,224 B`) | Emscripten core runtime, memory views, and UTF8/WASM table helpers. | `ticket-005` |
| `revcdos/modules/loader.js` | `CREATE` | JS (`9,469 B`) | Emscripten `loadPackage` preRun filesystem creator (`/vc-assets/local/...`). | `ticket-005` |
| `revcdos/modules/fs.js` | `CREATE` | JS (`99,817 B`) | Emscripten virtual filesystem (`MEMFS` + `IDBFS`). | `ticket-005` |
| `revcdos/modules/audio.js` | `CREATE` | JS (`90,186 B`) | Emscripten OpenAL Web Audio implementation. | `ticket-005` |
| `revcdos/modules/graphics.js` | `CREATE` | JS (`105,045 B`) | Emscripten WebGL2 / GLFW / GLES rendering bridge. | `ticket-005` |
| `revcdos/modules/events.js` | `CREATE` | JS (`54,881 B`) | Keyboard, mouse, pointer lock, and gamepad event bridge. | `ticket-005` |
| `revcdos/modules/fetch.js` | `CREATE` | JS (`~14 KB`) | Emscripten `Fetch` (`emscripten_filesystem` IndexedDB + `fetchXHR`), instrumented to update `window.__REVCDOS_STATUS__.fetchedAssetsCount`, `failedFetchesCount`, `lastFetchedUrl`, and `lastError`. | `ticket-005` |
| `revcdos/modules/syscalls.js` | `CREATE` | JS (`16,459 B`) | Emscripten POSIX syscall bindings. | `ticket-005` |
| `revcdos/modules/main.js` | `CREATE` | JS (`37 B`) | Emscripten `run()` entry point trigger. | `ticket-005` |
| `revcdos/modules/cheats.js` | `CREATE` | JS (`69,259 B`) | Built-in `F3` cheat menu, AirBreak, GodMode, and +$9999999 Money overlay (`?cheats=1`). | `ticket-005` |
| `revcdos/modules/asm_consts/en.js` | `CREATE` | JS (`~14.3 KB`) | English `ASM_CONSTS` table with `980182: ($0, $1) => 1` universal host check and `981494: () => { Module.mainCalled(); }`. | `ticket-005` |
| `revcdos/modules/asm_consts/ru.js` | `CREATE` | JS (`~16.0 KB`) | Russian `ASM_CONSTS` table with `980198: ($0, $1) => 1` universal host check. | `ticket-005` |
| `revcdos/modules/packages/en.js` | `CREATE` | JS (`243,191 B`) | `DATA_PACKAGE` byte-range slice table (`remote_package_size: 135355111`) for `vc-sky-en-v6.data`. | `ticket-005` |
| `revcdos/modules/packages/ru.js` | `CREATE` | JS (`244,121 B`) | `DATA_PACKAGE` byte-range slice table for `vc-sky-ru-v6.data`. | `ticket-005` |

### Local Disk Runtime Artifacts (Mandatory On-Disk Presence, Git-Ignored via `.gitignore`)
- `revcdos/vcbr/vc-sky-en-v6.data` (`135,355,111 B` — kept on disk for fast direct HTTP serving and auto-materialized by `scripts/serve_skatealley.py` from `revcdos/parts/vc-sky-en-v6.data.part00..03`; excluded from Git via `.gitignore`).
- `revcdos/vcsky/fetched/**` and `revcdos/vcsky/sha256sums.txt` (`15,619` extracted entries, 100% lowercased on disk via two-step APFS-safe rename, with all 9 subdirectories `anim/`, `audio/`, `data/`, `models/`, `mp3/`, `mss/`, `skins/`, `text/`, `txd/` present under `revcdos/vcsky/fetched/`; excluded from Git via `.gitignore`).

---

## Read-Only Discovery Context (READ_ONLY_CONTEXT)

The following files were inspected or captured during `plan`, `plan-scan-1`, and `plan-scan-2` as ground-truth reference context and must **not** be conflated with mandatory edit targets:

- `functional_specification_043.md`
- `LANGUAGE.md`
- `.sandcastle/mcp.md`
- `sandbox.js` (strictly read-only; zero Vice City porting into Three.js)
- `skate3_cleanroom/index.html`
- `skate3_cleanroom/loader.js`
- `nzportable/index.html`
- `nzportable/loader.js`
- `nzportable/pack.json`
- `tunnel.json`
- `assets/20261024T194153-999-2zne/plan-carter54git-README.md`
- `assets/20261024T194153-999-2zne/plan-carter54git-preload_files.list.txt`
- `assets/20261024T194153-999-2zne/plan-dist-url-audit.txt`
- `assets/20261024T194153-999-2zne/plan-hf-Dockerfile.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-game.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-index.html.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-index.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-jsdos-cloud-sdk-local.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-jsdos-cloud-sdk.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-asm_consts-en.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-asm_consts-ru.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-fetch.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-fs.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-loader.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-packages-en-head.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-packages-en-tail.js.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-tree.json`
- `assets/20261024T194153-999-2zne/plan-hf-fix_cases.py.txt`
- `assets/20261024T194153-999-2zne/plan-hf-server.py.txt`
- `assets/20261024T194153-999-2zne/plan-hf-th3w33knd-revcdos-tree.json`
- `assets/20261024T194153-999-2zne/plan-hf-th3w33knd-revcdos-vcbr.json`
- `assets/20261024T194153-999-2zne/plan-lolendor-dist-game.js.txt`
- `assets/20261024T194153-999-2zne/plan-lolendor-dist-index.html.txt`
- `assets/20261024T194153-999-2zne/plan-lolendor-dist-modules-asm_consts-en.js.txt`
- `assets/20261024T194153-999-2zne/plan-modules-diff.txt`
- `assets/20261024T194153-999-2zne/plan-vcsky-zip-header-probe.txt`
- `assets/20261024T194153-999-2zne/plan-scan-1-*` and `assets/20261024T194153-999-2zne/plan-scan-2-*`
