# Wayfinder Scan Report: Codebase Static Scan, External API Reconnaissance, and Schema Auditing (Agent 1: plan-scan-1)

## 1. Governing Context
- **Single Seed Specification Consumed:** `functional_specification_033.md`
- **Glossary and Rules Alignment:** Strictly governed by `LANGUAGE.md` and `.sandcastle/mcp.md`.
- **Parallel Worktree Isolation:** Executed within worktree branch `agent/plan-scan-1-20261022T230304-120-0j7w` with zero dependency on `wayfinder/20261022T230304-120-0j7w/map.md` or `wayfinder/20261022T230304-120-0j7w/tickets/*`.
- **Strict Role Boundary:** Static scan and active read-only reconnaissance only. Zero lines of implementation code or test code written.

---

## 2. Master Component Dependency Cone Register

Every component reviewed in the active codebase is itemized below, classified as either a **Candidate Mandatory Target Deliverable (`MANDATORY_TARGET`)** or **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)**:

| Filepath | Classification | Verbatim Symbols / Interfaces | Grounding Justification & Operational Context |
| :--- | :--- | :--- | :--- |
| `scripts/rig_characters.py` | `MANDATORY_TARGET` | `compute_isolated_skin_weights`, `point_to_segment_dist_sq`, `clean_mesh_topology`, `fast_c_decimate`, `unify_and_standardize_character` | The core character rigging script. Currently structured as a 2,524-line Blender 5.2.2 LTS script targeting the legacy 65-bone Quaternius UAL rig with hardcoded `/Users/diesel/Desktop/Doom_Rig` paths. Must be refactored or superseded to produce the 35-joint Skate 3 Clean-Room Master Rig (`SKATE3_RX2_RIG`) required by Spec 033. |
| `scripts/migrate_to_rpm_rig.py` | `READ_ONLY_CONTEXT` | `read_glb`, `write_glb`, `compute_world_matrices`, `rigid_mat4_inverse`, `mat4_mul`, `mat4_to_col_major_16`, `migrate_character_glb` | Pure-Python standalone GLB manipulation script. Demonstrates exact glTF binary chunk extraction, TRS matrix evaluation, rigid matrix inversion ($W \times \text{IBM} = I_4$), accessor repackaging, and 4-byte padding without requiring Blender. Serves as reference implementation for standalone Python GLB skinning/IBM binding. |
| `sandbox.js` | `MANDATORY_TARGET` | `CharacterController`, `GLB_VARIANT_CATALOG`, `normalizeRPMBoneName`, `sanitizeRPMAnimationClip`, `loadGLB`, `selectCharacterVariant`, `updateCameraController` | Main browser runtime sandbox (11,705 lines). Lines 6705–6722 hardcode strict assertions: requiring exactly 64 Ready Player Me bones and throwing fatal exceptions if `SKATEBOARD_ROOT`, `TRUCK_FRONT`, or `TRUCK_BACK` are found on any character. If rigged Skate 3 assets (`PLATODOOM_SKATE3_RIGGED.glb`) are loaded in the browser sandbox, `CharacterController` and `GLB_VARIANT_CATALOG` must be updated to accommodate the 35-joint `SKATE3_RX2_RIG`. |
| `index.html` | `MANDATORY_TARGET` | `#glb-variant-select`, `#solo-character-btn`, `#swap-character-btn`, HUD variant controls | Live DOM interface hosting character variant dropdown selector (lines 1295–1301) and asset test toggles. Must list Skate 3 clean-room rigged GLB deliverables once integrated. |
| `scripts/builders/assemble_characters.py` | `READ_ONLY_CONTEXT` | `sever_doom_body_extremities`, `trim_and_seat_doom_head`, `import_glb_mesh`, `clean_mesh_topology` | Character geometry bisection, wrist cuff seating, and stature normalization (2.0m stature target). Reference for mesh volume landmarks and bounding box cuts. |
| `scripts/builders/prepare_scene.py` | `READ_ONLY_CONTEXT` | `stage_modular_character_files`, `align_level_and_scale_alley_mesh`, `unify_clean_and_decimate_alley_mesh` | Asset staging script. Stages character models into scene roots. |
| `scripts/builders/build_alarm_light.py` | `READ_ONLY_CONTEXT` | `build_alarm_light_scene`, `create_dark_amber_bulb_material` | Procedural builder for alarm light fixtures. |
| `scripts/builders/build_hologram.py` | `READ_ONLY_CONTEXT` | `build_hologram_asset`, `create_smoked_glass_material`, `create_high_bloom_neon_material` | Procedural builder for wall mount glass and neon frames. |
| `scripts/builders/build_luis_sign.py` | `READ_ONLY_CONTEXT` | `build_luis_sign_scene` | Builder for 17-glyph 3D typography sign. |
| `scripts/builders/build_stickers.py` | `READ_ONLY_CONTEXT` | `build_all_sticker_bundles`, `isolate_subject_alpha`, `generate_die_cut_border_and_tri_zones` | Pure-Python/NumPy/OpenCV sticker generation pipeline. |
| `package.json` | `READ_ONLY_CONTEXT` | `dependencies: { three: "^0.186.1" }`, `devDependencies: { "@ai-hero/sandcastle": "^0.12.0" }` | Project package manifest. Defines runtime Three.js environment. |
| `skate_port.md` | `READ_ONLY_CONTEXT` | Architectural specification | Initial architectural specification for Skate 3 Rust/Bevy WebGPU clean-room character port. Precursor to Spec 033. |
| `animation_Redo.md` | `READ_ONLY_CONTEXT` | Architecture documentation | Architectural documentation of previous animation migration (from Quaternius to 64-bone Ready Player Me). |
| `required_edits_032.md` | `READ_ONLY_CONTEXT` | Sprint 032 specification | Architectural record detailing previous corridor restoration and subsystem decoupling. |
| `functional_specification_032.md` | `READ_ONLY_CONTEXT` | Sprint 032 specification | Precursor functional specification for Freeman Alley experience. |
| `alley_atmosphere_023.js` | `READ_ONLY_CONTEXT` | Lighting and atmospheric shader systems | Surrounding environment rendering module. |
| `hologram_columns.js` | `READ_ONLY_CONTEXT` | 17 2D holographic media columns system | Interactive corridor columns module. |
| `holographic_sign.js` | `READ_ONLY_CONTEXT` | Holographic typography sign loader | Scene prop loader. |
| `holographic_stickers.js` | `READ_ONLY_CONTEXT` | Holographic sticker loader | Scene sticker system. |
| `math_pods.js` | `READ_ONLY_CONTEXT` | 7 3D math pods system | Interactive math pod system. |
| `mathpod_popup.js` | `READ_ONLY_CONTEXT` | Math pod popup UI manager | Popup modal manager. |
| `radial_menu_hud.js` | `READ_ONLY_CONTEXT` | 2D HUD radial menu system | Cyber-tactical radial menu module. |
| `spray_paint_loader.js` | `READ_ONLY_CONTEXT` | Spray paint loader | Asset loader module. |
| `watercolor_shader.js` | `READ_ONLY_CONTEXT` | Watercolor skybox shader system | Skybox background shader. |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | `READ_ONLY_CONTEXT` | `SKATE3_RX2_RIG`, `Skate3_SkaterAndBoard`, 35 joints, 10 meshes, 10 materials | Authoritative Clean-Room Reference Rig. Exactly 35 joints (0: HIPS, 1..4: SPINE chain, 5..7: NECK/HEAD, 8..11: RIGHT arm chain, 12..15: LEFT arm chain, 16..19: RIGHT leg chain, 20..23: LEFT leg chain, 24: SKATEBOARD_ROOT, 25..27: TRUCK_FRONT and wheels, 28..30: TRUCK_BACK and wheels, 31..34: _REPARENTED IK targets under SKATEBOARD_ROOT). Verified via glbforge validate (0 errors). |
| `20261019T213303-735-zjzk/plan-scan-2-physics-skeletons.json` | `READ_ONLY_CONTEXT` | `PHYS_TPOSE`, 24 collision bones | Authoritative clean-room physics collision skeleton specification. |
| `20261019T213303-735-zjzk/skate3_full_animation_catalog.json` | `READ_ONLY_CONTEXT` | `stategraph_atomic_clips`, `onboard_clips` (2,672 clips), `offboard_clips` (652 clips) | Authoritative animation catalog indexing 3,324 binary `.abin` clips. Confirmed exact entries for test suite: `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, and `R_PUSHLSP_LSTR_N_0_CYC1`. |
| `20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin` | `READ_ONLY_CONTEXT` | Binary `.abin` stream (10,783,864 bytes) | 2,672 on-board animation clips driving the 35 canonical joints. |
| `20261019T213303-735-zjzk/plan-scan-2-OffBoard.abin` | `READ_ONLY_CONTEXT` | Binary `.abin` stream (3,982,936 bytes) | 652 off-board animation clips. |
| `20261019T213303-735-zjzk/skateboard_prop.glb` | `READ_ONLY_CONTEXT` | `Skateboard_Root` prop mesh | Skateboard reference model. |
| `20261019T213303-735-zjzk/skate3_state_graph.json` | `READ_ONLY_CONTEXT` | ActionGraph and MotionGraph state blocks | Stategraph action/motion machine contract. |
| `PLATODOOM_RAW.glb` | `READ_ONLY_CONTEXT` | Node `geometry_0`, Mesh `geometry_0`, 1 primitive, `POSITION` attr | Unrigged, static humanoid character geometry. 0 skins, 0 materials. Primary target mesh for automated rigging pipeline. |
| `PLATODOOM_HEAD.glb` | `READ_ONLY_CONTEXT` | Static head mesh | Accessory mesh for Platodoom. |
| `DOOM_HEAD_COLOR.glb` | `READ_ONLY_CONTEXT` | Static head mesh with PBR color texture | Color accessory mesh for Platodoom. |
| `DOOM_HEAD_DECIMATED_COMPANION.glb` | `READ_ONLY_CONTEXT` | Static shoulder companion mesh | Decimated shoulder companion prop. |
| `LUIS_HEAD.glb` | `READ_ONLY_CONTEXT` | Static head mesh | Accessory mesh for Luis. |
| `LUIS_HEAD_COLOR.glb` | `READ_ONLY_CONTEXT` | Static head mesh with PBR color texture | Color accessory mesh for Luis. |
| `Luis_BODY_COLOR.glb` | `READ_ONLY_CONTEXT` | Static body mesh with PBR color texture | Color body mesh for Luis. |
| `LUIS_DECIMATED_STANDALONE.glb` | `READ_ONLY_CONTEXT` | Decimated standalone mesh | Reference decimated model for Luis. |
| `LUIS_HOLOSYS_RIGGED.glb` | `READ_ONLY_CONTEXT` | Existing 64-bone RPM rigged deliverable | Active runtime character model. |
| `LUIS_RIGGED_CLAY.glb` | `READ_ONLY_CONTEXT` | Existing 64-bone RPM rigged deliverable | Active runtime clay variant. |
| `LUIS_RIGGED.glb` | `READ_ONLY_CONTEXT` | Existing 64-bone RPM rigged deliverable | Active runtime full-color variant. |
| `PLATODOOM_HOLOSYS_RIGGED.glb` | `READ_ONLY_CONTEXT` | Existing 64-bone RPM rigged deliverable | Active runtime Platodoom model. |
| `PLATODOOM_RIGGED.glb` | `READ_ONLY_CONTEXT` | Existing 64-bone RPM rigged deliverable | Active runtime Platodoom full-color variant. |
| `character_hoodie.glb` | `READ_ONLY_CONTEXT` | Alias copy of `LUIS_RIGGED.glb` | Active runtime asset alias. |
| `character_tunic.glb` | `READ_ONLY_CONTEXT` | Alias copy of `PLATODOOM_RIGGED.glb` | Active runtime asset alias. |
| `HOLO_SYS_VISUALIZER.glb` | `READ_ONLY_CONTEXT` | Visualizer prop asset | Scene visualizer mesh. |
| `alarm_light.glb` | `READ_ONLY_CONTEXT` | Alarm light fixture asset | Scene lighting prop. |
| `hologram.glb` | `READ_ONLY_CONTEXT` | Hologram screen asset | Scene screen prop. |
| `freeman_alley.glb` | `READ_ONLY_CONTEXT` | Environment asset | Main environment mesh and collider collection. |

---

## 3. Candidate External Datasource & Schema Audit Register

Active read-only reconnaissance was conducted against official external registries and specification schemas. All downloaded external assets, packages, and schemas are saved under `assets/20261022T230304-120-0j7w/` with strict prefix `plan-scan-1-`:

### 3.1 Khronos glTF 2.0 Official Specification Schemas
- **Source Endpoint:** `https://raw.githubusercontent.com/KhronosGroup/glTF/main/specification/2.0/schema/`
- **Authentication:** None (public HTTPS GET).
- **HTTP Status:** `200 OK`
- **Schemas Captured:**
  1. `assets/20261022T230304-120-0j7w/plan-scan-1-glTF.schema.json`: Root glTF 2.0 JSON schema.
  2. `assets/20261022T230304-120-0j7w/plan-scan-1-skin.schema.json`: Skin schema defining `joints` (array of integer node indices, minItems 1, uniqueItems true), `inverseBindMatrices` (accessor index), `skeleton` (root node index).
  3. `assets/20261022T230304-120-0j7w/plan-scan-1-node.schema.json`: Node schema defining `children`, `translation`, `rotation` (unit quaternion $[x, y, z, w]$), `scale`, `matrix` ($4 \times 4$ column-major), `mesh`, `skin`.
  4. `assets/20261022T230304-120-0j7w/plan-scan-1-accessor.schema.json`: Accessor schema defining `componentType` (5121: `UNSIGNED_BYTE`, 5123: `UNSIGNED_SHORT`, 5126: `FLOAT`), `type` (`"SCALAR"`, `"VEC4"`, `"MAT4"`), `count`, `bufferView`, `byteOffset`, `min`, `max`.
  5. `assets/20261022T230304-120-0j7w/plan-scan-1-mesh.primitive.schema.json`: Mesh primitive schema defining `attributes` dictionary (`POSITION`, `NORMAL`, `TANGENT`, `TEXCOORD_0`, `JOINTS_0`, `WEIGHTS_0`), `indices`, `material`, `mode`.
  6. `assets/20261022T230304-120-0j7w/plan-scan-1-mesh.schema.json`: Mesh schema.
  7. `assets/20261022T230304-120-0j7w/plan-scan-1-bufferView.schema.json`: BufferView schema defining `buffer`, `byteOffset`, `byteLength`, `byteStride`, `target` (34962: `ARRAY_BUFFER`, 34963: `ELEMENT_ARRAY_BUFFER`).
  8. `assets/20261022T230304-120-0j7w/plan-scan-1-buffer.schema.json`: Buffer schema defining `byteLength`, `uri`.

