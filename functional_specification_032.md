# Functional Specification 032: Freeman Alley Corridor Restoration, Cathedral & Rear Door Decommissioning, Pure 65-Bone Quaternius UAL Animation Restoration, and Skate / Spray-Paint Subsystem Removal

## 1. Purpose & Core Objective

This specification defines the desired `{functionality}`, operational budgets, and verifiable `{correct required outputs}` for restoring the Freeman Alley 3D interactive experience (`/Users/diesel/desktop/SkateAlley`) to a self-contained alleyway environment driven exclusively by the 65-bone Quaternius Universal Animation Library (UAL).

Specifically, the system must:
1. **Completely Remove the Cathedral Skatepark Environment & Rear Door Portal:** Eliminate the Cathedral Skatepark 3D environment (`cathedral_skatepark.glb`), its runtime collision and alignment systems, its HUD controls and telemetry, and the interactive rear alley hinged door portal (`REAR_ALLEY_DOOR_PANEL` / `REAR_ALLEY_DOOR_PIVOT`), leaving the rear of Freeman Alley intact and closed with its original visual mesh and end-wall collision boundary (`COLLIDER_BOUND_END`).
2. **Preserve 3D Fly / No-Clip Free-Roam Mode (`KeyF`):** Retain the unrestricted 3D Fly / No-Clip Free-Roam toggle button in the HUD (`Locomotion Mode` section) and its `KeyF` keyboard shortcut so the user can freely inspect the alleyway in 3D space alongside Scroll-Walk Mode and Grounded Free-Roam Mode.
3. **Restore the Pure 65-Bone Quaternius UAL Character & Animation Deliverables (Without Skateboard or Spray-Can Meshes):** Replace the 35-bone Skate 3 retargeted character and animation binaries with the pure 65-bone Quaternius UAL character and animation `.glb` deliverables (57 Quaternius UAL animation clips), ensuring zero embedded skateboard or spray-can prop meshes (`Skateboard_Mesh` / `Skateboard_Root`, `SprayCan_Mesh` / `SprayCan_Root`) exist in any character or animation `.glb`.
4. **Completely Remove All Skating & Spray-Painting Animations, Props, Controls, and Runtime Subsystems:** Eliminate all on-board/off-board skateboarding physics, trick state machines, state-graph manifests (`skate3_state_graph.json`), standalone skateboard and spray-can prop loading (`assets/skateboard.glb`, `assets/spraycan.glb`), and GTA:SA graffiti spray-painting sequences from the runtime, HUD, and keyboard bindings.
5. **Remove the Spray-Painting Slice from the Cyber-Tactical 2D HUD Radial Menu (`KeyQ`):** Remove the Spraypaint sector slice from the radial command wheel and decouple any deleted spray-painting or skateboarding runtime callbacks from radial slice selection.

---

## 2. Glossary & Evaluation Taxonomy Alignment (`LANGUAGE.md`)

All state evaluations, behavioral requirements, and sufficiency checks in this specification strictly adhere to the authoritative definitions in `LANGUAGE.md`:

- **`{functionality}`**: End-to-end execution of the Freeman Alley interactive 3D corridor experience under real-world browser runtime conditions, featuring Scroll-Walk locomotion, Grounded WASD Free-Roam locomotion, 3D Fly / No-Clip Free-Roam locomotion, pure 65-bone Quaternius UAL character skeletal animations and emotes, 6 interactive wall-mounted holographic project stations, 7 interactive 3D MathPods with walk-through glitch FX and world-space callout popups, 17 2D holographic media columns, 6 holographic die-cut stickers, the 17-glyph 3D holographic typography sign, 20 multi-tiered overhead cables, watercolor skybox/shader optics, diegetic spatial audio, and the Cyber-Tactical 2D HUD Radial Menu—completely free of Cathedral Skatepark, rear door portal, skateboarding, or spray-painting subsystems.
- **`{correctness}`**: Deterministic contract fidelity across all scene assets, skeletal hierarchies, animation mixers, collision boundaries, and UI controls without logical flaws, orphaned references, broken imports, or silent fallbacks:
  - Every playable character variant is bound to the 65-bone Quaternius UAL skeleton and plays clips from the 57-clip Quaternius UAL animation library without missing-bone warnings or unmapped tracks.
  - Freeman Alley's visual mesh (`VISUAL_ALLEY_MESH`) and 5 collision boundaries (`COLLIDER_FLOOR`, `COLLIDER_WALL_L`, `COLLIDER_WALL_R`, `COLLIDER_BOUND_START`, `COLLIDER_BOUND_END`) remain unmodified by rear-door triangle extraction or dead-space floor clamping.
  - Radial menu polar sector geometry dynamically subdivides the 360-degree wheel across the remaining menu items with zero overlap or missing emblem assets.
