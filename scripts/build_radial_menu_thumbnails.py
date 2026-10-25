#!/usr/bin/env python3
"""
Pre-bake lightweight, high-contrast amber-orange holographic thumbnail PNGs
for the 6 radial menu slice emblems (160x160) and the central PLATO DOOM
hub emblem (280x92), eliminating 18.51 MP (~74 MB uncompressed RGBA) of runtime
SVG image downsampling and per-frame SVG feColorMatrix / feGaussianBlur passes.
"""

import os
from pathlib import Path
import sys

GREEK_ENV_PYTHON = "/opt/anaconda3/envs/greek_env/bin/python"

try:
    import cv2
    import numpy as np
except ImportError:
    if os.path.exists(GREEK_ENV_PYTHON) and sys.executable != GREEK_ENV_PYTHON:
        os.execv(GREEK_ENV_PYTHON, [GREEK_ENV_PYTHON] + sys.argv)
    raise

REPO_ROOT = Path(__file__).resolve().parent.parent

SLICE_SOURCES = [
    "doom_tag",
    "glass_doom",
    "doom_cig",
    "doom_watch",
    "blueberry_tag",
    "eye_tag",
]

PRIMARY_EMBLEM_SOURCES = [
    ("mail", "Mail_emblem.jpeg"),
    ("github", "github_emblem.jpeg"),
    ("x", "twitter_emblem.jpeg"),
    ("spraypaint", "spraypaint_emblem.jpeg"),
]

THUMB_MAX_SIZE = 192


def grade_bgra_to_amber_holo(bgra_u8: np.ndarray) -> np.ndarray:
    """
    Convert a BGRA uint8 image into a cohesive, high-contrast cyber-tactical
    amber-orange palette (deep burnt umber -> vibrant amber orange -> warm gold-white)
    with a pre-baked soft amber outer glow so zero runtime SVG filters are needed.
    """
    bgra = bgra_u8.astype(np.float32) / 255.0
    b = bgra[..., 0]
    g = bgra[..., 1]
    r = bgra[..., 2]
    alpha = bgra[..., 3]

    # Perceptual luminance + max-channel boost so colored stickers retain full detail
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    cmax = np.maximum(np.maximum(r, g), b)
    tone = np.clip(0.62 * luma + 0.38 * cmax, 0.0, 1.0)

    # Contrast curve for crisp holographic emblem readability
    tone = np.clip((tone - 0.05) / 0.88, 0.0, 1.0)
    tone_gamma = np.power(tone, 0.84)

    # 3-stop amber-orange gradient map (in RGB):
    # 0.00 -> Deep burnt amber-brown (#381805)
    # 0.52 -> Vibrant amber-orange (#F59E0B)
    # 1.00 -> Warm gold-ivory highlight (#FFFBEB)
    c0_bgr = np.array([0x05, 0x18, 0x38], dtype=np.float32) / 255.0
    c1_bgr = np.array([0x0B, 0x9E, 0xF5], dtype=np.float32) / 255.0
    c2_bgr = np.array([0xEB, 0xFB, 0xFF], dtype=np.float32) / 255.0

    mid_point = 0.52
    low_mask = (tone_gamma <= mid_point)[..., None]
    t_low = np.clip(tone_gamma / mid_point, 0.0, 1.0)[..., None]
    t_high = np.clip((tone_gamma - mid_point) / (1.0 - mid_point), 0.0, 1.0)[..., None]

    fg_bgr = np.where(
        low_mask,
        c0_bgr + (c1_bgr - c0_bgr) * t_low,
        c1_bgr + (c2_bgr - c1_bgr) * t_high,
    )

    # Pre-bake a soft amber glow behind the alpha silhouette
    glow_alpha = cv2.GaussianBlur(alpha, (0, 0), sigmaX=3.2, sigmaY=3.2) * 0.58
    glow_bgr = np.array([0x0B, 0x9E, 0xF5], dtype=np.float32) / 255.0  # #F59E0B in BGR

    # Alpha-over composite: fg over glow
    out_alpha = alpha + glow_alpha * (1.0 - alpha)
    safe_alpha = np.maximum(out_alpha, 1e-6)
    out_bgr = (
        fg_bgr * alpha[..., None] + glow_bgr * (glow_alpha * (1.0 - alpha))[..., None]
    ) / safe_alpha[..., None]

    out_bgra = np.zeros_like(bgra)
    out_bgra[..., :3] = np.clip(out_bgr, 0.0, 1.0)
    out_bgra[..., 3] = np.clip(out_alpha, 0.0, 1.0)
    # Guarantee outer 2px border & all 4 corners have exact alpha == 0
    out_bgra[:2, :, 3] = 0.0
    out_bgra[-2:, :, 3] = 0.0
    out_bgra[:, :2, 3] = 0.0
    out_bgra[:, -2:, 3] = 0.0
    return (out_bgra * 255.0).round().astype(np.uint8)


