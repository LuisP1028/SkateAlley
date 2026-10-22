"""
rig_characters.py

Automated, deterministic Blender 5.2.2 LTS Dual-Humanoid Decimation, Rigging,
Rest-Pose Normalization, and Quaternius Universal Animation Library (UAL)
Retargeting Pipeline for Character A ("LUIS") and Character B ("PLATODOOM").

Governed by rigging.md and Wayfinder tickets 026-031.
"""

import os
import sys
import math
import json
import struct
import hashlib
from typing import Dict, List, Tuple, Any

import bpy
import bmesh
import mathutils
import numpy as np

# Canonical Paths
DOOM_RIG_DIR = "/Users/diesel/Desktop/Doom_Rig"
OUTPUTS_DIR = os.path.join(DOOM_RIG_DIR, "outputs")
VERIFICATION_DIR = os.path.join(OUTPUTS_DIR, "verification")
UAL1_GLB_PATH = os.path.join(
    DOOM_RIG_DIR,
    "quaternius",
    "Universal Animation Library[Standard]",
    "Unreal-Godot",
    "UAL1_Standard.glb",
)

PLATODOOM_RAW_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_RAW.glb")
PLATODOOM_HEAD_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_HEAD.glb")
DOOM_HAND_PATH = os.path.join(DOOM_RIG_DIR, "DOOM_HAND.glb")
LUIS_TPOSE_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_TPOSE.glb")
LUIS_HEAD_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HEAD.glb")
LUIS_BODY_COLOR_PATH = os.path.join(DOOM_RIG_DIR, "Luis_BODY_COLOR.glb")
LUIS_HEAD_COLOR_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HEAD_COLOR.glb")
DOOM_SHOULDER_RAW_PATH = os.path.join(DOOM_RIG_DIR, "DOOM_.glb")

PLATODOOM_RIGGED_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_RIGGED.glb")
LUIS_RIGGED_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_RIGGED.glb")
LUIS_RIGGED_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_RIGGED.glb"
LUIS_COLOR_RIGGED_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_COLOR_RIGGED.glb")
LUIS_COLOR_RIGGED_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_COLOR_RIGGED.glb"
LUIS_RIGGED_CLAY_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_RIGGED_CLAY.glb")
LUIS_RIGGED_CLAY_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_RIGGED_CLAY.glb"
LUIS_RIGGED_HOLO_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_RIGGED_HOLO.glb")
LUIS_HOLOSYS_RIGGED_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HOLOSYS_RIGGED.glb")
LUIS_HOLOSYS_ASSEMBLED_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HOLOSYS_ASSEMBLED.glb")
LUIS_HOLOSYS_ASSEMBLED_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_HOLOSYS_ASSEMBLED.glb"
LUIS_RIGGED_HOLO_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_RIGGED_HOLO.glb"
LUIS_HOLOSYS_RIGGED_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_HOLOSYS_RIGGED.glb"

PLATODOOM_RIGGED_HOLO_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_RIGGED_HOLO.glb")
PLATODOOM_HOLOSYS_RIGGED_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_HOLOSYS_RIGGED.glb")
PLATODOOM_HOLOSYS_ASSEMBLED_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_HOLOSYS_ASSEMBLED.glb")
PLATODOOM_RIGGED_HOLO_GREEK_PATH = "/Users/diesel/desktop/greek/PLATODOOM_RIGGED_HOLO.glb"
PLATODOOM_HOLOSYS_RIGGED_GREEK_PATH = "/Users/diesel/desktop/greek/PLATODOOM_HOLOSYS_RIGGED.glb"

HOLO_SYS_VISUALIZER_DOOM_PATH = os.path.join(DOOM_RIG_DIR, "HOLO_SYS_VISUALIZER.glb")
HOLO_SYS_VISUALIZER_GREEK_PATH = "/Users/diesel/desktop/greek/HOLO_SYS_VISUALIZER.glb"

PLATODOOM_ASSEMBLED_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_ASSEMBLED.glb")
LUIS_ASSEMBLED_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_ASSEMBLED.glb")
LUIS_ASSEMBLED_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_ASSEMBLED.glb"
LUIS_ASSEMBLED_CLAY_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_ASSEMBLED_CLAY.glb")
LUIS_ASSEMBLED_CLAY_GREEK_PATH = "/Users/diesel/desktop/greek/LUIS_ASSEMBLED_CLAY.glb"
CHARACTER_HOODIE_GREEK_PATH = "/Users/diesel/desktop/greek/character_hoodie.glb"
CHARACTER_HOODIE_DOOM_PATH = os.path.join(DOOM_RIG_DIR, "character_hoodie.glb")
CHARACTER_TUNIC_GREEK_PATH = "/Users/diesel/desktop/greek/character_tunic.glb"
CHARACTER_TUNIC_DOOM_PATH = os.path.join(DOOM_RIG_DIR, "character_tunic.glb")

TARGET_STATURE_METERS = 2.000
TARGET_TRIANGLES = 20000
MIN_TRIANGLES = 15000
MAX_TRIANGLES = 25000

# Assembly Constants from assemble_characters.py
SCALE_HEAD_1 = 0.228
SEAT_OFFSET_X = -0.0115
SEAT_OFFSET_Y = -0.0120
SEAT_TRANSLATE_Z = 1.1180
HEAD_NECK_CUT_Z = -0.805

SCALE_HAND_1 = 0.200
WRIST_CUT_Z = -0.790
WRIST_CUFF_BASE_Z = -0.750
LEFT_FOREARM_AXIS = mathutils.Vector((0.5845, -0.1892, -0.7890)).normalized()
RIGHT_FOREARM_AXIS = mathutils.Vector((-0.5845, -0.1892, -0.7890)).normalized()
LEFT_WRIST_CUT_CO = mathutils.Vector((0.5720, 0.0155, 0.1870))
RIGHT_WRIST_CUT_CO = mathutils.Vector((-0.5750, 0.0155, 0.1870))
LEFT_WRIST_TARGET = mathutils.Vector((0.5660, 0.0175, 0.1950))
RIGHT_WRIST_TARGET = mathutils.Vector((-0.5690, 0.0175, 0.1950))

SCALE_HEAD_2 = 0.200
NECK_CUT_Z = -0.750
LUIS_COLLAR_CENTER_X = 0.000
LUIS_COLLAR_CENTER_Y = 0.045
LUIS_NECK_SEAT_Z = 0.875

# Functional Specification 022: Autonomous Above-Shoulder Levitating DOOM_.glb Companion Constants
# Placed in LUIS's standardized 2.000m coordinate frame (-X = Right Shoulder, -Y = Forward, +Z = Up)
DOOM_SHOULDER_NECK_CUT_Z = -0.805
DOOM_SHOULDER_TARGET_TRIS = 3200
DOOM_SHOULDER_SCALE = 0.180
DOOM_SHOULDER_CENTER_X = -0.430
DOOM_SHOULDER_CENTER_Y = -0.055
DOOM_SHOULDER_CENTER_Z = 1.862

REQUIRED_CLIPS = [
    "A_TPose",
    "Idle_Loop",
    "Walk_Loop",
    "Jog_Fwd_Loop",
    "Sprint_Loop",
    "Jump_Start",
    "Jump_Loop",
    "Jump_Land",
    "Roll",
    "Sword_Attack",
    "Dance_Loop",
    "Interact",
]


def sha256_file(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def import_glb_mesh(filepath: str, assigned_name: str) -> bpy.types.Object:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Fatal: Source asset missing at '{filepath}'.")
    objs_before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    objs_after = set(bpy.context.scene.objects)
    imported_objs = list(objs_after - objs_before)
    new_objs = [o for o in imported_objs if o.type == 'MESH']
    if not new_objs:
        raise ValueError(f"Fatal: Failed to import any mesh object from '{filepath}'.")
    target_obj = new_objs[0]
    target_obj.name = assigned_name

    bpy.ops.object.select_all(action='DESELECT')
    target_obj.select_set(True)
    bpy.context.view_layer.objects.active = target_obj
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    if target_obj.matrix_world != mathutils.Matrix.Identity(4):
        target_obj.data.transform(target_obj.matrix_world)
        target_obj.matrix_world = mathutils.Matrix.Identity(4)
        target_obj.data.update()
    target_obj.rotation_mode = 'XYZ'

    for obj in imported_objs:
        if obj != target_obj and obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    return target_obj


def get_connected_island_counts(bm: bmesh.types.BMesh) -> List[List[bmesh.types.BMVert]]:
    visited = set()
    islands = []
    for vert in bm.verts:
        if vert in visited:
            continue
        island_verts = []
        stack = [vert]
        visited.add(vert)
        while stack:
            curr = stack.pop()
            island_verts.append(curr)
            for edge in curr.link_edges:
                other = edge.other_vert(curr)
                if other not in visited:
                    visited.add(other)
                    stack.append(other)
        islands.append(island_verts)
    return islands


def clean_mesh_topology(obj: bpy.types.Object) -> Dict[str, Any]:
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    # Weld UV-split glTF seam vertices in 3D space FIRST (preserving per-loop UVs)
    # before computing 3D connected topological islands!
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)

    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=lambda isl: len(isl), reverse=True)
        to_delete = []
        for stray_island in islands[1:]:
            to_delete.extend(stray_island)
        bmesh.ops.delete(bm, geom=to_delete, context='VERTS')

    loose_verts = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context='VERTS')

    loose_edges = [e for e in bm.edges if len(e.link_faces) == 0]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context='EDGES')

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return {"verts": len(mesh.vertices), "faces": len(mesh.polygons)}


def differentiate_character_material(
    obj: bpy.types.Object,
    mat_name: str,
    tex_name: str,
) -> None:
    """
    Differentiates material and embedded 2048x2048 baseColor image datablocks prior to mesh joining
    so Material_0 / Image_0 never collide, standardizes UV layer name to 'UVMap', and sets
    non-metallic matte PBR surface parameters (Metallic=0.0, Roughness=0.85). (Ticket 038)
    """
    mesh = obj.data
    if mesh.uv_layers:
        mesh.uv_layers[0].name = "UVMap"
        mesh.uv_layers.active = mesh.uv_layers[0]

    if not mesh.materials or mesh.materials[0] is None:
        raise ValueError(f"Fatal: Textured asset '{obj.name}' is missing its PBR material slot.")

    mat = mesh.materials[0]
    mat.name = mat_name
    if mat.node_tree:
        for node in mat.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image is not None:
                node.image.name = tex_name
            elif node.type == 'BSDF_PRINCIPLED':
                if "Metallic" in node.inputs:
                    node.inputs["Metallic"].default_value = 0.0
                if "Roughness" in node.inputs:
                    node.inputs["Roughness"].default_value = 0.85