- **`{correct required outputs}`**:
  1. **Zero Cathedral, Door, Skate, or Spray-Paint Network Requests:** Browser network telemetry on `http://localhost:8080/` records `200 OK` for all required Freeman Alley assets and records **0 requests** for `cathedral_skatepark.glb`, `skate3_state_graph.json`, `assets/skateboard.glb`, `assets/spraycan.glb`, or `anim/spraypaint_emblem.jpeg`.
  2. **Pure 65-Bone Quaternius UAL Deliverables:**
     - `quaternius_animations.glb` (~7.12 MB) contains the 65-bone Quaternius UAL skeleton (`root`, `pelvis`, `spine_01`, `spine_02`, `spine_03`, `neck_01`, `Head`, limbs, and fingers) and **57 Quaternius UAL animation clips** (43 core clips + 14 canonical aliases: `Idle`, `Walk`, `Run`, `Sprint`, `Jump`, `Fall`, `Wave`, `Attack`, `Dance`, `Sit`, `Punch`, `Hit`, `Victory`, `Death`), with **0** `skate_*` or `graffiti_*` / `spraycan_*` clips.
     - All 5 character `.glb` variants (`LUIS_HOLOSYS_RIGGED.glb`, `LUIS_RIGGED_CLAY.glb`, `character_hoodie.glb` / `LUIS_RIGGED.glb`, `PLATODOOM_HOLOSYS_RIGGED.glb`, `character_tunic.glb` / `PLATODOOM_RIGGED.glb`) contain the 65-bone Quaternius UAL skeleton, their character mesh (`CharacterMesh` + `DOOM_Companion` on LUIS variants; `PLATODOOM` on Tunic variants), and **0** `Skateboard_Root` / `Skateboard_Mesh` or `SprayCan_Root` / `SprayCan_Mesh` nodes.
  3. **HUD & Telemetry State:**
     - `#hud-status-badge` displays `READY (60 FPS)`.
     - `#clip-count-label` displays `57` (`Quaternius Animation Library (57 Clips)`).
     - The `Locomotion Mode` HUD section includes `Return to Scroll Mode (R)`, `Reset 0%`, `Radial HUD (Q)`, and `3D Fly / No-Clip Free-Roam: OFF (F)` (toggling to `ON (F)` when active).
     - The `Cathedral Skatepark & 3D Free-Roam` HUD section, rear door buttons, Cathedral teleport buttons, and Cathedral X/Y/Z/Yaw sliders are completely absent from the DOM.
     - The `Live Telemetry` grid contains no `Cathedral:` or `Skate:` rows.
     - The `.controls-hint` footer lists only active controls (`F` 3D Fly/No-Clip, `E` Inspect Wall Mount, `Q` Radial Menu, `WASD`/`Arrows` Move, `Shift` Run, `Space` Jump, `1-9`/`0` Emotes, `Scroll` Walk, `H` Holo, `M` Mute) with no references to Door Walk-Through, Spray Paint, Skate/Dismount, Push, Carve, Brake/Powerslide, Crouch+Ollie, or Tricks.
  4. **Radial Menu (`KeyQ`) State:**
     - Opening the Cyber-Tactical Radial Menu (`KeyQ` or `Radial HUD (Q)` button) renders the wheel without the `SPRAYPAINT` (`TAG // CAN-05`) slice.
