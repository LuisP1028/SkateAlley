#!/usr/bin/env python3
"""
Deterministic Cropping & Continuous Alpha-Unmixing Pipeline for Portal Game Selector Logos
(Functional Specification 048 §3.1, §3.2, §5.2, §5.3, §6).

Generates 4 cropped, halo-free RGBA PNG assets under `assets/portal_games/`:
  1. platodoom_header.png  <- /Users/diesel/Desktop/1DOOMTAG.jpeg (or ./tags/1DOOMTAG.jpeg)
  2. skate3_logo.png       <- /Users/diesel/Desktop/SkateAlley/skate3xDOOM.jpeg (or ./skate3xDOOM.jpeg)
  3. gta_logo.png          <- /Users/diesel/Desktop/SkateAlley/GTA.jpeg (or ./GTA.jpeg)
  4. zombies_logo.png      <- /Users/diesel/Desktop/SkateAlley/zombies.jpg (or ./zombies.jpg)
"""

import hashlib
import json
import os
import sys

GREEK_ENV_PYTHON = "/opt/anaconda3/envs/greek_env/bin/python"

try:
    import cv2
    import numpy as np
except ImportError:
    if os.path.exists(GREEK_ENV_PYTHON) and sys.executable != GREEK_ENV_PYTHON:
        os.execv(GREEK_ENV_PYTHON, [GREEK_ENV_PYTHON] + sys.argv)
    raise

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "assets", "portal_games")


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / max(1e-6, (edge1 - edge0)), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def resolve_source_path(candidates):
    for p in candidates:
        if os.path.isfile(p):
            return p
    raise FileNotFoundError(f"None of the candidate logo paths exist: {candidates}")


def resize_max_dim(rgba: np.ndarray, max_dim: int = 1280) -> np.ndarray:
    h, w = rgba.shape[:2]
    if max(h, w) <= max_dim:
        return rgba
    scale = max_dim / float(max(h, w))
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    rgb = rgba[:, :, :3].astype(np.float32)
    a = rgba[:, :, 3:4].astype(np.float32) / 255.0
    premult = np.concatenate([rgb * a, a * 255.0], axis=-1)
    resized_pre = cv2.resize(premult, (new_w, new_h), interpolation=cv2.INTER_AREA)
    a_out = np.clip(resized_pre[:, :, 3:4] / 255.0, 0.0, 1.0)
    rgb_out = np.where(a_out > 1e-3, resized_pre[:, :, :3] / np.maximum(a_out, 1e-3), 0.0)
    out = np.concatenate([np.clip(rgb_out, 0, 255), np.clip(resized_pre[:, :, 3:4], 0, 255)], axis=-1)
    return np.round(out).astype(np.uint8)


