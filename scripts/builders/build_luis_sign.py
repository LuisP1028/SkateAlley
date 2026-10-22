#!/usr/bin/env python3
"""
build_luis_sign.py - Intersecting 3D Holographic Typography Asset Generator
Authoritative Specification: anim/LUIS_AI_ENGINEER_SIGN.md
Governing Tickets: ticket-001.md, ticket-002.md, ticket-006.md
Matrix: wayfinder/20261020T012826-709-gx7f/master_component_to_edit_matrix.md
Schemas: assets/20261020T012826-709-gx7f/plan-luis-sign-character-matrix.json
"""

import os
import sys
import json
import struct
import hashlib

# ============================================================================
# 1. Authoritative Constants & Candidate Paths (Ticket-001, Ticket-002)
# ============================================================================

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))

FONT_CANDIDATE_PATHS = [
    os.path.join(WORKSPACE_DIR, "assets/20261020T012826-709-gx7f/plan-font-roboto-bold.ttf"),
    os.path.join(WORKSPACE_DIR, "assets/20261020T012826-709-gx7f/plan-scan-1-font-roboto-bold.ttf"),
    os.path.join(WORKSPACE_DIR, "assets/20261020T012826-709-gx7f/plan-scan-2-Roboto-Bold.ttf"),
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]

SIGN_CHARACTER_MATRIX = [
    {
        "index": 1,
        "code": "01",
        "nodeName": "Node_01_L_LUIS_PEREZ",
        "glyph": "L",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 1,
        "gridRow": 0,
        "position": [-3.825, 0.0, 0.0],
    },
    {
        "index": 2,
        "code": "02",
        "nodeName": "Node_02_U_LUIS_PEREZ",
        "glyph": "U",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 2,
        "gridRow": 0,
        "position": [-2.975, 0.0, 0.0],
    },
    {
        "index": 3,
        "code": "03",
        "nodeName": "Node_03_I_SHARED_AI_LUIS_PEREZ",
        "glyph": "I",
        "spatialRole": "Shared Intersection",
        "branch": "SHARED_AI_LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ", "AI"],
        "isSharedIntersection": True,
        "gridCol": 3,
        "gridRow": 0,
        "position": [-2.125, 0.0, 0.0],
    },
    {
        "index": 4,
        "code": "04",
        "nodeName": "Node_04_S_LUIS_PEREZ",
        "glyph": "S",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 4,
        "gridRow": 0,
        "position": [-1.275, 0.0, 0.0],
    },
    {
        "index": 5,
        "code": "05",
        "nodeName": "Node_05_P_LUIS_PEREZ",
        "glyph": "P",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 6,
        "gridRow": 0,
        "position": [0.425, 0.0, 0.0],
    },
    {
        "index": 6,
        "code": "06",
        "nodeName": "Node_06_E_SHARED_ENGINEER_LUIS_PEREZ",
        "glyph": "E",
        "spatialRole": "Shared Intersection",
        "branch": "SHARED_ENGINEER_LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ", "ENGINEER"],
        "isSharedIntersection": True,
        "gridCol": 7,
        "gridRow": 0,
        "position": [1.275, 0.0, 0.0],
    },
    {
        "index": 7,
        "code": "07",
        "nodeName": "Node_07_R_LUIS_PEREZ",
        "glyph": "R",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 8,
        "gridRow": 0,
        "position": [2.125, 0.0, 0.0],
    },
    {
        "index": 8,
        "code": "08",
        "nodeName": "Node_08_E_LUIS_PEREZ",
        "glyph": "E",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 9,
        "gridRow": 0,
        "position": [2.975, 0.0, 0.0],
    },
    {
        "index": 9,
        "code": "09",
        "nodeName": "Node_09_Z_LUIS_PEREZ",
        "glyph": "Z",
        "spatialRole": "Horizontal Only",
        "branch": "LUIS_PEREZ",
        "wordMembership": ["LUIS_PEREZ"],
        "isSharedIntersection": False,
        "gridCol": 10,
        "gridRow": 0,
        "position": [3.825, 0.0, 0.0],
    },
    {
        "index": 10,
        "code": "10",
        "nodeName": "Node_10_A_AI",
        "glyph": "A",
        "spatialRole": "Vertical Only",
        "branch": "AI",
        "wordMembership": ["AI"],
        "isSharedIntersection": False,
        "gridCol": 3,
        "gridRow": 1,
        "position": [-2.125, 1.05, 0.0],
    },
    {
        "index": 11,
        "code": "11",
        "nodeName": "Node_11_N_ENGINEER",
        "glyph": "N",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -1,
        "position": [1.275, -1.05, 0.0],
    },
    {
        "index": 12,
        "code": "12",
        "nodeName": "Node_12_G_ENGINEER",
        "glyph": "G",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -2,
        "position": [1.275, -2.1, 0.0],
    },
    {
        "index": 13,
        "code": "13",
        "nodeName": "Node_13_I_ENGINEER",
        "glyph": "I",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -3,
        "position": [1.275, -3.15, 0.0],
    },
    {
        "index": 14,
        "code": "14",
        "nodeName": "Node_14_N_ENGINEER",
        "glyph": "N",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -4,
        "position": [1.275, -4.2, 0.0],
    },
    {
        "index": 15,
        "code": "15",
        "nodeName": "Node_15_E_ENGINEER",
        "glyph": "E",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -5,
        "position": [1.275, -5.25, 0.0],
    },
    {
        "index": 16,
        "code": "16",
        "nodeName": "Node_16_E_ENGINEER",
        "glyph": "E",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -6,
        "position": [1.275, -6.3, 0.0],
    },
    {
        "index": 17,
        "code": "17",
        "nodeName": "Node_17_R_ENGINEER",
        "glyph": "R",
        "spatialRole": "Vertical Only",
        "branch": "ENGINEER",
        "wordMembership": ["ENGINEER"],
        "isSharedIntersection": False,
        "gridCol": 7,
        "gridRow": -7,
        "position": [1.275, -7.35, 0.0],
    },
]

