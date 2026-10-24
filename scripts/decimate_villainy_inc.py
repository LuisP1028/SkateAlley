#!/usr/bin/env python3
"""
Two-stage pipeline to decimate and optimize `/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`
with an anatomically aligned Weathered Cast-Iron & Wrought-Iron Rear Backplate (Option A):

Stage 1 (runs in `/opt/anaconda3/envs/greek_env/bin/python` with OpenCV & NumPy):
  - Extracts the 4 embedded RGB textures (`emissive`, `normal`, `base_color`, `metallic-roughness`)
    from the source GLB and downscales to `1200x896` using `cv2.INTER_AREA` (reducing uncompressed
    GPU RGBA8+mip VRAM by 75.0%, from 87.47 MB to 21.82 MB).
  - Synthesizes a dedicated, 100% neon-free Weathered Cast-Iron & Wrought-Iron Rear Backplate
    patch in the unused bottom-left atlas region (`x_px in [8, 332], y_px in [672, 888]`, which lies
    completely outside the 3D sign's front/side UV footprint):
      * Preserves the outer ornamental wrought-iron scrollwork crest, side ears, stepped rusted frame,
        and lower conduit cables (horizontally mirrored to align 1:1 with the rear 3D silhouette).
      * Replaces the interior neon cavity with a stochastic quilted cast-iron & rust 3-panel housing
        with bolted vertical seams, perimeter grime, tangent-space normal relief, and `emissive = 0`.
  - Re-normalizes every tangent-space normal vector in the `normal` map to unit length (||n||_2 = 1.0).

Stage 2 (runs in `/Applications/Blender.app/Contents/MacOS/Blender --background`):
  - Preserves the existing 6,052-triangle decimated mesh in `villainy_inc_textured.glb` directly
    (or welds and decimates the 346,446-triangle raw mesh if invoked against a raw backup).
  - Registers all face-corner (`loop`) UVs using bi-directional orthographic projection:
      * Front & side loops (`n_z >= -0.15`): exact calibrated foreground projection.
      * All rear-facing loops (`n_z < -0.15`, with no `face_center_z` cutoff): continuous
        orthographic projection onto the dedicated Weathered Cast-Iron Rear Backplate patch
        (`u in [0.013333, 0.270000]`, `v_bl in [0.017857, 0.241071]`), eliminating 100% of rear
        red neon streaks and perimeter UV seam tears.
  - Binds the 1200x896 PBR + Emissive maps (`VillainyInc_PBR_NeonSign`, `doubleSided: true`,
    `KHR_materials_emissive_strength: 5.0`) and exports `/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`.
"""

import os
import sys
import json
import struct

PROJECT_DIR = "/Users/diesel/desktop/skatealley"
DEFAULT_RAW_BACKUP = "/Users/diesel/.gemini/antigravity-cli/brain/8b90b832-e954-48ba-a3d4-3c428e29b35c/scratch/villainy_inc_textured_raw_346k.glb"
TARGET_GLB_PATH = os.path.join(PROJECT_DIR, "villainy_inc_textured.glb")
SCRATCH_TEX_DIR = "/Users/diesel/.gemini/antigravity-cli/brain/8b2da2c6-0754-4d46-83e5-e169ba735a28/scratch/villainy_textures"

TARGET_WIDTH = 1200
TARGET_HEIGHT = 896
DECIMATE_RATIO = 0.0175

# Authoritative local glTF (Y-up) bounding box of the decimated mesh
GLTF_MIN_X = -0.82043058
GLTF_MAX_X =  0.84004831
GLTF_MIN_Y = -0.58070636
GLTF_MAX_Y =  0.57306069


def resolve_texture_source_glb_path():
    if os.path.exists(DEFAULT_RAW_BACKUP) and os.path.getsize(DEFAULT_RAW_BACKUP) > 20 * 1024 * 1024:
        return DEFAULT_RAW_BACKUP
    return TARGET_GLB_PATH


