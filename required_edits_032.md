# Required Edits 032: Freeman Alley Corridor Restoration, Cathedral & Rear Door Decommissioning, Pure 65-Bone Quaternius UAL Animation Restoration, and Skate / Spray-Paint Subsystem Removal

## 1. Glossary & Evaluation Taxonomy Alignment (`LANGUAGE.md`)

All edit specifications, architectural root-cause remediations, and verification targets in this document strictly adhere to `LANGUAGE.md`:

- **`{functionality}`**: End-to-end execution of the Freeman Alley interactive 3D corridor experience (`/Users/diesel/desktop/SkateAlley`) under live browser runtime conditions, featuring Scroll-Walk locomotion, Grounded WASD Free-Roam locomotion, 3D Fly / No-Clip Free-Roam locomotion (`KeyF`), pure 65-bone Quaternius UAL character skeletal animations and emotes (57 clips), 6 interactive wall-mounted holographic project stations, 7 interactive 3D MathPods with walk-through glitch FX and world-space callout popups, 17 2D holographic media columns, 6 holographic die-cut stickers, the 17-glyph 3D holographic typography sign, 20 multi-tiered overhead cables, watercolor skybox/shader optics, diegetic spatial audio, and the Cyber-Tactical 2D HUD Radial Menu (`KeyQ`)—with zero Cathedral Skatepark, rear door portal, skateboarding, or spray-painting subsystems.
- **`{correctness}`**: Deterministic contract fidelity across all scene assets, skeletal hierarchies (65 Quaternius UAL joints), animation mixers (57 Quaternius UAL clips), collision boundaries (`COLLIDER_FLOOR`, `COLLIDER_WALL_L`, `COLLIDER_WALL_R`, `COLLIDER_BOUND_START`, `COLLIDER_BOUND_END`), and UI controls without logical flaws, orphaned references, missing-bone warnings, or silent fallbacks.
- **`{correct required outputs}`**:
  1. Zero network requests for `cathedral_skatepark.glb`, `skate3_state_graph.json`, `assets/skateboard.glb`, `assets/spraycan.glb`, or `anim/spraypaint_emblem.jpeg`.
  2. `quaternius_animations.glb` (7,118,940 bytes) contains 65 Quaternius UAL joints and 57 animation clips (`0` `skate_*` or `graffiti_*` / `spraycan_*` clips).
  3. All character `.glb` deliverables (`LUIS_HOLOSYS_RIGGED.glb`, `LUIS_RIGGED_CLAY.glb`, `LUIS_RIGGED.glb`, `character_hoodie.glb`, `PLATODOOM_HOLOSYS_RIGGED.glb`, `PLATODOOM_RIGGED.glb`, `character_tunic.glb`) contain 65 Quaternius UAL joints, their character mesh (`CharacterMesh` + `DOOM_Companion` on LUIS variants; `PLATODOOM` on Tunic variants), and `0` `Skateboard_Root` / `Skateboard_Mesh` or `SprayCan_Root` / `SprayCan_Mesh` nodes.
  4. `#hud-status-badge` displays `READY (60 FPS)` and `#clip-count-label` displays `57`.
  5. `Locomotion Mode` HUD section includes `#return-scroll-btn`, `#reset-entrance-btn`, `#toggle-radial-menu-btn`, and `#toggle-fly-freeroam-btn` (`3D Fly / No-Clip Free-Roam: OFF (F)`).
  6. The `Cathedral Skatepark & 3D Free-Roam` HUD section, `Cathedral:` and `Skate:` telemetry rows, and the `SPRAYPAINT` (`TAG // CAN-05`) radial menu slice are absent.
- **`{errors}`**: Any runtime exception, unhandled promise rejection, missing asset 404, `#fatal-error-banner` activation, residual skateboard or spray-can mesh on any character, residual Cathedral geometry in the scene, missing rear alley door geometry due to triangle slicing, or broken character locomotion/emote playback.
- **`{sufficient}`**: Every affected file, binary deliverable, function signature, DOM element, and state transition is specified below with zero ambiguity.

