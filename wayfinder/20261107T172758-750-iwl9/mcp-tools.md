# Operational MCP Provisioning & Live Verification Guide (`mcp-tools.md`)

**Run ID:** `20261107T172758-750-iwl9`  
**Branch:** `agent/mcp-provisioner-20261107T172758-750-iwl9`  
**Target Specification:** [`functional_specification_068.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-mcp-provisioner-20261107T172758-750-iwl9/functional_specification_068.md) (Spec 068 Core Pillars 1–6 & Addendum Pillars 1–7)  
**Domain Vocabulary Alignment:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-mcp-provisioner-20261107T172758-750-iwl9/LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)

---

## 1. Active MCP Servers & Live Readiness Status

All required Host-Level MCP servers and local backing services have been assessed, configured, started, and empirically verified against the live Freeman Alley (`SkateAlley`) application runtime.

| MCP Server (`ServerName`) | Loading Mode | Backing Process / Bridge | Verified Status | Purpose for Spec 068 & Addendum |
| :--- | :--- | :--- | :--- | :--- |
| **`playwright`** | Lazy (`call_mcp_tool`) | Chromium `158.0.8127.18` + `scripts/serve_skatealley.py` (`127.0.0.1:8080`) | **READY (VERIFIED)** | Live 2D DOM & 3D WebGL verification across desktop (`1280×800`) and mobile (`390×844`, `375×667`) viewports: header/footer removal, top-right `#exit-mount-focus-btn` geometry, persistent `#holo-custom-scrollbar` at `t = 0 ms`, enlarged typography (`≥ 16.5 px` mobile / `≥ 18.5 px` desktop), 28 interactive `.holo-tag` `+` bubbles & `#holo-tag-popup` state machine, compact 3-column `.holo-metric-box` zero-overflow check (`scrollHeight <= clientHeight`), `/skate3_cleanroom/` default `char=luis` + zero `Torus` check, and `/revcdos/` `window.__REVCDOS_STATUS__.luisPlayerMounted === true` verification. |
| **`threejs-devtools-mcp`** | Lazy (`call_mcp_tool`) | Proxy `http://localhost:57764` $\rightarrow$ `http://localhost:8080` (`set_dev_port: 8080`) | **CONNECTED (VERIFIED)** | Live Three.js scene graph & WebGL inspection: verifying pitch-black sky port (`scene_background` $\rightarrow$ `#000000`), world-space hologram showcase & cyber-drip graffiti header scaling (`SCREEN_MOUNT_01..07_DisplayFront` width $\ge 3.4\text{ m}$, `SCREEN_MOUNT_01..07_HeaderFront` width $\ge 3.6\text{ m}$), `CanvasTexture` budget (`1024×627`, `generateMipmaps: false`), CRT post-processing pass inspection, PlatoDoom arcade proximity pop-out ($R_{\text{pop}} \ge 6.5\text{ m}$, $R_{\text{release}} = 7.5\text{ m}$, scale $1.35\times\text{–}1.60\times$, $+\Delta Z \in [0.25, 0.45]\text{ m}$), and 60 FPS frame-time telemetry (`performance_snapshot`). |
| **`ffmpeg`** | Lazy (`call_mcp_tool`) | `@ash_j1997/ffmpeg-mcp-server` + `ffprobe` (`9.0.1`) | **READY (VERIFIED)** | Inspecting and verifying `platodoomarcade.jpeg` source raster dimensions, codec, pixel format, and byte size (`media_probe` confirmed `1024×345` MJPEG, `34,997 bytes`, $\le 1.42\text{ MB}$ RGBA GPU footprint $\le 2.0\text{ MB}$ budget). |
| **`glbforge`** | Lazy (`call_mcp_tool`) | Host `glbforge` MCP server | **READY (VERIFIED)** | Inspecting 3D `.glb` assets (`freeman_alley.glb`, `character_hoodie.glb`, `characters/nicotest.glb`, and extracted GLB payloads from `skate3_cleanroom/parts/char_luis.part`) for node hierarchy, primitive counts, world-space bounding boxes, and verifying removal of `SkateAlley_Holo_Visualizer` / `Torus` meshes. |
| **`threejsresources`** | Eager (`mcp_threejsresources_*`) | Host `threejsresources` MCP server | **READY (VERIFIED)** | Reference guides and shader snippets (`threejs_search_guides`, `threejs_get_guide`, `threejs_get_code_snippet`) for Three.js `r186` post-processing passes, custom `ShaderMaterial` uniforms, and `CanvasTexture` best practices. |

### 1.1 Critical Worktree & Backing Server Startup Note
In Sandcastle git worktrees, `git sparse-checkout` excludes `character_hoodie.glb` and `/revcdos/` by default (`!/character_hoodie.glb`, `!/revcdos/`). If a worktree does not have `character_hoodie.glb` and `revcdos/` materialized on disk, `sandbox.js` will fail fast with HTTP 404 on `./character_hoodie.glb?v=051`.
- **Worktree Materialization Command (Already Executed in This Worktree; Run in Downstream Worktrees if Needed):**
  ```bash
  git sparse-checkout add character_hoodie.glb revcdos
  ```
- **Authoritative Local HTTP Server (`127.0.0.1:8080`):**
  Always serve the workspace using `scripts/serve_skatealley.py` (which supports HTTP 206 byte-range streaming for `.glb`/`.part`/`.wasm` files, `/api/health`, and asset materialization hooks) on port `8080`:
  ```bash
  python3 scripts/serve_skatealley.py --host 127.0.0.1 --port 8080
  ```
- **`threejs-devtools-mcp` Bridge Connection:**
  `threejs-devtools-mcp` is configured to proxy `http://localhost:57764` $\rightarrow$ `http://localhost:8080`. Navigating Playwright to `http://localhost:57764/` automatically injects the Three.js DevTools bridge into the live scene (`Bridge: connected`).

---

## 2. Live Empirical Baseline Telemetry Captured via MCP

During MCP provisioning and live probing against `http://localhost:57764/`, the following ground-truth baseline measurements were captured to anchor downstream implementation and verification:

1. **Three.js Scene Background (`threejs-devtools-mcp` $\rightarrow$ `scene_background`):**
   - Current baseline: `{"background": {"type": "Color", "color": "#080401"}, "toneMapping": 4, "toneMappingExposure": 0.72}`
   - **Spec 068 §13 Gap:** Must be updated from `#080401` (`0x080401`) to pure pitch black `#000000` (`0x000000`) across the scene background, clear color, and overhead sky port void.
2. **World-Space Hologram Showcase & Cyber-Drip Graffiti Header Dimensions (`threejs-devtools-mcp` $\rightarrow$ `object_details` & `run_js`):**
   - Current baseline for `SCREEN_MOUNT_01_DisplayFront`: `PlaneGeometry(width = 1.60, height = 0.98)`, `worldScale = [1, 1, 1]`.
   - Current baseline for `SCREEN_MOUNT_01_HeaderFront`: `PlaneGeometry(width = 2.32, height = 0.725)`, `worldScale = [1, 1, 1]`.
   - **Spec 068 §14 Gap:** Showcase planes must scale up to width $\ge 3.4\text{ m}$ ($3.4\text{ m}\text{–}3.8\text{ m}$ width with proportional height), and cyber-drip graffiti headers must scale proportionally to width $\ge 3.6\text{ m}$ ($3.6\text{ m}\text{–}4.2\text{ m}$ width).
3. **Screen Mount Texture Memory Budget (`threejs-devtools-mcp` $\rightarrow$ `texture_list`):**
   - All 7 station display textures are `1024 × 627` (`generateMipmaps: false`, `colorSpace: "srgb"`), and all 7 graffiti header textures (`SCREEN_MOUNT_01..07_GraffitiHeaderCanvasTex`) are `1024 × 320` (`generateMipmaps: false`).
4. **PlatoDoom Arcade Watercolor Texture (`ffmpeg` $\rightarrow$ `media_probe`):**
   - `platodoomarcade.jpeg` is `1024 × 345` (`mjpeg`, `34,997 bytes`, `34.2 KB` on disk, `1.41 MB` uncompressed RGBA $\le 2.0\text{ MB}$ budget).
5. **3D Corridor Asset (`glbforge` $\rightarrow$ `inspect`):**
   - `freeman_alley.glb`: `8 meshes, 28,534 triangles, 22.80 × 11.54 × 93.48 m, Y-up, 19 nodes`.

---

## 3. Tool Schemas & Exact Invocation Payloads

Because `agy` lazy-loads tools from `/Users/diesel/.gemini/antigravity-cli/mcp/<serverName>/<toolName>.json`, always invoke lazy tools via `call_mcp_tool` using the exact schemas below.

### 3.1 `playwright` MCP Server (`ServerName: "playwright"`)

#### `browser_navigate`
Navigate the browser to the live server (`http://127.0.0.1:8080/` or via the Three.js DevTools proxy `http://localhost:57764/`).
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_navigate",
  "Arguments": {
    "url": "http://localhost:57764/"
  }
}
```

#### `browser_resize`
Resize the browser viewport to verify desktop (`1280×800`), standard mobile (`390×844` iPhone 14), and compact mobile (`375×667` iPhone SE) layout budgets.
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_resize",
  "Arguments": {
    "width": 390,
    "height": 844
  }
}
```

