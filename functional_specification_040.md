# Functional Specification 040: Mobile Single-Thumbpad Locomotion & Full-Screen Touch-Look Interactivity for Freeman Alley

## 1. System Purpose & Core Objective

This specification defines the desired `{functionality}`, multi-touch interaction model, analog locomotion and radial auto-sprint mathematics, full-screen touch-look camera orbit behavior, 3D tap-vs-drag gesture disambiguation, responsive mobile viewport allocation, operational budgets, edge-case recovery boundaries, and verifiable `{correct required outputs}` for making the Freeman Alley 3D portfolio experience ([`/Users/diesel/desktop/skatealley/index.html`](file:///Users/diesel/desktop/skatealley/index.html)) fully interactive on mobile phones and touch-enabled tablets.

The primary objective is to establish an intuitive, conflict-free mobile control paradigm modeled on modern third-person 3D mobile experiences:
1. **Single Left Virtual Thumbpad for 360° Locomotion & Auto-Sprint:** A single analog thumbpad in the bottom-left thumb zone drives continuous 360° camera-relative planar movement, smoothly scaling from idle to walking and automatically transitioning into a full run/sprint when deflected to its outer rim—eliminating the need for a second virtual joystick or a dedicated sprint hold button.
2. **Touch-and-Drag Anywhere on the 3D Screen to Look Around:** Touching and dragging anywhere on the open 3D viewport outside the thumbpad and HUD controls rotates the third-person camera's horizontal azimuth (yaw) and vertical elevation (pitch) in 360°, operating simultaneously and independently alongside left-thumb locomotion.
3. **Direct 3D World Tap & Swipe Disambiguation:** Quick taps and localized object gestures on the 3D viewport remain fully functional for focusing the 6 Wall Screen Mounts, toggling and focusing the 6 MathPod holographic callouts, swiping the 17 Holographic Media Columns, advancing the intro dialogue sequence, and walking through the far-end Watercolor Portal into the Skate Room.
4. **Mobile-Responsive Viewport & Non-Overlapping HUD Layout:** Automatically adapts the sidebar HUD, holographic project showcase cards, and bottom-right audio deck display to mobile screen dimensions so that touch controls never collide with existing UI panels and the 3D alleyway remains unobstructed.

**DO NOT CODE YET.** This document specifies functional requirements, mathematical relationships, behavioral state transitions, operational budgets, and observable outcomes only. It contains zero implementation code, concrete syntax, or mechanical diffs.

---

## 2. Authoritative Domain Vocabulary Alignment (`LANGUAGE.md`)

All evaluations of system state, operational constraints, and verification gates within this specification strictly adhere to the authoritative taxonomy established in [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{functionality}`**: End-to-end mobile interactivity across the entire Freeman Alley portfolio lifecycle—from the startup camera pan and 3-step intro dialogue, through corridor exploration, 360° touch-look inspection, single-thumbpad walking and sprinting, 3D Wall Mount / MathPod / Hologram Column interaction, and physical entry into the far-end Watercolor Skate Room Portal—on touch-enabled mobile viewports (`375 × 667` portrait through tablet landscape) at 60 FPS.
- **`{correctness}`**:
  - The Left Thumbpad maps 2D thumb displacement into a normalized analog deflection vector $(l_x, l_y) \in [-1, 1]^2$ with radial magnitude $m = \sqrt{l_x^2 + l_y^2} \in [0, 1]$, applying a radial deadzone ($m < 0.12$), proportional walking speed ($0.12 \le m < 0.78$), and automatic outer-rim sprinting ($m \ge 0.78$) relative to the active camera's horizontal basis vectors.
  - Concurrent touch streams are strictly isolated by unique touch/pointer identity so that holding or moving the Left Thumbpad while simultaneously dragging a second finger across the 3D viewport produces zero cross-talk, zero instantaneous camera yaw/pitch snaps, and zero dropped movement inputs.
  - Screen touches on the 3D viewport accurately distinguish between intentional 3D taps (total pointer travel $\le 10\text{ px}$ between touch-down and release) and continuous camera-orbit drags (travel $> 10\text{ px}$).
  - Engaging the Left Thumbpad after the intro sequence unlocks automatically transitions the scene into Free-Roam locomotion at the character's current world position, preventing the mobile soft-lock at the `100%` scroll boundary (`Z = 36.0 m`).
- **`{correct required outputs}`**:
  1. On mobile/coarse-pointer viewports (or when mobile touch mode is explicitly enabled via query parameter), a single ergonomic Left Thumbpad and compact context-sensitive action controls render in the bottom-left safe area, while the main control sidebar defaults to its collapsed state (`sidebarCollapsed === true`) so $\ge 78\%$ of the 3D viewport is unobstructed.
  2. Live runtime telemetry (`window.__SANDBOX__`) exposes the mobile touch subsystem state—including active status, normalized thumbpad axes $(l_x, l_y)$, radial deflection magnitude $m$, auto-sprint engagement, and active look-drag status—verifying independent simultaneous locomotion and camera orbit.
  3. Zero bounding-box overlap (`0 px` intersection) between the Left Thumbpad, the bottom-right `DOOM TRACKS` audio display, the intro dialogue card, and the holographic project popup across standard mobile portrait (`375 × 667`, `390 × 844`) and landscape (`667 × 375`, `844 × 390`) viewports.
- **`{errors}`**:
  - Stranding mobile users at `100%` corridor progress (`Z = 36.0 m`) when native page scrolling disengages for Free-Roam Mode without providing touch locomotion to walk into the Watercolor Portal (`Z = 37.8 m`) or back down the alley.
  - Rendering a second (right-side) virtual thumbstick that collides with the bottom-right `DOOM TRACKS` audio display or blocks direct 3D object tapping.
  - Failing to isolate concurrent touch identities during multi-touch, causing the camera look delta to jump between the left thumbpad finger and the right look finger.
  - Leaving locomotion or camera drag states stuck active when a touch sequence terminates via system gesture cancellation, multi-finger release, orientation change, or window focus loss.
  - Leaving the `356 px`-wide control sidebar expanded by default on narrow mobile screens where it covers $> 90\%$ of the viewport width.
- **`{sufficient}`**: Exhaustive specification of mobile activation criteria, single-thumbpad analog math and auto-sprint thresholds, full-screen touch-look kinematics, multi-touch isolation invariants, 3D tap/swipe disambiguation rules, responsive HUD geometry budgets, failure recovery boundaries, and objective verification criteria.
- **`{insufficient}`**: Any specification that relies on keyboard-only locomotion in Free-Roam Mode, omits multi-touch pointer isolation between simultaneous move and look gestures, ignores browser touch-scroll hijacking on the 3D viewport, or allows HUD panels to occlude the mobile viewport.

---

## 3. Mobile Detection, Activation Lifecycle & Responsive Viewport Layout

### 3.1 Touch Capability Detection & Override Modes
1. **Automatic Mobile & Tablet Activation:** The mobile touch interaction layer must activate automatically whenever the runtime environment reports a coarse primary pointer, touch event support, or a mobile/tablet viewport width ($\le 900\text{ px}$).
2. **Deterministic Query Parameter Override:** The system must also support explicit URL query parameter overrides so automated verification suites and desktop developers can force-enable or force-disable the mobile touch interface on any display.
3. **Dynamic Runtime Adaptation:** If a hybrid device transitions into touch interaction (e.g., first touch event received on the viewport) or resizes into a mobile viewport envelope, the mobile touch layer must activate seamlessly without requiring a page reload.

### 3.2 Responsive HUD & Overlay Allocation on Mobile Viewports
To prevent UI panels from suffocating the 3D alleyway on compact screens (`375 × 667` through `430 × 932` portrait and `667 × 375` landscape):
1. **Auto-Collapsed Control Sidebar on Load:**
   - When initializing on a mobile or compact viewport ($\le 900\text{ px}$ width or coarse pointer), the primary control sidebar must start in its collapsed pill state (`sidebarCollapsed = true`) in the top-left corner rather than expanded at `356 px` width.
   - Tapping the collapsed sidebar header or toggle button must still allow the user to expand the drawer on demand to access debug/character tools, and collapse it back to return to the 3D scene.
2. **Bottom-Right Audio Deck Compact Scaling:**
   - On narrow mobile viewports (width $\le 640\text{ px}$), the compact bottom-right `DOOM TRACKS` screen-only display must scale proportionally (bounded to $\le 42\%$ of viewport width in portrait, e.g., `140 px–165 px` wide on a `375 px` screen, docked in the bottom-right safe area) so that it remains legible and interactive while leaving generous horizontal clearance (`\ge 56 px`) from the bottom-left thumbpad.
3. **Holographic Project Showcase & Intro Dialogue Fit:**
   - When a Holographic Project Showcase window (`PRJ-01` through `PRJ-06`) or the 3-step Intro Dialogue overlay is active on a mobile viewport, its container must fit within safe viewport margins without extending over the bottom-left thumbpad zone, and must allow scrollable or compact vertical presentation so all project links, station pips, and navigation buttons remain reachable by touch.
4. **Safe-Area Inset Compliance:**
   - All bottom-anchored and corner-anchored mobile controls must respect hardware safe-area insets (device notches, status bars, and bottom home-indicator bars) in both portrait and landscape orientations.

---

## 4. Single Left Virtual Thumbpad Behavioral Contract

### 4.1 Ergonomic Geometry & Visual States
1. **Placement:** A single circular analog thumbpad base (`120 px–144 px` diameter, scaled responsively to viewport dimensions) is anchored in the bottom-left thumb zone, offset from the left and bottom safe-area edges by `16 px–24 px`.
2. **Visual Components:**
   - **Outer Base Ring:** Translucent cyber-tactical housing with a subtle directional reticle and an outer sprint threshold ring.
   - **Movable Thumb Knob:** Centered circular puck (`48 px–58 px` diameter) that tracks the user's thumb position smoothly within the base radius and springs back to the exact center $(0, 0)$ immediately upon touch release.
   - **Active & Sprint Visual Feedback:** The base ring and knob illuminate with an active cyan accent during walking deflection and shift to an energetic amber/emerald highlight when the thumb crosses into the outer auto-sprint ring.
3. **Visibility Across Scene Phases:**
   - During the initial **Graffiti Spray-Paint Loader** and the locked **Startup Camera Pan**, the thumbpad remains unobtrusive/dormant until the intro camera settles.
   - Once the intro dialogue is completed (or skipped) and exploration is unlocked, the Left Thumbpad is immediately available for touch locomotion.
   - When the full-screen 3D Audio Device takeover modal or Cyber-Tactical Radial Menu is open, the thumbpad yields pointer priority so modal interactions are unobstructed.

### 4.2 Analog Deflection Mathematics & Radial Auto-Sprint
Let $(C_x, C_y)$ be the screen-space center of the Left Thumbpad base and $R_{\max} > 0$ be the maximum travel radius of the thumb knob. When the user touches inside the thumbpad base and drags to screen coordinates $(P_x, P_y)$:

1. **Raw Displacement & Clamped Knob Offset:**
   $$\Delta x = P_x - C_x, \quad \Delta y = P_y - C_y, \quad d = \sqrt{\Delta x^2 + \Delta y^2}$$
   $$k = \begin{cases} 1, & d \le R_{\max} \\ \dfrac{R_{\max}}{d}, & d > R_{\max} \end{cases}$$
   The visual knob offset is $(k \Delta x, \, k \Delta y)$, and the normalized 2D analog input vector $(l_x, l_y) \in [-1, 1]^2$ (with $+l_y$ representing forward/upward push on screen and $+l_x$ representing rightward push) is:
   $$l_x = \frac{k \Delta x}{R_{\max}}, \quad l_y = -\frac{k \Delta y}{R_{\max}}, \quad m = \sqrt{l_x^2 + l_y^2} \in [0.0, 1.0]$$

2. **Three-Tier Radial Speed & Animation Mapping:**
   - **Tier 1 — Radial Deadzone ($0.0 \le m < 0.12$):**
     - Effective movement input is $(0.0, 0.0)$.
     - Character decelerates smoothly to rest (`Idle` state, `IDLE_DEFAULT` animation) using the standard planar deceleration rate.
   - **Tier 2 — Proportional Walk Zone ($0.12 \le m < 0.78$):**
     - Remap normalized walk intensity smoothly across the walk band:
       $$u_{\text{walk}} = \frac{m - 0.12}{0.78 - 0.12} \in [0.0, 1.0)$$
     - Target planar speed scales continuously up to full walk speed ($v_{\text{target}} = v_{\text{walk}} \cdot \operatorname{clamp}(0.35 + 0.65 \, u_{\text{walk}}, \, 0.35, \, 1.0)$), driving the `Walk` state (`WALK_DEFAULT`) with stride-matched animation timescale and synchronized footstep audio.
   - **Tier 3 — Outer-Rim Auto-Sprint Zone ($0.78 \le m \le 1.0$):**
     - Pushing the thumb knob into the outer $22\%$ of the pad radius automatically engages **Sprint / Run** mode without requiring any second button press.
     - Target planar speed transitions to full run speed ($v_{\text{run}}$), blending into the `Run` state (`JOG_DEFAULT`), activating binary running trail effects, and triggering run-cadence footsteps.

3. **Camera-Relative 3D World Direction & Collision Fidelity:**
   - Given the active camera's horizontal yaw angle $\psi$, define the planar basis vectors:
     $$\vec{F}_{\text{cam}} = (\sin\psi, \, 0, \, \cos\psi), \quad \vec{R}_{\text{cam}} = (-\cos\psi, \, 0, \, \sin\psi)$$
   - The desired world-space planar movement direction is:
     $$\vec{D} = \frac{l_y \vec{F}_{\text{cam}} + l_x \vec{R}_{\text{cam}}}{\|l_y \vec{F}_{\text{cam}} + l_x \vec{R}_{\text{cam}}\|_2}$$
   - The character smoothly rotates its heading yaw toward $\operatorname{atan2}(D_x, D_z)$ and advances using the exact sub-stepped wall-segment collision solver, NPC separation solver, floor-triangle height sampler, and Watercolor Portal proximity trigger (`Z >= 37.8 m`) used by desktop Free-Roam locomotion.

### 4.3 Seamless Mode Handoff & Context-Sensitive Touch Actions
1. **Automatic Transition from Scroll-Walk to Free-Roam:**
   - If the scene is currently in `Scroll-Walk Mode` (at any corridor progress $0\% \le p \le 100\%$ after the intro lock is cleared) and the user deflects the Left Thumbpad past the deadzone ($m \ge 0.12$), the system must immediately transition into `Interactive Free-Roam Mode` at the character's exact current 3D position—mirroring the desktop behavior when a movement key is pressed.
   - Similarly, if the user is in `Wall-Mount Focus Mode` or `MathPod Pop-Up Focus Mode`, deflecting the Left Thumbpad ($m \ge 0.18$) cleanly exits focus mode and resumes Free-Roam locomotion.
2. **Compact Touch Action Buttons:**
   - Adjacent to the Left Thumbpad (or in a non-intrusive mobile action cluster that never overlaps the bottom-right audio display), provide compact, touch-friendly controls for:
     - **Jump:** Triggers a character jump (`JUMP_DEFAULT`) when grounded in Free-Roam Mode.
     - **Context Interact / Focus Mount:** Illuminates or pulses when near a Wall Screen Mount (`proximityMount`), allowing one-tap entry/exit of `Wall-Mount Focus Mode` (in addition to tapping the 3D mount or the center-bottom proximity pill directly).
     - **Mode / Corridor Return (`Scroll` $\leftrightarrow$ `Free-Roam`):** Allows a mobile user in Free-Roam Mode to re-dock onto the guided `Scroll-Walk` corridor spline (or step through project stations) with a single tap.

---

## 5. Full-Screen Touch-Look & 3D World Gesture Disambiguation

### 5.1 Touch-and-Drag Anywhere on the 3D Viewport to Look Around
1. **Open-Screen Look Region:** The entire 3D WebGL viewport outside of interactive DOM overlays and the Left Thumbpad serves as a direct 1-to-1 touch-look surface.
2. **Continuous 360° Azimuth & Elevation Orbit:**
   - When a finger touches down on the open 3D viewport and drags by screen delta $(\Delta x_{\text{px}}, \Delta y_{\text{px}})$:
     - Horizontal drag updates camera azimuth: $\psi \leftarrow \psi - \Delta x_{\text{px}} \cdot s_{\text{yaw}}$ (wrapping cleanly across $[-\pi, +\pi]$ for unrestricted $360^\circ$ horizontal rotation).
     - Vertical drag updates camera elevation: $\theta \leftarrow \operatorname{clamp}(\theta + \Delta y_{\text{px}} \cdot s_{\text{pitch}}, \, \theta_{\min}, \, \theta_{\max})$.
   - **Unlocked Look Across Exploration Modes:** Touch-dragging on the 3D viewport to look around must work both in `Interactive Free-Roam Mode` and while stationary or exploring in `Scroll-Walk Mode` (once the startup camera pan finishes), so mobile visitors can always pan the camera up to inspect the overhead `"VILLAINY INC."` neon sign, overhead steam pipes, and flanking holographic columns from any point in the alley.
   - **Wall-Collision Camera Clamping Preservation:** While orbiting via touch-look, the third-person camera must continue enforcing real-time 2D/3D raycast clamping against the alley's brick walls so the camera never penetrates behind wall geometry.

### 5.2 Simultaneous Multi-Touch Isolation (Left-Thumb Move + Right-Thumb Look)
1. **Per-Touch Identity Tracking:**
   - The Left Thumbpad and the 3D Viewport Touch-Look controller must each bind and track their own distinct touch/pointer identifier.
   - While Pointer $A$ is captured by the Left Thumbpad:
     - Subsequent touch-down, move, and release events from Pointer $B$ on the 3D viewport must be processed exclusively by the camera touch-look / 3D raycast controller.
     - Movements of Pointer $A$ inside the thumbpad must **never** be read by the camera orbit controller, and movements of Pointer $B$ on the 3D viewport must **never** alter the thumbpad deflection vector $(l_x, l_y)$.
   - Releasing Pointer $A$ stops character locomotion while Pointer $B$ continues orbiting the camera uninterrupted; conversely, releasing Pointer $B$ stops camera rotation while Pointer $A$ continues walking/sprinting uninterrupted.

### 5.3 Tap vs. Drag Disambiguation for 3D Scene Objects
To ensure touching the screen to look around never breaks direct 3D object interactivity:
1. **Travel Distance Threshold ($D_{\text{tap}} \le 10\text{ px}$):**
   - For any touch starting on the 3D viewport, track the maximum Euclidean distance $D_{\max}$ traveled from the initial touch-down coordinate $(x_0, y_0)$.
   - If $D_{\max} > 10\text{ px}$, the gesture is classified as a **continuous drag** (camera look orbit, 3D MathPod placement drag, or Carousel Hologram slide swipe) and must **not** trigger a 3D click/focus action upon release.
   - If $D_{\max} \le 10\text{ px}$ upon touch release, the gesture is classified as a **clean 3D tap** at $(x_0, y_0)$ and executes the scene raycast priority chain:
     1. **Focused MathPod Stage-2 Callout:** Tapping an active Stage-1 MathPod callout focuses it into Stage-2; tapping the open canvas while in Stage-2 exits popup focus.
     2. **3D MathPods (`POD-01`..`POD-06`):** Tapping a MathPod toggles its pinned Stage-1 holographic callout.
     3. **3D Wall Screen Mounts (`SCREEN_MOUNT_01`..`06`):** Tapping a mounted wall screen transitions smoothly into `Wall-Mount Focus Mode` for that project station.
     4. **3D Holographic Media Columns (`HOLO-01`..`17`):** Tapping selects the column; horizontal touch-dragging across a Carousel Column swipes its carousel slides smoothly without rotating the camera orbit.

---

## 6. Operational & Performance Budgets

| Operational Parameter | Mandatory Target Budget | Measurement / Verification Condition |
| :--- | :---: | :--- |
| **Frame Time & Cadence** | **$\ge 60\text{ FPS}$ ($\le 16.67\text{ ms/frame}$)** | Simultaneous Left Thumbpad sprint + Right Thumb 360° camera orbit |
| **Touch Input-to-Motion Latency** | **$\le 1\text{ frame}$ ($\le 16.67\text{ ms}$)** | Pointer move dispatch to updated character velocity & camera pose |
| **Multi-Touch Cross-Talk Error** | **$0.0\text{ rad}$ camera snap / $0.0$ axis bleed** | Two concurrent pointers moving in opposite directions at 60 Hz |
| **Thumbpad Radial Deadzone** | **$m < 0.12$** | Zero unintended drift from resting thumb contact |
| **Auto-Sprint Activation Threshold** | **$m \ge 0.78$** | Outer $22\%$ of thumbpad radius triggers `Run` (`JOG_DEFAULT`) |
| **3D Tap vs. Orbit Drag Threshold** | **$\le 10.0\text{ px}$ travel** | Clean disambiguation between 3D object tap and camera look drag |
| **Mobile UI Viewport Footprint** | **$\le 22\%$ of screen area** | Measured on `375 × 667` portrait & `667 × 375` landscape viewports |
| **Thumbpad $\leftrightarrow$ Audio HUD Overlap** | **$0\text{ px}^2$ intersection** | Bounding-box intersection check across all mobile aspect ratios |

---

## 7. Edge Cases, Failure Modes & Deterministic Recovery Boundaries

1. **System Gesture Interruption & Pointer Cancellation (`pointercancel` / `blur` / `visibilitychange`):**
   - *Failure Mode:* Mobile browsers frequently cancel an active touch stream mid-drag when an OS notification arrives, the user swipes near the home indicator, or a third finger touches the screen. If only standard touch-up events are handled, the thumbpad remains deflected (character runs forever into a wall) or the camera remains locked in drag mode.
   - *Recovery Requirement:* Every pointer cancellation, window blur, document visibility loss, or orientation change must immediately reset the Left Thumbpad state to $(0, 0)$, return the visual thumb knob to center, clear all virtual movement inputs, and terminate any active camera orbit, MathPod drag, or carousel swipe.
2. **Browser Native Pan / Pull-to-Refresh Hijacking on the 3D Viewport:**
   - *Failure Mode:* Without explicit touch-action governance on the 3D viewport and thumbpad elements, mobile browsers intercept horizontal or downward drags as page navigation or pull-to-refresh gestures after `8–12 px` of movement.
   - *Recovery Requirement:* The Left Thumbpad and the 3D viewport during touch-look / Free-Roam / 3D object dragging must suppress native browser pan/zoom gestures so 360° touch-look and analog steering never stutter or abort.
3. **Locked Startup Pan & 3-Step Intro Sequence Protection:**
   - *Failure Mode:* Touching the thumbpad while the initial `2.6 s` camera pan or 3-box intro dialogue lock is active could prematurely break the camera trajectory or leave the intro card orphaned on screen.
   - *Recovery Requirement:* While the intro sequence lock is active, tapping the intro dialogue card advances the dialogue boxes cleanly; if the user engages the thumbpad after the startup pan has settled, the intro lock must either complete cleanly or wait until the intro card is dismissed before transitioning into Free-Roam locomotion, never leaving orphaned UI overlays on screen.
4. **Wall-Mount Focus & Radial Menu Modal Isolation:**
   - *Failure Mode:* Touching the screen to click a project link inside the Holographic Project Window or selecting a slice in the Cyber-Tactical Radial Menu inadvertently orbits the camera or moves the character.
   - *Recovery Requirement:* Pointer events originating inside interactive HUD overlays (project popup buttons/links, audio player deck, sidebar drawer, radial menu, scene cutter) must remain isolated from both the 3D camera touch-look controller and 3D scene raycasting.

---

## 8. Verifiable `{correct required outputs}`

Implementation of this specification is complete (`{sufficient}`) only when all of the following objective runtime checks pass:

1. **Mobile Viewport Layout & Auto-Collapsed Sidebar Audit (`375 × 667` Portrait & `667 × 375` Landscape):**
   - Loading the Freeman Alley page in a mobile touch viewport (`375 × 667`, coarse pointer) confirms:
     - `window.__SANDBOX__.ready === true` with zero console errors or fatal error banners.
     - `window.__SANDBOX__.sidebarCollapsed === true` by default on mobile load, leaving the 3D alleyway clearly visible.
     - The Single Left Thumbpad is visible in the bottom-left safe area, the compact `DOOM TRACKS` audio screen is docked in the bottom-right safe area, and their bounding rectangles have **$0\text{ px}^2$ overlap** (`leftPadRect.right < mp3Rect.left`).
2. **Single Left Thumbpad Walk, Auto-Sprint & Mode Handoff Audit:**
   - Simulating or executing a touch drag on the Left Thumbpad confirms:
     - Deflecting to $m = 0.45$ (`Walk Zone`) transitions `window.__SANDBOX__.mode` into `'freeroam'`, sets character state to `'Walk'` (`WALK_DEFAULT`), and moves the character along the camera-relative vector.
     - Deflecting to $m = 0.92$ (`Outer-Rim Sprint Zone`) automatically engages sprint (`state === 'Run'`, clip `'JOG_DEFAULT'`) at run velocity without pressing any secondary sprint button.
     - Releasing the touch (`pointerup` or `pointercancel`) immediately resets thumbpad axes to $(0, 0)$ and decelerates the character to `'Idle'`.
3. **Full-Screen Touch-Look & Simultaneous Multi-Touch Isolation Audit:**
   - Touching and dragging on the open 3D `<canvas>` rotates `window.__SANDBOX__.cameraOrbit.yaw` and `window.__SANDBOX__.cameraOrbit.pitch` smoothly in 360°.
   - Holding Pointer 1 on the Left Thumbpad ($l_y = +0.90$) while simultaneously dragging Pointer 2 horizontally and vertically across the open `<canvas>` confirms:
     - The character continues running forward uninterrupted (`velocity.length > 0`).
     - `cameraOrbit.yaw` and `cameraOrbit.pitch` update strictly from Pointer 2's deltas with zero jumps from Pointer 1's coordinates.
4. **3D Tap Disambiguation & Portal Entry Audit:**
   - A short tap ($\le 10\text{ px}$ travel) on a 3D Wall Screen Mount focuses that station (`window.__SANDBOX__.mode === 'mount-focus'`), and tapping a 3D MathPod toggles its Stage-1 popup.
   - Pushing the Left Thumbpad forward from the far end of the alley (`Z = 36.0 m`) through `Z >= 37.8 m` triggers the Watercolor Portal transition into the Skate Room (`./skate3_cleanroom/`).
