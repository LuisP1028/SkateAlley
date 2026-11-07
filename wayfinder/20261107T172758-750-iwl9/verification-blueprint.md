# Master Verification Blueprint & Tester Deconfliction Architecture

- **Run ID:** `20261107T172758-750-iwl9`
- **Agent Node:** `verification-coordinator`
- **Branch:** `agent/verification-coordinator-20261107T172758-750-iwl9`
- **Authoritative Specifications & Planning Inputs:**
  - Seed Specification: [`functional_specification_068.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/functional_specification_068.md) (Core Pillars §1–§8 & System Addendum Pillars §9–§15)
  - Refined Technical Specification: [`wayfinder/20261107T172758-750-iwl9/refined-specification.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/refined-specification.md)
  - Implementation Blueprint: [`wayfinder/20261107T172758-750-iwl9/implementation-blueprint.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/implementation-blueprint.md)
  - Authoritative Domain Vocabulary: [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)
- **Synthesized Stage 3 Implementation Manifests & Blackboard Ledger (`seq=#1`–`#15`):**
  - `architecture-implementer` (`seq=#2`, `#3`, `#10`, `#15`): [`handoff/20261107T172758-750-iwl9/architecture-implementer.txt`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/handoff/20261107T172758-750-iwl9/architecture-implementer.txt)
  - `storage-implementer` (`seq=#1`, `#4`, `#14`): [`handoff/20261107T172758-750-iwl9/storage-implementer.txt`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/handoff/20261107T172758-750-iwl9/storage-implementer.txt)
  - `stack-implementer` (`seq=#8`, `#11`): [`handoff/20261107T172758-750-iwl9/stack-implementer.txt`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/handoff/20261107T172758-750-iwl9/stack-implementer.txt)
  - `optimization-implementer` (`seq=#5`, `#9`, `#13`): [`handoff/20261107T172758-750-iwl9/optimization-implementer.txt`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/handoff/20261107T172758-750-iwl9/optimization-implementer.txt)
  - `visual-implementer` (`seq=#6`, `#7`, `#12`): [`handoff/20261107T172758-750-iwl9/visual-implementer.txt`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/handoff/20261107T172758-750-iwl9/visual-implementer.txt)

---

## 1. Executive Charter & Stage 4 Verification Mandate ([`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/LANGUAGE.md))

This document is the authoritative Stage 4 verification blueprint and Blackboard deconfliction contract for:
- `architecture-tester`
- `storage-tester`
- `stack-tester`
- `optimization-tester`
- `visual-tester`
- `e2e-validator`

All five Stage 3 implementers completed their tasks with **100% disjoint file ownership** (`seq=#1` through `seq=#15`), ensuring zero merge conflicts across branches. Stage 4 testers must now verify the integrated runtime reality across all **6 Core Spec Pillars (§5.1–§5.6)** and **7 System Addendum Pillars (§9–§15)** against live WebGL, DOM, HTTP 206, PostgreSQL, and binary asset telemetry—without creating test-file collisions or conflicting source edits.

### 1.1 Strict Pre-Verification Gate: DO NOT CODE YET
> [!IMPORTANT]
> **NO TESTER AGENT MAY CREATE TEST FILES OR MODIFY APPLICATION SOURCE CODE UNTIL THE STAGE 4 BLACKBOARD PRE-CODE DECONFLICTION GATE (§6) IS SATISFIED.**
> Before writing any test suite or applying any targeted surgical remediation, each `*-tester` agent MUST register its exclusive test file claims and any remediation targets on the Stage 4 Blackboard (`blackboard claim ...`).

### 1.2 [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/LANGUAGE.md) Evaluation Matrix for Stage 4 Testers

| Evaluation Parameter | Stage 4 Verification Requirement & Evidence Standard |
| :--- | :--- |
| **`{errors}`** | Zero browser `pageerror` or uncaught exceptions, zero HTTP 404/500 responses (including in sparse git worktrees for `character_hoodie.glb` and `/revcdos/`), zero stale byte sizes or SHA-256 hash mismatches in `skate3_cleanroom/pack.json`, zero `Torus` or `SkateAlley_Holo_Visualizer` contamination in `char_luis.part`, zero WebGL stencil buffer loss, and zero silent exception suppression (`RULE[user_global]`). |
| **`{correctness}`** | Exact contract fidelity verified empirically: PlatoDoom pop-out hysteresis ($R_{\text{pop}} = 6.8\text{ m} \ge 6.5\text{ m}$, $R_{\text{release}} = 7.5\text{ m}$, scale $1.45\times \in [1.35\times, 1.60\times]$, forward normal relief $+0.35\text{ m} \in [+0.25\text{ m}, +0.45\text{ m}]$, cubic easing $\tau = 380\text{ ms}$), showcase geometry ($3.52\text{ m} \times 2.16\text{ m}$ screen at $Y = 2.17\text{ m}$ + $3.84\text{ m} \times 1.20\text{ m}$ graffiti header at `baseLocalOffsetY = 1.78 m`), Skate 3 `.part` binary wire format (`90,631,134 + 9,635,969 = 100,267,103 B`), and CRT optical pass budget ($\le 0.8\text{ ms}$ GPU frame time at capped $1.25$ DPR). |
| **`{functionality}`** | End-to-end live verification across the real HTTP server (`scripts/serve_skatealley.py`), real headless Chromium with Metal/ANGLE WebGL (`--use-gl=angle --use-angle=metal`), real PostgreSQL database (`postgresql://user:pass@127.0.0.1:5432/alpha`), and real binary assets (`glbforge`, `ffmpeg`, `Pillow`). |
| **`{correct required outputs}`** | Machine-verifiable telemetry outputs from `window.sandbox.getCRTOpticalPassState()`, `window.sandbox.waterColor.getState()`, `window.__SKATE3_CLEANROOM_STATUS__`, `window.__REVCDOS_STATUS__`, `scene.background.getHexString() === "000000"`, and exit code `0` on all verification suites. |
| **`{sufficient}`** | Every Core and Addendum pillar is backed by deterministic, automated assertions, live runtime telemetry dumps, and visual screenshot inspections across Desktop (`1280×800`), Standard Mobile (`390×844`), and Compact Mobile (`375×667`). |
| **`{insufficient}`** | Relying on static regex checks alone without launching the browser/server, ignoring sparse worktree asset materialization, or editing shared files without a Blackboard lock. |

---

## 2. Synthesis of Stage 3 Implementation Deliverables (`seq=#1`–`#15`)

All five Stage 3 implementers adhered strictly to the Anti-Collision Matrix in `implementation-blueprint.md` §5. Below is the exact inventory of what was built and where each contract lives in the merged codebase:

| Implementer Agent | Blackboard Ledger Seq | Modified / Created Files | Implemented Technical Contracts & Symbols |
| :--- | :--- | :--- | :--- |
| **`architecture-implementer`** | `seq=#2`, `#3`, `#10`, `#15` | • [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/sandbox.js)<br/>• [`watercolor_shader.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/watercolor_shader.js) | 1. **Pitch-Black Sky Port (`sandbox.js:1676–1703`, `23995`):** `DEPTH_FOG_COLOR_HEX = 0x000000`, `scene.background = new THREE.Color(0x000000)`, `renderer.setClearColor(0x000000, 1.0)`, `sandbox.sfx.depthFog.colorHex = '#000000'`.<br/>2. **Large-Scale Showcases & Headers (`sandbox.js:2999–3002`, `3105`, `3269–3405`, `14075–14214`):** `screenWidth = 3.52`, `screenHeight = 2.16`, `MOUNT_VERTICAL_ELEVATION_OFFSET = 0.42` ($Y_{\text{center}} = 2.17\text{ m}$, bottom edge at $1.09\text{ m} > 1.0\text{ m}$), `MOUNT_VIEWING_PITCH_RAD = 0.08`, `headerPlaneWidth = 3.84`, `headerPlaneHeight = 1.20`, `headerBaseLocalOffsetY = 1.78`.<br/>3. **Single-Pass CRT Post-Processing (`sandbox.js:1714–2034`, `15060–15068`, `19710–19728`):** `CRT_OPTICAL_PASS_SPEC`, `CRTShader`, `createCRTOpticalPassSubsystem` with `stencilBuffer: true`, `depthBuffer: true`, `isXRRenderTarget = true`, `SRGBColorSpace`, and `window.sandbox.getCRTOpticalPassState()`.<br/>4. **PlatoDoom Pop-Out Hysteresis (`watercolor_shader.js:84–115`, `727–741`, `971–997`, `1158–1596`):** `PORTAL_HEADER_LOGO_SPEC` (`1024×348`, `decodedRgbaBytes = 1425408`), `WATERCOLOR_GALLERY_SPEC` (`popOutTriggerRadiusMeters: 6.8`, `popOutReleaseRadiusMeters: 7.5`, `popOutScaleMultiplier: 1.45`, `popOutForwardOffsetMeters: 0.35`, `popOutTransitionDurationSec: 0.38`), `updateProximityPopOut()`, and `getState()` telemetry. |
| **`storage-implementer`** | `seq=#1`, `#4`, `#14` | • [`skate3_cleanroom/parts/char_luis.part`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/parts/char_luis.part)<br/>• [`skate3_cleanroom/parts/char_luis_holo.part`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/parts/char_luis_holo.part)<br/>• [`skate3_cleanroom/pack.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/pack.json)<br/>• [`skate3_cleanroom/loader.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/loader.js)<br/>• [`scripts/build_clean_skate3_luis_part.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/scripts/build_clean_skate3_luis_part.py)<br/>• [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/scripts/serve_skatealley.py)<br/>• [`revcdos/game.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/revcdos/game.js) | 1. **Skate 3 Cleanroom Binary Surgery:** Stripped `node 37 ("SkateAlley_Holo_Visualizer")` and `Mesh 1 ("Torus")` from `char_luis.part` (`9,635,969 B`), retaining `Mesh 0 ("LUIS")` with all 5 primitives (`LUIS_Body_Material`, `LUIS_Head_Material`, `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`) and 35 rig joints (`SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheels).<br/>2. **Manifest Integrity (`pack.json` & `loader.js`):** `"default_char": "luis"`, `size: 100267103` (`90,631,134 + 9,635,969`), `hash: "1b3a15685a84a425"`, and `window.__SKATE3_CLEANROOM_STATUS__`.<br/>3. **Worktree Materialization & HTTP 206 (`scripts/serve_skatealley.py`):** Added `ensure_worktree_character_hoodie()`, `ensure_worktree_revcdos_files()`, `'character_camera'` in `ALLOWED_SCENE_LAYOUT_KEYS`, and 64 KB buffered HTTP 206 range streaming with suffix range support.<br/>4. **GTA Vice City Eager Mount (`revcdos/game.js`):** Added `runEagerLuisPlayerVerification()` at startup to fetch and verify `player.dff` (`292,864 B`, `143` sectors), `player.txd` (`45,056 B`), `player.bmp` (`66,612 B`) and set `window.__REVCDOS_STATUS__.luisPlayerMounted = true` deterministically. |
| **`stack-implementer`** | `seq=#8`, `#11` | • `vendor/three/examples/jsm/postprocessing/*`<br/>• `vendor/three/examples/jsm/shaders/*`<br/>• `crt_optical_pass.js`<br/>• `tests/verify_stack_integrations.mjs` | 1. **Vendor Addons:** Provisioned all Three.js `r186` post-processing passes (`EffectComposer.js`, `RenderPass.js`, `ShaderPass.js`, `Pass.js`, `MaskPass.js`, `OutputPass.js`, etc.) and shaders (`CopyShader.js`, `OutputShader.js`, etc.) under `vendor/three/examples/jsm/` to satisfy browser importmap specifiers.<br/>2. **Standalone CRT Pass Module (`crt_optical_pass.js`):** Exports `CRT_OPTICAL_PASS_SPEC`, `CRTShader`, and `buildCRTOpticalPassSystem(renderer, scene, camera, options)` with `stencilBuffer: true` preservation.<br/>3. **Stack Verification Suite (`tests/verify_stack_integrations.mjs`):** Verifies Three.js addons, `crt_optical_pass.js` exports, and sparse worktree asset presence. |
| **`optimization-implementer`** | `seq=#5`, `#9`, `#13` | • [`assets/portal_games/platodoom_header.png`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/assets/portal_games/platodoom_header.png)<br/>• `assets/portal_games/platodoom_header.webp`<br/>• [`assets/portal_games/manifest.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/assets/portal_games/manifest.json)<br/>• `scripts/optimize_platodoom_textures.py`<br/>• `scripts/benchmark_cross_domain_performance.py`<br/>• `tests/verify_cross_domain_optimizations.py` | 1. **PlatoDoom Texture Downsampling:** Downsampled `platodoom_header.png` from `1120×381` (`338,782 B`) to **`1024×348`** (`289,642 B` on disk, `1,425,408 B` / `1.425 MB` decoded RGBA $\le 1.45\text{ MB}$ budget) and generated `platodoom_header.webp` (`46,368 B` $\le 120\text{ KB}$ budget) with transparent corners (`cornerAlphaMax = 0`) and `127,625` preserved interior white counter highlight pixels.<br/>2. **Manifest & Benchmarks:** Updated `assets/portal_games/manifest.json` (`outputWidth: 1024, outputHeight: 348, sha256: "c776ae1c..."`) and authored `tests/verify_cross_domain_optimizations.py` + `scripts/benchmark_cross_domain_performance.py`. |
| **`visual-implementer`** | `seq=#6`, `#7`, `#12` | • [`alley_atmosphere_023.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/alley_atmosphere_023.js)<br/>• [`index.html`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/index.html)<br/>• `assets/20261107T172758-750-iwl9/visual-implementer-*.png` | 1. **Cyber-Drip Graffiti Header Spec (`alley_atmosphere_023.js:1047–1060`, `1220`):** Updated `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC` to `planeWidthMeters: 3.84`, `planeHeightMeters: 1.20`, `baseLocalOffsetY: 1.78`, `worldMinYMeters: 2.55`, `worldMaxYMeters: 4.85`, and `evaluateGraffitiHeaderLevitation` `worldCenterY = 2.17 + localY`.<br/>2. **DOM Optical Overlay & Polish (`index.html:479–483`, `881–883`, `3383–3421`, `3625–3626`, `5073–5081`):** Added `#crt-optical-overlay` (`pointer-events: none !important; z-index: 9998; data-crt-scanline-intensity="0.16" data-crt-curvature="0.018" data-crt-vignette="0.32" data-crt-phosphor-mask="true"`), updated `#portal-header-logo-img` attributes to `1024×348`, enforced `min-width: 19px; min-height: 19px` on `.holo-tag-plus-bubble`, and eliminated transform transition delay on `.holo-window.active.mount-focus-active` for immediate $t = 0\text{ ms}$ scrollbar layout stability. |

---

## 3. End-to-End Verification Architecture & Tester Pipeline

```mermaid
flowchart TD
    subgraph S0 ["Stage 4.0: Blackboard Registration & Worktree Asset Materialization"]
        B0["All *-tester agents:<br/>1. Read verification-blueprint.md<br/>2. Claim owned test files on Blackboard (DO NOT CODE YET until claimed)<br/>3. Ensure character_hoodie.glb & revcdos/ exist via serve_skatealley.py"]
    end

    subgraph S1 ["Stage 4.1: Parallel Domain Verification Suites (Disjoint Test Files)"]
        TA["architecture-tester:<br/>• tests/verify_spec068_screen_mounts.mjs (Core Pillars 1-6)<br/>• tests/verify_architecture_addendum.mjs (Sky port #000000, Showcases 3.52x2.16m, Graffiti 3.84x1.20m, PlatoDoom Pop-Out 6.8m/7.5m, CRT Pass State)"]
        TS["storage-tester:<br/>• tests/verify_storage_persistence.py<br/>(Skate 3 char_luis.part binary GLB & pack.json 100,267,103B, /revcdos/ Luis eager mount, PostgreSQL alpha & HTTP 206 streaming)"]
        TK["stack-tester:<br/>• tests/verify_stack_integrations.mjs<br/>(Three.js r186 vendor postprocessing, crt_optical_pass.js, Playwright & MCP tool schemas)"]
        TO["optimization-tester:<br/>• tests/verify_cross_domain_optimizations.py & scripts/benchmark_cross_domain_performance.py<br/>(PlatoDoom 1024x348 PNG/WebP VRAM <= 1.425MB, CRT GPU <= 0.8ms, Zero-GC, Mipmaps disabled)"]
        TV["visual-tester:<br/>• tests/verify_visual_sensory_audit.mjs<br/>(Playwright Desktop 1280x800 & Mobile 390x844/375x667 visual grading, CRT scanlines/vignette, pitch-black sky port, 28 tag popups, screenshot diffing)"]
    end

    subgraph S2 ["Stage 4.2: Deconflicted Remediation & Final E2E Sign-Off"]
        R1["If any defect found:<br/>Post finding on Blackboard & route to exclusive file owner (§5)"]
        E2E["All 5 testers pass 100% -> blackboard done -> handoff/<run_id>/*-tester.txt"]
    end

    B0 --> TA & TS & TK & TO & TV
    TA & TS & TK & TO & TV --> R1
    R1 --> E2E
```

---

## 4. Detailed Verification Protocols by Tester Role

### 4.1 `architecture-tester` — Core Pillars 1–6 & 3D Scene / State Machine Verification
- **Owned Verification Suites:**
  - [`tests/verify_spec068_screen_mounts.mjs`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/tests/verify_spec068_screen_mounts.mjs) (existing Core Pillars 1–6 suite — must pass 100% unmodified or with additive assertions only)
  - `tests/verify_architecture_addendum.mjs` (new or extended suite for Addendum architectural contracts)
- **Mandatory Live Runtime Checks:**
  1. **Core Pillars 1–6 Regression (`node tests/verify_spec068_screen_mounts.mjs`):**
     - Verify Desktop (`1280×800`), Standard Mobile (`390×844`), and Compact Mobile (`375×667`) pass 100%:
       - Header telemetry (`#holo-station-badge`, `#holo-coords-label`, `#holo-tether-bridge`, `#holo-kicker`) and footer chrome (`.holo-footer-bar`, `#holo-footer-status`, `#holo-prev-mount-btn`, `#holo-station-pips`, `#holo-next-mount-btn`) are `display === 'none'`.
       - `#exit-mount-focus-btn` in `.holo-top-right` (`exitRect.left >= titleRect.right + 8`, hit target $\ge 44 \times 36\text{ px}$), returning `window.__sandbox.mode` to `'freeroam'` on click.
       - `#holo-custom-scrollbar` and `#holo-custom-scrollbar-thumb` visible at $t = 0\text{ ms}$ (`opacity === 1`, `visibility === 'visible'`).
       - `#holo-description` font size $\ge 18.5\text{ px}$ (desktop) and $\ge 16.5\text{ px}$ (mobile).
       - All 28 tags across `SCREEN_MOUNT_01`–`07` render `<button class="holo-tag">` with `.holo-tag-plus-bubble` (`+`), rotate `45deg` on click, and hydrate `#holo-tag-popup` from `HOLO_TAG_DESCRIPTIONS`.
       - `.holo-metrics-grid` renders 3 cards in a single horizontal row (`gap >= 7.5 px`) with `scrollHeight <= clientHeight + 1` on `390×844` mobile for standard stations (`01`–`06`).
  2. **Addendum Pillar 2 — PlatoDoom Proximity Pop-Out State Machine (§10.2 & §15.2):**
     - In Playwright against the live scene, query `window.sandbox.waterColor.getState()`:
       - Verify `popOutTriggerRadiusMeters === 6.8` ($\ge 6.5\text{ m}$), `popOutReleaseRadiusMeters === 7.5` ($1.0\text{ m}$ hysteresis), `popOutScaleMultiplier === 1.45` ($\in [1.35, 1.60]$), `popOutForwardOffsetMeters === 0.35` ($\in [0.25, 0.45]$), `popOutTransitionDurationSec === 0.38`.
       - Move active character / camera to `z = 36.0` (within $6.8\text{ m}$ of `anchorPosition.z = 42.0129`), step simulation (`window.sandbox.waterColor.updateProximityPopOut(0.4, { x: 0, y: 0, z: 36.0 }, { immediate: true })`), and assert:
         - `state.isPoppedOut === true`
         - `state.currentScaleMultiplier === 1.45` (`canvasScaleX === 7.25`, `canvasScaleY === 7.25`)
         - `state.currentForwardOffsetMeters === 0.35` (`canvasPositionZ === 41.6629`, i.e. $42.0129 - 0.35$)
       - Move to hysteresis band `z = 34.8` ($d \approx 7.21\text{ m} \in (6.8, 7.5)$) and assert `state.isPoppedOut === true` (no boundary chatter).
       - Move outside release radius to `z = 33.5` ($d \approx 8.51\text{ m} \ge 7.5\text{ m}$) and assert `state.isPoppedOut === false`, `currentScaleMultiplier === 1.0`, `canvasPositionZ === 42.0129`.
  3. **Addendum Pillar 6 — Pitch-Black Sky Port (§13 & §15.6):**
     - Assert `window.__THREE_SCENE__.background.getHexString() === '000000'`, `window.__THREE_SCENE__.fog.color.getHexString() === '000000'`, `window.sandbox.sfx.depthFog.colorHex === '#000000'`, and renderer clear color is `#000000`.
  4. **Addendum Pillar 7 — Large-Scale Showcases & Proportional Graffiti Headers (§14 & §15.7):**
     - Across all 7 `window.sandbox.wallMounts` (`SCREEN_MOUNT_01`–`07`), assert:
       - `m.screenWidth === 3.52` ($\ge 3.4\text{ m}$), `m.screenHeight === 2.16`.
       - `m.locatorPosition.y === 2.17` (bottom edge $2.17 - 1.08 = 1.09\text{ m} > 1.0\text{ m}$ above floor).
       - `m.mountViewingPitchRad === 0.08`.
       - `m.headerWidth === 3.84` ($\ge 3.6\text{ m}$), `m.headerHeight === 1.20`, `m.headerBaseLocalOffsetY === 1.78` (bottom of header at $1.78 - 0.60 = 1.18\text{ m} > 1.08\text{ m}$ top of display, guaranteeing $+100\text{ mm}$ clearance with zero overlap).

---

### 4.2 `storage-tester` — Binary `.part` Archives, RenderWare Overrides, PostgreSQL & HTTP 206 Verification
- **Owned Verification Suite:**
  - `tests/verify_storage_persistence.py`
- **Mandatory Live Runtime Checks:**
  1. **Addendum Pillar 3 — Skate 3 Cleanroom Spawning Rig (`skate3_cleanroom/` — §11.1 & §15.3):**
     - Inspect [`skate3_cleanroom/pack.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/pack.json):
       - Assert `pack["default_char"] == "luis"`.
       - Assert `pack["core"]["size"] == 100267103` and `pack["characters"]["luis"]["size"] == 100267103` (`90,631,134 + 9,635,969`).
       - Assert `pack["characters"]["luis"]["hash"] == hashlib.sha256(open("skate3_cleanroom/parts/char_luis.part", "rb").read()).hexdigest()[:16]` (`"1b3a15685a84a425"`).
     - Inspect [`skate3_cleanroom/parts/char_luis.part`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/parts/char_luis.part) binary header & embedded glTF 2.0 JSON:
       - Verify 37-byte header: `struct.unpack_from("<I", raw, 0)[0] == 25`, `raw[4:29] == b"assets/private/skater.glb"`, `struct.unpack_from("<Q", raw, 29)[0] == len(raw) - 37` (`9,635,932 B`).
       - Parse glTF 2.0 JSON chunk (`raw[37:]`):
         - Verify **zero** nodes or meshes contain `"Torus"` or `"SkateAlley_Holo_Visualizer"`, and **zero** materials contain `"HOLOSYS_Visualizer_Holo_Material"`.
         - Verify `Mesh 0 ("LUIS")` has all **5 primitives**: `LUIS_Body_Material`, `LUIS_Head_Material`, `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`.
         - Verify all skateboard hierarchy joints exist in `nodes`: `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, `WHEEL_FRONT_LEFT`, `WHEEL_FRONT_RIGHT`, `WHEEL_BACK_LEFT`, `WHEEL_BACK_RIGHT`.
     - Navigate Playwright to `http://127.0.0.1:<port>/skate3_cleanroom/` (with no query parameters) and verify `window.__SKATE3_CLEANROOM_STATUS__` reports `defaultChar === "luis"`, `selectedCharKey === "luis"`, `skateboardPrimitivesPresent === true`, `torusVisualizerPresent === false`, `corePackSize === 100267103`, `status === "READY"`.
  2. **Addendum Pillar 4 — GTA Vice City (`/revcdos/`) Deterministic `Luis` Spawning (§11.2 & §15.4):**
     - Verify `scripts/serve_skatealley.py` worktree materialization functions (`ensure_worktree_character_hoodie`, `ensure_worktree_revcdos_files`) ensure `character_hoodie.glb` (`1,357,020 B`) and `revcdos/vcbr/luis_player/player.{dff,txd,bmp}` exist on disk.
     - Verify `revcdos/vcbr/luis_player/player.dff` is `292,864 B` (`143` sectors of `2048 B`), `player.txd` is `45,056 B` (`22` sectors), and `player.bmp` is `66,612 B`.
     - Navigate Playwright to `http://127.0.0.1:<port>/revcdos/` (with no query parameters) and verify `window.__REVCDOS_STATUS__.luisPlayerMounted === true`, `luisPlayerDffBytes === 292864`, `luisPlayerDirSectors === 143`, `luisPlayerVerts === 4006`, `luisPlayerBones === 24`, `lastError === null`.
  3. **PostgreSQL `alpha` & HTTP 206 Byte-Range Streaming (`scripts/serve_skatealley.py`):**
     - Verify `/api/health` returns `200 OK` with `"status": "ok"`.
     - Verify `/api/scene-layout` supports all 7 allowed keys (`holo_columns`, `math_pods`, `character_camera`, `lamppost_light`, `player_spawn`, `startup_camera_pan`, `watercolor_display`) and `/api/stickers` returns placed stickers from PostgreSQL (`postgresql://user:pass@127.0.0.1:5432/alpha`).
     - Send HTTP `Range: bytes=0-36` and suffix `Range: bytes=-1024` requests against `/skate3_cleanroom/parts/char_luis.part` and assert `HTTP 206 Partial Content`, `Accept-Ranges: bytes`, `Content-Range`, and exact byte payload fidelity; send out-of-bounds range and assert `HTTP 416`.

---

### 4.3 `stack-tester` — Three.js Vendor Addons, CRT Pass Module & MCP Tooling Verification
- **Owned Verification Suite:**
  - [`tests/verify_stack_integrations.mjs`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/tests/verify_stack_integrations.mjs)
- **Mandatory Live Runtime Checks:**
  1. **Three.js `r186` & Vendor Post-Processing Addons:**
     - Run `node tests/verify_stack_integrations.mjs` and verify all required files in `vendor/three/examples/jsm/postprocessing/` (`EffectComposer.js`, `RenderPass.js`, `ShaderPass.js`, `Pass.js`, `MaskPass.js`, `OutputPass.js`) and `vendor/three/examples/jsm/shaders/CopyShader.js` resolve cleanly and match the browser `<script type="importmap">` in `index.html`.
  2. **CRT Optical Pass Contract (`crt_optical_pass.js` & `window.sandbox.getCRTOpticalPassState()`):**
     - Verify both standalone `crt_optical_pass.js` (`CRT_OPTICAL_PASS_SPEC`, `CRTShader`, `buildCRTOpticalPassSystem`) and the live in-browser `window.sandbox.getCRTOpticalPassState()` return:
       - `enabled: true`
       - `scanlinesActive: true`, `scanlineIntensity: 0.16` ($\in [0.12, 0.22]$), `scanlineCount: 640`
       - `phosphorMaskActive: true`, `phosphorMaskIntensity: 0.05`
       - `curvature: 0.018` ($\le 0.025$), `barrelDistortionK1: 0.018`
       - `vignette: 0.32`, `vignetteActive: true`
       - `centerChromaticOffsetPx: 0`, `edgeChromaticOffsetPx <= 0.75`
       - `gpuFrameTimeMs <= 0.80`
       - `pointerEventsBlocked: false`
     - Verify `window.sandbox.crtOpticalPass.renderTarget.stencilBuffer === true` and `depthBuffer === true` in the live browser context so character silhouette occlusion never clips.

---

### 4.4 `optimization-tester` — Texture Budgets, VRAM Footprint, GPU Frame Time & Zero-GC Verification
- **Owned Verification Suites:**
  - [`tests/verify_cross_domain_optimizations.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/tests/verify_cross_domain_optimizations.py)
  - [`scripts/benchmark_cross_domain_performance.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/scripts/benchmark_cross_domain_performance.py)
- **Mandatory Live Runtime Checks:**
  1. **Addendum Pillar 1 — PlatoDoom Arcade Texture Downsampling (§10.1 & §15.1):**
     - Run `python3 tests/verify_cross_domain_optimizations.py` and `python3 scripts/benchmark_cross_domain_performance.py`:
       - Verify `assets/portal_games/platodoom_header.png` is `1024 × 348` (`289,642 B` $\le 295\text{ KB}$ disk, `1,425,408 B` / `1.425 MB` decoded RGBA $\le 1.45\text{ MB}$ and $\le 2.0\text{ MB}$ budget).
       - Verify `assets/portal_games/platodoom_header.webp` is `1024 × 348` (`46,368 B` $\le 120\text{ KB}$ budget).
       - Verify `platodoomarcade.jpeg` is `1024 × 345` (`34,997 B` disk, `1.413 MB` decoded RGBA).
       - Verify corner alpha transparency (`cornerAlphaMax == 0`) and interior white counter highlights (`> 15,000` opaque white pixels; actual `127,625` pixels).
       - Use `ffmpeg` (`media_probe`) or Python `Pillow` to confirm zero resolution regressions.
  2. **GPU & Memory Operational Budgets:**
     - Verify `window.sandbox.getCRTOpticalPassState().gpuFrameTimeMs <= 0.8` ms across 60 rendered frames at capped `1.25` DPR.
     - Verify all 7 3D screen mount `CanvasTexture` instances (`1024 × 627`) have `generateMipmaps === false` and dirty-flagged updates (`0 B/s` steady-state PCIe upload when idle).
     - Verify zero per-frame object allocations in `updateProximityPopOut` and `crtOpticalPassSystem.render`.

---

### 4.5 `visual-tester` — Sensory, Typography, Layout & CRT Optical Grading Verification
- **Owned Verification Suite:**
  - `tests/verify_visual_sensory_audit.mjs`
- **Mandatory Live Runtime & Visual Checks:**
  1. **Live Visual Inspection Across Viewports (`1280×800`, `390×844`, `375×667`):**
     - Capture live screenshots in headless Chromium (with Metal/ANGLE WebGL enabled) and inspect them using `read_file` (multimodal vision inspection) against the reference visual targets in `assets/20261107T172758-750-iwl9/`:
       - **Pitch-Black Sky Port (§13):** Overhead ceiling/sky void above the brick walls renders as pure `#000000` deep space black with zero warm brown/umber (`#080401` / `#0b0501`) haze, while low-altitude ground fog remains anchored near the alley floor ($Y \le 1.8\text{ m}$).
       - **Large-Scale Showcases & Cyber-Drip Graffiti Headers (§14):** All 7 `3.52 m × 2.16 m` holographic showcases and their `3.84 m × 1.20 m` levitating graffiti headers (`baseLocalOffsetY = 1.78 m`) command the brick walls with crisp readability and zero vertical overlap between the header bottom edge and showcase top bezel.
       - **Full-Screen CRT Optical Pass (§12):** Both the WebGL CRT shader pass (`CRTShader`) and `#crt-optical-overlay` (`pointer-events: none; z-index: 9998`) impart authentic horizontal scanlines ($0.16$), subtle barrel curvature ($1.8\%$), and corner vignetting without blurring body copy inside the central 70% reading zone or blocking pointer clicks on tags/buttons.
       - **PlatoDoom Proximity Pop-Out (§10.2):** Approaching within $6.8\text{ m}$ of the end-of-alley PlatoDoom canvas visibly expands the portal (`1.45×`), shifts it forward (`+0.35 m`), and illuminates its border in warm amber (`#fbbf24`).
       - **Focused Terminal UI (Core Pillars 1–6):** Verify zero top-bar telemetry badges/coords/tether icons, zero bottom footer bar, top-right `✕ EXIT` button in the former TOC slot, immediately visible amber scrollbar at $t = 0\text{ ms}$, enlarged description typography, interactive `+` tag bubbles rotating `45deg` on click, and compact 3-column summary cards with zero vertical scroll overflow on `390×844` mobile.

---

## 5. Strict Tester File Ownership & Remediation Deconfliction Matrix

To prevent concurrent edit collisions or duplicate test files during Stage 4, ownership is strictly partitioned as follows:

| Tester Agent | Exclusive Test Suite File Ownership | Permitted Application Remediation Scope (ONLY after Blackboard Claim) |
| :--- | :--- | :--- |
| **`architecture-tester`** | • [`tests/verify_spec068_screen_mounts.mjs`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/tests/verify_spec068_screen_mounts.mjs)<br/>• `tests/verify_architecture_addendum.mjs` | [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/sandbox.js), [`watercolor_shader.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/watercolor_shader.js) |
| **`storage-tester`** | • `tests/verify_storage_persistence.py` | [`skate3_cleanroom/pack.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/pack.json), [`skate3_cleanroom/loader.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/loader.js), [`skate3_cleanroom/parts/char_luis.part`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/skate3_cleanroom/parts/char_luis.part), [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/scripts/serve_skatealley.py), [`revcdos/game.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/revcdos/game.js) |
| **`stack-tester`** | • [`tests/verify_stack_integrations.mjs`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/tests/verify_stack_integrations.mjs) | [`crt_optical_pass.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/crt_optical_pass.js), `vendor/three/examples/jsm/**` |
| **`optimization-tester`** | • [`tests/verify_cross_domain_optimizations.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/tests/verify_cross_domain_optimizations.py)<br/>• [`scripts/benchmark_cross_domain_performance.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/scripts/benchmark_cross_domain_performance.py) | [`assets/portal_games/platodoom_header.png`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/assets/portal_games/platodoom_header.png), `assets/portal_games/platodoom_header.webp`, [`assets/portal_games/manifest.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/assets/portal_games/manifest.json) |
| **`visual-tester`** | • `tests/verify_visual_sensory_audit.mjs`<br/>• `assets/20261107T172758-750-iwl9/visual-tester-*.png` | [`alley_atmosphere_023.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/alley_atmosphere_023.js), [`index.html`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-verification-coordinator-20261107T172758-750-iwl9/index.html) |

---

## 6. Stage 4 Blackboard Deconfliction Protocol & Pre-Code Gate

### 6.1 Mandatory Pre-Code Gate (`DO NOT CODE YET`)
1. **Register Test Ownership Claims First:**
   Upon activation, every `*-tester` agent MUST read the Stage 4 Blackboard (`blackboard read --since 0`) and post a `claim` for its assigned test suite before creating or editing any file:
   ```bash
   blackboard claim "Claiming exclusive ownership of <test_file_path> for <agent-name>"
   ```
2. **Materialize Worktree Sparse Assets Before Launching Browser/Server Tests:**
   In Sandcastle worktrees, `character_hoodie.glb` and `revcdos/` are sparse-excluded by default. Before running Playwright or HTTP tests against the worktree, testers MUST either run `python3 -c "import scripts.serve_skatealley as s; s.ensure_worktree_character_hoodie(); s.ensure_worktree_revcdos_files()"` or launch `python3 scripts/serve_skatealley.py --host 127.0.0.1 --port <ephemeral_port>` (which materializes them automatically on startup).
3. **Ephemeral Port Isolation:**
   Because all 5 testers execute in parallel, **never hardcode port `8080` or `3002` in automated test runners without dynamic port fallback**. Always bind test HTTP servers to port `0` (ephemeral OS-assigned port) or a role-specific port (`architecture-tester: 18081`, `storage-tester: 18082`, `stack-tester: 18083`, `optimization-tester: 18084`, `visual-tester: 18085`) so parallel test suites never collide on `EADDRINUSE`.
4. **Zero Unclaimed Source Edits (Remediation Deconfliction):**
   - If all verification assertions pass (as expected given Stage 3 verification), **do not touch application source files** (`sandbox.js`, `watercolor_shader.js`, `alley_atmosphere_023.js`, `index.html`, `skate3_cleanroom/*`, `revcdos/*`, `scripts/serve_skatealley.py`) so git branch merges remain 100% conflict-free.
   - If a tester discovers a genuine bug in a file owned by another domain (per §5), it MUST post a Blackboard request (`blackboard request <owner-tester> " Fix <issue> in <file>"`) or claim the file explicitly on the Blackboard after verifying no other tester holds a claim on that file.
5. **Completion & Settlement:**
   Once a tester's verification suite passes 100% with zero `{errors}`, it must post a summary finding (`blackboard post-finding "VERIFIED: <suite> 100% pass — <metrics>"`), run `blackboard done`, write `handoff/20261107T172758-750-iwl9/<role>-tester.txt`, commit its owned test artifacts, and output `<promise>COMPLETE</promise>`.
