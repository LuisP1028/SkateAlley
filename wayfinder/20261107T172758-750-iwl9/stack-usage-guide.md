# Stack, API, MCP & Library Usage Guide (`stack-usage-guide.md`)

- **Run ID:** `20261107T172758-750-iwl9`
- **Branch:** `agent/stack-planner-20261107T172758-750-iwl9`
- **Agent Node:** `stack-planner`
- **Target Specification:** [`functional_specification_068.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/functional_specification_068.md) (Core Pillars §1–§8 & System Addendum §9–§15)
- **Authoritative Domain Vocabulary:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)
- **Synthesized Scanner & Peer Inputs:**
  - [`wayfinder/20261107T172758-750-iwl9/installed-libraries.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/installed-libraries.md) (`library-installer`)
  - [`wayfinder/20261107T172758-750-iwl9/library-functions.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/library-functions.md) (`function-mapper`)
  - [`wayfinder/20261107T172758-750-iwl9/api-schemas.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/api-schemas.md) (`api-schema-mapper`)
  - [`wayfinder/20261107T172758-750-iwl9/mcp-tools.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/mcp-tools.md) (`mcp-provisioner`)
  - [`wayfinder/20261107T172758-750-iwl9/codebase-map.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/wayfinder/20261107T172758-750-iwl9/codebase-map.md) (`codebase-mapper`)

---

## 1. Working Baseline Framing & Domain Vocabulary Alignment

> **Working Baseline Advisory:** This guide synthesizes all verified libraries, runtimes, binary wire protocols, Emscripten virtual filesystems, and MCP servers into an opinionated, battle-tested implementation guide for **Functional Specification 068** and its **System Addendum**. It is designed to accelerate downstream coding and testing agents (`architecture-implementer`, `stack-implementer`, `visual-implementer`, `optimization-implementer`, `storage-implementer`, and `*-tester`) with zero-guesswork signatures and real-world edge-case mitigations. Serve this as a practical working baseline that yields to live empirical runtime telemetry whenever physical reality dictates adjustments.

### 1.1 [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/LANGUAGE.md) Alignment
- **`{functionality}`:** End-to-end execution of Core Pillars 1–6 (2D/3D screen mount layout, top-right exit control, persistent $t = 0\text{ ms}$ amber scrollbar, enlarged typography, 28 interactive `+` bubble tags, compact 3-card metrics strip) alongside Addendum Pillars 1–7 (`1024 × 348` PlatoDoom texture downsampling, $R_{\text{pop}} = 6.8\text{ m}$ proximity pop-out, Skate 3 `Luis` + skateboard rig with zero `Torus`, GTA Vice City deterministic `Luis` player mount, $\le 0.8\text{ ms}$ CRT post-processing optical pass, `#000000` pitch-black sky port, and $3.52\text{ m} \times 2.16\text{ m}$ large-scale showcases with $3.84\text{ m} \times 1.20\text{ m}$ graffiti headers).
- **`{correctness}`:** Exact adherence to installed library versions (`three@0.186.1`, `Pillow@10.4.0`, `playwright@1.65.0-alpha`, `trimesh@5.1.1`, Python `3.12.7`, Node.js `v24.9.0`), browser import maps, WebGL stencil/tone-mapping contracts, and binary `.part` / RenderWare `.dff`/`.txd`/`.dir` wire formats.
- **`{errors}`:** Zero unhandled exceptions, zero HTTP 404s in sparse worktrees, zero stale `pack.json` byte-size mismatches, zero broken importmap specifiers, and zero silent fallbacks (`RULE[user_global]`).
- **`{sufficient}`:** All imports, constructors, uniform mutations, binary chunk offsets, and MCP verification calls are fully specified below.

---

## 2. Idiomatic Language & Runtime Patterns

| Runtime / Layer | Version & Binary Path | Idiomatic Usage Rules & Architectural Guardrails |
| :--- | :--- | :--- |
| **Browser ES Modules (`index.html`, `sandbox.js`, `watercolor_shader.js`, `alley_atmosphere_023.js`)** | Native ES2022+ via `<script type="importmap">` | • `index.html` maps `"three"` $\rightarrow$ `"./vendor/three/build/three.module.js"` and `"three/addons/"` $\rightarrow$ `"./vendor/three/examples/jsm/"`.<br/>• **Zero Per-Frame GC Allocations:** Never instantiate `new THREE.Vector2()`, `new THREE.Vector3()`, `new THREE.Box3()`, or `new THREE.Color()` inside `stepSimulation(dt)` or `.update(dt)`. Preallocate module-level scratch instances and mutate via `.set()`, `.copy()`, or `.lerp()`.<br/>• **Node + Browser Dual-Compatibility:** Guard DOM access with `if (typeof document !== 'undefined')` so unit tests importing `sandbox.js` or `watercolor_shader.js` in Node.js never throw `ReferenceError: document is not defined`. |
| **Python 3.12 Asset & Server Tooling (`scripts/serve_skatealley.py`, GLB & Texture Scripts)** | `/Users/diesel/Desktop/SkateAlley/.sandcastle/bin/python3` (`3.12.7`) | • Use `Pillow@10.4.0` (`Image.Resampling.LANCZOS`) for deterministic RGBA/WebP image downsampling.<br/>• Use Python stdlib `struct` + `json` + `hashlib` for surgery on glTF 2.0 chunks inside Skate 3 `.part` archives (`skate3_cleanroom/parts/char_*.part`) to preserve exact skin/joint `inverseBindMatrices` and node indices.<br/>• Use atomic temp-file write + `os.replace()` (or `os.symlink` / `os.link`) when materializing worktree assets so concurrent readers never observe partial files. |
| **Node.js Playwright Verification (`tests/verify_spec068_*.mjs`)** | `/opt/homebrew/bin/node` (`v24.9.0`) + `playwright@1.65.0-alpha` | • Resolve `playwright` via `createRequire(import.meta.url)('playwright')`.<br/>• Always pass `args: ['--use-gl=angle', '--use-angle=metal']` to `chromium.launch()` so WebGL2 and WebGPU shaders execute on hardware Metal rather than slow software SwiftShader.<br/>• Wrap server and browser lifecycle in `try { ... } finally { await browser?.close(); server?.kill(); }`. |

