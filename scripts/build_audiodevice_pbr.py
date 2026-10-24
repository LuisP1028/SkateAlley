#!/usr/bin/env python3
"""
Two-stage pipeline to decimate and repaint `/Users/diesel/Desktop/SkateAlley/audiodevice.glb`
into `audiodevice_decimated.glb` and `assets/audiodevice_decimated.glb` using the
Orthographic UV Registration + Voronoi De-Haloed Multi-Channel PBR & Emissive Synthesis
algorithm (matching the `build_villainy_inc.py` architecture):

Stage 1 (runs in `/opt/anaconda3/envs/greek_env/bin/python` with OpenCV & NumPy):
  - Loads `audiodevice.jpeg` (1536x2752 front reference) and `audiodeviceback.jpeg` (1536x2752 back reference).
  - Replaces `"TECHNO-AUDIO"` on the top nameplate with `"DOOM TRACKS"` in `#ffa51d` extended
    techno-industrial vector typography between the preserved upper and lower horizontal rules.
  - Performs Connected-Component White-Background Isolation (`gray >= 235 & chroma <= 24`),
    4px morphological foreground erosion (`cv2.MORPH_ELLIPSE`), and exact Euclidean Voronoi
    nearest-neighbor color extrapolation (`cv2.distanceTransformWithLabels`) to eliminate 100%
    of white silhouette border halos.
  - Synthesizes a 2048x2048 side-by-side (`Front | Back`) 5-map PBR + Emissive texture suite in
    `assets/audiodevice_textures/`:
      1. `base_color.png` (sRGB)
      2. `emissive.png` (sRGB)
      3. `roughness.png` (Non-Color)
      4. `metallic.png` (Non-Color)
      5. `normal.png` (Non-Color tangent-space Sobel normal map)

Stage 2 (runs in `/Applications/Blender.app/Contents/MacOS/Blender --background`):
  - Imports `/Users/diesel/Desktop/SkateAlley/audiodevice.glb` (`40,000` triangles).
  - Applies a `DECIMATE` collapse modifier (`ratio = 0.13`, yielding ~5,200 triangles, <= 6,000).
  - Performs BMesh Orthographic UV Registration (`n_z >= -0.15` -> Front half `u in [0.0, 0.5]`
    with steep-wall tangent micro-offset; `n_z < -0.15` -> Back half `u in [0.5, 1.0]` with
    rear-view horizontal reflection `1.0 - s_x` so `PLATODOOM-INC` aligns with 3D rear embossing).
  - Constructs `AudioDevice_PBR_Material` (`ShaderNodeBsdfPrincipled` + `KHR_materials_emissive_strength`)
    and exports `audiodevice_decimated.glb` and `assets/audiodevice_decimated.glb` using standard
    glTF 2.0 textures (compatible with macOS Quick Look / Preview.app and Three.js).
"""

import os
import sys
import shutil

PROJECT_DIR = "/Users/diesel/desktop/skatealley"
SOURCE_GLB_PATH = "/Users/diesel/Desktop/SkateAlley/audiodevice.glb"
FRONT_REF_PATH = "/Users/diesel/Desktop/SkateAlley/audiodevice.jpeg"
BACK_REF_PATH = "/Users/diesel/Desktop/SkateAlley/audiodeviceback.jpeg"
MP3_SCREEN_REF_PATH = os.path.join(PROJECT_DIR, "assets", "mp3.jpeg")
TEX_DIR = os.path.join(PROJECT_DIR, "assets", "audiodevice_textures")
OUTPUT_ROOT_GLB = os.path.join(PROJECT_DIR, "audiodevice_decimated.glb")
OUTPUT_ASSETS_GLB = os.path.join(PROJECT_DIR, "assets", "audiodevice_decimated.glb")

# Calibrated portrait crop window (in 1536x2752 reference pixel space)
# Foreground spans x_px in [117, 1418] (w=1301) and y_px in [399, 2352] (h=1953).
# Cropping x in [76, 1460] (w=1384) and y in [352, 2400] (h=2048) leaves a >=41px Voronoi
# safety margin on all 4 sides before packing Front (1024x2048) and Back (1024x2048) into 2048x2048.
CROP_X0 = 76
CROP_W = 1384
CROP_Y0 = 352
CROP_H = 2048

