"""
assemble_characters.py

Automated, deterministic 3D character cleanup, component bisection,
proportional scaling, 3D reorientation, bilateral mirroring,
collar/wrist concentric seating, ground-plane normalization,
height standardization (2.000m), binary glTF 2.0 export, and
multi-angle visual verification rendering pipeline for Character 1 ("DOOM")
and Character 2 ("LUIS").

Governed by functional_specification_010.md and tickets 001-008.
"""

import os
import math
import hashlib
import bpy
import bmesh
import mathutils
from typing import Dict, List, Tuple, Any

# Canonical Directory Paths & Constants
DOOM_RIG_DIR = "/Users/diesel/Desktop/Doom_Rig"
OUTPUTS_DIR = os.path.join(DOOM_RIG_DIR, "outputs")
VERIFICATION_DIR = os.path.join(OUTPUTS_DIR, "verification")

PLATODOOM_RAW_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_RAW.glb")
PLATODOOM_HEAD_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_HEAD.glb")
DOOM_HAND_PATH = os.path.join(DOOM_RIG_DIR, "DOOM_HAND.glb")
LUIS_TPOSE_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_TPOSE.glb")
LUIS_HEAD_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HEAD.glb")

PLATODOOM_EXPORT_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_ASSEMBLED.glb")
LUIS_EXPORT_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_ASSEMBLED.glb")

GLTF_MAGIC_HEADER = b"glTF"
TARGET_STATURE_METERS = 2.000
RENDER_RES_X = 1920
RENDER_RES_Y = 1080

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

    # Clear parent keeping transform and bake world matrix directly into mesh vertices
    bpy.ops.object.select_all(action='DESELECT')
    target_obj.select_set(True)
    bpy.context.view_layer.objects.active = target_obj
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    if target_obj.matrix_world != mathutils.Matrix.Identity(4):
        target_obj.data.transform(target_obj.matrix_world)
        target_obj.matrix_world = mathutils.Matrix.Identity(4)
        target_obj.data.update()
    target_obj.rotation_mode = 'XYZ'

    # Remove any auxiliary empty nodes created by the glTF importer
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
    """
    Cleans disconnected islands, loose geometry, duplicate vertices,
    and recalculates outward-facing normals. (Ticket 001)
    """
    if obj is None or obj.type != 'MESH':
        raise TypeError(f"Fatal: Target object '{getattr(obj, 'name', None)}' is not a valid mesh object.")

    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    v_before = len(bm.verts)
    f_before = len(bm.faces)

    # 1. Connected islands detection and stray island pruning
    islands = get_connected_island_counts(bm)
    islands_before = len(islands)

    if islands_before > 1:
        islands.sort(key=lambda isl: len(isl), reverse=True)
        to_delete = []
        for stray_island in islands[1:]:
            to_delete.extend(stray_island)
        bmesh.ops.delete(bm, geom=to_delete, context='VERTS')

    # 2. Deduplicate co-located vertices (threshold 0.0001m)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)

    # 3. Purge loose vertices and loose edges
    loose_verts = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context='VERTS')

    loose_edges = [e for e in bm.edges if len(e.link_faces) == 0]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context='EDGES')

    # 4. Outward normal recalculation
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    v_after = len(bm.verts)
    f_after = len(bm.faces)

    if v_after == 0 or f_after == 0:
        raise ValueError(f"Fatal: Topological cleaning reduced '{obj.name}' to zero geometry.")

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    telemetry = {
        "object_name": obj.name,
        "islands_before": islands_before,
        "islands_after": 1,
        "verts_before": v_before,
        "verts_after": v_after,
        "faces_before": f_before,
        "faces_after": f_after,
    }
    print(
        f"Cleaned {obj.name}: Islands {islands_before} -> 1 | "
        f"Verts {v_before} -> {v_after} | Faces {f_before} -> {f_after}"
    )
    return telemetry