---

## 2. Step-by-Step Required Edits

### 2.1 Binary Asset Restoration & Decommissioning (`/Users/diesel/desktop/SkateAlley` & `/Users/diesel/desktop/greek`)

1. **Restore Pure 65-Bone Quaternius UAL `.glb` Deliverables from Authoritative Git Blobs (Commit `0b37b9a`):**
   - Extract `0b37b9a:quaternius_animations.glb` (`ad7a33968d82e370543934cdce8cc4bf1336d8d7`, 7,118,940 bytes, 65 joints, 57 clips) to:
     - `/Users/diesel/desktop/SkateAlley/quaternius_animations.glb`
     - `/Users/diesel/desktop/greek/quaternius_animations.glb`
   - Extract `0b37b9a:LUIS_HOLOSYS_RIGGED.glb` (`9e03dc3982843e3f1a32eec02dfcb8d776ef648d`, 3,009,932 bytes, 65 joints, `CharacterMesh` + `DOOM_Companion`) to:
     - `/Users/diesel/desktop/SkateAlley/LUIS_HOLOSYS_RIGGED.glb`
     - `/Users/diesel/desktop/greek/LUIS_HOLOSYS_RIGGED.glb`
     - `/Users/diesel/desktop/greek/LUIS_RIGGED_HOLO.glb`
     - `/Users/diesel/desktop/greek/LUIS_HOLOSYS_ASSEMBLED.glb`
   - Extract `0b37b9a:LUIS_RIGGED_CLAY.glb` (`a694364df97e1965cc4e72185120d55de479cd68`, 1,484,540 bytes, 65 joints, `CharacterMesh` + `DOOM_Companion`) to:
     - `/Users/diesel/desktop/SkateAlley/LUIS_RIGGED_CLAY.glb`
     - `/Users/diesel/desktop/greek/LUIS_RIGGED_CLAY.glb`
     - `/Users/diesel/desktop/greek/LUIS_ASSEMBLED_CLAY.glb`
   - Extract `0b37b9a:LUIS_RIGGED.glb` (`3fe85500f5088b105633e23d339b981c2a0ce11b`, 10,863,708 bytes, 65 joints, `CharacterMesh` + `DOOM_Companion`) to:
     - `/Users/diesel/desktop/SkateAlley/LUIS_RIGGED.glb`
     - `/Users/diesel/desktop/SkateAlley/character_hoodie.glb`
     - `/Users/diesel/desktop/greek/LUIS_RIGGED.glb`
     - `/Users/diesel/desktop/greek/LUIS_COLOR_RIGGED.glb`
     - `/Users/diesel/desktop/greek/LUIS_ASSEMBLED.glb`
     - `/Users/diesel/desktop/greek/character_hoodie.glb`
   - Extract `0b37b9a:PLATODOOM_HOLOSYS_RIGGED.glb` (`65dbdd387915728bfb34e3c5cf6f81e44d12047b`, 2,928,636 bytes, 65 joints, `PLATODOOM`) to:
     - `/Users/diesel/desktop/SkateAlley/PLATODOOM_HOLOSYS_RIGGED.glb`
     - `/Users/diesel/desktop/greek/PLATODOOM_HOLOSYS_RIGGED.glb`
     - `/Users/diesel/desktop/greek/PLATODOOM_RIGGED_HOLO.glb`
   - Extract `0b37b9a:character_tunic.glb` (`1b567dc6fada3729676076adedf43ffd07665f5e`, 1,280,000 bytes, 65 joints, `PLATODOOM`) to:
     - `/Users/diesel/desktop/SkateAlley/character_tunic.glb`
     - `/Users/diesel/desktop/SkateAlley/PLATODOOM_RIGGED.glb`
     - `/Users/diesel/desktop/greek/character_tunic.glb`
     - `/Users/diesel/desktop/greek/PLATODOOM_RIGGED.glb`

