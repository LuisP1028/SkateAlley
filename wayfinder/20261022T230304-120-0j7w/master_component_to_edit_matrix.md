# Master Component-to-Edit Matrix (`functional_specification_033.md`)

- **Run ID**: `20261022T230304-120-0j7w`
- **Upstream Specification**: [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/functional_specification_033.md)
- **Domain Vocabulary**: [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/LANGUAGE.md)
- **Target Implementation Stage**: `implement` (Note: Independent test suite authoring and execution are strictly reserved for `tester` under `INV-NO-SELF-TEST-01`.)

---

## 1. Mandatory Target Deliverables (`MANDATORY_TARGET`)

Every file in the `MANDATORY_TARGET` table below is an authoritative functional deliverable required to realize [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/functional_specification_033.md) end-to-end across both the offline asset preparation/verification pipeline and the live Three.js/WebGL2 runtime. The `implement` stage MUST create or modify each of these files and mark them `CHANGED`.

| File Path | Category | Action (`implement`) | Owning Ticket(s) | Functional Responsibility & Target Deliverable Contract |
| :--- | :--- | :--- | :--- | :--- |
| `scripts/rig_skate3_character.py` | `MANDATORY_TARGET` | Create (`CHANGED`) | `ticket-001`, `ticket-002`, `ticket-003`, `ticket-004` | Pure-Python automated 35-joint `SKATE3_RX2_RIG` rigging pipeline: binary `.glb` reader/writer, metric coordinate normalizer ($Y_{\min}=0.000\text{ m}$, height $1.8000\text{ m} \in [1.75\text{ m}, 1.85\text{ m}]$), degenerate triangle sanitizer ($\text{area} < 10^{-10}\text{ m}^2$), attribute/material/texture preserver & synthesizer, anatomical 24-deform-bone weight solver (`0..23`), 11-socket zero-weight lock (`24..34`), lossless $35\times 4\times 4$ `inverseBindMatrices` solver ($\|W_{\text{bind}} \times \text{IBM} - I_4\|_\infty \le 10^{-5}$), binary `.abin` (`0x00524256` VBR & `0x00004452` RD) keyframe deformation evaluator, and JSON report emitter. Runs in $< 5.0\text{ s}$ (budget $< 30.0\text{ s}$) with zero `bpy` dependency. |
| `scripts/rig_characters.py` | `MANDATORY_TARGET` | Modify (`CHANGED`) | `ticket-004` | Guard top-level `bpy`/`bmesh`/`mathutils` imports so standard Python execution never crashes with `ModuleNotFoundError: No module named 'bpy'`, re-export `scripts/rig_skate3_character.py` functions/constants, and invoke `build_all_skate3_deliverables()` when executed directly in pure Python. |
| `PLATODOOM_SKATE3_RIGGED.glb` | `MANDATORY_TARGET` | Create (`CHANGED`) | `ticket-004` | Standalone clean-room compliant 35-joint `SKATE3_RX2_RIG` rigged `PLATODOOM` character `.glb` containing normalized geometry ($1.8000\text{ m}$ stature, $Y_{\min}=0.0000\text{ m}$), preserved PBR materials & textures, `POSITION`, `NORMAL`, `TEXCOORD_0`, `JOINTS_0` (`5123` `UNSIGNED_SHORT` `VEC4`), `WEIGHTS_0` (`5126` `FLOAT` `VEC4`, $\sum w = 1.0 \pm 10^{-6}$, 0 orphans, 0 socket weights), 35-joint `inverseBindMatrices`, and file size $\le 1.15 \times$ raw mesh baseline. |
| `LUIS_SKATE3_RIGGED.glb` | `MANDATORY_TARGET` | Create (`CHANGED`) | `ticket-004` | Companion standalone clean-room compliant 35-joint `SKATE3_RX2_RIG` rigged `LUIS` + `DOOM_Companion` character `.glb` containing 2 primitives (`Luis_Body` and `DOOM_Companion`), preserved PBR materials & textures, `POSITION`, `NORMAL`, `TEXCOORD_0`, `JOINTS_0` (`5123`), `WEIGHTS_0` (`5126`), 35-joint `inverseBindMatrices`, and file size $\le 1.15 \times$ unrigged baseline. |
| `PLATODOOM_SKATE3_VERIFICATION_REPORT.json` | `MANDATORY_TARGET` | Create (`CHANGED`) | `ticket-003`, `ticket-004` | Deterministic JSON verification report auditing `PLATODOOM_SKATE3_RIGGED.glb`, `LUIS_SKATE3_RIGGED.glb`, and direct `PLATODOOM_RAW.glb` skinning: vertex counts, 100% skinning coverage (0 orphans), 4-weight sum $= 1.0 \pm 10^{-6}$, non-deform socket weights $= 0.0$, IBM identity residual $\le 10^{-5}$, rest-pose drift $< 0.001\text{ mm}$, and `.abin` keyframe deformation verification across `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `OLLIE_HIGH_A`, `R_PUSHLSP_LSTR_N_0_CYC1`, and grab sockets. |
| `sandbox.js` | `MANDATORY_TARGET` | Modify (`CHANGED`) | `ticket-005` | Live Three.js/WebGL2 runtime integration: register `platodoom_skate3` (`./PLATODOOM_SKATE3_RIGGED.glb`) and `luis_skate3` (`./LUIS_SKATE3_RIGGED.glb`) in `ASSET_PATHS` and `GLB_VARIANT_CATALOG`, define `SKATE3_REQUIRED_MASTER_RIG_BONES` (35 canonical joints), and update `CharacterController` skeleton validation, prop check, and bone alias mapping so both 64-bone RPM rigs and 35-joint `SKATE3_RX2_RIG` rigs instantiate and animate cleanly. |
| `index.html` | `MANDATORY_TARGET` | Modify (`CHANGED`) | `ticket-005` | Add `platodoom_skate3` and `luis_skate3` `<option>` entries to `#glb-variant-select` in the HUD character selector. |