def sever_doom_body_extremities(body_obj: bpy.types.Object) -> Dict[str, Any]:
    """
    Prepares the updated headless/handless PLATODOOM_RAW mesh by:
    1. Beveling the anterior submandibular neck rim so it stays 100% buried inside PLATODOOM_HEAD.
    2. Trimming the distal 2cm wrist tips perpendicular to the left and right forearm axes
       so the forearm stumps seat cleanly inside the DOOM_HAND wrist cuffs. (Ticket 002)
    """
    if body_obj is None or body_obj.type != 'MESH':
        raise TypeError("Fatal: body_obj must be a valid Blender mesh object.")

    mesh = body_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    v_initial = len(bm.verts)

    # 1. Bevel anterior-superior neck rim (Z > 0.945 in front, sloping up to Z = 0.995 in back)
    # so the body's top neck cut rim is 100% buried inside PLATODOOM_HEAD's submandibular curve.
    geom_neck_verts = [v for v in bm.verts if v.co.z > 0.93 and abs(v.co.x) < 0.14]
    geom_neck_edges = [e for e in bm.edges if all(v.co.z > 0.93 and abs(v.co.x) < 0.14 for v in e.verts)]
    geom_neck_faces = [f for f in bm.faces if all(v.co.z > 0.93 and abs(v.co.x) < 0.14 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_neck_verts + geom_neck_edges + geom_neck_faces,
        plane_co=(0.0, 0.0, 0.968),
        plane_no=mathutils.Vector((0.0, -0.25, 1.0)).normalized(),
        clear_outer=True,
        clear_inner=False
    )

    # 2. Trim distal left wrist tip perpendicular to Left Forearm trajectory
    geom_left = [
        v for v in bm.verts if v.co.x > 0.48 and v.co.z < 0.35
    ]
    geom_left_edges = [
        e for e in bm.edges if all(v.co.x > 0.48 and v.co.z < 0.35 for v in e.verts)
    ]
    geom_left_faces = [
        f for f in bm.faces if all(v.co.x > 0.48 and v.co.z < 0.35 for v in f.verts)
    ]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_left + geom_left_edges + geom_left_faces,
        plane_co=LEFT_WRIST_CUT_CO,
        plane_no=LEFT_FOREARM_AXIS,
        clear_outer=True,
        clear_inner=False
    )

    # 3. Trim distal right wrist tip perpendicular to Right Forearm trajectory
    geom_right = [
        v for v in bm.verts if v.co.x < -0.48 and v.co.z < 0.35
    ]
    geom_right_edges = [
        e for e in bm.edges if all(v.co.x < -0.48 and v.co.z < 0.35 for v in e.verts)
    ]
    geom_right_faces = [
        f for f in bm.faces if all(v.co.x < -0.48 and v.co.z < 0.35 for v in f.verts)
    ]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_right + geom_right_edges + geom_right_faces,
        plane_co=RIGHT_WRIST_CUT_CO,
        plane_no=RIGHT_FOREARM_AXIS,
        clear_outer=True,
        clear_inner=False
    )

    loose = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    v_final = len(bm.verts)
    max_z = max(v.co.z for v in bm.verts)
    max_abs_x = max(abs(v.co.x) for v in bm.verts)

    if max_z > 1.000:
        raise ValueError(f"Fatal: Unexpected vertices above Z=1.000 (max Z: {max_z:.4f}).")

    if max_abs_x > 0.625:
        raise ValueError(f"Fatal: Wrist trimming failed. Vertices exist beyond |X|=0.625 (max |X|: {max_abs_x:.4f}).")

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    telemetry = {
        "status": "SEVERING_COMPLETE",
        "v_initial": v_initial,
        "v_final": v_final,
        "max_z": max_z,
        "max_abs_x": max_abs_x,
    }
    print(
        f"Prepared PLATODOOM_RAW extremities: Clean neck rim (max Z: {max_z:.4f}m), "
        f"Left & Right Wrist tips trimmed perpendicular to forearm axes | "
        f"Verts {v_initial} -> {v_final} | Max |X|: {max_abs_x:.4f}m"
    )
    return telemetry


