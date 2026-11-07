# Refined Technical Specification — `functional_specification_068.md` & System Addendum

- **Run ID:** `20261107T172758-750-iwl9`
- **Branch:** `agent/plan-20261107T172758-750-iwl9`
- **Authoritative Seed Specification:** [`handoff/authored.txt`](handoff/authored.txt) $\rightarrow$ [`functional_specification_068.md`](functional_specification_068.md) (Core Pillars §1–§8 & Addendum Pillars §9–§15)
- **Authoritative Domain Vocabulary:** [`LANGUAGE.md`](LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)
- **Synthesized Scanner Inputs:**
  - `codebase-mapper` (`seq=#5`): [`wayfinder/20261107T172758-750-iwl9/codebase-map.md`](wayfinder/20261107T172758-750-iwl9/codebase-map.md)
  - `api-schema-mapper` (`seq=#2`): [`wayfinder/20261107T172758-750-iwl9/api-schemas.md`](wayfinder/20261107T172758-750-iwl9/api-schemas.md)
  - `mcp-provisioner` (`seq=#3`): [`wayfinder/20261107T172758-750-iwl9/mcp-tools.md`](wayfinder/20261107T172758-750-iwl9/mcp-tools.md)
  - `library-installer` (`seq=#1`): [`wayfinder/20261107T172758-750-iwl9/installed-libraries.md`](wayfinder/20261107T172758-750-iwl9/installed-libraries.md)
  - `function-mapper` (`seq=#4`): [`wayfinder/20261107T172758-750-iwl9/library-functions.md`](wayfinder/20261107T172758-750-iwl9/library-functions.md)

---

## 1. Objective & Implementation Targets (`functional_specification_068.md` Core §1–§8 + Addendum §9–§15)

### 1.1 System Purpose & Scope
This specification locks the exact technical contracts, codebase edit targets, binary data formats, mathematical invariants, and live runtime verification gates for **Functional Specification 068** and its **System Addendum** across the Freeman Alley 3D interactive portfolio (`SkateAlley`).

> **Note on Validation Remediation Context:** This run (`20261107T172758-750-iwl9`) is an initial planning and execution run (`wayfinder/20261107T172758-750-iwl9/validation-remediation-spec.md` and `handoff/20261107T172758-750-iwl9/prior-iteration/*.txt` are not present). However, live empirical scanning by the 5 Blackboard scanners identified the exact division between already-implemented Core Spec pillars (§1–§8) that must be preserved and regression-verified, and the 7 unimplemented Addendum gaps (§9–§15) that must be engineered and verified.

### 1.2 Core Spec Pillars (§1–§8) — Preservation & Regression Verification Targets
The 6 Core Screen Mount Pillars (§5.1–§5.6) are implemented in [`index.html`](index.html) and [`sandbox.js`](sandbox.js) and verified by [`tests/verify_spec068_screen_mounts.mjs`](tests/verify_spec068_screen_mounts.mjs). All downstream edits must preserve 100% of these invariants:
1. **Pillar 1 — Header Telemetry Removal & Top-Right Exit Control Relocation (§5.1):**
   - `.holo-badge` / `#holo-station-badge`, `#holo-coords-label`, `#holo-tether-bridge`, and `#holo-kicker` are absent/hidden (`display: none !important`) in `#holo-popup-window` and omitted from `createProjectScreenTexture(st)` in [`sandbox.js`](sandbox.js).
   - `#exit-mount-focus-btn` is anchored in `.holo-top-right` inside `.holo-top-bar` (`align-self: flex-start; margin-left: auto; min-width: 44px; min-height: 36px`), separated from `#holo-title` by $\ge 8\text{ px}$ (`exitRect.left >= titleRect.right + 8`), and drawn in the top-right slot (`rightEdge = 1224, topY = 48`) on the 3D screen mount canvas.
2. **Pillar 2 — Complete Footer Chrome Removal (§5.2):**
   - `.holo-footer-bar`, `#holo-footer-status`, `#holo-prev-mount-btn`, `#holo-station-pips`, and `#holo-next-mount-btn` are hidden (`display: none !important`) in 2D DOM and omitted from the 3D `CanvasTexture`.
3. **Pillar 3 — Persistent, Immediately Visible Amber-Themed Scrollbar (§5.3):**
   - Single authoritative scroll container `.holo-body-grid` (or `#holo-body-scroll-viewport`) inside `.holo-body-scroll-shell` paired with `#holo-custom-scrollbar` (`.holo-scrollbar-track`) and `#holo-custom-scrollbar-thumb` (`.holo-scrollbar-thumb`).
   - Immediately visible at $t = 0\text{ ms}$ on mount open (`opacity === "1"`, `visibility === "visible"`) across mobile (`375×667`, `390×844`) and desktop (`1280×800`) viewports, synchronized via `syncHoloCustomScrollbar()` in [`sandbox.js`](sandbox.js).
4. **Pillar 4 — Enlarged Description & Narrative Typography (§5.4):**
   - 2D `#holo-description` uses `font-size: clamp(16.5px, 1.85vw, 19.5px)`, `line-height: 1.58–1.64` ($\ge 16.5\text{ px}$ on `375px` mobile, $\ge 18.5\text{ px}$ on `1280px` desktop).
   - Station `04` (`SCREEN_MOUNT_07`) `#holo-narrative-heading` (`"What the hell does this mean, Luis?"`) uses `clamp(15.5px, 1.65vw, 18px)` and `#holo-narrative-body` uses `clamp(15.5px, 1.65vw, 17.5px)`.
   - 3D `createProjectScreenTexture(st)` description text uses `24px` font (`lineHeight = 35px`) on the `1280 × 784` logical grid (`1024 × 627` texture).