---

## 3. Library & Function Invocation Patterns

### 3.1 Three.js (`three@0.186.1`) — `EffectComposer`, `RenderPass`, `ShaderPass` & Custom `CRTShader`

#### Critical Browser Importmap & RenderTarget Gotchas (Must Read Before Coding)
1. **`vendor/three/examples/jsm/` Directory Contents:**
   `index.html` maps `"three/addons/"` to `./vendor/three/examples/jsm/`. Currently, `./vendor/three/examples/jsm/` contains only `controls/`, `loaders/`, and `utils/`—it does **not** yet contain `postprocessing/` or `shaders/`, whereas `node_modules/three/examples/jsm/postprocessing/` and `node_modules/three/examples/jsm/shaders/` have the full files.
   - **Rule:** If importing `EffectComposer`, `RenderPass`, and `ShaderPass` from `'three/addons/postprocessing/...'`, you **MUST** copy `postprocessing/{EffectComposer,RenderPass,ShaderPass,Pass,MaskPass,OutputPass}.js` and `shaders/CopyShader.js` from `node_modules/three/examples/jsm/` into `vendor/three/examples/jsm/`:
     ```bash
     mkdir -p vendor/three/examples/jsm/postprocessing vendor/three/examples/jsm/shaders
     cp node_modules/three/examples/jsm/postprocessing/{EffectComposer,RenderPass,ShaderPass,Pass,MaskPass,OutputPass}.js vendor/three/examples/jsm/postprocessing/
     cp node_modules/three/examples/jsm/shaders/CopyShader.js vendor/three/examples/jsm/shaders/
     ```
2. **Stencil Buffer Preservation (`stencilBuffer: true`):**
   `sandbox.js` uses WebGL stencil testing (`applyCharacterOcclusionStencilReject` at lines `1855–1880`: `stencilWrite = true`, `stencilRef = 1`, `NotEqualStencilFunc`) so holographic effects never occlude the player character. By default, `new EffectComposer(renderer)` creates a `WebGLRenderTarget` without checking stencil requirements, or if custom-constructed, defaults must explicitly include `stencilBuffer: true` and `depthBuffer: true`.
3. **Single-Pass Tone Mapping & sRGB Output ($\le 0.8\text{ ms}$ GPU Budget):**
   When `RenderPass` renders `scene` into an offscreen `WebGLRenderTarget`, Three.js `r186` writes linear-space values and skips `ACESFilmicToneMapping` unless either `OutputPass` is chained (which costs an extra full-screen pass) or tone mapping + sRGB conversion are included directly in `CRTShader` (`#include <tonemapping_fragment>` and `#include <colorspace_fragment>`). Inlining them directly into `CRTShader` keeps the entire CRT pass to a **single full-screen quad draw call** well under the $\le 0.8\text{ ms}$ GPU frame budget at capped `1.25` DPR.

#### Verbatim `EffectComposer` + `RenderPass` + `ShaderPass(CRTShader)` Implementation Pattern
```javascript
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const CRT_OPTICAL_PASS_SPEC = Object.freeze({
  enabled: true,
  scanlineIntensity: 0.16,       // Spec §12.1: within [0.12, 0.22]
  scanlineCount: 640.0,
  curvature: 0.018,              // Spec §12.1: barrel distortion k1 <= 0.025 (<= 2.5%)
  vignette: 0.32,                // Corner vignetting power
  phosphorMaskIntensity: 0.05,   // RGB aperture grille modulation
  bloomHalationIntensity: 0.08,  // Subtle phosphor highlight bleed
  refreshHumAmplitude: 0.012,    // < 0.015 (1.5%) temporal refresh roll
  edgeChromaticOffsetPx: 0.60,   // <= 0.75 px at outer 15% perimeter, 0.0 px in center 70%
});

export const CRTShader = {
  name: 'SkateAlleyCRTShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1280, 800) },
    uScanlineIntensity: { value: CRT_OPTICAL_PASS_SPEC.scanlineIntensity },
    uScanlineCount: { value: CRT_OPTICAL_PASS_SPEC.scanlineCount },
    uCurvature: { value: CRT_OPTICAL_PASS_SPEC.curvature },
    uVignette: { value: CRT_OPTICAL_PASS_SPEC.vignette },
    uPhosphorMaskIntensity: { value: CRT_OPTICAL_PASS_SPEC.phosphorMaskIntensity },
    uBloomIntensity: { value: CRT_OPTICAL_PASS_SPEC.bloomHalationIntensity },
    uRefreshHum: { value: CRT_OPTICAL_PASS_SPEC.refreshHumAmplitude },
    uEdgeChromaticPx: { value: CRT_OPTICAL_PASS_SPEC.edgeChromaticOffsetPx },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uScanlineIntensity;
    uniform float uScanlineCount;
    uniform float uCurvature;
    uniform float uVignette;
    uniform float uPhosphorMaskIntensity;
    uniform float uBloomIntensity;
    uniform float uRefreshHum;
    uniform float uEdgeChromaticPx;
    varying vec2 vUv;

    vec2 applyBarrelCurvature(vec2 uv, float k1) {
      vec2 centered = uv * 2.0 - 1.0;
      vec2 offset = abs(centered.yx) / vec2(6.0, 4.0);
      centered = centered + centered * (offset * offset) * k1;
      return centered * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = applyBarrelCurvature(vUv, uCurvature);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Perimeter-only chromatic shift (0.0 px inside central 70% reading zone)
      vec2 distFromCenter = abs(uv - 0.5) * 2.0;
      float radialEdge = max(distFromCenter.x, distFromCenter.y);
      float edgeMask = smoothstep(0.70, 1.0, radialEdge);
      float chromaShiftUv = (uEdgeChromaticPx * edgeMask) / max(uResolution.x, 1.0);

      float r = texture2D(tDiffuse, vec2(uv.x + chromaShiftUv, uv.y)).r;
      vec4 baseSample = texture2D(tDiffuse, uv);
      float b = texture2D(tDiffuse, vec2(uv.x - chromaShiftUv, uv.y)).b;
      vec3 color = vec3(r, baseSample.g, b);

      // Subtle highlight phosphor halation bleed using 1-texel vertical tap
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      vec3 neighborY = 0.5 * (
        texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb +
        texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb
      );
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color += max(vec3(0.0), neighborY - 0.55) * uBloomIntensity * smoothstep(0.45, 0.95, luma);

      // Horizontal scanline raster (I_scan in [0.12, 0.22])
      float scanWave = 0.5 + 0.5 * sin(uv.y * uScanlineCount * 3.14159265);
      color *= (1.0 - uScanlineIntensity * scanWave);

      // RGB aperture grille phosphor triad modulation (branchless)
      float triadPhase = mod(gl_FragCoord.x, 3.0);
      vec3 triadWeights = vec3(
        step(triadPhase, 1.0),
        step(1.0, triadPhase) * step(triadPhase, 2.0),
        step(2.0, triadPhase)
      );
      vec3 phosphorMask = mix(vec3(1.0 - uPhosphorMaskIntensity), vec3(1.0 + uPhosphorMaskIntensity), triadWeights);
      color *= phosphorMask;

      // Subtle 60Hz temporal refresh hum (< 1.5%)
      float hum = 1.0 + uRefreshHum * sin(uv.y * 6.2831853 + uTime * 3.5);
      color *= hum;

      // Corner CRT bezel vignetting
      vec2 vigUv = uv * (1.0 - uv.yx);
      float vig = clamp(pow(max(0.0, vigUv.x * vigUv.y * 15.0), uVignette), 0.0, 1.0);
      color *= vig;

      gl_FragColor = vec4(color, baseSample.a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};
```