def unmix_and_grade_white_jpeg_emblem(src_bgr_u8: np.ndarray, target_size: int = THUMB_MAX_SIZE) -> np.ndarray:
    """
    Continuously unmix an amber-on-white JPEG emblem into a halo-free,
    tightly-cropped BGRA uint8 thumbnail (target_size x target_size) graded
    in rich, high-contrast cyber-tactical amber-orange tones.
    """
    bgr = src_bgr_u8.astype(np.float32) / 255.0
    b = bgr[..., 0]
    g = bgr[..., 1]
    r = bgr[..., 2]

    # Ink density: distance from white (1, 1, 1) across B and G channels
    ink_raw = np.maximum(1.0 - b, 0.90 * (1.0 - g))
    d0, d1 = 0.04, 0.58
    t = np.clip((ink_raw - d0) / (d1 - d0), 0.0, 1.0)
    smooth_t = t * t * (3.0 - 2.0 * t)
    alpha = np.where(t <= 0.0, 0.0, np.power(smooth_t, 0.72))

    # Tight bounding-box crop around visible emblem ink (alpha > 0.08)
    ys, xs = np.where(alpha > 0.08)
    if ys.size > 0 and xs.size > 0:
        pad = 16
        h, w = bgr.shape[:2]
        y0 = max(0, int(ys.min()) - pad)
        y1 = min(h, int(ys.max()) + 1 + pad)
        x0 = max(0, int(xs.min()) - pad)
        x1 = min(w, int(xs.max()) + 1 + pad)
        bgr = bgr[y0:y1, x0:x1]
        alpha = alpha[y0:y1, x0:x1]
        ink_raw = ink_raw[y0:y1, x0:x1]

    # Downsample cropped ink_raw and alpha into target_size x target_size with 10px margin
    ch, cw = alpha.shape[:2]
    inner_max = target_size - 20
    scale = min(inner_max / cw, inner_max / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))

    ink_resized = cv2.resize(ink_raw, (new_w, new_h), interpolation=cv2.INTER_AREA)
    alpha_resized = cv2.resize(alpha, (new_w, new_h), interpolation=cv2.INTER_AREA)

    ink_canvas = np.zeros((target_size, target_size), dtype=np.float32)
    alpha_canvas = np.zeros((target_size, target_size), dtype=np.float32)
    ox = (target_size - new_w) // 2
    oy = (target_size - new_h) // 2
    ink_canvas[oy : oy + new_h, ox : ox + new_w] = ink_resized
    alpha_canvas[oy : oy + new_h, ox : ox + new_w] = alpha_resized

    # Boost fine circuit lines after area downsampling so thin traces stay crisp
    alpha_fg = np.clip(np.power(np.clip(alpha_canvas * 1.22, 0.0, 1.0), 0.78), 0.0, 1.0)
    alpha_fg = np.where(alpha_canvas < 0.02, 0.0, alpha_fg)

    # Map ink density to rich amber-orange holographic tones:
    # Low ink (outer edge / fine circuit) -> Deep burnt orange-amber (#D97706)
    # Mid ink (primary stroke body)       -> Vibrant molten amber (#F59E0B -> #FFB02E)
    # High ink (core structural line)     -> Deep bronze-amber rim (#9A3412) + warm gold core (#FDE68A)
    norm_ink = np.clip((ink_canvas - 0.04) / 0.72, 0.0, 1.0)

    c_low_bgr = np.array([0x06, 0x77, 0xD9], dtype=np.float32) / 255.0   # #D97706
    c_mid_bgr = np.array([0x0B, 0x9E, 0xF5], dtype=np.float32) / 255.0   # #F59E0B
    c_high_bgr = np.array([0x4D, 0xD3, 0xFC], dtype=np.float32) / 255.0  # #FCD34D

    mid_pt = 0.50
    low_m = (norm_ink <= mid_pt)[..., None]
    t_l = np.clip(norm_ink / mid_pt, 0.0, 1.0)[..., None]
    t_h = np.clip((norm_ink - mid_pt) / (1.0 - mid_pt), 0.0, 1.0)[..., None]

    fg_bgr = np.where(
        low_m,
        c_low_bgr + (c_mid_bgr - c_low_bgr) * t_l,
        c_mid_bgr + (c_high_bgr - c_mid_bgr) * t_h,
    )

    # Add a soft deep-amber outer halo behind the alpha silhouette for contrast on dark glass
    glow_alpha = cv2.GaussianBlur(alpha_fg, (0, 0), sigmaX=3.0, sigmaY=3.0) * 0.55
    glow_bgr = np.array([0x06, 0x65, 0xC2], dtype=np.float32) / 255.0  # #C26506 rich dark amber

    out_alpha = alpha_fg + glow_alpha * (1.0 - alpha_fg)
    safe_alpha = np.maximum(out_alpha, 1e-6)
    out_bgr = (
        fg_bgr * alpha_fg[..., None] + glow_bgr * (glow_alpha * (1.0 - alpha_fg))[..., None]
    ) / safe_alpha[..., None]

    out_bgra = np.zeros((target_size, target_size, 4), dtype=np.float32)
    out_bgra[..., :3] = np.clip(out_bgr, 0.0, 1.0)
    out_bgra[..., 3] = np.clip(out_alpha, 0.0, 1.0)
    # Guarantee outer 2px border & all 4 corners have exact alpha == 0
    out_bgra[:2, :, 3] = 0.0
    out_bgra[-2:, :, 3] = 0.0
    out_bgra[:, :2, 3] = 0.0
    out_bgra[:, -2:, 3] = 0.0
    return (out_bgra * 255.0).round().astype(np.uint8)