2. **Remove Decommissioned Cathedral, Skateboard, and Spray-Can Assets & Scripts:**
   - Remove from `/Users/diesel/desktop/SkateAlley`:
     - `cathedral_skatepark.glb`
     - `skate3_state_graph.json`
     - `assets/skateboard.glb`
     - `assets/spraycan.glb`
     - `20261019T213303-735-zjzk/`
     - `scripts/build_spray_paint_animations.py`
     - `scripts/skate3_archive_pipeline.py`
   - Restore `/Users/diesel/desktop/SkateAlley/scripts/build_quaternius_animations.py` and `/Users/diesel/desktop/SkateAlley/scripts/rig_characters.py` from `0b37b9a:build_quaternius_animations.py` and `0b37b9a:rig_characters.py`.

---

### 2.2 Edits to `index.html` (`/Users/diesel/desktop/SkateAlley/index.html`)

1. **Preserve `3D Fly / No-Clip Free-Roam: OFF (F)` Inside `Locomotion Mode` HUD Section:**
   - In the `Locomotion Mode` `.hud-section` (lines 1129–1152), add a second `.hud-row` directly below the row containing `#return-scroll-btn`, `#reset-entrance-btn`, and `#toggle-radial-menu-btn`:
     ```html
     <div class="hud-row" style="margin-top: 6px;">
       <button id="toggle-fly-freeroam-btn" class="hud-btn secondary" style="flex: 1;" type="button" title="Toggle Unrestricted 3D Scene Fly / No-Clip Free-Roam (Key F)">
         3D Fly / No-Clip Free-Roam: OFF (F)
       </button>
     </div>
     ```

2. **Delete the `Cathedral Skatepark & 3D Free-Roam` HUD Section:**
   - Completely remove the `.hud-section` containing `Cathedral Skatepark & 3D Free-Roam`, `#cathedral-status-label`, `#walk-through-door-btn`, `#teleport-rear-door-btn`, `#teleport-cathedral-spawn-btn`, `#teleport-cathedral-nave-btn`, `#reset-cathedral-pos-btn`, and the `#cathedral-pos-x-slider`, `#cathedral-pos-y-slider`, `#cathedral-pos-z-slider`, and `#cathedral-yaw-slider` controls (lines 1154–1201).

3. **Remove `Cathedral:` and `Skate:` Rows from `Live Telemetry` Grid:**
   - In `.telemetry-grid` (lines 1461–1462), remove:
     - `<div>Cathedral: <span id="tel-cathedral" class="val">STAGED (1.25, -2.00, 114.88)</span></div>`
     - `<div>Skate: <span id="tel-skate" class="val">Off-Board</span></div>`

4. **Update `.controls-hint` Footer (Spec 032 §2):**
   - Replace `.controls-hint` (lines 1467–1481) with:
     ```html
     <div class="controls-hint">
       <kbd>F</kbd> 3D Fly/No-Clip &bull;
       <kbd>E</kbd> Inspect Wall Mount &bull;
       <kbd>Q</kbd> Radial Menu &bull;
       <kbd>WASD</kbd>/<kbd>Arrows</kbd> Move &bull;
       <kbd>Shift</kbd> Run &bull;
       <kbd>Space</kbd> Jump &bull;
       <kbd>1-9</kbd>/<kbd>0</kbd> Emotes &bull;
       <kbd>Scroll</kbd> Walk &bull;
       <kbd>H</kbd> Holo &bull;
       <kbd>M</kbd> Mute
     </div>
     ```

---

### 2.3 Edits to `radial_menu_hud.js` (`/Users/diesel/desktop/SkateAlley/radial_menu_hud.js`)