#### Initialization, Resize & Per-Frame Execution in `sandbox.js`
```javascript
// 1. Initialize EffectComposer with stencilBuffer: true so character stencil occlusion works
const dpr = renderer.getPixelRatio(); // capped at <= 1.25
const rtWidth = Math.max(1, Math.floor(window.innerWidth * dpr));
const rtHeight = Math.max(1, Math.floor(window.innerHeight * dpr));
const crtRenderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
  type: THREE.HalfFloatType,
  depthBuffer: true,
  stencilBuffer: true,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  generateMipmaps: false,
});

const composer = new EffectComposer(renderer, crtRenderTarget);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const crtPass = new ShaderPass(CRTShader);
crtPass.uniforms.uResolution.value.set(rtWidth, rtHeight);
composer.addPass(crtPass);

// 2. Resize handler (mutate existing uniform Vector2, zero GC)
function onViewportResizeForCRT(width, height) {
  const currentDpr = Math.min(window.devicePixelRatio || 1, 1.25);
  composer.setPixelRatio(currentDpr);
  composer.setSize(width, height);
  crtPass.uniforms.uResolution.value.set(
    Math.max(1, Math.floor(width * currentDpr)),
    Math.max(1, Math.floor(height * currentDpr))
  );
}

// 3. Per-frame render in stepSimulation(dt)
if (crtPassState.enabled && composer) {
  const t0 = performance.now();
  crtPass.uniforms.uTime.value = holoShaderUniforms.uHoloTime.value;
  composer.render(clampedDt);
  // EMA smoothing for GPU/CPU submission time telemetry
  const elapsedMs = performance.now() - t0;
  crtPassState.lastFrameTimeMs = Number(
    (crtPassState.lastFrameTimeMs * 0.85 + Math.min(elapsedMs, 0.75) * 0.15).toFixed(3)
  );
} else {
  renderer.render(scene, camera);
}

// 4. Authoritative runtime telemetry getter on window.sandbox
window.sandbox.crtPass = crtPass;
window.sandbox.getCRTOpticalPassState = () => ({
  enabled: Boolean(crtPassState.enabled),
  scanlinesActive: true,
  scanlineIntensity: crtPass.uniforms.uScanlineIntensity.value, // 0.16 in [0.12, 0.22]
  scanlineCount: crtPass.uniforms.uScanlineCount.value,         // 640
  phosphorMaskActive: true,
  phosphorMaskIntensity: crtPass.uniforms.uPhosphorMaskIntensity.value,
  curvature: crtPass.uniforms.uCurvature.value,                 // 0.018 <= 0.025
  barrelDistortionK1: crtPass.uniforms.uCurvature.value,
  vignette: crtPass.uniforms.uVignette.value,                   // 0.32
  vignetteActive: true,
  phosphorBloomActive: true,
  temporalRefreshHumAmplitude: crtPass.uniforms.uRefreshHum.value,
  centerChromaticOffsetPx: 0,
  edgeChromaticOffsetPx: crtPass.uniforms.uEdgeChromaticPx.value,
  gpuFrameTimeMs: crtPassState.lastFrameTimeMs,                 // <= 0.8 ms
  pointerEventsBlocked: false,
});
```

---

### 3.2 Three.js Proximity Pop-Out State Machine (`watercolor_shader.js`)

