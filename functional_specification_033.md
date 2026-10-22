# Functional Specification 033: Automated Custom Humanoid Character Rigging, Skate 3 Clean-Room Master Rig Binding, and Binary Animation Validation Pipeline

## 1. System Purpose & Core Objective

This specification defines the desired `{functionality}`, operational budgets, failure boundaries, and verifiable `{correct required outputs}` for an automated offline asset preparation and validation pipeline. 

The primary objective is to ingest raw, unrigged, static humanoid 3D character meshes in `.glb` format (such as `PLATODOOM_RAW.glb` and custom companion meshes), automatically fit and skin them to the authoritative 35-joint **Skate 3 Clean-Room Master Rig (`SKATE3_RX2_RIG`)** established by the clean-room reference asset [`20261019T213303-735-zjzk/plan-scan-2-skater.glb`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/plan-scan-2-skater.glb), compute mathematically lossless Inverse Bind Matrices (`inverseBindMatrices`), enforce WebGPU/WASM shader constraints (strictly 4 normalized bone influences per vertex), and validate deformation fidelity against the decompressed Skate 3 binary animation catalog ([`skate3_full_animation_catalog.json`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/skate3_full_animation_catalog.json) and [`plan-scan-2-OnBoard.abin`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin)).

Because clean-room skatepark map assets and the host Rust/Bevy compilation toolchain are currently external and pending, this specification establishes an implementation-agnostic, hermetically verifiable asset generation and testing contract. The resulting character deliverables must instantiate cleanly into any clean-room Skate 3 runtime (Rust/Bevy WebGPU or WebGL2) with zero missing-bone panics, zero unweighted vertex tears, zero inverted limbs, and zero texture degradation.

**DO NOT CODE YET.** This document defines desired outcomes, behavioral specifications, and physical limits. It contains zero implementation code, syntax, or internal component scaffolding.

---

## 2. Authoritative Domain Vocabulary Alignment (`LANGUAGE.md`)

All evaluations of system state, operational constraints, and verification gates within this specification strictly adhere to the authoritative definitions defined in [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{functionality}`**: The complete end-to-end execution of the character pipeline—ingesting unrigged T-pose geometry, fitting the Skate 3 canonical armature, computing 4-bone vertex skinning, computing identity-aligned inverse bind matrices, preserving materials, and deterministically validating mesh deformation against key Skate 3 maneuvers (riding idle, crouch setup, ollie pop, pushing, and hand/foot contact points) without manual intervention or visual artifacts.
- **`{correctness}`**: Exact adherence to the mathematical and structural invariants of the Skate 3 skeletal contract:
  - Exact 35-joint hierarchy, node naming, and joint order matching `plan-scan-2-skater.glb`.
  - Joint local rest poses and world-space alignments strictly preserve the metric scale of the clean-room engine.
  - Every single vertex possesses non-zero bone weights strictly capped at 4 influences, normalized such that $\sum_{i=1}^4 w_i = 1.0 \pm 10^{-6}$.
  - Inverse Bind Matrices satisfy $W_{\text{bind}} \times \text{IBM} = I_4$ within floating-point epsilon ($10^{-5}$), ensuring zero geometric displacement in rest pose.
- **`{correct required outputs}`**:
  1. A standalone, clean-room compliant rigged character file (`.glb`) containing the input mesh, preserved PBR materials, the 35-joint Skate 3 Master Rig, 4-weight skinning accessors (`JOINTS_0` and `WEIGHTS_0`), and valid Inverse Bind Matrix buffer views.
  2. A deterministic verification report logging:
     - Total mesh vertices processed and 100% skinning coverage confirmation (0 orphan vertices).
     - Clamped weight normalization audit (max 4 weights, sum = 1.0).
     - Rest-pose vertex drift verification ($< 0.001\text{ mm}$ displacement when evaluated against identity transform).
     - Test-frame deformation delta checks against primary Skate 3 catalog maneuvers (`R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `R_PUSHLSP_LSTR_N_0_CYC1`).
