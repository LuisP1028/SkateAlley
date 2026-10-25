#!/usr/bin/env python3
"""
Deterministic RenderWare 3.4.0.3 (0x1003FFFF) TXD Compiler for GTA: Vice City Menu Logo (`vc_logo`).

Ingests `/Users/diesel/desktop/skatealley/GTA.jpeg` (2528x1684 RGB with white background):
1. Flood-fills from the exterior image border `(0, 0)` outside the solid dark/saturated letter strokes
   so 100% of interior neon tube highlights inside "grand theft auto", "Vice city", and "PLATO DOOM"
   remain completely opaque (`alpha = 255`) with untouched RGB.
2. Applies exact color-unmixing on the exterior white background and warm orange outer glow so
   pure white (`#FFFFFF`) becomes `alpha = 0` and semi-transparent orange glow pixels have their
   white background component unmixed (`zero white halo/fringe`).
3. Crops the artwork bounding box and resamples with Lanczos/Area filtering into `vc_logo` (512x512 DXT3)
   inside `/vc-assets/local/models/fronten1.txd`, emitting `/revcdos/vcbr/luis_player/fronten1.txd`.
"""

import os
import struct
import sys

try:
    import cv2
    import numpy as np
except ImportError:
    GREEK_PY = "/opt/anaconda3/envs/greek_env/bin/python"
    if os.path.isfile(GREEK_PY) and os.path.abspath(sys.executable) != os.path.abspath(GREEK_PY):
        os.execv(GREEK_PY, [GREEK_PY] + sys.argv)
    raise

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_GTA_JPEG = os.path.join(REPO_ROOT, "GTA.jpeg")
VC_DATA_PATH = os.path.join(REPO_ROOT, "revcdos", "vcbr", "vc-sky-en-v6.data")
OUT_DIR = os.path.join(REPO_ROOT, "revcdos", "vcbr", "luis_player")
OUT_FRONTEN1_TXD = os.path.join(OUT_DIR, "fronten1.txd")

STOCK_FRONTEN1_START = 45794878
STOCK_FRONTEN1_END = 45992934


def extract_transparent_gta_logo(jpeg_path=SOURCE_GTA_JPEG, target_size=512):
    if not os.path.isfile(jpeg_path):
        raise FileNotFoundError(f"Missing source image: {jpeg_path}")

    bgr = cv2.imread(jpeg_path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError(f"Failed to decode image: {jpeg_path}")
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    h, w, _ = rgb.shape

    min_c = rgb.min(axis=2)
    max_c = rgb.max(axis=2)
    chroma = max_c - min_c

    # 1. Identify the dark brown/black 3D outline barrier around all letters (min_c < 115)
    #    and flood-fill from (0, 0) so the exterior region reaches right up to the dark letter borders
    #    (including the concavities between "grand", "theft", "auto", "Vice city", and "PLATO DOOM"),
    #    while keeping 100% of the enclosed neon letter interiors protected.
    solid_barrier = (min_c < 115.0).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    solid_barrier = cv2.morphologyEx(solid_barrier, cv2.MORPH_CLOSE, kernel)

    walkable = (1 - solid_barrier).astype(np.uint8)
    ff_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    cv2.floodFill(walkable, ff_mask, (0, 0), 2)
    exterior_region = ff_mask[1:-1, 1:-1] == 1

    # 2. For interior pixels (enclosed inside the dark 3D outlines of the letters),
    #    preserve 100% opacity and original RGB so bright neon highlights stay crisp.
    # 3. For exterior pixels (white background + soft warm orange outer glow),
    #    compute alpha from absorption of the blue/min channel and unmix white (255, 255, 255).
    whiteness = min_c / 255.0
    raw_ext_alpha = np.clip((1.0 - whiteness - 0.06) / (1.0 - 0.18), 0.0, 1.0)
    # Smooth perceptual falloff in the outer glow (pow 1.6) so pockets between words are clean
    ext_alpha = np.power(raw_ext_alpha, 1.6) * 0.85
    alpha = np.where(exterior_region, ext_alpha, 1.0)

    # Unmix white background from exterior glow pixels so there is zero white halo over dark backgrounds
    safe_alpha = np.maximum(alpha, 1e-4)[:, :, None]
    unmixed_rgb = np.clip((rgb - (1.0 - alpha[:, :, None]) * 255.0) / safe_alpha, 0.0, 255.0)
    final_rgb = np.where(exterior_region[:, :, None], unmixed_rgb, rgb)
    # Zero out RGB where alpha == 0 for clean DXT3 block compression
    final_rgb = np.where(alpha[:, :, None] > 0.005, final_rgb, 0.0)

    rgba_full = np.zeros((h, w, 4), dtype=np.uint8)
    rgba_full[:, :, :3] = np.round(final_rgb).astype(np.uint8)
    rgba_full[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)

    # 4. Crop tight to non-transparent bounding box
    ys, xs = np.where(rgba_full[:, :, 3] > 6)
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    cropped = rgba_full[y0:y1, x0:x1]

    # 5. Place into target_size x target_size canvas matching stock vc_logo proportions
    #    Start at y = 12.5% of target_size so the top of "grand" clears the top-left
    #    "#revcdos-back-to-alley-btn" button cleanly while utilizing the full lower quad.
    canvas = np.zeros((target_size, target_size, 4), dtype=np.uint8)
    box_w = int(round(target_size * 0.95))
    box_h = int(round(target_size * 0.86))
    ch, cw = cropped.shape[:2]
    scale = min(box_w / cw, box_h / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))

    # Premultiply RGB by alpha before area downsampling to prevent transparent pixel color bleed
    crop_f = cropped.astype(np.float32)
    crop_a = crop_f[:, :, 3:4] / 255.0
    premul_rgb = crop_f[:, :, :3] * crop_a
    resized_premul = cv2.resize(premul_rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)
    resized_a = cv2.resize(crop_a[:, :, 0], (new_w, new_h), interpolation=cv2.INTER_AREA)

    unpremul_rgb = np.where(
        resized_a[:, :, None] > 1e-3,
        np.clip(resized_premul / np.maximum(resized_a[:, :, None], 1e-3), 0.0, 255.0),
        0.0,
    )

    off_x = (target_size - new_w) // 2
    off_y = max(2, target_size - new_h - int(round(target_size * 0.015)))
    canvas[off_y : off_y + new_h, off_x : off_x + new_w, :3] = np.round(unpremul_rgb).astype(np.uint8)
    canvas[off_y : off_y + new_h, off_x : off_x + new_w, 3] = np.round(resized_a * 255.0).astype(np.uint8)

    return canvas


