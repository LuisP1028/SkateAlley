# Ticket 001: Pure-Python GLB Ingestion, Coordinate Normalization, Degenerate Triangle Sanitization, and Canonical 35-Joint `SKATE3_RX2_RIG` Contract Loader

- **Ticket ID**: `ticket-001`
- **Target Stage**: `implement` (Note: Independent test suite authoring and execution are strictly reserved for the dedicated `tester` stage under `INV-NO-SELF-TEST-01`.)
- **Upstream Specification Reference**: [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/functional_specification_033.md) §1, §3, §4.1, §4.2, §5 (Stages 1 & 2), §6, §8, §10 (AC-1, AC-2, AC-6)
- **Depends On**: None

---

## Objective

Create the foundational pure-Python glTF 2.0 binary (`.glb`) parser, coordinate-space normalizer, degenerate triangle sanitizer, material/attribute preservation engine, and canonical 35-joint `SKATE3_RX2_RIG` armature loader in [`scripts/rig_skate3_character.py`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/scripts/rig_skate3_character.py). This module must run natively under both `/opt/homebrew/bin/python3` (standard library fallback) and `/opt/homebrew/opt/python@3.13/bin/python3.13` (`numpy`-accelerated) with zero `bpy` (Blender CLI) dependencies.

---

## Mandatory Target Deliverables (`MANDATORY_TARGET`)

| File Path | Action | Required Deliverable State |
| :--- | :--- | :--- |
| `scripts/rig_skate3_character.py` | Create | Pure-Python module implementing `.glb` binary chunk reader/writer, metric coordinate normalizer (`Y_min = 0.000m`, standing height `1.8000m` within `1.80m ± 0.05m`, lateral center `(0, 0)`), degenerate triangle sanitizer (`area < 1e-10`), attribute/material/texture preserver & synthesizer, and 35-joint `SKATE3_RX2_RIG` armature contract loader from `20261019T213303-735-zjzk/plan-scan-2-skater.glb` and `assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json`. |

---

## Read-Only Discovery Context (`READ_ONLY_CONTEXT`)

| File Path | Role in Discovery / Reference |
| :--- | :--- |
| `functional_specification_033.md` | Authoritative functional specification for the 35-joint `SKATE3_RX2_RIG` pipeline. |
| `LANGUAGE.md` | Authoritative domain vocabulary (`{functionality}`, `{correctness}`, `{correct required outputs}`, `{errors}`, `{sufficient}`, `{insufficient}`). |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | Canonical 35-joint Skate 3 reference rig (`Skate3_RX2_Rig`, nodes `0..34`, skin `0`, column-major local & inverse bind matrices). |
| `20261019T213303-735-zjzk/plan-scan-2-physics-skeletons.json` | Canonical physics rest specification (`PHYS_TPOSE` joint offsets and bone lengths). |
| `20261019T213303-735-zjzk/skateboard_prop.glb` | Skateboard prop reference (`Skateboard_Root` and truck/wheel node standards). |
| `PLATODOOM_RAW.glb` | Raw unrigged static humanoid character mesh (`306,806` vertices, `POSITION` only, 236 degenerate triangles, `Y in [-1.0001m, +0.9943m]`). |
| `PLATODOOM_HOLOSYS_RIGGED.glb` | Assembled textured `PLATODOOM` mesh reference (`9,735` vertices, `POSITION`, `NORMAL`, `TEXCOORD_0`, PBR material and 2 PNG textures). |
| `LUIS_DECIMATED_STANDALONE.glb` | Textured `LUIS` + `DOOM_Companion` mesh reference (`14,905` vertices across 2 primitives, 2 PBR materials and 2 PNG textures). |
| `assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json` | Extracted 35-joint `SKATE3_RX2_RIG` node indices, parent indices, local matrices, world bind positions, and column-major IBMs. |
| `assets/20261022T230304-120-0j7w/plan-gltf-skin.schema.json` | Official Khronos glTF 2.0 `skin.schema.json` contract. |

---

## Functional & Mathematical Requirements

### 1. Binary glTF 2.0 (`.glb`) Reader and Writer
- Parse the 12-byte `.glb` header (`magic == 0x46546C67`, `version == 2`, `length`), chunk 0 (`chunkType == 0x4E4F534A` JSON padded with `0x20`), and chunk 1 (`chunkType == 0x004E4942` BIN padded with `0x00` to 4-byte alignment).
- Enforce 4-byte buffer alignment on every `bufferView.byteOffset` and `accessor.byteOffset`.
- Support multi-primitive meshes (such as `LUIS` with `Luis_Body` and `DOOM_Companion`) and preserve all input `materials`, `textures`, `images`, `samplers`, and primitive attributes (`POSITION`, `NORMAL`, `TEXCOORD_0`, `TEXCOORD_1`, `TANGENT`, `COLOR_0`) together with their underlying binary buffer views when transferring static geometry into the rigged output `.glb`.

