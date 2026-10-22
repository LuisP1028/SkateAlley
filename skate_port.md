# Functional Specification: Custom Unrigged Character Integration for Skate 3 Rust/Bevy Clean-Room Engine

## 1. System Overview & Objective

The objective of this system is to ingest an unrigged, static 3D character mesh in T-Pose (`.glb` format), automatically bind and rig it to the exact skeletal specification required by the **Skate 3 Rust/Bevy WebGL/WebGPU Clean-Room Port**, and instantiate the resulting rigged character as the primary playable skater inside a verified, functional clean-room skatepark map.

The end-to-end system bridges an offline asset preparation pipeline with the runtime Bevy Entity Component System (ECS), ensuring full compatibility with the engine's existing `.bin` animation banks, procedural inverse kinematics (IK), board physics, and stategraph-driven locomotion.

---

## 2. Input Artifacts & Environment Context

The system operates against the following existing inputs within the workspace:

* **Source Character Asset:** A static, unrigged 3D mesh in `.glb` format modeled in a standard T-Pose (containing geometry, UVs, and materials, but zero armature nodes or vertex skinning weights).
* **Clean-Room Engine Repository:** A Rust/Bevy application targeting WebGL2/WebGPU (WASM) and native builds.
* **Clean-Room Binary & Stategraph Data:**
* **Stategraph Definitions:** State machine configurations governing character animation states (pushing, coasting, crouched setup, flick-it trick execution, catches, grinds, and ragdoll/bails).
* **Binary Asset Files (`.bin`):** Extracted/clean-room animation clips, skeletal rest-pose definitions, joint hash tables, and map collision/visual geometry.
* **Verified Map Assets:** Pre-ported, playable Skate 3 park environments with working physics colliders and spawn coordinates.



---

## 3. Core Functional Pillars

### Pillar A: Reference Skeleton Extraction & Specification Alignment

Before the static mesh can be rigged, the system must establish the exact skeletal contract expected by the clean-room runtime.

* **Canonical Skeleton Definition:** The system requires an authoritative representation of the Skate 3 skater armature as interpreted by the Bevy port. This includes the exact bone count, parent-child hierarchy, bone naming strings (or hashed bone IDs), joint local rest transforms (translation, rotation, scale), and bone roll/axis orientations.
* **Auxiliary & Non-Deforming Nodes:** In addition to standard anatomical humanoid joints (pelvis, spine chain, neck, head, clavicles, limbs, fingers), the skeletal contract must account for specialized gameplay nodes required by the stategraph and physics engine:
* **Root Motion / Trajectory Node:** The top-level transform tracked by the stategraph to drive velocity synchronization and transitions.
* **Skateboard Attachment / Socket Nodes:** Joint(s) or reference transforms that link the skater hierarchy to the skateboard entity during mounted states, flips, and grabs.
* **IK Effector Targets:** Specific ankle, toe, hand, and pelvis target nodes referenced by the engine's runtime Inverse Kinematics solver to keep the feet planted on the deck and hands aligned during grabs.



---

### Pillar B: Automated Static-to-Skinned Mesh Rigging Pipeline

The system must transform the unrigged static T-Pose `.glb` into a fully skinned, engine-compliant `.glb` asset without distorting the original visual mesh or materials.

* **Spatial & Proportional Normalization:**
* The static T-Pose mesh must be aligned to the coordinate system of the target Bevy engine (Y-up, right-handed coordinate space).
* The character's bounding box, height, and origin point (feet planted at world zero `[0, 0, 0]`) must match the exact metric scale of the canonical clean-room skater so that board height, foot IK reach, and physics capsule boundaries remain accurate.


* **Armature Fitting & Pose Matching:**
* The canonical Skate 3 skeleton must be positioned inside the static T-Pose mesh volume so that anatomical landmarks (hips, knees, ankles, shoulders, elbows, wrists, neck) align with the mesh geometry.
* Because the `.bin` animation tracks apply delta rotations and translations relative to the canonical rest pose, the final exported bind pose (Inverse Bind Matrices) must prevent joint twisting, inverted limbs, or "spaghetti" mesh collapse when binary animations are evaluated at runtime.


