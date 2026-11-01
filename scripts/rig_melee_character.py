#!/usr/bin/env python3
"""
rig_melee_character.py

.glb-File-Agnostic & Fighter-Agnostic Super Smash Bros. Melee (GALE01 v1.02)
Character Auto-Rigger, Proportion-Preserving Skeleton Retargeting Compiler,
and HAL SysDolphin Pl<XX>Nr.dat Binary Archive Generator (Functional Specification 063).

Invariants enforced:
- INV-MELEE-STANDALONE-02: Scoped strictly to /melee/ and scripts/.
- INV-NO-REASSEMBLE-02: Consumes Stage 4 assembled character_full.glb from GCS or local cache.
- INV-SKELETON-ONLY-01: Zero costume-slot selection; redirects all costume FST entries for <XX>.
- INV-DOUBLE-AGNOSTIC-01: Zero hardcoded assumptions on input .glb or fighter bone indices.
- INV-PROPORTION-PRESERVE-01: Uniform stature scaling + pure SO(3) limb rotation alignment;
  rigid 1.0 cranial weighting on centerline-verified HeadN.
- INV-GX-10ENV-01: At most 10 unique HSD_EnvelopeDesc entries per HSD_PObjDesc batch.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, List, Optional, Sequence, Tuple

try:
    import cv2
    import numpy as np
except ImportError:
    if __name__ == "__main__":
        for cand_py in ("/opt/anaconda3/bin/python3", "/opt/anaconda3/envs/greek_env/bin/python"):
            if os.path.isfile(cand_py) and os.path.abspath(sys.executable) != os.path.abspath(cand_py):
                os.execv(cand_py, [cand_py] + sys.argv)
    cv2 = None  # type: ignore
    np = None  # type: ignore

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from gcs_rig_intake import (
    DEFAULT_GCS_BUCKET,
    _atomic_write_json,
    _exclusive_file_lock,
    _has_direct_gcs,
    download_gcs_object,
    resolve_gcs_credentials_file,
    resolve_player_identity,
    sha256_file,
    upload_gcs_object,
)

MELEE_ISO_PATH = os.path.join(REPO_ROOT, "melee", "game.iso")
MELEE_RIGGED_ROOT = os.path.join(REPO_ROOT, "melee", "rigged")
BLENDER_BIN = "/Applications/Blender.app/Contents/MacOS/Blender"

# Authoritative 26 playable fighters in Super Smash Bros. Melee (GALE01 v1.02)
FIGHTER_CATALOG: List[Dict[str, Any]] = [
    {"code": "Mr", "name": "Mario", "ftkind": 0, "root_symbol": "PlyMario5K_Share_joint"},
    {"code": "Fx", "name": "Fox", "ftkind": 1, "root_symbol": "PlyFox5K_Share_joint"},
    {"code": "Ca", "name": "Captain Falcon", "ftkind": 2, "root_symbol": "PlyCaptain5K_Share_joint"},
    {"code": "Dk", "name": "Donkey Kong", "ftkind": 3, "root_symbol": "PlyDonkey5K_Share_joint"},
    {"code": "Kb", "name": "Kirby", "ftkind": 4, "root_symbol": "PlyKirby5K_Share_joint"},
    {"code": "Kp", "name": "Bowser", "ftkind": 5, "root_symbol": "PlyKoopa5K_Share_joint"},
    {"code": "Lk", "name": "Link", "ftkind": 6, "root_symbol": "PlyLink5K_Share_joint"},
    {"code": "Sk", "name": "Sheik", "ftkind": 7, "root_symbol": "PlySeak5K_Share_joint"},
    {"code": "Ns", "name": "Ness", "ftkind": 8, "root_symbol": "PlyNess5K_Share_joint"},
    {"code": "Pe", "name": "Peach", "ftkind": 9, "root_symbol": "PlyPeach5K_Share_joint"},
    {"code": "Pp", "name": "Ice Climbers", "ftkind": 10, "root_symbol": "PlyPopo5K_Share_joint"},
    {"code": "Pk", "name": "Pikachu", "ftkind": 12, "root_symbol": "PlyPikachu5K_Share_joint"},
    {"code": "Ss", "name": "Samus", "ftkind": 13, "root_symbol": "PlySamus5K_Share_joint"},
    {"code": "Ys", "name": "Yoshi", "ftkind": 14, "root_symbol": "PlyYoshi5K_Share_joint"},
    {"code": "Pr", "name": "Jigglypuff", "ftkind": 15, "root_symbol": "PlyPurin5K_Share_joint"},
    {"code": "Mt", "name": "Mewtwo", "ftkind": 16, "root_symbol": "PlyMewtwo5K_Share_joint"},
    {"code": "Lg", "name": "Luigi", "ftkind": 17, "root_symbol": "PlyLuigi5K_Share_joint"},
    {"code": "Ms", "name": "Marth", "ftkind": 18, "root_symbol": "PlyMars5K_Share_joint"},
    {"code": "Zd", "name": "Zelda", "ftkind": 19, "root_symbol": "PlyZelda5K_Share_joint"},
    {"code": "Cl", "name": "Young Link", "ftkind": 20, "root_symbol": "PlyClink5K_Share_joint"},
    {"code": "Dr", "name": "Dr. Mario", "ftkind": 21, "root_symbol": "PlyDrmario5K_Share_joint"},
    {"code": "Fc", "name": "Falco", "ftkind": 22, "root_symbol": "PlyFalco5K_Share_joint"},
    {"code": "Pc", "name": "Pichu", "ftkind": 23, "root_symbol": "PlyPichu5K_Share_joint"},
    {"code": "Gw", "name": "Mr. Game & Watch", "ftkind": 24, "root_symbol": "PlyGamewatch5K_Share_joint"},
    {"code": "Gn", "name": "Ganondorf", "ftkind": 25, "root_symbol": "PlyGanon5K_Share_joint"},
    {"code": "Fe", "name": "Roy", "ftkind": 26, "root_symbol": "PlyEmblem5K_Share_joint"},
]
FIGHTER_BY_CODE: Dict[str, Dict[str, Any]] = {f["code"].lower(): f for f in FIGHTER_CATALOG}

# Empirical VFX-cleaned 1-piece physical & skeletal ground-truth catalog across all 26 playable fighters
# (Functional Specification 043 Section 3; Ca:DObj 19 and Pc:DObjs 7..10 excluded; Nn aliases Pp).
MELEE_FIGHTER_PROPORTIONS_043: Dict[str, Dict[str, Any]] = {
    "Mr": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.28, "y_sh": 7.92, "h_sh": 8.20, "y_collar": 8.29, "y_crown": 14.03, "x_sh": 1.93},
    "Lg": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.16, "y_sh": 7.92, "h_sh": 8.08, "y_collar": 8.29, "y_crown": 13.94, "x_sh": 1.93},
    "Dr": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.28, "y_sh": 7.92, "h_sh": 8.20, "y_collar": 8.29, "y_crown": 13.78, "x_sh": 1.93},
    "Pe": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": 0.00, "y_sh": 11.97, "h_sh": 11.97, "y_collar": 12.65, "y_crown": 16.58, "x_sh": 1.36},
    "Kp": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": 0.07, "y_sh": 29.22, "h_sh": 29.15, "y_collar": 29.32, "y_crown": 41.90, "x_sh": 7.45},
    "Ys": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": -0.86, "y_sh": 6.66, "h_sh": 7.52, "y_collar": 6.96, "y_crown": 16.16, "x_sh": 1.59},
    "Dk": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": -0.01, "y_sh": 21.51, "h_sh": 21.52, "y_collar": 21.80, "y_crown": 31.19, "x_sh": 4.89},
    "Ca": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": 0.00, "y_sh": 17.81, "h_sh": 17.81, "y_collar": 18.66, "y_crown": 22.05, "x_sh": 2.90},
    "Gn": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.22, "y_sh": 17.81, "h_sh": 18.03, "y_collar": 18.34, "y_crown": 22.04, "x_sh": 2.90},
    "Fc": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.02, "y_sh": 10.39, "h_sh": 10.41, "y_collar": 11.10, "y_crown": 17.76, "x_sh": 2.18},
    "Fx": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.03, "y_sh": 10.39, "h_sh": 10.42, "y_collar": 11.10, "y_crown": 17.17, "x_sh": 2.58},
    "Ns": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.25, "y_sh": 6.97, "h_sh": 7.22, "y_collar": 7.45, "y_crown": 14.21, "x_sh": 1.88},
    "Pp": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": -0.39, "y_sh": 5.71, "h_sh": 6.10, "y_collar": 6.23, "y_crown": 12.00, "x_sh": 2.33},
    "Nn": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": -0.39, "y_sh": 5.71, "h_sh": 6.10, "y_collar": 6.23, "y_crown": 12.00, "x_sh": 2.33},
    "Kb": {"mode": "1p_sphere", "bind_pose": "apose", "y_sole": 0.00, "y_sh": 6.80, "h_sh": 10.57, "y_collar": None, "y_crown": 10.57, "x_sh": 4.40},
    "Ss": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.10, "y_sh": 17.80, "h_sh": 17.90, "y_collar": 18.55, "y_crown": 21.25, "x_sh": 2.90},
    "Zd": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": 0.00, "y_sh": 11.97, "h_sh": 11.97, "y_collar": 12.65, "y_crown": 15.26, "x_sh": 1.36},
    "Sk": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.03, "y_sh": 10.94, "h_sh": 10.97, "y_collar": 11.62, "y_crown": 14.14, "x_sh": 1.77},
    "Lk": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": 0.01, "y_sh": 12.13, "h_sh": 12.12, "y_collar": 12.60, "y_crown": 16.00, "x_sh": 1.97},
    "Cl": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.01, "y_sh": 12.15, "h_sh": 12.16, "y_collar": 12.64, "y_crown": 16.85, "x_sh": 2.04},
    "Pc": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": -0.11, "y_sh": 7.29, "h_sh": 7.40, "y_collar": 8.70, "y_crown": 18.31, "x_sh": 2.72},
    "Pk": {"mode": "1p_biped", "bind_pose": "apose", "y_sole": -2.16, "y_sh": 5.94, "h_sh": 8.10, "y_collar": 8.00, "y_crown": 12.88, "x_sh": 2.70},
    "Pr": {"mode": "1p_sphere", "bind_pose": "apose", "y_sole": -0.02, "y_sh": 5.00, "h_sh": 11.35, "y_collar": None, "y_crown": 11.33, "x_sh": 4.10},
    "Mt": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.05, "y_sh": 13.56, "h_sh": 13.61, "y_collar": 13.81, "y_crown": 21.73, "x_sh": 1.97},
    "Gw": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": -0.01, "y_sh": 8.18, "h_sh": 8.19, "y_collar": 8.60, "y_crown": 14.86, "x_sh": 0.63},
    "Ms": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": 0.00, "y_sh": 13.36, "h_sh": 13.36, "y_collar": 13.43, "y_crown": 17.00, "x_sh": 1.86},
    "Fe": {"mode": "1p_biped", "bind_pose": "tpose", "y_sole": 0.00, "y_sh": 13.36, "h_sh": 13.36, "y_collar": 13.43, "y_crown": 17.62, "x_sh": 1.86},
}


def _align32(n: int) -> int:
    return (n + 31) & ~31


def _align4(n: int) -> int:
    return (n + 3) & ~3


# ==============================================================================
# Stage 1 — GCS Character Discovery, Retrieval, Decimation & RGB5A3 Atlas Baking
# ==============================================================================

def list_available_gcs_characters(
    gcs_bucket: str = DEFAULT_GCS_BUCKET,
    credentials_path: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Lists all available Stage 4 assembled character_full.glb runs from GCS
    (gs://<bucket>/players/{player_folder}/runs/{run_id}/03_meshes/assembled/character_full.glb)
    merged with any locally cached runs in melee/rigged/ or /Users/diesel/Desktop/Greek/outputs/.
    """
    found: Dict[str, Dict[str, Any]] = {}
    cred = resolve_gcs_credentials_file(credentials_path)
    if cred and _has_direct_gcs():
        try:
            from google.cloud import storage
            client = storage.Client.from_service_account_json(cred)
            bucket = client.bucket(gcs_bucket.replace("gs://", "").strip("/"))
            for blob in bucket.list_blobs(prefix="players/"):
                if blob.name.endswith("/03_meshes/assembled/character_full.glb") and (blob.size or 0) > 0:
                    parts = blob.name.split("/")
                    if len(parts) >= 6 and parts[0] == "players" and parts[2] == "runs":
                        p_folder = parts[1]
                        r_id = parts[3]
                        key = f"{p_folder}/{r_id}"
                        found[key] = {
                            "key": key,
                            "player_folder": p_folder,
                            "run_id": r_id,
                            "label": f"{p_folder} ({r_id})",
                            "gcs_uri": f"gs://{bucket.name}/{blob.name}",
                            "size_bytes": int(blob.size or 0),
                            "source": "gcs",
                        }
        except Exception:
            pass

    # Check locally cached melee/rigged/<player_folder>/<run_id>/input/character_full.glb
    if os.path.isdir(MELEE_RIGGED_ROOT):
        for p_folder in sorted(os.listdir(MELEE_RIGGED_ROOT)):
            p_dir = os.path.join(MELEE_RIGGED_ROOT, p_folder)
            if not os.path.isdir(p_dir):
                continue
            for r_id in sorted(os.listdir(p_dir)):
                cand_glb = os.path.join(p_dir, r_id, "input", "character_full.glb")
                if os.path.isfile(cand_glb) and os.path.getsize(cand_glb) > 1024:
                    key = f"{p_folder}/{r_id}"
                    if key not in found:
                        found[key] = {
                            "key": key,
                            "player_folder": p_folder,
                            "run_id": r_id,
                            "label": f"{p_folder} ({r_id})",
                            "local_path": cand_glb,
                            "size_bytes": os.path.getsize(cand_glb),
                            "source": "local_cache",
                        }
                    else:
                        found[key]["local_path"] = cand_glb

    # Always include nicotest_nt01/run_01 if local Greek output exists
    greek_nico = "/Users/diesel/Desktop/Greek/outputs/nicotest_run_01/meshes/assembled/character_full.glb"
    if os.path.isfile(greek_nico) and "nicotest_nt01/run_01" not in found:
        found["nicotest_nt01/run_01"] = {
            "key": "nicotest_nt01/run_01",
            "player_folder": "nicotest_nt01",
            "run_id": "run_01",
            "label": "nicotest_nt01 (run_01)",
            "local_path": greek_nico,
            "size_bytes": os.path.getsize(greek_nico),
            "source": "local_greek",
        }

    return list(found.values())


def resolve_and_cache_input_glb(
    player_folder: str = "nico_nico01",
    run_id: str = "step3_1piece_01",
    glb_path: Optional[str] = None,
    gcs_bucket: str = DEFAULT_GCS_BUCKET,
    credentials_path: Optional[str] = None,
    preferred_pose: Optional[str] = None,
    fighter_code: Optional[str] = None,
    output_run_id: Optional[str] = None,
    output_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fail-fast fighter-isolated 1-piece `.glb` intake (Functional Specification 043 §4.4.1,
    INV-1MAT-256-ATLAS-01).
    Resolves the requested fighter's clean single-material 1-piece `character_full.glb`
    into `melee/rigged/{player_folder}/{output_run_id}/input/{XX}/character_full.glb`
    (from explicit `glb_path` or `runs/{run_id}/03_meshes/assembled/character_full.glb`),
    raising an immediate `FileNotFoundError` if absent (zero silent fallback `.glb`
    substitution and zero `assembly_telemetry.json` coupling).
    """
    norm_pose = str(preferred_pose or "").strip().lower()
    if norm_pose not in ("apose", "tpose"):
        norm_pose = None

    clean_folder = str(player_folder or "nico_nico01").strip().strip("/")
    clean_run = str(run_id or "step3_1piece_01").strip().strip("/")
    eff_out_run = str(output_run_id or clean_run).strip().strip("/")
    run_cache_dir = (
        os.path.abspath(output_dir)
        if output_dir
        else os.path.join(MELEE_RIGGED_ROOT, clean_folder, eff_out_run)
    )
    clean_code = ""
    if fighter_code:
        rc = str(fighter_code).strip()
        clean_code = (rc[0].upper() + rc[1:].lower()) if len(rc) >= 2 else rc.upper()
    input_dir = (
        os.path.join(run_cache_dir, "input", clean_code)
        if clean_code
        else os.path.join(run_cache_dir, "input")
    )
    os.makedirs(input_dir, exist_ok=True)
    local_glb = os.path.join(input_dir, "character_full.glb")

    if glb_path is not None:
        abs_glb_in = os.path.abspath(glb_path)
        if not (os.path.isfile(abs_glb_in) and os.path.getsize(abs_glb_in) > 1024):
            raise FileNotFoundError(
                f"Fatal [INV-1MAT-256-ATLAS-01]: Explicit 1-piece glb_path not found or empty for "
                f"fighter '{clean_code or '?'}': {abs_glb_in}"
            )
        if os.path.abspath(abs_glb_in) != os.path.abspath(local_glb):
            shutil.copy2(abs_glb_in, local_glb)
    elif not (os.path.isfile(local_glb) and os.path.getsize(local_glb) > 1024):
        obj_key = f"players/{clean_folder}/runs/{clean_run}/03_meshes/assembled/character_full.glb"
        download_gcs_object(
            bucket_name=gcs_bucket,
            object_key=obj_key,
            local_dest=local_glb,
            credentials_path=credentials_path,
            required=True,
        )

    if not (os.path.isfile(local_glb) and os.path.getsize(local_glb) > 1024):
        raise FileNotFoundError(
            f"Fatal [INV-1MAT-256-ATLAS-01]: Missing 1-piece character_full.glb for "
            f"{clean_folder}/{clean_run} (fighter='{clean_code or '?'}') at {local_glb}"
        )

    with open(local_glb, "rb") as f:
        hdr = f.read(12)
    if len(hdr) < 12 or hdr[:4] != b"glTF":
        raise ValueError(f"Fatal [INV-1MAT-256-ATLAS-01]: Invalid glTF binary header in {local_glb}")

    glb_sha256 = sha256_file(local_glb)
    return {
        "player_folder": clean_folder,
        "run_id": clean_run,
        "output_run_id": eff_out_run,
        "run_cache_dir": run_cache_dir,
        "input_dir": input_dir,
        "local_glb": local_glb,
        "resolved_pose": norm_pose or "full",
        "source_sha256": glb_sha256,
        "size_bytes": os.path.getsize(local_glb),
    }


def _parse_glb_chunks(glb_path: str) -> Tuple[Dict[str, Any], bytes]:
    with open(glb_path, "rb") as f:
        glb = f.read()
    magic, version, _ = struct.unpack_from("<III", glb, 0)
    if magic != 0x46546C67 or version != 2:
        raise ValueError(f"Invalid glTF 2.0 header in {glb_path}")
    j_len, _ = struct.unpack_from("<II", glb, 12)
    gltf = json.loads(glb[20 : 20 + j_len].decode("utf-8"))
    b_off = 20 + j_len
    bin_buf = b""
    if b_off + 8 <= len(glb):
        b_len, _ = struct.unpack_from("<II", glb, b_off)
        bin_buf = glb[b_off + 8 : b_off + 8 + b_len]
    return gltf, bin_buf


def _decode_glb_image_rgba(gltf: Dict[str, Any], bin_buf: bytes, img_idx: int) -> Optional[np.ndarray]:
    images = gltf.get("images") or []
    if not (0 <= img_idx < len(images)):
        return None
    img_meta = images[img_idx]
    if "bufferView" not in img_meta:
        return None
    bv = gltf["bufferViews"][img_meta["bufferView"]]
    off = int(bv.get("byteOffset", 0))
    raw_bytes = bin_buf[off : off + int(bv["byteLength"])]
    bgra = cv2.imdecode(np.frombuffer(raw_bytes, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if bgra is None:
        return None
    if bgra.ndim == 2:
        rgb = cv2.cvtColor(bgra, cv2.COLOR_GRAY2RGB)
        a = np.full((bgra.shape[0], bgra.shape[1], 1), 255, dtype=np.uint8)
        return np.concatenate([rgb, a], axis=-1)
    if bgra.shape[2] == 3:
        rgb = cv2.cvtColor(bgra, cv2.COLOR_BGR2RGB)
        a = np.full((bgra.shape[0], bgra.shape[1], 1), 255, dtype=np.uint8)
        return np.concatenate([rgb, a], axis=-1)
    return cv2.cvtColor(bgra, cv2.COLOR_BGRA2RGBA)


def build_512_rgb5a3_atlas(
    gltf: Dict[str, Any],
    bin_buf: bytes,
    atlas_size: int = 256,
) -> Tuple[np.ndarray, bytes, Dict[int, Tuple[float, float, float, float]]]:
    """
    Single-material 1-piece full-square RGBA -> GameCube GX_TF_RGB5A3 baker
    (Functional Specification 043 §4.4.1, INV-1MAT-256-ATLAS-01).
    Dedicates 100% of the dim x dim (256x256 -> 131,072-byte) opaque 0x8000 RGB555
    square texture atlas to the 1-piece .glb's single PBR baseColorTexture
    (u_offset=0.0, u_scale=1.0, v_offset=0.0, v_scale=1.0; zero 2-material squish)
    and fails fast on untextured clay or legacy multi-material split meshes.
    """
    materials = gltf.get("materials") or []
    textures = gltf.get("textures") or []
    images = gltf.get("images") or []
    meshes = gltf.get("meshes") or []

    active_mat_indices: List[int] = []
    for mesh_def in meshes:
        for prim in (mesh_def.get("primitives") or []):
            m_idx = prim.get("material")
            if m_idx is not None and 0 <= int(m_idx) < len(materials):
                if int(m_idx) not in active_mat_indices:
                    active_mat_indices.append(int(m_idx))
    if not active_mat_indices and materials:
        active_mat_indices = list(range(len(materials)))

    decoded_by_img_src: Dict[int, np.ndarray] = {}
    mat_to_src: Dict[int, int] = {}
    for m_idx in active_mat_indices:
        mat = materials[m_idx]
        pbr = mat.get("pbrMetallicRoughness") or {}
        bct = pbr.get("baseColorTexture")
        if isinstance(bct, dict) and "index" in bct:
            t_idx = int(bct["index"])
            if 0 <= t_idx < len(textures):
                src_idx = textures[t_idx].get("source")
                if src_idx is not None:
                    s_i = int(src_idx)
                    if s_i not in decoded_by_img_src:
                        tile = _decode_glb_image_rgba(gltf, bin_buf, s_i)
                        if tile is not None:
                            decoded_by_img_src[s_i] = tile
                    if s_i in decoded_by_img_src:
                        mat_to_src[m_idx] = s_i

    if not decoded_by_img_src and len(images) == 1:
        only_tile = _decode_glb_image_rgba(gltf, bin_buf, 0)
        if only_tile is not None:
            decoded_by_img_src[0] = only_tile
            mat_to_src[0] = 0

    if len(decoded_by_img_src) == 0:
        raise ValueError(
            "Fatal [INV-1MAT-256-ATLAS-01]: Input 1-piece .glb lacks a valid embedded PBR "
            "baseColorTexture (untextured clay / missing texture rejected)."
        )
    if len(decoded_by_img_src) > 1 or len(active_mat_indices) > 1:
        raise ValueError(
            f"Fatal [INV-1MAT-256-ATLAS-01]: Expected single-material 1-piece .glb, found "
            f"{len(active_mat_indices)} active material(s) and {len(decoded_by_img_src)} texture image(s)."
        )

    single_tile = next(iter(decoded_by_img_src.values()))
    dim = int(atlas_size)
    atlas_rgba = np.zeros((dim, dim, 4), dtype=np.uint8)
    interp = cv2.INTER_AREA if (single_tile.shape[0] >= dim and single_tile.shape[1] >= dim) else cv2.INTER_LINEAR
    atlas_rgba[:, :, :] = cv2.resize(single_tile, (dim, dim), interpolation=interp)

    uv_transforms: Dict[int, Tuple[float, float, float, float]] = {0: (0.0, 1.0, 0.0, 1.0)}
    for m_idx in active_mat_indices:
        uv_transforms[int(m_idx)] = (0.0, 1.0, 0.0, 1.0)

    # Encode dim x dim RGBA into GameCube GX_TF_RGB5A3 (4x4 pixel tiles, big-endian u16)
    # Force 100% opaque RGB555 (top bit 0x8000 set on every texel) so zero pixels can ever be see-through in-game.
    r = atlas_rgba[:, :, 0].astype(np.uint16)
    g = atlas_rgba[:, :, 1].astype(np.uint16)
    b = atlas_rgba[:, :, 2].astype(np.uint16)
    atlas_rgba[:, :, 3] = 255

    u16_opaque = 0x8000 | ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    pixels_u16 = u16_opaque.astype(">u2")

    # Tile into 4x4 blocks: (dim//4, 4, dim//4, 4) -> transpose(0, 2, 1, 3)
    n_tiles = dim // 4
    tiled_u16 = pixels_u16.reshape(n_tiles, 4, n_tiles, 4).transpose(0, 2, 1, 3).copy()
    gx_bytes = tiled_u16.tobytes()
    expected_bytes = dim * dim * 2
    assert len(gx_bytes) == expected_bytes, f"Expected {expected_bytes} bytes for {dim}x{dim} RGB5A3, got {len(gx_bytes)}"
    return atlas_rgba, gx_bytes, uv_transforms


def extract_and_decimate_stage1(
    glb_path: str,
    source_sha256: str,
    cache_dir: str,
    target_tris: int = 2500,
    atlas_size: int = 256,
) -> Dict[str, Any]:
    """
    Stage 1 (Functional Specification 043 §4.4.1):
    Decimates single-material 1-piece input .glb to ~target_tris triangles (topology-first
    without locking internal xatlas UV seams), runs post-decimation watertight/UV/normal
    repair via pre-decimation BVHTree projection, normalizes to canonical +Y-up, +Z-forward,
    2.000m stature (Y_min = 0.0), maps UVs 1:1 onto the full un-squished 256x256 opaque
    GX_TF_RGB5A3 square atlas, and caches keyed by source_sha256.
    """
    cache_suffix = f"_{int(atlas_size)}_1p_v4"
    cache_npz = os.path.join(cache_dir, f"stage1_norm_{source_sha256[:16]}_{target_tris}{cache_suffix}.npz")
    if os.path.isfile(cache_npz):
        try:
            data = np.load(cache_npz, allow_pickle=False)
            return {
                "positions": data["positions"].astype(np.float32),
                "normals": data["normals"].astype(np.float32),
                "uvs": data["uvs"].astype(np.float32),
                "triangles": data["triangles"].astype(np.int32),
                "atlas_rgba": data["atlas_rgba"].astype(np.uint8),
                "gx_rgb5a3_bytes": data["gx_rgb5a3"].tobytes(),
                "original_triangles": int(data["original_triangles"][0]),
            }
        except Exception:
            pass

    gltf, bin_buf = _parse_glb_chunks(glb_path)
    atlas_rgba, gx_rgb5a3_bytes, uv_transforms = build_512_rgb5a3_atlas(gltf, bin_buf, atlas_size=atlas_size)

    with tempfile.NamedTemporaryFile(suffix=".npz", delete=False) as tmp:
        out_npz = tmp.name

    blender_code = f"""
import bpy, bmesh, mathutils
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
import numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath={glb_path!r})
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    raise RuntimeError('No mesh objects found in GLB')

bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bm = bmesh.new()
bm.from_mesh(obj.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.triangulate(bm, faces=bm.faces)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(obj.data)
bm.free()

# Build per-material high-poly BVHTrees + UV lookup tables before decimation
# so any decimated triangle that crosses an xatlas UV seam can recover exact UVs
hp_mesh = obj.data
hp_uv_layer = hp_mesh.uv_layers.active.data if hp_mesh.uv_layers.active is not None else None
hp_verts = [v.co.copy() for v in hp_mesh.vertices]
mat_bvhs = {{}}
mat_face_data = {{}}

if hp_uv_layer is not None:
    by_mat_polys = {{}}
    for poly in hp_mesh.polygons:
        if len(poly.loop_indices) != 3:
            continue
        m_id = int(poly.material_index)
        by_mat_polys.setdefault(m_id, []).append(poly)
    for m_id, m_polys in by_mat_polys.items():
        f_tris = []
        f_uvs = []
        for poly in m_polys:
            l0, l1, l2 = poly.loop_indices
            v0, v1, v2 = hp_mesh.loops[l0].vertex_index, hp_mesh.loops[l1].vertex_index, hp_mesh.loops[l2].vertex_index
            f_tris.append((v0, v1, v2))
            f_uvs.append((
                mathutils.Vector((float(hp_uv_layer[l0].uv[0]), float(hp_uv_layer[l0].uv[1]), 0.0)),
                mathutils.Vector((float(hp_uv_layer[l1].uv[0]), float(hp_uv_layer[l1].uv[1]), 0.0)),
                mathutils.Vector((float(hp_uv_layer[l2].uv[0]), float(hp_uv_layer[l2].uv[1]), 0.0)),
            ))
        if f_tris:
            mat_bvhs[m_id] = BVHTree.FromPolygons(hp_verts, f_tris)
            mat_face_data[m_id] = (f_tris, f_uvs)

orig_tris = max(1, len(obj.data.polygons))
target = {int(target_tris)}
if orig_tris > max(target + 300, int(target * 1.15)):
    eff_ratio = min(1.0, max(0.02, float(target) / float(orig_tris)))
    mod = obj.modifiers.new(name='Dec', type='DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = eff_ratio
    # Delimit by MATERIAL only so xatlas UV island seams do not lock edges or create skinny/spiky triangles
    mod.delimit = {{'MATERIAL'}}
    dg = bpy.context.evaluated_depsgraph_get()
    em = obj.evaluated_get(dg).to_mesh()
else:
    em = obj.data

# Post-decimation watertight & outward-normal repair pass
bm2 = bmesh.new()
bm2.from_mesh(em)
bmesh.ops.remove_doubles(bm2, verts=bm2.verts, dist=1e-4)
boundary_edges = [e for e in bm2.edges if e.is_boundary]
if boundary_edges:
    try:
        bmesh.ops.holes_fill(bm2, edges=boundary_edges, sides=8)
    except Exception:
        pass
bmesh.ops.triangulate(bm2, faces=bm2.faces)
bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces)
bm2.to_mesh(em)
bm2.free()

has_uv = em.uv_layers.active is not None
uv_layer = em.uv_layers.active.data if has_uv else None
vert_map = {{}}
positions = []
normals = []
uvs = []
mat_ids = []
triangles = []

for poly in em.polygons:
    if len(poly.loop_indices) != 3:
        continue
    m_id = int(poly.material_index)
    l0, l1, l2 = poly.loop_indices
    vi0, vi1, vi2 = em.loops[l0].vertex_index, em.loops[l1].vertex_index, em.loops[l2].vertex_index
    co0, co1, co2 = em.vertices[vi0].co, em.vertices[vi1].co, em.vertices[vi2].co

    if uv_layer is not None:
        uv0 = (float(uv_layer[l0].uv[0]), float(uv_layer[l0].uv[1]))
        uv1 = (float(uv_layer[l1].uv[0]), float(uv_layer[l1].uv[1]))
        uv2 = (float(uv_layer[l2].uv[0]), float(uv_layer[l2].uv[1]))
        max_duv = max(
            abs(uv0[0] - uv1[0]), abs(uv0[1] - uv1[1]),
            abs(uv1[0] - uv2[0]), abs(uv1[1] - uv2[1]),
            abs(uv2[0] - uv0[0]), abs(uv2[1] - uv0[1]),
        )
        # If this decimated triangle crossed an xatlas UV island seam, project onto the high-poly BVHTree
        if max_duv > 0.14 and m_id in mat_bvhs:
            bvh = mat_bvhs[m_id]
            f_tris, f_uvs = mat_face_data[m_id]
            centroid = (co0 + co1 + co2) / 3.0
            loc_c, _, f_idx, _ = bvh.find_nearest(centroid)
            if f_idx is not None:
                tv0, tv1, tv2 = f_tris[f_idx]
                p_a, p_b, p_c = hp_verts[tv0], hp_verts[tv1], hp_verts[tv2]
                u_a, u_b, u_c = f_uvs[f_idx]
                repaired_uvs = []
                for co_v in (co0, co1, co2):
                    pt_q = centroid * 0.25 + co_v * 0.75
                    loc_v, _, fi_v, _ = bvh.find_nearest(pt_q)
                    # Stay on the same UV island as centroid if close in UV space
                    if fi_v is not None:
                        va, vb, vc = f_tris[fi_v]
                        ua, ub, uc = f_uvs[fi_v]
                        uv_cand = barycentric_transform(loc_v, hp_verts[va], hp_verts[vb], hp_verts[vc], ua, ub, uc)
                        uv_cent = barycentric_transform(loc_c, p_a, p_b, p_c, u_a, u_b, u_c)
                        if (uv_cand - uv_cent).length <= 0.16:
                            repaired_uvs.append((float(np.clip(uv_cand.x, 0.001, 0.999)), float(np.clip(uv_cand.y, 0.001, 0.999))))
                            continue
                    uv_fb = barycentric_transform(co_v, p_a, p_b, p_c, u_a, u_b, u_c)
                    repaired_uvs.append((float(np.clip(uv_fb.x, 0.001, 0.999)), float(np.clip(uv_fb.y, 0.001, 0.999))))
                uv0, uv1, uv2 = repaired_uvs
        loop_uvs = (uv0, uv1, uv2)
    else:
        loop_uvs = ((0.5, 0.5), (0.5, 0.5), (0.5, 0.5))

    tri_idx = []
    for v_idx, (u_raw, v_raw) in zip((vi0, vi1, vi2), loop_uvs):
        u_g = float(u_raw)
        v_g = float(1.0 - v_raw)
        key = (v_idx, m_id, round(u_g, 3), round(v_g, 3))
        out_vi = vert_map.get(key)
        if out_vi is None:
            out_vi = len(positions)
            vert_map[key] = out_vi
            v = em.vertices[v_idx]
            # Convert Blender (X, -Z_gltf, Y_gltf) back to glTF (+X right, +Y up, +Z forward)
            positions.append([float(v.co.x), float(v.co.z), float(-v.co.y)])
            normals.append([float(v.normal.x), float(v.normal.z), float(-v.normal.y)])
            uvs.append([u_g, v_g])
            mat_ids.append(m_id)
        tri_idx.append(out_vi)
    if len(tri_idx) == 3 and len({{tri_idx[0], tri_idx[1], tri_idx[2]}}) == 3:
        triangles.append(tri_idx)

np.savez(
    {out_npz!r},
    positions=np.array(positions, dtype=np.float32),
    normals=np.array(normals, dtype=np.float32),
    uvs=np.array(uvs, dtype=np.float32),
    mat_ids=np.array(mat_ids, dtype=np.int32),
    triangles=np.array(triangles, dtype=np.int32),
    orig_tris=np.array([orig_tris], dtype=np.int32),
)
"""
    try:
        subprocess.run(
            [BLENDER_BIN, "-b", "--factory-startup", "--python-expr", blender_code],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        raw = np.load(out_npz, allow_pickle=False)
        positions = raw["positions"].astype(np.float32)
        normals = raw["normals"].astype(np.float32)
        uvs = raw["uvs"].astype(np.float32)
        mat_ids = raw["mat_ids"].astype(np.int32)
        triangles = raw["triangles"].astype(np.int32)
        orig_tris = int(raw["orig_tris"][0])
    finally:
        if os.path.exists(out_npz):
            try:
                os.remove(out_npz)
            except OSError:
                pass

    # Auto-detect upright axis if input GLB was Z-up instead of Y-up
    spans = positions.max(axis=0) - positions.min(axis=0)
    if spans[2] > spans[1] * 1.35:
        # Z-up -> rotate to Y-up
        positions = np.stack([positions[:, 0], positions[:, 2], -positions[:, 1]], axis=-1)
        normals = np.stack([normals[:, 0], normals[:, 2], -normals[:, 1]], axis=-1)

    # Normalize to canonical 2.000m height, grounded at Y_min = 0.0, laterally centered
    y_min = float(positions[:, 1].min())
    y_max = float(positions[:, 1].max())
    h_raw = max(1e-5, y_max - y_min)
    scale_2m = 2.000 / h_raw
    positions[:, 1] = (positions[:, 1] - y_min) * scale_2m
    x_mid = 0.5 * float(positions[:, 0].min() + positions[:, 0].max())
    z_mid = 0.5 * float(positions[:, 2].min() + positions[:, 2].max())
    positions[:, 0] = (positions[:, 0] - x_mid) * scale_2m
    positions[:, 2] = (positions[:, 2] - z_mid) * scale_2m

    n_len = np.linalg.norm(normals, axis=-1, keepdims=True)
    normals = np.where(n_len > 1e-8, normals / np.maximum(n_len, 1e-8), np.array([0.0, 0.0, 1.0], dtype=np.float32))

    # Map UVs 1:1 onto the full un-squished square atlas (INV-1MAT-256-ATLAS-01)
    remapped_uvs = np.empty_like(uvs)
    for i in range(len(uvs)):
        m_idx = int(mat_ids[i])
        u_off, u_sc, v_off, v_sc = uv_transforms.get(m_idx, uv_transforms.get(0, (0.0, 1.0, 0.0, 1.0)))
        u_wrapped = float(uvs[i, 0]) % 1.0
        v_wrapped = float(uvs[i, 1]) % 1.0
        remapped_uvs[i, 0] = np.clip(u_off + u_wrapped * u_sc, 0.001, 0.999)
        remapped_uvs[i, 1] = np.clip(v_off + v_wrapped * v_sc, 0.001, 0.999)

    np.savez(
        cache_npz,
        positions=positions,
        normals=normals,
        uvs=remapped_uvs,
        triangles=triangles,
        atlas_rgba=atlas_rgba,
        gx_rgb5a3=np.frombuffer(gx_rgb5a3_bytes, dtype=np.uint8),
        original_triangles=np.array([orig_tris], dtype=np.int32),
    )

    return {
        "positions": positions,
        "normals": normals,
        "uvs": remapped_uvs,
        "triangles": triangles,
        "atlas_rgba": atlas_rgba,
        "gx_rgb5a3_bytes": gx_rgb5a3_bytes,
        "original_triangles": orig_tris,
    }


# ==============================================================================
# Stage 2 — Fighter-Agnostic Skeleton Extraction (PlCo.dat + Pl<XX>Nr.dat)
# ==============================================================================

def _euler_xyz_to_mat4(
    rx: float, ry: float, rz: float,
    sx: float, sy: float, sz: float,
    tx: float, ty: float, tz: float,
) -> np.ndarray:
    cx, sx_ = math.cos(rx), math.sin(rx)
    cy, sy_ = math.cos(ry), math.sin(ry)
    cz, sz_ = math.cos(rz), math.sin(rz)
    m = np.eye(4, dtype=np.float64)
    m[0, 0] = cy * cz * sx
    m[0, 1] = (cz * sx_ * sy_ - cx * sz_) * sy
    m[0, 2] = (cx * cz * sy_ + sx_ * sz_) * sz
    m[0, 3] = tx
    m[1, 0] = cy * sz_ * sx
    m[1, 1] = (cx * cz + sx_ * sy_ * sz_) * sy
    m[1, 2] = (-cz * sx_ + cx * sy_ * sz_) * sz
    m[1, 3] = ty
    m[2, 0] = -sy_ * sx
    m[2, 1] = cy * sx_ * sy
    m[2, 2] = cx * cy * sz
    m[2, 3] = tz
    return m


def parse_iso_fst(iso_path: str = MELEE_ISO_PATH) -> Dict[str, Tuple[int, int, int]]:
    if not os.path.isfile(iso_path):
        import provision_melee
        provision_melee.provision_melee(worktree_root=REPO_ROOT)
    with open(iso_path, "rb") as f:
        f.seek(0x424)
        fst_off, fst_size = struct.unpack(">II", f.read(8))
        f.seek(fst_off)
        fst = f.read(fst_size)
    num_entries = struct.unpack(">I", fst[8:12])[0]
    str_table_off = num_entries * 12
    entries: Dict[str, Tuple[int, int, int]] = {}
    for i in range(1, num_entries):
        e = fst[i * 12 : (i + 1) * 12]
        if e[0] == 0:
            name_off = (e[1] << 16) | (e[2] << 8) | e[3]
            file_off, file_len = struct.unpack(">II", e[4:12])
            end = fst.index(b"\x00", str_table_off + name_off)
            name = fst[str_table_off + name_off : end].decode("ascii", errors="replace")
            entries[name] = (i, file_off, file_len)
    return entries


parse_gcm_fst = parse_iso_fst


def extract_fighter_skeleton(
    fighter_code: str,
    iso_path: str = MELEE_ISO_PATH,
    override_nr_name: Optional[str] = None,
    override_dat_name: Optional[str] = None,
    override_ftkind: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Dynamically extracts the selected fighter's HSD_JObjDesc skeleton tree, world-space
    Inverse Bind Matrices, PlCo.dat ftPartsTable anatomical mapping (with automatic
    w2 - N_bones offset correction and centerline NeckN/HeadN verification), and
    Pl<XX>.dat ModelLookupTables permanent DObj visibility slots.
    """
    info = FIGHTER_BY_CODE.get(fighter_code.lower())
    if not info and not override_nr_name:
        raise ValueError(f"Unknown Melee fighter code '{fighter_code}'.")

    code = info["code"] if info else fighter_code
    ftkind = override_ftkind if override_ftkind is not None else int(info["ftkind"])
    nr_name = override_nr_name or f"Pl{code}Nr.dat"
    dat_name = override_dat_name or f"Pl{code}.dat"

    fst_entries = parse_iso_fst(iso_path)
    if nr_name not in fst_entries:
        raise FileNotFoundError(f"Missing {nr_name} in {iso_path} FST")

    # Find all costume FST entries for this fighter (excluding Copy-Ability 'Cp', Animation 'AJ', and Data 'D' files)
    prefix = f"Pl{code}"
    costume_fst_names = sorted(
        k for k in fst_entries.keys()
        if k.startswith(prefix)
        and k.endswith(".dat")
        and k != f"Pl{code}.dat"
        and not k.startswith(f"Pl{code}AJ")
        and not k.startswith(f"Pl{code}D")
        and "Cp" not in k
    )
    if code == "Pp":
        nana_costumes = sorted(
            k for k in fst_entries.keys()
            if k.startswith("PlNn")
            and k.endswith(".dat")
            and k != "PlNn.dat"
            and not k.startswith("PlNnAJ")
            and "Cp" not in k
        )
        costume_fst_names.extend(nana_costumes)

    costume_joint_Aliases: List[str] = []
    costume_matanim_Aliases: List[str] = []
    with open(iso_path, "rb") as f:
        # Read PlCo.dat
        f.seek(fst_entries["PlCo.dat"][1])
        plco_raw = f.read(fst_entries["PlCo.dat"][2])
        # Read Pl<XX>Nr.dat (prefer pristine vanilla backup in assets/fighter_ortho_refs/<XX>/ if present)
        vanilla_backup = os.path.join(
            "/Users/diesel/desktop/greek/assets/fighter_ortho_refs",
            code,
            f"{nr_name[:-4]}_vanilla.dat",
        )
        nr_raw = b""
        if os.path.isfile(vanilla_backup) and os.path.getsize(vanilla_backup) > 1024:
            with open(vanilla_backup, "rb") as vf:
                cand_raw = vf.read()
            if len(cand_raw) >= 32 and struct.unpack(">I", cand_raw[:4])[0] == len(cand_raw):
                nr_raw = cand_raw
        if not nr_raw:
            f.seek(fst_entries[nr_name][1])
            nr_raw = f.read(fst_entries[nr_name][2])
        # Read Pl<XX>.dat
        f.seek(fst_entries[dat_name][1])
        ft_raw = f.read(fst_entries[dat_name][2])
        # Collect public symbol names across all costume archives for this skeleton
        target_costume_files = [
            c for c in costume_fst_names
            if (c.startswith("PlNn") if nr_name.startswith("PlNn") else not c.startswith("PlNn"))
        ]
        for c_name in target_costume_files:
            if c_name not in fst_entries:
                continue
            f.seek(fst_entries[c_name][1])
            c_hdr = f.read(min(fst_entries[c_name][2], 32))
            if len(c_hdr) < 20:
                continue
            c_fsize, c_dsize, c_nreloc, c_npub, c_next = struct.unpack(">5I", c_hdr[:20])
            c_pub_off = 32 + c_dsize + c_nreloc * 4
            f.seek(fst_entries[c_name][1] + c_pub_off)
            c_tail = f.read(max(0, c_fsize - c_pub_off))
            c_str_off = (c_npub + c_next) * 8
            for idx_p in range(c_npub):
                if (idx_p + 1) * 8 > len(c_tail):
                    break
                _, c_so = struct.unpack_from(">II", c_tail, idx_p * 8)
                end_i = c_tail.find(b"\x00", c_str_off + c_so)
                if end_i == -1:
                    continue
                s_name = c_tail[c_str_off + c_so : end_i].decode("ascii", errors="replace")
                if s_name.endswith("_Share_matanim_joint"):
                    if s_name not in costume_matanim_Aliases:
                        costume_matanim_Aliases.append(s_name)
                elif s_name.endswith("_Share_joint"):
                    if s_name not in costume_joint_Aliases:
                        costume_joint_Aliases.append(s_name)

    plco_dsize = struct.unpack(">I", plco_raw[4:8])[0]
    plco_data = plco_raw[32 : 32 + plco_dsize]
    entry_ptr = struct.unpack(">I", plco_data[0x00EB38 + ftkind * 4 : 0x00EB38 + (ftkind + 1) * 4])[0]
    w0, w1, w2 = struct.unpack(">III", plco_data[entry_ptr : entry_ptr + 12])
    raw_part_to_bone = list(plco_data[w1 : w1 + 54])

    # Parse Pl<XX>Nr.dat header & public symbols
    fsize, dsize, nreloc, npub, next_ = struct.unpack(">5I", nr_raw[:20])
    dsec = nr_raw[32 : 32 + dsize]
    reloc_off = 32 + dsize
    pub_off = reloc_off + nreloc * 4
    str_off = pub_off + (npub + next_) * 8

    syms: Dict[str, int] = {}
    for i in range(npub):
        rp, so = struct.unpack(">II", nr_raw[pub_off + i * 8 : pub_off + (i + 1) * 8])
        s = nr_raw[str_off + so : nr_raw.index(b"\x00", str_off + so)].decode("ascii")
        syms[s] = rp

    joint_syms = [k for k in syms if k.endswith("_Share_joint") and not k.endswith("_matanim_joint")]
    if not joint_syms:
        raise RuntimeError(f"No *_Share_joint symbol found in {nr_name}: {list(syms.keys())}")
    root_symbol = joint_syms[0]
    root_jobj_off = syms[root_symbol]

    # Walk HSD_JObjDesc tree in depth-first order
    bones: List[Dict[str, Any]] = []

    def _walk(off: int, parent_idx: int, parent_wmat: np.ndarray, depth: int) -> None:
        if off == 0 or off >= len(dsec):
            return
        b_idx = len(bones)
        cls, flags, child, nxt, dobj = struct.unpack(">5I", dsec[off : off + 20])
        rx, ry, rz, sx, sy, sz, tx, ty, tz = struct.unpack(">9f", dsec[off + 0x14 : off + 0x38])
        ibm_ptr, robj_ptr = struct.unpack(">II", dsec[off + 0x38 : off + 0x40])

        lmat = _euler_xyz_to_mat4(rx, ry, rz, sx, sy, sz, tx, ty, tz)
        fk_wmat = parent_wmat @ lmat

        if ibm_ptr != 0 and ibm_ptr + 48 <= len(dsec):
            ibm_3x4 = np.frombuffer(dsec[ibm_ptr : ibm_ptr + 48], dtype=">f4").astype(np.float64).reshape(3, 4)
            ibm_mat4 = np.eye(4, dtype=np.float64)
            ibm_mat4[:3, :] = ibm_3x4
            try:
                bind_wmat = np.linalg.inv(ibm_mat4)
            except np.linalg.LinAlgError:
                bind_wmat = fk_wmat.copy()
                ibm_mat4 = np.linalg.inv(bind_wmat)
        else:
            bind_wmat = fk_wmat.copy()
            try:
                ibm_mat4 = np.linalg.inv(bind_wmat)
            except np.linalg.LinAlgError:
                ibm_mat4 = np.eye(4, dtype=np.float64)

        bones.append({
            "index": b_idx,
            "offset": off,
            "parent": parent_idx,
            "depth": depth,
            "flags": flags,
            "child": child,
            "next": nxt,
            "dobj": dobj,
            "ibm_ptr": ibm_ptr,
            "robj_ptr": robj_ptr,
            "local_trs": (rx, ry, rz, sx, sy, sz, tx, ty, tz),
            "local_mat": lmat,
            "fk_world_mat": fk_wmat,
            "bind_world_mat": bind_wmat,
            "ibm_mat4": ibm_mat4,
            "world_pos": bind_wmat[:3, 3].copy(),
        })
        _walk(child, b_idx, fk_wmat, depth + 1)
        _walk(nxt, parent_idx, parent_wmat, depth)

    _walk(root_jobj_off, -1, np.eye(4, dtype=np.float64), 0)
    n_bones = len(bones)

    # Apply automatic w2 - N_bones offset correction (Spec 063 §4.2.2)
    delta_bones = int(w2) - n_bones
    part_to_bone = list(raw_part_to_bone)
    if delta_bones > 0:
        for s_idx, b_val in enumerate(part_to_bone):
            if b_val != 255:
                if delta_bones >= 10 and b_val > 8:
                    # Kirby PlKbNr.dat omits 13 mouth-swallow helper bones under Bone 8
                    corrected = b_val - delta_bones
                    part_to_bone[s_idx] = corrected if (0 <= corrected < n_bones) else 255
                elif b_val >= n_bones:
                    corrected = b_val - delta_bones
                    part_to_bone[s_idx] = corrected if (0 <= corrected < n_bones) else 255

    # Resolve primary anatomical slots with parent/subtree fallback & centerline verification
    def _valid_bone(b: int) -> Optional[int]:
        return b if (0 <= b < n_bones) else None

    hip_b = _valid_bone(part_to_bone[4]) or 4
    body_b = _valid_bone(part_to_bone[5]) or hip_b
    waist_b = _valid_bone(part_to_bone[16]) or body_b
    bust_b = _valid_bone(part_to_bone[17]) or waist_b

    # Centerline NeckN (slot 32) and HeadN (slot 33) verification
    neck_b = _valid_bone(part_to_bone[32])
    head_b = _valid_bone(part_to_bone[33])
    torso_top_y = float(bones[bust_b]["world_pos"][1])

    if neck_b is not None and abs(float(bones[neck_b]["world_pos"][0])) > 0.35:
        # Off-centerline limb child (e.g. Mr. Game & Watch slot 32 = 18 at X=+4.95)
        neck_b = None
    if head_b is not None and abs(float(bones[head_b]["world_pos"][0])) > 0.35:
        head_b = None

    if head_b is None or neck_b is None:
        # Discover centerline cranial chain above bust_b/body_b (|X| < 0.25, Y > torso_top_y + 0.3)
        center_above = [
            b["index"] for b in bones
            if b["index"] > body_b
            and abs(float(b["world_pos"][0])) < 0.25
            and float(b["world_pos"][1]) > torso_top_y + 0.3
        ]
        center_above.sort(key=lambda idx: float(bones[idx]["world_pos"][1]))
        if center_above:
            if neck_b is None:
                neck_b = center_above[0]
            if head_b is None:
                head_b = center_above[min(1, len(center_above) - 1)]
        else:
            neck_b = neck_b or bust_b
            head_b = head_b or neck_b

    # Exact empirical cranial bone resolution for fighters with snout/tube/mouth sub-bones above HeadN
    cranial_overrides = {
        "Pk": (14, 14),
        "Pc": (15, 15),
        "Mt": (42, 43),
        "Kb": (6, 6),
        "Pr": (5, 6),
    }
    if code in cranial_overrides:
        ov_neck, ov_head = cranial_overrides[code]
        if ov_neck < n_bones and ov_head < n_bones:
            neck_b, head_b = ov_neck, ov_head

    # Arm and Leg chains
    l_sh_n = _valid_bone(part_to_bone[18]) or bust_b
    l_sh_j = _valid_bone(part_to_bone[19]) or l_sh_n
    l_arm_j = _valid_bone(part_to_bone[20]) or l_sh_j
    l_hand_n = _valid_bone(part_to_bone[21]) or l_arm_j

    r_sh_n = _valid_bone(part_to_bone[36]) or bust_b
    r_sh_j = _valid_bone(part_to_bone[37]) or r_sh_n
    r_arm_j = _valid_bone(part_to_bone[38]) or r_sh_j
    r_hand_n = _valid_bone(part_to_bone[39]) or r_arm_j

    l_leg_j = _valid_bone(part_to_bone[6]) or hip_b
    l_knee_j = _valid_bone(part_to_bone[7]) or l_leg_j
    l_foot_j = _valid_bone(part_to_bone[9]) or l_knee_j
    l_toe_n = _valid_bone(part_to_bone[10]) or l_foot_j

    r_leg_j = _valid_bone(part_to_bone[11]) or hip_b
    r_knee_j = _valid_bone(part_to_bone[12]) or r_leg_j
    r_foot_j = _valid_bone(part_to_bone[14]) or r_knee_j
    r_toe_n = _valid_bone(part_to_bone[15]) or r_foot_j

    anatomical_map = {
        "HipN": hip_b,
        "BodyN": body_b,
        "WaistN": waist_b,
        "BustN": bust_b,
        "NeckN": neck_b,
        "HeadN": head_b,
        "LShoulderN": l_sh_n,
        "LShoulderJA": l_sh_j,
        "LArmJ": l_arm_j,
        "LHandN": l_hand_n,
        "RShoulderN": r_sh_n,
        "RShoulderJA": r_sh_j,
        "RArmJ": r_arm_j,
        "RHandN": r_hand_n,
        "LLegJA": l_leg_j,
        "LKneeJ": l_knee_j,
        "LFootJA": l_foot_j,
        "LToeN": l_toe_n,
        "RLegJA": r_leg_j,
        "RKneeJ": r_knee_j,
        "RFootJA": r_foot_j,
        "RToeN": r_toe_n,
    }

    # Inspect matanim_joint on Bone 0 to avoid clobbering eye-blink TexAnim DObjs
    texanim_dobjs = set()
    matanim_syms = [k for k in syms if "matanim" in k]
    matanim_root_off = syms[matanim_syms[0]] if matanim_syms else 0
    if matanim_syms:
        ma_root = matanim_root_off
        ma_cur = struct.unpack(">I", dsec[ma_root + 8 : ma_root + 12])[0]
        d_i = 0
        while ma_cur and ma_cur + 12 <= len(dsec):
            nxt, aobj, texa = struct.unpack(">3I", dsec[ma_cur : ma_cur + 12])
            if aobj != 0 or texa != 0:
                texanim_dobjs.add(d_i)
            ma_cur = nxt
            d_i += 1

    # Inspect Pl<XX>.dat ModelLookupTables to identify the permanent High-Poly and Low-Poly DObj indices on Bone 0
    ft_dsize = struct.unpack(">I", ft_raw[4:8])[0]
    ft_dsec = ft_raw[32 : 32 + ft_dsize]
    ft_pub = 32 + ft_dsize + struct.unpack(">I", ft_raw[8:12])[0] * 4
    ft_rptr = struct.unpack(">I", ft_raw[ft_pub : ft_pub + 4])[0]
    mlt_off = struct.unpack(">I", ft_dsec[ft_rptr + 8 : ft_rptr + 12])[0]
    n_vis, vis_ptr, _, _ = struct.unpack(">4I", ft_dsec[mlt_off : mlt_off + 16])
    hp_tbl = struct.unpack(">I", ft_dsec[vis_ptr : vis_ptr + 4])[0]
    lp_tbl = struct.unpack(">I", ft_dsec[vis_ptr + 4 : vis_ptr + 8])[0]

    def _pick_host_dobj(tbl_off: int) -> Optional[int]:
        if tbl_off == 0 or tbl_off >= len(ft_dsec):
            return None
        # Prefer 1-state permanent visibility groups first
        candidates: List[int] = []
        fallback_candidates: List[int] = []
        for g in range(n_vis):
            g_cnt, g_ptr = struct.unpack(">II", ft_dsec[tbl_off + g * 8 : tbl_off + (g + 1) * 8])
            if g_ptr == 0 or g_ptr >= len(ft_dsec) or g_cnt == 0:
                continue
            s_cnt, s_ptr = struct.unpack(">II", ft_dsec[g_ptr : g_ptr + 8])
            if s_cnt > 0 and s_ptr and s_ptr + s_cnt <= len(ft_dsec):
                d_list = list(ft_dsec[s_ptr : s_ptr + s_cnt])
                if g_cnt == 1:
                    candidates.extend(d_list)
                else:
                    fallback_candidates.extend(d_list)
        all_cands = candidates + fallback_candidates
        for c in all_cands:
            if c not in texanim_dobjs:
                return c
        return all_cands[0] if all_cands else 0

    hp_host_dobj = _pick_host_dobj(hp_tbl)
    if hp_host_dobj is None:
        hp_host_dobj = 1 if (0 in texanim_dobjs) else 0
    lp_host_dobj = _pick_host_dobj(lp_tbl)

    skel_dict = {
        "code": code,
        "name": info["name"] if info else code,
        "ftkind": ftkind,
        "nr_name": nr_name,
        "dat_name": dat_name,
        "root_symbol": root_symbol,
        "root_jobj_off": root_jobj_off,
        "matanim_root_off": matanim_root_off,
        "costume_joint_aliases": costume_joint_Aliases,
        "costume_matanim_aliases": costume_matanim_Aliases,
        "n_bones": n_bones,
        "plco_w2": int(w2),
        "delta_bones": delta_bones,
        "bones": bones,
        "anatomical_map": anatomical_map,
        "texanim_dobjs": sorted(texanim_dobjs),
        "hp_host_dobj": hp_host_dobj,
        "lp_host_dobj": lp_host_dobj,
        "costume_fst_names": costume_fst_names,
        "nr_raw": nr_raw,
        "ft_raw": ft_raw,
    }
    skel_dict["deform_chains"] = resolve_fighter_deform_chains(skel_dict)
    return skel_dict


FIGHTER_TAIL_BONES: Dict[str, set[int]] = {
    "Pk": {47, 48, 49, 50},
    "Pc": {43, 49, 50, 51, 52},
    "Fx": {17, 18, 19, 20, 72, 73, 74, 75},
    "Fc": {17, 66, 67, 68},
    "Ys": {19, 20, 21, 26, 27, 28},
    "Mt": {19, 20, 21, 22, 23, 24, 25, 26, 70, 71, 72, 73, 74, 75, 76, 77, 78},
    "Kp": {24, 25, 26, 27, 28, 91, 92, 93, 94},
}

FIGHTER_TAIL_ROOT_SUPPORT_BONES: Dict[str, set[int]] = {
    "Pk": set(),
    "Pc": set(),
    "Fx": {4},
    "Fc": {4},
    "Ys": {4, 22},
    "Mt": {5},
    "Kp": {4, 15},
}

FIGHTER_PREFERRED_POSE: Dict[str, str] = {
    "Mr": "tpose", "Fx": "tpose", "Ca": "tpose", "Dk": "apose", "Kb": "apose",
    "Kp": "apose", "Lk": "tpose", "Sk": "tpose", "Ns": "tpose", "Pe": "tpose",
    "Pp": "apose", "Pk": "apose", "Ss": "tpose", "Ys": "apose", "Pr": "apose",
    "Mt": "tpose", "Lg": "tpose", "Ms": "tpose", "Zd": "tpose", "Cl": "tpose",
    "Dr": "tpose", "Fc": "tpose", "Pc": "apose", "Gw": "tpose", "Gn": "tpose",
    "Fe": "tpose",
}

FIGHTER_EAR_HORN_CHAINS: Dict[str, Tuple[Tuple[int, ...], Tuple[int, ...]]] = {
    "Pk": ((17, 18), (20, 21)),
    "Pc": ((18, 19), (21, 22)),
    "Mt": ((45, 48, 49), (46, 50, 51)),
    "Pr": ((12,), (26,)),
}


def resolve_fighter_deform_chains(skel: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enforces INV-REGION-GATED-SKIN-01 (Functional Specification 041 §3.5.1 & §4.4.2):
    Resolves 100% non-zero-IBM deform bone chains (`ibm_ptr != 0`) across all 26 fighters
    for the 5 mutually exclusive anatomical zones, advancing any zero-IBM `*JA` helper bone
    to its immediate non-zero-IBM deform counterpart and isolating native tail chains.
    """
    raw_code = str(skel.get("code") or "Pk").strip()
    code = raw_code[0].upper() + raw_code[1].lower() if len(raw_code) == 2 else "Pk"
    bones = skel["bones"]
    bmap = {b["index"]: b for b in bones}
    amap = skel["anatomical_map"]

    children_map: Dict[int, List[int]] = {b["index"]: [] for b in bones}
    for b in bones:
        if b["parent"] >= 0:
            children_map[b["parent"]].append(b["index"])

    def _advance_non_zero_ibm(b_idx: int) -> int:
        if bmap[b_idx]["ibm_ptr"] != 0:
            return b_idx
        for ch in children_map.get(b_idx, []):
            if bmap[ch]["ibm_ptr"] != 0:
                return ch
        p = bmap[b_idx]["parent"]
        while p >= 0:
            if bmap[p]["ibm_ptr"] != 0:
                return p
            p = bmap[p]["parent"]
        return b_idx

    def _path_between(start_idx: int, end_idx: int) -> List[int]:
        path: List[int] = []
        cur = end_idx
        visited: set[int] = set()
        while cur >= 0 and cur not in visited:
            visited.add(cur)
            path.append(cur)
            if cur == start_idx:
                break
            cur = bmap[cur]["parent"]
        path.reverse()
        return [bi for bi in path if bmap[bi]["ibm_ptr"] != 0]

    # Zone 1: Head & Ears/Horns
    head_bone = _advance_non_zero_ibm(amap["HeadN"])
    ear_chains = FIGHTER_EAR_HORN_CHAINS.get(code, ((), ()))
    l_ear_chain = [bi for bi in ear_chains[0] if bi in bmap and bmap[bi]["ibm_ptr"] != 0]
    r_ear_chain = [bi for bi in ear_chains[1] if bi in bmap and bmap[bi]["ibm_ptr"] != 0]

    # Zone 2: Spine chain (HipN, WaistN, BustN)
    spine_raw = [
        _advance_non_zero_ibm(amap["HipN"]),
        _advance_non_zero_ibm(amap["WaistN"]),
        _advance_non_zero_ibm(amap["BustN"]),
    ]
    spine_chain: List[int] = []
    for bi in spine_raw:
        if bi not in spine_chain and bmap[bi]["ibm_ptr"] != 0:
            spine_chain.append(bi)

    # Zone 3 & Zone 4: Left & Right Arm chains ([LShoulderJ, LArmJ, LHandN] / [RShoulderJ, RArmJ, RHandN])
    left_arm_chain = _path_between(amap["LShoulderJA"], amap["LHandN"])
    for ch in children_map.get(amap["LHandN"], []):
        if bmap[ch]["ibm_ptr"] != 0 and ch not in left_arm_chain:
            left_arm_chain.append(ch)
            break
    if not left_arm_chain:
        left_arm_chain = _path_between(amap["LShoulderN"], amap["LHandN"])

    right_arm_chain = _path_between(amap["RShoulderJA"], amap["RHandN"])
    for ch in children_map.get(amap["RHandN"], []):
        if bmap[ch]["ibm_ptr"] != 0 and ch not in right_arm_chain:
            right_arm_chain.append(ch)
            break
    if not right_arm_chain:
        right_arm_chain = _path_between(amap["RShoulderN"], amap["RHandN"])

    # Zone 5: Left & Right Leg chains ([LLegJ, LKneeJ, LFootJ, LToeJ] / [RLegJ, RKneeJ, RFootJ, RToeJ])
    left_leg_chain = _path_between(amap["LLegJA"], amap["LToeN"])
    for ch in children_map.get(amap["LToeN"], []):
        if bmap[ch]["ibm_ptr"] != 0 and ch not in left_leg_chain:
            left_leg_chain.append(ch)
            break

    right_leg_chain = _path_between(amap["RLegJA"], amap["RToeN"])
    for ch in children_map.get(amap["RToeN"], []):
        if bmap[ch]["ibm_ptr"] != 0 and ch not in right_leg_chain:
            right_leg_chain.append(ch)
            break

    all_deform_bones = set(
        [head_bone]
        + l_ear_chain
        + r_ear_chain
        + spine_chain
        + left_arm_chain
        + right_arm_chain
        + left_leg_chain
        + right_leg_chain
    )

    return {
        "fighter_code": code,
        "preferred_pose": FIGHTER_PREFERRED_POSE.get(code, "tpose"),
        "head_bone": head_bone,
        "left_ear_chain": l_ear_chain,
        "right_ear_chain": r_ear_chain,
        "spine_chain": spine_chain,
        "left_arm_chain": left_arm_chain,
        "right_arm_chain": right_arm_chain,
        "left_leg_chain": left_leg_chain,
        "right_leg_chain": right_leg_chain,
        "tail_bones": sorted(FIGHTER_TAIL_BONES.get(code, set())),
        "all_deform_bones": sorted(all_deform_bones),
        "zero_ibm_in_deform": [bi for bi in all_deform_bones if bmap[bi]["ibm_ptr"] == 0],
    }


# ==============================================================================
# Stage 3 — Proportion-Preserving Pose Retargeting & <=10-Envelope Skinning
# ==============================================================================

def _rotation_matrix_from_vectors(v_src: np.ndarray, v_dst: np.ndarray) -> np.ndarray:
    """
    Computes an exact orthonormal rotation matrix R in SO(3) (det(R) = +1)
    that rotates unit vector v_src onto unit vector v_dst without scaling.
    """
    a_norm = float(np.linalg.norm(v_src))
    b_norm = float(np.linalg.norm(v_dst))
    if a_norm < 1e-6 or b_norm < 1e-6:
        return np.eye(3, dtype=np.float64)
    a = v_src / a_norm
    b = v_dst / b_norm
    c = float(np.clip(np.dot(a, b), -1.0, 1.0))
    if c > 0.999999:
        return np.eye(3, dtype=np.float64)
    if c < -0.999999:
        # 180-degree rotation around orthogonal axis
        ortho = np.array([0.0, 0.0, 1.0], dtype=np.float64)
        if abs(a[2]) > 0.9:
            ortho = np.array([0.0, 1.0, 0.0], dtype=np.float64)
        axis = np.cross(a, ortho)
        axis /= np.linalg.norm(axis)
        return 2.0 * np.outer(axis, axis) - np.eye(3, dtype=np.float64)
    v = np.cross(a, b)
    s = float(np.linalg.norm(v))
    vx = np.array([
        [0.0, -v[2], v[1]],
        [v[2], 0.0, -v[0]],
        [-v[1], v[0], 0.0],
    ], dtype=np.float64)
    return np.eye(3, dtype=np.float64) + vx + (vx @ vx) * ((1.0 - c) / (s * s))


def _point_to_segment_dist(pts: np.ndarray, a: np.ndarray, b: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns (distances, t_param) from pts (N, 3) to line segment a -> b.
    """
    ab = b - a
    ab_len2 = float(np.dot(ab, ab))
    if ab_len2 < 1e-8:
        d = np.linalg.norm(pts - a[None, :], axis=-1)
        return d, np.zeros(len(pts), dtype=np.float64)
    t = np.clip(((pts - a[None, :]) @ ab) / ab_len2, 0.0, 1.0)
    proj = a[None, :] + t[:, None] * ab[None, :]
    d = np.linalg.norm(pts - proj, axis=-1)
    return d, t


def discover_1piece_biped_landmarks_and_head_partition(
    pos_2m: np.ndarray,
    triangles: np.ndarray,
    code: str,
    x_skel_sh_world: float,
    h_sh_world: float,
) -> Dict[str, Any]:
    """
    Functional Specification 043 §4.4.2 (INV-1PIECE-FEET-TO-SHOULDERS-01 & INV-TOPO-HEAD-01):
    Direct 1-piece single-material landmark extraction and 3D-welded topological neck-ring
    cranial partitioning across all 24 biped archetypes (+ Nn), with zero material-ID
    splitting and zero external telemetry coupling.
    """
    import heapq

    n_verts = len(pos_2m)
    y_sole_glb = float(pos_2m[:, 1].min())
    y_max_glb = float(pos_2m[:, 1].max())
    h_total = max(1e-4, y_max_glb - y_sole_glb)

    x_bbox_mid = 0.5 * float(pos_2m[:, 0].min() + pos_2m[:, 0].max())
    mid_trunk_mask = (
        (pos_2m[:, 1] >= y_sole_glb + 0.35 * h_total)
        & (pos_2m[:, 1] <= y_sole_glb + 0.65 * h_total)
        & (np.abs(pos_2m[:, 0] - x_bbox_mid) <= 0.36)
    )
    x_center_glb = float(np.median(pos_2m[mid_trunk_mask, 0])) if np.any(mid_trunk_mask) else x_bbox_mid

    sole_mask = pos_2m[:, 1] <= (y_sole_glb + 0.08 * h_total)
    z_sole_glb = float(np.median(pos_2m[sole_mask, 2])) if np.any(sole_mask) else 0.0

    # Weld co-located 3D vertices (0.2 mm quantization) so UV island seams never break surface connectivity
    quant_co = np.round(pos_2m * 5000.0).astype(np.int64)
    _, weld_first_idx, weld_inv = np.unique(quant_co, axis=0, return_index=True, return_inverse=True)
    weld_pos = pos_2m[weld_first_idx]
    n_weld = len(weld_pos)

    weld_tris = weld_inv[triangles]
    e01 = np.sort(weld_tris[:, [0, 1]], axis=1)
    e12 = np.sort(weld_tris[:, [1, 2]], axis=1)
    e20 = np.sort(weld_tris[:, [2, 0]], axis=1)
    all_edges = np.vstack([e01, e12, e20])
    all_edges = all_edges[all_edges[:, 0] != all_edges[:, 1]]
    uniq_edges = np.unique(all_edges, axis=0)

    pa = weld_pos[uniq_edges[:, 0]]
    pb = weld_pos[uniq_edges[:, 1]]
    ya = pa[:, 1]
    yb = pb[:, 1]

    def _slice_xz_at_y(y_q: float) -> np.ndarray:
        cross = ((ya <= y_q) & (yb > y_q)) | ((yb <= y_q) & (ya > y_q))
        if not np.any(cross):
            return np.empty((0, 2), dtype=np.float64)
        dy = yb[cross] - ya[cross]
        t = (y_q - ya[cross]) / np.where(np.abs(dy) > 1e-9, dy, 1e-9)
        xs = pa[cross, 0] + t * (pb[cross, 0] - pa[cross, 0])
        zs = pa[cross, 2] + t * (pb[cross, 2] - pa[cross, 2])
        return np.column_stack([xs, zs])

    def _contiguous_radius_x(abs_dx: np.ndarray, bin_step: float = 0.024, start_x: float = 0.048) -> float:
        if len(abs_dx) == 0:
            return 0.0
        max_dx = float(abs_dx.max())
        cur = start_x
        edge = min(start_x, max_dx)
        while cur <= max_dx + 1e-6:
            if np.count_nonzero((abs_dx >= cur) & (abs_dx < cur + bin_step)) == 0:
                break
            edge = cur + bin_step
            cur += bin_step
        return min(edge, max_dx)

    # 1. Scan vertical cross-section profile to locate the lowest shoulder/wingspan bridge & ribcage/waist trunk width
    y_grid = np.linspace(y_sole_glb + 0.44, min(y_max_glb - 0.06, y_sole_glb + 1.84), 48)
    w95 = np.zeros(len(y_grid), dtype=np.float64)
    r_contig = np.zeros(len(y_grid), dtype=np.float64)
    for k, y_k in enumerate(y_grid):
        xz = _slice_xz_at_y(float(y_k))
        if len(xz) >= 4:
            adx = np.abs(xz[:, 0] - x_center_glb)
            w95[k] = float(np.percentile(adx, 95))
            r_contig[k] = _contiguous_radius_x(adx)

    upper_band = (y_grid >= y_sole_glb + 0.54) & (y_grid <= y_sole_glb + 1.78)
    w_wingspan = max(0.22, float(np.max(w95[upper_band])) if np.any(upper_band) else float(np.max(w95)))

    bridge_mask = upper_band & (w95 >= 0.54 * w_wingspan) & (r_contig >= 0.48 * w_wingspan)
    if not np.any(bridge_mask):
        bridge_mask = upper_band & (w95 >= 0.60 * w_wingspan)

    bridge_idxs = np.where(bridge_mask)[0]
    if len(bridge_idxs) == 0:
        raise RuntimeError(
            f"Fatal [INV-1PIECE-FEET-TO-SHOULDERS-01]: Unable to detect open-arm shoulder wingspan on '{code}' "
            f"(max half-wingspan={w_wingspan:.3f}m)."
        )

    # Group contiguous bridge slices and pick the lowest valid shoulder/arm bridge band (immune to tall wide ears on Pc/Pk)
    bands: List[Tuple[int, int]] = []
    b_start = int(bridge_idxs[0])
    b_prev = b_start
    for idx_k in bridge_idxs[1:]:
        if int(idx_k) <= b_prev + 2:
            b_prev = int(idx_k)
        else:
            bands.append((b_start, b_prev))
            b_start = int(idx_k)
            b_prev = int(idx_k)
    bands.append((b_start, b_prev))

    sh_band_i0, sh_band_i1 = bands[0]
    y_bridge_lo = float(y_grid[sh_band_i0])
    y_bridge_hi = float(y_grid[sh_band_i1])

    rib_mask = (y_grid >= max(y_sole_glb + 0.40, y_bridge_lo - 0.28)) & (y_grid <= max(y_sole_glb + 0.46, y_bridge_lo - 0.03))
    rib_vals = r_contig[rib_mask & (r_contig > 0.03)]
    if len(rib_vals) > 0:
        x_mesh_trunk_glb = float(np.clip(np.median(rib_vals), 0.065, 0.54 * w_wingspan))
    else:
        x_mesh_trunk_glb = float(np.clip(0.34 * w_wingspan, 0.075, 0.48 * w_wingspan))

    # 2. Measure lateral arm vertices, fail fast if < 8 on either side, and project arm-shaft axis to shoulder root
    y_arm_lo = max(y_sole_glb + 0.36, y_bridge_lo - 0.44)
    y_arm_hi = min(y_max_glb - 0.04, y_bridge_hi + 0.15)

    def _measure_arm_side(sign_x: float, armpit_x: float) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        side_name = "left" if sign_x > 0 else "right"
        cand = (
            (pos_2m[:, 1] >= y_arm_lo)
            & (pos_2m[:, 1] <= y_arm_hi)
            & ((sign_x * (pos_2m[:, 0] - x_center_glb)) > (armpit_x + 0.02))
        )
        cnt = int(np.count_nonzero(cand))
        if cnt < 8:
            raise RuntimeError(
                f"Fatal [INV-1PIECE-FEET-TO-SHOULDERS-01]: Fighter '{code}' violates open-arm (T/A-pose) "
                f"precondition on {side_name} arm: found {cnt} < 8 vertices outside x_armpit={armpit_x:.3f}m."
            )
        pts = pos_2m[cand]
        lat = sign_x * (pts[:, 0] - x_center_glb) - armpit_x
        lat_span = max(0.06, float(np.percentile(lat, 96)))

        sh_pts = pts[lat <= max(0.05, 0.22 * lat_span)]
        if len(sh_pts) < 3:
            sh_pts = pts[np.argsort(lat)[: max(3, min(12, len(pts)))]]
        y_sh_p15 = float(np.percentile(sh_pts[:, 1], 15))
        y_sh_p85 = float(np.percentile(sh_pts[:, 1], 85))
        y_sh_med = float(np.median(sh_pts[:, 1]))
        z_sh_med = float(np.median(sh_pts[:, 2]))

        wrist_pts = pts[lat >= 0.78 * lat_span]
        if len(wrist_pts) < 3:
            wrist_pts = pts[np.argsort(lat)[-max(3, min(10, len(pts))):]]
        p_wrist = wrist_pts.mean(axis=0)
        lat_wrist = max(0.05, float(sign_x * (p_wrist[0] - x_center_glb) - armpit_x))

        # Project bicep/mid-shaft -> wrist line back to lat=0 so raised shoulder pauldrons (Ss, Gn, Ca)
        # never pull the measured glenohumeral shoulder joint upward above the true arm shaft.
        mid_mask = (lat >= 0.24 * lat_span) & (lat <= 0.56 * lat_span)
        if np.count_nonzero(mid_mask) >= 4:
            p_mid = pts[mid_mask].mean(axis=0)
            lat_mid = float(sign_x * (p_mid[0] - x_center_glb) - armpit_x)
            if lat_wrist - lat_mid > 0.04:
                slope_y = float(p_wrist[1] - p_mid[1]) / float(lat_wrist - lat_mid)
                y_proj = float(p_mid[1]) - slope_y * lat_mid
                y_sh_joint = float(np.clip(y_proj, y_sh_p15, y_sh_p85))
            else:
                y_sh_joint = y_sh_med
        else:
            y_sh_joint = y_sh_med

        q_sh = np.array([x_center_glb + sign_x * armpit_x, y_sh_joint, z_sh_med], dtype=np.float64)
        v_src = p_wrist - q_sh
        return q_sh, v_src, cand

    q_l_pre, _, _ = _measure_arm_side(+1.0, 1.04 * x_mesh_trunk_glb)
    q_r_pre, _, _ = _measure_arm_side(-1.0, 1.04 * x_mesh_trunk_glb)
    y_sh_pre = 0.5 * (float(q_l_pre[1]) + float(q_r_pre[1]))
    s_unif_pre = h_sh_world / max(0.20, y_sh_pre - y_sole_glb)
    x_skel_sh_glb = x_skel_sh_world / max(1e-4, s_unif_pre)

    x_armpit_glb = float(
        min(0.64 * w_wingspan, max(0.84 * x_skel_sh_glb, x_mesh_trunk_glb))
    )
    q_lsh, src_l_dir, l_arm_cand = _measure_arm_side(+1.0, x_armpit_glb)
    q_rsh, src_r_dir, r_arm_cand = _measure_arm_side(-1.0, x_armpit_glb)
    y_sh_glb = 0.5 * (float(q_lsh[1]) + float(q_rsh[1]))

    span_sh_glb = y_sh_glb - y_sole_glb
    if span_sh_glb <= 0.20:
        raise RuntimeError(
            f"Fatal [INV-1PIECE-FEET-TO-SHOULDERS-01]: Degenerate Feet-to-Shoulders span {span_sh_glb:.4f}m on '{code}'."
        )

    # 3. Topological Neck-Ring Detection inside central cervical column (INV-TOPO-HEAD-01 §4.4.2.2)
    neck_y_lo = max(y_sole_glb + 0.50, y_sh_glb - 0.03)
    neck_y_hi = min(y_max_glb - 0.08, y_sh_glb + 0.34)
    if neck_y_hi <= neck_y_lo + 0.04:
        neck_y_hi = min(y_max_glb - 0.05, neck_y_lo + 0.16)

    cervical_half_x = max(0.11, 0.88 * x_armpit_glb)
    neck_candidates: List[Tuple[float, float, float, float]] = []
    for y_nk in np.linspace(neck_y_lo, neck_y_hi, 28):
        xz = _slice_xz_at_y(float(y_nk))
        if len(xz) < 6:
            continue
        dx = xz[:, 0] - x_center_glb
        in_col = np.abs(dx) <= cervical_half_x
        if np.count_nonzero(in_col) < 5:
            continue
        col_dx = dx[in_col]
        col_z = xz[in_col, 1]
        if not (np.any(col_dx < -0.01) and np.any(col_dx > 0.01)):
            continue
        r_full = _contiguous_radius_x(np.abs(col_dx), bin_step=0.022, start_x=0.035)
        if r_full <= 0.02:
            r_full = float(np.percentile(np.abs(col_dx), 88))
        z_med = float(np.median(col_z))
        ant_mask = col_z >= (z_med - 0.035)
        if np.count_nonzero(ant_mask) >= 4:
            r_ant = float(np.percentile(np.abs(col_dx[ant_mask]), 90))
        else:
            r_ant = r_full
        # Gentle tie-breaker prefers the base of a straight cylindrical neck where it meets the collar
        h_bias = 0.025 * (((float(y_nk) - (y_sh_glb + 0.07)) / 0.25) ** 2)
        score = 0.60 * r_ant + 0.40 * r_full + h_bias
        neck_candidates.append((score, float(y_nk), max(0.055, min(r_full, 1.15 * r_ant)), z_med))

    if neck_candidates:
        neck_candidates.sort(key=lambda item: item[0])
        _, y_neck_glb, r_neck_glb, z_neck_glb = neck_candidates[0]
    else:
        y_neck_glb = min(y_max_glb - 0.12, y_sh_glb + 0.08)
        r_neck_glb = max(0.08, 0.55 * x_armpit_glb)
        z_neck_glb = z_sole_glb

    # 4. 3D-Welded Dual-Seed Geodesic Cranial Partition (V_head vs V_body; INV-TOPO-HEAD-01)
    y_ear_floor = y_neck_glb + 0.28 * max(0.10, y_max_glb - y_neck_glb)
    r_collar_fence = min(0.96 * x_armpit_glb, max(1.22 * r_neck_glb, 0.55 * (r_neck_glb + x_armpit_glb)))

    central_skull_mask = np.abs(weld_pos[:, 0] - x_center_glb) <= max(0.13, 1.15 * r_neck_glb)
    y_central_crown = float(weld_pos[central_skull_mask, 1].max()) if np.any(central_skull_mask) else y_max_glb

    head_seed_mask = (
        (weld_pos[:, 1] >= y_central_crown - 0.10)
        & (np.abs(weld_pos[:, 0] - x_center_glb) <= max(0.14, 1.22 * r_neck_glb))
    )
    if not np.any(head_seed_mask):
        top_cut = float(np.percentile(weld_pos[:, 1], 97))
        head_seed_mask = weld_pos[:, 1] >= top_cut

    abs_weld_dx = np.abs(weld_pos[:, 0] - x_center_glb)
    body_seed_mask = (
        ((weld_pos[:, 1] <= y_neck_glb - 0.045) & ((abs_weld_dx <= x_armpit_glb) | (weld_pos[:, 1] <= y_sh_glb)))
        | ((abs_weld_dx >= x_armpit_glb + 0.03) & (weld_pos[:, 1] <= y_sh_glb + 0.09))
        | ((abs_weld_dx >= x_armpit_glb + 0.09) & (weld_pos[:, 1] <= y_neck_glb + 0.08))
    ) & (~head_seed_mask)
    if not np.any(body_seed_mask):
        body_seed_mask = (weld_pos[:, 1] <= y_sole_glb + 0.35 * h_total) & (~head_seed_mask)

    adj: List[List[Tuple[int, float]]] = [[] for _ in range(n_weld)]
    edge_vecs = pb - pa
    edge_lens = np.maximum(1e-5, np.linalg.norm(edge_vecs, axis=1))
    edge_mids = 0.5 * (pa + pb)
    for e_i in range(len(uniq_edges)):
        u_i = int(uniq_edges[e_i, 0])
        v_i = int(uniq_edges[e_i, 1])
        xm, ym = float(edge_mids[e_i, 0]), float(edge_mids[e_i, 1])
        mult = 1.0
        if ym <= y_neck_glb + 0.015:
            mult = 28.0
        elif ym <= y_ear_floor and abs(xm - x_center_glb) > r_collar_fence:
            if ym <= y_neck_glb + 0.065:
                mult = 24.0
            else:
                mult = 1.5
        w_cost = float(edge_lens[e_i]) * mult
        adj[u_i].append((v_i, w_cost))
        adj[v_i].append((u_i, w_cost))

    best_cost = np.full(n_weld, np.inf, dtype=np.float64)
    weld_label = np.full(n_weld, -1, dtype=np.int32)  # 1 == head, 0 == body
    pq: List[Tuple[float, int, int]] = []

    for u_i in np.where(head_seed_mask)[0]:
        best_cost[int(u_i)] = 0.0
        weld_label[int(u_i)] = 1
        heapq.heappush(pq, (0.0, 1, int(u_i)))
    for u_i in np.where(body_seed_mask)[0]:
        best_cost[int(u_i)] = 0.0
        weld_label[int(u_i)] = 0
        heapq.heappush(pq, (0.0, 0, int(u_i)))

    while pq:
        c_cur, lbl_cur, u_i = heapq.heappop(pq)
        if c_cur > best_cost[u_i] + 1e-12:
            continue
        for v_i, w_uv in adj[u_i]:
            c_nxt = c_cur + w_uv
            if c_nxt + 1e-12 < best_cost[v_i]:
                best_cost[v_i] = c_nxt
                weld_label[v_i] = lbl_cur
                heapq.heappush(pq, (c_nxt, lbl_cur, v_i))

    # Attach any tiny unreached surface island (e.g., decimated ear/AirPod detail) to nearest reached 3D surface
    unreached = np.where(weld_label < 0)[0]
    reached = np.where(weld_label >= 0)[0]
    if len(unreached) > 0 and len(reached) > 0:
        reached_pts = weld_pos[reached]
        reached_lbls = weld_label[reached]
        for u_i in unreached:
            d2 = np.sum((reached_pts - weld_pos[int(u_i)][None, :]) ** 2, axis=1)
            weld_label[int(u_i)] = int(reached_lbls[int(np.argmin(d2))])

    head_mask = (weld_label[weld_inv] == 1)
    body_mask = ~head_mask
    if not np.any(head_mask) or not np.any(body_mask):
        raise RuntimeError(
            f"Fatal [INV-TOPO-HEAD-01]: Topological neck-ring cranial partition failed on '{code}' "
            f"(head_verts={int(np.count_nonzero(head_mask))}, body_verts={int(np.count_nonzero(body_mask))})."
        )

    return {
        "head_mask": head_mask,
        "body_mask": body_mask,
        "y_sole_glb": y_sole_glb,
        "x_center_glb": x_center_glb,
        "z_sole_glb": z_sole_glb,
        "z_neck_glb": z_neck_glb,
        "x_mesh_trunk_glb": x_mesh_trunk_glb,
        "x_armpit_glb": x_armpit_glb,
        "y_sh_glb": y_sh_glb,
        "y_neck_glb": y_neck_glb,
        "r_neck_glb": r_neck_glb,
        "q_lsh": q_lsh,
        "q_rsh": q_rsh,
        "src_l_dir": src_l_dir,
        "src_r_dir": src_r_dir,
        "l_arm_cand": l_arm_cand & body_mask,
        "r_arm_cand": r_arm_cand & body_mask,
    }


def retarget_and_skin_mesh(
    stage1: Dict[str, Any],
    skel: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Stage 3 (Functional Specification 043 §4.4.2–§4.4.3):
    Single-responsibility 1-piece single-material skeleton-driven auto-rigging across all 26
    playable fighters (+ Nn):
      - Branch A (`1p_sphere`: Kb, Pr): 100% uniform Feet-to-Crown scaling onto
        (Y_crown - Y_sole) with R_arm = I_3, binding central spherical face/eyes/belly strictly
        to BodyN/HeadN and only outer stub fins / lower shoes to limb chains.
      - Branch B (`1p_biped`: 24 characters + Nn): 3D-welded topological neck-ring cranial
        partitioning (INV-TOPO-HEAD-01), deterministic pure-SO(3) pre-skinning arm alignment
        whenever |delta_theta| > 3.0 deg, 100% uniform Feet-to-Shoulders scaling onto
        H_sh = (Y_sh - Y_sole) (INV-1PIECE-FEET-TO-SHOULDERS-01), and 100% world-space
        skeleton-coordinate 5-zone region-gated skinning (0 *JA zero-IBM bones, 0 torso-to-limb
        leak vertices, 0 shoulder-pauldron-to-head leak vertices, <= 10 unique envelopes per
        HSD_PObjDesc batch).
    """
    pos_2m = stage1["positions"].astype(np.float64).copy()
    nrm_2m = stage1["normals"].astype(np.float64).copy()
    uvs = stage1["uvs"].astype(np.float32)
    triangles = stage1["triangles"].astype(np.int32)

    bones = skel["bones"]
    amap = skel["anatomical_map"]
    raw_code = str(skel.get("code") or "Mr").strip()
    code = (raw_code[0].upper() + raw_code[1:].lower()) if len(raw_code) >= 2 else raw_code.upper()
    if skel.get("nr_name") == "PlNnNr.dat":
        prop_code = "Nn"
    else:
        if code not in MELEE_FIGHTER_PROPORTIONS_043:
            raise KeyError(f"Missing fighter code '{code}' in MELEE_FIGHTER_PROPORTIONS_043")
        prop_code = code
    prop = MELEE_FIGHTER_PROPORTIONS_043[prop_code]

    def _bpos(slot_name: str) -> np.ndarray:
        return bones[amap[slot_name]]["world_pos"].astype(np.float64)

    dchains = skel.get("deform_chains") or resolve_fighter_deform_chains(skel)
    if dchains.get("zero_ibm_in_deform"):
        raise AssertionError(
            f"Fatal [INV-SKEL-SKIN-01]: Zero-IBM (*JA) bone(s) {dchains['zero_ibm_in_deform']} resolved in deform_chains for {code}"
        )

    head_bone_idx = int(dchains["head_bone"])
    l_ear_chain = [int(x) for x in (dchains.get("left_ear_chain") or [])]
    r_ear_chain = [int(x) for x in (dchains.get("right_ear_chain") or [])]
    spine_chain = [int(x) for x in (dchains.get("spine_chain") or [])]
    left_arm_chain = [int(x) for x in (dchains.get("left_arm_chain") or [])]
    right_arm_chain = [int(x) for x in (dchains.get("right_arm_chain") or [])]
    left_leg_chain = [int(x) for x in (dchains.get("left_leg_chain") or [])]
    right_leg_chain = [int(x) for x in (dchains.get("right_leg_chain") or [])]

    if not spine_chain or not left_arm_chain or not right_arm_chain or not left_leg_chain or not right_leg_chain:
        raise RuntimeError(f"Fatal [INV-SKEL-SKIN-01]: Incomplete non-zero-IBM deform chains for {code}: {dchains}")

    hip_b = spine_chain[0]
    waist_b = spine_chain[min(1, len(spine_chain) - 1)]
    bust_b = spine_chain[-1]

    l_sh_b = left_arm_chain[0]
    l_arm_b = left_arm_chain[min(1, len(left_arm_chain) - 1)]
    l_hand_b = left_arm_chain[-1]

    r_sh_b = right_arm_chain[0]
    r_arm_b = right_arm_chain[min(1, len(right_arm_chain) - 1)]
    r_hand_b = right_arm_chain[-1]

    l_thigh_b = left_leg_chain[0]
    l_calf_b = left_leg_chain[min(1, len(left_leg_chain) - 1)]
    l_foot_b = left_leg_chain[min(2, len(left_leg_chain) - 1)]
    l_toe_b = left_leg_chain[-1]

    r_thigh_b = right_leg_chain[0]
    r_calf_b = right_leg_chain[min(1, len(right_leg_chain) - 1)]
    r_foot_b = right_leg_chain[min(2, len(right_leg_chain) - 1)]
    r_toe_b = right_leg_chain[-1]

    def _make_env(b0: int, w0: float = 1.0, b1: Optional[int] = None, w1: float = 0.0) -> Tuple[Tuple[int, float], ...]:
        if b1 is None or int(b0) == int(b1) or w0 >= 0.99 or w1 <= 0.01:
            return ((int(b0), 1.0),)
        if w1 >= 0.99 or w0 <= 0.01:
            return ((int(b1), 1.0),)
        q0 = round(round(float(w0) * 10.0) / 10.0, 2)
        q1 = round(1.0 - q0, 2)
        if q0 >= 0.99 or q1 <= 0.01:
            return ((int(b0), 1.0),)
        if q1 >= 0.99 or q0 <= 0.01:
            return ((int(b1), 1.0),)
        pair = sorted([(int(b0), q0), (int(b1), q1)], key=lambda x: x[0])
        return tuple(pair)

    limb_bone_set = set(left_arm_chain + right_arm_chain + left_leg_chain + right_leg_chain) - set(spine_chain)
    spine_bone_set = set(spine_chain)
    core_spherical_bones = set(spine_chain) | {head_bone_idx}

    y_sole_target = float(prop["y_sole"])
    y_crown_target = float(prop["y_crown"])
    n_verts = len(pos_2m)
    vertex_envelopes: List[Tuple[Tuple[int, float], ...]] = []
    torso_limb_leak_vertices = 0
    shoulder_pauldron_head_leak_vertices = 0

    # ==========================================================================
    # Branch A — One-Piece Spherical Feet-to-Crown (Kb Kirby & Pr Jigglypuff)
    # ==========================================================================
    if prop["mode"] == "1p_sphere":
        h_ball_world = float(prop["h_sh"])
        y_min_2m = float(pos_2m[:, 1].min())
        y_max_2m = float(pos_2m[:, 1].max())
        h_src_2m = max(1e-5, y_max_2m - y_min_2m)
        s_unif = h_ball_world / h_src_2m

        x_mid_2m = 0.5 * float(pos_2m[:, 0].min() + pos_2m[:, 0].max())
        z_mid_2m = 0.5 * float(pos_2m[:, 2].min() + pos_2m[:, 2].max())

        pos_world = np.empty_like(pos_2m)
        pos_world[:, 0] = (pos_2m[:, 0] - x_mid_2m) * s_unif
        pos_world[:, 1] = y_sole_target + (pos_2m[:, 1] - y_min_2m) * s_unif
        pos_world[:, 2] = (pos_2m[:, 2] - z_mid_2m) * s_unif
        nrm_world = nrm_2m.copy()

        x_sh_world = max(
            abs(float(bones[l_sh_b]["world_pos"][0])),
            abs(float(bones[r_sh_b]["world_pos"][0])),
            abs(float(_bpos("LShoulderJA")[0])),
        )
        x_hand_world = max(
            abs(float(bones[l_hand_b]["world_pos"][0])),
            abs(float(bones[r_hand_b]["world_pos"][0])),
            x_sh_world + 1.0,
        )
        r_arm_gate = 0.92 * x_sh_world
        y_foot_bone = 0.5 * (float(bones[l_foot_b]["world_pos"][1]) + float(bones[r_foot_b]["world_pos"][1]))
        y_shoe_gate = y_sole_target + max(0.20 * h_ball_world, min(0.24 * h_ball_world, (y_foot_bone - y_sole_target) + 0.35))
        y_fin_top = y_sole_target + 0.78 * h_ball_world
        z_toe_gate = 0.5 * (
            0.5 * (float(bones[l_foot_b]["world_pos"][2]) + float(bones[r_foot_b]["world_pos"][2]))
            + 0.5 * (float(bones[l_toe_b]["world_pos"][2]) + float(bones[r_toe_b]["world_pos"][2]))
        )

        head_vert_count = 0
        for v_i in range(n_verts):
            vx = float(pos_world[v_i, 0])
            vy = float(pos_world[v_i, 1])
            vz = float(pos_world[v_i, 2])

            if vy < y_shoe_gate:
                # Lower Shoes / Feet
                if vx >= 0.0:
                    if vy >= y_shoe_gate - 0.05 * h_ball_world:
                        env = _make_env(hip_b, 0.4, l_calf_b, 0.6)
                    elif vz > z_toe_gate and l_toe_b != l_foot_b:
                        env = _make_env(l_foot_b, 0.4, l_toe_b, 0.6)
                    else:
                        env = _make_env(l_foot_b, 1.0)
                else:
                    if vy >= y_shoe_gate - 0.05 * h_ball_world:
                        env = _make_env(hip_b, 0.4, r_calf_b, 0.6)
                    elif vz > z_toe_gate and r_toe_b != r_foot_b:
                        env = _make_env(r_foot_b, 0.4, r_toe_b, 0.6)
                    else:
                        env = _make_env(r_foot_b, 1.0)
            elif vy <= y_fin_top and abs(vx) > r_arm_gate:
                # Outer Stub Arm Fins
                t_fin = (abs(vx) - r_arm_gate) / max(0.5, x_hand_world - r_arm_gate)
                if vx > 0.0:
                    if t_fin <= 0.45:
                        env = _make_env(bust_b, 0.5, l_sh_b, 0.5)
                    elif t_fin <= 0.80:
                        env = _make_env(l_sh_b, 0.5, l_arm_b, 0.5)
                    else:
                        env = _make_env(l_arm_b, 0.4, l_hand_b, 0.6)
                else:
                    if t_fin <= 0.45:
                        env = _make_env(bust_b, 0.5, r_sh_b, 0.5)
                    elif t_fin <= 0.80:
                        env = _make_env(r_sh_b, 0.5, r_arm_b, 0.5)
                    else:
                        env = _make_env(r_arm_b, 0.4, r_hand_b, 0.6)
            elif code == "Pr" and vy > y_sole_target + 0.74 * h_ball_world and abs(vx) > 0.52 * x_sh_world and (l_ear_chain or r_ear_chain):
                head_vert_count += 1
                if vx > 0.0 and l_ear_chain:
                    if vy >= y_sole_target + 0.84 * h_ball_world:
                        env = _make_env(l_ear_chain[0], 1.0)
                    else:
                        env = _make_env(head_bone_idx, 0.4, l_ear_chain[0], 0.6)
                elif vx < 0.0 and r_ear_chain:
                    if vy >= y_sole_target + 0.84 * h_ball_world:
                        env = _make_env(r_ear_chain[0], 1.0)
                    else:
                        env = _make_env(head_bone_idx, 0.4, r_ear_chain[0], 0.6)
                else:
                    env = _make_env(head_bone_idx, 1.0)
            else:
                # Central Spherical Face, Eyes, Cheeks, Headwear, & Belly -> 100% BodyN/HeadN
                if vy >= y_sole_target + 0.48 * h_ball_world:
                    head_vert_count += 1
                    env = _make_env(head_bone_idx, 1.0)
                elif vy >= y_sole_target + 0.36 * h_ball_world:
                    head_vert_count += 1
                    env = _make_env(bust_b, 0.4, head_bone_idx, 0.6)
                else:
                    env = _make_env(bust_b, 1.0)
                if any((bi in limb_bone_set) or (bi not in core_spherical_bones) for (bi, _) in env):
                    torso_limb_leak_vertices += 1

            vertex_envelopes.append(env)

        arm_align_deg_l = 0.0
        arm_align_deg_r = 0.0
        s_head_out = float(s_unif)
        fighter_height = float(pos_world[:, 1].max() - pos_world[:, 1].min())
        y_sh_glb_out = float(y_min_2m + 0.60 * h_src_2m)
        y_neck_glb_out = float(y_max_2m)
        y_sh_world_out = float(prop["y_sh"])
        body_vert_count = int(n_verts - head_vert_count)

    # ==========================================================================
    # Branch B — 1-Piece Biped Feet-to-Shoulders (24 Playable Fighters + Nn)
    # ==========================================================================
    else:
        y_sh_target = float(prop["y_sh"])
        h_sh_world = float(prop["h_sh"])
        x_skel_sh_world = max(
            abs(float(bones[l_sh_b]["world_pos"][0])),
            abs(float(bones[r_sh_b]["world_pos"][0])),
            abs(float(_bpos("LShoulderJA")[0])),
            float(prop["x_sh"]),
        )

        lm = discover_1piece_biped_landmarks_and_head_partition(
            pos_2m=pos_2m,
            triangles=triangles,
            code=code,
            x_skel_sh_world=x_skel_sh_world,
            h_sh_world=h_sh_world,
        )
        head_mask = lm["head_mask"]
        body_mask = lm["body_mask"]
        y_sole_glb = float(lm["y_sole_glb"])
        x_center_glb = float(lm["x_center_glb"])
        z_sole_glb = float(lm["z_sole_glb"])
        z_neck_glb = float(lm["z_neck_glb"])
        x_mesh_trunk_glb = float(lm["x_mesh_trunk_glb"])
        x_armpit_glb = float(lm["x_armpit_glb"])
        y_sh_glb = float(lm["y_sh_glb"])
        y_neck_glb = float(lm["y_neck_glb"])
        q_lsh = lm["q_lsh"]
        q_rsh = lm["q_rsh"]
        src_l_dir = lm["src_l_dir"]
        src_r_dir = lm["src_r_dir"]
        l_arm_cand = lm["l_arm_cand"]
        r_arm_cand = lm["r_arm_cand"]

        head_vert_count = int(np.count_nonzero(head_mask))
        body_vert_count = int(np.count_nonzero(body_mask))

        # 100% Uniform Feet-to-Shoulders Scaling (Spec 043 §4.4.2.4, INV-1PIECE-FEET-TO-SHOULDERS-01)
        span_sh_glb = y_sh_glb - y_sole_glb
        s_unif = h_sh_world / span_sh_glb
        s_head_out = float(s_unif)

        # Deterministic Pure-SO(3) Pre-Skinning Arm-Elevation Alignment (> 3.0 deg; Spec 043 §4.4.2.3)
        raw_dst_l = bones[l_hand_b]["world_pos"].astype(np.float64) - bones[l_sh_b]["world_pos"].astype(np.float64)
        raw_dst_r = bones[r_hand_b]["world_pos"].astype(np.float64) - bones[r_sh_b]["world_pos"].astype(np.float64)
        if float(np.linalg.norm(raw_dst_l)) < 0.3:
            raw_dst_l = _bpos("LHandN") - _bpos("LShoulderJA")
        if float(np.linalg.norm(raw_dst_r)) < 0.3:
            raw_dst_r = _bpos("RHandN") - _bpos("RShoulderJA")

        def _clamped_yaw_arm_target(dv: np.ndarray, sign_x: float) -> np.ndarray:
            horiz = math.hypot(float(dv[0]), float(dv[2]))
            if horiz < 1e-5:
                return np.array([sign_x, 0.0, 0.0], dtype=np.float64)
            yaw = float(np.clip(math.atan2(float(dv[2]), max(1e-6, abs(float(dv[0])))), -math.radians(35.0), math.radians(35.0)))
            return np.array([sign_x * horiz * math.cos(yaw), float(dv[1]), horiz * math.sin(yaw)], dtype=np.float64)

        dst_l_dir = _clamped_yaw_arm_target(raw_dst_l, +1.0)
        dst_r_dir = _clamped_yaw_arm_target(raw_dst_r, -1.0)

        def _vec_angle_deg(a: np.ndarray, b: np.ndarray) -> float:
            na = float(np.linalg.norm(a))
            nb = float(np.linalg.norm(b))
            if na < 1e-6 or nb < 1e-6:
                return 0.0
            c = float(np.clip(np.dot(a / na, b / nb), -1.0, 1.0))
            return float(math.degrees(math.acos(c)))

        arm_align_deg_l = _vec_angle_deg(src_l_dir, dst_l_dir)
        arm_align_deg_r = _vec_angle_deg(src_r_dir, dst_r_dir)
        R_l_arm = _rotation_matrix_from_vectors(src_l_dir, dst_l_dir) if arm_align_deg_l > 3.0 else np.eye(3, dtype=np.float64)
        R_r_arm = _rotation_matrix_from_vectors(src_r_dir, dst_r_dir) if arm_align_deg_r > 3.0 else np.eye(3, dtype=np.float64)

        max_arm_dx_glb = (
            float(np.percentile(np.abs(pos_2m[l_arm_cand | r_arm_cand, 0] - x_center_glb), 96))
            if np.any(l_arm_cand | r_arm_cand)
            else (x_armpit_glb + 0.30)
        )
        arm_blend_glb = max(0.055, min(0.14, 0.24 * max(0.08, max_arm_dx_glb - x_armpit_glb)))

        pos_rot = pos_2m.copy()
        nrm_rot = nrm_2m.copy()
        if arm_align_deg_l > 3.0 or arm_align_deg_r > 3.0:
            y_arm_floor_glb = y_sole_glb + 0.34 * span_sh_glb
            for i in range(n_verts):
                if head_mask[i]:
                    continue
                p = pos_2m[i]
                if p[1] < y_arm_floor_glb:
                    continue
                dx = float(p[0] - x_center_glb)
                if dx > x_armpit_glb and arm_align_deg_l > 3.0:
                    w_arm = float(np.clip((dx - x_armpit_glb) / arm_blend_glb, 0.0, 1.0))
                    rel = p - q_lsh
                    pos_rot[i] = q_lsh + (1.0 - w_arm) * rel + w_arm * (R_l_arm @ rel)
                    nb = (1.0 - w_arm) * nrm_2m[i] + w_arm * (R_l_arm @ nrm_2m[i])
                    nrm_rot[i] = nb / max(1e-8, float(np.linalg.norm(nb)))
                elif dx < -x_armpit_glb and arm_align_deg_r > 3.0:
                    w_arm = float(np.clip((-x_armpit_glb - dx) / arm_blend_glb, 0.0, 1.0))
                    rel = p - q_rsh
                    pos_rot[i] = q_rsh + (1.0 - w_arm) * rel + w_arm * (R_r_arm @ rel)
                    nb = (1.0 - w_arm) * nrm_2m[i] + w_arm * (R_r_arm @ nrm_2m[i])
                    nrm_rot[i] = nb / max(1e-8, float(np.linalg.norm(nb)))

        # Anchor sagittal Z to the fighter's native foot-sole/pelvis centerline (Spec 043 §4.4.2.4)
        z_foot_center_world = 0.25 * float(
            bones[l_foot_b]["world_pos"][2]
            + bones[r_foot_b]["world_pos"][2]
            + bones[l_toe_b]["world_pos"][2]
            + bones[r_toe_b]["world_pos"][2]
        )
        z_hip_world = float(bones[hip_b]["world_pos"][2])
        z_anchor_world = 0.5 * (z_foot_center_world + z_hip_world)

        # Apply exact 100% uniform Feet-to-Shoulders scale S_unif to every vertex (V_body U V_head)
        pos_world = np.empty_like(pos_rot)
        pos_world[:, 0] = (pos_rot[:, 0] - x_center_glb) * s_unif
        pos_world[:, 1] = y_sole_target + (pos_rot[:, 1] - y_sole_glb) * s_unif
        pos_world[:, 2] = z_anchor_world + (pos_rot[:, 2] - z_sole_glb) * s_unif
        nrm_world = nrm_rot.copy()
        fighter_height = float(pos_world[:, 1].max() - pos_world[:, 1].min())

        # Pre-arm-rotation world coordinates for strictly clean 5-zone anatomical partitioning
        pos_unrot_world = np.empty_like(pos_2m)
        pos_unrot_world[:, 0] = (pos_2m[:, 0] - x_center_glb) * s_unif
        pos_unrot_world[:, 1] = y_sole_target + (pos_2m[:, 1] - y_sole_glb) * s_unif
        pos_unrot_world[:, 2] = z_anchor_world + (pos_2m[:, 2] - z_sole_glb) * s_unif

        y_sh_world = y_sole_target + (y_sh_glb - y_sole_glb) * s_unif
        y_neck_world = y_sole_target + (y_neck_glb - y_sole_glb) * s_unif
        z_neck_world = z_anchor_world + (z_neck_glb - z_sole_glb) * s_unif
        h_head_world = max(0.5, float(pos_unrot_world[:, 1].max()) - y_neck_world)
        y_sh_glb_out = float(y_sh_glb)
        y_neck_glb_out = float(y_neck_glb)
        y_sh_world_out = float(y_sh_world)

        # Dynamic world-space Y_hip_gate & X_torso_gate from fighter's extracted deform bones (Spec 043 §4.4.3)
        y_hip_bone = float(bones[hip_b]["world_pos"][1])
        y_thigh_bone = 0.5 * (float(bones[l_thigh_b]["world_pos"][1]) + float(bones[r_thigh_b]["world_pos"][1]))
        y_knee_bone = 0.5 * (float(bones[l_calf_b]["world_pos"][1]) + float(bones[r_calf_b]["world_pos"][1]))
        y_ankle_bone = 0.5 * (float(bones[l_foot_b]["world_pos"][1]) + float(bones[r_foot_b]["world_pos"][1]))

        y_pelvis_skel = min(y_hip_bone, y_thigh_bone)
        if y_knee_bone >= y_pelvis_skel - 0.15:
            y_knee_bone = y_sole_target + 0.52 * max(1.0, y_pelvis_skel - y_sole_target)
        if y_ankle_bone >= y_knee_bone - 0.15:
            y_ankle_bone = y_sole_target + 0.18 * max(1.0, y_pelvis_skel - y_sole_target)

        # Corroborate Y_hip_gate with the mesh's crotch bifurcation in world space
        body_unrot_w = pos_unrot_world[body_mask]
        crotch_cand_y = None
        n_slices = 18
        y_scan_lo = y_sole_target + 0.24 * h_sh_world
        y_scan_hi = y_sole_target + 0.66 * h_sh_world
        slice_h = (y_scan_hi - y_scan_lo) / float(n_slices)
        center_gap_x = 0.032 * h_sh_world
        leg_side_x = 0.045 * h_sh_world
        for s_i in range(n_slices):
            ylo = y_scan_lo + s_i * slice_h
            yhi = ylo + slice_h
            in_sl = (body_unrot_w[:, 1] >= ylo) & (body_unrot_w[:, 1] < yhi)
            if np.count_nonzero(in_sl) < 6:
                continue
            xs = body_unrot_w[in_sl, 0]
            has_left = np.any((xs > leg_side_x) & (xs < x_armpit_glb * s_unif))
            has_right = np.any((xs < -leg_side_x) & (xs > -x_armpit_glb * s_unif))
            center_empty = not np.any(np.abs(xs) <= center_gap_x)
            if has_left and has_right and center_empty:
                crotch_cand_y = yhi
        y_hip_default = 0.72 * y_pelvis_skel + 0.28 * y_knee_bone
        y_hip_lo = y_knee_bone + 0.25 * max(0.4, y_pelvis_skel - y_knee_bone)
        y_hip_hi = max(y_hip_lo + 0.1, y_pelvis_skel)
        y_hip_gate = float(np.clip(crotch_cand_y if crotch_cand_y is not None else y_hip_default, y_hip_lo, y_hip_hi))

        x_torso_gate = x_armpit_glb * s_unif

        # Euclidean skeletal upper-arm vs forearm fraction along the arm chain
        len_upper_arm = float(np.linalg.norm(bones[l_arm_b]["world_pos"] - bones[l_sh_b]["world_pos"]))
        len_forearm = float(np.linalg.norm(bones[l_hand_b]["world_pos"] - bones[l_arm_b]["world_pos"]))
        u_elbow = float(np.clip(len_upper_arm / max(0.5, len_upper_arm + len_forearm), 0.32, 0.62))

        arm_zone_mask = body_mask & (pos_unrot_world[:, 1] >= y_hip_gate) & (np.abs(pos_unrot_world[:, 0]) > x_torso_gate)
        if np.any(arm_zone_mask):
            arm_r_vals = np.hypot(
                np.abs(pos_unrot_world[arm_zone_mask, 0]) - x_torso_gate,
                np.maximum(0.0, np.abs(pos_unrot_world[arm_zone_mask, 1] - y_sh_world) * 0.65),
            )
            max_arm_r_world = max(1.0, float(np.percentile(arm_r_vals, 98)))
        else:
            max_arm_r_world = max(1.0, len_upper_arm + len_forearm)

        z_ankle_world = 0.5 * (float(bones[l_foot_b]["world_pos"][2]) + float(bones[r_foot_b]["world_pos"][2]))
        z_toe_world = 0.5 * (float(bones[l_toe_b]["world_pos"][2]) + float(bones[r_toe_b]["world_pos"][2]))
        z_forefoot_gate = (
            0.5 * (z_ankle_world + z_toe_world)
            if (z_toe_world > z_ankle_world + 0.15)
            else (z_anchor_world + 0.05 * h_sh_world)
        )

        pauldron_leak_x_gate = max(1.18 * x_torso_gate, x_skel_sh_world + 0.12 * h_sh_world)
        pauldron_leak_y_ceil = y_sh_target + 0.16 * h_sh_world

        # Assign 5-zone region-gated weights in Melee world space (Spec 043 §4.4.3)
        for v_i in range(n_verts):
            vx_u = float(pos_unrot_world[v_i, 0])
            vy_u = float(pos_unrot_world[v_i, 1])
            vz_u = float(pos_unrot_world[v_i, 2])

            # Zone 1: Cranial Partition V_head (Head, Ears/Horns, & Smooth Cervical Collar Blend)
            if head_mask[v_i]:
                if l_ear_chain and vx_u > 0.22 * h_head_world and vy_u > y_neck_world + 0.42 * h_head_world:
                    if len(l_ear_chain) >= 2 and vy_u >= y_neck_world + 0.72 * h_head_world:
                        env = _make_env(l_ear_chain[0], 0.4, l_ear_chain[-1], 0.6)
                    else:
                        env = _make_env(l_ear_chain[0], 1.0)
                elif r_ear_chain and vx_u < -0.22 * h_head_world and vy_u > y_neck_world + 0.42 * h_head_world:
                    if len(r_ear_chain) >= 2 and vy_u >= y_neck_world + 0.72 * h_head_world:
                        env = _make_env(r_ear_chain[0], 0.4, r_ear_chain[-1], 0.6)
                    else:
                        env = _make_env(r_ear_chain[0], 1.0)
                elif vy_u <= y_neck_world + 0.045 * h_sh_world:
                    env = _make_env(bust_b, 0.5, head_bone_idx, 0.5)
                elif vy_u <= y_neck_world + 0.075 * h_sh_world and vz_u < z_neck_world - 0.045 * h_sh_world:
                    env = _make_env(bust_b, 0.4, head_bone_idx, 0.6)
                else:
                    env = _make_env(head_bone_idx, 1.0)

                if abs(vx_u) > pauldron_leak_x_gate and vy_u <= pauldron_leak_y_ceil:
                    if any(bi == head_bone_idx for (bi, _) in env):
                        shoulder_pauldron_head_leak_vertices += 1
                vertex_envelopes.append(env)
                continue

            # Zone 3: Left Arm & Hand (vy_u >= y_hip_gate and vx_u > x_torso_gate)
            if vy_u >= y_hip_gate and vx_u > x_torso_gate:
                r_arm = math.hypot(vx_u - x_torso_gate, abs(vy_u - y_sh_world) * 0.65)
                t_arm = r_arm / max_arm_r_world
                if t_arm <= 0.18:
                    env = _make_env(bust_b, 0.6, l_sh_b, 0.4)
                elif t_arm <= u_elbow - 0.08:
                    env = _make_env(l_sh_b, 1.0)
                elif t_arm <= u_elbow + 0.10:
                    env = _make_env(l_sh_b, 0.5, l_arm_b, 0.5)
                elif t_arm <= 0.78:
                    env = _make_env(l_arm_b, 1.0)
                else:
                    env = _make_env(l_arm_b, 0.4, l_hand_b, 0.6)
            # Zone 4: Right Arm & Hand (vy_u >= y_hip_gate and vx_u < -x_torso_gate)
            elif vy_u >= y_hip_gate and vx_u < -x_torso_gate:
                r_arm = math.hypot(-vx_u - x_torso_gate, abs(vy_u - y_sh_world) * 0.65)
                t_arm = r_arm / max_arm_r_world
                if t_arm <= 0.18:
                    env = _make_env(bust_b, 0.6, r_sh_b, 0.4)
                elif t_arm <= u_elbow - 0.08:
                    env = _make_env(r_sh_b, 1.0)
                elif t_arm <= u_elbow + 0.10:
                    env = _make_env(r_sh_b, 0.5, r_arm_b, 0.5)
                elif t_arm <= 0.78:
                    env = _make_env(r_arm_b, 1.0)
                else:
                    env = _make_env(r_arm_b, 0.4, r_hand_b, 0.6)
            # Zone 2: Spine / Torso / Shell / Belly Core (vy_u >= y_hip_gate and |vx_u| <= x_torso_gate)
            elif vy_u >= y_hip_gate:
                t_sp = (vy_u - y_hip_gate) / max(0.5, y_neck_world - y_hip_gate)
                if len(spine_chain) >= 3 and hip_b != waist_b and waist_b != bust_b:
                    if t_sp >= 0.68:
                        env = _make_env(bust_b, 1.0)
                    elif t_sp >= 0.50:
                        env = _make_env(waist_b, 0.4, bust_b, 0.6)
                    elif t_sp >= 0.34:
                        env = _make_env(waist_b, 1.0)
                    elif t_sp >= 0.16:
                        env = _make_env(hip_b, 0.4, waist_b, 0.6)
                    else:
                        env = _make_env(hip_b, 1.0)
                elif len(spine_chain) >= 2 and hip_b != bust_b:
                    if t_sp >= 0.62:
                        env = _make_env(bust_b, 1.0)
                    elif t_sp >= 0.44:
                        env = _make_env(hip_b, 0.4, bust_b, 0.6)
                    elif t_sp >= 0.26:
                        env = _make_env(hip_b, 0.6, bust_b, 0.4)
                    else:
                        env = _make_env(hip_b, 1.0)
                else:
                    env = _make_env(hip_b, 1.0)

                if any((bi not in spine_bone_set) for (bi, _) in env):
                    torso_limb_leak_vertices += 1
            # Zone 5A: Left Leg & Foot (vy_u < y_hip_gate and vx_u >= 0.0)
            elif vx_u >= 0.0:
                thigh_span = max(0.4, y_hip_gate - y_knee_bone)
                shin_span = max(0.4, y_knee_bone - y_ankle_bone)
                if vy_u >= y_hip_gate - 0.18 * thigh_span:
                    env = _make_env(hip_b, 0.4, l_thigh_b, 0.6)
                elif vy_u >= y_knee_bone + 0.22 * thigh_span:
                    env = _make_env(l_thigh_b, 1.0)
                elif vy_u >= y_knee_bone - 0.22 * shin_span:
                    env = _make_env(l_thigh_b, 0.4, l_calf_b, 0.6)
                elif vy_u >= y_ankle_bone + 0.30 * shin_span:
                    env = _make_env(l_calf_b, 1.0)
                elif vy_u >= y_ankle_bone + 0.06 * shin_span:
                    env = _make_env(l_calf_b, 0.4, l_foot_b, 0.6)
                elif vz_u > z_forefoot_gate and l_toe_b != l_foot_b:
                    env = _make_env(l_foot_b, 0.4, l_toe_b, 0.6)
                else:
                    env = _make_env(l_foot_b, 1.0)
            # Zone 5B: Right Leg & Foot (vy_u < y_hip_gate and vx_u < 0.0)
            else:
                thigh_span = max(0.4, y_hip_gate - y_knee_bone)
                shin_span = max(0.4, y_knee_bone - y_ankle_bone)
                if vy_u >= y_hip_gate - 0.18 * thigh_span:
                    env = _make_env(hip_b, 0.4, r_thigh_b, 0.6)
                elif vy_u >= y_knee_bone + 0.22 * thigh_span:
                    env = _make_env(r_thigh_b, 1.0)
                elif vy_u >= y_knee_bone - 0.22 * shin_span:
                    env = _make_env(r_thigh_b, 0.4, r_calf_b, 0.6)
                elif vy_u >= y_ankle_bone + 0.30 * shin_span:
                    env = _make_env(r_calf_b, 1.0)
                elif vy_u >= y_ankle_bone + 0.06 * shin_span:
                    env = _make_env(r_calf_b, 0.4, r_foot_b, 0.6)
                elif vz_u > z_forefoot_gate and r_toe_b != r_foot_b:
                    env = _make_env(r_foot_b, 0.4, r_toe_b, 0.6)
                else:
                    env = _make_env(r_foot_b, 1.0)

            vertex_envelopes.append(env)

    # Verify zero *JA zero-IBM references and zero anatomical leak breaches across all assigned vertex envelopes
    zero_ibm_envelope_refs = sum(
        1
        for env in vertex_envelopes
        for (b_idx, _) in env
        if bones[b_idx]["ibm_ptr"] == 0
    )
    if zero_ibm_envelope_refs != 0:
        raise AssertionError(
            f"Fatal [INV-SKEL-SKIN-01]: {zero_ibm_envelope_refs} vertex envelope weight(s) reference zero-IBM (*JA) bones on '{code}'"
        )
    if torso_limb_leak_vertices != 0:
        raise AssertionError(
            f"Fatal [INV-SKEL-SKIN-01]: {torso_limb_leak_vertices} torso/spherical-core vertices leaked onto limb bones on '{code}'"
        )
    if shoulder_pauldron_head_leak_vertices != 0:
        raise AssertionError(
            f"Fatal [INV-TOPO-HEAD-01]: {shoulder_pauldron_head_leak_vertices} lateral shoulder-pauldron vertices leaked onto HeadN on '{code}'"
        )

    # Partition triangles into linked HSD_PObjDesc batches with <= 10 unique envelopes per batch (INV-GX-10ENV-01)
    batches: List[Dict[str, Any]] = []
    for tri in triangles:
        v0, v1, v2 = int(tri[0]), int(tri[1]), int(tri[2])
        req_envs = {vertex_envelopes[v0], vertex_envelopes[v1], vertex_envelopes[v2]}
        placed = False
        for batch in batches:
            union_envs = batch["env_set"] | req_envs
            if len(union_envs) <= 10:
                batch["env_set"] = union_envs
                batch["tris"].append((v0, v1, v2))
                placed = True
                break
        if not placed:
            batches.append({
                "env_set": set(req_envs),
                "tris": [(v0, v1, v2)],
            })

    for b in batches:
        b["env_list"] = sorted(
            b["env_set"],
            key=lambda env: (len(env), tuple(x[0] for x in env), tuple(x[1] for x in env)),
        )
        b["env_index_map"] = {env: idx for idx, env in enumerate(b["env_list"])}

    wb_min = [round(float(x), 4) for x in pos_world.min(axis=0)]
    wb_max = [round(float(x), 4) for x in pos_world.max(axis=0)]

    return {
        "pos_world": pos_world.astype(np.float32),
        "nrm_world": nrm_world.astype(np.float32),
        "uvs": uvs,
        "triangles": triangles,
        "vertex_envelopes": vertex_envelopes,
        "batches": batches,
        "uniform_scale": float(s_unif),
        "head_uniform_scale": float(s_head_out),
        "fighter_height": float(fighter_height),
        "anatomy_mode": prop["mode"],
        "y_sh_glb_2m": round(y_sh_glb_out, 4),
        "y_neck_glb_2m": round(y_neck_glb_out, 4),
        "y_sh_world": round(y_sh_world_out, 4),
        "head_vertex_count": int(head_vert_count),
        "body_vertex_count": int(body_vert_count),
        "arm_alignment_deg_left": round(float(arm_align_deg_l), 3),
        "arm_alignment_deg_right": round(float(arm_align_deg_r), 3),
        "zero_ibm_envelope_refs": int(zero_ibm_envelope_refs),
        "torso_limb_leak_vertices": int(torso_limb_leak_vertices),
        "shoulder_pauldron_head_leak_vertices": int(shoulder_pauldron_head_leak_vertices),
        "world_bounds_min": wb_min,
        "world_bounds_max": wb_max,
    }


# ==============================================================================
# Stage 4 — HAL SysDolphin Pl<XX>Nr.dat Compiler + PlGw.dat Patch + Rigged .glb
# ==============================================================================

def compile_melee_dat_archive(
    skel: Dict[str, Any],
    retargeted: Dict[str, Any],
    gx_rgb5a3_bytes: bytes,
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Compiles a valid HAL SysDolphin Pl<XX>Nr.dat binary archive preserving 100% of
    the fighter's HSD_JObjDesc nodes, bone order, local transforms, IBMs, matanim_joint,
    and per-bone HSD_DObjDesc linked-list lengths while attaching the custom rigged
    GX_TF_RGB5A3 texture and <=10-envelope POBJ_ENVELOPE GX display lists.
    """
    nr_raw = skel["nr_raw"]
    fsize, orig_dsize, orig_nreloc, npub, next_ = struct.unpack(">5I", nr_raw[:20])
    version_tag = nr_raw[20:32]

    dsec = bytearray(nr_raw[32 : 32 + orig_dsize])
    reloc_off = 32 + orig_dsize
    pub_off = reloc_off + orig_nreloc * 4
    tail_tables = nr_raw[pub_off:]  # public + extern + string tables untouched

    relocs = set(struct.unpack(f">{orig_nreloc}I", nr_raw[reloc_off:pub_off]))
    bones = skel["bones"]

    def _pad_dsec(align: int = 32) -> int:
        rem = len(dsec) % align
        if rem:
            dsec.extend(b"\x00" * (align - rem))
        return len(dsec)

    # Ensure every deform bone referenced by any envelope has a non-null 3x4 Inverse Bind Matrix in dsec
    used_bones = {
        b_idx
        for env in retargeted["vertex_envelopes"]
        for (b_idx, _) in env
    }
    for b_idx in sorted(used_bones):
        b_info = bones[b_idx]
        if b_info["ibm_ptr"] == 0:
            _pad_dsec(4)
            new_ibm_off = len(dsec)
            ibm_3x4 = b_info["ibm_mat4"][:3, :].astype(">f4").tobytes()
            dsec.extend(ibm_3x4)
            jobj_ibm_field = b_info["offset"] + 0x38
            struct.pack_into(">I", dsec, jobj_ibm_field, new_ibm_off)
            relocs.add(jobj_ibm_field)
            b_info["ibm_ptr"] = new_ibm_off

    # Clear pobj on existing Nintendo DObj nodes while preserving:
    # - child-bone DObjs (b_info["index"] > 0, e.g. DObjs 22..25 in PlPkNr.dat)
    # - Tailed fighters' native tail DObjs on Bone 0 (Pk, Pc, Fx, Fc, Ys, Mt, Kp; INV-NATIVE-APPENDAGE-01)
    root_jobj_off = skel["root_jobj_off"]
    jobj_off_to_idx = {b["offset"]: b["index"] for b in bones}
    raw_code = str(skel.get("code") or "Pk").strip()
    norm_code = raw_code[0].upper() + raw_code[1].lower() if len(raw_code) == 2 else "Pk"
    tail_bones = set(FIGHTER_TAIL_BONES.get(norm_code, set()))
    tail_root_support = set(FIGHTER_TAIL_ROOT_SUPPORT_BONES.get(norm_code, set()))
    protected_host_dobjs = {skel.get("hp_host_dobj"), skel.get("lp_host_dobj")}

    def _dobj_ref_bones(dpobj_off: int) -> set[int]:
        refs: set[int] = set()
        pcur = dpobj_off
        seen_p: set[int] = set()
        while pcur and pcur + 24 <= orig_dsize and pcur not in seen_p:
            seen_p.add(pcur)
            _, pnxt, _, pflags, _, _, penv = struct.unpack_from(">IIIHHII", dsec, pcur)
            ptype = (pflags >> 12) & 0x3
            if ptype in (1, 2) and penv and penv + 4 <= orig_dsize:
                ecur = penv
                while ecur + 4 <= orig_dsize:
                    eptr = struct.unpack_from(">I", dsec, ecur)[0]
                    if eptr == 0:
                        break
                    it = eptr
                    while it + 8 <= orig_dsize:
                        joff, wval = struct.unpack_from(">If", dsec, it)
                        if joff == 0 or wval <= 0.0:
                            break
                        if joff in jobj_off_to_idx:
                            refs.add(jobj_off_to_idx[joff])
                        it += 8
                    ecur += 4
            elif ptype == 0 and penv in jobj_off_to_idx:
                refs.add(jobj_off_to_idx[penv])
            pcur = pnxt
        return refs

    bone0_dobjs: List[int] = []
    preserved_tail_dobj_indices: List[int] = []
    preserved_child_dobj_count = 0
    for b_info in bones:
        dcur = b_info["dobj"]
        if dcur == 0 or (b_info["flags"] & 0x4000):  # skip spline RObj
            continue
        while dcur and dcur + 16 <= orig_dsize:
            _, dnxt, dmobj, dpobj = struct.unpack_from(">4I", dsec, dcur)
            if b_info["index"] > 0:
                # Preserve child-bone DObjs untouched (weapons, shields, sheaths, props)
                if dpobj != 0:
                    preserved_child_dobj_count += 1
                dcur = dnxt
                continue
            dobj_idx_on_b0 = len(bone0_dobjs)
            bone0_dobjs.append(dcur)
            if tail_bones and dpobj != 0 and dobj_idx_on_b0 not in protected_host_dobjs:
                ref_b = _dobj_ref_bones(dpobj)
                if ref_b and (ref_b & tail_bones) and ref_b.issubset(tail_bones | tail_root_support):
                    # Preserve native tail appendage DObjs untouched (INV-NATIVE-APPENDAGE-01)
                    preserved_tail_dobj_indices.append(dobj_idx_on_b0)
                    dcur = dnxt
                    continue
            # Zero out pobj so original Nintendo polygon mesh does not render
            struct.pack_into(">I", dsec, dcur + 12, 0)
            relocs.discard(dcur + 12)
            dcur = dnxt

    # Build vertex buffers:
    # CRITICAL HAL SysDolphin PObjSetupMtx law:
    # - 1-bone rigid envelopes (weight == 1.0f) use M = W_b(anim) directly (without multiplying by IBM_b),
    #   so their stored vertex position/normal MUST be in bone-local space: IBM_b * p_world.
    # - Multi-bone envelopes (2+ bones, weight < 1.0f) use M = sum(w_k * W_b_k(anim) * IBM_b_k),
    #   so their stored vertex position/normal MUST be in world bind space: p_world.
    pos_world = retargeted["pos_world"]
    nrm_world = retargeted["nrm_world"]
    uvs = retargeted["uvs"]
    vertex_envelopes = retargeted["vertex_envelopes"]

    n_verts = len(pos_world)
    pos_stored = np.empty((n_verts, 3), dtype=np.float32)
    nrm_stored = np.empty((n_verts, 3), dtype=np.float32)

    for v_i in range(n_verts):
        env = vertex_envelopes[v_i]
        pw = pos_world[v_i]
        nw = nrm_world[v_i]
        if len(env) == 1:
            b_idx = env[0][0]
            ibm = bones[b_idx]["ibm_mat4"]
            p_hom = np.array([float(pw[0]), float(pw[1]), float(pw[2]), 1.0], dtype=np.float64)
            pos_stored[v_i] = (ibm @ p_hom)[:3].astype(np.float32)
            n_loc = ibm[:3, :3] @ nw.astype(np.float64)
            n_norm = float(np.linalg.norm(n_loc))
            nrm_stored[v_i] = (n_loc / max(1e-8, n_norm)).astype(np.float32)
        else:
            pos_stored[v_i] = pw
            nrm_stored[v_i] = nw

    # 1. Append 32-byte-aligned GX_VA_POS (f32x3), GX_VA_NRM (f32x3), GX_VA_TEX0 (f32x2)
    pos_buf_off = _pad_dsec(32)
    dsec.extend(pos_stored.astype(">f4").tobytes())

    nrm_buf_off = _pad_dsec(32)
    dsec.extend(nrm_stored.astype(">f4").tobytes())

    uv_buf_off = _pad_dsec(32)
    dsec.extend(uvs.astype(">f4").tobytes())

    # 2. Append GX_TF_RGB5A3 texture buffer (32-byte aligned)
    tex_buf_off = _pad_dsec(32)
    dsec.extend(gx_rgb5a3_bytes)
    tex_dim = max(64, int(round(math.sqrt(len(gx_rgb5a3_bytes) // 2))))

    # 3. Append HSD_ImageDesc (24 B) + HSD_TObjTevDesc (32 B) + HSD_TObjDesc (92 B) + HSD_Material (20 B) + HSD_MObjDesc (24 B)
    _pad_dsec(4)
    imagedesc_off = len(dsec)
    dsec.extend(struct.pack(">IHHIIff", tex_buf_off, tex_dim, tex_dim, 5, 0, 0.0, 0.0))
    relocs.add(imagedesc_off + 0)

    tobj_tev_off = len(dsec)
    dsec.extend(struct.pack(">8I", 0, 0x00000101, 0x8580080F, 0x07070707, 0, 0, 0, 0))

    tobj_off = len(dsec)
    dsec.extend(struct.pack(
        ">IIIIfffffffffIIIIIIIIII",
        0,                  # +0x00 class_name
        0,                  # +0x04 next
        0,                  # +0x08 id = GX_TEXMAP0
        4,                  # +0x0C src = GX_TG_TEX0
        0.0, 0.0, 0.0,      # +0x10 rotate
        1.0, 1.0, 1.0,      # +0x1C scale
        0.0, 0.0, 0.0,      # +0x28 translate
        0,                  # +0x34 wrap_s = GX_CLAMP
        0,                  # +0x38 wrap_t = GX_CLAMP
        0x01010000,         # +0x3C repeat_s=1, repeat_t=1
        0x00050010,         # +0x40 flag = COORD_UV | LIGHTMAP_DIFFUSE | COLORMAP_MODULATE
        0x3F800000,         # +0x44 blending = 1.0f
        1,                  # +0x48 magFilt = GX_LINEAR
        imagedesc_off,      # +0x4C imagedesc (RELOC)
        0,                  # +0x50 tlutdesc
        0,                  # +0x54 lod
        tobj_tev_off,       # +0x58 tev (RELOC)
    ))
    relocs.add(tobj_off + 0x4C)
    relocs.add(tobj_off + 0x58)

    mat_off = len(dsec)
    dsec.extend(struct.pack(">IIIff", 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 1.0, 50.0))

    mobj_off = len(dsec)
    dsec.extend(struct.pack(">6I", 0, 0x00000014, tobj_off, mat_off, 0, 0))
    relocs.add(mobj_off + 8)
    relocs.add(mobj_off + 12)

    # 4. Append 5-entry HSD_VtxDescList (5 * 24 = 120 B)
    vtx_desc_off = _pad_dsec(4)
    # Entry 0: GX_VA_PNMTXIDX (0), GX_DIRECT (1), cnt=0, ctype=4, frac=0, stride=0, ptr=0
    dsec.extend(struct.pack(">IIIIBxhI", 0, 1, 0, 4, 0, 0, 0))
    # Entry 1: GX_VA_POS (9), GX_INDEX16 (3), GX_POS_XYZ (1), GX_F32 (4), frac=0, stride=12, ptr=pos_buf_off
    e1_off = len(dsec)
    dsec.extend(struct.pack(">IIIIBxhI", 9, 3, 1, 4, 0, 12, pos_buf_off))
    relocs.add(e1_off + 20)
    # Entry 2: GX_VA_NRM (10), GX_INDEX16 (3), GX_NRM_XYZ (0), GX_F32 (4), frac=0, stride=12, ptr=nrm_buf_off
    e2_off = len(dsec)
    dsec.extend(struct.pack(">IIIIBxhI", 10, 3, 0, 4, 0, 12, nrm_buf_off))
    relocs.add(e2_off + 20)
    # Entry 3: GX_VA_TEX0 (13), GX_INDEX16 (3), GX_TEX_ST (1), GX_F32 (4), frac=0, stride=8, ptr=uv_buf_off
    e3_off = len(dsec)
    dsec.extend(struct.pack(">IIIIBxhI", 13, 3, 1, 4, 0, 8, uv_buf_off))
    relocs.add(e3_off + 20)
    # Entry 4: GX_VA_NULL (255), type=2, cnt=0, ctype=4, frac=0, stride=0, ptr=0
    dsec.extend(struct.pack(">IIIIBxhI", 255, 2, 0, 4, 0, 0, 0))

    # 5. Emit unique HSD_EnvelopeDesc lists and linked HSD_PObjDesc batches (each <= 10 envelopes)
    env_desc_offset_cache: Dict[Tuple[Tuple[int, float], ...], int] = {}
    batches = retargeted["batches"]
    for batch in batches:
        for env in batch["env_list"]:
            if env not in env_desc_offset_cache:
                _pad_dsec(4)
                e_off = len(dsec)
                for b_idx, w_val in env:
                    j_off = bones[b_idx]["offset"]
                    pair_off = len(dsec)
                    dsec.extend(struct.pack(">If", j_off, float(w_val)))
                    relocs.add(pair_off)
                dsec.extend(struct.pack(">If", 0, 0.0))
                env_desc_offset_cache[env] = e_off

    pobj_offsets: List[int] = []
    max_envelopes_in_any_pobj = 0

    for batch in batches:
        env_list = batch["env_list"]
        assert len(env_list) <= 10, f"INV-GX-10ENV-01 violation: {len(env_list)} > 10 envelopes"
        max_envelopes_in_any_pobj = max(max_envelopes_in_any_pobj, len(env_list))

        # Emit NULL-terminated envelope_p pointer array
        _pad_dsec(4)
        env_arr_off = len(dsec)
        for env in env_list:
            ptr_off = len(dsec)
            dsec.extend(struct.pack(">I", env_desc_offset_cache[env]))
            relocs.add(ptr_off)
        dsec.extend(struct.pack(">I", 0))

        # Build 32-byte-aligned GX_DRAW_TRIANGLES (0x90) display list
        # Enforce GameCube GX Clockwise (CW, dot < 0) front-facing winding on 100% of triangles
        tris = batch["tris"]
        env_map = batch["env_index_map"]
        n_dl_verts = len(tris) * 3
        dl_buf = bytearray()
        dl_buf.extend(struct.pack(">BH", 0x90, n_dl_verts))
        for v0, v1, v2 in tris:
            p0, p1, p2 = pos_world[v0], pos_world[v1], pos_world[v2]
            n_avg = nrm_world[v0] + nrm_world[v1] + nrm_world[v2]
            fn = np.cross(p1 - p0, p2 - p0)
            if float(np.dot(fn, n_avg)) > 0.0:
                v1, v2 = v2, v1
            for vi in (v0, v1, v2):
                pnmtx_idx = env_map[vertex_envelopes[vi]] * 3
                dl_buf.extend(struct.pack(">BHHH", pnmtx_idx, vi, vi, vi))
        while len(dl_buf) % 32 != 0:
            dl_buf.append(0x00)  # GX_NOP

        dl_off = _pad_dsec(32)
        dsec.extend(dl_buf)
        n_display = len(dl_buf) >> 5

        _pad_dsec(4)
        pobj_off = len(dsec)
        # HSD_PObjDesc (24 B): class_name=0, next=0, verts=vtx_desc_off, flags=0x2001 (POBJ_ENVELOPE | GX_CULL_NONE), n_display, disp=dl_off, u.envelope_p=env_arr_off
        dsec.extend(struct.pack(">IIIHHII", 0, 0, vtx_desc_off, 0x2001, n_display, dl_off, env_arr_off))
        relocs.add(pobj_off + 8)
        relocs.add(pobj_off + 16)
        relocs.add(pobj_off + 20)
        pobj_offsets.append(pobj_off)

    # Link PObj chain
    for i in range(len(pobj_offsets) - 1):
        cur_p = pobj_offsets[i]
        nxt_p = pobj_offsets[i + 1]
        struct.pack_into(">I", dsec, cur_p + 4, nxt_p)
        relocs.add(cur_p + 4)

    first_pobj_off = pobj_offsets[0]

    # Attach custom MObj + PObj chain to the active High-Poly and Low-Poly host DObjs on Bone 0
    host_indices = [skel["hp_host_dobj"]]
    if skel["lp_host_dobj"] is not None and skel["lp_host_dobj"] not in host_indices:
        host_indices.append(skel["lp_host_dobj"])

    for h_idx in host_indices:
        if 0 <= h_idx < len(bone0_dobjs):
            h_dobj = bone0_dobjs[h_idx]
            struct.pack_into(">I", dsec, h_dobj + 8, mobj_off)
            struct.pack_into(">I", dsec, h_dobj + 12, first_pobj_off)
            relocs.add(h_dobj + 8)
            relocs.add(h_dobj + 12)

    # Ensure JOBJ_SKELETON_ROOT (0x02) | JOBJ_ENVELOPE_MODEL (0x04) | JOBJ_OPA (0x40000) on Bone 0
    # and explicitly clear JOBJ_HIDDEN (0x10) | JOBJ_PTCL (0x20) | JOBJ_SPLINE (0x4000)
    b0_flags = struct.unpack_from(">I", dsec, root_jobj_off + 4)[0]
    struct.pack_into(">I", dsec, root_jobj_off + 4, (b0_flags | 0x00040006) & ~0x00004030)

    _pad_dsec(32)
    final_dsize = len(dsec)

    sorted_relocs = sorted(r for r in relocs if 0 <= r <= final_dsize - 4)
    reloc_bytes = struct.pack(f">{len(sorted_relocs)}I", *sorted_relocs)

    # Rebuild public_info + extern_info + string_table so all costume symbol aliases
    # (e.g. PlyCaptain5KRe_Share_joint, PlyKirby5KYe_Share_matanim_joint) resolve to our skeleton
    orig_pub_bytes = bytearray(tail_tables[: npub * 8])
    orig_ext_bytes = tail_tables[npub * 8 : (npub + next_) * 8]
    orig_str_bytes = bytearray(tail_tables[(npub + next_) * 8 :])

    existing_pub_names = set()
    for i in range(npub):
        _, so = struct.unpack_from(">II", orig_pub_bytes, i * 8)
        end_i = orig_str_bytes.find(b"\x00", so)
        if end_i != -1:
            existing_pub_names.add(orig_str_bytes[so:end_i].decode("ascii", errors="replace"))

    extra_pub_count = 0
    for alias in skel.get("costume_joint_aliases", []):
        if alias not in existing_pub_names:
            so = len(orig_str_bytes)
            orig_str_bytes.extend(alias.encode("ascii") + b"\x00")
            orig_pub_bytes.extend(struct.pack(">II", root_jobj_off, so))
            existing_pub_names.add(alias)
            extra_pub_count += 1

    matanim_root_off = skel.get("matanim_root_off", 0)
    if matanim_root_off:
        for alias in skel.get("costume_matanim_aliases", []):
            if alias not in existing_pub_names:
                so = len(orig_str_bytes)
                orig_str_bytes.extend(alias.encode("ascii") + b"\x00")
                orig_pub_bytes.extend(struct.pack(">II", matanim_root_off, so))
                existing_pub_names.add(alias)
                extra_pub_count += 1

    final_npub = npub + extra_pub_count
    final_tail = bytes(orig_pub_bytes) + orig_ext_bytes + bytes(orig_str_bytes)

    total_file_size = 32 + final_dsize + len(reloc_bytes) + len(final_tail)
    header = struct.pack(">5I", total_file_size, final_dsize, len(sorted_relocs), final_npub, next_) + version_tag
    archive_bytes = header + bytes(dsec) + reloc_bytes + final_tail

    # Fail-fast in-memory HSD_ArchiveParse & pc_vtx_array_scan verification (Spec 063 §6.5)
    verify_compiled_dat_archive(
        archive_bytes=archive_bytes,
        expected_root_symbol=skel["root_symbol"],
        expected_bones=skel["n_bones"],
        n_pos_verts=n_verts,
        n_nrm_verts=n_verts,
        n_uv_verts=n_verts,
        orig_dsize=orig_dsize,
    )

    stats = {
        "file_size_bytes": len(archive_bytes),
        "data_size_bytes": final_dsize,
        "reloc_count": len(sorted_relocs),
        "pobj_batch_count": len(pobj_offsets),
        "max_envelopes_per_pobj": max_envelopes_in_any_pobj,
        "unique_envelope_count": len(env_desc_offset_cache),
        "vertex_count": n_verts,
        "triangle_count": int(len(retargeted["triangles"])),
        "texel_data_offset": int(tex_buf_off),
        "texture_dim": int(tex_dim),
        "preserved_child_dobj_count": int(preserved_child_dobj_count),
        "preserved_tail_dobj_indices": preserved_tail_dobj_indices,
        "preserved_native_dobj_count": int(preserved_child_dobj_count + len(preserved_tail_dobj_indices)),
    }
    return archive_bytes, stats


def verify_compiled_dat_archive(
    archive_bytes: bytes,
    expected_root_symbol: str,
    expected_bones: int,
    n_pos_verts: int,
    n_nrm_verts: int,
    n_uv_verts: int,
    orig_dsize: int = 0,
) -> None:
    """
    Simulates HSD_ArchiveParse and pc_vtx_array_scan in-memory to guarantee
    zero out-of-bounds relocations, exact bone count parity, <=10 envelopes per PObj,
    and valid vertex index bounds before writing to disk.
    """
    if len(archive_bytes) < 32:
        raise AssertionError("Archive smaller than 32-byte HSD_ArchiveHeader")
    fsize, dsize, nreloc, npub, next_ = struct.unpack(">5I", archive_bytes[:20])
    if fsize != len(archive_bytes):
        raise AssertionError(f"file_size mismatch: header={fsize} vs len={len(archive_bytes)}")
    if dsize % 4 != 0:
        raise AssertionError(f"data_size ({dsize}) is not 4-byte aligned")

    dsec = archive_bytes[32 : 32 + dsize]
    reloc_off = 32 + dsize
    pub_off = reloc_off + nreloc * 4
    str_off = pub_off + (npub + next_) * 8

    relocs = struct.unpack(f">{nreloc}I", archive_bytes[reloc_off:pub_off])
    for r in relocs:
        if not (0 <= r <= dsize - 4):
            raise AssertionError(f"Relocation offset 0x{r:x} out of data section bounds [0, 0x{dsize - 4:x}]")
        target = struct.unpack_from(">I", dsec, r)[0]
        if not (0 <= target < dsize):
            raise AssertionError(f"Relocation at 0x{r:x} points to out-of-bounds target 0x{target:x} (dsize=0x{dsize:x})")

    syms: Dict[str, int] = {}
    for i in range(npub):
        rp, so = struct.unpack_from(">II", archive_bytes, pub_off + i * 8)
        end = archive_bytes.index(b"\x00", str_off + so)
        s = archive_bytes[str_off + so : end].decode("ascii")
        syms[s] = rp

    if expected_root_symbol not in syms:
        raise AssertionError(f"Missing root symbol {expected_root_symbol} in compiled archive")

    def _count_jobj(off: int) -> int:
        if off == 0:
            return 0
        child, nxt = struct.unpack_from(">II", dsec, off + 8)
        return 1 + _count_jobj(child) + _count_jobj(nxt)

    actual_bones = _count_jobj(syms[expected_root_symbol])
    if actual_bones != expected_bones:
        raise AssertionError(f"Bone count mismatch: got {actual_bones}, expected {expected_bones}")

    # Walk Bone 0 DObj -> PObj display lists and verify pc_vtx_array_scan bounds
    valid_pnmtx = {0, 3, 6, 9, 12, 15, 18, 21, 24, 27}
    dcur = struct.unpack_from(">I", dsec, syms[expected_root_symbol] + 16)[0]
    pobj_checked = 0
    while dcur:
        _, dnxt, dmobj, dpobj = struct.unpack_from(">4I", dsec, dcur)
        pcur = dpobj
        while pcur:
            pobj_checked += 1
            _, pnxt, pvtx, pflags, pndisp, pdisp, penv = struct.unpack_from(">IIIHHII", dsec, pcur)
            if pdisp % 32 != 0:
                raise AssertionError(f"PObj display list at 0x{pdisp:x} is not 32-byte aligned")
            # Count envelopes in penv
            env_cnt = 0
            ecur = penv
            while ecur:
                eptr = struct.unpack_from(">I", dsec, ecur)[0]
                if eptr == 0:
                    break
                env_cnt += 1
                ecur += 4
            if env_cnt > 10:
                raise AssertionError(f"PObj at 0x{pcur:x} has {env_cnt} envelopes (max 10)")

            if orig_dsize > 0 and pcur < orig_dsize:
                # Preserved native Nintendo PObj (e.g., DObj 1 & DObj 21 Lightning-Bolt Tail)
                pcur = pnxt
                continue

            dl_bytes = dsec[pdisp : pdisp + pndisp * 32]
            pos = 0
            while pos < len(dl_bytes):
                cmd = dl_bytes[pos]
                if cmd == 0x00:
                    break
                if cmd != 0x90:
                    raise AssertionError(f"Unexpected GX opcode 0x{cmd:02x} in custom display list")
                v_cnt = struct.unpack_from(">H", dl_bytes, pos + 1)[0]
                pos += 3
                for _ in range(v_cnt):
                    pmtx, pi, ni, uvi = struct.unpack_from(">BHHH", dl_bytes, pos)
                    pos += 7
                    if pmtx not in valid_pnmtx or (pmtx // 3) >= env_cnt:
                        raise AssertionError(f"Invalid GX_VA_PNMTXIDX {pmtx} for env_cnt={env_cnt}")
                    if pi >= n_pos_verts or ni >= n_nrm_verts or uvi >= n_uv_verts:
                        raise AssertionError(
                            f"pc_vtx_array_scan out of bounds: ({pi}, {ni}, {uvi}) vs ({n_pos_verts}, {n_nrm_verts}, {n_uv_verts})"
                        )
            pcur = pnxt
        dcur = dnxt

    if pobj_checked == 0:
        raise AssertionError("No active PObj nodes found on Bone 0 of compiled archive")


def build_patched_plgw_dat(ft_raw: bytes) -> bytes:
    """
    Patches Mr. Game & Watch's PlGw.dat (ftDataGamewatch ext_attr @ data offset 0x3778,
    file offset 0x3798) so x0_z_scale = 1.0f (0x3F800000, full 3D depth) and
    x4_col[0..3] = 0xFFFFFFFF (full-color texture diffuse multiplier).
    """
    patched = bytearray(ft_raw)
    ext_file_off = 32 + 0x3778
    struct.pack_into(">fIIII", patched, ext_file_off, 1.0, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF)
    return bytes(patched)


def export_companion_rigged_glb(
    out_glb_path: str,
    skel: Dict[str, Any],
    retargeted: Dict[str, Any],
    atlas_rgba: np.ndarray,
) -> float:
    """
    Emits the standalone companion glTF 2.0 rigged file character_melee_<XX>.glb
    with the user's mesh bound to the target fighter's N_bones glTF Skin
    (verifying max |W_bind * IBM - I_4| < 1e-4).
    """
    bones = skel["bones"]
    n_bones = len(bones)
    pos = retargeted["pos_world"].astype(np.float32)
    nrm = retargeted["nrm_world"].astype(np.float32)
    uvs = retargeted["uvs"].astype(np.float32)
    tris = retargeted["triangles"].astype(np.uint16)
    vertex_envelopes = retargeted["vertex_envelopes"]

    n_verts = len(pos)
    joints_0 = np.zeros((n_verts, 4), dtype=np.uint16)
    weights_0 = np.zeros((n_verts, 4), dtype=np.float32)
    for v_i, env in enumerate(vertex_envelopes):
        for k, (b_idx, w_val) in enumerate(env[:4]):
            joints_0[v_i, k] = int(b_idx)
            weights_0[v_i, k] = float(w_val)
        w_sum = float(weights_0[v_i].sum())
        if w_sum > 0:
            weights_0[v_i] /= w_sum

    # Compute column-major glTF inverseBindMatrices from bones[i]["fk_world_mat"]^-1
    ibm_cols = np.empty((n_bones, 16), dtype=np.float32)
    max_ibm_err = 0.0
    for i, b in enumerate(bones):
        w_fk = b["fk_world_mat"]
        ibm_fk = np.linalg.inv(w_fk)
        prod = w_fk @ ibm_fk
        err = float(np.max(np.abs(prod - np.eye(4))))
        max_ibm_err = max(max_ibm_err, err)
        ibm_cols[i] = ibm_fk.T.reshape(-1).astype(np.float32)

    # Encode 512x512 atlas as PNG
    bgr = cv2.cvtColor(atlas_rgba, cv2.COLOR_RGBA2BGRA)
    ok, png_buf = cv2.imencode(".png", bgr)
    if not ok:
        raise RuntimeError("Failed to encode PNG texture for companion .glb")
    png_bytes = png_buf.tobytes()

    # Build binary bufferViews
    bin_chunks: List[bytes] = []
    buffer_views: List[Dict[str, Any]] = []
    accessors: List[Dict[str, Any]] = []

    def _add_bv(raw_b: bytes, target: Optional[int] = None) -> int:
        off = sum(len(c) for c in bin_chunks)
        pad = _align4(len(raw_b)) - len(raw_b)
        bin_chunks.append(raw_b + (b"\x00" * pad))
        bv: Dict[str, Any] = {"buffer": 0, "byteOffset": off, "byteLength": len(raw_b)}
        if target is not None:
            bv["target"] = target
        bv_idx = len(buffer_views)
        buffer_views.append(bv)
        return bv_idx

    bv_pos = _add_bv(pos.tobytes(), 34962)
    bv_nrm = _add_bv(nrm.tobytes(), 34962)
    bv_uv = _add_bv(uvs.tobytes(), 34962)
    bv_jnt = _add_bv(joints_0.tobytes(), 34962)
    bv_wgt = _add_bv(weights_0.tobytes(), 34962)
    bv_idx = _add_bv(tris.reshape(-1).tobytes(), 34963)
    bv_ibm = _add_bv(ibm_cols.tobytes(), None)
    bv_png = _add_bv(png_bytes, None)

    accessors.extend([
        {
            "bufferView": bv_pos,
            "componentType": 5126,
            "count": n_verts,
            "type": "VEC3",
            "min": [float(x) for x in pos.min(axis=0)],
            "max": [float(x) for x in pos.max(axis=0)],
        },
        {"bufferView": bv_nrm, "componentType": 5126, "count": n_verts, "type": "VEC3"},
        {"bufferView": bv_uv, "componentType": 5126, "count": n_verts, "type": "VEC2"},
        {"bufferView": bv_jnt, "componentType": 5123, "count": n_verts, "type": "VEC4"},
        {"bufferView": bv_wgt, "componentType": 5126, "count": n_verts, "type": "VEC4"},
        {"bufferView": bv_idx, "componentType": 5123, "count": int(tris.size), "type": "SCALAR"},
        {"bufferView": bv_ibm, "componentType": 5126, "count": n_bones, "type": "MAT4"},
    ])

    # Build glTF nodes: Node 0..n_bones-1 are the fighter bones; Node n_bones is the SkinnedMesh
    children_map: Dict[int, List[int]] = {i: [] for i in range(n_bones)}
    for b in bones:
        if b["parent"] >= 0:
            children_map[b["parent"]].append(b["index"])

    nodes: List[Dict[str, Any]] = []
    for i, b in enumerate(bones):
        rx, ry, rz, sx, sy, sz, tx, ty, tz = b["local_trs"]
        # Convert Euler XYZ to quaternion [x, y, z, w]
        cx, sx_ = math.cos(rx * 0.5), math.sin(rx * 0.5)
        cy, sy_ = math.cos(ry * 0.5), math.sin(ry * 0.5)
        cz, sz_ = math.cos(rz * 0.5), math.sin(rz * 0.5)
        qx = sx_ * cy * cz - cx * sy_ * sz_
        qy = cx * sy_ * cz + sx_ * cy * sz_
        qz = cx * cy * sz_ - sx_ * sy_ * cz
        qw = cx * cy * cz + sx_ * sy_ * sz_
        node: Dict[str, Any] = {
            "name": f"JObj_{i:02d}",
            "translation": [float(tx), float(ty), float(tz)],
            "rotation": [float(qx), float(qy), float(qz), float(qw)],
            "scale": [float(sx), float(sy), float(sz)],
        }
        if children_map[i]:
            node["children"] = children_map[i]
        nodes.append(node)

    mesh_node_idx = len(nodes)
    nodes.append({
        "name": f"MeleeCharacter_{skel['code']}",
        "mesh": 0,
        "skin": 0,
    })

    bin_body = b"".join(bin_chunks)
    gltf_dict = {
        "asset": {"version": "2.0", "generator": "SkateAlley-Melee-AutoRigger-Spec063"},
        "scene": 0,
        "scenes": [{"nodes": [0, mesh_node_idx]}],
        "nodes": nodes,
        "skins": [{
            "name": skel["root_symbol"],
            "skeleton": 0,
            "joints": list(range(n_bones)),
            "inverseBindMatrices": 6,
        }],
        "meshes": [{
            "name": f"CharacterMesh_{skel['code']}",
            "primitives": [{
                "attributes": {
                    "POSITION": 0,
                    "NORMAL": 1,
                    "TEXCOORD_0": 2,
                    "JOINTS_0": 3,
                    "WEIGHTS_0": 4,
                },
                "indices": 5,
                "material": 0,
            }],
        }],
        "materials": [{
            "name": "MeleeRGB5A3Atlas",
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicFactor": 0.0,
                "roughnessFactor": 0.85,
            },
        }],
        "textures": [{"source": 0}],
        "images": [{"bufferView": bv_png, "mimeType": "image/png"}],
        "buffers": [{"byteLength": len(bin_body)}],
        "bufferViews": buffer_views,
        "accessors": accessors,
    }

    json_bytes = json.dumps(gltf_dict, separators=(",", ":")).encode("utf-8")
    json_pad = _align4(len(json_bytes)) - len(json_bytes)
    json_chunk = json_bytes + (b" " * json_pad)

    total_len = 12 + 8 + len(json_chunk) + 8 + len(bin_body)
    glb_bytes = (
        struct.pack("<III", 0x46546C67, 2, total_len)
        + struct.pack("<II", len(json_chunk), 0x4E4F534A)
        + json_chunk
        + struct.pack("<II", len(bin_body), 0x004E4942)
        + bin_body
    )

    os.makedirs(os.path.dirname(os.path.abspath(out_glb_path)), exist_ok=True)
    with open(out_glb_path, "wb") as f:
        f.write(glb_bytes)

    return max_ibm_err


# ==============================================================================
# End-to-End Fighter Rigging & GCS 04_rigged/melee/<XX>/ Synchronization
# ==============================================================================

def inject_compiled_dat_into_iso(
    dat_bytes: bytes,
    fst_name: str = "PlPkNr.dat",
    iso_paths: Sequence[str] = (
        "/Users/diesel/desktop/greek/melee/game.iso",
        MELEE_ISO_PATH,
    ),
    target_offset: int = 0x00480000,
) -> List[Dict[str, Any]]:
    """
    Injects the compiled Pl<XX>Nr.dat binary archive into melee/game.iso at the
    32-byte-aligned unused gap (0x00480000, between usa.ini at 0x00460000 and opening.bnr
    at 0x0126B474) and updates the corresponding 12-byte FST entry in-place while
    preserving the exact 1,459,978,240-byte GameCube disc size.
    """
    if len(dat_bytes) > 400_000:
        raise AssertionError(
            f"Compiled {fst_name} size {len(dat_bytes)} bytes exceeds 400,000-byte FtDemoViWaitMotion heap ceiling."
        )
    injected_records: List[Dict[str, Any]] = []
    seen_realpaths: set[str] = set()
    for iso_p in iso_paths:
        if not iso_p or not os.path.isfile(iso_p):
            continue
        rp = os.path.realpath(iso_p)
        if rp in seen_realpaths:
            continue
        seen_realpaths.add(rp)
        with open(iso_p, "r+b") as f:
            f.seek(0x424)
            fst_off, fst_size = struct.unpack(">II", f.read(8))
            f.seek(fst_off)
            fst = bytearray(f.read(fst_size))
            num_entries = struct.unpack(">I", fst[8:12])[0]
            str_table_off = num_entries * 12
            matched_idx = None
            for i in range(1, num_entries):
                e = fst[i * 12 : (i + 1) * 12]
                if e[0] == 0:
                    name_off = (e[1] << 16) | (e[2] << 8) | e[3]
                    end = fst.index(b"\x00", str_table_off + name_off)
                    name = fst[str_table_off + name_off : end].decode("ascii", errors="replace")
                    if name == fst_name:
                        matched_idx = i
                        break
            if matched_idx is None:
                raise RuntimeError(f"Could not find FST entry {fst_name} in {iso_p}")
            # Write compiled archive at target_offset and update FST entry
            f.seek(target_offset)
            f.write(dat_bytes)
            pad_rem = len(dat_bytes) % 32
            if pad_rem:
                f.write(b"\x00" * (32 - pad_rem))
            struct.pack_into(">II", fst, matched_idx * 12 + 4, target_offset, len(dat_bytes))
            f.seek(fst_off)
            f.write(fst)
            f.flush()
        injected_records.append({
            "iso_path": iso_p,
            "fst_name": fst_name,
            "fst_index": matched_idx,
            "file_offset": target_offset,
            "file_size_bytes": len(dat_bytes),
        })
    return injected_records


def rig_character_for_melee_fighter(
    fighter_code: str,
    player_folder: str = "nicotest_nt01",
    run_id: str = "run_01",
    output_run_id: Optional[str] = None,
    glb_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    gcs_bucket: str = DEFAULT_GCS_BUCKET,
    credentials_path: Optional[str] = None,
    target_tris: Optional[int] = None,
    atlas_size: int = 256,
    sync_gcs: bool = True,
    force_rebuild: bool = False,
    inject_iso: bool = False,
) -> Dict[str, Any]:
    """
    End-to-end 1-piece single-material auto-rigger for a single (player_folder, run_id, fighter_code)
    pair (Functional Specification 043 §4.4).
    Emits into unified melee/rigged/{player_folder}/{output_run_id or run_id}/:
      - input/{XX}/character_full.glb
      - Pl{XX}Nr.dat (full un-squished 256x256 opaque GX_TF_RGB5A3, ~2,500 tris; <= 400KB on Pk)
      - character_melee_{XX}.glb
      - rigging_telemetry_{XX}.json
      - Companion PlGw.dat (for Gw) or PlNnNr.dat (for Pp)
    """
    t0 = time.time()
    f_info = FIGHTER_BY_CODE.get(str(fighter_code or "").strip().lower())
    if not f_info:
        raise ValueError(f"Unsupported Melee fighter code '{fighter_code}'. Valid codes: {[f['code'] for f in FIGHTER_CATALOG]}")

    code = f_info["code"]
    skel = extract_fighter_skeleton(code)
    amap = skel.get("anatomical_map", {})
    bones = skel.get("bones", [])
    fighter_arm_deg = 0.0
    if "LShoulderJA" in amap and "LHandN" in amap:
        l_sh_pos = np.asarray(bones[amap["LShoulderJA"]]["world_pos"], dtype=np.float64)
        l_wr_pos = np.asarray(bones[amap["LHandN"]]["world_pos"], dtype=np.float64)
        dv = l_wr_pos - l_sh_pos
        horiz = math.hypot(float(dv[0]), float(dv[2]))
        if horiz > 1e-6:
            fighter_arm_deg = float(math.degrees(math.atan2(float(dv[1]), horiz)))
    preferred_pose = FIGHTER_PREFERRED_POSE.get(
        code,
        "apose" if (code == "Pk" or fighter_arm_deg <= -22.0) else "tpose",
    )

    intake = resolve_and_cache_input_glb(
        player_folder=player_folder,
        run_id=run_id,
        glb_path=glb_path,
        gcs_bucket=gcs_bucket,
        credentials_path=credentials_path,
        preferred_pose=preferred_pose,
        fighter_code=code,
        output_run_id=output_run_id,
        output_dir=output_dir,
    )
    eff_out_run = intake["output_run_id"]
    run_cache_dir = intake["run_cache_dir"]
    stage1_cache_dir = intake["input_dir"]
    out_dat_path = os.path.join(run_cache_dir, f"Pl{code}Nr.dat")
    out_glb_path = os.path.join(run_cache_dir, f"character_melee_{code}.glb")
    out_telem_path = os.path.join(run_cache_dir, f"rigging_telemetry_{code}.json")

    stage1_target_tris = int(target_tris) if target_tris is not None else (2200 if code == "Pk" else 2500)
    stage1_atlas_size = int(atlas_size)

    if (
        not force_rebuild
        and os.path.isfile(out_dat_path)
        and os.path.isfile(out_glb_path)
        and os.path.isfile(out_telem_path)
    ):
        try:
            with open(out_telem_path, "r", encoding="utf-8") as f:
                cached_telem = json.load(f)
            if (
                cached_telem.get("rig_pipeline_spec") == "043_1piece"
                and cached_telem.get("source_assembled_sha256") == intake["source_sha256"]
                and int(cached_telem.get("atlas_size", 0)) == stage1_atlas_size
                and "world_bounds_min" in cached_telem
            ):
                if code == "Pk" and inject_iso:
                    with open(out_dat_path, "rb") as df:
                        inject_compiled_dat_into_iso(df.read(), fst_name="PlPkNr.dat")
                return cached_telem
        except Exception:
            pass

    # Stage 1: Normalize & decimate 1-piece mesh + bake full un-squished 256x256 opaque RGB5A3 texture atlas
    while True:
        stage1 = extract_and_decimate_stage1(
            glb_path=intake["local_glb"],
            source_sha256=intake["source_sha256"],
            cache_dir=stage1_cache_dir,
            target_tris=stage1_target_tris,
            atlas_size=stage1_atlas_size,
        )

        # Stage 3: 1-Piece Feet-to-Shoulders / Feet-to-Crown retargeting, neck-ring partition, & 5-zone skinning
        retargeted = retarget_and_skin_mesh(
            stage1,
            skel,
        )

        # Stage 4: Compile Pl<XX>Nr.dat + companion rigged .glb
        dat_bytes, dat_stats = compile_melee_dat_archive(
            skel=skel,
            retargeted=retargeted,
            gx_rgb5a3_bytes=stage1["gx_rgb5a3_bytes"],
        )
        if code == "Pk" and len(dat_bytes) > 400_000 and stage1_target_tris > 1200:
            stage1_target_tris -= 200
            continue
        break

    os.makedirs(run_cache_dir, exist_ok=True)
    with open(out_dat_path, "wb") as f:
        f.write(dat_bytes)

    iso_injections: List[Dict[str, Any]] = []
    if code == "Pk":
        if len(dat_bytes) > 400_000:
            raise AssertionError(f"Compiled PlPkNr.dat size {len(dat_bytes)} > 400,000 bytes")
        if inject_iso:
            iso_injections = inject_compiled_dat_into_iso(dat_bytes, fst_name="PlPkNr.dat")

    max_ibm_err = export_companion_rigged_glb(
        out_glb_path=out_glb_path,
        skel=skel,
        retargeted=retargeted,
        atlas_rgba=stage1["atlas_rgba"],
    )
    if max_ibm_err >= 1e-4:
        raise AssertionError(f"IBM orthogonality error {max_ibm_err} >= 1e-4 for {code}")

    rel_base = f"/melee/rigged/{intake['player_folder']}/{eff_out_run}"
    companion_overlays: List[Dict[str, Any]] = []

    # Special companion overlay for Mr. Game & Watch (PlGw.dat full-3D & full-color restoration)
    if code == "Gw":
        gw_dat_bytes = build_patched_plgw_dat(skel["ft_raw"])
        gw_dat_path = os.path.join(run_cache_dir, "PlGw.dat")
        with open(gw_dat_path, "wb") as f:
            f.write(gw_dat_bytes)
        companion_overlays.append({
            "fst_targets": ["PlGw.dat"],
            "dat_path": gw_dat_path,
            "local_path": gw_dat_path,
            "dat_url": f"{rel_base}/PlGw.dat",
            "size_bytes": len(gw_dat_bytes),
        })

    # Special companion overlay for Ice Climbers (Nana PlNnNr.dat)
    if code == "Pp":
        nana_skel = extract_fighter_skeleton(
            "Pp",
            override_nr_name="PlNnNr.dat",
            override_dat_name="PlNn.dat",
            override_ftkind=11,
        )
        nana_retargeted = retarget_and_skin_mesh(
            stage1,
            nana_skel,
        )
        nana_bytes, _ = compile_melee_dat_archive(
            skel=nana_skel,
            retargeted=nana_retargeted,
            gx_rgb5a3_bytes=stage1["gx_rgb5a3_bytes"],
        )
        nana_path = os.path.join(run_cache_dir, "PlNnNr.dat")
        with open(nana_path, "wb") as f:
            f.write(nana_bytes)
        nana_targets = [t for t in skel["costume_fst_names"] if t.startswith("PlNn")]
        companion_overlays.append({
            "fst_targets": nana_targets,
            "dat_path": nana_path,
            "local_path": nana_path,
            "dat_url": f"{rel_base}/PlNnNr.dat",
            "size_bytes": len(nana_bytes),
        })

    primary_fst_targets = [
        t for t in skel["costume_fst_names"]
        if not (code == "Pp" and t.startswith("PlNn"))
    ]

    dat_sha256 = sha256_file(out_dat_path)
    glb_sha256 = sha256_file(out_glb_path)
    elapsed_sec = round(time.time() - t0, 3)

    telemetry: Dict[str, Any] = {
        "status": "COMPLETE",
        "rig_pipeline_spec": "043_1piece",
        "fighter": code,
        "fighter_name": skel["name"],
        "ftkind": skel["ftkind"],
        "anatomy_mode": retargeted.get("anatomy_mode"),
        "root_symbol": skel["root_symbol"],
        "bone_count": skel["n_bones"],
        "plco_table_bones": skel["plco_w2"],
        "delta_bones_corrected": skel["delta_bones"],
        "anatomical_map": skel["anatomical_map"],
        "deform_chains": skel.get("deform_chains"),
        "player_folder": intake["player_folder"],
        "run_id": eff_out_run,
        "source_sub_run_id": intake["run_id"],
        "preferred_pose": preferred_pose,
        "resolved_pose": intake.get("resolved_pose", preferred_pose),
        "fighter_arm_elevation_deg": round(fighter_arm_deg, 3),
        "arm_alignment_deg_left": retargeted.get("arm_alignment_deg_left", 0.0),
        "arm_alignment_deg_right": retargeted.get("arm_alignment_deg_right", 0.0),
        "y_sh_glb_2m": retargeted.get("y_sh_glb_2m"),
        "y_neck_glb_2m": retargeted.get("y_neck_glb_2m"),
        "y_sh_world": retargeted.get("y_sh_world"),
        "head_vertex_count": retargeted.get("head_vertex_count"),
        "body_vertex_count": retargeted.get("body_vertex_count"),
        "source_assembled_sha256": intake["source_sha256"],
        "atlas_size": stage1_atlas_size,
        "texel_data_offset": dat_stats["texel_data_offset"],
        "original_triangles": stage1["original_triangles"],
        "decimated_triangles": dat_stats["triangle_count"],
        "decimated_vertices": dat_stats["vertex_count"],
        "pobj_batch_count": dat_stats["pobj_batch_count"],
        "max_envelopes_per_pobj": dat_stats["max_envelopes_per_pobj"],
        "unique_envelope_count": dat_stats["unique_envelope_count"],
        "zero_ibm_envelope_refs": retargeted.get("zero_ibm_envelope_refs", 0),
        "torso_limb_leak_vertices": retargeted.get("torso_limb_leak_vertices", 0),
        "shoulder_pauldron_head_leak_vertices": retargeted.get("shoulder_pauldron_head_leak_vertices", 0),
        "world_bounds_min": retargeted.get("world_bounds_min"),
        "world_bounds_max": retargeted.get("world_bounds_max"),
        "uniform_scale": retargeted["uniform_scale"],
        "head_uniform_scale": retargeted.get("head_uniform_scale"),
        "fighter_height": retargeted["fighter_height"],
        "max_ibm_orthogonality_error": max_ibm_err,
        "dat_path": out_dat_path,
        "glb_path": out_glb_path,
        "dat_size_bytes": dat_stats["file_size_bytes"],
        "dat_file_size_bytes": dat_stats["file_size_bytes"],
        "preserved_child_dobj_count": dat_stats.get("preserved_child_dobj_count", 0),
        "preserved_tail_dobj_indices": dat_stats.get("preserved_tail_dobj_indices", []),
        "preserved_native_dobj_count": dat_stats.get("preserved_native_dobj_count", 0),
        "iso_injections": iso_injections,
        "dat_sha256": dat_sha256,
        "glb_sha256": glb_sha256,
        "dat_url": f"{rel_base}/Pl{code}Nr.dat",
        "glb_url": f"{rel_base}/character_melee_{code}.glb",
        "telemetry_url": f"{rel_base}/rigging_telemetry_{code}.json",
        "fst_targets": primary_fst_targets,
        "companion_overlays": companion_overlays,
        "elapsed_seconds": elapsed_sec,
        "gcs_uris": {},
    }

    _atomic_write_json(out_telem_path, telemetry)

    # Mirror outputs into /Users/diesel/desktop/greek/melee/rigged/{player_folder}/{eff_out_run}/
    greek_rigged_dir = os.path.join("/Users/diesel/desktop/greek/melee/rigged", intake["player_folder"], eff_out_run)
    if os.path.abspath(greek_rigged_dir) != os.path.abspath(run_cache_dir):
        try:
            os.makedirs(greek_rigged_dir, exist_ok=True)
            shutil.copy2(out_dat_path, os.path.join(greek_rigged_dir, f"Pl{code}Nr.dat"))
            shutil.copy2(out_glb_path, os.path.join(greek_rigged_dir, f"character_melee_{code}.glb"))
            shutil.copy2(out_telem_path, os.path.join(greek_rigged_dir, f"rigging_telemetry_{code}.json"))
            for comp in companion_overlays:
                cp = comp.get("dat_path")
                if cp and os.path.isfile(cp):
                    shutil.copy2(cp, os.path.join(greek_rigged_dir, os.path.basename(cp)))
        except Exception:
            pass

    # Synchronize to gs://<bucket>/players/{player_folder}/runs/{eff_out_run}/04_rigged/melee/{XX}/
    cred = resolve_gcs_credentials_file(credentials_path)
    if sync_gcs and cred and _has_direct_gcs():
        try:
            p_folder = intake["player_folder"]
            prefix = f"players/{p_folder}/runs/{eff_out_run}/04_rigged/melee/{code}"
            u_dat = upload_gcs_object(gcs_bucket, out_dat_path, f"{prefix}/Pl{code}Nr.dat", cred)
            u_glb = upload_gcs_object(gcs_bucket, out_glb_path, f"{prefix}/character_melee_{code}.glb", cred)
            gcs_map = {
                f"Pl{code}Nr.dat": u_dat["gcs_uri"],
                f"character_melee_{code}.glb": u_glb["gcs_uri"],
                f"rigging_telemetry_{code}.json": f"gs://{gcs_bucket}/{prefix}/rigging_telemetry_{code}.json",
            }
            for comp in companion_overlays:
                cp = comp.get("dat_path")
                if cp and os.path.isfile(cp):
                    bn = os.path.basename(cp)
                    uc = upload_gcs_object(gcs_bucket, cp, f"{prefix}/{bn}", cred)
                    gcs_map[bn] = uc["gcs_uri"]
            telemetry["gcs_uris"] = gcs_map
            _atomic_write_json(out_telem_path, telemetry)
            upload_gcs_object(gcs_bucket, out_telem_path, f"{prefix}/rigging_telemetry_{code}.json", cred)

            # Update routing_audit.json atomically
            audit_candidates = [os.path.join(run_cache_dir, "routing_audit.json")]
            if p_folder == "nicotest_nt01" and eff_out_run == "run_01":
                greek_audit = "/Users/diesel/Desktop/Greek/outputs/nicotest_run_01/routing_audit.json"
                if os.path.isfile(greek_audit):
                    audit_candidates.insert(0, greek_audit)
            audit_path = audit_candidates[0]
            lock_path = f"{audit_path}.lock"
            with _exclusive_file_lock(lock_path):
                audit_data: Dict[str, Any] = {}
                if os.path.isfile(audit_path):
                    try:
                        with open(audit_path, "r", encoding="utf-8") as af:
                            audit_data = json.load(af)
                    except Exception:
                        audit_data = {}
                s5_rigged = audit_data.setdefault("stage5_rigged", {})
                melee_map = s5_rigged.setdefault("melee", {})
                melee_map[code] = {
                    "status": "COMPLETE",
                    "fighter": code,
                    "fighter_name": skel["name"],
                    "bone_count": skel["n_bones"],
                    "preferred_pose": preferred_pose,
                    "resolved_pose": intake.get("resolved_pose", preferred_pose),
                    "source_assembled_sha256": intake["source_sha256"],
                    "dat_sha256": dat_sha256,
                    "glb_sha256": glb_sha256,
                    "gcs_uris": telemetry["gcs_uris"],
                    "elapsed_seconds": elapsed_sec,
                }
                _atomic_write_json(audit_path, audit_data)
        except Exception as gcs_err:
            telemetry["gcs_sync_warning"] = str(gcs_err)
            _atomic_write_json(out_telem_path, telemetry)

    return telemetry


def get_fighter_catalog_with_bone_counts(iso_path: str = MELEE_ISO_PATH) -> List[Dict[str, Any]]:
    """
    Returns the 26-fighter catalog enriched with exact bone counts and costume FST target lists.
    """
    fst_entries = parse_iso_fst(iso_path)
    result: List[Dict[str, Any]] = []
    with open(iso_path, "rb") as f:
        for item in FIGHTER_CATALOG:
            code = item["code"]
            nr_name = f"Pl{code}Nr.dat"
            _, off, size = fst_entries[nr_name]
            f.seek(off)
            dat = f.read(size)
            _, dsize, nreloc, npub, next_ = struct.unpack(">5I", dat[:20])
            dsec = dat[32 : 32 + dsize]
            pub_off = 32 + dsize + nreloc * 4
            str_off = pub_off + (npub + next_) * 8
            root_off = 0
            for i in range(npub):
                rp, so = struct.unpack_from(">II", dat, pub_off + i * 8)
                s = dat[str_off + so : dat.index(b"\x00", str_off + so)].decode("ascii")
                if s == item["root_symbol"]:
                    root_off = rp
                    break

            def _cnt(o: int) -> int:
                if o == 0 or o >= len(dsec):
                    return 0
                c, n = struct.unpack_from(">II", dsec, o + 8)
                return 1 + _cnt(c) + _cnt(n)

            nbones = _cnt(root_off)
            prefix = f"Pl{code}"
            costumes = sorted(
                k for k in fst_entries.keys()
                if k.startswith(prefix)
                and k.endswith(".dat")
                and k != f"Pl{code}.dat"
                and not k.startswith(f"Pl{code}AJ")
                and not k.startswith(f"Pl{code}D")
                and "Cp" not in k
            )
            if code == "Pp":
                costumes.extend(sorted(
                    k for k in fst_entries.keys()
                    if k.startswith("PlNn")
                    and k.endswith(".dat")
                    and k != "PlNn.dat"
                    and not k.startswith("PlNnAJ")
                    and "Cp" not in k
                ))
            result.append({
                "code": code,
                "name": item["name"],
                "ftkind": item["ftkind"],
                "root_symbol": item["root_symbol"],
                "bone_count": nbones,
                "base_archive": nr_name,
                "fst_targets": costumes,
            })
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Auto-rig any GCS character_full.glb onto any Super Smash Bros. Melee fighter (Spec 063)."
    )
    parser.add_argument("--fighter", default="Ca", help="Fighter code (Ca, Mr, Fx, Ms, Lk, Kb, Gw, etc. or 'all')")
    parser.add_argument("--player-folder", default="nicotest_nt01", help="GCS player folder ({slug}_{id})")
    parser.add_argument("--run-id", default="run_01", help="GCS run identifier")
    parser.add_argument("--glb-path", default=None, help="Optional explicit local .glb path")
    parser.add_argument("--gcs-bucket", default=DEFAULT_GCS_BUCKET, help="GCS bucket name")
    parser.add_argument("--no-gcs-sync", action="store_true", help="Skip uploading outputs back to GCS")
    parser.add_argument("--force", action="store_true", help="Force re-compilation ignoring local cache")
    parser.add_argument("--list-fighters", action="store_true", help="Print JSON catalog of all 26 fighters")
    parser.add_argument("--list-gcs-characters", action="store_true", help="Print JSON catalog of available GCS characters")
    args = parser.parse_args()

    if args.list_fighters:
        print(json.dumps(get_fighter_catalog_with_bone_counts(), indent=2))
        return
    if args.list_gcs_characters:
        print(json.dumps(list_available_gcs_characters(gcs_bucket=args.gcs_bucket), indent=2))
        return

    raw_codes = [c.strip() for c in str(args.fighter).split(",") if c.strip()]
    if len(raw_codes) == 1 and raw_codes[0].lower() == "all":
        target_codes = [f["code"] for f in FIGHTER_CATALOG]
    else:
        target_codes = raw_codes

    results = []
    for code in target_codes:
        res = rig_character_for_melee_fighter(
            fighter_code=code,
            player_folder=args.player_folder,
            run_id=args.run_id,
            glb_path=args.glb_path,
            gcs_bucket=args.gcs_bucket,
            sync_gcs=not args.no_gcs_sync,
            force_rebuild=args.force,
        )
        results.append(res)

    if len(results) == 1:
        print(json.dumps(results[0], indent=2))
    else:
        print(json.dumps({"status": "ok", "count": len(results), "results": results}, indent=2))


if __name__ == "__main__":
    main()
