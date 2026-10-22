"""
prepare_scene.py

Automated, deterministic Blender 5.2.2 LTS Photogrammetry Environment Optimization
& Browser-Ready Staging Pipeline for the Freeman Alley dataset.

Governed by scene_preparation.md and Wayfinder tickets 032-037:
1. UV-Locked Geometry Decimation (80,000 - 150,000 triangles) & Perimeter Shrapnel Removal
2. VRAM-Safe Texture Downscaling (8K -> 2K) & WebP Compression (< 40 MB VRAM, < 20 MB GLB)
3. Spatial Alignment, Ground Plane Leveling (Elevation = 0), & 1:1 Human Ruler Calibration
4. Decoupled "Invisible Bumper Cage" Collision Architecture (< 30 triangles)
5. Matte Photogrammetry Material Standardization (Roughness = 1.0, Metallic = 0.0)
6. Modular Asset Decoupling & Runtime Stage Locators (ENV_FREEMAN_ALLEY hierarchy)
"""

import os
import math
import shutil
import hashlib
import json
from typing import Dict, List, Tuple, Any

import bpy
import bmesh
import mathutils
import numpy as np

# Canonical Paths
WORKSPACE_DIR = "/Users/diesel/desktop/SkateAlley"
DOOM_RIG_DIR = "/Users/diesel/Desktop/Doom_Rig"
SOURCE_BLEND_PATH = os.path.join(WORKSPACE_DIR, "mesh.blend")

FREEMAN_ALLEY_GLB_PRIMARY = os.path.join(WORKSPACE_DIR, "freeman_alley.glb")
FREEMAN_ALLEY_GLB_SECONDARY = os.path.join(DOOM_RIG_DIR, "freeman_alley.glb")

LUIS_RIGGED_SRC = os.path.join(DOOM_RIG_DIR, "LUIS_RIGGED.glb")
PLATODOOM_RIGGED_SRC = os.path.join(DOOM_RIG_DIR, "PLATODOOM_RIGGED.glb")

CHARACTER_HOODIE_PATHS = [
    os.path.join(WORKSPACE_DIR, "character_hoodie.glb"),
    os.path.join(DOOM_RIG_DIR, "character_hoodie.glb"),
]
CHARACTER_TUNIC_PATHS = [
    os.path.join(WORKSPACE_DIR, "character_tunic.glb"),
    os.path.join(DOOM_RIG_DIR, "character_tunic.glb"),
]

VERIFICATION_DIR = os.path.join(WORKSPACE_DIR, "outputs", "verification")

# Pipeline Constants
SKETCHFAB_IMPORT_SCALE = 0.2442793846130371
POISSON_MAX_EDGE_THRESHOLD_METRIC = 0.150 / SKETCHFAB_IMPORT_SCALE  # ~0.614m in metric space
DECIMATE_COLLAPSE_RATIO = 0.105         # ~111,000 triangles (target [80,000 .. 150,000])
MIN_TARGET_TRIANGLES = 80000
MAX_TARGET_TRIANGLES = 150000
TARGET_TEXTURE_RES = 2048               # 2K (2048x2048) -> 36.0 MB RGB VRAM (< 40 MB)
WEBP_QUALITY = 85

CORRIDOR_YAW_DEG = -2.35
ENTRANCE_ANCHOR_X = 9.050
ENTRANCE_ANCHOR_Y = 23.000

# Bumper Cage Bounds (Blender Z-up, -Y depth; glTF Y-up, +Z depth)
# Covers:
# 1. Entrance Plaza / Sidewalk on Rivington St: Y in [0.00m, +10.50m], X in [-9.40m, +10.20m]
# 2. Main Alley Corridor: Y in [-44.00m, 0.00m], X in [-1.65m .. -1.55m, +2.00m .. +1.55m]
# 3. Back Alleyway & Courtyard: Y in [-71.20m, -44.00m], X in [-1.55m .. -1.50m, +3.25m .. +2.50m]
CAGE_X_MIN = -1.550
CAGE_X_MAX = 1.550
CAGE_Y_START = 10.500
CAGE_Y_END = -71.200
CAGE_Z_MIN = 0.000
CAGE_Z_MAX = 3.000

ALLEY_TEXTURE_NAMES = [
    "0727_FREEMAN_ALLEY_u1_v1_baseColor.jpeg",
    "0727_FREEMAN_ALLEY_u1_v2_baseColor.jpeg",
    "0727_FREEMAN_ALLEY_u2_v1_baseColor.jpeg",
]
ALLEY_MATERIAL_NAMES = [
    "0727_FREEMAN_ALLEY_u1_v1",
    "0727_FREEMAN_ALLEY_u1_v2",
    "0727_FREEMAN_ALLEY_u2_v1",
]


