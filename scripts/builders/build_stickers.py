#!/usr/bin/env python3
"""
Holographic Die-Cut Sticker Pipeline: Stage 1 Offline Pre-Processing & Die-Cut Generation
Authoritative Specification: anim/stickers.md
Governing Tickets: ticket-001.md, ticket-002.md, ticket-003.md, ticket-006.md
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from typing import Any

import cv2
import numpy as np
import scipy.ndimage
from PIL import Image

DEFAULT_MANIFEST_PATH = "assets/20261020T004604-878-nmhc/plan-stickers-asset-manifest.json"


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    """Standard Hermite smoothstep interpolation."""
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def sd_rounded_box(w: int, h: int, box_w: float, box_h: float, r: float) -> np.ndarray:
    """Exact 2D Signed Distance Function for a centered box with rounded corners."""
    y_coords = np.arange(h, dtype=np.float32) - (h - 1) / 2.0
    x_coords = np.arange(w, dtype=np.float32) - (w - 1) / 2.0
    xx, yy = np.meshgrid(x_coords, y_coords)

    bx = box_w / 2.0 - r
    by = box_h / 2.0 - r

    dx = np.abs(xx) - bx
    dy = np.abs(yy) - by

    qx = np.maximum(dx, 0.0)
    qy = np.maximum(dy, 0.0)

    dist_outside = np.sqrt(qx * qx + qy * qy)
    dist_inside = np.minimum(np.maximum(dx, dy), 0.0)

    return dist_outside + dist_inside - r


def load_sticker_source_catalog(manifest_seed_path: str | None = None) -> list[dict[str, Any]]:
    """
    Loads and validates the 6 canonical sticker specifications from the plan manifest.
    Verifies disk existence, SHA-256 digest, and dimensions.
    Raises FileNotFoundError or ValueError immediately upon any mismatch (INV-FAILFAST-01).
    """
    path = manifest_seed_path or DEFAULT_MANIFEST_PATH
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Sticker asset manifest missing at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assets = data.get("assets", [])
    if len(assets) != 6:
        raise ValueError(f"Expected exactly 6 sticker assets in manifest, got {len(assets)}")

    for asset in assets:
        repo_path = asset.get("repoPath")
        if not repo_path or not os.path.isfile(repo_path):
            raise FileNotFoundError(f"Source image missing on disk: {repo_path}")

        with open(repo_path, "rb") as f_img:
            file_bytes = f_img.read()

        file_sha256 = hashlib.sha256(file_bytes).hexdigest()
        expected_sha256 = asset.get("sha256")
        if expected_sha256 and file_sha256 != expected_sha256:
            raise ValueError(
                f"SHA-256 mismatch for {repo_path}: got {file_sha256}, expected {expected_sha256}"
            )

        img = cv2.imread(repo_path)
        if img is None:
            raise ValueError(f"Failed to read image via OpenCV: {repo_path}")

        h, w = img.shape[:2]
        if w != asset.get("sourceWidth") or h != asset.get("sourceHeight"):
            raise ValueError(
                f"Dimension mismatch for {repo_path}: got ({w}x{h}), expected ({asset.get('sourceWidth')}x{asset.get('sourceHeight')})"
            )

    return assets


STICKER_SOURCE_CATALOG: list[dict[str, Any]] = (
    load_sticker_source_catalog() if os.path.isfile(DEFAULT_MANIFEST_PATH) else []
)


def isolate_subject_alpha(img_bgr: np.ndarray, asset_spec: dict[str, Any]) -> dict[str, Any]:
    """
    Executes contiguous exterior background isolation (§2.2).
    - Group B (eye_tag): Bypasses cutout pre-processing entirely, keeping 100% of subject pixels.
    - Group A: Computes grayscale and chroma, identifies background candidate pixels, labels 8-connected
      components, isolates exterior border-seeded background plus configured interior pocket rules, and preserves
      100% of interior white/specular details.
    """
    h, w = img_bgr.shape[:2]
    mode = asset_spec.get("preProcessingMode", "group_a_cutout")

    if mode == "group_b_full_frame":
        fg_mask = np.ones((h, w), dtype=np.uint8)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        white_count = int(np.sum(gray >= 220))
        return {
            "fg_mask": fg_mask,
            "interior_white_count": white_count,
            "bypassed": True,
        }

    # Group A: White-Background Cutout
    cfg = asset_spec.get("stage1Config", {})
    luma_threshold = cfg.get("lumaThreshold", 240)
    chroma_max = cfg.get("chromaMax", 18)
    min_fg_area = cfg.get("minForegroundAreaPx", 500)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    chroma = (np.max(img_bgr, axis=2).astype(np.int16) - np.min(img_bgr, axis=2).astype(np.int16)).astype(np.uint8)

    bg_cand = ((gray >= luma_threshold) & (chroma <= chroma_max)).astype(np.uint8)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(bg_cand, connectivity=8)

    # Exterior border labels (touching any of the 4 outer image borders, excluding 0)
    border_pixels = np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
    border_labels = set(np.unique(border_pixels)) - {0}

    # Interior pocket rule handling
    rule = cfg.get("interiorPocketRule", "none")
    if rule == "stem_petiole_pockets_x1250_1600_y250_900":
        for lbl in range(1, num_labels):
            if lbl not in border_labels:
                cx, cy = centroids[lbl]
                area = stats[lbl, cv2.CC_STAT_AREA]
                if 1250 <= cx <= 1600 and 250 <= cy <= 900 and 5000 <= area <= 20000:
                    border_labels.add(lbl)
    elif rule == "left_finger_gap_x0_250_y600_700":
        for lbl in range(1, num_labels):
            if lbl not in border_labels:
                cx, cy = centroids[lbl]
                area = stats[lbl, cv2.CC_STAT_AREA]
                if 150 <= cx <= 230 and 640 <= cy <= 680 and 500 <= area <= 1500:
                    border_labels.add(lbl)

    is_bg = np.isin(labels, list(border_labels))
    fg_raw = (~is_bg).astype(np.uint8)

    # Filter out dust specks
    num_fg, fg_labels, fg_stats, _ = cv2.connectedComponentsWithStats(fg_raw, connectivity=8)
    keep_fg = [lbl for lbl in range(1, num_fg) if fg_stats[lbl, cv2.CC_STAT_AREA] >= min_fg_area]
    fg_mask = np.isin(fg_labels, keep_fg).astype(np.uint8)

    interior_white_count = int(np.sum((fg_mask == 1) & (gray >= 230)))

    return {
        "fg_mask": fg_mask,
        "interior_white_count": interior_white_count,
        "bypassed": False,
    }


def dehalo_and_antialias_subject(
    img_bgr: np.ndarray, fg_mask: np.ndarray, asset_spec: dict[str, Any]
) -> tuple[np.ndarray, np.ndarray]:
    """
    Neutralizes perimeter halo/compression fringes (§2.3) and computes sub-pixel anti-aliased subject alpha.
    - Group B: Returns direct copy of image and 1.0 alpha (inner rounding handled in geometry).
    - Group A: 2px erosion to find fg_core, nearest-neighbor color propagation via EDT to clean halo band,
      and smooth Gaussian anti-aliasing on signed distance field.
    """
    mode = asset_spec.get("preProcessingMode", "group_a_cutout")
    cfg = asset_spec.get("stage1Config", {})
    if mode == "group_b_full_frame":
        h_src, w_src = img_bgr.shape[:2]
        r_inner = float(cfg.get("cornerRadiusPx", 48))
        sdf_inner = sd_rounded_box(w_src, h_src, float(w_src), float(h_src), r_inner)
        rounded_inner_rect_alpha = np.clip(0.5 - sdf_inner / 1.25, 0.0, 1.0).astype(np.float32)
        return img_bgr.copy(), rounded_inner_rect_alpha

    erode_px = cfg.get("dehaloErodePx", 2)
    sigma = cfg.get("silhouetteGaussianSigma", 1.15)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    fg_core = cv2.erode(fg_mask, kernel, iterations=erode_px)

    halo_band = (cv2.dilate(fg_mask, kernel, iterations=erode_px) - fg_core) > 0

    # Nearest clean interior foreground color propagation via EDT
    _, indices = scipy.ndimage.distance_transform_edt(1 - fg_core, return_indices=True)
    dehaloed_bgr = img_bgr.copy()
    dehaloed_bgr[halo_band] = img_bgr[indices[0][halo_band], indices[1][halo_band]]

    # Sub-pixel anti-aliased subject alpha
    dist_in = scipy.ndimage.distance_transform_edt(fg_mask)
    dist_out = scipy.ndimage.distance_transform_edt(1 - fg_mask)
    sdf_subject = dist_in - dist_out

    subject_alpha = np.clip(
        scipy.ndimage.gaussian_filter((sdf_subject > -0.25).astype(np.float32), sigma),
        0.0,
        1.0,
    )
    subject_alpha[fg_core == 1] = 1.0

    return dehaloed_bgr, subject_alpha


def generate_die_cut_border_and_tri_zones(
    subject_alpha: np.ndarray,
    fg_mask: np.ndarray,
    img_bgr_or_asset_spec: np.ndarray | dict[str, Any],
    asset_spec: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Generates die-cut border contour, bridges gaps (§2.4), and classifies Tri-Zone regions.
    Supports both 3-arg (subject_alpha, fg_mask, asset_spec) and 4-arg (subject_alpha, fg_mask, img_bgr, asset_spec).
    - Group A: Morphological closing with ellipse structuring element, fills interior holes to achieve
      single cohesive sticker island (connectedStickerIslands == 1), and computes outer EDT contour.
    - Group B: Pads canvas and computes 2D rounded-box Signed Distance Function for inner subject and outer border.
    """
    if isinstance(img_bgr_or_asset_spec, dict) and asset_spec is None:
        asset_spec = img_bgr_or_asset_spec
        img_bgr: np.ndarray | None = None
    else:
        img_bgr = img_bgr_or_asset_spec if isinstance(img_bgr_or_asset_spec, np.ndarray) else None
        if asset_spec is None:
            raise ValueError("generate_die_cut_border_and_tri_zones: asset_spec is required (INV-FAILFAST-01).")

    mode = asset_spec.get("preProcessingMode", "group_a_cutout")
    cfg = asset_spec.get("stage1Config", {})

    if mode == "group_b_full_frame":
        h_src, w_src = subject_alpha.shape[:2]
        r_inner = cfg.get("cornerRadiusPx", 48)
        r_border = cfg.get("dieCutBorderRadiusPx", 36)
        r_outer = cfg.get("outerCornerRadiusPx", 84)
        margin_px = cfg.get("edgeSafetyMarginPx", 3)
        total_pad = r_border + margin_px

        w_out = w_src + 2 * total_pad
        h_out = h_src + 2 * total_pad

        # Inner rounded box for subject interior
        sdf_inner = sd_rounded_box(w_out, h_out, float(w_src), float(h_src), float(r_inner))
        subj_alpha = np.clip(0.5 - sdf_inner / 1.25, 0.0, 1.0)

        # Outer rounded box for master silhouette
        outer_w = float(w_src + 2 * r_border)
        outer_h = float(h_src + 2 * r_border)
        sdf_outer = sd_rounded_box(w_out, h_out, outer_w, outer_h, float(r_outer))
        mst_alpha = np.clip(0.5 - sdf_outer / 1.25, 0.0, 1.0)

        # Enforce exact transparent UV safety margin on outer 3 pixels
        mst_alpha[:margin_px, :] = 0.0
        mst_alpha[-margin_px:, :] = 0.0
        mst_alpha[:, :margin_px] = 0.0
        mst_alpha[:, -margin_px:] = 0.0

        subj_alpha[:margin_px, :] = 0.0
        subj_alpha[-margin_px:, :] = 0.0
        subj_alpha[:, :margin_px] = 0.0
        subj_alpha[:, -margin_px:] = 0.0

        bdr_mask = np.clip(mst_alpha - subj_alpha, 0.0, 1.0)

        # Pad BGR image to output size if provided
        padded_bgr = np.zeros((h_out, w_out, 3), dtype=np.uint8)
        if img_bgr is not None:
            padded_bgr[total_pad : total_pad + h_src, total_pad : total_pad + w_src] = img_bgr

        # Tri-zone code: 0 = Void, 128 = Border, 255 = Subject
        tri_zone = np.zeros((h_out, w_out), dtype=np.uint8)
        tri_zone[(bdr_mask >= subj_alpha) & (mst_alpha >= 0.05)] = 128
        tri_zone[(subj_alpha > bdr_mask) & (mst_alpha >= 0.05)] = 255

        num_labels, _, _, _ = cv2.connectedComponentsWithStats((mst_alpha > 0.05).astype(np.uint8), connectivity=8)
        fg_islands = max(1, num_labels - 1)

        return {
            "master_alpha": mst_alpha,
            "subject_alpha": subj_alpha,
            "border_mask": bdr_mask,
            "tri_zone_code": tri_zone,
            "dehaloed_bgr": padded_bgr,
            "connected_islands": fg_islands,
            "connectedStickerIslands": fg_islands,
            "bbox_in_source": [0, 0, w_src - 1, h_src - 1],
            "cropped_w": w_out,
            "cropped_h": h_out,
        }

    # Group A: Morphological closing & radial border expansion
    r_close = cfg.get("morphCloseRadiusPx", 20)
    r_border = cfg.get("dieCutBorderRadiusPx", 28)
    sigma_contour = cfg.get("contourSmoothingSigma", 3.5)

    close_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r_close + 1, 2 * r_close + 1))
    bridged = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, close_kernel)

    # Fill internal holes within bridged silhouette
    num_b_labels, b_labels, _, _ = cv2.connectedComponentsWithStats((1 - bridged).astype(np.uint8), connectivity=8)
    b_border_labels = set(np.unique(np.concatenate([b_labels[0, :], b_labels[-1, :], b_labels[:, 0], b_labels[:, -1]])))
    bridged_solid = bridged.copy()
    hole_mask = (~np.isin(b_labels, list(b_border_labels))) & (b_labels != 0)
    bridged_solid[hole_mask] = 1

    # Outer EDT for die-cut border
    dist_out_border = scipy.ndimage.distance_transform_edt(1 - bridged_solid)
    dist_out_smooth = scipy.ndimage.gaussian_filter(dist_out_border, sigma_contour)
    master_alpha = np.clip((r_border + 0.5 - dist_out_smooth) / 1.5, 0.0, 1.0)

    border_mask = np.clip(master_alpha - subject_alpha, 0.0, 1.0)

    # Tri-zone code
    tri_zone = np.zeros(master_alpha.shape, dtype=np.uint8)
    tri_zone[(border_mask >= subject_alpha) & (master_alpha >= 0.05)] = 128
    tri_zone[(subject_alpha > border_mask) & (master_alpha >= 0.05)] = 255

    num_labels, _, _, _ = cv2.connectedComponentsWithStats((master_alpha > 0.05).astype(np.uint8), connectivity=8)
    fg_islands = max(1, num_labels - 1)

    # Bounding box of master_alpha > 0.004 in source
    active_y, active_x = np.where(master_alpha > 0.004)
    ymin, ymax = int(np.min(active_y)), int(np.max(active_y))
    xmin, xmax = int(np.min(active_x)), int(np.max(active_x))

    return {
        "master_alpha": master_alpha,
        "subject_alpha": subject_alpha,
        "border_mask": border_mask,
        "tri_zone_code": tri_zone,
        "dehaloed_bgr": img_bgr,
        "connected_islands": fg_islands,
        "connectedStickerIslands": fg_islands,
        "bbox_in_source": [xmin, ymin, xmax, ymax],
        "cropped_w": (xmax - xmin + 1) + 2 * cfg.get("edgeSafetyMarginPx", 3),
        "cropped_h": (ymax - ymin + 1) + 2 * cfg.get("edgeSafetyMarginPx", 3),
    }