FG_X_MIN = 117.0
FG_X_MAX = 1418.0
FG_Y_MIN = 399.0
FG_Y_MAX = 2352.0


def draw_doom_tracks_on_landscape(img_land_bgr):
    """
    Occludes 'TECHNO-AUDIO' in 2752x1536 landscape space (x: 1140..1612, y: 168..206)
    between upper rule (y=150) and lower rule (y=216) and draws 'DOOM TRACKS' in extended
    techno-industrial #ffa51d vector strokes centered at (1376, 173), capHeight=29.
    """
    import cv2
    import numpy as np

    out = img_land_bgr.copy()

    # 1. Occlude "TECHNO-AUDIO" with deterministic dark charcoal grain matching nameplate substrate
    ys, xs = np.mgrid[168:207, 1140:1613]
    grain = ((xs * 13 + ys * 29) & 1).astype(np.uint8)
    out[168:207, 1140:1613, 2] = 29 + grain  # R
    out[168:207, 1140:1613, 1] = 22 + grain  # G
    out[168:207, 1140:1613, 0] = 15 + grain  # B

    # 2. Vector glyph strokes matching doom_tracks_mp3_hud.js TECHNO_GLYPH_STROKES
    def glyph_ratio(ch):
        if ch == " ":
            return 0.55
        if ch in ("M", "W"):
            return 1.24
        return 1.08

    text = "DOOM TRACKS"
    cap_h = 29.0
    tracking = 9.0
    w_scale = 1.05

    total_w = 0.0
    for i, ch in enumerate(text):
        total_w += cap_h * glyph_ratio(ch) * w_scale
        if i < len(text) - 1:
            total_w += tracking

    start_x = 1376.0 - total_w * 0.5
    top_y = 173.0

    # Render at 4x supersampling for crisp anti-aliased bevel strokes
    ss = 4
    patch_x0, patch_y0 = 1120, 155
    patch_w, patch_h = 512, 60
    canvas_ss = cv2.resize(
        out[patch_y0 : patch_y0 + patch_h, patch_x0 : patch_x0 + patch_w],
        (patch_w * ss, patch_h * ss),
        interpolation=cv2.INTER_NEAREST,
    )

    def stroke_poly(img_ss, pts, color_bgr, thickness_px, closed=False):
        pts_arr = np.array(
            [[int(round((px - patch_x0) * ss)), int(round((py - patch_y0) * ss))] for px, py in pts],
            dtype=np.int32,
        )
        cv2.polylines(
            img_ss,
            [pts_arr],
            isClosed=closed,
            color=color_bgr,
            thickness=max(1, int(round(thickness_px * ss))),
            lineType=cv2.LINE_AA,
        )

    def draw_glyph_pass(img_ss, color_bgr, sw):
        cur_x = start_x
        for ch in text:
            gw = cap_h * glyph_ratio(ch) * w_scale
            x, y, w, h = cur_x, top_y, gw, cap_h
            pad = sw * 0.5
            ch_bev = sw * 0.95
            if ch == "D":
                stroke_poly(
                    img_ss,
                    [
                        (x + pad, y + pad),
                        (x + w - pad - ch_bev, y + pad),
                        (x + w - pad, y + pad + ch_bev),
                        (x + w - pad, y + h - pad - ch_bev),
                        (x + w - pad - ch_bev, y + h - pad),
                        (x + pad, y + h - pad),
                    ],
                    color_bgr,
                    sw,
                    closed=True,
                )
            elif ch == "O":
                stroke_poly(
                    img_ss,
                    [
                        (x + pad + ch_bev, y + pad),
                        (x + w - pad - ch_bev, y + pad),
                        (x + w - pad, y + pad + ch_bev),
                        (x + w - pad, y + h - pad - ch_bev),
                        (x + w - pad - ch_bev, y + h - pad),
                        (x + pad + ch_bev, y + h - pad),
                        (x + pad, y + h - pad - ch_bev),
                        (x + pad, y + pad + ch_bev),
                    ],
                    color_bgr,
                    sw,
                    closed=True,
                )
            elif ch == "M":
                p = sw * 0.48
                stroke_poly(
                    img_ss,
                    [
                        (x + p, y + h),
                        (x + p, y + p),
                        (x + w * 0.5, y + h * 0.62),
                        (x + w - p, y + p),
                        (x + w - p, y + h),
                    ],
                    color_bgr,
                    sw,
                    closed=False,
                )
            elif ch == "T":
                stroke_poly(img_ss, [(x, y + pad), (x + w, y + pad)], color_bgr, sw, closed=False)
                stroke_poly(
                    img_ss,
                    [(x + w * 0.5, y + pad), (x + w * 0.5, y + h)],
                    color_bgr,
                    sw,
                    closed=False,
                )
            elif ch == "R":
                mid_y = y + h * 0.52
                stroke_poly(
                    img_ss,
                    [
                        (x + pad, y + h),
                        (x + pad, y + pad),
                        (x + w - pad - ch_bev, y + pad),
                        (x + w - pad, y + pad + ch_bev * 0.8),
                        (x + w - pad, mid_y - ch_bev * 0.8),
                        (x + w - pad - ch_bev, mid_y),
                        (x + pad, mid_y),
                    ],
                    color_bgr,
                    sw,
                    closed=False,
                )
                stroke_poly(
                    img_ss,
                    [(x + w * 0.58, mid_y), (x + w - pad * 0.6, y + h)],
                    color_bgr,
                    sw,
                    closed=False,
                )
            elif ch == "A":
                p = sw * 0.45
                stroke_poly(
                    img_ss,
                    [
                        (x + p, y + h),
                        (x + w * 0.38, y + p),
                        (x + w * 0.62, y + p),
                        (x + w - p, y + h),
                    ],
                    color_bgr,
                    sw,
                    closed=False,
                )
                stroke_poly(
                    img_ss,
                    [(x + w * 0.2, y + h * 0.66), (x + w * 0.8, y + h * 0.66)],
                    color_bgr,
                    sw,
                    closed=False,
                )
            elif ch == "C":
                stroke_poly(
                    img_ss,
                    [
                        (x + w - pad * 0.4, y + pad + ch_bev * 0.9),
                        (x + w - pad - ch_bev, y + pad),
                        (x + pad + ch_bev, y + pad),
                        (x + pad, y + pad + ch_bev),
                        (x + pad, y + h - pad - ch_bev),
                        (x + pad + ch_bev, y + h - pad),
                        (x + w - pad - ch_bev, y + h - pad),
                        (x + w - pad * 0.4, y + h - pad - ch_bev * 0.9),
                    ],
                    color_bgr,
                    sw,
                    closed=False,
                )
            elif ch == "K":
                stroke_poly(
                    img_ss, [(x + pad, y), (x + pad, y + h)], color_bgr, sw, closed=False
                )
                stroke_poly(
                    img_ss,
                    [(x + w - pad * 0.5, y + pad * 0.4), (x + pad + sw * 0.3, y + h * 0.54)],
                    color_bgr,
                    sw,
                    closed=False,
                )
                stroke_poly(
                    img_ss,
                    [(x + w * 0.36, y + h * 0.44), (x + w - pad * 0.4, y + h)],
                    color_bgr,
                    sw,
                    closed=False,
                )
            elif ch == "S":
                ch_s = sw * 0.88
                mid_y = y + h * 0.5
                stroke_poly(
                    img_ss,
                    [
                        (x + w - pad * 0.5, y + pad + ch_s * 0.6),
                        (x + w - pad - ch_s, y + pad),
                        (x + pad + ch_s, y + pad),
                        (x + pad, y + pad + ch_s),
                        (x + pad, mid_y - ch_s * 0.6),
                        (x + pad + ch_s, mid_y),
                        (x + w - pad - ch_s, mid_y),
                        (x + w - pad, mid_y + ch_s * 0.6),
                        (x + w - pad, y + h - pad - ch_s),
                        (x + w - pad - ch_s, y + h - pad),
                        (x + pad + ch_s, y + h - pad),
                        (x + pad * 0.5, y + h - pad - ch_s * 0.6),
                    ],
                    color_bgr,
                    sw,
                    closed=False,
                )
            cur_x += gw + tracking

    # Outer bronze bevel pass (#896239 -> BGR 57, 98, 137) + core amber pass (#ffa51d -> BGR 29, 165, 255)
    draw_glyph_pass(canvas_ss, (57, 98, 137), 6.4)
    draw_glyph_pass(canvas_ss, (29, 165, 255), 5.0)

    out[patch_y0 : patch_y0 + patch_h, patch_x0 : patch_x0 + patch_w] = cv2.resize(
        canvas_ss, (patch_w, patch_h), interpolation=cv2.INTER_AREA
    )
    return out


