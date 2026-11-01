#!/usr/bin/env python3
"""
Migrate SkateAlley Character GLBs from Legacy Quaternius Skeleton to
Ready Player Me (RPM) / Mixamo Standard Humanoid Skeleton.

Per animation_Redo.md:
1. Removes all embedded Quaternius animation clips, accessors, and bufferViews.
2. Removes the legacy Z-up compensation `root` joint and renames `Armature.001` -> `Armature`.
3. Maps all 64 humanoid deform bones 1-to-1 to the Ready Player Me (RPM) bone hierarchy
   (`Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`, `LeftShoulder`..`RightToe_End`).
4. Aligns each bone's local bind-pose rotation to the official RPM `Masculine_TPose.glb`
   local rotation while preserving the character's exact anatomical world joint positions.
5. Recomputes exact 4x4 column-major `inverseBindMatrices` so `W_bind * IBM = I_4`
   (zero mesh distortion in T-pose, 100% quaternion compatibility with RPM animations).
"""

import copy
import json
import math
import os
import shutil
import struct
import sys

RPM_TPOSE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets",
    "rpm",
    "Masculine_TPose.glb",
)

CHARACTER_FILES = [
    "LUIS_HOLOSYS_RIGGED.glb",
    "LUIS_RIGGED_CLAY.glb",
    "LUIS_RIGGED.glb",
    "PLATODOOM_HOLOSYS_RIGGED.glb",
    "PLATODOOM_RIGGED.glb",
]

ALIAS_COPIES = {
    "LUIS_RIGGED.glb": "character_hoodie.glb",
    "PLATODOOM_RIGGED.glb": "character_tunic.glb",
}

QUATERNIUS_TO_RPM_BONE_MAP = {
    "pelvis": "Hips",
    "spine_01": "Spine",
    "spine_02": "Spine1",
    "spine_03": "Spine2",
    "neck_01": "Neck",
    "Head": "Head",
    "clavicle_l": "LeftShoulder",
    "upperarm_l": "LeftArm",
    "lowerarm_l": "LeftForeArm",
    "hand_l": "LeftHand",
    "thumb_01_l": "LeftHandThumb1",
    "thumb_02_l": "LeftHandThumb2",
    "thumb_03_l": "LeftHandThumb3",
    "thumb_04_leaf_l": "LeftHandThumb4",
    "index_01_l": "LeftHandIndex1",
    "index_02_l": "LeftHandIndex2",
    "index_03_l": "LeftHandIndex3",
    "index_04_leaf_l": "LeftHandIndex4",
    "middle_01_l": "LeftHandMiddle1",
    "middle_02_l": "LeftHandMiddle2",
    "middle_03_l": "LeftHandMiddle3",
    "middle_04_leaf_l": "LeftHandMiddle4",
    "ring_01_l": "LeftHandRing1",
    "ring_02_l": "LeftHandRing2",
    "ring_03_l": "LeftHandRing3",
    "ring_04_leaf_l": "LeftHandRing4",
    "pinky_01_l": "LeftHandPinky1",
    "pinky_02_l": "LeftHandPinky2",
    "pinky_03_l": "LeftHandPinky3",
    "pinky_04_leaf_l": "LeftHandPinky4",
    "clavicle_r": "RightShoulder",
    "upperarm_r": "RightArm",
    "lowerarm_r": "RightForeArm",
    "hand_r": "RightHand",
    "thumb_01_r": "RightHandThumb1",
    "thumb_02_r": "RightHandThumb2",
    "thumb_03_r": "RightHandThumb3",
    "thumb_04_leaf_r": "RightHandThumb4",
    "index_01_r": "RightHandIndex1",
    "index_02_r": "RightHandIndex2",
    "index_03_r": "RightHandIndex3",
    "index_04_leaf_r": "RightHandIndex4",
    "middle_01_r": "RightHandMiddle1",
    "middle_02_r": "RightHandMiddle2",
    "middle_03_r": "RightHandMiddle3",
    "middle_04_leaf_r": "RightHandMiddle4",
    "ring_01_r": "RightHandRing1",
    "ring_02_r": "RightHandRing2",
    "ring_03_r": "RightHandRing3",
    "ring_04_leaf_r": "RightHandRing4",
    "pinky_01_r": "RightHandPinky1",
    "pinky_02_r": "RightHandPinky2",
    "pinky_03_r": "RightHandPinky3",
    "pinky_04_leaf_r": "RightHandPinky4",
    "thigh_l": "LeftUpLeg",
    "calf_l": "LeftLeg",
    "foot_l": "LeftFoot",
    "ball_l": "LeftToeBase",
    "ball_leaf_l": "LeftToe_End",
    "thigh_r": "RightUpLeg",
    "calf_r": "RightLeg",
    "foot_r": "RightFoot",
    "ball_r": "RightToeBase",
    "ball_leaf_r": "RightToe_End",
}