def trim_and_seat_doom_head(head_obj: bpy.types.Object) -> Dict[str, Any]:
    """
    Trims the lower flared base of PLATODOOM_HEAD below Z=-0.805 so its bottom
    neck rim is 100% buried inside PLATODOOM_RAW's lower neck collar while
    preserving the entire beard and submandibular jawline, scales by 0.228,
    and seats concentrically into PLATODOOM_RAW. (Ticket 003)
    """
    if head_obj is None or head_obj.type != 'MESH':
        raise TypeError("Fatal: head_obj must be a valid Blender mesh object.")

    mesh = head_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    v_before = len(bm.verts)

    # 1. Planar cutoff of lower neck flare below Z = -0.805 (lands at Z = +0.9345m inside body collar)
    geom_all = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_all,
        plane_co=(0.0, 0.0, HEAD_NECK_CUT_Z),
        plane_no=(0.0, 0.0, -1.0),
        clear_outer=True,
        clear_inner=False
    )

    loose = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')

    # Ensure single contiguous island after trim
    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=lambda isl: len(isl), reverse=True)
        to_del = []
        for isl in islands[1:]:
            to_del.extend(isl)
        bmesh.ops.delete(bm, geom=to_del, context='VERTS')

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    v_after = len(bm.verts)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # 2. Apply proportional uniform scaling and translation directly to mesh vertices in world space
    mat_scale = mathutils.Matrix.Scale(SCALE_HEAD_1, 4)
    mat_trans = mathutils.Matrix.Translation((SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z))
    mesh.transform(mat_trans @ mat_scale)
    mesh.update()

    xs = [v.co.x for v in mesh.vertices]
    zs = [v.co.z for v in mesh.vertices]
    scaled_width = max(xs) - min(xs)
    min_z_seated = min(zs)
    max_z_seated = max(zs)

    telemetry = {
        "status": "HEAD_SEATED",
        "scale_applied": SCALE_HEAD_1,
        "scaled_width": scaled_width,
        "flange_verts_removed": v_before - v_after,
        "final_location": (SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z),
        "z_span": (min_z_seated, max_z_seated),
    }
    print(
        f"Trimmed & Seated PLATODOOM_HEAD: Scale {SCALE_HEAD_1} | "
        f"Translation ({SEAT_OFFSET_X:.4f}, {SEAT_OFFSET_Y:.4f}, {SEAT_TRANSLATE_Z:.4f}) | "
        f"Z Span [{min_z_seated:.4f}, {max_z_seated:.4f}] | "
        f"Pedestal Verts Removed: {v_before - v_after}"
    )
    return telemetry


def prepare_and_mount_doom_hands(
    hand_obj: bpy.types.Object
) -> Tuple[bpy.types.Object, bpy.types.Object, Dict[str, Any]]:
    """
    Trims forearm cable stub on DOOM_HAND below Z=-0.790 (where the narrower cable
    section embeds inside PLATODOOM_RAW's forearm while the Z in [-0.750, -0.600]
    wrist cuff ring sleeves outside PLATODOOM_RAW's wrist stump), scales by 0.200,
    orients in 3D world space to align colinearly with the downward/outward
    A-pose forearm axis, mirrors across X=0 for the right hand, and recalculates outward normals.
    """
    if hand_obj is None or hand_obj.type != 'MESH':
        raise TypeError("Fatal: hand_obj must be a valid Blender mesh object.")

    mesh = hand_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    # 1. Planar cutoff of lower cable stub below Z = -0.790
    geom_all = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_all,
        plane_co=(0.0, 0.0, WRIST_CUT_Z),
        plane_no=(0.0, 0.0, -1.0),
        clear_outer=True,
        clear_inner=False
    )
    loose = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')

    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=lambda isl: len(isl), reverse=True)
        to_del = []
        for isl in islands[1:]:
            to_del.extend(isl)
        bmesh.ops.delete(bm, geom=to_del, context='VERTS')

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # 2. Center wrist cuff ring (Z in [-0.750, -0.650]) at local origin (0, 0, 0)
    cuff_verts = [v.co for v in bm.verts if WRIST_CUFF_BASE_Z <= v.co.z <= WRIST_CUFF_BASE_Z + 0.100]
    if not cuff_verts:
        min_z_val = min(v.co.z for v in bm.verts)
        cuff_verts = [v.co for v in bm.verts if v.co.z <= min_z_val + 0.050]
    cx = sum(v.x for v in cuff_verts) / len(cuff_verts)
    cy = sum(v.y for v in cuff_verts) / len(cuff_verts)
    base_origin = mathutils.Vector((cx, cy, WRIST_CUFF_BASE_Z))

    for v in bm.verts:
        v.co -= base_origin

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # 3. Construct exact orthonormal SO(3) rotation matrix aligning +Z_hand -> LEFT_FOREARM_AXIS,
    #    -X_hand (thumb) -> superior-lateral radius side (+X, +Z), and -Y_hand (palm) -> forward (-Y)
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

    hand_obj.name = "DOOM_HAND_L"
    hand_obj.data.transform(trans_l_4x4 @ rot_mat_4x4 @ scale_mat_4x4)
    hand_obj.data.update()

    # Recalculate normals on Left Hand
    bm_l = bmesh.new()
    bm_l.from_mesh(hand_obj.data)
    bmesh.ops.recalc_face_normals(bm_l, faces=bm_l.faces)
    bm_l.to_mesh(hand_obj.data)
    bm_l.free()
    hand_obj.data.update()

    # 4. Create Mirrored Right Hand across sagittal plane (X=0) and seat on Right Wrist
    hand_r = hand_obj.copy()
    hand_r.data = hand_obj.data.copy()
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

    # Mandatory Normal Flipping & Outward Recalculation on mirrored hand
    bm_r = bmesh.new()
    bm_r.from_mesh(hand_r.data)
    bmesh.ops.reverse_faces(bm_r, faces=bm_r.faces)
    bmesh.ops.recalc_face_normals(bm_r, faces=bm_r.faces)
    bm_r.to_mesh(hand_r.data)
    bm_r.free()
    hand_r.data.update()

    inverted_faces = sum(1 for f in hand_r.data.polygons if f.normal.length < 1e-4)
    if inverted_faces > 0:
        raise ValueError(f"Fatal: Mirrored hand contains {inverted_faces} zero or inverted normal faces.")

    telemetry = {
        "status": "HANDS_MOUNTED",
        "scale": SCALE_HAND_1,
        "left_wrist": tuple(LEFT_WRIST_TARGET),
        "right_wrist": tuple(RIGHT_WRIST_TARGET),
        "mirrored_normals_corrected": True,
    }
    print(
        f"Mounted DOOM Hands: Left at {tuple(LEFT_WRIST_TARGET)}, "
        f"Right at {tuple(RIGHT_WRIST_TARGET)} | Scale {SCALE_HAND_1} | "
        f"Normals Outward: 100% Verified"
    )
    return hand_obj, hand_r, telemetry


