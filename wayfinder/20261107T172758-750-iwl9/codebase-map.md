# Codebase & Dataflow Map — `functional_specification_068.md`

- **Run ID:** `20261107T172758-750-iwl9`
- **Branch:** `agent/codebase-mapper-20261107T172758-750-iwl9`
- **Agent:** `codebase-mapper`
- **Seed Specification:** `handoff/authored.txt` → `functional_specification_068.md` (Core §1–§8 + Addendum §9–§15)

---

## 1. Current Project Shape & Entry Points

### 1.1 Directory & Module Structure
- [`index.html`](index.html) (`4,300+` lines):
  - Main HTML/CSS/DOM shell for the Freeman Alley 3D interactive portfolio (`SkateAlley`).
  - Contains the 2D focused holographic popup overlay `#holo-popup-window` (CSS lines `574–907`, HTML lines `3438–3476`), the persistent custom scrollbar `#holo-custom-scrollbar` + `#holo-custom-scrollbar-thumb`, the interactive tag popup card `#holo-tag-popup`, and the portal game selector modal `#portal-game-holo-stage` (CSS lines `908–1095`, HTML lines `3580–3650`).
- [`sandbox.js`](sandbox.js) (`24,157` lines):
  - Primary Three.js WebGL application controller, physics/character locomotion loop (`stepSimulation` at line `19215`), scene/fog/sky initialization (lines `1676–1850`), 3D wall screen mount builder (`buildWallScreenMounts` at line `2674`) and canvas texture renderer (`createProjectScreenTexture` at line `1948`), 2D `#holo-popup-window` state synchronizer (`updateHolographicPopupUI` at line `14021`, `syncHoloCustomScrollbar` at line `13913`, `setActiveHoloTagPopup` at line `13954`), and portal game launcher (`resolveSkateRoomPortalUrl` at line `16509`, `openPortalGameSelectorPopup` at line `16595`, `launchPortalGame` at line `16663`).
  - Exposes `window.sandbox` (lines `14900–15500` and `23850–24157`) for runtime inspection and E2E Playwright harness hooks.
- [`alley_atmosphere_023.js`](alley_atmosphere_023.js) (`2,810` lines):
  - Builds and updates the alley atmospheric subsystems (`buildRunningEffectsSubsystem`), holographic wall-mount shader parity (`updateWallMountHolographicParity` at line `884`), and the 3D cyber-drip graffiti station header meshes (`GRAFFITI_HEADER_GLITCH_FLICKER_SPEC` at line `1048`, `GRAFFITI_STATION_HEADER_SCHEDULE` at line `1124`, `createGraffitiHeaderHolographicMaterial` at line `1258`).
- [`watercolor_shader.js`](watercolor_shader.js) (`1,499` lines):
  - Implements the corridor-end PlatoDoom Arcade portal installation (`WATERCOLOR_GALLERY_SPEC` at line `50`, `PORTAL_HEADER_LOGO_SPEC` at line `95`, `PORTAL_GAME_CATALOG` at line `107`, `solvePortalGameGridLayout` at line `238`, `buildWaterColorGallerySystem` at line `742`).
- [`spray_paint_loader.js`](spray_paint_loader.js) (`950+` lines):
  - Implements the 14-letter UV-mapped spray-paint arcade loading screen (`SPRAY_ARCADE_TIMELINE_SPEC` at line `15`, `SPRAY_ARCADE_LETTER_SPECS` at line `53`, `resolveArcadeLogoPixelLetterIndex` at line `334`, `getLetterId(vec2 uv)` GLSL shader at line `735`) backed by `/platodoomarcade.jpeg`.
- [`hologram_columns.js`](hologram_columns.js) (`900+` lines):
  - Manages the 7station floating holographic media columns (`HOLO_MEDIA_MANIFEST`, `SSM_WHITEPAPER_HOLO_SPEC`, `resolveHoloMediaSpec`) paired with each wall screen mount.
- [`skate3_cleanroom/loader.js`](skate3_cleanroom/loader.js) (`585` lines) & [`skate3_cleanroom/pack.json`](skate3_cleanroom/pack.json) (`67` lines):
  - Cleanroom WebGL Skate 3 runtime at `/skate3_cleanroom/`. `loader.js` fetches `pack.json`, resolves the character key (`?char=` or `pack.default_char`), mounts `parts/char_<key>.part` into `/usr/dev_bdvd/PS3_GAME/USRDIR/ data/content/character/char_nicotest.big` and `.psf` in `Module.FS`, and boots `skate3_cleanroom.js`.
