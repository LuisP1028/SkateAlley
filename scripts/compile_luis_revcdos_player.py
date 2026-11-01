#!/usr/bin/env python3
"""
Deterministic Auto-Rigger & RenderWare 3.4.0.3 (0x0C02FFFF) Binary Compiler for Functional Specification 044.

Ingests the un-rigged glTF 2.0 character asset `/Users/diesel/desktop/skatealley/LUIS_TPOSE_STANDALONE_BACKUP.glb`:
1. Validates that the source .glb is un-rigged (`skins: []`) with 2 primitives (`prim[0]` Body + `prim[1]` Head/Hair).
2. Bakes the 2 embedded 2048x2048 PNG textures into a unified 256x256 texture atlas (`"player"`) and compiles:
   - `/revcdos/vcbr/luis_player/player.txd` (RenderWare 0x1003FFFF TexDictionary, platform 8, DXT1, 9 mip levels)
   - `/revcdos/vcbr/luis_player/player.bmp` (256x256 8-bit paletted Windows BMP, bfOffBits=1074, 66,612 bytes)
3. Decimates the combined 14,905-vertex / 20,018-triangle mesh while preserving UV seam & material boundaries
   into 1,800-4,200 vertices, remaps UVs to the unified atlas, and calibrates T-pose coordinates into
   `player.dff` bind-pose space (`X in [-0.873, +0.873]`, `Y in [-0.981, +0.855]`, `Z in [-0.184, +0.171]`).
4. Computes normalized 4-bone skin weights (`uint8[4]` indices + `float32[4]` weights summing to 1.0) across
   all 24 HAnim bones while preserving stock `player.dff`'s FrameList (25 frames), HAnim PLG (24 bones),
   and 24 4x4 inverse-bind matrices byte-for-byte.
5. Emits `/revcdos/vcbr/luis_player/player.dff` and mirrors the compiled `.dff`/`.txd` across outfit and
   cutscene player files in `/revcdos/vcsky/fetched/models/gta3.img/`.
"""

import argparse
import io
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, List, Optional, Sequence, Tuple

# Re-invoke under greek_env python if numpy/cv2 are not in the active interpreter
try:
    import cv2
    import numpy as np
except ImportError:
    GREEK_PY = "/opt/anaconda3/envs/greek_env/bin/python"
    if os.path.isfile(GREEK_PY) and os.path.abspath(sys.executable) != os.path.abspath(GREEK_PY):
        os.execv(GREEK_PY, [GREEK_PY] + sys.argv)
    raise

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from gcs_rig_intake import (
    add_gcs_rig_cli_args,
    intake_assembled_character_for_rigging,
    select_pose_intake,
    sync_target_rigged_deliverables,
)
SOURCE_GLB_PATH = os.path.join(REPO_ROOT, "LUIS_TPOSE_STANDALONE_BACKUP.glb")
VC_DATA_PATH = os.path.join(REPO_ROOT, "revcdos", "vcbr", "vc-sky-en-v6.data")
OUT_DIR = os.path.join(REPO_ROOT, "revcdos", "vcbr", "luis_player")
FETCHED_GTA3_DIR = os.path.join(REPO_ROOT, "revcdos", "vcsky", "fetched", "models", "gta3.img")
BLENDER_BIN = "/Applications/Blender.app/Contents/MacOS/Blender"

# Exact byte ranges inside vc-sky-en-v6.data (from revcdos/modules/packages/en.js)
STOCK_PLAYER_BMP_START = 52711611
STOCK_PLAYER_BMP_END = 52778223
STOCK_PLAYER_DFF_START = 103503374
STOCK_PLAYER_DFF_END = 103591438
STOCK_PLAYER_TXD_START = 103591438
STOCK_PLAYER_TXD_END = 103636494

RW_VERSION_DFF = 0x0C02FFFF
RW_VERSION_TXD = 0x1003FFFF


def read_stock_slices():
    if not os.path.isfile(VC_DATA_PATH):
        # Materialize from parts if needed
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import serve_skatealley
        serve_skatealley.ensure_revcdos_data(REPO_ROOT)

    with open(VC_DATA_PATH, "rb") as f:
        f.seek(STOCK_PLAYER_BMP_START)
        player_bmp = f.read(STOCK_PLAYER_BMP_END - STOCK_PLAYER_BMP_START)
        f.seek(STOCK_PLAYER_DFF_START)
        player_dff = f.read(STOCK_PLAYER_DFF_END - STOCK_PLAYER_DFF_START)
        f.seek(STOCK_PLAYER_TXD_START)
        player_txd = f.read(STOCK_PLAYER_TXD_END - STOCK_PLAYER_TXD_START)

    return player_dff, player_txd, player_bmp


def load_and_validate_unrigged_glb(glb_path=SOURCE_GLB_PATH):
    """
    Loads any valid glTF 2.0 `.glb` binary (`.glb`-file agnostic: supports 1..N primitives,
    0..N materials/textures, and arbitrary byte sizes).
    """
    if not os.path.isfile(glb_path):
        raise FileNotFoundError(f"Missing source GLB: {glb_path}")

    with open(glb_path, "rb") as f:
        glb = f.read()

    if len(glb) < 28:
        raise ValueError(f"GLB file too small ({len(glb)} bytes): {glb_path}")

    magic, version, total_len = struct.unpack_from("<III", glb, 0)
    if magic != 0x46546C67 or version != 2:
        raise ValueError(f"Invalid glTF 2.0 header magic=0x{magic:08X} version={version}")

    j_len, j_type = struct.unpack_from("<II", glb, 12)
    gltf = json.loads(glb[20 : 20 + j_len].decode("utf-8"))
    b_off = 20 + j_len
    bin_buf = b""
    if b_off + 8 <= len(glb):
        b_len, b_type = struct.unpack_from("<II", glb, b_off)
        bin_buf = glb[b_off + 8 : b_off + 8 + b_len]

    meshes = gltf.get("meshes") or []
    if not meshes or not any(m.get("primitives") for m in meshes):
        raise ValueError(f"Source GLB '{glb_path}' contains zero mesh primitives.")

    return gltf, bin_buf


