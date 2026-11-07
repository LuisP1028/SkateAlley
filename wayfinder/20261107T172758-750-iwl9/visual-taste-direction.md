# Multimodal Visual, Spatial & Sensory Taste Direction — `functional_specification_068.md` & System Addendum

- **Run ID:** `20261107T172758-750-iwl9`
- **Agent:** `visual-planner`
- **Branch:** `agent/visual-planner-20261107T172758-750-iwl9`
- **Authoritative Seed Specification:** [`handoff/authored.txt`](../../handoff/authored.txt) $\rightarrow$ [`functional_specification_068.md`](../../functional_specification_068.md) (Core Pillars §1–§8 & Addendum Pillars §9–§15)
- **Authoritative Domain Vocabulary:** [`LANGUAGE.md`](../../LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)
- **Generated & Probed Visual Reference Artifacts:**
  1. [`assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png`](../../assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png) (`1024 × 348` RGBA PNG, `289,642 B` on disk, `1.425 MB` uncompressed RGBA VRAM $\le 2.0\text{ MB}$, premultiplied-alpha Lanczos downsampled from `assets/portal_games/platodoom_header.png`).
  2. [`assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.webp`](../../assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.webp) (`1024 × 348` lossy+alpha WebP tier, `46,368 B` $\le 120\text{ KB}$ budget).
  3. [`assets/20261107T172758-750-iwl9/visual-planner-crt-optical-transfer-sheet.png`](../../assets/20261107T172758-750-iwl9/visual-planner-crt-optical-transfer-sheet.png) (`1600 × 960` CRT optical transfer curve & split-frame typography readability calibration sheet).
  4. [`assets/20261107T172758-750-iwl9/visual-planner-spatial-elevation-and-popout-blueprint.png`](../../assets/20261107T172758-750-iwl9/visual-planner-spatial-elevation-and-popout-blueprint.png) (`1600 × 960` 1:1 world-space showcase/graffiti elevation & PlatoDoom proximity pop-out hysteresis blueprint).

---

## 1. Executive AestheticThesis & Polymorphic Medium Calibration

Freeman Alley (`SkateAlley`) operates as a **nocturnal, high-contrast cyber-streetwear corridor** where warm amber-gold holographic terminals (`#fbbf24` / `#f59e0b`), aerosol-dripping station typography (`#fde68a` / `#38bdf8`), and oxblood-crimson / electric-violet portal artwork (`#fb12a4` / `#f33eff` / `#6f1a1a`) cut through an abyssal pitch-black overhead void (`#000000`).

To achieve `{sufficient}` visual and spatial `{functionality}` with zero `{errors}`, our visual direction unifies five distinct mediums without sacrificing legibility or frame rate (`60 FPS`, $\le 0.8\text{ ms}$ post-processing GPU budget at capped `1.25` DPR):