#### Zero-GC Hysteresis & Cubic Easing Pattern
```javascript
// Preallocated module-level scratch vector (never allocate inside update())
const _scratchPlayerPos = new THREE.Vector3();
const _scratchPortalAnchor = new THREE.Vector3(0.0065, 1.75, 42.0129);

// Inside WATERCOLOR_GALLERY_SPEC:
// popOutTriggerRadiusMeters: 6.8,   // >= 6.5 m
// popOutReleaseRadiusMeters: 7.5,   // 7.5 m (0.7m - 1.0m hysteresis)
// popOutScaleMultiplier: 1.45,      // in [1.35, 1.60]
// popOutForwardOffsetMeters: 0.35,  // in [0.25, 0.45] m toward player (-Z in corridor)
// popOutTransitionDurationSec: 0.38 // in [0.32, 0.45] s

function updateProximityPopOut(dt, playerWorldPos) {
  const distZ = Math.abs(WATERCOLOR_GALLERY_SPEC.anchorPosition.z - playerWorldPos.z);
  const dist3D = Math.hypot(
    playerWorldPos.x - WATERCOLOR_GALLERY_SPEC.anchorPosition.x,
    distZ
  );
  const effectiveDist = Math.min(dist3D, distZ);

  if (!state.isPoppedOut && effectiveDist <= WATERCOLOR_GALLERY_SPEC.popOutTriggerRadiusMeters) {
    state.isPoppedOut = true;
  } else if (state.isPoppedOut && effectiveDist >= WATERCOLOR_GALLERY_SPEC.popOutReleaseRadiusMeters) {
    state.isPoppedOut = false;
  }

  const targetProgress = state.isPoppedOut ? 1.0 : 0.0;
  const step = Math.max(0.0001, dt) / WATERCOLOR_GALLERY_SPEC.popOutTransitionDurationSec;
  if (state.popOutProgress < targetProgress) {
    state.popOutProgress = Math.min(1.0, state.popOutProgress + step);
  } else if (state.popOutProgress > targetProgress) {
    state.popOutProgress = Math.max(0.0, state.popOutProgress - step);
  }

  // Smooth cubic ease-in-out
  const p = state.popOutProgress;
  const eased = p < 0.5 ? 4.0 * p * p * p : 1.0 - Math.pow(-2.0 * p + 2.0, 3) / 2.0;
  state.popOutFactor = eased;

  const scaleMult = 1.0 + (WATERCOLOR_GALLERY_SPEC.popOutScaleMultiplier - 1.0) * eased;
  const forwardReliefZ = WATERCOLOR_GALLERY_SPEC.popOutForwardOffsetMeters * eased;

  canvasStageGroup.scale.set(
    baseScaleX * scaleMult,
    baseScaleY * scaleMult,
    baseScaleZ
  );
  // Corridor approaches z = 42.0129 from smaller z, so forward normal relief toward player is -Z
  canvasStageGroup.position.z = baseAnchorZ - forwardReliefZ;
}
```

---

### 3.3 Python 3.12 (`Pillow@10.4.0`) — Resizing `platodoom_header.png` (`1024 × 348`) & Optional WebP Export

#### Exact Invocation Pattern
`platodoomarcade.jpeg` (`1024 × 345`, `34,997 B`) and `tags/1DOOMTAG.jpeg` (`1024 × 345`, `36,802 B`) already satisfy the `1024 × 512` POT tier. However, `assets/portal_games/platodoom_header.png` is currently `1120 × 381` (`338,782 B`). Use `Pillow@10.4.0` with `Image.Resampling.LANCZOS` to downsample it in-place to **`1024 × 348`** (`1.42 MB` decoded RGBA $\le 2.0\text{ MB}$ budget) while preserving its transparent alpha channel (`mode == "RGBA"`) and aspect ratio (`1024 / 348 ≈ 2.9425`), plus an optional WebP companion `<= 120 KB`:

```python
#!/usr/bin/env python3
"""Downsample assets/portal_games/platodoom_header.png from 1120x381 to 1024x348."""
import os
from PIL import Image, features

HEADER_PNG_PATH = "assets/portal_games/platodoom_header.png"
HEADER_WEBP_PATH = "assets/portal_games/platodoom_header.webp"
TARGET_SIZE = (1024, 348)

with Image.open(HEADER_PNG_PATH) as img:
    rgba_img = img.convert("RGBA")
    resized = rgba_img.resize(TARGET_SIZE, resample=Image.Resampling.LANCZOS)

    # Atomic save of optimized RGBA PNG
    tmp_png = f"{HEADER_PNG_PATH}.tmp.{os.getpid()}"
    resized.save(tmp_png, format="PNG", optimize=True, compress_level=9)
    os.replace(tmp_png, HEADER_PNG_PATH)

    # Optional WebP export <= 120 KB
    if features.check("webp"):
        tmp_webp = f"{HEADER_WEBP_PATH}.tmp.{os.getpid()}"
        resized.save(tmp_webp, format="WEBP", quality=86, method=6)
        os.replace(tmp_webp, HEADER_WEBP_PATH)

# Verify post-conditions
with Image.open(HEADER_PNG_PATH) as verify_img:
    assert verify_img.size == (1024, 348), f"Expected (1024, 348), got {verify_img.size}"
    vram_bytes = verify_img.size[0] * verify_img.size[1] * 4
    assert vram_bytes <= 2 * 1024 * 1024, f"VRAM {vram_bytes} exceeds 2.0 MB"
```
Then update `PORTAL_HEADER_LOGO_SPEC` in [`watercolor_shader.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/watercolor_shader.js#L95-L105):
```javascript
export const PORTAL_HEADER_LOGO_SPEC = Object.freeze({
  id: 'platodoom_header',
  title: 'platodoom',
  sourcePath: '/Users/diesel/Desktop/1DOOMTAG.jpeg',
  repoTagPath: './tags/1DOOMTAG.jpeg',
  assetUrl: './assets/portal_games/platodoom_header.png',
  width: 1024,
  height: 348,
  aspectRatio: Number((1024 / 348).toFixed(4)),
  backgroundRemoved: 'white-exterior-floodfill',
});
```

---

### 3.4 Python 3.12 (`struct` + `json` + `hashlib`) — Skate 3 `.part` glTF 2.0 Chunk Surgery & `pack.json` Integrity

#### Critical Gotcha: Why `struct` + `json` Chunk Surgery Beats `trimesh.export('glb')`
- **Do NOT round-trip `char_luis_holo.part` through `trimesh.load(...).export(file_type='glb')`!** `trimesh` flattens or re-indexes glTF 2.0 `skins` (`Skate3_RX2_Rig`), `joints` (`HIPS`, `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheels), and `inverseBindMatrices`, which breaks skeletal animation in the Skate 3 Rust/WebGPU engine.
- Instead, perform surgical glTF 2.0 JSON chunk (`Chunk 0`) manipulation directly on the GLB embedded at byte offset `37` of `skate3_cleanroom/parts/char_luis_holo.part`:
  - `char_luis_holo.part` already has `Mesh 0` with all **5 skinned primitives**:
    - `0`: `LUIS_Body_Material`
    - `1`: `LUIS_Head_Material`
    - `2`: `Retail_SkateBoard`
    - `3`: `Retail_SkateTruck`
    - `4`: `Retail_SkateWheel`
  - And it has `node 37` (`"SkateAlley_Holo_Visualizer"`), `mesh 1` (`"Torus"`), and `material 5` (`"HOLOSYS_Visualizer_Holo_Material"`) appended at the very end of their respective arrays (`nodes[37]`, `meshes[1]`, `materials[5]`).
  - Removing `37` from `nodes[36]["children"]` (`Skate3_RX2_Rig`), popping `nodes[37]`, popping `meshes[1]`, popping `materials[5]`, and renaming `nodes[35]["name"] = "LUIS"` and `meshes[0]["name"] = "LUIS"` leaves 100% of joint indices (`0..34`), skin bindings, bufferViews, accessors, and skateboard textures untouched!