#### `browser_evaluate`
Execute deterministic DOM, CSS, and WebGL state assertions inside the live page context.
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_evaluate",
  "Arguments": {
    "function": "() => { return { mode: window.sandbox?.mode, title: document.title }; }"
  }
}
```

#### `browser_click`
Click interactive UI elements (`#exit-mount-focus-btn`, `.holo-tag`, `#holo-tag-popup-close-btn`, `.holo-scrollbar-track`).
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_click",
  "Arguments": {
    "target": "#exit-mount-focus-btn",
    "element": "Top-right Exit button on Screen Mount modal"
  }
}
```

#### `browser_take_screenshot`
Capture visual evidence of the 2D modal, custom amber scrollbar, tag pop-up, CRT scanline effect, and 3D wall mounts. (`scale` is required by schema: `"css"` or `"device"`).
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_take_screenshot",
  "Arguments": {
    "scale": "css",
    "filename": "verify_spec068_mount01.png",
    "type": "png"
  }
}
```

#### `browser_console_messages`
Verify zero unhandled runtime errors or asset 404s (`level` is required by schema: `"error"`, `"warning"`, `"info"`, or `"debug"`).
```json
{
  "ServerName": "playwright",
  "ToolName": "browser_console_messages",
  "Arguments": {
    "level": "error",
    "all": true
  }
}
```

