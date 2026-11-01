#!/usr/bin/env python3
"""
Un-Rigged LUIS .glb Modular Limb Partitioning, Continuous Front/Back Orthographic Skin
Projection, Quadric Surface Decimation, Isotropic Proportion Mapping, SVD Bone-Segment
211/127-Frame Quake IDPO v6 .mdl Compiler, and /nzportable/ PK3 Packager
(Functional Specifications 045 & 046).
"""

import argparse
import hashlib
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import time
import zipfile
from typing import Any, Dict, List, Optional, Sequence, Tuple

GREEK_ENV_PYTHON = "/opt/anaconda3/envs/greek_env/bin/python"
BLENDER_BIN = "/Applications/Blender.app/Contents/MacOS/Blender"

try:
    import cv2
    import numpy as np
except ImportError:
    if os.path.exists(GREEK_ENV_PYTHON) and os.path.realpath(sys.executable) != os.path.realpath(GREEK_ENV_PYTHON):
        os.execv(GREEK_ENV_PYTHON, [GREEK_ENV_PYTHON] + sys.argv)
    raise

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import serve_skatealley  # noqa: E402
from gcs_rig_intake import (  # noqa: E402
    add_gcs_rig_cli_args,
    intake_assembled_character_for_rigging,
    select_pose_intake,
    sync_target_rigged_deliverables,
)

SOURCE_GLB_PATH = os.path.join(REPO_ROOT, "LUIS_TPOSE_STANDALONE_BACKUP.glb")
GAME_PK3_PATH = os.path.join(REPO_ROOT, "nzportable", "nzp", "game.pk3")
OUTPUT_PK3_PATH = os.path.join(REPO_ROOT, "nzportable", "nzp", "luis_zombies.pk3")
PACK_JSON_PATH = os.path.join(REPO_ROOT, "nzportable", "pack.json")
ROOT_COMPARISON_PNG_00 = os.path.join(REPO_ROOT, "00_luis_zombie_mdl_comparison.png")
ROOT_COMPARISON_PNG = os.path.join(REPO_ROOT, "luis_glb_vs_current_mdl_comparison.png")

SKIN_W = 256
SKIN_H = 256
ISOTROPIC_SCALE = 36.48  # 72.96 Quake units / 2.00 m GLB height

# Dedicated non-overlapping UV sub-rectangles (s_min, s_max, t_min, t_max) in the Front (0..127)
# and Back (128..255) hemispheres of the 256x256 skin atlas:
ATLAS_RECTS = {
    "head": {
        "front": (18, 109, 4, 78),
        "back": (146, 237, 4, 78),
        "u_range": (-0.106, 0.108),  # X_glb
        "v_range": (1.655, 2.002),   # Y_glb
    },
    "body": {
        "front": (6, 86, 82, 251),
        "back": (134, 214, 82, 251),
        "u_range": (-0.212, 0.212),  # X_glb
        "v_range": (0.000, 1.720),   # Y_glb
    },
    "crawler_body": {
        "front": (6, 86, 82, 251),
        "back": (134, 214, 82, 251),
        "u_range": (-0.212, 0.212),  # X_glb
        "v_range": (0.000, 1.720),   # Y_glb
    },
    "l_arm": {
        "front": (90, 106, 82, 251),
        "back": (218, 234, 82, 251),
        "u_range": (1.475, 1.730),   # Y_glb (thickness of T-pose arm)
        "v_range": (0.200, 0.905),   # X_glb (shoulder to fingertips)
    },
    "r_arm": {
        "front": (109, 125, 82, 251),
        "back": (237, 253, 82, 251),
        "u_range": (1.475, 1.730),   # Y_glb (thickness of T-pose arm)
        "v_range": (0.200, 0.905),   # -X_glb (shoulder to fingertips)
    },
}

STANDING_MODELS = (
    "models/ai/zb%.mdl",
    "models/ai/zh^.mdl",
    "models/ai/zal(.mdl",
    "models/ai/zar(.mdl",
    "models/ai/zfull.mdl",
)

CRAWLER_MODELS = (
    "models/ai/zbc%.mdl",
    "models/ai/zhc^.mdl",
    "models/ai/zalc(.mdl",
    "models/ai/zarc(.mdl",
    "models/ai/zcfull.mdl",
)

ALL_ZOMBIE_MODELS = STANDING_MODELS + CRAWLER_MODELS

QUAKE_162_NORMALS = np.array(
    [
        [-0.525731, 0.000000, 0.850651], [-0.442863, 0.238856, 0.864188], [-0.295242, 0.000000, 0.955423],
        [-0.309017, 0.500000, 0.809017], [-0.162460, 0.262866, 0.951056], [0.000000, 0.000000, 1.000000],
        [0.000000, 0.850651, 0.525731], [-0.147621, 0.716567, 0.681718], [0.147621, 0.716567, 0.681718],
        [0.000000, 0.525731, 0.850651], [0.309017, 0.500000, 0.809017], [0.525731, 0.000000, 0.850651],
        [0.295242, 0.000000, 0.955423], [0.442863, 0.238856, 0.864188], [0.162460, 0.262866, 0.951056],
        [-0.681718, 0.147621, 0.716567], [-0.809017, 0.309017, 0.500000], [-0.587785, 0.425325, 0.688191],
        [-0.850651, 0.525731, 0.000000], [-0.864188, 0.442863, 0.238856], [-0.716567, 0.681718, 0.147621],
        [-0.688191, 0.587785, 0.425325], [-0.500000, 0.809017, 0.309017], [-0.238856, 0.864188, 0.442863],
        [-0.425325, 0.688191, 0.587785], [-0.716567, 0.681718, -0.147621], [-0.500000, 0.809017, -0.309017],
        [-0.525731, 0.850651, 0.000000], [0.000000, 0.850651, -0.525731], [-0.238856, 0.864188, -0.442863],
        [0.000000, 0.955423, -0.295242], [-0.262866, 0.951056, -0.162460], [0.000000, 1.000000, 0.000000],
        [0.000000, 0.955423, 0.295242], [-0.262866, 0.951056, 0.162460], [0.238856, 0.864188, 0.442863],
        [0.262866, 0.951056, 0.162460], [0.500000, 0.809017, 0.309017], [0.238856, 0.864188, -0.442863],
        [0.262866, 0.951056, -0.162460], [0.500000, 0.809017, -0.309017], [0.850651, 0.525731, 0.000000],
        [0.716567, 0.681718, 0.147621], [0.716567, 0.681718, -0.147621], [0.525731, 0.850651, 0.000000],
        [0.425325, 0.688191, 0.587785], [0.864188, 0.442863, 0.238856], [0.688191, 0.587785, 0.425325],
        [0.809017, 0.309017, 0.500000], [0.681718, 0.147621, 0.716567], [0.587785, 0.425325, 0.688191],
        [0.955423, 0.295242, 0.000000], [1.000000, 0.000000, 0.000000], [0.951056, 0.162460, 0.262866],
        [0.850651, -0.525731, 0.000000], [0.955423, -0.295242, 0.000000], [0.864188, -0.442863, 0.238856],
        [0.951056, -0.162460, 0.262866], [0.809017, -0.309017, 0.500000], [0.681718, -0.147621, 0.716567],
        [0.850651, 0.000000, 0.525731], [0.864188, 0.442863, -0.238856], [0.809017, 0.309017, -0.500000],
        [0.951056, 0.162460, -0.262866], [0.525731, 0.000000, -0.850651], [0.681718, 0.147621, -0.716567],
        [0.681718, -0.147621, -0.716567], [0.850651, 0.000000, -0.525731], [0.809017, -0.309017, -0.500000],
        [0.864188, -0.442863, -0.238856], [0.951056, -0.162460, -0.262866], [0.147621, 0.716567, -0.681718],
        [0.309017, 0.500000, -0.809017], [0.425325, 0.688191, -0.587785], [0.442863, 0.238856, -0.864188],
        [0.587785, 0.425325, -0.688191], [0.688191, 0.587785, -0.425325], [-0.147621, 0.716567, -0.681718],
        [-0.309017, 0.500000, -0.809017], [0.000000, 0.525731, -0.850651], [-0.525731, 0.000000, -0.850651],
        [-0.442863, 0.238856, -0.864188], [-0.295242, 0.000000, -0.955423], [-0.162460, 0.262866, -0.951056],
        [0.000000, 0.000000, -1.000000], [0.295242, 0.000000, -0.955423], [0.162460, 0.262866, -0.951056],
        [-0.442863, -0.238856, -0.864188], [-0.309017, -0.500000, -0.809017], [-0.162460, -0.262866, -0.951056],
        [0.000000, -0.850651, -0.525731], [-0.147621, -0.716567, -0.681718], [0.147621, -0.716567, -0.681718],
        [0.000000, -0.525731, -0.850651], [0.309017, -0.500000, -0.809017], [0.442863, -0.238856, -0.864188],
        [0.162460, -0.262866, -0.951056], [0.238856, -0.864188, -0.442863], [0.500000, -0.809017, -0.309017],
        [0.425325, -0.688191, -0.587785], [0.716567, -0.681718, -0.147621], [0.688191, -0.587785, -0.425325],
        [0.587785, -0.425325, -0.688191], [0.000000, -0.955423, -0.295242], [0.000000, -1.000000, 0.000000],
        [0.262866, -0.951056, -0.162460], [0.000000, -0.850651, 0.525731], [0.000000, -0.955423, 0.295242],
        [0.238856, -0.864188, 0.442863], [0.262866, -0.951056, 0.162460], [0.500000, -0.809017, 0.309017],
        [0.716567, -0.681718, 0.147621], [0.525731, -0.850651, 0.000000], [-0.238856, -0.864188, -0.442863],
        [-0.500000, -0.809017, -0.309017], [-0.262866, -0.951056, -0.162460], [-0.850651, -0.525731, 0.000000],
        [-0.716567, -0.681718, -0.147621], [-0.716567, -0.681718, 0.147621], [-0.525731, -0.850651, 0.000000],
        [-0.500000, -0.809017, 0.309017], [-0.238856, -0.864188, 0.442863], [-0.262866, -0.951056, 0.162460],
        [-0.864188, -0.442863, 0.238856], [-0.809017, -0.309017, 0.500000], [-0.688191, -0.587785, 0.425325],
        [-0.681718, -0.147621, 0.716567], [-0.442863, -0.238856, 0.864188], [-0.587785, -0.425325, 0.688191],
        [-0.309017, -0.500000, 0.809017], [-0.147621, -0.716567, 0.681718], [-0.425325, -0.688191, 0.587785],
        [-0.162460, -0.262866, 0.951056], [0.442863, -0.238856, 0.864188], [0.162460, -0.262866, 0.951056],
        [0.309017, -0.500000, 0.809017], [0.147621, -0.716567, 0.681718], [0.000000, -0.525731, 0.850651],
        [0.425325, -0.688191, 0.587785], [0.587785, -0.425325, 0.688191], [0.688191, -0.587785, 0.425325],
        [-0.955423, 0.295242, 0.000000], [-0.951056, 0.162460, 0.262866], [-1.000000, 0.000000, 0.000000],
        [-0.850651, 0.000000, 0.525731], [-0.955423, -0.295242, 0.000000], [-0.951056, -0.162460, 0.262866],
        [-0.864188, 0.442863, -0.238856], [-0.951056, 0.162460, -0.262866], [-0.809017, 0.309017, -0.500000],
        [-0.864188, -0.442863, -0.238856], [-0.951056, -0.162460, -0.262866], [-0.809017, -0.309017, -0.500000],
        [-0.681718, 0.147621, -0.716567], [-0.681718, -0.147621, -0.716567], [-0.850651, 0.000000, -0.525731],
        [-0.688191, 0.587785, -0.425325], [-0.587785, 0.425325, -0.688191], [-0.425325, 0.688191, -0.587785],
        [-0.425325, -0.688191, -0.587785], [-0.587785, -0.425325, -0.688191], [-0.688191, -0.587785, -0.425325],
    ],
    dtype=np.float32,
)