1. **Remove the `spraypaint` Slice from `DEFAULT_CYBER_MENU_ITEMS` (Spec 032 §3.4):**
   - In `DEFAULT_CYBER_MENU_ITEMS` (lines 41–97), remove the 5th item (`id: 5, key: 'spraypaint', label: 'SPRAYPAINT', emblemSrc: 'anim/spraypaint_emblem.jpeg', telemetryCode: 'TAG // CAN-05'`), leaving the 4 clean items (`mail`, `github`, `x`, `skateboard`).
   - Update the default parameter `total = 4` in `computeSliceVisualState`.

---

### 2.4 Edits to `sandbox.js` (`/Users/diesel/desktop/SkateAlley/sandbox.js` & `/Users/diesel/desktop/greek/sandbox.js`)

1. **Clean Up `ASSET_PATHS` & Remove Prop Templates / Cathedral / Rear Door / Skate Constants:**
   - In `ASSET_PATHS`, remove `cathedral`, `skateboard`, `spraycan`, and `stateGraph`.
   - Remove `loadedPropTemplates`, `CATHEDRAL_DEFAULT_TRANSFORM`, and `REAR_DOOR_PORTAL_SPEC`.
   - Update `JUMP_VELOCITY = 4.60` and `GRAVITY = -9.81` to match Spec 032 §3.3.2 (`v_y = 4.6 m/s` and gravity `9.81 m/s^2`).
   - Remove all `SKATE_*` constants (`SKATE_TOP_SPEED`, `SKATE_PUSH_BURST_ACCEL`, `SKATE_ROLLING_FRICTION`, `SKATE_BRAKE_DECEL`, `SKATE_POWERSLIDE_DECEL`, `SKATE_POWERSLIDE_MIN_SPEED`, `SKATE_CARVE_MAX_RATE`, `SKATE_CARVE_MIN_RATE`, `SKATE_DECK_HEIGHT`, `SKATE_DECK_MIDPOINT_Y`, `DECK_MIDPOINT_Y`, `SKATE_GRAVITY`, `SKATE_BAIL_SPEED_THRESHOLD`), `loadedSkate3StateGraph`, `setSkate3StateGraph`, `getSkate3StateGraph`, `resolveSkateManeuver`, and `findSkateManeuverForKeyInput`.

2. **Restore Pure Quaternius `LOOPING_CLIP_NAMES`, `ONCE_STATES`, and `isLoopingClip`:**
   - Replace `LOOPING_CLIP_NAMES` with the pure Quaternius looping clip names (`Idle`, `Walk`, `Run`, `Sprint`, `Fall`, `Dance`, `Sit`, `A_TPose`, `Sword_Idle`, `Pistol_Aim_Down`, `Pistol_Aim_Neutral`, `Pistol_Aim_Up`), removing all `skate_*`, `graffiti_*`, `weapon_*`, and Skate 3 `.abin` clip names.
   - Remove `CLIP_ALIASES`, `SPRAY_PAINT_STATES`, and `sprayPaintSequence`.
   - Update `ONCE_STATES` to exclude `ollie`, `kickflip`, `spraycan_full`, and `graffiti_Chkout`.
   - Simplify `isLoopingClip(clipName)` to:
     ```javascript
     function isLoopingClip(clipName) {
       if (ONCE_STATES.has(clipName)) return false;
       return clipName.endsWith('_Loop') || LOOPING_CLIP_NAMES.has(clipName);
     }
     ```