- [`revcdos/game.js`](revcdos/game.js) & [`revcdos/modules/loader.js`](revcdos/modules/loader.js):
  - Playable GTA: Vice City WebAssembly runtime at `/revcdos/`. Fetches `vcbr/luis_player/player.dff`, `player.txd`, and `player.bmp` via `fetchLuisPlayerOverrideAssets()` and mounts them into Emscripten `Module.FS` over `/vc-assets/local/models/gta3.img/player.dff`, `player.txd`, `csplay.dff`, `csplay.txd`, `player2..9`, `csplay2..11`, and `/vc-assets/local/models/generic/player.bmp`.
- [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) (`3,161` lines):
  - Production/local HTTP server (`port 3002` default) with byte-range (`HTTP 206`), gzip, CORS, GraphRAG API endpoints, and worktree binary materialization (`ensure_nzportable_game_pk3`, `ensure_revcdos_data`, `ensure_revcdos_vcsky`, `ensure_revcdos_luis_player`, `ensure_tkdr_assets`, `ensure_melee_assets`, `ensure_mkd_assets`).
- [`tests/verify_spec068_screen_mounts.mjs`](tests/verify_spec068_screen_mounts.mjs) (`611` lines):
  - Existing Playwright + unit verification suite covering the Core Spec (§1–§8) screen mount layout & interaction overhaul.

---

## 2. End-to-End Runtime Dataflow & Storage

### 2.1 Wall Screen Mounts (3D World Space + 2D Focused Overlay)
1. **Station Definitions (`sandbox.js:710–850`):**
   - `HOLO_TAG_DESCRIPTIONS` (`sandbox.js:710–780`) defines the 28-entry dictionary mapping every uppercase tag string across all 7 stations (`id: 0` through `id: 6`) to a 1–2 sentence contextual technical summary (`40–220` chars).
   - `HOLO_PROJECT_STATIONS` (`sandbox.js:782–850`) stores the 7 project stations (`id`, `badge`, `title`, `graffitiTitle`, `subtitle`, `wall`, `z`, `y`, `accent`, `kicker`, `description`, `metrics`, `tags`, `ctaLabel`, `ctaAction`/`ctaUrl`, `secondaryCtaLabel`, `secondaryCtaUrl`).
2. **3D Wall Mount Construction (`sandbox.js:2674–3085` & `alley_atmosphere_023.js:1048–1430`):**
   - `buildWallScreenMounts()` creates a `THREE.Group` per station (`mountGroup`), positions it along the left (`x ≈ -2.01`) or right (`x ≈ +2.01`) brick wall facing into the alley corridor, and constructs:
     - `frameMesh`: Extruded bevel frame (`screenWidth + 0.14`, `screenHeight + 0.14`).
     - `screenMesh`: `THREE.PlaneGeometry(screenWidth, screenHeight)` textured by `createProjectScreenTexture(st)` (`1024 × 640` 2D canvas, `THREE.CanvasTexture`).
     - `graffitiHeaderMesh`: Overhead cyber-drip graffiti title plane above the mount, sized and animated by `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC` in `alley_atmosphere_023.js`.
3. **2D Focused Popup (`sandbox.js:13913–14560` & `index.html:3438–3476`):**
   - Focusing a wall mount (`sandbox.focusWallMount(id)`) transitions the camera to the station and activates `#holo-popup-window.visible.mount-focused`.
   - `updateHolographicPopupUI()` populates `#holo-popup-title`, `#holo-popup-subtitle`, `#holo-popup-desc`, `.holo-metrics-grid` (compact 3-column summary strip), `#holo-popup-tags` (interactive `<button class="holo-tag">` pills with `<span class="holo-tag-plus-bubble">+</span>`), and CTA buttons.
   - Clicking a `.holo-tag` calls `setActiveHoloTagPopup(tagText, st)` (`sandbox.js:13954`), which populates `#holo-tag-popup` with `HOLO_TAG_DESCRIPTIONS[key]` and toggles `.active-tag` (rotating `.holo-tag-plus-bubble` by `45deg`).
   - Scrolling `.holo-body` or calling `updateHolographicPopupUI()` invokes `syncHoloCustomScrollbar()` (`sandbox.js:13913`) to update `#holo-custom-scrollbar-thumb` height and `translateY`.

### 2.2 PlatoDoom Arcade Watercolor Portal & Spray-Paint Loader
1. **3D Corridor-End Portal (`watercolor_shader.js:50–1300`):**
   - `buildWaterColorGallerySystem` mounts `watercolorRootGroup` and `canvasStageGroup` at the north end of Freeman Alley (`WATERCOLOR_GALLERY_SPEC.anchorPosition = { x: 0.0065, yRel: 3.5987, z: 42.0129 }`, `canvasScale = { x: 5.0, y: 5.0, z: 1.0 }`).
   - `headerLogoMesh` renders `PORTAL_HEADER_LOGO_SPEC` (`assets/portal_games/platodoom_header.png`, `planeWidth: 4.55`, `planeHeight: 1.55`, `offsetY: 1.92`).
   - During `waterColor.update(dt, elapsed, activeChar)` (`watercolor_shader.js:1204–1254`), distance from `activeChar` to `portalPos` (`z = 42.0129`) is evaluated, updating `lastPortalDistanceMeters` and `isPlayerNearPortal`.