def fast_c_decimate(
    obj: bpy.types.Object,
    target_faces: int,
    protect_vg_name: str = None,
    preserve_uvs: bool = False,
) -> None:
    """Uses Blender's C++ DECIMATE (COLLAPSE) modifier and evaluated depsgraph."""
    curr_faces = len(obj.data.polygons)
    if curr_faces <= target_faces:
        return

    mod = obj.modifiers.new(name="FastDecimate", type='DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    if preserve_uvs or len(obj.data.uv_layers) > 0:
        mod.delimit = {'UV'}
    if protect_vg_name and protect_vg_name in obj.vertex_groups:
        mod.vertex_group = protect_vg_name
        mod.vertex_group_factor = 1.0
    mod.ratio = max(0.002, min(1.0, target_faces / float(curr_faces)))

    for _ in range(5):
        deps = bpy.context.evaluated_depsgraph_get()
        eval_obj = obj.evaluated_get(deps)
        f_cnt = len(eval_obj.data.polygons)
        if abs(f_cnt - target_faces) <= 120:
            break
        mod.ratio = max(0.001, min(1.0, mod.ratio * (target_faces / max(1, f_cnt))))

    deps = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(deps)
    new_mesh = bpy.data.meshes.new_from_object(eval_obj)
    old_mesh = obj.data
    obj.modifiers.clear()
    obj.vertex_groups.clear()
    obj.data = new_mesh
    bpy.data.meshes.remove(old_mesh, do_unlink=True)

    # Triangulate and sanitize normals/non-manifold flaps while preserving loop UVs
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)

    # Remove any multi-face non-manifold flaps (>2 faces sharing an edge)
    multi_faces = set()
    for e in bm.edges:
        if len(e.link_faces) > 2:
            sorted_f = sorted(e.link_faces, key=lambda f: f.calc_area())
            for f in sorted_f[:-2]:
                multi_faces.add(f)
    if multi_faces:
        bmesh.ops.delete(bm, geom=list(multi_faces), context='FACES')

    loose_e = [e for e in bm.edges if len(e.link_faces) == 0]
    if loose_e:
        bmesh.ops.delete(bm, geom=loose_e, context='EDGES')
    loose_v = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose_v:
        bmesh.ops.delete(bm, geom=loose_v, context='VERTS')

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def build_decimated_platodoom() -> bpy.types.Object:
    """
    Builds, decimates, and unifies Character B (PLATODOOM) to ~20,000 triangles
    (15,000-25,000 range) with intact laurel wreath/mask, 10 separated fingers,
    and clean tunic/body topology.
    """
    doom_body = import_glb_mesh(PLATODOOM_RAW_PATH, "PLATODOOM_RAW")
    doom_head = import_glb_mesh(PLATODOOM_HEAD_PATH, "PLATODOOM_HEAD")
    doom_hand = import_glb_mesh(DOOM_HAND_PATH, "DOOM_HAND")

    clean_mesh_topology(doom_body)
    clean_mesh_topology(doom_head)
    clean_mesh_topology(doom_hand)

    # 1. Prepare Body extremities
    bm = bmesh.new()
    bm.from_mesh(doom_body.data)
    geom_neck = (
        [v for v in bm.verts if v.co.z > 0.93 and abs(v.co.x) < 0.14]
        + [e for e in bm.edges if all(v.co.z > 0.93 and abs(v.co.x) < 0.14 for v in e.verts)]
        + [f for f in bm.faces if all(v.co.z > 0.93 and abs(v.co.x) < 0.14 for v in f.verts)]
    )
    bmesh.ops.bisect_plane(
        bm, geom=geom_neck, plane_co=(0.0, 0.0, 0.968),
        plane_no=mathutils.Vector((0.0, -0.25, 1.0)).normalized(), clear_outer=True, clear_inner=False
    )
    geom_l = (
        [v for v in bm.verts if v.co.x > 0.48 and v.co.z < 0.35]
        + [e for e in bm.edges if all(v.co.x > 0.48 and v.co.z < 0.35 for v in e.verts)]
        + [f for f in bm.faces if all(v.co.x > 0.48 and v.co.z < 0.35 for v in f.verts)]
    )
    bmesh.ops.bisect_plane(
        bm, geom=geom_l, plane_co=LEFT_WRIST_CUT_CO, plane_no=LEFT_FOREARM_AXIS, clear_outer=True, clear_inner=False
    )
    geom_r = (
        [v for v in bm.verts if v.co.x < -0.48 and v.co.z < 0.35]
        + [e for e in bm.edges if all(v.co.x < -0.48 and v.co.z < 0.35 for v in e.verts)]
        + [f for f in bm.faces if all(v.co.x < -0.48 and v.co.z < 0.35 for v in f.verts)]
    )
    bmesh.ops.bisect_plane(
        bm, geom=geom_r, plane_co=RIGHT_WRIST_CUT_CO, plane_no=RIGHT_FOREARM_AXIS, clear_outer=True, clear_inner=False
    )
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(doom_body.data)
    bm.free()
    doom_body.data.update()

    # Decimate Body to 10,000 triangles (protecting joints & drapery folds)
    fast_c_decimate(doom_body, 10000)

    # 2. Trim, decimate, and seat Head to 5,500 triangles
    bm_h = bmesh.new()
    bm_h.from_mesh(doom_head.data)
    bmesh.ops.bisect_plane(
        bm_h, geom=bm_h.verts[:] + bm_h.edges[:] + bm_h.faces[:],
        plane_co=(0.0, 0.0, HEAD_NECK_CUT_Z), plane_no=(0.0, 0.0, -1.0), clear_outer=True, clear_inner=False
    )
    islands = get_connected_island_counts(bm_h)
    if len(islands) > 1:
        islands.sort(key=len, reverse=True)
        bmesh.ops.delete(bm_h, geom=[v for isl in islands[1:] for v in isl], context='VERTS')
    bmesh.ops.recalc_face_normals(bm_h, faces=bm_h.faces)
    bm_h.to_mesh(doom_head.data)
    bm_h.free()
    doom_head.data.update()

    fast_c_decimate(doom_head, 5500)
    mat_scale = mathutils.Matrix.Scale(SCALE_HEAD_1, 4)
    mat_trans = mathutils.Matrix.Translation((SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z))
    doom_head.data.transform(mat_trans @ mat_scale)
    doom_head.data.update()

    # 3. Trim, decimate, orient, and mirror Hands (2,250 triangles each = 4,500 total)
    bm_hand = bmesh.new()
    bm_hand.from_mesh(doom_hand.data)
    bmesh.ops.bisect_plane(
        bm_hand, geom=bm_hand.verts[:] + bm_hand.edges[:] + bm_hand.faces[:],
        plane_co=(0.0, 0.0, WRIST_CUT_Z), plane_no=(0.0, 0.0, -1.0), clear_outer=True, clear_inner=False
    )
    islands_hd = get_connected_island_counts(bm_hand)
    if len(islands_hd) > 1:
        islands_hd.sort(key=len, reverse=True)
        bmesh.ops.delete(bm_hand, geom=[v for isl in islands_hd[1:] for v in isl], context='VERTS')
    cuff_verts = [v.co for v in bm_hand.verts if WRIST_CUFF_BASE_Z <= v.co.z <= WRIST_CUFF_BASE_Z + 0.100]
    cx = sum(v.x for v in cuff_verts) / len(cuff_verts)
    cy = sum(v.y for v in cuff_verts) / len(cuff_verts)
    base_origin = mathutils.Vector((cx, cy, WRIST_CUFF_BASE_Z))
    for v in bm_hand.verts:
        v.co -= base_origin
    bmesh.ops.recalc_face_normals(bm_hand, faces=bm_hand.faces)
    bm_hand.to_mesh(doom_hand.data)
    bm_hand.free()
    doom_hand.data.update()

    fast_c_decimate(doom_hand, 2250)

    ez = LEFT_FOREARM_AXIS
    ex = mathutils.Vector((0.0, 1.0, 0.0)).cross(ez).normalized()
    ey = ez.cross(ex).normalized()
    rot_mat_4x4 = mathutils.Matrix((
        (ex.x, ey.x, ez.x, 0.0),
        (ex.y, ey.y, ez.y, 0.0),
        (ex.z, ey.z, ez.z, 0.0),
        (0.0,  0.0,  0.0,  1.0),
    ))
    scale_mat_4x4 = mathutils.Matrix.Scale(SCALE_HAND_1, 4)
    trans_l_4x4 = mathutils.Matrix.Translation(LEFT_WRIST_TARGET)
    doom_hand.name = "DOOM_HAND_L"
    doom_hand.data.transform(trans_l_4x4 @ rot_mat_4x4 @ scale_mat_4x4)
    doom_hand.data.update()

    hand_r = doom_hand.copy()
    hand_r.data = doom_hand.data.copy()
    hand_r.name = "DOOM_HAND_R"
    bpy.context.collection.objects.link(hand_r)
    mirror_offset_x = RIGHT_WRIST_TARGET.x - (-LEFT_WRIST_TARGET.x)
    mirror_mat = mathutils.Matrix((
        (-1.0, 0.0, 0.0, mirror_offset_x),
        (0.0,  1.0, 0.0, RIGHT_WRIST_TARGET.y - LEFT_WRIST_TARGET.y),
        (0.0,  0.0, 1.0, RIGHT_WRIST_TARGET.z - LEFT_WRIST_TARGET.z),
        (0.0,  0.0, 0.0, 1.0),
    ))
    hand_r.data.transform(mirror_mat)
    bm_r = bmesh.new()
    bm_r.from_mesh(hand_r.data)
    bmesh.ops.reverse_faces(bm_r, faces=bm_r.faces)
    bmesh.ops.recalc_face_normals(bm_r, faces=bm_r.faces)
    bm_r.to_mesh(hand_r.data)
    bm_r.free()
    hand_r.data.update()

    return unify_and_standardize_character("PLATODOOM", [doom_body, doom_head, doom_hand, hand_r])