def quat_normalize(q):
    x, y, z, w = q
    n = math.sqrt(x * x + y * y + z * z + w * w)
    if n < 1e-12:
        return [0.0, 0.0, 0.0, 1.0]
    return [x / n, y / n, z / n, w / n]


def quat_to_mat3(q):
    x, y, z, w = quat_normalize(q)
    return [
        [1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y - z * w), 2.0 * (x * z + y * w)],
        [2.0 * (x * y + z * w), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z - x * w)],
        [2.0 * (x * z - y * w), 2.0 * (y * z + x * w), 1.0 - 2.0 * (x * x + y * y)],
    ]


def mat3_transpose(A):
    return [
        [A[0][0], A[1][0], A[2][0]],
        [A[0][1], A[1][1], A[2][1]],
        [A[0][2], A[1][2], A[2][2]],
    ]


def mat3_vec3_mul(A, v):
    return [
        A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
        A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
        A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2],
    ]


def trs_to_mat4(t, r, s):
    R = quat_to_mat3(r)
    return [
        [R[0][0] * s[0], R[0][1] * s[1], R[0][2] * s[2], t[0]],
        [R[1][0] * s[0], R[1][1] * s[1], R[1][2] * s[2], t[1]],
        [R[2][0] * s[0], R[2][1] * s[1], R[2][2] * s[2], t[2]],
        [0.0, 0.0, 0.0, 1.0],
    ]


def mat4_mul(A, B):
    return [
        [sum(A[i][k] * B[k][j] for k in range(4)) for j in range(4)]
        for i in range(4)
    ]


def rigid_mat4_inverse(M):
    """Exact inverse of an SE(3) rigid transform matrix (unit scale)."""
    R = [[M[i][j] for j in range(3)] for i in range(3)]
    RT = mat3_transpose(R)
    t = [M[0][3], M[1][3], M[2][3]]
    neg_RT_t = [-x for x in mat3_vec3_mul(RT, t)]
    return [
        [RT[0][0], RT[0][1], RT[0][2], neg_RT_t[0]],
        [RT[1][0], RT[1][1], RT[1][2], neg_RT_t[1]],
        [RT[2][0], RT[2][1], RT[2][2], neg_RT_t[2]],
        [0.0, 0.0, 0.0, 1.0],
    ]


def mat4_to_col_major_16(M):
    """Convert row-major 4x4 matrix to glTF column-major 16-float tuple."""
    out = []
    for col in range(4):
        for row in range(4):
            out.append(float(M[row][col]))
    return out


def read_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    magic, version, length = struct.unpack("<4sII", data[:12])
    if magic != b"glTF":
        raise ValueError(f"{path}: Not a valid GLB file")
    j_len, j_type = struct.unpack("<II", data[12:20])
    gltf = json.loads(data[20 : 20 + j_len].decode("utf-8"))
    b_start = 20 + j_len
    b_len, b_type = struct.unpack("<II", data[b_start : b_start + 8])
    bin_data = bytearray(data[b_start + 8 : b_start + 8 + b_len])
    return gltf, bin_data