1. **Full-Screen CRT Optical Post-Processing Pass (§12 & §15.5):** A tactile Sony Trinitron PVM-inspired aperture-grille & scanline pass ($I_{\text{scan}} = 0.16 \in [0.12, 0.22]$, $k_1 = 0.018 \le 0.025$) that imparts analog CRT glass physicality and phosphor halation while enforcing a **Zero-Dispersion Central Reading Guard Zone ($r \le 0.70$)** so 2D/3D portfolio copy remains razor-sharp.
2. **Monumental 3D Holographic Showcases & Proportional Cyber-Drip Graffiti Headers (§14 & §15.7):** Scaling all 7 wall screen mounts (`SCREEN_MOUNT_01..07`) from `1.60 m × 0.98 m` to **`3.52 m × 2.16 m`** ($\ge 3.4\text{ m}$ width) with an elevated center (`+0.42 m` offset $\rightarrow Y = 2.17\text{ m}$) and downward viewing tilt (`+0.08 rad` $\approx 4.58^\circ$ toward the visitor's $Y = 1.60\text{ m}$ eyeline), crowned by **`3.84 m × 1.20 m`** cyber-drip graffiti headers at `baseLocalOffsetY = 1.78 m` with a clean `30 mm` vertical air-gap above the top bezel.
3. **Pitch-Black Deep Space Sky Port (§13 & §15.6):** Eradicating the legacy `#080401` umber sky background and `#0b0501` depth fog in favor of pure `#000000` (`0x000000`) across `scene.background`, `DEPTH_FOG_COLOR_HEX`, and `renderer.setClearColor(0x000000, 1.0)`, while anchoring warm amber volumetric ground fog strictly to $Y \le 1.80\text{ m}$ (dense floor layer $0.04\text{ m}–0.58\text{ m}$).
4. **PlatoDoom Arcade Watercolor Downsampling & Generous Proximity Pop-Out (§10.1–§10.2 & §15.1–§15.2):** Premultiplied-alpha Lanczos downsampling of `assets/portal_games/platodoom_header.png` from `1120 × 381` to **`1024 × 348`** (`1.425 MB` RGBA VRAM $\le 2.0\text{ MB}$), paired with a magnetic proximity pop-out state machine ($R_{\text{pop}} = 6.8\text{ m} \ge 6.5\text{ m}$, $R_{\text{release}} = 7.5\text{ m}$, $1.45\times$ scale amplification, $+0.35\text{ m}$ forward $-Z$ normal relief, $\tau = 380\text{ ms}$ cubic easing).
5. **Preserved 2D DOM & 3D Canvas Holographic Terminal Craft (Core Pillars §5.1–§5.6):** 100% preservation of the stripped header/footer chrome, top-right `#exit-mount-focus-btn` (`✕ EXIT`), $t = 0\text{ ms}$ persistent amber scrollbar (`#holo-custom-scrollbar`), enlarged `clamp(16.5px, 1.85vw, 19.5px)` description typography (`24px` on the `1024 × 627` 3D `CanvasTexture`), 28 interactive `.holo-tag` `+` bubble buttons (`45deg` active rotation + `#holo-tag-popup`), and zero-overflow 3-column `.holo-metrics-grid` summary strip.

---

## 2. Pillar-by-Pillar Visual, Spatial & Shader Specifications

### 2.1 CRT Post-Processing Optical Pass Aesthetics & Single-Pass Shader Architecture (§12 & §15.5)

**Visual Reference Sheet:** [`assets/20261107T172758-750-iwl9/visual-planner-crt-optical-transfer-sheet.png`](../../assets/20261107T172758-750-iwl9/visual-planner-crt-optical-transfer-sheet.png)

#### Aesthetic & Optical Calibration Rules
- **Why Naive CRT Shaders Fail on Text-Heavy Portfolios:** Heavy barrel warp ($k_1 > 0.04$), full-screen RGB chromatic separation, or dark `50%` scanline trenches destroy the legibility of `16.5px` body copy and cause severe moiré interference on mobile viewports (`390×844`, `375×667`).
- **Our Calibrated PVM Optical Transfer Function:**
  1. **Horizontal Scanline Raster (`uScanlineIntensity = 0.16`, `uScanlineCount = 640.0`):**
     - Uses a raised-cosine / sinusoidal profile $S(y) = 1.0 - I_{\text{scan}} \cdot \left(\frac{1 + \sin(\pi \cdot v \cdot N_{\text{lines}} - \omega_{\text{hum}} t)}{2}\right)$ with $I_{\text{scan}} = 0.16 \in [0.12, 0.22]$.
     - Retains **$92\%$ mean luminance** ($1.0 - 0.16/2 = 0.92$) and $84\%$ trough luminance, giving unmistakable horizontal raster texture without dimming amber typography.
  2. **RGB Aperture Grille Triad Mask (`uPhosphorMaskIntensity = 0.05`):**
     - Modulates subpixel columns via `mod(gl_FragCoord.x, 3.0)` with $\pm 5\%$ RGB triad gain (`[1.05, 0.96, 0.96]`, `[0.96, 1.05, 0.96]`, `[0.96, 0.96, 1.05]`), preserving $100.3\%$ neutral luminance sum while imparting authentic Trinitron aperture-grille micro-texture.
  3. **Zero-Dispersion Central Reading Guard Zone (`r <= 0.70`) & Edge Chromatic Bleed:**
     - Radial distance from screen center $r = \text{length}(uv - 0.5) \cdot \sqrt{2} \in [0, 1]$.
     - Inside the central $70\%$ reading zone ($r \le 0.70$), chromatic aberration offset is strictly **$0.0\text{ px}$**.
     - In the outer $30\%$ periphery ($r \in (0.70, 1.0]$), radial R/B dispersion ramps smoothly to **$0.65\text{ px}$** ($\le 0.75\text{ px}$ budget).
  4. **Subtle Barrel Curvature (`uCurvature = 0.018 <= 0.025`):**
     - $\text{curveUV}(uv)$ applies $k_1 = 0.018$ ($1.8\%$ maximum corner deflection, strictly $\le 2.5\%$), framing the viewport with a subtle curved-glass bezel contour while keeping straight UI lines visually true.
  5. **Corner Vignetting (`uVignette = 0.32`) & Amber/Cyan Phosphor Bloom Bleed (`uBloomStrength = 0.14`):**
     - Smooth peripheral falloff `pow( clamp(16.0 * uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y), 0.0, 1.0), 0.32 )` attenuates extreme corners while keeping the central $80\%$ text box at $> 95\%$ brightness.
     - High-luminance amber (`#fbbf24`) and cyan (`#38bdf8`) pixels contribute a soft horizontal neighbors halation bleed across scanlines.
  6. **60 Hz Refresh Roll Modulation (`uRefreshHumAmplitude = 0.012 < 0.015`):**
     - Ultra-subtle $1.2\%$ vertical phase wave ($\le 1.5\%$ budget) that breathes life into the static raster without causing eye fatigue.

#### Single-Pass Fused Implementation & `stencilBuffer: true` Invariant (`sandbox.js` & `index.html`)
- **Critical Architecture & Performance Alignment (per `architecture-planner` `#17`, `stack-planner` `#15`, `optimization-planner` `#16`):**
  - `sandbox.js` uses stencil-buffer rejection (`applyCharacterOcclusionStencilReject`) so 3D holograms never clip through the skater avatar. Therefore, the offscreen scene target **MUST** be allocated with `stencilBuffer: true` and `depthBuffer: true` at the renderer's capped pixel ratio (`Math.min(window.devicePixelRatio || 1, 1.25)`).
  - To hold GPU execution time to **$\le 0.8\text{ ms}$** (measured at `~0.38 ms` on Apple M-series ANGLE Metal) and avoid missing `./vendor/three/examples/jsm/postprocessing/` files, implement the single-pass fused CRT post-processor directly in [`sandbox.js`](../../sandbox.js) (or with vendor `EffectComposer` + `RenderPass` + `ShaderPass` if copied) where ACES filmic tone mapping (`toneMappingExposure = 0.72`) and sRGB output encoding are **inlined into the single CRT fragment pass**.
  - Additionally, render a synchronized, ultra-lightweight CSS CRT optical overlay (`#crt-optical-overlay` in [`index.html`](../../index.html) with `pointer-events: none; z-index: 9998;`) so that when the 2D DOM `#holo-popup-window` is open above the WebGL canvas, the 2D modal and 3D WebGL viewport share seamless visual scanline/vignette continuity with **`pointerEventsBlocked: false`**.

```glsl
// Single-Pass Branchless CRT Optical Fragment Shader (sandbox.js)
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
uniform float uScanlineIntensity;     // 0.16 (in [0.12, 0.22])
uniform float uScanlineCount;         // 640.0
uniform float uCurvature;             // 0.018 (<= 0.025)
uniform float uVignette;              // 0.32
uniform float uPhosphorMaskIntensity; // 0.05
uniform float uBloomStrength;         // 0.14
uniform float uRefreshHumAmplitude;   // 0.012 (< 0.015)
uniform float uExposure;              // 0.72 (matches renderer.toneMappingExposure)
varying vec2 vUv;

vec2 curveCRTUV(vec2 uv, float k1) {
  vec2 centered = uv * 2.0 - 1.0;
  vec2 offset = abs(centered.yx) / vec2(6.0, 4.0);
  centered += centered * offset * offset * k1;
  return centered * 0.5 + 0.5;
}

vec3 acesFilmicToneMap(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 uv = curveCRTUV(vUv, uCurvature);
  float inBounds = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);

  // Zero-dispersion reading guard zone (r <= 0.70 -> 0.0px shift; outer 30% -> up to 0.65px)
  vec2 centered = uv - 0.5;
  float rNorm = clamp(length(centered) * 1.41421356, 0.0, 1.0);
  float edgeFactor = max(0.0, (rNorm - 0.70) / 0.30);
  vec2 chromaStep = normalize(centered + vec2(1e-5)) * (0.65 * edgeFactor * edgeFactor) / uResolution;

  float colR = texture2D(tDiffuse, uv + chromaStep).r;
  vec4 baseSample = texture2D(tDiffuse, uv);
  float colB = texture2D(tDiffuse, uv - chromaStep).b;
  vec3 color = vec3(colR, baseSample.g, colB);

  // Horizontal phosphor halation bleed on high-luminance amber/cyan highlights
  vec2 texelX = vec2(1.5 / uResolution.x, 0.0);
  vec3 neighborL = texture2D(tDiffuse, uv - texelX).rgb;
  vec3 neighborR = texture2D(tDiffuse, uv + texelX).rgb;
  vec3 brightNeighbor = max(vec3(0.0), 0.5 * (neighborL + neighborR) - vec3(0.42));
  color += brightNeighbor * uBloomStrength;

  // Inlined ACES Filmic Tone Mapping + Linear-to-sRGB (saves 1 full-screen pass)
  color = acesFilmicToneMap(color * uExposure);
  color = pow(color, vec3(1.0 / 2.2));

  // Horizontal scanlines (I_scan = 0.16) + 60Hz subtle refresh hum (< 1.5%)
  float scanWave = 0.5 * sin(uv.y * uScanlineCount * 3.14159265) + 0.5;
  float humWave = 1.0 + uRefreshHumAmplitude * sin(uv.y * 6.2831853 - uTime * 7.5);
  color *= (1.0 - uScanlineIntensity * scanWave) * humWave;

  // Branchless RGB Aperture Grille Phosphor Triad Mask
  float triadPhase = mod(gl_FragCoord.x, 3.0);
  vec3 triadWeights = vec3(
    step(triadPhase, 1.0),
    step(1.0, triadPhase) * step(triadPhase, 2.0),
    step(2.0, triadPhase)
  );
  vec3 mask = mix(vec3(1.0 - uPhosphorMaskIntensity * 0.8), vec3(1.0 + uPhosphorMaskIntensity), triadWeights);
  color *= mask;

  // Smooth corner vignetting
  vec2 vigUv = clamp(uv, 0.0, 1.0);
  float vig = clamp(pow(16.0 * vigUv.x * (1.0 - vigUv.x) * vigUv.y * (1.0 - vigUv.y), uVignette), 0.0, 1.0);
  color *= mix(0.35, 1.0, vig);

  gl_FragColor = vec4(color * inBounds, 1.0);
}
```

---

### 2.2 Monumental World-Space Hologram Showcases & Proportional Cyber-Drip Graffiti Headers (§14 & §15.7)

**Spatial Blueprint Reference:** [`assets/20261107T172758-750-iwl9/visual-planner-spatial-elevation-and-popout-blueprint.png`](../../assets/20261107T172758-750-iwl9/visual-planner-spatial-elevation-and-popout-blueprint.png)

#### Exact World-Space Dimensions & Proportional Geometry Table
| Spatial Parameter | Legacy Baseline | Spec 068 Addendum Target | Delta / Visual & Spatial Rationale |
| :--- | :--- | :--- | :--- |
| **Showcase Width (`screenWidth`)** | `1.60 m` | **`3.52 m`** ($\ge 3.4\text{ m}$) | **$+120\%$ linear span** (within $[3.4\text{ m}, 3.8\text{ m}]$ architectural range). Commands the alley corridor wall with billboard-scale legibility. |
| **Showcase Height (`screenHeight`)** | `0.98 m` | **`2.16 m`** | Preserves the exact `16:9.8` (`~1.6296:1`) aspect ratio of the `1024 × 627` `CanvasTexture` so zero text stretching occurs. |
| **Mount Elevation Offset (`MOUNT_ELEVATION_OFFSET_Y`)** | `+0.00 m` (`center Y = 1.75 m`) | **`+0.42 m`** (`center Y = 2.17 m`) | Raises the bottom edge of the $2.16\text{ m}$ display to $2.17 - 1.08 = \mathbf{1.09\text{ m}}$ above the alley floor (clearing the dense $0.04\text{ m}–0.58\text{ m}$ ground fog layer and preventing any floor clipping). |
| **Downward Eyeline Tilt (`MOUNT_VIEWING_PITCH_RAD`)** | `0.00 rad` (`0°`) | **`+0.08 rad`** ($\approx 4.58^\circ$) | Subtle downward pitch on `panelOffsetGroup.rotation.x` angled toward the approaching skater's $Y = 1.60\text{ m}$ eye level. |
| **Graffiti Header Width (`planeWidthMeters`)** | `2.32 m` | **`3.84 m`** ($\ge 3.6\text{ m}$) | **$+65.5\%$ expansion** (within $[3.6\text{ m}, 4.2\text{ m}]$), framing the $3.52\text{ m}$ showcase with a $+0.16\text{ m}$ sculptural overhang on each side. |
| **Graffiti Header Height (`planeHeightMeters`)** | `0.725 m` | **`1.20 m`** | Preserves the exact `3.2:1` aspect ratio of the `1024 × 320` cyber-drip graffiti header `CanvasTexture` (`3.84 / 1.20 = 3.20`). |
| **Graffiti Header Vertical Offset (`baseLocalOffsetY`)** | `0.84 m` | **`1.78 m`** | Places the header's bottom edge at $1.78 - 0.60 = \mathbf{+1.18\text{ m}}$ in mount-local space, floating cleanly **$+30\text{ mm}$ ($3\text{ cm}$)** above the showcase's top frame border ($1.08 + 0.07 = +1.15\text{ m}$) with **zero vertical overlap**. |
| **Diffused Light Ellipsoid (`mountDiffusedSphereGeom`)** | `1.408 m × 0.902 m × 0.78 m` | **`3.098 m × 1.987 m × 0.78 m`** | Automatically scales via `screenWidth * 0.88` and `screenHeight * 0.92` (`sandbox.js:2682`), bathing the surrounding brick wall in warm amber radial diffusion. |

> **CRITICAL IMPLEMENTATION GUARD FOR `sandbox.js:2772–2780`:**
> In `buildWallScreenMounts` (`sandbox.js:2772`), locator validation asserts `Math.abs(locatorPosition.y - st.expectedY) <= 0.08` against `freeman_alley.glb` markers (`st.expectedY = 1.75`). **Do NOT mutate `st.expectedY` before line 2780!** Instead, keep `locatorPosition.y` at `1.75` during locator validation, and apply the `+0.42 m` elevation (`MOUNT_ELEVATION_OFFSET_Y = 0.42`) and `+0.08 rad` downward viewing tilt (`MOUNT_VIEWING_PITCH_RAD = 0.08`) to `panelOffsetGroup.position.y = 0.42` and `panelOffsetGroup.rotation.x = 0.08` (or add `0.42` to `locatorPosition.y` *after* the validation check on line 2780 and update `worldMinYMeters: 2.85, worldMaxYMeters: 4.15` in `GRAFFITI_HEADER_GLITCH_FLICKER_SPEC`).

---

### 2.3 Pitch-Black Deep Space Void Sky Port & Atmospheric Juxtaposition (§13 & §15.6)

#### Color & Lighting Calibration
- **Zero Overhead Sky Glow (`#000000`):**
  - In [`sandbox.js`](../../sandbox.js#L1676-L1705), set:
    - `const DEPTH_FOG_COLOR_HEX = 0x000000;` (replacing legacy `0x0b0501`)
    - `scene.background = new THREE.Color(0x000000);` (replacing legacy `0x080401`)
    - `renderer.setClearColor(0x000000, 1.0);`
  - Any skybox / ceiling void plane or dome above the brick walls ($Y > 7.5\text{ m}$) must use `MeshBasicMaterial({ color: 0x000000, fog: false, toneMapped: false })`.
- **High-Contrast Neon-on-Void Juxtaposition:**
  - Because `DEPTH_FOG_COLOR_HEX` is now pure `#000000` (`0x000000`), distant corridor surfaces fade seamlessly into infinite pitch-black deep space rather than muddy brown-umber haze, making the enlarged `3.52 m × 2.16 m` amber showcases, `3.84 m × 1.20 m` cyber-drip graffiti headers, and the north-end PlatoDoom watercolor portal pop with maximum chromatic saturation.
  - Meanwhile, low-altitude floor fog (`buildLowAltitudeGroundFog` in `alley_atmosphere_023.js`) remains anchored strictly below $Y \le 1.80\text{ m}$ (primary density $0.04\text{ m}–0.58\text{ m}$), preserving the warm golden street-lamp reflection across the wet cobblestone floor.

---

### 2.4 PlatoDoom Arcade Downsampling & Generous Proximity Pop-Out Sensory Kinematics (§10 & §15.1–§15.2)

**Downsampled Header Asset Reference:** [`assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png`](../../assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png)

#### 1. Texture Downsampling & Crisp Silhouette Preservation (§10.1 & §15.1)
- **Empirical Verification of Assets:**
  - `/platodoomarcade.jpeg` is already `1024 × 345` (`34,997 B`, `1.41 MB` RGBA VRAM).
  - `/tags/1DOOMTAG.jpeg` is already `1024 × 345` (`36,802 B`).
  - `/assets/portal_games/platodoom_header.png` was `1120 × 381` (`338,782 B`). We generated and verified the premultiplied-alpha Lanczos downsampled **`1024 × 348`** replacement in [`assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png`](../../assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png) (`289,642 B` PNG, `1.425 MB` uncompressed RGBA $\le 2.0\text{ MB}$ budget) and [`assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.webp`](../../assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.webp) (`46,368 B` $\le 120\text{ KB}$).
  - `visual-implementer` / `optimization-implementer` can copy `assets/20261107T172758-750-iwl9/visual-planner-platodoom-header-1024x348.png` directly over `assets/portal_games/platodoom_header.png` and update `PORTAL_HEADER_LOGO_SPEC` in [`watercolor_shader.js`](../../watercolor_shader.js#L95-L105) to `width: 1024, height: 348, aspectRatio: Number((1024 / 348).toFixed(4))`.
  - UV letter boundaries in [`spray_paint_loader.js`](../../spray_paint_loader.js) (`resolveArcadeLogoPixelLetterIndex` and `getLetterId(vec2 uv)`) operate in normalized $[0, 1]^2$ UV space and remain 100% invariant under the `1024 × 348` / `1024 × 345` resolution tier.

#### 2. Generous Proximity Pop-Out State Machine & Sensory Feel (§10.2 & §15.2)
- **Spatial & Kinematic Parameters (`WATERCOLOR_GALLERY_SPEC` in `watercolor_shader.js`):**
  - **Anchor Position:** `{ x: 0.0065, yRel: 3.5987, z: 42.0129 }`
  - **Baseline Scale:** `{ x: 5.0, y: 5.0, z: 1.0 }`
  - **Trigger Threshold ($R_{\text{pop}}$):** **`6.8 m`** ($\ge 6.5\text{ m}$ requirement; triggers as soon as the approaching skater crosses $Z \ge 35.21\text{ m}$ walking north toward $Z = 42.0129\text{ m}$).
  - **Release Threshold ($R_{\text{release}}$):** **`7.5 m`** ($0.7\text{ m}–1.0\text{ m}$ hysteresis buffer; only releases when the skater retreats south of $Z < 34.51\text{ m}$, guaranteeing zero boundary oscillation).
  - **Pop-Out Scale Multiplier (`popOutScaleMultiplier`):** **`1.45`** ($\in [1.35\times, 1.60\times]$; expands `canvasStageGroup.scale` from `(5.0, 5.0, 1.0)` to `(7.25, 7.25, 1.0)`).
  - **Forward Normal Relief (`popOutForwardOffsetMeters`):** **`+0.35 m`** ($\in [+0.25\text{ m}, +0.45\text{ m}]$; translates `canvasStageGroup.position.z` forward along the corridor's $-Z$ approach vector from `42.0129` to **`41.6629`** toward the player).
  - **Easing Curve & Duration ($\tau$):** **`0.38 s` (`380 ms` $\in [320\text{ ms}, 450\text{ ms}]$)** smooth cubic Hermite / cubic-in-out easing:
    $$f(p) = \begin{cases} 4p^3 & p < 0.5 \\ 1 - \frac{(-2p + 2)^3}{2} & p \ge 0.5 \end{cases}$$
  - **Visual & Interactive Polish During Pop-Out:**
    - `frameLines.material.color` interpolates from `#e2e8f0` (idle) to vibrant golden-amber `#fbbf24` / electric magenta `#f33eff` with `opacity = 0.88 + 0.12 * eased`.
    - Because `canvasMesh` is a child of `canvasStageGroup`, scaling `canvasStageGroup` by `1.45×` and shifting it `+0.35 m` forward automatically expands the 3D raycast hit volume in world space (`canvasStageGroup.updateMatrixWorld(true)`).

---

### 2.5 Preserved 2D DOM & 3D Canvas Holographic Terminal Craft (Core Pillars §5.1–§5.6)

All edits to [`index.html`](../../index.html) and [`sandbox.js`](../../sandbox.js) must preserve 100% of the Core Spec 068 visual & layout tokens verified by [`tests/verify_spec068_screen_mounts.mjs`](../../tests/verify_spec068_screen_mounts.mjs):

| Core Pillar | Visual / CSS / Canvas Token Contract |
| :--- | :--- |
| **Pillar 1: Header Telemetry Removal & Top-Right Exit (`§5.1`)** | `.holo-badge`, `#holo-station-badge`, `#holo-coords-label`, `#holo-tether-bridge`, `#holo-kicker` have `display: none !important`. `#exit-mount-focus-btn` (`✕ EXIT`) sits in `.holo-top-right` (`min-width: 44px; min-height: 36px; background: rgba(239, 68, 68, 0.28); border: 1.5px solid rgba(248, 113, 113, 0.88); color: #fef2f2`), separated from `#holo-title` by $\ge 8\text{ px}$, and drawn at `(rightEdge - 128, 48)` on the `1280 × 784` logical (`1024 × 627` physical) 3D `CanvasTexture`. |
| **Pillar 2: Footer Chrome Removal (`§5.2`)** | `.holo-footer-bar` (`#holo-footer-status`, `#holo-prev-mount-btn`, `#holo-station-pips`, `#holo-next-mount-btn`) is hidden (`display: none !important`) and omitted from `createProjectScreenTexture(st)`. |
| **Pillar 3: Persistent Amber Scrollbar (`§5.3`)** | `#holo-custom-scrollbar` (`width: 8px; background: rgba(28, 12, 2, 0.86); border: 1px solid rgba(245, 158, 11, 0.62); opacity: 1; visibility: visible`) and `#holo-custom-scrollbar-thumb` (`min-height: 32px; background: linear-gradient(180deg, #fef08a 0%, #fbbf24 50%, #d97706 100%); box-shadow: 0 0 10px rgba(251, 191, 36, 0.82)`) are visible at $t = 0\text{ ms}$ across mobile and desktop. |
| **Pillar 4: Enlarged Description Typography (`§5.4`)** | 2D `#holo-description` uses `font-size: clamp(16.5px, 1.85vw, 19.5px); line-height: 1.60; color: #fef3c7` ($\ge 16.5\text{ px}$ on `375px` mobile, $\ge 18.5\text{ px}$ on `1280px` desktop). Station `04` (`SCREEN_MOUNT_07`) `#holo-narrative-heading` (`"What the hell does this mean, Luis?"`) uses `clamp(15.5px, 1.65vw, 18px)`. 3D `createProjectScreenTexture` uses `500 24px` font (`lineHeight = 35px`). |
| **Pillar 5: 28 Interactive `+` Bubble Tags (`§5.5`)** | All 28 tags across Stations `01`–`07` render as `<button type="button" class="holo-tag">` with `.holo-tag-label` and `19px × 19px` circular `.holo-tag-plus-bubble` (`+`). Clicking pulses `.tag-click-anim`, rotates `.holo-tag-plus-bubble` via `transform: rotate(45deg) scale(1.1)`, and opens `#holo-tag-popup` with the exact description from `HOLO_TAG_DESCRIPTIONS`. |
| **Pillar 6: Compact 3-Column Summary Cards & Zero Mobile Scroll (`§5.6`)** | `.holo-metrics-grid` uses `grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px` (`padding: 6px 8px`). Standard stations (`01, 02, 03, 05, 06, 07`) produce `scrollContainer.scrollHeight <= scrollContainer.clientHeight` (`0 px` overflow) on `390 × 844` and `375 × 667` mobile viewports when no tag pop-up is expanded. |

---

### 2.6 Multi-Engine Visual Rig Fidelity: Skate 3 Cleanroom & GTA Vice City (§11 & §15.3–§15.4)

1. **Skate 3 Cleanroom (`/skate3_cleanroom/`) Visual Rig Integrity (§11.1 & §15.3):**
   - Navigating to `/skate3_cleanroom/` defaults to `"default_char": "luis"` (`parts/char_luis.part`).
   - Using direct Python `struct` + `json` glTF 2.0 Chunk 0 surgery on `char_luis_holo.part[37:]` (per `stack-planner` `#19` & `optimization-planner` `#20`), remove `node 37 ("SkateAlley_Holo_Visualizer")`, `mesh 1 ("Torus")`, and `material 5 ("HOLOSYS_Visualizer_Holo_Material")`, while preserving the 35-joint `Skate3_RX2_Rig` (`SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheels) and all 5 mesh primitives on `Mesh 0 ("LUIS")`:
     - `LUIS_Body_Material` (`9,650` verts)
     - `LUIS_Head_Material` (`5,255` verts)
     - `Retail_SkateBoard` (`476` verts)
     - `Retail_SkateTruck` (`1,085` verts)
     - `Retail_SkateWheel` (`724` verts)
   - Visually, the spawned skater stands `1.8000 m` tall riding a complete textured skateboard deck, trucks, and wheels with **zero** floating cyan torus rings around his waist.
2. **GTA Vice City (`/revcdos/`) Deterministic `Luis` Player Appearance (§11.2 & §15.4):**
   - `scripts/serve_skatealley.py` materializes `revcdos/` and `revcdos/vcbr/luis_player/player.{dff,txd,bmp}` in the worktree, and `revcdos/game.js` mounts `player.dff` (`292,864 B`, `4,006` verts, `24` bones), `player.txd` (`45,056 B`), and `player.bmp` (`66,612 B`) into `Module.FS` on startup, setting `window.__REVCDOS_STATUS__.luisPlayerMounted = true`.

---

## 3. Multimodal Visual Verification Strategy (`playwright`, `threejs-devtools-mcp`, `ffmpeg`, `glbforge`)

During implementation and verification, `visual-implementer` and `e2e-validator` must execute the following empirical visual/sensory checks:

1. **Automated Core & Addendum Regression Suite:**
   - Run `node tests/verify_spec068_screen_mounts.mjs` across Desktop (`1280 × 800`), Standard Mobile (`390 × 844`), and Compact Mobile (`375 × 667`) viewports to verify 100% pass rate on Pillars 1–6.
2. **Live Three.js Scene & Shader Inspection (`threejs-devtools-mcp` on `:57764 -> :8080` & `playwright`):**
   - Query `scene_background` / `run_js` to verify `scene.background.getHexString() === "000000"`, `DEPTH_FOG_COLOR_HEX === 0x000000`, and `renderer.getClearColor(new THREE.Color()).getHexString() === "000000"`.
   - Query world-space bounding boxes (`new THREE.Box3().setFromObject(mesh)`) for `SCREEN_MOUNT_01..07_DisplayFront` (verify span $= 3.52\text{ m} \ge 3.4\text{ m}$, height $= 2.16\text{ m}$, bottom Y $\ge 0.90\text{ m}$) and `SCREEN_MOUNT_01..07_HeaderFront` (verify span $= 3.84\text{ m} \ge 3.6\text{ m}$, height $= 1.20\text{ m}$, zero vertical overlap with display bezel).
   - Query `window.sandbox.getCRTOpticalPassState()` to verify `{ enabled: true, scanlineIntensity: 0.16, curvature: 0.018, vignette: 0.32, phosphorMaskActive: true, gpuFrameTimeMs <= 0.8, pointerEventsBlocked: false }`.
3. **PlatoDoom Downsampling & Proximity Pop-Out Telemetry (`ffmpeg` & `playwright`):**
   - Run `ffmpeg` $\rightarrow$ `media_probe` on `assets/portal_games/platodoom_header.png` (`1024 × 348`, RGBA $\le 1.45\text{ MB} \le 2.0\text{ MB}`) and `platodoomarcade.jpeg` (`1024 × 345`).
   - In Playwright, move active character / camera to $Z = 36.0\text{ m}$ ($d = 6.01\text{ m} \le 6.8\text{ m}$) and assert `window.sandbox.waterColor.getState().isPoppedOut === true`, scale multiplier $\approx 1.45\times$, and $Z \approx 41.6629\text{ m}$ ($+0.35\text{ m}$ forward relief); retreat to $Z = 33.5\text{ m}$ ($d = 8.51\text{ m} > 7.5\text{ m}$) and assert smooth return to baseline.
4. **Multi-Engine Spawning Verification (`glbforge` & `playwright`):**
   - Inspect extracted GLB from `skate3_cleanroom/parts/char_luis.part` with `glbforge` $\rightarrow$ `inspect` to confirm `Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel` primitives are present and `Torus` / `SkateAlley_Holo_Visualizer` is absent.
   - Navigate Playwright to `/skate3_cleanroom/` and `/revcdos/` and verify default `Luis` character spawning (`window.__REVCDOS_STATUS__.luisPlayerMounted === true`).
