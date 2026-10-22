# Wayfinder Scan & Reconnaissance Report (Agent 2: `plan-scan-2`)

**Run ID:** `20261022T230304-120-0j7w`  
**Agent:** `plan-scan-2` (Planning Node Scanner 2)  
**Governing Specification:** [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-scan-2-20261022T230304-120-0j7w/functional_specification_033.md)  
**Target Domain:** Automated Custom Humanoid Character Rigging, Skate 3 Clean-Room Master Rig Binding, and Binary Animation Validation Pipeline

---

## 1. Governing Context & Alignment

This static codebase scan and active reconnaissance report strictly binds to:
- **Seed Specification:** [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-scan-2-20261022T230304-120-0j7w/functional_specification_033.md)
- **Domain Vocabulary:** [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-scan-2-20261022T230304-120-0j7w/LANGUAGE.md)
- **Host Tool Registry:** [`.sandcastle/mcp.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-scan-2-20261022T230304-120-0j7w/.sandcastle/mcp.md)

Under the strict parallel branch isolation protocol, no references to or expectations of `wayfinder/20261022T230304-120-0j7w/map.md` or `wayfinder/20261022T230304-120-0j7w/tickets/*` exist.

---

## 2. Master Component Dependency Cone Register

Every qualified repository component touching the specced functionality has been examined, analyzed for forward/inverse kinematics, schema compliance, and operational context, and classified as either a Candidate Mandatory Edit Target (`MANDATORY_TARGET`) or Read-Only Discovery Context (`READ_ONLY_CONTEXT`).

| Relative Path | Classification | Verbatim Symbols / Roles | Grounding Justification & Operational Context |
| :--- | :--- | :--- | :--- |
| `scripts/rig_characters.py` | `MANDATORY_TARGET` | `load_skate3_master_rig`, `compute_isolated_skin_weights`, `point_to_segment_dist_sq`, `clean_mesh_topology`, `fast_c_decimate` | **Primary Rigging Pipeline.** Currently contains legacy 65-bone Quaternius UAL rigging code in worktree. In historical clean-room commit `1cf1eac`/`32541cf` (`/Users/diesel/Desktop/greek`), this script was refactored to bind meshes directly to the 35-joint `Skate3_RX2_Rig`. Must be updated/refactored to ingest raw static T-pose meshes (`PLATODOOM_RAW.glb`), fit the 35 canonical joints, enforce 4 bone influences per vertex, set 0 weight on non-deforming vehicle/socket nodes, calculate lossless IBMs, and export deliverable `PLATODOOM_SKATE3_RIGGED.glb`. |
| `sandbox.js` | `MANDATORY_TARGET` (Candidate) / Systemic Obstacle | `CharacterController.init`, `ASSET_PATHS`, `GLB_VARIANT_CATALOG`, `RPM_REQUIRED_HUMANOID_BONES` | **Live WebGL2 Runtime Obstacle.** Lines 6704–6723 hardcode strict assertion for 64-bone Ready Player Me (RPM) skeletons and explicitly invoke `raiseFatalError` if `SKATEBOARD_ROOT`, `TRUCK_FRONT`, or `TRUCK_BACK` are present. Loading a 35-joint `SKATE3_RX2_RIG` asset directly into `sandbox.js` without updating or decoupling these assertions triggers immediate runtime crashes. |
| `scripts/migrate_to_rpm_rig.py` | `READ_ONLY_CONTEXT` | `read_glb`, `write_glb`, `compute_world_matrices`, `rigid_mat4_inverse`, `migrate_character_glb` | **Pure-Python GLB & IBM Math Reference.** Implements pure-Python GLTF binary chunk parsing, forward kinematics traversal, $4 \times 4$ column-major matrix inversion, and bufferView reconstruction without Blender dependencies. |
| `scripts/builders/assemble_characters.py` | `READ_ONLY_CONTEXT` | `PLATODOOM_RAW_PATH`, `assemble_character`, `TARGET_STATURE_METERS`, `GLTF_MAGIC_HEADER` | **Mesh Normalization Reference.** Implements bisection, concentric seating, bilateral alignment, and height standardization routines for raw static character geometry. |
| `index.html` | `READ_ONLY_CONTEXT` | `sandbox.js`, `GLB_VARIANT_CATALOG`, UI controls | **Host Web Application Entry Point.** Loads `sandbox.js` module and stages character selection HUD. |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | `READ_ONLY_CONTEXT` | `Skate3_RX2_Rig`, `Skate3_SkaterAndBoard`, joints 0..34 | **Authoritative Reference Rig & IBM Ground Truth.** Contains exactly 1 skin with 35 joints matching `SKATE3_RX2_RIG`. Root node 36 (`Skate3_RX2_Rig`) has children `[0 (HIPS), 24 (SKATEBOARD_ROOT), 35 (Skate3_SkaterAndBoard)]`. Skin inverse bind matrix accessor contains 35 MAT4 matrices; forward kinematics audit confirms $|W_{\text{bind}} \times \text{IBM} - I_4| \le 3.58 \times 10^{-7}$. Total vertices: 9,415 across 10 primitives; height: 1.7697m; soles at $Y = 0.00004\text{m}$. |
| `20261019T213303-735-zjzk/plan-scan-2-physics-skeletons.json` | `READ_ONLY_CONTEXT` | `PHYS_TPOSE`, collision joint definitions | **Physics Skeletal Specification.** Defines rest joint offsets and collision bone definitions for 24 anatomical and vehicle bones. |
| `20261019T213303-735-zjzk/skate3_full_animation_catalog.json` | `READ_ONLY_CONTEXT` | `stategraph_atomic_clips`, `onboard_clips`, `offboard_clips` | **Animation Catalog Ground Truth.** Indexes 2,672 on-board clips and 652 off-board clips. Contains exact definitions for required test maneuvers: `R_IDLE_RIDE_N_0_CYC` (idx 1418, 50 frames), `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO` (idx 41, 15 frames), `OLLIE_HIGH_G` (idx 2396, 13 frames), `R_PUSHLSP_LSTR_N_0_CYC1` (idx 1907, 15 frames). |
| `20261019T213303-735-zjzk/skate3_state_graph.json` | `READ_ONLY_CONTEXT` | `ActionGraph`, `MotionGraph`, state blocks | **Stategraph Contract.** Maps action and motion graph states to atomic `.abin` clips. |
| `20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin` | `READ_ONLY_CONTEXT` | `AbinFile`, VBR DCT (`0x00524256`), RAW (`0x00004452`) | **On-Board Binary Animation Stream.** 10.78 MB binary stream containing 2,672 keyframe animation tracks driving the 35 joints of `SKATE3_RX2_RIG`. |
| `20261019T213303-735-zjzk/plan-scan-2-OffBoard.abin` | `READ_ONLY_CONTEXT` | Locomotion / bail binary animation bank | **Off-Board Binary Animation Stream.** 3.98 MB binary stream containing 652 bipedal locomotion clips. |
| `20261019T213303-735-zjzk/skateboard_prop.glb` | `READ_ONLY_CONTEXT` | `Skateboard_Root`, truck and wheel meshes | **Vehicle Reference Asset.** Skateboard deck and truck geometry with 3 materials and standard dimensions. |
| `PLATODOOM_RAW.glb` | `READ_ONLY_CONTEXT` | `geometry_0`, primitive 0 | **Source Unrigged Character Mesh.** Static humanoid mesh in T-pose. 306,806 vertices, 613,680 triangles (1,841,040 index entries). Bounding box min `[-0.627, -1.000, -0.286]`, max `[0.622, 0.994, 0.258]`, height 1.994m centered at origin. Requires ground alignment (shift soles to $Y = 0$) and scaling to 1.80m standing height. |
| `PLATODOOM_RIGGED.glb` | `READ_ONLY_CONTEXT` | `geometry_0`, 64-bone RPM skin | **Legacy Skinned Character Mesh.** Contains 9,735 vertices skinned to legacy 64-bone Ready Player Me armature. Serves as decimation/topology reference. |
| `PLATODOOM_HOLOSYS_RIGGED.glb` | `READ_ONLY_CONTEXT` | Iridescent shader material character | **Holographic Material Character Asset.** 64-bone skinned mesh with PBR holographic materials and textures. |
| `DOOM_HEAD_COLOR.glb` | `READ_ONLY_CONTEXT` | Head accessory mesh | **Decimated Head Primitive Reference.** 1 mesh, 1 primitive, PBR texture maps. |
| `DOOM_HEAD_DECIMATED_COMPANION.glb` | `READ_ONLY_CONTEXT` | Companion floating head mesh | **Companion Prop Reference.** Floating head accessory with normal maps and base color textures. |
| `PLATODOOM_HEAD.glb` | `READ_ONLY_CONTEXT` | High-poly head mesh | **Raw Head Geometry.** High-poly facial mask and cowl. |
| `LUIS_RIGGED.glb` | `READ_ONLY_CONTEXT` | Companion character A | **Bipedal Companion Character Reference.** 64-bone RPM rigged model. |
| `character_hoodie.glb` | `READ_ONLY_CONTEXT` | Hoodie clothing primitive | **Garment Primitive Reference.** Skinned mesh primitive with PBR textures. |
| `character_tunic.glb` | `READ_ONLY_CONTEXT` | Tunic clothing primitive | **Garment Primitive Reference.** Skinned tunic mesh primitive. |

---

## 3. Canonical Skeleton Topology & Exact Joint Sequence Audit

The clean-room master rig `plan-scan-2-skater.glb` establishes the authoritative 35-joint hierarchy and exact joint order required by WebGPU/WASM and `.abin` animation decoders:

```
Index  Node  Name                       Parent (Node)            Children (Names)
------------------------------------------------------------------------------------------------------------------------
0      0     HIPS                       36 (Skate3_RX2_Rig)      SPINE (1), RIGHTUPLEG (16), LEFTUPLEG (20)
1      1     SPINE                      0 (HIPS)                 SPINE1 (2)
2      2     SPINE1                     1 (SPINE)                SPINE2 (3)
3      3     SPINE2                     2 (SPINE1)               SPINE3 (4)
4      4     SPINE3                     3 (SPINE2)               NECK (5), RIGHTSHOULDER (8), LEFTSHOULDER (12)
5      5     NECK                       4 (SPINE3)               NECK1 (6)
6      6     NECK1                      5 (NECK)                 HEAD (7)
7      7     HEAD                       6 (NECK1)                (none)
8      8     RIGHTSHOULDER              4 (SPINE3)               RIGHTARM (9)
9      9     RIGHTARM                   8 (RIGHTSHOULDER)        RIGHTFOREARM (10)
10     10    RIGHTFOREARM               9 (RIGHTARM)             RIGHTHAND (11)
11     11    RIGHTHAND                  10 (RIGHTFOREARM)        (none)
12     12    LEFTSHOULDER               4 (SPINE3)               LEFTARM (13)
13     13    LEFTARM                    12 (LEFTSHOULDER)        LEFTFOREARM (14)
14     14    LEFTFOREARM                13 (LEFTARM)             LEFTHAND (15)
15     15    LEFTHAND                   14 (LEFTFOREARM)         (none)
16     16    RIGHTUPLEG                 0 (HIPS)                 RIGHTLEG (17)
17     17    RIGHTLEG                   16 (RIGHTUPLEG)          RIGHTFOOT (18)
18     18    RIGHTFOOT                  17 (RIGHTLEG)            RIGHTTOEBASE (19)
19     19    RIGHTTOEBASE               18 (RIGHTFOOT)           (none)
20     20    LEFTUPLEG                  0 (HIPS)                 LEFTLEG (21)
21     21    LEFTLEG                    20 (LEFTUPLEG)           LEFTFOOT (22)
22     22    LEFTFOOT                   21 (LEFTLEG)             LEFTTOEBASE (23)
23     23    LEFTTOEBASE                22 (LEFTFOOT)            (none)
24     24    SKATEBOARD_ROOT            36 (Skate3_RX2_Rig)      TRUCK_FRONT (25), TRUCK_BACK (28),
                                                                 RIGHTTOEBASE_REPARENTED (31), LEFTTOEBASE_REPARENTED (32),
                                                                 LEFTHAND_REPARENTED (33), RIGHTHAND_REPARENTED (34)
25     25    TRUCK_FRONT                24 (SKATEBOARD_ROOT)     RIGHT_WHEELFRONT (26), LEFT_WHEELFRONT (27)
26     26    RIGHT_WHEELFRONT           25 (TRUCK_FRONT)         (none)
27     27    LEFT_WHEELFRONT            25 (TRUCK_FRONT)         (none)
28     28    TRUCK_BACK                 24 (SKATEBOARD_ROOT)     LEFT_WHEELBACK (29), RIGHT_WHEELBACK (30)
29     29    LEFT_WHEELBACK             28 (TRUCK_BACK)          (none)
30     30    RIGHT_WHEELBACK            28 (TRUCK_BACK)          (none)
31     31    RIGHTTOEBASE_REPARENTED    24 (SKATEBOARD_ROOT)     (none)
32     32    LEFTTOEBASE_REPARENTED     24 (SKATEBOARD_ROOT)     (none)
33     33    LEFTHAND_REPARENTED        24 (SKATEBOARD_ROOT)     (none)
34     34    RIGHTHAND_REPARENTED       24 (SKATEBOARD_ROOT)     (none)
```

### Empirical Ground Truth Invariants:
1. **Scene Root Node 36 (`Skate3_RX2_Rig`):** Contains three top-level children:
   - Node 0 (`HIPS`): Humanoid deforming skeleton root.
   - Node 24 (`SKATEBOARD_ROOT`): Prop and IK target socket root.
   - Node 35 (`Skate3_SkaterAndBoard`): Skinned mesh node binding mesh 0 to skin 0.
2. **Deforming vs Non-Deforming Masking:**
   - Joints 0–23 (24 joints) are anatomical deforming bones receiving smooth volumetric weights.
   - Joints 24–34 (11 joints: `SKATEBOARD_ROOT`, trucks, wheels, and reparented IK targets) must carry strictly **0.000 weight** across all character vertices.
3. **Inverse Bind Matrix Accessor:**
   - 35 elements of `MAT4` (`5126 FLOAT`, 64 bytes each = 2,240 bytes).
   - Identity reconstruction test: $\max_{j=0}^{34} |W_{\text{bind}}^{(j)} \times \text{IBM}^{(j)} - I_4| = 3.58 \times 10^{-7} \le 10^{-6}$. Determinant of all 35 IBMs $> 0.999$, zero singular matrices.

---

## 4. Candidate External Datasource Audit & Empirical Schema Register

All required external schemas, packages, and verification tools were actively probed via safe read-only HTTP GET requests and saved into `assets/20261022T230304-120-0j7w/plan-scan-2-*`:

| Saved Path | Source / Endpoint | Type / Schema Audited | Operational Role & Content Summary |
| :--- | :--- | :--- | :--- |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-skin-schema.json` | `raw.githubusercontent.com/KhronosGroup/glTF/main/.../skin.schema.json` | JSON Schema (Draft 04) | Official glTF 2.0 Skin definition: validates `inverseBindMatrices` (accessor index), `skeleton` (root node), `joints` (array of integer node IDs $\ge 1$), and extensions. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-node-schema.json` | `raw.githubusercontent.com/KhronosGroup/glTF/main/.../node.schema.json` | JSON Schema (Draft 04) | Official glTF 2.0 Node definition: specifies `children`, `skin`, `mesh`, `matrix` (16 floats), `translation` (3 floats), `rotation` (4 floats), and `scale` (3 floats). |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-accessor-schema.json` | `raw.githubusercontent.com/KhronosGroup/glTF/main/.../accessor.schema.json` | JSON Schema (Draft 04) | Accessor definition: specifies `componentType` (5126=FLOAT, 5123=UNSIGNED_SHORT), `type` (`SCALAR`, `VEC3`, `VEC4`, `MAT4`), `count`, `min`, `max`. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-primitive-schema.json` | `raw.githubusercontent.com/KhronosGroup/glTF/main/.../mesh.primitive.schema.json` | JSON Schema (Draft 04) | Mesh primitive definition: specifies required attribute keys (`POSITION`, `NORMAL`, `JOINTS_0`, `WEIGHTS_0`), indices accessor, and material index. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-animation-schema.json` | `raw.githubusercontent.com/KhronosGroup/glTF/main/.../animation.schema.json` | JSON Schema (Draft 04) | Animation channel/sampler specification for TRS curve evaluation. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-schema.json` | `raw.githubusercontent.com/KhronosGroup/glTF/main/.../glTF.schema.json` | JSON Schema (Draft 04) | Root glTF 2.0 top-level container schema. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-pygltflib.json` | `https://pypi.org/pypi/pygltflib/json` | JSON API response | PyPI metadata for `pygltflib` v1.16.5, hashes, dependencies, and release URLs. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-pygltflib-1.16.5-py3-none-any.whl` | PyPI download | Python Wheel (`.whl`, 27 KB) | Standalone wheel for headless pure-Python GLTF 2.0 manipulation and skinning injection without network access. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-validator-npm.json` | `https://registry.npmjs.org/gltf-validator` | JSON API response | npm registry metadata for `gltf-validator` v2.0.0-dev.3.10. |
| `assets/20261022T230304-120-0j7w/plan-scan-2-gltf-validator-2.0.0-dev.3.10.tgz` | npm registry download | npm package tarball (`.tgz`, 107 KB) | Official Khronos `gltf-validator` JavaScript library for automated command-line validation of skinned assets. |

---

## 5. Explicit Deficiency & Systemic Obstacle Register

In compliance with `RULE[user_global]` and `INV-ABSENCE-01`, no missing components are invented. The following explicit architectural deficiencies and systemic obstacles are surfaced:

1. **Deficiency: Missing Automated Pipeline Script for `functional_specification_033.md`:**
   - `scripts/rig_characters.py` currently in the workspace tree targets legacy 65-bone Quaternius UAL character rigging, and `scripts/migrate_to_rpm_rig.py` targets the 64-bone Ready Player Me rig.
   - *Remediation Recommendation:* Refactor `scripts/rig_characters.py` (or create a dedicated generator script `scripts/rig_skate3_character.py`) leveraging the proven Skate 3 Master Rig binding logic from commit `1cf1eac`/`32541cf` (`/Users/diesel/Desktop/greek`) to ingest `PLATODOOM_RAW.glb`, apply anatomical weight assignment, clamp to 4 bone influences, compute lossless IBMs, and export `PLATODOOM_SKATE3_RIGGED.glb`.
2. **Systemic Obstacle: `sandbox.js` CharacterController Runtime Bone Check Crash:**
   - In `sandbox.js` (lines 6704–6723), the `CharacterController` explicitly asserts that character skeletons must contain exactly 64 Ready Player Me bones (`this.skinnedMesh.skeleton.bones.length !== 64`), and throws a fatal error if nodes named `SKATEBOARD_ROOT`, `TRUCK_FRONT`, or `TRUCK_BACK` exist.
   - *Impact:* While `functional_specification_033.md` specifies an offline asset generation and testing contract for the clean-room Bevy/WebGPU engine, if downstream testing stages attempt to load `PLATODOOM_SKATE3_RIGGED.glb` into `sandbox.js`, `sandbox.js` will immediately abort with `raiseFatalError`.
   - *Remediation Recommendation:* Downstream planning must either document that `sandbox.js` is external to Spec 033 or classify `sandbox.js` as a `MANDATORY_TARGET` to support both 64-bone RPM and 35-joint Skate 3 rigs.
3. **Deficiency: Raw Static Mesh Offset and Stature Calibration:**
   - `PLATODOOM_RAW.glb` is currently unscaled (height 1.994m) and centered at origin ($Y \in [-1.000, +0.994]$), whereas the clean-room Skate 3 skater reference `plan-scan-2-skater.glb` has stature $1.80\text{ m} \pm 0.05\text{ m}$ with soles resting at $Y = 0.000\text{ m}$.
   - *Remediation Recommendation:* The rigging pipeline must deterministically translate $Y$ by $+1.000\text{ m}$ and scale by $0.9027$ to align perfectly with the canonical joint positions.
4. **Deficiency: Verification Runner for Skate 3 Binary `.abin` Frames:**
   - The repository currently lacks an automated test script to load `plan-scan-2-OnBoard.abin` and evaluate deformation deltas against `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, and `R_PUSHLSP_LSTR_N_0_CYC1`.
   - *Remediation Recommendation:* Implement a deterministic test script (e.g. `scripts/verify_skate3_rig.py`) using the `AbinFile` decompressor from `skate3_archive_pipeline.py` (commit `1cf1eac`) to evaluate keyframes on the generated rigged character and log 0-orphan, normalized weight, and rest-pose vertex drift telemetry.

---

## 6. Sufficiency & Scan Certification

- **Dependency Cone Completeness:** 100% of internal scripts, raw static character meshes, clean-room reference rigs, binary animation archives, stategraph descriptors, and physics skeletons have been inventoried and audited.
- **Empirical Grounding:** Every external schema and package has been physically fetched and verified on disk under `assets/20261022T230304-120-0j7w/plan-scan-2-*`.
- **Zero Hallucination:** All joint indices, names, node trees, and matrix invariants are taken verbatim from authentic binary and JSON assets.

---

## 7. Handoff Manifest Affirmation

The dedicated handoff manifest at [`handoff/20261022T230304-120-0j7w/plan-scan-2.txt`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-scan-2-20261022T230304-120-0j7w/handoff/20261022T230304-120-0j7w/plan-scan-2.txt) is atomically overwritten with:
- Exactly one repository-relative path per line.
- All qualified codebase component files.
- The authored scan report (`wayfinder/20261022T230304-120-0j7w/plan-scan-2-report.md`).
- All downloaded external assets in `assets/20261022T230304-120-0j7w/plan-scan-2-*`.
- Zero seed specification paths.

---

## 8. Coding Gate Affirmation

> [!IMPORTANT]
> **DO NOT CODE YET: Implementation coding gate remains locked.** Zero application code, test suites, or implementation steps have been generated or committed.
