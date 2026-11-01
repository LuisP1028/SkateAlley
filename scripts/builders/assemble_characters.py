#!/usr/bin/env python3
"""
assemble_characters.py

Automated, deterministic, .glb-file-agnostic 3D character cleanup, 3D landmark &
cross-sectional proportion discovery, lossless PBR material/UV disambiguation,
concentric collar-to-neck seating, ground-plane normalization (Z_min = 0.000m),
stature standardization (2.000m), binary glTF 2.0 export, multi-angle studio
verification rendering, and Google Cloud Storage (03_meshes/assembled/) sync.

Governed by functional_specification_059.md, functional_specification_010.md, and LANGUAGE.md.
Enforces:
- INV-AGNOSTIC-01: Geometry-driven 3D collar socket & submental neck column profiling
- INV-NO-DECIMATE-01: Strict zero polygon decimation during assembly
- INV-MAT-UV-01: Seam-safe vertex welding before island pruning & material/UV slot disambiguation
- INV-DRAPE-SAFE-01: Preservation of draped headwear/hair/beards without guillotine truncation
- INV-NO-SYNTHETIC-02: Fail-fast rejection of synthetic primitive meshes (e.g. 642-vert icospheres)
- INV-STD-01: Grounded soles (Z_min = 0.000m), centered (0,0), 2.000m stature, _IS_HEAD_PART tagging
- INV-GCS-ASSEMBLE-01: GCS intake from 03_meshes/{head,body}/ & output to 03_meshes/assembled/
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    np = None  # type: ignore
    HAS_NUMPY = False

try:
    import bpy
    import bmesh
    import mathutils
    HAS_BLENDER = True
except ImportError:
    bpy = None  # type: ignore
    bmesh = None  # type: ignore
    HAS_BLENDER = False

    class _VectorStub:
        def __init__(self, coords: Sequence[float]) -> None:
            self.coords = tuple(float(c) for c in coords)
            self.x = self.coords[0]
            self.y = self.coords[1]
            self.z = self.coords[2]

        def normalized(self) -> "_VectorStub":
            length = math.sqrt(sum(c * c for c in self.coords)) or 1.0
            return _VectorStub(tuple(c / length for c in self.coords))

        def __iter__(self):
            return iter(self.coords)

    class _MathutilsStub:
        Vector = _VectorStub

    mathutils = _MathutilsStub()  # type: ignore

# Canonical Directory Paths & Constants
DOOM_RIG_DIR = "/Users/diesel/Desktop/Doom_Rig"
OUTPUTS_DIR = os.path.join(DOOM_RIG_DIR, "outputs")
VERIFICATION_DIR = os.path.join(OUTPUTS_DIR, "verification")

PLATODOOM_RAW_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_RAW.glb")
PLATODOOM_HEAD_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_HEAD.glb")
DOOM_HAND_PATH = os.path.join(DOOM_RIG_DIR, "DOOM_HAND.glb")
LUIS_TPOSE_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_TPOSE.glb")
LUIS_HEAD_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HEAD.glb")
LUIS_BODY_COLOR_PATH = os.path.join(DOOM_RIG_DIR, "Luis_BODY_COLOR.glb")
LUIS_HEAD_COLOR_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_HEAD_COLOR.glb")

PLATODOOM_EXPORT_PATH = os.path.join(DOOM_RIG_DIR, "PLATODOOM_ASSEMBLED.glb")
LUIS_EXPORT_PATH = os.path.join(DOOM_RIG_DIR, "LUIS_ASSEMBLED.glb")

DEFAULT_BLENDER_BIN = "/Applications/Blender.app/Contents/MacOS/Blender"
DEFAULT_HOST_PYTHON_BIN = "/opt/anaconda3/bin/python3"
DEFAULT_GCS_BUCKET = "3d-banana-player-assets"
DEFAULT_GCS_CREDENTIALS_CANDIDATES = (
    "/Users/diesel/Desktop/Greek/gcs_service_account.json",
    "/Users/diesel/desktop/greek/gcs_service_account.json",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "gcs_service_account.json"),
)

GLTF_MAGIC_HEADER = b"glTF"
MIN_ANATOMICAL_VERTICES = 1000
MIN_ANATOMICAL_FACES = 1000
TARGET_STATURE_METERS = 2.000
RENDER_RES_X = 1920
RENDER_RES_Y = 1080
IDENTIFIER_REGEX = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

# Legacy Hand & Extremity Constants for Optional 3-Part Hand Replacement (e.g. PLATODOOM)
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
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Fatal: Cannot compute SHA-256 for missing file '{filepath}'.")
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _percentile_sorted(sorted_vals: Sequence[float], pct: float) -> float:
    """Deterministic linear-interpolated percentile on a pre-sorted list of floats."""
    n = len(sorted_vals)
    if n == 0:
        return 0.0
    if n == 1:
        return float(sorted_vals[0])
    pos = (max(0.0, min(100.0, float(pct))) / 100.0) * (n - 1)
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return float(sorted_vals[lo])
    frac = pos - lo
    return float(sorted_vals[lo] * (1.0 - frac) + sorted_vals[hi] * frac)


def _percentile(vals: Sequence[float], pct: float) -> float:
    if not vals:
        return 0.0
    return _percentile_sorted(sorted(vals), pct)


def sanitize_player_slug(player_name: Optional[str]) -> str:
    """Sanitizes player_name into a lowercase filesystem/GCS-safe player_slug."""
    raw = str(player_name or "").strip()
    if not raw:
        raise ValueError("Fatal [INV-GCS-ASSEMBLE-01]: player_name cannot be empty.")
    if ".." in raw or "/" in raw or "\\" in raw:
        raise ValueError(f"Fatal [INV-GCS-ASSEMBLE-01]: Path traversal token detected in player_name '{raw}'.")
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", raw).strip("_").lower()[:64].strip("_")
    if not slug or not IDENTIFIER_REGEX.match(slug):
        raise ValueError(f"Fatal [INV-GCS-ASSEMBLE-01]: player_name '{raw}' produced invalid slug '{slug}'.")
    return slug


def resolve_player_identity(
    player_name: str,
    player_id: str,
    run_id: str,
) -> Dict[str, str]:
    slug = sanitize_player_slug(player_name)
    pid = str(player_id or "").strip()
    rid = str(run_id or "").strip()
    if not pid or not IDENTIFIER_REGEX.match(pid):
        raise ValueError(f"Fatal [INV-GCS-ASSEMBLE-01]: Invalid player_id '{player_id}'.")
    if not rid or not IDENTIFIER_REGEX.match(rid):
        raise ValueError(f"Fatal [INV-GCS-ASSEMBLE-01]: Invalid run_id '{run_id}'.")
    player_folder = pid if pid.lower().startswith(f"{slug}_") else f"{slug}_{pid}"
    return {
        "player_name": str(player_name).strip(),
        "player_slug": slug,
        "player_id": pid,
        "player_folder": player_folder,
        "run_id": rid,
        "run_prefix": f"players/{player_folder}/runs/{rid}",
    }


def validate_input_glb_binary(
    filepath: str,
    role_label: str = "component",
    min_vertices: int = MIN_ANATOMICAL_VERTICES,
    min_faces: int = MIN_ANATOMICAL_FACES,
) -> Dict[str, Any]:
    """
    Enforces INV-NO-SYNTHETIC-02 (functional_specification_059.md Section 4.1.1 & Section 6.1):
    Validates in <0.2s prior to mesh assembly that a .glb file:
    1. Exists on disk and has a valid 12-byte glTF 2.0 binary header (b'glTF', version 2).
    2. Is NOT a synthetic primitive placeholder (e.g. extras.shape == 'radius' or 642-vert icosphere).
    3. Contains > 1,000 vertices and > 1,000 faces across its mesh primitives.
    """
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Fatal: Source asset for '{role_label}' missing at '{filepath}'.")
    file_size = os.path.getsize(filepath)
    if file_size < 28:
        raise ValueError(f"Fatal: Source asset '{filepath}' for '{role_label}' is truncated ({file_size} bytes).")

    with open(filepath, "rb") as f:
        header = f.read(20)
        magic, version, declared_len, json_len, json_type = struct.unpack("<4sIIII", header)
        if magic != GLTF_MAGIC_HEADER:
            raise ValueError(
                f"Fatal: File '{filepath}' ({role_label}) does not start with glTF magic header b'glTF' (got {magic!r})."
            )
        if version != 2 or declared_len != file_size:
            raise ValueError(
                f"Fatal: Invalid glTF 2.0 header in '{filepath}' (version={version}, declared={declared_len}, actual={file_size})."
            )
        json_bytes = f.read(json_len)

    try:
        gltf = json.loads(json_bytes.decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"Fatal: Failed to parse glTF JSON chunk in '{filepath}': {exc}") from exc

    meshes = gltf.get("meshes") or []
    accessors = gltf.get("accessors") or []
    if not meshes:
        raise ValueError(f"Fatal: glTF container '{filepath}' ({role_label}) contains 0 mesh definitions.")

    total_verts = 0
    total_faces = 0
    has_texcoords = False

    for m in meshes:
        extras = m.get("extras") or {}
        if isinstance(extras, dict) and str(extras.get("shape", "")).lower() in ("radius", "sphere", "icosphere"):
            raise ValueError(
                f"Fatal [INV-NO-SYNTHETIC-02]: Synthetic primitive mesh rejected for '{role_label}' at '{filepath}' "
                f"(mesh extras={extras}). Genuine anatomical character meshes are required."
            )
        for prim in m.get("primitives") or []:
            attrs = prim.get("attributes") or {}
            pos_idx = attrs.get("POSITION")
            if pos_idx is not None and 0 <= int(pos_idx) < len(accessors):
                v_cnt = int(accessors[int(pos_idx)].get("count", 0))
                total_verts += v_cnt
            if "TEXCOORD_0" in attrs:
                has_texcoords = True
            indices_idx = prim.get("indices")
            if indices_idx is not None and 0 <= int(indices_idx) < len(accessors):
                idx_cnt = int(accessors[int(indices_idx)].get("count", 0))
                total_faces += idx_cnt // 3
            elif pos_idx is not None and 0 <= int(pos_idx) < len(accessors):
                total_faces += int(accessors[int(pos_idx)].get("count", 0)) // 3

    if total_verts <= min_vertices or total_faces <= min_faces:
        raise ValueError(
            f"Fatal [INV-NO-SYNTHETIC-02]: Input mesh '{filepath}' ({role_label}) failed anatomical topology gate "
            f"(vertices={total_verts}, faces={total_faces}; >{min_vertices} vertices and >{min_faces} faces required)."
        )

    return {
        "filepath": os.path.abspath(filepath),
        "role": role_label,
        "size_bytes": file_size,
        "sha256": sha256_file(filepath),
        "raw_gltf_vertices": total_verts,
        "raw_gltf_faces": total_faces,
        "material_count": len(gltf.get("materials") or []),
        "image_count": len(gltf.get("images") or []),
        "has_texcoords": has_texcoords,
    }


def import_glb_mesh(filepath: str, assigned_name: str) -> "bpy.types.Object":
    """
    Validates binary glTF 2.0 integrity & anatomical topology (>1,000 verts/faces),
    imports the mesh into Blender, clears parent hierarchy while baking world transforms
    into mesh vertices, and returns a single unified component mesh object.
    """
    validate_input_glb_binary(filepath, role_label=assigned_name)

    objs_before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    objs_after = set(bpy.context.scene.objects)
    imported_objs = list(objs_after - objs_before)
    new_meshes = [o for o in imported_objs if o.type == 'MESH']
    if not new_meshes:
        raise ValueError(f"Fatal: Failed to import any mesh object from '{filepath}'.")

    # Clear parents and bake world transforms on all imported mesh primitives
    for m_obj in new_meshes:
        bpy.ops.object.select_all(action='DESELECT')
        m_obj.select_set(True)
        bpy.context.view_layer.objects.active = m_obj
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
        if m_obj.matrix_world != mathutils.Matrix.Identity(4):
            m_obj.data.transform(m_obj.matrix_world)
            m_obj.matrix_world = mathutils.Matrix.Identity(4)
            m_obj.data.update()
        m_obj.rotation_mode = 'XYZ'

    if len(new_meshes) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for m_obj in new_meshes:
            m_obj.select_set(True)
        bpy.context.view_layer.objects.active = new_meshes[0]
        bpy.ops.object.join()
        target_obj = bpy.context.active_object
    else:
        target_obj = new_meshes[0]

    target_obj.name = assigned_name
    target_obj.data.name = assigned_name

    # Remove auxiliary empty/armature nodes created by the glTF importer
    for obj in imported_objs:
        if obj != target_obj and obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    return target_obj


def disambiguate_component_materials_and_uvs(
    obj: "bpy.types.Object",
    character_name: str,
    component_role: str,
) -> Dict[str, Any]:
    """
    Enforces INV-MAT-UV-01 (functional_specification_059.md Section 4.1.3):
    1. Standardizes all UV layers on `obj` to the canonical name 'UVMap' so joining
       `body.glb` and `head.glb` merges their UVs into a single `TEXCOORD_0` channel.
    2. Disambiguates material and embedded texture datablock names (`<Char>_<Role>_Material`
       and `<Char>_<Role>_BaseColor`) and configures matte PBR surface defaults
       (`Metallic=0.0`, `Roughness=0.85`) so `Material_0` / `Image_0` never collide on join.
    """
    if obj is None or obj.type != 'MESH':
        raise TypeError(f"Fatal: Target object '{getattr(obj, 'name', None)}' is not a valid mesh object.")

    mesh = obj.data
    uv_names_before = [uv.name for uv in mesh.uv_layers]
    if mesh.uv_layers:
        mesh.uv_layers[0].name = "UVMap"
        mesh.uv_layers.active = mesh.uv_layers[0]
        mesh.uv_layers[0].active_render = True

    mat_name = f"{character_name}_{component_role}_Material"
    tex_name = f"{character_name}_{component_role}_BaseColor"
    renamed_materials: List[str] = []
    renamed_images: List[str] = []

    if mesh.materials and mesh.materials[0] is not None:
        for idx, orig_mat in enumerate(list(mesh.materials)):
            if orig_mat is None:
                continue
            mat = orig_mat.copy()
            mesh.materials[idx] = mat
            suffix = "" if idx == 0 else f"_{idx}"
            mat.name = f"{mat_name}{suffix}"
            renamed_materials.append(mat.name)
            if mat.node_tree:
                for node in mat.node_tree.nodes:
                    if node.type == 'TEX_IMAGE' and node.image is not None:
                        node.image.name = f"{tex_name}{suffix}"
                        renamed_images.append(node.image.name)
                    elif node.type == 'BSDF_PRINCIPLED':
                        if "Metallic" in node.inputs:
                            node.inputs["Metallic"].default_value = 0.0
                        if "Roughness" in node.inputs:
                            node.inputs["Roughness"].default_value = 0.85
    else:
        # Ensure untextured/clay meshes still have a clean material slot so indices align when joined
        fallback_mat = bpy.data.materials.new(name=mat_name)
        fallback_mat.use_nodes = True
        if fallback_mat.node_tree:
            for node in fallback_mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    if "Metallic" in node.inputs:
                        node.inputs["Metallic"].default_value = 0.0
                    if "Roughness" in node.inputs:
                        node.inputs["Roughness"].default_value = 0.85
        mesh.materials.clear()
        mesh.materials.append(fallback_mat)
        renamed_materials.append(fallback_mat.name)

    mesh.update()
    return {
        "component": obj.name,
        "role": component_role,
        "uv_layers_before": uv_names_before,
        "uv_layer_standardized": "UVMap" if mesh.uv_layers else None,
        "materials": renamed_materials,
        "images": renamed_images,
    }


def get_connected_island_counts(bm: "bmesh.types.BMesh") -> List[List["bmesh.types.BMVert"]]:
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


def clean_mesh_topology(obj: "bpy.types.Object") -> Dict[str, Any]:
    """
    Enforces INV-NO-DECIMATE-01 & INV-MAT-UV-01 (functional_specification_059.md Section 4.1.4):
    1. Welds co-located 3D UV-seam vertices (dist=0.0001m) FIRST while preserving per-loop UVs,
       preventing UV-split texture shells from being misclassified as disconnected floating islands.
    2. Prunes only true 3D disconnected floating debris islands.
    3. Purges loose vertices and loose edges and recalculates outward-facing normals.
    4. Applies ZERO polygon decimation.
    """
    if obj is None or obj.type != 'MESH':
        raise TypeError(f"Fatal: Target object '{getattr(obj, 'name', None)}' is not a valid mesh object.")

    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    v_before = len(bm.verts)
    f_before = len(bm.faces)

    # 1. Weld co-located 3D vertices FIRST (threshold 0.0001m) so UV-split seams stay connected in 3D
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    v_after_weld = len(bm.verts)

    # 2. Connected islands detection and stray floating debris pruning
    islands = get_connected_island_counts(bm)
    islands_before = len(islands)
    removed_debris_verts = 0

    if islands_before > 1:
        islands.sort(key=lambda isl: len(isl), reverse=True)
        to_delete = []
        for stray_island in islands[1:]:
            to_delete.extend(stray_island)
        removed_debris_verts = len(to_delete)
        bmesh.ops.delete(bm, geom=to_delete, context='VERTS')

    # 3. Purge loose vertices and loose edges
    loose_verts = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context='VERTS')

    loose_edges = [e for e in bm.edges if len(e.link_faces) == 0]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context='EDGES')

    # 4. Outward normal recalculation & smooth shading
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True

    v_after = len(bm.verts)
    f_after = len(bm.faces)

    if v_after == 0 or f_after == 0:
        bm.free()
        raise ValueError(f"Fatal: Topological cleaning reduced '{obj.name}' to zero geometry.")

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    telemetry = {
        "object_name": obj.name,
        "islands_before": islands_before,
        "islands_after": 1,
        "removed_floating_islands": max(0, islands_before - 1),
        "removed_debris_verts": removed_debris_verts,
        "verts_before": v_before,
        "verts_after_weld": v_after_weld,
        "verts_after": v_after,
        "faces_before": f_before,
        "faces_after": f_after,
        "decimation_applied": False,
    }
    print(
        f"Cleaned {obj.name}: Islands {islands_before} -> 1 | "
        f"Verts {v_before} (welded {v_after_weld}) -> {v_after} | "
        f"Faces {f_before} -> {f_after} (Decimation: False)"
    )
    return telemetry


def profile_body_collar_socket(body_obj: "bpy.types.Object") -> Dict[str, Any]:
    """
    Enforces INV-AGNOSTIC-01 Stage A & INV-CENTRAL-SOCKET-SEAT-01 (functional_specification_059.md & 041.md §4.3.1):
    Profiles the superior trunk and central collar opening socket of any `body.glb` mesh in Blender Z-up space:
    - Extracts body vertical bounds [Z_min, Z_max], height H_body, and total lateral width W_body.
    - Isolates the Central Sagittal Neck-Socket Corridor (|x - x_mid| <= 0.22 * W_body, z >= z_min + 0.70 * H_body)
      so raised lateral shoulder pauldrons, armor spikes, or puff sleeves never bias z_collar upward.
    - Extracts z_collar_central = percentile_95(z in central corridor) and collar center (X_collar, Y_collar)
      strictly from the top rim of the central corridor [z_collar_central - 0.045*H_body, z_collar_central].
    """
    verts = [(v.co.x, v.co.y, v.co.z) for v in body_obj.data.vertices]
    if not verts:
        raise ValueError(f"Fatal: Body mesh '{body_obj.name}' has 0 vertices.")

    xs_all = [p[0] for p in verts]
    zs = [p[2] for p in verts]
    xb_min, xb_max = min(xs_all), max(xs_all)
    zb_min, zb_max = min(zs), max(zs)
    wb = max(0.05, xb_max - xb_min)
    hb = zb_max - zb_min
    if hb <= 0.05:
        raise ValueError(f"Fatal: Body mesh '{body_obj.name}' has degenerate height {hb:.4f}m.")

    x_mid = 0.5 * (xb_min + xb_max)
    corridor_half_w = 0.22 * wb

    # Medial trunk center X in upper torso [zb_max - 0.35*hb, zb_max - 0.08*hb]
    torso_xs = [
        p[0] for p in verts
        if (zb_max - 0.35 * hb) <= p[2] <= (zb_max - 0.08 * hb) and abs(p[0] - x_mid) <= max(corridor_half_w, 0.22 * hb)
    ]
    x_trunk = _percentile(torso_xs, 50.0) if torso_xs else x_mid

    # Shoulder breadth across [zb_max - 0.16*hb, zb_max - 0.08*hb]
    sh_xs = [
        p[0] for p in verts
        if (zb_max - 0.16 * hb) <= p[2] <= (zb_max - 0.08 * hb) and abs(p[0] - x_trunk) < 0.30 * hb
    ]
    w_shoulders = (_percentile(sh_xs, 98.0) - _percentile(sh_xs, 2.0)) if len(sh_xs) >= 10 else (0.40 * hb)

    # Central Sagittal Neck-Socket Corridor (INV-CENTRAL-SOCKET-SEAT-01):
    # |x - x_mid| <= 0.22 * W_body and z >= z_min + 0.70 * H_body
    central_corridor = [
        p for p in verts
        if abs(p[0] - x_mid) <= corridor_half_w and p[2] >= (zb_min + 0.70 * hb)
    ]
    if len(central_corridor) < 10:
        central_corridor = [
            p for p in verts
            if abs(p[0] - x_trunk) <= max(corridor_half_w, 0.25 * hb) and p[2] >= (zb_min + 0.65 * hb)
        ]
    if len(central_corridor) < 5:
        central_corridor = [p for p in verts if p[2] >= (zb_max - 0.15 * hb)]

    central_zs = sorted(p[2] for p in central_corridor)
    z_collar_central = _percentile_sorted(central_zs, 95.0)

    # Collar band and rim strictly inside the central neck-socket corridor near z_collar_central
    collar_band = [
        p for p in central_corridor
        if (z_collar_central - 0.045 * hb) <= p[2] <= (z_collar_central + 0.015 * hb)
    ]
    collar_rim = [
        p for p in central_corridor
        if (z_collar_central - 0.022 * hb) <= p[2] <= (z_collar_central + 0.015 * hb)
    ]
    if len(collar_band) < 10:
        collar_band = [
            p for p in central_corridor
            if p[2] >= (z_collar_central - 0.08 * hb)
        ]
    if len(collar_band) < 6:
        collar_band = central_corridor
    if len(collar_rim) < 8:
        collar_rim = collar_band

    rim_xs = sorted(p[0] for p in collar_rim)
    x_collar = 0.5 * (_percentile_sorted(rim_xs, 5.0) + _percentile_sorted(rim_xs, 95.0))
    w_collar = max(0.08 * hb, _percentile_sorted(rim_xs, 95.0) - _percentile_sorted(rim_xs, 5.0))

    band_ys = sorted(p[1] for p in collar_band)
    y_collar_front = _percentile_sorted(band_ys, 5.0)
    y_collar_back_raw = _percentile_sorted(band_ys, 95.0)
    d_collar_raw = max(0.05 * hb, y_collar_back_raw - y_collar_front)

    # Clamp effective neck socket depth to <= 0.72 * w_collar so rear hoodie pockets do not pull the neck backward
    d_collar = min(d_collar_raw, 0.72 * w_collar)
    y_collar = y_collar_front + 0.46 * d_collar

    front_lip_zs = sorted(
        p[2] for p in collar_band
        if p[1] <= (y_collar_front + 0.35 * d_collar)
    )
    z_collar_front = _percentile_sorted(front_lip_zs, 80.0) if len(front_lip_zs) >= 4 else (z_collar_central - 0.015 * hb)
    z_collar_back = z_collar_central

    return {
        "z_min": round(zb_min, 5),
        "z_max": round(zb_max, 5),
        "height": round(hb, 5),
        "w_body": round(wb, 5),
        "x_mid": round(x_mid, 5),
        "corridor_half_width": round(corridor_half_w, 5),
        "z_collar_central": round(z_collar_central, 5),
        "x_trunk": round(x_trunk, 5),
        "w_shoulders": round(w_shoulders, 5),
        "x_collar": round(x_collar, 5),
        "y_collar": round(y_collar, 5),
        "y_collar_front": round(y_collar_front, 5),
        "y_collar_back_raw": round(y_collar_back_raw, 5),
        "z_collar_front": round(z_collar_front, 5),
        "z_collar_back": round(z_collar_back, 5),
        "w_collar": round(w_collar, 5),
        "d_collar": round(d_collar, 5),
        "d_collar_raw": round(d_collar_raw, 5),
    }


def profile_head_neck_and_cranium(head_obj: "bpy.types.Object") -> Dict[str, Any]:
    """
    Enforces INV-AGNOSTIC-01 Stage B & INV-DRAPE-SAFE-01 (functional_specification_059.md Section 4.2.2):
    Profiles horizontal slices of `head.glb` along Z to:
    1. Locate the submental chin-to-throat inflection height Z_chin (sharpest forward -Y step).
    2. Isolate the anterior-central biological neck column below Z_chin (Y <= Y_throat + 0.23*H_head)
       so hanging rear/side headwear drapes (e.g. durag tails, cap straps) never bias X_neck, Y_neck, or W_neck.
    3. Measure mid-cranial breadth W_cranium across [Z_min + 0.42*H_head, Z_min + 0.65*H_head].
    4. Detect whether a wide anterior chest/clavicle bust pedestal exists (vs. posterior headwear drapes).
    """
    verts = [(v.co.x, v.co.y, v.co.z) for v in head_obj.data.vertices]
    if not verts:
        raise ValueError(f"Fatal: Head mesh '{head_obj.name}' has 0 vertices.")

    zs = [p[2] for p in verts]
    zh_min, zh_max = min(zs), max(zs)
    hh = zh_max - zh_min
    if hh <= 0.05:
        raise ValueError(f"Fatal: Head mesh '{head_obj.name}' has degenerate height {hh:.4f}m.")

    # Slice head into 40 horizontal bands to detect submental chin-to-throat inflection Z_chin
    n_slices = 40
    step = hh / float(n_slices)
    slice_ymin: List[float] = []
    slice_z: List[float] = []
    for i in range(n_slices):
        z0 = zh_min + i * step
        z1 = z0 + step
        sub_ys = sorted(
            p[1] for p in verts
            if z0 <= p[2] < z1 and abs(p[0]) < 0.28 * hh
        )
        if len(sub_ys) >= 10:
            slice_ymin.append(_percentile_sorted(sub_ys, 3.0))
            slice_z.append(0.5 * (z0 + z1))

    z_chin = zh_min + 0.20 * hh
    chin_step_detected = False
    if len(slice_z) >= 6:
        best_dy = 0.0
        best_idx = -1
        for i in range(len(slice_z) - 1):
            zc = slice_z[i]
            if (zh_min + 0.12 * hh) <= zc <= (zh_min + 0.36 * hh):
                dy = slice_ymin[i + 1] - slice_ymin[i]
                if dy < best_dy:
                    best_dy = dy
                    best_idx = i
        if best_idx >= 0 and best_dy < (-0.025 * hh):
            z_chin = slice_z[best_idx + 1]
            chin_step_detected = True

    # Submental neck zone below Z_chin: [zh_min + 0.08*hh, z_chin - 0.01*hh]
    z_neck_lo = zh_min + 0.08 * hh
    z_neck_hi = max(z_neck_lo + 0.06 * hh, z_chin - 0.01 * hh)
    neck_band = [
        p for p in verts
        if z_neck_lo <= p[2] <= z_neck_hi and abs(p[0]) < 0.35 * hh
    ]
    if len(neck_band) < 20:
        neck_band = [p for p in verts if p[2] <= (zh_min + 0.30 * hh)]

    neck_band_ys = sorted(p[1] for p in neck_band)
    y_throat = _percentile_sorted(neck_band_ys, 2.0)

    # Isolate anterior-central biological neck core (exclude posterior headwear drapes > y_throat + 0.23*hh)
    neck_ant = [p for p in neck_band if p[1] <= (y_throat + 0.23 * hh)]
    if len(neck_ant) < 20:
        neck_ant = neck_band

    ant_xs = sorted(p[0] for p in neck_ant)
    x_neck = 0.5 * (_percentile_sorted(ant_xs, 5.0) + _percentile_sorted(ant_xs, 95.0))
    w_neck = max(0.25 * hh, _percentile_sorted(ant_xs, 95.0) - _percentile_sorted(ant_xs, 5.0))
    y_neck = y_throat + 0.45 * w_neck

    # Mid-cranial breadth across [zh_min + 0.42*hh, zh_min + 0.65*hh]
    cran_xs = sorted(
        p[0] for p in verts
        if (zh_min + 0.42 * hh) <= p[2] <= (zh_min + 0.65 * hh)
    )
    w_cranium = (_percentile_sorted(cran_xs, 98.0) - _percentile_sorted(cran_xs, 2.0)) if len(cran_xs) >= 20 else (0.58 * hh)

    # Check if bottom 10% has a wide ANTERIOR chest/clavicle bust pedestal vs. posterior headwear drapes
    bot_band = [p for p in verts if p[2] <= (zh_min + 0.10 * hh)]
    bot_ant = [p for p in bot_band if p[1] <= (y_throat + 0.20 * hh)]
    w_bot_ant = (_percentile([p[0] for p in bot_ant], 95.0) - _percentile([p[0] for p in bot_ant], 5.0)) if len(bot_ant) >= 15 else w_neck
    has_anterior_bust_pedestal = bool(w_bot_ant > 1.15 * w_cranium)

    return {
        "z_min": round(zh_min, 5),
        "z_max": round(zh_max, 5),
        "height": round(hh, 5),
        "z_chin": round(z_chin, 5),
        "chin_step_detected": chin_step_detected,
        "x_neck": round(x_neck, 5),
        "y_neck": round(y_neck, 5),
        "y_throat": round(y_throat, 5),
        "w_neck": round(w_neck, 5),
        "w_cranium": round(w_cranium, 5),
        "has_anterior_bust_pedestal": has_anterior_bust_pedestal,
    }


def profile_and_seat_head_agnostic(
    head_obj: "bpy.types.Object",
    body_obj: "bpy.types.Object",
    scale_override: Optional[float] = None,
    translation_override: Optional[Tuple[float, float, float]] = None,
    neck_cut_z_override: Optional[float] = None,
    fighter_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Enforces INV-AGNOSTIC-01, INV-DRAPE-SAFE-01, INV-NO-DECIMATE-01, INV-CENTRAL-SOCKET-SEAT-01,
    & INV-WATERTIGHT-SEATING-01 (functional_specification_059.md, 040.md & 041.md §4.3):
    Profiles `body_obj` and `head_obj`, computes the proportional uniform scale factor `s_head`
    and 3D concentric collar seating translation `(tx, ty, tz)` using the Central Sagittal Corridor
    Neck-Socket detector (`|x - x_mid| <= 0.22 * W_body`), radially tapers the bottom 8% of `head_obj`'s
    neck plug inward by `0.72x`, and depresses interior collar cap vertices strictly inside `0.72` of
    the central collar radius without touching lateral shoulder pauldrons.
    """
    if head_obj is None or head_obj.type != 'MESH':
        raise TypeError("Fatal: head_obj must be a valid Blender mesh object.")
    if body_obj is None or body_obj.type != 'MESH':
        raise TypeError("Fatal: body_obj must be a valid Blender mesh object.")

    raw_fc = str(fighter_code or "").strip()
    clean_fc = (raw_fc[0].upper() + raw_fc[1].lower()) if len(raw_fc) == 2 else None
    is_pikachu = bool(clean_fc in ("Pk", "Pc"))
    is_compact_creature = bool(clean_fc in ("Pk", "Pc", "Ys", "Kb", "Pr", "Pp", "Ns"))

    body_v_initial = len(body_obj.data.vertices)
    head_v_initial = len(head_obj.data.vertices)

    body_profile = profile_body_collar_socket(body_obj)
    head_profile = profile_head_neck_and_cranium(head_obj)

    hb = float(body_profile["height"])
    wb = float(body_profile.get("w_body", hb * 0.55))
    x_mid = float(body_profile.get("x_mid", 0.0))
    corridor_half_w = float(body_profile.get("corridor_half_width", 0.22 * wb))
    z_collar_central = float(body_profile.get("z_collar_central", body_profile["z_max"]))
    hh = float(head_profile["height"])
    zh_min = float(head_profile["z_min"])

    # Draped-headwear-safe bottom rim hygiene (INV-DRAPE-SAFE-01):
    # Only perform planar bottom trimming if an explicit override is passed OR an anterior bust pedestal flare is detected (skip for creature wide cheeks).
    cut_z_applied: Optional[float] = None
    if neck_cut_z_override is not None:
        cut_z_applied = float(neck_cut_z_override)
    elif (not is_compact_creature) and head_profile["has_anterior_bust_pedestal"]:
        cut_z_applied = zh_min + 0.095 * hh

    if cut_z_applied is not None:
        mesh = head_obj.data
        bm = bmesh.new()
        bm.from_mesh(mesh)
        geom_all = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(
            bm,
            geom=geom_all,
            plane_co=(0.0, 0.0, cut_z_applied),
            plane_no=(0.0, 0.0, -1.0),
            clear_outer=True,
            clear_inner=False,
        )
        loose = [v for v in bm.verts if len(v.link_edges) == 0]
        if loose:
            bmesh.ops.delete(bm, geom=loose, context='VERTS')
        islands = get_connected_island_counts(bm)
        if len(islands) > 1:
            islands.sort(key=len, reverse=True)
            to_del = [v for isl in islands[1:] for v in isl]
            bmesh.ops.delete(bm, geom=to_del, context='VERTS')
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        zs_after_trim = [v.co.z for v in head_obj.data.vertices]
        zh_min = min(zs_after_trim)
        hh = max(0.05, max(zs_after_trim) - zh_min)

    # Stage C: Compute cross-validated scale factor s_head and 3D translation (tx, ty, tz)
    w_collar = float(body_profile["w_collar"])
    w_neck = float(head_profile["w_neck"])
    s_stature = 0.205 * (hb / hh)
    s_socket = (0.56 * w_collar) / max(w_neck, 0.25 * hh)

    zb_min = float(body_profile["z_min"])
    zb_max = float(body_profile["z_max"])
    z_collar_front = float(body_profile["z_collar_front"])
    zh_max = zh_min + hh
    z_chin = float(head_profile["z_chin"])

    # Central Sagittal Corridor top rim (INV-CENTRAL-SOCKET-SEAT-01):
    # Strictly restrict top-rim sampling to |x - x_mid| <= 0.22 * W_body and z in [z_collar_central - 0.045*hb, z_collar_central]
    b_verts_raw = [(v.co.x, v.co.y, v.co.z) for v in body_obj.data.vertices]
    central_top_rim = [
        p for p in b_verts_raw
        if abs(p[0] - x_mid) <= corridor_half_w
        and (z_collar_central - 0.045 * hb) <= p[2] <= (z_collar_central + 0.015 * hb)
    ]
    if len(central_top_rim) < 10:
        central_top_rim = [
            p for p in b_verts_raw
            if abs(p[0] - x_mid) <= max(corridor_half_w, 0.25 * hb)
            and p[2] >= (z_collar_central - 0.08 * hb)
        ]
    if len(central_top_rim) < 6:
        central_top_rim = [p for p in b_verts_raw if p[2] >= (zb_max - 0.08 * hb)]

    c_rim_xs = sorted(p[0] for p in central_top_rim)
    c_rim_ys = sorted(p[1] for p in central_top_rim)
    x_collar_central = 0.5 * (_percentile_sorted(c_rim_xs, 5.0) + _percentile_sorted(c_rim_xs, 95.0))
    y_collar_central = 0.5 * (_percentile_sorted(c_rim_ys, 5.0) + _percentile_sorted(c_rim_ys, 95.0))
    z_collar_target = (zb_max - 0.020 * hb) if is_pikachu else (z_collar_central - 0.010 * hb)
    z_seat_target = z_collar_target - 0.015 * hb

    # Visible head height above chin/collar line (so neck plug below z_chin is buried inside the collar)
    h_vis = max(0.55 * hh, zh_max - z_chin)

    if scale_override is not None:
        s_head = float(scale_override)
    elif is_pikachu:
        # Big Bobblehead (1.50x) proportion (functional_specification_040.md Section 2.4):
        # visible_head_height / total_height = 0.42 (body = 0.58 * total_height)
        s_head = (0.42 / 0.58) * (max(0.05, z_seat_target - zb_min) / h_vis)
    elif clean_fc in ("Kb", "Pr"):
        s_head = (0.46 / 0.54) * (max(0.05, z_seat_target - zb_min) / h_vis)
    elif clean_fc in ("Ys", "Pp", "Ns"):
        s_head = (0.36 / 0.64) * (max(0.05, z_seat_target - zb_min) / h_vis)
    else:
        s_head = max(
            0.195 * (hb / hh),
            min(0.228 * (hb / hh), 0.65 * s_stature + 0.35 * s_socket),
        )

    if translation_override is not None:
        tx, ty, tz = (float(translation_override[0]), float(translation_override[1]), float(translation_override[2]))
    else:
        x_collar = x_collar_central if clean_fc else float(body_profile["x_collar"])
        y_collar = y_collar_central if clean_fc else float(body_profile["y_collar"])
        x_neck = float(head_profile["x_neck"])
        y_neck = float(head_profile["y_neck"])

        # INV-WATERTIGHT-SEATING-01: Radially taper bottom 8% of head.glb's neck plug inward by 0.72x
        h_verts_raw = [(v.co.x, v.co.y, v.co.z) for v in head_obj.data.vertices]
        z_plug_top = zh_min + 0.08 * hh
        h_plug = [p for p in h_verts_raw if p[2] <= z_plug_top]
        if len(h_plug) < 15:
            h_plug = [p for p in h_verts_raw if p[2] <= z_chin]
        hp_xs = sorted(p[0] for p in h_plug)
        hp_ys = sorted(p[1] for p in h_plug)
        x_neck_plug = 0.5 * (_percentile_sorted(hp_xs, 5.0) + _percentile_sorted(hp_xs, 95.0))
        y_neck_plug = 0.5 * (_percentile_sorted(hp_ys, 5.0) + _percentile_sorted(hp_ys, 95.0))

        for v in head_obj.data.vertices:
            if v.co.z < z_plug_top:
                t_p = min(1.0, max(0.0, (z_plug_top - v.co.z) / max(1e-5, 0.08 * hh)))
                shrink = 1.0 - 0.28 * t_p
                v.co.x = x_neck_plug + (v.co.x - x_neck_plug) * shrink
                v.co.y = y_neck_plug + (v.co.y - y_neck_plug) * shrink

        if is_compact_creature:
            tx = x_collar_central - s_head * x_neck_plug
            ty = (y_collar_central + 0.018 * hb) - s_head * y_neck_plug
            tz_chin_c = z_seat_target - s_head * z_chin
            tz_embed_c = (z_collar_target - 0.075 * hb) - s_head * zh_min
            tz = min(tz_chin_c, tz_embed_c)
        elif clean_fc:
            tx = x_collar_central - s_head * x_neck_plug
            ty = y_collar_central - s_head * y_neck_plug
            tz_chin_f = (z_collar_central + 0.015 * hb) - s_head * z_chin
            tz_embed_f = (z_collar_central - 0.038 * hb) - s_head * zh_min
            tz = min(tz_chin_f, tz_embed_f)
        else:
            tx = x_collar - s_head * x_neck
            ty = y_collar - s_head * y_neck
            tz_chin = (z_collar_front + 0.025 * hb) - s_head * z_chin
            tz_embed = (z_collar_front - 0.032 * hb) - s_head * zh_min
            tz = min(tz_chin, tz_embed)

    mat_scale = mathutils.Matrix.Scale(s_head, 4)
    mat_trans = mathutils.Matrix.Translation((tx, ty, tz))
    head_obj.data.transform(mat_trans @ mat_scale)
    head_obj.data.update()

    if scale_override is None and translation_override is None:
        # INV-WATERTIGHT-SEATING-01: Depress flat interior collar floor strictly inside 72% of the
        # central neck-socket radius (r_norm < 0.72), never touching lateral shoulder pauldrons!
        h_seated = [(v.co.x, v.co.y, v.co.z) for v in head_obj.data.vertices]
        z_head_bot = min(p[2] for p in h_seated)
        cur_rx = max(1e-4, min(corridor_half_w, 0.5 * (_percentile_sorted(c_rim_xs, 95.0) - _percentile_sorted(c_rim_xs, 5.0))))
        cur_ry = max(1e-4, 0.5 * (_percentile_sorted(c_rim_ys, 95.0) - _percentile_sorted(c_rim_ys, 5.0)))
        z_band_start = z_collar_central - 0.06 * hb
        for v in body_obj.data.vertices:
            if v.co.z > z_band_start and abs(v.co.x - x_mid) <= corridor_half_w:
                dx = v.co.x - x_collar_central
                dy = v.co.y - y_collar_central
                r_norm = math.hypot(dx / cur_rx, dy / cur_ry)
                if r_norm < 0.72 and v.co.z > (z_head_bot + 0.015 * hb):
                    w_in = 1.0 - (r_norm / 0.72)
                    v.co.z = v.co.z * (1.0 - w_in) + (z_head_bot + 0.015 * hb) * w_in
        body_obj.data.update()

    if len(body_obj.data.vertices) != body_v_initial:
        raise ValueError("Fatal [INV-NO-DECIMATE-01]: Headless body vertex count mutated during head seating.")

    xs = [v.co.x for v in head_obj.data.vertices]
    ys = [v.co.y for v in head_obj.data.vertices]
    zs = [v.co.z for v in head_obj.data.vertices]

    seating_mode = (
        "explicit_override"
        if (scale_override is not None or translation_override is not None)
        else (
            "pikachu_bobblehead_150x"
            if is_pikachu
            else (f"fighter_{clean_fc.lower()}_central_corridor" if clean_fc else "agnostic_3d_landmark_solver")
        )
    )

    telemetry = {
        "status": "HEAD_SEATED_AGNOSTIC",
        "mode": seating_mode,
        "fighter_code": clean_fc,
        "body_collar_socket": body_profile,
        "head_anatomical_profile": head_profile,
        "scale_candidates": {
            "s_stature": round(s_stature, 5),
            "s_socket": round(s_socket, 5),
        },
        "scale_applied": round(s_head, 5),
        "translation_applied": (round(tx, 5), round(ty, 5), round(tz, 5)),
        "neck_cut_z_applied": round(cut_z_applied, 5) if cut_z_applied is not None else None,
        "pedestal_verts_removed": head_v_initial - len(head_obj.data.vertices),
        "body_verts_preserved": body_v_initial,
        "seated_head_bounds": {
            "x_span": (round(min(xs), 5), round(max(xs), 5)),
            "y_span": (round(min(ys), 5), round(max(ys), 5)),
            "z_span": (round(min(zs), 5), round(max(zs), 5)),
            "scaled_width": round(max(xs) - min(xs), 5),
        },
    }
    print(
        f"Agnostic Seated {head_obj.name} onto {body_obj.name}: "
        f"s_head={s_head:.4f} (s_stat={s_stature:.4f}, s_sock={s_socket:.4f}) | "
        f"T=({tx:+.4f}, {ty:+.4f}, {tz:+.4f}) | "
        f"Seated Z=[{min(zs):.4f}, {max(zs):.4f}]"
    )
    return telemetry