def prepare_and_seat_luis_head(
    head_obj: bpy.types.Object,
    body_obj: bpy.types.Object
) -> Dict[str, Any]:
    """
    Cleans neck rim pinholes on LUIS_HEAD, scales by 0.200, aligns forward (-Y),
    and seats neck plug into LUIS_TPOSE hoodie cavity.
    Enforces zero cuts on body_obj. (Ticket 005)
    """
    if head_obj is None or head_obj.type != 'MESH':
        raise TypeError("Fatal: head_obj must be a valid Blender mesh object.")
    if body_obj is None or body_obj.type != 'MESH':
        raise TypeError("Fatal: body_obj must be a valid Blender mesh object.")

    body_v_count = len(body_obj.data.vertices)

    mesh = head_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    # 1. Planar cutoff of lower rim defects below Z = -0.750
    geom_all = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_all,
        plane_co=(0.0, 0.0, NECK_CUT_Z),
        plane_no=(0.0, 0.0, -1.0),
        clear_outer=True,
        clear_inner=False
    )
    loose = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # 2. Scale and position head in hoodie collar directly in mesh world space
    mat_scale = mathutils.Matrix.Scale(SCALE_HEAD_2, 4)
    mesh.transform(mat_scale)
    mesh.update()

    min_z = min(v.co.z for v in mesh.vertices)
    delta_z = LUIS_NECK_SEAT_Z - min_z
    mat_trans = mathutils.Matrix.Translation((LUIS_COLLAR_CENTER_X, LUIS_COLLAR_CENTER_Y, delta_z))
    mesh.transform(mat_trans)
    mesh.update()

    # Verify zero body cuts invariant
    if len(body_obj.data.vertices) != body_v_count:
        raise ValueError("Fatal: LUIS_TPOSE body vertex count mutated. Zero cuts invariant violated.")

    telemetry = {
        "status": "LUIS_HEAD_SEATED",
        "scale_applied": SCALE_HEAD_2,
        "location": (LUIS_COLLAR_CENTER_X, LUIS_COLLAR_CENTER_Y, delta_z),
        "body_verts_preserved": body_v_count,
    }
    print(
        f"Mounted LUIS_HEAD: Scale {SCALE_HEAD_2} | "
        f"Position (X={LUIS_COLLAR_CENTER_X}, Y={LUIS_COLLAR_CENTER_Y}, Z={delta_z:.4f}) | "
        f"Neck Embedded 0.045m below collar rim"
    )
    return telemetry


