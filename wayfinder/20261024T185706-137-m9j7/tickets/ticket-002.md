# Ticket 002: Standalone `/nzportable/index.html` Dark HTML5 Shell, Calibrated Full-Viewport Emscripten `#canvas`, Splash Gate (`#splash`), Loading Progress Overlay (`#overlay`), and Bottom-Right HUD Bar (`#hudbar`)

- **Ticket ID**: `ticket-002`
- **Target Stage**: `implement` (independent test authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: Resolved / Decided
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`
- **Blocks**: `ticket-003`

---

## 1. Decision Question

How should `/nzportable/index.html` be structured and styled so that it provides a dark-themed clean-room splash screen (`#splash`), a download/boot progress overlay (`#overlay`), a non-intrusive bottom-right HUD bar (`#hudbar`), and a full-viewport `<canvas class="emscripten" id="canvas">` with zero border/padding offset for 1:1 FTEQW mouse and PointerLock calibration?

---

## 2. Empirical Ground-Truth Findings (`plan-upstream-index.html`, `plan-ftewebgl.js`, & `skate3_cleanroom/index.html`)

1. **FTEQW Canvas Coordinate & Resize Contract (`plan-ftewebgl.js` lines 1 & 114011):**
   - In `ftewebgl.js`, `_emscriptenfte_setupcanvas` attaches mouse/keyboard/touch/pointerlock listeners directly to `Module["canvas"]` (`document.getElementById("canvas")`) and computes canvas pixel dimensions from `Module["canvas"].getBoundingClientRect()`.
   - During non-PointerLock menu navigation (`FTEC.handleevent` `mousemove`), FTEQW maps cursor coordinates via `(event.clientX - rect.left) * (Module["canvas"].width / rect.width)`. Any border or padding on `canvas.emscripten` shifts mouse coordinates away from visual menu items.
   - Furthermore, `<canvas id="canvas">` MUST NOT have `hidden=1` or `display: none` during startup; if hidden, `getBoundingClientRect()` returns `0 × 0` when `_emscriptenfte_setupcanvas` runs `window.onresize()`. Instead, `#canvas` must always remain `display: block; width: 100%; height: 100%; border: 0px none; padding: 0; margin: 0;` in `#game` (`position: fixed; inset: 0;`), while `#splash` (`z-index: 10`) and `#overlay` (`z-index: 8`) sit as fixed overlays above it.
2. **Precedent Alignment (`skate3_cleanroom/index.html`):**
   - Mirrors the dark theme (`--bg: #000`, `--fg: #e8e8e8`, `--muted: #8a9aab`, `--accent: #f59e0b` / `#dc2626` zombie amber-crimson accent), `#splash`, `#overlay`, and bottom-right `#hudbar` (`← 3D Portfolio (Alley)` + `Fullscreen` buttons).

---

## 3. Locked Architectural Decisions for `implement`

### 3.1 Required DOM Elements & IDs in `/nzportable/index.html`
Create `/nzportable/index.html` containing:
1. **Viewport & Canvas Container (`#game` & `#canvas`)**:
   - `<div id="game"><canvas class="emscripten" id="canvas" oncontextmenu="event.preventDefault()" tabindex="0"></canvas></div>`
   - CSS rule:
     ```css
     #game { position: fixed; inset: 0; }
     canvas.emscripten, #canvas {
       border: 0px none;
       width: 100%;
       height: 100%;
       padding: 0;
       margin: 0;
       display: block;
       outline: none;
       background-color: #000;
     }
     ```
2. **Splash Gate (`#splash`)**:
   - `<div id="splash" role="button" tabindex="0" aria-label="Click or Press Any Key to Launch">`
   - Displays:
     - Logo/Header: `NZ: PORTABLE` / **Nazi Zombies: Portable**
     - Subtitle/Credit: `FTEQW WebGL Clean-Room Build · Credit: nzp-team (nzp-team/nzportable)`
     - Keybindings card: `WASD` Move · `Mouse` Aim/Fire · `R` Reload · `F` Interact/Buy · `Shift` Sprint · `C` Crouch · `Esc` Menu
     - Prompt: **Click or Press Any Key to Launch**
3. **Loading Progress Overlay (`#overlay`)**:
   - `<div id="overlay"><div id="panel">...</div></div>`
   - Contains:
     - Heading: `<h2 id="overlay-title">Loading Nazi Zombies: Portable</h2>`
     - Status readout: `<div id="status">Waiting to launch...</div>`
     - Progress bar track & fill: `<div class="bar"><div id="progress"></div></div>`
     - Downloaded megabytes counter: `<div id="mb-counter">0.0 / 94.8 MB</div>`
     - Return link: `<a id="overlay-return-alley" href="../">← Return to 3D Alley Portfolio</a>`
4. **Bottom-Right Non-Intrusive HUD Bar (`#hudbar`)**:
   - `<div id="hudbar">` (with class `.visible` toggled when engine is ready, or accessible during runtime) containing:
     - `<button id="return-alley-btn" type="button" title="Return to Freeman Alley 3D Portfolio" onclick="window.location.assign('../')">← 3D Portfolio (Alley)</button>`
     - `<button id="fullscreen" type="button" title="Toggle Fullscreen (F11)">Fullscreen</button>`
5. **Module Loader Script Tag**:
   - `<script type="module" src="./loader.js"></script>`
   - Do NOT include the upstream `#dropzone` or `showfiles()` debug file-picker UI.

---

## 4. Deliverable Register (`INV-DELIVERABLE-SPLIT-01`)

### Mandatory Target Deliverables (`MANDATORY_TARGET`)
- `nzportable/index.html`

### Read-Only Discovery Context (`READ_ONLY_CONTEXT`)
- `skate3_cleanroom/index.html`
- `assets/20261024T185706-137-m9j7/plan-upstream-index.html`
- `assets/20261024T185706-137-m9j7/plan-ftewebgl.js`