def sever_doom_body_extremities(body_obj: "bpy.types.Object") -> Dict[str, Any]:
    """
    Prepares the legacy PLATODOOM_RAW mesh when assembling with separate DOOM_HAND.glb:
    1. Bevels the anterior submandibular neck rim so it stays 100% buried inside PLATODOOM_HEAD.
    2. Trims the distal 2cm wrist tips perpendicular to the left and right forearm axes
       so the forearm stumps seat cleanly inside the DOOM_HAND wrist cuffs.
    """
    if body_obj is None or body_obj.type != 'MESH':
        raise TypeError("Fatal: body_obj must be a valid Blender mesh object.")

    mesh = body_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    v_initial = len(bm.verts)

    geom_neck_verts = [v for v in bm.verts if v.co.z > 0.93 and abs(v.co.x) < 0.14]
    geom_neck_edges = [e for e in bm.edges if all(v.co.z > 0.93 and abs(v.co.x) < 0.14 for v in e.verts)]
    geom_neck_faces = [f for f in bm.faces if all(v.co.z > 0.93 and abs(v.co.x) < 0.14 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_neck_verts + geom_neck_edges + geom_neck_faces,
        plane_co=(0.0, 0.0, 0.968),
        plane_no=mathutils.Vector((0.0, -0.25, 1.0)).normalized(),
        clear_outer=True,
        clear_inner=False,
    )

    geom_left = [v for v in bm.verts if v.co.x > 0.48 and v.co.z < 0.35]
    geom_left_edges = [e for e in bm.edges if all(v.co.x > 0.48 and v.co.z < 0.35 for v in e.verts)]
    geom_left_faces = [f for f in bm.faces if all(v.co.x > 0.48 and v.co.z < 0.35 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_left + geom_left_edges + geom_left_faces,
        plane_co=LEFT_WRIST_CUT_CO,
        plane_no=LEFT_FOREARM_AXIS,
        clear_outer=True,
        clear_inner=False,
    )

    geom_right = [v for v in bm.verts if v.co.x < -0.48 and v.co.z < 0.35]
    geom_right_edges = [e for e in bm.edges if all(v.co.x < -0.48 and v.co.z < 0.35 for v in e.verts)]
    geom_right_faces = [f for f in bm.faces if all(v.co.x < -0.48 and v.co.z < 0.35 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_right + geom_right_edges + geom_right_faces,
        plane_co=RIGHT_WRIST_CUT_CO,
        plane_no=RIGHT_FOREARM_AXIS,
        clear_outer=True,
        clear_inner=False,
    )

    loose = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    v_final = len(bm.verts)
    max_z = max(v.co.z for v in bm.verts)
    max_abs_x = max(abs(v.co.x) for v in bm.verts)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return {
        "status": "SEVERING_COMPLETE",
        "v_initial": v_initial,
        "v_final": v_final,
        "max_z": max_z,
        "max_abs_x": max_abs_x,
    }


def trim_and_seat_doom_head(head_obj: "bpy.types.Object", body_obj: Optional["bpy.types.Object"] = None) -> Dict[str, Any]:
    """Legacy wrapper delegating to profile_and_seat_head_agnostic or explicit DOOM constants."""
    if body_obj is not None:
        return profile_and_seat_head_agnostic(
            head_obj=head_obj,
            body_obj=body_obj,
            scale_override=SCALE_HEAD_1,
            translation_override=(SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z),
            neck_cut_z_override=HEAD_NECK_CUT_Z,
        )
    mesh = head_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    v_before = len(bm.verts)
    bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        plane_co=(0.0, 0.0, HEAD_NECK_CUT_Z),
        plane_no=(0.0, 0.0, -1.0),
        clear_outer=True,
        clear_inner=False,
    )
    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=len, reverse=True)
        bmesh.ops.delete(bm, geom=[v for isl in islands[1:] for v in isl], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    v_after = len(bm.verts)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    mat_scale = mathutils.Matrix.Scale(SCALE_HEAD_1, 4)
    mat_trans = mathutils.Matrix.Translation((SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z))
    mesh.transform(mat_trans @ mat_scale)
    mesh.update()
    zs = [v.co.z for v in mesh.vertices]
    return {
        "status": "HEAD_SEATED",
        "scale_applied": SCALE_HEAD_1,
        "flange_verts_removed": v_before - v_after,
        "final_location": (SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z),
        "z_span": (min(zs), max(zs)),
    }


def prepare_and_seat_luis_head(
    head_obj: "bpy.types.Object",
    body_obj: "bpy.types.Object",
) -> Dict[str, Any]:
    """Delegates directly to the .glb-file-agnostic 3D landmark & cross-sectional solver."""
    return profile_and_seat_head_agnostic(head_obj=head_obj, body_obj=body_obj)


def prepare_and_mount_doom_hands(
    hand_obj: "bpy.types.Object",
) -> Tuple["bpy.types.Object", "bpy.types.Object", Dict[str, Any]]:
    """
    Trims forearm cable stub on DOOM_HAND below Z=-0.790, scales by 0.200,
    orients in 3D world space to align colinearly with the downward/outward
    A-pose forearm axis, mirrors across X=0 for the right hand, and recalculates outward normals.
    """
    if hand_obj is None or hand_obj.type != 'MESH':
        raise TypeError("Fatal: hand_obj must be a valid Blender mesh object.")

    mesh = hand_obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    geom_all = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(
        bm,
        geom=geom_all,
        plane_co=(0.0, 0.0, WRIST_CUT_Z),
        plane_no=(0.0, 0.0, -1.0),
        clear_outer=True,
        clear_inner=False,
    )
    loose = [v for v in bm.verts if len(v.link_edges) == 0]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')

    islands = get_connected_island_counts(bm)
    if len(islands) > 1:
        islands.sort(key=len, reverse=True)
        bmesh.ops.delete(bm, geom=[v for isl in islands[1:] for v in isl], context='VERTS')

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

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

    bm_l = bmesh.new()
    bm_l.from_mesh(hand_obj.data)
    bmesh.ops.recalc_face_normals(bm_l, faces=bm_l.faces)
    bm_l.to_mesh(hand_obj.data)
    bm_l.free()
    hand_obj.data.update()

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

    bm_r = bmesh.new()
    bm_r.from_mesh(hand_r.data)
    bmesh.ops.reverse_faces(bm_r, faces=bm_r.faces)
    bmesh.ops.recalc_face_normals(bm_r, faces=bm_r.faces)
    bm_r.to_mesh(hand_r.data)
    bm_r.free()
    hand_r.data.update()

    telemetry = {
        "status": "HANDS_MOUNTED",
        "scale": SCALE_HAND_1,
        "left_wrist": tuple(LEFT_WRIST_TARGET),
        "right_wrist": tuple(RIGHT_WRIST_TARGET),
        "mirrored_normals_corrected": True,
    }
    return hand_obj, hand_r, telemetry


def _clean_zero(val: float, ndigits: int = 5) -> float:
    r = round(float(val), ndigits)
    return 0.0 if abs(r) < 1e-9 else r


def _tube_center(arr_1d: Any, default: float = 0.0) -> float:
    """
    Computes the geometric axis center of a 1D cross-section of a hollow manifold tube
    using the 10%–90% interdecile midrange (avoiding bimodal perimeter wall flips).
    """
    a = np.asarray(arr_1d, dtype=np.float64)
    if len(a) == 0:
        return float(default)
    if len(a) < 4:
        return float(np.mean(a))
    p10, p90 = np.percentile(a, [10.0, 90.0])
    return float(0.5 * (p10 + p90))


def compute_skeleton_metrics_from_z_up_arrays(
    verts_z_up: Any,
    is_head_mask: Optional[Any] = None,
    seating_info: Optional[Dict[str, Any]] = None,
    standardize_offset: Optional[Sequence[float]] = None,
    standardize_scale: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Enforces INV-SKELETON-METRICS-01 & INV-METRICS-SCHEMA-01 (functional_specification_064.md Section 4.1 & 4.2):
    Directly measures the unified character mesh's 29 anatomical 3D joint centers, limb segment lengths,
    arm elevation angles, rest-pose classification ('A_POSE' vs 'T_POSE'), and skirt topology in
    canonical 2.000m stature space, emitting both Blender Z-up (`joints_z_up`) and glTF Y-up (`joints_y_up`)
    coordinates with < 10^-5m parity.
    """
    t0 = time.perf_counter()
    if not HAS_NUMPY:
        raise RuntimeError("Fatal [INV-SKELETON-METRICS-01]: NumPy is required for 3D skeleton_metrics extraction.")

    v = np.asarray(verts_z_up, dtype=np.float64).reshape(-1, 3).copy()
    if len(v) == 0:
        raise ValueError("Fatal [INV-SKELETON-METRICS-01]: Cannot profile skeleton_metrics on empty vertex array.")

    z_min_raw = float(v[:, 2].min())
    z_max_raw = float(v[:, 2].max())
    h_raw = max(1e-6, z_max_raw - z_min_raw)
    if abs(h_raw - 2.0) > 0.005 or abs(z_min_raw) > 0.002:
        s_2m = 2.0 / h_raw
        x_mid_r = 0.5 * float(v[:, 0].min() + v[:, 0].max())
        y_mid_r = 0.5 * float(v[:, 1].min() + v[:, 1].max())
        v[:, 0] = (v[:, 0] - x_mid_r) * s_2m
        v[:, 1] = (v[:, 1] - y_mid_r) * s_2m
        v[:, 2] = (v[:, 2] - z_min_raw) * s_2m

    n_verts = len(v)
    if is_head_mask is not None:
        h_mask = np.asarray(is_head_mask, dtype=bool).reshape(n_verts)
    else:
        h_mask = np.zeros(n_verts, dtype=bool)

    if int(np.count_nonzero(h_mask)) < 15:
        h_mask = (v[:, 2] >= 1.640) & (np.abs(v[:, 0]) <= 0.22)

    b_mask = ~h_mask
    vh = v[h_mask]
    vb = v[b_mask] if np.any(b_mask) else v
    xb, yb, zb = vb[:, 0], vb[:, 1], vb[:, 2]

    # 1. Cranial & Cervical Landmarks
    has_explicit_head_mask = int(np.count_nonzero(h_mask)) >= 15
    is_bobble = bool(seating_info and seating_info.get("mode") == "pikachu_bobblehead_150x")
    z_neck_min_clamp = 1.05 if (has_explicit_head_mask or is_bobble) else 1.50
    z_head_min = float(np.percentile(vh[:, 2], 2.0)) if len(vh) > 0 else 1.640
    y_neck_norm = float(np.clip(z_head_min, z_neck_min_clamp, 1.72))
    if seating_info and standardize_offset is not None and standardize_scale is not None:
        collar_c = (seating_info.get("body_collar_socket") or {}).get("center")
        if collar_c and len(collar_c) == 3:
            z_collar_std = (float(collar_c[2]) + float(standardize_offset[2])) * float(standardize_scale)
            y_neck_norm = float(np.clip(max(z_head_min, z_collar_std), z_neck_min_clamp, 1.72))

    x_half_norm = float(np.clip(np.max(np.abs(vh[:, 0])) + 0.015, 0.15, 0.26)) if len(vh) > 0 else 0.200
    neck_slice = v[(v[:, 2] >= y_neck_norm - 0.045) & (v[:, 2] <= y_neck_norm + 0.045) & (np.abs(v[:, 0]) < 0.14)]
    neck_x = float(np.median(neck_slice[:, 0])) if len(neck_slice) > 0 else 0.0
    neck_y = float(np.median(neck_slice[:, 1])) if len(neck_slice) > 0 else 0.010

    vh_upper = vh[vh[:, 2] >= y_neck_norm] if len(vh) > 0 else vh
    if len(vh_upper) == 0:
        vh_upper = vh
    head_x = float(np.median(vh_upper[:, 0])) if len(vh_upper) > 0 else neck_x
    head_y = float(np.median(vh_upper[:, 1])) if len(vh_upper) > 0 else neck_y
    head_z = float(np.clip(np.median(vh_upper[:, 2]), y_neck_norm + 0.08, 1.92)) if len(vh_upper) > 0 else 1.785

    # 2. Lower-Body Bifurcation, Pelvis, Hip, Knee, Ankle, Ball & Toe Landmarks
    med_low = (np.abs(xb) < 0.020) & (zb >= 0.30) & (zb <= 0.54)
    slices_populated = sum(
        1
        for zs in np.arange(0.32, 0.52, 0.02)
        if np.count_nonzero((np.abs(xb) < 0.020) & (zb >= zs) & (zb < zs + 0.02)) >= 2
    )
    has_skirt = bool(np.count_nonzero(med_low) > 35 and slices_populated >= 6)

    if has_skirt:
        crotch_z = 0.860
    else:
        crotch_z = 0.750
        found_crotch = False
        for zc in np.arange(0.58, 0.93, 0.01):
            c1 = np.count_nonzero((np.abs(xb) < 0.018) & (zb >= zc) & (zb < zc + 0.025))
            c2 = np.count_nonzero((np.abs(xb) < 0.022) & (zb >= zc + 0.02) & (zb < zc + 0.05))
            l_cnt = np.count_nonzero((xb >= 0.025) & (xb < 0.24) & (zb >= zc - 0.02) & (zb < zc + 0.02))
            r_cnt = np.count_nonzero((xb <= -0.025) & (xb > -0.24) & (zb >= zc - 0.02) & (zb < zc + 0.02))
            if c1 >= 4 and c2 >= 4 and l_cnt >= 5 and r_cnt >= 5:
                crotch_z = float(zc)
                found_crotch = True
                break
        if not found_crotch:
            for zc in np.arange(0.58, 0.93, 0.01):
                c1 = np.count_nonzero((np.abs(xb) < 0.024) & (zb >= zc) & (zb < zc + 0.03))
                if c1 >= 2:
                    crotch_z = float(zc)
                    break
        crotch_z = float(np.clip(crotch_z, 0.58, 0.92))

    pelvis_z = float(np.clip(crotch_z + 0.065, 0.64, 0.96))
    pelvis_pts = vb[(zb >= crotch_z - 0.02) & (zb <= pelvis_z + 0.05) & (np.abs(xb) < 0.18)]
    pelvis_y = float(np.median(pelvis_pts[:, 1])) if len(pelvis_pts) > 0 else 0.010
    hip_z = float(np.clip(crotch_z + 0.055, 0.63, 0.95))

    leg_joints: Dict[str, List[float]] = {}
    for side_sgn, suf in ((1.0, "l"), (-1.0, "r")):
        th_pts = vb[(zb >= crotch_z - 0.04) & (zb <= crotch_z + 0.05) & (side_sgn * xb > 0.02) & (side_sgn * xb < 0.28)]
        hx = float(np.median(np.abs(th_pts[:, 0]))) if len(th_pts) > 0 else 0.125
        hy = float(np.median(th_pts[:, 1])) if len(th_pts) > 0 else pelvis_y
        leg_joints[f"hip_{suf}"] = [side_sgn * hx, hy, hip_z]

        ank_pts = vb[(zb >= 0.05) & (zb <= 0.14) & (side_sgn * xb > 0.02)]
        ax = float(np.median(np.abs(ank_pts[:, 0]))) if len(ank_pts) > 0 else hx
        ay = float(np.median(ank_pts[:, 1])) if len(ank_pts) > 0 else -0.015
        az = float(np.median(ank_pts[:, 2])) if len(ank_pts) > 0 else 0.098
        leg_joints[f"ankle_{suf}"] = [side_sgn * ax, ay, az]

        knee_z = float(0.52 * hip_z + 0.48 * az)
        kn_pts = vb[(zb >= knee_z - 0.035) & (zb <= knee_z + 0.035) & (side_sgn * xb > 0.02)]
        kx = float(np.median(np.abs(kn_pts[:, 0]))) if len(kn_pts) > 0 else 0.5 * (hx + ax)
        ky = float(np.median(kn_pts[:, 1])) if len(kn_pts) > 0 else 0.020
        leg_joints[f"knee_{suf}"] = [side_sgn * kx, ky, knee_z]

        ft_pts = vb[(zb >= 0.00) & (zb <= 0.065) & (side_sgn * xb > 0.02)]
        fx = float(np.median(np.abs(ft_pts[:, 0]))) if len(ft_pts) > 0 else ax
        y_heel = float(np.percentile(ft_pts[:, 1], 90)) if len(ft_pts) > 0 else 0.040
        y_front = float(np.percentile(ft_pts[:, 1], 3)) if len(ft_pts) > 0 else -0.175
        by = float(y_heel + 0.70 * (y_front - y_heel))
        ty = float(y_heel + 0.95 * (y_front - y_heel))
        leg_joints[f"ball_{suf}"] = [side_sgn * fx, by, 0.018]
        leg_joints[f"toe_{suf}"] = [side_sgn * fx, ty, 0.014]

    # 3. Spine Chain Landmarks
    spine_joints: Dict[str, List[float]] = {}
    for sname, frac in (("spine_01", 0.25), ("spine_02", 0.52), ("spine_03", 0.78)):
        sz = float(pelvis_z + frac * (y_neck_norm - pelvis_z))
        sp_pts = vb[(zb >= sz - 0.04) & (zb <= sz + 0.04) & (np.abs(xb) < 0.16)]
        sy = float(np.median(sp_pts[:, 1])) if len(sp_pts) > 0 else pelvis_y
        spine_joints[sname] = [0.0, sy, sz]

    # 4. Upper-Limb Corridor, Pose Classification & Bilateral Arm Landmarks
    arm_joints: Dict[str, List[float]] = {}
    arm_degs: Dict[str, float] = {}
    for side_sgn, suf in ((1.0, "l"), (-1.0, "r")):
        arm_probe = vb[(side_sgn * xb > 0.22) & (zb >= 0.45) & (zb <= 1.72)]
        x_arm_max_probe = float(np.percentile(np.abs(arm_probe[:, 0]), 98.5)) if len(arm_probe) > 0 else 0.580
        z_sh_hi = min(1.58, y_neck_norm - 0.08) if x_arm_max_probe >= 0.72 else min(1.50, y_neck_norm - 0.14)
        z_sh_lo = max(0.75 if y_neck_norm < 1.45 else 1.30, z_sh_hi - 0.14)

        sh_pts = vb[(side_sgn * xb >= 0.165) & (side_sgn * xb <= 0.225) & (zb >= z_sh_lo) & (zb <= z_sh_hi)]
        if len(sh_pts) == 0:
            sh_pts = vb[(side_sgn * xb >= 0.155) & (side_sgn * xb <= 0.235) & (zb >= max(0.70, z_sh_lo - 0.10)) & (zb <= min(1.60, z_sh_hi + 0.10))]
        sh_x = _tube_center(np.abs(sh_pts[:, 0]), 0.195)
        sh_y = _tube_center(sh_pts[:, 1], 0.015)
        sh_z = _tube_center(sh_pts[:, 2], 0.5 * (z_sh_lo + z_sh_hi))
        arm_joints[f"shoulder_{suf}"] = [side_sgn * sh_x, sh_y, sh_z]
        arm_joints[f"clavicle_{suf}"] = [side_sgn * 0.42 * sh_x, sh_y - 0.020, sh_z + 0.010]

        arm_pts = vb[(side_sgn * xb > max(0.225, sh_x + 0.025)) & (zb >= 0.40) & (zb <= 1.72)]
        x_arm_max = float(np.percentile(np.abs(arm_pts[:, 0]), 98.5)) if len(arm_pts) > 0 else 0.580
        span_x = max(0.20, x_arm_max - sh_x)

        wr_pts = arm_pts[
            (np.abs(arm_pts[:, 0]) >= sh_x + 0.68 * span_x)
            & (np.abs(arm_pts[:, 0]) <= sh_x + 0.84 * span_x)
        ]
        wr_x = _tube_center(np.abs(wr_pts[:, 0]), sh_x + 0.76 * span_x)
        wr_y = _tube_center(wr_pts[:, 1], sh_y)
        wr_z = _tube_center(wr_pts[:, 2], sh_z)
        arm_joints[f"wrist_{suf}"] = [side_sgn * wr_x, wr_y, wr_z]

        ht_pts = arm_pts[np.abs(arm_pts[:, 0]) >= sh_x + 0.92 * span_x]
        ht_x = _tube_center(np.abs(ht_pts[:, 0]), x_arm_max)
        ht_y = _tube_center(ht_pts[:, 1], wr_y)
        ht_z = _tube_center(ht_pts[:, 2], wr_z)
        arm_joints[f"hand_tip_{suf}"] = [side_sgn * ht_x, ht_y, ht_z]

        el_x0 = sh_x + 0.44 * max(0.10, wr_x - sh_x)
        el_x1 = sh_x + 0.56 * max(0.10, wr_x - sh_x)
        z_line_mid = 0.5 * (sh_z + wr_z)
        el_pts = arm_pts[
            (np.abs(arm_pts[:, 0]) >= el_x0)
            & (np.abs(arm_pts[:, 0]) <= el_x1)
            & (np.abs(arm_pts[:, 2] - z_line_mid) <= 0.28)
        ]
        if len(el_pts) == 0:
            el_pts = arm_pts[(np.abs(arm_pts[:, 0]) >= el_x0) & (np.abs(arm_pts[:, 0]) <= el_x1)]
        el_x = _tube_center(np.abs(el_pts[:, 0]), 0.5 * (sh_x + wr_x))
        el_y = _tube_center(el_pts[:, 1], 0.5 * (sh_y + wr_y))
        el_z = _tube_center(el_pts[:, 2], z_line_mid)
        arm_joints[f"elbow_{suf}"] = [side_sgn * el_x, el_y, el_z]

        deg_up = math.degrees(math.atan2(el_z - sh_z, max(0.04, el_x - sh_x)))
        deg_chord = math.degrees(math.atan2(wr_z - sh_z, max(0.08, wr_x - sh_x)))
        arm_degs[f"upper_arm_{suf}"] = round(deg_up, 2)
        arm_degs[f"chord_{suf}"] = round(deg_chord, 2)
        arm_degs[suf] = round(deg_up, 2)

    mean_deg = round(0.5 * (arm_degs["l"] + arm_degs["r"]), 2)
    is_apose = bool(mean_deg < -15.0)
    pose_type = "A_POSE" if is_apose else "T_POSE"

    raw_joints_z_up: Dict[str, List[float]] = {
        "root": [0.0, 0.0, 0.0],
        "pelvis": [0.0, pelvis_y, pelvis_z],
        "crotch": [0.0, pelvis_y, crotch_z],
        "spine_01": spine_joints["spine_01"],
        "spine_02": spine_joints["spine_02"],
        "spine_03": spine_joints["spine_03"],
        "neck_01": [neck_x, neck_y, y_neck_norm],
        "head": [head_x, head_y, head_z],
        "crown_top": [head_x, head_y, 2.0],
        "clavicle_l": arm_joints["clavicle_l"],
        "clavicle_r": arm_joints["clavicle_r"],
        "shoulder_l": arm_joints["shoulder_l"],
        "shoulder_r": arm_joints["shoulder_r"],
        "elbow_l": arm_joints["elbow_l"],
        "elbow_r": arm_joints["elbow_r"],
        "wrist_l": arm_joints["wrist_l"],
        "wrist_r": arm_joints["wrist_r"],
        "hand_tip_l": arm_joints["hand_tip_l"],
        "hand_tip_r": arm_joints["hand_tip_r"],
        "hip_l": leg_joints["hip_l"],
        "hip_r": leg_joints["hip_r"],
        "knee_l": leg_joints["knee_l"],
        "knee_r": leg_joints["knee_r"],
        "ankle_l": leg_joints["ankle_l"],
        "ankle_r": leg_joints["ankle_r"],
        "ball_l": leg_joints["ball_l"],
        "ball_r": leg_joints["ball_r"],
        "toe_l": leg_joints["toe_l"],
        "toe_r": leg_joints["toe_r"],
    }

    joints_z_up: Dict[str, List[float]] = {}
    joints_y_up: Dict[str, List[float]] = {}
    for k, pt in raw_joints_z_up.items():
        xz = _clean_zero(pt[0], 5)
        yz = _clean_zero(pt[1], 5)
        zz = _clean_zero(pt[2], 5)
        joints_z_up[k] = [xz, yz, zz]
        joints_y_up[k] = [xz, zz, _clean_zero(-yz, 5)]

    def _dist3(a: Sequence[float], b: Sequence[float]) -> float:
        return math.sqrt(sum((float(a[i]) - float(b[i])) ** 2 for i in range(3)))

    upper_arm_len = 0.5 * (_dist3(joints_z_up["shoulder_l"], joints_z_up["elbow_l"]) + _dist3(joints_z_up["shoulder_r"], joints_z_up["elbow_r"]))
    forearm_len = 0.5 * (_dist3(joints_z_up["elbow_l"], joints_z_up["wrist_l"]) + _dist3(joints_z_up["elbow_r"], joints_z_up["wrist_r"]))
    hand_len = 0.5 * (_dist3(joints_z_up["wrist_l"], joints_z_up["hand_tip_l"]) + _dist3(joints_z_up["wrist_r"], joints_z_up["hand_tip_r"]))
    thigh_len = 0.5 * (_dist3(joints_z_up["hip_l"], joints_z_up["knee_l"]) + _dist3(joints_z_up["hip_r"], joints_z_up["knee_r"]))
    calf_len = 0.5 * (_dist3(joints_z_up["knee_l"], joints_z_up["ankle_l"]) + _dist3(joints_z_up["knee_r"], joints_z_up["ankle_r"]))
    foot_len = 0.5 * (_dist3(joints_z_up["ankle_l"], joints_z_up["toe_l"]) + _dist3(joints_z_up["ankle_r"], joints_z_up["toe_r"]))

    return {
        "schema_version": "1.0",
        "stature_meters": 2.0,
        "pose_type": pose_type,
        "is_apose": is_apose,
        "has_skirt": has_skirt,
        "profiling_elapsed_sec": round(time.perf_counter() - t0, 5),
        "arm_elevation_deg": {
            "left": arm_degs["l"],
            "right": arm_degs["r"],
            "mean": mean_deg,
            "upper_arm_left": arm_degs["upper_arm_l"],
            "upper_arm_right": arm_degs["upper_arm_r"],
            "chord_left": arm_degs["chord_l"],
            "chord_right": arm_degs["chord_r"],
        },
        "proportions": {
            "crotch_height_ratio": round(crotch_z / 2.0, 5),
            "head_height_ratio": round((2.0 - y_neck_norm) / 2.0, 5),
            "torso_length_meters": round(y_neck_norm - pelvis_z, 5),
            "shoulder_breadth_meters": round(abs(joints_z_up["shoulder_l"][0] - joints_z_up["shoulder_r"][0]), 5),
            "hip_breadth_meters": round(abs(joints_z_up["hip_l"][0] - joints_z_up["hip_r"][0]), 5),
            "stance_ankle_breadth_meters": round(abs(joints_z_up["ankle_l"][0] - joints_z_up["ankle_r"][0]), 5),
            "arm_span_meters": round(abs(joints_z_up["hand_tip_l"][0] - joints_z_up["hand_tip_r"][0]), 5),
            "upper_arm_length_meters": round(upper_arm_len, 5),
            "forearm_length_meters": round(forearm_len, 5),
            "hand_length_meters": round(hand_len, 5),
            "thigh_length_meters": round(thigh_len, 5),
            "calf_length_meters": round(calf_len, 5),
            "foot_length_meters": round(foot_len, 5),
        },
        "head_bounds_2m": {
            "y_neck_norm": round(y_neck_norm, 5),
            "x_half_norm": round(x_half_norm, 5),
            "z_min": round(y_neck_norm, 5),
            "z_max": 2.0,
        },
        "joints_z_up": joints_z_up,
        "joints_y_up": joints_y_up,
    }


def profile_assembled_skeleton_metrics(
    unified_obj: "bpy.types.Object",
    seating_info: Optional[Dict[str, Any]] = None,
    standardize_offset: Optional[Sequence[float]] = None,
    standardize_scale: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Extracts vertex coordinates and `_IS_HEAD_PART` weights from `unified_obj` inside Blender
    and delegates to `compute_skeleton_metrics_from_z_up_arrays()`.
    """
    mesh = unified_obj.data
    n_verts = len(mesh.vertices)
    if HAS_NUMPY:
        coords = np.empty(n_verts * 3, dtype=np.float32)
        mesh.vertices.foreach_get("co", coords)
        v_arr = coords.reshape(-1, 3)
        head_mask = np.zeros(n_verts, dtype=bool)
    else:
        v_arr = [(v.co.x, v.co.y, v.co.z) for v in mesh.vertices]
        head_mask = [False] * n_verts

    vg_head = unified_obj.vertex_groups.get("_IS_HEAD_PART")
    if vg_head is not None:
        g_idx = vg_head.index
        for i_v, vt in enumerate(mesh.vertices):
            for g in vt.groups:
                if g.group == g_idx and g.weight > 0.5:
                    head_mask[i_v] = True
                    break
    else:
        head_mat_indices = {
            idx for idx, mat in enumerate(mesh.materials)
            if mat is not None and "head" in mat.name.lower()
        }
        if head_mat_indices:
            for poly in mesh.polygons:
                if poly.material_index in head_mat_indices:
                    for v_idx in poly.vertices:
                        head_mask[v_idx] = True

    return compute_skeleton_metrics_from_z_up_arrays(
        verts_z_up=v_arr,
        is_head_mask=head_mask,
        seating_info=seating_info,
        standardize_offset=standardize_offset,
        standardize_scale=standardize_scale,
    )


def unify_and_standardize_character(
    character_name: str,
    component_objs: List["bpy.types.Object"],
    target_height: float = TARGET_STATURE_METERS,
    seating_info: Optional[Dict[str, Any]] = None,
) -> Tuple["bpy.types.Object", Dict[str, Any]]:
    """
    Enforces INV-STD-01 & INV-NO-DECIMATE-01 (functional_specification_059.md Section 4.3):
    1. Tags `_IS_HEAD_PART` vertex group (`1.0` on Head vertices, `0.0` on Body/Hand vertices)
       prior to joining so downstream auto-riggers can distinguish head/drape vertices from collar vertices.
    2. Joins component meshes into a single unified character object without decimating or welding across
       distinct components.
    3. Places footwear soles flush on Z=0.000m, centers horizontally at (0.000m, 0.000m),
       scales standing stature uniformly to `target_height` (2.000m), and bakes transforms to identity.
    """
    if not component_objs:
        raise ValueError(f"Fatal: No component objects provided for '{character_name}'.")

    expected_faces = sum(len(obj.data.polygons) for obj in component_objs)
    expected_verts = sum(len(obj.data.vertices) for obj in component_objs)

    # 1. Tag _IS_HEAD_PART vertex group before joining
    for obj in component_objs:
        vg_h = obj.vertex_groups.get("_IS_HEAD_PART") or obj.vertex_groups.new(name="_IS_HEAD_PART")
        is_head = "HEAD" in obj.name.upper()
        all_indices = list(range(len(obj.data.vertices)))
        if all_indices:
            vg_h.add(all_indices, 1.0 if is_head else 0.0, 'REPLACE')

    # 2. Select all components and join into a single master mesh
    bpy.ops.object.select_all(action='DESELECT')
    for obj in component_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = component_objs[0]
    bpy.ops.object.join()

    unified_obj = bpy.context.active_object
    unified_obj.name = character_name
    unified_obj.data.name = character_name

    # Ensure smooth shading across all joined faces (zero decimation, zero inter-component vertex welding)
    bpy.ops.object.shade_smooth()
    unified_obj.data.update()

    verts = [v.co for v in unified_obj.data.vertices]
    if not verts:
        raise ValueError(f"Fatal: Unified character '{character_name}' has 0 vertices.")

    z_min = min(v.z for v in verts)
    z_max = max(v.z for v in verts)
    h_current = z_max - z_min
    if h_current <= 0:
        raise ValueError(f"Fatal: Invalid height {h_current} for '{character_name}'.")

    x_min = min(v.x for v in verts)
    x_max = max(v.x for v in verts)
    y_min = min(v.y for v in verts)
    y_max = max(v.y for v in verts)
    x_mid = 0.5 * (x_min + x_max)
    y_mid = 0.5 * (y_min + y_max)

    offset = mathutils.Vector((-x_mid, -y_mid, -z_min))
    scale_factor = target_height / h_current

    for v in unified_obj.data.vertices:
        v.co = (v.co + offset) * scale_factor
    unified_obj.data.update()

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    final_verts = [v.co for v in unified_obj.data.vertices]
    final_z_min = min(v.z for v in final_verts)
    final_z_max = max(v.z for v in final_verts)
    final_height = final_z_max - final_z_min
    final_x_mid = 0.5 * (min(v.x for v in final_verts) + max(v.x for v in final_verts))
    final_y_mid = 0.5 * (min(v.y for v in final_verts) + max(v.y for v in final_verts))
    final_face_count = len(unified_obj.data.polygons)

    if abs(final_z_min) > 0.001:
        raise ValueError(f"Fatal [INV-STD-01]: Z_min={final_z_min:.4f}m violates ground plane threshold (+/-0.001m).")

    if abs(final_height - target_height) > 0.010:
        raise ValueError(f"Fatal [INV-STD-01]: Final height={final_height:.4f}m violates {target_height:.3f}m (+/-0.010m) contract.")

    if final_face_count != expected_faces:
        raise ValueError(
            f"Fatal [INV-NO-DECIMATE-01]: Unified face count ({final_face_count}) does not equal "
            f"sum of component faces ({expected_faces})."
        )

    skeleton_metrics = profile_assembled_skeleton_metrics(
        unified_obj=unified_obj,
        seating_info=seating_info,
        standardize_offset=(offset.x, offset.y, offset.z),
        standardize_scale=scale_factor,
    )

    telemetry = {
        "character": character_name,
        "raw_height": round(h_current, 5),
        "standard_scale": round(scale_factor, 5),
        "final_height": round(final_height, 5),
        "final_z_min": round(final_z_min, 5),
        "final_z_max": round(final_z_max, 5),
        "final_x_mid": round(final_x_mid, 5),
        "final_y_mid": round(final_y_mid, 5),
        "total_vertices": len(final_verts),
        "expected_vertices": expected_verts,
        "total_faces": final_face_count,
        "expected_faces": expected_faces,
        "material_count": len(unified_obj.data.materials),
        "materials": [m.name for m in unified_obj.data.materials if m is not None],
        "uv_layers": [uv.name for uv in unified_obj.data.uv_layers],
        "has_is_head_part_vg": "_IS_HEAD_PART" in unified_obj.vertex_groups,
        "decimation_applied": False,
        "skeleton_metrics": skeleton_metrics,
    }
    print(
        f"Standardized {character_name}: Height {final_height:.4f}m (Scale: {scale_factor:.4f}) | "
        f"Z_min: {final_z_min:.4f}m | Verts: {len(final_verts)} | Faces: {final_face_count} | "
        f"Pose: {skeleton_metrics['pose_type']} ({skeleton_metrics['arm_elevation_deg']['mean']:.1f} deg) | "
        f"Materials: {telemetry['materials']}"
    )
    return unified_obj, telemetry


def export_assembled_character_glb(
    obj: "bpy.types.Object",
    export_path: str,
) -> Dict[str, Any]:
    """
    Exports target character mesh object as production binary glTF 2.0 (.glb).
    Validates file existence, non-empty size, and glTF magic header.
    """
    if obj is None or obj.type != 'MESH':
        raise TypeError(f"Fatal: Cannot export non-mesh object '{getattr(obj, 'name', None)}'.")

    os.makedirs(os.path.dirname(os.path.abspath(export_path)), exist_ok=True)

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

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
        export_texcoords=True,
    )

    if not os.path.exists(export_path):
        raise FileNotFoundError(f"Fatal: glTF export failed. File missing at '{export_path}'.")

    file_size_bytes = os.path.getsize(export_path)
    if file_size_bytes < 100 * 1024:
        raise ValueError(
            f"Fatal: Exported file '{export_path}' is corrupted or truncated ({file_size_bytes} bytes < 100KB)."
        )

    with open(export_path, "rb") as f:
        header = f.read(4)
        if header != GLTF_MAGIC_HEADER:
            raise ValueError(f"Fatal: File '{export_path}' does not have valid glTF magic header (got {header!r}).")

    digest = sha256_file(export_path)
    size_mb = file_size_bytes / (1024 * 1024)

    telemetry = {
        "status": "EXPORT_SUCCESS",
        "character": obj.name,
        "export_path": os.path.abspath(export_path),
        "size_bytes": file_size_bytes,
        "size_mb": round(size_mb, 2),
        "sha256": digest,
    }
    print(f"Exported glTF 2.0 container: {export_path} | Size: {size_mb:.2f} MB | SHA-256: {digest}")
    return telemetry


def setup_studio_lighting(scene: "bpy.types.Scene") -> None:
    """Sets up a clean 3-point lighting studio and neutral world background in Blender."""
    for obj in list(scene.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

    if scene.world is None:
        scene.world = bpy.data.worlds.new("Studio_World")
    scene.world.use_nodes = True
    if scene.world.node_tree:
        bg_node = next((n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND'), None)
        if bg_node is not None:
            bg_node.inputs[0].default_value = (0.18, 0.18, 0.20, 1.0)
            bg_node.inputs[1].default_value = 1.0

    # Key light
    key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_data.energy = 350.0
    key_data.size = 2.5
    key_obj = bpy.data.objects.new(name="Key_Light", object_data=key_data)
    scene.collection.objects.link(key_obj)
    key_obj.location = (2.0, -2.8, 2.8)
    point_camera_at(key_obj, mathutils.Vector((0.0, 0.0, 1.1)))

    # Fill light
    fill_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_data.energy = 200.0
    fill_data.size = 3.0
    fill_obj = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (-2.5, -2.2, 1.8)
    point_camera_at(fill_obj, mathutils.Vector((0.0, 0.0, 1.0)))

    # Rim light
    rim_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_data.energy = 250.0
    rim_data.size = 2.5
    rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
    scene.collection.objects.link(rim_obj)
    rim_obj.location = (0.0, 2.6, 2.4)
    point_camera_at(rim_obj, mathutils.Vector((0.0, 0.0, 1.1)))


def point_camera_at(cam_obj: "bpy.types.Object", target: "mathutils.Vector") -> None:
    """Directs camera or area light towards target coordinate."""
    loc = cam_obj.location
    direction = target - loc
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()


def render_character_verification_views(
    char_obj: "bpy.types.Object",
    output_dir: str,
    filename_prefix: str = "",
) -> Dict[str, Dict[str, Any]]:
    """
    Renders front, side, and three_quarter 1920x1080 studio verification views for `char_obj`.
    When `filename_prefix` is empty (default for Stage 4 `03_meshes/assembled/verification/`),
    writes `front.png`, `side.png`, and `three_quarter.png`.
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

    for obj in scene.objects:
        if obj.type == 'MESH':
            obj.hide_render = (obj != char_obj)

    angles = [
        ("front", mathutils.Vector((0.0, -5.0, 1.05))),
        ("side", mathutils.Vector((5.0, 0.0, 1.05))),
        ("three_quarter", mathutils.Vector((3.55, -3.55, 1.08))),
    ]

    rendered: Dict[str, Dict[str, Any]] = {}
    for angle_name, cam_pos in angles:
        cam_obj.location = cam_pos
        point_camera_at(cam_obj, target_center)
        fname = f"{filename_prefix}_{angle_name}.png" if filename_prefix else f"{angle_name}.png"
        out_file = os.path.abspath(os.path.join(output_dir, fname))
        scene.render.filepath = out_file
        bpy.ops.render.render(write_still=True)
        if not os.path.isfile(out_file) or os.path.getsize(out_file) <= 0:
            raise RuntimeError(f"Fatal: Verification render failed to produce '{out_file}'.")
        rendered[angle_name] = {
            "path": out_file,
            "size_bytes": os.path.getsize(out_file),
            "sha256": sha256_file(out_file),
            "resolution": [RENDER_RES_X, RENDER_RES_Y],
        }
        print(f"Rendered verification view: {angle_name} -> {out_file}")

    return rendered


def assemble_character_pair_in_blender(
    body_path: str,
    head_path: str,
    output_path: str,
    character_name: str = "Character",
    hand_path: Optional[str] = None,
    render_dir: Optional[str] = None,
    telemetry_out_path: Optional[str] = None,
    target_height: float = TARGET_STATURE_METERS,
    render_prefix: str = "",
    scale_override: Optional[float] = None,
    translation_override: Optional[Tuple[float, float, float]] = None,
    neck_cut_z_override: Optional[float] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
    fighter_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes the end-to-end .glb-file-agnostic character assembly pipeline inside Blender:
    1. Pre-flight binary & anatomical topology validation (>1,000 verts/faces, rejecting icospheres).
    2. Lossless material, texture & UV layer ('UVMap') disambiguation.
    3. Seam-safe 3D vertex welding (0.0001m) prior to floating debris island pruning (zero decimation).
    4. Agnostic 3D collar socket & submental neck column profiling, proportional scaling, and seating.
    5. Master unification (`_IS_HEAD_PART` tagging, Z_min=0.000m grounding, 2.000m stature normalization).
    6. Binary glTF 2.0 export, studio verification rendering, and `assembly_telemetry.json` emission.
    """
    if not HAS_BLENDER:
        raise RuntimeError("Fatal: assemble_character_pair_in_blender() must be invoked inside Blender Python.")

    t_start = time.time()
    body_preflight = validate_input_glb_binary(body_path, role_label="body")
    head_preflight = validate_input_glb_binary(head_path, role_label="head")
    hand_preflight = validate_input_glb_binary(hand_path, role_label="hand") if hand_path else None

    bpy.ops.wm.read_factory_settings(use_empty=True)

    body_obj = import_glb_mesh(body_path, f"{character_name}_BODY")
    head_obj = import_glb_mesh(head_path, f"{character_name}_HEAD")

    body_mat_info = disambiguate_component_materials_and_uvs(body_obj, character_name, "Body")
    head_mat_info = disambiguate_component_materials_and_uvs(head_obj, character_name, "Head")

    body_clean_info = clean_mesh_topology(body_obj)
    head_clean_info = clean_mesh_topology(head_obj)

    components: List["bpy.types.Object"] = [body_obj, head_obj]
    hand_info: Optional[Dict[str, Any]] = None

    if hand_path:
        hand_obj = import_glb_mesh(hand_path, f"{character_name}_HAND")
        disambiguate_component_materials_and_uvs(hand_obj, character_name, "Hand")
        clean_mesh_topology(hand_obj)
        sever_doom_body_extremities(body_obj)
        seating_info = profile_and_seat_head_agnostic(
            head_obj=head_obj,
            body_obj=body_obj,
            scale_override=scale_override if scale_override is not None else SCALE_HEAD_1,
            translation_override=translation_override if translation_override is not None else (SEAT_OFFSET_X, SEAT_OFFSET_Y, SEAT_TRANSLATE_Z),
            neck_cut_z_override=neck_cut_z_override if neck_cut_z_override is not None else HEAD_NECK_CUT_Z,
            fighter_code=fighter_code,
        )
        hand_l, hand_r, hand_info = prepare_and_mount_doom_hands(hand_obj)
        components.extend([hand_l, hand_r])
    else:
        seating_info = profile_and_seat_head_agnostic(
            head_obj=head_obj,
            body_obj=body_obj,
            scale_override=scale_override,
            translation_override=translation_override,
            neck_cut_z_override=neck_cut_z_override,
            fighter_code=fighter_code,
        )

    unified_obj, standardize_info = unify_and_standardize_character(
        character_name=character_name,
        component_objs=components,
        target_height=target_height,
        seating_info=seating_info,
    )

    export_info = export_assembled_character_glb(unified_obj, output_path)

    rendered_views: Dict[str, Dict[str, Any]] = {}
    if render_dir:
        rendered_views = render_character_verification_views(
            char_obj=unified_obj,
            output_dir=render_dir,
            filename_prefix=render_prefix,
        )

    elapsed_sec = round(time.time() - t_start, 3)

    telemetry_payload: Dict[str, Any] = {
        "status": "COMPLETE",
        "character_name": character_name,
        "decimation_applied": False,
        "elapsed_seconds": elapsed_sec,
        **(extra_metadata or {}),
        "inputs": {
            "body": {
                **body_preflight,
                "materials": body_mat_info,
                "cleaning": body_clean_info,
            },
            "head": {
                **head_preflight,
                "materials": head_mat_info,
                "cleaning": head_clean_info,
            },
            **({"hand": hand_preflight, "hand_mounting": hand_info} if hand_preflight else {}),
        },
        "seating": seating_info,
        "standardization": standardize_info,
        "skeleton_metrics": standardize_info.get("skeleton_metrics"),
        "output": export_info,
        "verification_renders": rendered_views,
    }

    if telemetry_out_path:
        os.makedirs(os.path.dirname(os.path.abspath(telemetry_out_path)), exist_ok=True)
        with open(telemetry_out_path, "w", encoding="utf-8") as tf:
            json.dump(telemetry_payload, tf, indent=2)
        print(f"Wrote assembly telemetry manifest: {telemetry_out_path}")

    return telemetry_payload


def resolve_blender_executable(explicit_blender: Optional[str] = None) -> str:
    candidates = [
        explicit_blender,
        os.environ.get("BLENDER_BIN"),
        shutil.which("blender"),
        DEFAULT_BLENDER_BIN,
    ]
    for cand in candidates:
        if cand and os.path.isfile(str(cand)) and os.access(str(cand), os.X_OK):
            return os.path.abspath(str(cand))
    raise FileNotFoundError(
        f"Fatal: Blender executable not found (checked PATH and '{DEFAULT_BLENDER_BIN}')."
    )


def resolve_gcs_credentials_file(explicit_cred: Optional[str] = None) -> Optional[str]:
    candidates = [
        explicit_cred,
        os.environ.get("HY3D_GCS_CREDENTIALS"),
        os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
        *DEFAULT_GCS_CREDENTIALS_CANDIDATES,
    ]
    for cand in candidates:
        if cand and os.path.isfile(os.path.expanduser(str(cand))):
            return os.path.abspath(os.path.expanduser(str(cand)))
    return None


def assemble_character_pair(
    body_path: str,
    head_path: str,
    output_path: str,
    character_name: str = "Character",
    hand_path: Optional[str] = None,
    render_dir: Optional[str] = None,
    telemetry_out_path: Optional[str] = None,
    target_height: float = TARGET_STATURE_METERS,
    render_prefix: str = "",
    blender_bin: Optional[str] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
    fighter_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Host/Blender-agnostic entrypoint:
    - Performs immediate <0.2s pre-flight binary & synthetic primitive validation (`INV-NO-SYNTHETIC-02`).
    - If running inside Blender (`HAS_BLENDER == True`), executes `assemble_character_pair_in_blender` directly.
    - If running in standard Python (`HAS_BLENDER == False`), invokes headless Blender (`Blender -b -P`)
      and returns the parsed `assembly_telemetry.json` dictionary.
    """
    validate_input_glb_binary(body_path, role_label="body")
    validate_input_glb_binary(head_path, role_label="head")
    if hand_path:
        validate_input_glb_binary(hand_path, role_label="hand")

    abs_out = os.path.abspath(output_path)
    abs_tel = (
        os.path.abspath(telemetry_out_path)
        if telemetry_out_path
        else os.path.join(os.path.dirname(abs_out), "assembly_telemetry.json")
    )

    if HAS_BLENDER:
        return assemble_character_pair_in_blender(
            body_path=body_path,
            head_path=head_path,
            output_path=abs_out,
            character_name=character_name,
            hand_path=hand_path,
            render_dir=render_dir,
            telemetry_out_path=abs_tel,
            target_height=target_height,
            render_prefix=render_prefix,
            extra_metadata=extra_metadata,
            fighter_code=fighter_code,
        )

    blender_exe = resolve_blender_executable(blender_bin)
    cmd: List[str] = [
        blender_exe,
        "-b",
        "--python-exit-code",
        "1",
        "-P",
        os.path.abspath(__file__),
        "--",
        "--body",
        os.path.abspath(body_path),
        "--head",
        os.path.abspath(head_path),
        "--output",
        abs_out,
        "--name",
        character_name,
        "--target-height",
        str(float(target_height)),
        "--telemetry-out",
        abs_tel,
    ]
    if hand_path:
        cmd.extend(["--hand", os.path.abspath(hand_path)])
    if render_dir:
        cmd.extend(["--render-dir", os.path.abspath(render_dir)])
    if render_prefix:
        cmd.extend(["--render-prefix", render_prefix])
    if fighter_code:
        cmd.extend(["--fighter", str(fighter_code)])

    proc = subprocess.run(
        cmd,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        timeout=180.0,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Fatal: Headless Blender character assembly failed (exit code {proc.returncode}):\n"
            f"{(proc.stdout or '')[-2000:]}\n{(proc.stderr or '')[-2000:]}"
        )

    if not os.path.isfile(abs_tel):
        raise RuntimeError(f"Fatal: Blender assembly did not write telemetry manifest at '{abs_tel}'.")

    with open(abs_tel, "r", encoding="utf-8") as tf:
        telemetry = json.load(tf)

    if extra_metadata:
        telemetry.update(extra_metadata)
        with open(abs_tel, "w", encoding="utf-8") as tf:
            json.dump(telemetry, tf, indent=2)

    return telemetry


def run_gcs_player_assembly(
    bucket_name: str,
    player_name: str,
    player_id: str,
    run_id: str,
    output_dir: str,
    credentials_path: Optional[str] = None,
    blender_bin: Optional[str] = None,
    downloader_fn: Optional[Callable[[str, str], Dict[str, Any]]] = None,
    uploader_fn: Optional[Callable[..., Dict[str, Any]]] = None,
    render_verification: bool = True,
    pass_group: Optional[str] = None,
    fighter_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Enforces INV-GCS-ASSEMBLE-01 (functional_specification_059.md & functional_specification_039.md):
    1. Pulls `03_meshes/head/head.glb` and all active body pose meshes (`03_meshes/body_apose/body_apose.glb`,
       `03_meshes/body_tpose/body_tpose.glb`, and/or legacy `03_meshes/body/body.glb`) from
       `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/` into `<output_dir>/meshes/`
       (or reuses existing non-empty local `.glb` files if already downloaded in Stage 3).
    2. Executes headless Blender agnostic assembly for each available body pose (`apose` and/or `tpose`) to produce:
       - `<output_dir>/meshes/assembled/character_apose.glb` & `assembly_apose_telemetry.json` (when A-pose is present)
       - `<output_dir>/meshes/assembled/character_tpose.glb` & `assembly_tpose_telemetry.json` (when T-pose is present)
       - `<output_dir>/meshes/assembled/character_full.glb` & `assembly_telemetry.json` (backward-compatible alias + master manifest)
       - `<output_dir>/meshes/assembled/verification/{apose_*,tpose_*,front,side,three_quarter}.png`
    3. Uploads all Stage 4 deliverables to `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/03_meshes/assembled/`
       with custom player metadata and remote byte-size parity verification.
    4. Updates `<output_dir>/routing_audit.json` (if present) and syncs `routing_audit.json` to GCS.
    """
    clean_bucket = str(bucket_name or "").strip().replace("gs://", "").strip("/")
    if not clean_bucket:
        raise ValueError("Fatal [INV-GCS-ASSEMBLE-01]: bucket_name cannot be empty.")

    identity = resolve_player_identity(player_name=player_name, player_id=player_id, run_id=run_id)
    run_prefix = identity["run_prefix"]

    abs_out_dir = os.path.abspath(output_dir)
    meshes_dir = os.path.join(abs_out_dir, "meshes")
    assembled_dir = os.path.join(meshes_dir, "assembled")
    verif_dir = os.path.join(assembled_dir, "verification")
    os.makedirs(verif_dir, exist_ok=True)

    local_head_glb = os.path.join(meshes_dir, "head.glb")
    remote_head_key = f"{run_prefix}/03_meshes/head/head.glb"

    local_body_apose_glb = os.path.join(meshes_dir, "body_apose.glb")
    local_body_legacy_glb = os.path.join(meshes_dir, "body.glb")
    local_body_tpose_glb = os.path.join(meshes_dir, "body_tpose.glb")

    remote_body_apose_key = f"{run_prefix}/03_meshes/body_apose/body_apose.glb"
    remote_body_legacy_key = f"{run_prefix}/03_meshes/body/body.glb"
    remote_body_tpose_key = f"{run_prefix}/03_meshes/body_tpose/body_tpose.glb"

    cred_file = resolve_gcs_credentials_file(credentials_path)

    # Create default GCS downloader & uploader if not injected
    if downloader_fn is None or uploader_fn is None:
        from google.cloud import storage

        client = (
            storage.Client.from_service_account_json(cred_file)
            if cred_file
            else storage.Client()
        )
        bucket = client.bucket(clean_bucket)

        if downloader_fn is None:
            def _default_dl(object_key: str, local_dest: str) -> Dict[str, Any]:
                blob = bucket.blob(object_key)
                if not blob.exists():
                    raise FileNotFoundError(
                        f"Fatal [INV-GCS-ASSEMBLE-01]: Missing required input mesh in GCS: gs://{clean_bucket}/{object_key}"
                    )
                blob.reload()
                rsize = int(blob.size or 0)
                if rsize <= 0:
                    raise RuntimeError(
                        f"Fatal [INV-GCS-ASSEMBLE-01]: Remote GCS object is 0 bytes: gs://{clean_bucket}/{object_key}"
                    )
                os.makedirs(os.path.dirname(local_dest), exist_ok=True)
                blob.download_to_filename(local_dest, timeout=120)
                lsize = os.path.getsize(local_dest)
                if lsize != rsize:
                    raise RuntimeError(
                        f"Fatal [INV-GCS-ASSEMBLE-01]: Download size mismatch for gs://{clean_bucket}/{object_key} "
                        f"(remote={rsize}, local={lsize})."
                    )
                return {
                    "gcs_uri": f"gs://{clean_bucket}/{object_key}",
                    "object_key": object_key,
                    "local_path": local_dest,
                    "size_bytes": lsize,
                    "sha256": sha256_file(local_dest),
                }
            downloader_fn = _default_dl

        if uploader_fn is None:
            def _default_ul(
                local_path: str,
                object_key: str,
                content_type: str,
                sha256_hex: str,
                metadata: Optional[Dict[str, str]] = None,
            ) -> Dict[str, Any]:
                blob = bucket.blob(object_key)
                blob.metadata = dict(metadata) if metadata else {"sha256": sha256_hex}
                blob.upload_from_filename(local_path, content_type=content_type, timeout=120)
                blob.reload()
                rsize = int(blob.size or 0)
                lsize = os.path.getsize(local_path)
                if rsize != lsize or rsize <= 0:
                    raise RuntimeError(
                        f"Fatal [INV-GCS-ASSEMBLE-01]: Upload size mismatch for gs://{clean_bucket}/{object_key} "
                        f"(remote={rsize}, local={lsize})."
                    )
                return {
                    "gcs_uri": f"gs://{clean_bucket}/{object_key}",
                    "object_key": object_key,
                    "local_path": local_path,
                    "size_bytes": rsize,
                    "sha256": sha256_hex,
                    "content_type": content_type,
                    "metadata": dict(blob.metadata or {}),
                }
            uploader_fn = _default_ul

    t_stage4 = time.time()

    def _try_download_optional(object_key: str, local_dest: str) -> Optional[Dict[str, Any]]:
        if downloader_fn is None:
            return None
        try:
            return downloader_fn(object_key, local_dest)
        except (FileNotFoundError, AssertionError, KeyError, RuntimeError):
            return None

    # 1. Intake head.glb and available body pose meshes (body_apose.glb / body.glb and/or body_tpose.glb)
    if downloader_fn is not None and (not os.path.isfile(local_head_glb) or os.path.getsize(local_head_glb) == 0):
        downloader_fn(remote_head_key, local_head_glb)

    pg_clean = str(pass_group or "").strip().lower()
    want_apose = pg_clean not in ("body_tpose", "tpose")
    want_tpose = pg_clean not in ("both", "body", "body_apose", "apose")

    discovered_bodies: Dict[str, str] = {}

    if want_apose:
        if os.path.isfile(local_body_apose_glb) and os.path.getsize(local_body_apose_glb) > 0:
            discovered_bodies["apose"] = local_body_apose_glb
        elif os.path.isfile(local_body_legacy_glb) and os.path.getsize(local_body_legacy_glb) > 0:
            discovered_bodies["apose"] = local_body_legacy_glb
        else:
            if _try_download_optional(remote_body_apose_key, local_body_apose_glb):
                discovered_bodies["apose"] = local_body_apose_glb
            elif _try_download_optional(remote_body_legacy_key, local_body_legacy_glb):
                discovered_bodies["apose"] = local_body_legacy_glb

    if want_tpose:
        if os.path.isfile(local_body_tpose_glb) and os.path.getsize(local_body_tpose_glb) > 0:
            discovered_bodies["tpose"] = local_body_tpose_glb
        elif _try_download_optional(remote_body_tpose_key, local_body_tpose_glb):
            discovered_bodies["tpose"] = local_body_tpose_glb

    if not discovered_bodies:
        raise FileNotFoundError(
            f"Fatal [INV-GCS-ASSEMBLE-01]: No body mesh (body_apose.glb, body_tpose.glb, or body.glb) found "
            f"in '{meshes_dir}' or gs://{clean_bucket}/{run_prefix}/03_meshes/."
        )

    assembled_glb_path = os.path.join(assembled_dir, "character_full.glb")
    telemetry_json_path = os.path.join(assembled_dir, "assembly_telemetry.json")

    base_meta = {
        "player_name": identity["player_name"],
        "player_slug": identity["player_slug"],
        "player_id": identity["player_id"],
        "player_folder": identity["player_folder"],
        "run_id": identity["run_id"],
        "pass_group": "assembled",
        "gcs_bucket": clean_bucket,
        "gcs_run_prefix": f"gs://{clean_bucket}/{run_prefix}",
    }

    # 2. Execute headless Blender agnostic assembly for each discovered body pose (concurrently when both exist)
    pose_outputs: Dict[str, Dict[str, Any]] = {}

    def _assemble_pose(pose_key: str, body_file: str) -> Tuple[str, Dict[str, Any]]:
        pose_glb_out = os.path.join(assembled_dir, f"character_{pose_key}.glb")
        pose_tel_out = os.path.join(assembled_dir, f"assembly_{pose_key}_telemetry.json")
        pose_meta = {**base_meta, "pose": pose_key}
        pose_tel = assemble_character_pair(
            body_path=body_file,
            head_path=local_head_glb,
            output_path=pose_glb_out,
            character_name=f"{identity['player_slug'].upper()}_{pose_key.upper()}",
            render_dir=verif_dir if render_verification else None,
            telemetry_out_path=pose_tel_out,
            target_height=TARGET_STATURE_METERS,
            render_prefix=pose_key,
            blender_bin=blender_bin,
            extra_metadata=pose_meta,
            fighter_code=fighter_code,
        )
        return pose_key, {
            "pose": pose_key,
            "body_input_path": body_file,
            "assembled_glb_path": pose_glb_out,
            "telemetry_path": pose_tel_out,
            "telemetry": pose_tel,
        }

    if len(discovered_bodies) == 1:
        only_pose, only_body = next(iter(discovered_bodies.items()))
        pk, pres = _assemble_pose(only_pose, only_body)
        pose_outputs[pk] = pres
    else:
        with ThreadPoolExecutor(max_workers=len(discovered_bodies)) as pose_pool:
            pose_futs = [
                pose_pool.submit(_assemble_pose, p_key, b_path)
                for p_key, b_path in discovered_bodies.items()
            ]
            for fut in as_completed(pose_futs):
                pk, pres = fut.result()
                pose_outputs[pk] = pres

    # Select primary pose ('apose' preferred for backward compatibility, else 'tpose')
    primary_pose = "apose" if "apose" in pose_outputs else next(iter(pose_outputs.keys()))
    primary_entry = pose_outputs[primary_pose]
    shutil.copy2(primary_entry["assembled_glb_path"], assembled_glb_path)

    primary_tel = dict(primary_entry["telemetry"])
    primary_renders: Dict[str, Dict[str, Any]] = {}
    for angle_key, angle_meta in (primary_tel.get("verification_renders") or {}).items():
        src_render = angle_meta.get("path")
        if src_render and os.path.isfile(src_render):
            canonical_render = os.path.join(verif_dir, f"{angle_key}.png")
            if os.path.abspath(src_render) != os.path.abspath(canonical_render):
                shutil.copy2(src_render, canonical_render)
            primary_renders[angle_key] = {
                **angle_meta,
                "path": canonical_render,
                "sha256": sha256_file(canonical_render),
                "size_bytes": os.path.getsize(canonical_render),
            }
    primary_tel["verification_renders"] = primary_renders
    primary_tel["output"] = {
        **primary_tel["output"],
        "export_path": assembled_glb_path,
        "sha256": sha256_file(assembled_glb_path),
        "size_bytes": os.path.getsize(assembled_glb_path),
    }

    # 3. Upload assembled deliverables to 03_meshes/assembled/ in GCS
    assembled_prefix = f"{run_prefix}/03_meshes/assembled"
    upload_items: List[Tuple[str, str, str, str]] = [
        (
            "03_meshes.assembled.character_full_glb",
            assembled_glb_path,
            f"{assembled_prefix}/character_full.glb",
            "model/gltf-binary",
        ),
    ]
    for angle_key, angle_meta in primary_renders.items():
        rpath = angle_meta.get("path")
        if rpath and os.path.isfile(rpath):
            upload_items.append((
                f"03_meshes.assembled.verification.{angle_key}",
                rpath,
                f"{assembled_prefix}/verification/{angle_key}.png",
                "image/png",
            ))

    for pose_key in sorted(pose_outputs.keys()):
        p_entry = pose_outputs[pose_key]
        upload_items.append((
            f"03_meshes.assembled.character_{pose_key}_glb",
            p_entry["assembled_glb_path"],
            f"{assembled_prefix}/character_{pose_key}.glb",
            "model/gltf-binary",
        ))
        for angle_key, angle_meta in (p_entry["telemetry"].get("verification_renders") or {}).items():
            rpath = angle_meta.get("path")
            if rpath and os.path.isfile(rpath):
                upload_items.append((
                    f"03_meshes.assembled.verification.{pose_key}_{angle_key}",
                    rpath,
                    f"{assembled_prefix}/verification/{pose_key}_{angle_key}.png",
                    "image/png",
                ))

    uploaded_objects: Dict[str, Dict[str, Any]] = {}
    gcs_assembled_uris: Dict[str, Any] = {"verification": {}, "poses": {}}

    def _upload_one(lid: str, lpath: str, okey: str, ctype: str) -> Tuple[str, Dict[str, Any]]:
        sha_hex = sha256_file(lpath)
        obj_meta = {
            "player_name": identity["player_name"],
            "player_slug": identity["player_slug"],
            "player_id": identity["player_id"],
            "player_folder": identity["player_folder"],
            "run_id": identity["run_id"],
            "pass_group": "assembled",
            "sha256": sha_hex,
        }
        try:
            res = uploader_fn(lpath, okey, ctype, sha_hex, obj_meta)
        except TypeError:
            res = uploader_fn(lpath, okey, ctype, sha_hex)
        return lid, res

    with ThreadPoolExecutor(max_workers=6) as pool:
        futs = [pool.submit(_upload_one, lid, lp, ok, ct) for lid, lp, ok, ct in upload_items]
        for fut in as_completed(futs):
            lid, umeta = fut.result()
            uploaded_objects[lid] = umeta
            if lid == "03_meshes.assembled.character_full_glb":
                gcs_assembled_uris["character_full_glb"] = umeta["gcs_uri"]
            elif lid == "03_meshes.assembled.character_apose_glb":
                gcs_assembled_uris["character_apose_glb"] = umeta["gcs_uri"]
                gcs_assembled_uris["poses"].setdefault("apose", {})["character_glb"] = umeta["gcs_uri"]
            elif lid == "03_meshes.assembled.character_tpose_glb":
                gcs_assembled_uris["character_tpose_glb"] = umeta["gcs_uri"]
                gcs_assembled_uris["poses"].setdefault("tpose", {})["character_glb"] = umeta["gcs_uri"]
            elif lid.startswith("03_meshes.assembled.verification."):
                ang = lid.split(".")[-1]
                gcs_assembled_uris["verification"][ang] = umeta["gcs_uri"]

    # Record GCS URIs inside per-pose and master telemetry manifests and upload them
    pose_telemetry_summaries: Dict[str, Any] = {}
    for pose_key in sorted(pose_outputs.keys()):
        p_entry = pose_outputs[pose_key]
        p_tel = p_entry["telemetry"]
        p_tel_gcs_key = f"{assembled_prefix}/assembly_{pose_key}_telemetry.json"
        p_tel_uri = f"gs://{clean_bucket}/{p_tel_gcs_key}"
        gcs_assembled_uris[f"{pose_key}_telemetry"] = p_tel_uri
        gcs_assembled_uris["poses"].setdefault(pose_key, {})["telemetry"] = p_tel_uri
        p_tel["gcs_uri"] = gcs_assembled_uris.get(f"character_{pose_key}_glb")
        p_tel["telemetry_gcs_uri"] = p_tel_uri
        with open(p_entry["telemetry_path"], "w", encoding="utf-8") as ptf:
            json.dump(p_tel, indent=2, fp=ptf)
        p_lid, p_umeta = _upload_one(
            f"03_meshes.assembled.{pose_key}_telemetry",
            p_entry["telemetry_path"],
            p_tel_gcs_key,
            "application/json",
        )
        uploaded_objects[p_lid] = p_umeta
        pose_telemetry_summaries[pose_key] = p_tel

    telemetry_gcs_key = f"{assembled_prefix}/assembly_telemetry.json"
    gcs_assembled_uris["telemetry"] = f"gs://{clean_bucket}/{telemetry_gcs_key}"
    primary_tel["assembled_poses"] = sorted(pose_outputs.keys())
    primary_tel["poses"] = pose_telemetry_summaries
    primary_tel["gcs_assembled_uris"] = gcs_assembled_uris
    with open(telemetry_json_path, "w", encoding="utf-8") as tf:
        json.dump(primary_tel, tf, indent=2)

    tel_lid, tel_umeta = _upload_one(
        "03_meshes.assembled.telemetry",
        telemetry_json_path,
        telemetry_gcs_key,
        "application/json",
    )
    uploaded_objects[tel_lid] = tel_umeta

    stage4_elapsed = round(time.time() - t_stage4, 3)

    pose_audit_records: Dict[str, Any] = {}
    for pose_key in sorted(pose_outputs.keys()):
        p_entry = pose_outputs[pose_key]
        p_tel = p_entry["telemetry"]
        p_skel = p_tel.get("skeleton_metrics") or {}
        pose_audit_records[pose_key] = {
            "pose": pose_key,
            "pose_type": p_skel.get("pose_type"),
            "arm_elevation_deg": (p_skel.get("arm_elevation_deg") or {}).get("mean"),
            "body_input_path": p_entry["body_input_path"],
            "assembled_glb_path": p_entry["assembled_glb_path"],
            "assembled_glb_uri": gcs_assembled_uris.get(f"character_{pose_key}_glb"),
            "assembled_glb_sha256": p_tel["output"]["sha256"],
            "assembled_glb_size_bytes": p_tel["output"]["size_bytes"],
            "telemetry_path": p_entry["telemetry_path"],
            "telemetry_uri": gcs_assembled_uris.get(f"{pose_key}_telemetry"),
            "decimation_applied": False,
            "scale_applied": p_tel["seating"]["scale_applied"],
            "translation_applied": p_tel["seating"]["translation_applied"],
            "final_height": p_tel["standardization"]["final_height"],
            "final_z_min": p_tel["standardization"]["final_z_min"],
            "total_vertices": p_tel["standardization"]["total_vertices"],
            "total_faces": p_tel["standardization"]["total_faces"],
            "material_count": p_tel["standardization"]["material_count"],
        }

    # 4. Update routing_audit.json if present in output_dir
    audit_path = os.path.join(abs_out_dir, "routing_audit.json")
    if os.path.isfile(audit_path):
        with open(audit_path, "r", encoding="utf-8") as af:
            audit_payload = json.load(af)
        audit_payload["stage4_assembly_status"] = "COMPLETE"
        audit_payload["stage4_assembled"] = {
            "status": "COMPLETE",
            "assembled_poses": sorted(pose_outputs.keys()),
            "primary_pose": primary_pose,
            "assembled_glb_path": assembled_glb_path,
            "assembled_glb_uri": gcs_assembled_uris["character_full_glb"],
            "assembled_glb_sha256": primary_tel["output"]["sha256"],
            "assembled_glb_size_bytes": primary_tel["output"]["size_bytes"],
            "character_apose_glb_path": pose_outputs["apose"]["assembled_glb_path"] if "apose" in pose_outputs else None,
            "character_apose_glb_uri": gcs_assembled_uris.get("character_apose_glb"),
            "character_tpose_glb_path": pose_outputs["tpose"]["assembled_glb_path"] if "tpose" in pose_outputs else None,
            "character_tpose_glb_uri": gcs_assembled_uris.get("character_tpose_glb"),
            "telemetry_path": telemetry_json_path,
            "telemetry_uri": gcs_assembled_uris["telemetry"],
            "verification_uris": gcs_assembled_uris["verification"],
            "poses": pose_audit_records,
            "skeleton_metrics": primary_tel.get("skeleton_metrics"),
            "decimation_applied": False,
            "scale_applied": primary_tel["seating"]["scale_applied"],
            "translation_applied": primary_tel["seating"]["translation_applied"],
            "final_height": primary_tel["standardization"]["final_height"],
            "final_z_min": primary_tel["standardization"]["final_z_min"],
            "total_vertices": primary_tel["standardization"]["total_vertices"],
            "total_faces": primary_tel["standardization"]["total_faces"],
            "material_count": primary_tel["standardization"]["material_count"],
            "elapsed_seconds": stage4_elapsed,
        }
        if "gcs_objects" not in audit_payload or not isinstance(audit_payload["gcs_objects"], dict):
            audit_payload["gcs_objects"] = {}
        for uk, uv in uploaded_objects.items():
            audit_payload["gcs_objects"][uk] = uv

        with open(audit_path, "w", encoding="utf-8") as af:
            json.dump(audit_payload, af, indent=2)

        _, audit_umeta = _upload_one(
            "routing_audit",
            audit_path,
            f"{run_prefix}/routing_audit.json",
            "application/json",
        )
        audit_payload["gcs_objects"]["routing_audit"] = audit_umeta
        with open(audit_path, "w", encoding="utf-8") as af:
            json.dump(audit_payload, af, indent=2)

    return {
        "status": "COMPLETE",
        "player_name": identity["player_name"],
        "player_slug": identity["player_slug"],
        "player_id": identity["player_id"],
        "player_folder": identity["player_folder"],
        "run_id": identity["run_id"],
        "assembled_poses": sorted(pose_outputs.keys()),
        "primary_pose": primary_pose,
        "assembled_glb_path": assembled_glb_path,
        "character_apose_glb_path": pose_outputs["apose"]["assembled_glb_path"] if "apose" in pose_outputs else None,
        "character_tpose_glb_path": pose_outputs["tpose"]["assembled_glb_path"] if "tpose" in pose_outputs else None,
        "telemetry_path": telemetry_json_path,
        "verification_dir": verif_dir,
        "gcs_assembled_uris": gcs_assembled_uris,
        "poses": pose_audit_records,
        "uploaded_objects": uploaded_objects,
        "telemetry": primary_tel,
        "elapsed_seconds": stage4_elapsed,
    }


def render_verification_views(output_dir: str = VERIFICATION_DIR) -> List[str]:
    """
    Renders front, side, and 3/4 views for canonical characters in the scene,
    plus side-by-side comparison view when both PLATODOOM and LUIS are present.
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
    rendered_files: List[str] = []

    doom_obj = bpy.data.objects.get("PLATODOOM")
    luis_obj = bpy.data.objects.get("LUIS")

    angles = [
        ("front", mathutils.Vector((0.0, -5.4, 1.0))),
        ("side", mathutils.Vector((5.4, 0.0, 1.0))),
        ("three_quarter", mathutils.Vector((3.818, -3.818, 1.0))),
    ]

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
        doom_obj.location.x = 0.0
        luis_obj.location.x = 0.0

    return rendered_files


def run_assembly_pipeline() -> None:
    """Executes legacy canonical batch assembly for PLATODOOM and LUIS in DOOM_RIG_DIR."""
    print("=" * 70)
    print("STARTING 3D CHARACTER CLEANUP, ASSEMBLY & STANDARDIZATION PIPELINE")
    print("=" * 70)

    bpy.ops.wm.read_factory_settings(use_empty=True)

    print("\n--- Processing Character 1: DOOM ---")
    body_obj = import_glb_mesh(PLATODOOM_RAW_PATH, "PLATODOOM_RAW")
    head_obj = import_glb_mesh(PLATODOOM_HEAD_PATH, "PLATODOOM_HEAD")
    hand_obj = import_glb_mesh(DOOM_HAND_PATH, "DOOM_HAND")

    disambiguate_component_materials_and_uvs(body_obj, "PLATODOOM", "Body")
    disambiguate_component_materials_and_uvs(head_obj, "PLATODOOM", "Head")
    disambiguate_component_materials_and_uvs(hand_obj, "PLATODOOM", "Hand")

    clean_mesh_topology(body_obj)
    clean_mesh_topology(head_obj)
    clean_mesh_topology(hand_obj)

    sever_doom_body_extremities(body_obj)
    trim_and_seat_doom_head(head_obj, body_obj=body_obj)
    hand_l, hand_r, _ = prepare_and_mount_doom_hands(hand_obj)

    doom_character, _ = unify_and_standardize_character(
        "PLATODOOM",
        [body_obj, head_obj, hand_l, hand_r],
        target_height=TARGET_STATURE_METERS,
    )
    export_assembled_character_glb(doom_character, PLATODOOM_EXPORT_PATH)

    print("\n--- Processing Character 2: LUIS ---")
    luis_body = import_glb_mesh(LUIS_TPOSE_PATH, "LUIS_TPOSE")
    luis_head = import_glb_mesh(LUIS_HEAD_PATH, "LUIS_HEAD")

    disambiguate_component_materials_and_uvs(luis_body, "LUIS", "Body")
    disambiguate_component_materials_and_uvs(luis_head, "LUIS", "Head")

    clean_mesh_topology(luis_body)
    clean_mesh_topology(luis_head)

    prepare_and_seat_luis_head(luis_head, luis_body)

    luis_character, _ = unify_and_standardize_character(
        "LUIS",
        [luis_body, luis_head],
        target_height=TARGET_STATURE_METERS,
    )
    export_assembled_character_glb(luis_character, LUIS_EXPORT_PATH)

    print("\n--- Rendering Multi-Angle Verification Views ---")
    rendered_images = render_verification_views(VERIFICATION_DIR)
    print(f"\nRendered {len(rendered_images)} verification images to '{VERIFICATION_DIR}'.")


def parse_cli_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    if argv is None:
        if "--" in sys.argv:
            idx = sys.argv.index("--")
            argv = sys.argv[idx + 1:]
        else:
            argv = sys.argv[1:]

    parser = argparse.ArgumentParser(
        description=".glb-File-Agnostic Lossless 3D Character Assembler & GCS 03_meshes/assembled/ Sync"
    )
    parser.add_argument("--body", default=None, help="Path to input body .glb mesh.")
    parser.add_argument("--body-apose", default=None, help="Optional path to input A-pose body .glb mesh.")
    parser.add_argument("--body-tpose", default=None, help="Optional path to input T-pose body .glb mesh.")
    parser.add_argument("--head", default=None, help="Path to input head .glb mesh.")
    parser.add_argument("--hand", default=None, help="Optional path to input hand .glb mesh.")
    parser.add_argument("--output", default=None, help="Path to write unified assembled .glb mesh.")
    parser.add_argument("--output-apose", default=None, help="Optional path to write assembled A-pose .glb mesh.")
    parser.add_argument("--output-tpose", default=None, help="Optional path to write assembled T-pose .glb mesh.")
    parser.add_argument("--name", default="Character", help="Character object/material name prefix.")
    parser.add_argument("--target-height", type=float, default=TARGET_STATURE_METERS, help="Standardized height in meters (default: 2.000).")
    parser.add_argument("--render-dir", "--verification-dir", dest="render_dir", default=None, help="Optional directory to write 1920x1080 verification renders.")
    parser.add_argument("--render-prefix", default="", help="Optional filename prefix for verification renders.")
    parser.add_argument("--telemetry-out", default=None, help="Optional path to write assembly_telemetry.json.")
    parser.add_argument("--blender-bin", default=None, help="Optional path to Blender executable.")
    parser.add_argument("--fighter", default=None, help="Optional Melee fighter code (e.g. 'Pk' for Pikachu 0.42 bobblehead assembly).")

    # GCS Run Mode Arguments
    parser.add_argument("--gcs-bucket", default=None, help="GCS bucket name (e.g. '3d-banana-player-assets').")
    parser.add_argument("--player-name", "--playername", dest="player_name", default=None, help="Player name for GCS run.")
    parser.add_argument("--player-id", default=None, help="Player ID for GCS run.")
    parser.add_argument("--run-id", default=None, help="Run ID for GCS run.")
    parser.add_argument("--output-dir", default=None, help="Local run output directory containing meshes/ and routing_audit.json.")
    parser.add_argument("--gcs-credentials", default=None, help="Optional path to GCS Service Account JSON key.")
    parser.add_argument("--pass-group", default=None, help="Optional pass group filter ('all', 'both', 'body_apose', 'body_tpose').")
    parser.add_argument("--no-render", action="store_true", default=False, help="Skip verification rendering in GCS mode.")
    parser.add_argument("--batch-canonical", action="store_true", default=False, help="Run legacy canonical DOOM + LUIS batch assembly.")

    return parser.parse_args(list(argv))


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_cli_args(argv)

    if args.gcs_bucket and args.player_name and args.player_id and args.run_id:
        out_dir = args.output_dir or os.path.join("/tmp", f"assemble_{args.player_id}_{args.run_id}")
        res = run_gcs_player_assembly(
            bucket_name=args.gcs_bucket,
            player_name=args.player_name,
            player_id=args.player_id,
            run_id=args.run_id,
            output_dir=out_dir,
            credentials_path=args.gcs_credentials,
            blender_bin=args.blender_bin,
            render_verification=not args.no_render,
            pass_group=args.pass_group,
            fighter_code=args.fighter,
        )
        print(json.dumps(res, indent=2), flush=True)
        return 0

    if (args.body_apose or args.body_tpose) and args.head and (args.output_apose or args.output_tpose or args.output):
        results: Dict[str, Any] = {"status": "COMPLETE", "poses": {}}
        if args.body_apose:
            out_apose = args.output_apose or args.output
            assert out_apose is not None
            results["poses"]["apose"] = assemble_character_pair(
                body_path=args.body_apose,
                head_path=args.head,
                output_path=out_apose,
                character_name=f"{args.name}_APOSE",
                hand_path=args.hand,
                render_dir=args.render_dir,
                target_height=args.target_height,
                render_prefix=f"{args.render_prefix}_apose" if args.render_prefix else "apose",
                blender_bin=args.blender_bin,
                fighter_code=args.fighter,
            )
            if args.output and os.path.abspath(out_apose) != os.path.abspath(args.output):
                shutil.copy2(out_apose, args.output)
        if args.body_tpose:
            out_tpose = args.output_tpose or args.output
            assert out_tpose is not None
            results["poses"]["tpose"] = assemble_character_pair(
                body_path=args.body_tpose,
                head_path=args.head,
                output_path=out_tpose,
                character_name=f"{args.name}_TPOSE",
                hand_path=args.hand,
                render_dir=args.render_dir,
                target_height=args.target_height,
                render_prefix=f"{args.render_prefix}_tpose" if args.render_prefix else "tpose",
                blender_bin=args.blender_bin,
                fighter_code=args.fighter,
            )
        if args.telemetry_out:
            os.makedirs(os.path.dirname(os.path.abspath(args.telemetry_out)), exist_ok=True)
            with open(args.telemetry_out, "w", encoding="utf-8") as tf:
                json.dump(results, tf, indent=2)
        print(json.dumps(results, indent=2), flush=True)
        return 0

    if args.body and args.head and args.output:
        res = assemble_character_pair(
            body_path=args.body,
            head_path=args.head,
            output_path=args.output,
            character_name=args.name,
            hand_path=args.hand,
            render_dir=args.render_dir,
            telemetry_out_path=args.telemetry_out,
            target_height=args.target_height,
            render_prefix=args.render_prefix,
            blender_bin=args.blender_bin,
            fighter_code=args.fighter,
        )
        print(json.dumps(res, indent=2), flush=True)
        return 0

    if args.batch_canonical or (not args.body and not args.head and not args.gcs_bucket):
        if HAS_BLENDER:
            run_assembly_pipeline()
            return 0
        blender_exe = resolve_blender_executable(args.blender_bin)
        proc = subprocess.run(
            [blender_exe, "-b", "-P", os.path.abspath(__file__), "--", "--batch-canonical"],
            stdin=subprocess.DEVNULL,
        )
        return proc.returncode

    raise ValueError(
        "Fatal: Provide either (--body, --head, --output) for local pair assembly OR "
        "(--gcs-bucket, --player-name, --player-id, --run-id) for GCS player run assembly."
    )


if __name__ == "__main__":
    sys.exit(main())