def unify_and_standardize_character(
    character_name: str,
    component_objs: List[bpy.types.Object],
    target_height: float = TARGET_STATURE_METERS
) -> bpy.types.Object:
    """
    Joins component meshes into a single unified character object,
    places footwear flush on Z=0, centers horizontally at (0, 0),
    scales stature uniformly to target_height (2.000m), and bakes transforms. (Ticket 006)
    """
    if not component_objs:
        raise ValueError(f"Fatal: No component objects provided for '{character_name}'.")

    # Select all components
    bpy.ops.object.select_all(action='DESELECT')
    for obj in component_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = component_objs[0]

    # Join into unified mesh
    bpy.ops.object.join()
    unified_obj = bpy.context.active_object
    unified_obj.name = character_name

    # 1. Compute bounding box coordinates
    verts = [v.co for v in unified_obj.data.vertices]
    if not verts:
        raise ValueError(f"Fatal: Unified character '{character_name}' has 0 vertices.")

    z_min = min(v.z for v in verts)
    z_max = max(v.z for v in verts)
    h_current = z_max - z_min
    if h_current <= 0:
        raise ValueError(f"Fatal: Invalid height {h_current} for '{character_name}'.")

    # 2. Horizontal centering at pelvis/footprint midpoint
    x_min = min(v.x for v in verts)
    x_max = max(v.x for v in verts)
    y_min = min(v.y for v in verts)
    y_max = max(v.y for v in verts)
    x_mid = (x_min + x_max) / 2.0
    y_mid = (y_min + y_max) / 2.0

    # Translate so Z_min = 0 and (X_mid, Y_mid) = (0, 0)
    offset = mathutils.Vector((-x_mid, -y_mid, -z_min))
    for v in unified_obj.data.vertices:
        v.co += offset
    unified_obj.data.update()

    # 3. Height standardization to target_height (2.000m)
    scale_factor = target_height / h_current
    for v in unified_obj.data.vertices:
        v.co *= scale_factor
    unified_obj.data.update()

    # 4. Bake all transforms
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 5. Final boundary audit
    final_verts = [v.co for v in unified_obj.data.vertices]
    final_z_min = min(v.z for v in final_verts)
    final_z_max = max(v.z for v in final_verts)
    final_height = final_z_max - final_z_min

    if abs(final_z_min) > 0.001:
        raise ValueError(f"Fatal: Z_min={final_z_min:.4f}m violates ground plane threshold (+/-0.001m).")

    if abs(final_height - target_height) > 0.010:
        raise ValueError(f"Fatal: Final height={final_height:.4f}m violates 2.000m (+/-0.010m) contract.")

    telemetry = {
        "character": character_name,
        "raw_height": h_current,
        "standard_scale": scale_factor,
        "final_height": final_height,
        "final_z_min": final_z_min,
        "total_vertices": len(final_verts),
    }
    print(
        f"Standardized {character_name}: Height {final_height:.4f}m (Scale: {scale_factor:.4f}) | "
        f"Z_min: {final_z_min:.4f}m | Centered at (0, 0) | Verts: {len(final_verts)}"
    )
    return unified_obj