### 3.2 Python Package Ecosystem (PyPI)
- **Source Endpoint:** `https://pypi.org/pypi/pygltflib/json`
- **Authentication:** None (public HTTPS GET).
- **HTTP Status:** `200 OK`
- **Artifacts Captured:**
  1. `assets/20261022T230304-120-0j7w/plan-scan-1-pygltflib-pypi-metadata.json`: Complete PyPI release metadata for `pygltflib` v1.16.5.
  2. `assets/20261022T230304-120-0j7w/plan-scan-1-pygltflib-1.16.5-py3-none-any.whl`: Standalone Python wheel enabling offline glTF 2.0 object modeling and serialization without Blender dependencies.

### 3.3 Node / Web Ecosystem (npm)
- **Source Endpoint:** `https://registry.npmjs.org/gltf-validator`
- **Authentication:** None (public HTTPS GET).
- **HTTP Status:** `200 OK`
- **Artifacts Captured:**
  1. `assets/20261022T230304-120-0j7w/plan-scan-1-gltf-validator-npm-metadata.json`: Official npm metadata for Khronos `gltf-validator`.
  2. `assets/20261022T230304-120-0j7w/plan-scan-1-gltf-validator-2.0.0-dev.3.10.tgz`: Full offline glTF validator package for automated acceptance criteria verification.