---

### 3.2 `threejs-devtools-mcp` MCP Server (`ServerName: "threejs-devtools-mcp"`)

#### `set_dev_port` & `bridge_status`
Configure the DevTools proxy target port (`8080`) and verify bridge connectivity.
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "set_dev_port",
  "Arguments": {
    "port": 8080
  }
}
```
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "bridge_status",
  "Arguments": {}
}
```

#### `scene_background`
Verify that `scene.background` is pure pitch-black `#000000` (Spec 068 §13).
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "scene_background",
  "Arguments": {}
}
```

#### `find_objects` & `object_details`
Locate and inspect `SCREEN_MOUNT_01..07_DisplayFront`, `SCREEN_MOUNT_01..07_HeaderFront`, sky port meshes, and PlatoDoom arcade watercolor meshes.
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "find_objects",
  "Arguments": {
    "namePattern": "SCREEN_MOUNT"
  }
}
```
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "object_details",
  "Arguments": {
    "name": "SCREEN_MOUNT_01_DisplayFront"
  }
}
```

#### `texture_list` & `performance_snapshot`
Verify all 7 station `CanvasTexture` allocations (`1024×627`, `generateMipmaps: false`) and 60 FPS frame budget.
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "texture_list",
  "Arguments": {}
}
```
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "performance_snapshot",
  "Arguments": {}
}
```

#### `run_js`
Execute read-only inspection queries directly with `scene`, `renderer`, `camera`, and `gl` in scope.
```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "run_js",
  "Arguments": {
    "code": "const m1 = scene.getObjectByName('SCREEN_MOUNT_01_DisplayFront'); const h1 = scene.getObjectByName('SCREEN_MOUNT_01_HeaderFront'); const b1 = new THREE.Box3().setFromObject(m1); const bh = new THREE.Box3().setFromObject(h1); return { bg: scene.background?.getHexString(), displayWidth: Math.hypot(b1.max.x - b1.min.x, b1.max.z - b1.min.z), headerWidth: Math.hypot(bh.max.x - bh.min.x, bh.max.z - bh.min.z) };"
  }
}
```

---

### 3.3 `ffmpeg` MCP Server (`ServerName: "ffmpeg"`)

#### `media_probe`
Verify image/video dimensions, codec, and byte footprint for `platodoomarcade.jpeg`.
```json
{
  "ServerName": "ffmpeg",
  "ToolName": "media_probe",
  "Arguments": {
    "inputPath": "/Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-mcp-provisioner-20261107T172758-750-iwl9/platodoomarcade.jpeg"
  }
}
```

---

### 3.4 `glbforge` MCP Server (`ServerName: "glbforge"`)

#### `inspect` & `inspect_geometry`
Verify `.glb` asset structure, triangle counts, and mesh names (including extracted GLB payloads from `skate3_cleanroom/parts/char_luis.part` to confirm `SKATEBOARD_ROOT` / wheels are present and `Torus` / `SkateAlley_Holo_Visualizer` is absent).
```json
{
  "ServerName": "glbforge",
  "ToolName": "inspect",
  "Arguments": {
    "path": "/Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-mcp-provisioner-20261107T172758-750-iwl9/freeman_alley.glb",
    "topology": false
  }
}
```

---

## 4. Live Coding Verification Playbook (Step-by-Step)

Downstream implementers (`architecture-implementer`, `stack-implementer`, `visual-implementer`, `optimization-implementer`, `storage-implementer`) and testers (`*-tester`, `e2e-validator`) MUST execute the following MCP verification steps against the live runtime to prove `{correct required outputs}` before handoff.

### Step 1: Verify Backing Server & Attach `playwright` + `threejs-devtools-mcp`
1. Ensure `scripts/serve_skatealley.py` is running on `127.0.0.1:8080` and `character_hoodie.glb` + `revcdos` are materialized in the worktree (`git sparse-checkout add character_hoodie.glb revcdos`).
2. Call `threejs-devtools-mcp` $\rightarrow$ `set_dev_port` with `{"port": 8080}`.
3. Call `playwright` $\rightarrow$ `browser_navigate` to `http://localhost:57764/`.
4. Call `threejs-devtools-mcp` $\rightarrow$ `bridge_status` to confirm `Bridge: connected`.

