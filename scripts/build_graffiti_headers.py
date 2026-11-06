#!/usr/bin/env python3
"""
Deterministic 26-Glyph Cyber-Drip Graffiti Alphabet Atlas & Station Header Builder
(Functional Specification 067 §3.1, §5.1, §5.2, §5.5).

Extracts all 26 uppercase glyphs (A-Z) from `graffiti_.jpeg` (2752x1536),
deterministically masks out:
  - Small printed reference letters (A-Z) beneath each glyph
  - Top-border drip tips intruding from the row above
  - Top "CYBER-DRIP GRAFFITI ALPHABET" banner & TAG 1..3 margin annotations
  - Detached HUD barcode / reticle / crosshair corner clutter
Unmixes the warm off-white paper backdrop (`RGB ~ [245.5, 243.5, 241.2]`) with a
warm amber-gold aerosol rim (`#fbbf24`), and outputs:
  1. `assets/graffiti_alphabet_atlas.png` (1024x571 RGBA PNG, Spec 066 <= 1024px compliant)
  2. `assets/graffiti_alphabet_atlas.json` (authoritative 26-glyph & 7-station metadata)
"""

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
SOURCE_JPEG_PATH = os.path.join(REPO_ROOT, "graffiti_.jpeg")
OUT_ATLAS_PNG_PATH = os.path.join(REPO_ROOT, "assets", "graffiti_alphabet_atlas.png")
OUT_ATLAS_JSON_PATH = os.path.join(REPO_ROOT, "assets", "graffiti_alphabet_atlas.json")

# Authoritative 26-Glyph Cell & Printed Caption Mask Definitions in 2752x1536 Reference Space
# Format: (char, row, cell_x1, cell_y1, cell_x2, cell_y2, cap_x, cap_y, cap_w, cap_h)
GLYPH_SPECS_2752 = [
    ("A", 1,  145,   66,  535,  442,  348,  411, 29, 31),
    ("B", 1,  535,   66,  918,  442,  708,  411, 27, 31),
    ("C", 1,  918,   66, 1245,  442, 1067,  411, 25, 31),
    ("D", 1, 1245,   66, 1590,  442, 1417,  411, 26, 31),
    ("E", 1, 1590,   66, 1955,  442, 1775,  411, 24, 31),
    ("F", 1, 1955,   66, 2264,  442, 2077,  411, 24, 31),
    ("G", 1, 2264,   66, 2575,  442, 2398,  411, 27, 31),
    ("H", 2,  150,  455,  558,  842,  350,  807, 27, 35),
    ("I", 2,  558,  455,  848,  842,  699,  807,  7, 35),
    ("J", 2,  848,  455, 1187,  842, 1030,  807, 24, 35),
    ("K", 2, 1187,  455, 1530,  842, 1372,  807, 28, 35),
    ("L", 2, 1530,  455, 1882,  842, 1718,  807, 22, 35),
    ("M", 2, 1882,  455, 2244,  842, 2051,  807, 34, 35),
    ("N", 2, 2244,  455, 2585,  842, 2398,  807, 27, 35),
    ("O", 3,  150,  860,  502, 1208,  350, 1175, 27, 33),
    ("P", 3,  502,  860,  835, 1208,  690, 1175, 26, 33),
    ("Q", 3,  835,  860, 1235, 1208, 1031, 1175, 26, 33),
    ("R", 3, 1235,  860, 1568, 1208, 1383, 1175, 26, 33),
    ("S", 3, 1568,  860, 1912, 1208, 1732, 1175, 26, 33),
    ("T", 3, 1912,  860, 2252, 1208, 2087, 1175, 26, 33),
    ("U", 3, 2252,  860, 2585, 1208, 2407, 1175, 26, 33),
    ("V", 4,  390, 1212,  768, 1530,  597, 1491, 30, 35),
    ("W", 4,  768, 1212, 1205, 1530,  989, 1491, 47, 35),
    ("X", 4, 1205, 1212, 1585, 1530, 1408, 1491, 31, 35),
    ("Y", 4, 1585, 1212, 1965, 1530, 1793, 1491, 29, 35),
    ("Z", 4, 1965, 1212, 2390, 1530, 2173, 1491, 25, 35),
]

