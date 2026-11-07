#!/usr/bin/env python3
"""
build_clean_skate3_luis_part.py

Atomic, zero-distortion glTF 2.0 binary surgery pipeline to build clean
skate3_cleanroom/parts/char_luis.part (and char_luis_holo.part) with:
1. Complete Luis character mesh (LUIS body + head)
2. All 3 skateboard primitives (Retail_SkateBoard, Retail_SkateTruck, Retail_SkateWheel)
3. 35-joint Skate 3 Clean-Room Master Rig (Skate3_RX2_Rig) with intact Inverse Bind Matrices
4. ZERO Torus or SkateAlley_Holo_Visualizer nodes
5. Atomic pack.json recalculation (default_char: luis, 90631134 + len(part_bytes), sha256[:16])

Governed by Functional Specification 068, Addendum §11.1 & §15.3, and LANGUAGE.md.
"""

from __future__ import annotations

import hashlib
import json
import os
import struct
import sys
import tempfile
import trimesh

FIXED_SURROUNDING_PARTS_SUM = 90631134  # core_head (37088836) + core_tail_0 (27000000) + core_tail_1 (26542298)
EXPECTED_HEADER_PATH = b"assets/private/skater.glb"


def atomic_write(target_path: str, data: bytes) -> None:
    """Write data to target_path atomically using temp-file and replace."""
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    temp_dir = os.path.dirname(os.path.abspath(target_path))
    temp_file = tempfile.NamedTemporaryFile(dir=temp_dir, delete=False, prefix="tmp_part_")
    try:
        temp_file.write(data)
        temp_file.flush()
        os.fsync(temp_file.fileno())
        temp_file.close()
        os.replace(temp_file.name, target_path)
    except Exception:
        if os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass
        raise


def build_clean_luis_part(source_part_path: str) -> tuple[bytes, bytes]:
    """
    Perform surgical binary edit on char_luis_holo.part:
    Strips node 37 (SkateAlley_Holo_Visualizer) and mesh 1 (Torus),
    retains 5 primitives and 35 rig joints.
    Returns (part_bytes, glb_bytes).
    """
    with open(source_part_path, "rb") as f:
        raw = f.read()

    hdr_len, = struct.unpack("<I", raw[:4])
    hdr_path = raw[4:4 + hdr_len]
    if hdr_path != EXPECTED_HEADER_PATH:
        raise ValueError(f"Unexpected pack entry header path: {hdr_path}")
    header_total_len = 4 + hdr_len + 8
    glb_bytes = raw[header_total_len:]

    magic, version, length = struct.unpack("<4sII", glb_bytes[:12])
    if magic != b"glTF" or version != 2:
        raise ValueError(f"Invalid glTF header: magic={magic}, version={version}")

    c0_len, c0_type = struct.unpack("<I4s", glb_bytes[12:20])
    if c0_type != b"JSON":
        raise ValueError(f"Expected JSON chunk 0, got {c0_type}")
    c0_end = 20 + c0_len
    c1_len, c1_type = struct.unpack("<I4s", glb_bytes[c0_end:c0_end + 8])
    if c1_type != b"BIN\x00":
        raise ValueError(f"Expected BIN chunk 1, got {c1_type}")
    bin_data = glb_bytes[c0_end + 8:c0_end + 8 + c1_len]

    gjson = json.loads(glb_bytes[20:c0_end].decode("utf-8"))

    # 1. Update Skate3_RX2_Rig children: unlink node 37
    rig_node = gjson["nodes"][36]
    if rig_node.get("name") != "Skate3_RX2_Rig":
        raise ValueError(f"Expected node 36 to be Skate3_RX2_Rig, got {rig_node.get('name')}")
    rig_node["children"] = [child for child in rig_node.get("children", []) if child != 37]

    # 2. Remove node 37 (SkateAlley_Holo_Visualizer) if present
    if len(gjson["nodes"]) > 37:
        del gjson["nodes"][37]

    # 3. Rename CharacterMesh node & mesh to LUIS
    if len(gjson["nodes"]) > 35:
        gjson["nodes"][35]["name"] = "LUIS"
    gjson["meshes"][0]["name"] = "LUIS"

    # 4. Verify Mesh 0 has all 5 primitives
    prims = gjson["meshes"][0].get("primitives", [])
    if len(prims) < 5:
        raise ValueError(f"Mesh 0 has only {len(prims)} primitives, expected 5")

    # 5. Remove Mesh 1 (Torus)
    gjson["meshes"] = [gjson["meshes"][0]]

    # 6. Remove Material 5 (HOLOSYS_Visualizer_Holo_Material)
    gjson["materials"] = gjson["materials"][:5]

    # 7. Serialize Chunk 0 JSON with 0x20 padding to 4-byte alignment
    new_json_bytes = json.dumps(gjson, separators=(",", ":")).encode("utf-8")
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b" " * pad

    new_c0_len = len(new_json_bytes)
    new_glb_len = 12 + 8 + new_c0_len + 8 + c1_len

    clean_glb = (
        struct.pack("<4sII", b"glTF", 2, new_glb_len)
        + struct.pack("<I4s", new_c0_len, b"JSON")
        + new_json_bytes
        + struct.pack("<I4s", c1_len, b"BIN\x00")
        + bin_data
    )

    clean_part = (
        struct.pack("<I", len(EXPECTED_HEADER_PATH))
        + EXPECTED_HEADER_PATH
        + struct.pack("<Q", new_glb_len)
        + clean_glb
    )

    return clean_part, clean_glb