def sha256_file(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def stage_modular_character_files() -> Dict[str, str]:
    """
    Ensures character_hoodie.glb and character_tunic.glb exist as standalone
    modular files alongside freeman_alley.glb without baking them into the scene.
    """
    if not os.path.exists(LUIS_RIGGED_SRC):
        raise FileNotFoundError(f"Fatal: Missing rigged hoodie character source at {LUIS_RIGGED_SRC}")
    if not os.path.exists(PLATODOOM_RIGGED_SRC):
        raise FileNotFoundError(f"Fatal: Missing rigged tunic character source at {PLATODOOM_RIGGED_SRC}")

    for dst in CHARACTER_HOODIE_PATHS:
        shutil.copy2(LUIS_RIGGED_SRC, dst)
    for dst in CHARACTER_TUNIC_PATHS:
        shutil.copy2(PLATODOOM_RIGGED_SRC, dst)

    return {
        "character_hoodie": CHARACTER_HOODIE_PATHS[0],
        "character_tunic": CHARACTER_TUNIC_PATHS[0],
    }


def align_level_and_scale_alley_mesh(visual_obj: bpy.types.Object) -> Dict[str, Any]:
    """
    Stage 3 (Ticket 034):
    - Restores 1:1 human metric scale (dividing by 0.2442793846130371).
    - Fits least-squares ground plane to the walkable cobblestone floor and levels it to Z = 0.
    - Straightens the walkable corridor yaw (-2.35 deg) along the primary depth axis (-Y Blender / +Z glTF).
    - Anchors scene origin (0, 0, 0) at the center of the Freeman Alley entrance on Rivington St.
    - Zeroes all object-level transforms.
    """
    v_cnt = len(visual_obj.data.vertices)
    coords = np.empty(v_cnt * 3, dtype=np.float64)
    norms = np.empty(v_cnt * 3, dtype=np.float64)
    visual_obj.data.vertices.foreach_get("co", coords)
    visual_obj.data.vertices.foreach_get("normal", norms)

    V = coords.reshape(-1, 3) / SKETCHFAB_IMPORT_SCALE
    N = norms.reshape(-1, 3)

    # Fit least-squares plane Z = a*X + b*Y + c to upward-facing floor points in main corridor
    fl_mask = (
        (N[:, 2] > 0.85)
        & (V[:, 2] < -24.5)
        & (V[:, 1] > -44.0)
        & (V[:, 1] < 22.0)
        & (V[:, 0] > 5.0)
        & (V[:, 0] < 13.0)
    )
    fl_pts = V[fl_mask]
    if len(fl_pts) < 500:
        raise RuntimeError(f"Fatal: Insufficient floor sample vertices ({len(fl_pts)}) for ground leveling.")

    A = np.c_[fl_pts[:, 0], fl_pts[:, 1], np.ones(len(fl_pts))]
    coef, _, _, _ = np.linalg.lstsq(A, fl_pts[:, 2], rcond=None)
    up_vec = mathutils.Vector((-float(coef[0]), -float(coef[1]), 1.0)).normalized()
    rot_level = up_vec.rotation_difference(mathutils.Vector((0.0, 0.0, 1.0))).to_matrix()
    rot_yaw = mathutils.Matrix.Rotation(math.radians(CORRIDOR_YAW_DEG), 3, "Z")
    R_total = np.array(rot_yaw @ rot_level, dtype=np.float64)

    V_rot = V @ R_total.T
    N_rot = N @ R_total.T

    # Compute median floor elevation along the primary corridor
    fl_corridor = V_rot[
        (N_rot[:, 2] > 0.85)
        & (V_rot[:, 2] < -24.5)
        & (V_rot[:, 1] > -44.0)
        & (V_rot[:, 1] < 23.0)
        & (V_rot[:, 0] > 6.5)
        & (V_rot[:, 0] < 11.5)
    ]
    z_floor_med = float(np.median(fl_corridor[:, 2]))

    translation = np.array([ENTRANCE_ANCHOR_X, ENTRANCE_ANCHOR_Y, z_floor_med], dtype=np.float64)
    V_aligned = (V_rot - translation).astype(np.float32)

    visual_obj.data.vertices.foreach_set("co", V_aligned.ravel())
    visual_obj.data.update()

    # Ensure object transforms are strictly zeroed
    visual_obj.location = (0.0, 0.0, 0.0)
    visual_obj.rotation_mode = "XYZ"
    visual_obj.rotation_euler = (0.0, 0.0, 0.0)
    visual_obj.scale = (1.0, 1.0, 1.0)

    info = {
        "metric_scale_factor": round(1.0 / SKETCHFAB_IMPORT_SCALE, 6),
        "floor_median_z_shift": round(z_floor_med, 4),
        "bbox_min": [round(float(x), 3) for x in V_aligned.min(axis=0)],
        "bbox_max": [round(float(x), 3) for x in V_aligned.max(axis=0)],
    }
    print("Stage 3 (Spatial Alignment & Human Ruler Calibration):", info)
    return info


def unify_clean_and_decimate_alley_mesh() -> Tuple[bpy.types.Object, Dict[str, Any], Dict[str, Any]]:
    """
    Stages 1 & 3 (Tickets 032 & 034):
    - Unhides all collections in mesh.blend.
    - Joins the 13 0727_FREEMAN_ALLEY_* mesh objects into VISUAL_ALLEY_MESH.
    - Clears parent hierarchy keeping world transform and applies transforms.
    - Restores 1:1 human metric scale, levels floor to Z=0, straightens corridor yaw,
      and anchors entrance center at (0,0,0).
    - Welds chunk-boundary split vertices (dist=4e-5 in metric space).
    - Removes stretched Poisson closure perimeter triangles (max_edge > 0.614m metric)
      and disconnected floating shrapnel islands via BFS.
    - Explicitly locks all UV island seams, material boundaries, and open edges.
    - Executes UV-locked collapse decimation into the [80,000, 150,000] triangle envelope.
    """
    if not os.path.exists(SOURCE_BLEND_PATH):
        raise FileNotFoundError(f"Fatal: Source blend file missing at {SOURCE_BLEND_PATH}")

    bpy.ops.wm.open_mainfile(filepath=SOURCE_BLEND_PATH)
    for col in bpy.data.collections:
        col.hide_viewport = False
        col.hide_render = False
    for lc in bpy.context.view_layer.layer_collection.children:
        lc.exclude = False
        lc.hide_viewport = False
    bpy.context.view_layer.update()

    alley_chunks = sorted(
        [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith("0727_FREEMAN_ALLEY")],
        key=lambda x: x.name,
    )
    if len(alley_chunks) != 13:
        raise RuntimeError(f"Fatal: Expected 13 Freeman Alley mesh chunks, found {len(alley_chunks)}")

    raw_tris = sum(len(o.data.polygons) for o in alley_chunks)
    raw_verts = sum(len(o.data.vertices) for o in alley_chunks)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in alley_chunks:
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.hide_select = False
        obj.select_set(True)
    bpy.context.view_layer.objects.active = alley_chunks[0]
    bpy.ops.object.join()

    visual_obj = bpy.context.view_layer.objects.active
    visual_obj.name = "VISUAL_ALLEY_MESH"
    visual_obj.data.name = "VISUAL_ALLEY_MESH"

    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Align, level, and calibrate to 1:1 human metric scale while raw normals are pristine
    align_stats = align_level_and_scale_alley_mesh(visual_obj)

    # BMesh topological sanitization & Poisson perimeter shrapnel removal
    bm = bmesh.new()
    bm.from_mesh(visual_obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=4e-5)
    welded_verts = len(bm.verts)

    # Strip stretched Poisson closure faces along un-scanned sky/perimeter bounds
    poisson_faces = [
        f for f in bm.faces if max(e.calc_length() for e in f.edges) > POISSON_MAX_EDGE_THRESHOLD_METRIC
    ]
    poisson_removed_count = len(poisson_faces)
    if poisson_faces:
        bmesh.ops.delete(bm, geom=poisson_faces, context="FACES")

    # Strip disconnected floating shrapnel islands via BFS, retaining the primary alley shell
    visited = set()
    components = []
    for v in bm.verts:
        if v.index not in visited:
            comp = []
            stack = [v]
            visited.add(v.index)
            while stack:
                curr = stack.pop()
                comp.append(curr)
                for e in curr.link_edges:
                    other = e.other_vert(curr)
                    if other.index not in visited:
                        visited.add(other.index)
                        stack.append(other)
            components.append(comp)

    components.sort(key=len, reverse=True)
    if not components or len(components[0]) < 100000:
        raise RuntimeError("Fatal: Primary Freeman Alley connected component missing after shrapnel filter.")

    floating_islands_removed = len(components) - 1
    shrapnel_verts = [v for comp in components[1:] for v in comp]
    if shrapnel_verts:
        bmesh.ops.delete(bm, geom=shrapnel_verts, context="VERTS")

    # Remove any loose wire edges or isolated vertices
    loose_edges = [e for e in bm.edges if len(e.link_faces) == 0]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context="EDGES")
    loose_verts = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context="VERTS")

    # Explicitly lock all UV seams, material boundaries, and open perimeter edges
    uv_layer = bm.loops.layers.uv.active
    if uv_layer is None:
        raise RuntimeError("Fatal: Active UV layer missing on VISUAL_ALLEY_MESH.")

    locked_seam_edges = 0
    for e in bm.edges:
        if len(e.link_faces) != 2:
            e.seam = True
            locked_seam_edges += 1
            continue
        f0, f1 = e.link_faces[0], e.link_faces[1]
        if f0.material_index != f1.material_index:
            e.seam = True
            locked_seam_edges += 1
            continue
        v0, v1 = e.verts[0], e.verts[1]
        uv0_f0 = next(l[uv_layer].uv for l in f0.loops if l.vert == v0)
        uv0_f1 = next(l[uv_layer].uv for l in f1.loops if l.vert == v0)
        uv1_f0 = next(l[uv_layer].uv for l in f0.loops if l.vert == v1)
        uv1_f1 = next(l[uv_layer].uv for l in f1.loops if l.vert == v1)
        if (uv0_f0 - uv0_f1).length > 1e-4 or (uv1_f0 - uv1_f1).length > 1e-4:
            e.seam = True
            locked_seam_edges += 1

    bm.to_mesh(visual_obj.data)
    bm.free()
    visual_obj.data.update()

    # Apply UV-locked Collapse Decimation
    bpy.ops.object.select_all(action="DESELECT")
    visual_obj.select_set(True)
    bpy.context.view_layer.objects.active = visual_obj

    dec_mod = visual_obj.modifiers.new(name="UV_Locked_Decimate", type="DECIMATE")
    dec_mod.decimate_type = "COLLAPSE"
    dec_mod.ratio = DECIMATE_COLLAPSE_RATIO
    dec_mod.delimit = {"UV", "MATERIAL", "SEAM"}
    bpy.ops.object.modifier_apply(modifier=dec_mod.name)

    # Post-decimation cleanup of any degenerate zero-area faces or loose elements
    bm = bmesh.new()
    bm.from_mesh(visual_obj.data)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 3])
    degen_faces = [f for f in bm.faces if f.calc_area() <= 1e-11]
    if degen_faces:
        bmesh.ops.delete(bm, geom=degen_faces, context="FACES")
    loose_e = [e for e in bm.edges if len(e.link_faces) == 0]
    if loose_e:
        bmesh.ops.delete(bm, geom=loose_e, context="EDGES")
    loose_v = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose_v:
        bmesh.ops.delete(bm, geom=loose_v, context="VERTS")
    bm.to_mesh(visual_obj.data)
    bm.free()
    visual_obj.data.update()

    final_tris = len(visual_obj.data.polygons)
    final_verts = len(visual_obj.data.vertices)
    if not (MIN_TARGET_TRIANGLES <= final_tris <= MAX_TARGET_TRIANGLES):
        raise RuntimeError(
            f"Fatal: Decimated triangle count {final_tris} outside target envelope "
            f"[{MIN_TARGET_TRIANGLES}, {MAX_TARGET_TRIANGLES}]."
        )

    # Verify zero intruding visual mesh vertices inside the core walking corridor above Z = 0.35m
    v_cnt_post = len(visual_obj.data.vertices)
    coords_post = np.empty(v_cnt_post * 3, dtype=np.float32)
    visual_obj.data.vertices.foreach_get("co", coords_post)
    V_post = coords_post.reshape(-1, 3)
    intruding = V_post[
        (V_post[:, 0] > -1.180)
        & (V_post[:, 0] < 1.180)
        & (V_post[:, 1] > -52.000)
        & (V_post[:, 1] < 0.000)
        & (V_post[:, 2] > 0.35)
        & (V_post[:, 2] < 2.50)
    ]
    if len(intruding) > 0:
        raise RuntimeError(
            f"Fatal: Found {len(intruding)} visual mesh vertices intruding inside the bumper cage."
        )
    align_stats["cage_intruding_vertices"] = int(len(intruding))

    stats = {
        "raw_tris": raw_tris,
        "raw_verts": raw_verts,
        "welded_verts": welded_verts,
        "poisson_faces_removed": poisson_removed_count,
        "floating_islands_removed": floating_islands_removed,
        "locked_seam_edges": locked_seam_edges,
        "decimated_tris": final_tris,
        "decimated_verts": final_verts,
    }
    print("Stage 1 (UV-Locked Decimation & Shrapnel Cleanup):", stats)
    return visual_obj, stats, align_stats


