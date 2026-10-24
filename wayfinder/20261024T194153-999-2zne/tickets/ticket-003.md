# Ticket 003: Standalone `/revcdos/index.html` Shell, DOS.Zone Attribution, Return-to-Alley HUD Navigation & Static Asset Bundle

- **Ticket ID**: `ticket-003`
- **Title**: Standalone `/revcdos/index.html` Shell, DOS.Zone Attribution, Return-to-Alley HUD Navigation & Static Asset Bundle
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`
- **Blocks**: `ticket-004`, `ticket-005`, `ticket-006`

## 1. Decision Question

How should the standalone `/revcdos/index.html` page and its companion client assets (`cover.jpg`, `intro.mp4`, `GamepadEmulator.js`, `idbfs.js`, `jsdos-cloud-sdk.js`, `jsdos-cloud-sdk-local.js`, `index.js`) be structured to reconcile differences between `Lolendor/reVCDOS` and `th3w33knd/reVCDOS`, eliminate dead `cdn.dos.zone` asset references, preserve all DOS.Zone Team credits and UI elements, and provide a non-intrusive return button to the Freeman Alley 3D Portfolio (`../`)?

## 2. Authoritative Architectural Decision

### 2.1 Reconciliation of Upstream `dist/index.html` Variants (`INV-ROOT-CAUSE-AGENCY-01`)
Comparative diffing between `th3w33knd/reVCDOS/dist/index.html` (`assets/20261024T194153-999-2zne/plan-hf-dist-index.html.txt`) and `Lolendor/reVCDOS/dist/index.html` (`assets/20261024T194153-999-2zne/plan-lolendor-dist-index.html.txt`) revealed three critical discrepancies that `revcdos/index.html` must reconcile:
1. **Relative `cover.jpg` Path**: `Lolendor/reVCDOS/dist/index.html` line 188 used `background-image: url(/cover.jpg);` (root-relative), which breaks when mounted under `/revcdos/`. `revcdos/index.html` must use `background-image: url(cover.jpg);` (as in `th3w33knd/reVCDOS/dist/index.html` line 192).
2. **Dead CDN `.wasted-container` Background URL Remediation**: Both upstream `index.html` files had `.wasted-container { ... background-image: url(https://cdn.dos.zone/vcsky/wasted.png); }` at line 249, pointing to the dead `cdn.dos.zone` S3 bucket (`HTTP 403`). `revcdos/index.html` must replace `url(https://cdn.dos.zone/vcsky/wasted.png)` with `url(cover.jpg)` (and remove the commented-out `cdn.dos.zone` redirect snippet at the bottom of `index.html`) so zero references to `cdn.dos.zone` exist in `revcdos/index.html`.
3. **Preservation of `#config-panel` & DOS.Zone Team Attribution**:
   - Include `#config-panel` (`#config-lang`, `#config-cheats`, `#config-fullscreen`, `#config-max-fps`) from `Lolendor/reVCDOS/dist/index.html` lines 588–617 inside `.button-container` so `?configurable=1` works seamlessly.
   - Preserve all required DOM elements and credits: `.wasted-container`, `.intro-container` (`<video class="intro" src="intro.mp4" playsinline></video>`), `.loader-container` (`#spinner`, `.progress-bar-fill`, `#status`, `<progress id="progress"></progress>`), `.start-container`, `.cover`, `.click-to-play`, `<button id="click-to-play-button">Click to play</button>`, `<div id="demo-off-disclaimer"></div>`, `<a id="follow" href="https://dos.zone/revcdos" target="_blank">Vice City by DOS Zone Team</a>`, `.jsdos-key` (`#cloud-saves-link`, `#cloud-saves-status`, `.jsdos-key-input`), `.disclaimer` (`#disclaimer-text`, `#disclaimer-sources`, `#play-demo-text`, `#disclaimer-checkbox`, `#disclaimer-checkbox-label`), `.developed-by` (`#port-by`, `@specialist003`, `@caiiiycuk`, `@SerGen`, `@Lolendor`, `GamesVoice`, `Th3w33knd`), `<input type="file" id="original-game-file" hidden>`, `<canvas class="emscripten" id="canvas" oncontextmenu="event.preventDefault()"></canvas>`, and `.touch-controls-wrapper`.

### 2.2 Non-Intrusive Return-to-Alley HUD Button (`← 3D Portfolio (Alley)`)
Add a fixed, non-intrusive HUD return button inside `revcdos/index.html` (styled consistently with `nzportable/index.html` and `skate3_cleanroom/index.html`, positioned at `top: 12px; left: 12px; z-index: 10001;`):
```html
<a
  id="revcdos-back-to-alley-btn"
  href="../"
  onclick="window.location.assign('../'); return false;"
  title="Return to Freeman Alley 3D Portfolio"
  style="position: fixed; top: 12px; left: 12px; z-index: 10001; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: rgba(16, 10, 54, 0.85); border: 1.5px solid #ff4193; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; font-weight: 700; text-decoration: none; box-shadow: 0 0 10px rgba(255, 65, 147, 0.45); backdrop-filter: blur(8px); cursor: pointer;"
>
  ← 3D Portfolio (Alley)
</a>
```

### 2.3 Companion Client Files in `/revcdos/`
Acquire the following static client files directly from `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/dist/<file>`:
- `revcdos/GamepadEmulator.js` (`35,089` B)
- `revcdos/cover.jpg` (`105,208` B, LFS SHA-256 `e2f9e05b539417d4327b487b2e73eba9c6e71fb25567166042aa45351f9b5eb8`)
- `revcdos/idbfs.js` (`7,962` B)
- `revcdos/index.js` (`1,140` B — sequential module loader for `modules/runtime.js`, `modules/packages/{en,ru}.js`, `modules/loader.js`, `modules/fs.js`, `modules/audio.js`, `modules/graphics.js`, `modules/events.js`, `modules/fetch.js`, `modules/asm_consts/{en,ru}.js`, `modules/main.js`, and optional `modules/cheats.js`)
- `revcdos/intro.mp4` (`8,019,046` B, LFS SHA-256 `d77620000a4b1a93a3d1bed13b71ef7a4678c2f80b3c6faadacb77486d219140`)
- `revcdos/jsdos-cloud-sdk.js` (`22,490` B)
- `revcdos/jsdos-cloud-sdk-local.js` (`21,920` B)

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `revcdos/index.html`
- `revcdos/index.js`
- `revcdos/GamepadEmulator.js`
- `revcdos/idbfs.js`
- `revcdos/jsdos-cloud-sdk.js`
- `revcdos/jsdos-cloud-sdk-local.js`
- `revcdos/cover.jpg`
- `revcdos/intro.mp4`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_043.md`
- `assets/20261024T194153-999-2zne/plan-hf-dist-index.html.txt`
- `assets/20261024T194153-999-2zne/plan-lolendor-dist-index.html.txt`
- `assets/20261024T194153-999-2zne/plan-hf-dist-index.js.txt`
- `assets/20261024T194153-999-2zne/plan-carter54git-README.md`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `revcdos/index.html` renders all start-screen elements, DOS.Zone Team credits, `#config-panel`, `<canvas id="canvas">`, and the `← 3D Portfolio (Alley)` return link (`onclick="window.location.assign('../'); return false;"` / `href="../"`).
- Verify `revcdos/index.html` contains zero references to `cdn.dos.zone` or `folder.morgen.qzz.io`.
- Verify `cover.jpg` (`105,208` B), `intro.mp4` (`8,019,046` B), `GamepadEmulator.js` (`35,089` B), `idbfs.js` (`7,962` B), `jsdos-cloud-sdk.js` (`22,490` B), `jsdos-cloud-sdk-local.js` (`21,920` B), and `index.js` (`1,140` B) exist in `revcdos/` with exact byte parity.