STATION_HEADER_SCHEDULE = [
    {
        "mountName": "SCREEN_MOUNT_01",
        "stationIndex": 1,
        "code": "01",
        "strippedTitle": "GRAPHRAG POLICY ENGINE",
        "headerText": "GRAPHRAG POLICY ENGINE",
        "headerLines": ["GRAPHRAG", "POLICY ENGINE"],
    },
    {
        "mountName": "SCREEN_MOUNT_02",
        "stationIndex": 2,
        "code": "02",
        "strippedTitle": "DIGITAL TWIN PERSONA",
        "headerText": "DIGITAL TWIN PERSONA",
        "headerLines": ["DIGITAL TWIN", "PERSONA"],
    },
    {
        "mountName": "SCREEN_MOUNT_03",
        "stationIndex": 3,
        "code": "03",
        "strippedTitle": "QUANTITATIVE MODELING AND STATISTICAL ARBITRAGE",
        "headerText": "QUANTITATIVE MODELING STATISTICAL ARBITRAGE",
        "headerLines": ["QUANTITATIVE MODELING", "STATISTICAL ARBITRAGE"],
    },
    {
        "mountName": "SCREEN_MOUNT_07",
        "stationIndex": 4,
        "code": "04",
        "strippedTitle": "REJECTION STATION // MACHINE LEARNING",
        "headerText": "REJECTION STATION MACHINE LEARNING",
        "headerLines": ["REJECTION STATION", "MACHINE LEARNING"],
    },
    {
        "mountName": "SCREEN_MOUNT_04",
        "stationIndex": 5,
        "code": "05",
        "strippedTitle": "AI DATA ANALYTICS DASHBOARDS AND ALIGNMENT RESEARCH",
        "headerText": "AI DATA ANALYTICS ALIGNMENT RESEARCH",
        "headerLines": ["AI DATA ANALYTICS", "ALIGNMENT RESEARCH"],
    },
    {
        "mountName": "SCREEN_MOUNT_05",
        "stationIndex": 6,
        "code": "06",
        "strippedTitle": "GENERATIVE PIPELINES",
        "headerText": "GENERATIVE PIPELINES",
        "headerLines": ["GENERATIVE", "PIPELINES"],
    },
    {
        "mountName": "SCREEN_MOUNT_06",
        "stationIndex": 7,
        "code": "07",
        "strippedTitle": "MULTI-MODAL DEEP LEARNING",
        "headerText": "MULTI MODAL DEEP LEARNING",
        "headerLines": ["MULTI MODAL", "DEEP LEARNING"],
    },
]


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / max(1e-6, (edge1 - edge0)), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def build_graffiti_atlas():
    if not os.path.isfile(SOURCE_JPEG_PATH):
        raise FileNotFoundError(f"Missing required reference image: {SOURCE_JPEG_PATH}")

    bgr = cv2.imread(SOURCE_JPEG_PATH)
    if bgr is None:
        raise RuntimeError(f"Failed to decode JPEG: {SOURCE_JPEG_PATH}")

    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    src_h, src_w, _ = rgb.shape
    bg_rgb = np.array([245.5, 243.5, 241.2], dtype=np.float32)
    diff = np.linalg.norm(rgb - bg_rgb, axis=-1)

    full_rgba = np.zeros((src_h, src_w, 4), dtype=np.float32)
    glyph_records = {}

    for ch, row, x1, y1, x2, y2, cx, cy, cw, ch_box in GLYPH_SPECS_2752:
        sub_rgb = rgb[y1:y2, x1:x2].copy()
        sub_diff = diff[y1:y2, x1:x2].copy()

        # 1. Mask printed caption box (A..Z) at bottom of cell
        rcx1 = max(0, cx - x1 - 6)
        rcy1 = max(0, cy - y1 - 6)
        rcx2 = min(x2 - x1, cx - x1 + cw + 6)
        rcy2 = min(y2 - y1, cy - y1 + ch_box + 6)
        sub_diff[rcy1:rcy2, rcx1:rcx2] = 0.0

        # 2. Keep core glyph stroke components (area >= 550, excluding top-border drip tips & flat barcode bars)
        core_bin = (sub_diff > 65.0).astype(np.uint8)
        n_lbl, lbls, stats, _ = cv2.connectedComponentsWithStats(core_bin, connectivity=8)
        keep_core = np.zeros_like(core_bin)
        for l_idx in range(1, n_lbl):
            lx, ly, lw, lh, larea = stats[l_idx]
            if ly <= 4 and lw <= 25 and lh <= 45:
                continue
            if larea >= 550 and not (lh <= 18 and lw >= 45):
                keep_core[lbls == l_idx] = 1

        # Dilate keep_core to preserve attached aerosol mist and vertical paint drips
        kernel_mist = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (53, 53))
        kernel_drip = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 65))
        allowed_zone = np.maximum(
            cv2.dilate(keep_core, kernel_mist, iterations=1),
            cv2.dilate(keep_core, kernel_drip, iterations=1),
        )
        sub_diff = sub_diff * allowed_zone

        # 3. Continuous paper-white alpha unmixing + warm amber rim illumination
        alpha_ink = smoothstep(22.0, 95.0, sub_diff)
        unmixed_rgb = np.clip(
            (sub_rgb - (1.0 - alpha_ink[..., None]) * bg_rgb) / np.maximum(alpha_ink[..., None], 0.15),
            0.0,
            255.0,
        )
        amber_halo = smoothstep(14.0, 75.0, sub_diff) * (1.0 - alpha_ink * 0.65)
        total_a = np.clip(alpha_ink + amber_halo * 0.58, 0.0, 1.0)
        comp_rgb = np.where(
            total_a[..., None] > 1e-3,
            (
                unmixed_rgb * alpha_ink[..., None]
                + np.array([251.0, 191.0, 36.0], dtype=np.float32) * (amber_halo[..., None] * 0.58)
            )
            / np.maximum(total_a[..., None], 1e-3),
            0.0,
        )

        full_rgba[y1:y2, x1:x2, :3] = comp_rgb
        full_rgba[y1:y2, x1:x2, 3] = total_a * 255.0

        ys_core, xs_core = np.where(keep_core > 0)
        gx1 = int(x1 + max(0, int(xs_core.min()) - 6))
        gx2 = int(x1 + min(x2 - x1, int(xs_core.max()) + 7))
        gy1 = int(y1 + max(0, int(ys_core.min()) - 6))
        gy2 = int(y1 + min(y2 - y1, int(ys_core.max()) + 7))

        glyph_records[ch] = {
            "char": ch,
            "row": row,
            "srcBounds": [gx1, gy1, gx2, gy2],
            "srcCell": [x1, y1, x2, y2],
            "captionMask": [cx - 6, cy - 6, cw + 12, ch_box + 12],
        }

    # Downscale full_rgba (2752x1536) to 1024x571 using premultiplied alpha so max axis <= 1024px (Spec 066)
    target_w = 1024
    scale = target_w / float(src_w)
    target_h = int(round(src_h * scale))  # 571

    a_norm = full_rgba[:, :, 3:4] / 255.0
    premult = np.concatenate([full_rgba[:, :, :3] * a_norm, full_rgba[:, :, 3:4]], axis=-1)
    resized_pre = cv2.resize(premult, (target_w, target_h), interpolation=cv2.INTER_AREA)
    a_out = np.clip(resized_pre[:, :, 3:4] / 255.0, 0.0, 1.0)
    rgb_out = np.where(a_out > 1e-3, resized_pre[:, :, :3] / np.maximum(a_out, 1e-3), 0.0)
    atlas_rgba = np.concatenate(
        [np.clip(rgb_out, 0, 255), np.clip(resized_pre[:, :, 3:4], 0, 255)], axis=-1
    ).round().astype(np.uint8)

    os.makedirs(os.path.dirname(OUT_ATLAS_PNG_PATH), exist_ok=True)
    atlas_bgra = cv2.cvtColor(atlas_rgba, cv2.COLOR_RGBA2BGRA)
    cv2.imwrite(OUT_ATLAS_PNG_PATH, atlas_bgra)

    for ch, rec in glyph_records.items():
        gx1, gy1, gx2, gy2 = rec["srcBounds"]
        ax1 = max(0, int(floor_val := np.floor(gx1 * scale)))
        ay1 = max(0, int(np.floor(gy1 * scale)))
        ax2 = min(target_w, int(np.ceil(gx2 * scale)))
        ay2 = min(target_h, int(np.ceil(gy2 * scale)))
        rec["atlasBounds"] = [ax1, ay1, ax2, ay2]
        rec["atlasWidth"] = ax2 - ax1
        rec["atlasHeight"] = ay2 - ay1

    metadata = {
        "sourceImage": "graffiti_.jpeg",
        "sourceDimensions": [src_w, src_h],
        "atlasImage": "assets/graffiti_alphabet_atlas.png",
        "atlasDimensions": [target_w, target_h],
        "scaleFactor": round(scale, 6),
        "glyphs": glyph_records,
        "stations": STATION_HEADER_SCHEDULE,
    }
    with open(OUT_ATLAS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(
        f"Built {OUT_ATLAS_PNG_PATH} ({target_w}x{target_h}) and {OUT_ATLAS_JSON_PATH} ({len(glyph_records)} glyphs, {len(STATION_HEADER_SCHEDULE)} stations)."
    )


if __name__ == "__main__":
    build_graffiti_atlas()