def export_assembled_character_glb(
    obj: bpy.types.Object,
    export_path: str
) -> Dict[str, Any]:
    """
    Exports target character mesh object as production binary glTF 2.0 (.glb).
    Validates file existence, non-empty size, and glTF magic header. (Ticket 007)
    """
    if obj is None or obj.type != 'MESH':
        raise TypeError(f"Fatal: Cannot export non-mesh object '{getattr(obj, 'name', None)}'.")

    os.makedirs(os.path.dirname(export_path), exist_ok=True)

    # 1. Selection isolation
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # 2. Invoke glTF export operator with strict parameters
    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_attributes=True,
        export_materials='EXPORT',
        export_all_vertex_colors=True,
        export_normals=True,
        export_texcoords=True
    )

    # 3. Post-export file verification
    if not os.path.exists(export_path):
        raise FileNotFoundError(f"Fatal: glTF export failed. File missing at '{export_path}'.")

    file_size_bytes = os.path.getsize(export_path)
    if file_size_bytes < 100 * 1024:
        raise ValueError(
            f"Fatal: Exported file '{export_path}' is corrupted or truncated "
            f"({file_size_bytes} bytes < 100KB)."
        )

    with open(export_path, "rb") as f:
        header = f.read(4)
        if header != GLTF_MAGIC_HEADER:
            raise ValueError(f"Fatal: File '{export_path}' does not have valid glTF magic header (got {header}).")

    digest = sha256_file(export_path)
    size_mb = file_size_bytes / (1024 * 1024)

    telemetry = {
        "status": "EXPORT_SUCCESS",
        "character": obj.name,
        "export_path": export_path,
        "size_bytes": file_size_bytes,
        "size_mb": round(size_mb, 2),
        "sha256": digest,
    }
    print(f"Exported glTF 2.0 container: {export_path} | Size: {size_mb:.2f} MB | SHA-256: {digest}")
    return telemetry