- **`{errors}`**: Explicit failure conditions surfaced immediately:
  - Unmapped or missing canonical bones from the 35-joint specification.
  - Vertices with zero bone influences (orphan vertices that remain frozen in world space).
  - Vertices assigned $> 4$ bone influences or weights not summing to 1.0.
  - Non-invertible or corrupted bind matrices causing mesh collapse ("spaghetti" deformation) during pose evaluation.
  - Loss, distortion, or corruption of input UV sets, normals, tangents, or PBR texture maps.
- **`{sufficient}`**: All asset requirements, mathematical invariants, joint schemas, physical budgets, edge cases, and verifiable criteria are documented with zero ambiguity, enabling execution without guessing or inventing ad-hoc workarounds.
- **`{insufficient}`**: Any specification relying on unverified bone hierarchies, arbitrary manual weight painting, omitted vehicle sockets, or ungrounded physical performance assumptions.

---

## 3. Input Artifacts & Environmental Preconditions

The pipeline operates against the following verified clean-room artifacts located in [`20261019T213303-735-zjzk/`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk):

| Artifact Path | Format | Description / Role |
| :--- | :--- | :--- |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | GLTF/GLB | **Authoritative Reference Rig:** Canonical 35-joint Skate 3 armature, node hierarchy, joint transforms, and rest-pose bind matrices. |
| `20261019T213303-735-zjzk/plan-scan-2-physics-skeletons.json` | JSON | **Physics Rest Specification:** Joint offset vectors, bone lengths, and collision joint definitions (`PHYS_TPOSE`). |
| `20261019T213303-735-zjzk/skateboard_prop.glb` | GLTF/GLB | **Skateboard Vehicle Reference:** Deck pivot, truck mount transforms, and wheel rotation node standards (`Skateboard_Root`). |
| `20261019T213303-735-zjzk/skate3_state_graph.json` | JSON | **Stategraph Contract:** Action and motion graph metadata, state blocks, transitions, and trick bindings. |
| `20261019T213303-735-zjzk/skate3_full_animation_catalog.json` | JSON | **Animation Catalog:** Index of all 3,324 binary `.abin` clips, state blocks, and atomic trick maneuvers. |
| `20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin` | Binary | **On-Board Animation Bank:** 2,672 extracted keyframe clips driving the 35 canonical joints. |
| `20261019T213303-735-zjzk/plan-scan-2-OffBoard.abin` | Binary | **Off-Board Animation Bank:** 652 bipedal locomotion, bail, and dismount clips. |
| `PLATODOOM_RAW.glb` (and/or target character `.glb`) | GLTF/GLB | **Source Character Mesh:** Unrigged, static humanoid mesh in standard T-Pose with complete geometry, UVs, and PBR textures, but zero skeleton/weights. |

---

## 4. Pillar A: Canonical Skeleton Specification & Topological Contract

The pipeline must enforce strict alignment with the 35-joint Skate 3 Clean-Room Master Rig (`SKATE3_RX2_RIG`). Any divergence in bone count, naming strings, or parent-child hierarchy violates engine compatibility.

### 4.1 Authoritative Joint Hierarchy
The skeleton consists of exactly 35 joints arranged in a unified tree combining anatomical humanoid deforming bones with vehicle and IK solver nodes:

```
HIPS (Root humanoid transform)
├── SPINE
│   └── SPINE1
│       └── SPINE2
│           └── SPINE3
│               ├── NECK
│               │   └── NECK1
│               │       └── HEAD
│               ├── LEFTSHOULDER
│               │   └── LEFTARM
│               │       └── LEFTFOREARM
│               │           └── LEFTHAND
│               │               └── LEFTHAND_REPARENTED (IK Grab / Deck Target)
│               └── RIGHTSHOULDER
│                   └── RIGHTARM
│                       └── RIGHTFOREARM
│                           └── RIGHTHAND
│                               └── RIGHTHAND_REPARENTED (IK Grab / Deck Target)
├── LEFTUPLEG
│   └── LEFTLEG
│       └── LEFTFOOT
│           └── LEFTTOEBASE
│               └── LEFTTOEBASE_REPARENTED (IK Foot / Deck Lock Target)
├── RIGHTUPLEG
│   └── RIGHTLEG
│       └── RIGHTFOOT
│           └── RIGHTTOEBASE
│               └── RIGHTTOEBASE_REPARENTED (IK Foot / Deck Lock Target)
└── SKATEBOARD_ROOT (Vehicle root transform)
    ├── TRUCK_FRONT
    │   ├── LEFT_WHEELFRONT
    │   └── RIGHT_WHEELFRONT
    └── TRUCK_BACK
        ├── LEFT_WHEELBACK
        └── RIGHT_WHEELBACK
```