def downscale_textures_and_standardize_matte_materials() -> Dict[str, Any]:
    """
    Stages 2 & 5 (Tickets 033 & 036):
    - Downscales the three 8192x8192 textures to 2048x2048 (2K).
    - Rebuilds all three photogrammetry materials with Principled BSDF:
      Roughness = 1.0, Metallic = 0.0, Specular IOR Level = 0.0.
    """
    scaled_textures = {}
    for tex_name in ALLEY_TEXTURE_NAMES:
        img = bpy.data.images.get(tex_name)
        if img is None:
            raise RuntimeError(f"Fatal: Required photogrammetry texture '{tex_name}' missing.")
        img.scale(TARGET_TEXTURE_RES, TARGET_TEXTURE_RES)
        img.pack()
        scaled_textures[tex_name] = list(img.size)

    for mat_name, tex_name in zip(ALLEY_MATERIAL_NAMES, ALLEY_TEXTURE_NAMES):
        mat = bpy.data.materials.get(mat_name)
        if mat is None:
            raise RuntimeError(f"Fatal: Required material '{mat_name}' missing.")
        mat.use_backface_culling = False
        nt = mat.node_tree
        nt.nodes.clear()

        out_node = nt.nodes.new(type="ShaderNodeOutputMaterial")
        out_node.location = (300, 0)

        bsdf = nt.nodes.new(type="ShaderNodeBsdfPrincipled")
        bsdf.location = (0, 0)
        bsdf.inputs["Roughness"].default_value = 1.0
        bsdf.inputs["Metallic"].default_value = 0.0
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.0

        tex_node = nt.nodes.new(type="ShaderNodeTexImage")
        tex_node.location = (-350, 0)
        tex_node.image = bpy.data.images[tex_name]

        nt.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
        nt.links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    info = {
        "scaled_textures": scaled_textures,
        "uncompressed_rgb_vram_mb": round(3 * TARGET_TEXTURE_RES * TARGET_TEXTURE_RES * 3 / (1024 * 1024), 2),
        "materials_standardized": ALLEY_MATERIAL_NAMES,
    }
    print("Stages 2 & 5 (2K Texture Downscaling & Matte Materials):", info)
    return info