### Step 2: Verify Pillars 1–6 (2D Screen Mount Modal & 3D Canvas Texture Parity)
Run `playwright` $\rightarrow$ `browser_evaluate` across Desktop (`1280×800`) and Mobile (`390×844` and `375×667` via `browser_resize`) to assert all 6 core pillars across all 7 stations (`01` through `07`):

```json
{
  "ServerName": "playwright",
  "ToolName": "browser_evaluate",
  "Arguments": {
    "function": "async () => {\n  const results = [];\n  const popup = document.getElementById('holo-popup-window');\n  for (let idx = 0; idx < 7; idx++) {\n    if (typeof window.focusMountStation === 'function') {\n      window.focusMountStation(idx);\n    } else if (window.sandbox && typeof window.sandbox.enterMountFocus === 'function') {\n      window.sandbox.enterMountFocus(idx);\n    }\n    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));\n    const badge = document.querySelector('.holo-badge, #holo-station-badge');\n    const coords = document.getElementById('holo-coords-label');\n    const tether = document.getElementById('holo-tether-bridge');\n    const kicker = document.getElementById('holo-kicker');\n    const footer = document.querySelector('.holo-footer-bar');\n    const isHidden = (el) => !el || getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden';\n    const titleEl = document.getElementById('holo-title');\n    const exitBtn = document.getElementById('exit-mount-focus-btn');\n    const titleRect = titleEl?.getBoundingClientRect();\n    const exitRect = exitBtn?.getBoundingClientRect();\n    const scrollbar = document.getElementById('holo-custom-scrollbar') || document.querySelector('.holo-scrollbar-track');\n    const thumb = document.querySelector('.holo-scrollbar-thumb');\n    const sbStyle = scrollbar ? getComputedStyle(scrollbar) : null;\n    const descEl = document.getElementById('holo-description');\n    const descFontSize = descEl ? parseFloat(getComputedStyle(descEl).fontSize) : 0;\n    const tags = Array.from(document.querySelectorAll('#holo-tags button.holo-tag'));\n    const allTagsHavePlus = tags.length === 4 && tags.every(t => t.querySelector('.holo-tag-plus-bubble')?.textContent.trim() === '+');\n    let tagPopupChecks = [];\n    for (const tagBtn of tags) {\n      tagBtn.click();\n      await new Promise(r => requestAnimationFrame(r));\n      const tagPopup = document.getElementById('holo-tag-popup');\n      const descText = document.getElementById('holo-tag-popup-desc')?.textContent?.trim() || '';\n      tagPopupChecks.push({\n        active: tagBtn.classList.contains('active'),\n        popupVisible: Boolean(tagPopup && getComputedStyle(tagPopup).opacity !== '0' && getComputedStyle(tagPopup).display !== 'none'),\n        descLength: descText.length\n      });\n    }\n    if (tags[3]) tags[3].click();\n    await new Promise(r => requestAnimationFrame(r));\n    const metrics = Array.from(document.querySelectorAll('.holo-metric-box')).map(m => m.getBoundingClientRect());\n    const singleRowMetrics = metrics.length === 3 && Math.abs(metrics[0].top - metrics[1].top) < 2 && Math.abs(metrics[1].top - metrics[2].top) < 2;\n    const metricGap1 = metrics.length === 3 ? metrics[1].left - metrics[0].right : 0;\n    const scrollContainer = document.querySelector('.holo-scroll-viewport, .holo-body-grid') || popup;\n    results.push({\n      stationIndex: idx + 1,\n      chromeRemoved: isHidden(badge) && isHidden(coords) && isHidden(tether) && isHidden(kicker) && isHidden(footer),\n      exitTopRightValid: Boolean(exitRect && titleRect && exitRect.left >= titleRect.right + 8 && exitRect.width >= 44 && exitRect.height >= 36),\n      scrollbarImmediateVisible: Boolean(sbStyle && sbStyle.opacity === '1' && sbStyle.display !== 'none' && sbStyle.visibility === 'visible' && thumb),\n      descFontSize,\n      allTagsHavePlus,\n      allTagPopupsValid: tagPopupChecks.length === 4 && tagPopupChecks.every(c => c.active && c.popupVisible && c.descLength > 20),\n      singleRowMetrics,\n      metricGapPx: metricGap1,\n      scrollHeight: scrollContainer?.scrollHeight,\n      clientHeight: scrollContainer?.clientHeight,\n      zeroOverflow: scrollContainer ? scrollContainer.scrollHeight <= scrollContainer.clientHeight : false\n    });\n  }\n  return results;\n}"
  }
}
```