- **`{errors}`**: Any runtime exception, unhandled promise rejection, missing asset 404, `#fatal-error-banner` activation, residual skateboard or spray-can mesh visible on or near any character, residual Cathedral geometry in the scene, missing rear alley door geometry due to triangle slicing, or broken character locomotion/emote playback.
- **`{sufficient}`**: All asset binary requirements, behavioral contracts, HUD/DOM state changes, operational budgets, and verification criteria are defined with zero ambiguity.

---

## 3. Detailed Functional Requirements

### 3.1 Complete Decommissioning of the Cathedral Skatepark & Rear Alley Door Portal

1. **Asset Loading & Scene Graph Cleanup:**
   - The application must not fetch, parse, or stage `cathedral_skatepark.glb`.
   - No `ENV_CATHEDRAL_SKATEPARK` group, Cathedral floor triangles, or Cathedral perimeter wall segments may be added to the Three.js scene or collision solver.
   - Scene depth fog density must remain governed by the Freeman Alley atmospheric profile without Cathedral-zone overrides.

2. **Preservation of Intact Freeman Alley Rear Boundary (`freeman_alley.glb`):**
   - `VISUAL_ALLEY_MESH` inside `freeman_alley.glb` must render with 100% of its authored triangles intact at the rear of the corridor ($Z \approx 70.6\text{m} \dots 71.3\text{m}$); no triangles may be stripped or extracted into a separate `REAR_ALLEY_DOOR_PANEL` mesh or `REAR_ALLEY_DOOR_PIVOT` group.
   - `COLLIDER_FLOOR` and `COLLIDER_BOUND_END` must retain their authored geometry and active collision enforcement so that grounded characters in Free-Roam Mode are naturally contained within the Freeman Alley corridor walls and end bounds.
   - No invisible door raycast hitbox (`REAR_ALLEY_DOOR_HITBOX`) may exist in the scene, and pointer hover/click raycasting must only target the 6 holographic wall mounts and 7 interactive MathPods.

3. **Key `E` Interaction Scope:**
   - Pressing `KeyE` in Free-Roam Mode must exclusively interact with the nearest in-range holographic wall mount (`SCREEN_MOUNT_01` through `SCREEN_MOUNT_06`, within `3.50m`) or exit Mount Focus Mode when already focused on a wall mount.
   - The bottom-center proximity prompt (`#mount-proximity-prompt`) must only appear when the player is within interaction range of a wall mount in Free-Roam Mode, never for a rear door portal.

4. **Preservation of 3D Fly / No-Clip Free-Roam (`KeyF`):**
   - The `3D Fly / No-Clip Free-Roam` toggle button (`#toggle-fly-freeroam-btn`) must be retained inside the `Locomotion Mode` HUD section alongside `Return to Scroll Mode (R)`, `Reset 0%`, and `Radial HUD (Q)`.
   - Pressing `KeyF` or clicking `#toggle-fly-freeroam-btn` must continue to toggle unrestricted 3D flight (`W`/`S` forward/back along camera look vector, `A`/`D` strafe, `Space`/`E` ascend, `C`/`Ctrl` descend, bypassing wall/floor colliders) and update the HUD mode banner (`3D Fly / No-Clip Free-Roam`) and button label (`3D Fly / No-Clip Free-Roam: ON (F)` / `OFF (F)`).

---

### 3.2 Pure 65-Bone Quaternius UAL Character & Animation Restoration