---

## 2. Read-Only Discovery Context (`READ_ONLY_CONTEXT`)

The files listed in the `READ_ONLY_CONTEXT` table below are upstream specifications, authoritative Skate 3 clean-room reference artifacts, existing 64-bone runtime assets (preserved for backward compatibility), and captured planning schemas. They are strictly **read-only context** (`UNCHANGED`) and MUST NOT be modified or deleted by `implement`.

| File Path | Category | Required State (`implement`) | Role in System / Discovery |
| :--- | :--- | :--- | :--- |
| `functional_specification_033.md` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Single authoritative functional specification seed. |
| `LANGUAGE.md` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Authoritative domain vocabulary (`{functionality}`, `{correctness}`, `{correct required outputs}`, `{errors}`, `{sufficient}`, `{insufficient}`). |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Canonical 35-joint Skate 3 reference rig (`Skate3_RX2_Rig`, nodes `0..34`, skin `0`, local bind matrices, and reference IBMs). |
| `20261019T213303-735-zjzk/plan-scan-2-physics-skeletons.json` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Physics rest skeleton (`PHYS_TPOSE`) defining base joint offset vectors and bone lengths for additive `.abin` clips. |
| `20261019T213303-735-zjzk/skateboard_prop.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Skateboard vehicle reference (`Skateboard_Root` and truck/wheel node hierarchy). |
| `20261019T213303-735-zjzk/skate3_state_graph.json` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Skate 3 stategraph contract referencing active motion states. |
| `20261019T213303-735-zjzk/skate3_full_animation_catalog.json` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Decompressed Skate 3 animation catalog (`3,643` clips with `.abin` TOC indices, byte offsets, codecs, frame counts, and durations). |
| `20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Binary Skate 3 animation archive (`3,646` TOC blocks: `0x00524256` VBR and `0x00004452` RD keyframe payloads). |
| `PLATODOOM_RAW.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Raw unrigged static humanoid character mesh (`306,806` vertices, `11,046,620` bytes). |
| `PLATODOOM_HOLOSYS_RIGGED.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Existing 64-bone default character asset and source of assembled textured `PLATODOOM` mesh (`9,735` vertices, PBR material & 2 PNG textures). Preserved untouched for default corridor startup. |
| `LUIS_HOLOSYS_RIGGED.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Existing 64-bone companion character asset. Preserved untouched for default corridor startup. |
| `PLATODOOM_RIGGED.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Existing 64-bone legacy variant. Preserved untouched. |
| `LUIS_RIGGED.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Existing 64-bone legacy variant. Preserved untouched. |
| `LUIS_DECIMATED_STANDALONE.glb` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Existing 64-bone standalone `LUIS` + `DOOM_Companion` asset (`14,905` vertices, 2 primitives, 2 PBR materials & 2 PNG textures). Preserved untouched. |
| `assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Planning-stage extracted 35-joint `Skate3_RX2_Rig` contract (joint indices `0..34`, parent links, local matrices, world bind positions, column-major IBMs, and `.abin` clip metadata). |
| `assets/20261022T230304-120-0j7w/plan-gltf-skin.schema.json` | `READ_ONLY_CONTEXT` | `UNCHANGED` | Official Khronos glTF 2.0 `skin.schema.json` specification. |

---