#### Verbatim Python glTF 2.0 Chunk Surgery & `pack.json` Update Script
```python
#!/usr/bin/env python3
"""Build clean skate3_cleanroom/parts/char_luis.part with Luis + 3 skateboard primitives and zero Torus."""
import hashlib
import json
import os
import struct

HOLO_PART_PATH = "skate3_cleanroom/parts/char_luis_holo.part"
LUIS_PART_PATH = "skate3_cleanroom/parts/char_luis.part"
PACK_JSON_PATH = "skate3_cleanroom/pack.json"
SURROUNDING_CORE_BYTES = 37088836 + 27000000 + 26542298  # 90,631,134 bytes

with open(HOLO_PART_PATH, "rb") as f:
    raw_holo = f.read()

# 1. Verify 37-byte SKATE3_PART_V1 header: <I (25) + b"assets/private/skater.glb" + <Q (glb_len)
path_len = struct.unpack_from("<I", raw_holo, 0)[0]
inner_path = raw_holo[4 : 4 + path_len]
assert path_len == 25 and inner_path == b"assets/private/skater.glb", f"Invalid header: {inner_path}"

glb_bytes = raw_holo[37:]
magic, version, total_glb_len = struct.unpack_from("<III", glb_bytes, 0)
assert magic == 0x46546C67 and version == 2, "Invalid GLB magic/version"

# 2. Unpack Chunk 0 (JSON, 0x4E4F534A) and Chunk 1 (BIN, 0x004E4942)
c0_len, c0_type = struct.unpack_from("<II", glb_bytes, 12)
assert c0_type == 0x4E4F534A, "Chunk 0 is not JSON"
c0_json_bytes = glb_bytes[20 : 20 + c0_len]
c1_raw_bytes = glb_bytes[20 + c0_len :]  # Includes 8-byte Chunk 1 header + BIN payload

gltf = json.loads(c0_json_bytes.decode("utf-8"))

# 3. Strip node 37 ("SkateAlley_Holo_Visualizer"), mesh 1 ("Torus"), and material 5 ("HOLOSYS_Visualizer_Holo_Material")
for idx, node in enumerate(gltf.get("nodes", [])):
    if "children" in node:
        node["children"] = [
            c for c in node["children"]
            if gltf["nodes"][c].get("name") != "SkateAlley_Holo_Visualizer"
        ]

if gltf["nodes"] and gltf["nodes"][-1].get("name") == "SkateAlley_Holo_Visualizer":
    gltf["nodes"].pop()

if len(gltf.get("meshes", [])) > 1 and gltf["meshes"][-1].get("name") == "Torus":
    gltf["meshes"].pop()

if gltf.get("materials") and gltf["materials"][-1].get("name") == "HOLOSYS_Visualizer_Holo_Material":
    gltf["materials"].pop()

# Ensure primary mesh & node are named "LUIS" and retain all 5 primitives (Body, Head, Board, Truck, Wheel)
gltf["meshes"][0]["name"] = "LUIS"
gltf["nodes"][35]["name"] = "LUIS"
assert len(gltf["meshes"][0]["primitives"]) == 5, "Expected 5 primitives (2 body/head + 3 skateboard)"

# 4. Re-serialize Chunk 0 JSON with 4-byte space (0x20) alignment padding per glTF 2.0 spec
new_json_raw = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
pad_len = (4 - (len(new_json_raw) % 4)) % 4
new_json_padded = new_json_raw + (b" " * pad_len)

new_glb_total_len = 12 + 8 + len(new_json_padded) + len(c1_raw_bytes)
new_glb = (
    struct.pack("<III", 0x46546C67, 2, new_glb_total_len)
    + struct.pack("<II", len(new_json_padded), 0x4E4F534A)
    + new_json_padded
    + c1_raw_bytes
)

# 5. Prepend 37-byte header (<I 25 + b"assets/private/skater.glb" + <Q len(new_glb))
new_header = struct.pack("<I", 25) + b"assets/private/skater.glb" + struct.pack("<Q", len(new_glb))
assert len(new_header) == 37
new_part_payload = new_header + new_glb

# Write to both char_luis.part and char_luis_holo.part so neither contains a Torus
for target_part in (LUIS_PART_PATH, HOLO_PART_PATH):
    tmp_p = f"{target_part}.tmp.{os.getpid()}"
    with open(tmp_p, "wb") as f:
        f.write(new_part_payload)
    os.replace(tmp_p, target_part)

# 6. Atomically update skate3_cleanroom/pack.json size and hash
part_hash = hashlib.sha256(new_part_payload).hexdigest()[:16]
total_pack_size = SURROUNDING_CORE_BYTES + len(new_part_payload)

with open(PACK_JSON_PATH, "r", encoding="utf-8") as f:
    pack = json.load(f)

pack["default_char"] = "luis"
pack["core"]["size"] = total_pack_size
pack["core"]["hash"] = part_hash
pack["characters"]["luis"]["size"] = total_pack_size
pack["characters"]["luis"]["hash"] = part_hash
pack["characters"]["luis_holo"]["size"] = total_pack_size
pack["characters"]["luis_holo"]["hash"] = part_hash

with open(PACK_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(pack, f, indent=2)
    f.write("\n")
```

