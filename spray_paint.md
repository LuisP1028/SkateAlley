# Technical Specification: Interactive Graffiti Spray-Paint Loading Screen & Intro

## 1. Component Overview & Authoritative Reference Ground Truth

The objective is to deliver a self-contained, high-performance **HTML5 `<canvas>` / WebGL2 + Web Audio loading screen component** that reveals the **"PLATO DOOM"** bubble-letter logo (`tags/1DOOMTAG.jpeg`) through a simulated aerosol spray-paint animation set against a **solid black background (`#000000`)**.

### Authoritative Reference Video
All visual pacing, acoustic cues, kinematics, and aerosol mechanics are formally grounded in the canonical reference video:
* **Reference Asset Path:** `/Users/diesel/Desktop/SkateAlley/spray.mp4`
* **Source Characteristics:** 640×360 progressive video @ 29.917 FPS, stereo 44.1 kHz AAC audio, duration: 6.497 seconds (196 video frames).
* **Reference Visual Subject:** The iconic Rockstar Games aerosol stencil reveal—pitch black background, can rattle pre-roll, crisp valve pop, 4 sweeping aerosol passes, 3-second pristine logo hold, and smooth 320ms fade to black.

Rather than slow vector wipes or narrow single-line strokes, the component must emulate the **wide fat-cap aerosol stencil technique** exhibited in `spray.mp4`: sweeping passes of feathered spray across the canvas that progressively accumulate dense paint coverage over the logo silhouette, preserving the deep maroon fill, subtle 3D inner bevels, smooth outer contours, and negative-space cutouts of the original artwork against solid black `#000000`.

---

## 2. Canonical Timeline & Staging Breakdown (Derived from `spray.mp4`)

Empirical frame-by-frame and audio waveform analysis of `/Users/diesel/Desktop/SkateAlley/spray.mp4` establishes the authoritative timing structure:

| Stage | Time Range (ms) | Video Frames | Audio Telemetry Event | Visual & Render State | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0: Blackout** | `0ms – 500ms` | Frame 0 – 14 | Total silence (RMS < 5) | Solid `#000000` Canvas | Viewport initialized; canvas cleared to pure black; zero logo visibility. |
| **1: Shake Pre-Roll** | `500ms – 1300ms` | Frame 15 – 39 | 4 Can Shake Bursts (`540ms`, `720ms`, `980ms`, `1140ms`; RMS ~3200) | Solid `#000000` Canvas | Aerosol can shaking sound: rhythmic metallic rattle of the internal mixing marble. No paint on screen. |
| **2: Valve Engage** | `1600ms – 1700ms` | Frame 48 – 51 | Sharp Cap Click / Pop (`1660ms`; peak RMS 7629) | Solid `#000000` Canvas | Mechanical click of the spray cap / valve depressing, signaling imminent paint emission. |
| **3: Active Spray Reveal** | `2039ms – 3075ms` | Frame 61 – 92 | Continuous Aerosol Hiss (`~2.04s – 3.08s`; RMS ~400–700) | **4-Pass Aerosol Sweep** over `#000000` | Rapid sweeping passes of the virtual fat-cap nozzle. Paint accumulates organically from top to bottom. |
| ↳ *Pass 1 (Top)* | `2039ms – 2170ms` | Frame 61 – 65 | Hiss initiation | Right-to-Left sweep across upper boundary | Initial feathered maroon wash over upper letter contours. |
| ↳ *Pass 2 (Mid-Upper)*| `2270ms – 2470ms` | Frame 68 – 74 | Sustained hiss | Left-to-Right sweep across upper-middle belly | Infill accumulation; counter-holes and PLATO cutouts begin to read clearly. |
| ↳ *Pass 3 (Mid-Lower)*| `2610ms – 2770ms` | Frame 78 – 83 | Sustained hiss | Right-to-Left sweep across lower belly | Letters D, O, O body coverage reaches 85%+. |
| ↳ *Pass 4 (Base)* | `2840ms – 3075ms` | Frame 85 – 92 | Hiss swells then cuts off | Left-to-Right sweep along bottom base | M finishes; final infill pass locks 100% opacity; secondary tag snaps into view. |
| **4: Showcase Hold** | `3075ms – 6180ms` | Frame 92 – 185 | Silence / background alley ambience | 100% Pristine Logo Display | Full logo and 3D bevels showcased with subtle micro-overspray flecks; transient mist dissipates. |
| **5: Buff / Fade Dissolve**| `6180ms – 6500ms` | Frame 185 – 194 | Silence | Smooth Alpha Fade to `#000000` | 320ms dissolve into solid black or crossfade into the interactive 3D alley environment. |

---

## 3. Visual & Aesthetic Architecture