def prepare_doom_shoulder_companion(
    preserve_uvs: bool = True,
    differentiate_mat: bool = True,
) -> bpy.types.Object:
    """
    Imports /Users/diesel/Desktop/Doom_Rig/DOOM_.glb as a distinct, un-skinned
    companion Mesh object ('DOOM_Companion'), differentiates its PBR material
    and 2048x2048 texture ('DOOM_Shoulder_Material' / 'DOOM_Shoulder_BaseColor'),
    cleans topology, trims the lower neck pedestal below Z=-0.805, UV-lock decimates
    to ~3,200 triangles (2,500-4,500 range), scales by DOOM_SHOULDER_SCALE (0.180),
    and positions it hovering above LUIS's right shoulder (X=-0.430m, Y=-0.055m, Z=1.862m)
    with zero skeletal bone weights and a >= 0.060m 3D air gap. (Governed by functional_specification_022.md)
    """
    doom_sh = import_glb_mesh(DOOM_SHOULDER_RAW_PATH, "DOOM_Companion")
    doom_sh.name = "DOOM_Companion"
    doom_sh.data.name = "DOOM_Companion"
    if differentiate_mat:
        differentiate_character_material(doom_sh, "DOOM_Shoulder_Material", "DOOM_Shoulder_BaseColor")

    clean_mesh_topology(doom_sh)

    # Trim lower neck pedestal below Z_raw = -0.805
    bm = bmesh.new()
    bm.from_mesh(doom_sh.data)
    bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        plane_co=(0.0, 0.0, DOOM_SHOULDER_NECK_CUT_Z),
        plane_no=(0.0, 0.0, -1.0),
        clear_outer=True,
        clear_inner=False,
    )
    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=len, reverse=True)
        bmesh.ops.delete(bm, geom=[vt for isl in islands[1:] for vt in isl], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(doom_sh.data)
    bm.free()
    doom_sh.data.update()

    fast_c_decimate(doom_sh, DOOM_SHOULDER_TARGET_TRIS, preserve_uvs=preserve_uvs)

    # Center at bounding-box midpoint, scale uniformly by DOOM_SHOULDER_SCALE (0.180),
    # and translate to above-shoulder hover coordinates in LUIS's standardized 2.000m frame
    verts = [vt.co for vt in doom_sh.data.vertices]
    cx = 0.5 * (min(v.x for v in verts) + max(v.x for v in verts))
    cy = 0.5 * (min(v.y for v in verts) + max(v.y for v in verts))
    cz = 0.5 * (min(v.z for v in verts) + max(v.z for v in verts))
    center_offset = mathutils.Vector((-cx, -cy, -cz))
    target_center = mathutils.Vector((DOOM_SHOULDER_CENTER_X, DOOM_SHOULDER_CENTER_Y, DOOM_SHOULDER_CENTER_Z))
    for vt in doom_sh.data.vertices:
        vt.co = (vt.co + center_offset) * DOOM_SHOULDER_SCALE + target_center
    doom_sh.data.name = "DOOM_Companion"
    doom_sh.data.update()

    # Enforce zero vertex groups and zero armature modifiers (Spec 022 §4.1 & §5.1)
    doom_sh.vertex_groups.clear()
    doom_sh.modifiers.clear()
    doom_sh.parent = None
    return doom_sh


def build_decimated_luis() -> Tuple[bpy.types.Object, bpy.types.Object]:
    """
    Builds, decimates, and unifies full-color textured Character A (CharacterMesh, 20,006 tris)
    from Luis_BODY_COLOR.glb and LUIS_HEAD_COLOR.glb alongside the separate, un-skinned
    above-shoulder levitating DOOM_Companion Mesh (3,200 tris) while preserving all three
    2048x2048 PBR baseColor textures and UV seam coordinates (delimit={'UV'}).
    (Governed by functional_specification_015.md & functional_specification_022.md)
    """
    luis_body = import_glb_mesh(LUIS_BODY_COLOR_PATH, "LUIS_BODY_COLOR")
    differentiate_character_material(luis_body, "LUIS_Body_Material", "LUIS_Body_BaseColor")

    luis_head = import_glb_mesh(LUIS_HEAD_COLOR_PATH, "LUIS_HEAD_COLOR")
    differentiate_character_material(luis_head, "LUIS_Head_Material", "LUIS_Head_BaseColor")

    clean_mesh_topology(luis_body)
    clean_mesh_topology(luis_head)

    # Protect hands/fingers on Luis_BODY_COLOR during UV-locked decimation to 14,500 triangles
    n_v = len(luis_body.data.vertices)
    coords = np.empty(n_v * 3, dtype=np.float32)
    luis_body.data.vertices.foreach_get("co", coords)
    v = coords.reshape(-1, 3)
    x_max = np.abs(v[:, 0]).max()
    vg = luis_body.vertex_groups.new(name="Protect_Fingers_Joints")
    hand_idx = np.where(np.abs(v[:, 0]) > x_max * 0.78)[0].tolist()
    body_idx = np.where(np.abs(v[:, 0]) <= x_max * 0.78)[0].tolist()
    vg.add(hand_idx, 0.20, 'REPLACE')
    vg.add(body_idx, 1.00, 'REPLACE')
    fast_c_decimate(luis_body, 14500, protect_vg_name=vg.name, preserve_uvs=True)

    # Trim lower neck rim below Z=-0.750, UV-lock decimate to 5,500 triangles, and seat LUIS_HEAD_COLOR
    bm = bmesh.new()
    bm.from_mesh(luis_head.data)
    bmesh.ops.bisect_plane(
        bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        plane_co=(0.0, 0.0, NECK_CUT_Z), plane_no=(0.0, 0.0, -1.0), clear_outer=True, clear_inner=False
    )
    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=len, reverse=True)
        bmesh.ops.delete(bm, geom=[vt for isl in islands[1:] for vt in isl], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(luis_head.data)
    bm.free()
    luis_head.data.update()

    fast_c_decimate(luis_head, 5500, preserve_uvs=True)
    mat_scale = mathutils.Matrix.Scale(SCALE_HEAD_2, 4)
    luis_head.data.transform(mat_scale)
    luis_head.data.update()
    min_z = min(vt.co.z for vt in luis_head.data.vertices)
    delta_z = LUIS_NECK_SEAT_Z - min_z
    mat_trans = mathutils.Matrix.Translation((LUIS_COLLAR_CENTER_X, LUIS_COLLAR_CENTER_Y, delta_z))
    luis_head.data.transform(mat_trans)
    luis_head.data.update()

    luis_mesh = unify_and_standardize_character("CharacterMesh", [luis_body, luis_head])
    luis_mesh.name = "CharacterMesh"
    luis_mesh.data.name = "CharacterMesh"

    doom_companion = prepare_doom_shoulder_companion(preserve_uvs=True, differentiate_mat=True)
    return luis_mesh, doom_companion


def build_decimated_luis_clay() -> Tuple[bpy.types.Object, bpy.types.Object]:
    """
    Builds, decimates, and unifies the untextured clay Character A (CharacterMesh, 20,006 tris)
    from LUIS_TPOSE.glb and LUIS_HEAD.glb alongside the separate, un-skinned above-shoulder
    levitating DOOM_Companion Mesh (3,200 tris) with a uniform matte clay material.
    (Governed by functional_specification_022.md)
    """
    luis_body = import_glb_mesh(LUIS_TPOSE_PATH, "LUIS_TPOSE_CLAY")
    luis_head = import_glb_mesh(LUIS_HEAD_PATH, "LUIS_HEAD_CLAY")

    clean_mesh_topology(luis_body)
    clean_mesh_topology(luis_head)

    # Protect hands/fingers on LUIS_TPOSE during decimation to 14,500 triangles
    n_v = len(luis_body.data.vertices)
    coords = np.empty(n_v * 3, dtype=np.float32)
    luis_body.data.vertices.foreach_get("co", coords)
    v = coords.reshape(-1, 3)
    x_max = np.abs(v[:, 0]).max()
    vg = luis_body.vertex_groups.new(name="Protect_Fingers_Joints")
    hand_idx = np.where(np.abs(v[:, 0]) > x_max * 0.78)[0].tolist()
    body_idx = np.where(np.abs(v[:, 0]) <= x_max * 0.78)[0].tolist()
    vg.add(hand_idx, 0.20, 'REPLACE')
    vg.add(body_idx, 1.00, 'REPLACE')
    fast_c_decimate(luis_body, 14500, protect_vg_name=vg.name, preserve_uvs=False)

    # Trim lower neck rim below Z=-0.750, decimate to 5,500 triangles, and seat LUIS_HEAD
    bm = bmesh.new()
    bm.from_mesh(luis_head.data)
    bmesh.ops.bisect_plane(
        bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        plane_co=(0.0, 0.0, NECK_CUT_Z), plane_no=(0.0, 0.0, -1.0), clear_outer=True, clear_inner=False
    )
    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=len, reverse=True)
        bmesh.ops.delete(bm, geom=[vt for isl in islands[1:] for vt in isl], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(luis_head.data)
    bm.free()
    luis_head.data.update()

    fast_c_decimate(luis_head, 5500, preserve_uvs=False)
    mat_scale = mathutils.Matrix.Scale(SCALE_HEAD_2, 4)
    luis_head.data.transform(mat_scale)
    luis_head.data.update()
    min_z = min(vt.co.z for vt in luis_head.data.vertices)
    delta_z = LUIS_NECK_SEAT_Z - min_z
    mat_trans = mathutils.Matrix.Translation((LUIS_COLLAR_CENTER_X, LUIS_COLLAR_CENTER_Y, delta_z))
    luis_head.data.transform(mat_trans)
    luis_head.data.update()

    unified_clay = unify_and_standardize_character("CharacterMesh", [luis_body, luis_head])
    unified_clay.name = "CharacterMesh"
    unified_clay.data.name = "CharacterMesh"

    doom_companion = prepare_doom_shoulder_companion(preserve_uvs=False, differentiate_mat=False)

    clay_mat = bpy.data.materials.new(name="LUIS_Clay_Material")
    clay_mat.use_nodes = True
    bsdf = next((n for n in clay_mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = (0.76, 0.76, 0.76, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = 0.85

    for obj in (unified_clay, doom_companion):
        obj.data.materials.clear()
        obj.data.materials.append(clay_mat)
        for poly in obj.data.polygons:
            poly.material_index = 0
        obj.data.update()

    return unified_clay, doom_companion


def unify_and_standardize_character(
    character_name: str,
    component_objs: List[bpy.types.Object],
    target_height: float = TARGET_STATURE_METERS,
) -> bpy.types.Object:
    # Tag head vs body vertices BEFORE joining so hoodie collars/deltoids never receive Head weight
    for obj in component_objs:
        vg_h = obj.vertex_groups.new(name="_IS_HEAD_PART")
        val = 1.0 if "HEAD" in obj.name.upper() else 0.0
        if val > 0.0:
            vg_h.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')

    bpy.ops.object.select_all(action='DESELECT')
    for obj in component_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = component_objs[0]
    bpy.ops.object.join()
    unified_obj = bpy.context.active_object
    unified_obj.name = character_name
    unified_obj.data.name = character_name

    # Triangulate and ensure clean topology with smooth outward normals
    bm = bmesh.new()
    bm.from_mesh(unified_obj.data)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(unified_obj.data)
    bm.free()
    unified_obj.data.update()

    verts = [v.co for v in unified_obj.data.vertices]
    z_min = min(v.z for v in verts)
    z_max = max(v.z for v in verts)
    h_current = z_max - z_min
    x_mid = 0.5 * (min(v.x for v in verts) + max(v.x for v in verts))
    y_mid = 0.5 * (min(v.y for v in verts) + max(v.y for v in verts))

    offset = mathutils.Vector((-x_mid, -y_mid, -z_min))
    scale_factor = target_height / h_current
    for v in unified_obj.data.vertices:
        v.co = (v.co + offset) * scale_factor
    unified_obj.data.update()

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    tri_count = len(unified_obj.data.polygons)
    if not (MIN_TRIANGLES <= tri_count <= MAX_TRIANGLES):
        raise ValueError(f"Fatal: {character_name} triangle count {tri_count} outside [{MIN_TRIANGLES}, {MAX_TRIANGLES}].")

    print(f"Decimated & Standardized {character_name}: {tri_count} triangles, {len(unified_obj.data.vertices)} vertices, Height=2.000m")
    return unified_obj


def load_quaternius_reference_data() -> Tuple[List[Dict[str, Any]], bpy.types.Object, List[bpy.types.Object]]:
    """
    Imports UAL1_Standard.glb and extracts all 65 bone definitions (name, parent,
    head_local, tail_local, matrix_local, length) plus the imported armature and objects.
    """
    if not os.path.exists(UAL1_GLB_PATH):
        raise FileNotFoundError(f"Fatal: Quaternius UAL1_Standard.glb missing at '{UAL1_GLB_PATH}'.")
    objs_before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=UAL1_GLB_PATH)
    objs_after = set(bpy.data.objects)
    imported_objs = list(objs_after - objs_before)
    ual_arm = next(o for o in imported_objs if o.type == 'ARMATURE')

    bone_specs = []
    for b in ual_arm.data.bones:
        bone_specs.append({
            "name": b.name,
            "parent": b.parent.name if b.parent else None,
            "head": b.head_local.copy(),
            "tail": b.tail_local.copy(),
            "matrix": b.matrix_local.copy(),
            "rot3x3": b.matrix_local.to_3x3().copy(),
            "length": b.length,
        })
    return bone_specs, ual_arm, imported_objs


def create_character_armatures(
    character_name: str,
    bone_specs: List[Dict[str, Any]],
) -> Tuple[bpy.types.Object, bpy.types.Object]:
    """
    Creates:
    1. Native-Pose Fitting Armature (fitted to LUIS T-pose or PLATODOOM A-pose)
    2. Canonical Quaternius Rest-Pose Armature (where every bone's 3x3 rest orientation
       matches UAL1_Standard.glb 100% identically while preserving the character's
       anatomical joint origins and limb lengths).
    """
    is_doom = (character_name == "PLATODOOM")
    spec_map = {b["name"]: b for b in bone_specs}

    # Build Canonical Quaternius Armature first (fitted to character stature/joint centers,
    # with 100% identical 3x3 bone orientations to UAL1_Standard.glb)
    canon_data = bpy.data.armatures.new(f"{character_name}_ArmatureData")
    canon_obj = bpy.data.objects.new(f"{character_name}_Armature", canon_data)
    bpy.context.collection.objects.link(canon_obj)

    bpy.ops.object.select_all(action='DESELECT')
    canon_obj.select_set(True)
    bpy.context.view_layer.objects.active = canon_obj
    bpy.ops.object.mode_set(mode='EDIT')

    # Scale factor for spine/head/arm reach relative to UAL1 (1.829m -> 2.000m)
    z_torso_scale = 1.085 if is_doom else 1.095
    leg_x = 0.125 if is_doom else 0.132
    ankle_x = 0.175 if is_doom else 0.144
    arm_scale = 0.96 if is_doom else 0.90

    canon_heads: Dict[str, mathutils.Vector] = {}
    canon_lengths: Dict[str, float] = {}

    for b in bone_specs:
        bname = b["name"]
        h_ual = b["head"]
        L_ual = b["length"]

        if bname == "root":
            canon_heads[bname] = mathutils.Vector((0.0, 0.0, 0.0))
            canon_lengths[bname] = L_ual
        elif bname == "pelvis":
            canon_heads[bname] = mathutils.Vector((0.0, 0.015 if is_doom else 0.005, 0.920))
            canon_lengths[bname] = L_ual * z_torso_scale
        elif bname in ("spine_01", "spine_02", "spine_03", "neck_01", "Head"):
            z_h = 0.920 + (h_ual.z - 0.9167) * z_torso_scale
            y_h = (0.005 if is_doom else 0.010) + h_ual.y * 0.5
            canon_heads[bname] = mathutils.Vector((0.0, y_h, z_h))
            canon_lengths[bname] = L_ual * (1.25 if bname == "Head" else z_torso_scale)
        elif bname in ("clavicle_l", "clavicle_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            z_sh = 1.485 if is_doom else 1.500
            canon_heads[bname] = mathutils.Vector((sgn * 0.020, -0.040, z_sh))
            canon_lengths[bname] = L_ual * 0.95
        elif bname in ("upperarm_l", "upperarm_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            z_sh = 1.485 if is_doom else 1.505
            y_sh = 0.012 if is_doom else 0.000
            canon_heads[bname] = mathutils.Vector((sgn * (0.205 if is_doom else 0.175), y_sh, z_sh))
            canon_lengths[bname] = 0.292 if is_doom else 0.275
        elif bname in ("lowerarm_l", "lowerarm_r"):
            parent_n = b["parent"]
            p_head = canon_heads[parent_n]
            p_dir = (spec_map[parent_n]["rot3x3"] @ mathutils.Vector((0.0, 1.0, 0.0))).normalized()
            canon_heads[bname] = p_head + p_dir * canon_lengths[parent_n]
            canon_lengths[bname] = 0.268 if is_doom else 0.265
        elif bname in ("hand_l", "hand_r"):
            parent_n = b["parent"]
            p_head = canon_heads[parent_n]
            p_dir = (spec_map[parent_n]["rot3x3"] @ mathutils.Vector((0.0, 1.0, 0.0))).normalized()
            canon_heads[bname] = p_head + p_dir * canon_lengths[parent_n]
            canon_lengths[bname] = L_ual * arm_scale
        elif any(bname.startswith(fp) for fp in ("index_", "middle_", "pinky_", "ring_", "thumb_")):
            side = "_l" if bname.endswith("_l") else "_r"
            hand_n = f"hand{side}"
            hand_h_ual = spec_map[hand_n]["head"]
            hand_h_can = canon_heads[hand_n]
            rel_ual = h_ual - hand_h_ual
            # Scale finger offset proportionally to character hand size
            f_scale = 0.72 if is_doom else 0.68
            canon_heads[bname] = hand_h_can + rel_ual * f_scale
            canon_lengths[bname] = L_ual * f_scale
        elif bname in ("thigh_l", "thigh_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            canon_heads[bname] = mathutils.Vector((sgn * leg_x, 0.005 if is_doom else -0.005, 0.925))
            canon_lengths[bname] = 0.398
        elif bname in ("calf_l", "calf_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            canon_heads[bname] = mathutils.Vector((sgn * leg_x, -0.008, 0.528))
            canon_lengths[bname] = 0.422
        elif bname in ("foot_l", "foot_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            canon_heads[bname] = mathutils.Vector((sgn * ankle_x, 0.020 if is_doom else 0.012, 0.105))
            canon_lengths[bname] = L_ual * 0.92
        elif bname in ("ball_l", "ball_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            canon_heads[bname] = mathutils.Vector((sgn * ankle_x, -0.095 if is_doom else -0.105, 0.016))
            canon_lengths[bname] = L_ual * 0.90
        elif bname in ("ball_leaf_l", "ball_leaf_r"):
            sgn = 1.0 if bname.endswith("_l") else -1.0
            canon_heads[bname] = mathutils.Vector((sgn * ankle_x, -0.165 if is_doom else -0.175, 0.016))
            canon_lengths[bname] = L_ual * 0.90

    for b in bone_specs:
        bname = b["name"]
        eb = canon_data.edit_bones.new(bname)
        eb.use_connect = False
        rot3 = b["rot3x3"]
        y_axis = (rot3 @ mathutils.Vector((0.0, 1.0, 0.0))).normalized()
        z_axis = (rot3 @ mathutils.Vector((0.0, 0.0, 1.0))).normalized()
        eb.head = canon_heads[bname]
        eb.tail = eb.head + y_axis * max(0.01, canon_lengths[bname])
        eb.align_roll(z_axis)

    for b in bone_specs:
        if b["parent"]:
            canon_data.edit_bones[b["name"]].parent = canon_data.edit_bones[b["parent"]]

    bpy.ops.object.mode_set(mode='OBJECT')

    # Now create Native-Pose Fitting Armature by duplicating Canon Armature and rotating
    # PLATODOOM's arms/hands/fingers into his native downward A-pose (and aligning LUIS's high T-pose shoulders)
    native_data = canon_data.copy()
    native_data.name = f"{character_name}_NativeArmData"
    native_obj = bpy.data.objects.new(f"{character_name}_NativeArmature", native_data)
    bpy.context.collection.objects.link(native_obj)

    bpy.ops.object.select_all(action='DESELECT')
    native_obj.select_set(True)
    bpy.context.view_layer.objects.active = native_obj
    bpy.ops.object.mode_set(mode='EDIT')

    if is_doom:
        for side_sgn, suffix in [(1.0, "_l"), (-1.0, "_r")]:
            sh_head = canon_heads[f"upperarm{suffix}"]
            elbow_p = mathutils.Vector((side_sgn * 0.372, 0.042, 1.245))
            wrist_p = mathutils.Vector((side_sgn * 0.505, 0.010, 1.012))

            # Upper arm rotation from T-pose to A-pose
            eb_up = native_data.edit_bones[f"upperarm{suffix}"]
            v_up_can = (eb_up.tail - eb_up.head).normalized()
            v_up_nat = (elbow_p - sh_head).normalized()
            q_up = v_up_can.rotation_difference(v_up_nat)
            mat_up = q_up.to_matrix()

            eb_up.head = sh_head
            eb_up.tail = elbow_p
            eb_up.align_roll(mat_up @ eb_up.z_axis)

            # Lower arm rotation from T-pose to A-pose forearm axis
            eb_lo = native_data.edit_bones[f"lowerarm{suffix}"]
            v_lo_can = (eb_lo.tail - eb_lo.head).normalized()
            v_lo_nat = (wrist_p - elbow_p).normalized()
            # Also Supinate palm forward/inward (~65 deg around forearm axis) to match DOOM_HAND
            q_lo_swing = v_lo_can.rotation_difference(v_lo_nat)
            q_lo_twist = mathutils.Quaternion(v_lo_nat, side_sgn * math.radians(-65.0))
            q_lo = q_lo_twist @ q_lo_swing
            mat_lo = q_lo.to_matrix()

            eb_lo.head = elbow_p
            eb_lo.tail = wrist_p
            eb_lo.align_roll(mat_lo @ eb_lo.z_axis)

            # Transform hand and all 20 finger bones rigidly from canonical wrist to native A-pose wrist
            can_wrist = canon_heads[f"hand{suffix}"]
            hand_chain = [f"hand{suffix}"] + [
                f"{fg}_0{idx}{ '_leaf' if idx==4 else '' }{suffix}"
                for fg in ("index", "middle", "pinky", "ring", "thumb")
                for idx in (1, 2, 3, 4)
            ]
            for hname in hand_chain:
                eb_h = native_data.edit_bones[hname]
                h_rel = eb_h.head - can_wrist
                t_rel = eb_h.tail - can_wrist
                z_old = eb_h.z_axis.copy()
                eb_h.head = wrist_p + (mat_lo @ h_rel)
                eb_h.tail = wrist_p + (mat_lo @ t_rel)
                eb_h.align_roll(mat_lo @ z_old)
    else:
        # For LUIS: his raw T-pose mesh has elevated, hunched shoulders (deltoid & sleeve axis at Z ~ 1.585m).
        # Fit the native clavicle/arm chain to his elevated T-pose sleeve axis so that when
        # normalize_to_quaternius_rest_pose rotates the clavicle & arm down to the canonical horizontal
        # shoulder height (Z = 1.505m), the hunched hoodie shoulder relaxes naturally before baking!
        for side_sgn, suffix in [(1.0, "_l"), (-1.0, "_r")]:
            eb_cl = native_data.edit_bones[f"clavicle{suffix}"]
            cl_head = eb_cl.head.copy()
            cl_tail_can = eb_cl.tail.copy()
            # Elevate native shoulder joint by +0.065m to match the raw high-shoulder T-pose
            sh_nat = mathutils.Vector((side_sgn * 0.175, 0.000, 1.570))
            v_cl_can = (cl_tail_can - cl_head).normalized()
            v_cl_nat = (sh_nat - cl_head).normalized()
            q_cl = v_cl_can.rotation_difference(v_cl_nat)
            mat_cl = q_cl.to_matrix()
            z_cl_old = eb_cl.z_axis.copy()
            eb_cl.tail = cl_head + v_cl_nat * eb_cl.length
            eb_cl.align_roll(mat_cl @ z_cl_old)

            # Shift native upperarm, lowerarm, hand, and fingers up along the raw T-pose sleeve centerline (Z = 1.580m)
            elbow_nat = mathutils.Vector((side_sgn * 0.450, -0.010, 1.582))
            wrist_nat = mathutils.Vector((side_sgn * 0.715, -0.020, 1.585))

            eb_up = native_data.edit_bones[f"upperarm{suffix}"]
            v_up_can = (eb_up.tail - eb_up.head).normalized()
            v_up_nat = (elbow_nat - sh_nat).normalized()
            mat_up = v_up_can.rotation_difference(v_up_nat).to_matrix()
            z_up_old = eb_up.z_axis.copy()
            eb_up.head = sh_nat
            eb_up.tail = elbow_nat
            eb_up.align_roll(mat_up @ z_up_old)

            eb_lo = native_data.edit_bones[f"lowerarm{suffix}"]
            v_lo_can = (eb_lo.tail - eb_lo.head).normalized()
            v_lo_nat = (wrist_nat - elbow_nat).normalized()
            mat_lo = v_lo_can.rotation_difference(v_lo_nat).to_matrix()
            z_lo_old = eb_lo.z_axis.copy()
            eb_lo.head = elbow_nat
            eb_lo.tail = wrist_nat
            eb_lo.align_roll(mat_lo @ z_lo_old)

            can_wrist = canon_heads[f"hand{suffix}"]
            hand_chain = [f"hand{suffix}"] + [
                f"{fg}_0{idx}{ '_leaf' if idx==4 else '' }{suffix}"
                for fg in ("index", "middle", "pinky", "ring", "thumb")
                for idx in (1, 2, 3, 4)
            ]
            for hname in hand_chain:
                eb_h = native_data.edit_bones[hname]
                h_rel = eb_h.head - can_wrist
                t_rel = eb_h.tail - can_wrist
                z_old = eb_h.z_axis.copy()
                eb_h.head = wrist_nat + (mat_lo @ h_rel)
                eb_h.tail = wrist_nat + (mat_lo @ t_rel)
                eb_h.align_roll(mat_lo @ z_old)

    bpy.ops.object.mode_set(mode='OBJECT')

    return native_obj, canon_obj


def point_to_segment_dist_sq(pts: np.ndarray, a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Vectorized squared distance from N points (N,3) to line segment [a, b]."""
    ab = b - a
    ab_len_sq = float(np.dot(ab, ab))
    if ab_len_sq < 1e-10:
        diff = pts - a
        return np.sum(diff * diff, axis=1)
    ap = pts - a
    t = np.clip(np.dot(ap, ab) / ab_len_sq, 0.0, 1.0)
    proj = a + np.outer(t, ab)
    diff = pts - proj
    return np.sum(diff * diff, axis=1)


def compute_isolated_skin_weights(
    mesh_obj: bpy.types.Object,
    native_arm: bpy.types.Object,
    character_name: str,
) -> Dict[str, Any]:
    """
    Assigns anatomically partitioned, smooth, normalized 4-bone skin weights:
    - Zero weight bleed between PLATODOOM's downward A-pose arms and torso/belt/tunic.
    - Zero weight bleed between left and right legs across X=0.
    - Smooth pelvis + thigh_l + thigh_r interpolation across PLATODOOM's tunic skirt.
    - 100% rigid Head weight on skull, face, mask, laurel wreath, and backwards cap.
    - Strictly <= 4 influences per vertex, normalized to 1.0, 0 unweighted vertices.
    """
    is_doom = (character_name == "PLATODOOM")
    mesh = mesh_obj.data
    n_verts = len(mesh.vertices)
    coords = np.empty(n_verts * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", coords)
    v = coords.reshape(-1, 3)
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    x_abs = np.abs(x)

    # Read pre-join head component tag so hoodie collar/shoulders never get Head weight
    is_head_comp = np.zeros(n_verts, dtype=bool)
    vg_head_tag = mesh_obj.vertex_groups.get("_IS_HEAD_PART")
    if vg_head_tag is not None:
        tag_idx = vg_head_tag.index
        for i_v, vt in enumerate(mesh.vertices):
            for g in vt.groups:
                if g.group == tag_idx and g.weight > 0.5:
                    is_head_comp[i_v] = True
                    break

    is_body_comp = ~is_head_comp

    bones = native_arm.data.bones
    bone_names = [b.name for b in bones]
    bone_idx_map = {name: i for i, name in enumerate(bone_names)}
    n_bones = len(bone_names)

    # Create all 65 vertex groups on mesh_obj
    mesh_obj.vertex_groups.clear()
    vgs = {name: mesh_obj.vertex_groups.new(name=name) for name in bone_names}

    W = np.zeros((n_verts, n_bones), dtype=np.float32)

    # Precompute segment distances for upper limb bones (clavicle, upperarm, lowerarm, hand, fingers)
    # Exclude leaf bones from taking primary skin weights so deform bones drive vertices cleanly
    upper_limb_bones_l = [
        "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
        "index_01_l", "index_02_l", "index_03_l",
        "middle_01_l", "middle_02_l", "middle_03_l",
        "pinky_01_l", "pinky_02_l", "pinky_03_l",
        "ring_01_l", "ring_02_l", "ring_03_l",
        "thumb_01_l", "thumb_02_l", "thumb_03_l",
    ]
    upper_limb_bones_r = [b.replace("_l", "_r") for b in upper_limb_bones_l]

    # 1. Identify strict anatomical domains
    if is_doom:
        # Axillary separating surface X_sep(Z) = 0.225 + 0.35 * max(0, 1.32 - Z)
        x_sep = 0.225 + 0.35 * np.maximum(0.0, 1.32 - z)
        is_arm_l = is_body_comp & (x > x_sep) & (z > 0.74) & (z < 1.62)
        is_arm_r = is_body_comp & (x < -x_sep) & (z > 0.74) & (z < 1.62)
        is_shoulder_blend_l = is_body_comp & (x > 0.15) & (x <= x_sep) & (z >= 1.28) & (z < 1.65)
        is_shoulder_blend_r = is_body_comp & (x < -0.15) & (x >= -x_sep) & (z >= 1.28) & (z < 1.65)
        is_rigid_head = is_head_comp & ((z >= 1.655) | ((z >= 1.625) & (y < -0.03)))
        is_neck_blend = is_head_comp & (~is_rigid_head)
    else:
        # LUIS T-Pose: use is_body_comp so the head never receives arm/collar weights
        x_arm_thresh = np.where(z >= 1.44, 0.245, 0.265)
        is_arm_l = is_body_comp & (x > x_arm_thresh) & (z > 1.42) & (z < 1.75)
        is_arm_r = is_body_comp & (x < -x_arm_thresh) & (z > 1.42) & (z < 1.75)
        is_shoulder_blend_l = is_body_comp & (x > 0.09) & (x <= x_arm_thresh) & (z > 1.34) & (z < 1.76)
        is_shoulder_blend_r = is_body_comp & (x < -0.09) & (x >= -x_arm_thresh) & (z > 1.34) & (z < 1.76)
        is_rigid_head = is_head_comp & ((z >= 1.650) | ((z >= 1.620) & (y < -0.02)))
        is_neck_blend = is_head_comp & (~is_rigid_head)

    # 2. Assign Rigid Head & Cervical Neck weights
    W[is_rigid_head, bone_idx_map["Head"]] = 1.0

    if is_neck_blend.any():
        z_n = z[is_neck_blend]
        z_lo, z_hi = (1.54, 1.655) if is_doom else (1.53, 1.650)
        t_head = np.clip((z_n - (z_lo + 0.04)) / (z_hi - (z_lo + 0.04)), 0.0, 1.0)
        t_sp3 = np.clip(((z_lo + 0.05) - z_n) / 0.05, 0.0, 1.0)
        t_neck = np.maximum(0.0, 1.0 - t_head - t_sp3)
        W[is_neck_blend, bone_idx_map["Head"]] = t_head
        W[is_neck_blend, bone_idx_map["neck_01"]] = t_neck
        W[is_neck_blend, bone_idx_map["spine_03"]] = t_sp3

    # 3. Assign Isolated Arm, Forearm, Hand, and 5-Digit Weights
    for is_arm_mask, sh_blend_mask, limb_list, side_sgn, suffix in [
        (is_arm_l, is_shoulder_blend_l, upper_limb_bones_l, 1.0, "_l"),
        (is_arm_r, is_shoulder_blend_r, upper_limb_bones_r, -1.0, "_r"),
    ]:
        arm_indices = np.where(is_arm_mask)[0]
        if len(arm_indices) > 0:
            pts_arm = v[arm_indices]
            wrist_co = np.array(bones[f"hand{suffix}"].head_local, dtype=np.float32)
            # Determine distal distance from shoulder to separate arm vs fingers
            sh_co = np.array(bones[f"upperarm{suffix}"].head_local, dtype=np.float32)
            el_co = np.array(bones[f"lowerarm{suffix}"].head_local, dtype=np.float32)

            # Separate major arm segments (clavicle, upperarm, lowerarm, hand) vs finger bones
            major_bones = [f"clavicle{suffix}", f"upperarm{suffix}", f"lowerarm{suffix}", f"hand{suffix}"]
            finger_bones = [b for b in limb_list if b not in major_bones]

            for bname in major_bones:
                b_obj = bones[bname]
                a_pt = np.array(b_obj.head_local, dtype=np.float32)
                b_pt = np.array(b_obj.tail_local, dtype=np.float32)
                d2 = point_to_segment_dist_sq(pts_arm, a_pt, b_pt)
                sigma = 0.045 if "hand" in bname else 0.080
                w_b = np.exp(-d2 / (2.0 * sigma * sigma))
                # Prevent clavicle/upperarm from influencing hand
                dist_from_sh = np.linalg.norm(pts_arm - sh_co, axis=1)
                if "clavicle" in bname:
                    w_b *= np.clip(1.0 - dist_from_sh / 0.16, 0.0, 1.0)
                elif "upperarm" in bname:
                    w_b *= np.clip(1.0 - (dist_from_sh - 0.34) / 0.12, 0.0, 1.0)
                W[arm_indices, bone_idx_map[bname]] = w_b

            # Finger bones only on vertices distal to wrist
            dist_from_el = np.linalg.norm(pts_arm - el_co, axis=1)
            forearm_len = float(np.linalg.norm(wrist_co - el_co))
            is_distal_hand = dist_from_el > (forearm_len + 0.025)
            if is_distal_hand.any():
                f_indices = arm_indices[is_distal_hand]
                pts_f = v[f_indices]
                for bname in finger_bones:
                    b_obj = bones[bname]
                    a_pt = np.array(b_obj.head_local, dtype=np.float32)
                    b_pt = np.array(b_obj.tail_local, dtype=np.float32)
                    d2 = point_to_segment_dist_sq(pts_f, a_pt, b_pt)
                    sigma_f = 0.018
                    W[f_indices, bone_idx_map[bname]] = np.exp(-d2 / (2.0 * sigma_f * sigma_f))

        # Shoulder deltoid blend zone (clavicle + upperarm + spine_03)
        sh_indices = np.where(sh_blend_mask)[0]
        if len(sh_indices) > 0:
            x_s = np.abs(v[sh_indices, 0])
            z_s = v[sh_indices, 2]
            if is_doom:
                t_x = np.clip((x_s - 0.15) / (0.225 - 0.15), 0.0, 1.0)
                t_z = np.clip((z_s - 1.28) / 0.08, 0.0, 1.0)
                t_arm = t_x * t_z
                W[sh_indices, bone_idx_map["spine_03"]] = 1.0 - t_arm
                W[sh_indices, bone_idx_map[f"clavicle{suffix}"]] = 0.55 * t_arm
                W[sh_indices, bone_idx_map[f"upperarm{suffix}"]] = 0.45 * t_arm
            else:
                # Smoothly ramp deltoid & hoodie shoulder from spine_03 (at |X|=0.09) -> clavicle -> upperarm (at |X|=0.245)
                t_x = np.clip((x_s - 0.09) / (0.245 - 0.09), 0.0, 1.0)
                t_z = np.clip((z_s - 1.34) / 0.10, 0.0, 1.0)
                t_sh = t_x * t_z
                w_sp3 = 1.0 - t_sh
                # Peak clavicle in mid-shoulder (|X| ~ 0.14-0.19) and ramp upperarm to dominate outer deltoid (|X| > 0.18)
                t_outer = np.clip((x_s - 0.14) / (0.245 - 0.14), 0.0, 1.0)
                w_up = t_sh * (0.25 + 0.65 * t_outer)
                w_cl = t_sh - w_up
                W[sh_indices, bone_idx_map["spine_03"]] = w_sp3
                W[sh_indices, bone_idx_map[f"clavicle{suffix}"]] = w_cl
                W[sh_indices, bone_idx_map[f"upperarm{suffix}"]] = w_up

    # 4. Assign Torso, Pelvis, Tunic Skirt, and Lower Limb Weights on remaining vertices
    assigned_mask = W.sum(axis=1) > 1e-5
    rem_indices = np.where(~assigned_mask)[0]
    if len(rem_indices) > 0:
        z_r = z[rem_indices]
        x_r = x[rem_indices]
        y_r = y[rem_indices]

        # Upper Torso & Axial Spine (z >= 0.94)
        torso_mask = z_r >= 0.94
        if torso_mask.any():
            t_idx = rem_indices[torso_mask]
            zt = z[t_idx]
            # Smooth Gaussian centers for pelvis (0.94), spine_01 (1.10), spine_02 (1.25), spine_03 (1.44)
            for bname, z_c, sig in [
                ("pelvis", 0.94, 0.08),
                ("spine_01", 1.09, 0.09),
                ("spine_02", 1.24, 0.09),
                ("spine_03", 1.43, 0.11),
            ]:
                W[t_idx, bone_idx_map[bname]] = np.exp(-((zt - z_c) ** 2) / (2.0 * sig * sig))

        # Lower Body & Legs (z < 0.94)
        leg_mask = z_r < 0.94
        if leg_mask.any():
            l_idx = rem_indices[leg_mask]
            zl = z[l_idx]
            xl = x[l_idx]
            yl = y[l_idx]

            if is_doom:
                # PLATODOOM Tunic Skirt & Shins (z in [0.14, 0.94]): continuous smooth blend across midline X=0
                skirt_mask = zl >= 0.14
                if skirt_mask.any():
                    sk_idx = l_idx[skirt_mask]
                    z_sk = z[sk_idx]
                    x_sk = x[sk_idx]
                    # Pelvis influence fades smoothly from 1.0 at belt (z=0.94) to 0.0 at knee (z=0.52)
                    w_pelvis = np.clip((z_sk - 0.52) / (0.94 - 0.52), 0.0, 1.0) ** 1.35
                    w_limb = 1.0 - w_pelvis
                    # Smooth transition from thigh (above z=0.52) to calf (below z=0.45)
                    t_calf = np.clip((0.55 - z_sk) / 0.14, 0.0, 1.0)
                    w_thigh_tot = w_limb * (1.0 - t_calf)
                    w_calf_tot = w_limb * t_calf
                    # Smooth sigmoid across midline X=0 (width 0.055m) so tunic skirt & hem part without tearing
                    t_left = 1.0 / (1.0 + np.exp(-x_sk / 0.055))
                    W[sk_idx, bone_idx_map["pelvis"]] = w_pelvis
                    W[sk_idx, bone_idx_map["thigh_l"]] = w_thigh_tot * t_left
                    W[sk_idx, bone_idx_map["thigh_r"]] = w_thigh_tot * (1.0 - t_left)
                    W[sk_idx, bone_idx_map["calf_l"]] = w_calf_tot * t_left
                    W[sk_idx, bone_idx_map["calf_r"]] = w_calf_tot * (1.0 - t_left)

                low_leg_mask = zl < 0.14
            else:
                # LUIS bifurcated sweatpants: strict left/right leg isolation below z=0.88
                hip_mask = zl >= 0.55
                if hip_mask.any():
                    hp_idx = l_idx[hip_mask]
                    z_hp = z[hp_idx]
                    x_hp = x[hp_idx]
                    w_pelvis = np.clip((z_hp - 0.80) / 0.14, 0.0, 1.0)
                    w_knee = np.clip((0.60 - z_hp) / 0.10, 0.0, 0.45)
                    w_thigh = np.maximum(0.0, 1.0 - w_pelvis - w_knee)
                    is_left = x_hp >= 0.0
                    W[hp_idx, bone_idx_map["pelvis"]] = w_pelvis
                    W[hp_idx, bone_idx_map["thigh_l"]] = w_thigh * is_left
                    W[hp_idx, bone_idx_map["thigh_r"]] = w_thigh * (~is_left)
                    W[hp_idx, bone_idx_map["calf_l"]] = w_knee * is_left
                    W[hp_idx, bone_idx_map["calf_r"]] = w_knee * (~is_left)

                low_leg_mask = zl < 0.55

            # Shins/Ankles, Flat Soles, and Toes - Strictly Isolated Left vs Right (where feet are separated)
            if low_leg_mask.any():
                ll_idx = l_idx[low_leg_mask]
                z_ll = z[ll_idx]
                x_ll = x[ll_idx]
                y_ll = y[ll_idx]

                for is_left_side, suf in [(x_ll >= 0.0, "_l"), (x_ll < 0.0, "_r")]:
                    s_idx = ll_idx[is_left_side]
                    if len(s_idx) == 0:
                        continue
                    zs = z[s_idx]
                    ys = y[s_idx]

                    # Knee transition near z=0.53, Ankle transition near z=0.11, Sole/Toe below z=0.08
                    w_th = np.clip((zs - 0.48) / 0.12, 0.0, 0.45)
                    w_ank = np.clip((0.14 - zs) / 0.06, 0.0, 1.0)
                    w_ca = np.maximum(0.0, 1.0 - w_th - w_ank)

                    # Toe break along Y <= -0.105 below z=0.07
                    toe_break = -0.100 if is_doom else -0.110
                    w_ball = w_ank * (zs < 0.075) * np.clip((toe_break - ys) / 0.045, 0.0, 1.0)
                    w_foot = w_ank - w_ball

                    W[s_idx, bone_idx_map[f"thigh{suf}"]] = w_th
                    W[s_idx, bone_idx_map[f"calf{suf}"]] = w_ca
                    W[s_idx, bone_idx_map[f"foot{suf}"]] = w_foot
                    W[s_idx, bone_idx_map[f"ball{suf}"]] = w_ball

    # 5. Enforce 4-Bone Influence Cap and Strict 1.0 Normalization
    # Zero out all but top 4 weights per vertex
    if n_bones > 4:
        top4_idx = np.argpartition(W, -4, axis=1)[:, -4:]
        W_capped = np.zeros_like(W)
        rows = np.arange(n_verts)[:, None]
        W_capped[rows, top4_idx] = W[rows, top4_idx]
        W = W_capped

    W[W < 1e-4] = 0.0
    row_sums = W.sum(axis=1, keepdims=True)
    unweighted = (row_sums[:, 0] < 1e-6)
    if unweighted.any():
        W[unweighted, bone_idx_map["pelvis"]] = 1.0
        row_sums = W.sum(axis=1, keepdims=True)
    W /= row_sums

    # Write weights to Blender vertex groups
    for b_idx, bname in enumerate(bone_names):
        col = W[:, b_idx]
        nz = np.where(col > 0.0)[0]
        if len(nz) > 0:
            vg = vgs[bname]
            for v_i in nz:
                vg.add([int(v_i)], float(col[v_i]), 'REPLACE')

    # Parent mesh to native_arm with Armature modifier
    mesh_obj.parent = native_arm
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = native_arm

    return {
        "vertices_weighted": n_verts,
        "unweighted_vertices": int(unweighted.sum()),
        "max_influences": int((W > 0).sum(axis=1).max()),
    }


def normalize_to_quaternius_rest_pose(
    mesh_obj: bpy.types.Object,
    native_arm: bpy.types.Object,
    canon_arm: bpy.types.Object,
    character_name: str,
) -> None:
    """
    Poses native_arm so every bone matches canon_arm's world rest orientation (UAL1 T-pose),
    bakes the deformed mesh as the new static base mesh, and binds it to canon_arm.
    """
    bpy.ops.object.select_all(action='DESELECT')
    native_arm.select_set(True)
    bpy.context.view_layer.objects.active = native_arm
    bpy.ops.object.mode_set(mode='POSE')

    # Traverse parent-to-child and align each PoseBone's 3x3 world rotation to canon_arm
    for b_can in canon_arm.data.bones:
        pb = native_arm.pose.bones[b_can.name]
        pb.rotation_mode = 'QUATERNION'
        rot_target = b_can.matrix_local.to_3x3()
        # Preserve current posed head position, replace 3x3 orientation
        mat_now = pb.matrix.copy()
        mat_target = rot_target.to_4x4()
        mat_target.translation = mat_now.translation
        pb.matrix = mat_target
        bpy.context.view_layer.update()

    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()

    # Bake deformed mesh via evaluated depsgraph while preserving all vertex groups & weights
    deps = bpy.context.evaluated_depsgraph_get()
    eval_mesh_obj = mesh_obj.evaluated_get(deps)
    n_verts = len(mesh_obj.data.vertices)
    baked_coords = np.empty(n_verts * 3, dtype=np.float32)
    eval_mesh_obj.data.vertices.foreach_get("co", baked_coords)

    # Ensure Z_min stays grounded at 0.000m after rest-pose bake
    baked_v = baked_coords.reshape(-1, 3)
    baked_v[:, 2] -= baked_v[:, 2].min()
    mesh_obj.data.vertices.foreach_set("co", baked_v.reshape(-1))
    mesh_obj.data.update()

    # Recalculate smooth outward normals on baked T-pose mesh
    bm = bmesh.new()
    bm.from_mesh(mesh_obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(mesh_obj.data)
    bm.free()
    mesh_obj.data.update()

    # Switch binding from native_arm to canon_arm and delete native_arm
    mesh_obj.parent = canon_arm
    for mod in mesh_obj.modifiers:
        if mod.type == 'ARMATURE':
            mod.object = canon_arm

    native_data = native_arm.data
    bpy.data.objects.remove(native_arm, do_unlink=True)
    bpy.data.armatures.remove(native_data, do_unlink=True)
    canon_arm.name = "Armature"
    canon_arm.data.name = "Armature"


def bake_companion_levitation_nla_track(companion_obj: bpy.types.Object) -> str:
    """
    Bakes an autonomous 55-frame (2.25s @ 24 FPS, f_y = 0.444 Hz) levitation NLA track
    ('DOOM_Levitation_Loop') on DOOM_Companion with sinusoidal vertical hover (A_y = 0.036m),
    subtle horizontal drift, and hover attitude oscillation around its above-shoulder centroid
    while keeping frame 1 at exact rest equilibrium (0, 0, 0). (Spec 022 §4.3)
    """
    if not companion_obj.animation_data:
        companion_obj.animation_data_create()
    while companion_obj.animation_data.nla_tracks:
        companion_obj.animation_data.nla_tracks.remove(companion_obj.animation_data.nla_tracks[0])

    act_name = "DOOM_Levitation_Loop"
    old_act = bpy.data.actions.get(act_name)
    if old_act is not None:
        bpy.data.actions.remove(old_act, do_unlink=True)

    act = bpy.data.actions.new(name=act_name)
    companion_obj.animation_data.action = act
    companion_obj.rotation_mode = 'XYZ'

    c0 = mathutils.Vector((DOOM_SHOULDER_CENTER_X, DOOM_SHOULDER_CENTER_Y, DOOM_SHOULDER_CENTER_Z))
    n_frames = 55  # Frame 1..55 -> 54 intervals = 2.25s period at 24 FPS
    for idx in range(n_frames):
        frame = idx + 1
        u = (2.0 * math.pi * idx) / float(n_frames - 1)
        # In Blender Z-up: +Z is Up (glTF +Y), -Y is Forward (glTF +Z), -X is Right Shoulder
        dz = 0.036 * math.sin(u) + 0.004 * math.sin(2.0 * u)
        dx = 0.009 * math.sin(u)
        dy = -0.010 * math.sin(2.0 * u)
        pitch_x = math.radians(3.2) * math.sin(u)
        roll_y = math.radians(2.8) * math.sin(2.0 * u)
        yaw_z = math.radians(4.2) * math.sin(u)

        eul = mathutils.Euler((pitch_x, roll_y, yaw_z), 'XYZ')
        rot_mat = eul.to_matrix()
        delta_p = mathutils.Vector((dx, dy, dz))
        # Pivot compensation around c0 so vertices rotate cleanly around c0
        loc = c0 + delta_p - (rot_mat @ c0)

        bpy.context.scene.frame_set(frame)
        companion_obj.location = loc
        companion_obj.rotation_euler = eul
        companion_obj.keyframe_insert(data_path="location", frame=frame)
        companion_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    track = companion_obj.animation_data.nla_tracks.new()
    track.name = act_name
    strip = track.strips.new(act_name, 1, act)
    if len(act.slots) > 0:
        strip.action_slot = act.slots[0]
    track.mute = False
    companion_obj.animation_data.action = None

    bpy.context.scene.frame_set(1)
    companion_obj.location = (0.0, 0.0, 0.0)
    companion_obj.rotation_euler = (0.0, 0.0, 0.0)
    return act_name


def transfer_quaternius_animations_and_export(
    mesh_obj: bpy.types.Object,
    canon_arm: bpy.types.Object,
    ual_arm: bpy.types.Object,
    export_paths: List[str],
    companion_obj: bpy.types.Object = None,
) -> Dict[str, Any]:
    """
    Bakes core Quaternius UAL animations onto canon_arm as NLA tracks (plus
    DOOM_Levitation_Loop on companion_obj when present) and exports standalone
    rigged .glb files with embedded PBR materials, 2048x2048 textures, UV maps,
    vertex normals, and skins. (Ticket 043 & Spec 022)
    """
    if not canon_arm.animation_data:
        canon_arm.animation_data_create()

    # Clear existing NLA tracks on canon_arm
    while canon_arm.animation_data.nla_tracks:
        canon_arm.animation_data.nla_tracks.remove(canon_arm.animation_data.nla_tracks[0])

    # Because canon_arm shares the exact 65 bone names and 3x3 local rest orientations
    # of ual_arm, Quaternius Actions bind directly to canon_arm via NLA tracks!
    baked_clips = []
    for clip_name in REQUIRED_CLIPS:
        act = bpy.data.actions.get(clip_name)
        if act is None:
            continue
        track = canon_arm.animation_data.nla_tracks.new()
        track.name = clip_name
        start_f = int(round(act.frame_range[0]))
        strip = track.strips.new(clip_name, max(1, start_f), act)
        if len(act.slots) > 0:
            strip.action_slot = act.slots[0]
        track.mute = False
        baked_clips.append(clip_name)

    if companion_obj is not None:
        comp_clip = bake_companion_levitation_nla_track(companion_obj)
        baked_clips.append(comp_clip)

    # Set Rest Pose at frame 1 for clean export
    idle_act = bpy.data.actions.get("Idle_Loop")
    if idle_act:
        canon_arm.animation_data.action = None
    bpy.context.scene.frame_set(1)
    if companion_obj is not None:
        companion_obj.location = (0.0, 0.0, 0.0)
        companion_obj.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()

    # Select canon_arm, mesh_obj, and optional companion_obj for standalone export
    bpy.ops.object.select_all(action='DESELECT')
    canon_arm.select_set(True)
    mesh_obj.select_set(True)
    if companion_obj is not None:
        companion_obj.select_set(True)
    bpy.context.view_layer.objects.active = canon_arm

    primary_path = export_paths[0]
    os.makedirs(os.path.dirname(primary_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=primary_path,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_skins=True,
        export_all_influences=False,
        export_def_bones=False,
        export_animations=True,
        export_animation_mode='NLA_TRACKS',
        export_nla_strips=True,
        export_normals=True,
        export_texcoords=True,
        export_materials='EXPORT',
    )

    for extra_path in export_paths[1:]:
        os.makedirs(os.path.dirname(extra_path), exist_ok=True)
        with open(primary_path, "rb") as src_f, open(extra_path, "wb") as dst_f:
            dst_f.write(src_f.read())

    size_mb = os.path.getsize(primary_path) / (1024 * 1024)
    digest = sha256_file(primary_path)
    print(f"Exported Rigged GLB: {primary_path} ({size_mb:.2f} MB, {len(baked_clips)} clips, SHA256={digest[:16]}...)")
    return {
        "export_paths": export_paths,
        "size_mb": round(size_mb, 2),
        "clips": baked_clips,
        "sha256": digest,
    }


def render_luis_color_verification_views(
    luis_mesh: bpy.types.Object,
    luis_arm: bpy.types.Object,
    output_dir: str = VERIFICATION_DIR,
    companion_obj: bpy.types.Object = None,
) -> List[str]:
    """
    Renders full-color verification views of the textured, decimated, and rigged LUIS character
    (front, side, three_quarter, and posed Idle_Loop/Walk_Loop views) at 1920x1080. (Ticket 043)
    """
    os.makedirs(output_dir, exist_ok=True)
    scene = bpy.context.scene
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'

    # Configure studio lighting
    light_objs = []
    for name, loc, energy, size in [
        ("Key_Light", (2.0, -2.5, 3.0), 550.0, 2.0),
        ("Fill_Light", (-2.5, -2.0, 2.0), 300.0, 3.0),
        ("Rim_Light", (0.0, 2.5, 2.5), 400.0, 2.0),
    ]:
        ldata = bpy.data.lights.new(name=name, type='AREA')
        ldata.energy = energy
        ldata.size = size
        lobj = bpy.data.objects.new(name=name, object_data=ldata)
        scene.collection.objects.link(lobj)
        lobj.location = loc
        light_objs.append(lobj)

    cam_data = bpy.data.cameras.new("Verify_Camera")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Verify_Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Hide UAL reference objects during render
    visible_set = {luis_mesh, luis_arm, cam_obj}
    if companion_obj is not None:
        visible_set.add(companion_obj)
    hidden_objs = []
    for o in scene.objects:
        if o not in visible_set and o not in light_objs:
            if not o.hide_render:
                o.hide_render = True
                hidden_objs.append(o)

    target_center = mathutils.Vector((0.0, 0.0, 1.0))
    angles = [
        ("front", mathutils.Vector((0.0, -5.4, 1.0))),
        ("side", mathutils.Vector((5.4, 0.0, 1.0))),
        ("three_quarter", mathutils.Vector((3.818, -3.818, 1.0))),
    ]

    rendered = []
    for angle_name, cam_pos in angles:
        cam_obj.location = cam_pos
        direction = target_center - cam_pos
        cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        for out_name in (f"luis_{angle_name}.png", f"luis_color_{angle_name}.png"):
            out_file = os.path.join(output_dir, out_name)
            scene.render.filepath = out_file
            bpy.ops.render.render(write_still=True)
            rendered.append(out_file)
        print(f"Rendered full-color verification view: luis_{angle_name}.png")

    # Restore visibility and remove temporary camera/lights
    for o in hidden_objs:
        o.hide_render = False
    bpy.data.objects.remove(cam_obj, do_unlink=True)
    bpy.data.cameras.remove(cam_data, do_unlink=True)
    for lobj in light_objs:
        ldata = lobj.data
        bpy.data.objects.remove(lobj, do_unlink=True)
        bpy.data.lights.remove(ldata, do_unlink=True)

    return rendered


# ============================================================================
# HOLO.SYS 3D Holographic Visualizer Shader (YasirAwan4831/holographic-shader-visualizer-three.Js)
# Live Demo: https://holographic-threejs.vercel.app
# ============================================================================
HOLOSYS_COLOR_HEX = "#00d5ff"
HOLOSYS_COLOR_SRGB = (0.0, 213.0 / 255.0, 1.0)
HOLOSYS_COLOR_LINEAR = (0.0, 0.665387, 1.0)
HOLOSYS_LINES = 20.0

HOLOSYS_VERTEX_SHADER = """uniform float uTime;
uniform float uProgress;
uniform float uMinY;
uniform float uMaxY;

varying vec3 vPosition;
varying vec3 vNormal;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float glitchTime = uTime - modelPosition.y;
  float glitchStrength = sin(glitchTime)
                       * sin(glitchTime * 3.45)
                       + sin(glitchTime * 8.76);
  glitchStrength /= 3.0;
  glitchStrength  = smoothstep(0.5, 1.0, glitchStrength);
  glitchStrength *= 2.0;

  modelPosition.x += (random(modelPosition.xz + uTime) - 0.5) * glitchStrength;
  modelPosition.z += (random(modelPosition.xz + uTime) - 0.5) * glitchStrength;

  float normalizedY    = (modelPosition.y - uMinY) / (uMaxY - uMinY);
  float diff           = abs(normalizedY - uProgress);
  float progressGlitch = smoothstep(0.02, 0.0, diff);
  progressGlitch      *= 0.3;

  modelPosition.x += (random(modelPosition.xz + uTime) - 0.5) * progressGlitch;
  modelPosition.z += (random(modelPosition.xz + uTime) - 0.5) * progressGlitch;

  gl_Position = projectionMatrix * viewMatrix * modelPosition;

  vPosition = modelPosition.xyz;

  vec4 newNormal = modelMatrix * vec4(normal, 0.0);
  vNormal = newNormal.xyz;
}"""

HOLOSYS_FRAGMENT_SHADER = """uniform float uTime;
uniform float uIndex;
uniform float uCurrentIndex;
uniform float uNextIndex;
uniform float uProgress;
uniform vec3  uColor;
uniform float uMinY;
uniform float uMaxY;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  if (uIndex != uCurrentIndex && uIndex != uNextIndex) {
    discard;
  }

  float lines  = 20.0;
  float offset = vPosition.y - uTime * 0.2;
  float density = mod(offset * lines, 1.0);
  density = pow(density, 3.0);

  vec3  viewDirection = normalize(vPosition - cameraPosition);
  float fresnel       = 1.0 - abs(dot(normalize(vNormal), viewDirection));
  fresnel             = pow(fresnel, 2.0);

  float falloff = smoothstep(0.8, 0.0, fresnel);

  float holographic  = density * fresnel;
  holographic       += fresnel * 1.25;
  holographic       *= falloff;

  float normalizedY = (vPosition.y - uMinY) / (uMaxY - uMinY);

  if (uIndex == uCurrentIndex && normalizedY < uProgress) {
    discard;
  }

  if (uIndex == uNextIndex && normalizedY > uProgress) {
    discard;
  }

  gl_FragColor = vec4(uColor, holographic);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}"""


def _assign_holosys_uv_layer(mesh: bpy.types.Mesh, z_min_ref: float = None, z_span_ref: float = None) -> Tuple[float, float]:
    n_verts = len(mesh.vertices)
    v_coords = np.empty(n_verts * 3, dtype=np.float32)
    v_norms = np.empty(n_verts * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", v_coords)
    mesh.vertices.foreach_get("normal", v_norms)
    coords = v_coords.reshape(-1, 3)
    norms = v_norms.reshape(-1, 3)

    z_vals = coords[:, 2]
    z_min = float(z_vals.min()) if z_min_ref is None else z_min_ref
    z_span = max(1e-5, float(z_vals.max()) - z_min) if z_span_ref is None else z_span_ref

    ny = norms[:, 1]
    u_norm = np.clip(1.0 - np.abs(ny), 0.002, 0.998)
    v_norm = np.clip((z_vals - z_min) / z_span, 0.002, 0.998)

    while mesh.uv_layers:
        mesh.uv_layers.remove(mesh.uv_layers[0])
    uv_layer = mesh.uv_layers.new(name="UVMap")
    mesh.uv_layers.active = uv_layer

    n_loops = len(mesh.loops)
    loop_vert_idx = np.empty(n_loops, dtype=np.int32)
    mesh.loops.foreach_get("vertex_index", loop_vert_idx)
    loop_uvs = np.empty((n_loops, 2), dtype=np.float32)
    loop_uvs[:, 0] = u_norm[loop_vert_idx]
    loop_uvs[:, 1] = v_norm[loop_vert_idx]
    uv_layer.data.foreach_set("uv", loop_uvs.ravel())
    return z_min, z_span


def apply_holographic_iridescent_material(
    mesh_obj: bpy.types.Object,
    prefix: str = "LUIS",
    companion_obj: bpy.types.Object = None,
) -> None:
    """
    Applies the exact HOLO.SYS 3D Holographic Visualizer shader
    (YasirAwan4831/holographic-shader-visualizer-three.Js) to mesh_obj (and optional companion_obj):
    - uColor = #00d5ff (cyan-blue)
    - Scan Line Effect: lines = 20.0, density = pow(mod(y * 20.0, 1.0), 3.0)
    - Fresnel Rim Glow: fresnel = pow(1.0 - abs(dot(N, V)), 2.0)
    - Fresnel Falloff: falloff = smoothstep(0.8, 0.0, fresnel)
    - Combined: holographic = (density * fresnel + fresnel * 1.25) * falloff
    - Generates UVMap (u = 1.0 - |n_y|, v = normalized height Z) and embeds 1024x1024
      '{prefix}_Holo_BaseColor' (RGBA) and '{prefix}_Holo_Emissive' (RGBA) textures.
    """
    mesh = mesh_obj.data
    z_min, z_span = _assign_holosys_uv_layer(mesh)

    # Synthesize 1024x1024 HOLO.SYS BaseColor (RGBA) & Emissive (RGBA) textures
    res = 1024
    v_grid, u_grid = np.meshgrid(
        np.linspace(0.0, 1.0, res, dtype=np.float32),
        np.linspace(0.0, 1.0, res, dtype=np.float32),
        indexing='ij',
    )

    # Exact HOLO.SYS Fragment Shader formulas + Full-Body Thin-Film Iridescent Color Spectrum:
    # 1. Scan Line Effect: lines = 20.0 across 2.0m height -> 40 cycles
    y_meters = v_grid * z_span
    density = np.power(np.mod(y_meters * HOLOSYS_LINES, 1.0), 3.0)
    fine_scan = 0.5 + 0.5 * np.sin(y_meters * 120.0)

    # 2. Fresnel Rim Glow: fresnel = pow(1.0 - abs(dot(N, V)), 2.0)
    fresnel = np.power(u_grid, 2.0)

    # 3. Fresnel Falloff: falloff = smoothstep(0.8, 0.0, fresnel)
    t_fall = np.clip((0.8 - fresnel) / 0.8, 0.0, 1.0)
    falloff = t_fall * t_fall * (3.0 - 2.0 * t_fall)

    # 4. Combine Effects for full-body visibility + Fresnel rim + scanlines:
    holo_exact = (density * fresnel + fresnel * 1.25) * falloff
    full_body_carrier = 0.36 + 0.46 * density + 0.12 * fine_scan
    holographic = np.clip(full_body_carrier + holo_exact * 0.95, 0.36, 1.0)

    # 5. Thin-Film Iridescent Color Spectrum (HOLO.SYS Cyan #00d5ff <-> Aqua #00ffa3 <-> Violet #a855f7 <-> Magenta #ff2bd6 <-> Gold)
    phase = 2.0 * np.pi * (1.35 * u_grid + 1.15 * v_grid + 0.08 * density)
    irid_r = 0.48 + 0.50 * np.cos(phase - 2.05)
    irid_g = 0.58 + 0.40 * np.cos(phase - 0.15)
    irid_b = 0.82 + 0.18 * np.cos(phase + 0.75)

    irid_weight = np.clip(0.58 + 0.34 * u_grid + 0.18 * np.sin(v_grid * 2.0 * np.pi), 0.42, 0.92)
    col_r = (1.0 - irid_weight) * HOLOSYS_COLOR_LINEAR[0] + irid_weight * irid_r
    col_g = (1.0 - irid_weight) * HOLOSYS_COLOR_LINEAR[1] + irid_weight * irid_g
    col_b = (1.0 - irid_weight) * HOLOSYS_COLOR_LINEAR[2] + irid_weight * irid_b

    base_rgba = np.zeros((res, res, 4), dtype=np.float32)
    base_rgba[:, :, 0] = np.clip(col_r * holographic + 0.14 * np.power(holo_exact, 1.6), 0.0, 1.0)
    base_rgba[:, :, 1] = np.clip(col_g * holographic + 0.20 * np.power(holo_exact, 1.6), 0.0, 1.0)
    base_rgba[:, :, 2] = np.clip(col_b * holographic + 0.24 * np.power(holo_exact, 1.6), 0.0, 1.0)
    base_rgba[:, :, 3] = np.clip(0.66 + 0.20 * density + 0.26 * fresnel, 0.66, 0.98)

    emis_rgba = np.zeros((res, res, 4), dtype=np.float32)
    emis_rgba[:, :, 0] = base_rgba[:, :, 0]
    emis_rgba[:, :, 1] = base_rgba[:, :, 1]
    emis_rgba[:, :, 2] = base_rgba[:, :, 2]
    emis_rgba[:, :, 3] = 1.0

    def create_packed_image(img_name: str, pixel_array: np.ndarray) -> bpy.types.Image:
        existing = bpy.data.images.get(img_name)
        if existing is not None:
            bpy.data.images.remove(existing, do_unlink=True)
        img = bpy.data.images.new(name=img_name, width=res, height=res, alpha=True)
        img.pixels.foreach_set(pixel_array.ravel())
        tmp_png = f"/tmp/{img_name}.png"
        img.filepath_raw = tmp_png
        img.file_format = 'PNG'
        img.save()
        img.pack()
        return img

    base_img = create_packed_image(f"{prefix}_Holo_BaseColor", base_rgba)
    emis_img = create_packed_image(f"{prefix}_Holo_Emissive", emis_rgba)

    mesh.materials.clear()
    holo_mat = bpy.data.materials.new(name=f"{prefix}_Holo_Material")
    holo_mat.surface_render_method = 'BLENDED'
    nt = holo_mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)

    tex_base = nt.nodes.new(type='ShaderNodeTexImage')
    tex_base.name = "Holo_BaseColor_Node"
    tex_base.image = base_img
    tex_base.location = (-420, 260)

    tex_emis = nt.nodes.new(type='ShaderNodeTexImage')
    tex_emis.name = "Holo_Emissive_Node"
    tex_emis.image = emis_img
    tex_emis.location = (-420, -60)

    nt.links.new(tex_base.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex_base.outputs["Alpha"], bsdf.inputs["Alpha"])
    nt.links.new(tex_emis.outputs["Color"], bsdf.inputs["Emission Color"])

    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.08
    bsdf.inputs["IOR"].default_value = 1.45
    bsdf.inputs["Emission Strength"].default_value = 2.0
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat Roughness"].default_value = 0.02
    bsdf.inputs["Coat IOR"].default_value = 1.60
    bsdf.inputs["Thin Film Thickness"].default_value = 480.0
    bsdf.inputs["Thin Film IOR"].default_value = 1.38

    mesh.materials.append(holo_mat)
    for poly in mesh.polygons:
        poly.material_index = 0
    mesh.update()

    if companion_obj is not None:
        comp_mesh = companion_obj.data
        _assign_holosys_uv_layer(comp_mesh, z_min_ref=z_min, z_span_ref=z_span)
        comp_mesh.materials.clear()
        comp_mesh.materials.append(holo_mat)
        for poly in comp_mesh.polygons:
            poly.material_index = 0
        comp_mesh.update()


def inject_gltf_iridescence_extension(glb_paths: List[str]) -> None:
    """
    Injects the official glTF 2.0 'KHR_materials_iridescence' extension and the
    complete HOLO.SYS shader specification (YasirAwan4831/holographic-shader-visualizer-three.Js)
    into the exported binary .glb JSON chunk.
    """
    for path in glb_paths:
        with open(path, "rb") as f:
            raw = f.read()
        magic, version, total_len = struct.unpack_from("<III", raw, 0)
        if magic != 0x46546C67:
            raise ValueError(f"Fatal: '{path}' is not a valid binary GLB file.")
        json_len, json_type = struct.unpack_from("<II", raw, 12)
        json_bytes = raw[20:20 + json_len]
        bin_chunk = raw[20 + json_len:]

        gltf = json.loads(json_bytes.decode("utf-8"))
        ext_used = gltf.setdefault("extensionsUsed", [])
        if "KHR_materials_iridescence" not in ext_used:
            ext_used.append("KHR_materials_iridescence")

        for mat in gltf.get("materials", []):
            if "Holo" not in mat.get("name", ""):
                continue
            exts = mat.setdefault("extensions", {})
            exts["KHR_materials_iridescence"] = {
                "iridescenceFactor": 1.0,
                "iridescenceIor": 1.38,
                "iridescenceThicknessMinimum": 140.0,
                "iridescenceThicknessMaximum": 650.0,
            }
            extras = mat.setdefault("extras", {})
            extras["holoSysShader"] = {
                "system": "HOLO.SYS 3D Holographic Visualizer",
                "repository": "YasirAwan4831/holographic-shader-visualizer-three.Js",
                "liveDemo": "https://holographic-threejs.vercel.app",
                "uColor": HOLOSYS_COLOR_HEX,
                "iridescentPalette": ["#00d5ff", "#00ffa3", "#a855f7", "#ff2bd6", "#fbbf24"],
                "lines": HOLOSYS_LINES,
                "fresnelPower": 2.0,
                "falloffSmoothstep": [0.8, 0.0],
                "blending": "AdditiveBlending",
                "depthWrite": False,
                "transparent": True,
                "vertexShader": HOLOSYS_VERTEX_SHADER,
                "fragmentShader": HOLOSYS_FRAGMENT_SHADER,
            }

        new_json = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
        pad = (4 - (len(new_json) % 4)) % 4
        if pad:
            new_json += b" " * pad

        new_total_len = 12 + 8 + len(new_json) + len(bin_chunk)
        header = struct.pack("<III", magic, version, new_total_len)
        json_header = struct.pack("<II", len(new_json), json_type)
        with open(path, "wb") as f:
            f.write(header)
            f.write(json_header)
            f.write(new_json)
            f.write(bin_chunk)


def render_holosys_verification_views(
    char_mesh: bpy.types.Object,
    char_arm: bpy.types.Object,
    char_slug: str = "luis",
    output_dir: str = VERIFICATION_DIR,
    companion_obj: bpy.types.Object = None,
) -> List[str]:
    """
    Renders 1920x1080 verification views (front, side, three_quarter) using the exact
    3D view-dependent HOLO.SYS Iridescent shader node graph:
      density = pow(fract(Z * 20.0), 3.0)
      fresnel = pow(1.0 - abs(dot(N, V)), 2.0)
      falloff = smoothstep(0.8, 0.0, fresnel)
      holographic = (0.32 + 0.45 * density) + (density * fresnel + fresnel * 1.25) * falloff
      Iridescent ColorRamp driven by fract(0.65 * (1 - |dot(N, V)|) + 0.55 * Z)
    over a pure #000000 HOLO.SYS stage with the #d4d4d4 metallic cylinder platform.
    """
    os.makedirs(output_dir, exist_ok=True)
    scene = bpy.context.scene
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'

    # Pure #000000 background matching HOLO.SYS (src/components/HologramScene/HologramScene.jsx)
    world = scene.world
    created_world = False
    if world is None:
        world = bpy.data.worlds.new("HoloSys_World")
        scene.world = world
        created_world = True
    bg_node = world.node_tree.nodes.get("Background") if world.node_tree else None
    old_bg_color = tuple(bg_node.inputs[0].default_value) if bg_node else None
    if bg_node:
        bg_node.inputs[0].default_value = (0.0, 0.0, 0.0, 1.0)

    # Create temporary HOLO.SYS Iridescent 3D view-dependent shader for verification rendering
    orig_mat = char_mesh.data.materials[0]
    orig_comp_mat = companion_obj.data.materials[0] if (companion_obj is not None and len(companion_obj.data.materials) > 0) else None
    render_mat = bpy.data.materials.new(name="HoloSys_Exact_Render_Mat")
    render_mat.surface_render_method = 'BLENDED'
    nt = render_mat.node_tree
    nt.nodes.clear()

    out_node = nt.nodes.new(type='ShaderNodeOutputMaterial')
    out_node.location = (900, 0)

    add_shader = nt.nodes.new(type='ShaderNodeAddShader')
    add_shader.location = (680, 0)

    trans_bsdf = nt.nodes.new(type='ShaderNodeBsdfTransparent')
    trans_bsdf.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    trans_bsdf.location = (440, 120)

    emis_shader = nt.nodes.new(type='ShaderNodeEmission')
    emis_shader.location = (440, -80)

    # 1. Scan Line Effect: density = pow(fract(Z * 20.0), 3.0)
    geom_node = nt.nodes.new(type='ShaderNodeNewGeometry')
    geom_node.location = (-800, 220)

    sep_xyz = nt.nodes.new(type='ShaderNodeSeparateXYZ')
    sep_xyz.location = (-600, 220)
    nt.links.new(geom_node.outputs["Position"], sep_xyz.inputs["Vector"])

    mul_lines = nt.nodes.new(type='ShaderNodeMath')
    mul_lines.operation = 'MULTIPLY'
    mul_lines.inputs[1].default_value = HOLOSYS_LINES
    mul_lines.location = (-420, 220)
    nt.links.new(sep_xyz.outputs["Z"], mul_lines.inputs[0])

    fract_node = nt.nodes.new(type='ShaderNodeMath')
    fract_node.operation = 'FRACT'
    fract_node.location = (-240, 220)
    nt.links.new(mul_lines.outputs["Value"], fract_node.inputs[0])

    pow_density = nt.nodes.new(type='ShaderNodeMath')
    pow_density.operation = 'POWER'
    pow_density.inputs[1].default_value = 3.0
    pow_density.location = (-60, 220)
    nt.links.new(fract_node.outputs["Value"], pow_density.inputs[0])

    # 2. Fresnel Rim Glow: fresnel = pow(1.0 - abs(dot(N, V)), 2.0)
    dot_nv = nt.nodes.new(type='ShaderNodeVectorMath')
    dot_nv.operation = 'DOT_PRODUCT'
    dot_nv.location = (-600, -80)
    nt.links.new(geom_node.outputs["Normal"], dot_nv.inputs[0])
    nt.links.new(geom_node.outputs["Incoming"], dot_nv.inputs[1])

    abs_nv = nt.nodes.new(type='ShaderNodeMath')
    abs_nv.operation = 'ABSOLUTE'
    abs_nv.location = (-420, -80)
    nt.links.new(dot_nv.outputs["Value"], abs_nv.inputs[0])

    one_minus = nt.nodes.new(type='ShaderNodeMath')
    one_minus.operation = 'SUBTRACT'
    one_minus.inputs[0].default_value = 1.0
    one_minus.location = (-240, -80)
    nt.links.new(abs_nv.outputs["Value"], one_minus.inputs[1])

    pow_fresnel = nt.nodes.new(type='ShaderNodeMath')
    pow_fresnel.operation = 'POWER'
    pow_fresnel.inputs[1].default_value = 2.0
    pow_fresnel.location = (-60, -80)
    nt.links.new(one_minus.outputs["Value"], pow_fresnel.inputs[0])

    # 2b. Thin-Film Iridescent Color Ramp (driven by grazing angle + vertical Z height)
    mul_z_phase = nt.nodes.new(type='ShaderNodeMath')
    mul_z_phase.operation = 'MULTIPLY'
    mul_z_phase.inputs[1].default_value = 0.65
    mul_z_phase.location = (-420, -280)
    nt.links.new(sep_xyz.outputs["Z"], mul_z_phase.inputs[0])

    add_irid_phase = nt.nodes.new(type='ShaderNodeMath')
    add_irid_phase.operation = 'ADD'
    add_irid_phase.location = (-240, -280)
    nt.links.new(one_minus.outputs["Value"], add_irid_phase.inputs[0])
    nt.links.new(mul_z_phase.outputs["Value"], add_irid_phase.inputs[1])

    fract_irid = nt.nodes.new(type='ShaderNodeMath')
    fract_irid.operation = 'FRACT'
    fract_irid.location = (-60, -280)
    nt.links.new(add_irid_phase.outputs["Value"], fract_irid.inputs[0])

    irid_ramp = nt.nodes.new(type='ShaderNodeValToRGB')
    irid_ramp.location = (120, -280)
    cr = irid_ramp.color_ramp
    cr.interpolation = 'B_SPLINE'
    cr.elements[0].position = 0.00
    cr.elements[0].color = (0.00, 0.665, 1.00, 1.0)   # #00d5ff HOLO.SYS Cyan
    cr.elements[1].position = 0.25
    cr.elements[1].color = (0.00, 1.00, 0.52, 1.0)    # #00ffa3 Iridescent Aqua-Mint
    e2 = cr.elements.new(0.52)
    e2.color = (0.48, 0.14, 1.00, 1.0)                # #a855f7 Electric Violet
    e3 = cr.elements.new(0.78)
    e3.color = (1.00, 0.08, 0.72, 1.0)                # #ff2bd6 Neon Magenta
    e4 = cr.elements.new(1.00)
    e4.color = (0.00, 0.665, 1.00, 1.0)               # #00d5ff HOLO.SYS Cyan
    nt.links.new(fract_irid.outputs["Value"], irid_ramp.inputs["Fac"])
    nt.links.new(irid_ramp.outputs["Color"], emis_shader.inputs["Color"])

    # 3. Fresnel Falloff: falloff = smoothstep(0.8, 0.0, fresnel)
    falloff_node = nt.nodes.new(type='ShaderNodeMapRange')
    falloff_node.interpolation_type = 'SMOOTHSTEP'
    falloff_node.inputs["From Min"].default_value = 0.8
    falloff_node.inputs["From Max"].default_value = 0.0
    falloff_node.inputs["To Min"].default_value = 0.0
    falloff_node.inputs["To Max"].default_value = 1.0
    falloff_node.location = (-60, -480)
    nt.links.new(pow_fresnel.outputs["Value"], falloff_node.inputs["Value"])

    # 4. Combine: holographic = (0.28 + 0.42 * density) + (density * fresnel + fresnel * 1.25) * falloff
    dens_x_fres = nt.nodes.new(type='ShaderNodeMath')
    dens_x_fres.operation = 'MULTIPLY'
    dens_x_fres.location = (120, 120)
    nt.links.new(pow_density.outputs["Value"], dens_x_fres.inputs[0])
    nt.links.new(pow_fresnel.outputs["Value"], dens_x_fres.inputs[1])

    fres_125 = nt.nodes.new(type='ShaderNodeMath')
    fres_125.operation = 'MULTIPLY'
    fres_125.inputs[1].default_value = 1.25
    fres_125.location = (120, -60)
    nt.links.new(pow_fresnel.outputs["Value"], fres_125.inputs[0])

    sum_holo = nt.nodes.new(type='ShaderNodeMath')
    sum_holo.operation = 'ADD'
    sum_holo.location = (260, 40)
    nt.links.new(dens_x_fres.outputs["Value"], sum_holo.inputs[0])
    nt.links.new(fres_125.outputs["Value"], sum_holo.inputs[1])

    mul_falloff = nt.nodes.new(type='ShaderNodeMath')
    mul_falloff.operation = 'MULTIPLY'
    mul_falloff.location = (260, -140)
    nt.links.new(sum_holo.outputs["Value"], mul_falloff.inputs[0])
    nt.links.new(falloff_node.outputs["Result"], mul_falloff.inputs[1])

    # Full-body scanline carrier so interior body surfaces are also visibly holographic
    dens_carrier = nt.nodes.new(type='ShaderNodeMath')
    dens_carrier.operation = 'MULTIPLY'
    dens_carrier.inputs[1].default_value = 0.42
    dens_carrier.location = (260, 220)
    nt.links.new(pow_density.outputs["Value"], dens_carrier.inputs[0])

    add_base_carrier = nt.nodes.new(type='ShaderNodeMath')
    add_base_carrier.operation = 'ADD'
    add_base_carrier.inputs[1].default_value = 0.24
    add_base_carrier.location = (400, 220)
    nt.links.new(dens_carrier.outputs["Value"], add_base_carrier.inputs[0])

    total_holo = nt.nodes.new(type='ShaderNodeMath')
    total_holo.operation = 'ADD'
    total_holo.location = (400, -140)
    nt.links.new(mul_falloff.outputs["Value"], total_holo.inputs[0])
    nt.links.new(add_base_carrier.outputs["Value"], total_holo.inputs[1])

    # Scale for ACES/EEVEE exposure parity
    boost_holo = nt.nodes.new(type='ShaderNodeMath')
    boost_holo.operation = 'MULTIPLY'
    boost_holo.inputs[1].default_value = 2.2
    boost_holo.location = (400, -300)
    nt.links.new(total_holo.outputs["Value"], boost_holo.inputs[0])

    nt.links.new(boost_holo.outputs["Value"], emis_shader.inputs["Strength"])
    nt.links.new(trans_bsdf.outputs["BSDF"], add_shader.inputs[0])
    nt.links.new(emis_shader.outputs["Emission"], add_shader.inputs[1])
    nt.links.new(add_shader.outputs["Shader"], out_node.inputs["Surface"])

    char_mesh.data.materials[0] = render_mat
    if companion_obj is not None:
        if len(companion_obj.data.materials) == 0:
            companion_obj.data.materials.append(render_mat)
        else:
            companion_obj.data.materials[0] = render_mat

    # HOLO.SYS Stage Platform Cylinder (radius=1.1m, height=0.25m, #d4d4d4, roughness=0.3, metalness=0.6)
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=1.1, depth=0.24, location=(0.0, 0.0, -0.12))
    stage_obj = bpy.context.active_object
    stage_obj.name = "HoloSys_Stage"
    stage_mat = bpy.data.materials.new(name="HoloSys_Stage_Mat")
    stage_bsdf = next((n for n in stage_mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if stage_bsdf:
        stage_bsdf.inputs["Base Color"].default_value = (0.65, 0.65, 0.65, 1.0)
        stage_bsdf.inputs["Roughness"].default_value = 0.30
        stage_bsdf.inputs["Metallic"].default_value = 0.60
    stage_obj.data.materials.append(stage_mat)

    # HOLO.SYS Lighting (Point light #00d5ff + Directional light #a4d5f4 from src/constants/params.js)
    light_objs = []
    for name, ltype, loc, energy, col in [
        ("HoloSys_Point", 'POINT', (0.0, -0.6, 0.35), 120.0, (0.0, 0.835, 1.0)),
        ("HoloSys_Dir", 'AREA', (0.0, -2.5, 3.0), 180.0, (0.643, 0.835, 0.957)),
    ]:
        ldata = bpy.data.lights.new(name=name, type=ltype)
        ldata.energy = energy
        ldata.color = col
        lobj = bpy.data.objects.new(name=name, object_data=ldata)
        scene.collection.objects.link(lobj)
        lobj.location = loc
        light_objs.append(lobj)

    cam_data = bpy.data.cameras.new("Holo_Verify_Camera")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Holo_Verify_Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    visible_set = {char_mesh, char_arm, stage_obj, cam_obj} | set(light_objs)
    if companion_obj is not None:
        visible_set.add(companion_obj)
    hidden_objs = []
    for o in scene.objects:
        if o not in visible_set:
            if not o.hide_render:
                o.hide_render = True
                hidden_objs.append(o)

    target_center = mathutils.Vector((0.0, 0.0, 0.95))
    angles = [
        ("front", mathutils.Vector((0.0, -5.4, 1.15))),
        ("side", mathutils.Vector((5.4, 0.0, 1.15))),
        ("three_quarter", mathutils.Vector((3.818, -3.818, 1.15))),
    ]

    rendered = []
    for angle_name, cam_pos in angles:
        cam_obj.location = cam_pos
        direction = target_center - cam_pos
        cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        out_file = os.path.join(output_dir, f"{char_slug}_holo_{angle_name}.png")
        scene.render.filepath = out_file
        bpy.ops.render.render(write_still=True)
        rendered.append(out_file)
        print(f"Rendered HOLO.SYS verification view: {char_slug}_holo_{angle_name}.png")

    # Restore material and cleanup temporary render objects
    char_mesh.data.materials[0] = orig_mat
    if companion_obj is not None and orig_comp_mat is not None:
        companion_obj.data.materials[0] = orig_comp_mat
    bpy.data.materials.remove(render_mat, do_unlink=True)
    bpy.data.objects.remove(stage_obj, do_unlink=True)
    bpy.data.materials.remove(stage_mat, do_unlink=True)

    if bg_node and old_bg_color is not None:
        bg_node.inputs[0].default_value = old_bg_color
    if created_world:
        scene.world = None
        bpy.data.worlds.remove(world, do_unlink=True)

    for o in hidden_objs:
        o.hide_render = False
    bpy.data.objects.remove(cam_obj, do_unlink=True)
    bpy.data.cameras.remove(cam_data, do_unlink=True)
    for lobj in light_objs:
        ldata = lobj.data
        bpy.data.objects.remove(lobj, do_unlink=True)
        bpy.data.lights.remove(ldata, do_unlink=True)

    return rendered


def build_and_export_holosys_visualizer_glb(export_paths: List[str]) -> Dict[str, Any]:
    """
    Builds and exports a single standalone, animated HOLO.SYS 3D Holographic Visualizer
    mesh (HOLO_SYS_TorusKnot with a 96-frame 360-degree Turntable_Loop animation)
    so it can be tested individually in motion without multi-mesh clustering.
    """
    # Create a single smooth Torus-Knot / Torus holographic test mesh centered at (0, 0, 1.0)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.65,
        minor_radius=0.24,
        major_segments=96,
        minor_segments=32,
        location=(0.0, 0.0, 1.0),
    )
    holo_obj = bpy.context.active_object
    holo_obj.name = "HOLO_SYS_Visualizer_Mesh"
    for f in holo_obj.data.polygons:
        f.use_smooth = True
    apply_holographic_iridescent_material(holo_obj, prefix="HOLOSYS_Visualizer")

    # Bake a continuous 96-frame 360-degree turntable animation clip (Turntable_Loop)
    holo_obj.animation_data_create()
    act = bpy.data.actions.new(name="Turntable_Loop")
    holo_obj.animation_data.action = act
    holo_obj.rotation_mode = 'XYZ'

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 96

    for frame, rot_z, rot_x in [
        (1, 0.0, 0.35),
        (48, math.pi, -0.35),
        (96, 2.0 * math.pi, 0.35),
    ]:
        scene.frame_set(frame)
        holo_obj.rotation_euler = (rot_x, 0.0, rot_z)
        holo_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    scene.frame_set(1)
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action='DESELECT')
    holo_obj.select_set(True)
    bpy.context.view_layer.objects.active = holo_obj

    primary_path = export_paths[0]
    os.makedirs(os.path.dirname(primary_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=primary_path,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_animations=True,
        export_normals=True,
        export_texcoords=True,
        export_materials='EXPORT',
    )
    inject_gltf_iridescence_extension([primary_path])

    for extra_path in export_paths[1:]:
        os.makedirs(os.path.dirname(extra_path), exist_ok=True)
        with open(primary_path, "rb") as src_f, open(extra_path, "wb") as dst_f:
            dst_f.write(src_f.read())

    m = holo_obj.data
    bpy.data.objects.remove(holo_obj, do_unlink=True)
    bpy.data.meshes.remove(m, do_unlink=True)

    size_mb = os.path.getsize(primary_path) / (1024 * 1024)
    digest = sha256_file(primary_path)
    print(f"Exported Standalone Animated HOLO.SYS Visualizer GLB: {primary_path} ({size_mb:.2f} MB, SHA256={digest[:16]}...)")
    return {"export_paths": export_paths, "size_mb": round(size_mb, 2), "sha256": digest}


def run_holo_only_pipeline():
    """
    Builds all new HOLO.SYS .glb files (LUIS_RIGGED_HOLO.glb, LUIS_HOLOSYS_RIGGED.glb,
    LUIS_HOLOSYS_ASSEMBLED.glb, PLATODOOM_RIGGED_HOLO.glb, PLATODOOM_HOLOSYS_RIGGED.glb,
    PLATODOOM_HOLOSYS_ASSEMBLED.glb, and HOLO_SYS_VISUALIZER.glb) and renders 1920x1080
    verification views without modifying existing clay or textured .glb deliverables.
    """
    print("=== STARTING HOLO.SYS 3D HOLOGRAPHIC SHADER GLB PIPELINE ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24

    bone_specs, ual_arm, ual_objs = load_quaternius_reference_data()

    # 1. Build & Export LUIS HOLO.SYS Rigged & Assembled GLBs
    luis_clay_mesh, luis_clay_companion = build_decimated_luis_clay()
    luis_clay_native_arm, luis_clay_canon_arm = create_character_armatures("LUIS", bone_specs)
    compute_isolated_skin_weights(luis_clay_mesh, luis_clay_native_arm, "LUIS")
    normalize_to_quaternius_rest_pose(luis_clay_mesh, luis_clay_native_arm, luis_clay_canon_arm, "LUIS")

    apply_holographic_iridescent_material(luis_clay_mesh, prefix="LUIS", companion_obj=luis_clay_companion)
    luis_holo_paths = [
        LUIS_RIGGED_HOLO_PATH,
        LUIS_HOLOSYS_RIGGED_PATH,
        LUIS_HOLOSYS_ASSEMBLED_PATH,
        LUIS_HOLOSYS_ASSEMBLED_GREEK_PATH,
        LUIS_RIGGED_HOLO_GREEK_PATH,
        LUIS_HOLOSYS_RIGGED_GREEK_PATH,
    ]
    transfer_quaternius_animations_and_export(
        luis_clay_mesh,
        luis_clay_canon_arm,
        ual_arm,
        luis_holo_paths,
        companion_obj=luis_clay_companion,
    )
    inject_gltf_iridescence_extension(luis_holo_paths)
    render_holosys_verification_views(
        luis_clay_mesh,
        luis_clay_canon_arm,
        "luis",
        VERIFICATION_DIR,
        companion_obj=luis_clay_companion,
    )

    bpy.data.objects.remove(luis_clay_companion, do_unlink=True)
    bpy.data.objects.remove(luis_clay_mesh, do_unlink=True)
    bpy.data.objects.remove(luis_clay_canon_arm, do_unlink=True)

    # 2. Build & Export PLATODOOM HOLO.SYS Rigged & Assembled GLBs
    doom_mesh = build_decimated_platodoom()
    doom_native_arm, doom_canon_arm = create_character_armatures("PLATODOOM", bone_specs)
    compute_isolated_skin_weights(doom_mesh, doom_native_arm, "PLATODOOM")
    normalize_to_quaternius_rest_pose(doom_mesh, doom_native_arm, doom_canon_arm, "PLATODOOM")

    apply_holographic_iridescent_material(doom_mesh, prefix="PLATODOOM")
    doom_holo_paths = [
        PLATODOOM_RIGGED_HOLO_PATH,
        PLATODOOM_HOLOSYS_RIGGED_PATH,
        PLATODOOM_HOLOSYS_ASSEMBLED_PATH,
        PLATODOOM_RIGGED_HOLO_GREEK_PATH,
        PLATODOOM_HOLOSYS_RIGGED_GREEK_PATH,
    ]
    transfer_quaternius_animations_and_export(
        doom_mesh,
        doom_canon_arm,
        ual_arm,
        doom_holo_paths,
    )
    inject_gltf_iridescence_extension(doom_holo_paths)
    render_holosys_verification_views(doom_mesh, doom_canon_arm, "platodoom", VERIFICATION_DIR)

    bpy.data.objects.remove(doom_mesh, do_unlink=True)
    bpy.data.objects.remove(doom_canon_arm, do_unlink=True)

    # 3. Build & Export HOLO_SYS_VISUALIZER.glb
    build_and_export_holosys_visualizer_glb([
        HOLO_SYS_VISUALIZER_DOOM_PATH,
        HOLO_SYS_VISUALIZER_GREEK_PATH,
    ])
    print("=== HOLO.SYS PIPELINE COMPLETE ===")


def run_pipeline():
    print("=== STARTING DUAL-HUMANOID DECIMATION & QUATERNIUS RIGGING PIPELINE ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24

    # 1. Load Quaternius UAL1_Standard reference skeleton & actions
    bone_specs, ual_arm, ual_objs = load_quaternius_reference_data()
    print(f"Loaded Quaternius UAL1 reference: {len(bone_specs)} bones, {len(bpy.data.actions)} actions.")

    # 2a. Process Character A (Untextured Clay): LUIS_TPOSE.glb + LUIS_HEAD.glb + autonomous DOOM_Companion
    luis_clay_mesh, luis_clay_companion = build_decimated_luis_clay()
    luis_clay_native_arm, luis_clay_canon_arm = create_character_armatures("LUIS", bone_specs)
    luis_clay_skin_info = compute_isolated_skin_weights(luis_clay_mesh, luis_clay_native_arm, "LUIS")
    print("LUIS Clay Skinning:", luis_clay_skin_info)
    normalize_to_quaternius_rest_pose(luis_clay_mesh, luis_clay_native_arm, luis_clay_canon_arm, "LUIS")
    transfer_quaternius_animations_and_export(
        luis_clay_mesh,
        luis_clay_canon_arm,
        ual_arm,
        [
            LUIS_RIGGED_CLAY_PATH,
            LUIS_ASSEMBLED_CLAY_PATH,
            LUIS_RIGGED_CLAY_GREEK_PATH,
            LUIS_ASSEMBLED_CLAY_GREEK_PATH,
        ],
        companion_obj=luis_clay_companion,
    )

    # 2b. Apply HOLO.SYS Holographic Shader to Clay LUIS -> LUIS_RIGGED_HOLO.glb / LUIS_HOLOSYS_RIGGED.glb
    apply_holographic_iridescent_material(luis_clay_mesh, prefix="LUIS", companion_obj=luis_clay_companion)
    luis_holo_paths = [
        LUIS_RIGGED_HOLO_PATH,
        LUIS_HOLOSYS_RIGGED_PATH,
        LUIS_HOLOSYS_ASSEMBLED_PATH,
        LUIS_HOLOSYS_ASSEMBLED_GREEK_PATH,
        LUIS_RIGGED_HOLO_GREEK_PATH,
        LUIS_HOLOSYS_RIGGED_GREEK_PATH,
    ]
    transfer_quaternius_animations_and_export(
        luis_clay_mesh,
        luis_clay_canon_arm,
        ual_arm,
        luis_holo_paths,
        companion_obj=luis_clay_companion,
    )
    inject_gltf_iridescence_extension(luis_holo_paths)
    render_holosys_verification_views(
        luis_clay_mesh,
        luis_clay_canon_arm,
        "luis",
        VERIFICATION_DIR,
        companion_obj=luis_clay_companion,
    )

    clay_comp_data = luis_clay_companion.data
    clay_mesh_data = luis_clay_mesh.data
    bpy.data.objects.remove(luis_clay_companion, do_unlink=True)
    bpy.data.objects.remove(luis_clay_mesh, do_unlink=True)
    bpy.data.meshes.remove(clay_comp_data, do_unlink=True)
    bpy.data.meshes.remove(clay_mesh_data, do_unlink=True)
    bpy.data.objects.remove(luis_clay_canon_arm, do_unlink=True)

    # 2c. Process Character A (Full-Color Textured): LUIS_HEAD_COLOR.glb + Luis_BODY_COLOR.glb + autonomous DOOM_Companion
    luis_mesh, luis_companion = build_decimated_luis()
    luis_native_arm, luis_canon_arm = create_character_armatures("LUIS", bone_specs)
    luis_skin_info = compute_isolated_skin_weights(luis_mesh, luis_native_arm, "LUIS")
    print("LUIS Color Skinning:", luis_skin_info)
    normalize_to_quaternius_rest_pose(luis_mesh, luis_native_arm, luis_canon_arm, "LUIS")
    transfer_quaternius_animations_and_export(
        luis_mesh,
        luis_canon_arm,
        ual_arm,
        [
            LUIS_RIGGED_PATH,
            LUIS_RIGGED_GREEK_PATH,
            LUIS_COLOR_RIGGED_PATH,
            LUIS_COLOR_RIGGED_GREEK_PATH,
            LUIS_ASSEMBLED_PATH,
            LUIS_ASSEMBLED_GREEK_PATH,
            CHARACTER_HOODIE_GREEK_PATH,
            CHARACTER_HOODIE_DOOM_PATH,
        ],
        companion_obj=luis_companion,
    )
    render_luis_color_verification_views(luis_mesh, luis_canon_arm, VERIFICATION_DIR, companion_obj=luis_companion)

    # Remove LUIS objects before processing PLATODOOM so each export has a single root Armature
    bpy.data.objects.remove(luis_companion, do_unlink=True)
    bpy.data.objects.remove(luis_mesh, do_unlink=True)
    bpy.data.objects.remove(luis_canon_arm, do_unlink=True)

    # 3a. Process Character B (Untextured Clay): PLATODOOM
    doom_mesh = build_decimated_platodoom()
    doom_native_arm, doom_canon_arm = create_character_armatures("PLATODOOM", bone_specs)
    doom_skin_info = compute_isolated_skin_weights(doom_mesh, doom_native_arm, "PLATODOOM")
    print("PLATODOOM Skinning:", doom_skin_info)
    normalize_to_quaternius_rest_pose(doom_mesh, doom_native_arm, doom_canon_arm, "PLATODOOM")
    transfer_quaternius_animations_and_export(
        doom_mesh,
        doom_canon_arm,
        ual_arm,
        [
            PLATODOOM_RIGGED_PATH,
            PLATODOOM_ASSEMBLED_PATH,
            CHARACTER_TUNIC_GREEK_PATH,
            CHARACTER_TUNIC_DOOM_PATH,
        ],
    )

    # 3b. Apply HOLO.SYS Holographic Shader to PLATODOOM -> PLATODOOM_RIGGED_HOLO.glb / PLATODOOM_HOLOSYS_RIGGED.glb
    apply_holographic_iridescent_material(doom_mesh, prefix="PLATODOOM")
    doom_holo_paths = [
        PLATODOOM_RIGGED_HOLO_PATH,
        PLATODOOM_HOLOSYS_RIGGED_PATH,
        PLATODOOM_HOLOSYS_ASSEMBLED_PATH,
        PLATODOOM_RIGGED_HOLO_GREEK_PATH,
        PLATODOOM_HOLOSYS_RIGGED_GREEK_PATH,
    ]
    transfer_quaternius_animations_and_export(
        doom_mesh,
        doom_canon_arm,
        ual_arm,
        doom_holo_paths,
    )
    inject_gltf_iridescence_extension(doom_holo_paths)
    render_holosys_verification_views(doom_mesh, doom_canon_arm, "platodoom", VERIFICATION_DIR)

    bpy.data.objects.remove(doom_mesh, do_unlink=True)
    bpy.data.objects.remove(doom_canon_arm, do_unlink=True)

    # 4. Build & Export HOLO_SYS_VISUALIZER.glb
    build_and_export_holosys_visualizer_glb([
        HOLO_SYS_VISUALIZER_DOOM_PATH,
        HOLO_SYS_VISUALIZER_GREEK_PATH,
    ])

    print("=== PIPELINE COMPLETE ===")


if __name__ == "__main__":
    if "--holo-only" in sys.argv:
        run_holo_only_pipeline()
    else:
        run_pipeline()