**Expected `{correct required outputs}`:**
- `chromeRemoved === true` for all 7 stations.
- `exitTopRightValid === true` (`exitBtnRect.left >= titleRect.right + 8`, hit area `≥ 44 × 36 px`), and clicking `#exit-mount-focus-btn` exits `mount-focus` mode.
- `scrollbarImmediateVisible === true` (`opacity === "1"` at `t = 0 ms` on both mobile and desktop).
- `descFontSize >= 16.5` on `375px` mobile and `>= 18.5` on `1280px` desktop.
- `allTagsHavePlus === true` and `allTagPopupsValid === true` across all 28 tags (7 stations × 4 tags).
- `singleRowMetrics === true`, `metricGapPx >= 8`, and `zeroOverflow === true` (`scrollHeight <= clientHeight`) on `390×844` and `375×667` mobile viewports for standard-length stations (`01, 02, 03, 05, 06, 07`).

### Step 3: Verify Addendum Pillars 1, 2, 5, 6 & 7 (3D Scene, Sky Port, CRT Pass, Showcase Scale & PlatoDoom Pop-Out)
Invoke `threejs-devtools-mcp` $\rightarrow$ `run_js` (or `playwright` $\rightarrow$ `browser_evaluate`) to verify the 3D scene invariants:

```json
{
  "ServerName": "threejs-devtools-mcp",
  "ToolName": "run_js",
  "Arguments": {
    "code": "const bgHex = scene.background ? scene.background.getHexString() : null;\nconst mounts = [];\nfor (let i = 1; i <= 7; i++) {\n  const id = String(i).padStart(2, '0');\n  const disp = scene.getObjectByName(`SCREEN_MOUNT_${id}_DisplayFront`);\n  const hdr = scene.getObjectByName(`SCREEN_MOUNT_${id}_HeaderFront`);\n  const db = disp ? new THREE.Box3().setFromObject(disp) : null;\n  const hb = hdr ? new THREE.Box3().setFromObject(hdr) : null;\n  mounts.push({\n    id,\n    displaySpanM: db ? Math.max(db.max.x - db.min.x, db.max.z - db.min.z) : 0,\n    headerSpanM: hb ? Math.max(hb.max.x - hb.min.x, hb.max.z - hb.min.z) : 0\n  });\n}\nreturn { bgHex, mounts };"
  }
}
```