### 2. Canonical 35-Joint `SKATE3_RX2_RIG` Contract Loader (`Stage 2`)
- Load the authoritative 35-joint hierarchy from [`20261019T213303-735-zjzk/plan-scan-2-skater.glb`](file:///Users/diesel/Desktop/SkateAlley/20261019T213303-735-zjzk/plan-scan-2-skater.glb) (with fallback/cross-check against [`assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/assets/20261022T230304-120-0j7w/plan-skate3-rx2-rig-contract.json)).
- Enforce exact joint count (`35`), exact joint names, and exact `skins[0].joints` array ordering (`0..34`):
  - `0: HIPS`, `1: SPINE`, `2: SPINE1`, `3: SPINE2`, `4: SPINE3`, `5: NECK`, `6: NECK1`, `7: HEAD`
  - `8: RIGHTSHOULDER`, `9: RIGHTARM`, `10: RIGHTFOREARM`, `11: RIGHTHAND`
  - `12: LEFTSHOULDER`, `13: LEFTARM`, `14: LEFTFOREARM`, `15: LEFTHAND`
  - `16: RIGHTUPLEG`, `17: RIGHTLEG`, `18: RIGHTFOOT`, `19: RIGHTTOEBASE`
  - `20: LEFTUPLEG`, `21: LEFTLEG`, `22: LEFTFOOT`, `23: LEFTTOEBASE`
  - `24: SKATEBOARD_ROOT`, `25: TRUCK_FRONT`, `26: RIGHT_WHEELFRONT`, `27: LEFT_WHEELFRONT`, `28: TRUCK_BACK`, `29: LEFT_WHEELBACK`, `30: RIGHT_WHEELBACK`
  - `31: RIGHTTOEBASE_REPARENTED`, `32: LEFTTOEBASE_REPARENTED`, `33: LEFTHAND_REPARENTED`, `34: RIGHTHAND_REPARENTED`
- Preserve the exact glTF node hierarchy of `plan-scan-2-skater.glb` where scene root `Skate3_RX2_Rig` parents `HIPS` (`0`), `SKATEBOARD_ROOT` (`24`), and the skinned mesh node(s) (`35+`), while `SKATEBOARD_ROOT` (`24`) parents `TRUCK_FRONT` (`25`), `TRUCK_BACK` (`28`), and the 4 `*_REPARENTED` IK solver target nodes (`31..34`). Also expose a helper mapping both physical `.glb`/`.abin` parent relationships and conceptual logical parent relationships (`SKATEBOARD_ROOT -> HIPS` or `Skate3_RX2_Rig`, `*_REPARENTED -> SKATEBOARD_ROOT` or anatomical extremity) so downstream structural queries have complete parent metadata.

### 3. Coordinate System & Scale Normalization (`Stage 1`, §4.2, §5, §8.2)
- Transform raw input vertex positions (`POSITION`) into the canonical Skate 3 metric space:
  - Right-handed $+Y$-up, $+Z$-forward, $-X$-right.
  - Uniform scale factor $s = H_{\text{target}} / (Y_{\max} - Y_{\min})$ with default $H_{\text{target}} = 1.8000\text{ m}$ (strictly within $1.80\text{ m} \pm 0.05\text{ m}$, i.e. $[1.75\text{ m}, 1.85\text{ m}]$).
  - Grounding translation so the lowest sole vertex sits at $Y = 0.0000\text{ m}$ ($\pm 10^{-4}\text{ m}$) and lateral center sits at $(X = 0.0, Z = 0.0)$ aligned with the `HIPS` / `LEFTTOEBASE` / `RIGHTTOEBASE` coronal and sagittal planes (`HIPS` at $Y \approx 0.9532\text{ m}$, `HEAD` at $Y \approx 1.6130\text{ m}$).
  - Recompute accessor `"min"` and `"max"` bounds accurately for the normalized `POSITION` accessor.

### 4. Degenerate Triangle Sanitization & Attribute Synthesis (`§6`, `§8.4`)
- Detect and sanitize degenerate zero-area triangles ($\text{area} = \frac{1}{2}\|(v_1 - v_0) \times (v_2 - v_0)\|_2 < 10^{-10}\text{ m}^2$, such as the 236 degenerate faces in `PLATODOOM_RAW.glb`) so that face/vertex normal and tangent calculations never divide by zero or emit `NaN` / `Inf`.
- When an input `.glb` already contains `NORMAL`, `TEXCOORD_0`, `TANGENT`, `materials`, and `textures`, preserve them 1-to-1 with zero loss or distortion (re-normalizing existing `NORMAL` unit vectors if scaled/rotated).
- When an un-textured raw scan (such as `PLATODOOM_RAW.glb`) lacks `NORMAL`, `TEXCOORD_0`, or `materials`, automatically synthesize area-weighted smooth outward vertex normals (`NORMAL`, unit length $\|n\|_2 = 1.0$, zero `NaN`/`Inf`), cylindrical/planar `TEXCOORD_0` UVs, and a clean default PBR metallic-roughness material so the rigged output is immediately renderable in WebGPU/WebGL2.