def encode_dxt3_level(rgba_arr):
    """
    Vectorized DXT3 (BC2) compressor for an (H, W, 4) uint8 RGBA image.
    Each 4x4 pixel block is encoded into 16 bytes:
      - Bytes 0..7: 64-bit explicit 4-bit alpha (16 pixels * 4 bits, row-major)
      - Bytes 8..15: 64-bit DXT1 color block (c0_rgb565, c1_rgb565, 32-bit 2-bit index LUT)
    """
    h, w, _ = rgba_arr.shape
    bh, bw = h // 4, w // 4
    num_blocks = bh * bw

    blocks = rgba_arr.reshape(bh, 4, bw, 4, 4).transpose(0, 2, 1, 3, 4).reshape(num_blocks, 16, 4)
    rgb_blocks = blocks[:, :, :3].astype(np.float32)
    alpha_blocks = blocks[:, :, 3].astype(np.float32)

    # 1. Encode 64-bit explicit 4-bit alpha per block
    a4 = np.clip(np.round(alpha_blocks * (15.0 / 255.0)), 0, 15).astype(np.uint64)
    shifts_a = (np.arange(16, dtype=np.uint64) * np.uint64(4))[None, :]
    alpha_u64 = np.bitwise_or.reduce(a4 << shifts_a, axis=1)

    # 2. Encode DXT1 color endpoints using visible pixels (alpha > 8) per block so transparent
    #    black pixels never pull colorful edge blocks toward black.
    vis_mask = alpha_blocks > 8.0
    any_vis = vis_mask.any(axis=1)

    rgb_for_min = np.where(vis_mask[:, :, None], rgb_blocks, 255.0)
    rgb_for_max = np.where(vis_mask[:, :, None], rgb_blocks, 0.0)
    c_min = np.where(any_vis[:, None], rgb_for_min.min(axis=1), 0.0)
    c_max = np.where(any_vis[:, None], rgb_for_max.max(axis=1), 0.0)

    span = c_max - c_min
    c_min_in = np.clip(c_min + 0.04 * span, 0.0, 255.0)
    c_max_in = np.clip(c_max - 0.04 * span, 0.0, 255.0)

    def to_rgb565(rgb):
        r5 = np.round(rgb[:, 0] * (31.0 / 255.0)).astype(np.uint16)
        g6 = np.round(rgb[:, 1] * (63.0 / 255.0)).astype(np.uint16)
        b5 = np.round(rgb[:, 2] * (31.0 / 255.0)).astype(np.uint16)
        u16 = (r5 << 11) | (g6 << 5) | b5
        r8 = r5.astype(np.float32) * (255.0 / 31.0)
        g8 = g6.astype(np.float32) * (255.0 / 63.0)
        b8 = b5.astype(np.float32) * (255.0 / 31.0)
        return u16, np.stack([r8, g8, b8], axis=-1)

    c0_u16, c0_rgb = to_rgb565(c_max_in)
    c1_u16, c1_rgb = to_rgb565(c_min_in)

    swap = c0_u16 < c1_u16
    if np.any(swap):
        c0_u16, c1_u16 = np.where(swap, c1_u16, c0_u16), np.where(swap, c0_u16, c1_u16)
        c0_rgb, c1_rgb = np.where(swap[:, None], c1_rgb, c0_rgb), np.where(swap[:, None], c0_rgb, c1_rgb)

    c2_rgb = (2.0 * c0_rgb + c1_rgb) / 3.0
    c3_rgb = (c0_rgb + 2.0 * c1_rgb) / 3.0
    palette = np.stack([c0_rgb, c1_rgb, c2_rgb, c3_rgb], axis=1)

    diffs = rgb_blocks[:, :, None, :] - palette[:, None, :, :]
    dists = np.sum(diffs * diffs, axis=-1)
    best_idx = np.argmin(dists, axis=-1).astype(np.uint32)

    shifts_c = (np.arange(16, dtype=np.uint32) * np.uint32(2))[None, :]
    lut_u32 = np.bitwise_or.reduce(best_idx << shifts_c, axis=1)

    out = np.empty(num_blocks, dtype=[("a64", "<u8"), ("c0", "<u2"), ("c1", "<u2"), ("lut", "<u4")])
    out["a64"] = alpha_u64
    out["c0"] = c0_u16
    out["c1"] = c1_u16
    out["lut"] = lut_u32
    return out.tobytes()