5. **Pillar 5 — Interactive Clickable Tags with Visible `"+"` Bubbles, Click Animation & 28-Tag Pop-Ups (§5.5):**
   - All 28 tags across Stations `01`–`07` (`4` tags per station) render as `<button type="button" class="holo-tag">` containing `.holo-tag-label` and `.holo-tag-plus-bubble` (`+`), and draw circular `+` badges on the 3D `CanvasTexture`.
   - Clicking a tag invokes `setActiveHoloTagPopup()`, pulses `.holo-tag.active`, rotates `.holo-tag-plus-bubble` by `45deg`, and opens `#holo-tag-popup` (`#holo-tag-popup-title`, `#holo-tag-popup-close-btn`, `#holo-tag-popup-desc`) hydrated from `HOLO_TAG_DESCRIPTIONS`.
6. **Pillar 6 — Screen-Size-Agnostic, Compact 3-Column Summary Cards & Zero Needless Mobile Scroll (§5.6):**
   - `.holo-metrics-grid` renders 3 `.holo-metric-box` items in a single horizontal row (`grid-template-columns: repeat(3, minmax(0, 1fr))`, horizontal gap $\ge 8\text{ px}$, single-line labels).
   - Opening standard-length stations (`01`, `02`, `03`, `05`, `06`, `07`) on `390 × 844` and `375 × 667` mobile viewports with no tag pop-up expanded produces `scrollContainer.scrollHeight <= scrollContainer.clientHeight` (`0 px` vertical overflow).

---

### 1.3 Addendum Pillars (§9–§15) — Required Functional Gaps & Exact File Targets
The 5 scanners identified **7 concrete functional gaps** across the codebase for Addendum §9–§15 that must be implemented:

| Addendum Pillar & Spec Section | Observed Baseline Gap in Codebase | Target Files & Required Engineering Remediation |
| :--- | :--- | :--- |
| **Addendum Gap 1: PlatoDoom Arcade Watercolor Texture Downsampling (§10.1 & §15.1)** | `/platodoomarcade.jpeg` is `1024 × 345` (`34,997 B`, `1.41 MB` RGBA) and `/tags/1DOOMTAG.jpeg` is `1024 × 345` (`36,802 B`), both within budget. However, `/assets/portal_games/platodoom_header.png` used on `headerLogoMesh` in [`watercolor_shader.js`](watercolor_shader.js#L95-L105) is `1120 × 381` (`338,782 B`, exceeding the `1024 × 512` POT tier and `120 KB` compressed guidance). | 1. Downsample `/assets/portal_games/platodoom_header.png` from `1120 × 381` to `1024 × 348` (`<= 1024 × 512` and `<= 1757 × 592`, uncompressed RGBA `1.42 MB <= 2.0 MB`, preserving crisp alpha edges and aspect ratio `~2.94:1`), and optionally generate a WebP tier `<= 120 KB`.<br/>2. Update `PORTAL_HEADER_LOGO_SPEC` metadata in [`watercolor_shader.js`](watercolor_shader.js#L95-L105) (`width: 1024, height: 348`) while preserving UV/aspect boundaries in [`spray_paint_loader.js`](spray_paint_loader.js) (`D`, `O1`, `O2`, `M`, `ARCADE`). |
| **Addendum Gap 2: Generous Proximity Pop-Out for PlatoDoom Arcade Selection (§10.2 & §15.2)** | In [`watercolor_shader.js`](watercolor_shader.js#L1204-L1254), `buildWaterColorGallerySystem` computes `lastPortalDistanceMeters` and sets `isPlayerNearPortal = Math.abs(metricZ) <= 4.50`, but `canvasStageGroup` stays static at `z = 42.0129` and fixed scale `(5.0, 5.0, 1.0)`. No hysteresis pop-out state machine, forward normal relief, or scale amplification exists. | 1. In [`watercolor_shader.js`](watercolor_shader.js) (`WATERCOLOR_GALLERY_SPEC` & `buildWaterColorGallerySystem.update`), implement the proximity pop-out state machine with trigger threshold $R_{\text{pop}} = 6.8\text{ m}$ ($\ge 6.5\text{ m}$), release threshold $R_{\text{release}} = 7.5\text{ m}$ ($1.0\text{ m}$ hysteresis), scale multiplier `1.45` ($\in [1.35\times, 1.60\times]$), forward normal relief `+0.35 m` ($\in [+0.25\text{ m}, +0.45\text{ m}]$, i.e. $z = 42.0129 - 0.35 \cdot \text{popOutFactor}$ toward the approaching player), and cubic easing ($\tau = 380\text{ ms} \in [320\text{ ms}, 450\text{ ms}]$).<br/>2. Update [`sandbox.js`](sandbox.js) portal interaction proximity check to match $R_{\text{pop}} \ge 6.5\text{ m}$ and expose pop-out telemetry on `window.sandbox.waterColor.getState()`. |
| **Addendum Gap 3: Skate 3 Cleanroom Spawning Rig Enforcement — `Luis` with Skateboard & Zero Torus (§11.1 & §15.3)** | 1. [`skate3_cleanroom/pack.json`](skate3_cleanroom/pack.json#L60) has `"default_char": "nicotest"` instead of `"luis"`.<br/>2. `skate3_cleanroom/parts/char_luis.part` (`5,652,217 B`) has only 2 character primitives (`LUIS_Body_Material`, `LUIS_Head_Material`) and is **missing** the 3 skateboard primitives (`Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`).<br/>3. `skate3_cleanroom/parts/char_luis_holo.part` (`9,641,573 B`) has the 3 skateboard primitives + 6 board textures, but also contains unwanted `node 37 ("SkateAlley_Holo_Visualizer")` / `Mesh 1 ("Torus")`. | 1. Build a clean `skate3_cleanroom/parts/char_luis.part` (and `char_luis_holo.part`) by taking the 37-byte header (`SKATE3_PART_V1` / `assets/private/skater.glb` length prefix) + GLB from `char_luis_holo.part`, stripping `node 37 ("SkateAlley_Holo_Visualizer")`, `Mesh 1 ("Torus")`, and `HOLOSYS_Visualizer_Holo_Material`, while retaining the rigged `Luis` character ($1.8000\text{ m}$, `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheel joints) AND all 3 skateboard primitives (`Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`) + textures.<br/>2. Update [`skate3_cleanroom/pack.json`](skate3_cleanroom/pack.json) with `"default_char": "luis"`, and update `size` (`90,631,134 + len(part_payload)`) and `hash` (`sha256[:16]`) on `pack.core`, `pack.characters.luis`, and `pack.characters.luis_holo`.<br/>3. Update [`skate3_cleanroom/loader.js`](skate3_cleanroom/loader.js) to default `selectedCharKey` to `'luis'` and expose `window.__SKATE3_CLEANROOM_STATUS__`. |
| **Addendum Gap 4: GTA Vice City (`/revcdos/`) Deterministic `Luis` Player Spawning (§11.2 & §15.4)** | 1. In Sandcastle git worktrees, `revcdos/*` has `skip-worktree` / sparse-checkout exclusion (`!/revcdos/`), and [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py#L449-L582) (`ensure_revcdos_data`, `ensure_revcdos_luis_player`) does not link/copy the base `revcdos/` web runtime and `vcbr/luis_player/*` files from `/Users/diesel/Desktop/SkateAlley/revcdos` into the worktree.<br/>2. When navigating directly to `/revcdos/`, `window.__REVCDOS_STATUS__.luisPlayerMounted` must deterministically become `true` on startup without requiring URL flags or manual clicks. | 1. Update [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) (`ensure_revcdos_data` / `ensure_revcdos_luis_player`) to materialize/symlink all tracked `revcdos/` files (`index.html`, `game.js`, `index.js`, `index.wasm`, `pack.json`, `modules/loader.js`, `vcbr/luis_player/player.{dff,txd,bmp}`, `vcbr/luis_player/fronten1.txd`, `vcbr/vc-sky-en-v6.data`, `parts/*`) from `/Users/diesel/Desktop/SkateAlley/revcdos` (or `git show HEAD:revcdos/...`) into the active worktree.<br/>2. Update [`revcdos/game.js`](revcdos/game.js) so startup eagerly fetches and verifies `vcbr/luis_player/player.dff` (`292,864 B`), `player.txd` (`45,056 B`), and `player.bmp` (`66,612 B`), mounts them into `Module.FS` (`/vc-assets/local/models/gta3.img/player.dff`, `player.txd`, `csplay.dff`, `csplay.txd`, `/vc-assets/local/models/generic/player.bmp`), and sets `window.__REVCDOS_STATUS__.luisPlayerMounted = true` on startup. |
| **Addendum Gap 5: Screen CRT Post-Processing Optical Pass (§12 & §15.5)** | [`sandbox.js`](sandbox.js#L19349) calls `renderer.render(scene, camera)` directly with no screen-space CRT post-processing pass. | 1. Implement a hardware-accelerated full-screen CRT post-processing stage in [`sandbox.js`](sandbox.js) (using Three.js `EffectComposer` + `RenderPass` + `ShaderPass(CRTShader)` and/or synchronized GPU-composited CRT optical overlay in [`index.html`](index.html) with `pointer-events: none`).<br/>2. Provide horizontal scanlines ($I_{\text{scan}} \in [0.12, 0.22]$), RGB phosphor triad / aperture grille mask, subtle barrel curvature ($k_1 \le 0.025$, i.e. $\le 2.5\%$), corner vignetting + highlight bloom bleed, and subtle refresh modulation ($< 1.5\%$), executing within $\le 0.8\text{ ms}$ GPU time per frame at capped `1.25` DPR.<br/>3. Expose `window.sandbox.crtPass` and `window.sandbox.getCRTOpticalPassState()`. |
| **Addendum Gap 6: Environmental Sky Port — Pitch-Black Deep Space Void (§13 & §15.6)** | [`sandbox.js`](sandbox.js#L1681-L1682) sets `scene.background = new THREE.Color(0x080401)` (`#080401` warm umber) and `DEPTH_FOG_COLOR_HEX = 0x0b0501`, violating the pure pitch-black `#000000` requirement. | 1. In [`sandbox.js`](sandbox.js#L1680-L1715), set `scene.background = new THREE.Color(0x000000)`, `DEPTH_FOG_COLOR_HEX = 0x000000`, and `renderer.setClearColor(0x000000, 1.0)`.<br/>2. Ensure any sky port / ceiling void mesh material is strictly `#000000` (`0x000000`) while keeping low-altitude floor fog (`buildLowAltitudeGroundFog`) anchored to $Y \le 1.8\text{ m}$. |
| **Addendum Gap 7: Large-Scale Holographic Portfolio Showcases & Proportional Cyber-Drip Graffiti Lettering (§14 & §15.7)** | [`sandbox.js`](sandbox.js#L2679-L2680) sets `screenWidth = 1.60`, `screenHeight = 0.98`, and [`alley_atmosphere_023.js`](alley_atmosphere_023.js#L1050-L1052) sets `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters = 2.32`, `planeHeightMeters = 0.725`, `baseLocalOffsetY = 0.84` (both $< 3.4\text{ m}$). | 1. In [`sandbox.js`](sandbox.js#L2674-L2950) (`buildWallScreenMounts` & `updateWallScreenMounts`), scale `screenWidth` to **`3.52` m** ($\ge 3.4\text{ m}$, within $[3.4\text{ m}, 3.8\text{ m}]$) and `screenHeight` to **`2.16` m**, elevate the mount center so the bottom frame clears the floor, and apply a slight downward pitch ($\approx 0.08\text{ rad}$) toward the player's eyeline.<br/>2. In [`alley_atmosphere_023.js`](alley_atmosphere_023.js#L1048-L1155) (`GRAFFITI_HEADER_GLITCH_FLICKER_SPEC`) and [`sandbox.js`](sandbox.js#L2850-L2870), scale `planeWidthMeters` to **`3.84` m** ($\ge 3.6\text{ m}$, within $[3.6\text{ m}, 4.2\text{ m}]$), `planeHeightMeters` to **`1.20` m**, and `baseLocalOffsetY` to **`1.78` m** so the header floats cleanly above the enlarged $2.16\text{ m}$ tall showcase without overlap. |

---

## 2. Workspace Shape & Existing Code to Reuse (`codebase-mapper`)

Do not create duplicate scene controllers, redundant HTML modals, or parallel HTTP servers. Reuse and extend the authoritative modules below:

| File | Existing Symbols / Functions to Reuse & Extend | Lines | Role in Spec 068 & Addendum |
| :--- | :--- | :--- | :--- |
| [`index.html`](index.html) | `#holo-popup-window`, `.holo-top-bar`, `.holo-top-right`, `#exit-mount-focus-btn`, `.holo-body-scroll-shell`, `#holo-custom-scrollbar`, `#holo-custom-scrollbar-thumb`, `.holo-metrics-grid`, `#holo-tags`, `#holo-tag-popup` | `574–907`, `3438–3476` | 2D focused holographic terminal overlay, persistent amber scrollbar, interactive tag pills, compact 3-column summary cards, and optional CRT optical overlay layer (`pointer-events: none`). |
| [`sandbox.js`](sandbox.js) | `HOLO_TAG_DESCRIPTIONS`, `HOLO_PROJECT_STATIONS` | `710–850` | Authoritative 28-tag curated description map and 7-station configuration array (`SCREEN_MOUNT_01..07`). |
| [`sandbox.js`](sandbox.js) | `scene.background`, `DEPTH_FOG_COLOR_HEX`, `renderer` initialization | `1676–1720` | Pitch-black sky port clear color (`0x000000`) and scene background configuration (§13). |
| [`sandbox.js`](sandbox.js) | `createProjectScreenTexture(st)` | `1948–2326` | Renders the `1024 × 627` (`1280 × 784` logical) 3D `CanvasTexture` per station with top-right `✕ EXIT` pill, `24px` description copy, `+` bubble tags, and compact summary strip. |
| [`sandbox.js`](sandbox.js) | `buildWallScreenMounts()` & `updateWallScreenMounts(dt)` | `2674–3085`, `13687–13911` | Builds and updates `SCREEN_MOUNT_01..07` in 3D world space; update `screenWidth` (`3.52 m`), `screenHeight` (`2.16 m`), mount elevation, downward viewing tilt, and initial `graffitiHeaderMesh` geometry (`3.84 m × 1.20 m` at `y = 1.78 m`) (§14). |
| [`sandbox.js`](sandbox.js) | `syncHoloCustomScrollbar()`, `setActiveHoloTagPopup()`, `updateHolographicPopupUI()`, `focusWallMount()`, `exitWallMountFocus()` | `13913–14560` | 2D modal hydration, $t = 0\text{ ms}$ custom scrollbar sync, and 28-tag pop-up state machine (§5.1–§5.6). |
| [`sandbox.js`](sandbox.js) | `stepSimulation(dt)` & `renderer.render(scene, camera)` | `19215–19353` | Main simulation and render loop; integrate the full-screen CRT post-processing pass (`EffectComposer` / `ShaderPass(CRTShader)`) and expose `window.sandbox.getCRTOpticalPassState()` (§12). |
| [`alley_atmosphere_023.js`](alley_atmosphere_023.js) | `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC`, `GRAFFITI_STATION_HEADER_SCHEDULE`, `updateWallMountHolographicParity()` | `884–1155` | Update `planeWidthMeters: 3.84`, `planeHeightMeters: 1.20`, `baseLocalOffsetY: 1.78` so all 7 station graffiti headers scale in 1:1 proportion with the enlarged showcases (§14.2). |
| [`watercolor_shader.js`](watercolor_shader.js) | `WATERCOLOR_GALLERY_SPEC`, `PORTAL_HEADER_LOGO_SPEC`, `buildWaterColorGallerySystem(ctx)` | `50–106`, `742–1350` | Update `PORTAL_HEADER_LOGO_SPEC` (`1024 × 348`) and add proximity pop-out kinematics ($R_{\text{pop}} = 6.8\text{ m} \ge 6.5\text{ m}$, $R_{\text{release}} = 7.5\text{ m}$, scale `1.45×`, forward normal offset `+0.35 m`, $\tau = 380\text{ ms}$) to `buildWaterColorGallerySystem` (§10.1–§10.2). |
| [`skate3_cleanroom/pack.json`](skate3_cleanroom/pack.json) & [`skate3_cleanroom/loader.js`](skate3_cleanroom/loader.js) | `pack.default_char`, `pack.characters.luis`, `boot()` | `pack.json:1–67`, `loader.js:428–570` | Set `"default_char": "luis"`, update byte size and SHA-256 hash for `parts/char_luis.part` (with 3 skateboard primitives spliced in and `Torus` / `SkateAlley_Holo_Visualizer` stripped), and expose `window.__SKATE3_CLEANROOM_STATUS__` (§11.1). |
| [`revcdos/game.js`](revcdos/game.js) & [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) | `fetchLuisPlayerOverrideAssets()`, `Module.applyLuisPlayerOverrides()`, `ensure_revcdos_data()`, `ensure_revcdos_luis_player()` | `game.js:604–775`, `serve_skatealley.py:449–582` | Materialize `revcdos/` runtime & `vcbr/luis_player/*` in sparse worktrees and ensure `/revcdos/` mounts `player.dff`, `player.txd`, `player.bmp` with `window.__REVCDOS_STATUS__.luisPlayerMounted === true` on startup (§11.2). |

---

## 3. External Connections, Assets & Data Structures (`api-schema-mapper`)

### 3.1 Local HTTP Server & PostgreSQL Persistence (`scripts/serve_skatealley.py`)
- **HTTP Server Entrypoint:** `python3 scripts/serve_skatealley.py --host 127.0.0.1 --port 8080` (or default `--port 3002`). Supports `HTTP 206 Partial Content` byte-range streaming, `/api/health`, `/api/scene-layout`, and `/api/stickers`.
- **PostgreSQL Persistence DSN:** `postgresql://user:pass@127.0.0.1:5432/alpha` (tables: `skatealley_scene_layouts` with 6 active keys, `skatealley_placed_stickers` with 1 active row).
- **Sandcastle Worktree Sparse-Checkout Requirement:**
  In Sandcastle worktrees, `character_hoodie.glb` and `revcdos/` are excluded by default in `.git/info/sparse-checkout` / `skip-worktree`. Both `scripts/serve_skatealley.py` startup hooks AND worktree setup (`git sparse-checkout add character_hoodie.glb revcdos`) must ensure `character_hoodie.glb` and `revcdos/**` exist on disk so `/` and `/revcdos/` never return HTTP 404.

### 3.2 Authoritative 7-Station & 28-Tag Schema (`HOLO_PROJECT_STATIONS` & `HOLO_TAG_DESCRIPTIONS`)
Every station object in `HOLO_PROJECT_STATIONS` (`sandbox.js:710–1005`, exposed at `window.sandbox.holoStations`) and its 4 tags (`28` tags total across 7 stations, exposed at `window.sandbox.holoTagDescriptions`) must adhere to the exact curated catalog in Spec 068 §5.5.4:

| Station `code` & `mountName` | `title` | 4 Interactive `tags` (Keys in `HOLO_TAG_DESCRIPTIONS`) | 3 Compact `metrics` (`value` / `label`) |
| :--- | :--- | :--- | :--- |
| **`01` (`SCREEN_MOUNT_01`)** | `GRAPHRAG POLICY ENGINE` | `OBJ-200`, `GraphRAG LLM`, `8-Hop Lineage`, `17 Cat / 18 Edge` | `8-Hop` / `LINEAGE`, `17 / 18` / `CAT / EDGE`, `Medicare` / `DME LTA` |
| **`02` (`SCREEN_MOUNT_02`)** | `DIGITAL TWIN PERSONA` | `OBJ-04`, `Philosophy + MF DOOM`, `Finetuned LLM`, `Twitter & LinkedIn` | `DOOM` / `CADENCE`, `Custom` / `FINETUNE`, `Live` / `SOCIAL BOT` |
| **`03` (`SCREEN_MOUNT_03`)** | `QUANTITATIVE MODELING AND STATISTICAL ARBITRAGE` | `Bayesian SSM`, `$50K TopStepXFA`, `Mean Reversion`, `Cointegration` | `$50K` / `TOPSTEPXFA`, `Kalman` / `BAYES SSM`, `p < 0.05` / `ADF COINT` |
| **`04` (`SCREEN_MOUNT_07`)** | `REJECTION STATION // MACHINE LEARNING` | `bge-large-en-v1.5`, `1,024-D Embeddings`, `LinearSVC Heads`, `9 Job Roles` | `1,024-D` / `BGE LARGE`, `LinearSVC` / `SWAPPABLE`, `9 Roles` / `SCORED` |
| **`05` (`SCREEN_MOUNT_04`)** | `AI DATA ANALYTICS DASHBOARDS AND ALIGNMENT RESEARCH` | `Live Analytics`, `Structured Context`, `Agent Swarms`, `Alignment Research` | `Real-Time` / `DASHBOARDS`, `Swarm` / `CONTEXT`, `Aligned` / `AGENTS` |
| **`06` (`SCREEN_MOUNT_05`)** | `GENERATIVE PIPELINES` | `Chained AI Models`, `Content Production`, `Code Generation`, `Workflow Execution` | `Chained` / `AI MODELS`, `Auto` / `CODE & MEDIA`, `E2E` / `PIPELINES` |
| **`07` (`SCREEN_MOUNT_06`)** | `MULTI-MODAL DEEP LEARNING` | `Transformers & CNNs`, `Autoencoders`, `Diffusion & 3D`, `Audio Cloning` | `ViT+CNN` / `VISION`, `Latent` / `DIFFUSION 3D`, `Neural` / `VOICE CLONE` |

### 3.3 Binary Wire Format for Skate 3 `.part` Archives (`skate3_cleanroom/parts/char_*.part`)
- **37-Byte Header Format:**
  - `bytes[0..4]`: `uint32_le = 25` (`0x19000000`, length of ASCII path)
  - `bytes[4..29]`: ASCII `"assets/private/skater.glb"`
  - `bytes[29..37]`: `uint64_le = len(glb_bytes)`
  - `bytes[37..]`: Standard glTF 2.0 binary (`glTF` magic `0x46546C67`, version `2`, byte length `len(glb_bytes)`)
- **`skate3_cleanroom/pack.json` Integrity Invariant:**
  - `skate3_cleanroom/loader.js` (`fetchParts` line 376) verifies that total downloaded bytes across `["parts/core_head.part", "parts/char_<key>.part", "parts/core_tail_0.part", "parts/core_tail_1.part"]` exactly equals `pack.characters[key].size` (or `pack.core.size`).
  - Fixed surrounding part sizes: `core_head.part` (`37,088,836 B`) + `core_tail_0.part` (`27,000,000 B`) + `core_tail_1.part` (`26,542,298 B`) = **`90,631,134` bytes**.
  - Therefore, after writing the new `parts/char_luis.part` (`new_part_bytes = 37_byte_header + clean_glb_with_skateboard_primitives`), `pack.json` MUST set:
    - `pack["default_char"] = "luis"`
    - `pack["characters"]["luis"]["size"] = 90631134 + len(new_part_bytes)`
    - `pack["characters"]["luis"]["hash"] = hashlib.sha256(new_part_bytes).hexdigest()[:16]`
    - `pack["core"]["size"] = 90631134 + len(new_part_bytes)`

### 3.4 RenderWare Override Assets & Status Schema for GTA Vice City (`/revcdos/`)
- **Source Override Files (`revcdos/vcbr/luis_player/`):**
  - `player.dff`: `292,864 bytes` (`143` sectors of `2048 B`, `4,006` vertices, `24` bones)
  - `player.txd`: `45,056 bytes` (`22` sectors of `2048 B`)
  - `player.bmp`: `66,612 bytes`
  - `fronten1.txd`: `394,664 bytes`
- **Target `Module.FS` Paths & `window.__REVCDOS_STATUS__` Contract:**
  - Mounts into `/vc-assets/local/models/gta3.img/player.dff`, `/vc-assets/local/models/gta3.img/player.txd`, `/vc-assets/local/models/gta3.img/csplay.dff`, `/vc-assets/local/models/gta3.img/csplay.txd`, and `/vc-assets/local/models/generic/player.bmp`, updating sector counts in `/vc-assets/local/models/gta3.dir`.
  - Sets `window.__REVCDOS_STATUS__.luisPlayerMounted = true`, `luisPlayerDffBytes = 292864`, `luisPlayerDirSectors = 143`, `luisPlayerVerts = 4006`, `luisPlayerBones = 24`, `lastError = null`.

---

## 4. Languages, Libraries & Verbatim Function Signatures (`library-installer` & `function-mapper`)

### 4.1 Verified Runtime & Library Versions
- **JavaScript / Node.js:** `node v24.9.0`, `three@0.186.1`, `playwright@1.65.0-alpha` (Chromium `158.0.8127.18` with `--use-gl=angle --use-angle=metal`).
- **Python (`.sandcastle/bin/python3`):** `Python 3.12.7`, `Pillow@10.4.0` (`features.check('webp') === True`), `trimesh@5.1.1`, `numpy@1.26.4`, `scipy@1.12.0`, `scikit-learn@1.5.1`, `opencv-python@4.13.0`, `torch@2.11.0`, `transformers@5.3.0`.
- **System CLI Binaries:** `ffmpeg@9.0.1` (`/opt/homebrew/bin/ffmpeg`).

### 4.2 Exact Function Signatures & Implementation Contracts

#### A. 2D Screen Mount & Scrollbar Functions (`sandbox.js`)
- `syncHoloCustomScrollbar(): void`
  - Computes `maxScroll = Math.max(0, scrollH - clientH)`.
  - When `maxScroll <= 1`, sets `thumbH = trackH` (or `Math.max(34, Math.round(trackH * 0.56))` / full-track indicator) and `thumbY = 0`; when `maxScroll > 1`, sets `thumbH = Math.max(32, Math.round((clientH / scrollH) * trackH))` and `thumbY = Math.round((scrollTop / maxScroll) * (trackH - thumbH))`.
- `setActiveHoloTagPopup(station: Object | null, tagLabel: string | null, options?: { triggerAnimation?: boolean }): void`
  - Validates `HOLO_TAG_DESCRIPTIONS[tagLabel]` (throws `Error` if unmapped), toggles `.active` and `aria-expanded` on `.holo-tag`, rotates `.holo-tag-plus-bubble` `45deg`, opens `#holo-tag-popup`, and invokes `syncHoloCustomScrollbar()`.
- `focusWallMount(identifier: string | number, options?: { immediate?: boolean }): boolean`
- `exitWallMountFocus(): void`

#### B. Full-Screen CRT Post-Processing Pass (`sandbox.js` & `index.html`)
- Import or construct `EffectComposer`, `RenderPass`, and `ShaderPass` (or equivalent full-screen WebGL post-processing pass in `sandbox.js`) with `CRTShader`:
  - Uniforms: `tDiffuse`, `uTime`, `uResolution`, `uScanlineIntensity` (`0.16` $\in [0.12, 0.22]$), `uScanlineCount` (`640.0`), `uCurvature` (`0.018` $\le 0.025$), `uVignette` (`0.32`), `uPhosphorMaskIntensity` (`0.05`).
- Expose runtime inspection helper on `window.sandbox`:
  ```javascript
  window.sandbox.getCRTOpticalPassState = () => ({
    enabled: Boolean(crtPassState.enabled),
    scanlineIntensity: crtPassState.scanlineIntensity, // in [0.12, 0.22]
    curvature: crtPassState.curvature,                 // <= 0.025
    vignette: crtPassState.vignette,
    phosphorMaskActive: true,
    gpuFrameTimeMs: crtPassState.lastFrameTimeMs,      // <= 0.8 ms
    pointerEventsBlocked: false
  });
  ```

#### C. PlatoDoom Arcade Proximity Pop-Out State Machine (`watercolor_shader.js`)
- In `WATERCOLOR_GALLERY_SPEC`:
  ```javascript
  popOutTriggerRadiusMeters: 6.8,   // >= 6.5 m
  popOutReleaseRadiusMeters: 7.5,   // 7.5 m (1.0 m hysteresis)
  popOutScaleMultiplier: 1.45,      // in [1.35, 1.60]
  popOutForwardOffsetMeters: 0.35,  // in [0.25, 0.45] m along outward normal (-Z toward player)
  popOutTransitionDurationSec: 0.38 // in [0.32, 0.45] s
  ```
- In `buildWaterColorGallerySystem(ctx).update(dt, elapsed, activeChar)`:
  - Compute 3D Euclidean distance `dist3D` (and corridor Z distance `distZ`) between player/camera and `anchorPosition` (`x: 0.0065, y: 3.5987, z: 42.0129`).
  - Hysteresis transition: if `!isPoppedOut && dist <= 6.8`, set `isPoppedOut = true`; if `isPoppedOut && dist >= 7.5`, set `isPoppedOut = false`.
  - Advance linear progress `popOutProgress` toward `isPoppedOut ? 1.0 : 0.0` at rate `dt / 0.38`, and compute smooth cubic easing `eased = popOutProgress < 0.5 ? 4 * p^3 : 1 - Math.pow(-2 * p + 2, 3) / 2` (or smoothstep/cubic-out).
  - Apply scale `baseScale * (1 + (1.45 - 1) * eased)` and forward translation `anchorPosition.z - 0.35 * eased` (toward player in corridor) to `canvasStageGroup`, and expose in `getState()`.

#### D. Skate 3 Cleanroom GLB Splicing & Torus Stripping (`scripts/rig_skate3_character.py` or dedicated build script)
- Extract raw GLB bytes (`raw[37:]`) from `skate3_cleanroom/parts/char_luis_holo.part`.
- Parse the glTF 2.0 JSON chunk (`chunk0`) and BIN chunk (`chunk1`):
  - Remove node `"SkateAlley_Holo_Visualizer"` (node 37) from `gltf["nodes"]` and from any parent `children` or `scenes[0]["nodes"]` lists.
  - Remove mesh `"Torus"` (mesh 1) from `gltf["meshes"]` and material `"HOLOSYS_Visualizer_Holo_Material"` if unreferenced.
  - Keep Mesh 0 (`"LUIS"`) with all 5 primitives: `LUIS_Body_Material`, `LUIS_Head_Material`, `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`, and all joints (`SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheels).
- Repack with the 37-byte header into `skate3_cleanroom/parts/char_luis.part` (and `char_luis_holo.part`), and atomically update `skate3_cleanroom/pack.json` (`default_char = "luis"`, `size`, and `hash`).

---

## 5. MCP Tools & Verification Playbook (`mcp-provisioner`)

All 5 MCP servers (`playwright`, `threejs-devtools-mcp` on proxy `:57764 -> :8080`, `ffmpeg`, `glbforge`, `threejsresources`) are live-verified. Full JSON tool schemas and step-by-step commands are documented in [`wayfinder/20261107T172758-750-iwl9/mcp-tools.md`](wayfinder/20261107T172758-750-iwl9/mcp-tools.md):

1. **Start Local Server & Materialize Worktree Assets:**
   ```bash
   git sparse-checkout add character_hoodie.glb revcdos
   python3 scripts/serve_skatealley.py --host 127.0.0.1 --port 8080
   ```
2. **Verify 3D Scene Graph, Pitch-Black Sky Port, Showcase Scale & CRT Pass (`threejs-devtools-mcp` / `playwright`):**
   - Use `threejs-devtools-mcp` (`scene_background`, `object_details`, `texture_list`, `performance_snapshot`, `run_js`) or Playwright `browser_evaluate` to verify:
     - `scene.background.getHexString() === "000000"` and clear color `#000000`.
     - `SCREEN_MOUNT_01..07_DisplayFront` world-space width $\ge 3.4\text{ m}$ (`3.52 m`) and `SCREEN_MOUNT_01..07_HeaderFront` world-space width $\ge 3.6\text{ m}$ (`3.84 m`).
     - All 7 display `CanvasTexture` instances are `1024 × 627` (`generateMipmaps === false`).
     - `window.sandbox.getCRTOpticalPassState().enabled === true` and `gpuFrameTimeMs <= 0.8`.
3. **Verify PlatoDoom Texture Downsampling & Proximity Pop-Out (`ffmpeg` & `playwright`):**
   - Use `ffmpeg` $\rightarrow$ `media_probe` on `platodoomarcade.jpeg` (`1024 × 345`, `34.9 KB`) and `assets/portal_games/platodoom_header.png` (`1024 × 348`, $\le 2.0\text{ MB}$ RGBA).
   - Move player/camera within $6.5\text{ m}$ of `z = 42.0129` (`e.g. z = 36.5`) and verify `window.sandbox.waterColor.getState().isPoppedOut === true`, scale multiplier $\ge 1.35\times$, and forward Z relief $\ge 0.25\text{ m}$; move beyond $7.5\text{ m}$ (`e.g. z = 33.5`) and verify it smoothly returns to baseline.
4. **Verify Skate 3 Cleanroom (`/skate3_cleanroom/`) (`glbforge` & `playwright`):**
   - Inspect the extracted GLB from `skate3_cleanroom/parts/char_luis.part` with `glbforge` $\rightarrow$ `inspect` and verify `SKATEBOARD_ROOT`, `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel` exist and `Torus` / `SkateAlley_Holo_Visualizer` is absent.
   - Navigate Playwright to `http://127.0.0.1:8080/skate3_cleanroom/` (with no query string) and verify it loads `char=luis` (`parts/char_luis.part`) by default with zero errors.
5. **Verify GTA Vice City (`/revcdos/`) (`playwright`):**
   - Navigate Playwright to `http://127.0.0.1:8080/revcdos/` (with no query string) and verify `window.__REVCDOS_STATUS__.luisPlayerMounted === true` and `player.dff`, `player.txd`, `player.bmp` are mounted in `Module.FS`.

---

## 6. Shared Contracts & Verifiable Expected Outputs ([`LANGUAGE.md`](LANGUAGE.md))

To achieve `{sufficient}` implementation and pass all verification gates with zero `{errors}`, the integrated system must satisfy the following measurable `{correct required outputs}`:

1. **Core Pillars 1–6 (`tests/verify_spec068_screen_mounts.mjs`):**
   - Passes 100% of assertions across all 7 stations (`SCREEN_MOUNT_01` through `SCREEN_MOUNT_07`) on Desktop (`1280 × 800`), Standard Mobile (`390 × 844`), and Compact Mobile (`375 × 667`):
     - `headerTelemetryVisible === false`, `tetherBridgeVisible === false`, `footerBarVisible === false` in 2D DOM and 3D `CanvasTexture`.
     - `#exit-mount-focus-btn` in top-right slot (`exitRect.left >= titleRect.right + 8`, hit box $\ge 44 \times 36\text{ px}$), exiting `mount-focus` cleanly on click.
     - `#holo-custom-scrollbar` immediately visible at $t = 0\text{ ms}$ (`opacity === "1"`, `visibility === "visible"`).
     - `#holo-description` computed font-size $\ge 16.5\text{ px}$ (mobile) and $\ge 18.5\text{ px}$ (desktop); 3D canvas description font-size $= 24\text{ px}$.
     - All 28 tags render as `<button class="holo-tag">` with `.holo-tag-plus-bubble` (`+`), rotating `45deg` on click and displaying the exact curated description in `#holo-tag-popup`.
     - All 3 `.holo-metric-box` items render in a single horizontal row (`gap >= 8 px`) with `scrollHeight <= clientHeight` on mobile for standard-length stations (`01, 02, 03, 05, 06, 07`).
2. **Addendum Pillar 1 — PlatoDoom Arcade Texture Downsampling (§10.1 & §15.1):**
   - `platodoomarcade.jpeg` (`1024 × 345`) and `assets/portal_games/platodoom_header.png` (`1024 × 348`) both have dimensions $\le 1024 \times 512$ ($\le 1757 \times 592$) and decoded RGBA footprint $\le 1.45\text{ MB} \le 2.0\text{ MB}$.
3. **Addendum Pillar 2 — PlatoDoom Proximity Pop-Out (§10.2 & §15.2):**
   - Entering $d \le 6.5\text{ m}$ of the PlatoDoom arcade canvas triggers `isPoppedOut === true`, scaling the showcase by $1.45\times \in [1.35\times, 1.60\times]$ and translating it forward by $+0.35\text{ m} \in [+0.25\text{ m}, +0.45\text{ m}]$; retreating beyond $d > 7.5\text{ m}$ smoothly restores baseline transform.
4. **Addendum Pillar 3 — Skate 3 Cleanroom Spawning Rig (§11.1 & §15.3):**
   - `skate3_cleanroom/pack.json` has `"default_char": "luis"` with valid `size` and `hash` matching `skate3_cleanroom/parts/char_luis.part`.
   - `parts/char_luis.part` contains the `Luis` mesh ($1.8000\text{ m}$), `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheels, and all 3 skateboard mesh primitives (`Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`), with **zero** `Torus` or `SkateAlley_Holo_Visualizer` nodes.
5. **Addendum Pillar 4 — GTA Vice City Spawning Rig (§11.2 & §15.4):**
   - `scripts/serve_skatealley.py` materializes all `revcdos/` runtime and `vcbr/luis_player/*` files in worktrees, and navigating to `/revcdos/` sets `window.__REVCDOS_STATUS__.luisPlayerMounted === true` with `player.dff` (`292,864 B`), `player.txd` (`45,056 B`), and `player.bmp` (`66,612 B`) mounted in `Module.FS`.
6. **Addendum Pillar 5 — Screen CRT Post-Processing Optical Pass (§12 & §15.5):**
   - Full-screen CRT optical pass is active (`window.sandbox.getCRTOpticalPassState().enabled === true`) with horizontal scanlines ($I_{\text{scan}} \in [0.12, 0.22]$), RGB phosphor mask, subtle barrel curvature ($\le 2.5\%$), and corner vignetting within $\le 0.8\text{ ms}$ GPU frame time.
7. **Addendum Pillar 6 — Pitch-Black Sky Port (§13 & §15.6):**
   - `scene.background.getHexString() === "000000"`, `DEPTH_FOG_COLOR_HEX === 0x000000`, and `renderer` clear color is `#000000` (`0x000000`).
8. **Addendum Pillar 7 — Large-Scale Showcases & Proportional Graffiti Headers (§14 & §15.7):**
   - All 7 holographic showcase screens (`SCREEN_MOUNT_01..07`) measure `3.52 m × 2.16 m` (width $\ge 3.4\text{ m}$) and their paired cyber-drip graffiti headers measure `3.84 m × 1.20 m` at `baseLocalOffsetY = 1.78 m` (width $\ge 3.6\text{ m}$), with zero vertical overlap or floor clipping.
