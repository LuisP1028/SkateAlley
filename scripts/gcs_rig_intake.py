#!/usr/bin/env python3
"""
gcs_rig_intake.py

Shared Stage 5 Google Cloud Storage (GCS) Intake, Pre-Flight Binary/Anatomical
Validation, Head-Bound Telemetry Resolution, and `04_rigged/<target>/` Output
Synchronization Module for the 4 `.glb`-File-Agnostic Game Riggers:
  1. The Alleyway (`alleyway` -> `scripts/rig_characters.py` & `scripts/migrate_to_rpm_rig.py`)
  2. Skate 3 (`skate3` -> `scripts/rig_skate3_character.py`)
  3. GTA: Vice City (`gta` -> `scripts/compile_luis_revcdos_player.py`)
  4. Zombies (`zombies` -> `scripts/compile_luis_zombies_mdl.py`)

Governed by functional_specification_061.md and LANGUAGE.md:
- INV-NO-REASSEMBLE-01: Never re-assembles `head.glb` and `body.glb`; strictly consumes
  Stage 4 assembled output `03_meshes/assembled/character_full.glb`.
- INV-GCS-RIG-01: Resolves `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/03_meshes/assembled/character_full.glb`
  and `03_meshes/assembled/assembly_telemetry.json`, caches locally, verifies SHA-256 parity,
  and syncs rigged deliverables to `04_rigged/<target>/` + `routing_audit.json`.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
import re
import struct
import subprocess
import sys
import threading
import time
from typing import Any, Callable, Dict, Iterator, List, Optional, Sequence, Tuple

DEFAULT_GCS_BUCKET = "3d-banana-player-assets"
DEFAULT_HOST_PYTHON_BIN = "/opt/anaconda3/bin/python3"
DEFAULT_GCS_CREDENTIALS_CANDIDATES = (
    "/Users/diesel/Desktop/Greek/gcs_service_account.json",
    "/Users/diesel/desktop/Greek/gcs_service_account.json",
    "/Users/diesel/desktop/greek/gcs_service_account.json",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gcs_service_account.json"),
)

GLTF_MAGIC_HEADER = b"glTF"
MIN_ANATOMICAL_VERTICES = 1000
MIN_ANATOMICAL_FACES = 1000
IDENTIFIER_REGEX = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def sha256_file(filepath: str) -> str:
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Fatal: Cannot compute SHA-256 for missing file '{filepath}'.")
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def sanitize_player_slug(player_name: Optional[str]) -> str:
    raw = str(player_name or "").strip()
    if not raw:
        raise ValueError("Fatal [INV-GCS-RIG-01]: player_name cannot be empty.")
    if ".." in raw or "/" in raw or "\\" in raw:
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: Path traversal token detected in player_name '{raw}'.")
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", raw).strip("_").lower()[:64].strip("_")
    if not slug or not IDENTIFIER_REGEX.match(slug):
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: player_name '{raw}' produced invalid slug '{slug}'.")
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
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: Invalid player_id '{player_id}'.")
    if not rid or not IDENTIFIER_REGEX.match(rid):
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: Invalid run_id '{run_id}'.")
    player_folder = pid if pid.lower().startswith(f"{slug}_") else f"{slug}_{pid}"
    return {
        "player_name": str(player_name).strip(),
        "player_slug": slug,
        "player_id": pid,
        "player_folder": player_folder,
        "run_id": rid,
        "run_prefix": f"players/{player_folder}/runs/{rid}",
    }


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


def _has_direct_gcs() -> bool:
    try:
        from google.cloud import storage  # noqa: F401
        return True
    except ImportError:
        return False


@contextmanager
def _exclusive_file_lock(lock_path: str) -> Iterator[None]:
    """Acquires an exclusive OS-level advisory lock (`fcntl.flock`) across threads and processes."""
    abs_lock = os.path.abspath(lock_path)
    os.makedirs(os.path.dirname(abs_lock), exist_ok=True)
    fd = os.open(abs_lock, os.O_CREAT | os.O_RDWR, 0o644)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX)
        yield
    finally:
        try:
            fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)


def _atomic_write_json(filepath: str, payload: Dict[str, Any]) -> None:
    """Writes JSON to a PID/thread-scoped temp file and atomically replaces `filepath`."""
    abs_path = os.path.abspath(filepath)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    tmp_path = f"{abs_path}.tmp.{os.getpid()}.{threading.get_ident()}"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, abs_path)
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


def download_gcs_object(
    bucket_name: str,
    object_key: str,
    local_dest: str,
    credentials_path: Optional[str] = None,
    required: bool = True,
) -> Optional[Dict[str, Any]]:
    """
    Downloads `gs://<bucket_name>/<object_key>` to a temporary path and atomically replaces `local_dest`
    after verifying remote vs local byte size (`INV-PARALLEL-INTAKE-01`).
    Automatically delegates to `/opt/anaconda3/bin/python3` if running inside Blender or an env without
    `google-cloud-storage`.
    """
    clean_bucket = str(bucket_name or "").strip().replace("gs://", "").strip("/")
    cred_file = resolve_gcs_credentials_file(credentials_path)
    abs_dest = os.path.abspath(local_dest)
    os.makedirs(os.path.dirname(abs_dest), exist_ok=True)
    tmp_dest = f"{abs_dest}.tmp.{os.getpid()}.{threading.get_ident()}"

    if _has_direct_gcs():
        from google.cloud import storage

        client = (
            storage.Client.from_service_account_json(cred_file)
            if cred_file
            else storage.Client()
        )
        bucket = client.bucket(clean_bucket)
        blob = bucket.blob(object_key)
        if not blob.exists():
            if not required:
                return None
            raise FileNotFoundError(
                f"Fatal [INV-GCS-RIG-01]: Missing required Stage 4 object in GCS: gs://{clean_bucket}/{object_key}"
            )
        blob.reload()
        rsize = int(blob.size or 0)
        if rsize <= 0:
            raise RuntimeError(
                f"Fatal [INV-GCS-RIG-01]: Remote GCS object is 0 bytes: gs://{clean_bucket}/{object_key}"
            )
        try:
            blob.download_to_filename(tmp_dest, timeout=120)
            lsize = os.path.getsize(tmp_dest)
            if lsize != rsize:
                raise RuntimeError(
                    f"Fatal [INV-GCS-RIG-01]: Download size mismatch for gs://{clean_bucket}/{object_key} "
                    f"(remote={rsize}, local={lsize})."
                )
            os.replace(tmp_dest, abs_dest)
        finally:
            if os.path.exists(tmp_dest):
                try:
                    os.remove(tmp_dest)
                except OSError:
                    pass
        return {
            "gcs_uri": f"gs://{clean_bucket}/{object_key}",
            "object_key": object_key,
            "local_path": abs_dest,
            "size_bytes": lsize,
            "sha256": sha256_file(abs_dest),
        }

    # Subprocess fallback via DEFAULT_HOST_PYTHON_BIN with atomic os.replace
    helper_code = """
import json, os, sys
from google.cloud import storage

bucket_name, object_key, local_dest, tmp_dest, cred_file, req_flag = sys.argv[1:7]
required = (req_flag == "1")
client = storage.Client.from_service_account_json(cred_file) if cred_file else storage.Client()
bucket = client.bucket(bucket_name)
blob = bucket.blob(object_key)
if not blob.exists():
    if not required:
        print(json.dumps({"exists": False}))
        sys.exit(0)
    raise FileNotFoundError(f"Fatal [INV-GCS-RIG-01]: Missing required Stage 4 object in GCS: gs://{bucket_name}/{object_key}")
blob.reload()
rsize = int(blob.size or 0)
if rsize <= 0:
    raise RuntimeError(f"Fatal [INV-GCS-RIG-01]: Remote GCS object is 0 bytes: gs://{bucket_name}/{object_key}")
os.makedirs(os.path.dirname(os.path.abspath(local_dest)), exist_ok=True)
try:
    blob.download_to_filename(tmp_dest, timeout=120)
    lsize = os.path.getsize(tmp_dest)
    if lsize != rsize:
        raise RuntimeError(f"Fatal [INV-GCS-RIG-01]: Download size mismatch (remote={rsize}, local={lsize})")
    os.replace(tmp_dest, local_dest)
finally:
    if os.path.exists(tmp_dest):
        try:
            os.remove(tmp_dest)
        except OSError:
            pass