2. **2D Portal Selector & Spray-Paint Loader (`watercolor_shader.js:107–290`, `spray_paint_loader.js:15–790`):**
   - Clicking the 3D portal or pressing `[E]` opens `#portal-game-holo-stage` (`openPortalGameSelectorPopup` in `sandbox.js:16595`), displaying `#portal-game-header-logo` (`assets/portal_games/platodoom_header.png`) and the 5-card grid computed by `solvePortalGameGridLayout()`.
   - `spray_paint_loader.js` loads `/platodoomarcade.jpeg` into `uLogoTex` and uses normalized UV coordinates (`resolveArcadeLogoPixelLetterIndex(u, v)` and GLSL `getLetterId(vec2 uv)`) to reveal the 14 letters (`PLATO` top row, `DOOMARCADE` bottom row).

### 2.3 Playable Game Portals (`/skate3_cleanroom/` & `/revcdos/`)
1. **Skate 3 Cleanroom (`/skate3_cleanroom/loader.js` & `pack.json`):**
   - `resolveSkateRoomPortalUrl('skate3')` in `sandbox.js:16535` returns `/skate3_cleanroom/?autostart=1&char=luis` when launched from the portal modal.
   - However, when navigating directly to `/skate3_cleanroom/` (without `?char=luis`), `loader.js:436–438` falls back to `pack.default_char`, which in `skate3_cleanroom/pack.json:60` is currently set to `"nicotest"` instead of `"luis"`.
2. **GTA: Vice City (`/revcdos/game.js`, `revcdos/modules/loader.js`, `scripts/serve_skatealley.py`):**
   - `revcdos/game.js` automatically calls `fetchLuisPlayerOverrideAssets()` unless `?stock_player=1` is passed, and `Module.applyLuisPlayerOverrides()` mounts `vcbr/luis_player/player.dff`, `player.txd`, and `player.bmp` into `Module.FS` and updates `gta3.dir` sector counts.
   - **Worktree Sparse-Checkout Bottleneck:** `.git/info/sparse-checkout` contains `!/revcdos/`. While `scripts/serve_skatealley.py` has `ensure_tkdr_assets`, `ensure_melee_assets`, and `ensure_mkd_assets` that link/copy tracked web files from `/Users/diesel/Desktop/SkateAlley/<dir>` into the worktree, `ensure_revcdos_data` / `ensure_revcdos_luis_player` (`scripts/serve_skatealley.py:449–582`) do **not** link or materialize the tracked `revcdos/` files (`index.html`, `game.js`, `index.js`, `index.wasm`, `pack.json`, `modules/loader.js`, `vcbr/luis_player/*`, `parts/*`) from `/Users/diesel/Desktop/SkateAlley/revcdos` or Git `HEAD` when running inside a sparse worktree.

### 2.4 Scene Sky Port, Fog, & Rendering Pipeline (`sandbox.js`)
- `scene.background` is initialized at `sandbox.js:1681` to `new THREE.Color(0x080401)` (dark warm umber `#080401`, non-zero RGB `{8, 4, 1}`).
- `DEPTH_FOG_COLOR_HEX` is `0x0b0501` (`sandbox.js:1682`), used by `scene.fog = new THREE.FogExp2(DEPTH_FOG_COLOR_HEX, DEPTH_FOG_DENSITY)` (`sandbox.js:1687`).
- `renderer` renders directly to the canvas at `sandbox.js:19349` (`renderer.render(scene, camera)`), with no CRT post-processing optical pass currently applied.

---

## 3. Existing Modules & Functions to Reuse

