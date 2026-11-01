#!/usr/bin/env python3
"""
.glb-File-Agnostic Auto-Rigger, Target-Count Adaptive Mesh Decimator, Universal M-Material
Texture Atlas Compiler, and 36-Fighter Tekken Moveset Registry Builder for Tekken: Dark
Resurrection (/tkdr/) — Functional Specifications 058 & 059.

Accepts ANY humanoid glTF 2.0 binary (.glb) asset:
  - Flattens 1..K meshes and 1..P primitives in world space while stripping pre-existing skins.
  - Dynamically computes decimation ratio (or subdivision for tiny meshes) to deterministically
    output 1,800..3,600 vertices and 2,400..5,000 triangles while preserving UV/material boundaries.
  - Packs M >= 0 material textures (or synthesizes baseColorFactor / vertex colors + UVs when M=0)
    into a unified 512x512 RGBA8888 texture atlas (`atlas.png`).
  - Auto-grounds arbitrary Y origins (y - y_min) into canonical height y_norm in [0.0, 1.0],
    auto-detects T-pose vs 45-deg A-pose arm span, and computes L1-normalized 4-bone weights
    (`uint8[4]` indices + `float32[4]` weights summing to 1.0) across the 14 Tekken body segments.
  - Binds each compiled .glb bundle to any user-selected fighter from the authoritative 36-fighter
    Tekken: Dark Resurrection (ULUS-10139) roster (`0..35`, `PAU`..`JPC`) and updates
    `/tkdr/custom_fighters/registry.json` (plus `/tkdr/luis_fighter/` default mirror).
"""

import argparse
import hashlib
import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import time

GREEK_PY = "/opt/anaconda3/envs/greek_env/bin/python"
try:
    import cv2
    import numpy as np
except ImportError:
    if os.path.isfile(GREEK_PY) and os.path.abspath(sys.executable) != os.path.abspath(GREEK_PY):
        os.execv(GREEK_PY, [GREEK_PY] + sys.argv)
    raise

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLENDER_BIN = "/Applications/Blender.app/Contents/MacOS/Blender"

DEFAULT_DOOM_RIG_LUIS_GLB = "/Users/diesel/Desktop/Doom_Rig/LUIS_DECIMATED_STANDALONE.glb"
STAGED_LUIS_GLB = os.path.join(REPO_ROOT, "LUIS.glb")
DEFAULT_NICO_ASSEMBLED_GLB = os.path.join(
    REPO_ROOT, "players_nicotest_nt01_runs_run_01_03_meshes_assembled_character_full.glb"
)
DEFAULT_NICOTEST_GLB = (
    DEFAULT_NICO_ASSEMBLED_GLB
    if os.path.isfile(DEFAULT_NICO_ASSEMBLED_GLB)
    else os.path.join(REPO_ROOT, "nicotest.glb")
)

CUSTOM_FIGHTERS_DIR = os.path.join(REPO_ROOT, "tkdr", "custom_fighters")
REGISTRY_JSON_PATH = os.path.join(CUSTOM_FIGHTERS_DIR, "registry.json")
LUIS_FIGHTER_MIRROR_DIR = os.path.join(REPO_ROOT, "tkdr", "luis_fighter")

ATLAS_SIZE = 512
MIN_VERTS = 1800
MAX_VERTS = 3600
MIN_TRIS = 2400
MAX_TRIS = 5000

