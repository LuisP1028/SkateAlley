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

import io
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import tempfile

# Re-invoke under greek_env python if numpy/cv2 are not in the active interpreter
try:
    import cv2
    import numpy as np
except ImportError:
    GREEK_PY = "/opt/anaconda3/envs/greek_env/bin/python"
    if os.path.isfile(GREEK_PY) and os.path.abspath(sys.executable) != os.path.abspath(GREEK_PY):
        os.execv(GREEK_PY, [GREEK_PY] + sys.argv)
    raise

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
    if not os.path.isfile(glb_path):
        raise FileNotFoundError(f"Missing un-rigged source GLB: {glb_path}")

    with open(glb_path, "rb") as f:
        glb = f.read()

    if len(glb) != 5285932:
        raise ValueError(f"Expected LUIS_TPOSE_STANDALONE_BACKUP.glb to be 5,285,932 bytes, got {len(glb)}")

    magic, version, total_len = struct.unpack_from("<III", glb, 0)
    if magic != 0x46546C67 or version != 2:
        raise ValueError(f"Invalid glTF 2.0 header magic=0x{magic:08X} version={version}")

    j_len, j_type = struct.unpack_from("<II", glb, 12)
    gltf = json.loads(glb[20 : 20 + j_len].decode("utf-8"))
    b_off = 20 + j_len
    b_len, b_type = struct.unpack_from("<II", glb, b_off)
    bin_buf = glb[b_off + 8 : b_off + 8 + b_len]

    if len(gltf.get("skins", [])) != 0:
        raise ValueError("Source GLB must be un-rigged (skins == [])")

    prims = gltf["meshes"][0]["primitives"]
    if len(prims) != 2:
        raise ValueError(f"Expected 2 primitives (Body + Head/Hair), got {len(prims)}")

    return gltf, bin_buf


def build_composite_atlas_images(gltf, bin_buf):
    """
    Decode the 2 embedded 2048x2048 PNG textures (Body + Head/Hair) and pack them into
    a unified 256x256 RGB texture atlas:
      - Left half (x in 0..127, U in [0.0, 0.5]): Body texture (images[0])
      - Right half (x in 128..255, U in [0.5, 1.0]): Head/Hair texture (images[1])
    """
    imgs = []
    for i in range(2):
        img_meta = gltf["images"][i]
        bv = gltf["bufferViews"][img_meta["bufferView"]]
        raw_png = bin_buf[bv["byteOffset"] : bv["byteOffset"] + bv["byteLength"]]
        bgr = cv2.imdecode(np.frombuffer(raw_png, dtype=np.uint8), cv2.IMREAD_COLOR)
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        imgs.append(rgb)

    body_half = cv2.resize(imgs[0], (128, 256), interpolation=cv2.INTER_AREA)
    head_half = cv2.resize(imgs[1], (128, 256), interpolation=cv2.INTER_AREA)
    atlas_rgb = np.zeros((256, 256, 3), dtype=np.uint8)
    atlas_rgb[:, :128, :] = body_half
    atlas_rgb[:, 128:, :] = head_half
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