| File | Symbol / Function | Lines | Purpose & Signature |
| :--- | :--- | :--- | :--- |
| [`index.html`](index.html) | `#holo-popup-window` & CSS rules | `574–907`, `3438–3476` | 2D focused screen mount DOM structure, `.holo-top-right` exit button, `#holo-custom-scrollbar`, `.holo-metrics-grid`, `#holo-tag-popup`. |
| [`sandbox.js`](sandbox.js) | `HOLO_TAG_DESCRIPTIONS` & `HOLO_PROJECT_STATIONS` | `710–850` | Authoritative 28-tag description map and 7-station metadata array. |
| [`sandbox.js`](sandbox.js) | `createProjectScreenTexture(st)` | `1948–2326` | Renders the `1024×640` 3D world-space canvas texture for each station. |
| [`sandbox.js`](sandbox.js) | `buildWallScreenMounts()` | `2674–3085` | Instantiates the 7 wall-mounted 3D holographic showcase frames, screens, and graffiti headers. |
| [`sandbox.js`](sandbox.js) | `updateWallScreenMounts(dt)` | `13687–13911` | Per-frame animation, hover/focus scaling, and visibility updates for all 7 wall mounts. |
| [`sandbox.js`](sandbox.js) | `syncHoloCustomScrollbar()` | `13913–13952` | Synchronizes `#holo-custom-scrollbar-thumb` size/offset with `.holo-body` scroll state. |
| [`sandbox.js`](sandbox.js) | `setActiveHoloTagPopup(tagText, st)` | `13954–14019` | Toggles interactive tag pill `.active-tag` state and populates `#holo-tag-popup`. |
| [`sandbox.js`](sandbox.js) | `updateHolographicPopupUI()` | `14021–14560` | Populates and positions `#holo-popup-window` for focused wall mounts and project stations. |
| [`sandbox.js`](sandbox.js) | `stepSimulation(dt)` | `19215–19353` | Main per-frame update and `renderer.render(scene, camera)` call. |
| [`alley_atmosphere_023.js`](alley_atmosphere_023.js) | `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC` & `GRAFFITI_STATION_HEADER_SCHEDULE` | `1048–1155` | World-space dimensions (`planeWidthMeters`, `planeHeightMeters`, `baseLocalOffsetY`) and per-station graffiti header configuration. |
| [`alley_atmosphere_023.js`](alley_atmosphere_023.js) | `updateWallMountHolographicParity(...)` | `884–1045` | Updates holographic shaders and graffiti header glitch/flicker uniforms each frame. |
| [`watercolor_shader.js`](watercolor_shader.js) | `WATERCOLOR_GALLERY_SPEC` & `PORTAL_HEADER_LOGO_SPEC` | `50–106` | Configuration for the corridor-end PlatoDoom Arcade portal position, scale, and header logo dimensions. |
| [`watercolor_shader.js`](watercolor_shader.js) | `buildWaterColorGallerySystem(ctx)` | `742–1350` | Builds the 3D PlatoDoom Arcade portal (`canvasStageGroup`, `headerLogoMesh`) and runs its per-frame `update(dt, elapsed, activeChar)` loop (lines `1204–1254`). |
| [`spray_paint_loader.js`](spray_paint_loader.js) | `resolveArcadeLogoPixelLetterIndex(u, v)` & `getLetterId(vec2 uv)` | `334–387`, `735–790` | UV-normalized (`[0,1]×[0,1]`) 14-letter segmentation for `/platodoomarcade.jpeg`. |
| [`skate3_cleanroom/loader.js`](skate3_cleanroom/loader.js) | `boot()` & `selectedCharKey` resolution | `428–570` | Resolves `?char=` or `pack.default_char` and mounts the character `.part` bundle into Emscripten `FS`. |
| [`revcdos/game.js`](revcdos/game.js) | `fetchLuisPlayerOverrideAssets()` & `applyLuisPlayerOverrides()` | `604–775` | Fetches `vcbr/luis_player/player.{dff,txd,bmp}` and overrides Tommy Vercetti across `gta3.img` and `gta3.dir`. |
| [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) | `ensure_revcdos_data`, `ensure_revcdos_vcsky`, `ensure_revcdos_luis_player` | `449–582` | Server startup asset materialization for `/revcdos/`. |

---

## 4. Assessment of Core Spec (§1–§8) vs. Addendum (§9–§15) & Required Edits