def write_glb(path, gltf, bin_data):
    # Pad binary buffer to 4-byte alignment with null bytes
    while len(bin_data) % 4 != 0:
        bin_data.append(0)
    gltf["buffers"][0]["byteLength"] = len(bin_data)

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total_len))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(bin_data), 0x004E4942))
        f.write(bin_data)


def compute_world_matrices(nodes):
    parents = {}
    for idx, n in enumerate(nodes):
        for c in n.get("children", []):
            parents[c] = idx

    world = {}

    def get_w(idx):
        if idx in world:
            return world[idx]
        n = nodes[idx]
        t = n.get("translation", [0.0, 0.0, 0.0])
        r = n.get("rotation", [0.0, 0.0, 0.0, 1.0])
        s = n.get("scale", [1.0, 1.0, 1.0])
        loc = trs_to_mat4(t, r, s)
        if idx in parents:
            world[idx] = mat4_mul(get_w(parents[idx]), loc)
        else:
            world[idx] = loc
        return world[idx]

    for i in range(len(nodes)):
        get_w(i)
    return world, parents


def load_rpm_reference_rotations(rpm_tpose_path):
    gltf, _ = read_glb(rpm_tpose_path)
    nodes = gltf["nodes"]
    world, _ = compute_world_matrices(nodes)
    local_rots = {}
    world_mats = {}
    for idx, n in enumerate(nodes):
        name = n.get("name")
        if name:
            local_rots[name] = quat_normalize(n.get("rotation", [0.0, 0.0, 0.0, 1.0]))
            world_mats[name] = world[idx]
    return local_rots, world_mats