1. **65-Bone Quaternius UAL Skeleton Contract:**
   - All playable character variants and the shared animation library (`quaternius_animations.glb`) must use the 65-bone Quaternius Universal Animation Library (`Armature`) joint hierarchy (`root`, `pelvis`, `spine_01`, `spine_02`, `spine_03`, `neck_01`, `Head`, `clavicle_l`, `upperarm_l`, `lowerarm_l`, `hand_l` + 15 left finger joints, `clavicle_r`, `upperarm_r`, `lowerarm_r`, `hand_r` + 15 right finger joints, `thigh_l`, `calf_l`, `foot_l`, `ball_l`, `thigh_r`, `calf_r`, `foot_r`, `ball_r`).
   - At initialization and during isolated `.glb` variant switching (`#glb-variant-select`), the system must validate that every loaded character `SkinnedMesh` has a valid skeleton with exactly **65 bones**. Any deviation must fail fast via `#fatal-error-banner`.

2. **Clean Character `.glb` Deliverables (Zero Skate or Spray Props):**
   - All 5 character `.glb` variants in `/Users/diesel/desktop/SkateAlley` must be the clean 65-bone Quaternius UAL deliverables without any `Skateboard_Root`, `Skateboard_Mesh`, `SprayCan_Root`, or `SprayCan_Mesh` scene nodes:
     - `LUIS_HOLOSYS_RIGGED.glb` (Hoodie — Iridescent Holo, `CharacterMesh` + `DOOM_Companion`)
     - `LUIS_RIGGED_CLAY.glb` (Hoodie — Clay + Holo, `CharacterMesh` + `DOOM_Companion`)
     - `character_hoodie.glb` and `LUIS_RIGGED.glb` (Hoodie — Full Color + Holo, `CharacterMesh` + `DOOM_Companion`)
     - `PLATODOOM_HOLOSYS_RIGGED.glb` (Tunic — Iridescent Holo, `PLATODOOM`)
     - `character_tunic.glb` and `PLATODOOM_RIGGED.glb` (Tunic — Full Color + Holo, `PLATODOOM`)
   - Above-shoulder autonomous levitation kinematics (`DOOM_Companion`) and HOLO.SYS iridescent shader toggling (`KeyH` / `#toggle-holo-shader-btn`) must remain 100% functional across all character variants.

3. **57-Clip Quaternius UAL Animation Library (`quaternius_animations.glb`):**
   - `quaternius_animations.glb` must provide the 57 pure Quaternius UAL skeletal animation clips (43 source clips + 14 canonical state/emote aliases) and zero Skate 3 or GTA:SA spray-painting clips.
   - The HUD animation selector (`#animation-select`) must populate with all 57 Quaternius clips and display `57` in `#clip-count-label`.
   - Grounded locomotion states must smoothly crossfade between:
     - `Idle` → `Idle_Loop`
     - `Walk` → `Walk_Loop` (stride-synchronized to movement speed)
     - `Run` → `Jog_Fwd_Loop` / `Sprint_Loop` (stride-synchronized to movement speed)
     - `Jump` → `Jump_Start` → `Jump_Loop` → `Jump_Land`
   - All 10 quick-emote buttons (`#quick-emote-grid` and keys `Digit1`–`Digit9`, `Digit0`) must trigger their mapped Quaternius UAL clips on the active character:
     - `1:Wave` (`Wave`)
     - `2:Attack` (`Attack` → `Sword_Attack`)
     - `3:Roll` (`Roll`)
     - `4:Dance` (`Dance` → `Dance_Loop`)
     - `5:Sit` (`Sit` → `Sitting_Idle_Loop`)
     - `6:Punch` (`Punch` → `Punch_Cross`)
     - `7:Hit` (`Hit` → `Hit_Chest`)
     - `8:Victory` (`Victory` → `Spell_Simple_Shoot` / `Victory`)
     - `9:Death` (`Death` → `Death01`)
     - `0:Idle` (`Idle` → `Idle_Loop`)

---

### 3.3 Complete Removal of Skating & Spray-Painting Subsystems