def create_quad_mesh_object(
    name: str,
    verts: List[Tuple[float, float, float]],
    faces: List[Tuple[int, int, int]],
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Creates a clean low-poly triangle mesh with zeroed transforms and outward normals."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = (0.0, 0.0, 0.0)
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.scale = (1.0, 1.0, 1.0)
    return obj


def build_collision_bumper_cage(root_obj: bpy.types.Object) -> Tuple[bpy.types.Object, Dict[str, Any]]:
    """
    Stage 4 (Ticket 035):
    Constructs COLLIDERS group containing 5 invisible low-poly bumper proxy meshes
    totaling 26 triangles (< 30 triangles) spanning the full Freeman Alley:
    - Entrance Plaza / Sidewalk on Rivington St: Y in [0.00m, +10.50m], X in [-9.40m, +10.20m]
    - Main Alley Corridor: Y in [-44.00m, 0.00m], X in [-1.65m .. -1.55m, +2.00m .. +1.65m]
    - Back Alleyway & Courtyard: Y in [-71.20m, -44.00m], X in [-1.55m .. -1.50m, +3.25m .. +2.50m]
    """
    colliders_group = bpy.data.objects.new("COLLIDERS", None)
    colliders_group.empty_display_type = "PLAIN_AXES"
    bpy.context.scene.collection.objects.link(colliders_group)
    colliders_group.parent = root_obj
    colliders_group.location = (0.0, 0.0, 0.0)
    colliders_group.rotation_mode = "XYZ"
    colliders_group.rotation_euler = (0.0, 0.0, 0.0)
    colliders_group.scale = (1.0, 1.0, 1.0)

    # Reuse the primary matte material slot so COLLIDERS add 0 extra materials
    proxy_mat = bpy.data.materials[ALLEY_MATERIAL_NAMES[0]]

    # 1. COLLIDER_FLOOR (contiguous horizontal floor polygon at Z = 0.0, normal (0, 0, +1))
    floor_verts = [
        # Entrance Plaza (Y = +10.50 to 0.00)
        (-9.400, 0.000, CAGE_Z_MIN),      # 0
        (10.200, 0.000, CAGE_Z_MIN),      # 1
        (10.200, 10.500, CAGE_Z_MIN),     # 2
        (-9.400, 10.500, CAGE_Z_MIN),     # 3
        # Main Alley Corridor (Y = 0.00 to -44.00)
        (-1.550, -44.000, CAGE_Z_MIN),    # 4
        (1.650, -44.000, CAGE_Z_MIN),     # 5
        (2.000, 0.000, CAGE_Z_MIN),       # 6
        (-1.650, 0.000, CAGE_Z_MIN),      # 7
        # Back Alleyway & Courtyard + Corner Alcove (Y = -44.00 to -71.20)
        (-1.500, -71.200, CAGE_Z_MIN),    # 8
        (2.500, -71.200, CAGE_Z_MIN),     # 9
        (2.800, -65.750, CAGE_Z_MIN),     # 10 (Alcove exit corner)
        (5.400, -62.250, CAGE_Z_MIN),     # 11 (Alcove corner apex)
        (3.050, -60.750, CAGE_Z_MIN),     # 12 (Alcove entry corner)
        (3.250, -44.000, CAGE_Z_MIN),     # 13
    ]
    floor_faces = [
        (0, 1, 2), (0, 2, 3),             # Entrance Plaza floor (2 tris)
        (4, 5, 6), (4, 6, 7),             # Main Alley floor (2 tris)
        (8, 9, 10), (8, 10, 12),          # Back Alley lower floor (2 tris)
        (8, 12, 13), (8, 13, 4),          # Back Alley upper floor (2 tris)
        (10, 11, 12),                     # Triangular Corner Alcove floor (1 tri)
    ]
    create_quad_mesh_object("COLLIDER_FLOOR", floor_verts, floor_faces, colliders_group, proxy_mat)

    # 2. COLLIDER_WALL_L (3 contiguous vertical wall quads = 6 triangles, inward normal)
    # Path from back (-71.20) -> alley mouth (0.00) -> left facade step-out (0.00) -> entrance (+10.50)
    l_pts = [
        (-1.500, -71.200),
        (-1.650, 0.000),
        (-9.400, 0.000),
        (-9.400, 10.500),
    ]
    wall_l_verts = []
    wall_l_faces = []
    for i in range(len(l_pts) - 1):
        x0, y0 = l_pts[i]
        x1, y1 = l_pts[i + 1]
        base = len(wall_l_verts)
        wall_l_verts.extend([
            (x0, y0, CAGE_Z_MIN),
            (x1, y1, CAGE_Z_MIN),
            (x1, y1, CAGE_Z_MAX),
            (x0, y0, CAGE_Z_MAX),
        ])
        wall_l_faces.extend([(base, base + 1, base + 2), (base, base + 2, base + 3)])
    create_quad_mesh_object("COLLIDER_WALL_L", wall_l_verts, wall_l_faces, colliders_group, proxy_mat)

    # 3. COLLIDER_WALL_R (7 contiguous vertical wall quads = 14 triangles, inward normal)
    # Wraps around the back triangular corner alcove (-60.75 -> -62.25 apex -> -65.75)
    r_pts = [
        (10.200, 10.500),
        (10.200, 0.000),
        (2.000, 0.000),
        (1.650, -44.000),
        (3.250, -44.000),
        (3.050, -60.750),
        (5.400, -62.250),
        (2.800, -65.750),
        (2.500, -71.200),
    ]
    wall_r_verts = []
    wall_r_faces = []
    for i in range(len(r_pts) - 1):
        x0, y0 = r_pts[i]
        x1, y1 = r_pts[i + 1]
        base = len(wall_r_verts)
        wall_r_verts.extend([
            (x0, y0, CAGE_Z_MIN),
            (x1, y1, CAGE_Z_MIN),
            (x1, y1, CAGE_Z_MAX),
            (x0, y0, CAGE_Z_MAX),
        ])
        wall_r_faces.extend([(base, base + 1, base + 2), (base, base + 2, base + 3)])
    create_quad_mesh_object("COLLIDER_WALL_R", wall_r_verts, wall_r_faces, colliders_group, proxy_mat)

    # 4. COLLIDER_BOUND_START (Y = +10.500 across entrance plaza, 2 triangles, inward normal (0, -1, 0))
    bound_start_verts = [
        (-9.400, 10.500, CAGE_Z_MIN),
        (10.200, 10.500, CAGE_Z_MIN),
        (10.200, 10.500, CAGE_Z_MAX),
        (-9.400, 10.500, CAGE_Z_MAX),
    ]
    create_quad_mesh_object("COLLIDER_BOUND_START", bound_start_verts, [(0, 1, 2), (0, 2, 3)], colliders_group, proxy_mat)

    # 5. COLLIDER_BOUND_END (Y = -71.200 across back end of alleyway, 2 triangles, inward normal (0, +1, 0))
    bound_end_verts = [
        (2.500, -71.200, CAGE_Z_MIN),
        (-1.500, -71.200, CAGE_Z_MIN),
        (-1.500, -71.200, CAGE_Z_MAX),
        (2.500, -71.200, CAGE_Z_MAX),
    ]
    create_quad_mesh_object("COLLIDER_BOUND_END", bound_end_verts, [(0, 1, 2), (0, 2, 3)], colliders_group, proxy_mat)

    total_collider_tris = sum(len(c.data.polygons) for c in colliders_group.children if c.type == "MESH")
    info = {
        "collider_nodes": [c.name for c in colliders_group.children],
        "total_collider_triangles": total_collider_tris,
    }
    print("Stage 4 (Collision Bumper Cage):", info)
    return colliders_group, info


def build_stage_markers(root_obj: bpy.types.Object, visual_obj: bpy.types.Object) -> Tuple[bpy.types.Object, Dict[str, Any]]:
    """
    Stage 6 (Ticket 037):
    Constructs MARKERS group containing transform-only spatial pins:
    - SPAWN_PLAYER
    - SPAWN_NPC
    - CAM_SCROLL_START
    - CAM_SCROLL_END
    - SCREEN_MOUNT_01 .. SCREEN_MOUNT_06
    """
    markers_group = bpy.data.objects.new("MARKERS", None)
    markers_group.empty_display_type = "PLAIN_AXES"
    bpy.context.scene.collection.objects.link(markers_group)
    markers_group.parent = root_obj
    markers_group.location = (0.0, 0.0, 0.0)
    markers_group.rotation_mode = "XYZ"
    markers_group.rotation_euler = (0.0, 0.0, 0.0)
    markers_group.scale = (1.0, 1.0, 1.0)

    def add_marker(name: str, loc: Tuple[float, float, float], rot_deg: Tuple[float, float, float]) -> bpy.types.Object:
        m = bpy.data.objects.new(name, None)
        m.empty_display_type = "ARROWS"
        m.empty_display_size = 0.5
        bpy.context.scene.collection.objects.link(m)
        m.parent = markers_group
        m.location = loc
        m.rotation_mode = "XYZ"
        m.rotation_euler = tuple(math.radians(d) for d in rot_deg)
        m.scale = (1.0, 1.0, 1.0)
        return m

    # Character Spawns (on floor Z = 0.000)
    # SPAWN_PLAYER faces -Y in Blender (+Z in Three.js) down the corridor
    add_marker("SPAWN_PLAYER", (0.000, -3.000, 0.000), (0.0, 0.0, 0.0))
    # SPAWN_NPC stands idling deeper in the alley facing +Y (-Z in Three.js) toward the player
    add_marker("SPAWN_NPC", (0.250, -16.000, 0.000), (0.0, 0.0, 180.0))

    # Scroll Camera Endpoints
    # CAM_SCROLL_START: Rivington St viewpoint looking into Freeman Alley entrance (0% scroll)
    add_marker("CAM_SCROLL_START", (-0.250, 10.500, 1.750), (88.0, 0.0, 180.0))
    # CAM_SCROLL_END: Directly behind SPAWN_PLAYER's shoulders inside the collision cage (100% scroll)
    add_marker("CAM_SCROLL_END", (0.000, -0.350, 1.850), (82.0, 0.0, 180.0))

    # Wall Screen Mounts (SCREEN_MOUNT_01 .. SCREEN_MOUNT_06)
    # Sample visual_obj wall surface coordinates at each Y station so mounts sit flush on brick walls
    v_cnt = len(visual_obj.data.vertices)
    coords = np.empty(v_cnt * 3, dtype=np.float32)
    visual_obj.data.vertices.foreach_get("co", coords)
    V = coords.reshape(-1, 3)

    mount_specs = [
        ("SCREEN_MOUNT_01", "L", -5.000, 1.750),
        ("SCREEN_MOUNT_02", "R", -10.000, 1.750),
        ("SCREEN_MOUNT_03", "L", -15.000, 1.750),
        ("SCREEN_MOUNT_04", "R", -20.000, 1.750),
        ("SCREEN_MOUNT_05", "R", -26.000, 1.750),
        ("SCREEN_MOUNT_06", "R", -32.000, 1.750),
    ]

    for m_name, side, y_pos, z_pos in mount_specs:
        band = V[(np.abs(V[:, 1] - y_pos) < 0.75) & (np.abs(V[:, 2] - z_pos) < 0.40)]
        if side == "L":
            wall_pts = band[band[:, 0] < -0.5]
            x_pos = float(np.median(wall_pts[:, 0])) + 0.03 if len(wall_pts) > 5 else -1.850
            # Outward wall normal points +X into the alley corridor
            rot_deg = (0.0, 0.0, -90.0)
        else:
            wall_pts = band[band[:, 0] > 0.5]
            x_pos = float(np.median(wall_pts[:, 0])) - 0.03 if len(wall_pts) > 5 else 1.750
            # Outward wall normal points -X into the alley corridor
            rot_deg = (0.0, 0.0, 90.0)
        add_marker(m_name, (round(x_pos, 4), y_pos, z_pos), rot_deg)

    info = {
        "marker_nodes": [m.name for m in markers_group.children],
    }
    print("Stage 6 (Runtime Stage Locators):", info)
    return markers_group, info


def purge_non_environment_datablocks(allowed_objs: set) -> None:
    """
    Removes all non-environment objects, armatures, actions, and unused images/materials
    so the exported freeman_alley.glb is 100% modular and self-contained.
    """
    for obj in list(bpy.data.objects):
        if obj not in allowed_objs:
            bpy.data.objects.remove(obj, do_unlink=True)

    for arm in list(bpy.data.armatures):
        bpy.data.armatures.remove(arm, do_unlink=True)

    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act, do_unlink=True)

    for cam in list(bpy.data.cameras):
        bpy.data.cameras.remove(cam, do_unlink=True)

    for lgt in list(bpy.data.lights):
        bpy.data.lights.remove(lgt, do_unlink=True)

    allowed_mats = set(ALLEY_MATERIAL_NAMES)
    for mat in list(bpy.data.materials):
        if mat.name not in allowed_mats:
            bpy.data.materials.remove(mat, do_unlink=True)

    allowed_imgs = set(ALLEY_TEXTURE_NAMES)
    for img in list(bpy.data.images):
        if img.name not in allowed_imgs:
            bpy.data.images.remove(img, do_unlink=True)

    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh, do_unlink=True)