3. **Decommission Cathedral & Rear Door Geometry Slicing / Collision Extraction:**
   - Remove `cathedralSkateparkRootGroup` from scene initialization.
   - Delete `rearDoorState`, `prepareRearAlleyDoorAndTrimDeadSpace`, `extractCathedralCollisionGeometry`, and `stageCathedralSkateparkEnvironment`.
   - In `extractWallSegmentsFromColliders(colliderMeshes)`:
     - Include all 4 wall/bound colliders in `wallNames`: `['COLLIDER_WALL_L', 'COLLIDER_WALL_R', 'COLLIDER_BOUND_START', 'COLLIDER_BOUND_END']`.
     - Remove the `REAR_DOOR_PORTAL_SPEC.centerZ` clamping and the `COLLIDER_BOUND_END` / `COLLIDER_REAR_DOOR_GATE` doorway split so `COLLIDER_BOUND_END` retains 100% of its authored end-wall collision segments.
   - In `resolveCircleAgainstWalls(posXZ, velXZ, radius, wallSegments)`:
     - Keep the `if (typeof sandbox !== 'undefined' && sandbox.freeRoamFlyMode) return 0.0;` guard for 3D Fly / No-Clip mode, and remove the `COLLIDER_REAR_DOOR_GATE` check.

4. **Restore Pure 65-Bone Quaternius `CharacterController`:**
   - In `CharacterController` constructor:
     - Validate `this.skinnedMesh.skeleton.bones.length !== 65`:
       ```javascript
       if (this.skinnedMesh.skeleton.bones.length !== 65) {
         raiseFatalError(
           `Character '${id}' expected 65 Quaternius UAL bones, found ${this.skinnedMesh.skeleton.bones.length}.`
         );
       }
       ```
     - Validate that no `Skateboard_Root`, `Skateboard_Mesh`, `SprayCan_Root`, or `SprayCan_Mesh` nodes exist on the character scene graph (fail fast via `raiseFatalError` if any exist).
     - Validate `if (this.id === 'hoodie' && !this.companionMesh)` fails fast if `DOOM_Companion` is missing.
     - Remove `requiredMasterRigJoints`, `this.ensureSkateboardProp()`, `this.ensureSprayCanProp()`, and all `this.isSkating` / `this.skate*` properties.
     - In `this.mixer.addEventListener('finished', ...)`:
       - When `this.customEmoteActive && event.action === this.currentAction`: set `this.customEmoteActive = false; this.state = 'Idle'; this.crossfadeTo('Idle_Loop', CROSSFADE_DURATION);`.
       - When `this.state === 'Jump' && event.action === this.actions.get('Jump_Start')`: if `!this.isGrounded && this.actions.has('Jump_Loop')`, crossfade to `'Jump_Loop'`.
       - When `event.action === this.actions.get('Jump_Land')` and `this.isGrounded && !this.customEmoteActive`: transition cleanly to `'Idle_Loop'` (or current movement state).
     - Initialize pose with `this.crossfadeTo('Idle_Loop', 0.0)`.
   - Remove `getOffboardClip`, `ensureSkateboardProp`, `setSkateboardVisible`, `ensureSprayCanProp`, `setSprayCanVisible`, `updateCarvePostureBlend`, `isSkateHoldKeyActive`, `returnToBaseRide`, `startSkateManeuver`, `releaseSkateHoldManeuver`, `triggerSkateTrick`, and `triggerSkateBail` from `CharacterController`.
   - In `resolveClipName(requestedName)`:
     - Map canonical aliases (`Idle: 'Idle_Loop'`, `Walk: 'Walk_Loop'`, `Run: 'Jog_Fwd_Loop'`, `Sprint: 'Sprint_Loop'`, `Jump: 'Jump_Start'`, `Jump_Idle: 'Jump_Loop'`, `Fall: 'Jump_Loop'`, `Wave: 'Interact'`, `Attack: 'Sword_Attack'`, `Dance: 'Dance_Loop'`, `Sit: 'Sitting_Idle_Loop'`, `Punch: 'Punch_Cross'`, `Hit: 'Hit_Chest'`, `Victory: 'Spell_Simple_Shoot'`, `Death: 'Death01'`), and remove `Spray`, `Graffiti`, `SprayCan`, `Chkout`.
   - In `crossfadeTo(clipName, duration, forceRestart)`:
     - Remove spray-can and skateboard visibility toggles and `R_PUMP_LFT_HCOM_0_N` / `R_PUMP_RIT_HCOM_0_N` weight clearing.
     - Check `isLocomotionClip` against `'Walk_Loop'`, `'Jog_Fwd_Loop'`, and `'Sprint_Loop'`.
   - In `freezeToIdle()`:
     - Remove `this.setSprayCanVisible(false)` and call `this.crossfadeTo('Idle_Loop', CROSSFADE_DURATION)`.