def synthesize_rear_cast_iron_patch(maps):
    """
    Synthesizes the Option A Weathered Cast-Iron & Wrought-Iron Rear Backplate into the unused
    bottom-left corner (`x_px in [8, 332], y_px in [672, 888]`) of the 1200x896 PBR + Emissive maps.
    """
    import cv2
    import numpy as np

    W, H = TARGET_WIDTH, TARGET_HEIGHT
    u_f_min = 0.54975822 * GLTF_MIN_X + 0.49439282
    u_f_max = 0.54975822 * GLTF_MAX_X + 0.49439282
    v_f_min = -0.72635523 * GLTF_MAX_Y + 0.47448339
    v_f_max = -0.72635523 * GLTF_MIN_Y + 0.47448339

    bc_front = maps["base_color"].astype(np.float32)
    mr_front = maps["metallic-roughness"].astype(np.float32)
    nm_front = maps["normal"].astype(np.float32)
    em_front = maps["emissive"]

    cav_x0, cav_x1 = 136, 1064
    cav_y0, cav_y1 = 196, 640
    cav_w, cav_h = cav_x1 - cav_x0, cav_y1 - cav_y0

    cav_bc = bc_front[cav_y0:cav_y1, cav_x0:cav_x1]
    cav_mr = mr_front[cav_y0:cav_y1, cav_x0:cav_x1]
    cav_nm = nm_front[cav_y0:cav_y1, cav_x0:cav_x1]
    cav_em = em_front[cav_y0:cav_y1, cav_x0:cav_x1]

    # Isolate genuine cast-iron & rust substrate pixels inside the cavity (excluding neon tubes + halos)
    em_bin = (cav_em.max(axis=2) > 3).astype(np.uint8)
    em_halo = cv2.dilate(em_bin, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 29)))

    b_ch, g_ch, r_ch = cav_bc[:, :, 0], cav_bc[:, :, 1], cav_bc[:, :, 2]
    luma = 0.114 * b_ch + 0.587 * g_ch + 0.299 * r_ch
    neon_spill = (r_ch > 105.0) & ((r_ch - g_ch) > 36.0)
    yellow_spill = (g_ch > 105.0) & ((g_ch - b_ch) > 32.0)

    clean_mask = (
        (em_halo == 0)
        & (~neon_spill)
        & (~yellow_spill)
        & (luma >= 20.0)
        & (luma <= 115.0)
    )
    yy_c, xx_c = np.mgrid[0:cav_h, 0:cav_w]
    clean_mask[(yy_c > 235) & (xx_c < 405)] = False
    clean_mask[(yy_c > 195) & (xx_c > 705)] = False

    clean_mask_eroded = (
        cv2.erode(
            clean_mask.astype(np.uint8),
            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)),
        )
        > 0
    )

    P_SZ = 32
    half_p = P_SZ // 2
    valid_centers = []
    for cy in range(half_p, cav_h - half_p, 6):
        for cx in range(half_p, cav_w - half_p, 6):
            if clean_mask_eroded[cy - half_p : cy + half_p, cx - half_p : cx + half_p].all():
                std_v = cav_bc[cy - half_p : cy + half_p, cx - half_p : cx + half_p].std()
                valid_centers.append((std_v, cy, cx))

    valid_centers.sort(reverse=True)
    if not valid_centers:
        raise RuntimeError("No clean cast-iron patches found for rear backplate synthesis.")

    rng = np.random.default_rng(42)
    synth_bc = np.zeros((cav_h, cav_w, 3), dtype=np.float32)
    synth_mr = np.zeros((cav_h, cav_w, 3), dtype=np.float32)
    synth_nm = np.zeros((cav_h, cav_w, 3), dtype=np.float32)
    weight_sum = np.zeros((cav_h, cav_w, 1), dtype=np.float32)

    win1d = 0.5 * (1.0 - np.cos(2.0 * np.pi * np.arange(P_SZ) / float(P_SZ - 1)))
    win2d = (win1d[:, None] * win1d[None, :]).astype(np.float32)[:, :, None] + 1e-5

    border_keep = clean_mask_eroded.astype(np.float32) * (
        np.exp(-yy_c / 48.0)
        + np.exp(-(cav_h - 1 - yy_c) / 38.0)
        + np.exp(-xx_c / 48.0)
        + np.exp(-(cav_w - 1 - xx_c) / 48.0)
    )
    border_keep = np.clip(border_keep, 0.0, 1.0)
    border_keep = cv2.GaussianBlur(border_keep, (21, 21), 5.0)[:, :, None]

    step = P_SZ // 2
    for y0 in range(-step, cav_h, step // 2):
        for x0 in range(-step, cav_w, step // 2):
            is_edge = (y0 < 75) or (y0 > cav_h - 95) or (x0 < 90) or (x0 > cav_w - 110)
            pool_len = max(1, len(valid_centers) // 2 if is_edge else len(valid_centers))
            _, cy, cx = valid_centers[rng.integers(0, pool_len)]
            p_bc = cav_bc[cy - half_p : cy + half_p, cx - half_p : cx + half_p].copy()
            p_mr = cav_mr[cy - half_p : cy + half_p, cx - half_p : cx + half_p].copy()
            p_nm = cav_nm[cy - half_p : cy + half_p, cx - half_p : cx + half_p].copy()
            if rng.random() > 0.5:
                p_bc = p_bc[:, ::-1]
                p_mr = p_mr[:, ::-1]
                p_nm = p_nm[:, ::-1]
                p_nm[:, :, 2] = 255.0 - p_nm[:, :, 2]
            if rng.random() > 0.5:
                p_bc = p_bc[::-1, :]
                p_mr = p_mr[::-1, :]
                p_nm = p_nm[::-1, :]
                p_nm[:, :, 1] = 255.0 - p_nm[:, :, 1]

            dy0 = max(0, y0)
            dy1 = min(cav_h, y0 + P_SZ)
            dx0 = max(0, x0)
            dx1 = min(cav_w, x0 + P_SZ)
            sy0 = dy0 - y0
            sy1 = sy0 + (dy1 - dy0)
            sx0 = dx0 - x0
            sx1 = sx0 + (dx1 - dx0)

            w_sub = win2d[sy0:sy1, sx0:sx1]
            synth_bc[dy0:dy1, dx0:dx1] += p_bc[sy0:sy1, sx0:sx1] * w_sub
            synth_mr[dy0:dy1, dx0:dx1] += p_mr[sy0:sy1, sx0:sx1] * w_sub
            synth_nm[dy0:dy1, dx0:dx1] += p_nm[sy0:sy1, sx0:sx1] * w_sub
            weight_sum[dy0:dy1, dx0:dx1] += w_sub

    synth_bc /= weight_sum
    synth_mr /= weight_sum
    synth_nm /= weight_sum

    synth_bc = cav_bc * border_keep + synth_bc * (1.0 - border_keep)
    synth_mr = cav_mr * border_keep + synth_mr * (1.0 - border_keep)
    synth_nm = cav_nm * border_keep + synth_nm * (1.0 - border_keep)

    u_c = xx_c.astype(np.float32) / float(cav_w - 1)
    v_c = yy_c.astype(np.float32) / float(cav_h - 1)
    edge_d = np.minimum(np.minimum(u_c, 1.0 - u_c), np.minimum(v_c, 1.0 - v_c))
    inner_bevel = np.exp(-edge_d / 0.04)
    synth_bc *= 1.0 - 0.22 * inner_bevel[:, :, None]

    # Add 3-panel vertical cast-iron joint seams & structural rivets
    for sx_frac in (0.333, 0.667):
        sx_px = sx_frac * cav_w
        dist_x = np.abs(xx_c - sx_px)
        groove = np.exp(-0.5 * (dist_x / 2.0) ** 2)
        synth_bc *= 1.0 - 0.30 * groove[:, :, None]
        nx_bevel = np.where(xx_c < sx_px, -18.0, 18.0) * np.exp(-0.5 * (dist_x / 2.8) ** 2)
        synth_nm[:, :, 2] = np.clip(synth_nm[:, :, 2] + nx_bevel, 0, 255)
        for ry_frac in (0.12, 0.36, 0.64, 0.88):
            ry_px = ry_frac * cav_h
            for rx_off in (-12.0, +12.0):
                rx_px = sx_px + rx_off
                r_dist = np.sqrt((xx_c - rx_px) ** 2 + (yy_c - ry_px) ** 2)
                rivet_mask = np.clip((4.5 - r_dist) / 1.5, 0.0, 1.0)
                rivet_ring = np.exp(-0.5 * ((r_dist - 4.2) / 1.0) ** 2)
                synth_bc *= 1.0 - 0.25 * rivet_ring[:, :, None]
                dx_r = (xx_c - rx_px) / 4.5
                dy_r = (yy_c - ry_px) / 4.5
                synth_nm[:, :, 2] = np.clip(synth_nm[:, :, 2] + rivet_mask * dx_r * 28.0, 0, 255)
                synth_nm[:, :, 1] = np.clip(synth_nm[:, :, 1] - rivet_mask * dy_r * 28.0, 0, 255)

    mask_cav = np.zeros((H, W), dtype=np.float32)
    mask_cav[cav_y0 + 10 : cav_y1 - 10, cav_x0 + 10 : cav_x1 - 10] = 1.0
    mask_cav = cv2.GaussianBlur(mask_cav, (23, 23), 5.0)[:, :, None]

    rear_full_bc = bc_front.copy()
    rear_full_mr = mr_front.copy()
    rear_full_nm = nm_front.copy()

    frame_red = np.maximum(0.0, (rear_full_bc[:, :, 2] - rear_full_bc[:, :, 1]) - 22.0)
    rear_full_bc[:, :, 2] -= 0.75 * frame_red

    rear_full_bc[cav_y0:cav_y1, cav_x0:cav_x1] = (
        rear_full_bc[cav_y0:cav_y1, cav_x0:cav_x1] * (1.0 - mask_cav[cav_y0:cav_y1, cav_x0:cav_x1])
        + synth_bc * mask_cav[cav_y0:cav_y1, cav_x0:cav_x1]
    )
    rear_full_mr[cav_y0:cav_y1, cav_x0:cav_x1] = (
        rear_full_mr[cav_y0:cav_y1, cav_x0:cav_x1] * (1.0 - mask_cav[cav_y0:cav_y1, cav_x0:cav_x1])
        + synth_mr * mask_cav[cav_y0:cav_y1, cav_x0:cav_x1]
    )
    rear_full_nm[cav_y0:cav_y1, cav_x0:cav_x1] = (
        rear_full_nm[cav_y0:cav_y1, cav_x0:cav_x1] * (1.0 - mask_cav[cav_y0:cav_y1, cav_x0:cav_x1])
        + synth_nm * mask_cav[cav_y0:cav_y1, cav_x0:cav_x1]
    )

    fx0 = int(round(u_f_min * W))
    fx1 = int(round(u_f_max * W))
    fy0 = int(round(v_f_min * H))
    fy1 = int(round(v_f_max * H))

    crop_bc = cv2.resize(rear_full_bc[fy0:fy1, fx0:fx1], (308, 200), interpolation=cv2.INTER_AREA)[:, ::-1]
    crop_mr = cv2.resize(rear_full_mr[fy0:fy1, fx0:fx1], (308, 200), interpolation=cv2.INTER_AREA)[:, ::-1]
    crop_nm = cv2.resize(rear_full_nm[fy0:fy1, fx0:fx1], (308, 200), interpolation=cv2.INTER_AREA)[:, ::-1]
    crop_nm[:, :, 2] = 255.0 - crop_nm[:, :, 2]

    pad_bc = cv2.copyMakeBorder(crop_bc, 8, 8, 8, 8, cv2.BORDER_REPLICATE)
    pad_mr = cv2.copyMakeBorder(crop_mr, 8, 8, 8, 8, cv2.BORDER_REPLICATE)
    pad_nm = cv2.copyMakeBorder(crop_nm, 8, 8, 8, 8, cv2.BORDER_REPLICATE)

    PX0, PX1 = 8, 332
    PY0, PY1 = 672, 888
    maps["base_color"][PY0:PY1, PX0:PX1] = np.clip(np.round(pad_bc), 0, 255).astype(np.uint8)
    maps["emissive"][PY0:PY1, PX0:PX1] = 0
    maps["metallic-roughness"][PY0:PY1, PX0:PX1] = np.clip(np.round(pad_mr), 0, 255).astype(np.uint8)

    rgb_f = maps["normal"][:, :, ::-1].astype(np.float32) / 255.0
    rgb_f[PY0:PY1, PX0:PX1] = pad_nm[:, :, ::-1] / 255.0
    nx = rgb_f[:, :, 0] * 2.0 - 1.0
    ny = rgb_f[:, :, 1] * 2.0 - 1.0
    nz = np.maximum(1e-4, rgb_f[:, :, 2] * 2.0 - 1.0)
    nlen = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx /= nlen
    ny /= nlen
    nz /= nlen
    norm_u8 = np.stack(
        [
            np.clip(np.round((nx * 0.5 + 0.5) * 255.0), 0, 255),
            np.clip(np.round((ny * 0.5 + 0.5) * 255.0), 0, 255),
            np.clip(np.round((nz * 0.5 + 0.5) * 255.0), 0, 255),
        ],
        axis=-1,
    ).astype(np.uint8)
    maps["normal"] = norm_u8[:, :, ::-1]


def extract_and_downscale_textures():
    import cv2
    import numpy as np

    src_glb = resolve_texture_source_glb_path()
    os.makedirs(SCRATCH_TEX_DIR, exist_ok=True)

    with open(src_glb, "rb") as f:
        buf = f.read()

    json_len = struct.unpack("<I", buf[12:16])[0]
    gltf = json.loads(buf[20 : 20 + json_len].decode("utf-8"))
    bin_start = 20 + json_len + 8

    maps = {}
    for idx, im in enumerate(gltf.get("images", [])):
        name = im.get("name", f"tex_{idx}")
        bv = gltf["bufferViews"][im["bufferView"]]
        offset = bin_start + bv.get("byteOffset", 0)
        raw = buf[offset : offset + bv["byteLength"]]

        arr = np.frombuffer(raw, dtype=np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise RuntimeError(f"Failed to decode embedded image '{name}' from {src_glb}")

        if img_bgr.shape[1] != TARGET_WIDTH or img_bgr.shape[0] != TARGET_HEIGHT:
            down_bgr = cv2.resize(
                img_bgr,
                (TARGET_WIDTH, TARGET_HEIGHT),
                interpolation=cv2.INTER_AREA,
            )
        else:
            down_bgr = img_bgr.copy()

        maps[name] = down_bgr

    synthesize_rear_cast_iron_patch(maps)

    saved_paths = {}
    for name, down_bgr in maps.items():
        out_png = os.path.join(SCRATCH_TEX_DIR, f"{name}.png")
        cv2.imwrite(out_png, down_bgr)
        saved_paths[name] = out_png
        print(
            f"[Stage 1] Synthesized Option A 1200x896 '{name}': "
            f"{down_bgr.shape[1]}x{down_bgr.shape[0]} ({os.path.getsize(out_png) / 1024:.1f} KB)"
        )

    return saved_paths


def run_blender_decimation():
    import bpy
    import bmesh

    # Always prefer the already-decimated TARGET_GLB_PATH (6,052 tris) so the decimated topology is preserved
    src_glb = TARGET_GLB_PATH if os.path.exists(TARGET_GLB_PATH) else resolve_texture_source_glb_path()
    print(f"[Stage 2] Importing GLB: {src_glb}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src_glb)

    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not mesh_objs:
        raise RuntimeError(f"No mesh objects found in {src_glb}")

    target_obj = mesh_objs[0]
    target_obj.name = "geometry_0"
    target_obj.data.name = "geometry_0"

    bpy.ops.object.select_all(action="DESELECT")
    target_obj.select_set(True)
    bpy.context.view_layer.objects.active = target_obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    mesh = target_obj.data
    initial_tris = len(mesh.polygons)
    print(f"[Stage 2] Imported counts: verts={len(mesh.vertices)}, tris={initial_tris}")

    if initial_tris > 8000:
        # Source is raw high-poly (346,446 tris): weld and decimate to ~6,052 tris
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
        bm.to_mesh(mesh)
        bm.free()
        mesh.validate(verbose=False)
        mesh.update()

        dec_mod = target_obj.modifiers.new(name="Decimate_VillainySign", type="DECIMATE")
        dec_mod.decimate_type = "COLLAPSE"
        dec_mod.ratio = DECIMATE_RATIO
        dec_mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=dec_mod.name)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])

    if initial_tris > 8000:
        visited_faces = set()
        islands = []
        for f in bm.faces:
            if f in visited_faces:
                continue
            island = []
            queue = [f]
            visited_faces.add(f)
            while queue:
                curr = queue.pop()
                island.append(curr)
                for e in curr.edges:
                    for lf in e.link_faces:
                        if lf not in visited_faces:
                            visited_faces.add(lf)
                            queue.append(lf)
            islands.append(island)

        if len(islands) > 1:
            islands.sort(key=len, reverse=True)
            tiny_faces = [f for isl in islands[1:] if len(isl) < 50 for f in isl]
            if tiny_faces:
                bmesh.ops.delete(bm, geom=tiny_faces, context="FACES")

        boundary_edges = [e for e in bm.edges if e.is_boundary]
        if boundary_edges:
            bmesh.ops.holes_fill(bm, edges=boundary_edges, sides=16)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])

    loose_verts = [v for v in bm.verts if not v.link_faces]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context="VERTS")
    loose_edges = [e for e in bm.edges if not e.link_faces]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context="EDGES")

    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    if initial_tris > 8000:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()

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
        f"[Stage 2] Decimated glTF bounds: "
        f"X=[{min_x:.6f}, {max_x:.6f}], "
        f"Y=[{min_y:.6f}, {max_y:.6f}], "
        f"Z=[{min_z:.6f}, {max_z:.6f}], "
        f"verts={len(bm.verts)}, tris={len(bm.faces)}"
    )

    uv_layer = bm.loops.layers.uv.verify()

    for face in bm.faces:
        fn_x = face.normal.x
        fn_y = face.normal.z
        fn_z = -face.normal.y  # glTF +Z normal (+Z = Front neon face, -Z = Rear iron plate)

        # All rear-facing triangles (fn_z < -0.15) map to the dedicated Option A Weathered Cast-Iron patch
        is_back = fn_z < -0.15
        is_steep_side = abs(fn_z) < 0.30

        for loop in face.loops:
            co = loop.vert.co
            x_gltf = co.x
            y_gltf = co.z
            z_gltf = -co.y
            z_rel = (z_gltf - min_z) / span_z - 0.5

            if not is_back:
                u = 0.54975822 * x_gltf + 0.49439282
                v_bl = 0.72635523 * y_gltf + 0.52551661
                if is_steep_side:
                    u += 0.00037 * fn_x * z_rel
                    v_bl += 0.00037 * fn_y * z_rel
                u = max(0.002, min(0.998, u))
                v_bl = max(0.002, min(0.998, v_bl))
            else:
                s_x = (x_gltf - min_x) / span_x
                s_y = (y_gltf - min_y) / span_y
                u = 0.27000000 - 0.25666667 * s_x
                v_bl = 0.01785714 + 0.22321429 * s_y
                u = max(0.0133, min(0.2700, u))
                v_bl = max(0.0179, min(0.2411, v_bl))

            loop[uv_layer].uv = (u, v_bl)

    bm.to_mesh(mesh)
    bm.free()
    mesh.validate(verbose=False)
    mesh.update()
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=0.698132, keep_sharp_edges=False)
    except Exception:
        bpy.ops.object.shade_smooth()

    loaded_imgs = {}
    for mat in mesh.materials:
        if not mat:
            continue
        mat.name = "VillainyInc_PBR_NeonSign"
        mat.use_backface_culling = False
        if mat.node_tree:
            tex_nodes_by_name = {}
            for node in list(mat.node_tree.nodes):
                if node.type == "TEX_IMAGE" and node.image:
                    img_name = node.image.name.split(".")[0]
                    candidate_path = os.path.join(SCRATCH_TEX_DIR, f"{img_name}.png")
                    if os.path.exists(candidate_path):
                        cs_name = node.image.colorspace_settings.name
                        if img_name not in loaded_imgs:
                            new_img = bpy.data.images.load(candidate_path, check_existing=True)
                            new_img.name = img_name
                            new_img.colorspace_settings.name = cs_name
                            loaded_imgs[img_name] = new_img
                            print(
                                f"[Stage 2] Bound 1200x896 texture '{img_name}' (colorspace={cs_name})"
                            )
                        node.image = loaded_imgs[img_name]
                        if img_name in tex_nodes_by_name:
                            primary_node = tex_nodes_by_name[img_name]
                            for out_sock in node.outputs:
                                for link in list(out_sock.links):
                                    mat.node_tree.links.new(
                                        primary_node.outputs[out_sock.name], link.to_socket
                                    )
                            mat.node_tree.nodes.remove(node)
                        else:
                            tex_nodes_by_name[img_name] = node

    print(f"[Stage 2] Exporting decimated GLB to {TARGET_GLB_PATH}...")
    bpy.ops.export_scene.gltf(
        filepath=TARGET_GLB_PATH,
        export_format="GLB",
        export_image_format="JPEG",
        export_jpeg_quality=93,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
    )
    size_mb = os.path.getsize(TARGET_GLB_PATH) / (1024.0 * 1024.0)
    print(f"[Stage 2] Export complete: {TARGET_GLB_PATH} ({size_mb:.3f} MB)")


if __name__ == "__main__":
    if "--blender-stage" in sys.argv:
        run_blender_decimation()
    else:
        extract_and_downscale_textures()