**Expected `{correct required outputs}`:**
- `bgHex === "000000"` and clear color is `#000000` (pitch-black sky port, §13).
- `displaySpanM >= 3.4` (target $3.4\text{ m}\text{–}3.8\text{ m}$) and `headerSpanM >= 3.6` (target $3.6\text{ m}\text{–}4.2\text{ m}$) across all 7 stations (§14).
- CRT post-processing pass active with horizontal scanlines and phosphor mask within $\le 0.8\text{ ms}$ GPU frame budget (§12).
- Moving player camera within $6.5\text{ m}$ of the PlatoDoom arcade watercolor canvas triggers smooth scale $\ge 1.35\times$ ($1.35\times\text{–}1.60\times$) and forward normal translation $\ge +0.25\text{ m}$, releasing cleanly at $> 7.5\text{ m}$ (§10.2).

### Step 4: Verify Addendum Pillar 3 — Skate 3 Cleanroom (`/skate3_cleanroom/`)
1. Navigate Playwright to `http://127.0.0.1:8080/skate3_cleanroom/`:
   ```json
   {
     "ServerName": "playwright",
     "ToolName": "browser_navigate",
     "Arguments": {
       "url": "http://127.0.0.1:8080/skate3_cleanroom/"
     }
   }
   ```
2. Run `browser_evaluate` to verify that `pack.json` and the runtime default to `char=luis`, load `parts/char_luis.part` with `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, and 4 wheels attached, and contain **zero** `Torus` or `SkateAlley_Holo_Visualizer` nodes (§11.1).
3. Additionally, when rebuilding `skate3_cleanroom/parts/char_luis.part`, extract the embedded GLB (stripping the 37-byte header) to `/tmp/char_luis_verify.glb` and run `glbforge` $\rightarrow$ `inspect` to confirm all skateboard meshes are present and `Torus` / `SkateAlley_Holo_Visualizer` is absent.

### Step 5: Verify Addendum Pillar 4 — GTA Vice City (`/revcdos/`)
1. Navigate Playwright to `http://127.0.0.1:8080/revcdos/`:
   ```json
   {
     "ServerName": "playwright",
     "ToolName": "browser_navigate",
     "Arguments": {
       "url": "http://127.0.0.1:8080/revcdos/"
     }
   }
   ```
2. Run `browser_evaluate` to verify deterministic Luis player mounting (§11.2):
   ```json
   {
     "ServerName": "playwright",
     "ToolName": "browser_evaluate",
     "Arguments": {
       "function": "() => {\n  return {\n    status: window.__REVCDOS_STATUS__,\n    luisPlayerMounted: window.__REVCDOS_STATUS__?.luisPlayerMounted === true\n  };\n}"
     }
   }
   ```
   **Expected `{correct required outputs}`:** `window.__REVCDOS_STATUS__.luisPlayerMounted === true`, with `vcbr/luis_player/player.dff`, `player.txd`, and `player.bmp` mounted into `/vc-assets/local/models/` in `Module.FS`.