def build_primary_emblem_thumbnails() -> None:
    out_dir = REPO_ROOT / "stickers_build" / "main_menu"
    out_dir.mkdir(parents=True, exist_ok=True)

    for key, filename in PRIMARY_EMBLEM_SOURCES:
        src_path = REPO_ROOT / "anim" / filename
        dst_path = out_dir / f"{key}_thumb_amber.png"

        src_bgr = cv2.imread(str(src_path), cv2.IMREAD_COLOR)
        if src_bgr is None:
            raise RuntimeError(f"Failed to read {src_path}")

        graded = unmix_and_grade_white_jpeg_emblem(src_bgr, THUMB_MAX_SIZE)
        cv2.imwrite(str(dst_path), graded, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        print(
            f"Built {dst_path.relative_to(REPO_ROOT)}: {THUMB_MAX_SIZE}x{THUMB_MAX_SIZE} "
            f"({dst_path.stat().st_size / 1024:.1f} KB, down from {src_path.stat().st_size / 1024:.1f} KB)"
        )


def build_slice_thumbnails() -> None:
    for sticker_id in SLICE_SOURCES:
        src_path = REPO_ROOT / "stickers_build" / sticker_id / "base_color.png"
        dst_path = REPO_ROOT / "stickers_build" / sticker_id / "radial_thumb_amber.png"

        src_bgra = cv2.imread(str(src_path), cv2.IMREAD_UNCHANGED)
        if src_bgra is None:
            raise RuntimeError(f"Failed to read {src_path}")
        if src_bgra.ndim == 2:
            src_bgra = cv2.cvtColor(src_bgra, cv2.COLOR_GRAY2BGRA)
        elif src_bgra.shape[2] == 3:
            src_bgra = cv2.cvtColor(src_bgra, cv2.COLOR_BGR2BGRA)

        h, w = src_bgra.shape[:2]
        inner_max = THUMB_MAX_SIZE - 8
        scale = min(inner_max / w, inner_max / h)
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))

        resized = cv2.resize(src_bgra, (new_w, new_h), interpolation=cv2.INTER_AREA)
        canvas = np.zeros((THUMB_MAX_SIZE, THUMB_MAX_SIZE, 4), dtype=np.uint8)
        ox = (THUMB_MAX_SIZE - new_w) // 2
        oy = (THUMB_MAX_SIZE - new_h) // 2
        canvas[oy : oy + new_h, ox : ox + new_w] = resized

        graded = grade_bgra_to_amber_holo(canvas)
        cv2.imwrite(str(dst_path), graded, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        print(
            f"Built {dst_path.relative_to(REPO_ROOT)}: {THUMB_MAX_SIZE}x{THUMB_MAX_SIZE} "
            f"({dst_path.stat().st_size / 1024:.1f} KB, down from {src_path.stat().st_size / 1024:.1f} KB)"
        )


def build_hub_emblem_thumbnail() -> None:
    src_path = REPO_ROOT / "anim" / "techno_platodoom_Tag.jpeg"
    dst_path = REPO_ROOT / "stickers_build" / "plato_doom_hub_amber.png"
    target_w, target_h = 280, 96

    src_bgr = cv2.imread(str(src_path), cv2.IMREAD_COLOR)
    if src_bgr is None:
        raise RuntimeError(f"Failed to read {src_path}")

    bgr = src_bgr.astype(np.float32) / 255.0
    b = bgr[..., 0]
    g = bgr[..., 1]

    # Measure ink density to tight-crop asymmetric source margins (left=387px vs right=174px)
    ink_raw = np.maximum(1.0 - b, 0.90 * (1.0 - g))
    ys, xs = np.where(ink_raw > 0.06)
    if ys.size > 0 and xs.size > 0:
        pad = 12
        h, w = bgr.shape[:2]
        y0 = max(0, int(ys.min()) - pad)
        y1 = min(h, int(ys.max()) + 1 + pad)
        x0 = max(0, int(xs.min()) - pad)
        x1 = min(w, int(xs.max()) + 1 + pad)
        bgr = bgr[y0:y1, x0:x1]

    ch, cw = bgr.shape[:2]
    pad_x, pad_y = 8, 6
    inner_w = target_w - 2 * pad_x
    inner_h = target_h - 2 * pad_y
    scale = min(inner_w / cw, inner_h / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))

    resized = cv2.resize(bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    rb = resized[..., 0]
    rg = resized[..., 1]

    # Replicate #cyber-amber-emblem-filter feColorMatrix at build time:
    # R' = 1.00
    # G' = 0.35*G + 0.45
    # B' = 0.10*B + 0.08
    # A' = clamp(-1.08*B + 1.04, 0, 1)
    cropped_bgra = np.zeros((new_h, new_w, 4), dtype=np.float32)
    cropped_bgra[..., 0] = np.clip(0.10 * rb + 0.08, 0.0, 1.0)
    cropped_bgra[..., 1] = np.clip(0.35 * rg + 0.45, 0.0, 1.0)
    cropped_bgra[..., 2] = 1.00
    alpha = np.clip(-1.08 * rb + 1.04, 0.0, 1.0)
    alpha = np.where(alpha < 0.03, 0.0, alpha)
    cropped_bgra[..., 3] = alpha

    # Symmetrically center inside target_w x target_h canvas
    out_bgra = np.zeros((target_h, target_w, 4), dtype=np.float32)
    ox = (target_w - new_w) // 2
    oy = (target_h - new_h) // 2
    out_bgra[oy : oy + new_h, ox : ox + new_w] = cropped_bgra

    # Guarantee outer 2px border & all 4 corners have exact alpha == 0
    out_bgra[:2, :, 3] = 0.0
    out_bgra[-2:, :, 3] = 0.0
    out_bgra[:, :2, 3] = 0.0
    out_bgra[:, -2:, 3] = 0.0

    out_u8 = (out_bgra * 255.0).round().astype(np.uint8)
    cv2.imwrite(str(dst_path), out_u8, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(
        f"Built {dst_path.relative_to(REPO_ROOT)}: {target_w}x{target_h} "
        f"({dst_path.stat().st_size / 1024:.1f} KB, down from {src_path.stat().st_size / 1024:.1f} KB)"
    )


if __name__ == "__main__":
    build_primary_emblem_thumbnails()
    build_slice_thumbnails()
    build_hub_emblem_thumbnail()