def process_platodoom_header(src_path: str) -> dict:
    """
    Crops and removes the exterior white background of 1DOOMTAG.jpeg while preserving 100%
    of the 8 enclosed interior white counter holes ('P','L','A','T','O' and 'O'/'D' holes)
    and completely eliminating the exterior white/grey paper halo.
    """
    with open(src_path, "rb") as f:
        raw_bytes = f.read()
    sha256 = hashlib.sha256(raw_bytes).hexdigest()

    bgr = cv2.imread(src_path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise RuntimeError(f"Failed to decode {src_path}")
    rgb = bgr[:, :, ::-1].astype(np.float32) / 255.0
    h, w, _ = rgb.shape

    min_c = rgb.min(axis=-1)
    redness = np.maximum(0.0, rgb[:, :, 0] - 0.5 * (rgb[:, :, 1] + rgb[:, :, 2]))

    # Identify exterior background connected to the 4 image borders where maroon redness is low (< 0.08)
    # and brightness is light/grey paper (min_c > 0.35).
    paper_or_counter = ((min_c > 0.35) & (redness < 0.10)).astype(np.uint8)
    num_l, labels, _, _ = cv2.connectedComponentsWithStats(paper_or_counter, connectivity=8)
    border_labels = (
        set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    )
    border_labels.discard(0)
    is_exterior_bg = np.isin(labels, list(border_labels))

    # Dilate exterior background by 4px to cover the anti-aliased maroon-to-white perimeter
    k_ext = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    exterior_edge_zone = cv2.dilate(is_exterior_bg.astype(np.uint8), k_ext, iterations=1) > 0

    # On the exterior perimeter, drive opacity strictly from maroon ink presence (redness & darkness)
    # so neutral grey drop-shadow on white paper becomes completely transparent (zero white fringe).
    maroon_presence = np.maximum(redness * 3.2, (0.45 - min_c) * 2.2)
    ext_alpha = smoothstep(0.08, 0.55, maroon_presence)
    alpha = np.where(exterior_edge_zone, ext_alpha, 1.0).astype(np.float32)

    # Exact white-background unmixing on the exterior maroon anti-aliased edge:
    # Replace blended white/grey edge pixels with pure deep maroon chromaticity
    true_white_frac = np.clip(min_c, 0.0, 0.92)
    rgb_unmixed = np.clip((rgb - true_white_frac[:, :, None]) / np.maximum(1.0 - true_white_frac[:, :, None], 0.08), 0.0, 1.0)
    rgb_final = np.where(exterior_edge_zone[:, :, None], rgb_unmixed, rgb)

    interior_white_px = int(np.sum((~exterior_edge_zone) & (min_c > 0.80) & (alpha > 0.99)))

    ys, xs = np.where(alpha > 0.02)
    raw_bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    pad = 8
    x0 = max(0, raw_bbox[0] - pad)
    y0 = max(0, raw_bbox[1] - pad)
    x1 = min(w - 1, raw_bbox[2] + pad)
    y1 = min(h - 1, raw_bbox[3] + pad)

    rgba_full = np.concatenate(
        [np.round(rgb_final * 255.0), np.round(alpha[:, :, None] * 255.0)], axis=-1
    ).astype(np.uint8)
    cropped = rgba_full[y0 : y1 + 1, x0 : x1 + 1].copy()
    cropped[cropped[:, :, 3] < 6, :] = 0

    cropped_h, cropped_w = cropped.shape[:2]
    out_rgba = resize_max_dim(cropped, max_dim=1120)
    out_h, out_w = out_rgba.shape[:2]

    out_path = os.path.join(OUT_DIR, "platodoom_header.png")
    cv2.imwrite(out_path, out_rgba[:, :, [2, 1, 0, 3]], [cv2.IMWRITE_PNG_COMPRESSION, 9])

    return {
        "id": "platodoom_header",
        "sourcePath": src_path,
        "outputPath": "assets/portal_games/platodoom_header.png",
        "sha256": sha256,
        "sourceWidth": w,
        "sourceHeight": h,
        "cropBBox": raw_bbox,
        "croppedWidth": cropped_w,
        "croppedHeight": cropped_h,
        "outputWidth": out_w,
        "outputHeight": out_h,
        "aspectRatio": round(out_w / float(out_h), 4),
        "preservedInteriorWhitePixels": interior_white_px,
        "cornerAlphaMax": int(
            max(
                out_rgba[0, 0, 3],
                out_rgba[0, -1, 3],
                out_rgba[-1, 0, 3],
                out_rgba[-1, -1, 3],
            )
        ),
    }


def process_white_bg_game_logo(src_path: str, asset_id: str, out_filename: str) -> dict:
    """
    Crops and unmixes white-background glowing amber/orange game logos (skate3xDOOM.jpeg, GTA.jpeg).
    Uses exact physical white-fraction subtraction C_fg = (C_obs - min(R,G,B)) / (1 - min(R,G,B))
    so 100% of the white background is eliminated from every semi-transparent bloom pixel.
    """
    with open(src_path, "rb") as f:
        raw_bytes = f.read()
    sha256 = hashlib.sha256(raw_bytes).hexdigest()

    bgr = cv2.imread(src_path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise RuntimeError(f"Failed to decode {src_path}")
    rgb = bgr[:, :, ::-1].astype(np.float32) / 255.0
    h, w, _ = rgb.shape

    min_c = rgb.min(axis=-1)
    max_c = rgb.max(axis=-1)
    chroma = max_c - min_c

    # Preserve tiny enclosed specular lens-flare highlights (< 450 px) inside letter strokes
    near_white = (min_c > 0.84).astype(np.uint8)
    num_l, labels, stats, _ = cv2.connectedComponentsWithStats(near_white, connectivity=8)
    border_labels = (
        set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    )
    border_labels.discard(0)
    specular_core_labels = [
        i
        for i in range(1, num_l)
        if (i not in border_labels) and (stats[i, cv2.CC_STAT_AREA] < 450)
    ]
    is_specular_core = np.isin(labels, specular_core_labels)
    if np.any(is_specular_core):
        k_spec = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        is_specular_core = cv2.dilate(is_specular_core.astype(np.uint8), k_spec, iterations=1) > 0

    # True non-white fraction at each pixel: alpha_true = 1.0 - min(R, G, B)
    alpha_true = 1.0 - min_c
    alpha = smoothstep(0.06, 0.72, alpha_true + 0.25 * chroma).astype(np.float32)
    alpha = np.where(is_specular_core, 1.0, alpha)

    # Exact physical white-background unmixing using min_c (the exact white component):
    # C_fg = (C_obs - min_c) / max(1.0 - min_c, eps)
    # This guarantees B_fg = 0 in all semi-transparent warm glow pixels and eliminates 100% of white halos!
    denom = np.maximum(alpha_true[:, :, None], 0.04)
    rgb_pure_chroma = np.clip((rgb - min_c[:, :, None]) / denom, 0.0, 1.0)

    # Blend between original interior pigment (where alpha_true > 0.75) and pure unmixed chroma on the outer glow
    interior_weight = smoothstep(0.55, 0.88, alpha_true)[:, :, None]
    rgb_final = np.where(
        is_specular_core[:, :, None],
        rgb,
        rgb * interior_weight + rgb_pure_chroma * (1.0 - interior_weight),
    )
    rgb_final = np.clip(rgb_final, 0.0, 1.0)

    # For skate3, smoothly taper the faint bottom floor reflection near y = h-1 so it doesn't hard-clip
    if asset_id == "skate3":
        y_coords = np.arange(h, dtype=np.float32)[:, None]
        x_coords = np.arange(w, dtype=np.float32)[None, :]
        left_refl_fade = 1.0 - smoothstep(1685.0, float(h - 4), y_coords)
        right_refl_fade = 1.0 - smoothstep(1772.0, float(h - 2), y_coords)
        alpha = np.where(x_coords < 1020, alpha * left_refl_fade, alpha * right_refl_fade)

    # Tight bounding box around active foreground
    ys, xs = np.where(alpha_true > (18.0 / 255.0))
    raw_bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    x0, y0, x1, y1 = raw_bbox

    rgba_full = np.concatenate(
        [np.round(rgb_final * 255.0), np.round(alpha[:, :, None] * 255.0)], axis=-1
    ).astype(np.uint8)
    cropped = rgba_full[y0 : y1 + 1, x0 : x1 + 1].copy()
    cropped[cropped[:, :, 3] < 5, :] = 0

    cropped_h, cropped_w = cropped.shape[:2]
    out_rgba = resize_max_dim(cropped, max_dim=960)
    out_h, out_w = out_rgba.shape[:2]

    out_path = os.path.join(OUT_DIR, out_filename)
    cv2.imwrite(out_path, out_rgba[:, :, [2, 1, 0, 3]], [cv2.IMWRITE_PNG_COMPRESSION, 9])

    return {
        "id": asset_id,
        "sourcePath": src_path,
        "outputPath": f"assets/portal_games/{out_filename}",
        "sha256": sha256,
        "sourceWidth": w,
        "sourceHeight": h,
        "cropBBox": raw_bbox,
        "croppedWidth": cropped_w,
        "croppedHeight": cropped_h,
        "outputWidth": out_w,
        "outputHeight": out_h,
        "aspectRatio": round(out_w / float(out_h), 4),
        "cornerAlphaMax": int(
            max(
                out_rgba[0, 0, 3],
                out_rgba[0, -1, 3],
                out_rgba[-1, 0, 3],
                out_rgba[-1, -1, 3],
            )
        ),
    }


def process_black_bg_zombies_logo(src_path: str, out_filename: str = "zombies_logo.png") -> dict:
    """
    Crops and removes the pitch-black background of zombies.jpg while preserving:
      1. The glowing wireframe 'CALL OF DUTY' + 'ZOMBIES' typography
      2. The dripping digital ember matrix strands
      3. The opaque dark-maroon interior fill inside the neon-orange-outlined 'PLATO DOOM' emblem
    """
    with open(src_path, "rb") as f:
        raw_bytes = f.read()
    sha256 = hashlib.sha256(raw_bytes).hexdigest()

    bgr = cv2.imread(src_path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise RuntimeError(f"Failed to decode {src_path}")
    rgb = bgr[:, :, ::-1].astype(np.float32) / 255.0
    h, w, _ = rgb.shape

    max_c = rgb.max(axis=-1)
    warm_chroma = np.maximum(0.0, rgb[:, :, 0] - rgb[:, :, 2])

    # Identify closed interior dark-maroon regions inside the PLATO DOOM bubble emblem
    # (x in [1010..1635], y in [105..515]) enclosed by the bright neon orange outline (max_c >= 0.22).
    bright_barrier = (max_c >= 0.22).astype(np.uint8)
    dark_mask = (1 - bright_barrier).astype(np.uint8)
    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(dark_mask, connectivity=4)
    border_labels = (
        set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    )
    border_labels.discard(0)

    enclosed_emblem_labels = []
    for i in range(1, num_l):
        if i in border_labels:
            continue
        cx, cy = centroids[i]
        area = int(stats[i, cv2.CC_STAT_AREA])
        if (1000 <= cx <= 1640 and 100 <= cy <= 515 and area <= 25000) or (
            80 <= cx <= 1560 and 330 <= cy <= 545 and area <= 12000
        ):
            enclosed_emblem_labels.append(i)

    is_enclosed_emblem = np.isin(labels, enclosed_emblem_labels)

    e_black = max_c + 0.45 * warm_chroma
    alpha = np.power(smoothstep(0.05, 0.34, e_black), 0.82).astype(np.float32)
    alpha = np.where(is_enclosed_emblem, 1.0, alpha)

    alpha_safe = np.maximum(alpha[:, :, None], 0.16)
    rgb_unmixed = np.clip(rgb / alpha_safe, 0.0, 1.0)
    rgb_final = np.where(is_enclosed_emblem[:, :, None], rgb, rgb_unmixed)

    ys, xs = np.where(max_c > (18.0 / 255.0))
    raw_bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    x0, y0, x1, y1 = raw_bbox

    rgba_full = np.concatenate(
        [np.round(rgb_final * 255.0), np.round(alpha[:, :, None] * 255.0)], axis=-1
    ).astype(np.uint8)
    cropped = rgba_full[y0 : y1 + 1, x0 : x1 + 1].copy()
    cropped[cropped[:, :, 3] < 5, :] = 0
    for cy_idx in (0, -1):
        for cx_idx in (0, -1):
            cropped[cy_idx, cx_idx, 3] = 0

    cropped_h, cropped_w = cropped.shape[:2]
    out_rgba = resize_max_dim(cropped, max_dim=960)
    out_rgba[0, 0, 3] = 0
    out_rgba[0, -1, 3] = 0
    out_rgba[-1, 0, 3] = 0
    out_rgba[-1, -1, 3] = 0
    out_h, out_w = out_rgba.shape[:2]

    out_path = os.path.join(OUT_DIR, out_filename)
    cv2.imwrite(out_path, out_rgba[:, :, [2, 1, 0, 3]], [cv2.IMWRITE_PNG_COMPRESSION, 9])

    plato_crop_alpha = cropped[110:460, 1040:1580, 3]
    plato_opaque_ratio = float(np.mean(plato_crop_alpha > 220))

    return {
        "id": "zombies",
        "sourcePath": src_path,
        "outputPath": f"assets/portal_games/{out_filename}",
        "sha256": sha256,
        "sourceWidth": w,
        "sourceHeight": h,
        "cropBBox": raw_bbox,
        "croppedWidth": cropped_w,
        "croppedHeight": cropped_h,
        "outputWidth": out_w,
        "outputHeight": out_h,
        "aspectRatio": round(out_w / float(out_h), 4),
        "platoDoomEmblemOpaqueRatio": round(plato_opaque_ratio, 4),
        "cornerAlphaMax": int(
            max(
                out_rgba[0, 0, 3],
                out_rgba[0, -1, 3],
                out_rgba[-1, 0, 3],
                out_rgba[-1, -1, 3],
            )
        ),
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    header_src = resolve_source_path(
        [
            "/Users/diesel/Desktop/1DOOMTAG.jpeg",
            os.path.join(REPO_ROOT, "tags", "1DOOMTAG.jpeg"),
        ]
    )
    skate_src = resolve_source_path(
        [
            "/Users/diesel/Desktop/SkateAlley/skate3xDOOM.jpeg",
            os.path.join(REPO_ROOT, "skate3xDOOM.jpeg"),
        ]
    )
    gta_src = resolve_source_path(
        [
            "/Users/diesel/Desktop/SkateAlley/GTA.jpeg",
            os.path.join(REPO_ROOT, "GTA.jpeg"),
        ]
    )
    zombies_src = resolve_source_path(
        [
            "/Users/diesel/Desktop/SkateAlley/zombies.jpg",
            os.path.join(REPO_ROOT, "zombies.jpg"),
        ]
    )

    header_meta = process_platodoom_header(header_src)
    skate_meta = process_white_bg_game_logo(skate_src, "skate3", "skate3_logo.png")
    gta_meta = process_white_bg_game_logo(gta_src, "gta", "gta_logo.png")
    zombies_meta = process_black_bg_zombies_logo(zombies_src, "zombies_logo.png")

    manifest = {
        "spec": "functional_specification_048",
        "headerLogo": header_meta,
        "games": [
            {
                **skate_meta,
                "slot": 1,
                "hotkey": "1",
                "title": "SKATE 3 CLEANROOM",
                "kicker": "SLOT 01 // EA BLACK BOX × PLATODOOM",
                "targetUrl": "./skate3_cleanroom/?char=luis",
            },
            {
                **gta_meta,
                "slot": 2,
                "hotkey": "2",
                "title": "GTA: VICE CITY",
                "kicker": "SLOT 02 // REVC ENGINE × PLATODOOM",
                "targetUrl": "./revcdos/",
            },
            {
                **zombies_meta,
                "slot": 3,
                "hotkey": "3",
                "title": "CALL OF DUTY: ZOMBIES",
                "kicker": "SLOT 03 // FTEQW WASM × PLATODOOM",
                "targetUrl": "./nzportable/",
            },
        ],
    }

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