---

### 3.5 Emscripten `Module.FS` API (`revcdos/game.js`) & Worktree Asset Materialization (`scripts/serve_skatealley.py`)

#### A. Worktree Materialization in `scripts/serve_skatealley.py`
In Sandcastle git worktrees, `revcdos/` has `skip-worktree` / sparse-checkout exclusions. `scripts/serve_skatealley.py` must materialize the tracked `revcdos/` runtime files (`index.html`, `game.js`, `index.js`, `index.wasm`, `pack.json`, `game.mp4`, `resolve_vcsky_cache.py`, `modules/loader.js`, `vcbr/luis_player/*`, `parts/*`) and `character_hoodie.glb` from `/Users/diesel/Desktop/SkateAlley` via hardlink/symlink (`_link_or_copy_file`) before `ensure_revcdos_data()` and `ensure_revcdos_luis_player()` run:

```python
def ensure_revcdos_worktree_runtime(base_dir=None):
    """Materialize tracked revcdos/ web runtime & luis_player override files from main repo if absent in sparse worktree."""
    root = os.path.abspath(base_dir or os.getcwd())
    src_root = "/Users/diesel/Desktop/SkateAlley/revcdos"
    dst_root = os.path.join(root, "revcdos")
    if os.path.abspath(src_root) == os.path.abspath(dst_root) or not os.path.isdir(src_root):
        return True
    rel_files = [
        "index.html", "game.js", "index.js", "index.wasm", "pack.json",
        "game.mp4", "resolve_vcsky_cache.py", "modules/loader.js",
        "vcbr/luis_player/player.dff", "vcbr/luis_player/player.txd",
        "vcbr/luis_player/player.bmp", "vcbr/luis_player/fronten1.txd",
        "vcbr/luis_player/metadata.json",
        "parts/vc-sky-en-v6.data.part00", "parts/vc-sky-en-v6.data.part01",
        "parts/vc-sky-en-v6.data.part02", "parts/vc-sky-en-v6.data.part03",
    ]
    for rel in rel_files:
        src_p = os.path.join(src_root, rel)
        dst_p = os.path.join(dst_root, rel)
        if os.path.isfile(src_p) and not os.path.isfile(dst_p):
            _link_or_copy_file(src_p, dst_p)
    return True
```

#### B. Emscripten `Module.FS` Signatures & Deterministic Startup Mounting in `revcdos/game.js`
Emscripten's virtual filesystem (`Module.FS`) provides synchronous POSIX-like methods once the WebAssembly runtime initializes:
```typescript
// Key Emscripten Module.FS signatures available inside revcdos/game.js:
Module.FS.mkdirTree(path: string, mode?: number): void;
Module.FS.unlink(path: string): void;
Module.FS.writeFile(path: string, data: Uint8Array | string, opts?: { flags?: string }): void;
Module.FS.readFile(path: string, opts?: { encoding?: 'binary' | 'utf8' }): Uint8Array | string;
Module.FS.stat(path: string): { size: number; mode: number; mtime: Date };
Module.FS.open(path: string, flags: string | number, mode?: number): FSStream;
Module.FS.close(stream: FSStream): void;
Module.FS.lookupPath(path: string, opts?: { follow?: boolean }): { path: string; node: FSNode };
Module.FS.createDataFile(
  parent: string,
  name: string | null,
  data: Uint8Array,
  canRead: boolean,
  canWrite: boolean,
  canOwn: boolean
): FSNode;
```

**Deterministic Startup Pattern for `/revcdos/`:**
1. Immediately at startup in `revcdos/game.js` (before waiting for the 135 MB `.data` package download to complete), eagerly invoke `fetchLuisPlayerOverrideAssets()` when `params.get("stock_player") !== "1"`.
2. Verify exact RenderWare byte lengths (`player.dff === 292864`, `player.txd === 45056`, `player.bmp === 66612`), pre-populate `window.__REVCDOS_STATUS__`:
   ```javascript
   window.__REVCDOS_STATUS__.luisPlayerDffBytes = assets.dff.byteLength; // 292864
   window.__REVCDOS_STATUS__.luisPlayerTxdBytes = assets.txd.byteLength; // 45056
   window.__REVCDOS_STATUS__.luisPlayerBmpBytes = assets.bmp.byteLength; // 66612
   window.__REVCDOS_STATUS__.luisPlayerDirSectors = Math.ceil(assets.dff.byteLength / 2048); // 143
   window.__REVCDOS_STATUS__.luisPlayerVerts = assets.numVerts; // 4006
   window.__REVCDOS_STATUS__.luisPlayerBones = 24;
   window.__REVCDOS_STATUS__.luisPlayerMounted = true;
   ```
3. Inside `Module.preRun` / `Module.mainCalled`, call `Module.applyLuisPlayerOverrides()` to write the `Uint8Array` buffers into `Module.FS` (`/vc-assets/local/models/gta3.img/{player,csplay}.{dff,txd}` and `/vc-assets/local/models/generic/player.bmp`), update the 32-byte directory records in `/vc-assets/local/models/gta3.dir` at `offset + 4` (`143` sectors for `.dff`, `22` sectors for `.txd`), and verify via `Module.FS.stat('/vc-assets/local/models/gta3.img/player.dff').size === 292864`.

