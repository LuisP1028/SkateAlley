# Ticket 003: Pure-Python Binary `.abin` (VBR & RD) Keyframe Decoder, LBS Pose Evaluator, and Deterministic Verification Report Generator

- **Ticket ID**: `ticket-003`
- **Target Stage**: `implement` (Note: Independent test suite authoring and execution are strictly reserved for the dedicated `tester` stage under `INV-NO-SELF-TEST-01`.)
- **Upstream Specification Reference**: [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/functional_specification_033.md) §2, §3, §5 (Stage 6), §6, §9, §10 (AC-5)
- **Depends On**: `ticket-002`

---

## Objective

Implement the pure-Python Skate 3 binary animation (`.abin`) parser (`0x00524256` VBR variable-bitrate bitstream decoder and `0x00004452` RD uncompressed keyframe extractor), additive pose compositor (`pose_add` against `PHYS_TPOSE` from `plan-scan-2-physics-skeletons.json`), Linear Blend Skinning (LBS) keyframe evaluator, and deterministic verification report generator in [`scripts/rig_skate3_character.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/scripts/rig_skate3_character.py).

---

## Mandatory Target Deliverables (`MANDATORY_TARGET`)

| File Path | Action | Required Deliverable State |
| :--- | :--- | :--- |
| `scripts/rig_skate3_character.py` | Modify | Extend with `AbinDecoder` (`0x00524256` VBR and `0x00004452` RD clip extraction from `20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin` and `20261019T213303-735-zjzk/skate3_full_animation_catalog.json`), `evaluate_clip_deformation` (LBS vertex transformation, triangle quality & inversion audit, bounding-box sanity check, and anatomical trajectory validation), and `generate_verification_report` outputting the structured JSON audit schema. |

---

## Read-Only Discovery Context (`READ_ONLY_CONTEXT`)

| File Path | Role in Discovery / Reference |
| :--- | :--- |
| `functional_specification_033.md` | Authoritative specification for Stage 6 Binary Animation Deformation Verification (§5 Stage 6, §9, §10 AC-5). |
| `LANGUAGE.md` | Authoritative domain vocabulary (`{correct required outputs}`, `{errors}`). |
| `20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin` | Authoritative 3.04 MB Skate 3 binary animation bank (`3,646` TOC blocks: `3,643` clips, `1` hierarchy block `type_id=4`, `2` string tables `type_id=101`). |
| `20261019T213303-735-zjzk/skate3_full_animation_catalog.json` | Decompressed animation catalog mapping 3,643 clip names to TOC index, byte offset, codec (`0x00524256` VBR or `0x00004452` RD), frame count, duration, and channel count. |
| `20261019T213303-735-zjzk/plan-scan-2-physics-skeletons.json` | Physics rest skeleton (`PHYS_TPOSE`) defining base joint offset vectors and bone lengths for additive delta clips (`OLLIE_HIGH_G`, `OLLIE_HIGH_A`, etc.). |
| `20261019T213303-735-zjzk/skate3_state_graph.json` | Stategraph contract referencing active motion states (`State_Crouch`, `State_Ollie`, `State_Ride`). |
| `assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json` | Captured `.abin` target maneuver metadata (`R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `OLLIE_HIGH_A`, `R_PUSHLSP_LSTR_N_0_CYC1`). |

---

## Functional & Mathematical Requirements