### 4.1 Core Spec (§1–§8: Screen Mount Layout & Interaction Overhaul) — ALREADY IMPLEMENTED
All 6 Core Pillars (§5.1–§5.6) were implemented in commit `3cbc659` across [`index.html`](index.html) and [`sandbox.js`](sandbox.js) and are covered by [`tests/verify_spec068_screen_mounts.mjs`](tests/verify_spec068_screen_mounts.mjs):
1. **§5.1 Header & Footer Chrome Removal:** `.holo-badge`, `.holo-coords`, `.holo-kicker`, `#holo-popup-tether`, and `.holo-footer` are removed/hidden (`display: none !important`), and `createProjectScreenTexture(st)` starts the title at `y = 66` with zero footer strip.
2. **§5.2 Top-Right `[ ✕ EXIT MOUNT ]` Relocation:** `#exit-mount-focus-btn` lives inside `.holo-top-right` in `.holo-header` (`index.html:3447–3451`) and is drawn at `(rightEdge - exitW, 48)` on the `1024×640` 3D canvas (`sandbox.js:2063–2086`).
3. **§5.3 Persistent Custom Amber Scrollbar:** `#holo-custom-scrollbar` and `#holo-custom-scrollbar-thumb` (`index.html:691–715`, `3462–3464`) are persistently rendered when focused and synchronized via `syncHoloCustomScrollbar()` (`sandbox.js:13913–13952`).
4. **§5.4 Enlarged Description Typography:** `#holo-popup-desc` uses `font-size: clamp(16.5px, 1.85vw, 19.5px)`, `line-height: 1.62` (`index.html:727–736`), and 3D canvas body copy uses `24px` font with `35px` line-height (`sandbox.js:2125–2135`).
5. **§5.5 Interactive Tag Pills (`+` Bubble & Context Popup):** All 28 tags across the 7 stations render as `<button class="holo-tag">` with `<span class="holo-tag-plus-bubble">+</span>`, backed by `HOLO_TAG_DESCRIPTIONS` (`sandbox.js:710–780`) and `setActiveHoloTagPopup()` (`sandbox.js:13954–14019`).
6. **§5.6 Compact 3-Column Metrics Summary Strip:** `.holo-metrics-grid` uses `grid-template-columns: repeat(3, minmax(0, 1fr))` with `padding: 6px 8px` (`index.html:738–764`), and `38px` compact boxes in `createProjectScreenTexture` (`sandbox.js:2143–2185`).

---

### 4.2 Addendum Pillars (§9–§15) — Gaps & Required Code Edits

#### Gap 1: §10.1 PlatoDoom Arcade Watercolor Texture Downsampling & Memory Footprint
- **Current State:**
  - `/platodoomarcade.jpeg` is `1024 × 345` (`34,997` bytes, `~1.41 MB` RGBA in GPU memory).
  - `/tags/1DOOMTAG.jpeg` is `1024 × 345` (`36,802` bytes).
  - `/assets/portal_games/platodoom_header.png` is currently `1120 × 381` (`338,782` bytes, `~1.71 MB` RGBA in GPU memory). While `1120 × 381` is within `<= 1757 × 592` (`<= 2.0 MB`), §10.1 also mentions `<= 1024 × 512` (`1024 × 345` at ~2.97:1 aspect ratio).