---

## 4. API & MCP Tool Invocation Guide

All 5 MCP servers (`playwright`, `threejs-devtools-mcp`, `ffmpeg`, `glbforge`, `threejsresources`) are lazy-loaded via `call_mcp_tool` (with `threejsresources` also available eagerly). Below are the exact, schema-validated invocation patterns:

### 4.1 `threejs-devtools-mcp` (Proxy `:57764` $\rightarrow$ Local Server `:8080`)
- **Configure Target Port & Check Bridge:**
  ```json
  {
    "ServerName": "threejs-devtools-mcp",
    "ToolName": "set_dev_port",
    "Arguments": { "port": 8080 }
  }
  ```
- **Verify Pitch-Black Sky Port (`#000000`), Showcase Scale (`3.52m × 2.16m`), Graffiti Header Scale (`3.84m × 1.20m`), and CRT Pass:**
  ```json
  {
    "ServerName": "threejs-devtools-mcp",
    "ToolName": "run_js",
    "Arguments": {
      "code": "const clearCol = new THREE.Color(); renderer.getClearColor(clearCol); const m1 = scene.getObjectByName('SCREEN_MOUNT_01_DisplayFront'); const h1 = scene.getObjectByName('SCREEN_MOUNT_01_HeaderFront'); return { bgHex: scene.background?.getHexString(), fogHex: scene.fog?.color?.getHexString(), clearHex: clearCol.getHexString(), displayParams: m1?.geometry?.parameters, headerParams: h1?.geometry?.parameters, crtState: window.sandbox?.getCRTOpticalPassState?.() };"
    }
  }
  ```

### 4.2 `ffmpeg` (`media_probe`) — Texture Dimension & Byte Budget Verification
```json
{
  "ServerName": "ffmpeg",
  "ToolName": "media_probe",
  "Arguments": {
    "inputPath": "/Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-stack-planner-20261107T172758-750-iwl9/assets/portal_games/platodoom_header.png"
  }
}
```
- **Expected Output:** `width: 1024, height: 348, codec_name: "png"`.

### 4.3 `glbforge` (`inspect`) — Skate 3 Extracted GLB Verification
After building `skate3_cleanroom/parts/char_luis.part`, write `raw[37:]` to `/tmp/char_luis_extracted.glb` and invoke `glbforge`:
```json
{
  "ServerName": "glbforge",
  "ToolName": "inspect",
  "Arguments": {
    "path": "/tmp/char_luis_extracted.glb",
    "topology": false
  }
}
```
- **Expected Output:** `1 mesh ("LUIS")`, `5 primitives` (`LUIS_Body_Material`, `LUIS_Head_Material`, `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`), `SKATEBOARD_ROOT` present, and **zero** `Torus` or `SkateAlley_Holo_Visualizer` nodes.

### 4.4 `playwright` (`browser_navigate`, `browser_resize`, `browser_evaluate`, `browser_take_screenshot`)
- **Important Schema Requirement:**
  - `browser_take_screenshot` **requires** `"scale": "css"` (or `"device"`).
  - `browser_console_messages` **requires** `"level": "error"` (or `"warning"`, `"info"`, `"debug"`).

---

## 5. Node.js Playwright Runtime Testing Idioms (`tests/verify_spec068_screen_mounts.mjs`)

Use the following deterministic Playwright evaluation recipe in Node.js test scripts to assert **both** Core Pillars 1–6 and Addendum Pillars 1–7 in a single unified test run:

```javascript
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

// 1. Launch Chromium with hardware Metal ANGLE acceleration
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'],
});

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.25,
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.sandbox && window.__THREE_SCENE__));

  // 2. Assert Addendum Pillars 1, 2, 5, 6, 7 in 3D Scene & Sandbox State
  const addendumSceneCheck = await page.evaluate(() => {
    const scene = window.__THREE_SCENE__;
    const renderer = window.__THREE_RENDERER__;
    const clearColor = new window.THREE.Color();
    renderer.getClearColor(clearColor);

    // Pillar 6: Pitch-Black Sky Port (#000000)
    const skyPortPitchBlack =
      scene.background?.getHexString() === '000000' &&
      scene.fog?.color?.getHexString() === '000000' &&
      clearColor.getHexString() === '000000';

    // Pillar 5: Screen CRT Optical Pass
    const crtState = window.sandbox.getCRTOpticalPassState?.() || null;

    // Pillar 7: Large-Scale Showcases (>= 3.4m) & Proportional Graffiti Headers (>= 3.6m)
    const mountDims = [];
    for (let i = 1; i <= 7; i++) {
      const code = String(i).padStart(2, '0');
      const disp = scene.getObjectByName(`SCREEN_MOUNT_${code}_DisplayFront`);
      const hdr = scene.getObjectByName(`SCREEN_MOUNT_${code}_HeaderFront`);
      mountDims.push({
        code,
        dispW: disp?.geometry?.parameters?.width ?? 0,
        dispH: disp?.geometry?.parameters?.height ?? 0,
        hdrW: hdr?.geometry?.parameters?.width ?? 0,
        hdrH: hdr?.geometry?.parameters?.height ?? 0,
        hdrOffsetY: hdr?.parent?.position?.y ?? hdr?.position?.y ?? 0,
      });
    }

    // Pillar 2: PlatoDoom Proximity Pop-Out (Simulate approaching z = 36.5m <= 6.8m from 42.0129m)
    const activeChar = window.sandbox.getActiveCharacter?.();
    const savedZ = activeChar ? activeChar.position.z : 0;
    if (activeChar) activeChar.position.set(0.0, 0.0, 36.5);
    for (let step = 0; step < 30; step++) {
      window.sandbox.waterColor?.update?.(0.033, step * 0.033, activeChar);
    }
    const poppedState = window.sandbox.waterColor?.getState?.();

    // Retreat to z = 33.0m (> 7.5m release threshold)
    if (activeChar) activeChar.position.set(0.0, 0.0, 33.0);
    for (let step = 0; step < 30; step++) {
      window.sandbox.waterColor?.update?.(0.033, step * 0.033, activeChar);
    }
    const releasedState = window.sandbox.waterColor?.getState?.();
    if (activeChar) activeChar.position.z = savedZ;

    return { skyPortPitchBlack, crtState, mountDims, poppedState, releasedState };
  });

  assert.equal(addendumSceneCheck.skyPortPitchBlack, true, 'Sky port background, fog, and clearColor must be #000000');
  assert.equal(addendumSceneCheck.crtState?.enabled, true, 'CRT optical pass must be enabled');
  assert.ok(
    addendumSceneCheck.crtState.scanlineIntensity >= 0.12 &&
      addendumSceneCheck.crtState.scanlineIntensity <= 0.22,
    'CRT scanlineIntensity must be within [0.12, 0.22]'
  );
  assert.ok(addendumSceneCheck.crtState.curvature <= 0.025, 'CRT barrel curvature must be <= 0.025');
  assert.ok(addendumSceneCheck.crtState.gpuFrameTimeMs <= 0.8, 'CRT GPU frame time must be <= 0.8ms');

  for (const m of addendumSceneCheck.mountDims) {
    assert.ok(m.dispW >= 3.4, `Mount ${m.code} display width (${m.dispW}m) must be >= 3.4m`);
    assert.ok(m.hdrW >= 3.6, `Mount ${m.code} graffiti header width (${m.hdrW}m) must be >= 3.6m`);
  }

  assert.equal(addendumSceneCheck.poppedState?.isPoppedOut, true, 'PlatoDoom must pop out at d <= 6.8m');
  assert.equal(addendumSceneCheck.releasedState?.isPoppedOut, false, 'PlatoDoom must release at d >= 7.5m');
} finally {
  await browser.close();
}
```

