# Functional Specification: Migration from Quaternius to Ready Player Me (RPM) Animation System

## 1. Objective & Scope

This document outlines the functional requirements for deprecating and completely removing the legacy Quaternius animation system for our Three.js `.glb` character and replacing it with the **Ready Player Me (RPM) Animation Library**.

The goal is for the character to utilize external RPM animation assets—specifically focusing on natural idle postures and expressive dialogue/gesture animations—with seamless runtime loading, skeletal compatibility, and smooth state transitions during character dialogue.

---

## 2. Deprecation of Legacy System (Quaternius)

All dependencies, assumptions, and workarounds tied to the Quaternius animation format must be removed:

* **Asset Removal:** The application must no longer load, reference, or expect animation clips embedded inside the base character `.glb` file if those clips originate from the Quaternius library.
* **Action Dictionary Cleanup:** Any hardcoded references to Quaternius clip names (e.g., `Wave`, `Interact`, `Idle` from the Quaternius Universal Animation Library) must be replaced with the new semantic state keys mapped to RPM assets.
* **Bone Convention Shift:** The animation system must no longer expect Blender/Quaternius bone naming conventions (e.g., `.L` / `.R` suffixes, `Pelvis`, `UpperArm.R`). The target skeleton and animation tracks will strictly adhere to the **Ready Player Me / Mixamo standard humanoid bone hierarchy** (`Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`, `RightShoulder`, `RightArm`, `RightForeArm`, `RightHand`, etc.).

---

## 3. Asset Architecture & Loading Behavior

### 3.1 Decoupled Model and Animation Loading

Unlike the Quaternius setup (where animations are often bundled inside a single monolithic `.glb`), the Ready Player Me animation workflow treats the character mesh and its animations as modular, decoupled assets:

* **Base Character Asset:** A single `.glb` file containing the character's skinned mesh and standard RPM/Mixamo-compatible humanoid rig.
* **Animation Assets:** Standalone animation files (`.glb` or `.fbx` sourced from the Ready Player Me Animation Library) containing only skeletal animation tracks (`AnimationClip` data) without mesh geometry.

### 3.2 Asynchronous Preloading & Registration

* The system must asynchronously load the base character `.glb` and the required suite of RPM animation files before initializing character interaction.
* Once loaded, each external RPM animation clip must be extracted, assigned a clean semantic identifier (e.g., `IDLE_DEFAULT`, `TALK_EXPLAIN`, `TALK_EMPHASIS`, `TALK_SUBTLE`, `ACKNOWLEDGE`), and registered with the character's `THREE.AnimationMixer`.

---

## 4. Skeletal Compatibility & Track Sanitization

### 4.1 Bone Name Normalization

To guarantee that RPM `AnimationClip` tracks bind accurately to the `.glb` character's `SkinnedMesh` skeleton at runtime, the system must account for common naming discrepancies between Mixamo/RPM rigs and GLTF exporters:

* **Prefix Stripping:** If either the character rig or the animation track contains namespaces or prefixes (such as `mixamorig:`, `mixamorig`, or `Armature|`), the system must normalize the bone track names so the target node names in the `AnimationClip` exactly match the bone names in the character's scene graph.
* **Root Motion / Hip Translation Handling:** RPM animations are authored at a specific metric scale and rest height. To prevent the character from floating, sinking into the floor, or snapping out of place when an RPM animation plays on a custom-proportioned character, root/hip position tracks (`Hips.position`) must either be locked to in-place movement, scaled proportionally to the character's hip height, or stripped of vertical/horizontal drift while preserving rotation (`Hips.quaternion`).

---

## 5. Desired Dialogue & Animation State Functionality

### 5.1 Core Animation Categories

The system must support at least two primary behavioral states using RPM assets:

1. **Idle State (`Idle`):** Continuous, subtle breathing, weight-shifting, and blinking/head-micro-movements when the character is not speaking (sourced from RPM `Idle` animations, e.g., `M_Standing_Idle_001` or `F_Standing_Idle_001`).
2. **Dialogue State (`Talking`):** Expressive upper-body, head, arm, and hand gestures that play while the character is actively delivering dialogue (sourced from RPM `Expression` / `Talking` animations, e.g., `M_Standing_Expressions_001`, `M_Standing_Expressions_002`, etc.).

### 5.2 Dynamic Dialogue Cycling (Anti-Repetition)

When the character enters a dialogue state, playing a single looping animation looks robotic. The desired functionality is:

* **Randomized/Weighted Cycling:** When dialogue begins, the system transitions from the `Idle` state into a randomly or contextually selected clip from a pool of RPM dialogue animations.
* **Continuous Chaining:** If a line of dialogue is longer than a single RPM expression clip, the system must automatically crossfade into a *different* dialogue animation clip from the pool before the current clip finishes, continuing until the dialogue ends.
* **Return to Idle:** Immediately upon dialogue completion, the character must smoothly transition back to the base `Idle` state, returning the hands and head to a natural resting posture.

---

## 6. Transition & Blending Requirements

| Transition Type | Desired Behavior | Target Blend Duration |
| --- | --- | --- |
| **Idle to Dialogue** | Smoothly raise hands/arms and initiate head movement without jarring pops. | `0.3s – 0.5s` |
| **Dialogue A to Dialogue B** | Seamlessly flow from one conversational gesture to the next mid-sentence. | `0.4s – 0.6s` |
| **Dialogue to Idle** | Gracefully lower hands and settle posture back to resting state when speech ends. | `0.4s – 0.6s` |

* **No T-Pose / Bind-Pose Flashing:** At no point during clip switching or crossfading should the character briefly snap to its bind pose (T-pose/A-pose). Weight normalization across active `AnimationAction` instances must always sum to `1.0`.
* **TimeScale & Loop Modes:** Idle animations must loop infinitely (`LoopRepeat`). Dialogue expression animations may either loop or play once (`LoopOnce` with `clampWhenFinished`) before triggering the crossfade to the next queued dialogue clip.

---

## 7. Acceptance Criteria

1. **Zero Quaternius Dependencies:** No Quaternius animation files or legacy bone-mapping logic remain in the codebase.
2. **Clean Binding:** RPM animations play on the `.glb` character with natural joint rotations, proper finger curls, and accurate head/neck articulation—no twisted limbs, inverted joints, or floating feet.
3. **State-Driven Control:** External application logic (such as an audio player, TTS engine, or dialogue manager) can trigger `startDialogue()` and `stopDialogue()` events (or equivalent state changes), causing the character to dynamically gesture while speaking and return to idle when silent.
4. **Smooth Crossfades:** All transitions between idle and talking states occur via interpolated crossfades with zero frame-popping.