def derive_foil_intensity_mask(
    dehaloed_bgr: np.ndarray,
    subject_alpha: np.ndarray,
    border_mask: np.ndarray,
    asset_spec: dict[str, Any] | None = None,
) -> np.ndarray:
    """
    Derives continuous Foil Intensity Mask (§2.5).
    Suppresses foil in deep shadows/blacks (L <= 0.10 -> 0.0) to preserve head-on photo legibility.
    Elevates foil across mid-tones, specular highlights, marble veining, and stained glass [0.22..0.92].
    Sets die-cut border zone foil weight to 1.0 (for independent styling in Stage 2).
    """
    bgr = dehaloed_bgr
    if bgr.shape[:2] != subject_alpha.shape[:2]:
        pad_y = (subject_alpha.shape[0] - bgr.shape[0]) // 2
        pad_x = (subject_alpha.shape[1] - bgr.shape[1]) // 2
        if pad_y >= 0 and pad_x >= 0:
            bgr = np.pad(bgr, ((pad_y, pad_y), (pad_x, pad_x), (0, 0)), mode="constant", constant_values=0)

    # Convert BGR to float32 RGB in [0.0, 1.0]
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    # Standard Rec. 709 luminance
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

    # HSV saturation
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c
    sat = np.zeros_like(luma)
    nonzero_max = max_c > 1e-4
    sat[nonzero_max] = delta[nonzero_max] / max_c[nonzero_max]

    # Deep shadow & black ink guard: smoothstep(0.10, 0.28, L)
    shadow_gate = smoothstep(0.10, 0.28, luma)

    # Mid-tone & highlight iridescence curve
    luma_norm = np.clip((luma - 0.10) / 0.90, 0.0, 1.0)
    mid_highlight = 0.22 + 0.68 * np.power(luma_norm, 0.85) + 0.15 * sat * (1.0 - np.abs(2.0 * luma - 1.0))
    foil_subject = np.clip(shadow_gate * mid_highlight, 0.0, 0.92)

    # Combine subject with border zone
    foil_mask = np.clip(subject_alpha * foil_subject + border_mask * 1.0, 0.0, 1.0)
    return foil_mask.astype(np.float32)