print(json.dumps({"exists": True, "size_bytes": lsize}))
"""
    proc = subprocess.run(
        [
            DEFAULT_HOST_PYTHON_BIN,
            "-c",
            helper_code,
            clean_bucket,
            object_key,
            abs_dest,
            tmp_dest,
            cred_file or "",
            "1" if required else "0",
        ],
        capture_output=True,
        text=True,
        timeout=150,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Fatal [INV-GCS-RIG-01]: Failed to download gs://{clean_bucket}/{object_key}:\n"
            f"{proc.stderr or proc.stdout}"
        )
    lines = [ln.strip() for ln in (proc.stdout or "").splitlines() if ln.strip().startswith("{")]
    res = json.loads(lines[-1]) if lines else {"exists": os.path.isfile(abs_dest)}
    if not res.get("exists"):
        return None
    lsize = os.path.getsize(abs_dest)
    return {
        "gcs_uri": f"gs://{clean_bucket}/{object_key}",
        "object_key": object_key,
        "local_path": abs_dest,
        "size_bytes": lsize,
        "sha256": sha256_file(abs_dest),
    }


def upload_gcs_object(
    bucket_name: str,
    local_path: str,
    object_key: str,
    content_type: str = "application/octet-stream",
    metadata: Optional[Dict[str, str]] = None,
    credentials_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Uploads `local_path` to `gs://<bucket_name>/<object_key>` with custom metadata and verifies remote byte parity.
    """
    clean_bucket = str(bucket_name or "").strip().replace("gs://", "").strip("/")
    cred_file = resolve_gcs_credentials_file(credentials_path)
    abs_local = os.path.abspath(local_path)
    if not os.path.isfile(abs_local):
        raise FileNotFoundError(f"Fatal [INV-GCS-RIG-01]: Cannot upload missing local file '{abs_local}'.")
    lsize = os.path.getsize(abs_local)
    if lsize <= 0:
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: Cannot upload 0-byte local file '{abs_local}'.")
    sha_hex = sha256_file(abs_local)
    obj_meta = dict(metadata or {})
    obj_meta["sha256"] = sha_hex

    if _has_direct_gcs():
        from google.cloud import storage

        client = (
            storage.Client.from_service_account_json(cred_file)
            if cred_file
            else storage.Client()
        )
        bucket = client.bucket(clean_bucket)
        blob = bucket.blob(object_key)
        blob.metadata = obj_meta
        blob.upload_from_filename(abs_local, content_type=content_type, timeout=180)
        blob.reload()
        rsize = int(blob.size or 0)
        if rsize != lsize:
            raise RuntimeError(
                f"Fatal [INV-GCS-RIG-01]: Upload size mismatch for gs://{clean_bucket}/{object_key} "
                f"(remote={rsize}, local={lsize})."
            )
        return {
            "gcs_uri": f"gs://{clean_bucket}/{object_key}",
            "object_key": object_key,
            "local_path": abs_local,
            "size_bytes": rsize,
            "sha256": sha_hex,
            "content_type": content_type,
            "metadata": obj_meta,
        }

    helper_code = """
import json, os, sys
from google.cloud import storage

bucket_name, abs_local, object_key, content_type, cred_file, meta_json = sys.argv[1:7]
client = storage.Client.from_service_account_json(cred_file) if cred_file else storage.Client()
bucket = client.bucket(bucket_name)
blob = bucket.blob(object_key)
blob.metadata = json.loads(meta_json)
blob.upload_from_filename(abs_local, content_type=content_type, timeout=180)
blob.reload()
rsize = int(blob.size or 0)
lsize = os.path.getsize(abs_local)
if rsize != lsize:
    raise RuntimeError(f"Fatal [INV-GCS-RIG-01]: Upload size mismatch (remote={rsize}, local={lsize})")
print(json.dumps({"size_bytes": rsize}))
"""
    proc = subprocess.run(
        [
            DEFAULT_HOST_PYTHON_BIN,
            "-c",
            helper_code,
            clean_bucket,
            abs_local,
            object_key,
            content_type,
            cred_file or "",
            json.dumps(obj_meta),
        ],
        capture_output=True,
        text=True,
        timeout=200,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Fatal [INV-GCS-RIG-01]: Failed to upload gs://{clean_bucket}/{object_key}:\n"
            f"{proc.stderr or proc.stdout}"
        )
    return {
        "gcs_uri": f"gs://{clean_bucket}/{object_key}",
        "object_key": object_key,
        "local_path": abs_local,
        "size_bytes": lsize,
        "sha256": sha_hex,
        "content_type": content_type,
        "metadata": obj_meta,
    }


def validate_input_glb_binary(
    filepath: str,
    role_label: str = "character_full.glb",
    min_vertices: int = MIN_ANATOMICAL_VERTICES,
    min_faces: int = MIN_ANATOMICAL_FACES,
) -> Dict[str, Any]:
    """
    Enforces functional_specification_061.md Section 4.1.3:
    Validates in <0.2s prior to mesh rigging/compilation that the input .glb file:
    1. Exists on disk and has a valid 12-byte glTF 2.0 binary header (b'glTF', version 2).
    2. Is NOT a synthetic primitive placeholder (extras.shape in {'radius', 'sphere', 'icosphere'}).
    3. Contains > 1,000 vertices and > 1,000 faces across its mesh primitives.
    4. Extracts material names, primitive bounds, and head material/geometry indicators.
    """
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Fatal [INV-GCS-RIG-01]: Source asset for '{role_label}' missing at '{filepath}'.")
    file_size = os.path.getsize(filepath)
    if file_size < 28:
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: Source asset '{filepath}' is truncated ({file_size} bytes).")

    with open(filepath, "rb") as f:
        header = f.read(20)
        magic, version, declared_len, json_len, _ = struct.unpack("<4sIIII", header)
        if magic != GLTF_MAGIC_HEADER:
            raise ValueError(
                f"Fatal [INV-GCS-RIG-01]: File '{filepath}' does not start with glTF magic header b'glTF' (got {magic!r})."
            )
        if version != 2 or declared_len != file_size:
            raise ValueError(
                f"Fatal [INV-GCS-RIG-01]: Invalid glTF 2.0 header in '{filepath}' "
                f"(version={version}, declared={declared_len}, actual={file_size})."
            )
        json_bytes = f.read(json_len)

    gltf = json.loads(json_bytes.decode("utf-8"))
    meshes = gltf.get("meshes") or []
    accessors = gltf.get("accessors") or []
    materials = gltf.get("materials") or []
    images = gltf.get("images") or []
    if not meshes:
        raise ValueError(f"Fatal [INV-GCS-RIG-01]: glTF container '{filepath}' contains 0 mesh definitions.")

    total_verts = 0
    total_faces = 0
    prim_count = 0
    has_texcoords = False
    has_normals = False
    bounds_min = [float("inf"), float("inf"), float("inf")]
    bounds_max = [float("-inf"), float("-inf"), float("-inf")]
    head_material_indices: List[int] = []
    prim_summaries: List[Dict[str, Any]] = []

    for m_idx, m in enumerate(meshes):
        extras = m.get("extras") or {}
        if isinstance(extras, dict) and str(extras.get("shape", "")).lower() in ("radius", "sphere", "icosphere"):
            raise ValueError(
                f"Fatal [INV-GCS-RIG-01]: Synthetic primitive mesh rejected at '{filepath}' (extras={extras})."
            )
        for p_idx, prim in enumerate(m.get("primitives") or []):
            prim_count += 1
            attrs = prim.get("attributes") or {}
            pos_idx = attrs.get("POSITION")
            v_cnt = 0
            p_min = None
            p_max = None
            if pos_idx is not None and 0 <= int(pos_idx) < len(accessors):
                acc = accessors[int(pos_idx)]
                v_cnt = int(acc.get("count", 0))
                total_verts += v_cnt
                p_min = acc.get("min")
                p_max = acc.get("max")
                if p_min and p_max and len(p_min) == 3 and len(p_max) == 3:
                    for k in range(3):
                        bounds_min[k] = min(bounds_min[k], float(p_min[k]))
                        bounds_max[k] = max(bounds_max[k], float(p_max[k]))
            if "TEXCOORD_0" in attrs:
                has_texcoords = True
            if "NORMAL" in attrs:
                has_normals = True
            ind_idx = prim.get("indices")
            f_cnt = 0
            if ind_idx is not None and 0 <= int(ind_idx) < len(accessors):
                f_cnt = int(accessors[int(ind_idx)].get("count", 0)) // 3
                total_faces += f_cnt
            elif v_cnt > 0:
                f_cnt = v_cnt // 3
                total_faces += f_cnt

            mat_idx = prim.get("material")
            mat_name = ""
            if mat_idx is not None and 0 <= int(mat_idx) < len(materials):
                mat_name = str(materials[int(mat_idx)].get("name") or "")
                if "head" in mat_name.lower() and int(mat_idx) not in head_material_indices:
                    head_material_indices.append(int(mat_idx))

            prim_summaries.append({
                "mesh_index": m_idx,
                "primitive_index": p_idx,
                "material_index": mat_idx,
                "material_name": mat_name,
                "vertices": v_cnt,
                "faces": f_cnt,
                "min": p_min,
                "max": p_max,
            })

    if total_verts <= min_vertices or total_faces <= min_faces:
        raise ValueError(
            f"Fatal [INV-GCS-RIG-01]: Mesh '{filepath}' failed anatomical topology gate "
            f"(vertices={total_verts} <= {min_vertices} or faces={total_faces} <= {min_faces})."
        )

    return {
        "filepath": os.path.abspath(filepath),
        "size_bytes": file_size,
        "sha256": sha256_file(filepath),
        "mesh_count": len(meshes),
        "primitive_count": prim_count,
        "raw_gltf_vertices": total_verts,
        "raw_gltf_faces": total_faces,
        "material_count": len(materials),
        "material_names": [str(m.get("name") or f"Mat_{i}") for i, m in enumerate(materials)],
        "image_count": len(images),
        "skins_count": len(gltf.get("skins") or []),
        "has_texcoords": has_texcoords,
        "has_normals": has_normals,
        "bounds_min": bounds_min if bounds_min[0] != float("inf") else [0.0, 0.0, 0.0],
        "bounds_max": bounds_max if bounds_max[0] != float("-inf") else [0.0, 2.0, 0.0],
        "head_material_indices": head_material_indices,
        "primitives": prim_summaries,
    }