def migrate_character_glb(path, rpm_local_rots):
    gltf, bin_data = read_glb(path)
    nodes = gltf["nodes"]
    orig_world, orig_parents = compute_world_matrices(nodes)

    skin = gltf["skins"][0]
    orig_joints = skin["joints"]

    # Check if already migrated
    first_joint_name = nodes[orig_joints[0]].get("name", "")
    if first_joint_name == "Hips" and len(orig_joints) == 64:
        print(f"  [SKIP] {path} is already migrated to 64-bone RPM skeleton.")
        return {
            "path": os.path.abspath(path),
            "bone_count": 64,
            "root_bone": "Hips",
            "animations_count": len(gltf.get("animations", [])),
            "max_pos_err": 0.0,
            "max_bind_err": 0.0,
            "size_bytes": os.path.getsize(path),
        }

    if first_joint_name != "root" or len(orig_joints) != 65:
        raise RuntimeError(
            f"{path}: Expected 65-joint Quaternius rig starting with 'root', got {len(orig_joints)} joints starting with '{first_joint_name}'"
        )

    root_node_idx = orig_joints[0]
    pelvis_node_idx = orig_joints[1]
    if nodes[pelvis_node_idx].get("name") != "pelvis":
        raise RuntimeError(f"{path}: Expected joint[1] to be 'pelvis'")

    # 1. Record original world positions of all 64 deform bones
    deform_joint_indices = orig_joints[1:]  # 64 bones starting at pelvis
    orig_bone_world_pos = {}
    for j_idx in deform_joint_indices:
        old_name = nodes[j_idx]["name"]
        if old_name not in QUATERNIUS_TO_RPM_BONE_MAP:
            raise RuntimeError(f"{path}: Unknown bone '{old_name}' at node {j_idx}")
        W = orig_world[j_idx]
        orig_bone_world_pos[j_idx] = [W[0][3], W[1][3], W[2][3]]

    # 2. Unlink `root` from Armature, link `pelvis` (`Hips`) directly under Armature
    armature_idx = orig_parents[root_node_idx]
    armature_node = nodes[armature_idx]
    armature_node["name"] = "Armature"
    skin["name"] = "Armature"
    armature_node["children"] = [
        pelvis_node_idx if c == root_node_idx else c
        for c in armature_node.get("children", [])
    ]
    # Ensure Armature has clean identity transform
    armature_node.pop("translation", None)
    armature_node.pop("rotation", None)
    armature_node.pop("scale", None)

    # 3. Rename all 64 deform bones to RPM names and set RPM local rotations
    new_parents = {}
    for idx, n in enumerate(nodes):
        if idx == root_node_idx:
            continue
        for c in n.get("children", []):
            new_parents[c] = idx

    for j_idx in deform_joint_indices:
        old_name = nodes[j_idx]["name"]
        rpm_name = QUATERNIUS_TO_RPM_BONE_MAP[old_name]
        nodes[j_idx]["name"] = rpm_name
        nodes[j_idx]["rotation"] = list(rpm_local_rots[rpm_name])
        nodes[j_idx].pop("scale", None)

    # Compute world rotations top-down (since rotations only depend on parent rotations)
    # First set temporary zero translations just to propagate exact world rotation matrices
    for j_idx in deform_joint_indices:
        nodes[j_idx]["translation"] = [0.0, 0.0, 0.0]
    rot_world, _ = compute_world_matrices(nodes)

    # Now compute exact local translation for each bone j:
    # t_j_local = R_parent_world^T * (p_j_world - p_parent_world)
    for j_idx in deform_joint_indices:
        p_j = orig_bone_world_pos[j_idx]
        parent_idx = new_parents.get(j_idx)
        if parent_idx is None or parent_idx == armature_idx:
            # Hips directly under identity Armature
            nodes[j_idx]["translation"] = list(p_j)
        else:
            p_parent = orig_bone_world_pos[parent_idx]
            diff = [p_j[k] - p_parent[k] for k in range(3)]
            W_parent = rot_world[parent_idx]
            R_parent = [[W_parent[r][c] for c in range(3)] for r in range(3)]
            R_parent_T = mat3_transpose(R_parent)
            t_local = mat3_vec3_mul(R_parent_T, diff)
            nodes[j_idx]["translation"] = t_local

    # 4. Remove `root_node_idx` from `nodes` array and re-index node references
    old_to_new_node = {}
    new_nodes = []
    for idx, n in enumerate(nodes):
        if idx == root_node_idx:
            continue
        old_to_new_node[idx] = len(new_nodes)
        new_nodes.append(n)

    for n in new_nodes:
        if "children" in n:
            n["children"] = [old_to_new_node[c] for c in n["children"]]

    for scene in gltf.get("scenes", []):
        if "nodes" in scene:
            scene["nodes"] = [old_to_new_node[c] for c in scene["nodes"]]

    gltf["nodes"] = new_nodes
    new_deform_joints = [old_to_new_node[j_idx] for j_idx in deform_joint_indices]
    skin["joints"] = new_deform_joints
    if "skeleton" in skin:
        skin["skeleton"] = old_to_new_node[pelvis_node_idx]

    # 5. Recompute world transforms on the migrated node tree and verify accuracy
    final_world, _ = compute_world_matrices(new_nodes)
    max_pos_err = 0.0
    for orig_j_idx, new_j_idx in zip(deform_joint_indices, new_deform_joints):
        p_orig = orig_bone_world_pos[orig_j_idx]
        W_new = final_world[new_j_idx]
        p_new = [W_new[0][3], W_new[1][3], W_new[2][3]]
        err = math.sqrt(sum((p_orig[k] - p_new[k]) ** 2 for k in range(3)))
        if err > max_pos_err:
            max_pos_err = err
    if max_pos_err > 1e-5:
        raise RuntimeError(f"{path}: World bone position drift {max_pos_err:.2e} exceeds 1e-5")

    # 6. Update JOINTS_0 in all mesh primitives (shift non-zero joint indices down by 1)
    updated_joint_accessors = set()
    for mesh in gltf.get("meshes", []):
        for prim in mesh.get("primitives", []):
            if "JOINTS_0" in prim.get("attributes", {}):
                acc_idx = prim["attributes"]["JOINTS_0"]
                if acc_idx in updated_joint_accessors:
                    continue
                updated_joint_accessors.add(acc_idx)
                j_acc = gltf["accessors"][acc_idx]
                j_bv = gltf["bufferViews"][j_acc["bufferView"]]
                j_off = j_bv.get("byteOffset", 0) + j_acc.get("byteOffset", 0)
                cnt = j_acc["count"]
                ctype = j_acc["componentType"]
                fmt = "<4B" if ctype == 5121 else "<4H"
                step = 4 if ctype == 5121 else 8
                for i in range(cnt):
                    js = struct.unpack_from(fmt, bin_data, j_off + i * step)
                    new_js = tuple(max(0, j - 1) for j in js)
                    struct.pack_into(fmt, bin_data, j_off + i * step, *new_js)

    # 7. Recompute 64 inverseBindMatrices and write into the IBM bufferView
    ibm_acc_idx = skin["inverseBindMatrices"]
    ibm_acc = gltf["accessors"][ibm_acc_idx]
    ibm_bv = gltf["bufferViews"][ibm_acc["bufferView"]]
    ibm_off = ibm_bv.get("byteOffset", 0) + ibm_acc.get("byteOffset", 0)

    max_bind_err = 0.0
    for idx_in_skin, new_j_idx in enumerate(new_deform_joints):
        W = final_world[new_j_idx]
        ibm = rigid_mat4_inverse(W)
        # Verify W * ibm == I_4
        prod = mat4_mul(W, ibm)
        for r in range(4):
            for c in range(4):
                target = 1.0 if r == c else 0.0
                err = abs(prod[r][c] - target)
                if err > max_bind_err:
                    max_bind_err = err
        col_floats = mat4_to_col_major_16(ibm)
        struct.pack_into("<16f", bin_data, ibm_off + idx_in_skin * 64, *col_floats)

    ibm_acc["count"] = 64
    ibm_bv["byteLength"] = 64 * 64  # 4096 bytes

    # 8. Strip all embedded Quaternius animations and prune unused accessors/bufferViews
    gltf.pop("animations", None)

    used_accs = set()
    used_bvs = set()
    for m in gltf.get("meshes", []):
        for prim in m.get("primitives", []):
            for k, v in prim.get("attributes", {}).items():
                used_accs.add(v)
            if "indices" in prim:
                used_accs.add(prim["indices"])
    for s in gltf.get("skins", []):
        if "inverseBindMatrices" in s:
            used_accs.add(s["inverseBindMatrices"])
    for acc_idx in used_accs:
        used_bvs.add(gltf["accessors"][acc_idx]["bufferView"])
    for img in gltf.get("images", []):
        if "bufferView" in img:
            used_bvs.add(img["bufferView"])

    max_acc_idx = max(used_accs)
    max_bv_idx = max(used_bvs)
    if max_acc_idx != len(used_accs) - 1 or max_bv_idx != len(used_bvs) - 1:
        raise RuntimeError(f"{path}: Non-contiguous non-animation accessors or bufferViews")

    gltf["accessors"] = gltf["accessors"][: max_acc_idx + 1]
    gltf["bufferViews"] = gltf["bufferViews"][: max_bv_idx + 1]

    max_bin_end = 0
    for bv in gltf["bufferViews"]:
        end = bv.get("byteOffset", 0) + bv["byteLength"]
        if end > max_bin_end:
            max_bin_end = end
    bin_data = bin_data[:max_bin_end]

    write_glb(path, gltf, bin_data)
    print(
        f"  [OK] {os.path.basename(path)}: 64 RPM bones, 0 embedded animations, "
        f"max_pos_err={max_pos_err:.2e}m, max_bind_err={max_bind_err:.2e}, "
        f"size={os.path.getsize(path):,} bytes"
    )
    return {
        "path": os.path.abspath(path),
        "bone_count": 64,
        "root_bone": "Hips",
        "animations_count": 0,
        "max_pos_err": float(max_pos_err),
        "max_bind_err": float(max_bind_err),
        "size_bytes": os.path.getsize(path),
    }