def crop_and_pad_sticker_bundle(
    dehaloed_bgr: np.ndarray | dict[str, Any],
    subject_alpha: np.ndarray | dict[str, Any],
    master_alpha: np.ndarray | None = None,
    foil_mask: np.ndarray | None = None,
    border_mask: np.ndarray | None = None,
    tri_zone_code: np.ndarray | None = None,
    asset_spec: dict[str, Any] | None = None,
    bbox_in_source: list[int] | None = None,
) -> dict[str, Any]:
    """
    Trims dead space and pads uniformly with edgeSafetyMarginPx (3px) transparent UV safety padding (§2.6).
    Composites clean white vinyl default border fill ([255, 255, 255]) into base_color.
    Computes spatial metadata: croppedAspectRatio, planeWidthMeters, planeHeightMeters.
    Supports 2-arg (maps_dict, asset_spec), 7-arg, and 8-arg call signatures.
    """
    if isinstance(dehaloed_bgr, dict) and isinstance(subject_alpha, dict):
        maps_dict = dehaloed_bgr
        asset_spec = subject_alpha
        dehaloed_bgr = maps_dict["dehaloed_bgr"]
        subject_alpha = maps_dict["subject_alpha"]
        master_alpha = maps_dict["master_alpha"]
        foil_mask = maps_dict["foil_mask"]
        border_mask = maps_dict["border_mask"]
        tri_zone_code = maps_dict["tri_zone_code"]
        bbox_in_source = maps_dict.get("bbox_in_source")

    if (
        not isinstance(dehaloed_bgr, np.ndarray)
        or not isinstance(subject_alpha, np.ndarray)
        or master_alpha is None
        or foil_mask is None
        or border_mask is None
        or tri_zone_code is None
        or asset_spec is None
    ):
        raise ValueError("crop_and_pad_sticker_bundle: Missing required map or asset_spec (INV-FAILFAST-01).")

    mode = asset_spec.get("preProcessingMode", "group_a_cutout")
    cfg = asset_spec.get("stage1Config", {})
    margin_px = cfg.get("edgeSafetyMarginPx", 3)

    if mode == "group_a_cutout":
        if bbox_in_source is None:
            active_y, active_x = np.where(master_alpha > 0.004)
            ymin, ymax = int(np.min(active_y)), int(np.max(active_y))
            xmin, xmax = int(np.min(active_x)), int(np.max(active_x))
        else:
            xmin, ymin, xmax, ymax = bbox_in_source

        # Crop to tight bounding box
        c_master = master_alpha[ymin : ymax + 1, xmin : xmax + 1]
        c_subject = subject_alpha[ymin : ymax + 1, xmin : xmax + 1]
        c_foil = foil_mask[ymin : ymax + 1, xmin : xmax + 1]
        c_border = border_mask[ymin : ymax + 1, xmin : xmax + 1]
        c_tri = tri_zone_code[ymin : ymax + 1, xmin : xmax + 1]
        c_bgr = dehaloed_bgr[ymin : ymax + 1, xmin : xmax + 1]

        # Uniform 3px padding on all 4 sides with constant 0
        pad_cfg = ((margin_px, margin_px), (margin_px, margin_px))
        p_master = np.pad(c_master, pad_cfg, mode="constant", constant_values=0.0)
        p_subject = np.pad(c_subject, pad_cfg, mode="constant", constant_values=0.0)
        p_foil = np.pad(c_foil, pad_cfg, mode="constant", constant_values=0.0)
        p_border = np.pad(c_border, pad_cfg, mode="constant", constant_values=0.0)
        p_tri = np.pad(c_tri, pad_cfg, mode="constant", constant_values=0)
        p_bgr = np.pad(c_bgr, ((margin_px, margin_px), (margin_px, margin_px), (0, 0)), mode="constant", constant_values=0)
    else:
        # Group B is already framed and padded (pad dehaloed_bgr if passed unpadded)
        p_master = master_alpha
        p_subject = subject_alpha
        p_foil = foil_mask
        p_border = border_mask
        p_tri = tri_zone_code
        if dehaloed_bgr.shape[:2] != p_master.shape[:2]:
            pad_y = (p_master.shape[0] - dehaloed_bgr.shape[0]) // 2
            pad_x = (p_master.shape[1] - dehaloed_bgr.shape[1]) // 2
            p_bgr = np.pad(dehaloed_bgr, ((pad_y, pad_y), (pad_x, pad_x), (0, 0)), mode="constant", constant_values=0)
        else:
            p_bgr = dehaloed_bgr

    # Construct final Base Color RGBA Map
    # Convert BGR to RGB
    final_rgb = cv2.cvtColor(p_bgr, cv2.COLOR_BGR2RGB)

    # In Die-Cut Border Zone (p_tri == 128), fill clean white vinyl [255, 255, 255]
    border_zone_pixels = p_tri == 128
    final_rgb[border_zone_pixels] = [255, 255, 255]

    # In Exterior Void (p_tri == 0), fill [0, 0, 0]
    void_pixels = p_tri == 0
    final_rgb[void_pixels] = [0, 0, 0]

    final_alpha = np.round(p_master * 255.0).astype(np.uint8)
    base_color_rgba = np.dstack([final_rgb, final_alpha])

    master_alpha_uint8 = np.round(p_master * 255.0).astype(np.uint8)
    foil_mask_uint8 = np.round(p_foil * 255.0).astype(np.uint8)
    border_mask_uint8 = np.round(p_border * 255.0).astype(np.uint8)

    # Packed RGBA Control Map: R=master_alpha, G=foil_mask, B=border_mask, A=tri_zone_code
    packed_control_rgba = np.dstack([master_alpha_uint8, foil_mask_uint8, border_mask_uint8, p_tri])

    # Dimensions & Aspect Ratio
    ch, cw = p_master.shape[:2]
    aspect_ratio = cw / ch

    # Spatial scaling matching plan-stickers-asset-manifest.json
    base_area = 1.15 * 1.15
    plane_height = round(math.sqrt(base_area / aspect_ratio), 4)
    plane_width = round(plane_height * aspect_ratio, 4)

    # Tri-zone pixel counts
    count_void = int(np.sum(p_tri == 0))
    count_border = int(np.sum(p_tri == 128))
    count_subject = int(np.sum(p_tri == 255))

    return {
        "base_color_rgba": base_color_rgba,
        "master_alpha_uint8": master_alpha_uint8,
        "foil_mask_uint8": foil_mask_uint8,
        "border_mask_uint8": border_mask_uint8,
        "packed_control_rgba": packed_control_rgba,
        "croppedWidth": cw,
        "croppedHeight": ch,
        "croppedAspectRatio": aspect_ratio,
        "planeWidthMeters": plane_width,
        "planeHeightMeters": plane_height,
        "triZonePixelCounts": {
            "exteriorVoid": count_void,
            "dieCutBorder": count_border,
            "subjectInterior": count_subject,
        },
    }