### 1. Binary `.abin` Clip Parser (`0x00524256` VBR & `0x00004452` RD)
- Parse the 32-byte `.abin` header and 16-byte TOC entries in [`20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/plan-scan-2-OnBoard.abin) and cross-reference named clips in [`20261019T213303-735-zjzk/skate3_full_animation_catalog.json`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/skate3_full_animation_catalog.json):
  - **`R_IDLE_RIDE_N_0_CYC`**: TOC `2621`, offset `2379424`, codec `0x00524256` (VBR), `38` frames, `72` channels (`1.233s`).
  - **`R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`**: TOC `1625`, offset `1623648`, codec `0x00524256` (VBR), `12` frames, `72` channels (`0.367s`).
  - **`OLLIE_HIGH_G`**: TOC `1476`, offset `1511104`, codec `0x00004452` (RD additive delta), `6` frames, `54` channels (`0.167s`).
  - **`OLLIE_HIGH_A`**: TOC `1474`, offset `1509184`, codec `0x00004452` (RD additive delta), `21` frames, `54` channels (`0.667s`).
  - **`R_PUSHLSP_LSTR_N_0_CYC1`**: TOC `2819`, offset `2597776`, codec `0x00524256` (VBR), `24` frames, `70` channels (`0.767s`).
  - **Grab Pose Verification**: Decode a board-grab clip from `plan-scan-2-OnBoard.abin` / `skate3_full_animation_catalog.json` (plus synthetic or decoded grab socket verification on `LEFTHAND_REPARENTED` / `RIGHTHAND_REPARENTED`) to verify hand-to-board socket tracking.
- Decode `0x00524256` (`VBR`) blocks using the clean-room `VBRPartDecoder` bitstream layout (header offsets, palette table, initial values, frame run-lengths, per-channel bitwidths, and dequantized quaternion/translation tracks across the 36 `.abin` bones where `.abin` indices `1..35` map 1-to-1 to glTF joint indices `0..34`).
- Decode `0x00004452` (`RD`) uncompressed additive delta blocks (`_raw_extract_frame`) and compose them onto `PHYS_TPOSE` (`pose_add`) so additive clips (`OLLIE_HIGH_G` and `OLLIE_HIGH_A`) yield full-body world-space joint matrices $W_{\text{anim}}^{(j)}(t)$.

### 2. Linear Blend Skinning (LBS) Evaluation & Geometric Quality Audit (`Stage 6`, §5, §9, §10 AC-5)
- For each verified maneuver and sampled keyframe $t$ (rest frame, first frame, midpoint/apex frame, final frame):
  1. Compute the skinning palette matrix for every joint $j \in \{0, \dots, 34\}$:
     $$M_j(t) = W_{\text{anim}}^{(j)}(t) \times \text{IBM}_j$$
  2. Transform every vertex $v_i \in \mathbb{R}^3$ via 4-bone Linear Blend Skinning:
     $$v'_i(t) = \sum_{k=0}^{3} w_{i,k} \left( M_{j_{i,k}}(t) \, [v_i, 1]^T \right)_{xyz}$$
  3. Verify deformation invariants across all deformed vertices and triangles:
     - Zero `NaN` or `Inf` vertex coordinates.
     - Bounding-box sanity: deformed mesh AABB dimensions $\Delta X, \Delta Y, \Delta Z$ remain strictly within $(0.10\text{ m}, 3.00\text{ m})$ (no vertex explosions to infinity or collapse to $(0,0,0)$).
     - Triangle collapse check: non-degenerate rest triangles maintain positive area ($\text{area}(t) > 10^{-12}\text{ m}^2$) and zero catastrophic limb inversion (`inverted_ limb_count == 0`, mean normal coherence $> 0.70$ on rigid limb segments).
     - Specific maneuver physical signatures (§9):
       - **Rest Pose (`BIND_REST_POSE`)**: $\max_i \|v'_i - v_i\|_2 < 0.001\text{ mm}$ ($10^{-6}\text{ m}$).
       - **Riding Idle (`R_IDLE_RIDE_N_0_CYC`)**: Feet (`LEFTFOOT`/`RIGHTFOOT`/`LEFTTOEBASE`/`RIGHTTOEBASE` vertices) remain planted on deck height with smooth upper-body respiration/balance modulation and zero mesh tearing.
       - **Crouch Setup (`R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`)**: `HIPS` descends along $-Y$ ($\Delta Y < -0.05\text{ m}$ relative to standing rest height), knees (`LEFTLEG`/`RIGHTLEG`) flex forward, and spine pitches forward cleanly without pelvis collapse.
       - **Ollie Pop & Apex (`OLLIE_HIGH_G` & `OLLIE_HIGH_A`)**: Back ankle (`RIGHTFOOT`/`RIGHTTOEBASE`) extends downward while front knee (`LEFTLEG`/`LEFTFOOT`) lifts upward, with zero cross-leg mesh bridging between left and right inner thighs.
       - **Pushing (`R_PUSHLSP_LSTR_N_0_CYC1`)**: Pushing leg swings through full stride cycle while board-planted leg remains stable on the deck without pelvic shearing.
       - **Grab & Socket Tracking (`LEFTHAND_REPARENTED`, `RIGHTHAND_REPARENTED`, `LEFTTOEBASE_REPARENTED`, `RIGHTTOEBASE_REPARENTED`)**: Non-deforming socket transforms track board/extremity kinematics cleanly while contributing `0.0` direct vertex deformation weight.

### 3. Deterministic Verification Report Schema (`PLATODOOM_SKATE3_VERIFICATION_REPORT.json`)
- Emit a deterministic JSON verification report containing:
  - Pipeline metadata (`specification`: `"functional_specification_033"`, `rig_name`: `"Skate3_RX2_Rig"`, `joint_count`: `35`, execution timing in seconds).
  - Per-character audit records (`PLATODOOM_SKATE3_RIGGED.glb` and `LUIS_SKATE3_RIGGED.glb`):
    - `total_vertices`, `primitive_count`, `orphan_vertex_count` (`0`), `skinning_coverage_pct` (`100.0`).
    - `max_influences_per_vertex` (`4`), `joints_accessor_component_type` (`5123`), `weights_accessor_component_type` (`5126`), `max_weight_sum_deviation` ($\le 10^{-6}$), `non_deform_socket_weight_sum` (`0.0`).
    - `max_ibm_identity_residual` ($\le 10^{-5}$), `min_bind_det_abs` ($> 10^{-6}$), `rest_pose_max_drift_mm` ($< 0.001$).
    - `stature_m` ($\in [1.75, 1.85]$), `min_y_m` ($\approx 0.0$), `file_size_bytes`, `raw_baseline_bytes`, `size_overhead_pct` ($\le 15.0\%$).
    - `maneuver_validations`: detailed keyframe deformation metrics for `R_IDLE_RIDE_N_0_CYC`, `R_ANTIC_CROUCH_HIGHOLLIE_N_0_INTO`, `OLLIE_HIGH_G`, `OLLIE_HIGH_A`, `R_PUSHLSP_LSTR_N_0_CYC1`, and socket tracking (`passed: true` on all maneuvers).