def resolve_head_bounds_in_canonical_2m(
    preflight: Dict[str, Any],
    assembly_telemetry: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Determines the anatomical head bounding box `[y_min_norm, 2.0]` and `[x_min_norm, x_max_norm]`
    in canonical 2.000m glTF space (`Y in [0.0, 2.0]`), combining:
      1. `assembly_telemetry.json` (`seating.seated_head_bounds` scaled into `2.000m` space),
      2. Primitive bounding boxes for any primitive whose material name contains `'head'`
         or whose `min_y` lies in `[1.45m, 1.80m]` when the character is `2.000m` tall,
      3. Geometric cranial fallback (`y_neck_norm = 1.64m`, `|x_norm| <= 0.22m`) for single-material meshes.
    Never assumes `mat_ids == 1`.
    """
    b_min = preflight["bounds_min"]
    b_max = preflight["bounds_max"]
    raw_h = max(1e-5, float(b_max[1] - b_min[1]))
    scale_to_2m = 2.0 / raw_h
    y_min_raw = float(b_min[1])
    x_mid_raw = 0.5 * float(b_min[0] + b_max[0])

    y_neck_norm = 1.640
    x_half_norm = 0.220
    source = "geometric_default"

    # Check primitives with "head" material name or cranial elevation
    for p in preflight.get("primitives") or []:
        p_min = p.get("min")
        p_max = p.get("max")
        if not p_min or not p_max:
            continue
        py_min_norm = (float(p_min[1]) - y_min_raw) * scale_to_2m
        py_max_norm = (float(p_max[1]) - y_min_raw) * scale_to_2m
        px_half_norm = max(abs(float(p_min[0]) - x_mid_raw), abs(float(p_max[0]) - x_mid_raw)) * scale_to_2m
        mname = str(p.get("material_name") or "").lower()
        if ("head" in mname and py_min_norm >= 1.35) or (py_min_norm >= 1.50 and py_max_norm >= 1.92 and px_half_norm <= 0.30):
            y_neck_norm = float(py_min_norm)
            x_half_norm = max(0.16, float(px_half_norm) + 0.015)
            source = f"primitive_bounds:{p.get('material_name') or p.get('primitive_index')}"
            break

    # Also check assembly_telemetry.json if provided
    if assembly_telemetry and isinstance(assembly_telemetry, dict):
        skel_m = assembly_telemetry.get("skeleton_metrics") or {}
        hb_2m = skel_m.get("head_bounds_2m") or {}
        if hb_2m.get("y_neck_norm") is not None and hb_2m.get("x_half_norm") is not None:
            y_neck_norm = float(hb_2m["y_neck_norm"])
            x_half_norm = float(hb_2m["x_half_norm"])
            source = "assembly_telemetry.skeleton_metrics"
        else:
            seating = assembly_telemetry.get("seating") or {}
            std_info = assembly_telemetry.get("standardization") or {}
            shb = seating.get("seated_head_bounds") or {}
            z_span = shb.get("z_span")
            x_span = shb.get("x_span")
            std_scale = float(std_info.get("standard_scale") or 0.0)
            if z_span and len(z_span) == 2 and std_scale > 0:
                if source == "geometric_default":
                    y_neck_norm = max(1.52, min(1.72, 2.0 - (float(z_span[1]) - float(z_span[0])) * std_scale))
                    if x_span and len(x_span) == 2:
                        x_half_norm = max(0.16, 0.5 * (float(x_span[1]) - float(x_span[0])) * std_scale + 0.015)
                    source = "assembly_telemetry.seated_head_bounds"

    return {
        "y_neck_norm": round(float(y_neck_norm), 5),
        "x_half_norm": round(float(x_half_norm), 5),
        "head_material_indices": list(preflight.get("head_material_indices") or []),
        "source": source,
    }


REQUIRED_SKELETON_LANDMARKS: Tuple[str, ...] = (
    "root", "pelvis", "crotch", "spine_01", "spine_02", "spine_03", "neck_01", "head", "crown_top",
    "clavicle_l", "clavicle_r", "shoulder_l", "shoulder_r", "elbow_l", "elbow_r", "wrist_l", "wrist_r",
    "hand_tip_l", "hand_tip_r", "hip_l", "hip_r", "knee_l", "knee_r", "ankle_l", "ankle_r",
    "ball_l", "ball_r", "toe_l", "toe_r",
)

TARGET_GAME_DEFAULT_POSE: Dict[str, str] = {
    "skate3": "apose",
    "alleyway": "tpose",
    "gta": "tpose",
    "zombies": "tpose",
}


def _normalize_preferred_pose(
    preferred_pose: Optional[str] = None,
    target_game: Optional[str] = None,
) -> Optional[str]:
    raw = str(preferred_pose or "").strip().lower()
    if not raw and target_game:
        raw = TARGET_GAME_DEFAULT_POSE.get(str(target_game).strip().lower(), "")
    if raw in ("apose", "a_pose", "a-pose"):
        return "apose"
    if raw in ("tpose", "t_pose", "t-pose"):
        return "tpose"
    return None


def _is_valid_skeleton_metrics(skel_metrics: Any) -> bool:
    if not isinstance(skel_metrics, dict):
        return False
    jz = skel_metrics.get("joints_z_up")
    jy = skel_metrics.get("joints_y_up")
    if not isinstance(jz, dict) or not isinstance(jy, dict):
        return False
    for k in REQUIRED_SKELETON_LANDMARKS:
        if k not in jz or k not in jy:
            return False
    return True


def compute_skeleton_metrics_from_glb(
    glb_path: str,
    preflight: Optional[Dict[str, Any]] = None,
    assembly_telemetry: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fast pure-NumPy binary glTF `.glb` anatomical profiler (`< 0.20s`, no Blender launch).
    Unpacks `POSITION` accessors from `glb_path`, normalizes to canonical `2.000m` Z-up space,
    identifies head vertices via material/primitive bounds or `assembly_telemetry`, and
    computes the full 29-landmark `skeleton_metrics` contract via `compute_skeleton_metrics_from_z_up_arrays()`.
    """
    import numpy as np

    if preflight is None:
        preflight = validate_input_glb_binary(glb_path, role_label=os.path.basename(glb_path))

    with open(glb_path, "rb") as f:
        magic, version, total_len = struct.unpack("<4sII", f.read(12))
        if magic != GLTF_MAGIC_HEADER:
            raise ValueError(f"Fatal: '{glb_path}' is not a valid binary glTF (.glb) file.")
        j_len, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(j_len).decode("utf-8"))
        b_hdr = f.read(8)
        bin_blob = b""
        if len(b_hdr) == 8:
            b_len, _ = struct.unpack("<II", b_hdr)
            bin_blob = f.read(b_len)

    accessors = gltf.get("accessors") or []
    buffer_views = gltf.get("bufferViews") or []
    materials = gltf.get("materials") or []
    head_mat_set = set(preflight.get("head_material_indices") or [])

    pos_blocks: List[np.ndarray] = []
    head_blocks: List[np.ndarray] = []

    all_meshes = gltf.get("meshes") or []
    for m in all_meshes:
        m_name = str(m.get("name") or "").lower()
        if len(all_meshes) > 1 and any(tag in m_name for tag in ("companion", "prop", "weapon", "skateboard", "board")):
            continue
        for prim in m.get("primitives") or []:
            attrs = prim.get("attributes") or {}
            pos_idx = attrs.get("POSITION")
            if pos_idx is None:
                continue
            acc = accessors[int(pos_idx)]
            bv = buffer_views[int(acc["bufferView"])]
            count = int(acc["count"])
            byte_offset = int(bv.get("byteOffset", 0)) + int(acc.get("byteOffset", 0))
            stride = int(bv.get("byteStride") or 12)
            if stride == 12:
                arr = np.frombuffer(bin_blob, dtype=np.float32, count=count * 3, offset=byte_offset).reshape(count, 3)
            else:
                raw_bytes = np.frombuffer(bin_blob, dtype=np.uint8, count=count * stride, offset=byte_offset).reshape(count, stride)
                arr = raw_bytes[:, :12].copy().view(np.float32).reshape(count, 3)

            mat_idx = prim.get("material")
            mat_name = ""
            if mat_idx is not None and 0 <= int(mat_idx) < len(materials):
                mat_name = str(materials[int(mat_idx)].get("name") or "").lower()

            pos_blocks.append(arr)
            head_blocks.append((mat_idx, mat_name, count))

    if not pos_blocks:
        raise ValueError(f"Fatal [INV-SKEL-METRICS-01]: No POSITION vertices found in '{glb_path}'.")

    v_gltf = np.vstack(pos_blocks).astype(np.float64)
    b_min = v_gltf.min(axis=0)
    b_max = v_gltf.max(axis=0)
    raw_h = max(1e-5, float(b_max[1] - b_min[1]))
    scale_to_2m = 2.0 / raw_h
    y_min_raw = float(b_min[1])
    x_mid_raw = 0.5 * float(b_min[0] + b_max[0])
    z_mid_raw = 0.5 * float(b_min[2] + b_max[2])

    resolved_head_blocks: List[np.ndarray] = []
    for arr, (mat_idx, mat_name, count) in zip(pos_blocks, head_blocks):
        py_min_norm = (float(arr[:, 1].min()) - y_min_raw) * scale_to_2m if count > 0 else 0.0
        py_max_norm = (float(arr[:, 1].max()) - y_min_raw) * scale_to_2m if count > 0 else 0.0
        px_half_norm = (
            max(abs(float(arr[:, 0].min()) - x_mid_raw), abs(float(arr[:, 0].max()) - x_mid_raw)) * scale_to_2m
            if count > 0
            else 1.0
        )
        is_head_prim = bool(
            (mat_idx is not None and int(mat_idx) in head_mat_set)
            or ("head" in mat_name and py_min_norm >= 1.00)
            or (py_min_norm >= 1.50 and py_max_norm >= 1.92 and px_half_norm <= 0.30)
        )
        resolved_head_blocks.append(np.full(count, is_head_prim, dtype=bool))
    head_mask = np.concatenate(resolved_head_blocks)

    # Transform glTF Y-up (x, y_up, z_fwd) -> canonical 2.000m Blender Z-up (x, y_depth=-z_fwd, z_up=y_up)
    x_norm = (v_gltf[:, 0] - x_mid_raw) * scale_to_2m
    y_up_norm = (v_gltf[:, 1] - y_min_raw) * scale_to_2m
    z_fwd_norm = (v_gltf[:, 2] - z_mid_raw) * scale_to_2m
    v_z_up = np.column_stack([x_norm, -z_fwd_norm, y_up_norm])

    seating_info = (assembly_telemetry or {}).get("seating") if isinstance(assembly_telemetry, dict) else None
    std_info = (assembly_telemetry or {}).get("standardization") if isinstance(assembly_telemetry, dict) else None
    std_scale = float(std_info["standard_scale"]) if isinstance(std_info, dict) and std_info.get("standard_scale") else None

    # If no primitive was tagged as head and assembly_telemetry has seated_head_bounds, tag cranial vertices
    if not np.any(head_mask):
        hb = resolve_head_bounds_in_canonical_2m(preflight, assembly_telemetry)
        y_n = float(hb["y_neck_norm"])
        x_h = float(hb["x_half_norm"])
        head_mask = (v_z_up[:, 2] >= y_n) & (np.abs(v_z_up[:, 0]) <= x_h)

    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(scripts_dir)
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)
    from scripts.builders.assemble_characters import compute_skeleton_metrics_from_z_up_arrays

    return compute_skeleton_metrics_from_z_up_arrays(
        verts_z_up=v_z_up,
        is_head_mask=head_mask,
        seating_info=seating_info,
        standardize_offset=None,
        standardize_scale=std_scale,
    )