### 4.2 Joint Specification Invariants
1. **Case Sensitivity & Exact Strings:** Bone node names must match the exact uppercase strings listed above. CamelCase or lowercase names (such as `Hips` or `spine_01`) are rejected.
2. **Prop & Vehicle Node Inclusion:** The skeleton must contain `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, and the four individual wheel nodes as non-deforming structural nodes in the glTF skin joints array, allowing the runtime animation evaluator to drive board roll, pitch, truck steering compression, and wheel rotation within the same animation stream as the body.
3. **Reparented IK Sockets:** `LEFTTOEBASE_REPARENTED`, `RIGHTTOEBASE_REPARENTED`, `LEFTHAND_REPARENTED`, and `RIGHTHAND_REPARENTED` must be preserved as designated solver targets for the runtime inverse kinematics system.

---

## 5. Pillar B: Automated Static-to-Skinned Mesh Normalization & Rigging

The pipeline must transform the unrigged static T-pose mesh into an engine-ready skinned mesh without human manual adjustment.

### 5.1 Spatial & Proportional Normalization
1. **Coordinate System:** Input geometry must be normalized to standard Right-Handed, Y-Up space (forward vector along $+Z$, lateral along $+X$).
2. **Metric Height & Ground Alignment:**
   - The character's soles must rest at ground zero ($Y = 0.000\text{ m} \pm 0.001\text{ m}$).
   - The total standing height of the character mesh must be normalized to match the canonical clean-room skater height ($1.80\text{ m} \pm 0.05\text{ m}$ from soles to crown of head).
   - The lateral center of mass must align with world origin $(X = 0, Z = 0)$.
3. **Armature Landmark Fitting:**
   - The canonical 35-joint armature must be scaled and fitted to the static mesh volume based on anatomical bounding box landmarks:
     - Hip joint centered within the lower pelvic mesh volume.
     - Knee and elbow joints placed along the physical hinge axes of the limb geometry with standard forward/backward pre-bend bias to prevent IK solver flipping.
     - Ankle and wrist joints aligned with footwear and wrist cuff boundaries.
     - Shoulder and clavicle origins positioned at the lateral pectoral apex.

### 5.2 Volumetric Vertex Skinning & Weight Normalization
1. **Smooth Harmonic/Volumetric Weighting:**
   - Every vertex across the body mesh must receive smooth, continuous skinning weights mapped to corresponding anatomical deforming joints (`HIPS` through `HEAD`, clavicles to hands, thighs to toes).
2. **Non-Deforming Joint Masking:**
   - Vehicle and solver nodes (`SKATEBOARD_ROOT`, `TRUCK_*`, `*_WHEEL*`, `*_REPARENTED`) must carry **zero** deforming influence on the character's anatomical skin ($w = 0.000$ for all character vertices).
3. **Shader Constraint Clamping (4 Influences Max):**
   - For every vertex, the pipeline must retain strictly the top 4 largest bone influence weights. All lesser influences must be clamped to zero.
   - The remaining 4 weights must be normalized so their sum equals exactly $1.000000$:
     $$w'_k = \frac{w_k}{\sum_{j=1}^4 w_j}$$
4. **Zero-Influence Elimination:**
   - No vertex may have a total weight sum of zero. Every vertex must be influenced by at least one primary joint.
5. **Discrete & Accessory Primitive Cohesion:**
   - Distinct mesh components (e.g., masks, goggles, hair, jackets, shoes, companion props) must deform cohesively with their associated underlying skeletal bones without tearing, vertex spikes, or floating separation.

### 5.3 Material & Vertex Attribute Preservation
1. **PBR Texture Fidelity:** All original textures (base color, normal maps, metallic/roughness, emissive, ambient occlusion) and material settings must remain intact without rebaking artifacts or downscaling.
2. **Buffer Integrity:** Standard vertex attributes (`POSITION`, `NORMAL`, `TEXCOORD_0`, `TANGENT`) must be preserved in 1-to-1 parity alongside newly generated `JOINTS_0` (unsigned 16-bit integer `[u16; 4]`) and `WEIGHTS_0` (normalized 32-bit float `[f32; 4]` or normalized 16-bit unsigned integer `[u16; 4]`).

---

## 6. Pillar C: Inverse Bind Matrix Formulation & Deformation Fidelity

To guarantee seamless evaluation of Skate 3 `.abin` animation tracks, the generated skin must satisfy rigorous mathematical bind invariants.

### 6.1 Mathematical Formulation
For every joint $j \in \{0, \dots, 34\}$ in the skeleton:
- Let $W_{\text{bind}}^{(j)}$ be the $4 \times 4$ homogeneous world-space transform matrix of joint $j$ in the canonical rest pose.
- The corresponding Inverse Bind Matrix $\text{IBM}^{(j)}$ must satisfy:
  $$\text{IBM}^{(j)} = \left( W_{\text{bind}}^{(j)} \right)^{-1}$$
- Such that in rest pose:
  $$W_{\text{bind}}^{(j)} \times \text{IBM}^{(j)} = I_4$$

### 6.2 Format & Storage Requirements
1. **Matrix Layout:** Stored in glTF standard column-major order as 16 consecutive 32-bit floating-point values (`FLOAT`, `VEC4` $\times 4$).
2. **Invertibility Guarantee:** The determinant of every joint's world rest transform must be non-zero ($|\det(W_{\text{bind}}^{(j)})| > 10^{-6}$), preventing non-invertible or singular matrices that cause vertex collapse.

---

## 7. Pillar D: Deterministic Offline Animation & Stategraph Verification

The pipeline must verify the rigged character asset against the clean-room animation database before declaring success.

### 7.1 Keyframe Test Suite
The generated asset must be evaluated against test poses extracted from the Skate 3 catalog ([`skate3_full_animation_catalog.json`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/skate3_full_animation_catalog.json)):

1. **Riding Idle (`ride_idle` / `R_IDLE_RIDE_N_0_CYC`):**
   - Natural skate stance on deck.
   - Knees slightly flexed, torso rotated slightly forward, feet flat across deck surface.
   - Verification: Zero inverted joint rotations; feet maintain stable vertical offset above deck plane.
2. **Crouch Setup (`R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`):**
   - Deep knee compression and lowered center of mass.
   - Verification: Hip and thigh skinning deforms smoothly without mesh self-intersection or volume collapse.
3. **Ollie Pop & Aerial Phase (`OLLIE_HIGH_G` / `OLLIE_HIGH_A`):**
   - Full ankle snap, tail kick, and leg tuck.
   - Verification: Ankle and toe joints bend naturally; shoes stay bound to the character.
4. **Locomotion Push (`R_PUSHLSP_LSTR_N_0_CYC1`):**
   - Single-foot push stroke with opposite foot stabilizing the board.
   - Verification: Pelvis and hip joints maintain continuous skinning without tearing along the inner thigh or waistband.
5. **Grab Mechanics (`LEFTHAND_REPARENTED` / `RIGHTHAND_REPARENTED`):**
   - Upper body bend with arm reaching toward board rails.
   - Verification: Arm and forearm skinning stretches cleanly; hand sockets remain aligned with deck targets.

---

## 8. Operational & Physical Budgets

The pipeline must operate within the following physical and operational performance envelopes:

| Parameter | Operational Budget | Rationale / Failure Mode |
| :--- | :--- | :--- |
| **Max Bone Influences per Vertex** | Strictly $\le 4$ | WebGL2/WebGPU vertex shader limit. $>4$ causes pipeline compilation panics. |
| **Skinning Weights Sum** | $1.000000 \pm 10^{-6}$ | Under/over-weighted vertices distort or detach under camera translation. |
| **Rest Pose Vertex Displacement** | $< 0.001\text{ mm}$ ($10^{-6}\text{ m}$) | Rest pose evaluated with $\text{IBM}$ must be visually indistinguishable from raw static mesh. |
| **Total Joint Count** | Exactly 35 | Mismatched joint counts cause out-of-bounds index panics during `.abin` track binding. |
| **Offline Rigging Processing Time** | $< 30.0\text{ seconds}$ per asset | Headless execution budget in automated build environments. |
| **GLB Output Size Overhead** | $\le 15\%$ increase over raw mesh | Buffer size growth limited to `JOINTS_0`, `WEIGHTS_0`, and `IBM` accessors. |
| **Orphan / Zero-Weight Vertices** | Strictly 0 | Orphan vertices remain pinned at world origin during animation playback. |

---

## 9. Edge Cases, Failure Modes, & Boundary Guarantees

The automated rigging pipeline must deterministically handle the following structural edge cases:

1. **Disconnected Mesh Primitives & Accessories:**
   - Humanoid models often contain separate geometric primitives (e.g., separate head, mask, jacket, shoes, eye meshes).
   - *Requirement:* The pipeline must not isolate loose geometry. Vertices belonging to rigid accessories (such as a metal mask or shoes) must inherit weights from their nearest anatomical bone (e.g., `HEAD` or `LEFTFOOT`) to prevent loose parts from floating or staying behind.
2. **Extreme Mesh Asymmetry:**
   - Characters with asymmetrical styling (e.g., single-shoulder pads, tilted hoods).
   - *Requirement:* Fitting heuristics must rely on bilateral volumetric density rather than naive plane reflection, ensuring asymmetric parts receive stable local weights.
3. **Degenerate or Zero-Area Polygons:**
   - Non-manifold edges or collapsed micro-faces in raw source meshes.
   - *Requirement:* The skinning solver must sanitize and ignore degenerate triangles without emitting `NaN` or `Inf` weight values.
4. **Missing Optional Props:**
   - Raw input meshes contain character geometry only, with no skateboard geometry.
   - *Requirement:* The pipeline must bind the character mesh exclusively to humanoid joints while maintaining `SKATEBOARD_ROOT` and truck/wheel joints as empty transform nodes in the skin hierarchy, ready for dynamic runtime board coupling.
5. **Rest-Pose Non-Manifold Seams:**
   - Mesh boundaries between clothing cuffs and limbs.
   - *Requirement:* Weight gradients across seams must blend smoothly into adjacent bones to prevent sharp gaps from opening during extreme bends.

---

## 10. Verifiable Acceptance Criteria (`{correct required outputs}`) & Definition of Done

The feature handoff is complete and verified when the following measurable criteria are met:

1. **Rigged Deliverable Generation:**
   - A verified rigged `.glb` file exists (e.g., `PLATODOOM_SKATE3_RIGGED.glb` or specified deliverable path).
   - `gltf-validator` or glTF inspection confirms:
     - Exactly 1 skin containing exactly 35 joints matching the `SKATE3_RX2_RIG` hierarchy.
     - `JOINTS_0` accessor format is `UNSIGNED_SHORT` (`VEC4`).
     - `WEIGHTS_0` accessor format is `FLOAT` (`VEC4`), normalized to 1.0.
     - Inverse bind matrices accessor contains 35 valid $4 \times 4$ matrices with zero singular values.
2. **Zero-Drift Rest Pose:**
   - In rest pose, every vertex position matches the raw static source mesh within $10^{-5}\text{ m}$.
3. **Zero Orphan Vertices:**
   - Telemetry confirms 100% of vertices in all primitives possess valid joint associations with non-zero weights.
4. **Deterministic Animation Pose Stability:**
   - Evaluating `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, and `OLLIE_HIGH_G` keyframes on the skinned mesh produces continuous, visually clean deformation with zero inverted polygons, zero detached accessories, and zero `NaN`/`Inf` coordinates.
5. **Engine Interoperability Gate:**
   - The generated asset conforms directly to the binary schema required by clean-room `.abin` animation streams and Bevy/WebGPU `SkinnedMesh` components without requiring engine code patches or custom bone aliases.

---
*(End of Functional Specification 033)*