### 3.4 Discovered Local Reference Implementations (`/Users/diesel/Desktop/greek` Commit `0af4519`)
Reconnaissance of parallel repository historical commits revealed:
1. `skate3_archive_pipeline.py` (Commit `0af4519`): Contains the authoritative Python implementation of:
   - Skate 3 VBR DCT (`0x00524256`) and RAW (`0x00004452`) `.abin` decompressors (`parse_vbr_part`, `VBRPartDecoder`, `decode_clip_frame`, `decode_pose_frame`).
   - Pose evaluation against the canonical 35-joint hierarchy.
2. `rig_characters.py` (Commit `0af4519`, lines 720–1080): Contains the exact Skate 3 Clean-Room Master Rig (`Skate3_RX2_Rig`, 35 joints) skinning implementation:
   - Anatomical coordinate partitioning for PLATODOOM and LUIS.
   - Non-deforming joint masking: guarantees $w = 0.0$ on `SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheel nodes, and the 4 `_REPARENTED` IK socket nodes.
   - 4-bone influence selection via `np.argpartition(W, -4, axis=1)[:, -4:]`.
   - Strict sum-to-1.0 weight normalization ($W / \sum W$).
   - Fallback assignment of orphan vertices to `HIPS`.

---

## 4. Explicit Deficiency & Systemic Obstacle Register

In compliance with `INV-ABSENCE-01` and `RULE[user_global]`, the following gaps and architectural conflicts are surfaced:

1. **Deficiency: Missing Automated Pipeline Script for Spec 033 (`PLATODOOM_SKATE3_RIGGED.glb`):**
   - The workspace currently contains only `scripts/rig_characters.py` (which targets the legacy 65-bone Quaternius UAL rig) and `scripts/migrate_to_rpm_rig.py` (which migrated to 64-bone RPM).
   - No existing script in the workspace currently executes the automated rigging of `PLATODOOM_RAW.glb` to the 35-joint `SKATE3_RX2_RIG`, computes its lossless IBMs, and validates it against `.abin` maneuvers.
   - *Resolution Recommendation for `plan`:* Author a dedicated pipeline script (e.g. `scripts/rig_skate3_character.py` or updated `scripts/rig_characters.py`) combining the standalone glTF binary packing patterns of `migrate_to_rpm_rig.py` with the 35-joint skinning logic from `0af4519:rig_characters.py`.

2. **Systemic Obstacle: Host Shell Environment Lacks Standalone Blender CLI (`bpy`):**
   - Executing `which blender` in the local workspace returns non-zero (`blender not found`).
   - Probing the `blender-mcp` tool `get_addon_status` returned `Could not connect to Blender. Make sure the Blender addon is running.`
   - Legacy scripts (`scripts/rig_characters.py`, `scripts/builders/assemble_characters.py`) rely heavily on `import bpy`, `import bmesh`, and `import mathutils`.
   - *Resolution Recommendation for `plan`:* Implement the automated rigging and validation pipeline in pure Python using standard library (`struct`, `json`, `math`) and NumPy/vectorized geometry math (as successfully proven in `migrate_to_rpm_rig.py` and `build_stickers.py`), or provide a headless execution runner that does not depend on an external Blender GUI instance.

3. **Systemic Obstacle: `sandbox.js` `CharacterController` Invariant Conflict:**
   - In `sandbox.js` (lines 6705–6722), `CharacterController` explicitly asserts:
     - `this.skinnedMesh.skeleton.bones.length === 64` (throws fatal error otherwise).
     - Traverses all nodes and throws a fatal error if any node is named `SKATEBOARD_ROOT`, `TRUCK_FRONT`, or `TRUCK_BACK`:
       ```javascript
       if (node.name && (node.name.startsWith('Skateboard_') || node.name === 'SKATEBOARD_ROOT' || ...)) {
         raiseFatalError(`Character '${id}' contains prohibited legacy prop node '${node.name}'.`);
       }
       ```
   - Spec 033 explicitly requires the 35-joint `SKATE3_RX2_RIG` containing `SKATEBOARD_ROOT`, `TRUCK_FRONT`, and `TRUCK_BACK`.
   - If `PLATODOOM_SKATE3_RIGGED.glb` were loaded into `sandbox.js` without updating these assertions, the sandbox would immediately halt with a fatal error banner.
   - *Resolution Recommendation for `plan`:* Designate `sandbox.js` (lines 6705–6722) as a candidate `MANDATORY_TARGET` to support both 64-bone RPM characters and 35-joint Skate 3 clean-room characters, or clearly document that Spec 033 handoff targets the offline pipeline and the clean-room Bevy/WebGPU engine.

4. **Architectural Grounding: Reparented IK Target Node Hierarchy Invariant:**
   - In `functional_specification_033.md` section 4.1, the hierarchy tree diagram showed `LEFTHAND_REPARENTED`, `RIGHTHAND_REPARENTED`, `LEFTTOEBASE_REPARENTED`, and `RIGHTTOEBASE_REPARENTED` indented under hands and toes.
   - However, empirical examination of the canonical reference rig `20261019T213303-735-zjzk/plan-scan-2-skater.glb` reveals:
     - Joint 24 (`SKATEBOARD_ROOT`) has children: `[25 (TRUCK_FRONT), 28 (TRUCK_BACK), 31 (RIGHTTOEBASE_REPARENTED), 32 (LEFTTOEBASE_REPARENTED), 33 (LEFTHAND_REPARENTED), 34 (RIGHTHAND_REPARENTED)]`.
     - Joints 11 (`RIGHTHAND`), 15 (`LEFTHAND`), 19 (`RIGHTTOEBASE`), and 23 (`LEFTTOEBASE`) have empty children arrays (`children: []`).
   - *Resolution Recommendation for `plan`:* Enforce the authentic node hierarchy from `plan-scan-2-skater.glb` where the `_REPARENTED` solver targets reside under `SKATEBOARD_ROOT`.

---

## 5. Sufficiency & Scan Certification

In accordance with `LANGUAGE.md` `{sufficient}` and `{correctness}`:
- Every codebase file within the complete dependency cone of character loading, rigging, scene staging, and animation has been physically located and verified.
- The 35 joints of `SKATE3_RX2_RIG`, their exact node indices (0..34), rest-pose local TRS transforms, and column-major Inverse Bind Matrices have been extracted directly from `20261019T213303-735-zjzk/plan-scan-2-skater.glb`.
- The keyframe maneuvers (`R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `R_PUSHLSP_LSTR_N_0_CYC1`) have been verified in `skate3_full_animation_catalog.json` and traced to `plan-scan-2-OnBoard.abin`.
- Official Khronos glTF schemas and offline validation/parsing packages have been downloaded and verified on disk in `assets/20261022T230304-120-0j7w/plan-scan-1-*`.
- Zero speculative assumptions, unverified endpoints, or hallucinated schemas remain.

---

## 6. Handoff Manifest Affirmation

The dedicated role handoff manifest at `handoff/20261022T230304-120-0j7w/plan-scan-1.txt` has been atomically overwritten with exclusively:
- The qualified repository-relative paths of all reviewed codebase component files.
- The repository-relative path of this authored scan report (`wayfinder/20261022T230304-120-0j7w/plan-scan-1-report.md`).
- All saved external files, schemas, datasets, and packages in `assets/20261022T230304-120-0j7w/plan-scan-1-*`.
- Zero seed paths (`functional_specification_033.md`) recorded.

---

## 7. Coding Gate Affirmation

**DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.**