5. **Clean Up Proximity / Hover Wall Mounts & `sandbox` Runtime Object:**
   - In `updateProximityAndHoverWallMounts()`:
     - Remove step 3 (`REAR_DOOR_PORTAL_SPEC` proximity and `rearDoorState.doorHitboxMesh` raycast check).
     - Ensure `#mount-proximity-prompt` only activates for `promptMount` (`sandbox.hoveredMount || sandbox.proximityMount`).
   - In `enterFreeRoamMode()`:
     - Replace `activeChar.getOffboardClip('Idle_Loop')` with `'Idle_Loop'`.
   - In `sandbox`:
     - Remove `cathedralGroup`, `cathedral`, `rearDoor`, `proximityRearDoor`, `hoveredRearDoor`, `setRearDoorOpen`, `triggerDoorWalkThrough`, `teleportToRearDoor`, `teleportToCathedralSpawn`, `teleportToCathedralNave`, `setCathedralTransform`, `resetCathedralTransform`, `syncCathedralPlacementDOM`.
     - Remove `toggleSkateMode`, `triggerSkateTrick`, `triggerSkateBail`, `getSkateState`, `getSkateTelemetry`, `triggerSprayPaintSequence`, `triggerSprayPaintClip`, `stopSprayPaintSequence`, `getSprayPaintState`.
     - Retain `freeRoamFlyMode` and `toggleFreeRoamFlyMode(forceState)` (removing the `activeChar.isSkating` check and using `'Idle_Loop'`).
     - In `interactNearestWallMount()`: remove the `this.hoveredRearDoor || this.proximityRearDoor` branch so `KeyE` exclusively focuses/exits wall mounts.

6. **Clean Up Locomotion, Camera, Telemetry, and `stepSimulation`:**
   - In `updateScrollWalkLocomotion(dt)`: replace `activeChar.getOffboardClip(...)` with `'Jog_Fwd_Loop'`, `'Walk_Loop'`, `'Idle_Loop'`.
   - Delete `toggleSkateMode`, `updateSkatingCharacterLocomotion`, `triggerSprayPaintSequence`, `triggerSprayPaintClip`, `stopSprayPaintSequence`, `updateSprayPaintSequence`, `sprayPaintController`, and `updateRearDoorAndWalkThroughSequence`.
   - In `updateFreeRoamCharacterLocomotion(dt)`:
     - Remove `rearDoorState.walkThroughActive`, rear door auto-open check, `activeChar.isSkating` delegation, and `sprayPaintSequence.active` checks.
     - Retain `sandbox.freeRoamFlyMode` 3D flight physics (`W`/`S` along camera look vector, `A`/`D` strafe, `Space`/`E` ascend, `C`/`Ctrl` descend).
     - On jump launch (`(jumpRequested || keysPressed.Space) && activeChar.isGrounded`): set `activeChar.velocity.y = JUMP_VELOCITY` (`4.60`), `activeChar.isGrounded = false`, `activeChar.state = 'Jump'`, `activeChar.crossfadeTo('Jump_Start', JUMP_CROSSFADE, true)`.
     - On landing (`!activeChar.isGrounded` reaching `activeChar.position.y <= localFloorY`): set `activeChar.position.y = localFloorY`, `activeChar.velocity.y = 0.0`, `activeChar.isGrounded = true`, and if `!hasMovementInput && !activeChar.customEmoteActive && activeChar.actions.has('Jump_Land')`, trigger `activeChar.crossfadeTo('Jump_Land', JUMP_CROSSFADE, true)`.
     - Use `'Jog_Fwd_Loop'`, `'Walk_Loop'`, and `'Idle_Loop'` directly for grounded locomotion states.
   - In `computeThirdPersonCameraPose()`:
     - Set `const bypassWallClamp = Boolean(sandbox.freeRoamFlyMode);` (removing `rearDoorState` checks).
     - Remove `if (mesh.name === 'COLLIDER_BOUND_END' && ...) continue;` so the camera respects `COLLIDER_BOUND_END` in grounded mode.
   - In `updateTelemetryHUD()`:
     - When `sandbox.freeRoamFlyMode` is active, display `'3D Fly / No-Clip Free-Roam'` in `#hud-mode-text` and `'3D Fly (WASD + Space/E + C/Ctrl)'` in `#hud-mode-sub`, and `'3D-Fly'` in `#tel-mode`.
     - Remove `#tel-skate` and `#tel-cathedral` / `#cathedral-status-label` updates.
   - In `stepSimulation(dt)`:
     - Remove `updateRearDoorAndWalkThroughSequence(clampedDt)`, `updateSprayPaintSequence(clampedDt)`, and the Cathedral fog density override (`scene.fog.density` remains at `DEPTH_FOG_DENSITY`).