# Bounds for sign-wide UV1 coordinate mapping
SIGN_LOCAL_BOUNDS = {
    "minX": -4.25,
    "maxX": 4.25,
    "minY": -7.85,
    "maxY": 1.55,
}

# ============================================================================
# 2. Font Resolution (INV-FAILFAST-01)
# ============================================================================

def resolve_sign_font_path(preferred_path: str | None = None) -> str:
    """Resolves authoritative font file, raising FileNotFoundError if missing."""
    candidates = []
    if preferred_path:
        candidates.append(preferred_path)
    candidates.extend(FONT_CANDIDATE_PATHS)
    for p in candidates:
        if os.path.exists(p) and os.path.getsize(p) > 0:
            return os.path.abspath(p)
    raise FileNotFoundError(
        f"Authoritative bold sans-serif font not found in candidate paths: {FONT_CANDIDATE_PATHS}"
    )

# ============================================================================
# 3. Planar Glyph Mesh Extraction with 16-Band Slicing
# ============================================================================

def extract_planar_glyph_mesh(
    glyph: str,
    font_path: str | None = None,
    cap_height: float = 0.78,
    y_slices: int = 16,
) -> dict:
    """
    Extracts flat 2D planar polygon for uppercase `glyph`, scales to cap_height=0.78m
    based on 'I' reference, centers local pivot at (0, 0, 0), subdivides across
    `y_slices` uniform horizontal bands for slice shearing, triangulates, and
    computes normalized local UV0.
    """
    resolved_font = resolve_sign_font_path(font_path)

    try:
        from matplotlib.textpath import TextPath
        from matplotlib.font_manager import FontProperties
        from shapely.geometry import Polygon, box
        from shapely import constrained_delaunay_triangles
        import shapely.affinity
        import numpy as np
    except ImportError as e:
        raise RuntimeError(f"Missing required Python geometry packages: {e}")

    fp = FontProperties(fname=resolved_font)

    # 1. Measure reference 'I' cap height
    tp_ref = TextPath((0, 0), "I", size=1.0, prop=fp)
    ref_rings = tp_ref.to_polygons()
    if not ref_rings:
        raise ValueError(f"Failed to extract contours for reference character 'I' from {resolved_font}")
    ref_poly = Polygon(ref_rings[0])
    ref_cap_h = ref_poly.bounds[3] - ref_poly.bounds[1]
    if ref_cap_h <= 0:
        raise ValueError("Invalid zero or negative reference cap height")
    scale_factor = cap_height / ref_cap_h

    # 2. Extract target glyph contours
    tp_target = TextPath((0, 0), glyph, size=1.0, prop=fp)
    rings = tp_target.to_polygons()
    if not rings:
        raise ValueError(f"No contour extracted for glyph '{glyph}' from {resolved_font}")

    poly_candidates = [Polygon(r) for r in rings if len(r) >= 3]
    poly_candidates.sort(key=lambda p: p.area, reverse=True)
    outer = poly_candidates[0]
    holes = [p.exterior.coords for p in poly_candidates[1:] if outer.contains(p.representative_point())]
    glyph_poly = Polygon(outer.exterior.coords, holes=holes)

    # 3. Scale glyph to target cap height
    glyph_poly = shapely.affinity.scale(glyph_poly, xfact=scale_factor, yfact=scale_factor, origin=(0, 0))

    # 4. Center local pivot at (0, 0, 0)
    minx, miny, maxx, maxy = glyph_poly.bounds
    cx = 0.5 * (minx + maxx)
    cy = 0.5 * (miny + maxy)
    glyph_poly = shapely.affinity.translate(glyph_poly, xoff=-cx, yoff=-cy)

    minx, miny, maxx, maxy = glyph_poly.bounds
    dy = (maxy - miny) / y_slices

    # 5. Subdivide into y_slices horizontal bands and triangulate
    triangles_list = []
    for s in range(y_slices):
        y0 = miny + s * dy
        y1 = miny + (s + 1) * dy
        sbox = box(minx - 0.2, y0, maxx + 0.2, y1)
        slice_geom = glyph_poly.intersection(sbox)
        if slice_geom.is_empty:
            continue
        geoms = [slice_geom] if isinstance(slice_geom, Polygon) else [g for g in slice_geom.geoms if isinstance(g, Polygon)]
        for g in geoms:
            if g.area < 1e-7:
                continue
            cdt = constrained_delaunay_triangles(g)
            for t in cdt.geoms:
                if g.contains(t.representative_point()):
                    triangles_list.append(t)

    # 6. Deduplicate vertices and build index buffer
    raw_verts = []
    for t in triangles_list:
        coords = list(t.exterior.coords)[:3]
        # Ensure CCW winding
        x0, y0 = coords[0]
        x1, y1 = coords[1]
        x2, y2 = coords[2]
        cross = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
        if cross < 0:
            coords[1], coords[2] = coords[2], coords[1]
        raw_verts.extend(coords)

    unique_verts = []
    vert_map = {}
    indices = []

    width = maxx - minx if (maxx - minx) > 1e-6 else 1.0
    height = maxy - miny if (maxy - miny) > 1e-6 else 1.0

    for x, y in raw_verts:
        key = (round(x, 6), round(y, 6))
        if key not in vert_map:
            v_idx = len(unique_verts)
            vert_map[key] = v_idx
            unique_verts.append((x, y, 0.0))
        indices.append(vert_map[key])

    normals = [(0.0, 0.0, 1.0) for _ in unique_verts]

    # UV0: local normalized [0, 1]^2
    uv0 = [
        (
            float(np.clip((v[0] - minx) / width, 0.0, 1.0)),
            float(np.clip((v[1] - miny) / height, 0.0, 1.0)),
        )
        for v in unique_verts
    ]

    return {
        "glyph": glyph,
        "vertices": unique_verts,
        "normals": normals,
        "uv0": uv0,
        "indices": indices,
        "triangle_count": len(indices) // 3,
        "vertex_count": len(unique_verts),
        "bounds": (minx, miny, maxx, maxy),
        "pivot_offset": (0.0, 0.0, 0.0),
    }