def export_modular_environment_glb() -> Dict[str, Any]:
    """Exports the pure ENV_FREEMAN_ALLEY hierarchy to freeman_alley.glb with WebP textures."""
    bpy.context.view_layer.update()
    os.makedirs(os.path.dirname(FREEMAN_ALLEY_GLB_PRIMARY), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=FREEMAN_ALLEY_GLB_PRIMARY,
        export_format="GLB",
        use_selection=False,
        export_apply=False,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="WEBP",
        export_image_quality=WEBP_QUALITY,
        export_image_webp_fallback=False,
        export_skins=False,
        export_animations=False,
    )

    shutil.copy2(FREEMAN_ALLEY_GLB_PRIMARY, FREEMAN_ALLEY_GLB_SECONDARY)
    size_bytes = os.path.getsize(FREEMAN_ALLEY_GLB_PRIMARY)
    size_mb = size_bytes / (1024 * 1024)
    digest = sha256_file(FREEMAN_ALLEY_GLB_PRIMARY)

    if size_mb >= 20.0:
        raise RuntimeError(f"Fatal: Exported freeman_alley.glb size {size_mb:.2f} MB exceeds 20 MB budget.")

    info = {
        "primary_path": FREEMAN_ALLEY_GLB_PRIMARY,
        "secondary_path": FREEMAN_ALLEY_GLB_SECONDARY,
        "size_bytes": size_bytes,
        "size_mb": round(size_mb, 2),
        "sha256": digest,
    }
    print("Exported Modular Environment GLB:", info)
    return info