# Authoritative 36-Fighter Tekken: Dark Resurrection (ULUS-10139) Roster Table
# Extracted from eboot.bin .rodata offsets 0x2cc9c8 (face_pau..face_edd) and 0x2f6f2c (PAUL..JINPACHI)
TEKKEN_ROSTER = [
    {"id": 0,  "code": "PAU", "shortName": "PAUL",       "fullName": "Paul Phoenix",      "style": "Judo / Bajiquan",                    "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.02, "limbWidthScale": 1.02},
    {"id": 1,  "code": "LAW", "shortName": "LAW",        "fullName": "Marshall Law",      "style": "Jeet Kune Do",                       "archetype": "standard_lean",     "heightScale": 0.98, "shoulderScale": 0.96, "limbWidthScale": 0.96},
    {"id": 2,  "code": "LEI", "shortName": "LEI",        "fullName": "Lei Wulong",        "style": "Five-Animal Kung Fu",                "archetype": "standard_lean",     "heightScale": 0.98, "shoulderScale": 0.96, "limbWidthScale": 0.96},
    {"id": 3,  "code": "KIN", "shortName": "KING",       "fullName": "King",              "style": "Lucha Libre / Pro Wrestling",        "archetype": "heavy_grappler",    "heightScale": 1.06, "shoulderScale": 1.14, "limbWidthScale": 1.12},
    {"id": 4,  "code": "YOS", "shortName": "YOSHIMITSU", "fullName": "Yoshimitsu",        "style": "Manji Ninjutsu",                     "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.00, "limbWidthScale": 1.00},
    {"id": 5,  "code": "NIN", "shortName": "NINA",       "fullName": "Nina Williams",     "style": "Assassination Arts / Aikido",        "archetype": "slender_female",    "heightScale": 0.93, "shoulderScale": 0.86, "limbWidthScale": 0.88},
    {"id": 6,  "code": "HWO", "shortName": "HWOARANG",   "fullName": "Hwoarang",          "style": "ITF Taekwondo",                      "archetype": "standard_athletic", "heightScale": 1.01, "shoulderScale": 0.98, "limbWidthScale": 0.98},
    {"id": 7,  "code": "XIA", "shortName": "XIAOYU",     "fullName": "Ling Xiaoyu",       "style": "Baguazhang / Piguaquan",             "archetype": "compact_female",    "heightScale": 0.89, "shoulderScale": 0.84, "limbWidthScale": 0.85},
    {"id": 8,  "code": "CHR", "shortName": "CHRISTIE",   "fullName": "Christie Monteiro", "style": "Capoeira",                           "archetype": "slender_female",    "heightScale": 0.94, "shoulderScale": 0.87, "limbWidthScale": 0.88},
    {"id": 9,  "code": "JIN", "shortName": "JIN",        "fullName": "Jin Kazama",        "style": "Traditional Karate",                 "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.02, "limbWidthScale": 1.00},
    {"id": 10, "code": "JUL", "shortName": "JULIA",      "fullName": "Julia Chang",       "style": "Xingyiquan / Baji",                  "archetype": "slender_female",    "heightScale": 0.93, "shoulderScale": 0.86, "limbWidthScale": 0.88},
    {"id": 11, "code": "KUM", "shortName": "KUMA",       "fullName": "Kuma",              "style": "Heihachi-Style Bear Karate",         "archetype": "super_heavy",       "heightScale": 1.18, "shoulderScale": 1.30, "limbWidthScale": 1.28},
    {"id": 12, "code": "PAN", "shortName": "PANDA",      "fullName": "Panda",             "style": "Heihachi-Style Bear Karate",         "archetype": "super_heavy",       "heightScale": 1.18, "shoulderScale": 1.30, "limbWidthScale": 1.28},
    {"id": 13, "code": "BRY", "shortName": "BRYAN",      "fullName": "Bryan Fury",        "style": "Kickboxing",                         "archetype": "standard_athletic", "heightScale": 1.03, "shoulderScale": 1.05, "limbWidthScale": 1.04},
    {"id": 14, "code": "HEI", "shortName": "HEIHACHI",   "fullName": "Heihachi Mishima",  "style": "Mishima-Style Karate",               "archetype": "heavy_athletic",    "heightScale": 1.02, "shoulderScale": 1.08, "limbWidthScale": 1.06},
    {"id": 15, "code": "KAZ", "shortName": "KAZUYA",     "fullName": "Kazuya Mishima",    "style": "Mishima-Style Karate",               "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.02, "limbWidthScale": 1.01},
    {"id": 16, "code": "LEE", "shortName": "LEE",        "fullName": "Lee Chaolan",       "style": "Martial Arts",                       "archetype": "standard_lean",     "heightScale": 0.99, "shoulderScale": 0.96, "limbWidthScale": 0.96},
    {"id": 17, "code": "STE", "shortName": "STEVE",      "fullName": "Steve Fox",         "style": "Boxing",                             "archetype": "standard_athletic", "heightScale": 0.99, "shoulderScale": 1.00, "limbWidthScale": 1.00},
    {"id": 18, "code": "MAR", "shortName": "MARDUK",     "fullName": "Craig Marduk",      "style": "Vale Tudo",                          "archetype": "heavy_grappler",    "heightScale": 1.12, "shoulderScale": 1.20, "limbWidthScale": 1.18},
    {"id": 19, "code": "MOK", "shortName": "MOKUJIN",    "fullName": "Mokujin",           "style": "Mimicry",                            "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.00, "limbWidthScale": 1.00},
    {"id": 20, "code": "EDD", "shortName": "EDDY",       "fullName": "Eddy Gordo",        "style": "Capoeira",                           "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.01, "limbWidthScale": 1.00},
    {"id": 21, "code": "JAC", "shortName": "JACK-5",     "fullName": "Jack-5",            "style": "Brute Force",                        "archetype": "super_heavy",       "heightScale": 1.16, "shoulderScale": 1.28, "limbWidthScale": 1.25},
    {"id": 22, "code": "ROG", "shortName": "ROGER Jr.",  "fullName": "Roger Jr.",         "style": "Commando Wrestling",                 "archetype": "compact_fighter",   "heightScale": 0.86, "shoulderScale": 0.90, "limbWidthScale": 0.92},
    {"id": 23, "code": "ANN", "shortName": "ANNA",       "fullName": "Anna Williams",     "style": "Assassination Arts",                 "archetype": "slender_female",    "heightScale": 0.93, "shoulderScale": 0.86, "limbWidthScale": 0.88},
    {"id": 24, "code": "WAN", "shortName": "WANG",       "fullName": "Wang Jinrei",       "style": "Xingyiquan",                         "archetype": "compact_fighter",   "heightScale": 0.92, "shoulderScale": 0.92, "limbWidthScale": 0.92},
    {"id": 25, "code": "GAN", "shortName": "GANRYU",     "fullName": "Ganryu",            "style": "Sumo",                               "archetype": "heavy_grappler",    "heightScale": 1.05, "shoulderScale": 1.22, "limbWidthScale": 1.20},
    {"id": 26, "code": "ASK", "shortName": "ASUKA",      "fullName": "Asuka Kazama",      "style": "Kazama-Style Traditional Martial Arts", "archetype": "slender_female", "heightScale": 0.93, "shoulderScale": 0.87, "limbWidthScale": 0.88},
    {"id": 27, "code": "BRU", "shortName": "BRUCE",      "fullName": "Bruce Irvin",       "style": "Muay Thai",                          "archetype": "standard_athletic", "heightScale": 1.04, "shoulderScale": 1.05, "limbWidthScale": 1.04},
    {"id": 28, "code": "BAE", "shortName": "BAEK",       "fullName": "Baek Doo San",      "style": "Taekwondo",                          "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 0.98, "limbWidthScale": 0.98},
    {"id": 29, "code": "DVJ", "shortName": "DEVIL JIN",  "fullName": "Devil Jin",         "style": "Advanced Mishima Karate",            "archetype": "standard_athletic", "heightScale": 1.00, "shoulderScale": 1.03, "limbWidthScale": 1.01},
    {"id": 30, "code": "RAV", "shortName": "RAVEN",      "fullName": "Raven",             "style": "Ninjutsu",                           "archetype": "standard_athletic", "heightScale": 1.02, "shoulderScale": 1.03, "limbWidthScale": 1.02},
    {"id": 31, "code": "FEN", "shortName": "FENG",       "fullName": "Feng Wei",          "style": "God Fist Chinese Kenpo",             "archetype": "standard_athletic", "heightScale": 1.02, "shoulderScale": 1.06, "limbWidthScale": 1.05},
    {"id": 32, "code": "AMK", "shortName": "ARMOR KING", "fullName": "Armor King",        "style": "Dark Lucha / Pro Wrestling",         "archetype": "heavy_grappler",    "heightScale": 1.06, "shoulderScale": 1.15, "limbWidthScale": 1.12},
    {"id": 33, "code": "LIL", "shortName": "LILI",       "fullName": "Lili",              "style": "Street Fighting / Gymnastics",       "archetype": "slender_female",    "heightScale": 0.96, "shoulderScale": 0.87, "limbWidthScale": 0.88},
    {"id": 34, "code": "DRA", "shortName": "DRAGUNOV",   "fullName": "Sergei Dragunov",   "style": "Commando Sambo",                     "archetype": "standard_athletic", "heightScale": 1.03, "shoulderScale": 1.03, "limbWidthScale": 1.02},
    {"id": 35, "code": "JPC", "shortName": "JINPACHI",   "fullName": "Jinpachi Mishima",  "style": "Mishima Karate",                     "archetype": "heavy_grappler",    "heightScale": 1.10, "shoulderScale": 1.18, "limbWidthScale": 1.16},
]

# 14 Canonical Tekken Anatomical Segments (Bone IDs 0..13)
CANONICAL_14_BONES = [
    {"id": 0,  "name": "Pelvis",       "pivot": (0.000, 0.500, 0.000)},
    {"id": 1,  "name": "Chest_Spine",  "pivot": (0.000, 0.640, 0.000)},
    {"id": 2,  "name": "Neck",         "pivot": (0.000, 0.795, 0.000)},
    {"id": 3,  "name": "Head",         "pivot": (0.000, 0.885, 0.010)},
    {"id": 4,  "name": "L_UpperArm",   "pivot": (0.105, 0.760, 0.000)},
    {"id": 5,  "name": "L_Forearm",    "pivot": (0.230, 0.760, 0.000)},
    {"id": 6,  "name": "L_Hand",       "pivot": (0.355, 0.760, 0.000)},
    {"id": 7,  "name": "R_UpperArm",   "pivot": (-0.105, 0.760, 0.000)},
    {"id": 8,  "name": "R_Forearm",    "pivot": (-0.230, 0.760, 0.000)},
    {"id": 9,  "name": "R_Hand",       "pivot": (-0.355, 0.760, 0.000)},
    {"id": 10, "name": "L_Thigh",      "pivot": (0.055, 0.470, 0.000)},
    {"id": 11, "name": "L_Calf_Foot",  "pivot": (0.055, 0.250, 0.000)},
    {"id": 12, "name": "R_Thigh",      "pivot": (-0.055, 0.470, 0.000)},
    {"id": 13, "name": "R_Calf_Foot",  "pivot": (-0.055, 0.250, 0.000)},
]


def resolve_tekken_fighter(query):
    """Resolve any fighter ID (0..35), 3-letter code (PAU..JPC), or name to its roster entry."""
    if query is None:
        return TEKKEN_ROSTER[9]  # Default: Jin Kazama (ID 9)
    if isinstance(query, int) or (isinstance(query, str) and query.strip().isdigit()):
        idx = int(query)
        if 0 <= idx < len(TEKKEN_ROSTER):
            return TEKKEN_ROSTER[idx]
        raise ValueError(f"Tekken fighter ID {idx} out of range 0..{len(TEKKEN_ROSTER) - 1}")
    q = str(query).strip().upper()
    for f in TEKKEN_ROSTER:
        if q in (f["code"].upper(), f["shortName"].upper(), f["fullName"].upper()):
            return f
    for f in TEKKEN_ROSTER:
        if q in f["fullName"].upper() or q in f["shortName"].upper():
            return f
    raise ValueError(f"Unknown Tekken fighter {query!r}; valid codes: {[f['code'] for f in TEKKEN_ROSTER]}")


def ensure_luis_glb_staged():
    """Idempotently stage `/Users/diesel/desktop/skatealley/LUIS.glb` from Doom_Rig if missing."""
    if os.path.isfile(STAGED_LUIS_GLB) and os.path.getsize(STAGED_LUIS_GLB) > 0:
        return STAGED_LUIS_GLB
    candidates = [
        DEFAULT_DOOM_RIG_LUIS_GLB,
        os.path.join(REPO_ROOT, "LUIS_TPOSE_STANDALONE_BACKUP.glb"),
        os.path.join(REPO_ROOT, "LUIS_DECIMATED_STANDALONE.glb"),
    ]
    for src in candidates:
        if os.path.isfile(src):
            shutil.copy2(src, STAGED_LUIS_GLB)
            return STAGED_LUIS_GLB
    raise FileNotFoundError(f"Could not locate source LUIS.glb in {candidates}")


def parse_glb_chunks(glb_path):
    """Read and validate glTF 2.0 binary header, returning (raw_bytes, sha256_hex, gltf_dict, bin_buf)."""
    if not os.path.isfile(glb_path):
        raise FileNotFoundError(f"Missing .glb file: {glb_path}")
    with open(glb_path, "rb") as f:
        raw = f.read()
    if len(raw) < 28:
        raise ValueError(f"File too small to be a valid .glb: {glb_path} ({len(raw)} B)")
    magic, version, total_len = struct.unpack_from("<III", raw, 0)
    if magic != 0x46546C67 or version != 2:
        raise ValueError(f"Invalid glTF 2.0 header magic=0x{magic:08X} version={version} in {glb_path}")
    j_len, j_type = struct.unpack_from("<II", raw, 12)
    if j_type != 0x4E4F534A:
        raise ValueError(f"Expected JSON chunk 0x4E4F534A in {glb_path}, got 0x{j_type:08X}")
    gltf = json.loads(raw[20 : 20 + j_len].decode("utf-8"))
    b_off = 20 + j_len
    bin_buf = b""
    if b_off + 8 <= len(raw):
        b_len, _ = struct.unpack_from("<II", raw, b_off)
        bin_buf = raw[b_off + 8 : b_off + 8 + b_len]
    sha256_hex = hashlib.sha256(raw).hexdigest()
    return raw, sha256_hex, gltf, bin_buf


def decode_gltf_image_rgba(gltf, bin_buf, img_idx):
    """Decode embedded glTF image[img_idx] into an RGBA8888 uint8 numpy array."""
    images = gltf.get("images", [])
    if img_idx < 0 or img_idx >= len(images):
        return None
    img_meta = images[img_idx]
    bv_idx = img_meta.get("bufferView")
    if bv_idx is None:
        return None
    bv = gltf["bufferViews"][bv_idx]
    off = bv.get("byteOffset", 0)
    length = bv.get("byteLength", 0)
    raw_img = bin_buf[off : off + length]
    arr = cv2.imdecode(np.frombuffer(raw_img, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if arr is None:
        return None
    if arr.ndim == 2:
        rgba = cv2.cvtColor(arr, cv2.COLOR_GRAY2RGBA)
    elif arr.shape[2] == 3:
        rgba = cv2.cvtColor(arr, cv2.COLOR_BGR2RGBA)
    else:
        rgba = cv2.cvtColor(arr, cv2.COLOR_BGRA2RGBA)
    return rgba


def build_universal_atlas_and_uv_rects(gltf, bin_buf):
    """
    Universal M-material / 0-texture 512x512 RGBA8888 atlas builder.
    Returns:
      - atlas_rgba: (512, 512, 4) uint8 array
      - uv_rects: list of (u0, u1, v0, v1) for each global material slot
      - material_count: number of material tiles packed
    """
    materials = gltf.get("materials", [])
    textures = gltf.get("textures", [])
    images = gltf.get("images", [])

    tiles = []
    if len(materials) > 0:
        for m_idx, mat in enumerate(materials):
            pbr = mat.get("pbrMetallicRoughness", {})
            bcf = pbr.get("baseColorFactor", [1.0, 1.0, 1.0, 1.0])
            tex_info = pbr.get("baseColorTexture")
            img_rgba = None
            if tex_info is not None:
                t_idx = tex_info.get("index", 0)
                if 0 <= t_idx < len(textures):
                    src_idx = textures[t_idx].get("source", t_idx)
                    img_rgba = decode_gltf_image_rgba(gltf, bin_buf, src_idx)
            if img_rgba is None and m_idx < len(images):
                img_rgba = decode_gltf_image_rgba(gltf, bin_buf, m_idx)
            if img_rgba is None:
                # Synthesize solid/shaded albedo tile from baseColorFactor
                tile = np.zeros((256, 256, 4), dtype=np.uint8)
                tile[:, :, 0] = int(np.clip(bcf[0] * 255.0, 0, 255))
                tile[:, :, 1] = int(np.clip(bcf[1] * 255.0, 0, 255))
                tile[:, :, 2] = int(np.clip(bcf[2] * 255.0, 0, 255))
                tile[:, :, 3] = 255
                img_rgba = tile
            else:
                # Modulate by baseColorFactor RGB if non-white
                if any(abs(bcf[k] - 1.0) > 1e-3 for k in range(3)):
                    mod = np.array([bcf[0], bcf[1], bcf[2], 1.0], dtype=np.float32)
                    img_rgba = np.clip(img_rgba.astype(np.float32) * mod, 0, 255).astype(np.uint8)
                img_rgba[:, :, 3] = 255
            tiles.append(img_rgba)
    elif len(images) > 0:
        for img_idx in range(len(images)):
            img_rgba = decode_gltf_image_rgba(gltf, bin_buf, img_idx)
            if img_rgba is not None:
                img_rgba[:, :, 3] = 255
                tiles.append(img_rgba)

    if len(tiles) == 0:
        # M = 0 untextured mesh: create a clean neutral clay/skin gradient tile
        tile = np.zeros((ATLAS_SIZE, ATLAS_SIZE, 4), dtype=np.uint8)
        yy = np.linspace(0.82, 1.0, ATLAS_SIZE, dtype=np.float32)[:, None]
        tile[:, :, 0] = np.clip(215.0 * yy, 0, 255).astype(np.uint8)
        tile[:, :, 1] = np.clip(185.0 * yy, 0, 255).astype(np.uint8)
        tile[:, :, 2] = np.clip(165.0 * yy, 0, 255).astype(np.uint8)
        tile[:, :, 3] = 255
        return tile, [(0.0, 1.0, 0.0, 1.0)], 0

    m_count = len(tiles)
    atlas_rgba = np.zeros((ATLAS_SIZE, ATLAS_SIZE, 4), dtype=np.uint8)
    atlas_rgba[:, :, 3] = 255
    uv_rects = []

    if m_count == 1:
        atlas_rgba = cv2.resize(tiles[0], (ATLAS_SIZE, ATLAS_SIZE), interpolation=cv2.INTER_AREA)
        atlas_rgba[:, :, 3] = 255
        uv_rects.append((0.0, 1.0, 0.0, 1.0))
    elif m_count == 2:
        half_w = ATLAS_SIZE // 2
        atlas_rgba[:, :half_w] = cv2.resize(tiles[0], (half_w, ATLAS_SIZE), interpolation=cv2.INTER_AREA)
        atlas_rgba[:, half_w:] = cv2.resize(tiles[1], (half_w, ATLAS_SIZE), interpolation=cv2.INTER_AREA)
        atlas_rgba[:, :, 3] = 255
        uv_rects.append((0.0, 0.5, 0.0, 1.0))
        uv_rects.append((0.5, 1.0, 0.0, 1.0))
    else:
        n_cols = int(math.ceil(math.sqrt(m_count)))
        n_rows = int(math.ceil(m_count / float(n_cols)))
        cell_w = ATLAS_SIZE // n_cols
        cell_h = ATLAS_SIZE // n_rows
        for idx, tile in enumerate(tiles):
            col = idx % n_cols
            row = idx // n_cols
            x0 = col * cell_w
            x1 = ATLAS_SIZE if col == n_cols - 1 else (col + 1) * cell_w
            y0 = row * cell_h
            y1 = ATLAS_SIZE if row == n_rows - 1 else (row + 1) * cell_h
            atlas_rgba[y0:y1, x0:x1] = cv2.resize(tile, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
            uv_rects.append((x0 / float(ATLAS_SIZE), x1 / float(ATLAS_SIZE), y0 / float(ATLAS_SIZE), y1 / float(ATLAS_SIZE)))
        atlas_rgba[:, :, 3] = 255

    return atlas_rgba, uv_rects, m_count


def extract_and_decimate_mesh_blender(glb_path, target_tris=3400):
    """
    Use headless Blender to:
      1. Import any .glb scene graph (1..K meshes, 1..P primitives, with or without existing skins).
      2. Strip armature modifiers & vertex groups while applying world transforms (`matrix_world`).
      3. Merge all meshes into a single mesh while preserving material slot indices.
      4. Adaptively decimate (or subdivide if tiny) so output lands in 1,800..3,600 verts & 2,400..5,000 tris.
    """
    with tempfile.NamedTemporaryFile(suffix=".npz", delete=False) as tmp:
        out_npz = tmp.name

    blender_code = f"""
import bpy, bmesh, math
import numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath={glb_path!r})

mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
if not mesh_objs:
    raise RuntimeError("No MESH objects found in .glb")

# Build unified material list and bake world-space transforms onto each mesh copy
global_mats = []
mat_ptr_to_idx = {{}}
for o in mesh_objs:
    for m in o.data.materials:
        if m is not None and m.name not in mat_ptr_to_idx:
            mat_ptr_to_idx[m.name] = len(global_mats)
            global_mats.append(m)

bm_merged = bmesh.new()
uv_layer_merged = bm_merged.loops.layers.uv.new("UVMap")

for o in mesh_objs:
    # Strip armature modifiers so we evaluate clean rest-pose geometry
    for mod in list(o.modifiers):
        if mod.type == 'ARMATURE':
            o.modifiers.remove(mod)
    me = o.data.copy()
    me.transform(o.matrix_world)

    bm_part = bmesh.new()
    bm_part.from_mesh(me)
    uv_part = bm_part.loops.layers.uv.active

    # Map local material index to global material index
    local_to_global = {{}}
    for li_m, m in enumerate(o.data.materials):
        if m is not None and m.name in mat_ptr_to_idx:
            local_to_global[li_m] = mat_ptr_to_idx[m.name]
        else:
            local_to_global[li_m] = li_m

    v_offset_map = {{}}
    for v in bm_part.verts:
        nv = bm_merged.verts.new(v.co)
        v_offset_map[v.index] = nv
    bm_merged.verts.ensure_lookup_table()

    for f in bm_part.faces:
        try:
            nf = bm_merged.faces.new([v_offset_map[v.index] for v in f.verts])
        except ValueError:
            continue
        nf.material_index = local_to_global.get(f.material_index, f.material_index)
        if uv_part is not None:
            for l_old, l_new in zip(f.loops, nf.loops):
                l_new[uv_layer_merged].uv = l_old[uv_part].uv
        else:
            for l_new in nf.loops:
                co = l_new.vert.co
                u_s = (math.atan2(co.x, -co.y) + math.pi) / (2.0 * math.pi)
                v_s = max(0.0, min(1.0, co.z))
                l_new[uv_layer_merged].uv = (u_s, v_s)
    bm_part.free()

bmesh.ops.remove_doubles(bm_merged, verts=bm_merged.verts, dist=1e-4)
bmesh.ops.triangulate(bm_merged, faces=bm_merged.faces)

# If input mesh is very low-poly (< 2400 faces), subdivide edges to reach target density
while len(bm_merged.faces) < 2500 and len(bm_merged.faces) > 0:
    bmesh.ops.subdivide_edges(bm_merged, edges=bm_merged.edges, cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm_merged, faces=bm_merged.faces)

merged_mesh = bpy.data.meshes.new("MergedCharacter")
for m in global_mats:
    merged_mesh.materials.append(m)
bm_merged.to_mesh(merged_mesh)
bm_merged.free()

merged_obj = bpy.data.objects.new("MergedCharacterObj", merged_mesh)
bpy.context.collection.objects.link(merged_obj)
bpy.context.view_layer.objects.active = merged_obj

total_in_tris = len(merged_mesh.polygons)

def extract_em(eval_me):
    bm_tmp = bmesh.new()
    bm_tmp.from_mesh(eval_me)
    bmesh.ops.triangulate(bm_tmp, faces=bm_tmp.faces)
    bm_tmp.to_mesh(eval_me)
    bm_tmp.free()
    uv_data = eval_me.uv_layers.active.data if eval_me.uv_layers.active else None

    v_map = {{}}
    pos_list, norm_list, uv_list, mat_list, tri_list = [], [], [], [], []
    for poly in eval_me.polygons:
        m_id = max(0, int(poly.material_index))
        t_idx = []
        for li in poly.loop_indices:
            vi = eval_me.loops[li].vertex_index
            if uv_data is not None:
                uv = uv_data[li].uv
                u_g, v_g = float(uv[0]), float(1.0 - uv[1])
            else:
                u_g, v_g = 0.5, 0.5
            key = (vi, m_id, round(u_g, 3), round(v_g, 3))
            out_vi = v_map.get(key)
            if out_vi is None:
                out_vi = len(pos_list)
                v_map[key] = out_vi
                v = eval_me.vertices[vi]
                # Convert Blender (X, -Z_gltf, Y_gltf) -> glTF (X, Y_up, Z_fwd)
                pos_list.append([float(v.co.x), float(v.co.z), float(-v.co.y)])
                norm_list.append([float(v.normal.x), float(v.normal.z), float(-v.normal.y)])
                uv_list.append([u_g, v_g])
                mat_list.append(m_id)
            t_idx.append(out_vi)
        if len(t_idx) == 3 and len({{t_idx[0], t_idx[1], t_idx[2]}}) == 3:
            tri_list.append(t_idx)
    return pos_list, norm_list, uv_list, mat_list, tri_list

mod = merged_obj.modifiers.new(name='AdaptiveDec', type='DECIMATE')
mod.decimate_type = 'COLLAPSE'
mod.delimit = {{'MATERIAL', 'UV'}}

# Adaptive search for ratio that lands inside 1800..3600 vertices and 2400..5000 triangles
ratio = min(1.0, float({target_tris}) / max(1.0, float(total_in_tris)))
best_res = None
for attempt in range(8):
    if attempt >= 4:
        mod.delimit = {{'MATERIAL'}}
    mod.ratio = max(0.005, min(1.0, ratio))
    dg = bpy.context.evaluated_depsgraph_get()
    em = merged_obj.evaluated_get(dg).to_mesh()
    pos_l, norm_l, uv_l, mat_l, tri_l = extract_em(em)
    nv, nt = len(pos_l), len(tri_l)
    best_res = (pos_l, norm_l, uv_l, mat_l, tri_l)
    if {MIN_VERTS} <= nv <= {MAX_VERTS} and {MIN_TRIS} <= nt <= {MAX_TRIS}:
        break
    if nv > {MAX_VERTS} or nt > {MAX_TRIS}:
        scale_down = min({MAX_VERTS} * 0.90 / max(1, nv), {MAX_TRIS} * 0.90 / max(1, nt))
        ratio *= max(0.35, min(0.88, scale_down))
    elif nv < {MIN_VERTS} or nt < {MIN_TRIS}:
        scale_up = max({MIN_VERTS} * 1.12 / max(1, nv), {MIN_TRIS} * 1.12 / max(1, nt))
        if ratio >= 0.999:
            break
        ratio = min(1.0, ratio * max(1.12, min(2.2, scale_up)))

pos_l, norm_l, uv_l, mat_l, tri_l = best_res
np.savez(
    {out_npz!r},
    positions=np.array(pos_l, dtype=np.float32),
    normals=np.array(norm_l, dtype=np.float32),
    uvs=np.array(uv_l, dtype=np.float32),
    mat_ids=np.array(mat_l, dtype=np.uint8),
    triangles=np.array(tri_l, dtype=np.int32),
    input_tris=np.array([total_in_tris], dtype=np.int32),
)
"""
    try:
        subprocess.run(
            [BLENDER_BIN, "--background", "--python-exit-code", "1", "--python-expr", blender_code],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        data = np.load(out_npz)
        return (
            data["positions"],
            data["normals"],
            data["uvs"],
            data["mat_ids"],
            data["triangles"],
            int(data["input_tris"][0]),
        )
    finally:
        if os.path.exists(out_npz):
            os.remove(out_npz)


def enforce_vertex_and_triangle_budget(positions, normals, uvs, mat_ids, triangles):
    """
    Post-filter guarantee that `MIN_VERTS <= len(positions) <= MAX_VERTS` and
    `MIN_TRIS <= len(triangles) <= MAX_TRIS` across arbitrary .glb topologies.
    """
    positions = np.asarray(positions, dtype=np.float32)
    normals = np.asarray(normals, dtype=np.float32)
    uvs = np.asarray(uvs, dtype=np.float32)
    mat_ids = np.asarray(mat_ids, dtype=np.uint8)
    triangles = np.asarray(triangles, dtype=np.int32)

    # 1. If triangles > MAX_TRIS, subsample evenly while compacting referenced vertices
    if len(triangles) > MAX_TRIS:
        keep_idx = np.linspace(0, len(triangles) - 1, MAX_TRIS - 100, dtype=np.int32)
        triangles = triangles[keep_idx]

    # Compact unreferenced vertices
    used_v, inv_idx = np.unique(triangles.reshape(-1), return_inverse=True)
    positions = positions[used_v]
    normals = normals[used_v]
    uvs = uvs[used_v]
    mat_ids = mat_ids[used_v]
    triangles = inv_idx.reshape(-1, 3).astype(np.int32)

    # 2. If vertices > MAX_VERTS, first weld UV-seam split vertices that share the same 3D position
    #    (which removes 0 triangles!), then progressively coarsen position quantization if needed.
    if len(positions) > MAX_VERTS:
        for pos_res, uv_res in (
            (10000.0, 32.0),
            (10000.0, 8.0),
            (10000.0, 1.0),
            (10000.0, 0.0),
            (500.0, 0.0),
            (250.0, 0.0),
            (140.0, 0.0),
            (90.0, 0.0),
        ):
            q_pos = np.round(positions * pos_res).astype(np.int32)
            if uv_res > 0.0:
                q_uv = np.round(uvs * uv_res).astype(np.int32)
                keys = np.hstack([q_pos, q_uv, mat_ids[:, None].astype(np.int32)])
            else:
                keys = np.hstack([q_pos, mat_ids[:, None].astype(np.int32)])
            _, unique_first, remap = np.unique(keys, axis=0, return_index=True, return_inverse=True)
            if len(unique_first) <= MAX_VERTS:
                positions = positions[unique_first]
                normals = normals[unique_first]
                uvs = uvs[unique_first]
                mat_ids = mat_ids[unique_first]
                triangles = remap[triangles].astype(np.int32)
                non_deg = (triangles[:, 0] != triangles[:, 1]) & (triangles[:, 1] != triangles[:, 2]) & (triangles[:, 0] != triangles[:, 2])
                triangles = triangles[non_deg]
                break

    # 3. If triangles < MIN_TRIS or vertices < MIN_VERTS, split longest-edge triangles
    while (len(positions) < MIN_VERTS or len(triangles) < MIN_TRIS) and len(triangles) < MAX_TRIS - 2:
        needed_v = max(0, MIN_VERTS - len(positions))
        needed_t = max(0, (MIN_TRIS - len(triangles) + 1) // 2)
        n_split = min(len(triangles), max(1, max(needed_v, needed_t)), (MAX_TRIS - len(triangles)) // 2, MAX_VERTS - len(positions))
        if n_split <= 0:
            break
        v0 = positions[triangles[:, 0]]
        v1 = positions[triangles[:, 1]]
        areas = np.linalg.norm(np.cross(v1 - v0, positions[triangles[:, 2]] - v0), axis=1)
        split_choices = np.argsort(-areas)[:n_split]
        split_mask = np.zeros(len(triangles), dtype=bool)
        split_mask[split_choices] = True

        kept_tris = triangles[~split_mask]
        to_split = triangles[split_mask]
        i0, i1, i2 = to_split[:, 0], to_split[:, 1], to_split[:, 2]

        mid_pos = 0.5 * (positions[i0] + positions[i1])
        mid_norm = normals[i0] + normals[i1]
        n_len = np.linalg.norm(mid_norm, axis=1, keepdims=True)
        mid_norm = np.where(n_len > 1e-8, mid_norm / np.maximum(n_len, 1e-8), np.array([[0.0, 1.0, 0.0]], dtype=np.float32))
        mid_uv = 0.5 * (uvs[i0] + uvs[i1])
        mid_mat = mat_ids[i0]

        base_new = len(positions)
        new_vi = np.arange(base_new, base_new + len(to_split), dtype=np.int32)
        positions = np.vstack([positions, mid_pos.astype(np.float32)])
        normals = np.vstack([normals, mid_norm.astype(np.float32)])
        uvs = np.vstack([uvs, mid_uv.astype(np.float32)])
        mat_ids = np.concatenate([mat_ids, mid_mat.astype(np.uint8)])

        t_a = np.stack([i0, new_vi, i2], axis=1)
        t_b = np.stack([new_vi, i1, i2], axis=1)
        triangles = np.vstack([kept_tris, t_a, t_b]).astype(np.int32)

    # 4. Final cap check: if vertex count still exceeds MAX_VERTS, weld UV seam splits at same 3D pos
    if len(positions) > MAX_VERTS:
        for pos_res in (10000.0, 1000.0, 300.0, 120.0):
            q_pos = np.round(positions * pos_res).astype(np.int32)
            keys = np.hstack([q_pos, mat_ids[:, None].astype(np.int32)])
            _, unique_first, remap = np.unique(keys, axis=0, return_index=True, return_inverse=True)
            if len(unique_first) <= MAX_VERTS:
                positions = positions[unique_first]
                normals = normals[unique_first]
                uvs = uvs[unique_first]
                mat_ids = mat_ids[unique_first]
                triangles = remap[triangles].astype(np.int32)
                non_deg = (triangles[:, 0] != triangles[:, 1]) & (triangles[:, 1] != triangles[:, 2]) & (triangles[:, 0] != triangles[:, 2])
                triangles = triangles[non_deg]
                break

    return positions, normals, uvs, mat_ids, triangles


def normalize_and_rig_14bone(positions, normals, uvs, mat_ids, uv_rects):
    """
    Origin-, Scale- & A-Pose Anatomical Landmark Discovery + Isolated 14-Segment Tekken Auto-Rigger:
      1. Auto-grounds raw `y_min -> 0.0`, centers `x_mid -> 0.0`, `z_mid -> 0.0`, and normalizes
         height `y_max - y_min -> 1.0` (`y_norm in [0.0, 1.0]`).
      2. Geometrically discovers the character's 3D shoulder, elbow, wrist, hand-tip, hip, knee,
         and ankle joint centers directly from the mesh's A-pose (or T-pose) vertex distribution.
      3. Remaps each vertex's UV into its assigned tile in `uv_rects`.
      4. Enforces strict axillary (armpit) and sagittal (leg midline) domain isolation so A-pose
         arms never pull lateral shirt/ribcage vertices and left/right legs never cross-bleed.
    """
    raw_min = positions.min(axis=0)
    raw_max = positions.max(axis=0)
    raw_span = raw_max - raw_min

    height = float(max(1e-5, raw_span[1]))
    x_mid = float(0.5 * (raw_min[0] + raw_max[0]))
    y_min = float(raw_min[1])
    z_mid = float(0.5 * (raw_min[2] + raw_max[2]))

    norm_pos = np.empty_like(positions, dtype=np.float32)
    norm_pos[:, 0] = (positions[:, 0] - x_mid) / height
    norm_pos[:, 1] = np.clip((positions[:, 1] - y_min) / height, 0.0, 1.0)
    norm_pos[:, 2] = (positions[:, 2] - z_mid) / height

    n_len = np.linalg.norm(normals, axis=-1, keepdims=True)
    norm_n = np.where(
        n_len > 1e-8,
        normals / np.maximum(n_len, 1e-8),
        np.array([[0.0, 1.0, 0.0]], dtype=np.float32),
    ).astype(np.float32)

    # Remap UVs into unified 512x512 atlas tiles with half-texel seam clamping
    eps = 0.5 / float(ATLAS_SIZE)
    u_raw = np.mod(uvs[:, 0], 1.0)
    v_raw = np.mod(uvs[:, 1], 1.0)
    u_clamped = np.clip(u_raw, eps, 1.0 - eps)
    v_clamped = np.clip(v_raw, eps, 1.0 - eps)

    remapped_uv = np.empty_like(uvs, dtype=np.float32)
    num_rects = len(uv_rects)
    for r_idx, (u0, u1, v0, v1) in enumerate(uv_rects):
        mask = (mat_ids == r_idx) if r_idx < num_rects - 1 else (mat_ids >= r_idx)
        if np.any(mask):
            remapped_uv[mask, 0] = u0 + (u1 - u0) * u_clamped[mask]
            remapped_uv[mask, 1] = v0 + (v1 - v0) * v_clamped[mask]

    x = norm_pos[:, 0]
    y = norm_pos[:, 1]
    z = norm_pos[:, 2]
    x_abs = np.abs(x)

    # Discover lateral arm corridor in upper-body band (y in [0.36, 0.82])
    arm_band = (y >= 0.36) & (y <= 0.82) & (x_abs > 0.105)
    x_arm_max = float(np.percentile(x_abs[arm_band], 99.0)) if np.any(arm_band) else 0.305
    x_arm_max = max(0.22, x_arm_max)

    # Sample shoulder, elbow, wrist, and hand-tip 3D joint centers along the mesh's arm corridor
    sh_mask = (x_abs >= 0.095) & (x_abs <= 0.135) & (y >= 0.65) & (y <= 0.77)
    if np.any(sh_mask):
        x_sh = float(np.median(x_abs[sh_mask]))
        y_sh = float(np.clip(np.percentile(y[sh_mask], 58.0), 0.695, 0.755))
        z_sh = float(np.median(z[sh_mask]))
    else:
        x_sh, y_sh, z_sh = 0.108, 0.725, -0.010

    el_x_lo = x_sh + (x_arm_max - x_sh) * 0.34
    el_x_hi = x_sh + (x_arm_max - x_sh) * 0.56
    el_mask = arm_band & (x_abs >= el_x_lo) & (x_abs <= el_x_hi)
    if np.any(el_mask):
        x_el = float(np.median(x_abs[el_mask]))
        y_el = float(np.median(y[el_mask]))
        z_el = float(np.median(z[el_mask]))
    else:
        x_el = x_sh + (x_arm_max - x_sh) * 0.45
        y_el = y_sh - 0.115
        z_el = -0.015

    wr_x_lo = x_sh + (x_arm_max - x_sh) * 0.68
    wr_x_hi = x_sh + (x_arm_max - x_sh) * 0.88
    wr_mask = arm_band & (x_abs >= wr_x_lo) & (x_abs <= wr_x_hi)
    if np.any(wr_mask):
        x_wr = float(np.median(x_abs[wr_mask]))
        y_wr = float(np.median(y[wr_mask]))
        z_wr = float(np.median(z[wr_mask]))
    else:
        x_wr = x_sh + (x_arm_max - x_sh) * 0.78
        y_wr = y_el - 0.115
        z_wr = -0.005

    tip_mask = arm_band & (x_abs >= wr_x_hi)
    if np.any(tip_mask):
        x_tip = max(x_wr + 0.03, float(np.percentile(x_abs[tip_mask], 90.0)))
        y_tip = float(np.median(y[tip_mask]))
        z_tip = float(np.median(z[tip_mask]))
    else:
        x_tip = max(x_wr + 0.04, x_arm_max)
        y_tip = y_wr - (y_el - y_wr) * 0.45
        z_tip = z_wr

    detected_pose = "A_POSE" if (y_sh - y_wr) >= 0.07 or x_arm_max < 0.36 else "T_POSE"

    # Measure leg X center from shin/ankle band
    leg_mask = (y >= 0.04) & (y <= 0.42) & (x_abs > 0.015) & (x_abs < 0.16)
    leg_x = float(np.clip(np.median(x_abs[leg_mask]), 0.050, 0.105)) if np.any(leg_mask) else 0.082

    # Build the 14 measured bone definitions (stored in manifest.json and rig.bin)
    measured_bones = [
        {"id": 0,  "name": "Pelvis",       "pivot": [0.000, 0.475, 0.000]},
        {"id": 1,  "name": "Chest_Spine",  "pivot": [0.000, 0.545, 0.000]},
        {"id": 2,  "name": "Neck",         "pivot": [0.000, 0.770, 0.000]},
        {"id": 3,  "name": "Head",         "pivot": [0.000, 0.835, 0.005]},
        {"id": 4,  "name": "L_UpperArm",   "pivot": [round(x_sh, 5),  round(y_sh, 5), round(z_sh, 5)]},
        {"id": 5,  "name": "L_Forearm",    "pivot": [round(x_el, 5),  round(y_el, 5), round(z_el, 5)]},
        {"id": 6,  "name": "L_Hand",       "pivot": [round(x_wr, 5),  round(y_wr, 5), round(z_wr, 5)]},
        {"id": 7,  "name": "R_UpperArm",   "pivot": [round(-x_sh, 5), round(y_sh, 5), round(z_sh, 5)]},
        {"id": 8,  "name": "R_Forearm",    "pivot": [round(-x_el, 5), round(y_el, 5), round(z_el, 5)]},
        {"id": 9,  "name": "R_Hand",       "pivot": [round(-x_wr, 5), round(y_wr, 5), round(z_wr, 5)]},
        {"id": 10, "name": "L_Thigh",      "pivot": [round(leg_x, 5),  0.475, -0.005]},
        {"id": 11, "name": "L_Calf_Foot",  "pivot": [round(leg_x, 5),  0.265, -0.015]},
        {"id": 12, "name": "R_Thigh",      "pivot": [round(-leg_x, 5), 0.475, -0.005]},
        {"id": 13, "name": "R_Calf_Foot",  "pivot": [round(-leg_x, 5), 0.265, -0.015]},
    ]

    segments = [
        # (bone_id, p0, p1, sigma, region)
        (0,  (0.000, 0.455, 0.000), (0.000, 0.545, 0.000), 0.065, "torso"),      # Pelvis
        (1,  (0.000, 0.545, 0.000), (0.000, 0.770, 0.000), 0.080, "torso"),      # Chest_Spine
        (2,  (0.000, 0.770, 0.000), (0.000, 0.835, 0.000), 0.045, "neck"),       # Neck
        (3,  (0.000, 0.835, 0.005), (0.000, 0.990, 0.010), 0.080, "head"),       # Head
        # Left Arm (+X)
        (4,  (x_sh,  y_sh,  z_sh),  (x_el,  y_el,  z_el),  0.052, "left_arm"),   # L_UpperArm
        (5,  (x_el,  y_el,  z_el),  (x_wr,  y_wr,  z_wr),  0.048, "left_arm"),   # L_Forearm
        (6,  (x_wr,  y_wr,  z_wr),  (x_tip, y_tip, z_tip), 0.045, "left_arm"),   # L_Hand
        # Right Arm (-X)
        (7,  (-x_sh, y_sh,  z_sh),  (-x_el, y_el,  z_el),  0.052, "right_arm"),  # R_UpperArm
        (8,  (-x_el, y_el,  z_el),  (-x_wr, y_wr,  z_wr),  0.048, "right_arm"),  # R_Forearm
        (9,  (-x_wr, y_wr,  z_wr),  (-x_tip, y_tip, z_tip),0.045, "right_arm"),  # R_Hand
        # Left Leg (+X, Y < 0.49)
        (10, (leg_x,  0.475, -0.005), (leg_x,  0.265, -0.015), 0.062, "left_leg"),  # L_Thigh
        (11, (leg_x,  0.265, -0.015), (leg_x,  0.020,  0.005), 0.058, "left_leg"),  # L_Calf_Foot
        # Right Leg (-X, Y < 0.49)
        (12, (-leg_x, 0.475, -0.005), (-leg_x, 0.265, -0.015), 0.062, "right_leg"), # R_Thigh
        (13, (-leg_x, 0.265, -0.015), (-leg_x, 0.020,  0.005), 0.058, "right_leg"), # R_Calf_Foot
    ]

    # Axillary separating plane between downward A-pose arms and lateral torso/hips
    x_sep = np.where(
        y >= 0.66,
        0.102 + 0.16 * np.maximum(0.0, 0.74 - y),
        0.120 + 0.04 * np.maximum(0.0, 0.66 - y),
    )
    is_left_arm_domain = (x > x_sep) & (y >= 0.36) & (y <= 0.81)
    is_right_arm_domain = (x < -x_sep) & (y >= 0.36) & (y <= 0.81)
    is_arm_domain = is_left_arm_domain | is_right_arm_domain
    is_head_domain = (y >= 0.805) & (x_abs <= 0.115)

    n_verts = len(norm_pos)
    W = np.zeros((n_verts, 14), dtype=np.float64)

    for b_id, p0, p1, sigma, region in segments:
        a = np.array(p0, dtype=np.float64)
        b = np.array(p1, dtype=np.float64)
        ab = b - a
        ab_len2 = float(np.dot(ab, ab))
        if ab_len2 > 1e-12:
            t = np.clip(((norm_pos - a) @ ab) / ab_len2, 0.0, 1.0)
            closest = a[None, :] + t[:, None] * ab[None, :]
        else:
            closest = np.broadcast_to(a, norm_pos.shape)
        d2 = ((norm_pos - closest) ** 2).sum(axis=-1)
        w = np.exp(-d2 / (2.0 * sigma * sigma))

        if region == "head":
            w = np.where(y >= 0.79, w * 3.0, 0.0)
            w = np.where(is_head_domain & (y >= 0.835), w * 12.0, w)
        elif region == "neck":
            w = np.where((y >= 0.73) & (y <= 0.85) & (x_abs <= 0.10), w * 2.5, 0.0)
        elif region == "left_arm":
            # Allow arm weight in left arm domain plus smooth shoulder blend zone (x in [0.085, x_sep], y in [0.65, 0.79])
            sh_blend = (x >= 0.085) & (x <= x_sep) & (y >= 0.65) & (y <= 0.79) & (b_id == 4)
            w = np.where(is_left_arm_domain | sh_blend, w, 0.0)
            w = np.where(is_left_arm_domain, w * 4.0, w * 0.65)
        elif region == "right_arm":
            sh_blend = (x <= -0.085) & (x >= -x_sep) & (y >= 0.65) & (y <= 0.79) & (b_id == 7)
            w = np.where(is_right_arm_domain | sh_blend, w, 0.0)
            w = np.where(is_right_arm_domain, w * 4.0, w * 0.65)
        elif region == "left_leg":
            w = np.where((~is_arm_domain) & (x >= -0.005) & (y <= 0.50), w, 0.0)
            w = np.where((~is_arm_domain) & (x > 0.005) & (y < 0.45), w * 3.5, w)
        elif region == "right_leg":
            w = np.where((~is_arm_domain) & (x <= 0.005) & (y <= 0.50), w, 0.0)
            w = np.where((~is_arm_domain) & (x < -0.005) & (y < 0.45), w * 3.5, w)
        elif region == "torso":
            # Never bleed torso weight onto the free A-pose arm outside the shoulder blend cap
            in_sh_cap = (x_abs <= x_sep + 0.025) & (y >= 0.65) & (y <= 0.79) & (b_id == 1)
            w = np.where((~is_arm_domain) | in_sh_cap, w, 0.0)
            w = np.where((~is_arm_domain) & (y >= 0.44) & (y <= 0.80), w * 2.5, w * 0.35)

        W[:, b_id] = w

    # Select top 4 bone influences per vertex and L1-normalize to 1.0000
    top4_idx = np.argsort(-W, axis=1)[:, :4]
    top4_w = np.take_along_axis(W, top4_idx, axis=1)
    row_sums = top4_w.sum(axis=1, keepdims=True)
    zero_rows = (row_sums[:, 0] <= 1e-12)
    if np.any(zero_rows):
        top4_idx[zero_rows, 0] = 1
        top4_w[zero_rows, 0] = 1.0
        row_sums = top4_w.sum(axis=1, keepdims=True)
    top4_w = (top4_w / row_sums).astype(np.float32)
    top4_w[:, 0] += (1.0 - top4_w.sum(axis=1)).astype(np.float32)
    top4_idx = top4_idx.astype(np.uint8)

    meta = {
        "rawBoundsMin": [round(float(v), 6) for v in raw_min],
        "rawBoundsMax": [round(float(v), 6) for v in raw_max],
        "normalizedBoundsMin": [round(float(v), 6) for v in norm_pos.min(axis=0)],
        "normalizedBoundsMax": [round(float(v), 6) for v in norm_pos.max(axis=0)],
        "detectedPose": detected_pose,
        "armSpanNorm": round(x_arm_max, 5),
        "landmarks": {
            "shoulder": [round(x_sh, 5), round(y_sh, 5), round(z_sh, 5)],
            "elbow": [round(x_el, 5), round(y_el, 5), round(z_el, 5)],
            "wrist": [round(x_wr, 5), round(y_wr, 5), round(z_wr, 5)],
            "handTip": [round(x_tip, 5), round(y_tip, 5), round(z_tip, 5)],
            "legX": round(leg_x, 5),
        },
        "measuredBones": measured_bones,
    }
    return norm_pos, norm_n, remapped_uv, top4_idx, top4_w, meta


def pack_rig_binary(norm_pos, norm_n, remapped_uv, joints4, weights4, triangles, fighter_entry, bones_list=None):
    """
    Serialize the compiled 14-bone character rig into a deterministic binary (`rig.bin`):
      Header (40 bytes):
        - magic: 8 bytes b"LUISTKDR"
        - version: uint32 (1)
        - vertexCount: uint32
        - triangleCount: uint32
        - boneCount: uint32 (14)
        - targetFighterId: uint32 (0..35)
        - heightScale, shoulderScale, limbWidthScale: 3 x float32
      Pivots (14 * 12 = 168 bytes):
        - 14 x float32[3] measured rest-pose joint pivots
      Vertices (vertexCount * 52 bytes):
        - pos: float32[3] (12 B)
        - norm: float32[3] (12 B)
        - uv: float32[2] (8 B)
        - joints: uint8[4] (4 B)
        - weights: float32[4] (16 B)
      Indices (triangleCount * 3 * 2 bytes):
        - uint16[triangleCount * 3]
    """
    n_verts = len(norm_pos)
    n_tris = len(triangles)
    header = struct.pack(
        "<8sIIIIIfff",
        b"LUISTKDR",
        1,
        n_verts,
        n_tris,
        14,
        int(fighter_entry["id"]),
        float(fighter_entry["heightScale"]),
        float(fighter_entry["shoulderScale"]),
        float(fighter_entry["limbWidthScale"]),
    )
    pivots_buf = bytearray()
    active_bones = bones_list if bones_list is not None else CANONICAL_14_BONES
    for b in active_bones:
        px, py, pz = b["pivot"]
        pivots_buf += struct.pack("<fff", float(px), float(py), float(pz))

    v_dtype = np.dtype([
        ("pos", "<f4", (3,)),
        ("norm", "<f4", (3,)),
        ("uv", "<f4", (2,)),
        ("joints", "u1", (4,)),
        ("weights", "<f4", (4,)),
    ])
    v_arr = np.empty(n_verts, dtype=v_dtype)
    v_arr["pos"] = norm_pos
    v_arr["norm"] = norm_n
    v_arr["uv"] = remapped_uv
    v_arr["joints"] = joints4
    v_arr["weights"] = weights4

    idx_arr = triangles.astype("<u2").reshape(-1)
    return header + bytes(pivots_buf) + v_arr.tobytes() + idx_arr.tobytes()


def compile_glb_for_tkdr(
    glb_path,
    fighter_query="JIN",
    bundle_id=None,
    label=None,
    target_tris=3400,
    mirror_to_luis_fighter=False,
):
    """Compile any humanoid .glb into a Tekken 14-bone fighter bundle and return its manifest."""
    t0 = time.time()
    glb_path = os.path.abspath(glb_path)
    raw_bytes, glb_sha256, gltf, bin_buf = parse_glb_chunks(glb_path)
    fighter = resolve_tekken_fighter(fighter_query)

    base_stem = os.path.splitext(os.path.basename(glb_path))[0]
    clean_stem = re.sub(r"[^a-zA-Z0-9_]+", "_", base_stem).strip("_").lower()
    if not bundle_id:
        bundle_id = f"{clean_stem}_{fighter['code'].lower()}"
    if not label:
        label = f"{base_stem} ({fighter['fullName']} [{fighter['code']}])"

    atlas_rgba, uv_rects, mat_count = build_universal_atlas_and_uv_rects(gltf, bin_buf)
    pos, norm, uvs, mat_ids, tris, input_tris = extract_and_decimate_mesh_blender(glb_path, target_tris=target_tris)
    pos, norm, uvs, mat_ids, tris = enforce_vertex_and_triangle_budget(pos, norm, uvs, mat_ids, tris)
    norm_pos, norm_n, remapped_uv, joints4, weights4, norm_meta = normalize_and_rig_14bone(
        pos, norm, uvs, mat_ids, uv_rects
    )
    measured_bones = norm_meta.get("measuredBones", CANONICAL_14_BONES)

    rig_bytes = pack_rig_binary(
        norm_pos, norm_n, remapped_uv, joints4, weights4, tris, fighter, bones_list=measured_bones
    )
    rig_sha256 = hashlib.sha256(rig_bytes).hexdigest()

    bundle_dir = os.path.join(CUSTOM_FIGHTERS_DIR, bundle_id)
    os.makedirs(bundle_dir, exist_ok=True)
    rig_path = os.path.join(bundle_dir, "rig.bin")
    atlas_path = os.path.join(bundle_dir, "atlas.png")
    manifest_path = os.path.join(bundle_dir, "manifest.json")

    with open(rig_path, "wb") as f:
        f.write(rig_bytes)

    atlas_bgra = cv2.cvtColor(atlas_rgba, cv2.COLOR_RGBA2BGRA)
    cv2.imwrite(atlas_path, atlas_bgra)
    with open(atlas_path, "rb") as f:
        atlas_sha256 = hashlib.sha256(f.read()).hexdigest()

    elapsed_s = round(time.time() - t0, 3)
    manifest = {
        "bundleId": bundle_id,
        "label": label,
        "sourceGlbPath": glb_path,
        "sourceGlbName": os.path.basename(glb_path),
        "sourceGlbBytes": len(raw_bytes),
        "sourceGlbSha256": glb_sha256,
        "sourceMeshCount": len(gltf.get("meshes", [])),
        "sourcePrimitiveCount": sum(len(m.get("primitives", [])) for m in gltf.get("meshes", [])),
        "sourceSkinCount": len(gltf.get("skins", [])),
        "sourceMaterialCount": mat_count,
        "inputTriangleCount": input_tris,
        "vertexCount": int(len(norm_pos)),
        "triangleCount": int(len(tris)),
        "boneCount": 14,
        "bones": measured_bones,
        "targetFighterId": fighter["id"],
        "targetFighterCode": fighter["code"],
        "targetFighterShortName": fighter["shortName"],
        "targetFighterName": fighter["fullName"],
        "targetFighterStyle": fighter["style"],
        "proportions": {
            "archetype": fighter["archetype"],
            "heightScale": fighter["heightScale"],
            "shoulderScale": fighter["shoulderScale"],
            "limbWidthScale": fighter["limbWidthScale"],
        },
        "normalization": norm_meta,
        "atlasWidth": ATLAS_SIZE,
        "atlasHeight": ATLAS_SIZE,
        "rigBytes": len(rig_bytes),
        "rigSha256": rig_sha256,
        "atlasSha256": atlas_sha256,
        "rigUrl": f"./custom_fighters/{bundle_id}/rig.bin",
        "atlasUrl": f"./custom_fighters/{bundle_id}/atlas.png",
        "manifestUrl": f"./custom_fighters/{bundle_id}/manifest.json",
        "compileSeconds": elapsed_s,
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    if mirror_to_luis_fighter:
        os.makedirs(LUIS_FIGHTER_MIRROR_DIR, exist_ok=True)
        shutil.copy2(rig_path, os.path.join(LUIS_FIGHTER_MIRROR_DIR, "luis_rig.bin"))
        shutil.copy2(atlas_path, os.path.join(LUIS_FIGHTER_MIRROR_DIR, "luis_atlas.png"))
        mirror_manifest = dict(manifest)
        mirror_manifest["rigUrl"] = "./luis_fighter/luis_rig.bin"
        mirror_manifest["atlasUrl"] = "./luis_fighter/luis_atlas.png"
        mirror_manifest["manifestUrl"] = "./luis_fighter/manifest.json"
        with open(os.path.join(LUIS_FIGHTER_MIRROR_DIR, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(mirror_manifest, f, indent=2)

    return manifest


def update_registry(manifest, slot=None):
    """Update `/tkdr/custom_fighters/registry.json` with the compiled bundle and 36-fighter roster."""
    os.makedirs(CUSTOM_FIGHTERS_DIR, exist_ok=True)
    registry = {
        "version": 1,
        "rosterFighterCount": len(TEKKEN_ROSTER),
        "roster": TEKKEN_ROSTER,
        "bundles": {},
        "bindings": {
            "p1BundleId": None,
            "p1FighterCode": "JIN",
            "p2BundleId": None,
            "p2FighterCode": "PAU",
            "byFighterCode": {},
        },
    }
    if os.path.isfile(REGISTRY_JSON_PATH):
        try:
            with open(REGISTRY_JSON_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                registry["bundles"] = loaded.get("bundles", {})
                if isinstance(loaded.get("bindings"), dict):
                    registry["bindings"].update(loaded["bindings"])
        except Exception:
            pass

    b_id = manifest["bundleId"]
    f_code = manifest["targetFighterCode"]
    registry["bundles"][b_id] = manifest
    registry["bindings"]["byFighterCode"][f_code] = b_id

    if slot == "P1" or registry["bindings"]["p1BundleId"] is None:
        registry["bindings"]["p1BundleId"] = b_id
        registry["bindings"]["p1FighterCode"] = f_code
    elif slot == "P2":
        registry["bindings"]["p2BundleId"] = b_id
        registry["bindings"]["p2FighterCode"] = f_code

    with open(REGISTRY_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)
    return registry


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=".glb-Agnostic Tekken: Dark Resurrection Auto-Rigger & Adaptive Decimator"
    )
    parser.add_argument("--glb", type=str, default=None, help="Path or gs:// URI to any humanoid .glb file")
    parser.add_argument("--player-name", "--playername", dest="player_name", default=None, help="Player name for GCS run")
    parser.add_argument("--player-id", default=None, help="Player ID for GCS run")
    parser.add_argument("--run-id", default=None, help="Run ID for GCS run")
    parser.add_argument("--gcs-bucket", default="3d-banana-player-assets", help="GCS bucket name")
    parser.add_argument("--output-dir", default=None, help="Optional local staging directory for GCS intake")
    parser.add_argument(
        "--fighter",
        type=str,
        default="JIN",
        help="Target Tekken fighter code (PAU..JPC), ID (0..35), or name (e.g. 'Jin Kazama', 'Lili', 'Paul')",
    )
    parser.add_argument("--bundle-id", type=str, default=None, help="Optional bundle identifier")
    parser.add_argument("--label", type=str, default=None, help="Optional human-readable label")
    parser.add_argument("--slot", type=str, choices=["P1", "P2", "NONE"], default="P1", help="Default slot assignment")
    parser.add_argument("--target-tris", type=int, default=3400, help="Target triangle count after decimation")
    parser.add_argument("--list-fighters", action="store_true", help="Print the 36-fighter Tekken roster and exit")
    args = parser.parse_args(argv)

    if args.list_fighters:
        for entry in TEKKEN_ROSTER:
            print(
                f"{entry['id']:2d} | {entry['code']} | {entry['fullName']:20s} | "
                f"{entry['style']:28s} | scale=({entry['heightScale']:.2f}, {entry['shoulderScale']:.2f}, {entry['limbWidthScale']:.2f})"
            )
        return 0

    ensure_luis_glb_staged()

    if args.player_name and args.player_id and args.run_id:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import gcs_rig_intake

        intake = gcs_rig_intake.intake_assembled_character_for_rigging(
            bucket_name=args.gcs_bucket,
            player_name=args.player_name,
            player_id=args.player_id,
            run_id=args.run_id,
            output_dir=args.output_dir,
        )
        fighter = resolve_tekken_fighter(args.fighter)
        b_id = args.bundle_id or f"{intake['char_id']}_{fighter['code'].lower()}"
        lbl = args.label or f"{intake['character_name']} ({fighter['fullName']} [{fighter['code']}])"
        manifest = compile_glb_for_tkdr(
            intake["local_glb_path"],
            fighter_query=args.fighter,
            bundle_id=b_id,
            label=lbl,
            target_tris=args.target_tris,
            mirror_to_luis_fighter=(args.slot == "P1"),
        )
        reg = update_registry(manifest, slot=None if args.slot == "NONE" else args.slot)
        b_dir = os.path.join(CUSTOM_FIGHTERS_DIR, b_id)
        gcs_rig_intake.sync_target_rigged_deliverables(
            intake_info=intake,
            target_game="tekken",
            deliverables=[
                ("rig_bin", os.path.join(b_dir, "rig.bin"), "application/octet-stream"),
                ("atlas_png", os.path.join(b_dir, "atlas.png"), "image/png"),
                ("manifest_json", os.path.join(b_dir, "manifest.json"), "application/json"),
            ],
            telemetry_payload=manifest,
        )
        print(
            f"[compile_tkdr_character] GCS Compiled {intake['gcs_assembled_uri']} -> {manifest['bundleId']} "
            f"(fighter={manifest['targetFighterCode']} [{manifest['targetFighterName']}], "
            f"verts={manifest['vertexCount']}, tris={manifest['triangleCount']}, "
            f"pose={manifest['normalization']['detectedPose']}, time={manifest['compileSeconds']}s)"
        )
        return 0

    if args.glb:
        glb_input = args.glb
        if str(glb_input).startswith("gs://"):
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            import gcs_rig_intake

            intake = gcs_rig_intake.intake_assembled_character_for_rigging(
                glb_path=glb_input, output_dir=args.output_dir
            )
            glb_input = intake["local_glb_path"]
        manifest = compile_glb_for_tkdr(
            glb_input,
            fighter_query=args.fighter,
            bundle_id=args.bundle_id,
            label=args.label,
            target_tris=args.target_tris,
            mirror_to_luis_fighter=(args.slot == "P1"),
        )
        reg = update_registry(manifest, slot=None if args.slot == "NONE" else args.slot)
        print(
            f"[compile_tkdr_character] Compiled {manifest['sourceGlbName']} -> {manifest['bundleId']} "
            f"(fighter={manifest['targetFighterCode']} [{manifest['targetFighterName']}], "
            f"verts={manifest['vertexCount']}, tris={manifest['triangleCount']}, "
            f"materials={manifest['sourceMaterialCount']}, pose={manifest['normalization']['detectedPose']}, "
            f"time={manifest['compileSeconds']}s, totalBundles={len(reg['bundles'])})"
        )
        return 0

    # Default multi-asset compilation:
    # 1. Compile Nico's Stage 4 assembled A-pose character (character_full.glb) bound to JIN and PAU
    if os.path.isfile(DEFAULT_NICOTEST_GLB):
        m_nico_jin = compile_glb_for_tkdr(
            DEFAULT_NICOTEST_GLB,
            fighter_query="JIN",
            bundle_id="nicotest_jin",
            label="NICO A-Pose (Jin Kazama [JIN])",
            target_tris=args.target_tris,
            mirror_to_luis_fighter=True,
        )
        update_registry(m_nico_jin, slot="P1")
        print(
            f"[compile_tkdr_character] Compiled {m_nico_jin['sourceGlbName']} -> {m_nico_jin['bundleId']} "
            f"(verts={m_nico_jin['vertexCount']}, tris={m_nico_jin['triangleCount']}, "
            f"pose={m_nico_jin['normalization']['detectedPose']}, time={m_nico_jin['compileSeconds']}s)"
        )

        m_nico_pau = compile_glb_for_tkdr(
            DEFAULT_NICOTEST_GLB,
            fighter_query="PAU",
            bundle_id="nicotest_pau",
            label="NICO A-Pose (Paul Phoenix [PAU])",
            target_tris=args.target_tris,
            mirror_to_luis_fighter=False,
        )
        update_registry(m_nico_pau, slot="NONE")
        print(
            f"[compile_tkdr_character] Compiled {m_nico_pau['sourceGlbName']} -> {m_nico_pau['bundleId']} "
            f"(verts={m_nico_pau['vertexCount']}, tris={m_nico_pau['triangleCount']}, "
            f"pose={m_nico_pau['normalization']['detectedPose']}, time={m_nico_pau['compileSeconds']}s)"
        )

    m_luis = compile_glb_for_tkdr(
        STAGED_LUIS_GLB,
        fighter_query="JIN",
        bundle_id="luis_jin",
        label="LUIS (Jin Kazama [JIN])",
        target_tris=args.target_tris,
        mirror_to_luis_fighter=not os.path.isfile(DEFAULT_NICOTEST_GLB),
    )
    update_registry(m_luis, slot="NONE" if os.path.isfile(DEFAULT_NICOTEST_GLB) else "P1")
    print(
        f"[compile_tkdr_character] Compiled {m_luis['sourceGlbName']} -> {m_luis['bundleId']} "
        f"(verts={m_luis['vertexCount']}, tris={m_luis['triangleCount']}, time={m_luis['compileSeconds']}s)"
    )

    hoodie_glb = os.path.join(REPO_ROOT, "character_hoodie.glb")
    if os.path.isfile(hoodie_glb):
        m_hoodie = compile_glb_for_tkdr(
            hoodie_glb,
            fighter_query="LAW",
            bundle_id="hoodie_law",
            label="HOODIE (Marshall Law [LAW])",
            target_tris=args.target_tris,
            mirror_to_luis_fighter=False,
        )
        reg = update_registry(m_hoodie, slot="NONE")
        print(
            f"[compile_tkdr_character] Compiled {m_hoodie['sourceGlbName']} -> {m_hoodie['bundleId']} "
            f"(verts={m_hoodie['vertexCount']}, tris={m_hoodie['triangleCount']}, "
            f"time={m_hoodie['compileSeconds']}s, totalBundles={len(reg['bundles'])})"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