def update_pack_json(pack_json_path: str, part_bytes: bytes) -> dict:
    """Atomically update pack.json with default_char='luis', new sizes and sha256 hashes."""
    with open(pack_json_path, "r", encoding="utf-8") as f:
        pack = json.load(f)

    part_len = len(part_bytes)
    part_hash = hashlib.sha256(part_bytes).hexdigest()[:16]
    expected_size = FIXED_SURROUNDING_PARTS_SUM + part_len

    pack["default_char"] = "luis"

    # Update core
    pack["core"]["size"] = expected_size
    pack["core"]["hash"] = part_hash

    # Update characters.luis
    if "characters" in pack and "luis" in pack["characters"]:
        pack["characters"]["luis"]["size"] = expected_size
        pack["characters"]["luis"]["hash"] = part_hash

    # Update characters.luis_holo
    if "characters" in pack and "luis_holo" in pack["characters"]:
        pack["characters"]["luis_holo"]["size"] = expected_size
        pack["characters"]["luis_holo"]["hash"] = part_hash

    encoded = json.dumps(pack, indent=2).encode("utf-8") + b"\n"
    atomic_write(pack_json_path, encoded)
    return pack


def main() -> None:
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    cleanroom_dir = os.path.join(repo_root, "skate3_cleanroom")
    source_holo_part = os.path.join(cleanroom_dir, "parts", "char_luis_holo.part")
    target_luis_part = os.path.join(cleanroom_dir, "parts", "char_luis.part")
    pack_json_path = os.path.join(cleanroom_dir, "pack.json")

    print(f"[*] Reading source part: {source_holo_part}")
    clean_part, clean_glb = build_clean_luis_part(source_holo_part)
    print(f"[*] Generated clean part payload: {len(clean_part)} bytes (GLB: {len(clean_glb)} bytes)")

    # Verify with trimesh
    print("[*] Verifying clean GLB with trimesh...")
    scene = trimesh.load(trimesh.util.wrap_as_stream(clean_glb), file_type="glb")
    bad_nodes = [n for n in scene.graph.nodes if "torus" in n.lower() or "holo" in n.lower()]
    if bad_nodes:
        raise AssertionError(f"Residual visualizer/torus nodes detected: {bad_nodes}")
    geoms = list(scene.geometry.keys())
    if len(geoms) < 5:
        raise AssertionError(f"Expected at least 5 primitives, found {len(geoms)}: {geoms}")
    print(f"[✓] Zero Torus nodes verified. Found {len(geoms)} primitives: {geoms}")

    # Write char_luis.part and char_luis_holo.part atomically
    print(f"[*] Writing clean payload to: {target_luis_part}")
    atomic_write(target_luis_part, clean_part)
    print(f"[*] Writing clean payload to: {source_holo_part}")
    atomic_write(source_holo_part, clean_part)

    # Update pack.json
    print(f"[*] Updating {pack_json_path}...")
    updated_pack = update_pack_json(pack_json_path, clean_part)
    print(f"[✓] pack.json updated successfully:")
    print(f"    default_char: {updated_pack.get('default_char')}")
    print(f"    core.size: {updated_pack['core']['size']} (hash: {updated_pack['core']['hash']})")
    print(f"    luis.size: {updated_pack['characters']['luis']['size']} (hash: {updated_pack['characters']['luis']['hash']})")
    print(f"    luis_holo.size: {updated_pack['characters']['luis_holo']['size']} (hash: {updated_pack['characters']['luis_holo']['hash']})")
    print("[✓] Build clean Skate 3 Luis part COMPLETE.")


if __name__ == "__main__":
    main()