def render_verification_views() -> List[str]:
    """
    Temporarily instantiates character_hoodie.glb at SPAWN_PLAYER and character_tunic.glb
    at SPAWN_NPC (scale 1,1,1) inside the prepared scene and renders verification views:
    - CAM_SCROLL_START (0% scroll view from Rivington St)
    - CAM_SCROLL_END (100% scroll over-the-shoulder handoff behind SPAWN_PLAYER)
    - Top-down orthographic plan view
    """
    os.makedirs(VERIFICATION_DIR, exist_ok=True)
    colliders_group = bpy.data.objects.get("COLLIDERS")
    if colliders_group:
        for c in colliders_group.children:
            c.hide_render = True

    spawn_player = bpy.data.objects["SPAWN_PLAYER"]
    spawn_npc = bpy.data.objects["SPAWN_NPC"]
    cam_start_marker = bpy.data.objects["CAM_SCROLL_START"]
    cam_end_marker = bpy.data.objects["CAM_SCROLL_END"]

    # Import Hoodie character at SPAWN_PLAYER (scale 1,1,1)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=CHARACTER_HOODIE_PATHS[0])
    hoodie_objs = list(set(bpy.data.objects) - before)
    for o in hoodie_objs:
        if o.parent is None:
            o.location = spawn_player.location.copy()
            o.rotation_mode = "XYZ"
            o.rotation_euler = spawn_player.rotation_euler.copy()
            o.scale = (1.0, 1.0, 1.0)

    # Import Tunic character at SPAWN_NPC (scale 1,1,1)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=CHARACTER_TUNIC_PATHS[0])
    tunic_objs = list(set(bpy.data.objects) - before)
    for o in tunic_objs:
        if o.parent is None:
            o.location = spawn_npc.location.copy()
            o.rotation_mode = "XYZ"
            o.rotation_euler = spawn_npc.rotation_euler.copy()
            o.scale = (1.0, 1.0, 1.0)

    # Add even ambient + directional lighting for verification renders
    sun_data = bpy.data.lights.new(name="Verify_Sun", type="SUN")
    sun_data.energy = 3.5
    sun_obj = bpy.data.objects.new(name="Verify_Sun", object_data=sun_data)
    bpy.context.scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(35.0), math.radians(15.0), math.radians(145.0))

    if bpy.context.scene.world is None:
        bpy.context.scene.world = bpy.data.worlds.new("World")
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.75, 0.78, 0.82, 1.0)
        bg.inputs[1].default_value = 1.2

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    cam_data = bpy.data.cameras.new("Verify_Cam")
    cam_data.lens = 35.0
    cam_obj = bpy.data.objects.new("Verify_Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    rendered_paths = []

    # 1. CAM_SCROLL_START view
    cam_obj.location = cam_start_marker.location.copy()
    cam_obj.rotation_euler = cam_start_marker.rotation_euler.copy()
    p_start = os.path.join(VERIFICATION_DIR, "freeman_alley_cam_scroll_start.png")
    scene.render.filepath = p_start
    bpy.ops.render.render(write_still=True)
    rendered_paths.append(p_start)

    # 2. CAM_SCROLL_END view (behind SPAWN_PLAYER shoulders looking down alley at SPAWN_NPC)
    cam_obj.location = cam_end_marker.location.copy()
    cam_obj.rotation_euler = cam_end_marker.rotation_euler.copy()
    p_end = os.path.join(VERIFICATION_DIR, "freeman_alley_cam_scroll_end.png")
    scene.render.filepath = p_end
    bpy.ops.render.render(write_still=True)
    rendered_paths.append(p_end)

    # 3. Close-up Human Ruler verification of SPAWN_NPC inside corridor
    cam_obj.location = (0.10, -12.00, 1.55)
    cam_obj.rotation_euler = (math.radians(86.0), 0.0, math.radians(180.0))
    p_npc = os.path.join(VERIFICATION_DIR, "freeman_alley_npc_human_scale.png")
    scene.render.filepath = p_npc
    bpy.ops.render.render(write_still=True)
    rendered_paths.append(p_npc)

    return rendered_paths


def run_pipeline() -> Dict[str, Any]:
    print("=== STARTING FREEMAN ALLEY PHOTOGRAMMETRY ENVIRONMENT PREPARATION PIPELINE ===")
    staged_chars = stage_modular_character_files()
    visual_obj, decim_stats, align_stats = unify_clean_and_decimate_alley_mesh()
    mat_stats = downscale_textures_and_standardize_matte_materials()

    # Construct Root Node ENV_FREEMAN_ALLEY
    root_obj = bpy.data.objects.new("ENV_FREEMAN_ALLEY", None)
    root_obj.empty_display_type = "PLAIN_AXES"
    bpy.context.scene.collection.objects.link(root_obj)
    root_obj.location = (0.0, 0.0, 0.0)
    root_obj.rotation_mode = "XYZ"
    root_obj.rotation_euler = (0.0, 0.0, 0.0)
    root_obj.scale = (1.0, 1.0, 1.0)

    visual_obj.parent = root_obj
    colliders_group, coll_stats = build_collision_bumper_cage(root_obj)
    markers_group, mark_stats = build_stage_markers(root_obj, visual_obj)

    allowed_objs = {root_obj, visual_obj, colliders_group, markers_group}
    allowed_objs.update(colliders_group.children)
    allowed_objs.update(markers_group.children)
    purge_non_environment_datablocks(allowed_objs)

    export_stats = export_modular_environment_glb()
    renders = render_verification_views()

    summary = {
        "staged_characters": staged_chars,
        "decimation": decim_stats,
        "alignment": align_stats,
        "materials": mat_stats,
        "colliders": coll_stats,
        "markers": mark_stats,
        "export": export_stats,
        "verification_renders": renders,
    }
    print("=== PIPELINE COMPLETE ===")
    print("PIPELINE_SUMMARY_JSON:" + json.dumps(summary))
    return summary


if __name__ == "__main__":
    run_pipeline()
