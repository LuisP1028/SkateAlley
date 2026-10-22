# Ticket 005: Live Three.js/WebGL2 Runtime Dual-Rig Integration in `sandbox.js` and Variant Selector Wiring in `index.html`

- **Ticket ID**: `ticket-005`
- **Target Stage**: `implement` (Note: Independent test suite authoring and execution are strictly reserved for the dedicated `tester` stage under `INV-NO-SELF-TEST-01`.)
- **Upstream Specification Reference**: [`functional_specification_033.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/functional_specification_033.md) §1, §2, §4.1, §4.3, §4.4, §10 (AC-1 through AC-6) and `INV-GOAL-01` / `INV-ROOT-CAUSE-AGENCY-01`
- **Depends On**: `ticket-004`

---

## Objective

Connect the standalone 35-joint `SKATE3_RX2_RIG` character deliverables (`PLATODOOM_SKATE3_RIGGED.glb` and `LUIS_SKATE3_RIGGED.glb`) into the live Three.js/WebGL2 application runtime in [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/sandbox.js) and [`index.html`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/index.html) so that `CharacterController` cleanly instantiates, validates, and animates both existing 64-bone ReadyPlayerMe (RPM) rigs and 35-joint `SKATE3_RX2_RIG` armatures with zero missing-bone panics, zero unweighted vertex tears, zero inverted limbs, and zero regressions to existing default corridor startup.

---

## Mandatory Target Deliverables (`MANDATORY_TARGET`)

| File Path | Action | Required Deliverable State |
| :--- | :--- | :--- |
| `sandbox.js` | Modify | Register `platodoom_skate3` (`./PLATODOOM_SKATE3_RIGGED.glb`) and `luis_skate3` (`./LUIS_SKATE3_RIGGED.glb`) in `ASSET_PATHS` and `GLB_VARIANT_CATALOG`; define `SKATE3_REQUIRED_MASTER_RIG_BONES` (the 35 canonical `SKATE3_RX2_RIG` joints); update `CharacterController` skeleton validation and bone lookup aliasing to support both 64-bone RPM rigs and 35-joint `SKATE3_RX2_RIG` rigs. |
| `index.html` | Modify | Add `<option value="platodoom_skate3">` and `<option value="luis_skate3">` to `#glb-variant-select` so users and live runtime checks can switch directly to the 35-joint `SKATE3_RX2_RIG` variants. |

---

## Read-Only Discovery Context (`READ_ONLY_CONTEXT`)

| File Path | Role in Discovery / Reference |
| :--- | :--- |
| `functional_specification_033.md` | Authoritative specification requiring clean runtime instantiation with zero missing-bone panics, zero unweighted vertex tears, and zero inverted limbs (§1, §4.1). |
| `20261019T213303-735-zjzk/plan-scan-2-skater.glb` | Canonical 35-joint `SKATE3_RX2_RIG` reference rig. |
| `PLATODOOM_HOLOSYS_RIGGED.glb` | Existing 64-bone default character asset (must remain untouched as default startup variant). |
| `LUIS_HOLOSYS_RIGGED.glb` | Existing 64-bone companion character asset (must remain untouched). |

---

## Functional & Architectural Requirements

### 1. Asset Catalog Registration (`sandbox.js` & `index.html`)
- In [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/sandbox.js):
  - Add to `ASSET_PATHS`:
    - `platodoom_skate3: './PLATODOOM_SKATE3_RIGGED.glb'`
    - `luis_skate3: './LUIS_SKATE3_RIGGED.glb'`
  - Add to `GLB_VARIANT_CATALOG`:
    - `platodoom_skate3: { label: 'PLATODOOM (Skate 3 35-Joint Master Rig)', path: ASSET_PATHS.platodoom_skate3, character: 'platodoom', rigProfile: 'SKATE3_RX2_RIG' }`
    - `luis_skate3: { label: 'LUIS (Skate 3 35-Joint Master Rig)', path: ASSET_PATHS.luis_skate3, character: 'luis', rigProfile: 'SKATE3_RX2_RIG' }`
  - Keep `platodoom_holosys` (`./PLATODOOM_HOLOSYS_RIGGED.glb`) and `luis_holosys` (`./LUIS_HOLOSYS_RIGGED.glb`) as the default initial character assets so existing corridor startup and 64-bone tests remain 100% preserved.
- In [`index.html`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/worktrees/agent-plan-20261022T230304-120-0j7w/index.html):
  - Add `<option value="platodoom_skate3">PLATODOOM_SKATE3_RIGGED.glb (Skate 3 35-Joint)</option>` and `<option value="luis_skate3">LUIS_SKATE3_RIGGED.glb (Skate 3 35-Joint)</option>` to `#glb-variant-select`.

### 2. Dual-Rig Validation & Bone Aliasing in `CharacterController` (`sandbox.js`)
- Define `SKATE3_REQUIRED_MASTER_RIG_BONES` containing the exact 35 canonical bone names from `functional_specification_033.md` §4.1:
  `['HIPS', 'SPINE', 'SPINE1', 'SPINE2', 'SPINE3', 'NECK', 'NECK1', 'HEAD', 'RIGHTSHOULDER', 'RIGHTARM', 'RIGHTFOREARM', 'RIGHTHAND', 'LEFTSHOULDER', 'LEFTARM', 'LEFTFOREARM', 'LEFTHAND', 'RIGHTUPLEG', 'RIGHTLEG', 'RIGHTFOOT', 'RIGHTTOEBASE', 'LEFTUPLEG', 'LEFTLEG', 'LEFTFOOT', 'LEFTTOEBASE', 'SKATEBOARD_ROOT', 'TRUCK_FRONT', 'RIGHT_WHEELFRONT', 'LEFT_WHEELFRONT', 'TRUCK_BACK', 'LEFT_WHEELBACK', 'RIGHT_WHEELBACK', 'RIGHTTOEBASE_REPARENTED', 'LEFTTOEBASE_REPARENTED', 'LEFTHAND_REPARENTED', 'RIGHTHAND_REPARENTED']`.
- In `CharacterController` (`sandbox.js` around lines 6700–6775):
  - Accept skeletons with `primarySkeleton.bones.length === 64` (validated against `REQUIRED_MASTER_RIG_BONES`) OR `primarySkeleton.bones.length === 35` (validated against `SKATE3_REQUIRED_MASTER_RIG_BONES`). Raise `raiseFatalError` if a skeleton matches neither contract or is missing any required bone from its respective contract.
  - When validating a 35-joint `SKATE3_RX2_RIG` skeleton (`this.rigProfile = 'SKATE3_RX2_RIG'`), permit the canonical `SKATEBOARD_ROOT`, `TRUCK_FRONT`, and `TRUCK_BACK` bone nodes (`isBone`) that belong to the 35-joint `SKATE3_RX2_RIG` specification while continuing to reject legacy embedded prop *meshes* (`Skateboard_Mesh`, `SprayCan_Mesh`, or non-bone mesh nodes). For 64-bone RPM rigs (`this.rigProfile = 'RPM_64'`), preserve the existing `LEGACY_PROP_NODES` check unchanged.
  - Populate bone alias mappings on `this.bones` when `this.rigProfile === 'SKATE3_RX2_RIG'` (`Hips -> HIPS`, `Spine -> SPINE`, `Spine1 -> SPINE1`, `Spine2 -> SPINE2`, `Neck -> NECK`, `Head -> HEAD`, `LeftShoulder -> LEFTSHOULDER`, `LeftArm -> LEFTARM`, `LeftForeArm -> LEFTFOREARM`, `LeftHand -> LEFTHAND`, `RightShoulder -> RIGHTSHOULDER`, `RightArm -> RIGHTARM`, `RightForeArm -> RIGHTFOREARM`, `RightHand -> RIGHTHAND`, `LeftUpLeg -> LEFTUPLEG`, `LeftLeg -> LEFTLEG`, `LeftFoot -> LEFTFOOT`, `LeftToeBase -> LEFTTOEBASE`, `RightUpLeg -> RIGHTUPLEG`, `RightLeg -> RIGHTLEG`, `RightFoot -> RIGHTFOOT`, `RightToeBase -> RIGHTTOEBASE`) and remap animation track target node names when binding clips to a 35-joint `SKATE3_RX2_RIG` skeleton so procedural posture controllers and animation mixers operate seamlessly on both rig profiles.