### 3.1 Fat-Cap Aerosol Reveal & Accumulation Dynamics
* **Aerosol Spray Cone:** Rather than a fine-line pen, the virtual nozzle behaves as an aerosol fat-cap producing a broad, soft radial spray footprint (radius $\approx 60\text{px}–90\text{px}$ in logo coordinate space).
* **Opacity Accumulation:** A single quick pass of the spray nozzle deposits $\approx 35\%–50\%$ opacity. Overlapping passes build up dense, opaque coverage ($100\%$). The leading edge of the active stroke exhibits a soft feathered falloff into black, matching `spray.mp4` frames 62, 74, and 80.
* **Paint Deposition Kinematics:** Sweeping strokes accelerate across open horizontal spans and decelerate slightly on directional rebounds, creating natural paint density variations before final saturation.

### 3.2 Stencil Definition & Source Artwork Fidelity
* **Base Artwork:** Source image is [`tags/1DOOMTAG.jpeg`](file:///Users/diesel/Desktop/SkateAlley/tags/1DOOMTAG.jpeg) ($3514 \times 1184$ px, maroon bubble throw-up).
* **Matte Extraction & Edge Defringing:** The source asset has a white background (`RGB ~253, 253, 251`) with JPEG DCT compression ringing along high-contrast borders. The loader pipeline must strip the exterior white background and apply edge defringing/unpremultiplication so that **zero white halo or pink fringe artifacts** appear against `#000000`.
* **Stencil Boundary Cleanliness:** As demonstrated in `spray.mp4`, while the spray deposition is organic and soft, the underlying artwork boundary acts as a crisp stencil: the outer perimeter and 3D bevels resolve with razor precision once painted.

### 3.3 Negative-Space Cutout Handling
* **Counter-Spaces:** The inner counter-holes of `D`, `O1`, and `O2` are negative spaces exposing the pitch-black `#000000` background.
* **PLATO Lettering:** The negative-space **"PLATO"** lettering embedded in the upper curve of the `D` must remain crisp, unpainted cutouts exposing the solid black backdrop underneath (identical to how the black 'R' and star cutout functions against the orange block in `spray.mp4`).

### 3.4 Unmasked Aerosol Phenomenon (Overspray & Transient Mist)
To capture the raw physical street-art aesthetic outside the strict stencil bounds:
1. **Permanent Micro-Splatter (Overspray):** Fine maroon paint flecks ($1\text{px}–3\text{px}$) deposited slightly outside the outer contours along high-velocity sweep reversals, standing out subtly against the black `#000000` backdrop.
2. **Transient Aerosol Mist:** A semi-transparent cloud of maroon aerosol vapor emitted at the virtual nozzle position that expands, drifts slightly outward, and dissipates over $150\text{ms}–400\text{ms}$.

---

## 4. Acoustic Architecture (Web Audio API)

To reproduce the multisensory impact established in `spray.mp4`, the component features an integrated, procedural Web Audio engine (or bundled audio buffer playback):

### 4.1 Acoustic Synthesizer Specifications
* **Mixing Ball Rattle (Can Shake):** 4 distinct metallic impulse bursts generated via bandpass-filtered noise (`f_center ≈ 2800 Hz, Q ≈ 8`) coupled with a metallic decay resonance (`f ≈ 4200 Hz`), firing at `540ms`, `720ms`, `980ms`, and `1140ms`.
* **Valve Click (Cap Pop):** A high-amplitude transient click (`~1660ms`, duration $< 25\text{ms}`) simulating mechanical valve actuation.
* **Aerosol Spray Hiss:** Continuous bandpass-filtered pink/white noise (`f_center ≈ 3500 Hz, Q ≈ 2.5`) with subtle velocity-linked volume modulation, smoothly fading in at `~2039ms` and cutting off crisply at `3075ms`.

### 4.2 Browser Audio Constraints & Fallback
* **Autoplay Policy Handling:** If browser autoplay policies block the `AudioContext` before user interaction, the component runs visually uninterrupted in silent mode without throwing unhandled exceptions.
* **Audio Controls:** Exposes `audioEnabled: boolean` (default: `true`) and `volume: number` (`0.0` to `1.0`).

---

## 5. Dual Operating Modes & Telemetry Synchronization

### 5.1 Autonomous Intro Mode (`mode: 'autoplay'`)
* Emulates the complete 6.5-second sequence of `spray.mp4`:
  - `0.0s – 0.5s`: Pitch black silence.
  - `0.5s – 1.3s`: Shake pre-roll (4 can rattles).
  - `1.6s – 2.0s`: Valve pop.
  - `2.0s – 3.1s`: 4-pass fat-cap spray reveal + continuous hissing sound.
  - `3.1s – 6.2s`: 3-second pristine logo hold.
  - `6.2s – 6.5s`: 320ms smooth fade to black (or transition callback).
* Optional `loop: boolean` parameter (for demo/standalone test harness).

### 5.2 Deterministic Progress Mode (`mode: 'deterministic'`)
* **Telemetric Binding:** Binds spray progression to external asset loading progress (`0.0` to `1.0` via `setProgress(value)`):
  - `progress = 0.0`: Blackout state; pre-roll can shake can trigger during initial network handshake.
  - `progress = 0.25`: Pass 1 complete; letter `D` revealed.
  - `progress = 0.50`: Pass 2 complete; `D` and `O1` revealed.
  - `progress = 0.75`: Pass 3 complete; `D`, `O1`, `O2` revealed.
  - `progress = 1.00`: Pass 4 complete; 100% of `PLATO DOOM` revealed; nozzle cuts off.
* **Adaptive Catch-Up Buffering:** If loading progress leaps abruptly (e.g. $0.15 \rightarrow 0.85$ or $0.20 \rightarrow 1.0$), the nozzle does not teleport. An adaptive acceleration curve catches up smoothly across intermediate points within an ergonomic maximum window of $500\text{ms}–800\text{ms}$, guaranteeing continuous visual trajectory without stalling the host application.
* **Guaranteed 100% Opacity Lock:** When `progress = 1.0`, any sub-saturation or micro-pinholes in the logo silhouette are finalized to 100% opacity.

---

## 6. Public Interface & Lifecycle Contract

```typescript
export interface SprayPaintLoaderOptions {
  canvas: HTMLCanvasElement;
  logoSource?: string;            // Default: 'tags/1DOOMTAG.jpeg'
  mode?: 'autoplay' | 'deterministic'; // Default: 'deterministic'
  duration?: number;              // Total duration in ms for autoplay mode (default: 6500)
  loop?: boolean;                 // Repeat autoplay sequence (default: false)
  audioEnabled?: boolean;         // Enable Web Audio SFX (default: true)
  volume?: number;                // Master audio volume 0.0 to 1.0 (default: 0.8)
  oversprayIntensity?: number;    // Permanent fleck density 0.0 to 1.0 (default: 0.5)
  mistEnabled?: boolean;          // Transient vapor emitter toggle (default: true)
  backgroundColor?: string;       // Default: '#000000'
}

export interface SprayPaintLoader {
  // Imperative Methods
  setProgress(value: number): void;
  play(): void;
  pause(): void;
  reset(): void;
  resize(width?: number, height?: number): void;
  destroy(): void;

  // Lifecycle Callbacks
  onReady?: () => void;
  onShake?: () => void;
  onSprayStart?: () => void;
  onLetterComplete?: (letterIndex: number, letterId: 'D' | 'O1' | 'O2' | 'M') => void;
  onPassComplete?: (passIndex: number) => void;
  onComplete?: () => void;
}
```

---

## 7. Viewport, Responsiveness & Performance Constraints

* **Resolution Independence & HiDPI:** `canvas.width` and `height` account for `window.devicePixelRatio` (clamped to `2.0` to preserve GPU memory on mobile devices).
* **Aspect Ratio Preservation (`object-fit: contain`):** The wide $3514 \times 1184$ logo is automatically centered and scaled within the black canvas with $\ge 10\%$ safety margins on all borders so overspray and mist are never clipped.
* **Frame Budget:** Locked 60 FPS ($< 16.6\text{ms}$ frame time; target $< 1.0\text{ms}$ GPU compute overhead per frame), leaving $> 90\%$ of GPU/CPU resources available for 3D asset decompression and scene loading.
* **Context Loss Resilience:** Gracefully handles `webglcontextlost` and `webglcontextrestored` without state leaks or memory corruption.

---

## 8. Visual & Acoustic Acceptance Criteria (Definition of Done)

1. **Initial State (`0.0s / progress = 0.0`):** Canvas renders pure solid black (`#000000`) with zero premature logo visibility.
2. **Audio-Visual Staging Synchronization (`spray.mp4` Parity):**
   - 4 audible can rattles occur during pre-roll before paint is emitted.
   - Valve pop click sounds at `~1.6s`.
   - Continuous aerosol hiss plays synchronously while the nozzle is actively spraying.
3. **Mid-Progress & Sweep Inspection:**
   - 4 distinct horizontal/diagonal fat-cap sweeping passes traverse across the logo.
   - Feathered leading spray edge accumulates into opaque maroon fill.
   - Counter-spaces and "PLATO" cutouts cleanly expose the black `#000000` backdrop without white fringing.
   - Organic micro-overspray flecks and transient mist remain visible against `#000000`.
4. **Final State (`progress = 1.0`):**
   - 100% of the `PLATO DOOM` logo (including 3D inner bevels) is fully opaque with zero missing interior blotches.
   - Audio hiss ceases cleanly.
   - 3-second showcase hold followed by smooth dissolve to black.