1. **Asset & Manifest Decommissioning:**
   - Remove `skateboard` (`./assets/skateboard.glb`), `spraycan` (`./assets/spraycan.glb`), and `stateGraph` (`./skate3_state_graph.json`) from runtime asset loading.
   - Remove all prop template cloning and hand/foot bone socket attachment routines for skateboards and spray cans.

2. **State Machine & Control Removal:**
   - Remove all skateboarding physics constants, state-graph resolvers, trick triggers, manual/grind/airborne/bail state handlers, and `toggleSkateMode` APIs.
   - Remove all spray-painting state sets (`SPRAY_PAINT_STATES`), sequence controllers (`sprayPaintSequence`, `sprayPaintController`), aerosol mist / audio / decal triggers, and `triggerSprayPaintSequence` / `triggerSprayPaintClip` / `stopSprayPaintSequence` APIs.
   - Remove keyboard bindings for `KeyK` (skate mount/dismount), `KeyT` (spray paint), and `KeyU` / `KeyI` / `KeyO` / `KeyP` (skate tricks).
   - Restore `Space` in Grounded Free-Roam Mode exclusively to triggering a standard character jump (`Jump_Start` → `Jump_Loop` → `Jump_Land` with vertical velocity $v_y = 4.6\text{ m/s}$ and gravity $9.81\text{ m/s}^2$).

---

### 3.4 Cyber-Tactical 2D HUD Radial Menu (`KeyQ`) Adaptation

1. **Removal of the Spraypaint Slice:**
   - `DEFAULT_CYBER_MENU_ITEMS` in `radial_menu_hud.js` must exclude the `spraypaint` (`SPRAYPAINT`, `anim/spraypaint_emblem.jpeg`, `TAG // CAN-05`) item.
   - To ensure no dead skateboarding action remains on the wheel while preserving clean N-slice symmetry, `DEFAULT_CYBER_MENU_ITEMS` must also exclude any broken action callback on `sandbox.js` `onSelect` (selecting a radial slice updates `sandbox.lastRadialAction`, updates `#tel-radial` in the HUD telemetry grid, and dispatches the `cyber-radial-select` CustomEvent without invoking deleted skating or spray-painting functions).
   - All polar geometry calculations (`computeSectorAngles`, `slicePath`, `computeSectorCornerBrackets`, `computeInnerArcTicks`, `computePayloadLayout`, `resolvePolarHitSector`) automatically adapt to `menuItems.length` (`total`), maintaining uniform parallel separation channels and upright emblem payloads.

---

## 4. Operational & Performance Budgets

1. **Initial Asset Payload & Network Budget:**
   - Removing `cathedral_skatepark.glb` (3.30 MB), `skate3_state_graph.json` (0.32 MB), `assets/skateboard.glb` (0.11 MB), `assets/spraycan.glb` (0.01 MB), and replacing the bloated Skate 3 character/animation `.glb` files with the pure 65-bone Quaternius `.glb` files reduces initial network transfer on `http://localhost:8080/` by **> 26 MB**:
     - `quaternius_animations.glb`: $\le 7.5\text{ MB}$ (target: $7.12\text{ MB}$, 57 clips)
     - `LUIS_HOLOSYS_RIGGED.glb`: $\le 3.5\text{ MB}$ (target: $3.01\text{ MB}$)
     - `PLATODOOM_HOLOSYS_RIGGED.glb`: $\le 3.5\text{ MB}$ (target: $2.93\text{ MB}$)
     - `LUIS_RIGGED_CLAY.glb`: $\le 2.0\text{ MB}$ (target: $1.48\text{ MB}$)
   - All required initial HTTP requests must complete with `200 OK` (or `304 Not Modified`) in $< 3.0\text{ s}$ on local loopback.

2. **Frame-Time & Render Loop Budget:**
   - The main simulation and render loop (`stepSimulation`) must execute within a **$\le 16.6\text{ ms}$** frame budget ($60\text{ FPS}$ steady state) in Chromium.
   - Eliminating per-frame Cathedral triangle collision checks and Skate 3 state-graph polling reduces per-frame CPU overhead in `stepSimulation`.