## 3. Detailed Per-Component Edit Specifications

### 3.1 `scripts/rig_skate3_character.py` (`MANDATORY_TARGET` — Create in `ticket-001`..`ticket-004`)
- **Purpose**: Self-contained, pure-Python implementation of the 6-stage `SKATE3_RX2_RIG` rigging, IBM computation, and `.abin` binary keyframe deformation verification pipeline.
- **Required Public Constants & Functions**:
  - `SKATE3_JOINT_NAMES: list[str]` — Exact 35 joint names in index order `0..34` matching `plan-scan-2-skater.glb`.
  - `SKATE3_DEFORM_BONE_INDICES: tuple[int, ...]` — `tuple(range(24))` (`0..23`, `HIPS` through `LEFTTOEBASE`).
  - `SKATE3_SOCKET_BONE_INDICES: tuple[int, ...]` — `tuple(range(24, 35))` (`24..34`, `SKATEBOARD_ROOT` through `RIGHTHAND_REPARENTED`).
  - `load_skate3_rig_contract(ref_glb_path=..., contract_json_path=...) -> dict` — Loads the 35-joint hierarchy, local matrices $L_{\text{bind}}^{(j)}$, world bind matrices $W_{\text{bind}}^{(j)}$, world bind joint positions, and exact column-major $\text{IBM}_j = (W_{\text{bind}}^{(j)})^{-1}$, asserting $\max_j \|W_{\text{bind}}^{(j)} \times \text{IBM}_j - I_4\|_\infty \le 10^{-5}$ and $|\det(W_{\text{bind}}^{(j)})| > 10^{-6}$.
  - `normalize_and_sanitize_mesh(positions, indices, normals=None, uvs=None, target_height=1.80) -> dict` — Scales and translates vertex positions to $+Y$-up, $+Z$-forward, $-X$-right with $Y_{\min} = 0.0000\text{ m}$, height $= 1.8000\text{ m} \in [1.75\text{ m}, 1.85\text{ m}]$, lateral center $(0.0, 0.0)$, repairs degenerate zero-area triangles ($\text{area} < 10^{-10}\text{ m}^2$), and preserves or synthesizes unit normals (`NORMAL`) and `TEXCOORD_0` UVs with zero `NaN`/`Inf`.
  - `compute_skate3_skin_weights(positions, rig_contract) -> tuple[list[tuple[int,int,int,int]], list[tuple[float,float,float,float]]]` — Computes anatomically partitioned 4-bone weights across deform bones `0..23` (enforcing sagittal plane $X=0$ left/right leg isolation, torso-vs-arm isolation, pelvis/glute protection, and volumetric accessory fallback) while locking non-deforming sockets `24..34` to `0.0`, sorting descending $w_0 \ge w_1 \ge w_2 \ge w_3 \ge 0$, and normalizing in `float32` so $|\sum_{k=0}^3 w_{v,k} - 1.0| \le 10^{-6}$ for 100% of vertices with 0 orphans.
  - `AbinDecoder` & `evaluate_clip_deformation(glb_data, abin_path, catalog_path, phys_skeleton_path, clip_names=...) -> dict` — Decodes `0x00524256` (VBR) and `0x00004452` (RD additive delta composed onto `PHYS_TPOSE`) clips from `plan-scan-2-OnBoard.abin`, evaluates 4-bone LBS across sampled keyframes of `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `OLLIE_HIGH_A`, `R_PUSHLSP_LSTR_N_0_CYC1`, and grab sockets, and verifies zero vertex explosions, zero limb inversions, and expected kinematic displacements.
  - `rig_glb_to_skate3(input_glb_path, output_glb_path, ..., enforce_size_budget=True) -> dict` — End-to-end static `.glb` to 35-joint `SKATE3_RX2_RIG` `.glb` converter supporting any input `.glb` (`PLATODOOM_RAW.glb`, textured `PLATODOOM`, textured `LUIS`, or synthetic test meshes).
  - `verify_skate3_glb(glb_path, raw_baseline_bytes=None, abin_path=..., catalog_path=..., phys_skeleton_path=...) -> dict` — Runs all structural, mathematical, and `.abin` keyframe deformation checks on a rigged `.glb` and returns a structured audit dictionary (raising a fail-fast diagnostic exception if any invariant fails).
  - `build_all_skate3_deliverables() -> dict` — Generates `PLATODOOM_SKATE3_RIGGED.glb`, `LUIS_SKATE3_RIGGED.glb`, and `PLATODOOM_SKATE3_VERIFICATION_REPORT.json` in $< 30.0\text{ s}$.

### 3.2 `scripts/rig_characters.py` (`MANDATORY_TARGET` — Modify in `ticket-004`)
- **Purpose**: Existing repository rigging script currently failing at import time when run outside Blender (`ModuleNotFoundError: No module named 'bpy'`).
- **Required Edits**:
  - Guard `bpy`, `bmesh`, and `mathutils` imports inside a `try ... except ImportError:` block (`HAS_BLENDER = False`).
  - Import and re-export `SKATE3_JOINT_NAMES`, `SKATE3_DEFORM_BONE_INDICES`, `SKATE3_SOCKET_BONE_INDICES`, `load_skate3_rig_contract`, `compute_skate3_skin_weights`, `rig_glb_to_skate3`, `verify_skate3_glb`, and `build_all_skate3_deliverables` from `scripts/rig_skate3_character.py`.
  - When executed as `__main__` outside Blender (or with `--skate3`), run `build_all_skate3_deliverables()`.

### 3.3 `PLATODOOM_SKATE3_RIGGED.glb` & `LUIS_SKATE3_RIGGED.glb` (`MANDATORY_TARGET` — Create in `ticket-004`)
- **Purpose**: Standalone clean-room 35-joint `SKATE3_RX2_RIG` rigged character deliverables.
- **Required Contract**:
  - Valid glTF 2.0 binary `.glb` (`version == 2`, 4-byte aligned buffer views and accessors).
  - Scene root `Skate3_RX2_Rig` parenting the 35 canonical joints (`nodes[0..34]`) and skinned mesh node(s) (`nodes[35+]`).
  - `skins[0].joints == list(range(35))` with exact canonical names `HIPS` (`0`) through `RIGHTHAND_REPARENTED` (`34`).
  - `skins[0].inverseBindMatrices` referencing a 35-element `MAT4` `FLOAT` (`5126`) accessor (`2,240` bytes) with $\max_j \|W_{\text{bind}}^{(j)} \times \text{IBM}_j - I_4\|_\infty \le 10^{-5}$.
  - Every mesh primitive contains `POSITION`, `NORMAL`, `TEXCOORD_0`, `JOINTS_0` (`5123` `UNSIGNED_SHORT` `VEC4`), `WEIGHTS_0` (`5126` `FLOAT` `VEC4`), and valid material indices preserving PBR textures.
  - File size overhead $\le 15\%$ relative to the unrigged mesh baseline (`PLATODOOM_SKATE3_RIGGED.glb` $\le 2,545,612$ bytes and $\le 12,703,613$ bytes; `LUIS_SKATE3_RIGGED.glb` $\le 6,078,821$ bytes).

### 3.4 `PLATODOOM_SKATE3_VERIFICATION_REPORT.json` (`MANDATORY_TARGET` — Create in `ticket-003` & `ticket-004`)
- **Purpose**: Deterministic verification report required by `functional_specification_033.md` §2 (`{correct required outputs}` #2) and §9.
- **Required Contract**:
  - Logs total vertices processed (`PLATODOOM_SKATE3_RIGGED.glb`, `LUIS_SKATE3_RIGGED.glb`, and `PLATODOOM_RAW.glb` 306,806-vertex audit), 100% skinning coverage (`orphan_vertex_count: 0`), 4-weight clamping & normalization audit (`max_weight_sum_deviation <= 1e-6`, `non_deform_socket_weight_sum == 0.0`), rest-pose vertex drift (`rest_pose_max_drift_mm < 0.001`), and keyframe deformation delta checks against `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `OLLIE_HIGH_A`, `R_PUSHLSP_LSTR_N_0_CYC1`, and grab sockets.

### 3.5 `sandbox.js` & `index.html` (`MANDATORY_TARGET` — Modify in `ticket-005`)
- **Purpose**: Live Three.js/WebGL2 runtime integration of the 35-joint `SKATE3_RX2_RIG` character deliverables.
- **Required Edits**:
  - Add `platodoom_skate3` (`./PLATODOOM_SKATE3_RIGGED.glb`) and `luis_skate3` (`./LUIS_SKATE3_RIGGED.glb`) to `ASSET_PATHS`, `GLB_VARIANT_CATALOG` (`sandbox.js`), and `#glb-variant-select` (`index.html`).
  - Add `SKATE3_REQUIRED_MASTER_RIG_BONES` (35 canonical bone names) to `sandbox.js` and update `CharacterController` so both 64-bone RPM rigs (`RPM_64`) and 35-joint Skate 3 Master Rigs (`SKATE3_RX2_RIG`) pass skeletal validation, resolve bone aliases (`Hips -> HIPS`, etc.), and animate cleanly without missing-bone panics or legacy prop-mesh false positives.