def compile_fronten1_txd(target_size=512):
    if not os.path.isfile(VC_DATA_PATH):
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import serve_skatealley
        serve_skatealley.ensure_revcdos_data(REPO_ROOT)

    with open(VC_DATA_PATH, "rb") as f:
        f.seek(STOCK_FRONTEN1_START)
        stock_txd = f.read(STOCK_FRONTEN1_END - STOCK_FRONTEN1_START)

    if len(stock_txd) != 198056:
        raise ValueError(f"Unexpected stock fronten1.txd length: {len(stock_txd)}")

    logo_rgba = extract_transparent_gta_logo(SOURCE_GTA_JPEG, target_size=target_size)
    dxt3_bytes = encode_dxt3_level(logo_rgba)
    data_size = len(dxt3_bytes)

    # Stock vc_logo is at offset 1180..66844 (header 116 bytes + 65536 data + 12 ext = 65664 total)
    off = 1180
    stock_vc_header = bytearray(stock_txd[off : off + 116])
    ts_size = 92 + data_size
    sec_size = 116 + data_size  # 12 (Struct hdr) + ts_size + 12 (Ext hdr) = 116 + data_size

    struct.pack_into("<III", stock_vc_header, 0, 0x15, sec_size, 0x1003FFFF)
    struct.pack_into("<III", stock_vc_header, 12, 0x01, ts_size, 0x1003FFFF)
    struct.pack_into("<HHBBBB", stock_vc_header, 104, target_size, target_size, 16, 1, 4, 3)
    struct.pack_into("<I", stock_vc_header, 112, data_size)

    ext_hdr = struct.pack("<III", 0x03, 0, 0x1003FFFF)
    new_vc_chunk = bytes(stock_vc_header) + dxt3_bytes + ext_hdr

    prefix = bytearray(stock_txd[:1180])
    suffix = stock_txd[66844:]
    new_total_len = len(prefix) + len(new_vc_chunk) + len(suffix)
    struct.pack_into("<III", prefix, 0, 0x16, new_total_len - 12, 0x1003FFFF)

    compiled_txd = bytes(prefix) + new_vc_chunk + suffix
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FRONTEN1_TXD, "wb") as f:
        f.write(compiled_txd)

    print(
        f"[compile_gta_menu_logo] Compiled {OUT_FRONTEN1_TXD} ({len(compiled_txd)} bytes, "
        f"vc_logo={target_size}x{target_size} DXT3, data_size={data_size})"
    )
    return compiled_txd, logo_rgba


if __name__ == "__main__":
    compile_fronten1_txd(512)
