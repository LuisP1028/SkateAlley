# API & Payload Schema Map (`functional_specification_068.md` & Addendum)

- **Run ID:** `20261107T172758-750-iwl9`
- **Branch:** `agent/api-schema-mapper-20261107T172758-750-iwl9`
- **Authoritative Spec:** [`functional_specification_068.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/functional_specification_068.md) (§1–§8 Screen Mount Overhaul & §9–§15 Addendum)
- **Authoritative Vocabulary:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/LANGUAGE.md)
- **Captured Sample Payloads:**
  - [`assets/20261107T172758-750-iwl9/api-schema-mapper-stations-tags-068.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/assets/20261107T172758-750-iwl9/api-schema-mapper-stations-tags-068.json)
  - [`assets/20261107T172758-750-iwl9/api-schema-mapper-portal-engines-068.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/assets/20261107T172758-750-iwl9/api-schema-mapper-portal-engines-068.json)

---

## 1. Connection & Environment Details

### 1.1 Local HTTP Server & Multi-Engine Static/API Origin (`scripts/serve_skatealley.py`)
- **Server Entrypoint:** `python3 scripts/serve_skatealley.py --host 0.0.0.0 --port 3002 --dir .`
- **Tunnel Failover Manifest (`tunnel.json`):**
  ```json
  {
    "service": "skatealley-app-local",
    "url": "https://beings-violin-beauty-sally.trycloudflare.com",
    "updated_at": "2026-11-05T02:04:39Z"
  }
  ```
- **Active HTTP Routes & Sub-Engine Mounts:**
  - `/` (`index.html`, `sandbox.js`, `alley_atmosphere_023.js`, `watercolor_shader.js`, `hologram_columns.js`): Main Freeman Alley 3D WebGL scene, 7 wall screen mounts (`SCREEN_MOUNT_01..07`), and 2D holographic overlay (`#holo-popup-window`).
  - `/skate3_cleanroom/` (`skate3_cleanroom/index.html`, `skate3_cleanroom/loader.js`, `skate3_cleanroom/pack.json`, `skate3_cleanroom/parts/*.part`): Skate 3 Cleanroom Rust/WebGPU engine.
  - `/revcdos/` (`revcdos/index.html`, `revcdos/game.js`, `revcdos/pack.json`, `revcdos/vcbr/luis_player/*`): GTA Vice City (`reVCDOS`) Emscripten WebGL engine.
  - `/nzportable/`: Call of Duty: Zombies (`NZ:P` WebGL) survival arena.
  - `/api/health` (`GET`, `HEAD`): Returns JSON status of static server, PostgreSQL sticker store, and PostgreSQL scene-layout store.
  - `/api/scene-layout` (`GET`, `POST`, `PUT`, `DELETE`): Persists and hydrates scene layout overrides (`holo_columns`, `math_pods`, `lamppost_light`, `player_spawn`, `startup_camera_pan`, `character_camera`).
  - `/api/stickers` (`GET`, `POST`, `PUT`, `DELETE`): Persists and hydrates 3D holographic wall/floor stickers.

### 1.2 PostgreSQL Persistence Connection (Live Probed via `mcp_postgres_query`)
- **Active DSN Candidates (`scripts/serve_skatealley.py`):**
  1. `postgresql://user:pass@127.0.0.1:5432/alpha` (Verified listening on `127.0.0.1:5432` and `[::1]:5432`, PID `551`)
  2. `postgresql://user:pass@host.docker.internal:5432/alpha`
  3. `postgresql://user:pass@10.0.0.62:5432/alpha`
- **Verified Live Tables & Row Counts:**
  - `skatealley_scene_layouts` (`layout_key VARCHAR(64) PRIMARY KEY`, `payload_json TEXT NOT NULL`, `updated_at_ms BIGINT NOT NULL`): 6 active keys (`character_camera`, `holo_columns`, `lamppost_light`, `math_pods`, `player_spawn`, `startup_camera_pan`).
  - `skatealley_placed_stickers`: 1 active row.

---

## 2. Verbatim Payload Schemas & Runtime Data Contracts

### 2.1 Screen Mount Stations (`HOLO_PROJECT_STATIONS`) & 28-Tag Catalog (`HOLO_TAG_DESCRIPTIONS`)
Defined in [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/sandbox.js#L710-L1005) and exposed at runtime via `window.sandbox.holoStations` and `window.sandbox.holoTagDescriptions`.

#### Station Object Schema (`HOLO_PROJECT_STATIONS[i]`)
| Field Path | Type | Nullable | Observed Values / Constraint |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `false` | `'proj-01'` .. `'proj-07'` |
| `index` | `number` | `false` | `1` .. `7` (corridor sequence index; note `proj-07` has `index: 4`, `mountName: 'SCREEN_MOUNT_07'`) |
| `code` | `string` | `false` | `'01'` .. `'07'` |
| `mountName` | `string` | `false` | `'SCREEN_MOUNT_01'` .. `'SCREEN_MOUNT_07'` |
| `isProceduralLocator` | `boolean` | `true` (`undefined` on `01..06`, `true` on `SCREEN_MOUNT_07`) | Procedural world locator at `Z = 16.35m` |
| `wallSide` | `'L' \| 'R'` | `false` | `'L'` (`+X` normal) or `'R'` (`-X` normal) |
| `expectedZ` | `number` | `false` | `5.00`, `10.00`, `15.00`, `16.35`, `20.00`, `26.00`, `31.00` |
| `expectedY` | `number` | `false` | `1.75` |
| `expectedNormalX` | `number` | `false` | `1.0` or `-1.0` |
| `startProgress` / `endProgress` | `number` | `false` | Scroll activation window in `[0.05, 0.96]` |
| `title` | `string` | `false` | Uppercase project title rendered in `#holo-title` and 3D canvas top-left |
| `headerText` | `string` | `false` | Stripped A–Z string for 3D graffiti header atlas |
| `headerLines` | `string[2]` | `false` | Two-line split array for 3D levitating graffiti header |
| `description` | `string` | `false` | Full 2D modal description text (`#holo-description`) |
| `canvasSummary` | `string` | `true` (present on Station `04` / `SCREEN_MOUNT_07`) | Condensed 3D canvas body copy |
| `canvasInspectCue` | `string` | `true` (present on Station `04` / `SCREEN_MOUNT_07`) | `'[PRESS E OR CLICK — READ "WHAT THE HELL DOES THIS MEAN, LUIS?"]'` |
| `narrativeCallout` | `{ heading: string, body: string }` | `true` (present on Station `04` / `SCREEN_MOUNT_07`) | Heading: `'What the hell does this mean, Luis?'`, Body: `528`-char recruitment story |
| `tags` | `string[4]` | `false` | Exactly 4 tag labels per station (28 total across 7 stations); every tag key maps to a non-empty string in `HOLO_TAG_DESCRIPTIONS` |
| `metrics` | `Array<{ value: string, label: string }>` | `false` | Exactly 3 summary cards per station |
| `primaryLink` | `{ label: string, url: string } \| null` | `true` | Non-null on Stations `01`, `02`, `03`; `null` on Stations `04`, `05`, `06`, `07` |
| `secondaryLink` | `{ label: string, url: string, action?: string } \| null` | `true` | Non-null on Stations `01`, `02`, `03`; `null` on Stations `04`, `05`, `06`, `07` |

#### Screen Mount DOM & State Telemetry Contract (`index.html` & `sandbox.js`)
- **Removed Legacy Chrome (`display: none !important` in 2D DOM and omitted from `createProjectScreenTexture` 3D canvas):**
  - `.holo-badge` / `#holo-station-badge`
  - `#holo-coords-label`
  - `#holo-tether-bridge`
  - `#holo-kicker`
  - `.holo-footer-bar` (`#holo-footer-status`, `#holo-prev-mount-btn`, `#holo-station-pips`, `#holo-next-mount-btn`)
- **Top-Right Exit Button (`#exit-mount-focus-btn.holo-exit-focus-btn`):**
  - Relocated into `.holo-top-right` inside `.holo-top-bar` (`min-width: 44px; min-height: 36px`).
- **Persistent Amber Custom Scrollbar (`#holo-custom-scrollbar.holo-scrollbar-track` & `#holo-custom-scrollbar-thumb.holo-scrollbar-thumb`):**
  - Paired with single scroll container `.holo-body-grid` inside `.holo-body-scroll-shell`.
  - Immediately visible on mount open (`opacity: 1`, `visibility: visible`), min thumb height `32px`.
- **Interactive Tag Chip & Pop-Up DOM Contract:**
  - `.holo-tag` (`<button type="button" class="holo-tag" data-tag-label="..." aria-expanded="true|false">`) containing `.holo-tag-label` + `.holo-tag-plus-bubble` (`+`).
  - `#holo-tag-popup.holo-tag-popup` (`aria-hidden="true|false"`) containing `#holo-tag-popup-title`, `#holo-tag-popup-close-btn`, and `#holo-tag-popup-desc`.

---

### 2.2 World-Space Showcase & Cyber-Drip Graffiti Header Scaling Schemas (Addendum §14)
- **Graffiti Alphabet Atlas Metadata (`assets/graffiti_alphabet_atlas.json`):**
  - `sourceImage`: `"graffiti_.jpeg"`, `sourceDimensions`: `[2752, 1536]`
  - `atlasImage`: `"assets/graffiti_alphabet_atlas.png"`, `atlasDimensions`: `[1024, 572]` (`scaleFactor: 0.372093`)
  - `glyphs`: Keyed `"A"` through `"Z"`, each with `{ char, row, srcBounds: [x0, y0, x1, y1], srcCell: [x0, y0, x1, y1], captionMask: [x, y, w, h], atlasBounds: [x0, y0, x1, y1], atlasWidth, atlasHeight }`.
- **Current vs. Addendum Target World-Space Dimensions:**
  - In [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/sandbox.js#L2679-L2680): `screenWidth = 1.60`, `screenHeight = 0.98`.
  - In [`alley_atmosphere_023.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-api-schema-mapper-20261107T172758-750-iwl9/alley_atmosphere_023.js#L1050-L1052): `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters = 2.32`, `planeHeightMeters = 0.725`, `baseLocalOffsetY = 0.84`.
  - **Addendum §14.1 & §14.2 Contract:** Enlarge holographic portfolio showcases and their associated cyber-drip graffiti header meshes in proportional 1:1 alignment so world-space bounding widths measure **$\ge 3.4\text{ m}$** (showcase width $\in [3.4\text{ m}, 3.8\text{ m}]$, graffiti header width $\in [3.6\text{ m}, 4.2\text{ m}]$) while keeping the `CanvasTexture` resolution capped at `1024 × 627` (mount) and `1024 × 320` / `1024 × 256` (header).

---

### 2.3 PlatoDoom Arcade Watercolor Texture Downsampling & Proximity Pop-Out Contract (Addendum §10)
- **Probed Raster Assets on Disk:**
  1. `platodoomarcade.jpeg`: Verified via `sips` at **`1024 × 345`** (`34,997 bytes` on disk, `1.41 MB` uncompressed RGBA, `≤ 2.0 MB` budget).
  2. `assets/portal_games/platodoom_header.png`: Verified at **`1120 × 381`** (`338,782 bytes` on disk, `1.71 MB` uncompressed RGBA; cropped/downsampled from `3514 × 1184` source).
  3. `spray_paint_loader.js` (`SPRAY_ARCADE_LETTER_SPECS`): 5 piecewise UV intervals (`D`, `O1`, `O2`, `M`, `ARCADE`).
- **Watercolor Gallery & PlatoDoom Arcade Anchor (`WATERCOLOR_GALLERY_SPEC` in `watercolor_shader.js`):**
  - `anchorPosition`: `{ x: 0.0065, yRel: 3.5987, z: 42.0129 }`
  - `canvasWidth`: `1.68 m`, `canvasHeight`: `3.18 m`, `canvasScale`: `{ x: 5.0, y: 5.0, z: 1.0 }`
- **Proximity Pop-Out Envelope & Kinematics Contract (Addendum §10.2):**
  - Trigger distance: $R_{\text{pop}} \ge 6.5\text{ m}$ (with $1.0\text{ m}$ release hysteresis at $R_{\text{release}} = 7.5\text{ m}$).
  - Scale multiplier when in range: $1.35\times \text{ to } 1.60\times$ baseline scale.
  - Forward Z/normal relief translation when in range: $+0.25\text{ m} \text{ to } +0.45\text{ m}$ off the background wall plane.
  - Easing transition duration: $\tau \in [320\text{ ms}, 450\text{ ms}]$ cubic easing.

---

### 2.4 Multi-Engine Spawning Schemas: Skate 3 Cleanroom & GTA Vice City (Addendum §11)

#### 2.4.1 Skate 3 Cleanroom (`/skate3_cleanroom/pack.json` & `parts/char_*.part`)
- **Manifest Schema (`skate3_cleanroom/pack.json`):**
  ```json
  {
    "version": 1,
    "engine": {
      "size": 50749272,
      "parts": ["parts/skate3rust_bg_0.part", "parts/skate3rust_bg_1.part"],
      "hash": "d60e23310332b26f"
    },
    "core": {
      "size": 98650499,
      "parts": ["parts/core_head.part", "parts/char_luis.part", "parts/core_tail_0.part", "parts/core_tail_1.part"],
      "files": 534,
      "hash": "7fbdc36d25bbcfb7"
    },
    "characters": {
      "luis": {
        "name": "Luis",
        "pack": "core_luis.pack",
        "parts": ["parts/core_head.part", "parts/char_luis.part", "parts/core_tail_0.part", "parts/core_tail_1.part"],
        "size": 96283351,
        "hash": "5cb0fc511a525700"
      }
    },
    "default_char": "luis",
    "default": "StartPark"
  }
  ```
- **Binary `.part` Container Wire Format (`scripts/rig_skate3_character.py` lines 3990–3997):**
  - Every `parts/char_<slug>.part` file begins with a **37-byte pack entry header** followed immediately by the raw GLB binary:
    - `bytes[0..4]`: `uint32_le` = `25` (`0x19000000`, byte length of `"assets/private/skater.glb"`)
    - `bytes[4..29]`: ASCII `"assets/private/skater.glb"`
    - `bytes[29..37]`: `uint64_le` = `len(glb_bytes)`
    - `bytes[37..]`: Standard glTF 2.0 binary (`glTF` magic `0x46546C67`, version `2`, total length `len(glb_bytes)`)
  - `pack.json` `size` field for a character equals `os.path.getsize("parts/core_head.part") + len(part_payload) + os.path.getsize("parts/core_tail_0.part") + os.path.getsize("parts/core_tail_1.part")` (`37,088,836 + len(part_payload) + 27,000,000 + 26,542,298 = 90,631,134 + len(part_payload)`).
  - `pack.json` `hash` field equals `hashlib.sha256(part_payload).hexdigest()[:16]`.
- **Live Binary Audit of `skate3_cleanroom/parts/char_*.part` (Critical Gap Identified for Implementer):**
  1. `skate3_cleanroom/pack.json` currently has `"default_char": "nicotest"` instead of `"luis"`.
  2. `skate3_cleanroom/parts/char_luis.part` (`5,652,217 bytes`) contains `Mesh 0 ("LUIS")` with only 2 primitives (`LUIS_Body_Material` 9,650 verts, `LUIS_Head_Material` 5,255 verts, height `1.8000 m`) and **0 skateboard primitives** because `REFERENCE_SKATER_GLB_PATH` (`20261019T213303-735-zjzk/plan-scan-2-skater.glb`) was absent when `rig_skate3_character.py` last ran.
  3. `skate3_cleanroom/parts/char_luis_holo.part` (`9,641,573 bytes`) contains the exact 3 Skate 3 skateboard primitives on `Mesh 0` (`prim 2`: `Retail_SkateBoard` 476 verts, `prim 3`: `Retail_SkateTruck` 1,085 verts, `prim 4`: `Retail_SkateWheel` 724 verts) plus their 6 embedded board textures (`Skate3_Board_Tex_16..21`), AND also contains the unwanted `node 37 ("SkateAlley_Holo_Visualizer")` referencing `Mesh 1 ("Torus", 3,072 verts, material "HOLOSYS_Visualizer_Holo_Material")`.
  4. **Remediation Path:** Splice the 3 skateboard primitives (`Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`) and their textures from `char_luis_holo.part` into `char_luis.part`'s `LUIS` mesh (and strip `node 37` / `Mesh 1 "Torus"` from `char_luis_holo.part`), recompute `size` and `hash` in `skate3_cleanroom/pack.json` (updating both `pack.core` and `pack.characters.luis`), and set `"default_char": "luis"`.

#### 2.4.2 GTA Vice City (`/revcdos/` & `window.__REVCDOS_STATUS__`)
- **Runtime Telemetry Schema (`window.__REVCDOS_STATUS__` in `revcdos/game.js`):**
  ```json
  {
    "haveOriginalGame": true,
    "dataLoadedBytes": 135355111,
    "wasmReady": true,
    "mainCalled": true,
    "fetchedAssetsCount": 0,
    "failedFetchesCount": 0,
    "lastFetchedUrl": null,
    "lastError": null,
    "cacheHit": false,
    "luisPlayerMounted": true,
    "luisPlayerDffBytes": 292864,
    "luisPlayerDirSectors": 143,
    "luisPlayerVerts": 4006,
    "luisPlayerBones": 24,
    "customMenuLogoMounted": true,
    "fronten1TxdBytes": 394664
  }
  ```
- **RenderWare Override Asset Payload Sizes (`revcdos/vcbr/luis_player/metadata.json`):**
  - `revcdos/vcbr/luis_player/player.dff`: `292,864 bytes` (`143` sectors of `2048 bytes`, `4,006` vertices, `2,800` triangles, `24` bones, `uint32_le` vertex count at byte offset `3201`).
  - `revcdos/vcbr/luis_player/player.txd`: `45,056 bytes` (`22` sectors of `2048 bytes`).
  - `revcdos/vcbr/luis_player/player.bmp`: `66,612 bytes`.
  - `revcdos/vcbr/luis_player/fronten1.txd`: `394,664 bytes`.
- **Emscripten `Module.FS` Target Paths (`Module.applyLuisPlayerOverrides`):**
  - `/vc-assets/local/models/gta3.img/player.dff` $\leftarrow$ `player.dff`
  - `/vc-assets/local/models/gta3.img/player.txd` $\leftarrow$ `player.txd`
  - `/vc-assets/local/models/gta3.img/csplay.dff` $\leftarrow$ `player.dff`
  - `/vc-assets/local/models/gta3.img/csplay.txd` $\leftarrow$ `player.txd`
  - `/vc-assets/local/models/generic/player.bmp` $\leftarrow$ `player.bmp`
  - `/vc-assets/local/models/gta3.dir` $\leftarrow$ sector counts updated at `offset + 4` (`uint32_le`) for `player.dff`, `csplay.dff`, `player[2-9].dff`, `csplay([2-9]|10|11).dff` (`143` sectors) and corresponding `.txd` entries (`22` sectors).
- **Worktree Materialization Gap (`skip-worktree` on `revcdos/*`):**
  - In sandcastle git worktrees, `git ls-files -v revcdos` shows the `S` (`skip-worktree`) bit set on all 34 tracked `revcdos/*` files, so `revcdos/` is not checked out on disk in a fresh worktree until materialized from `/Users/diesel/Desktop/SkateAlley/revcdos` (or via `git update-index --no-skip-worktree` + `git checkout -- revcdos`). `scripts/serve_skatealley.py` (`ensure_revcdos_data`, `ensure_revcdos_vcsky`, `ensure_revcdos_luis_player`) must ensure the base `revcdos/` files (`index.html`, `game.js`, `index.js`, `pack.json`, `modules/**`, `parts/**`, `vcbr/**`) are linked/copied from `/Users/diesel/Desktop/SkateAlley/revcdos` into the active worktree just like `ensure_tkdr_assets`, `ensure_melee_assets`, and `ensure_mkd_assets` do.

---

### 2.5 Screen CRT Post-Processing & Pitch-Black Sky Port Schemas (Addendum §12 & §13)
- **Pitch-Black Sky Port Contract (Addendum §13):**
  - Current `sandbox.js` line 1681 sets `scene.background = new THREE.Color(0x080401)` and `sandbox.waterColor` / `skybox` renders above the corridor.
  - Addendum §13 requires scene background clear color and sky port mesh material to be pure pitch black (`#000000` / `0x000000`, `glClearColor(0.0, 0.0, 0.0, 1.0)`), with low-altitude floor fog anchored to $Y \le 1.8\text{ m}$.
- **Screen CRT Post-Processing Pass Contract (Addendum §12):**
  - Full-screen CRT optical pass with horizontal scanlines ($I_{\text{scan}} \in [0.12, 0.22]$), RGB phosphor triad / aperture grille modulation, subtle barrel curvature ($\le 2.5\%$ edge deflection), peripheral corner vignetting, and $\le 0.8\text{ ms}$ GPU frame time at capped `1.25` DPR.

---

## 3. Error & Boundary Conditions

1. **Unmapped or Unknown Station Tag (`RULE[user_global]` Fail-Fast Invariant):**
   - Looking up any tag label in `HOLO_TAG_DESCRIPTIONS` that is missing or empty MUST fail fast with an explicit diagnostic error rather than rendering a blank `#holo-tag-popup-desc`. All 28 tags across Stations `01`–`07` are verified 1:1 in `HOLO_TAG_DESCRIPTIONS`.
2. **Mobile Scrollbar Visibility at `t = 0 ms`:**
   - Native mobile scrollbars (`::-webkit-scrollbar`) remain `opacity: 0` when idle on iOS WebKit and Android Blink. `#holo-custom-scrollbar` MUST be DOM-backed with `getComputedStyle(el).opacity === "1"` and `visibility === "visible"` immediately upon `.holo-window.active`, and thumb height MUST satisfy $H_{\text{thumb}} = H_{\text{track}}$ when `scrollHeight <= clientHeight` (zero overflow on standard stations `01, 02, 03, 05, 06, 07`).
3. **Skate 3 `.part` Byte-Size & Hash Mismatch:**
   - `skate3_cleanroom/loader.js` (`fetchParts` line 376) throws `Error("Downloaded X of Y bytes; pack.json is stale")` if the sum of `.part` byte lengths in `pack.json` does not match the exact byte size on disk. Whenever `parts/char_luis.part` or `parts/char_luis_holo.part` is updated, both `pack.json` `characters.<slug>.size` (`90,631,134 + len(part_payload)`) and `characters.<slug>.hash` (`sha256[:16]`), as well as `pack.core.size` and `pack.core.hash`, MUST be updated atomically.
4. **GTA Vice City (`reVCDOS`) Startup & `luisPlayerMounted` Synchronization:**
   - `revcdos/game.js` auto-starts after `30 ms` when `autostart !== '0'`, fetches `vcbr/luis_player/player.dff`, `player.txd`, `player.bmp`, and mounts them into `Module.FS` inside `Module.mainCalled` (or eagerly upon `loadGame`), setting `window.__REVCDOS_STATUS__.luisPlayerMounted = true`. If `fetchLuisPlayerOverrideAssets()` fails or `revcdos/` is unmaterialized in a worktree, `luisPlayerMounted` remains `false` and `lastError` records the HTTP status failure.