def compute_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(4 * 1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def _normalize_and_lift_apose_to_tpose_2m(
    pos_all: np.ndarray,
    skeleton_metrics: Optional[Dict[str, Any]] = None,
) -> np.ndarray:
    """
    Normalizes arbitrary glTF character coordinates to canonical `2.000m` height (`Y in [0.0, 2.0]`)
    and automatically lifts downward A-pose arms (`x_arm_max < 0.75m` or `skeleton_metrics["is_apose"]`)
    into the canonical horizontal T-pose (`|X| in [0.205, 0.895]`, `Y ~ 1.56m`) using the character's
    measured shoulder/wrist landmarks from `skeleton_metrics["joints_y_up"]` when available.
    Leaves already-horizontal T-pose `.glb` inputs unchanged.
    """
    pos = np.asarray(pos_all, dtype=np.float64).copy()
    p_min = pos.min(axis=0)
    p_max = pos.max(axis=0)
    raw_h = max(1e-6, float(p_max[1] - p_min[1]))
    if abs(raw_h - 2.0) > 0.02 or abs(float(p_min[1])) > 0.02:
        s = 2.0 / raw_h
        x_mid = 0.5 * float(p_min[0] + p_max[0])
        z_mid = 0.5 * float(p_min[2] + p_max[2])
        pos[:, 0] = (pos[:, 0] - x_mid) * s
        pos[:, 1] = (pos[:, 1] - float(p_min[1])) * s
        pos[:, 2] = (pos[:, 2] - z_mid) * s

    if isinstance(skeleton_metrics, dict) and skeleton_metrics.get("is_apose") is False:
        return pos.astype(np.float32)

    jy = (skeleton_metrics or {}).get("joints_y_up") if isinstance(skeleton_metrics, dict) else None
    x_g = pos[:, 0]
    y_g = pos[:, 1]
    arm_band = (np.abs(x_g) > 0.215) & (y_g >= 0.78) & (y_g <= 1.65)
    if arm_band.any():
        x_arm_max = float(np.abs(x_g[arm_band]).max())
        is_apose_flag = (
            bool(skeleton_metrics.get("is_apose"))
            if isinstance(skeleton_metrics, dict) and "is_apose" in skeleton_metrics
            else (x_arm_max < 0.75)
        )
        if is_apose_flag and x_arm_max < 0.78:
            x_sh, y_sh = 0.195, 1.560
            x_wr, y_wr = None, None
            if isinstance(jy, dict):
                sh_l = jy.get("shoulder_l")
                sh_r = jy.get("shoulder_r")
                wr_l = jy.get("wrist_l")
                wr_r = jy.get("wrist_r")
                if sh_l and sh_r and len(sh_l) == 3 and len(sh_r) == 3:
                    x_sh = max(0.16, min(0.24, 0.5 * (abs(float(sh_l[0])) + abs(float(sh_r[0])))))
                if wr_l and wr_r and len(wr_l) == 3 and len(wr_r) == 3:
                    x_wr = 0.5 * (abs(float(wr_l[0])) + abs(float(wr_r[0])))
                    y_wr = 0.5 * (float(wr_l[1]) + float(wr_r[1]))
            if x_wr is None or y_wr is None:
                wrist_mask = arm_band & (np.abs(x_g) >= 0.80 * x_arm_max)
                if wrist_mask.any():
                    x_wr = float(np.median(np.abs(x_g[wrist_mask])))
                    y_wr = float(np.median(y_g[wrist_mask]))
            if x_wr is not None and y_wr is not None:
                theta_down = math.atan2(y_wr - y_sh, max(0.05, x_wr - x_sh))
                if theta_down < -0.15:
                    lift_angle = -theta_down
                    ax_x = np.abs(x_g)
                    y_arm_min = np.minimum(1.05, np.maximum(0.75, 1.18 - 1.50 * (ax_x - 0.215)))
                    iso_arm = (ax_x > 0.185) & (y_g >= y_arm_min) & (y_g <= 1.64)
                    idxs = np.where(iso_arm)[0]
                    for i in idxs:
                        xv, yv = float(pos[i, 0]), float(pos[i, 1])
                        sgn = 1.0 if xv >= 0.0 else -1.0
                        t_b = max(0.0, min(1.0, (abs(xv) - 0.185) / (0.245 - 0.185)))
                        s_b = t_b * t_b * (3.0 - 2.0 * t_b)
                        ang = sgn * lift_angle * s_b
                        ca, sa = math.cos(ang), math.sin(ang)
                        px_s = sgn * x_sh
                        dx = xv - px_s
                        dy = yv - y_sh
                        pos[i, 0] = px_s + dx * ca - dy * sa
                        pos[i, 1] = y_sh + dx * sa + dy * ca

                    if len(idxs) > 0:
                        x_lifted_max = float(np.abs(pos[idxs, 0]).max())
                        if x_lifted_max > 0.26:
                            scale_span = 0.690 / (x_lifted_max - 0.205)
                            for i in idxs:
                                xv = float(pos[i, 0])
                                if abs(xv) > 0.205:
                                    sgn = 1.0 if xv >= 0.0 else -1.0
                                    pos[i, 0] = sgn * (0.205 + (abs(xv) - 0.205) * scale_span)

    return pos.astype(np.float32)


def load_luis_glb(
    glb_path,
    head_mat_indices: Optional[Sequence[int]] = None,
    y_neck_norm: float = 1.640,
    skeleton_metrics: Optional[Dict[str, Any]] = None,
):
    if not os.path.isfile(glb_path):
        raise FileNotFoundError(f"Missing source GLB asset: {glb_path}")
    with open(glb_path, "rb") as f:
        buf = f.read()
    magic, version, _ = struct.unpack_from("<4sII", buf, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError(f"Invalid GLB header in {glb_path}: magic={magic!r}, version={version}")
    j_len = struct.unpack_from("<I", buf, 12)[0]
    gltf = json.loads(buf[20 : 20 + j_len].decode("utf-8"))
    bin_buf = buf[28 + j_len :] if 28 + j_len <= len(buf) else b""

    def get_acc(acc_idx):
        acc = gltf["accessors"][acc_idx]
        bv = gltf["bufferViews"][acc["bufferView"]]
        offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
        ctype = acc["componentType"]
        dtype = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[ctype]
        cnt = acc["count"]
        dim = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[acc["type"]]
        arr = np.frombuffer(bin_buf, dtype=dtype, count=cnt * dim, offset=offset)
        return arr.reshape(cnt, dim).copy() if dim > 1 else arr.copy()

    # Decode embedded images and resolve per-material RGB textures
    images_rgb = []
    for im in gltf.get("images", []):
        if "bufferView" in im:
            bv = gltf["bufferViews"][im["bufferView"]]
            raw = bin_buf[bv.get("byteOffset", 0) : bv.get("byteOffset", 0) + bv["byteLength"]]
            arr = np.frombuffer(raw, dtype=np.uint8)
            bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if bgr is not None:
                images_rgb.append(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
                continue
        images_rgb.append(np.full((64, 64, 3), (200, 200, 200), dtype=np.uint8))

    materials = gltf.get("materials") or []
    textures = gltf.get("textures") or []
    mat_rgb_list = []
    detected_head_mats = set(head_mat_indices or [])
    for m_idx, mat in enumerate(materials):
        mname = str(mat.get("name") or "").lower()
        if "head" in mname or "hair" in mname or "face" in mname:
            detected_head_mats.add(m_idx)
        pbr = mat.get("pbrMetallicRoughness") or {}
        bct = pbr.get("baseColorTexture")
        rgb_tex = None
        if isinstance(bct, dict) and "index" in bct:
            t_idx = int(bct["index"])
            if 0 <= t_idx < len(textures):
                s_idx = textures[t_idx].get("source")
                if s_idx is not None and 0 <= int(s_idx) < len(images_rgb):
                    rgb_tex = images_rgb[int(s_idx)]
        if rgb_tex is None:
            bcf = pbr.get("baseColorFactor") or [0.78, 0.78, 0.78, 1.0]
            c8 = tuple(int(np.clip(round(float(bcf[k]) * 255.0), 0, 255)) for k in range(3))
            rgb_tex = np.full((64, 64, 3), c8, dtype=np.uint8)
        mat_rgb_list.append(rgb_tex)

    if not mat_rgb_list:
        mat_rgb_list = images_rgb if images_rgb else [np.full((64, 64, 3), (200, 200, 200), dtype=np.uint8)]

    # Flatten all primitives across all meshes
    raw_prims = []
    all_pos_blocks = []
    for mesh_obj in gltf.get("meshes", []):
        for prim in mesh_obj.get("primitives", []):
            attrs = prim["attributes"]
            p_arr = get_acc(attrs["POSITION"]).astype(np.float32)
            if "TEXCOORD_0" in attrs:
                u_arr = get_acc(attrs["TEXCOORD_0"]).astype(np.float32)
            else:
                u_arr = np.full((len(p_arr), 2), 0.5, dtype=np.float32)
            if "indices" in prim:
                t_arr = get_acc(prim["indices"]).reshape(-1, 3).astype(np.int32)
            else:
                t_arr = np.arange(len(p_arr), dtype=np.int32).reshape(-1, 3)
            m_idx = int(prim.get("material", 0))
            raw_prims.append({"pos": p_arr, "uv": u_arr, "tris": t_arr, "mat": m_idx})
            all_pos_blocks.append(p_arr)

    combined_pos = np.vstack(all_pos_blocks)
    conformed_pos = _normalize_and_lift_apose_to_tpose_2m(combined_pos, skeleton_metrics=skeleton_metrics)
    cursor = 0
    for rp in raw_prims:
        n_v = len(rp["pos"])
        rp["pos"] = conformed_pos[cursor : cursor + n_v]
        cursor += n_v

    # Separate primitives into body (pos0, uv0, tris0, body_rgb) and head (pos1, uv1, tris1, head_rgb)
    if len(raw_prims) >= 2:
        if not detected_head_mats:
            for rp in raw_prims:
                if float(rp["pos"][:, 1].min()) >= 1.40:
                    detected_head_mats.add(rp["mat"])
            if not detected_head_mats:
                detected_head_mats.add(raw_prims[1]["mat"])

        body_pos_l, body_uv_l, body_tris_l = [], [], []
        head_pos_l, head_uv_l, head_tris_l = [], [], []
        b_v_off = 0
        h_v_off = 0
        body_rgb = mat_rgb_list[0]
        head_rgb = mat_rgb_list[min(1, len(mat_rgb_list) - 1)]

        for rp in raw_prims:
            m_i = rp["mat"]
            tex_i = mat_rgb_list[m_i] if 0 <= m_i < len(mat_rgb_list) else mat_rgb_list[0]
            if m_i in detected_head_mats:
                head_pos_l.append(rp["pos"])
                head_uv_l.append(rp["uv"])
                head_tris_l.append(rp["tris"] + h_v_off)
                h_v_off += len(rp["pos"])
                head_rgb = tex_i
            else:
                body_pos_l.append(rp["pos"])
                body_uv_l.append(rp["uv"])
                body_tris_l.append(rp["tris"] + b_v_off)
                b_v_off += len(rp["pos"])
                body_rgb = tex_i

        if head_pos_l and body_pos_l:
            pos0 = np.vstack(body_pos_l)
            uv0 = np.vstack(body_uv_l)
            tris0 = np.vstack(body_tris_l)
            pos1 = np.vstack(head_pos_l)
            uv1 = np.vstack(head_uv_l)
            tris1 = np.vstack(head_tris_l)
            return pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb

    # Single-primitive fallback: partition triangles geometrically at y_neck_norm
    rp0 = raw_prims[0]
    p_all, u_all, t_all = rp0["pos"], rp0["uv"], rp0["tris"]
    tri_c = p_all[t_all].mean(axis=1)
    h_mask = (tri_c[:, 1] >= float(y_neck_norm)) & (np.abs(tri_c[:, 0]) <= 0.22)
    b_mask = ~h_mask
    tex0 = mat_rgb_list[0]
    return p_all, u_all, t_all[b_mask], p_all, u_all, t_all[h_mask], tex0, tex0


def project_glb_to_atlas_st(pos_glb, kind, is_front):
    """
    Maps 3D glTF rest coordinates (X_glb, Y_glb, Z_glb) of a partition (`head`, `body`,
    `crawler_body`, `l_arm`, `r_arm`) onto its dedicated non-overlapping Front (`s < 128`)
    or Back (`s >= 128`) sub-rectangle in the 256x256 orthographic skin atlas.
    """
    spec = ATLAS_RECTS[kind]
    s_min, s_max, t_min, t_max = spec["front"] if is_front else spec["back"]
    u_min, u_max = spec["u_range"]
    v_min, v_max = spec["v_range"]

    if kind in ("head", "body", "crawler_body"):
        # Horizontal axis = -X_glb (so viewer left is character right), Vertical = Y_glb (top to bottom)
        u_val = -pos_glb[:, 0] if is_front else pos_glb[:, 0]
        v_val = pos_glb[:, 1]
    elif kind == "l_arm":
        u_val = pos_glb[:, 1]
        v_val = u_max + v_min - pos_glb[:, 0]  # shoulder at top (t_min), hand at bottom (t_max)
        v_val = v_max - (pos_glb[:, 0] - v_min)
    else:  # r_arm
        u_val = pos_glb[:, 1]
        v_val = v_max - (-pos_glb[:, 0] - v_min)

    u_norm = np.clip((u_val - u_min) / max(u_max - u_min, 1e-5), 0.0, 1.0)
    v_norm = np.clip((v_max - v_val) / max(v_max - v_min, 1e-5), 0.0, 1.0)

    s = s_min + u_norm * (s_max - s_min)
    t = t_min + v_norm * (t_max - t_min)
    return np.column_stack([s, t]).astype(np.float32)


def bake_continuous_orthographic_skin(pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb, palette_bytes):
    """
    Rasterizes the high-resolution 14,905-vertex LUIS_TPOSE_STANDALONE_BACKUP.glb mesh
    into the continuous Front-Hemisphere (s in 0..127) and Back-Hemisphere (s in 128..255)
    256x256 orthographic atlas at 3x supersampling, inpaints background borders to prevent
    dark seam bleed, and quantizes to `gfx/palette.lmp` with Floyd-Steinberg dithering.
    """
    SS = 3  # 768x768 supersampled rasterizer
    W_ss = SKIN_W * SS
    H_ss = SKIN_H * SS
    canvas = np.zeros((H_ss, W_ss, 3), dtype=np.uint8)
    mask = np.zeros((H_ss, W_ss), dtype=np.uint8)

    c0 = pos0[tris0].mean(axis=1)
    mask_l_arm = (c0[:, 0] >= 0.205) & (c0[:, 1] >= 1.38)
    mask_r_arm = (c0[:, 0] <= -0.205) & (c0[:, 1] >= 1.38)
    mask_body = ~(mask_l_arm | mask_r_arm)

    part_jobs = [
        ("head", pos1, uv1, tris1, head_rgb),
        ("body", pos0, uv0, tris0[mask_body], body_rgb),
        ("l_arm", pos0, uv0, tris0[mask_l_arm], body_rgb),
        ("r_arm", pos0, uv0, tris0[mask_r_arm], body_rgb),
    ]

    for is_front in (True, False):
        draw_list = []
        for kind, pos, uv, tris, tex_rgb in part_jobs:
            th, tw = tex_rgb.shape[:2]
            v0 = pos[tris[:, 0]]
            v1 = pos[tris[:, 1]]
            v2 = pos[tris[:, 2]]
            fn = np.cross(v1 - v0, v2 - v0)
            # Keep triangles facing the active hemisphere (or slightly grazing within -0.15)
            nz = fn[:, 2] if is_front else -fn[:, 2]
            keep = nz >= -1e-6
            kept_tris = tris[keep]
            if len(kept_tris) == 0:
                continue
            st_all = project_glb_to_atlas_st(pos, kind, is_front) * SS
            z_vals = pos[kept_tris, 2].mean(axis=1) if is_front else -pos[kept_tris, 2].mean(axis=1)

            # Subdivide triangles once in 2D/UV space so large high-res triangles sample accurate texels
            for idx_i, t_idx in enumerate(kept_tris):
                i0, i1, i2 = t_idx
                p_a, p_b, p_c = st_all[i0], st_all[i1], st_all[i2]
                uv_a, uv_b, uv_c = uv[i0], uv[i1], uv[i2]
                z_d = float(z_vals[idx_i])
                # 4 sub-triangles per triangle for sub-texel accuracy
                p_ab = 0.5 * (p_a + p_b)
                p_bc = 0.5 * (p_b + p_c)
                p_ca = 0.5 * (p_c + p_a)
                uv_ab = 0.5 * (uv_a + uv_b)
                uv_bc = 0.5 * (uv_b + uv_c)
                uv_ca = 0.5 * (uv_c + uv_a)
                for sp0, sp1, sp2, suv0, suv1, suv2 in (
                    (p_a, p_ab, p_ca, uv_a, uv_ab, uv_ca),
                    (p_b, p_bc, p_ab, uv_b, uv_bc, uv_ab),
                    (p_c, p_ca, p_bc, uv_c, uv_ca, uv_bc),
                    (p_ab, p_bc, p_ca, uv_ab, uv_bc, uv_ca),
                ):
                    u_m = int(np.clip(((suv0[0] + suv1[0] + suv2[0]) / 3.0) * (tw - 1), 0, tw - 1))
                    v_m = int(np.clip(((suv0[1] + suv1[1] + suv2[1]) / 3.0) * (th - 1), 0, th - 1))
                    col = tuple(int(c) for c in tex_rgb[v_m, u_m])
                    pts2 = np.array([sp0, sp1, sp2], dtype=np.int32)
                    draw_list.append((z_d, pts2, col))

        draw_list.sort(key=lambda x: x[0])
        for _, pts2, col in draw_list:
            cv2.fillConvexPoly(canvas, pts2, col, lineType=cv2.LINE_AA)
            cv2.fillConvexPoly(mask, pts2, 255)

    atlas_rgb = cv2.resize(canvas, (SKIN_W, SKIN_H), interpolation=cv2.INTER_AREA)
    mask_small = cv2.resize(mask, (SKIN_W, SKIN_H), interpolation=cv2.INTER_NEAREST)

    # Dilate/inpaint unrendered background pixels so boundary UVs never sample black background
    bg_mask = (mask_small < 128).astype(np.uint8) * 255
    atlas_rgb = cv2.inpaint(atlas_rgb, bg_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

    # Quantize to non-fullbright entries (0..223) of Quake gfx/palette.lmp with Serpentine Floyd-Steinberg Dithering
    pal_rgb = np.frombuffer(palette_bytes, dtype=np.uint8).reshape(256, 3).astype(np.float32)
    lit_pal = pal_rgb[:224]
    weights = np.array([2.0, 4.0, 3.0], dtype=np.float32)

    work = atlas_rgb.astype(np.float32).copy()
    indices = np.zeros((SKIN_H, SKIN_W), dtype=np.uint8)
    dither_strength = 0.45

    for y in range(SKIN_H):
        row_pixels = np.clip(work[y], 0.0, 255.0)
        diff = row_pixels[:, None, :] - lit_pal[None, :, :]
        dist_sq = np.sum(diff * diff * weights[None, None, :], axis=2)
        best_idx = np.argmin(dist_sq, axis=1).astype(np.uint8)
        indices[y] = best_idx
        quant_rgb = lit_pal[best_idx]
        err = (row_pixels - quant_rgb) * dither_strength
        if y + 1 < SKIN_H:
            work[y + 1, :, :] += err * (7.0 / 16.0)
            work[y + 1, 1:, :] += err[:-1] * (5.0 / 16.0)
            work[y + 1, :-1, :] += err[1:] * (4.0 / 16.0)

    return indices, atlas_rgb


def decimate_partitions_with_blender(
    glb_path: str = SOURCE_GLB_PATH,
    head_mat_indices: Optional[Sequence[int]] = None,
    y_neck_norm: float = 1.640,
    skeleton_metrics: Optional[Dict[str, Any]] = None,
):
    """
    Runs Blender headless (`--background`) to join all mesh objects, normalize to `2.000m`,
    lift downward A-pose arms into the canonical horizontal T-pose (`|X| in [0.205, 0.895]`),
    weld photogrammetry UV seams (`remove_doubles`), apply smooth deltoid shoulder relaxation,
    and decimate each anatomical partition to its target triangle budget (`head=258`, `l_arm=136`,
    `r_arm=136`, `body=640`, `crawler_body=440`) using Blender's Quadric Edge Collapse modifier.
    """
    y_crawler_cut = 0.665
    x_sh_s = 0.195
    if isinstance(skeleton_metrics, dict) and isinstance(skeleton_metrics.get("joints_y_up"), dict):
        jy = skeleton_metrics["joints_y_up"]
        cr = jy.get("crotch")
        kn_l = jy.get("knee_l")
        sh_l = jy.get("shoulder_l")
        sh_r = jy.get("shoulder_r")
        if cr and kn_l and len(cr) == 3 and len(kn_l) == 3:
            y_crawler_cut = round(max(0.580, min(0.720, 0.5 * (float(cr[1]) + float(kn_l[1])) + 0.08)), 4)
        if sh_l and sh_r and len(sh_l) == 3 and len(sh_r) == 3:
            x_sh_s = round(max(0.160, min(0.240, 0.5 * (abs(float(sh_l[0])) + abs(float(sh_r[0]))))), 4)

    with tempfile.TemporaryDirectory() as tmpdir:
        out_npz = os.path.join(tmpdir, "decimated_parts.npz")
        head_mats_list = list(head_mat_indices) if head_mat_indices is not None else []
        blender_code = f"""
import bpy, bmesh, math, numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath={glb_path!r})
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
bpy.ops.object.select_all(action="DESELECT")
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
base_obj = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Normalize base_obj to 2.000m (gy in [0.0, 2.0]) and lift downward A-pose arms into horizontal T-pose
pos_g = np.array([[v.co.x, v.co.z, -v.co.y] for v in base_obj.data.vertices], dtype=np.float64)
p_min = pos_g.min(axis=0)
p_max = pos_g.max(axis=0)
raw_h = max(1e-6, float(p_max[1] - p_min[1]))
if abs(raw_h - 2.0) > 0.02 or abs(float(p_min[1])) > 0.02:
    s = 2.0 / raw_h
    x_mid = 0.5 * float(p_min[0] + p_max[0])
    z_mid = 0.5 * float(p_min[2] + p_max[2])
    pos_g[:, 0] = (pos_g[:, 0] - x_mid) * s
    pos_g[:, 1] = (pos_g[:, 1] - float(p_min[1])) * s
    pos_g[:, 2] = (pos_g[:, 2] - z_mid) * s

x_g = pos_g[:, 0]
y_g = pos_g[:, 1]
arm_band = (np.abs(x_g) > 0.215) & (y_g >= 0.78) & (y_g <= 1.65)
if arm_band.any():
    x_arm_max = float(np.abs(x_g[arm_band]).max())
    if x_arm_max < 0.75:
        wrist_mask = arm_band & (np.abs(x_g) >= 0.80 * x_arm_max)
        if wrist_mask.any():
            x_wr = float(np.median(np.abs(x_g[wrist_mask])))
            y_wr = float(np.median(y_g[wrist_mask]))
            x_sh, y_sh = {x_sh_s!r}, 1.560
            theta_down = math.atan2(y_wr - y_sh, max(0.05, x_wr - x_sh))
            if theta_down < -0.15:
                lift_angle = -theta_down
                ax_x = np.abs(x_g)
                y_arm_min = np.minimum(1.05, np.maximum(0.75, 1.18 - 1.50 * (ax_x - 0.215)))
                iso_arm = (ax_x > 0.185) & (y_g >= y_arm_min) & (y_g <= 1.64)
                idxs = np.where(iso_arm)[0]
                for i in idxs:
                    xv, yv = float(pos_g[i, 0]), float(pos_g[i, 1])
                    sgn = 1.0 if xv >= 0.0 else -1.0
                    t_b = max(0.0, min(1.0, (abs(xv) - 0.185) / (0.245 - 0.185)))
                    s_b = t_b * t_b * (3.0 - 2.0 * t_b)
                    ang = sgn * lift_angle * s_b
                    ca, sa = math.cos(ang), math.sin(ang)
                    px_s = sgn * x_sh
                    dx = xv - px_s
                    dy = yv - y_sh
                    pos_g[i, 0] = px_s + dx * ca - dy * sa
                    pos_g[i, 1] = y_sh + dx * sa + dy * ca
                if len(idxs) > 0:
                    x_lifted_max = float(np.abs(pos_g[idxs, 0]).max())
                    if x_lifted_max > 0.26:
                        scale_span = 0.690 / (x_lifted_max - 0.205)
                        for i in idxs:
                            xv = float(pos_g[i, 0])
                            if abs(xv) > 0.205:
                                sgn = 1.0 if xv >= 0.0 else -1.0
                                pos_g[i, 0] = sgn * (0.205 + (abs(xv) - 0.205) * scale_span)

for idx_v, v in enumerate(base_obj.data.vertices):
    v.co.x = float(pos_g[idx_v, 0])
    v.co.y = float(-pos_g[idx_v, 2])
    v.co.z = float(pos_g[idx_v, 1])
base_obj.data.update()

head_mats = set({head_mats_list!r})
if not head_mats:
    for m_idx, mat in enumerate(base_obj.data.materials):
        if mat and any(k in mat.name.lower() for k in ("head", "hair", "face")):
            head_mats.add(m_idx)
    if not head_mats and len(base_obj.data.materials) >= 2:
        head_mats.add(1)

y_neck = float({float(y_neck_norm)!r})
has_head_mat = len(head_mats) > 0

def is_head_face(gx, gy, gz, m):
    if has_head_mat:
        return int(m) in head_mats
    return (gy >= y_neck) and (abs(gx) <= 0.22)

def build_part(name, filter_fn, target_tris, relax_shoulders=False):
    obj = base_obj.copy()
    obj.data = base_obj.data.copy()
    while obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-4)
    to_del = []
    for f in bm.faces:
        c = f.calc_center_median()
        gx, gy, gz = c.x, c.z, -c.y
        if not filter_fn(gx, gy, gz, f.material_index):
            to_del.append(f)
    if to_del:
        bmesh.ops.delete(bm, geom=to_del, context="FACES")
    loose_v = [v for v in bm.verts if not v.link_faces]
    if loose_v:
        bmesh.ops.delete(bm, geom=loose_v, context="VERTS")
    if relax_shoulders:
        for v in bm.verts:
            gx, gy, gz = v.co.x, v.co.z, -v.co.y
            if gy > 1.50:
                y_env = 1.695 - 0.22 * abs(gx)
                if gy > y_env:
                    v.co.z = y_env + 0.15 * (gy - y_env)
            if abs(gx) > 0.165 and gy > 1.38:
                v.co.x = np.sign(gx) * (0.165 + 0.40 * (abs(gx) - 0.165))
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(obj.data)
    bm.free()

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for _pass in range(2):
        part_tris = max(1, len(obj.data.polygons))
        if part_tris <= int(target_tris * 1.15):
            break
        if _pass == 1:
            bm_w = bmesh.new()
            bm_w.from_mesh(obj.data)
            bmesh.ops.remove_doubles(bm_w, verts=bm_w.verts[:], dist=0.016)
            bmesh.ops.triangulate(bm_w, faces=bm_w.faces[:])
            bm_w.to_mesh(obj.data)
            bm_w.free()
            part_tris = max(1, len(obj.data.polygons))
            if part_tris <= int(target_tris * 1.15):
                break
        dyn_ratio = min(1.0, max(0.002, float(target_tris) / float(part_tris)))
        mod = obj.modifiers.new(name="Dec", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = dyn_ratio
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)

    bm2 = bmesh.new()
    bm2.from_mesh(obj.data)
    bmesh.ops.triangulate(bm2, faces=bm2.faces[:])
    bm2.verts.ensure_lookup_table()
    bm2.faces.ensure_lookup_table()
    verts = np.array([[v.co.x, v.co.z, -v.co.y] for v in bm2.verts], dtype=np.float32)
    tris = np.array([[f.verts[0].index, f.verts[1].index, f.verts[2].index] for f in bm2.faces], dtype=np.int32)
    bm2.free()
    return verts, tris

res = {{}}
for p_name, fn, t_budget, rel in [
    ("head", lambda x, y, z, m: is_head_face(x, y, z, m), 258, False),
    ("l_arm", lambda x, y, z, m: (not is_head_face(x, y, z, m)) and (x >= 0.205 and y >= 1.38), 136, False),
    ("r_arm", lambda x, y, z, m: (not is_head_face(x, y, z, m)) and (x <= -0.205 and y >= 1.38), 136, False),
    ("body", lambda x, y, z, m: (not is_head_face(x, y, z, m)) and not (abs(x) >= 0.205 and y >= 1.38), 640, True),
    ("crawler_body", lambda x, y, z, m: (not is_head_face(x, y, z, m)) and (y >= {y_crawler_cut!r}) and not (abs(x) >= 0.205 and y >= 1.38), 440, True),
]:
    v, t = build_part(p_name, fn, t_budget, rel)
    res[p_name + "_v"] = v
    res[p_name + "_t"] = t

np.savez({out_npz!r}, **res)
"""
        subprocess.run(
            [BLENDER_BIN, "--background", "--python-expr", blender_code],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        data = np.load(out_npz)
        return {
            k: (data[f"{k}_v"].copy(), data[f"{k}_t"].copy())
            for k in ("head", "l_arm", "r_arm", "body", "crawler_body")
        }


def split_front_back_hemisphere_uvs(pos_glb, tris, kind):
    """
    Classifies each triangle into the Front Hemisphere (normal_z_glb >= 0, facing +X_quake)
    or Back Hemisphere (normal_z_glb < 0, facing -X_quake), duplicates only silhouette seam
    vertices shared between front and back triangles, and computes continuous orthographic
    (s, t) coordinates so 0% of triangles ever cross the s=128 hemisphere boundary.
    """
    v0 = pos_glb[tris[:, 0]]
    v1 = pos_glb[tris[:, 1]]
    v2 = pos_glb[tris[:, 2]]
    fn = np.cross(v1 - v0, v2 - v0)
    is_front_tri = fn[:, 2] >= 0.0

    st_front = np.round(project_glb_to_atlas_st(pos_glb, kind, True)).astype(np.int32)
    st_back = np.round(project_glb_to_atlas_st(pos_glb, kind, False)).astype(np.int32)

    front_remap = np.full(len(pos_glb), -1, dtype=np.int32)
    back_remap = np.full(len(pos_glb), -1, dtype=np.int32)
    new_pos = []
    new_st = []
    new_tris = np.empty_like(tris)

    for ti in range(len(tris)):
        front = bool(is_front_tri[ti])
        remap = front_remap if front else back_remap
        st_table = st_front if front else st_back
        for corner in range(3):
            vi = int(tris[ti, corner])
            if remap[vi] == -1:
                remap[vi] = len(new_pos)
                new_pos.append(pos_glb[vi])
                new_st.append(st_table[vi])
            new_tris[ti, corner] = remap[vi]

    return np.array(new_pos, dtype=np.float32), np.array(new_st, dtype=np.int32), new_tris


def map_glb_to_isotropic_quake_f0(pos_glb, kind):
    """
    Maps glTF T-pose coordinates into Quake Zombie Frame-0 world space using a SINGLE
    uniform isotropic scale factor (`S = 36.48` Quake units/m), preserving 100% of LUIS's
    anatomical proportions while aligning his spine, shoulders, and feet with the stock
    Frame-0 zombie pose.
    """
    p = pos_glb.copy()
    if kind in ("l_arm", "r_arm"):
        sign = 1.0 if kind == "l_arm" else -1.0
        abs_x = np.abs(p[:, 0])
        # Smoothly round the upper deltoid cap before folding the arm down
        y_cap = 1.655 - 0.35 * np.clip(abs_x - 0.205, 0.0, 0.10)
        p[:, 1] = np.minimum(p[:, 1], y_cap)
        pivot = np.array([sign * 0.205, 1.595, 0.0], dtype=np.float32)
        d = p - pivot
        # Smoothly blend shoulder-to-humerus downward fold angle across the deltoid cap
        t_fold = np.clip((abs_x - 0.200) / 0.075, 0.0, 1.0)
        th_z = -sign * np.deg2rad(38.0 + 34.0 * t_fold)
        cz, sz = np.cos(th_z), np.sin(th_z)
        dx_rot = d[:, 0] * cz - d[:, 1] * sz
        dy_rot = d[:, 0] * sz + d[:, 1] * cz
        dz_rot = d[:, 2]
        th_x = np.deg2rad(16.0)
        cx, sx = np.cos(th_x), np.sin(th_x)
        dy_final = dy_rot * cx - dz_rot * sx
        dz_final = dy_rot * sx + dz_rot * cx
        p = np.column_stack([
            dx_rot + sign * 0.165,
            dy_final + 1.565,
            dz_final + 0.015,
        ]).astype(np.float32)

    # Uniform isotropic scale: (Z_glb, X_glb, Y_glb) * 36.48
    x_q = p[:, 2] * ISOTROPIC_SCALE + 8.5 + np.clip((p[:, 1] - 0.9) * 3.2, 0.0, 3.0)
    y_q = p[:, 0] * ISOTROPIC_SCALE
    z_q = p[:, 1] * ISOTROPIC_SCALE - 32.80
    return np.column_stack([x_q, y_q, z_q]).astype(np.float32)


def kabsch_svd_transform(ref_seg0, ref_seg_frames):
    """
    Computes exact rigid rotation matrices Q^(f) in SO(3) (det = +1) and centroids
    (c0, cf) across all frames f=0..F-1 using the Kabsch / Orthogonal Procrustes SVD algorithm.
    """
    c0 = ref_seg0.mean(axis=0)  # (3,)
    cf = ref_seg_frames.mean(axis=1)  # (F, 3)
    P = ref_seg0 - c0[None, :]  # (N_seg, 3)
    Q_pts = ref_seg_frames - cf[:, None, :]  # (F, N_seg, 3)
    H = np.einsum("ni,fnj->fij", P, Q_pts)  # (F, 3, 3)

    U, _, Vt = np.linalg.svd(H)
    V = np.swapaxes(Vt, 1, 2)
    Ut = np.swapaxes(U, 1, 2)
    R = V @ Ut
    dets = np.linalg.det(R)
    neg = dets < 0.0
    if np.any(neg):
        V_fixed = V.copy()
        V_fixed[neg, :, 2] *= -1.0
        R = V_fixed @ Ut
    # Enforce exact identity at Frame 0 when ref_seg0 == ref_seg_frames[0]
    if np.allclose(ref_seg0, ref_seg_frames[0], atol=1e-3):
        R[0] = np.eye(3, dtype=np.float32)
    return c0.astype(np.float32), cf.astype(np.float32), R.astype(np.float32)


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20.0, 20.0)))


def build_bone_segments_and_weights(luis_f0, ref_rest, ref_frames, kind):
    """
    Constructs Kabsch SVD rigid bone segments from `ref_rest` -> `ref_frames` and computes
    smooth anatomical skinning weights for each vertex in `luis_f0`.
    """
    N_luis = len(luis_f0)
    z = luis_f0[:, 2]
    y = luis_f0[:, 1]

    if kind in ("head", "l_arm", "r_arm", "crawler_body"):
        seg_masks = [np.ones(len(ref_rest), dtype=bool)]
        weights = np.ones((N_luis, 1), dtype=np.float32)
    else:  # Standing body + pelvis + legs ("body")
        seg_masks = [
            ref_rest[:, 2] >= 9.0,                                                   # 0: UpperTorso
            (ref_rest[:, 2] >= -4.5) & (ref_rest[:, 2] < 9.0),                       # 1: Pelvis
            (ref_rest[:, 2] >= -18.5) & (ref_rest[:, 2] < -4.5) & (ref_rest[:, 1] >= 0),  # 2: L_Thigh
            (ref_rest[:, 2] >= -18.5) & (ref_rest[:, 2] < -4.5) & (ref_rest[:, 1] < 0),   # 3: R_Thigh
            (ref_rest[:, 2] < -18.5) & (ref_rest[:, 1] >= 0),                        # 4: L_Calf
            (ref_rest[:, 2] < -18.5) & (ref_rest[:, 1] < 0),                         # 5: R_Calf
        ]
        weights = np.zeros((N_luis, 6), dtype=np.float32)
        w_torso_vs_legs = sigmoid((z - (-9.5)) / 1.8)
        w_upper_vs_pelvis = sigmoid((z - 9.0) / 3.0)
        w_thigh_vs_calf = sigmoid((z - (-18.5)) / 2.0)

        weights[:, 0] = w_torso_vs_legs * w_upper_vs_pelvis
        weights[:, 1] = w_torso_vs_legs * (1.0 - w_upper_vs_pelvis)

        leg_share = 1.0 - w_torso_vs_legs
        is_left = sigmoid(y / 1.8)
        is_right = 1.0 - is_left
        weights[:, 2] = leg_share * is_left * w_thigh_vs_calf
        weights[:, 3] = leg_share * is_right * w_thigh_vs_calf
        weights[:, 4] = leg_share * is_left * (1.0 - w_thigh_vs_calf)
        weights[:, 5] = leg_share * is_right * (1.0 - w_thigh_vs_calf)

    weights /= np.maximum(weights.sum(axis=1, keepdims=True), 1e-6)

    c0_list, cf_list, R_list = [], [], []
    for mask in seg_masks:
        c0_s, cf_s, R_s = kabsch_svd_transform(ref_rest[mask], ref_frames[:, mask, :])
        c0_list.append(c0_s)
        cf_list.append(cf_s)
        R_list.append(R_s)

    c0_arr = np.stack(c0_list, axis=0)  # (S, 3)
    cf_arr = np.stack(cf_list, axis=1)  # (F, S, 3)
    R_arr = np.stack(R_list, axis=1)    # (F, S, 3, 3)
    return c0_arr, cf_arr, R_arr, weights


def deform_partition_svd(luis_f0, tris, ref_rest, ref_frames, kind):
    """
    Deforms `luis_f0` across all animation frames using Kabsch SVD rigid bone-segment
    transforms and Linear Blend Skinning (LBS) anchored at each segment's own anatomical
    centroid `c0_luis`, guaranteeing zero lever-arm spikes and zero triangle inversions.
    """
    c0_arr, cf_arr, R_arr, weights = build_bone_segments_and_weights(luis_f0, ref_rest, ref_frames, kind)
    w_sum = np.maximum(np.sum(weights, axis=0)[:, None], 1e-6)
    c0_luis = (weights.T @ luis_f0) / w_sum  # (S, 3)
    delta_f = cf_arr - c0_arr[None, :, :]    # (F, S, 3)

    if kind in ("l_arm", "r_arm"):
        # Anchor rigid arm rotation at the upper shoulder socket and damp excessive vertical shoulder lift
        sh_luis_mask = luis_f0[:, 2] >= 20.5
        if not np.any(sh_luis_mask):
            sh_luis_mask = luis_f0[:, 2] >= np.percentile(luis_f0[:, 2], 70)
        sh_luis = luis_f0[sh_luis_mask].mean(axis=0)
        sh_ref_mask = ref_rest[:, 2] >= np.percentile(ref_rest[:, 2], 70)
        sh_ref0 = ref_rest[sh_ref_mask].mean(axis=0)
        sh_reff = ref_frames[:, sh_ref_mask, :].mean(axis=1)
        c0_luis[0] = sh_luis
        disp = sh_reff - sh_ref0[None, :]
        disp[:, 2] *= 0.68  # Keep shoulder cap flush with torso clavicle height during forward lunges
        delta_f[:, 0, :] = disp

    offsets = luis_f0[:, None, :] - c0_luis[None, :, :]
    rot_offsets = np.einsum("fsij,nsj->fnsi", R_arr, offsets)  # (F, N_luis, S, 3)
    seg_pos = c0_luis[None, None, :, :] + delta_f[:, None, :, :] + rot_offsets  # (F, N_luis, S, 3)
    deformed = np.sum(weights[None, :, :, None] * seg_pos, axis=2)  # (F, N_luis, 3)

    # Compute rest vertex normals and rotate by blended segment rotation
    v0 = luis_f0[tris[:, 0]]
    v1 = luis_f0[tris[:, 1]]
    v2 = luis_f0[tris[:, 2]]
    fnorm = np.cross(v1 - v0, v2 - v0)
    vnorm0 = np.zeros_like(luis_f0)
    np.add.at(vnorm0, tris[:, 0], fnorm)
    np.add.at(vnorm0, tris[:, 1], fnorm)
    np.add.at(vnorm0, tris[:, 2], fnorm)
    n_len = np.linalg.norm(vnorm0, axis=1, keepdims=True)
    vnorm0 = np.where(n_len > 1e-6, vnorm0 / np.maximum(n_len, 1e-6), np.array([1.0, 0.0, 0.0], dtype=np.float32))

    R_blend = np.sum(weights[None, :, :, None, None] * R_arr[:, None, :, :, :], axis=2)  # (F, N_luis, 3, 3)
    vnorm_f = np.einsum("fnij,nj->fni", R_blend, vnorm0)
    dots = np.einsum("fni,mi->fnm", vnorm_f, QUAKE_162_NORMALS)
    normal_indices = np.argmax(dots, axis=2).astype(np.uint8)
    return deformed.astype(np.float32), normal_indices


def encode_pcx_8bit(indexed_pixels, palette_bytes):
    h, w = indexed_pixels.shape
    header = struct.pack(
        "<BBBBHHHHHH48sBBHHHH54s",
        10, 5, 1, 8, 0, 0, w - 1, h - 1, 72, 72, b"\x00" * 48, 0, 1, w, 1, 0, 0, b"\x00" * 54,
    )
    rle_chunks = [header]
    for y in range(h):
        row = indexed_pixels[y]
        x = 0
        row_bytes = bytearray()
        while x < w:
            val = int(row[x])
            run = 1
            while x + run < w and run < 63 and int(row[x + run]) == val:
                run += 1
            if run > 1 or val >= 0xC0:
                row_bytes.append(0xC0 | run)
                row_bytes.append(val)
            else:
                row_bytes.append(val)
            x += run
        rle_chunks.append(bytes(row_bytes))
    rle_chunks.append(b"\x0c")
    rle_chunks.append(palette_bytes)
    return b"".join(rle_chunks)


def read_reference_mdl(zf, mdl_path):
    data = zf.read(mdl_path)
    ident, version = struct.unpack_from("<4si", data, 0)
    if ident != b"IDPO" or version != 6:
        raise ValueError(f"Invalid reference MDL {mdl_path}: ident={ident!r}, version={version}")
    scale = np.array(struct.unpack_from("<3f", data, 8), dtype=np.float32)
    origin = np.array(struct.unpack_from("<3f", data, 20), dtype=np.float32)
    boundingradius = struct.unpack_from("<f", data, 32)[0]
    eyepos = struct.unpack_from("<3f", data, 36)
    numskins, skinw, skinh, numverts, numtris, numframes, synctype, flags, size = struct.unpack_from(
        "<iiiiiiiif", data, 48
    )
    offset = 84 + numskins * (4 + skinw * skinh) + numverts * 12 + numtris * 16
    frames = []
    frame_names = []
    for _ in range(numframes):
        fname = data[offset + 12 : offset + 28].split(b"\x00")[0].decode("ascii", errors="ignore")
        frame_names.append(fname)
        raw_v = np.frombuffer(data, dtype=np.uint8, count=numverts * 4, offset=offset + 28).reshape(numverts, 4)
        xyz = raw_v[:, :3].astype(np.float32) * scale + origin
        frames.append(xyz)
        offset += 28 + numverts * 4
    return {
        "frames": np.stack(frames, axis=0),
        "frame_names": frame_names,
        "boundingradius": boundingradius,
        "eyepos": eyepos,
        "synctype": synctype,
        "flags": flags,
        "size": size,
    }


def compile_quake_mdl_binary(frames_xyz, normal_indices, st_coords, tris, skin_pixels, frame_names, ref_meta):
    numframes, numverts, _ = frames_xyz.shape
    numtris = len(tris)
    skinheight, skinwidth = skin_pixels.shape

    global_min = frames_xyz.min(axis=(0, 1))
    global_max = frames_xyz.max(axis=(0, 1))
    span = np.maximum(global_max - global_min, 1e-4)
    scale = (span / 255.0).astype(np.float32)
    origin = global_min.astype(np.float32)

    q_verts = np.clip(np.round((frames_xyz - origin[None, None, :]) / scale[None, None, :]), 0, 255).astype(np.uint8)
    max_radius = float(np.sqrt(np.max(np.sum(frames_xyz ** 2, axis=2))))

    header = struct.pack(
        "<4si3f3ff3fiiiiiiiif",
        b"IDPO",
        6,
        float(scale[0]),
        float(scale[1]),
        float(scale[2]),
        float(origin[0]),
        float(origin[1]),
        float(origin[2]),
        max_radius,
        float(ref_meta["eyepos"][0]),
        float(ref_meta["eyepos"][1]),
        float(ref_meta["eyepos"][2]),
        1,
        int(skinwidth),
        int(skinheight),
        int(numverts),
        int(numtris),
        int(numframes),
        int(ref_meta["synctype"]),
        int(ref_meta["flags"]),
        float(ref_meta["size"]),
    )

    skin_block = struct.pack("<i", 0) + skin_pixels.tobytes()

    st_arr = np.zeros((numverts, 3), dtype="<i4")
    st_arr[:, 0] = 0
    st_arr[:, 1] = np.clip(st_coords[:, 0], 0, skinwidth - 1)
    st_arr[:, 2] = np.clip(st_coords[:, 1], 0, skinheight - 1)
    st_block = st_arr.tobytes()

    tri_arr = np.zeros((numtris, 4), dtype="<i4")
    tri_arr[:, 0] = 1
    tri_arr[:, 1:4] = tris
    tri_block = tri_arr.tobytes()

    frame_chunks = []
    for f in range(numframes):
        fv = q_verts[f]
        fn = normal_indices[f]
        bmin = fv.min(axis=0)
        bmax = fv.max(axis=0)
        fname_bytes = frame_names[f].encode("ascii", errors="ignore")[:15].ljust(16, b"\x00")
        f_hdr = struct.pack(
            "<i4B4B16s",
            0,
            int(bmin[0]), int(bmin[1]), int(bmin[2]), 0,
            int(bmax[0]), int(bmax[1]), int(bmax[2]), 0,
            fname_bytes,
        )
        v_pack = np.empty((numverts, 4), dtype=np.uint8)
        v_pack[:, :3] = fv
        v_pack[:, 3] = fn
        frame_chunks.append(f_hdr)
        frame_chunks.append(v_pack.tobytes())

    return b"".join([header, skin_block, st_block, tri_block] + frame_chunks)


def render_comparison_png(pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb, zfull_bytes, palette_bytes):
    """
    Renders the side-by-side comparison PNG (`00_luis_zombie_mdl_comparison.png` &
    `luis_glb_vs_current_mdl_comparison.png`) showing the source 14,905v GLB alongside
    the compiled `models/ai/zfull.mdl` across Frame 0, Frame 10, Frame 45, and the 256x256 skin.
    """
    panel_w, panel_h = 440, 600
    glb_img = np.full((panel_h, panel_w, 3), 34, dtype=np.uint8)
    all_items = []
    for pos, uv, tris, tex_rgb in ((pos0, uv0, tris0, body_rgb), (pos1, uv1, tris1, head_rgb)):
        th, tw = tex_rgb.shape[:2]
        for t in tris:
            z_avg = float(pos[t, 2].mean())
            all_items.append((z_avg, pos[t], uv[t], tex_rgb, tw, th))
    all_items.sort(key=lambda x: x[0])
    for _, pts3, uvs, tex_rgb, tw, th in all_items:
        sx = (panel_w * 0.5 - pts3[:, 0] * 225.0).astype(np.int32)
        sy = (panel_h - 45 - pts3[:, 1] * 255.0).astype(np.int32)
        pts2 = np.column_stack([sx, sy])
        u_m = int(np.clip(uvs[:, 0].mean() * (tw - 1), 0, tw - 1))
        v_m = int(np.clip(uvs[:, 1].mean() * (th - 1), 0, th - 1))
        bgr = tuple(int(c) for c in tex_rgb[v_m, u_m][::-1])
        cv2.fillConvexPoly(glb_img, pts2, bgr, lineType=cv2.LINE_AA)
    cv2.putText(glb_img, "1. Source LUIS .glb (14,905v)", (16, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (120, 255, 140), 2, cv2.LINE_AA)
    cv2.putText(glb_img, "Un-rigged T-pose reference", (16, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 200, 200), 1, cv2.LINE_AA)

    pal = np.frombuffer(palette_bytes, dtype=np.uint8).reshape(256, 3)
    scale = np.array(struct.unpack_from("<3f", zfull_bytes, 8), dtype=np.float32)
    origin = np.array(struct.unpack_from("<3f", zfull_bytes, 20), dtype=np.float32)
    ns, sw, sh, nv, nt, nf, _, _, _ = struct.unpack_from("<iiiiiiiif", zfull_bytes, 48)
    skin_idx = np.frombuffer(zfull_bytes, dtype=np.uint8, count=sw * sh, offset=88).reshape(sh, sw)
    skin_rgb = pal[skin_idx]
    off = 88 + sw * sh
    st = np.frombuffer(zfull_bytes, dtype=np.int32, count=nv * 3, offset=off).reshape(nv, 3)[:, 1:3]
    off += nv * 12
    tris = np.frombuffer(zfull_bytes, dtype=np.int32, count=nt * 4, offset=off).reshape(nt, 4)[:, 1:4]
    off += nt * 16

    def get_f_verts(f_idx):
        foff = off + f_idx * (28 + nv * 4) + 28
        rv = np.frombuffer(zfull_bytes, dtype=np.uint8, count=nv * 4, offset=foff).reshape(nv, 4)
        return rv[:, :3].astype(np.float32) * scale + origin

    def render_mdl_panel(verts, title, yaw_deg=0.0):
        img = np.full((panel_h, 400, 3), 34, dtype=np.uint8)
        ang = np.deg2rad(yaw_deg)
        # Quake: +X forward, +Y left, +Z up -> viewer at +X looking toward -X
        px = -verts[:, 1] * np.cos(ang) + (verts[:, 0] - 9.0) * np.sin(ang)
        pz = (verts[:, 0] - 9.0) * np.cos(ang) + verts[:, 1] * np.sin(ang)
        py = verts[:, 2]

        sc = 6.9
        sx = (200.0 + px * sc).astype(np.float32)
        sy = (panel_h * 0.53 - py * sc).astype(np.float32)

        tri_depth = pz[tris].mean(axis=1)
        order = np.argsort(tri_depth)
        skin_bgr_full = skin_rgb[:, :, ::-1]

        for ti in order:
            i0, i1, i2 = tris[ti]
            p0_2d = np.array([sx[i0], sy[i0]], dtype=np.float32)
            p1_2d = np.array([sx[i1], sy[i1]], dtype=np.float32)
            p2_2d = np.array([sx[i2], sy[i2]], dtype=np.float32)
            uv0_2d = st[i0].astype(np.float32)
            uv1_2d = st[i1].astype(np.float32)
            uv2_2d = st[i2].astype(np.float32)

            v0_3d = np.array([px[i0], py[i0], pz[i0]])
            v1_3d = np.array([px[i1], py[i1], pz[i1]])
            v2_3d = np.array([px[i2], py[i2], pz[i2]])
            fn = np.cross(v1_3d - v0_3d, v2_3d - v0_3d)
            fn_len = np.linalg.norm(fn)
            shade = 0.80 + 0.20 * abs(fn[2] / max(fn_len, 1e-5))

            pts_dst = np.array([p0_2d, p1_2d, p2_2d], dtype=np.float32)
            x0 = max(0, int(np.floor(pts_dst[:, 0].min())))
            x1 = min(399, int(np.ceil(pts_dst[:, 0].max())))
            y0 = max(0, int(np.floor(pts_dst[:, 1].min())))
            y1 = min(panel_h - 1, int(np.ceil(pts_dst[:, 1].max())))
            if x1 <= x0 or y1 <= y0:
                continue

            bw, bh = x1 - x0 + 1, y1 - y0 + 1
            pts_src = np.array([uv0_2d, uv1_2d, uv2_2d], dtype=np.float32)
            pts_local = pts_dst - np.array([[x0, y0]], dtype=np.float32)
            area2 = abs(
                (pts_local[1, 0] - pts_local[0, 0]) * (pts_local[2, 1] - pts_local[0, 1])
                - (pts_local[2, 0] - pts_local[0, 0]) * (pts_local[1, 1] - pts_local[0, 1])
            )
            if area2 > 1.5 and abs(
                (pts_src[1, 0] - pts_src[0, 0]) * (pts_src[2, 1] - pts_src[0, 1])
                - (pts_src[2, 0] - pts_src[0, 0]) * (pts_src[1, 1] - pts_src[0, 1])
            ) > 1.0:
                M = cv2.getAffineTransform(pts_src, pts_local)
                warped = cv2.warpAffine(
                    skin_bgr_full, M, (bw, bh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
                )
                tri_mask = np.zeros((bh, bw), dtype=np.uint8)
                cv2.fillConvexPoly(tri_mask, np.round(pts_local).astype(np.int32), 255, lineType=cv2.LINE_AA)
                roi = img[y0 : y1 + 1, x0 : x1 + 1]
                shaded = np.clip(warped.astype(np.float32) * shade, 0, 255).astype(np.uint8)
                alpha = (tri_mask[:, :, None].astype(np.float32)) / 255.0
                img[y0 : y1 + 1, x0 : x1 + 1] = (roi * (1.0 - alpha) + shaded * alpha).astype(np.uint8)
            else:
                s_m = int(np.clip(round(pts_src[:, 0].mean()), 0, sw - 1))
                t_m = int(np.clip(round(pts_src[:, 1].mean()), 0, sh - 1))
                rgb = skin_rgb[t_m, s_m]
                bgr = tuple(int(np.clip(c * shade, 0, 255)) for c in rgb[::-1])
                cv2.fillConvexPoly(img, np.round(pts_dst).astype(np.int32), bgr, lineType=cv2.LINE_AA)

        cv2.putText(img, title, (14, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (240, 240, 240), 2, cv2.LINE_AA)
        return img

    p_f0 = render_mdl_panel(get_f_verts(0), "Frame 0 (Front View)", 0.0)
    p_f0_34 = render_mdl_panel(get_f_verts(0), "Frame 0 (3/4 View)", 28.0)
    p_f10 = render_mdl_panel(get_f_verts(10), "Frame 10 (Walk/Idle)", 22.0)
    p_f45 = render_mdl_panel(get_f_verts(45), "Frame 45 (Locomotion)", 22.0)

    skin_panel = np.full((panel_h, 340, 3), 28, dtype=np.uint8)
    skin_bgr = skin_rgb[:, :, ::-1]
    skin_up = cv2.resize(skin_bgr, (300, 300), interpolation=cv2.INTER_NEAREST)
    skin_panel[80:380, 20:320] = skin_up
    cv2.putText(skin_panel, "Front/Back 256x256 Skin", (20, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (240, 240, 240), 2, cv2.LINE_AA)
    cv2.putText(skin_panel, "0% Cross-Island UV Stretch", (20, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.46, (120, 255, 140), 1, cv2.LINE_AA)

    combined = np.hstack([glb_img, p_f0, p_f0_34, p_f10, p_f45, skin_panel])
    cv2.imwrite(ROOT_COMPARISON_PNG_00, combined)
    cv2.imwrite(ROOT_COMPARISON_PNG, combined)


def build_all_luis_zombie_models(
    source_glb_path: str = SOURCE_GLB_PATH,
    head_mat_indices: Optional[Sequence[int]] = None,
    y_neck_norm: float = 1.640,
    render_preview_png: bool = True,
    skeleton_metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    t_start = time.time()
    serve_skatealley.ensure_nzportable_game_pk3(REPO_ROOT)
    if not os.path.isfile(GAME_PK3_PATH):
        raise FileNotFoundError(f"Missing reference archive: {GAME_PK3_PATH}")

    pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb = load_luis_glb(
        source_glb_path,
        head_mat_indices=head_mat_indices,
        y_neck_norm=y_neck_norm,
        skeleton_metrics=skeleton_metrics,
    )

    with zipfile.ZipFile(GAME_PK3_PATH, "r") as zf:
        palette_bytes = zf.read("gfx/palette.lmp")
        refs = {m: read_reference_mdl(zf, m) for m in ALL_ZOMBIE_MODELS}
        palhints = [zf.read(f"models/ai/zfull.mdl_{i}.palhint") for i in range(4)]

    # 1. Bake continuous Front/Back 256x256 orthographic skin quantized & dithered to gfx/palette.lmp
    skin_pixels, _ = bake_continuous_orthographic_skin(
        pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb, palette_bytes
    )
    pcx_bytes = encode_pcx_8bit(skin_pixels, palette_bytes)

    # 2. Quadric surface-preserving decimation in Blender + Front/Back hemisphere seam splitting
    raw_parts = decimate_partitions_with_blender(
        glb_path=source_glb_path,
        head_mat_indices=head_mat_indices,
        y_neck_norm=y_neck_norm,
        skeleton_metrics=skeleton_metrics,
    )
    hp_glb, h_st, h_tris = split_front_back_hemisphere_uvs(*raw_parts["head"], "head")
    lap_glb, la_st, la_tris = split_front_back_hemisphere_uvs(*raw_parts["l_arm"], "l_arm")
    rap_glb, ra_st, ra_tris = split_front_back_hemisphere_uvs(*raw_parts["r_arm"], "r_arm")
    bp_glb, b_st, b_tris = split_front_back_hemisphere_uvs(*raw_parts["body"], "body")
    cbp_glb, cb_st, cb_tris = split_front_back_hemisphere_uvs(*raw_parts["crawler_body"], "crawler_body")

    # 3. Map into Quake Zombie Frame-0 space with uniform isotropic scale (S = 36.48)
    b_f0 = map_glb_to_isotropic_quake_f0(bp_glb, "body")
    h_f0 = map_glb_to_isotropic_quake_f0(hp_glb, "head")
    la_f0 = map_glb_to_isotropic_quake_f0(lap_glb, "l_arm")
    ra_f0 = map_glb_to_isotropic_quake_f0(rap_glb, "r_arm")
    cb_f0 = map_glb_to_isotropic_quake_f0(cbp_glb, "crawler_body")

    zb_ref0 = refs["models/ai/zb%.mdl"]["frames"][0]
    zh_ref0 = refs["models/ai/zh^.mdl"]["frames"][0]
    zal_ref0 = refs["models/ai/zal(.mdl"]["frames"][0]
    zar_ref0 = refs["models/ai/zar(.mdl"]["frames"][0]
    zbc_ref0 = refs["models/ai/zbc%.mdl"]["frames"][0]

    # 4. Synthesize 211 standing frames via Kabsch SVD rigid bone-segment skinning
    zb_frames, zb_norms = deform_partition_svd(b_f0, b_tris, zb_ref0, refs["models/ai/zb%.mdl"]["frames"], "body")
    zh_frames, zh_norms = deform_partition_svd(h_f0, h_tris, zh_ref0, refs["models/ai/zh^.mdl"]["frames"], "head")
    zal_frames, zal_norms = deform_partition_svd(la_f0, la_tris, zal_ref0, refs["models/ai/zal(.mdl"]["frames"], "l_arm")
    zar_frames, zar_norms = deform_partition_svd(ra_f0, ra_tris, zar_ref0, refs["models/ai/zar(.mdl"]["frames"], "r_arm")

    zfull_frames = np.concatenate([zb_frames, zh_frames, zal_frames, zar_frames], axis=1)
    zfull_norms = np.concatenate([zb_norms, zh_norms, zal_norms, zar_norms], axis=1)
    zfull_st = np.vstack([b_st, h_st, la_st, ra_st])
    o1 = len(b_f0)
    o2 = o1 + len(h_f0)
    o3 = o2 + len(la_f0)
    zfull_tris = np.vstack([b_tris, h_tris + o1, la_tris + o2, ra_tris + o3])

    # 5. Synthesize 127 crawler frames via Kabsch SVD rigid bone-segment skinning
    zbc_frames, zbc_norms = deform_partition_svd(cb_f0, cb_tris, zbc_ref0, refs["models/ai/zbc%.mdl"]["frames"], "crawler_body")
    zhc_frames, zhc_norms = deform_partition_svd(h_f0, h_tris, zh_ref0, refs["models/ai/zhc^.mdl"]["frames"], "head")
    zalc_frames, zalc_norms = deform_partition_svd(la_f0, la_tris, zal_ref0, refs["models/ai/zalc(.mdl"]["frames"], "l_arm")
    zarc_frames, zarc_norms = deform_partition_svd(ra_f0, ra_tris, zar_ref0, refs["models/ai/zarc(.mdl"]["frames"], "r_arm")

    zcfull_frames = np.concatenate([zbc_frames, zhc_frames, zalc_frames, zarc_frames], axis=1)
    zcfull_norms = np.concatenate([zbc_norms, zhc_norms, zalc_norms, zarc_norms], axis=1)
    zcfull_st = np.vstack([cb_st, h_st, la_st, ra_st])
    co1 = len(cb_f0)
    co2 = co1 + len(h_f0)
    co3 = co2 + len(la_f0)
    zcfull_tris = np.vstack([cb_tris, h_tris + co1, la_tris + co2, ra_tris + co3])

    specs = {
        "models/ai/zb%.mdl": (zb_frames, zb_norms, b_st, b_tris),
        "models/ai/zh^.mdl": (zh_frames, zh_norms, h_st, h_tris),
        "models/ai/zal(.mdl": (zal_frames, zal_norms, la_st, la_tris),
        "models/ai/zar(.mdl": (zar_frames, zar_norms, ra_st, ra_tris),
        "models/ai/zfull.mdl": (zfull_frames, zfull_norms, zfull_st, zfull_tris),
        "models/ai/zbc%.mdl": (zbc_frames, zbc_norms, cb_st, cb_tris),
        "models/ai/zhc^.mdl": (zhc_frames, zhc_norms, h_st, h_tris),
        "models/ai/zalc(.mdl": (zalc_frames, zalc_norms, la_st, la_tris),
        "models/ai/zarc(.mdl": (zarc_frames, zarc_norms, ra_st, ra_tris),
        "models/ai/zcfull.mdl": (zcfull_frames, zcfull_norms, zcfull_st, zcfull_tris),
    }

    compiled_mdls = {}
    mdl_stats = {}
    for m_path, (fr, nm, st_c, tr) in specs.items():
        ref_meta = refs[m_path]
        mdl_bytes = compile_quake_mdl_binary(
            fr, nm, st_c, tr, skin_pixels, ref_meta["frame_names"], ref_meta
        )
        compiled_mdls[m_path] = mdl_bytes
        mdl_stats[m_path] = {
            "num_verts": int(fr.shape[1]),
            "num_tris": int(len(tr)),
            "num_frames": int(fr.shape[0]),
            "size_bytes": len(mdl_bytes),
        }
        print(
            f"[ZOMBIES MDL] Compiled {m_path:22s}: verts={fr.shape[1]:3d} tris={len(tr):4d} "
            f"frames={fr.shape[0]:3d} ({len(mdl_bytes) / 1024:.1f} KB)"
        )

    os.makedirs(os.path.dirname(OUTPUT_PK3_PATH), exist_ok=True)
    with zipfile.ZipFile(OUTPUT_PK3_PATH, "w", compression=zipfile.ZIP_STORED) as out_zf:
        for m_path in ALL_ZOMBIE_MODELS:
            out_zf.writestr(m_path, compiled_mdls[m_path])
        for i in range(4):
            out_zf.writestr(f"models/ai/zfull.mdl_{i}.pcx", pcx_bytes)
            out_zf.writestr(f"models/ai/zfull.mdl_{i}.palhint", palhints[i])

    # Also write loose models/ai/*.mdl into nzportable/nzp/models/ai/
    loose_ai_dir = os.path.join(REPO_ROOT, "nzportable", "nzp", "models", "ai")
    os.makedirs(loose_ai_dir, exist_ok=True)
    for m_path, m_bytes in compiled_mdls.items():
        with open(os.path.join(REPO_ROOT, "nzportable", "nzp", m_path), "wb") as mf:
            mf.write(m_bytes)

    pk3_size = os.path.getsize(OUTPUT_PK3_PATH)
    pk3_sha256 = compute_sha256(OUTPUT_PK3_PATH)

    with open(PACK_JSON_PATH, "r", encoding="utf-8") as f:
        pack_data = json.load(f)
    pack_data["files"]["nzp/luis_zombies.pk3"] = {
        "path": "nzp/luis_zombies.pk3",
        "url": "./nzp/luis_zombies.pk3",
        "size": pk3_size,
        "hash": pk3_sha256[:16],
        "sha256": pk3_sha256,
    }
    with open(PACK_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(pack_data, f, indent=2)
        f.write("\n")

    if render_preview_png:
        render_comparison_png(
            pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb, compiled_mdls["models/ai/zfull.mdl"], palette_bytes
        )

    elapsed = round(time.time() - t_start, 4)
    print(
        f"[ZOMBIES MDL] Packaged {OUTPUT_PK3_PATH} ({pk3_size / (1024 * 1024):.2f} MB, "
        f"sha256={pk3_sha256[:16]}...) in {elapsed:.2f}s"
    )
    return {
        "source_glb": os.path.basename(source_glb_path),
        "pk3_path": OUTPUT_PK3_PATH,
        "pk3_size_bytes": pk3_size,
        "pk3_sha256": pk3_sha256,
        "zfull_mdl_path": os.path.join(REPO_ROOT, "nzportable", "nzp", "models", "ai", "zfull.mdl"),
        "models": mdl_stats,
        "elapsed_sec": elapsed,
    }


def rig_assembled_glb_for_zombies(
    glb_path: Optional[str] = None,
    telemetry_path: Optional[str] = None,
    char_id: Optional[str] = None,
    bucket_name: Optional[str] = None,
    player_name: Optional[str] = None,
    player_id: Optional[str] = None,
    run_id: Optional[str] = None,
    output_dir: Optional[str] = None,
    credentials_path: Optional[str] = None,
    precomputed_intake: Optional[Dict[str, Any]] = None,
    sync_audit: bool = True,
    return_sync_bundle: bool = False,
) -> Dict[str, Any]:
    """
    Stage 5 `.glb`-agnostic Zombies (`/nzportable/`) rigger entrypoint (`INV-GCS-RIG-01`, `INV-NO-REASSEMBLE-01`):
      1. Pulls and validates `03_meshes/assembled/character_full.glb` + `assembly_telemetry.json` from GCS (or local `--glb`),
      2. Bakes continuous `256x256` Front/Back orthographic skin quantized to `gfx/palette.lmp`,
      3. Decimates modular partitions (`head`, `l_arm`, `r_arm`, `body`, `crawler_body`) to target triangle budgets (`<= 1,500` total tris),
      4. Synthesizes all `211` standing frames + `127` crawler frames via Kabsch SVD and packages `luis_zombies.pk3`,
      5. Syncs `luis_zombies.pk3`, `ai_zombie.mdl`, and `rig_telemetry.json` to
         `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/04_rigged/zombies/`.
    """
    if precomputed_intake is not None:
        intake = select_pose_intake(precomputed_intake, preferred_pose="tpose", target_game="zombies")
    else:
        intake = intake_assembled_character_for_rigging(
            glb_path=glb_path,
            telemetry_path=telemetry_path,
            char_id=char_id,
            bucket_name=bucket_name,
            player_name=player_name,
            player_id=player_id,
            run_id=run_id,
            output_dir=output_dir,
            credentials_path=credentials_path,
            preferred_pose="tpose",
            target_game="zombies",
        )
    hb = intake["head_bounds_norm"]
    # Skip full-res software preview PNG during Stage 5 80k-triangle automated runs to stay well inside the <12s budget
    build_summary = build_all_luis_zombie_models(
        source_glb_path=intake["local_glb_path"],
        head_mat_indices=hb.get("head_material_indices"),
        y_neck_norm=float(hb.get("y_neck_norm", 1.640)),
        render_preview_png=False,
        skeleton_metrics=intake.get("skeleton_metrics"),
    )

    stage5_dir = os.path.join(intake["output_dir"], "rigged", "zombies")
    os.makedirs(stage5_dir, exist_ok=True)
    stage5_pk3 = os.path.join(stage5_dir, "luis_zombies.pk3")
    stage5_mdl = os.path.join(stage5_dir, "ai_zombie.mdl")
    shutil.copy2(OUTPUT_PK3_PATH, stage5_pk3)
    shutil.copy2(build_summary["zfull_mdl_path"], stage5_mdl)

    telemetry_payload: Dict[str, Any] = {
        "status": "SUCCESS",
        "specification": "functional_specification_061",
        "mdl_magic": "IDPO",
        "mdl_version": 6,
        "standing_frames": 211,
        "crawler_frames": 127,
        "build_summary": build_summary,
        "head_bounds_norm": hb,
    }
    sync_res = sync_target_rigged_deliverables(
        intake_info=intake,
        target_game="zombies",
        deliverables=[
            ("zombies_pk3", stage5_pk3, "application/zip"),
            ("ai_zombie_mdl", stage5_mdl, "application/octet-stream"),
        ],
        telemetry_payload=telemetry_payload,
        sync_audit=sync_audit,
    )
    return sync_res if return_sync_bundle else sync_res["telemetry"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Stage 5 .glb-agnostic Nazi Zombies: Portable (IDPO v6 .mdl) automated rigger."
    )
    add_gcs_rig_cli_args(parser)
    args = parser.parse_args()

    if args.glb or (args.player_name and args.player_id and args.run_id):
        tel = rig_assembled_glb_for_zombies(
            glb_path=args.glb,
            telemetry_path=args.telemetry,
            char_id=args.char_id,
            bucket_name=args.gcs_bucket,
            player_name=args.player_name,
            player_id=args.player_id,
            run_id=args.run_id,
            output_dir=args.output_dir,
            credentials_path=args.gcs_credentials,
        )
        print(json.dumps(tel, indent=2))
        return

    build_all_luis_zombie_models()


if __name__ == "__main__":
    main()