3. **Fail-Fast Invariant Enforcement (`RULE[user_global]`):**
   - Zero silent fallbacks: if `freeman_alley.glb`, `quaternius_animations.glb`, or any required character `.glb` fails to load, lacks its 65-bone Quaternius skeleton, or has fewer than 43 base clips, `raiseFatalError()` must immediately halt initialization and render a visible diagnostic message in `#fatal-error-banner`.

---

## 5. Edge Cases & Failure Modes

1. **Isolated `.glb` Variant Switching (`#glb-variant-select`):**
   - Switching between all 5 variants (`luis_holo`, `luis_clay`, `luis_color`, `platodoom_holo`, `platodoom_color`) at runtime must dynamically load the corresponding 65-bone Quaternius `.glb`, bind all 57 animation clips to its `THREE.AnimationMixer`, preserve the character's current world position and yaw, and never throw missing-bone or missing-prop errors.
2. **Locomotion Mode Transitions (`Scroll-Walk` $\leftrightarrow$ `Grounded Free-Roam` $\leftrightarrow$ `3D Fly Free-Roam` $\leftrightarrow$ `Mount Focus`):**
   - Pressing `WASD` / `Arrow` keys during Scroll-Walk Mode must seamlessly hand off to Grounded Free-Roam Mode at the character's current corridor coordinates.
   - Pressing `KeyF` from either Scroll-Walk or Grounded Free-Roam Mode must engage 3D Fly / No-Clip Mode, and pressing `KeyF` again must return the character to the alley floor ($Y = \text{floorY}$) in Grounded Free-Roam Mode.
   - Pressing `KeyR` or clicking `Return to Scroll Mode (R)` must disengage Free-Roam / Fly Mode and smoothly synchronize the character back to the scroll-track corridor position.
3. **Corridor Boundary Containment:**
   - Walking or running to the far rear end of Freeman Alley ($Z \approx 70.8\text{m}$) in Grounded Free-Roam Mode must smoothly collide against `COLLIDER_BOUND_END` without falling through the floor or entering void space.

---

## 6. Acceptance Criteria & Verification Protocol

- **AC-01 (Asset & Skeleton Integrity):** Binary inspection of `quaternius_animations.glb` and all 5 character `.glb` variants in `/Users/diesel/desktop/SkateAlley` confirms 65 Quaternius UAL skin joints, 57 animation clips in `quaternius_animations.glb`, and 0 `Skateboard_*`, `SprayCan_*`, `skate_*`, or `graffiti_*` nodes/clips.
- **AC-02 (Cathedral & Rear Door Removal):** Live DOM and scene-graph inspection on `http://localhost:8080/` confirms `ENV_CATHEDRAL_SKATEPARK`, `REAR_ALLEY_DOOR_PIVOT`, `REAR_ALLEY_DOOR_PANEL`, and `REAR_ALLEY_DOOR_HITBOX` do not exist in `scene`, `COLLIDER_BOUND_END` is active, and the Cathedral HUD section is removed while `#toggle-fly-freeroam-btn` (`3D Fly / No-Clip Free-Roam (F)`) remains operational in `Locomotion Mode`.
- **AC-03 (Quaternius Locomotion & Emotes):** Live browser evaluation confirms `#clip-count-label` equals `57`, character locomotion transitions cleanly between `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop`, and `Jump_Start`/`Jump_Loop`/`Jump_Land`, and all 5 `.glb` variants switch cleanly in `#glb-variant-select` with `0` console errors.
- **AC-04 (Radial Menu & Controls Cleanup):** Opening the Radial Menu (`KeyQ`) displays the wheel without the `SPRAYPAINT` slice, and pressing `KeyK`, `KeyT`, `KeyU`, `KeyI`, `KeyO`, or `KeyP` triggers no skating or spray-painting state changes or errors.