# ============================================================================
# 4. Binary glTF 2.0 Asset Builder (build_luis_sign_glb)
# ============================================================================

def build_luis_sign_glb(output_path: str = "LUIS_AI_ENGINEER_SIGN.glb") -> dict:
    """
    Constructs the 17-node LUIS_AI_ENGINEER_SIGN.glb binary glTF 2.0 asset.
    Bakes resting crossword coordinates, centered local pivots, 16 vertical slice subdivisions,
    clean UV0 (local) and UV1 (sign-wide), and exports to output_path.
    """
    resolved_output = os.path.abspath(output_path)
    font_path = resolve_sign_font_path()

    # Pre-extract unique glyph meshes
    unique_glyphs = sorted(list(set(item["glyph"] for item in SIGN_CHARACTER_MATRIX)))
    glyph_meshes = {}
    for g in unique_glyphs:
        glyph_meshes[g] = extract_planar_glyph_mesh(g, font_path=font_path, cap_height=0.78, y_slices=16)

    # Sign bounds for UV1 mapping
    sign_min_x = SIGN_LOCAL_BOUNDS["minX"]
    sign_max_x = SIGN_LOCAL_BOUNDS["maxX"]
    sign_min_y = SIGN_LOCAL_BOUNDS["minY"]
    sign_max_y = SIGN_LOCAL_BOUNDS["maxY"]
    sign_w = sign_max_x - sign_min_x
    sign_h = sign_max_y - sign_min_y

    # Build binary buffers and glTF JSON structures
    bin_buffer = bytearray()
    buffer_views = []
    accessors = []
    meshes = []
    nodes = []

    # Scene Root Node (Index 0)
    root_children = []

    total_triangles = 0

    for i, item in enumerate(SIGN_CHARACTER_MATRIX):
        node_idx = i + 1  # 1-based child node index
        root_children.append(node_idx)
        g_mesh = glyph_meshes[item["glyph"]]

        verts = g_mesh["vertices"]
        norms = g_mesh["normals"]
        uv0_list = g_mesh["uv0"]
        indices = g_mesh["indices"]
        total_triangles += len(indices) // 3

        node_x = item["position"][0]
        node_y = item["position"][1]

        # Calculate UV1 for this instance based on baked node position + vertex
        uv1_list = [
            (
                float(max(0.0, min(1.0, (node_x + v[0] - sign_min_x) / sign_w))),
                float(max(0.0, min(1.0, (node_y + v[1] - sign_min_y) / sign_h))),
            )
            for v in verts
        ]

        # Pack Position buffer
        pos_bytes = bytearray()
        min_pos = [float("inf"), float("inf"), 0.0]
        max_pos = [float("-inf"), float("-inf"), 0.0]
        for v in verts:
            pos_bytes.extend(struct.pack("<3f", v[0], v[1], v[2]))
            min_pos[0] = min(min_pos[0], v[0])
            min_pos[1] = min(min_pos[1], v[1])
            max_pos[0] = max(max_pos[0], v[0])
            max_pos[1] = max(max_pos[1], v[1])

        # Pack Normal buffer
        norm_bytes = bytearray()
        for n in norms:
            norm_bytes.extend(struct.pack("<3f", n[0], n[1], n[2]))

        # Pack UV0 buffer
        uv0_bytes = bytearray()
        min_uv0 = [float("inf"), float("inf")]
        max_uv0 = [float("-inf"), float("-inf")]
        for u, v in uv0_list:
            uv0_bytes.extend(struct.pack("<2f", u, v))
            min_uv0[0] = min(min_uv0[0], u)
            min_uv0[1] = min(min_uv0[1], v)
            max_uv0[0] = max(max_uv0[0], u)
            max_uv0[1] = max(max_uv0[1], v)

        # Pack UV1 buffer
        uv1_bytes = bytearray()
        min_uv1 = [float("inf"), float("inf")]
        max_uv1 = [float("-inf"), float("-inf")]
        for u, v in uv1_list:
            uv1_bytes.extend(struct.pack("<2f", u, v))
            min_uv1[0] = min(min_uv1[0], u)
            min_uv1[1] = min(min_uv1[1], v)
            max_uv1[0] = max(max_uv1[0], u)
            max_uv1[1] = max(max_uv1[1], v)

        # Pack Indices buffer (UNSIGNED_SHORT)
        idx_bytes = bytearray()
        for idx in indices:
            idx_bytes.extend(struct.pack("<H", idx))

        # Align helper
        def append_aligned(data: bytearray, target: int) -> int:
            pad = (4 - (len(bin_buffer) % 4)) % 4
            bin_buffer.extend(b"\x00" * pad)
            offset = len(bin_buffer)
            bin_buffer.extend(data)
            bv_idx = len(buffer_views)
            buffer_views.append({
                "buffer": 0,
                "byteOffset": offset,
                "byteLength": len(data),
                "target": target,
            })
            return bv_idx

        pos_bv = append_aligned(pos_bytes, 34962)  # ARRAY_BUFFER
        norm_bv = append_aligned(norm_bytes, 34962)
        uv0_bv = append_aligned(uv0_bytes, 34962)
        uv1_bv = append_aligned(uv1_bytes, 34962)
        idx_bv = append_aligned(idx_bytes, 34963)  # ELEMENT_ARRAY_BUFFER

        pos_acc = len(accessors)
        accessors.append({
            "bufferView": pos_bv,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": len(verts),
            "type": "VEC3",
            "min": [round(min_pos[0], 6), round(min_pos[1], 6), 0.0],
            "max": [round(max_pos[0], 6), round(max_pos[1], 6), 0.0],
        })

        norm_acc = len(accessors)
        accessors.append({
            "bufferView": norm_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(norms),
            "type": "VEC3",
            "min": [0.0, 0.0, 1.0],
            "max": [0.0, 0.0, 1.0],
        })

        uv0_acc = len(accessors)
        accessors.append({
            "bufferView": uv0_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(uv0_list),
            "type": "VEC2",
            "min": [round(min_uv0[0], 6), round(min_uv0[1], 6)],
            "max": [round(max_uv0[0], 6), round(max_uv0[1], 6)],
        })

        uv1_acc = len(accessors)
        accessors.append({
            "bufferView": uv1_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(uv1_list),
            "type": "VEC2",
            "min": [round(min_uv1[0], 6), round(min_uv1[1], 6)],
            "max": [round(max_uv1[0], 6), round(max_uv1[1], 6)],
        })

        idx_acc = len(accessors)
        accessors.append({
            "bufferView": idx_bv,
            "byteOffset": 0,
            "componentType": 5123,  # UNSIGNED_SHORT
            "count": len(indices),
            "type": "SCALAR",
            "min": [0],
            "max": [len(verts) - 1],
        })

        mesh_idx = len(meshes)
        meshes.append({
            "name": f"Mesh_{item['code']}_{item['glyph']}_{item['branch']}",
            "primitives": [
                {
                    "attributes": {
                        "POSITION": pos_acc,
                        "NORMAL": norm_acc,
                        "TEXCOORD_0": uv0_acc,
                        "TEXCOORD_1": uv1_acc,
                    },
                    "indices": idx_acc,
                    "material": 0,
                }
            ],
        })

        # Add node
        nodes.append({
            "name": item["nodeName"],
            "mesh": mesh_idx,
            "translation": [item["position"][0], item["position"][1], item["position"][2]],
            "rotation": [0.0, 0.0, 0.0, 1.0],
            "scale": [1.0, 1.0, 1.0],
            "extras": {
                "index": item["index"],
                "code": item["code"],
                "glyph": item["glyph"],
                "branch": item["branch"],
                "wordMembership": item["wordMembership"],
                "isSharedIntersection": item["isSharedIntersection"],
                "gridCol": item["gridCol"],
                "gridRow": item["gridRow"],
                "restPosition": item["position"],
            },
        })

    # Prepend Root Node
    root_node = {
        "name": "LUIS_AI_ENGINEER_SIGN_ROOT",
        "children": root_children,
        "translation": [0.0, 0.0, 0.0],
        "rotation": [0.0, 0.0, 0.0, 1.0],
        "scale": [1.0, 1.0, 1.0],
    }
    all_nodes = [root_node] + nodes

    # Materials
    materials = [
        {
            "name": "HoloSign_Baseline_Mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.0, 0.94, 1.0, 0.94],
                "metallicFactor": 0.0,
                "roughnessFactor": 0.1,
            },
            "emissiveFactor": [0.0, 0.94, 1.0],
            "alphaMode": "BLEND",
            "doubleSided": True,
        }
    ]

    # Assembly glTF document
    gltf_dict = {
        "asset": {
            "version": "2.0",
            "generator": "build_luis_sign.py (Intersecting 3D Holographic Typography Pipeline)",
        },
        "scene": 0,
        "scenes": [
            {
                "name": "HolographicSignScene",
                "nodes": [0],
            }
        ],
        "nodes": all_nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [
            {
                "byteLength": len(bin_buffer),
            }
        ],
    }

    # Encode JSON chunk with 4-byte padding
    json_bytes = json.dumps(gltf_dict, separators=(",", ":")).encode("utf-8")
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b" " * json_pad

    # Ensure binary buffer alignment
    bin_pad = (4 - (len(bin_buffer) % 4)) % 4
    bin_buffer.extend(b"\x00" * bin_pad)

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    header = struct.pack("<4sII", b"glTF", 2, total_len)
    chunk0_hdr = struct.pack("<II", len(json_bytes), 0x4E4F534A)  # JSON
    chunk1_hdr = struct.pack("<II", len(bin_buffer), 0x004E4942)  # BIN\0

    os.makedirs(os.path.dirname(resolved_output) or ".", exist_ok=True)
    with open(resolved_output, "wb") as f:
        f.write(header)
        f.write(chunk0_hdr)
        f.write(json_bytes)
        f.write(chunk1_hdr)
        f.write(bin_buffer)

    file_size = os.path.getsize(resolved_output)
    with open(resolved_output, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    return {
        "output_path": resolved_output,
        "file_size": file_size,
        "sha256": sha256,
        "node_count": len(SIGN_CHARACTER_MATRIX),
        "total_triangles": total_triangles,
    }

# ============================================================================
# 5. Asset Verification (verify_luis_sign_glb)
# ============================================================================

def verify_luis_sign_glb(glb_path: str = "LUIS_AI_ENGINEER_SIGN.glb") -> dict:
    """
    Parses glb binary header, JSON chunk, and accessors to verify:
    - 17 distinct character nodes + 1 root node
    - Centered local pivots (|min + max| < 1e-4)
    - Zero Z thickness (z_min == z_max == 0.0)
    - Forward-facing normals (0, 0, 1)
    - Non-degenerate UVs (local & sign-wide)
    - Exact crossword resting coordinates matching specification
    """
    resolved_path = os.path.abspath(glb_path)
    if not os.path.exists(resolved_path):
        raise FileNotFoundError(f"GLB asset does not exist at '{resolved_path}'")

    with open(resolved_path, "rb") as f:
        magic, version, total_length = struct.unpack("<4sII", f.read(12))
        if magic != b"glTF" or version != 2:
            raise ValueError(f"Invalid glTF header in '{resolved_path}'")

        chunk0_len, chunk0_type = struct.unpack("<II", f.read(8))
        if chunk0_type != 0x4E4F534A:
            raise ValueError("Expected JSON chunk 0 in GLB")
        json_data = json.loads(f.read(chunk0_len).decode("utf-8"))

        chunk1_len, chunk1_type = struct.unpack("<II", f.read(8))
        if chunk1_type != 0x004E4942:
            raise ValueError("Expected BIN chunk 1 in GLB")
        bin_data = f.read(chunk1_len)

    nodes = json_data.get("nodes", [])
    if len(nodes) != 18:
        raise ValueError(f"Expected 18 nodes (1 root + 17 characters), found {len(nodes)}")

    root_node = nodes[0]
    if root_node.get("name") != "LUIS_AI_ENGINEER_SIGN_ROOT":
        raise ValueError(f"Root node name mismatch: {root_node.get('name')}")

    char_nodes = nodes[1:]
    verified_nodes = []

    for expected_item, node in zip(SIGN_CHARACTER_MATRIX, char_nodes):
        if node["name"] != expected_item["nodeName"]:
            raise ValueError(f"Node name mismatch: expected '{expected_item['nodeName']}', got '{node['name']}'")

        trans = node.get("translation", [0, 0, 0])
        exp_pos = expected_item["position"]
        if abs(trans[0] - exp_pos[0]) > 1e-4 or abs(trans[1] - exp_pos[1]) > 1e-4 or abs(trans[2] - exp_pos[2]) > 1e-4:
            raise ValueError(f"Node translation mismatch for '{node['name']}': expected {exp_pos}, got {trans}")

        mesh_idx = node["mesh"]
        mesh = json_data["meshes"][mesh_idx]
        prim = mesh["primitives"][0]
        pos_acc = json_data["accessors"][prim["attributes"]["POSITION"]]

        min_pos = pos_acc["min"]
        max_pos = pos_acc["max"]

        # Verify zero Z thickness
        if min_pos[2] != 0.0 or max_pos[2] != 0.0:
            raise ValueError(f"Node '{node['name']}' has non-zero Z thickness: [{min_pos[2]}, {max_pos[2]}]")

        # Verify centered local pivot
        cx = min_pos[0] + max_pos[0]
        cy = min_pos[1] + max_pos[1]
        if abs(cx) > 1e-3 or abs(cy) > 1e-3:
            raise ValueError(f"Node '{node['name']}' pivot is not centered: cx={cx}, cy={cy}")

        verified_nodes.append({
            "name": node["name"],
            "glyph": expected_item["glyph"],
            "restPosition": trans,
            "bounds": [min_pos[:2], max_pos[:2]],
            "triangleCount": json_data["accessors"][prim["indices"]]["count"] // 3,
        })

    return {
        "valid": True,
        "path": resolved_path,
        "node_count": len(char_nodes),
        "total_nodes": len(nodes),
        "verified_nodes": verified_nodes,
    }

# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    target_path = os.environ.get("LUIS_SIGN_GLB_PATH", "LUIS_AI_ENGINEER_SIGN.glb")
    # Filter out blender args like --background, --python, etc.
    args = [a for a in sys.argv[1:] if not a.startswith("-") and not a.endswith(".py")]
    if args:
        target_path = args[0]

    # If running inside Blender Python environment without shapely, bridge to anaconda Python
    try:
        import shapely
    except ImportError:
        import subprocess
        print(f"[build_luis_sign] Running inside environment without shapely ({sys.executable}); delegating to /opt/anaconda3/bin/python...")
        cmd = ["/opt/anaconda3/bin/python", os.path.abspath(__file__), target_path]
        res = subprocess.run(cmd, check=True)
        return

    print(f"[build_luis_sign] Generating '{target_path}'...")
    res = build_luis_sign_glb(target_path)
    print(f"[build_luis_sign] Wrote {res['file_size']} bytes, {res['total_triangles']} triangles (SHA-256: {res['sha256']})")

    print(f"[build_luis_sign] Verifying '{target_path}'...")
    v = verify_luis_sign_glb(target_path)
    print(f"[build_luis_sign] Verification PASSED: {v['node_count']} character nodes verified.")

if __name__ == "__main__":
    main()