* **Vertex Skinning & Weight Distribution:**
* Every vertex in the static mesh must be assigned bone influence weights mapped to the canonical armature joints.
* The skinning specification must respect Bevy/WebGPU shader constraints (specifically, a maximum of 4 bone influences per vertex, normalized so weights sum to `1.0`).
* Rigid accessories or distinct mesh primitives within the `.glb` must deform cohesively with their underlying anatomical regions without tearing at seams.


* **Material & Attribute Preservation:**
* All original vertex attributes (`POSITION`, `NORMAL`, `TEXCOORD_0`, `TANGENT`) and PBR material textures from the source `.glb` must be preserved alongside the newly generated `JOINTS_0` and `WEIGHTS_0` buffers.



---

### Pillar C: Stategraph, Animation `.bin`, & IK Runtime Binding

Once the rigged `.glb` is loaded into the Bevy runtime, it must seamlessly integrate with the engine's animation and physics subsystems.

* **SkinnedMesh Joint Mapping:** The Bevy runtime must bind the loaded `.glb` `SkinnedMesh` entity hierarchy to the joint indices expected by the `.bin` animation evaluator. When the stategraph transitions between states, the binary keyframe data must drive the `Transform` components of the `.glb`'s bone entities accurately.
* **Stategraph Locomotion & Trick Playback:**
* **On-Board States:** The character must accurately deform through idle riding, mongo/regular/goofy pushing, crouch pre-load, ollie/nollie pop, flick-it catch mechanics, and landing compression.
* **Off-Board States:** If the clean-room port supports dismounting/walking, the character must transition cleanly into bipedal locomotion animations.
* **Ragdoll / Bail States:** When a bail is triggered, the character's skeletal joints must smoothly hand over control from the stategraph animation evaluator to the articulated physics ragdoll bodies (and recover back to the stategraph upon respawn).


* **Procedural Foot & Hand IK:** The character's lower limbs must respond to the engine's runtime IK solver so the skater's shoes stay dynamically locked to the skateboard deck surface as the board pitches, rolls, and compresses on its trucks.

---

### Pillar D: Player Replacement & Verified Map Instantiation

The final functional requirement is replacing the default placeholder/clean-room skater with the custom rigged character inside a verified playable level.

* **Default Character Override:** The engine's player spawning routine must load and instantiate the custom rigged `.glb` asset as the active player visual representation while retaining all gameplay ECS components (physics collider, trick input handler, camera follow target, velocity controller, and audio emitters).
* **Skateboard Entity Coupling:** The skateboard deck, trucks, and wheels must remain properly spawned and coupled to the custom character's root/board sockets so board flip animations and character body animations stay synchronized.
* **Verified Map Loading & Spawn Placement:**
* Upon initialization, the engine must load one of the verified ported Skate 3 maps (including its visual mesh, collision `.bin` data, and grind splines).
* The player character and skateboard must be placed at a valid, non-intersecting spawn marker above active collision geometry with the follow-camera locked onto the character.


* **WebGL/WebGPU Execution Compatibility:** The loaded character asset (vertex buffers, skinning uniform/storage buffers, and texture formats) must operate within the memory and shader limits of the target WebGL2/WebGPU browser runtime without triggering pipeline panics or missing bind group errors.

---

## 4. Acceptance Criteria (Definition of Done)

The functionality is considered complete when the following observable behaviors are achieved:

1. **Valid Asset Output:** A standalone, rigged `.glb` file exists containing the user's mesh, intact materials, normalized 4-bone vertex weights, and the exact joint hierarchy required by the clean-room engine.
2. **Clean Engine Boot:** The Rust/Bevy application compiles and launches into a verified Skate 3 map with zero missing bone/joint panics, shader compilation errors, or asset loading failures.
3. **Deformation Integrity:** At idle on the board, the character stands naturally in the skate stance without twisted wrists, inverted knees, floating torso segments, or crushed vertices.
4. **Full Gameplay Loop:** The user can push, steer, crouch, pop tricks via the stategraph, grind map geometry, bail, and respawn—with the custom character mesh animating smoothly and feet tracking the skateboard deck throughout all states.

---