7. **Clean Up Input Listeners & `initSandbox()`:**
   - In `bindInputListeners()`:
     - Add `ControlLeft: false, ControlRight: false` to `keysPressed` (and support `Ctrl` alongside `KeyC` for descending in 3D Fly mode).
     - Remove `isSkatingActive`, `KeyK`, `KeyT`, and `findSkateManeuverForKeyInput` / `releaseSkateHoldManeuver` handlers.
     - Allow `KeyQ` (and `Backquote`) to toggle `sandbox.radialMenu` unconditionally.
     - When pressing `WASD` / `Arrow` keys during `sandbox.mode === 'scroll'`, seamlessly transition into Grounded Free-Roam Mode at the character's current corridor coordinates (Spec 032 §5.2).
     - In `#mount-proximity-prompt` click listener and canvas `pointerup` listener, remove `__REAR_ALLEY_DOOR__` and `rearDoorState.doorHitboxMesh` checks.
     - Remove event listeners for deleted Cathedral buttons/sliders (`#walk-through-door-btn`, `#teleport-rear-door-btn`, `#teleport-cathedral-spawn-btn`, `#teleport-cathedral-nave-btn`, `#reset-cathedral-pos-btn`, `#cathedral-pos-*-slider`, `#cathedral-yaw-slider`) while retaining `#toggle-fly-freeroam-btn`.
   - In `initSandbox()`:
     - Load only `alleyGLTF`, `hoodieGLTF`, `tunicGLTF`, `animsGLTF`, `alarmLightGLTF`, `hologramGLTF`, and `luisSignGLTF` (zero requests for `cathedral_skatepark.glb`, `skateboard.glb`, `spraycan.glb`, or `skate3_state_graph.json`).
     - Validate `sharedClips.length === 57` (and `>= 43`), with zero `skate_*` or `graffiti_*` / `spraycan_*` clips.
     - Do not call `prepareRearAlleyDoorAndTrimDeadSpace` or `stageCathedralSkateparkEnvironment`; `wallSegments` and `floorTriangles` come purely from `freeman_alley.glb`'s intact `COLLIDERS`.
     - Remove `window.skatingController` and update `window.__animLab` to query the 65 Quaternius UAL bones.
     - In `radialController` `onSelect`: update `sandbox.lastRadialAction`, update `#tel-radial`, and dispatch `cyber-radial-select` without calling `sandbox.toggleSkateMode()` or `triggerSprayPaintSequence()`.
   - In `export { ... }`:
     - Remove deleted skate and spray-paint symbols from the module export list.