def select_pose_intake(
    intake_info: Dict[str, Any],
    preferred_pose: Optional[str] = None,
    target_game: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns a view of `intake_info` tailored to `preferred_pose` (`"apose"` or `"tpose"`)
    or `target_game` (`"skate3"` -> `"apose"`, `"alleyway"|"gta"|"zombies"` -> `"tpose"`)
    when `intake_info["pose_variants"]` contains the requested pose variant.
    """
    norm_pose = _normalize_preferred_pose(preferred_pose=preferred_pose, target_game=target_game)
    if not norm_pose:
        return intake_info
    variants = intake_info.get("pose_variants") or {}
    if norm_pose in variants and isinstance(variants[norm_pose], dict):
        v = variants[norm_pose]
        merged = dict(intake_info)
        merged["resolved_pose"] = norm_pose
        merged["local_glb_path"] = v["local_glb_path"]
        merged["local_telemetry_path"] = v.get("local_telemetry_path") or intake_info.get("local_telemetry_path")
        merged["gcs_assembled_uri"] = v.get("gcs_assembled_uri") or intake_info.get("gcs_assembled_uri")
        merged["assembly_telemetry"] = v.get("assembly_telemetry") or intake_info.get("assembly_telemetry")
        merged["preflight"] = v["preflight"]
        merged["head_bounds_norm"] = v["head_bounds_norm"]
        merged["skeleton_metrics"] = v["skeleton_metrics"]
        return merged
    return intake_info


def _build_pose_variant_entry(
    local_glb_p: str,
    local_tel_p: Optional[str],
    fallback_tel: Optional[Dict[str, Any]],
    gcs_uri_p: Optional[str],
    role_label: str,
) -> Dict[str, Any]:
    tel_obj: Optional[Dict[str, Any]] = None
    if local_tel_p and os.path.isfile(local_tel_p) and os.path.getsize(local_tel_p) > 0:
        with open(local_tel_p, "r", encoding="utf-8") as tf:
            tel_obj = json.load(tf)
    elif fallback_tel is not None:
        tel_obj = fallback_tel

    pf = validate_input_glb_binary(local_glb_p, role_label=role_label)
    skel_m = (tel_obj or {}).get("skeleton_metrics") if isinstance(tel_obj, dict) else None
    if not _is_valid_skeleton_metrics(skel_m):
        skel_m = compute_skeleton_metrics_from_glb(local_glb_p, preflight=pf, assembly_telemetry=tel_obj)
        if isinstance(tel_obj, dict):
            tel_obj = dict(tel_obj)
            tel_obj["skeleton_metrics"] = skel_m

    hb = resolve_head_bounds_in_canonical_2m(pf, tel_obj)
    return {
        "local_glb_path": local_glb_p,
        "local_telemetry_path": local_tel_p if (local_tel_p and os.path.isfile(local_tel_p)) else None,
        "gcs_assembled_uri": gcs_uri_p,
        "assembly_telemetry": tel_obj,
        "preflight": pf,
        "head_bounds_norm": hb,
        "skeleton_metrics": skel_m,
    }


def _discover_modular_meshes(assembled_dir: str, abs_out_dir: str) -> Dict[str, str]:
    modular: Dict[str, str] = {}
    cand_dirs = [
        os.path.join(abs_out_dir, "meshes", "cleaned"),
        os.path.join(os.path.dirname(assembled_dir), "cleaned"),
        assembled_dir,
    ]
    for m_key, fname in (
        ("head", "head.glb"),
        ("arms", "arms.glb"),
        ("feet", "feet.glb"),
        ("body_apose", "body_apose.glb"),
        ("body_tpose", "body_tpose.glb"),
    ):
        for d in cand_dirs:
            p = os.path.join(d, fname)
            if os.path.isfile(p) and os.path.getsize(p) > 0:
                modular[m_key] = os.path.abspath(p)
                break
    return modular


def intake_assembled_character_for_rigging(
    glb_path: Optional[str] = None,
    telemetry_path: Optional[str] = None,
    char_id: Optional[str] = None,
    bucket_name: Optional[str] = None,
    player_name: Optional[str] = None,
    player_id: Optional[str] = None,
    run_id: Optional[str] = None,
    output_dir: Optional[str] = None,
    credentials_path: Optional[str] = None,
    preferred_pose: Optional[str] = None,
    target_game: Optional[str] = None,
    local_glb_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Unified Stage 5 intake function (`INV-GCS-RIG-01`, `INV-NO-REASSEMBLE-01`, `INV-SKEL-METRICS-01`):
    - Resolves pose-matched Stage 4 outputs (`character_apose.glb` + `assembly_apose_telemetry.json`
      for `preferred_pose="apose"` / `target_game="skate3"`, or `character_tpose.glb` +
      `assembly_tpose_telemetry.json` for `preferred_pose="tpose"` / `target_game in ("alleyway", "gta", "zombies")`),
      falling back cleanly to `character_full.glb` + `assembly_telemetry.json`.
    - Guarantees `intake_info["skeleton_metrics"]` is populated with all 29 anatomical landmarks
      (either loaded from Stage 4 telemetry or computed via pure NumPy in `< 0.20s`).
    """
    t0 = time.time()
    glb_path = glb_path or local_glb_path
    norm_pose = _normalize_preferred_pose(preferred_pose=preferred_pose, target_game=target_game)
    gcs_mode = bool(player_name and player_id and run_id)
    clean_bucket = str(bucket_name or DEFAULT_GCS_BUCKET).strip().replace("gs://", "").strip("/")
    cred_file = resolve_gcs_credentials_file(credentials_path)

    identity: Optional[Dict[str, str]] = None
    assembly_telemetry: Optional[Dict[str, Any]] = None
    local_tel_path: Optional[str] = None
    pose_variants: Dict[str, Dict[str, Any]] = {}
    resolved_pose = "full"

    if gcs_mode:
        identity = resolve_player_identity(player_name=str(player_name), player_id=str(player_id), run_id=str(run_id))
        run_prefix = identity["run_prefix"]
        abs_out_dir = os.path.abspath(
            output_dir or os.path.join("/tmp", f"skatealley_stage5_{identity['player_folder']}_{identity['run_id']}")
        )
        assembled_dir = os.path.join(abs_out_dir, "meshes", "assembled")
        os.makedirs(assembled_dir, exist_ok=True)

        local_glb = os.path.join(assembled_dir, "character_full.glb")
        local_tel = os.path.join(assembled_dir, "assembly_telemetry.json")
        remote_glb_key = f"{run_prefix}/03_meshes/assembled/character_full.glb"
        remote_tel_key = f"{run_prefix}/03_meshes/assembled/assembly_telemetry.json"
        intake_lock_path = os.path.join(assembled_dir, ".intake.lock")

        with _exclusive_file_lock(intake_lock_path):
            # Always fetch or verify assembly_telemetry.json first
            if not os.path.isfile(local_tel) or os.path.getsize(local_tel) == 0:
                download_gcs_object(
                    bucket_name=clean_bucket,
                    object_key=remote_tel_key,
                    local_dest=local_tel,
                    credentials_path=cred_file,
                    required=False,
                )
            if os.path.isfile(local_tel) and os.path.getsize(local_tel) > 0:
                with open(local_tel, "r", encoding="utf-8") as tf:
                    assembly_telemetry = json.load(tf)
                local_tel_path = local_tel

            expected_sha = None
            expected_size = None
            if assembly_telemetry and isinstance(assembly_telemetry.get("output"), dict):
                expected_sha = assembly_telemetry["output"].get("sha256")
                expected_size = assembly_telemetry["output"].get("size_bytes")

            need_download = True
            if os.path.isfile(local_glb) and os.path.getsize(local_glb) > 0:
                if expected_sha and expected_size:
                    if os.path.getsize(local_glb) == int(expected_size) and sha256_file(local_glb) == expected_sha:
                        need_download = False
                else:
                    need_download = False

            if need_download:
                download_gcs_object(
                    bucket_name=clean_bucket,
                    object_key=remote_glb_key,
                    local_dest=local_glb,
                    credentials_path=cred_file,
                    required=True,
                )

            if expected_sha:
                actual_sha = sha256_file(local_glb)
                if actual_sha != expected_sha:
                    raise ValueError(
                        f"Fatal [INV-GCS-RIG-01]: SHA-256 mismatch on '{local_glb}' "
                        f"(expected {expected_sha} from assembly_telemetry.json, got {actual_sha})."
                    )

            # Check and fetch pose-specific variants (apose / tpose) if advertised or requested
            advertised_poses = set((assembly_telemetry or {}).get("assembled_poses") or [])
            poses_dict = (assembly_telemetry or {}).get("poses") or {}
            advertised_poses.update(poses_dict.keys())
            candidate_poses = sorted(advertised_poses | ({norm_pose} if norm_pose else set()))

            for p_key in candidate_poses:
                if p_key not in ("apose", "tpose"):
                    continue
                p_local_glb = os.path.join(assembled_dir, f"character_{p_key}.glb")
                p_local_tel = os.path.join(assembled_dir, f"assembly_{p_key}_telemetry.json")
                p_remote_glb = f"{run_prefix}/03_meshes/assembled/character_{p_key}.glb"
                p_remote_tel = f"{run_prefix}/03_meshes/assembled/assembly_{p_key}_telemetry.json"

                if not os.path.isfile(p_local_tel) or os.path.getsize(p_local_tel) == 0:
                    if p_key in poses_dict and isinstance(poses_dict[p_key], dict):
                        _atomic_write_json(p_local_tel, poses_dict[p_key])
                    else:
                        download_gcs_object(
                            bucket_name=clean_bucket,
                            object_key=p_remote_tel,
                            local_dest=p_local_tel,
                            credentials_path=cred_file,
                            required=False,
                        )

                p_tel_obj = None
                if os.path.isfile(p_local_tel) and os.path.getsize(p_local_tel) > 0:
                    with open(p_local_tel, "r", encoding="utf-8") as ptf:
                        p_tel_obj = json.load(ptf)
                elif p_key in poses_dict and isinstance(poses_dict[p_key], dict):
                    p_tel_obj = poses_dict[p_key]

                p_exp_sha = ((p_tel_obj or {}).get("output") or {}).get("sha256")
                p_exp_size = ((p_tel_obj or {}).get("output") or {}).get("size_bytes")
                p_need_dl = True
                if os.path.isfile(p_local_glb) and os.path.getsize(p_local_glb) > 0:
                    if p_exp_sha and p_exp_size:
                        if os.path.getsize(p_local_glb) == int(p_exp_size) and sha256_file(p_local_glb) == p_exp_sha:
                            p_need_dl = False
                    else:
                        p_need_dl = False

                if p_need_dl and (p_key in advertised_poses or p_key == norm_pose):
                    download_gcs_object(
                        bucket_name=clean_bucket,
                        object_key=p_remote_glb,
                        local_dest=p_local_glb,
                        credentials_path=cred_file,
                        required=False,
                    )

                if os.path.isfile(p_local_glb) and os.path.getsize(p_local_glb) > 0:
                    pose_variants[p_key] = _build_pose_variant_entry(
                        local_glb_p=p_local_glb,
                        local_tel_p=p_local_tel if os.path.isfile(p_local_tel) else local_tel_path,
                        fallback_tel=p_tel_obj or assembly_telemetry,
                        gcs_uri_p=f"gs://{clean_bucket}/{p_remote_glb}",
                        role_label=f"character_{p_key}.glb",
                    )

        resolved_char_id = sanitize_player_slug(char_id or identity["player_slug"])
        gcs_assembled_uri = f"gs://{clean_bucket}/{remote_glb_key}"
    else:
        if not glb_path:
            raise ValueError(
                "Fatal [INV-GCS-RIG-01]: Provide either (--player-name, --player-id, --run-id) for GCS mode "
                "or --glb <path_or_gs_uri> for direct .glb mode."
            )
        raw_glb = str(glb_path).strip()
        abs_out_dir = os.path.abspath(output_dir or os.path.join("/tmp", "skatealley_stage5_direct"))
        os.makedirs(abs_out_dir, exist_ok=True)

        if raw_glb.startswith("gs://"):
            without_scheme = raw_glb[len("gs://") :]
            b_name, _, o_key = without_scheme.partition("/")
            clean_bucket = b_name
            local_glb = os.path.join(abs_out_dir, os.path.basename(o_key) or "character_full.glb")
            with _exclusive_file_lock(os.path.join(abs_out_dir, ".intake.lock")):
                download_gcs_object(
                    bucket_name=clean_bucket,
                    object_key=o_key,
                    local_dest=local_glb,
                    credentials_path=cred_file,
                    required=True,
                )
            gcs_assembled_uri = raw_glb
        else:
            local_glb = os.path.abspath(os.path.expanduser(raw_glb))
            gcs_assembled_uri = None

        assembled_dir = os.path.dirname(local_glb)
        cand_tel = telemetry_path
        if not cand_tel:
            bname = os.path.basename(local_glb).lower()
            if bname == "character_apose.glb":
                cand_tel = os.path.join(assembled_dir, "assembly_apose_telemetry.json")
            elif bname == "character_tpose.glb":
                cand_tel = os.path.join(assembled_dir, "assembly_tpose_telemetry.json")
            if not cand_tel or not os.path.isfile(cand_tel):
                cand_tel = os.path.join(assembled_dir, "assembly_telemetry.json")

        if cand_tel and os.path.isfile(cand_tel):
            with open(cand_tel, "r", encoding="utf-8") as tf:
                assembly_telemetry = json.load(tf)
            local_tel_path = os.path.abspath(cand_tel)

        # Discover sibling character_apose.glb / character_tpose.glb in the same directory
        for p_key in ("apose", "tpose"):
            sib_glb = os.path.join(assembled_dir, f"character_{p_key}.glb")
            sib_tel = os.path.join(assembled_dir, f"assembly_{p_key}_telemetry.json")
            if os.path.isfile(sib_glb) and os.path.getsize(sib_glb) > 0:
                pose_variants[p_key] = _build_pose_variant_entry(
                    local_glb_p=sib_glb,
                    local_tel_p=sib_tel if os.path.isfile(sib_tel) else local_tel_path,
                    fallback_tel=((assembly_telemetry or {}).get("poses") or {}).get(p_key) or assembly_telemetry,
                    gcs_uri_p=None,
                    role_label=f"character_{p_key}.glb",
                )

        base_stem = os.path.splitext(os.path.basename(local_glb))[0]
        if base_stem.lower() in ("character_full", "character_apose", "character_tpose") and assembly_telemetry and assembly_telemetry.get("player_slug"):
            default_slug = str(assembly_telemetry["player_slug"])
        else:
            default_slug = base_stem
        resolved_char_id = sanitize_player_slug(char_id or default_slug)
        if base_stem.lower() == "character_apose":
            resolved_pose = "apose"
        elif base_stem.lower() == "character_tpose":
            resolved_pose = "tpose"

    full_entry = _build_pose_variant_entry(
        local_glb_p=local_glb,
        local_tel_p=local_tel_path,
        fallback_tel=assembly_telemetry,
        gcs_uri_p=gcs_assembled_uri,
        role_label=os.path.basename(local_glb) or "character_full.glb",
    )
    pose_variants["full"] = full_entry

    # Also register full_entry under its detected pose ("apose" or "tpose") if that variant wasn't separately present
    detected_pose_key = "apose" if full_entry["skeleton_metrics"].get("is_apose") else "tpose"
    if detected_pose_key not in pose_variants:
        pose_variants[detected_pose_key] = full_entry

    active_entry = full_entry
    if norm_pose and norm_pose in pose_variants:
        # Only switch to character_{norm_pose}.glb if it actually exists or if full_entry matches norm_pose
        cand_entry = pose_variants[norm_pose]
        if os.path.basename(local_glb).lower() == "character_full.glb" or cand_entry is full_entry:
            active_entry = cand_entry
            if os.path.basename(active_entry["local_glb_path"]).lower() == f"character_{norm_pose}.glb":
                resolved_pose = norm_pose
            elif cand_entry is full_entry and detected_pose_key == norm_pose:
                resolved_pose = norm_pose

    modular_meshes = _discover_modular_meshes(os.path.dirname(active_entry["local_glb_path"]), abs_out_dir)

    return {
        "gcs_mode": gcs_mode,
        "bucket_name": clean_bucket,
        "credentials_path": cred_file,
        "identity": identity,
        "char_id": resolved_char_id,
        "character_name": resolved_char_id.upper(),
        "preferred_pose": norm_pose,
        "resolved_pose": resolved_pose,
        "local_glb_path": active_entry["local_glb_path"],
        "local_telemetry_path": active_entry["local_telemetry_path"],
        "gcs_assembled_uri": active_entry["gcs_assembled_uri"],
        "output_dir": abs_out_dir,
        "assembly_telemetry": active_entry["assembly_telemetry"],
        "preflight": active_entry["preflight"],
        "head_bounds_norm": active_entry["head_bounds_norm"],
        "skeleton_metrics": active_entry["skeleton_metrics"],
        "pose_variants": pose_variants,
        "modular_meshes": modular_meshes,
        "intake_elapsed_sec": round(time.time() - t0, 4),
    }


def sync_target_rigged_deliverables(
    intake_info: Dict[str, Any],
    target_game: str,
    deliverables: Sequence[Tuple[str, str, str]],
    telemetry_payload: Dict[str, Any],
    sync_audit: bool = True,
) -> Dict[str, Any]:
    """
    Writes `<output_dir>/rigged/<target_game>/rig_telemetry.json` and, when `intake_info["gcs_mode"]` is True:
    1. Uploads all `deliverables` (`[(logical_key, local_path, content_type), ...]`) + `rig_telemetry.json`
       to `gs://<bucket>/{run_prefix}/04_rigged/<target_game>/`.
    2. When `sync_audit=True`, updates `routing_audit.json` locally and in GCS under an exclusive advisory lock
       (`INV-AUDIT-ATOMIC-01`). When `sync_audit=False` (used during parallel Stage 5 orchestration), skips
       per-target `routing_audit.json` mutation so the parallel coordinator can commit all 3 targets atomically.
    """
    t_sync = time.time()
    out_dir = intake_info["output_dir"]
    target_local_dir = os.path.join(out_dir, "rigged", target_game)
    os.makedirs(target_local_dir, exist_ok=True)
    telemetry_local_path = os.path.join(target_local_dir, "rig_telemetry.json")

    enriched_telemetry = dict(telemetry_payload)
    enriched_telemetry["target_game"] = target_game
    enriched_telemetry["char_id"] = intake_info["char_id"]
    enriched_telemetry["resolved_pose"] = intake_info.get("resolved_pose", "full")
    enriched_telemetry["source_assembled_glb"] = intake_info["local_glb_path"]
    enriched_telemetry["source_assembled_sha256"] = intake_info["preflight"]["sha256"]
    enriched_telemetry["source_assembled_size_bytes"] = intake_info["preflight"]["size_bytes"]
    if intake_info.get("gcs_assembled_uri"):
        enriched_telemetry["source_assembled_gcs_uri"] = intake_info["gcs_assembled_uri"]
    if "skeleton_metrics" not in enriched_telemetry and intake_info.get("skeleton_metrics"):
        enriched_telemetry["skeleton_metrics"] = intake_info["skeleton_metrics"]

    if not intake_info.get("gcs_mode") or not intake_info.get("identity"):
        _atomic_write_json(telemetry_local_path, enriched_telemetry)
        return {
            "gcs_synced": False,
            "target_game": target_game,
            "telemetry_local_path": telemetry_local_path,
            "telemetry": enriched_telemetry,
        }

    identity = intake_info["identity"]
    bucket_name = intake_info["bucket_name"]
    cred_file = intake_info.get("credentials_path")
    run_prefix = identity["run_prefix"]
    rigged_prefix = f"{run_prefix}/04_rigged/{target_game}"

    base_meta = {
        "player_name": identity["player_name"],
        "player_slug": identity["player_slug"],
        "player_id": identity["player_id"],
        "player_folder": identity["player_folder"],
        "run_id": identity["run_id"],
        "pass_group": f"rigged_{target_game}",
        "target_game": target_game,
    }

    uploaded_objects: Dict[str, Dict[str, Any]] = {}
    gcs_uris: Dict[str, str] = {}

    def _upload_item(lkey: str, lpath: str, okey: str, ctype: str) -> Tuple[str, Dict[str, Any]]:
        res = upload_gcs_object(
            bucket_name=bucket_name,
            local_path=lpath,
            object_key=okey,
            content_type=ctype,
            metadata=base_meta,
            credentials_path=cred_file,
        )
        return lkey, res

    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = []
        for logical_key, local_path, content_type in deliverables:
            fname = os.path.basename(local_path)
            okey = f"{rigged_prefix}/{fname}"
            futs.append(pool.submit(_upload_item, logical_key, local_path, okey, content_type))
        for fut in as_completed(futs):
            lkey, umeta = fut.result()
            uploaded_objects[f"04_rigged.{target_game}.{lkey}"] = umeta
            gcs_uris[lkey] = umeta["gcs_uri"]

    tel_okey = f"{rigged_prefix}/rig_telemetry.json"
    gcs_uris["rig_telemetry"] = f"gs://{bucket_name}/{tel_okey}"
    enriched_telemetry["gcs_rigged_uris"] = gcs_uris
    enriched_telemetry["sync_elapsed_sec"] = round(time.time() - t_sync, 4)

    _atomic_write_json(telemetry_local_path, enriched_telemetry)

    _, tel_umeta = _upload_item("rig_telemetry", telemetry_local_path, tel_okey, "application/json")
    uploaded_objects[f"04_rigged.{target_game}.rig_telemetry"] = tel_umeta

    audit_local_path = os.path.join(out_dir, "routing_audit.json")
    if sync_audit:
        commit_consolidated_stage5_routing_audit(
            intake_info=intake_info,
            target_sync_bundles={
                target_game: {
                    "target_game": target_game,
                    "gcs_uris": gcs_uris,
                    "uploaded_objects": uploaded_objects,
                    "telemetry": enriched_telemetry,
                }
            },
        )

    return {
        "gcs_synced": True,
        "target_game": target_game,
        "gcs_uris": gcs_uris,
        "uploaded_objects": uploaded_objects,
        "telemetry_local_path": telemetry_local_path,
        "audit_local_path": audit_local_path,
        "telemetry": enriched_telemetry,
    }


def commit_consolidated_stage5_routing_audit(
    intake_info: Dict[str, Any],
    target_sync_bundles: Dict[str, Dict[str, Any]],
    parallel_summary: Optional[Dict[str, Any]] = None,
    errors_by_target: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Atomically updates `<output_dir>/routing_audit.json` and uploads it to
    `gs://<bucket>/{run_prefix}/routing_audit.json` under an exclusive advisory lock (`INV-AUDIT-ATOMIC-01`).
    """
    out_dir = intake_info["output_dir"]
    audit_local_path = os.path.join(out_dir, "routing_audit.json")
    audit_lock_path = os.path.join(out_dir, ".routing_audit.lock")
    identity = intake_info.get("identity")
    bucket_name = intake_info.get("bucket_name")
    cred_file = intake_info.get("credentials_path")

    with _exclusive_file_lock(audit_lock_path):
        if identity and bucket_name and not os.path.isfile(audit_local_path):
            audit_remote_key = f"{identity['run_prefix']}/routing_audit.json"
            download_gcs_object(
                bucket_name=bucket_name,
                object_key=audit_remote_key,
                local_dest=audit_local_path,
                credentials_path=cred_file,
                required=False,
            )

        if os.path.isfile(audit_local_path):
            with open(audit_local_path, "r", encoding="utf-8") as af:
                audit_data = json.load(af)
        else:
            audit_data = {
                "player_name": identity["player_name"] if identity else intake_info["char_id"],
                "player_slug": identity["player_slug"] if identity else intake_info["char_id"],
                "player_id": identity["player_id"] if identity else "local",
                "player_folder": identity["player_folder"] if identity else intake_info["char_id"],
                "run_id": identity["run_id"] if identity else "local",
                "gcs_bucket": bucket_name,
            }

        if "stage5_rigged" not in audit_data or not isinstance(audit_data["stage5_rigged"], dict):
            audit_data["stage5_rigged"] = {}
        # Remove any legacy alleyway entry so stage5_rigged strictly reflects the 3 game targets
        audit_data["stage5_rigged"].pop("alleyway", None)

        if "gcs_objects" not in audit_data or not isinstance(audit_data["gcs_objects"], dict):
            audit_data["gcs_objects"] = {}
        audit_data["gcs_objects"].pop("04_rigged.alleyway.character_rigged_glb", None)
        audit_data["gcs_objects"].pop("04_rigged.alleyway.rig_telemetry", None)

        for t_game, bundle in target_sync_bundles.items():
            t_uris = bundle.get("gcs_uris") or {}
            b_tel = bundle.get("telemetry") or {}
            audit_data["stage5_rigged"][t_game] = {
                "status": "COMPLETE",
                "resolved_pose": b_tel.get("resolved_pose") or intake_info.get("resolved_pose", "full"),
                "gcs_uris": t_uris,
                "telemetry_uri": t_uris.get("rig_telemetry"),
                "source_assembled_glb_uri": b_tel.get("source_assembled_gcs_uri") or intake_info.get("gcs_assembled_uri"),
                "source_assembled_sha256": b_tel.get("source_assembled_sha256") or intake_info["preflight"]["sha256"],
            }
            for uk, uv in (bundle.get("uploaded_objects") or {}).items():
                audit_data["gcs_objects"][uk] = uv

        if errors_by_target:
            for failed_target, err_msg in errors_by_target.items():
                audit_data["stage5_rigged"][failed_target] = {
                    "status": "FAILED",
                    "error": err_msg,
                    "source_assembled_glb_uri": intake_info.get("gcs_assembled_uri"),
                    "source_assembled_sha256": intake_info["preflight"]["sha256"],
                }

        required_game_targets = ("skate3", "gta", "zombies")
        completed_targets = [
            t for t in required_game_targets
            if audit_data["stage5_rigged"].get(t, {}).get("status") == "COMPLETE"
        ]
        audit_data["stage5_completed_targets"] = completed_targets
        if errors_by_target:
            audit_data["stage5_rigging_status"] = "FAILED"
        elif len(completed_targets) == len(required_game_targets):
            audit_data["stage5_rigging_status"] = "COMPLETE"
        else:
            audit_data["stage5_rigging_status"] = f"PARTIAL ({len(completed_targets)}/{len(required_game_targets)})"

        if parallel_summary is not None:
            audit_data["stage5_parallel_summary"] = parallel_summary

        _atomic_write_json(audit_local_path, audit_data)

        if intake_info.get("gcs_mode") and identity and bucket_name:
            audit_remote_key = f"{identity['run_prefix']}/routing_audit.json"
            base_meta = {
                "player_name": identity["player_name"],
                "player_slug": identity["player_slug"],
                "player_id": identity["player_id"],
                "player_folder": identity["player_folder"],
                "run_id": identity["run_id"],
                "pass_group": "stage5_rigged_parallel",
            }
            audit_umeta = upload_gcs_object(
                bucket_name=bucket_name,
                local_path=audit_local_path,
                object_key=audit_remote_key,
                content_type="application/json",
                metadata=base_meta,
                credentials_path=cred_file,
            )
            audit_data["gcs_objects"]["routing_audit"] = audit_umeta
            _atomic_write_json(audit_local_path, audit_data)

    return audit_data


def run_stage5_parallel_rigging(
    glb_path: Optional[str] = None,
    telemetry_path: Optional[str] = None,
    char_id: Optional[str] = None,
    bucket_name: Optional[str] = DEFAULT_GCS_BUCKET,
    player_name: Optional[str] = None,
    player_id: Optional[str] = None,
    run_id: Optional[str] = None,
    output_dir: Optional[str] = None,
    credentials_path: Optional[str] = None,
    targets: Sequence[str] = ("skate3", "gta", "zombies"),
) -> Dict[str, Any]:
    """
    Stage 5 Parallel Multi-Game Auto-Rigging Coordinator (`functional_specification_062.md`):
      1. Enforces `INV-PARALLEL-INTAKE-01`: Executes `intake_assembled_character_for_rigging()` once
         to download/validate `03_meshes/assembled/character_full.glb` + `assembly_telemetry.json`.
      2. Enforces `INV-PARALLEL-RIG-01`: Dispatches the 3 game riggers (`skate3`, `gta`, `zombies`)
         concurrently in parallel via `ThreadPoolExecutor(max_workers=len(targets))`, recording
         per-target start/end timestamps and elapsed durations.
      3. Enforces `INV-AUDIT-ATOMIC-01`: Performs a single consolidated update and GCS upload of
         `routing_audit.json` after all parallel workers complete (or records failure state and
         fails fast if any worker raises an exception).
    """
    t_stage5_start = time.perf_counter()
    started_utc = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    valid_targets = ("skate3", "gta", "zombies")
    ordered_targets = [str(t).strip().lower() for t in targets if str(t).strip()]
    if not ordered_targets:
        raise ValueError("Fatal [INV-PARALLEL-RIG-01]: At least one target game must be specified.")
    for t in ordered_targets:
        if t not in valid_targets:
            raise ValueError(
                f"Fatal [INV-PARALLEL-RIG-01]: Invalid target game '{t}'. Must be one of {valid_targets}."
            )

    t_intake0 = time.perf_counter()
    intake = intake_assembled_character_for_rigging(
        glb_path=glb_path,
        telemetry_path=telemetry_path,
        char_id=char_id,
        bucket_name=bucket_name,
        player_name=player_name,
        player_id=player_id,
        run_id=run_id,
        output_dir=output_dir,
        credentials_path=credentials_path,
    )
    intake_elapsed = round(time.perf_counter() - t_intake0, 4)

    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)

    from rig_skate3_character import rig_assembled_glb_for_skate3
    from compile_luis_revcdos_player import rig_assembled_glb_for_gta
    from compile_luis_zombies_mdl import rig_assembled_glb_for_zombies

    dispatch_table: Dict[str, Callable[..., Dict[str, Any]]] = {
        "skate3": rig_assembled_glb_for_skate3,
        "gta": rig_assembled_glb_for_gta,
        "zombies": rig_assembled_glb_for_zombies,
    }

    def _run_target_worker(target_name: str) -> Dict[str, Any]:
        fn = dispatch_table[target_name]
        w_t0 = time.perf_counter()
        w_start_utc = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        sync_bundle = fn(
            glb_path=glb_path,
            telemetry_path=telemetry_path,
            char_id=char_id,
            bucket_name=bucket_name,
            player_name=player_name,
            player_id=player_id,
            run_id=run_id,
            output_dir=intake["output_dir"],
            credentials_path=credentials_path,
            precomputed_intake=intake,
            sync_audit=False,
            return_sync_bundle=True,
        )
        w_elapsed = round(time.perf_counter() - w_t0, 4)
        w_end_utc = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return {
            "target_game": target_name,
            "started_at": w_start_utc,
            "completed_at": w_end_utc,
            "elapsed_seconds": w_elapsed,
            "sync_bundle": sync_bundle,
        }

    t_fanout0 = time.perf_counter()
    worker_results: Dict[str, Dict[str, Any]] = {}
    errors_by_target: Dict[str, str] = {}

    with ThreadPoolExecutor(max_workers=len(ordered_targets)) as pool:
        fut_to_target = {
            pool.submit(_run_target_worker, t_name): t_name
            for t_name in ordered_targets
        }
        for fut in as_completed(fut_to_target):
            t_name = fut_to_target[fut]
            try:
                worker_results[t_name] = fut.result()
            except Exception as exc:
                errors_by_target[t_name] = f"{type(exc).__name__}: {exc}"

    fanout_elapsed = round(time.perf_counter() - t_fanout0, 4)
    target_sync_bundles = {
        t_name: worker_results[t_name]["sync_bundle"]
        for t_name in ordered_targets
        if t_name in worker_results
    }

    if errors_by_target:
        commit_consolidated_stage5_routing_audit(
            intake_info=intake,
            target_sync_bundles=target_sync_bundles,
            errors_by_target=errors_by_target,
        )
        raise RuntimeError(
            f"Fatal [INV-PARALLEL-RIG-01]: Parallel Stage 5 rigging failed on target(s): "
            f"{json.dumps(errors_by_target, indent=2)}"
        )

    sum_target_elapsed = round(
        sum(worker_results[t_name]["elapsed_seconds"] for t_name in ordered_targets), 4
    )
    overall_elapsed_pre_audit = round(time.perf_counter() - t_stage5_start, 4)
    speedup = round(sum_target_elapsed / max(0.001, fanout_elapsed), 3)

    targets_summary: Dict[str, Dict[str, Any]] = {}
    for t_name in ordered_targets:
        w_res = worker_results[t_name]
        b = w_res["sync_bundle"]
        targets_summary[t_name] = {
            "status": "COMPLETE",
            "started_at": w_res["started_at"],
            "completed_at": w_res["completed_at"],
            "elapsed_seconds": w_res["elapsed_seconds"],
            "gcs_uris": b.get("gcs_uris") or {},
            "telemetry_local_path": b.get("telemetry_local_path"),
        }

    completed_utc = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    parallel_summary: Dict[str, Any] = {
        "status": "COMPLETE",
        "specification": "functional_specification_062",
        "parallel_workers": len(ordered_targets),
        "completed_targets": ordered_targets,
        "started_at": started_utc,
        "completed_at": completed_utc,
        "intake_elapsed_seconds": intake_elapsed,
        "parallel_fanout_elapsed_seconds": fanout_elapsed,
        "overall_elapsed_seconds": overall_elapsed_pre_audit,
        "sum_target_elapsed_seconds": sum_target_elapsed,
        "speedup_factor": speedup,
        "source_assembled_glb": intake["local_glb_path"],
        "source_assembled_gcs_uri": intake.get("gcs_assembled_uri"),
        "source_assembled_sha256": intake["preflight"]["sha256"],
        "source_assembled_size_bytes": intake["preflight"]["size_bytes"],
        "targets": targets_summary,
    }

    t_audit0 = time.perf_counter()
    commit_consolidated_stage5_routing_audit(
        intake_info=intake,
        target_sync_bundles=target_sync_bundles,
        parallel_summary=parallel_summary,
    )
    audit_commit_elapsed = round(time.perf_counter() - t_audit0, 4)
    total_stage5_elapsed = round(time.perf_counter() - t_stage5_start, 4)

    parallel_summary["audit_commit_elapsed_seconds"] = audit_commit_elapsed
    parallel_summary["overall_elapsed_seconds"] = total_stage5_elapsed
    return parallel_summary


def add_gcs_rig_cli_args(parser: argparse.ArgumentParser) -> None:
    """Adds standard Stage 5 GCS and direct `.glb` CLI arguments to any rigger's ArgumentParser."""
    parser.add_argument("--glb", default=None, help="Path or gs:// URI to pre-assembled character_full.glb.")
    parser.add_argument("--telemetry", default=None, help="Optional path to assembly_telemetry.json.")
    parser.add_argument("--char-id", default=None, help="Optional character slug/identifier override.")
    parser.add_argument("--gcs-bucket", default=DEFAULT_GCS_BUCKET, help="GCS bucket name (default: 3d-banana-player-assets).")
    parser.add_argument("--player-name", "--playername", dest="player_name", default=None, help="Player name for GCS run.")
    parser.add_argument("--player-id", default=None, help="Player ID for GCS run.")
    parser.add_argument("--run-id", default=None, help="Run ID for GCS run.")
    parser.add_argument("--output-dir", default=None, help="Local run directory for caching & telemetry.")
    parser.add_argument("--gcs-credentials", default=None, help="Optional path to gcs_service_account.json.")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Stage 5 Parallel Multi-Game Character Auto-Rigging Coordinator (Skate 3, GTA: Vice City, Zombies)."
    )
    add_gcs_rig_cli_args(parser)
    parser.add_argument(
        "--targets",
        default="skate3,gta,zombies",
        help="Comma-separated game targets to rig in parallel (default: skate3,gta,zombies).",
    )
    args = parser.parse_args(argv)
    target_list = [t.strip() for t in str(args.targets).split(",") if t.strip()]
    summary = run_stage5_parallel_rigging(
        glb_path=args.glb,
        telemetry_path=args.telemetry,
        char_id=args.char_id,
        bucket_name=args.gcs_bucket,
        player_name=args.player_name,
        player_id=args.player_id,
        run_id=args.run_id,
        output_dir=args.output_dir,
        credentials_path=args.gcs_credentials,
        targets=target_list,
    )
    print(json.dumps(summary, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