- **Required Edits:**
  - Downsample `/assets/portal_games/platodoom_header.png` from `1120 × 381` to `1024 × 348` (or `1024 × 345`) so that **every** PlatoDoom Arcade header/banner texture strictly satisfies both `<= 1024 × 512` and `<= 1757 × 592` (`~1.42 MB` uncompressed RGBA, well under `2.0 MB`).
  - Update `PORTAL_HEADER_LOGO_SPEC` metadata in [`watercolor_shader.js`](watercolor_shader.js#L95-L105) (`width: 1024, height: 348`) while keeping `aspectRatio: 1120 / 381` (`~2.94`) and `planeWidth: 4.55, planeHeight: 1.55` intact.

#### Gap 2: §10.2 & §15.2 Generous Proximity Pop-Out Mechanics for PlatoDoom Arcade Selection
- **Current State:**
  - In [`watercolor_shader.js`](watercolor_shader.js#L1204-L1254), `buildWaterColorGallerySystem` computes `lastPortalDistanceMeters` and sets `isPlayerNearPortal = Math.abs(metricZ) <= 4.50`, but `canvasStageGroup` remains at fixed `anchorPosition` (`z: 42.0129`) and fixed scale (`5.0, 5.0, 1.0`). There is no proximity pop-out animation, no hysteresis state machine (`R_pop >= 6.5m`, `R_release = 7.5m`), and no raycast hitbox expansion when popped out.
- **Required Edits:**
  - **File:** [`watercolor_shader.js`](watercolor_shader.js) (`WATERCOLOR_GALLERY_SPEC` around lines `50–106` and `buildWaterColorGallerySystem` around lines `780–1340`):
    - Add proximity pop-out parameters to `WATERCOLOR_GALLERY_SPEC`:
      - `popOutTriggerRadiusMeters: 6.8` (satisfies $R_{\text{pop}} \ge 6.5\text{ m}$, triggers by $z \ge 35.2\text{ m}$ as the player approaches $z = 42.0129\text{ m}$).
      - `popOutReleaseRadiusMeters: 7.5` ($R_{\text{release}} = 7.5\text{ m}$ hysteresis buffer so standing near the boundary never oscillates).
      - `popOutScaleMultiplier: 1.45` (within $[1.35\times, 1.60\times]$).
      - `popOutForwardOffsetMeters: 0.35` (within $[+0.25\text{ m}, +0.45\text{ m}]$ toward the approaching player, i.e. $-0.35\text{ m}$ in world $Z$ from `42.0129` toward the corridor interior, or $+0.35\text{ m}$ along the portal's outward-facing normal).
      - `popOutTransitionDurationSec: 0.38` ($\tau \approx 380\text{ ms} \in [320\text{ ms}, 450\text{ ms}]$).
    - Maintain `isPoppedOut` boolean state (with hysteresis: transitions `false -> true` when `dist3D <= 6.8` or `Math.abs(metricZ) <= 6.8`, and `true -> false` only when `dist3D > 7.5` and `Math.abs(metricZ) > 7.5`), `popOutProgress` ($0 \to 1$), and cubic-eased `popOutFactor`.
    - Apply `popOutFactor` to `canvasStageGroup.scale` (or `headerLogoMesh` / portal showcase group) and forward normal translation (`canvasStageGroup.position.z = anchorPosition.z - popOutForwardOffsetMeters * popOutFactor`), elevate emissive rim glow / border intensity when popped out, and expand the interactive click/raycast bounding region to match the popped-out transform.
    - Expose telemetry getters on `sandbox.waterColor.getState()` (`isPoppedOut`, `popOutProgress`, `popOutScaleMultiplier`, `popOutForwardOffsetMeters`, `popOutTriggerRadiusMeters`, `popOutReleaseRadiusMeters`, `currentWorldScale`, `currentWorldPosition`) for runtime verification.
  - **File:** [`sandbox.js`](sandbox.js) (around lines `14530–14585` and `16595–16660`):
    - Ensure proximity prompt / interaction check and raycast targeting respect the generous $R_{\text{pop}} \ge 6.5\text{ m}$ threshold and popped-out mesh bounds.

#### Gap 3: §11.1 & §15.3 Skate 3 Cleanroom (`/skate3_cleanroom/`) Default Skater Rig & Torus Eradication
- **Current State:**
  - In [`skate3_cleanroom/pack.json`](skate3_cleanroom/pack.json#L60), `"default_char"` is set to `"nicotest"` instead of `"luis"`. Navigating directly to `/skate3_cleanroom/` (without `?char=luis`) loads `parts/char_nicotest.part` instead of `parts/char_luis.part`.
  - Furthermore, `skate3_cleanroom/parts/char_luis_holo.part` (37-byte header + embedded GLB) contains the 5 mesh primitives (including the 3 skateboard mesh primitives `Retail_SkateBoard`, `Truck`, `Wheel`) plus node 37 `SkateAlley_Holo_Visualizer` / mesh 1 `Torus`, whereas `skate3_cleanroom/parts/char_luis.part` (`4,132,352` bytes) has the `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, `RIGHT_WHEELFRONT` joints but only 2 character mesh primitives.
- **Required Edits:**
  - **File:** [`skate3_cleanroom/pack.json`](skate3_cleanroom/pack.json#L60) & `skate3_cleanroom/parts/char_luis.part`:
    - Change `"default_char": "nicotest"` to `"default_char": "luis"` in `skate3_cleanroom/pack.json` (and update its `size` metadata).
    - Rebuild `skate3_cleanroom/parts/char_luis.part` (and `char_luis_holo.part`) by unpacking `char_luis_holo.part` (37-byte header `SKATE3_PART_V1\n` + GLB), stripping the `SkateAlley_Holo_Visualizer` node and `Torus` mesh while preserving the character meshes + `Retail_SkateBoard`, `Truck`, and `Wheel` primitives, and repacking with the 37-byte header (`scripts/rig_skate3_character.py` can also be updated/re-run with `--no-holo`).
  - **File:** [`skate3_cleanroom/loader.js`](skate3_cleanroom/loader.js#L430-L470):
    - Default `selectedCharKey` to `'luis'` whenever `?char=` is omitted or set to `'luis_holo'`, and expose `window.__SKATE3_CLEANROOM_STATUS__` (or `window.skate3CleanroomStatus`) reporting `{ selectedCharKey: 'luis', charPartPath, torusNodesPresent: false, skateboardRootPresent: true }` for deterministic runtime telemetry.

#### Gap 4: §11.2 & §15.4 GTA Vice City (`/revcdos/`) Deterministic Luis Player Spawning
- **Current State:**
  - In Git `HEAD`, `revcdos/game.js` (`fetchLuisPlayerOverrideAssets` and `applyLuisPlayerOverrides`) and `revcdos/modules/loader.js` already mount `vcbr/luis_player/player.dff`, `player.txd`, and `player.bmp` by default (`window.__REVCDOS_STATUS__.luisPlayerMounted = true`).
  - **Root-Cause Failure in Sparse Worktrees:** `.git/info/sparse-checkout` has `!/revcdos/`, so `revcdos/index.html`, `revcdos/game.js`, `revcdos/modules/loader.js`, and `revcdos/vcbr/luis_player/player.{dff,txd,bmp}` are missing from the worktree filesystem! Unlike `ensure_tkdr_assets`, `ensure_melee_assets`, and `ensure_mkd_assets`, `ensure_revcdos_data` and `ensure_revcdos_luis_player` in [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py#L449-L582) do **not** link/copy the `revcdos/` web runtime and `vcbr/luis_player/` files from `/Users/diesel/Desktop/SkateAlley/revcdos` into the active worktree.
  - Additionally, in `revcdos/game.js`, `window.__REVCDOS_STATUS__.luisPlayerMounted` is only set to `true` inside `mainCalled()` after the entire `54 MB` `.data` archive finishes downloading and compiling WASM, which can take several seconds or require clicking `.click-to-play`.
- **Required Edits:**
  - **File:** [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py#L449-L582):
    - Update `ensure_revcdos_data` / `ensure_revcdos_luis_player` (or add `ensure_revcdos_assets`) to link/copy all required `revcdos/` runtime files (`index.html`, `game.js`, `index.js`, `index.wasm`, `pack.json`, `game.mp4`, `resolve_vcsky_cache.py`, `modules/loader.js`, `vcbr/luis_player/player.dff`, `vcbr/luis_player/player.txd`, `vcbr/luis_player/player.bmp`, `vcbr/luis_player/fronten1.txd`, `vcbr/vc-sky-en-v6.data`, `parts/*`) from `/Users/diesel/Desktop/SkateAlley/revcdos` (with fallback to `git show HEAD:revcdos/...` if absent) into the active worktree on server startup.
  - **File:** `revcdos/game.js` (once materialized in worktree):
    - Pre-fetch and validate `vcbr/luis_player/player.dff`, `player.txd`, and `player.bmp` immediately on page load (as well as during `loadGame`/`mainCalled`) and support `?autostart=1` so that navigating to `/revcdos/` deterministically verifies and mounts the Luis player assets (`window.__REVCDOS_STATUS__.luisAssetsVerified = true`, `window.__REVCDOS_STATUS__.luisPlayerMounted = true` once FS mounts or pre-verified when `stock_player !== "1"`).

#### Gap 5: §12 & §15.5 Authentic CRT Screen Post-Processing Optical Pass
- **Current State:**
  - Neither [`index.html`](index.html) nor [`sandbox.js`](sandbox.js) implements a full-screen CRT optical pass.
- **Required Edits:**
  - **Files:** [`index.html`](index.html) and [`sandbox.js`](sandbox.js):
    - Implement an authentic full-screen CRT optical post-processing layer (can combine a GPU WebGL post-process / shader overlay or composite optical pass over the viewport with `pointer-events: none` so 2D/3D raycasting and `#holo-popup-window` interactions remain 100% unobstructed, AND/OR a WebGL post-processing pass in `sandbox.js`) that provides all 5 optical components required by §12.1:
      1. **Horizontal Scanline Raster:** Sinusoidal/triangle wave modulation across screen-space $Y$ (`1.0–2.0 px` pitch, `12%–22%` opacity modulation).
      2. **Phosphor RGB Subpixel Mask (Aperture Grille / Shadow Mask):** Subtle RGB triad chromatic modulation across screen-space $X$ (`<= 0.75 px` chromatic aberration at outer 15% screen edges, `0.0 px` in central 70% reading zone).
      3. **Subtle Barrel Curvature & Corner Vignetting:** Radial barrel distortion (`k1 = 0.018 <= 0.025`, i.e. `<= 2.5%`) with darkened CRT bezel corners and soft inner phosphor reflection.
      4. **Phosphor Bloom & Halation:** Soft luminance bleed on high-intensity amber (`#ffaa22`) and cyan (`#44ddff`) elements onto adjacent scanlines.
      5. **Temporal Refresh Hum:** Ultra-subtle `60 Hz` scanline phase roll (`<= 2%` luminance delta).
    - Expose runtime telemetry API on `window.sandbox.getCRTOpticalPassState()` (and `window.sandbox.crtPass`) returning `{ enabled: true, scanlinesActive: true, phosphorMaskActive: true, barrelDistortionK1: 0.018, vignetteActive: true, phosphorBloomActive: true, temporalRefreshHumAmplitude: 0.015, centerChromaticOffsetPx: 0, edgeChromaticOffsetPx: 0.65, pointerEventsBlocked: false }` so §15.5 verification can inspect both live DOM/shader uniforms and optical state.

#### Gap 6: §13 & §15.6 Environmental Sky Port: Pitch-Black Deep Space Void (`#000000`)
- **Current State:**
  - In [`sandbox.js`](sandbox.js#L1681), `scene.background` is currently `new THREE.Color(0x080401)` (`#080401`), which violates §13.1 (*"Any remaining legacy slate-blue, dark umber (`#080401`), or simulated daylight ambient background in the overhead sky port must be zeroed out"*).
  - In [`sandbox.js`](sandbox.js#L1682), `DEPTH_FOG_COLOR_HEX` is `0x0b0501`, which tints distant overhead background pixels above the alley walls to `{11, 5, 1}` instead of pure `#000000`.
- **Required Edits:**
  - **File:** [`sandbox.js`](sandbox.js#L1680-L1715):
    - Set `scene.background = new THREE.Color(0x000000);` (`#000000`, RGB `{0, 0, 0}`).
    - Set `DEPTH_FOG_COLOR_HEX = 0x000000;` (so exponential fog blends into pure pitch-black void `#000000` overhead while low-altitude ground fog `buildLowAltitudeGroundFog` at `y = 0.04m–0.58m` retains its warm amber scattering near the floor).
    - Explicitly call `renderer.setClearColor(0x000000, 1.0);` when initializing `renderer`.
    - Add an overhead pitch-black sky port void plane/dome or ensure any upward-looking camera ray above the alley walls samples pure `#000000` (`R <= 2, G <= 2, B <= 2`) without dimming local point/spot lights or ground fog below $y = 4.0\text{ m}$.

#### Gap 7: §14 & §15.7 Imposing World-Space Hologram Scale & Proportional Graffiti Lettering (`>= 3.4m`)
- **Current State:**
  - In [`sandbox.js`](sandbox.js#L2679-L2680), `buildWallScreenMounts()` sets `const screenWidth = 1.60; const screenHeight = 0.98;`.
  - In [`alley_atmosphere_023.js`](alley_atmosphere_023.js#L1050-L1052), `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC` sets `planeWidthMeters: 2.32`, `planeHeightMeters: 0.725`, `baseLocalOffsetY: 0.84`.
  - Both are well below the §14.1, §14.2, and §15.7 requirement that the world-space holographic portfolio showcases and their paired cyber-drip graffiti header meshes measure **$\ge 3.4\text{ m}$ in width**.
- **Required Edits:**
  - **File:** [`sandbox.js`](sandbox.js#L2674-L2950) (`buildWallScreenMounts` & `updateWallScreenMounts`):
    - Increase `screenWidth` from `1.60` to **`3.52`** ($\ge 3.4\text{ m}$, within the $3.4\text{ m} - 3.8\text{ m}$ architectural range) and `screenHeight` from `0.98` to **`2.16`** (preserving the ~16:10 aspect ratio).
    - Adjust station mount elevation (`st.y + 0.45` or appropriate vertical clearance so the bottom edge of the $2.16\text{ m}$ tall frame clears the alley floor cleanly) and add a subtle downward viewing pitch ($\approx 4^\circ - 8^\circ$, e.g. `0.09 rad` around local X) toward the player's eye level ($y \approx 1.6\text{ m}$).
  - **File:** [`alley_atmosphere_023.js`](alley_atmosphere_023.js#L1048-L1155) (`GRAFFITI_HEADER_GLITCH_FLICKER_SPEC` & `updateWallMountHolographicParity`):
    - Increase `planeWidthMeters` from `2.32` to **`3.84`** ($\ge 3.6\text{ m} - 4.2\text{ m}$, matching/exceeding the $3.52\text{ m}$ showcase width and satisfying $\ge 3.4\text{ m}$).
    - Increase `planeHeightMeters` proportionally from `0.725` to **`1.20`** ($0.95\text{ m} - 1.35\text{ m}$ range).
    - Increase `baseLocalOffsetY` from `0.84` to **`1.78`** (so the bottom edge of the $1.20\text{ m}$ tall graffiti header at $1.78 - 0.60 = 1.18\text{ m}$ sits cleanly above the top edge of the $2.16\text{ m}$ tall showcase frame at $1.08 + 0.07 = 1.15\text{ m}$ with zero vertical overlap or clipping!).
    - Note: In `sandbox.js:2850–2870`, check the fallback `graffitiHeaderMesh` creation dimensions (`PlaneGeometry(3.84, 1.20)` and `position.set(0, screenHeight * 0.5 + 0.70, 0.055)`) so both `sandbox.js` initial creation and `alley_atmosphere_023.js` runtime parity updates agree on the exact $3.84\text{ m} \times 1.20\text{ m}$ dimensions and `1.78m` vertical offset.