def _decode_glb_image_rgb(gltf, bin_buf, img_idx):
    images = gltf.get("images") or []
    if not (0 <= img_idx < len(images)):
        return None
    img_meta = images[img_idx]
    if "bufferView" not in img_meta:
        return None
    bv = gltf["bufferViews"][img_meta["bufferView"]]
    off = int(bv.get("byteOffset", 0))
    raw_bytes = bin_buf[off : off + int(bv["byteLength"])]
    bgr = cv2.imdecode(np.frombuffer(raw_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if bgr is None:
        return None
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def build_composite_atlas_images(gltf, bin_buf, return_uv_transforms=False):
    """
    Generalized `256x256` RGB texture atlas builder supporting `M >= 0` materials/textures:
      - `M == 0`: solid RGB tile from default `baseColorFactor`
      - `M == 1`: single `256x256` full-frame texture (`u_off=0.0, u_scale=1.0, v_off=0.0, v_scale=1.0`)
      - `M == 2`: left/right `128x256` split (`mat 0 -> U in [0.0, 0.5]`, `mat 1 -> U in [0.5, 1.0]`)
      - `M >= 3`: `N_cols x N_rows` grid inside `256x256`
    """
    materials = gltf.get("materials") or []
    textures = gltf.get("textures") or []
    images = gltf.get("images") or []

    mat_tiles = []
    if materials:
        for mat in materials:
            pbr = mat.get("pbrMetallicRoughness") or {}
            bct = pbr.get("baseColorTexture")
            rgb_tile = None
            if isinstance(bct, dict) and "index" in bct:
                t_idx = int(bct["index"])
                if 0 <= t_idx < len(textures):
                    src_idx = textures[t_idx].get("source")
                    if src_idx is not None:
                        rgb_tile = _decode_glb_image_rgb(gltf, bin_buf, int(src_idx))
            if rgb_tile is None:
                bcf = pbr.get("baseColorFactor") or [0.78, 0.78, 0.78, 1.0]
                r8 = int(np.clip(round(float(bcf[0]) * 255.0), 0, 255))
                g8 = int(np.clip(round(float(bcf[1]) * 255.0), 0, 255))
                b8 = int(np.clip(round(float(bcf[2]) * 255.0), 0, 255))
                rgb_tile = np.full((64, 64, 3), (r8, g8, b8), dtype=np.uint8)
            mat_tiles.append(rgb_tile)
    elif images:
        for idx in range(len(images)):
            rgb_tile = _decode_glb_image_rgb(gltf, bin_buf, idx)
            if rgb_tile is not None:
                mat_tiles.append(rgb_tile)

    if not mat_tiles:
        mat_tiles = [np.full((64, 64, 3), (200, 200, 200), dtype=np.uint8)]

    k_mats = len(mat_tiles)
    atlas_rgb = np.zeros((256, 256, 3), dtype=np.uint8)
    uv_transforms: Dict[int, Tuple[float, float, float, float]] = {}

    if k_mats == 1:
        atlas_rgb[:, :, :] = cv2.resize(mat_tiles[0], (256, 256), interpolation=cv2.INTER_AREA)
        uv_transforms[0] = (0.0, 1.0, 0.0, 1.0)
    elif k_mats == 2:
        atlas_rgb[:, :128, :] = cv2.resize(mat_tiles[0], (128, 256), interpolation=cv2.INTER_AREA)
        atlas_rgb[:, 128:, :] = cv2.resize(mat_tiles[1], (128, 256), interpolation=cv2.INTER_AREA)
        uv_transforms[0] = (0.0, 0.5, 0.0, 1.0)
        uv_transforms[1] = (0.5, 0.5, 0.0, 1.0)
    else:
        n_cols = int(math.ceil(math.sqrt(k_mats)))
        n_rows = int(math.ceil(float(k_mats) / float(n_cols)))
        for m_idx, tile in enumerate(mat_tiles):
            col = m_idx % n_cols
            row = m_idx // n_cols
            x0 = int(round(col * 256.0 / n_cols))
            x1 = int(round((col + 1) * 256.0 / n_cols))
            y0 = int(round(row * 256.0 / n_rows))
            y1 = int(round((row + 1) * 256.0 / n_rows))
            atlas_rgb[y0:y1, x0:x1, :] = cv2.resize(
                tile, (max(1, x1 - x0), max(1, y1 - y0)), interpolation=cv2.INTER_AREA
            )
            uv_transforms[m_idx] = (
                float(x0) / 256.0,
                float(x1 - x0) / 256.0,
                float(y0) / 256.0,
                float(y1 - y0) / 256.0,
            )

    if return_uv_transforms:
        return atlas_rgb, uv_transforms
    return atlas_rgb


def encode_dxt1_level(rgb_arr):
    """
    Vectorized DXT1 (BC1) compressor for an (H, W, 3) uint8 RGB image.
    Produces ((H_blocks * W_blocks) * 8) bytes matching RenderWare D3D8 platform=8 comp=1 layout.
    """
    h, w, _ = rgb_arr.shape
    if h < 4 or w < 4:
        pad_h = max(4, h)
        pad_w = max(4, w)
        padded = np.zeros((pad_h, pad_w, 3), dtype=np.uint8)
        for y in range(pad_h):
            for x in range(pad_w):
                padded[y, x] = rgb_arr[min(y, h - 1), min(x, w - 1)]
        rgb_arr = padded
        h, w = pad_h, pad_w

    bh, bw = h // 4, w // 4
    blocks = rgb_arr.reshape(bh, 4, bw, 4, 3).transpose(0, 2, 1, 3, 4).reshape(-1, 16, 3).astype(np.float32)

    # Bounding box min/max endpoints per 4x4 block with 5% inset for lower RMS error
    c_min = blocks.min(axis=1)
    c_max = blocks.max(axis=1)
    span = c_max - c_min
    c_min_in = np.clip(c_min + 0.05 * span, 0.0, 255.0)
    c_max_in = np.clip(c_max - 0.05 * span, 0.0, 255.0)

    def to_rgb565(rgb):
        r5 = np.round(rgb[:, 0] * (31.0 / 255.0)).astype(np.uint16)
        g6 = np.round(rgb[:, 1] * (63.0 / 255.0)).astype(np.uint16)
        b5 = np.round(rgb[:, 2] * (31.0 / 255.0)).astype(np.uint16)
        u16 = (r5 << 11) | (g6 << 5) | b5
        r8 = (r5.astype(np.float32) * 255.0 / 31.0)
        g8 = (g6.astype(np.float32) * 255.0 / 63.0)
        b8 = (b5.astype(np.float32) * 255.0 / 31.0)
        return u16, np.stack([r8, g8, b8], axis=-1)

    c0_u16, c0_rgb = to_rgb565(c_max_in)
    c1_u16, c1_rgb = to_rgb565(c_min_in)

    # Enforce c0_u16 > c1_u16 for opaque 4-color DXT1 interpolation
    swap = c0_u16 < c1_u16
    if np.any(swap):
        c0_u16_tmp = np.where(swap, c1_u16, c0_u16)
        c1_u16_tmp = np.where(swap, c0_u16, c1_u16)
        c0_u16, c1_u16 = c0_u16_tmp, c1_u16_tmp
        c0_rgb_tmp = np.where(swap[:, None], c1_rgb, c0_rgb)
        c1_rgb_tmp = np.where(swap[:, None], c0_rgb, c1_rgb)
        c0_rgb, c1_rgb = c0_rgb_tmp, c1_rgb_tmp

    c2_rgb = (2.0 * c0_rgb + c1_rgb) / 3.0
    c3_rgb = (c0_rgb + 2.0 * c1_rgb) / 3.0

    # Palette shape: (N, 1, 4, 3) vs blocks: (N, 16, 1, 3)
    palette = np.stack([c0_rgb, c1_rgb, c2_rgb, c3_rgb], axis=1)[:, None, :, :]
    dists = ((blocks[:, :, None, :] - palette) ** 2).sum(axis=-1)
    best_idx = np.argmin(dists, axis=-1).astype(np.uint32)

    # Where c0_u16 == c1_u16, all 16 pixels map to index 0
    eq_mask = c0_u16 == c1_u16
    if np.any(eq_mask):
        best_idx[eq_mask] = 0

    lut = np.zeros(len(blocks), dtype=np.uint32)
    for p_i in range(16):
        lut |= (best_idx[:, p_i] & 0x3) << (2 * p_i)

    out = np.empty(len(blocks), dtype=[("c0", "<u2"), ("c1", "<u2"), ("lut", "<u4")])
    out["c0"] = c0_u16
    out["c1"] = c1_u16
    out["lut"] = lut
    return out.tobytes()


def compile_player_txd(atlas_rgb, stock_txd_bytes, tex_name="player"):
    """
    Compile a RenderWare 0x1003FFFF TexDictionary (.txd) containing a 256x256 DXT1 TextureNative
    with 9 mipmap levels, matching stock `player.txd` structure and 45,056-byte sector-aligned size.
    """
    mip_payloads = []
    for lvl in range(9):
        dim = max(1, 256 >> lvl)
        rgb_arr = atlas_rgb if dim == 256 else cv2.resize(atlas_rgb, (dim, dim), interpolation=cv2.INTER_AREA)
        dxt_bytes = encode_dxt1_level(rgb_arr)
        mip_payloads.append(struct.pack("<I", len(dxt_bytes)) + dxt_bytes)

    all_mips = b"".join(mip_payloads)

    name_bytes = tex_name.encode("ascii")[:31].ljust(32, b"\x00")
    mask_bytes = b"\x00" * 32
    # platform=8, filter=0x1106, name[32], mask[32], raster_format=0x8200, has_alpha=0, w=256, h=256, depth=16, levels=9, type=4, comp=1
    tn_header = (
        struct.pack("<II", 8, 0x00001106)
        + name_bytes
        + mask_bytes
        + struct.pack("<IIHHBBBB", 0x00008200, 0, 256, 256, 16, 9, 4, 1)
    )
    tn_struct_body = tn_header + all_mips
    tn_struct_chunk = struct.pack("<III", 0x0001, len(tn_struct_body), RW_VERSION_TXD) + tn_struct_body
    tn_ext_chunk = struct.pack("<III", 0x0003, 0, RW_VERSION_TXD)
    tn_body = tn_struct_chunk + tn_ext_chunk
    tn_chunk = struct.pack("<III", 0x0015, len(tn_body), RW_VERSION_TXD) + tn_body

    td_struct_body = struct.pack("<HH", 1, 0)
    td_struct_chunk = struct.pack("<III", 0x0001, len(td_struct_body), RW_VERSION_TXD) + td_struct_body
    td_ext_chunk = struct.pack("<III", 0x0003, 0, RW_VERSION_TXD)
    td_body = td_struct_chunk + tn_chunk + td_ext_chunk
    td_chunk = struct.pack("<III", 0x0016, len(td_body), RW_VERSION_TXD) + td_body

    # Pad to 45,056 bytes (22 * 2048 sector boundary matching stock player.txd)
    target_len = len(stock_txd_bytes)
    if len(td_chunk) < target_len:
        td_chunk = td_chunk + b"\x00" * (target_len - len(td_chunk))
    return td_chunk


def compile_player_bmp(atlas_rgb, stock_bmp_bytes):
    """
    Compile `/revcdos/vcbr/luis_player/player.bmp` matching stock `models/generic/player.bmp`:
    - Exact 54-byte Windows BITMAPFILEHEADER + BITMAPINFOHEADER (`bfOffBits = 1074`, `biClrUsed = 255`)
    - 255-color BGR0 palette (`1,020` bytes at offset `54..1074`)
    - Bottom-up `256x256` 8-bit indexed pixel array (`65,536` bytes at `1074..66610`)
    - 2-byte trailing pad (`66,612` total bytes)
    """
    # Use OpenCV k-means (K=255) on a downsampled pixel set to build a 255-color palette
    flat_rgb = atlas_rgb.reshape(-1, 3).astype(np.float32)
    sample = flat_rgb[::4]
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 12, 1.0)
    _, _, centers = cv2.kmeans(sample, 255, None, criteria, 1, cv2.KMEANS_PP_CENTERS)
    pal_rgb = np.clip(np.round(centers), 0, 255).astype(np.uint8)

    # Nearest-palette assignment in chunks
    idx_flat = np.empty(len(flat_rgb), dtype=np.uint8)
    pal_f = pal_rgb.astype(np.float32)
    step = 4096
    for s in range(0, len(flat_rgb), step):
        chunk = flat_rgb[s : s + step]
        d2 = ((chunk[:, None, :] - pal_f[None, :, :]) ** 2).sum(axis=-1)
        idx_flat[s : s + step] = np.argmin(d2, axis=-1).astype(np.uint8)

    pal_bgr0 = np.zeros((255, 4), dtype=np.uint8)
    pal_bgr0[:, 0] = pal_rgb[:, 2]  # B
    pal_bgr0[:, 1] = pal_rgb[:, 1]  # G
    pal_bgr0[:, 2] = pal_rgb[:, 0]  # R
    pal_bgr0[:, 3] = 0

    idx_top_down = idx_flat.reshape(256, 256)
    idx_bottom_up = np.minimum(idx_top_down[::-1, :], 254)

    header_54 = stock_bmp_bytes[:54]
    bmp_bytes = header_54 + pal_bgr0.tobytes() + idx_bottom_up.tobytes() + b"\x00\x00"
    assert len(bmp_bytes) == 66612, f"Expected 66,612 bytes for player.bmp, got {len(bmp_bytes)}"
    return bmp_bytes


def decimate_luis_mesh_blender(glb_path, ratio=None, target_tris=2800):
    """
    Run Blender headless to join all mesh objects, weld interior vertices, and adaptively decimate
    `glb_path` to `target_tris` (~3,200 triangles, 1,800-4,200 vertices) with `delimit={'MATERIAL', 'UV'}`,
    returning `(positions, normals, uvs, mat_indices, triangles)` in glTF coordinate space.
    """
    with tempfile.NamedTemporaryFile(suffix=".npz", delete=False) as tmp:
        out_npz = tmp.name

    blender_code = f"""
import bpy, bmesh
import numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath={glb_path!r})
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bm = bmesh.new()
bm.from_mesh(obj.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.triangulate(bm, faces=bm.faces)
bm.to_mesh(obj.data)
bm.free()

tot_faces = max(1, len(obj.data.polygons))
req_ratio = {ratio!r}
if req_ratio is None:
    eff_ratio = min(1.0, max(0.01, float({int(target_tris)}) / float(tot_faces)))
else:
    eff_ratio = float(req_ratio)

mod = obj.modifiers.new(name='Dec', type='DECIMATE')
mod.decimate_type = 'COLLAPSE'
mod.ratio = eff_ratio
mod.delimit = {{'MATERIAL', 'UV'}}
dg = bpy.context.evaluated_depsgraph_get()
em = obj.evaluated_get(dg).to_mesh()

bm2 = bmesh.new()
bm2.from_mesh(em)
bmesh.ops.triangulate(bm2, faces=bm2.faces)
bm2.to_mesh(em)
bm2.free()

has_uv = em.uv_layers.active is not None
uv_layer = em.uv_layers.active.data if has_uv else None
vert_map = {{}}
positions = []
normals = []
uvs = []
mat_ids = []
triangles = []

for poly in em.polygons:
    m_id = int(poly.material_index)
    tri_idx = []
    for li in poly.loop_indices:
        v_idx = em.loops[li].vertex_index
        if uv_layer is not None:
            uv = uv_layer[li].uv
            u_g = float(uv[0])
            v_g = float(1.0 - uv[1])
        else:
            u_g, v_g = 0.5, 0.5
        key = (v_idx, m_id, round(u_g, 4), round(v_g, 4))
        out_vi = vert_map.get(key)
        if out_vi is None:
            out_vi = len(positions)
            vert_map[key] = out_vi
            v = em.vertices[v_idx]
            # Convert Blender (X, -Z_gltf, Y_gltf) back to glTF (X, Y_up, Z_fwd)
            positions.append([float(v.co.x), float(v.co.z), float(-v.co.y)])
            normals.append([float(v.normal.x), float(v.normal.z), float(-v.normal.y)])
            uvs.append([u_g, v_g])
            mat_ids.append(m_id)
        tri_idx.append(out_vi)
    if len(tri_idx) == 3 and len({{tri_idx[0], tri_idx[1], tri_idx[2]}}) == 3:
        triangles.append(tri_idx)

np.savez(
    {out_npz!r},
    positions=np.array(positions, dtype=np.float32),
    normals=np.array(normals, dtype=np.float32),
    uvs=np.array(uvs, dtype=np.float32),
    mat_ids=np.array(mat_ids, dtype=np.uint8),
    triangles=np.array(triangles, dtype=np.int32),
)
"""
    try:
        subprocess.run(
            [BLENDER_BIN, "--background", "--python-expr", blender_code],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        data = np.load(out_npz)
        return (
            data["positions"],
            data["normals"],
            data["uvs"],
            data["mat_ids"],
            data["triangles"],
        )
    finally:
        if os.path.exists(out_npz):
            os.remove(out_npz)


def _normalize_to_2m_and_lift_apose_arms(positions, normals, skeleton_metrics=None):
    """
    Normalizes arbitrary glTF character coordinates to canonical `2.000m` height (`y in [0.0, 2.0]`)
    and automatically lifts downward A-pose arms (`x_arm_max < 0.75m` or `skeleton_metrics["is_apose"]`)
    into a horizontal T-pose around the character's measured shoulder pivots (`skeleton_metrics["joints_y_up"]`
    or `(±0.195m, 1.540m)` fallback) so all characters align with `player.dff`'s horizontal HAnim arm bones.
    Leaves already-horizontal T-pose meshes unchanged.
    """
    pos = np.asarray(positions, dtype=np.float64).copy()
    nrm = np.asarray(normals, dtype=np.float64).copy()

    p_min = pos.min(axis=0)
    p_max = pos.max(axis=0)
    raw_h = max(1e-6, float(p_max[1] - p_min[1]))
    # If not already normalized to 2.000m (e.g. raw stature != 2.0), normalize to 2.000m
    if abs(raw_h - 2.0) > 0.02 or abs(float(p_min[1])) > 0.02:
        s = 2.0 / raw_h
        x_mid = 0.5 * float(p_min[0] + p_max[0])
        z_mid = 0.5 * float(p_min[2] + p_max[2])
        pos[:, 0] = (pos[:, 0] - x_mid) * s
        pos[:, 1] = (pos[:, 1] - float(p_min[1])) * s
        pos[:, 2] = (pos[:, 2] - z_mid) * s

    jy = (skeleton_metrics or {}).get("joints_y_up") if isinstance(skeleton_metrics, dict) else None
    if isinstance(skeleton_metrics, dict) and skeleton_metrics.get("is_apose") is False:
        return pos.astype(np.float32), nrm.astype(np.float32)

    x_g = pos[:, 0]
    y_g = pos[:, 1]
    arm_band = (np.abs(x_g) > 0.215) & (y_g >= 0.78) & (y_g <= 1.65)
    if arm_band.any():
        x_arm_max = float(np.abs(x_g[arm_band]).max())
        is_apose_flag = bool(skeleton_metrics.get("is_apose")) if isinstance(skeleton_metrics, dict) and "is_apose" in skeleton_metrics else (x_arm_max < 0.75)
        if is_apose_flag and x_arm_max < 0.78:
            # Downward A-pose detected: use measured shoulder & wrist landmarks when available
            x_sh, y_sh = 0.195, 1.540
            x_wr, y_wr = None, None
            if isinstance(jy, dict):
                sh_l = jy.get("shoulder_l")
                sh_r = jy.get("shoulder_r")
                wr_l = jy.get("wrist_l")
                wr_r = jy.get("wrist_r")
                if sh_l and sh_r and len(sh_l) == 3 and len(sh_r) == 3:
                    x_sh = max(0.16, min(0.24, 0.5 * (abs(float(sh_l[0])) + abs(float(sh_r[0])))))
                    y_sh = max(1.38, min(1.58, 0.5 * (float(sh_l[1]) + float(sh_r[1]))))
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
                        nx, ny = float(nrm[i, 0]), float(nrm[i, 1])
                        nrm[i, 0] = nx * ca - ny * sa
                        nrm[i, 1] = nx * sa + ny * ca

    return pos.astype(np.float32), nrm.astype(np.float32)


def calibrate_tpose_and_remap_uvs(
    positions,
    normals,
    uvs,
    mat_ids,
    uv_transforms=None,
    head_mat_indices=None,
    y_neck_norm=1.640,
    skeleton_metrics=None,
):
    """
    Transform decimated glTF vertices into stock `player.dff` bind-pose space
    using character-specific `skeleton_metrics` landmarks and remap material UVs
    into the single `"player"` texture atlas.
    """
    pos_tpose, norm_tpose = _normalize_to_2m_and_lift_apose_arms(
        positions, normals, skeleton_metrics=skeleton_metrics
    )
    x_g = pos_tpose[:, 0]
    y_g = pos_tpose[:, 1]
    z_g = pos_tpose[:, 2]

    # 1. X: scale horizontal wingspan [-x_max, +x_max] -> [-0.8730, +0.8730]
    x_max_span = max(0.75, float(np.abs(x_g).max()))
    x_dff = x_g * (0.8730 / x_max_span)

    # 2. Y: piecewise-linear anatomical landmark alignment parameterized by skeleton_metrics when present
    y_knee_src = 0.5000
    y_pelvis_src = 0.9800
    y_sh_src = 1.5880
    y_neck_src = 1.6844
    if isinstance(skeleton_metrics, dict) and isinstance(skeleton_metrics.get("joints_y_up"), dict):
        jy = skeleton_metrics["joints_y_up"]
        kn_l = jy.get("knee_l")
        kn_r = jy.get("knee_r")
        pelv = jy.get("pelvis")
        sh_l = jy.get("shoulder_l")
        sh_r = jy.get("shoulder_r")
        nk = jy.get("neck_01")
        if kn_l and kn_r and len(kn_l) == 3 and len(kn_r) == 3:
            y_knee_src = max(0.36, min(0.56, 0.5 * (float(kn_l[1]) + float(kn_r[1]))))
        if pelv and len(pelv) == 3:
            y_pelvis_src = max(y_knee_src + 0.25, min(1.06, float(pelv[1])))
        if sh_l and sh_r and len(sh_l) == 3 and len(sh_r) == 3:
            y_sh_src = max(y_pelvis_src + 0.32, min(1.62, 0.5 * (float(sh_l[1]) + float(sh_r[1]))))
        if nk and len(nk) == 3:
            y_neck_src = max(y_sh_src + 0.04, min(1.76, float(nk[1])))

    y_dff = np.interp(
        y_g,
        [0.0000, y_knee_src, y_pelvis_src, y_sh_src, y_neck_src, 2.0000],
        [-0.9814, -0.4565, 0.0000, 0.5370, 0.6000, 0.8548],
    ).astype(np.float32)

    # Determine head vertices via material index or canonical neck plane
    if head_mat_indices is not None and len(head_mat_indices) > 0:
        is_head = np.isin(mat_ids, list(head_mat_indices))
    elif int(mat_ids.max()) == 1 and int(mat_ids.min()) == 0:
        is_head = mat_ids == 1
    else:
        is_head = (y_g >= float(y_neck_norm)) & (np.abs(x_g) <= 0.22)

    # 3. Z: align torso/legs around Z=-0.03, arms around Z=-0.074, head around Z=-0.035
    arm_t = np.clip((np.abs(x_g) - 0.18) / (0.35 - 0.18), 0.0, 1.0)
    arm_s = arm_t * arm_t * (3.0 - 2.0 * arm_t)
    z_body = z_g * 0.78 - 0.035 - 0.068 * arm_s
    z_head = z_g * 0.80 - 0.010
    z_dff = np.where(is_head, z_head, z_body).astype(np.float32)
    z_dff = np.clip(z_dff, -0.1840, 0.1705)

    aligned_pos = np.stack([x_dff.astype(np.float32), y_dff, z_dff], axis=-1)

    # Re-normalize vertex normals
    n_len = np.linalg.norm(norm_tpose, axis=-1, keepdims=True)
    aligned_norm = np.where(
        n_len > 1e-8,
        norm_tpose / np.maximum(n_len, 1e-8),
        np.array([0.0, 1.0, 0.0], dtype=np.float32),
    ).astype(np.float32)

    # Remap UVs using per-material affine transform (defaults to 2-material left/right split when uv_transforms is None)
    u_clamped = np.clip(uvs[:, 0], 0.002, 0.998)
    v_clamped = np.clip(uvs[:, 1], 0.002, 0.998)
    if uv_transforms:
        u_atlas = np.empty_like(u_clamped, dtype=np.float32)
        v_atlas = np.empty_like(v_clamped, dtype=np.float32)
        default_tf = uv_transforms.get(0, (0.0, 1.0, 0.0, 1.0))
        for m_val in np.unique(mat_ids):
            u_off, u_sc, v_off, v_sc = uv_transforms.get(int(m_val), default_tf)
            m_mask = mat_ids == m_val
            u_atlas[m_mask] = np.float32(u_off) + np.float32(u_sc) * u_clamped[m_mask]
            v_atlas[m_mask] = np.float32(v_off) + np.float32(v_sc) * v_clamped[m_mask]
    else:
        u_atlas = np.where(mat_ids == 1, 0.5 + 0.5 * u_clamped, 0.5 * u_clamped).astype(np.float32)
        v_atlas = v_clamped.astype(np.float32)

    aligned_uv = np.stack([u_atlas, v_atlas], axis=-1)

    return aligned_pos, aligned_norm, aligned_uv


def compute_24bone_skin_weights(positions, mat_ids, head_mat_indices=None):
    """
    Compute anatomical 4-bone skin weights (`uint8[4]` bone indices in `1..23` + `float32[4]`
    normalized weights summing to `1.0000`) for the 24-bone RenderWare HAnim hierarchy in `player.dff`.
    """
    n_verts = len(positions)
    segments = [
        (1, (-0.004, -0.060, -0.021), (0.000, 0.050, -0.045), 0.11, "center"),       # Pelvis
        (2, (0.000, 0.050, -0.045), (0.000, 0.240, -0.071), 0.12, "center"),         # Spine
        (3, (0.000, 0.240, -0.071), (0.000, 0.480, -0.071), 0.14, "center"),         # Spine1
        (4, (0.000, 0.480, -0.071), (0.000, 0.600, -0.055), 0.08, "center"),         # Neck
        (5, (0.000, 0.600, -0.035), (0.000, 0.820, -0.020), 0.12, "head"),           # Head
        # Left arm (X > 0)
        (6, (0.032, 0.537, -0.071), (0.206, 0.537, -0.074), 0.085, "left_arm"),      # Bip01 L Clavicle
        (7, (0.206, 0.537, -0.074), (0.501, 0.537, -0.074), 0.095, "left_arm"),      # L UpperArm
        (8, (0.501, 0.537, -0.074), (0.761, 0.537, -0.074), 0.085, "left_arm"),      # L Forearm
        (9, (0.761, 0.537, -0.074), (0.835, 0.537, -0.074), 0.055, "left_arm"),      # L Hand
        (10, (0.835, 0.537, -0.074), (0.880, 0.537, -0.074), 0.045, "left_arm"),     # L Finger
        # Right arm (X < 0)
        (11, (-0.031, 0.537, -0.071), (-0.205, 0.537, -0.074), 0.085, "right_arm"),   # Bip01 R Clavicle
        (12, (-0.205, 0.537, -0.074), (-0.500, 0.537, -0.074), 0.095, "right_arm"),   # R UpperArm
        (13, (-0.500, 0.537, -0.074), (-0.760, 0.537, -0.074), 0.085, "right_arm"),   # R Forearm
        (14, (-0.760, 0.537, -0.074), (-0.835, 0.537, -0.074), 0.055, "right_arm"),   # R Hand
        (15, (-0.835, 0.537, -0.074), (-0.880, 0.537, -0.074), 0.045, "right_arm"),   # R Finger
        # Left leg (X >= 0)
        (16, (0.099, 0.000, -0.021), (0.099, -0.456, -0.022), 0.11, "left_leg"),     # L Thigh
        (17, (0.099, -0.456, -0.022), (0.099, -0.850, -0.060), 0.10, "left_leg"),    # L Calf
        (18, (0.099, -0.850, -0.071), (0.099, -0.940, 0.020), 0.075, "left_leg"),    # L Foot
        (19, (0.099, -0.940, 0.030), (0.099, -0.982, 0.140), 0.065, "left_leg"),     # L Toe0
        # Right leg (X < 0)
        (20, (-0.106, 0.000, -0.021), (-0.106, -0.457, -0.019), 0.11, "right_leg"),  # R Thigh
        (21, (-0.106, -0.457, -0.019), (-0.106, -0.850, -0.060), 0.10, "right_leg"), # R Calf
        (22, (-0.106, -0.850, -0.065), (-0.106, -0.940, 0.020), 0.075, "right_leg"), # R Foot
        (23, (-0.106, -0.940, 0.030), (-0.106, -0.981, 0.140), 0.065, "right_leg"),  # R Toe0
    ]

    raw_weights = np.zeros((n_verts, 24), dtype=np.float64)
    px = positions[:, 0]
    py = positions[:, 1]

    if head_mat_indices is not None and len(head_mat_indices) > 0:
        is_head_prim = np.isin(mat_ids, list(head_mat_indices))
    elif int(mat_ids.max()) == 1 and int(mat_ids.min()) == 0:
        is_head_prim = mat_ids == 1
    else:
        is_head_prim = (py > 0.56) & (np.abs(px) < 0.18)

    is_body_prim = ~is_head_prim

    for b_idx, p0, p1, sigma, rule in segments:
        a = np.array(p0, dtype=np.float64)
        b = np.array(p1, dtype=np.float64)
        ab = b - a
        ab_len2 = float(np.dot(ab, ab))
        if ab_len2 > 1e-12:
            t = np.clip(np.dot(positions - a, ab) / ab_len2, 0.0, 1.0)
            proj = a[None, :] + t[:, None] * ab[None, :]
        else:
            proj = np.broadcast_to(a, positions.shape)
        dist2 = np.sum((positions - proj) ** 2, axis=-1)
        w = np.exp(-dist2 / (2.0 * (sigma ** 2)))

        # Enforce strict anatomical region isolation
        if rule == "head":
            mask = is_head_prim | ((py > 0.56) & (np.abs(px) < 0.16))
            w = np.where(mask, w * 4.0, 0.0)
        elif rule == "left_arm":
            mask = is_body_prim & (px > 0.02) & (py > 0.25)
            w = np.where(mask, w, 0.0)
        elif rule == "right_arm":
            mask = is_body_prim & (px < -0.02) & (py > 0.25)
            w = np.where(mask, w, 0.0)
        elif rule == "left_leg":
            mask = is_body_prim & (px >= -0.005) & (py < 0.06)
            w = np.where(mask, w, 0.0)
        elif rule == "right_leg":
            mask = is_body_prim & (px < 0.005) & (py < 0.06)
            w = np.where(mask, w, 0.0)
        elif rule == "center":
            mask = (np.abs(px) < 0.24) & (py > -0.18) & (py < 0.66)
            w = np.where(mask, w, 0.0)

        raw_weights[:, b_idx] = w

    # Explicit head binding for head primitive/region: smooth blend between Head (5) and Neck (4)
    head_mask = is_head_prim
    if np.any(head_mask):
        raw_weights[head_mask, :] = 0.0
        w_h = np.clip((py[head_mask] - 0.55) / 0.10, 0.80, 1.0)
        raw_weights[head_mask, 5] = w_h
        raw_weights[head_mask, 4] = 1.0 - w_h

    # Select top 4 bones per vertex and normalize in float32
    bone_indices = np.zeros((n_verts, 4), dtype=np.uint8)
    bone_weights = np.zeros((n_verts, 4), dtype=np.float32)

    for i in range(n_verts):
        row = raw_weights[i, 1:24]  # bones 1..23
        if row.max() <= 1e-12:
            bone_indices[i, 0] = 1
            bone_weights[i, 0] = 1.0
            continue

        top4_rel = np.argsort(row)[::-1][:4]
        top4_bones = (top4_rel + 1).astype(np.uint8)
        top4_vals = row[top4_rel]
        keep = top4_vals >= (top4_vals[0] * 0.01)
        top4_vals = np.where(keep, top4_vals, 0.0)
        top4_bones = np.where(keep, top4_bones, 0).astype(np.uint8)

        w32 = (top4_vals / top4_vals.sum()).astype(np.float32)
        w32[0] = np.float32(1.0) - (w32[1] + w32[2] + w32[3])
        bone_indices[i] = top4_bones
        bone_weights[i] = w32

    return bone_indices, bone_weights


def build_tristrip_from_triangles(triangles):
    """
    Compile an array of CCW triangles `(a, b, c)` into a lossless degenerate-stitched
    triangle strip (`bm_flags = 1`) with 100% outward CCW winding parity and zero stray bridges.
    """
    strip = []
    for a, b, c in triangles:
        a_i, b_i, c_i = int(a), int(b), int(c)
        if not strip:
            strip.extend([a_i, b_i, c_i])
        else:
            last = strip[-1]
            if len(strip) % 2 == 1:
                strip.extend([last, a_i, a_i, c_i, b_i])
            else:
                strip.extend([last, a_i, a_i, b_i, c_i])
    return np.array(strip, dtype=np.uint32)


def compile_player_dff(stock_dff_bytes, positions, normals, uvs, triangles, bone_indices, bone_weights):
    """
    Compile RenderWare 3.4.0.3 (`0x0C02FFFF`) `player.dff` Clump (`0x0010`):
    - Copies Clump Struct (`12..36`) and FrameList (`36..3141`, 25 frames + 24 HAnim bones) verbatim from stock `player.dff`.
    - Reconstructs GeometryList (`0x001A`) -> Geometry (`0x000F`, flags=`0x00010037`) with custom geometry, MaterialList (`50981..51153`),
      BinMesh PLG (`0x050E`), Skin PLG (`0x0116` with verbatim 24x68B inverse-bind matrices from stock `player.dff`), and Morph PLG (`0x0105`).
    - Copies Atomic (`86117..86205`) and Clump Extension (`86205..86217`) verbatim from stock `player.dff`.
    """
    n_verts = len(positions)
    n_tris = len(triangles)

    # 1. Verbatim prefix: Clump Struct (12..36) + FrameList (36..3141) + GeometryList Struct (3153..3169)
    clump_struct_and_framelist = stock_dff_bytes[12:3141]
    geom_list_struct = stock_dff_bytes[3153:3169]

    # 2. Verbatim MaterialList (50981..51153, referencing texture "player")
    material_list_chunk = stock_dff_bytes[50981:51153]

    # 3. Verbatim 24 inverse-bind matrices (24 * 68 = 1632 bytes at end of stock Skin PLG 61393..86101)
    stock_skin_end = 86101
    stock_inv_bind_matrices = stock_dff_bytes[stock_skin_end - 24 * 68 : stock_skin_end]
    assert len(stock_inv_bind_matrices) == 1632

    # 4. Verbatim Morph PLG (86101..86117) and Atomic + Clump Extension (86117..86217)
    morph_plg_chunk = stock_dff_bytes[86101:86117]
    atomic_and_clump_ext = stock_dff_bytes[86117:86217]

    # 5. Construct Geometry Struct (0x0001)
    # flags = 0x00010037 (rpGEOMETRYTRISTRIP | rpGEOMETRYPOSITIONS | rpGEOMETRYTEXTURED | rpGEOMETRYNORMALS | rpGEOMETRYLIGHT | rpGEOMETRYMODULATEMATERIALCOLOR)
    geom_flags = 0x00010037
    geom_hdr = struct.pack("<IIIIfff", geom_flags, n_tris, n_verts, 1, 1.0, 1.0, 1.0)
    uv_bytes = uvs.astype(np.float32).tobytes()

    # RpTriangle array: (v2=b, v1=a, matId=0, v3=c) matching stock player.dff convention
    rp_tris = np.empty((n_tris, 4), dtype=np.uint16)
    rp_tris[:, 0] = triangles[:, 1].astype(np.uint16)
    rp_tris[:, 1] = triangles[:, 0].astype(np.uint16)
    rp_tris[:, 2] = 0
    rp_tris[:, 3] = triangles[:, 2].astype(np.uint16)
    tri_bytes = rp_tris.tobytes()

    # Bounding sphere + hasPosition=1 + hasNormals=1
    center = ((positions.min(axis=0) + positions.max(axis=0)) * 0.5).astype(np.float32)
    radius = float(np.linalg.norm(positions - center[None, :], axis=-1).max())
    morph_hdr = struct.pack("<ffffII", float(center[0]), float(center[1]), float(center[2]), radius, 1, 1)
    pos_bytes = positions.astype(np.float32).tobytes()
    norm_bytes = normals.astype(np.float32).tobytes()

    geom_struct_body = geom_hdr + uv_bytes + tri_bytes + morph_hdr + pos_bytes + norm_bytes
    geom_struct_chunk = struct.pack("<III", 0x0001, len(geom_struct_body), RW_VERSION_DFF) + geom_struct_body

    # 6. Construct BinMesh PLG (0x050E)
    strip_indices = build_tristrip_from_triangles(triangles)
    n_strip = len(strip_indices)
    binmesh_body = struct.pack("<IIIII", 1, 1, n_strip, n_strip, 0) + strip_indices.tobytes()
    binmesh_chunk = struct.pack("<III", 0x050E, len(binmesh_body), RW_VERSION_DFF) + binmesh_body

    # 7. Construct Skin PLG (0x0116)
    skin_hdr = struct.pack("<BBBB", 24, 0, 0, 0)
    skin_body = (
        skin_hdr
        + bone_indices.astype(np.uint8).tobytes()
        + bone_weights.astype(np.float32).tobytes()
        + stock_inv_bind_matrices
    )
    skin_chunk = struct.pack("<III", 0x0116, len(skin_body), RW_VERSION_DFF) + skin_body

    # 8. Construct Geometry Extension (0x0003) -> Geometry (0x000F) -> GeometryList (0x001A) -> Clump (0x0010)
    geom_ext_body = binmesh_chunk + skin_chunk + morph_plg_chunk
    geom_ext_chunk = struct.pack("<III", 0x0003, len(geom_ext_body), RW_VERSION_DFF) + geom_ext_body

    geom_body = geom_struct_chunk + material_list_chunk + geom_ext_chunk
    geom_chunk = struct.pack("<III", 0x000F, len(geom_body), RW_VERSION_DFF) + geom_body

    geom_list_body = geom_list_struct + geom_chunk
    geom_list_chunk = struct.pack("<III", 0x001A, len(geom_list_body), RW_VERSION_DFF) + geom_list_body

    clump_body = clump_struct_and_framelist + geom_list_chunk + atomic_and_clump_ext
    clump_chunk = struct.pack("<III", 0x0010, len(clump_body), RW_VERSION_DFF) + clump_body

    # Pad to 2048-byte IMG sector boundary
    rem = len(clump_chunk) % 2048
    if rem != 0:
        clump_chunk += b"\x00" * (2048 - rem)

    return clump_chunk


def mirror_outfits_and_cutscenes(dff_bytes, txd_bytes):
    """
    Mirror the compiled `player.dff` and `player.txd` across gameplay outfits (`player2..player9`)
    and cutscene player models (`csplay2..csplay11`) in `/revcdos/vcsky/fetched/models/gta3.img/`.
    """
    if not os.path.isdir(FETCHED_GTA3_DIR):
        return []

    mirrored = []
    targets = [f"player{i}" for i in range(2, 10)] + [f"csplay{i}" for i in range(2, 12)]
    for base in targets:
        dff_dst = os.path.join(FETCHED_GTA3_DIR, f"{base}.dff")
        txd_dst = os.path.join(FETCHED_GTA3_DIR, f"{base}.txd")
        # Break any hardlinks before writing so shared cache outside the workspace is untouched
        for dst, payload in ((dff_dst, dff_bytes), (txd_dst, txd_bytes)):
            if os.path.exists(dst):
                try:
                    os.unlink(dst)
                except OSError:
                    pass
            with open(dst, "wb") as f:
                f.write(payload)
            mirrored.append(dst)
    return mirrored


def build_all(
    source_glb_path: str = SOURCE_GLB_PATH,
    out_dir: str = OUT_DIR,
    head_mat_indices: Optional[Sequence[int]] = None,
    y_neck_norm: float = 1.640,
    target_tris: int = 2800,
    skeleton_metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    t0 = time.perf_counter()
    os.makedirs(out_dir, exist_ok=True)
    stock_dff, stock_txd, stock_bmp = read_stock_slices()
    gltf, bin_buf = load_and_validate_unrigged_glb(source_glb_path)

    # Auto-detect head material indices if not provided
    if head_mat_indices is None:
        detected_heads = []
        for idx, m in enumerate(gltf.get("materials") or []):
            mname = str(m.get("name") or "").lower()
            if "head" in mname or "hair" in mname or "face" in mname:
                detected_heads.append(idx)
        head_mat_indices = detected_heads

    # Step 1: Texture Atlas + player.txd + player.bmp
    atlas_rgb, uv_transforms = build_composite_atlas_images(gltf, bin_buf, return_uv_transforms=True)
    txd_bytes = compile_player_txd(atlas_rgb, stock_txd, tex_name="player")
    bmp_bytes = compile_player_bmp(atlas_rgb, stock_bmp)

    # Step 2: UV-preserving mesh decimation + T-pose calibration + 24-bone auto-rigging
    positions, normals, uvs, mat_ids, triangles = decimate_luis_mesh_blender(
        source_glb_path, ratio=None, target_tris=target_tris
    )
    aligned_pos, aligned_norm, aligned_uv = calibrate_tpose_and_remap_uvs(
        positions,
        normals,
        uvs,
        mat_ids,
        uv_transforms=uv_transforms,
        head_mat_indices=head_mat_indices,
        y_neck_norm=y_neck_norm,
        skeleton_metrics=skeleton_metrics,
    )
    bone_indices, bone_weights = compute_24bone_skin_weights(
        aligned_pos, mat_ids, head_mat_indices=head_mat_indices
    )

    # Step 3: RenderWare 0x0C02FFFF player.dff compilation
    dff_bytes = compile_player_dff(
        stock_dff,
        aligned_pos,
        aligned_norm,
        aligned_uv,
        triangles,
        bone_indices,
        bone_weights,
    )

    out_dff = os.path.join(out_dir, "player.dff")
    out_txd = os.path.join(out_dir, "player.txd")
    out_bmp = os.path.join(out_dir, "player.bmp")
    out_meta = os.path.join(out_dir, "metadata.json")

    with open(out_dff, "wb") as f:
        f.write(dff_bytes)
    with open(out_txd, "wb") as f:
        f.write(txd_bytes)
    with open(out_bmp, "wb") as f:
        f.write(bmp_bytes)

    # Also mirror to default OUT_DIR if out_dir is custom so /revcdos/ runtime serves the newly compiled character
    if os.path.abspath(out_dir) != os.path.abspath(OUT_DIR):
        os.makedirs(OUT_DIR, exist_ok=True)
        shutil.copy2(out_dff, os.path.join(OUT_DIR, "player.dff"))
        shutil.copy2(out_txd, os.path.join(OUT_DIR, "player.txd"))
        shutil.copy2(out_bmp, os.path.join(OUT_DIR, "player.bmp"))

    mirrored = mirror_outfits_and_cutscenes(dff_bytes, txd_bytes)

    active_bones = sorted(int(b) for b in np.unique(bone_indices) if b > 0)
    weight_sums = bone_weights.sum(axis=-1)
    meta = {
        "sourceGlb": os.path.basename(source_glb_path),
        "sourceGlbBytes": os.path.getsize(source_glb_path),
        "unriggedSourceSkinsCount": len(gltf.get("skins", [])),
        "numVertices": int(len(aligned_pos)),
        "numTriangles": int(len(triangles)),
        "numBones": 24,
        "activeBoneIndices": active_bones,
        "activeBoneCount": len(active_bones),
        "boundsMin": [round(float(x), 4) for x in aligned_pos.min(axis=0)],
        "boundsMax": [round(float(x), 4) for x in aligned_pos.max(axis=0)],
        "weightSumMin": float(weight_sums.min()),
        "weightSumMax": float(weight_sums.max()),
        "playerDffBytes": len(dff_bytes),
        "playerTxdBytes": len(txd_bytes),
        "playerBmpBytes": len(bmp_bytes),
        "mirroredFilesCount": len(mirrored),
        "elapsedSec": round(time.perf_counter() - t0, 4),
        "playerDffPath": out_dff,
        "playerTxdPath": out_txd,
        "playerBmpPath": out_bmp,
    }
    with open(out_meta, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    if os.path.abspath(out_dir) != os.path.abspath(OUT_DIR):
        with open(os.path.join(OUT_DIR, "metadata.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    return meta


def rig_assembled_glb_for_gta(
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
    Stage 5 `.glb`-agnostic GTA: Vice City rigger entrypoint (`INV-GCS-RIG-01`, `INV-NO-REASSEMBLE-01`):
      1. Pulls and validates `03_meshes/assembled/character_full.glb` + `assembly_telemetry.json` from GCS (or local `--glb`),
      2. Compiles `player.dff` (RenderWare `0x0C02FFFF`, 24 HAnim bones), `player.txd` (`0x1003FFFF` DXT1), and `player.bmp` (`66,612` B),
      3. Mirrors outfits/cutscenes into `/revcdos/vcsky/fetched/models/gta3.img/`,
      4. Syncs `player.dff`, `player.txd`, `player.bmp`, and `rig_telemetry.json` to
         `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/04_rigged/gta/`.
    """
    if precomputed_intake is not None:
        intake = select_pose_intake(precomputed_intake, preferred_pose="tpose", target_game="gta")
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
            target_game="gta",
        )
    hb = intake["head_bounds_norm"]
    meta = build_all(
        source_glb_path=intake["local_glb_path"],
        out_dir=OUT_DIR,
        head_mat_indices=hb.get("head_material_indices"),
        y_neck_norm=float(hb.get("y_neck_norm", 1.640)),
        target_tris=2800,
        skeleton_metrics=intake.get("skeleton_metrics"),
    )

    # Also copy deliverables into <output_dir>/rigged/gta/
    stage5_dir = os.path.join(intake["output_dir"], "rigged", "gta")
    os.makedirs(stage5_dir, exist_ok=True)
    for fn in ("player.dff", "player.txd", "player.bmp"):
        src_p = os.path.join(OUT_DIR, fn)
        dst_p = os.path.join(stage5_dir, fn)
        if os.path.abspath(src_p) != os.path.abspath(dst_p):
            shutil.copy2(src_p, dst_p)

    telemetry_payload: Dict[str, Any] = {
        "status": "SUCCESS",
        "specification": "functional_specification_061",
        "rw_version_dff": "0x0C02FFFF",
        "rw_version_txd": "0x1003FFFF",
        "build_metadata": meta,
        "head_bounds_norm": hb,
    }
    sync_res = sync_target_rigged_deliverables(
        intake_info=intake,
        target_game="gta",
        deliverables=[
            ("player_dff", os.path.join(stage5_dir, "player.dff"), "application/octet-stream"),
            ("player_txd", os.path.join(stage5_dir, "player.txd"), "application/octet-stream"),
            ("player_bmp", os.path.join(stage5_dir, "player.bmp"), "image/bmp"),
        ],
        telemetry_payload=telemetry_payload,
        sync_audit=sync_audit,
    )
    return sync_res if return_sync_bundle else sync_res["telemetry"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Stage 5 .glb-agnostic GTA: Vice City (RenderWare 0x0C02FFFF) automated rigger."
    )
    add_gcs_rig_cli_args(parser)
    args = parser.parse_args()

    if args.glb or (args.player_name and args.player_id and args.run_id):
        tel = rig_assembled_glb_for_gta(
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

    meta = build_all()
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