def process_single_sticker_asset(asset_spec: dict[str, Any], output_root: str = "stickers_build") -> dict[str, Any]:
    """
    Executes the complete Stage 1 pipeline for one sticker image and writes all standardized bundle files.
    """
    asset_id = asset_spec["id"]
    repo_path = asset_spec["repoPath"]
    bundle_dir = os.path.join(output_root, asset_id)
    os.makedirs(bundle_dir, exist_ok=True)

    img_bgr = cv2.imread(repo_path)
    if img_bgr is None:
        raise ValueError(f"Could not load image: {repo_path}")

    # 1. Background Isolation (§2.2)
    iso_res = isolate_subject_alpha(img_bgr, asset_spec)
    fg_mask = iso_res["fg_mask"]
    interior_white_count = iso_res["interior_white_count"]

    # 2. De-haloing and anti-aliasing (§2.3)
    dehaloed_bgr, subject_alpha = dehalo_and_antialias_subject(img_bgr, fg_mask, asset_spec)

    # 3. Die-cut border & tri-zones (§2.4)
    border_res = generate_die_cut_border_and_tri_zones(subject_alpha, fg_mask, dehaloed_bgr, asset_spec)
    master_alpha = border_res["master_alpha"]
    final_subject_alpha = border_res["subject_alpha"]
    border_mask = border_res["border_mask"]
    tri_zone_code = border_res["tri_zone_code"]
    connected_islands = border_res["connected_islands"]
    bbox_in_source = border_res["bbox_in_source"]
    final_dehaloed_bgr = border_res["dehaloed_bgr"]

    # 4. Foil intensity mask (§2.5)
    foil_mask = derive_foil_intensity_mask(final_dehaloed_bgr, final_subject_alpha, border_mask, asset_spec)

    # 5. Crop and Pad (§2.6)
    bundle_res = crop_and_pad_sticker_bundle(
        final_dehaloed_bgr,
        final_subject_alpha,
        master_alpha,
        foil_mask,
        border_mask,
        tri_zone_code,
        asset_spec,
        bbox_in_source,
    )

    # Save PNG textures
    base_color_path = os.path.join(bundle_dir, "base_color.png")
    master_alpha_path = os.path.join(bundle_dir, "master_alpha.png")
    foil_mask_path = os.path.join(bundle_dir, "foil_mask.png")
    border_mask_path = os.path.join(bundle_dir, "border_mask.png")
    packed_control_path = os.path.join(bundle_dir, "packed_control.png")
    metadata_path = os.path.join(bundle_dir, "metadata.json")

    Image.fromarray(bundle_res["base_color_rgba"], mode="RGBA").save(base_color_path, optimize=True)
    Image.fromarray(bundle_res["master_alpha_uint8"], mode="L").save(master_alpha_path, optimize=True)
    Image.fromarray(bundle_res["foil_mask_uint8"], mode="L").save(foil_mask_path, optimize=True)
    Image.fromarray(bundle_res["border_mask_uint8"], mode="L").save(border_mask_path, optimize=True)
    Image.fromarray(bundle_res["packed_control_rgba"], mode="RGBA").save(packed_control_path, optimize=True)

    metadata = {
        "id": asset_id,
        "code": asset_spec["code"],
        "repoPath": repo_path,
        "preProcessingMode": asset_spec["preProcessingMode"],
        "bypassExteriorCutout": asset_spec["bypassExteriorCutout"],
        "sourceWidth": asset_spec["sourceWidth"],
        "sourceHeight": asset_spec["sourceHeight"],
        "sourceAspectRatio": asset_spec["sourceAspectRatio"],
        "masterBBoxInSource": bbox_in_source,
        "croppedWidth": bundle_res["croppedWidth"],
        "croppedHeight": bundle_res["croppedHeight"],
        "croppedAspectRatio": bundle_res["croppedAspectRatio"],
        "planeWidthMeters": bundle_res["planeWidthMeters"],
        "planeHeightMeters": bundle_res["planeHeightMeters"],
        "edgeSafetyMarginPx": asset_spec["stage1Config"]["edgeSafetyMarginPx"],
        "dieCutBorderRadiusPx": asset_spec["stage1Config"]["dieCutBorderRadiusPx"],
        "connectedStickerIslands": connected_islands,
        "triZonePixelCounts": bundle_res["triZonePixelCounts"],
        "interiorWhitePixelsPreserved": interior_white_count,
        "bundleFiles": [
            "base_color.png",
            "master_alpha.png",
            "foil_mask.png",
            "border_mask.png",
            "packed_control.png",
            "metadata.json",
        ],
    }

    with open(metadata_path, "w", encoding="utf-8") as f_meta:
        json.dump(metadata, f_meta, indent=2)

    return metadata