CANONICAL_RPM_LOCAL_ROTATIONS = {
    "Hips": [0.0162302, -2.624e-05, -4.2e-07, 0.99986828],
    "Spine": [-0.06853317, 2.627e-05, 1.81e-06, 0.99764884],
    "Spine1": [-0.03212389, 6e-08, 1e-07, 0.99948389],
    "Spine2": [0.04709896, -2.4e-07, 1.1e-07, 0.99889023],
    "Neck": [0.20275378, 7e-08, 1.1e-07, 0.97922975],
    "Head": [-0.16267579, -3.1e-07, -3.8e-07, 0.98667958],
    "LeftShoulder": [-0.50413549, -0.4903079, 0.5138908, -0.49128589],
    "LeftArm": [-0.01699487, -0.19165535, 0.00789032, 0.98128342],
    "LeftForeArm": [2e-08, -1e-08, 0.02617705, 0.99965732],
    "LeftHand": [0.00714944, 0.27302628, -0.02518174, 0.96165036],
    "LeftHandThumb1": [1e-08, 1e-08, 0.41000252, 0.91208439],
    "LeftHandThumb2": [1e-08, 1e-08, -0.4100026, 0.91208436],
    "LeftHandThumb3": [0.0, 0.0, 0.0, 1.0],
    "LeftHandThumb4": [0.01297596, 0.05238604, -0.00692916, 0.99851856],
    "LeftHandIndex1": [0.0, 0.0, 0.0, 1.0],
    "LeftHandIndex2": [0.0, 0.0, 0.0, 1.0],
    "LeftHandIndex3": [0.0, 0.0, 0.0, 1.0],
    "LeftHandIndex4": [0.04478403, 0.05674666, -0.00713273, 0.99735818],
    "LeftHandMiddle1": [0.0, 0.0, 0.0, 1.0],
    "LeftHandMiddle2": [0.0, 0.0, 0.0, 1.0],
    "LeftHandMiddle3": [0.0, 0.0, 0.0, 1.0],
    "LeftHandMiddle4": [0.02381281, 0.02245892, -0.00164729, 0.99946277],
    "LeftHandRing1": [0.0, 0.0, 0.0, 1.0],
    "LeftHandRing2": [0.0, 0.0, 0.0, 1.0],
    "LeftHandRing3": [0.0, 0.0, 0.0, 1.0],
    "LeftHandRing4": [0.00665057, -0.00689841, 0.02211652, 0.99970948],
    "LeftHandPinky1": [0.0, 0.0, 0.0, 1.0],
    "LeftHandPinky2": [0.0, 0.0, 0.0, 1.0],
    "LeftHandPinky3": [0.0, 0.0, 0.0, 1.0],
    "LeftHandPinky4": [0.13740319, 0.10453116, -0.01238184, 0.98490623],
    "RightShoulder": [0.50413132, -0.49031088, 0.51388824, 0.49128986],
    "RightArm": [-0.01927656, 0.19180338, 0.00011838, 0.98124404],
    "RightForeArm": [-1e-08, 0.0, -0.02617688, 0.99965733],
    "RightHand": [0.00714942, -0.27302628, 0.02518163, 0.96165036],
    "RightHandThumb1": [1e-08, 0.0, -0.41000486, 0.91208334],
    "RightHandThumb2": [2e-08, -2e-08, 0.41000252, 0.91208439],
    "RightHandThumb3": [0.0, 0.0, 0.0, 1.0],
    "RightHandThumb4": [0.01298076, -0.05237793, 0.00692649, 0.99851894],
    "RightHandIndex1": [0.0, 0.0, 0.0, 1.0],
    "RightHandIndex2": [0.0, 0.0, 0.0, 1.0],
    "RightHandIndex3": [0.0, 0.0, 0.0, 1.0],
    "RightHandIndex4": [0.044795, -0.05673525, 0.00713721, 0.9973583],
    "RightHandMiddle1": [0.0, 0.0, 0.0, 1.0],
    "RightHandMiddle2": [0.0, 0.0, 0.0, 1.0],
    "RightHandMiddle3": [0.0, 0.0, 0.0, 1.0],
    "RightHandMiddle4": [0.02380402, -0.02246819, 0.00164216, 0.99946278],
    "RightHandRing1": [0.0, 0.0, 0.0, 1.0],
    "RightHandRing2": [0.0, 0.0, 0.0, 1.0],
    "RightHandRing3": [0.0390516, -1e-08, 0.0, 0.9992372],
    "RightHandRing4": [0.00665799, 0.00690641, -0.02211559, 0.99970939],
    "RightHandPinky1": [0.0, 0.0, 0.0, 1.0],
    "RightHandPinky2": [0.0, 0.0, 0.0, 1.0],
    "RightHandPinky3": [0.0, 0.0, 0.0, 1.0],
    "RightHandPinky4": [0.13739918, -0.10453588, 0.01238135, 0.9849063],
    "LeftUpLeg": [2.623e-05, -0.02166901, 0.9997652, 5.7e-07],
    "LeftLeg": [-0.01745242, 0.0, 0.0, 0.99984769],
    "LeftFoot": [0.51143367, 0.0519562, 0.02041017, 0.85750777],
    "LeftToeBase": [0.26822883, -0.04375387, 0.01854728, 0.96218236],
    "LeftToe_End": [0.0069079, 0.69840903, 0.01767031, 0.71544732],
    "RightUpLeg": [2.623e-05, -0.02166901, 0.9997652, 5.7e-07],
    "RightLeg": [-0.01745234, 0.0, 0.0, 0.9998477],
    "RightFoot": [0.51143455, -0.05195823, -0.02041123, 0.8575071],
    "RightToeBase": [0.26822859, 0.04374935, -0.01855645, 0.96218246],
    "RightToe_End": [0.00690714, -0.69842994, -0.01767031, 0.71542692],
}