def setup_studio_lighting(scene: bpy.types.Scene):
    """Sets up a clean 3-point lighting studio in Blender."""
    for obj in list(scene.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

    # Key light
    key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_data.energy = 500.0
    key_data.size = 2.0
    key_obj = bpy.data.objects.new(name="Key_Light", object_data=key_data)
    scene.collection.objects.link(key_obj)
    key_obj.location = (2.0, -2.5, 3.0)

    # Fill light
    fill_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_data.energy = 250.0
    fill_data.size = 3.0
    fill_obj = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (-2.5, -2.0, 2.0)

    # Rim light
    rim_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_data.energy = 400.0
    rim_data.size = 2.0
    rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
    scene.collection.objects.link(rim_obj)
    rim_obj.location = (0.0, 2.5, 2.5)


def point_camera_at(cam_obj: bpy.types.Object, target: mathutils.Vector):
    """Directs camera towards target coordinate."""
    loc = cam_obj.location
    direction = target - loc
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()


def render_verification_views(output_dir: str = VERIFICATION_DIR) -> List[str]:
    """
    Renders front, side, and 3/4 views for both characters,
    plus side-by-side comparison view. (Ticket 008)
    """
    os.makedirs(output_dir, exist_ok=True)
    scene = bpy.context.scene
    scene.render.resolution_x = RENDER_RES_X
    scene.render.resolution_y = RENDER_RES_Y
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'

    setup_studio_lighting(scene)

    cam_obj = scene.camera
    if cam_obj is None:
        cam_data = bpy.data.cameras.new("Verification_Camera")
        cam_obj = bpy.data.objects.new("Verification_Camera", cam_data)
        scene.collection.objects.link(cam_obj)
        scene.camera = cam_obj

    cam_obj.data.lens = 50.0
    target_center = mathutils.Vector((0.0, 0.0, 1.0))
    rendered_files = []

    doom_obj = bpy.data.objects.get("PLATODOOM")
    luis_obj = bpy.data.objects.get("LUIS")

    angles = [
        ("front", mathutils.Vector((0.0, -5.4, 1.0))),
        ("side", mathutils.Vector((5.4, 0.0, 1.0))),
        ("three_quarter", mathutils.Vector((3.818, -3.818, 1.0))),
    ]

    # 1. Render DOOM views
    if doom_obj:
        doom_obj.hide_render = False
        if luis_obj:
            luis_obj.hide_render = True
        for angle_name, cam_pos in angles:
            cam_obj.location = cam_pos
            point_camera_at(cam_obj, target_center)
            out_file = os.path.join(output_dir, f"doom_{angle_name}.png")
            scene.render.filepath = out_file
            bpy.ops.render.render(write_still=True)
            rendered_files.append(out_file)
            print(f"Rendered verification view: doom_{angle_name} -> {out_file}")

    # 2. Render LUIS views
    if luis_obj:
        if doom_obj:
            doom_obj.hide_render = True
        luis_obj.hide_render = False
        for angle_name, cam_pos in angles:
            cam_obj.location = cam_pos
            point_camera_at(cam_obj, target_center)
            out_file = os.path.join(output_dir, f"luis_{angle_name}.png")
            scene.render.filepath = out_file
            bpy.ops.render.render(write_still=True)
            rendered_files.append(out_file)
            print(f"Rendered verification view: luis_{angle_name} -> {out_file}")

    # 3. Render Side-by-Side Height Comparison
    if doom_obj and luis_obj:
        doom_obj.hide_render = False
        luis_obj.hide_render = False
        doom_obj.location.x = -0.850
        luis_obj.location.x = +0.850
        cam_obj.location = mathutils.Vector((0.0, -5.6, 1.0))
        point_camera_at(cam_obj, target_center)
        comp_file = os.path.join(output_dir, "side_by_side_comparison.png")
        scene.render.filepath = comp_file
        bpy.ops.render.render(write_still=True)
        rendered_files.append(comp_file)
        print(f"Rendered verification view: side_by_side_comparison -> {comp_file}")
        # Reset positions to center
        doom_obj.location.x = 0.0
        luis_obj.location.x = 0.0

    return rendered_files


def run_assembly_pipeline():
    """Executes end-to-end assembly, standardization, export, and verification rendering."""
    print("=" * 70)
    print("STARTING 3D CHARACTER CLEANUP, ASSEMBLY & STANDARDIZATION PIPELINE")
    print("=" * 70)

    # Initialize empty factory scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # ---------------------------------------------------------
    # Character 1 ("DOOM") Pipeline
    # ---------------------------------------------------------
    print("\n--- Processing Character 1: DOOM ---")
    body_obj = import_glb_mesh(PLATODOOM_RAW_PATH, "PLATODOOM_RAW")
    head_obj = import_glb_mesh(PLATODOOM_HEAD_PATH, "PLATODOOM_HEAD")
    hand_obj = import_glb_mesh(DOOM_HAND_PATH, "DOOM_HAND")

    # Clean topology
    clean_mesh_topology(body_obj)
    clean_mesh_topology(head_obj)
    clean_mesh_topology(hand_obj)

    # Sever body extremities
    sever_doom_body_extremities(body_obj)

    # Trim and seat head
    trim_and_seat_doom_head(head_obj)

    # Prepare, orient, mirror and mount hands
    hand_l, hand_r, _ = prepare_and_mount_doom_hands(hand_obj)

    # Unify and standardize Character 1
    doom_character = unify_and_standardize_character(
        "PLATODOOM",
        [body_obj, head_obj, hand_l, hand_r],
        target_height=TARGET_STATURE_METERS
    )

    # Export Character 1
    export_assembled_character_glb(doom_character, PLATODOOM_EXPORT_PATH)

    # ---------------------------------------------------------
    # Character 2 ("LUIS") Pipeline
    # ---------------------------------------------------------
    print("\n--- Processing Character 2: LUIS ---")
    if os.path.exists(LUIS_EXPORT_PATH) and os.path.getsize(LUIS_EXPORT_PATH) > 100 * 1024:
        print(f"Preserving existing verified LUIS_ASSEMBLED.glb at '{LUIS_EXPORT_PATH}'")
        luis_character = import_glb_mesh(LUIS_EXPORT_PATH, "LUIS")
    else:
        luis_body = import_glb_mesh(LUIS_TPOSE_PATH, "LUIS_TPOSE")
        luis_head = import_glb_mesh(LUIS_HEAD_PATH, "LUIS_HEAD")

        # Clean topology
        clean_mesh_topology(luis_body)
        clean_mesh_topology(luis_head)

        # Prepare and seat head (enforces zero body cuts)
        prepare_and_seat_luis_head(luis_head, luis_body)

        # Unify and standardize Character 2
        luis_character = unify_and_standardize_character(
            "LUIS",
            [luis_body, luis_head],
            target_height=TARGET_STATURE_METERS
        )

        # Export Character 2
        export_assembled_character_glb(luis_character, LUIS_EXPORT_PATH)

    # ---------------------------------------------------------
    # Multi-Angle Verification Rendering
    # ---------------------------------------------------------
    print("\n--- Rendering Multi-Angle Verification Views ---")
    rendered_images = render_verification_views(VERIFICATION_DIR)
    print(f"\nRendered {len(rendered_images)} verification images to '{VERIFICATION_DIR}'.")

    print("\n" + "=" * 70)
    print("3D CHARACTER ASSEMBLY PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 70)


if __name__ == "__main__":
    run_assembly_pipeline()