def build_all_sticker_bundles(output_root: str = "stickers_build") -> dict[str, Any]:
    """
    Executes Stage 1 processing for all 6 catalog sticker assets and writes stickers_build/manifest.json.
    """
    os.makedirs(output_root, exist_ok=True)
    catalog = load_sticker_source_catalog()

    processed_assets = []
    for asset_spec in catalog:
        print(f"Processing Stage 1 bundle for {asset_spec['id']} ({asset_spec['code']})...")
        meta = process_single_sticker_asset(asset_spec, output_root=output_root)
        processed_assets.append(meta)

    manifest = {
        "schemaVersion": "1.0.0",
        "runId": "20261020T004604-878-nmhc",
        "specificationPath": "anim/stickers.md",
        "stage1OutputDir": output_root,
        "totalAssets": len(processed_assets),
        "groupACutoutCount": sum(1 for a in processed_assets if a["preProcessingMode"] == "group_a_cutout"),
        "groupBFullFrameCount": sum(1 for a in processed_assets if a["preProcessingMode"] == "group_b_full_frame"),
        "edgeSafetyMarginPx": 3,
        "baseStickerHeightMeters": 1.15,
        "assets": processed_assets,
    }

    manifest_path = os.path.join(output_root, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Stage 1 pre-processing complete: {manifest_path} generated ({len(processed_assets)} assets).")
    return manifest


if __name__ == "__main__":
    build_all_sticker_bundles()