def decimate_luis_mesh_blender(glb_path, ratio=0.16):
    """
    Run Blender headless to weld interior vertices and decimate `LUIS_TPOSE_STANDALONE_BACKUP.glb`
    with `delimit={'MATERIAL', 'UV'}`, returning `(positions, normals, uvs, mat_indices, triangles)`
    in glTF coordinate space.
    """
    with tempfile.NamedTemporaryFile(suffix=".npz", delete=False) as tmp:
        out_npz = tmp.name

    blender_code = f"""
import bpy, bmesh
import numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath={glb_path!r})
obj = [o for o in bpy.data.objects if o.type == 'MESH'][0]

bm = bmesh.new()
bm.from_mesh(obj.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.triangulate(bm, faces=bm.faces)
bm.to_mesh(obj.data)
bm.free()

mod = obj.modifiers.new(name='Dec', type='DECIMATE')
mod.decimate_type = 'COLLAPSE'
mod.ratio = {ratio}
mod.delimit = {{'MATERIAL', 'UV'}}
dg = bpy.context.evaluated_depsgraph_get()
em = obj.evaluated_get(dg).to_mesh()

bm2 = bmesh.new()
bm2.from_mesh(em)
bmesh.ops.triangulate(bm2, faces=bm2.faces)
bm2.to_mesh(em)
bm2.free()

uv_layer = em.uv_layers.active.data
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
        uv = uv_layer[li].uv
        u_g = float(uv[0])
        v_g = float(1.0 - uv[1])
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


def calibrate_tpose_and_remap_uvs(positions, normals, uvs, mat_ids):
    """
    Transform decimated glTF T-pose vertices into stock `player.dff` bind-pose space
    and remap `prim[0]` / `prim[1]` UVs into the single `"player"` texture atlas.
    """
    x_g = positions[:, 0]
    y_g = positions[:, 1]
    z_g = positions[:, 2]

    # 1. X: scale [-0.9018, +0.9018] -> [-0.8730, +0.8730]
    x_dff = x_g * (0.8730 / 0.9018285)

    # 2. Y: piecewise-linear anatomical landmark alignment
    # Soles (0.0) -> -0.9814, Knees (0.50) -> -0.4565, Pelvis (0.98) -> 0.0000,
    # Shoulder/Arm centerline (1.588) -> +0.5370, Neck/Head base (1.6844) -> +0.6000, Crown (2.00) -> +0.8548
    y_dff = np.interp(
        y_g,
        [0.0000, 0.5000, 0.9800, 1.5880, 1.6844, 2.0000],
        [-0.9814, -0.4565, 0.0000, 0.5370, 0.6000, 0.8548],
    ).astype(np.float32)

    # 3. Z: align torso/legs around Z=-0.03, arms around Z=-0.074, head around Z=-0.035
    arm_t = np.clip((np.abs(x_g) - 0.18) / (0.35 - 0.18), 0.0, 1.0)
    arm_s = arm_t * arm_t * (3.0 - 2.0 * arm_t)
    z_body = z_g * 0.78 - 0.035 - 0.068 * arm_s
    z_head = z_g * 0.80 - 0.010
    z_dff = np.where(mat_ids == 1, z_head, z_body).astype(np.float32)
    z_dff = np.clip(z_dff, -0.1840, 0.1705)

    aligned_pos = np.stack([x_dff.astype(np.float32), y_dff, z_dff], axis=-1)

    # Re-normalize vertex normals
    n_len = np.linalg.norm(normals, axis=-1, keepdims=True)
    aligned_norm = np.where(n_len > 1e-8, normals / np.maximum(n_len, 1e-8), np.array([0.0, 1.0, 0.0], dtype=np.float32)).astype(np.float32)

    # Remap UVs: prim[0] (Body) -> left half [0.0, 0.5], prim[1] (Head) -> right half [0.5, 1.0]
    u_clamped = np.clip(uvs[:, 0], 0.002, 0.998)
    v_clamped = np.clip(uvs[:, 1], 0.002, 0.998)
    u_atlas = np.where(mat_ids == 1, 0.5 + 0.5 * u_clamped, 0.5 * u_clamped).astype(np.float32)
    v_atlas = v_clamped.astype(np.float32)
    aligned_uv = np.stack([u_atlas, v_atlas], axis=-1)

    return aligned_pos, aligned_norm, aligned_uv


def compute_24bone_skin_weights(positions, mat_ids):
    """
    Compute anatomical 4-bone skin weights (`uint8[4]` bone indices in `1..23` + `float32[4]`
    normalized weights summing to `1.0000`) for the 24-bone RenderWare HAnim hierarchy in `player.dff`.
    """
    n_verts = len(positions)
    # Define the 23 active anatomical bone segments (indices 1..23; index 0 = Root is unused for skinning)
    # Each entry: (bone_idx, p0, p1, sigma, side_rule)
    # side_rule: 'center', 'left_arm', 'right_arm', 'left_leg', 'right_leg', 'head'
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
            mask = (mat_ids == 1) | ((py > 0.56) & (np.abs(px) < 0.16))
            w = np.where(mask, w * 4.0, 0.0)
        elif rule == "left_arm":
            mask = (mat_ids == 0) & (px > 0.02) & (py > 0.25)
            w = np.where(mask, w, 0.0)
        elif rule == "right_arm":
            mask = (mat_ids == 0) & (px < -0.02) & (py > 0.25)
            w = np.where(mask, w, 0.0)
        elif rule == "left_leg":
            mask = (mat_ids == 0) & (px >= -0.005) & (py < 0.06)
            w = np.where(mask, w, 0.0)
        elif rule == "right_leg":
            mask = (mat_ids == 0) & (px < 0.005) & (py < 0.06)
            w = np.where(mask, w, 0.0)
        elif rule == "center":
            mask = (np.abs(px) < 0.24) & (py > -0.18) & (py < 0.66)
            w = np.where(mask, w, 0.0)

        raw_weights[:, b_idx] = w

    # Explicit head binding for prim[1] (Head/Hair): smooth blend between Head (5) and Neck (4)
    head_mask = mat_ids == 1
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
            # Fallback to nearest bone in 1..23
            bone_indices[i, 0] = 1
            bone_weights[i, 0] = 1.0
            continue

        top4_rel = np.argsort(row)[::-1][:4]
        top4_bones = (top4_rel + 1).astype(np.uint8)
        top4_vals = row[top4_rel]
        # Zero out negligible weights (< 1% of primary weight)
        keep = top4_vals >= (top4_vals[0] * 0.01)
        top4_vals = np.where(keep, top4_vals, 0.0)
        top4_bones = np.where(keep, top4_bones, 0).astype(np.uint8)

        w32 = (top4_vals / top4_vals.sum()).astype(np.float32)
        # Adjust primary weight so float32 sum is 1.000000
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


def build_all():
    os.makedirs(OUT_DIR, exist_ok=True)
    stock_dff, stock_txd, stock_bmp = read_stock_slices()
    gltf, bin_buf = load_and_validate_unrigged_glb(SOURCE_GLB_PATH)

    # Step 1: Texture Atlas + player.txd + player.bmp
    atlas_pil = build_composite_atlas_images(gltf, bin_buf)
    txd_bytes = compile_player_txd(atlas_pil, stock_txd, tex_name="player")
    bmp_bytes = compile_player_bmp(atlas_pil, stock_bmp)

    # Step 2: UV-preserving mesh decimation + T-pose calibration + 24-bone auto-rigging
    positions, normals, uvs, mat_ids, triangles = decimate_luis_mesh_blender(SOURCE_GLB_PATH, ratio=0.16)
    aligned_pos, aligned_norm, aligned_uv = calibrate_tpose_and_remap_uvs(positions, normals, uvs, mat_ids)
    bone_indices, bone_weights = compute_24bone_skin_weights(aligned_pos, mat_ids)

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

    out_dff = os.path.join(OUT_DIR, "player.dff")
    out_txd = os.path.join(OUT_DIR, "player.txd")
    out_bmp = os.path.join(OUT_DIR, "player.bmp")
    out_meta = os.path.join(OUT_DIR, "metadata.json")

    with open(out_dff, "wb") as f:
        f.write(dff_bytes)
    with open(out_txd, "wb") as f:
        f.write(txd_bytes)
    with open(out_bmp, "wb") as f:
        f.write(bmp_bytes)

    mirrored = mirror_outfits_and_cutscenes(dff_bytes, txd_bytes)

    active_bones = sorted(int(b) for b in np.unique(bone_indices) if b > 0)
    weight_sums = bone_weights.sum(axis=-1)
    meta = {
        "sourceGlb": "LUIS_TPOSE_STANDALONE_BACKUP.glb",
        "sourceGlbBytes": 5285932,
        "unriggedSourceSkinsCount": 0,
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
    }
    with open(out_meta, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(json.dumps(meta, indent=2))
    return meta


if __name__ == "__main__":
    build_all()
