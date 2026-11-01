# Functional Specification 064: Post-Assembly 3D Skeleton Metrics Extraction (`skeleton_metrics`) & Proportion-Tailored Multi-Game Auto-Rigging

## 1. System Purpose & Core Objective

This specification defines the desired `{functionality}`, 3D anatomical landmark measurement mathematics, JSON telemetry schema contracts, pose-matched Google Cloud Storage (`gs://3d-banana-player-assets`) intake routing, operational budgets, failure-isolation boundaries, and verifiable `{correct required outputs}` for measuring each assembled character's true 3D skeleton proportions during Stage 4 assembly and using those exact per-character metrics to tailor Stage 5 auto-rigging across all five target game engines:

1. **The Alleyway Hub** ([`scripts/rig_characters.py`](file:///Users/diesel/desktop/skatealley/scripts/rig_characters.py) & [`scripts/migrate_to_rpm_rig.py`](file:///Users/diesel/desktop/skatealley/scripts/migrate_to_rpm_rig.py))
2. **Skate 3** ([`scripts/rig_skate3_character.py`](file:///Users/diesel/desktop/skatealley/scripts/rig_skate3_character.py))
3. **GTA: Vice City** ([`scripts/compile_luis_revcdos_player.py`](file:///Users/diesel/desktop/skatealley/scripts/compile_luis_revcdos_player.py))
4. **Call of Duty: Nazi Zombies** ([`scripts/compile_luis_zombies_mdl.py`](file:///Users/diesel/desktop/skatealley/scripts/compile_luis_zombies_mdl.py))
5. **Super Smash Bros. Melee** ([`scripts/rig_melee_character.py`](file:///Users/diesel/desktop/skatealley/scripts/rig_melee_character.py))

**DO NOT CODE YET.** This document specifies functional behavior, mathematical landmark formulations, JSON schema invariants, operational budgets, and acceptance criteria only. It contains zero implementation code, concrete syntax, or mechanical diffs.

---

## 2. Authoritative Domain Vocabulary Alignment (`LANGUAGE.md`)

All evaluations of system state, operational constraints, and verification gates within this specification strictly adhere to the authoritative taxonomy established in [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{functionality}`**:
  1. Immediately after Stage 4 ([`scripts/builders/assemble_characters.py`](file:///Users/diesel/desktop/skatealley/scripts/builders/assemble_characters.py)) joins `head.glb` with `body_apose.glb` and/or `body_tpose.glb` and standardizes standing stature to $2.000\text{ m}$ ($Z_{\min} = 0.000\text{ m}$), the assembler directly measures the unified character mesh's 3D anatomical joint centers, bone segment lengths, limb axis unit vectors, and cross-sectional radii, and writes a structured `skeleton_metrics` block into `assembly_telemetry.json`, `assembly_apose_telemetry.json`, and `assembly_tpose_telemetry.json`.
  2. Stage 5 intake ([`scripts/gcs_rig_intake.py`](file:///Users/diesel/desktop/skatealley/scripts/gcs_rig_intake.py)) automatically resolves the pose-matched assembled mesh (`character_apose.glb` for A-pose game targets, `character_tpose.glb` for T-pose game targets, and `03_meshes/{head,arms,feet}/` for modular/spherical game targets) alongside its corresponding `skeleton_metrics` JSON payload from `gs://3d-banana-player-assets/players/{player_slug}_{player_id}/runs/{run_id}/03_meshes/assembled/`.
  3. All five downstream game auto-riggers consume the character's measured `skeleton_metrics` to place native joints, compute bone-segment retargeting transforms, and parameterize skinning weight envelopes tailored to that character's true anatomical proportions rather than relying on hardcoded height percentages or fixed character constants.
- **`{correctness}`**:
  - Every anatomical joint coordinate in `skeleton_metrics` is emitted in both canonical $2.000\text{ m}$ **Blender $Z$-up** (`[x, y_depth, z_up]`, $z_{\text{up}} \in [0.000, 2.000]\text{ m}$) and **glTF $Y$-up** (`[x, y_up, z_fwd]`, $y_{\text{up}} \in [0.000, 2.000]\text{ m}$, where $y_{\text{up}} = z_{\text{up}}$ and $z_{\text{fwd}} = -y_{\text{depth}}$) so both Blender-based riggers and pure NumPy/glTF binary compilers consume exact coordinates without axis-conversion ambiguity.
  - The measured crotch bifurcation height ($Z_{\text{crotch}}$), hip joint centers, knee centers, ankle centers, shoulder acromion sockets, elbow centers, wrist centers, and neck/collar junction reflect the actual 3D geometry of each individual character (e.g., distinguishing a low-inseam baggy-sweatpants mesh with $Z_{\text{crotch}} \approx 0.66\text{ m}$ from a fitted-pants mesh with $Z_{\text{crotch}} \approx 0.73\text{ m}$, and an A-pose arm corridor from a horizontal T-pose arm corridor).
  - Downstream auto-riggers preserve $100\%$ of target-game binary and hardware constraints (`INV-GX-10ENV-01` for Melee, 69-bone `Skate3_RX2_Rig` compatibility for Skate 3, 31-bone `RpHAnimHierarchy` for GTA Vice City, MDL v6 polygon/frame limits for Zombies, and 45-bone RPM animation retargeting for The Alleyway).
- **`{correct required outputs}`**:
  1. Enriched Stage 4 telemetry manifests (`assembly_telemetry.json`, `assembly_apose_telemetry.json`, `assembly_tpose_telemetry.json`) in `gs://3d-banana-player-assets/players/{player_slug}_{player_id}/runs/{run_id}/03_meshes/assembled/` and `<output_dir>/meshes/assembled/` containing a validated `skeleton_metrics` object for each assembled pose.
  2. Updated Stage 5 intake payload from [`scripts/gcs_rig_intake.py`](file:///Users/diesel/desktop/skatealley/scripts/gcs_rig_intake.py) providing pose-matched `.glb` paths (`apose` vs. `tpose`), optional modular limb `.glb` paths (`head.glb`, `arms.glb`, `feet.glb`), and a populated `skeleton_metrics` dictionary (synthesizing `skeleton_metrics` on the fly in $<0.25\text{ s}$ if a standalone local `.glb` is supplied without a telemetry file).
  3. Proportion-tailored rigged deliverables across all 5 target games (`04_rigged/{alleyway,skate3,gta,zombies,melee}/`) accompanied by `rig_telemetry.json` recording the exact `skeleton_metrics` joint coordinates consumed during rigging.
- **`{errors}`**:
  - Hardcoding fixed vertical heights for pelvis (`0.920m`), knees (`0.528m` or `0.560m`), shoulders (`1.540m`), or elbows (`±0.340, 1.230`) when `skeleton_metrics` provides the character's true measured joint coordinates.
  - Mixing Blender $Z$-up coordinates with glTF $Y$-up coordinates without explicit coordinate-frame selection (`joints_z_up` vs. `joints_y_up`).
  - Feeding an A-pose assembled mesh (`character_apose.glb`) into a T-pose game compiler (or vice-versa) when the pose-matched assembled mesh (`character_tpose.glb` or `character_apose.glb`) already exists in `03_meshes/assembled/`.
  - Allowing cranial or facial vertices (`_IS_HEAD_PART == 1.0` or $Z \ge Z_{\text{neck}}$) to influence torso/shoulder landmark medians or receive non-head bone weights.
- **`{sufficient}`**: Complete mathematical formulation of the 3D anatomical landmark profiler, authoritative JSON schema for `skeleton_metrics`, deterministic pose-routing matrix across all 5 target games, per-rigger retargeting contracts, operational budgets, and objective verification criteria.
- **`{insufficient}`**: Any specification that leaves landmark extraction to arbitrary percentage-of-height rules, omits dual coordinate-system representations ($Z$-up and $Y$-up), or fails to specify how each of the 5 game riggers consumes `skeleton_metrics`.

---

## 3. First-Principles Empirical Baseline: Why Percentage Heuristics Fail

Direct 3D cross-sectional profiling of two standardized $2.000\text{ m}$ assembled characters in the workspace demonstrates why fixed percentage-of-height constants misplace joints across real player scans:

| Anatomical Landmark (Standardized $2.000\text{ m}$ Space) | Legacy Hardcoded Constant | Measured on `NICOTEST_APOSE` (`nicotest_nt01`) | Measured on `LUIS_TPOSE` (`Luis_BODY_COLOR`) | Physical Discrepancy vs. Legacy Constant |
| :--- | :---: | :---: | :---: | :--- |
| **Crotch Bifurcation Height ($Z_{\text{crotch}}$)** | `0.9200 m` | `0.7300 m` | `0.6600 m` | Legacy constant is **$+19\text{ to }+26\text{ cm}$ too high** (inside the abdomen) |
| **Hip Socket Center ($X_{\text{hip}}, Z_{\text{hip}}$)** | `(0.1200, 0.9250) m` | `(0.1543, 0.7850) m` | `(0.1138, 0.7150) m` | **$21\text{ cm}$ vertical & $4\text{ cm}$ lateral variance** between baggy vs. regular pants |
| **Knee Joint Center ($X_{\text{knee}}, Z_{\text{knee}}$)** | `(0.1200, 0.5280) m` | `(0.1662, 0.4220) m` | `(0.1302, 0.3776) m` | Legacy knee bends across the **mid-thigh** ($+10.6\text{ to }+15.0\text{ cm}$ too high) |
| **Ankle Joint Center ($X_{\text{ankle}}, Z_{\text{ankle}}$)** | `(0.1350, 0.1050) m` | `(0.1916, 0.1014) m` | `(0.1451, 0.0908) m` | Stance width varies by **$9.3\text{ cm}$** across character builds |
| **Shoulder Acromion ($X_{\text{sh}}, Z_{\text{sh}}$)** | `(0.1900, 1.5050) m` | `(0.1979, 1.4429) m` | `(0.1872, 1.5374) m` | **$9.5\text{ cm}$ vertical shift** between relaxed A-pose and hunched hoodie T-pose |
| **Elbow Pivot ($X_{\text{el}}, Z_{\text{el}}$)** | `(0.3400, 1.2300) m` | `(0.3420, 1.3605) m` | `(0.4396, 1.5352) m` | **$30.5\text{ cm}$ vertical & $9.8\text{ cm}$ lateral shift** between A-pose and T-pose |
| **Wrist Pivot ($X_{\text{wr}}, Z_{\text{wr}}$)** | `(0.5050, 1.0300) m` | `(0.5038, 0.9586) m` | `(0.7127, 1.5288) m` | **$57.0\text{ cm}$ vertical & $20.9\text{ cm}$ lateral shift** between poses |

By measuring these exact 3D coordinates directly on each assembled mesh in Stage 4 and exporting them in `assembly_telemetry.json`, every downstream auto-rigger receives the exact anatomical joint locations of that specific character.

---

## 4. Detailed Functional Requirements

### 4.1 Stage 4 — Post-Assembly 3D Skeleton Metrics Profiler (`INV-SKELETON-METRICS-01`)

Immediately after [`unify_and_standardize_character()`](file:///Users/diesel/desktop/skatealley/scripts/builders/assemble_characters.py#L1067-L1180) normalizes the unified character mesh so its soles rest at $Z_{\min} = 0.000\text{ m}$, its horizontal bounding-box center is $(0.000, 0.000)\text{ m}$, and its crown apex reaches $Z_{\max} = 2.000\text{ m}$ (with `_IS_HEAD_PART` vertex weights separating head vertices $V_{\text{head}}$ from body vertices $V_{\text{body}}$), the assembler SHALL execute a deterministic 3D anatomical landmark profiler over the standardized mesh:

1. **Cranial & Cervical Landmarks (`crown_top`, `head_center`, `neck_joint`):**
   - Partition vertices into $V_{\text{head}}$ (`_IS_HEAD_PART > 0.5`) and $V_{\text{body}}$ (`_IS_HEAD_PART <= 0.5`).
   - Transform the pre-standardization seated collar socket $(X_{\text{collar}}, Y_{\text{collar}}, Z_{\text{collar}})$ and head bounds by the standardization offset and scale factor $s_{\text{std}}$ so `neck_joint` records the exact 3D point where the seated neck column meets the collar rim in standardized $2.000\text{ m}$ space:
     $$P_{\text{neck}} = (X_{\text{neck\_std}}, \, Y_{\text{neck\_std}}, \, Z_{\text{neck\_std}})$$
   - Compute `head_center` as the 3D median of $V_{\text{head}}$ above $Z_{\text{neck\_std}}$, and `crown_top` at $(X_{\text{neck\_std}}, Y_{\text{neck\_std}}, 2.000\text{ m})$.

2. **Lower-Body Bifurcation, Pelvis, Hip, Knee, Ankle & Foot Landmarks:**
   - **Skirt / Tunic Topology Detection (`has_skirt`):** Evaluate the vertex density of $V_{\text{body}}$ inside the medial inter-leg corridor ($|X| < 0.022\text{ m}, \, Z \in [0.25\text{ m}, 0.65\text{ m}]$). If the medial vertex count exceeds $35$, set `has_skirt = true`; otherwise `has_skirt = false`.
   - **Crotch Bifurcation Elevation ($Z_{\text{crotch}}$):**
     - When `has_skirt == false`, scan horizontal cross-sectional slices of $V_{\text{body}}$ upward from $Z = 0.35\text{ m}$ to $Z = 1.05\text{ m}$ in $\Delta Z = 0.010\text{ m}$ increments within $|X| < 0.22\text{ m}$.
     - Identify $Z_{\text{crotch}}$ as the lowest elevation where the medial gap bridge ($|X| < 0.018\text{ m}$) becomes continuously populated ($\ge 6$ vertices) while both left ($X \ge +0.025\text{ m}$) and right ($X \le -0.025\text{ m}$) leg columns are present, clamped to the anatomical interval $[0.58\text{ m}, 0.94\text{ m}]$.
     - When `has_skirt == true`, set $Z_{\text{crotch}} = 0.860\text{ m}$ (with `pelvis_z = 0.920 m`).
   - **Pelvis & Bilateral Hip Sockets (`pelvis`, `hip_l`, `hip_r`):**
     - Place `pelvis` on the medial trunk axis at $Z_{\text{pelvis}} = Z_{\text{crotch}} + 0.065\text{ m}$.
     - For each leg side ($s \in \{+1\text{ (left)}, \, -1\text{ (right)}\}$), compute the upper-thigh cross-sectional centroid in $Z \in [Z_{\text{crotch}} - 0.04\text{ m}, \, Z_{\text{crotch}} + 0.05\text{ m}]$ and place `hip_l` / `hip_r` at $Z_{\text{hip}} = Z_{\text{crotch}} + 0.050\text{ m}$ along each leg column's medial axis.
   - **Ankle, Knee, Ball & Toe Landmarks (`knee_l/r`, `ankle_l/r`, `ball_l/r`, `toe_l/r`):**
     - For each side ($s \in \{+1, -1\}$), isolate the lower-leg/ankle band $Z \in [0.05\text{ m}, 0.14\text{ m}]$ with $s \cdot X > 0.02\text{ m}$ to extract the true 3D ankle center $P_{\text{ankle}} = (X_{\text{ankle}}, Y_{\text{ankle}}, Z_{\text{ankle}})$.
     - Locate the knee elevation $Z_{\text{knee}} = 0.52 \cdot Z_{\text{hip}} + 0.48 \cdot Z_{\text{ankle}}$ (or local perimeter narrowing in $[0.38, 0.62]$ of leg length) and compute the 3D cross-sectional centroid of each leg column within $Z \in [Z_{\text{knee}} - 0.035\text{ m}, \, Z_{\text{knee}} + 0.035\text{ m}]$ to obtain $P_{\text{knee}} = (X_{\text{knee}}, Y_{\text{knee}}, Z_{\text{knee}})$.
     - Extract the anterior footwear sole band $Z \in [0.00\text{ m}, 0.06\text{ m}]$ on each side to determine the metatarsal `ball_l/r` (at $70\%$ of anterior foot length) and `toe_l/r` (at $96\%$ of anterior foot length).

3. **Spine Chain Landmarks (`spine_01`, `spine_02`, `spine_03`):**
   - Along the torso segment from $P_{\text{pelvis}}$ ($Z_{\text{pelvis}}$) to $P_{\text{neck}}$ ($Z_{\text{neck\_std}}$), compute the medial torso centroids (`|X| < 0.16 m`) at fractional heights $f \in \{0.25, \, 0.52, \, 0.78\}$ of $(Z_{\text{neck\_std}} - Z_{\text{pelvis}})$ to define `spine_01` (lumbar), `spine_02` (thoracic), and `spine_03` (upper chest).

4. **Upper-Limb Corridor, Pose Classification & Bilateral Arm Landmarks (`clavicle_l/r`, `shoulder_l/r`, `elbow_l/r`, `wrist_l/r`, `hand_tip_l/r`):**
   - For each lateral side ($s \in \{+1\text{ (left)}, \, -1\text{ (right)}\}$), isolate arm vertices $V_{\text{arm}, s} \subset V_{\text{body}}$ with $s \cdot X > 0.165\text{ m}$ and $Z \in [0.70\text{ m}, 1.72\text{ m}]$.
   - Compute lateral arm reach $X_{\text{arm\_max}, s} = P_{98.5}(|X(V_{\text{arm}, s})|)$.
   - **Shoulder Acromion Pivot (`shoulder_l/r`):** Compute the 3D median of $V_{\text{body}}$ in the axillary/deltoid root zone $|X| \in [0.155\text{ m}, 0.225\text{ m}]$, $Z \in [\max(1.28\text{ m}, Z_{\text{neck\_std}} - 0.24\text{ m}), \, Z_{\text{neck\_std}} - 0.02\text{ m}]$.
   - **Clavicle Root (`clavicle_l/r`):** Place at $(s \cdot 0.42 |X_{\text{sh}}|, \, Y_{\text{sh}} - 0.02\text{ m}, \, Z_{\text{sh}} + 0.01\text{ m})$.
   - **Wrist Pivot (`wrist_l/r`) & Hand Tip (`hand_tip_l/r`):** Sample the distal arm segment at $[0.70, 0.86]$ of the lateral span $(X_{\text{arm\_max}, s} - |X_{\text{sh}, s}|)$ to obtain the 3D wrist centroid $P_{\text{wrist}, s}$, and $[0.94, 1.00]$ to obtain $P_{\text{hand\_tip}, s}$.
   - **Rest-Pose Classification (`pose_type`) & Arm Elevation Angle ($\theta_{\text{arm}}$):**
     - Compute the arm elevation angle relative to horizontal ($0^\circ$ = horizontal T-pose, negative = downward A-pose):
       $$\theta_{\text{arm}, s} = \operatorname{atan2}\!\left(Z_{\text{wrist}, s} - Z_{\text{sh}, s}, \, |X_{\text{wrist}, s} - X_{\text{sh}, s}|\right)$$
     - Classify `pose_type = "A_POSE"` when $-\theta_{\text{arm}} > 15^\circ$ (or $Z_{\text{sh}} - Z_{\text{wrist}} > 0.12\text{ m}$); otherwise classify `pose_type = "T_POSE"`.
   - **Elbow Pivot (`elbow_l/r`):** Sample the mid-brachial corridor at $[0.38, 0.58]$ of the radial distance from $P_{\text{sh}, s}$ to $P_{\text{wrist}, s}$ (constrained to lie within $0.08\text{ m}$ of the segment connecting $P_{\text{sh}, s}$ and $P_{\text{wrist}, s}$) to obtain the 3D elbow center $P_{\text{elbow}, s}$.

---

### 4.2 Authoritative `skeleton_metrics` JSON Schema Contract (`INV-METRICS-SCHEMA-01`)

Every Stage 4 telemetry file (`assembly_telemetry.json`, `assembly_apose_telemetry.json`, `assembly_tpose_telemetry.json`) SHALL include a top-level `"skeleton_metrics"` object (and per-pose `poses[pose_key]["skeleton_metrics"]`) conforming to the following structure:

```json
{
  "schema_version": "1.0",
  "stature_meters": 2.0,
  "pose_type": "A_POSE",
  "is_apose": true,
  "has_skirt": false,
  "arm_elevation_deg": {
    "left": -37.42,
    "right": -37.18,
    "mean": -37.30
  },
  "proportions": {
    "crotch_height_ratio": 0.365,
    "head_height_ratio": 0.1778,
    "torso_length_meters": 0.6594,
    "shoulder_breadth_meters": 0.3958,
    "hip_breadth_meters": 0.3086,
    "stance_ankle_breadth_meters": 0.3832,
    "arm_span_meters": 1.1802,
    "upper_arm_length_meters": 0.2581,
    "forearm_length_meters": 0.2644,
    "hand_length_meters": 0.1325,
    "thigh_length_meters": 0.3632,
    "calf_length_meters": 0.3218,
    "foot_length_meters": 0.2410
  },
  "head_bounds_2m": {
    "y_neck_norm": 1.6444,
    "x_half_norm": 0.1618,
    "z_min": 1.6444,
    "z_max": 2.0
  },
  "joints_z_up": {
    "root": [0.0, 0.0, 0.0],
    "pelvis": [0.0, 0.012, 0.795],
    "crotch": [0.0, 0.010, 0.730],
    "spine_01": [0.0, 0.014, 1.007],
    "spine_02": [0.0, 0.018, 1.237],
    "spine_03": [0.0, 0.020, 1.458],
    "neck_01": [-0.002, 0.015, 1.6444],
    "head": [-0.002, 0.010, 1.785],
    "crown_top": [-0.002, 0.010, 2.0],
    "clavicle_l": [0.083, 0.042, 1.453],
    "clavicle_r": [-0.083, 0.042, 1.453],
    "shoulder_l": [0.1979, 0.062, 1.4429],
    "shoulder_r": [-0.1979, 0.062, 1.4429],
    "elbow_l": [0.342, 0.0486, 1.3605],
    "elbow_r": [-0.342, 0.0486, 1.3605],
    "wrist_l": [0.5038, 0.014, 0.9586],
    "wrist_r": [-0.5038, 0.014, 0.9586],
    "hand_tip_l": [0.5901, 0.005, 0.842],
    "hand_tip_r": [-0.5901, 0.005, 0.842],
    "hip_l": [0.1543, 0.012, 0.785],
    "hip_r": [-0.1543, 0.012, 0.785],
    "knee_l": [0.1662, 0.063, 0.422],
    "knee_r": [-0.1662, 0.063, 0.422],
    "ankle_l": [0.1916, -0.0154, 0.1014],
    "ankle_r": [-0.1916, -0.0154, 0.1014],
    "ball_l": [0.195, -0.105, 0.018],
    "ball_r": [-0.195, -0.105, 0.018],
    "toe_l": [0.198, -0.168, 0.014],
    "toe_r": [-0.198, -0.168, 0.014]
  },
  "joints_y_up": {
    "root": [0.0, 0.0, 0.0],
    "pelvis": [0.0, 0.795, -0.012],
    "crotch": [0.0, 0.730, -0.010],
    "spine_01": [0.0, 1.007, -0.014],
    "spine_02": [0.0, 1.237, -0.018],
    "spine_03": [0.0, 1.458, -0.020],
    "neck_01": [-0.002, 1.6444, -0.015],
    "head": [-0.002, 1.785, -0.010],
    "crown_top": [-0.002, 2.0, -0.010],
    "clavicle_l": [0.083, 1.453, -0.042],
    "clavicle_r": [-0.083, 1.453, -0.042],
    "shoulder_l": [0.1979, 1.4429, -0.062],
    "shoulder_r": [-0.1979, 1.4429, -0.062],
    "elbow_l": [0.342, 1.3605, -0.0486],
    "elbow_r": [-0.342, 1.3605, -0.0486],
    "wrist_l": [0.5038, 0.9586, -0.014],
    "wrist_r": [-0.5038, 0.9586, -0.014],
    "hand_tip_l": [0.5901, 0.842, -0.005],
    "hand_tip_r": [-0.5901, 0.842, -0.005],
    "hip_l": [0.1543, 0.785, -0.012],
    "hip_r": [-0.1543, 0.785, -0.012],
    "knee_l": [0.1662, 0.422, -0.063],
    "knee_r": [-0.1662, 0.422, -0.063],
    "ankle_l": [0.1916, 0.1014, 0.0154],
    "ankle_r": [-0.1916, 0.1014, 0.0154],
    "ball_l": [0.195, 0.018, 0.105],
    "ball_r": [-0.195, 0.018, 0.105],
    "toe_l": [0.198, 0.014, 0.168],
    "toe_r": [-0.198, 0.014, 0.168]
  }
}
```

---

### 4.3 Stage 5 — Pose-Matched GCS Intake & Fallback Profiler (`INV-POSE-INTAKE-01`)

[`scripts/gcs_rig_intake.py`](file:///Users/diesel/desktop/skatealley/scripts/gcs_rig_intake.py) SHALL act as the single authoritative bridge between Stage 4 assembly outputs and all Stage 5 game riggers:

1. **Target-Game Pose Routing Matrix:**
   When `intake_assembled_character_for_rigging()` is invoked with a `preferred_pose` (or `target_game`), it SHALL resolve the optimal assembled `.glb` and telemetry manifest from `03_meshes/assembled/`:
   - **A-Pose Target Games (`preferred_pose="apose"` — e.g., `skate3`, and A-pose Melee fighters `Gn`, `Pk`, `Pc`, `Ys`):**
     - Priority 1: `03_meshes/assembled/character_apose.glb` + `assembly_apose_telemetry.json`
     - Priority 2 (Fallback): `03_meshes/assembled/character_full.glb` + `assembly_telemetry.json`
   - **T-Pose Target Games (`preferred_pose="tpose"` — e.g., `alleyway`, `gta`, `zombies`, and the 20 T-pose Melee fighters):**
     - Priority 1: `03_meshes/assembled/character_tpose.glb` + `assembly_tpose_telemetry.json`
     - Priority 2 (Fallback): `03_meshes/assembled/character_full.glb` + `assembly_telemetry.json`
   - **Modular Limb & Spherical Target Assets (Optional enrichment for `melee` Kirby/Jigglypuff and `zombies` severed limbs):**
     - Also resolves `03_meshes/head/head.glb`, `03_meshes/arms/arms.glb`, and `03_meshes/feet/feet.glb` when present in GCS or `<output_dir>/meshes/`.

2. **Guaranteed `skeleton_metrics` Availability (Zero-Fallback Ambiguity):**
   - If the loaded `assembly_telemetry.json` (or pose-specific telemetry file) already contains a valid `"skeleton_metrics"` object (`schema_version == "1.0"`), `intake_assembled_character_for_rigging()` returns it directly under `intake_info["skeleton_metrics"]`.
   - If a caller supplies a legacy `.glb` or standalone local `.glb` whose telemetry lacks `"skeleton_metrics"`, `gcs_rig_intake.py` SHALL execute a pure-NumPy 3D vertex landmark profiler directly on the `.glb` binary in $< 0.20\text{ seconds}$ and populate `intake_info["skeleton_metrics"]` with the exact same schema so downstream riggers never branch on missing metrics.

---

### 4.4 Stage 5 — Per-Game Proportion-Tailored Auto-Rigging Contracts (`INV-TAILORED-RIG-01`)

Each of the five game auto-riggers SHALL consume `intake_info["skeleton_metrics"]` to tailor joint placement, rest-pose alignment, and vertex weight envelopes to the individual character:

1. **The Alleyway Hub ([`scripts/rig_characters.py`](file:///Users/diesel/desktop/skatealley/scripts/rig_characters.py)):**
   - Replace hardcoded vertical heights in `create_agnostic_character_armatures()` and `assign_explicit_anatomical_weights()` (`pelvis = 0.920`, `thigh = 0.925`, `calf = 0.528`, `foot = 0.105`) with the character's measured `skeleton_metrics["joints_z_up"]` coordinates (`pelvis`, `crotch`, `spine_01..03`, `neck_01`, `head`, `shoulder_l/r`, `elbow_l/r`, `wrist_l/r`, `hip_l/r`, `knee_l/r`, `ankle_l/r`, `ball_l/r`).
   - Parameterize pelvis-to-thigh and thigh-to-calf skinning transition bands around the character's measured `crotch[2]` and `knee_l[2]` elevations rather than fixed constants `0.80m` and `0.60m`.

2. **Skate 3 ([`scripts/rig_skate3_character.py`](file:///Users/diesel/desktop/skatealley/scripts/rig_skate3_character.py)):**
   - Intake `character_apose.glb` (`preferred_pose="apose"`).
   - Use `skeleton_metrics["joints_y_up"]` (`shoulder_l/r`, `elbow_l/r`, `wrist_l/r`, `crotch`, `hip_l/r`, `knee_l/r`, `ankle_l/r`, `neck_01`) to drive forearm-to-board-rail alignment around the character's actual measured elbow pivot and parameterize leg/pelvis/knee skinning transition bands around the character's measured `crotch[1]` and `knee_l[1]`.

3. **GTA: Vice City ([`scripts/compile_luis_revcdos_player.py`](file:///Users/diesel/desktop/skatealley/scripts/compile_luis_revcdos_player.py)):**
   - Intake `character_tpose.glb` (`preferred_pose="tpose"`).
   - Use `skeleton_metrics["joints_y_up"]` (`shoulder_l/r`, `elbow_l/r`, `wrist_l/r`, `crotch`, `knee_l/r`, `ankle_l/r`, `neck_01`) to align the character's arms and lower body to `player.dff`'s 31-bone `RpHAnimHierarchy` around the character's measured shoulder and hip pivots. If the input mesh is already in T-pose (`pose_type == "T_POSE"`), skip large A-to-T shoulder fold rotations and apply only the fine residual angle $\Delta \theta$ needed to match `player.dff`'s exact upper-arm vector.

4. **Call of Duty: Nazi Zombies ([`scripts/compile_luis_zombies_mdl.py`](file:///Users/diesel/desktop/skatealley/scripts/compile_luis_zombies_mdl.py)):**
   - Intake `character_tpose.glb` (`preferred_pose="tpose"`), plus standalone `03_meshes/head/head.glb` and `03_meshes/arms/arms.glb` when present.
   - Use `skeleton_metrics["joints_y_up"]` (`neck_01`, `shoulder_l/r`, `wrist_l/r`, `hand_tip_l/r`, `crotch`, `knee_l/r`, `ankle_l/r`) to parameterize the torso/pelvis/leg bone blend heights and arm span boundaries instead of hardcoded `(0.200, 0.905)` lateral bounds.

5. **Super Smash Bros. Melee ([`scripts/rig_melee_character.py`](file:///Users/diesel/desktop/skatealley/scripts/rig_melee_character.py)):**
   - Automatically select `character_apose.glb` when the target Melee fighter's native rest-pose arm elevation is A-pose ($\le -22^\circ$, e.g., *Ganondorf, Pikachu, Pichu, Yoshi*) and `character_tpose.glb` when the fighter's rest-pose is T-pose ($> -22^\circ$), minimizing procedural arm rotation distortion.
   - Use `skeleton_metrics` (`crotch`, `shoulder_l/r`, `elbow_l/r`, `wrist_l/r`, `hip_l/r`, `knee_l/r`, `ankle_l/r`, `neck_01`) to map the player's measured joints directly onto the target fighter's extracted `JObj` hierarchy.

---

## 5. Operational & Performance Budgets

| Pipeline Stage / Operation | Maximum Allowed Budget | Enforcement & Verification |
| :--- | :---: | :--- |
| **Post-Assembly 3D `skeleton_metrics` Extraction (in Blender / NumPy)** | **$< 0.25\text{ seconds}$** per pose | Vectorized NumPy slice profiling over $\sim 40,000$ vertices |
| **Standalone `.glb` Fallback `skeleton_metrics` Computation (`gcs_rig_intake.py`)** | **$< 0.20\text{ seconds}$** | Pure binary glTF buffer unpack + NumPy percentile slices |
| **Stage 4 Dual-Pose Assembly + `skeleton_metrics` Emission + GCS Sync** | **$< 25.0\text{ seconds}$** total | Concurrent 2-worker Blender assembly (`apose` + `tpose`) + 6-worker GCS upload |
| **Stage 5 Pose-Matched GCS Intake & SHA-256 Verification** | **$< 5.0\text{ seconds}$** (warm cache $< 0.2\text{ s}$) | Exclusive advisory file lock + atomic JSON/binary replacement |
| **Joint Coordinate Accuracy vs. True Mesh Cross-Section Centroid** | **$\le 0.015\text{ m}$ ($1.5\text{ cm}$)** | Verified across both A-pose and T-pose character meshes |

---

## 6. Edge Cases, Failure Modes & Recovery Boundaries

1. **Baggy Sweatpants / Low-Inseam Crotch vs. Tunic / Skirt Geometry:**
   - *Failure Mode:* A character wearing low-inseam sweatpants (e.g., `LUIS_TPOSE` with $Z_{\text{crotch}} = 0.66\text{ m}$) or a continuous tunic/skirt (`PLATODOOM`) causes a naive fixed-height hip splitter (`0.92m`) to bind inner-thigh polygons to the opposite leg or tear the skirt across the midline.
   - *Required Behavior:* The profiler detects `has_skirt` first; when `has_skirt == false`, it locates the true leg-merge saddle $Z_{\text{crotch}} \in [0.58, 0.94]\text{ m}$ and sets hip and knee elevations relative to $Z_{\text{crotch}}$ and $Z_{\text{ankle}}$.
2. **Draped Headwear / Hood Overlapping Upper Shoulders:**
   - *Failure Mode:* Long hair, durag tails, or hood geometry hanging down near $Z \approx 1.45\text{ m}$ biases shoulder or neck landmark medians.
   - *Required Behavior:* All torso, shoulder, and limb landmark queries strictly filter to $V_{\text{body}}$ (`_IS_HEAD_PART <= 0.5`), ensuring head and headwear vertices never contaminate body joint coordinates.
3. **A-Pose vs. T-Pose Input into Game Riggers:**
   - *Failure Mode:* Applying a hardcoded $-40^\circ$ A-to-T shoulder rotation to a mesh that is *already* in T-pose (`character_tpose.glb`) rotates the arms $+40^\circ$ upward into a V-pose above the head.
   - *Required Behavior:* Every rigger inspects `skeleton_metrics["arm_elevation_deg"]` (and the measured vector $P_{\text{wrist}} - P_{\text{shoulder}}$) and computes only the exact delta rotation $\Delta R \in SO(3)$ between the character's measured rest-pose arm vector and the target game skeleton's rest-pose arm vector.
4. **Legacy Single-Body GCS Runs (`character_full.glb` Only):**
   - *Failure Mode:* A GCS run created prior to Spec 039 contains only `character_full.glb` and `assembly_telemetry.json` without separate `character_apose.glb` or `character_tpose.glb` files.
   - *Required Behavior:* `intake_assembled_character_for_rigging()` falls back cleanly to `character_full.glb`, computes or loads `skeleton_metrics`, and supplies the exact measured `arm_elevation_deg` so any game rigger can adapt to that single mesh's pose automatically.

---

## 7. Acceptance Criteria & Verification Gates

- **`AC-01` (Post-Assembly `skeleton_metrics` Emission & Schema Completeness):**
  - Assembling `nicotest_run_01` (A-pose) and `LUIS_COLOR` (T-pose) via [`assemble_characters.py`](file:///Users/diesel/desktop/skatealley/scripts/builders/assemble_characters.py) emits a complete `"skeleton_metrics"` object in `assembly_telemetry.json` (and `assembly_apose_telemetry.json` / `assembly_tpose_telemetry.json`) containing `pose_type`, `arm_elevation_deg`, `proportions`, `head_bounds_2m`, `joints_z_up` (all 29 canonical landmarks), and `joints_y_up` (all 29 canonical landmarks), with $Z$-up and $Y$-up coordinates satisfying $(x, y_{\text{up}}, z_{\text{fwd}}) = (x, z_{\text{up}}, -y_{\text{depth}})$ to within $10^{-5}\text{ m}$.
- **`AC-02` (Character-Specific Proportion Discrimination):**
  - On `nicotest_run_01` (A-pose) vs. `LUIS_COLOR` (T-pose), `skeleton_metrics` accurately discriminates:
    - `pose_type == "A_POSE"` ($\theta_{\text{arm}} \in [-50^\circ, -20^\circ]$) vs. `pose_type == "T_POSE"` ($\theta_{\text{arm}} \in [-12^\circ, +12^\circ]$).
    - True character-specific `crotch` height ($Z_{\text{crotch}} \in [0.62\text{ m}, 0.82\text{ m}]$), `knee_l/r` height ($Z_{\text{knee}} \in [0.34\text{ m}, 0.48\text{ m}]$), and `shoulder_l/r` / `elbow_l/r` / `wrist_l/r` 3D coordinates matching the actual mesh cross-section centroids within $\le 0.015\text{ m}$.
- **`AC-03` (Pose-Matched Stage 5 Intake & Standalone `.glb` Fallback):**
  - Calling `intake_assembled_character_for_rigging(..., preferred_pose="apose")` resolves `character_apose.glb` + `assembly_apose_telemetry.json`, while `preferred_pose="tpose"` resolves `character_tpose.glb` + `assembly_tpose_telemetry.json` (falling back to `character_full.glb` when pose-specific files are absent), and populates `intake_info["skeleton_metrics"]` in $< 0.25\text{ s}$ even when given a raw `.glb` path with no telemetry file on disk.
- **`AC-04` (End-to-End Tailored Rigging Across Target Games):**
  - Executing the downstream game riggers (`alleyway`, `skate3`, `gta`, `zombies`, `melee`) consumes `intake_info["skeleton_metrics"]`, records the consumed `skeleton_metrics` summary inside each target's `rig_telemetry.json`, and produces valid rigged binary deliverables with zero console/validation errors.