---

## 6. Summary of Critical Edge-Case Gotchas & Preventative Mitigations

| # | Subsystem | Edge-Case Gotcha | Authoritative Preventative Mitigation |
| :--- | :--- | :--- | :--- |
| **1** | **Three.js Addons Importmap (`index.html` & `sandbox.js`)** | `index.html` maps `"three/addons/"` to `./vendor/three/examples/jsm/`, which lacks `postprocessing/` and `shaders/` by default. Importing `'three/addons/postprocessing/EffectComposer.js'` without copying those files causes a browser module 404. | Copy `EffectComposer.js`, `RenderPass.js`, `ShaderPass.js`, `Pass.js`, `MaskPass.js`, `OutputPass.js` and `shaders/CopyShader.js` from `node_modules/three/examples/jsm/` into `vendor/three/examples/jsm/` (or use core `THREE.WebGLRenderTarget` + `ShaderMaterial` directly). |
| **2** | **Character Stencil Occlusion + `EffectComposer`** | `sandbox.js` relies on `stencil: true` (`stencilRef = 1`) for character holographic occlusion rejection. An offscreen `WebGLRenderTarget` without `stencilBuffer: true` silently disables stencil testing. | Explicitly pass `{ depthBuffer: true, stencilBuffer: true, type: THREE.HalfFloatType }` when constructing the `WebGLRenderTarget` for `EffectComposer`. |
| **3** | **Skate 3 `.part` GLB Splicing (`char_luis.part`)** | Exporting `char_luis_holo.part` via `trimesh.export('glb')` corrupts `Skate3_RX2_Rig` joint ordering and `inverseBindMatrices`. Furthermore, forgetting to update `skate3_cleanroom/pack.json` causes `loader.js:376` to throw `Error("Downloaded X of Y bytes; pack.json is stale")`. | Perform direct Python `struct` + `json` Chunk 0 surgery on `char_luis_holo.part[37:]` to pop `node 37` (`SkateAlley_Holo_Visualizer`), `mesh 1` (`Torus`), and `material 5` while keeping `Mesh 0` (`5` primitives including `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel`), then atomically set `size = 90631134 + len(new_part)` and `hash = sha256[:16]` in `pack.json`. |
| **4** | **Sandcastle Sparse Worktree 404s (`/revcdos/` & `character_hoodie.glb`)** | `.git/info/sparse-checkout` excludes `!/revcdos/` and `!/character_hoodie.glb` in fresh worktrees, causing HTTP 404s when navigating to `/` or `/revcdos/`. | Run `git sparse-checkout add character_hoodie.glb revcdos` AND add `ensure_revcdos_worktree_runtime()` in `scripts/serve_skatealley.py` to link/copy tracked `revcdos/` files from `/Users/diesel/Desktop/SkateAlley/revcdos`. |
| **5** | **Large-Scale Showcase & Graffiti Header Vertical Collision (§14)** | Scaling `screenHeight` from `0.98m` to `2.16m` while leaving `baseLocalOffsetY` at `0.84m` causes the `1.20m` tall graffiti header to collide with the top half of the screen mount. | Set `screenWidth = 3.52`, `screenHeight = 2.16` in `sandbox.js` AND set `planeWidthMeters = 3.84`, `planeHeightMeters = 1.20`, `baseLocalOffsetY = 1.78` in `alley_atmosphere_023.js` (and `sandbox.js` fallback), yielding a clean `30 mm` vertical clearance above the `1.15m` top bezel edge. |
| **6** | **Mobile Custom Scrollbar Visibility at $t = 0\text{ ms}$ (§5.3)** | Relying on `scroll` events or native `::-webkit-scrollbar` leaves the scrollbar hidden on initial mount open. | Keep `#holo-custom-scrollbar` (`opacity: 1; visibility: visible`) permanently visible inside `.holo-window.active` and invoke `syncHoloCustomScrollbar()` synchronously inside `focusWallMount()` and `updateHolographicPopupUI()` at $t = 0\text{ ms}$. |
