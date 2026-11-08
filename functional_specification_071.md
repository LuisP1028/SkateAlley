# Functional Specification 071: Enlarged Minimalist Portfolio HUD, Full-Screen Horizontal Works Hologram Showcase, Interactive Cipher Decode (Boot/Hover/Click), and Independent Mobile Analog Flicker-On System

> **Document Status:** Authoritative Functional Specification (`DO NOT CODE YET` — Pre-Implementation Gate)  
> **Target System:** Freeman Alley WebGL / Three.js Interactive Portfolio Experience ([`index.html`](file:///Users/diesel/desktop/skatealley/index.html), [`sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js), [`scene_materialization_hud_070.js`](file:///Users/diesel/desktop/skatealley/scene_materialization_hud_070.js))  
> **Authoritative Vocabulary:** [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)  
> **Supersedes / Refines:** HUD & Mount Interaction clauses of [`functional_specification_070.md`](file:///Users/diesel/desktop/skatealley/functional_specification_070.md)

---

## 1. Executive Summary & Architectural Root-Cause Analysis

This specification defines the functional requirements, spatial architecture, state-machine contracts, and operational budgets for five tightly integrated upgrades to the Freeman Alley 3D portfolio interface:

1. **HUD Copy Decluttering, Role Re-Alignment & Removal of Legacy Overlays:**
   - **Observed Symptom:** The current perimeter HUD displays ornamental Japanese Katakana/Kanji text (`フリーマン・アレー // 空間ポートフォリオ`), a `"SYS.070"` version suffix (`©2026 // SYS.070`), a `"CREATIVE TECHNOLOGIST"` subtitle (`AI ENGINEER & CREATIVE TECHNOLOGIST`), a `"JUMP"` action button in the top navigation bar, `"ONLINE // WEBGL2"` engine text in the top-right telemetry pill, and a bottom-right `"SYS-990 // LOCKED"` / `"SYS-990 // READY"` status widget. Additionally, a legacy `"CHAR CAM"` / `"OTS 1.38m"` floating popup widget (`#char-cam-hud-widget`) remains visible on screen.
   - **Architectural Requirement:** Strip all non-essential and legacy status chrome so the HUD communicates identity and navigation with zero clutter:
     - Remove the Japanese/Chinese bilingual line completely.
     - Remove `"SYS.070"` from the brand header.
     - Replace the role subtitle with the exact canonical string **`AI ENGINEERING | DATA ANALYTICS`**.
     - Remove the `"JUMP"` button from the navigation bar across both desktop and mobile viewports.
     - Remove `"ONLINE // WEBGL2"` (and its separator) and remove the `"SYS-990 // LOCKED"` / `"SYS-990 // READY"` readout completely.
     - Remove the `"Character Cam OTS"` (`#char-cam-hud-widget` / `#char-cam-hud-toggle-btn` / `#char-cam-hud-panel`) popup widget in its entirety.

2. **Substantially Enlarged, High-Presence Screen-Agnostic Perimeter HUD:**
   - **Observed Symptom:** The current perimeter HUD typography (`9px–13px` labels and `24px–28px` navigation pills) reads too small relative to the full-viewport 3D alley canvas on both desktop monitors and mobile screens.
   - **Architectural Requirement:** Scale up the perimeter HUD's fluid typographic hierarchy, navigation pill dimensions, hit-target footprints, and container padding across all viewport sizes (`375×667` mobile portrait through `2560×1440` desktop/ultrawide) so the identity header (`LUIS // PLATODOOM` + `AI ENGINEERING | DATA ANALYTICS`), top-center navigation bar (`SCROLL`, `WORKS`, `MENU`, `CHAT`), and top-right live frame telemetry command clear visual authority without overlapping the 3D showcase or touch controls.

3. **`"WORKS"` Navigation Mode — Full-Screen, Screen-Size-Agnostic Horizontal Project Hologram Showcase (Replacing `"MOUNT"`):**
   - **Observed Symptom:** The top-center button is currently labeled `"MOUNT"` and only interacts with a wall screen mount when the player is in Free-Roam mode within proximity of a mount locator. Visitors who want to immediately browse Luis's portfolio projects from any point in the experience lack a direct, full-screen, horizontally scrollable showcase.
   - **Architectural Requirement:** Rename `"MOUNT"` to **`"WORKS"`**. Activating `"WORKS"` from **any** application state (`scroll`, `freeroam`, or startup) immediately opens the portfolio showcase starting at the first screen mount (**Station 01 / `SCREEN_MOUNT_01` — `GRAPHRAG POLICY ENGINE`**) in a **full-screen, screen-size-agnostic** holographic stage. Within this stage, visitors can **scroll horizontally** (via horizontal touch swipe, trackpad/wheel horizontal or vertical-to-horizontal scroll, keyboard arrow keys, or on-screen horizontal navigation controls/dots) seamlessly across all 7 portfolio project holograms (`Station 01` through `Station 07`) on both mobile and desktop viewports.

4. **Post-Dialogue Gated Universal Cipher Decode / Decipher Choreography (After Initial Dialogue Sequence Only, Plus Hover AND Click/Tap):**
   - **Observed Symptom:** Currently, the HUD cipher decode fires at raw scene boot while the startup camera pan (`pan-playing`) and initial 7-card intro dialogue sequence (`dialogue-active` / `#intro-dialogue-overlay`) are still active on screen, meaning the HUD is already sitting static before the user finishes or skips the initial dialogue sequence. Furthermore, hover skips active pills and clicking/tapping a HUD button does not trigger a cipher decode.
   - **Architectural Requirement:** Both the Perimeter HUD (`#portfolio-perimeter-hud`) and the Mobile Virtual Analog Touchpads (`#mobile-touch-controls`) MUST remain **dormant and hidden** throughout the startup camera pan (`pan-playing`) and the initial intro dialogue sequence (`dialogue-active`). **Only after the initial dialogue sequence concludes** (when `introSequenceState.phase` transitions out of `'pan-playing'` / `'dialogue-active'` into `'ready-to-scroll'` or `'scrolling-alley'` via completing the final dialogue card or skipping the intro dialogue) may the Perimeter HUD appear and execute its initial **Cipher Decode (Decipher)** sequence. Thereafter, every interactive HUD control (`SCROLL`/`ROAM`, `WORKS`, `MENU`, `CHAT`, and brand identity) must also trigger a localized Cipher Decode sequence **both when hovered over AND when clicked/tapped**.

5. **Decoupled Mobile Virtual Analog Stick Rendering with Post-Dialogue CRT Phosphor Flicker-On Ignition:**
   - **Observed Symptom:** On mobile/touch viewports, the left and right virtual analog sticks (`#mobile-left-thumbpad` and `#mobile-right-thumbpad`) appear statically at boot while the intro dialogue card is still on screen, rather than powering on after the dialogue sequence completes.
   - **Architectural Requirement:** Keep `#mobile-touch-controls` (`#mobile-left-thumbpad` and `#mobile-right-thumbpad`) hidden during the startup camera pan and initial dialogue sequence (`pan-playing` and `dialogue-active`). **Only after the initial dialogue sequence finishes** (and decoupled from the top HUD's text cipher decode), the mobile analog sticks materialize via a dedicated multi-stage **CRT Phosphor Flicker-On** ignition sequence (staggered ring/reticle/crosshair/knob power-on flicker).

---

## 2. Authoritative Domain Alignment (`LANGUAGE.md`)

All design, implementation, and verification phases governed by this document are evaluated strictly against [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{errors}`:** Any remaining Japanese/Chinese characters (`フリーマン・アレー // 空間ポートフォリオ`) in the HUD; any visible `"JUMP"` button in the HUD navigation bar; any visible `"CREATIVE TECHNOLOGIST"`, `"SYS.070"`, `"ONLINE // WEBGL2"`, or `"SYS-990 // LOCKED"` / `"SYS-990 // READY"` strings; any visible `"Character Cam OTS"` (`#char-cam-hud-widget`) button or popup; `"WORKS"` failing to open the full-screen horizontal project showcase from any mode; inability to horizontally scroll across all 7 projects on mobile or desktop; HUD text failing to decipher/decode on load, hover, or click; mobile analog sticks failing to flicker on separately from the HUD; layout jitter (`CLS > 0.000`) during cipher decoding; or unhandled runtime exceptions.
- **`{correctness}`:** Exact adherence to the enlarged HUD typographic/spatial bounds, deterministic horizontal carousel indexing and smooth scroll/swipe physics across all 7 project stations (`proj-01`, `proj-02`, `proj-03`, `proj-07`, `proj-04`, `proj-05`, `proj-06`), zero-jitter bounding-box locking during every boot/hover/click cipher decode, and independent keyframed phosphor flicker-on state transitions for both mobile analog reticles.
- **`{functionality}`:** End-to-end usability across mobile portrait (`375×667`, `390×844`), mobile landscape (`844×390`), standard desktop (`1440×900`), and 4K/ultrawide (`2560×1440`) viewports in the live WebGL runtime.
- **`{correct required outputs}`:** Objectively measurable DOM computed styles, bounding boxes, text contents, horizontal scroll offsets, station indices, cipher-decode active glyph counts on boot/hover/click, and analog stick flicker keyframe states verified via automated headless browser instrumentation.
- **`{sufficient}` / `{insufficient}`:** Implementation is `{sufficient}` only when all five requirements operate cohesively in the live browser with zero `{errors}` and all quantitative verification gates pass.

---

## 3. Pillar 1: HUD Content Decluttering, Role Re-Alignment & Enlarged Screen-Agnostic Scaling

### 3.1 Mandatory Removals & Canonical Text Replacements

1. **Removal of Japanese / Chinese Subtitle (`#portfolio-hud-bilingual`):**
   - The bilingual Katakana/Kanji subtitle (`フリーマン・アレー // 空間ポートフォリオ`) MUST be completely removed from the DOM and boot decode queue. Zero CJK characters may appear anywhere in the perimeter HUD.
2. **Removal of `"SYS.070"` Stamp (`#portfolio-hud-stamp`):**
   - The `"SYS.070"` / `"©2026 // SYS.070"` stamp MUST be removed so no `"SYS.070"` or `"SYS070"` identifier appears in the HUD.
3. **Canonical Role Subtitle Replacement (`#portfolio-hud-roles`):**
   - Replace `"AI ENGINEER & CREATIVE TECHNOLOGIST"` with the exact uppercase string:
     ```text
     AI ENGINEERING | DATA ANALYTICS
     ```
   - This role descriptor MUST remain visible on both desktop and mobile viewports directly beneath `LUIS // PLATODOOM` in the top-left HUD region.
4. **Removal of `"JUMP"` Navigation Button (`#mobile-action-jump-btn`):**
   - Remove the `"JUMP"` button from the top-center navigation bar (`#mobile-touch-actions`).
   - The top-center navigation bar MUST contain exactly four primary interactive pills in left-to-right order:
     1. **`SCROLL`** (or **`ROAM`** when in Free-Roam mode) — toggles between Scroll-Walk and Free-Roam locomotion.
     2. **`WORKS`** (renamed from `"MOUNT"`) — opens/toggles the Full-Screen Horizontal Works Hologram Showcase (§4).
     3. **`MENU`** — toggles the Cyber-Tactical Radial Menu (`Q`).
     4. **`CHAT`** — toggles the `DOOM_HEAD` Hologram Dialogue Terminal.
5. **Removal of `"ONLINE // WEBGL2"` & `"SYS-990 // LOCKED"` Telemetry Clutter:**
   - Remove `"ONLINE // WEBGL2"` (`#portfolio-hud-tel-engine` and `#portfolio-hud-tel-engine-sep`) from the top-right telemetry pill. The top-right telemetry module (`#portfolio-hud-top-right`) retains only the live glowing status indicator dot, the tabular frame-timing readout (`Frame: XX.X ms, YY FPS`), and the corridor/showcase progress readout (`000% ALLEY` / `WORK 01/07`).
   - Remove the bottom-right `"SYS-990 // READY"` / `"SYS-990 // LOCKED"` utility bar (`#portfolio-hud-bottom-right`) completely so `"SYS-990 LOCKED"` never renders.
6. **Complete Removal of `"Character Cam OTS"` Popup (`#char-cam-hud-widget`):**
   - Remove the `#char-cam-hud-widget` container, its `#char-cam-hud-toggle-btn` (`CHAR CAM` / `OTS 1.38m` button), and its `#char-cam-hud-panel` dialog from active rendering on all viewports (`display: none !important` / DOM removal, with all keyboard/button toggles disabled) so the Character Cam OTS popup never appears.

### 3.2 Enlarged Screen-Agnostic HUD Typographic & Spatial Hierarchy

To ensure the perimeter HUD feels substantial, engineered, and immediately legible across all screens, the HUD dimensions MUST be scaled up to the following fluid envelopes:

| HUD Element / Module | Desktop / Ultrawide (`> 768px` width) | Mobile / Compact (`<= 768px` width) | Typographic & Visual Contract |
| :--- | :--- | :--- | :--- |
| **Top-Left Brand Title (`#portfolio-hud-brand`)** | `font-size: clamp(18px, 1.85vw, 26px)` | `font-size: clamp(15px, 4.2vw, 18px)` | `Geist Sans`, `font-weight: 800`, `letter-spacing: -0.03em`, `#fffbeb` with warm amber phosphor glow |
| **Top-Left Role Subtitle (`#portfolio-hud-roles`)** | `font-size: clamp(11.5px, 1.05vw, 14.5px)` | `font-size: clamp(9.5px, 2.65vw, 11.5px)` | `Geist Mono` or `Geist Sans`, `font-weight: 600`, `letter-spacing: 0.08em`, `#fbbf24` / `#fef3c7`, reads `AI ENGINEERING \| DATA ANALYTICS` |
| **Top-Center Nav Container (`#mobile-touch-actions`)** | `padding: 6px 8px`, `gap: clamp(6px, 0.8vw, 10px)` | `padding: 5px 7px`, `gap: 6px` | Frosted obsidian pill bar (`border-radius: 999px`), `1.5px` amber border (`rgba(245, 158, 11, 0.48)`) |
| **Top-Center Nav Pills (`SCROLL`, `WORKS`, `MENU`, `CHAT`)** | `height: clamp(34px, 3.1vw, 42px)`, `min-width: clamp(68px, 6.4vw, 88px)`, `padding: 0 clamp(14px, 1.4vw, 20px)`, `font-size: clamp(12px, 1.05vw, 14.5px)` | `height: clamp(30px, 7.8vw, 34px)`, `min-width: clamp(56px, 14vw, 68px)`, `padding: 0 11px`, `font-size: clamp(10.5px, 2.9vw, 12px)` | `font-weight: 700`, `letter-spacing: 0.07em`, uppercase, high-contrast solid amber/crimson active pill state |
| **Top-Right Telemetry Pill (`#portfolio-hud-top-right`)** | `padding: 8px 14px`, `font-size: clamp(11.5px, 0.98vw, 13.5px)` | `padding: 5px 10px`, `font-size: clamp(10px, 2.6vw, 11.5px)` | `Geist Mono`, `font-variant-numeric: tabular-nums`, displays live `Frame: XX.X ms, YY FPS` |

- **Non-Overlapping Layout Guarantee:** On compact mobile viewports (`<= 768px`), the Top-Left identity block (`LUIS // PLATODOOM` + `AI ENGINEERING | DATA ANALYTICS`) and Top-Right telemetry pill sit on the upper row (`top: calc(10px + env(safe-area-inset-top, 0px))`), while the enlarged Top-Center Navigation Bar (`#portfolio-hud-top-center` containing `SCROLL | WORKS | MENU | CHAT`) docks cleanly centered on the second tier (`top: calc(52px + env(safe-area-inset-top, 0px))`), guaranteeing zero bounding-box collision between the three top HUD regions.

---

## 4. Pillar 2: `"WORKS"` Full-Screen, Screen-Size-Agnostic Horizontal Project Hologram Showcase

### 4.1 `"WORKS"` Trigger & State Transition Contract

1. **Universal Entry from Any Mode:**
   - Clicking or tapping the **`WORKS`** button (`#mobile-action-interact-btn`) in the top-center HUD navigation bar from **any** mode (`scroll`, `freeroam`, or during the intro sequence):
     - Dismisses any open secondary overlays (e.g., radial menu, DOOM_HEAD chat, sticker popup, or startup camera pan).
     - Enters the **`mount-focus` / Works Showcase Mode** starting at **Station 01 (`SCREEN_MOUNT_01` — `01 // GRAPHRAG POLICY ENGINE`)** if not already open, OR exits back to the alley if the Works Showcase is already open and the user clicks `WORKS` again (or clicks `EXIT` / presses `Escape`).
   - While the Works Showcase is open, the `WORKS` pill in the top-center HUD displays an active/highlighted state so the user has clear visual feedback of the active mode.

### 4.2 Full-Screen, Screen-Size-Agnostic Stage Geometry

1. **Full-Viewport Holographic Stage (`#holo-projection-stage` & `#holo-popup-window`):**
   - When opened via `WORKS` (or by inspecting a wall screen mount), the holographic showcase stage (`#holo-projection-stage`) expands to occupy the full available viewport area beneath the top perimeter HUD:
     - **Desktop / Tablet (`> 768px`):** Fills the viewport below the top HUD bar (`top: clamp(72px, 7.5vh, 92px)`, `bottom: clamp(18px, 2.5vh, 28px)`, `left: clamp(18px, 2.5vw, 36px)`, `right: clamp(18px, 2.5vw, 36px)`), utilizing `100%` of that stage footprint for the horizontal hologram track.
     - **Mobile Portrait & Landscape (`<= 768px`):** Fills the viewport below the two-tier top HUD (`top: calc(92px + env(safe-area-inset-top, 0px))`, `bottom: calc(14px + env(safe-area-inset-bottom, 0px))`, `left: 10px`, `right: 10px`). While the full-screen Works Showcase is open on mobile, the bottom virtual analog sticks (`#mobile-touch-controls`) automatically hide/suppress pointer capture so the entire lower screen is dedicated to the full-screen project hologram and horizontal scrolling.
2. **Screen-Size-Agnostic Card Layout:**
   - Each project hologram slide adapts fluidly to the stage's aspect ratio using CSS grid/flex proportional sizing (`clamp()` typography, flexible media preview viewport, and internal vertical scroll fallback only if content exceeds compact vertical height), ensuring that on any screen size:
     - The project index badge (`01 / 07` .. `07 / 07`), project title, description, narrative callout (when present), interactive technology tags, quantitative metric cards, `LIVE_DEMO` / `SRC_CODE` CTA buttons, **and** the **amber-tinted 4-frame live-demo hologram preview** are cleanly visible and interactive.

### 4.3 Horizontal Scrolling Across All 7 Portfolio Holograms

1. **Horizontal Hologram Track / Carousel Architecture:**
   - The Works Showcase presents all **7 portfolio project stations** in a continuous horizontal sequence:
     1. **Station 01 (`SCREEN_MOUNT_01`):** `GRAPHRAG POLICY ENGINE`
     2. **Station 02 (`SCREEN_MOUNT_02`):** `DIGITAL TWIN PERSONA`
     3. **Station 03 (`SCREEN_MOUNT_03`):** `QUANTITATIVE MODELING AND STATISTICAL ARBITRAGE`
     4. **Station 04 (`SCREEN_MOUNT_07`):** `REJECTION STATION // MACHINE LEARNING`
     5. **Station 05 (`SCREEN_MOUNT_04`):** `AI DATA ANALYTICS DASHBOARDS AND ALIGNMENT RESEARCH`
     6. **Station 06 (`SCREEN_MOUNT_05`):** `GENERATIVE PIPELINES`
     7. **Station 07 (`SCREEN_MOUNT_06`):** `MULTI-MODAL DEEP LEARNING`
2. **Multi-Modal Horizontal Scroll & Navigation Inputs (Mobile & Desktop):**
   - Users MUST be able to scroll and navigate **horizontally** through the 7 project holograms using any of the following inputs on both mobile and desktop:
     - **Native Horizontal Touch Swipe / Drag & SnapScroll:** Swiping left/right across the full-screen holographic showcase smoothly scrolls horizontally between project cards with CSS scroll-snap (`scroll-snap-type: x mandatory` / `scroll-snap-align: center`) or spring-damped horizontal track translation.
     - **Desktop Trackpad / Mouse Wheel Horizontal Scrolling:** Horizontal two-finger trackpad swipes (`deltaX`) AND standard vertical mouse-wheel scrolling (`deltaY`, when not scrolling an overflowing inner text pane) translate smoothly along the horizontal project track (`scrollLeft`), allowing desktop mouse-wheel users to effortlessly scroll horizontally through all 7 projects.
     - **Interactive Horizontal Navigation Controls & Station Progress Bar:**
       - Prominent `◄ PREV` and `NEXT ►` holographic step buttons and an interactive 7-station horizontal index bar (`01` through `07` pill pips) in the showcase header/footer allow one-tap jumping or stepping to any project hologram.
     - **Keyboard Navigation:** Pressing `ArrowRight` / `KeyD` advances to the next project hologram horizontally; pressing `ArrowLeft` / `KeyA` moves to the previous project hologram; pressing `Escape` exits the full-screen Works Showcase.
3. **Synchronized 3D Wall Mount Camera & Hologram Preview:**
   - As the active project index changes during horizontal scrolling (`01` $\leftrightarrow$ `07`), the active station state (`sandbox.focusedMount` / `sandbox.activeHoloProject`) updates in sync, transitioning the background 3D camera toward the corresponding wall screen mount in Freeman Alley and triggering a subtle holographic scanline/cipher refresh on the active card header.

---

## 5. Pillar 3: Post-Dialogue Gated HUD Cipher Decode (After Initial Dialogue Only, Plus Hover and Click/Tap)

### 5.1 Post-Dialogue Gating & Initial Cipher Decode Guarantee

1. **Strict Dormancy During Initial Pan & Intro Dialogue Sequence:**
   - While the startup camera pan (`introSequenceState.phase === 'pan-playing'`) or the initial 7-card intro dialogue sequence (`introSequenceState.phase === 'dialogue-active'` / `#intro-dialogue-overlay.active`) is running, `#portfolio-perimeter-hud` MUST remain completely dormant and hidden (`opacity: 0`, `visibility: hidden`, `pointer-events: none`), and MUST NOT execute its initial cipher decode yet.
2. **Post-Dialogue Cipher Decode Trigger (`dialogue-active -> ready-to-scroll / scrolling-alley`):**
   - **Only when the initial dialogue sequence finishes** (either when the visitor advances past the final dialogue card via `completeIntroDialogue()`, clicks `SKIP`, or transitions out of `pan-playing` / `dialogue-active` into `ready-to-scroll` / `scrolling-alley`), `#portfolio-perimeter-hud` becomes visible and immediately executes its 3-phase **Cipher Decode (Decipher)** sequence (`█ ▓ ▒ ░ / \ | _ + # 0 1 < >` with `#eb5a13` / `#ffffff` hot leading-edge highlights resolving left-to-right) across every visible HUD text element (`LUIS // PLATODOOM`, `AI ENGINEERING | DATA ANALYTICS`, `SCROLL`, `WORKS`, `MENU`, `CHAT`, and the top-right telemetry readout).
   - **Decode Duration & Staggered Choreography:** The post-dialogue cipher decode spans $650\text{ ms} \le T_{\text{decode}} \le 1,100\text{ ms}$ with staggered beats across the top-left identity, top-center navigation pills, and top-right telemetry so the user clearly witnesses the entire HUD deciphering into place the moment the dialogue concludes.

### 5.2 Hover AND Click/Tap Cipher Decode Re-Trigger

1. **Hover Re-Trigger (All Interactive HUD Elements, Including Active Pills):**
   - Once the HUD has materialized after the initial dialogue sequence, hovering the pointer (`pointerenter` on non-touch devices) over **any** interactive HUD button (`SCROLL`/`ROAM`, `WORKS`, `MENU`, `CHAT`) or the top-left brand identity block (`#portfolio-hud-top-left`) MUST immediately trigger a localized Cipher Decode sequence ($360\text{ ms}$ duration, `frameStep: 2`) on that element—**even if that button currently has the `.active-pill` or `.active` class**.
2. **Click / Tap Re-Trigger (Mobile & Desktop):**
   - Clicking or tapping (`pointerdown` / `click`) **any** HUD navigation button (`SCROLL`/`ROAM`, `WORKS`, `MENU`, `CHAT`) on either mobile or desktop MUST immediately trigger a localized Cipher Decode sequence on the newly resolved target label of that button (for example, clicking `SCROLL` switches mode to `ROAM` and deciphers the text `"ROAM"`; clicking `WORKS` opens the Works Showcase and deciphers `"WORKS"`), providing instant tactile cryptographic feedback on every tap or click.
3. **Zero-Jitter Layout Locking (`CLS = 0.000`):**
   - All post-dialogue, hover, and click cipher decodes MUST lock the element's exact pixel `width` and `height` prior to glyph mutation and restore clean single-text-node DOM upon completion, guaranteeing `<= 0.5px` bounding-box variance (`CLS = 0.000`).

---

## 6. Pillar 4: Independent Mobile Virtual Analog Stick Rendering & Post-Dialogue Phosphor Flicker-On Sequence

### 6.1 Architectural Separation & Post-Dialogue Gating

1. **Independent Lifecycle & Strict Dormancy During Initial Dialogue:**
   - The mobile virtual analog sticks (`#mobile-left-thumbpad` and `#mobile-right-thumbpad` inside `#mobile-touch-controls`) are architecturally decoupled from `#portfolio-perimeter-hud`.
   - Throughout the startup camera pan (`pan-playing`) and the initial intro dialogue sequence (`dialogue-active`), `#mobile-touch-controls` (`#mobile-left-thumbpad` and `#mobile-right-thumbpad`) MUST remain completely hidden (`opacity: 0`, `visibility: hidden`, `pointer-events: none`) so the touchpads never appear or flicker on while the intro dialogue cards are active.
   - Their labels (`MOVE` and `LOOK`) are not batched into the top HUD's text decode; instead, the entire left and right telemetry reticle assemblies power on independently via a hardware **Phosphor Flicker-On** sequence after the initial dialogue sequence finishes.

### 6.2 Multi-Stage CRT Phosphor Flicker-On Choreography

1. **Trigger Conditions:**
   - The analog stick **Phosphor Flicker-On** animation triggers **only after the initial dialogue sequence has completed**:
     1. Immediately following the completion/dismissal of the initial intro dialogue sequence on mobile/touch viewports (staggered $180\text{ ms}–260\text{ ms}$ after the post-dialogue HUD cipher decode begins so the visitor sees the HUD decipher at the top and the analog reticles flicker on at the bottom as distinct hardware events).
     2. Whenever mobile touch controls transition from hidden/suppressed back to active after the initial dialogue is already complete (for example, when exiting the full-screen `WORKS` showcase or closing the `DOOM_HEAD` chat overlay back into the alley on mobile).
2. **Visual Flicker-On Keyframe Progression ($520\text{ ms}$ total duration, left stick leading right stick by $65\text{ ms}$):**
   - **`0% – 18%` (Cold Filament Surge):** Reticle opacity spikes from `0.0 -> 0.85` with a bright `#fef3c7` / `#fbbf24` ring flash and `scale(0.92 -> 1.02)`.
   - **`18% – 34%` (Dropout Dip 1):** Opacity drops sharply to `0.12` as the phosphor capacitor discharges.
   - **`34% – 52%` (Secondary Strike):** Outer calibration ring and cardinal ticks ignite (`opacity: 0.95`), while the inner crosshair and center puck briefly drop to `0.25`.
   - **`52% – 72%` (Dropout Dip 2):** Brief micro-flicker to `0.32`.
   - **`72% – 100%` (Stabilized Idle Telemetry State):** Reticle settles smoothly to its calibrated idle resting state (`opacity: 0.56`, `scale(1.0)`), while the `MOVE` / `LOOK` labels and `0.00 // IDLE` / `0.00 // STBY` tabular readouts lock in.
3. **Immediate Touch Override Safety:**
   - Once the initial dialogue sequence has completed, if the user touches/drags either analog stick while its flicker-on animation is still in progress, the flicker animation on that stick immediately resolves to the `1.0` active high-contrast tracking state with zero input latency (`0 ms` input blocking).

---

## 7. Operational & Performance Budgets

| Subsystem / Metric | Mandatory Operational Target |
| :--- | :--- |
| **Forbidden Legacy / Clutter Strings** | `0` visible occurrences of Japanese/Chinese characters, `"JUMP"`, `"CREATIVE TECHNOLOGIST"`, `"SYS.070"`, `"ONLINE // WEBGL"`, `"SYS-990"`, or `"CHAR CAM"` / `"OTS"` popup |
| **Pre-Dialogue / Active-Dialogue Dormancy** | `#portfolio-perimeter-hud` and `#mobile-touch-controls` remain `hidden` (`opacity == 0`) while `introSequenceState.phase` is `'pan-playing'` or `'dialogue-active'` |
| **Enlarged Top-Center Nav Pill Height** | Desktop (`1440×900`): `>= 34px`; Mobile (`390×844`): `>= 30px` |
| **Enlarged Top-Left Brand Font Size** | Desktop (`1440×900`): `>= 18px`; Mobile (`390×844`): `>= 15px` |
| **`WORKS` Showcase Stage Coverage** | Occupies `>= 80%` of viewport width and `>= 75%` of viewport height across `390×844` and `1440×900` |
| **Horizontal Project Count in `WORKS`** | All `7` portfolio project stations (`proj-01` through `proj-06` + `proj-07`) scrollable horizontally |
| **Cipher Decode Layout Stability (`CLS`)** | `<= 0.5px` bounding-box `width`/`height` delta during post-dialogue, hover, and click decodes (`CLS = 0.000`) |
| **Mobile Analog Flicker-On Duration** | `450ms – 600ms` multi-step opacity/glow keyframe sequence (`#mobile-left-thumbpad`, `#mobile-right-thumbpad`) |
| **Frame-Time Budget** | Steady `60 FPS` (`<= 16.67ms` frame time) during Works horizontal scrolling and HUD cipher decoding |

---

## 8. Verification Criteria & `{correct required outputs}`

Implementation of this specification MUST be verified via an automated Playwright/Chromium verification suite against the live application asserting the following `{correct required outputs}`:

1. **HUD Decluttering & Enlarged Sizing Verification:**
   - `#portfolio-hud-bilingual`, `#mobile-action-jump-btn`, `#portfolio-hud-stamp` (`SYS.070`), `#portfolio-hud-tel-engine` (`ONLINE // WEBGL2`), `#portfolio-hud-bottom-right` (`SYS-990 // LOCKED`), and `#char-cam-hud-widget` (`Character Cam OTS` popup) are absent or hidden (`display: none` / removed).
   - `#portfolio-hud-roles` is visible on both desktop (`1440×900`) and mobile (`390×844`) and its exact text is `"AI ENGINEERING | DATA ANALYTICS"`.
   - `#mobile-action-interact-btn` is labeled `"WORKS"`.
   - Computed font sizes and pill heights meet the enlarged §3.2 thresholds with `0 px²` bounding-box overlap between `#portfolio-hud-top-left`, `#portfolio-hud-top-center`, and `#portfolio-hud-top-right`.
2. **Full-Screen Horizontal `WORKS` Showcase Verification:**
   - Clicking `WORKS` (`#mobile-action-interact-btn`) from default `scroll` mode at the alley entrance (`progress = 0.0`) immediately opens the full-screen Works Showcase at Station 01 (`GRAPHRAG POLICY ENGINE`).
   - All 7 project stations are rendered in a horizontal scrollable track (`scrollWidth > clientWidth * 3`).
   - Horizontal scrolling (via track scroll / wheel / swipe / Next-Prev controls) across all 7 stations transitions the active project from Station `01` through Station `07` on both `1440×900` desktop and `390×844` mobile portrait viewports, displaying each project's title, tags, metrics, links, and 4-frame amber hologram preview.
3. **Post-Dialogue Gated Cipher Decode + Hover & Click Re-Trigger Verification:**
   - While `introSequenceState.phase` is `'pan-playing'` or `'dialogue-active'`, both `#portfolio-perimeter-hud` and `#mobile-touch-controls` remain hidden/dormant (`bootChoreographyPlayed === false`).
   - Completing or skipping the initial dialogue sequence (`completeIntroDialogue()`) reveals `#portfolio-perimeter-hud` and immediately triggers the cipher decode choreography (`bootChoreographyPlayed === true`), followed by hover and click re-triggers on `WORKS` / `SCROLL` / `MENU` / `CHAT` with `<= 0.5px` dimension delta.
4. **Post-Dialogue Separate Mobile Analog Stick Flicker-On Verification:**
   - On `390×844` mobile viewports, `#mobile-left-thumbpad` and `#mobile-right-thumbpad` remain hidden during the initial dialogue sequence and execute their independent phosphor flicker-on animation (`flicker-on` state) only after the initial dialogue sequence completes (and when returning from full-screen `WORKS` mode), with instant `1.0` active override upon touch.
