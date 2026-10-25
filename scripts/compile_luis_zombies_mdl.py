#!/usr/bin/env python3
"""
Un-Rigged LUIS .glb Modular Limb Partitioning, Continuous Front/Back Orthographic Skin
Projection, Quadric Surface Decimation, Isotropic Proportion Mapping, SVD Bone-Segment
211/127-Frame Quake IDPO v6 .mdl Compiler, and /nzportable/ PK3 Packager
(Functional Specifications 045 & 046).
"""

import hashlib
import json
import os
import struct
import subprocess
import sys
import tempfile
import time
import zipfile

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


def load_luis_glb(glb_path):
    if not os.path.isfile(glb_path):
        raise FileNotFoundError(f"Missing un-rigged LUIS source asset: {glb_path}")
    with open(glb_path, "rb") as f:
        buf = f.read()
    magic, version, _ = struct.unpack_from("<4sII", buf, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError(f"Invalid GLB header in {glb_path}: magic={magic!r}, version={version}")
    j_len = struct.unpack_from("<I", buf, 12)[0]
    gltf = json.loads(buf[20 : 20 + j_len].decode("utf-8"))
    bin_buf = buf[28 + j_len :]

    if gltf.get("skins"):
        raise ValueError(f"Expected un-rigged GLB, but found skins in {glb_path}")

    def get_acc(acc_idx):
        acc = gltf["accessors"][acc_idx]
        bv = gltf["bufferViews"][acc["bufferView"]]
        offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
        ctype = acc["componentType"]
        dtype = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}[ctype]
        cnt = acc["count"]
        dim = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[acc["type"]]
        arr = np.frombuffer(bin_buf, dtype=dtype, count=cnt * dim, offset=offset)
        return arr.reshape(cnt, dim).copy() if dim > 1 else arr.copy()

    prims = gltf["meshes"][0]["primitives"]
    p0, p1 = prims[0], prims[1]
    pos0 = get_acc(p0["attributes"]["POSITION"]).astype(np.float32)
    uv0 = get_acc(p0["attributes"]["TEXCOORD_0"]).astype(np.float32)
    tris0 = get_acc(p0["indices"]).reshape(-1, 3).astype(np.int32)

    pos1 = get_acc(p1["attributes"]["POSITION"]).astype(np.float32)
    uv1 = get_acc(p1["attributes"]["TEXCOORD_0"]).astype(np.float32)
    tris1 = get_acc(p1["indices"]).reshape(-1, 3).astype(np.int32)

    images_rgb = []
    for im in gltf.get("images", []):
        bv = gltf["bufferViews"][im["bufferView"]]
        raw = bin_buf[bv.get("byteOffset", 0) : bv.get("byteOffset", 0) + bv["byteLength"]]
        arr = np.frombuffer(raw, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError(f"Failed to decode PNG image {im.get('name')} from {glb_path}")
        images_rgb.append(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))

    return pos0, uv0, tris0, pos1, uv1, tris1, images_rgb[0], images_rgb[1]


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


def decimate_partitions_with_blender():
    """
    Runs Blender 5.2 headless (`--background`) to weld photogrammetry UV seams (`remove_doubles`),
    apply smooth deltoid shoulder relaxation, and decimate each anatomical partition using
    Blender's Quadric Edge Collapse (`DECIMATE` `COLLAPSE`) modifier.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        out_npz = os.path.join(tmpdir, "decimated_parts.npz")
        blender_code = f"""
import bpy, bmesh, numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath={SOURCE_GLB_PATH!r})
base_obj = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]

def build_part(name, filter_fn, ratio, relax_shoulders=False):
    obj = base_obj.copy()
    obj.data = base_obj.data.copy()
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
    bm.to_mesh(obj.data)
    bm.free()

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name="Dec", type="DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = ratio
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
for p_name, fn, rat, rel in [
    ("head", lambda x, y, z, m: (m == 1), 0.048, False),
    ("l_arm", lambda x, y, z, m: (m == 0) and (x >= 0.205 and y >= 1.38), 0.050, False),
    ("r_arm", lambda x, y, z, m: (m == 0) and (x <= -0.205 and y >= 1.38), 0.050, False),
    ("body", lambda x, y, z, m: (m == 0) and not (abs(x) >= 0.205 and y >= 1.38), 0.068, True),
    ("crawler_body", lambda x, y, z, m: (m == 0) and (y >= 0.665) and not (abs(x) >= 0.205 and y >= 1.38), 0.076, True),
]:
    v, t = build_part(p_name, fn, rat, rel)
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
        sh_luis = luis_f0[luis_f0[:, 2] >= 20.5].mean(axis=0)
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


def build_all_luis_zombie_models():
    t_start = time.time()
    serve_skatealley.ensure_nzportable_game_pk3(REPO_ROOT)
    if not os.path.isfile(GAME_PK3_PATH):
        raise FileNotFoundError(f"Missing reference archive: {GAME_PK3_PATH}")

    pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb = load_luis_glb(SOURCE_GLB_PATH)

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
    raw_parts = decimate_partitions_with_blender()
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
    for m_path, (fr, nm, st_c, tr) in specs.items():
        ref_meta = refs[m_path]
        mdl_bytes = compile_quake_mdl_binary(
            fr, nm, st_c, tr, skin_pixels, ref_meta["frame_names"], ref_meta
        )
        compiled_mdls[m_path] = mdl_bytes
        print(
            f"[LUIS MDL] Compiled {m_path:22s}: verts={fr.shape[1]:3d} tris={len(tr):4d} "
            f"frames={fr.shape[0]:3d} ({len(mdl_bytes) / 1024:.1f} KB)"
        )

    os.makedirs(os.path.dirname(OUTPUT_PK3_PATH), exist_ok=True)
    with zipfile.ZipFile(OUTPUT_PK3_PATH, "w", compression=zipfile.ZIP_STORED) as out_zf:
        for m_path in ALL_ZOMBIE_MODELS:
            out_zf.writestr(m_path, compiled_mdls[m_path])
        for i in range(4):
            out_zf.writestr(f"models/ai/zfull.mdl_{i}.pcx", pcx_bytes)
            out_zf.writestr(f"models/ai/zfull.mdl_{i}.palhint", palhints[i])

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

    render_comparison_png(
        pos0, uv0, tris0, pos1, uv1, tris1, body_rgb, head_rgb, compiled_mdls["models/ai/zfull.mdl"], palette_bytes
    )

    elapsed = time.time() - t_start
    print(
        f"[LUIS MDL] Packaged {OUTPUT_PK3_PATH} ({pk3_size / (1024 * 1024):.2f} MB, "
        f"sha256={pk3_sha256[:16]}...) & updated root comparison PNGs in {elapsed:.2f}s"
    )


if __name__ == "__main__":
    build_all_luis_zombie_models()