def dehalo_and_extract_pbr_channels(img_bgr):
    """
    Applies Connected-Component White-Background Isolation + Voronoi Nearest-Neighbor
    De-Haloing and synthesizes the 5 PBR channels for a single 1536x2752 portrait view,
    then crops to [CROP_Y0:CROP_Y0+CROP_H, CROP_X0:CROP_X0+CROP_W] and resizes to (1024, 2048).
    """
    import cv2
    import numpy as np

    h, w, _ = img_bgr.shape
    b = img_bgr[:, :, 0].astype(np.float32)
    g = img_bgr[:, :, 1].astype(np.float32)
    r = img_bgr[:, :, 2].astype(np.float32)

    gray = 0.299 * r + 0.587 * g + 0.114 * b
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    chroma = max_c - min_c

    # 1. Identify exterior white background connected to the image border
    white_candidates = ((gray >= 232.0) & (chroma <= 26.0)).astype(np.uint8)
    num_labels, labels = cv2.connectedComponents(white_candidates, connectivity=8)

    border_labels = set(
        np.unique(
            np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
        )
    )
    border_labels.discard(0)
    bg_mask = np.isin(labels, list(border_labels)).astype(np.uint8)
    fg_mask = 1 - bg_mask

    # 2. Erode foreground mask by 4px to strip 100% of anti-aliased white border halo
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    fg_core = cv2.erode(fg_mask, kernel_erode, iterations=1)

    # 3. Exact Euclidean Voronoi nearest-neighbor color extrapolation into exterior background
    dist, voronoi_Idx = cv2.distanceTransformWithLabels(
        (1 - fg_core).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL
    )
    fg_coords = np.column_stack(np.nonzero(fg_core > 0))
    nearest_yx = fg_coords[voronoi_Idx - 1]
    voronoi_bgr = img_bgr[nearest_yx[:, :, 0], nearest_yx[:, :, 1]].astype(np.float32)

    # Blend Voronoi edge color smoothly into warm dark obsidian charcoal (RGB = 34, 26, 20)
    obsidian_bgr = np.array([20.0, 26.0, 34.0], dtype=np.float32)
    blend_t = np.clip((dist - 8.0) / 28.0, 0.0, 1.0)[:, :, np.newaxis]
    extrapolated_bgr = voronoi_bgr * (1.0 - blend_t) + obsidian_bgr * blend_t

    clean_bgr = np.where(fg_core[:, :, np.newaxis] > 0, img_bgr.astype(np.float32), extrapolated_bgr)

    # 4. Lift deep shadow floor & boost warm bronze/amber saturation so the 3D asset
    # is vibrant, bright, and legible in both macOS Quick Look / Preview.app and Three.js
    norm_bgr = np.clip(clean_bgr / 255.0, 0.0, 1.0)
    # Shadow lift + gamma 0.76: maps 0.0 -> 0.085, 0.1 -> 0.24, 1.0 -> 1.0
    lifted_bgr = 0.085 + 0.915 * np.power(norm_bgr, 0.76)
    # Subtle warm vibrance boost on R and G channels
    mean_lum = lifted_bgr.mean(axis=2, keepdims=True)
    lifted_bgr = np.clip(mean_lum + (lifted_bgr - mean_lum) * 1.16, 0.0, 1.0)
    lifted_u8 = np.clip(lifted_bgr * 255.0, 0, 255).astype(np.uint8)
    blur_u8 = cv2.GaussianBlur(lifted_u8, (0, 0), sigmaX=1.8)
    base_color_bgr = cv2.addWeighted(lifted_u8, 1.26, blur_u8, -0.26, 0)

    # Re-extract clean R, G, B, luma, chroma from de-haloed image
    cb = base_color_bgr[:, :, 0].astype(np.float32)
    cg = base_color_bgr[:, :, 1].astype(np.float32)
    cr = base_color_bgr[:, :, 2].astype(np.float32)
    cluma = (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255.0
    cchroma = (np.maximum(np.maximum(cr, cg), cb) - np.minimum(np.minimum(cr, cg), cb)) / 255.0

    # 5. Emissive map: isolate high-chroma amber text, screen graphics, LEDs, and panel markings
    amber_score = np.clip(((cr - cb) - 90.0) / 90.0, 0.0, 1.0) * np.clip((cr - 140.0) / 85.0, 0.0, 1.0)
    amber_mask = (amber_score * (fg_core.astype(np.float32))).astype(np.float32)
    emissive_core = base_color_bgr.astype(np.float32) * amber_mask[:, :, np.newaxis]
    emissive_glow = cv2.GaussianBlur(emissive_core, (0, 0), sigmaX=2.2)
    emissive_bgr = np.clip(emissive_core * 0.90 + emissive_glow * 0.45, 0, 255).astype(np.uint8)

    # 6. Roughness map:
    # - Amber markings / glass screen interior: glossy 0.22
    # - Anodized bronze panels (moderate chroma, mid luma): satin 0.42
    # - Obsidian tactical armor & rubberized grips: matte 0.56
    bronze_ness = np.clip((cr - cb - 35.0) / 80.0, 0.0, 1.0) * (1.0 - amber_score)
    roughness = 0.56 - 0.14 * bronze_ness - 0.32 * amber_score - 0.08 * cluma
    roughness_u8 = np.clip(roughness * 255.0, 38, 220).astype(np.uint8)

    # 7. Metallic map:
    # Keep dielectric/satin low (0.04 - 0.22) so macOS Quick Look and Three.js diffuse + specular
    # lighting stays bright and never collapses to dark mirror-black
    silver_bolt = np.clip((cluma - 0.48) * 2.0, 0.0, 1.0) * np.clip(1.0 - cchroma * 3.0, 0.0, 1.0)
    metallic = (0.04 + 0.12 * bronze_ness + 0.28 * silver_bolt) * (1.0 - amber_score)
    metallic_u8 = np.clip(metallic * 255.0, 0, 120).astype(np.uint8)

    # 8. Multi-scale Sobel Tangent-Space Normal Map from de-haloed luminance
    luma_smooth = cv2.GaussianBlur(cluma, (5, 5), 1.1)
    gx_fine = cv2.Sobel(luma_smooth, cv2.CV_32F, 1, 0, ksize=3)
    gy_fine = cv2.Sobel(luma_smooth, cv2.CV_32F, 0, 1, ksize=3)
    gx_med = cv2.Sobel(luma_smooth, cv2.CV_32F, 1, 0, ksize=5)
    gy_med = cv2.Sobel(luma_smooth, cv2.CV_32F, 0, 1, ksize=5)

    nx = -(gx_fine * 1.4 + gx_med * 0.40)
    ny = (gy_fine * 1.4 + gy_med * 0.40)  # OpenGL +Y up
    nz = np.ones_like(nx)
    norm_len = np.sqrt(nx * nx + ny * ny + nz * nz + 1e-8)
    nx /= norm_len
    ny /= norm_len
    nz /= norm_len

    normal_bgr = np.zeros_like(base_color_bgr)
    normal_bgr[:, :, 2] = np.clip((nx * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8)  # R = X
    normal_bgr[:, :, 1] = np.clip((ny * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8)  # G = Y
    normal_bgr[:, :, 0] = np.clip((nz * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8)  # B = Z

    # Crop to [CROP_Y0:CROP_Y0+CROP_H, CROP_X0:CROP_X0+CROP_W] and resize to (1024, 2048)
    def crop_and_resize(arr, target_size=(1024, 2048), interp=cv2.INTER_AREA):
        cropped = arr[CROP_Y0 : CROP_Y0 + CROP_H, CROP_X0 : CROP_X0 + CROP_W]
        return cv2.resize(cropped, target_size, interpolation=interp)

    return {
        "base_color": crop_and_resize(base_color_bgr, (1024, 2048)),
        "emissive": crop_and_resize(emissive_bgr, (1024, 2048)),
        "roughness": crop_and_resize(roughness_u8, (512, 1024)),
        "metallic": crop_and_resize(metallic_u8, (512, 1024)),
        "normal": crop_and_resize(normal_bgr, (512, 1024), interp=cv2.INTER_AREA),
    }


def synthesize_textures_in_python():
    import cv2
    import numpy as np

    os.makedirs(TEX_DIR, exist_ok=True)
    front_bgr = cv2.imread(FRONT_REF_PATH, cv2.IMREAD_COLOR)
    back_bgr = cv2.imread(BACK_REF_PATH, cv2.IMREAD_COLOR)
    mp3_bgr = cv2.imread(MP3_SCREEN_REF_PATH, cv2.IMREAD_COLOR)
    if front_bgr is None:
        raise FileNotFoundError(f"Missing front reference: {FRONT_REF_PATH}")
    if back_bgr is None:
        raise FileNotFoundError(f"Missing back reference: {BACK_REF_PATH}")
    if mp3_bgr is None:
        raise FileNotFoundError(f"Missing MP3 screen reference: {MP3_SCREEN_REF_PATH}")

    # Rotate front portrait (1536x2752) -> landscape (2752x1536), bake MP3 screen graphics
    # from assets/mp3.jpeg onto the recessed screen cavity (x: 718..2034, y: 334..728),
    # patch "DOOM TRACKS" on the top nameplate, and rotate back to portrait (1536x2752).
    front_land = cv2.rotate(front_bgr, cv2.ROTATE_90_CLOCKWISE)

    sx0, sy0, sx1, sy1 = 718, 334, 2034, 728
    sw_scr, sh_scr = sx1 - sx0, sy1 - sy0
    alpha_mask = np.ones((sh_scr, sw_scr), dtype=np.float32)
    feather = 8
    for i in range(feather):
        w_f = (i + 1) / float(feather)
        alpha_mask[i, :] = np.minimum(alpha_mask[i, :], w_f)
        alpha_mask[sh_scr - 1 - i, :] = np.minimum(alpha_mask[sh_scr - 1 - i, :], w_f)
        alpha_mask[:, i] = np.minimum(alpha_mask[:, i], w_f)
        alpha_mask[:, sw_scr - 1 - i] = np.minimum(alpha_mask[:, sw_scr - 1 - i], w_f)
    alpha_3c = alpha_mask[:, :, np.newaxis]

    front_scr_region = front_land[sy0:sy1, sx0:sx1].astype(np.float32)
    mp3_scr_region = mp3_bgr[sy0:sy1, sx0:sx1].astype(np.float32)
    front_land[sy0:sy1, sx0:sx1] = np.clip(
        front_scr_region * (1.0 - alpha_3c) + mp3_scr_region * alpha_3c, 0, 255
    ).astype(np.uint8)

    front_land_patched = draw_doom_tracks_on_landscape(front_land)
    front_patched_bgr = cv2.rotate(front_land_patched, cv2.ROTATE_90_COUNTERCLOCKWISE)

    # Rotate the inner PLATODOOM-INC nameplate text region (y: 1218..1532, x: 442..592) 180 deg
    # so that when mapped onto the 3D rear embossed slot (1.0 - sx) and orbited 180 deg in
    # Three.js landscape space (yaw = Math.PI), "PLATODOOM-INC / MODEL NO: SYS-990-AMBER"
    # reads upright and left-to-right while preserving 100% alignment with the 3D rear geometry.
    back_bgr[1218:1532, 442:592] = cv2.rotate(back_bgr[1218:1532, 442:592], cv2.ROTATE_180)

    front_maps = dehalo_and_extract_pbr_channels(front_patched_bgr)
    back_maps = dehalo_and_extract_pbr_channels(back_bgr)

    paths = {}
    for key in ("base_color", "emissive", "roughness", "metallic", "normal"):
        combined = np.hstack([front_maps[key], back_maps[key]])
        # Also save lossless PNGs + high-Q JPEGs for base_color/emissive so glTF stays <= 2.5 MB
        png_path = os.path.join(TEX_DIR, f"{key}.png")
        cv2.imwrite(png_path, combined)
        if key in ("base_color", "emissive"):
            jpg_path = os.path.join(TEX_DIR, f"{key}.jpg")
            cv2.imwrite(jpg_path, combined, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            paths[key] = jpg_path
        else:
            paths[key] = png_path

    print("[Stage 1] Synthesized Front|Back PBR + Emissive texture suite:")
    for k, p in paths.items():
        print(f"  - {k}: {p} ({os.path.getsize(p) / 1024:.1f} KB)")
    return paths


def run_blender_stage():
    import bpy
    import bmesh

    print("[Stage 2] Initializing Blender scene...")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE_GLB_PATH)

    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not mesh_objs:
        raise RuntimeError(f"No mesh objects found in {SOURCE_GLB_PATH}")

    bpy.ops.object.select_all(action="DESELECT")
    for obj in mesh_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_objs[0]
    if len(mesh_objs) > 1:
        bpy.ops.object.join()

    target_obj = bpy.context.view_layer.objects.active
    target_obj.name = "AudioDevice_MP3"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    orig_tris = len(target_obj.data.polygons)
    print(f"[Stage 2] Original triangle count: {orig_tris}")

    # 1. Apply Collapse Decimate Modifier (ratio = 0.13 -> ~5,200 triangles, <= 6,000 budget)
    dec_mod = target_obj.modifiers.new(name="Decimate_MP3", type="DECIMATE")
    dec_mod.decimate_type = "COLLAPSE"
    dec_mod.ratio = 0.13
    dec_mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=dec_mod.name)

    # Recompute smooth normals
    bpy.ops.object.shade_smooth()

    mesh = target_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    bm.normal_update()

    # Note on Blender Z-up vs glTF Y-up coordinate mapping after transform_apply:
    # Blender (co.x, co.y, co.z) corresponds to glTF (X_gltf, -Z_gltf, Y_gltf):
    #   - X_gltf = co.x  in [-0.697, +0.697]
    #   - Y_gltf = co.z  in [-1.018, +1.010]
    #   - Z_gltf = -co.y in [-0.132, +0.127] (+Z_gltf = Front, -Z_gltf = Back)
    xs_gltf = [v.co.x for v in bm.verts]
    ys_gltf = [v.co.z for v in bm.verts]
    zs_gltf = [-v.co.y for v in bm.verts]
    min_x, max_x = min(xs_gltf), max(xs_gltf)
    min_y, max_y = min(ys_gltf), max(ys_gltf)
    min_z, max_z = min(zs_gltf), max(zs_gltf)
    span_x = max(1e-6, max_x - min_x)
    span_y = max(1e-6, max_y - min_y)
    span_z = max(1e-6, max_z - min_z)

    print(
        f"[Stage 2] Decimated glTF bounds: X=[{min_x:.4f}, {max_x:.4f}], "
        f"Y=[{min_y:.4f}, {max_y:.4f}], Z=[{min_z:.4f}, {max_z:.4f}], "
        f"verts={len(bm.verts)}, tris={len(bm.faces)}"
    )

    uv_layer = bm.loops.layers.uv.verify()

    for face in bm.faces:
        fn_x = face.normal.x
        fn_y = face.normal.z
        fn_z = -face.normal.y  # glTF +Z normal (positive = Front, negative = Back)

        is_back = fn_z < -0.15
        is_steep_side = abs(fn_z) < 0.30

        for loop in face.loops:
            co = loop.vert.co
            x_gltf = co.x
            y_gltf = co.z
            z_gltf = -co.y

            sx = (x_gltf - min_x) / span_x
            sy = (y_gltf - min_y) / span_y
            z_rel = (z_gltf - min_z) / span_z - 0.5

            if not is_back:
                # Front & side perimeter mapped to Left half of atlas u in [0.0, 0.5]
                x_px = FG_X_MIN + sx * (FG_X_MAX - FG_X_MIN)
                y_px = FG_Y_MAX - sy * (FG_Y_MAX - FG_Y_MIN)
                u = 0.5 * ((x_px - CROP_X0) / CROP_W)
                v = 1.0 - ((y_px - CROP_Y0) / CROP_H)
                if is_steep_side:
                    u += fn_x * z_rel * 0.0025
                    v += fn_y * z_rel * 0.0040
                u = max(0.002, min(0.498, u))
                v = max(0.002, min(0.998, v))
            else:
                # Backplate mapped to Right half of atlas u in [0.5, 1.0]
                # Rear view (-Z facing camera, +Y up) has horizontal axis along -X_local -> (1.0 - sx)
                x_px_back = FG_X_MIN + (1.0 - sx) * (FG_X_MAX - FG_X_MIN)
                y_px_back = FG_Y_MAX - sy * (FG_Y_MAX - FG_Y_MIN)
                u = 0.5 + 0.5 * ((x_px_back - CROP_X0) / CROP_W)
                v = 1.0 - ((y_px_back - CROP_Y0) / CROP_H)
                if is_steep_side:
                    u -= fn_x * z_rel * 0.0025
                    v += fn_y * z_rel * 0.0040
                u = max(0.502, min(0.998, u))
                v = max(0.002, min(0.998, v))

            loop[uv_layer].uv = (u, v)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # Build Principled BSDF PBR + Emissive Material
    mat = bpy.data.materials.new(name="AudioDevice_PBR_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    out_node.location = (450, 0)

    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    def add_tex_node(name, path, is_data, loc):
        tex = nodes.new(type="ShaderNodeTexImage")
        tex.name = name
        tex.label = name
        img = bpy.data.images.load(path, check_existing=True)
        img.colorspace_settings.name = "Non-Color" if is_data else "sRGB"
        tex.image = img
        tex.location = loc
        return tex

    tex_base = add_tex_node(
        "BaseColor", os.path.join(TEX_DIR, "base_color.jpg"), False, (-520, 320)
    )
    tex_metal = add_tex_node(
        "Metallic", os.path.join(TEX_DIR, "metallic.png"), True, (-520, 80)
    )
    tex_rough = add_tex_node(
        "Roughness", os.path.join(TEX_DIR, "roughness.png"), True, (-520, -160)
    )
    tex_norm = add_tex_node(
        "Normal", os.path.join(TEX_DIR, "normal.png"), True, (-520, -400)
    )
    tex_emis = add_tex_node(
        "Emissive", os.path.join(TEX_DIR, "emissive.jpg"), False, (-520, -640)
    )

    links.new(tex_base.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex_metal.outputs["Color"], bsdf.inputs["Metallic"])
    links.new(tex_rough.outputs["Color"], bsdf.inputs["Roughness"])

    norm_map = nodes.new(type="ShaderNodeNormalMap")
    norm_map.location = (-200, -400)
    norm_map.inputs["Strength"].default_value = 0.85
    links.new(tex_norm.outputs["Color"], norm_map.inputs["Color"])
    links.new(norm_map.outputs["Normal"], bsdf.inputs["Normal"])

    if "Emission Color" in bsdf.inputs:
        links.new(tex_emis.outputs["Color"], bsdf.inputs["Emission Color"])
    elif "Emission" in bsdf.inputs:
        links.new(tex_emis.outputs["Color"], bsdf.inputs["Emission"])

    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = 2.2

    mesh.materials.clear()
    mesh.materials.append(mat)

    print(f"[Stage 2] Exporting {OUTPUT_ROOT_GLB}...")
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_ROOT_GLB,
        export_format="GLB",
        export_image_format="JPEG",
        export_jpeg_quality=93,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
    )
    shutil.copy2(OUTPUT_ROOT_GLB, OUTPUT_ASSETS_GLB)
    print(
        f"[Stage 2] Export complete: {OUTPUT_ROOT_GLB} "
        f"({os.path.getsize(OUTPUT_ROOT_GLB) / (1024 * 1024):.2f} MB) "
        f"and {OUTPUT_ASSETS_GLB}"
    )


if __name__ == "__main__":
    if "--blender-stage" in sys.argv:
        run_blender_stage()
    else:
        synthesize_textures_in_python()
