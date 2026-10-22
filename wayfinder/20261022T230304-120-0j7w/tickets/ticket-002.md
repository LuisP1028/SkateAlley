# Ticket 002: Anatomical 24-Deform-Bone Skinning Engine, 11-Socket Zero-Weight Masking, and Lossless $35\times 4\times 4$ Inverse Bind Matrix Solver

- **Ticket ID**: `ticket-002`
- **Target Stage**: `implement` (Note: Independent test suite authoring and execution are strictly reserved for the dedicated `tester` stage under `INV-NO-SELF-TEST-01`.)
- **Upstream Specification Reference**: [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/functional_specification_033.md) §2, §4.3, §4.4, §5 (Stages 3, 4 & 5), §6, §7, §8.1, §8.3, §10 (AC-1, AC-3, AC-4)
- **Depends On**: `ticket-001`

---

## Objective

Implement the anatomically partitioned 4-influence skinning weight solver (`JOINTS_0` and `WEIGHTS_0`), non-deforming vehicle/IK target socket zero-weight enforcement (indices `24..34`), lossless $35 \times 4 \times 4$ column-major Inverse Bind Matrix (`inverseBindMatrices`) solver, and glTF 2.0 `skins[0]` binary serializer inside [`scripts/rig_skate3_character.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/scripts/rig_skate3_character.py).

---

## Mandatory Target Deliverables (`MANDATORY_TARGET`)

| File Path | Action | Required Deliverable State |
| :--- | :--- | :--- |
| `scripts/rig_skate3_character.py` | Modify | Extend with anatomical 24-bone skinning engine (`compute_skate3_skin_weights`), 11-socket zero-weight lock (`indices 24..34 == 0.0`), lossless $35 \times 4 \times 4$ column-major `inverseBindMatrices` solver (`compute_skate3_ibms`), rest-pose identity drift verifier (`< 0.001 mm`), and glTF 2.0 `JOINTS_0` (`5123` `UNSIGNED_SHORT` `VEC4`) + `WEIGHTS_0` (`5126` `FLOAT` `VEC4`) binary packer. |

---

## Read-Only Discovery Context (`READ_ONLY_CONTEXT`)

| File Path | Role in Discovery / Reference |
| :--- | :--- |
| `functional_specification_033.md` | Authoritative specification for 4-bone skinning constraints (§4.3), Inverse Bind Matrix math (§4.4), and edge-case anatomical separation (§8.1, §8.3). |
| `LANGUAGE.md` | Authoritative domain vocabulary (`{correctness}`, `{correct required outputs}`, `{errors}`). |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | Reference 35-joint world bind transforms and column-major IBMs ($\max \|W_{\text{bind}} \times \text{IBM} - I_4\|_\infty = 5.95 \times 10^{-8}$). |
| `assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json` | Captured 35-joint world positions, bone segments, and reference IBMs. |
| `assets/20261022T230304-120-0j7w/plan-gltf-skin.schema.json` | Official Khronos glTF 2.0 `skin.schema.json` contract. |

---

## Functional & Mathematical Requirements

### 1. Anatomical Partitioning & 24-Deform-Bone Weight Solver (`Stage 3`, §4.3, §8.1, §8.3)
- Partition the 35 canonical joints of `SKATE3_RX2_RIG` into:
  - **24 Active Humanoid Deform Bones (indices `0..23`)**:
    - Pelvis & Spine/Head chain (`0..7`): `HIPS`, `SPINE`, `SPINE1`, `SPINE2`, `SPINE3`, `NECK`, `NECK1`, `HEAD`.
    - Right Arm chain (`8..11`): `RIGHTSHOULDER`, `RIGHTARM`, `RIGHTFOREARM`, `RIGHTHAND`.
    - Left Arm chain (`12..15`): `LEFTSHOULDER`, `LEFTARM`, `LEFTFOREARM`, `LEFTHAND`.
    - Right Leg chain (`16..19`): `RIGHTUPLEG`, `RIGHTLEG`, `RIGHTFOOT`, `RIGHTTOEBASE`.
    - Left Leg chain (`20..23`): `LEFTUPLEG`, `LEFTLEG`, `LEFTFOOT`, `LEFTTOEBASE`.
  - **11 Non-Deforming Vehicle & IK Target Sockets (indices `24..34`)**:
    - `SKATEBOARD_ROOT` (`24`), `TRUCK_FRONT` (`25`), `RIGHT_WHEELFRONT` (`26`), `LEFT_WHEELFRONT` (`27`), `TRUCK_BACK` (`28`), `LEFT_WHEELBACK` (`29`), `RIGHT_WHEELBACK` (`30`), `RIGHTTOEBASE_REPARENTED` (`31`), `LEFTTOEBASE_REPARENTED` (`32`), `LEFTHAND_REPARENTED` (`33`), `RIGHTHAND_REPARENTED` (`34`).
    - Every vertex in the character mesh MUST have weight `0.000000` for all 11 socket indices (`24..34`); none of indices `24..34` may ever appear with a non-zero weight in `JOINTS_0` / `WEIGHTS_0`.
- Implement anatomical region isolation so adjacent limbs cannot bleed across anatomical boundaries:
  - **Sagittal Plane Leg Isolation (§8.1)**: Below `HIPS` ($Y < 0.96\text{ m}$) and within lateral hip width ($|X| < 0.25\text{ m}$), strictly isolate left leg vertices ($X > 0$) to Left Leg bones (`20..23`, plus pelvis transition to `HIPS` near the groin/glute crease) and right leg vertices ($X \le 0$) to Right Leg bones (`16..19`, plus `HIPS`). Left-leg vertices (`X > 0.02m`, `Y < 0.85m`) must have `0.0` weight on right-leg bones (`16..19`) and vice versa, eliminating inner-thigh cross-talk during wide stances and kickflips.
  - **Torso vs. Arm Envelope Isolation (§8.1)**: Isolate lateral arm vertices ($|X| > 0.19\text{ m}$ at shoulder height $Y \in [1.20\text{ m}, 1.58\text{ m}]$) to the corresponding arm/shoulder chain (`8..11` for $X < 0$, `12..15` for $X > 0$) with smooth deltoid/pectoral blend into `SPINE2`/`SPINE3` (`3..4`), and prevent torso/ribcage vertices ($|X| \le 0.16\text{ m}$) from binding to `LEFTFOREARM`/`RIGHTFOREARM`/`LEFTHAND`/`RIGHTHAND`.
  - **Volumetric / Companion Accessory Handling (§8.3)**: Any vertex belonging to a backpack, cape, oversized hoodie, helmet, or companion mesh (`DOOM_Companion` in `LUIS`) that falls outside standard limb capsules must smoothly fall back to the nearest structural spine/head/pelvis bone (`HIPS`, `SPINE1`, `SPINE2`, `SPINE3`, `HEAD`) so zero vertices are ever left unweighted (0 orphans).

### 2. Strict 4-Influence Clamping, Sorting, and Float32 Normalization (§4.3, §10 AC-3)
- For every vertex $v \in \{0, \dots, N-1\}$:
  1. Select the top $K = 4$ deform bones with the largest positive raw weights.
  2. Sort the 4 influences in descending order of weight: $w_{v,0} \ge w_{v,1} \ge w_{v,2} \ge w_{v,3} \ge 0.0$.
  3. Zero out negligible tail weights ($< 10^{-7}$) and pad any unused influence slots ($w_{v,k} == 0.0$) with joint index `0`.
  4. Normalize in 32-bit IEEE-754 floating-point precision (`float32`), adjusting the primary weight $w_{v,0} \leftarrow \text{float32}(1.0 - (w_{v,1} + w_{v,2} + w_{v,3}))$ after `float32` quantization so that the stored `float32` values satisfy:
     $$\left| \sum_{k=0}^{3} w_{v,k} - 1.0 \right| \le 10^{-6}$$
     for 100% of vertices, with zero `NaN` or `Inf` entries and zero orphan vertices ($\sum_{k=0}^3 w_{v,k} = 0$ is a hard error).

### 3. Lossless $35 \times 4 \times 4$ Inverse Bind Matrix Solver (`Stage 4`, §4.4, §10 AC-4)
- Compute the world-space bind transform $W_{\text{bind}}^{(j)} \in \mathbb{R}^{4 \times 4}$ for each of the 35 joints $j \in \{0, \dots, 34\}$ by traversing the joint hierarchy from `Skate3_RX2_Rig`:
  $$W_{\text{bind}}^{(j)} = W_{\text{bind}}^{(\text{parent}(j))} \times L_{\text{bind}}^{(j)}$$
- Verify that every $W_{\text{bind}}^{(j)}$ is non-singular with $\left|\det(W_{\text{bind}}^{(j)})\right| > 10^{-6}$; raise a fail-fast diagnostic exception if any joint transform is singular.
- Compute $\text{IBM}_j = \left(W_{\text{bind}}^{(j)}\right)^{-1}$ in 64-bit floating-point precision, serialize to 16 column-major `float32` values per joint (`35 * 16 * 4 = 2,240` bytes, accessor `componentType: 5126`, `type: "MAT4"`, `count: 35`), and verify:
  $$\max_{j \in \{0..34\}} \left\| W_{\text{bind}}^{(j)} \times \text{IBM}_j - I_4 \right\|_\infty \le 10^{-5}$$
- Verify rest-pose identity skinning across all $N$ mesh vertices:
  $$v'_i = \sum_{k=0}^{3} w_{i,k} \left( W_{\text{bind}}^{(j_{i,k})} \times \text{IBM}_{j_{i,k}} \right) v_i, \quad \max_{i} \|v'_i - v_i\|_2 < 0.001\text{ mm} \ (10^{-6}\text{ m})$$

### 4. Binary Accessor & Skin Serialization (`Stage 5`, §4.3, §4.4)
- Pack `JOINTS_0` as `componentType: 5123` (`UNSIGNED_SHORT`), `type: "VEC4"`, `count: N` (`8 * N` bytes).
- Pack `WEIGHTS_0` as `componentType: 5126` (`FLOAT`), `type: "VEC4"`, `count: N` (`16 * N` bytes).
- Emit `skins[0]` matching [`assets/20261022T230304-120-0j7w/plan-gltf-skin.schema.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/assets/20261022T230304-120-0j7w/plan-gltf-skin.schema.json) with `"name": "Skate3_RX2_Rig"`, `"joints": [0, 1, ..., 34]`, and `"inverseBindMatrices"` pointing to the 35-element `MAT4` accessor, and bind every mesh node to `"skin": 0`.