def migrate_single_character_glb(path, rpm_tpose_path=RPM_TPOSE_PATH):
    if rpm_tpose_path and os.path.exists(rpm_tpose_path):
        rpm_local_rots, _ = load_rpm_reference_rotations(rpm_tpose_path)
    else:
        hoodie_ref = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "character_hoodie.glb",
        )
        if os.path.exists(hoodie_ref) and os.path.abspath(hoodie_ref) != os.path.abspath(path):
            rpm_local_rots, _ = load_rpm_reference_rotations(hoodie_ref)
        else:
            rpm_local_rots = {k: quat_normalize(v) for k, v in CANONICAL_RPM_LOCAL_ROTATIONS.items()}
    return migrate_character_glb(path, rpm_local_rots)


def main():
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        for arg_path in sys.argv[1:]:
            migrate_single_character_glb(os.path.abspath(arg_path))
        return

    workspace = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.exists(RPM_TPOSE_PATH):
        raise FileNotFoundError(f"Missing RPM reference T-Pose: {RPM_TPOSE_PATH}")

    rpm_local_rots, _ = load_rpm_reference_rotations(RPM_TPOSE_PATH)
    print(f"Loaded {len(rpm_local_rots)} reference node rotations from {RPM_TPOSE_PATH}")

    for filename in CHARACTER_FILES:
        full_path = os.path.join(workspace, filename)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Character file not found: {full_path}")
        migrate_character_glb(full_path, rpm_local_rots)

    for src_name, dst_name in ALIAS_COPIES.items():
        src_path = os.path.join(workspace, src_name)
        dst_path = os.path.join(workspace, dst_name)
        shutil.copy2(src_path, dst_path)
        print(f"  [SYNC] Copied {src_name} -> {dst_name}")


if __name__ == "__main__":
    main()
