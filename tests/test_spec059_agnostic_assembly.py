#!/usr/bin/env python3
"""
Verification Test Suite for functional_specification_059.md:
.glb-File-Agnostic Lossless 3D Character Mesh Assembly & GCS 03_meshes/assembled/ Pipeline Integration.

Covers:
- AC-01: Agnostic Proportion, Alignment & Draped-Headwear Seating Across Character Pairs
         (`INV-AGNOSTIC-01`, `INV-DRAPE-SAFE-01`, `INV-STD-01`)
- AC-02: Strict Zero-Decimation & Lossless Material/UV Seam Preservation
         (`INV-NO-DECIMATE-01`, `INV-MAT-UV-01`)
- AC-03: Pre-Flight Synthetic Primitive & Corrupt Binary Fail-Fast Gate
         (`INV-NO-SYNTHETIC-02`)
- AC-04: End-to-End GCS `03_meshes/assembled/` Intake, Assembly & Upload
         (`INV-GCS-ASSEMBLE-01`)
- AC-05: Multi-Angle Verification Render & Audit Lineage Completeness
"""

from __future__ import annotations

import json
import os
import struct
import sys
import time
from pathlib import Path
from typing import Any, Dict

import pytest
from PIL import Image

SKATEALLEY_ROOT = Path("/Users/diesel/desktop/skatealley")
BUILDERS_DIR = SKATEALLEY_ROOT / "scripts" / "builders"
GREEK_ROOT = Path("/Users/diesel/Desktop/Greek")

if str(BUILDERS_DIR) not in sys.path:
    sys.path.insert(0, str(BUILDERS_DIR))
if str(GREEK_ROOT) not in sys.path:
    sys.path.insert(0, str(GREEK_ROOT))

from assemble_characters import (  # noqa: E402
    assemble_character_pair,
    run_gcs_player_assembly,
    sha256_file,
    validate_input_glb_binary,
)
from nanobanana_router import (  # noqa: E402
    build_player_gcs_layout,
    execute_nanobanana_router,
    run_stage4_character_assembly,
)


def _parse_glb_json_chunk(glb_path: str | Path) -> Dict[str, Any]:
    with open(glb_path, "rb") as f:
        header = f.read(20)
        magic, version, total_len, json_len, json_type = struct.unpack("<4sIIII", header)
        assert magic == b"glTF"
        assert version == 2
        assert total_len == os.path.getsize(glb_path)
        json_bytes = f.read(json_len)
    return json.loads(json_bytes.decode("utf-8"))


def test_ac03_synthetic_primitive_and_low_poly_fail_fast(tmp_path: Path) -> None:
    """
    AC-03 (`INV-NO-SYNTHETIC-02`):
    Verifies that synthetic trimesh icospheres (`extras.shape == "radius"`, 642 vertices)
    and truncated/corrupt binaries are rejected in < 0.2 seconds before launching Blender.
    """
    synth_body = SKATEALLEY_ROOT / "players_stephen_curry_sc30_runs_spec037_live_verify_03_meshes_body_body.glb"
    synth_head = SKATEALLEY_ROOT / "players_stephen_curry_sc30_runs_spec037_live_verify_03_meshes_head_head.glb"
    assert synth_body.is_file()
    assert synth_head.is_file()

    t0 = time.perf_counter()
    with pytest.raises(ValueError, match="INV-NO-SYNTHETIC-02"):
        validate_input_glb_binary(str(synth_body), role_label="body")
    elapsed = time.perf_counter() - t0
    assert elapsed < 0.2, f"Pre-flight gate took {elapsed:.4f}s (exceeded 0.2s budget)"

    t1 = time.perf_counter()
    with pytest.raises(ValueError, match="INV-NO-SYNTHETIC-02"):
        assemble_character_pair(
            body_path=str(synth_body),
            head_path=str(synth_head),
            output_path=str(tmp_path / "should_not_exist.glb"),
        )
    elapsed_pair = time.perf_counter() - t1
    assert elapsed_pair < 0.2
    assert not (tmp_path / "should_not_exist.glb").exists()

    # Corrupt / truncated file check
    bad_glb = tmp_path / "corrupt.glb"
    bad_glb.write_bytes(b"NOT_GLTF_HEADER_DATA_1234567890")
    with pytest.raises(ValueError, match="glTF magic header"):
        validate_input_glb_binary(str(bad_glb), role_label="body")


def test_ac01_ac02_agnostic_proportion_seating_and_zero_decimation_across_characters() -> None:
    """
    AC-01 & AC-02 (`INV-AGNOSTIC-01`, `INV-DRAPE-SAFE-01`, `INV-STD-01`, `INV-NO-DECIMATE-01`, `INV-MAT-UV-01`):
    Verifies that distinct character pairs (`nicotest_run_01` with draped purple durag and `LUIS_COLOR`
    with backwards cap & hoodie) are proportionally scaled, aligned, and seated without hardcoded
    overrides, with zero decimation and full PBR material/texture/UV preservation.
    """
    # 1. Verify nicotest_run_01 assembled character telemetry and binary glTF container
    nico_assembled_dir = GREEK_ROOT / "outputs" / "nicotest_run_01" / "meshes" / "assembled"
    nico_glb = nico_assembled_dir / "character_full.glb"
    nico_tel_path = nico_assembled_dir / "assembly_telemetry.json"
    assert nico_glb.is_file() and nico_glb.stat().st_size > 1_000_000
    assert nico_tel_path.is_file()

    nico_tel = json.loads(nico_tel_path.read_text(encoding="utf-8"))
    assert nico_tel["status"] == "COMPLETE"
    assert nico_tel["decimation_applied"] is False

    # Agnostic proportion & draped durag seating assertions
    seating = nico_tel["seating"]
    assert seating["status"] == "HEAD_SEATED_AGNOSTIC"
    assert seating["mode"] == "agnostic_3d_landmark_solver"
    assert 0.18 <= seating["scale_applied"] <= 0.25
    assert seating["neck_cut_z_applied"] is None  # Durag tails preserved without guillotine cut

    # Standardization & zero-decimation assertions
    std = nico_tel["standardization"]
    body_clean = nico_tel["inputs"]["body"]["cleaning"]
    head_clean = nico_tel["inputs"]["head"]["cleaning"]
    assert body_clean["decimation_applied"] is False
    assert head_clean["decimation_applied"] is False
    assert body_clean["faces_after"] >= int(0.999 * body_clean["faces_before"])
    assert head_clean["faces_after"] >= int(0.999 * head_clean["faces_before"])
    assert std["total_faces"] == body_clean["faces_after"] + head_clean["faces_after"]
    assert std["total_vertices"] == body_clean["verts_after"] + head_clean["verts_after"]
    assert std["decimation_applied"] is False
    assert abs(std["final_z_min"]) <= 0.001
    assert abs(std["final_height"] - 2.000) <= 0.010
    assert std["material_count"] == 2
    assert std["uv_layers"] == ["UVMap"]
    assert std["has_is_head_part_vg"] is True

    # Inspect actual exported glTF binary structure
    gltf_json = _parse_glb_json_chunk(nico_glb)
    assert len(gltf_json.get("materials", [])) == 2
    assert len(gltf_json.get("images", [])) >= 2
    assert len(gltf_json.get("textures", [])) >= 2
    prim_attrs = gltf_json["meshes"][0]["primitives"][0]["attributes"]
    assert "TEXCOORD_0" in prim_attrs

    # 2. Verify LUIS_COLOR agnostic assembly telemetry & output
    luis_tel_path = Path("/tmp/luis_agnostic_telemetry.json")
    luis_glb_path = Path("/tmp/luis_agnostic_full.glb")
    if not luis_tel_path.is_file() or not luis_glb_path.is_file():
        assemble_character_pair(
            body_path="/Users/diesel/Desktop/Doom_Rig/Luis_BODY_COLOR.glb",
            head_path="/Users/diesel/Desktop/Doom_Rig/LUIS_HEAD_COLOR.glb",
            output_path=str(luis_glb_path),
            character_name="LUIS_AGNOSTIC",
            telemetry_out_path=str(luis_tel_path),
        )
    luis_tel = json.loads(luis_tel_path.read_text(encoding="utf-8"))
    assert luis_tel["seating"]["mode"] == "agnostic_3d_landmark_solver"
    assert 0.18 <= luis_tel["seating"]["scale_applied"] <= 0.25
    assert luis_tel["standardization"]["decimation_applied"] is False
    assert luis_tel["standardization"]["total_faces"] == (
        luis_tel["inputs"]["body"]["cleaning"]["faces_after"]
        + luis_tel["inputs"]["head"]["cleaning"]["faces_after"]
    )
    assert luis_tel["standardization"]["material_count"] == 2
    assert abs(luis_tel["standardization"]["final_height"] - 2.000) <= 0.010


def test_ac04_ac05_gcs_assembled_deliverables_and_router_integration(tmp_path: Path) -> None:
    """
    AC-04 & AC-05 (`INV-GCS-ASSEMBLE-01`):
    Verifies:
    1. `build_player_gcs_layout` includes `character_full_glb`, `telemetry`, and `verification.{front,side,three_quarter}`
       under `03_meshes["assembled"]`.
    2. Live `nicotest_run_01` verification renders (`front.png`, `side.png`, `three_quarter.png`) are 1920x1080 RGB PNGs
       and `routing_audit.json` contains `stage4_assembly_status == "COMPLETE"` and `stage4_assembled`.
    3. `run_stage4_character_assembly` pulls `head.glb` and `body.glb` from GCS, executes headless Blender assembly,
       uploads all deliverables to `03_meshes/assembled/`, and updates `routing_audit.json` with SHA-256 parity.
    """
    # 1. Verify canonical GCS layout dictionary
    layout = build_player_gcs_layout(
        player_name="nicotest",
        player_id="nt01",
        run_id="run_01",
        populated_slots={"head_front": "/tmp/h.png", "body_front": "/tmp/b.png"},
    )
    assembled_layout = layout["03_meshes"]["assembled"]
    assert assembled_layout["character_full_glb"] == (
        "players/nicotest_nt01/runs/run_01/03_meshes/assembled/character_full.glb"
    )
    assert assembled_layout["telemetry"] == (
        "players/nicotest_nt01/runs/run_01/03_meshes/assembled/assembly_telemetry.json"
    )
    for angle in ("front", "side", "three_quarter"):
        assert assembled_layout["verification"][angle] == (
            f"players/nicotest_nt01/runs/run_01/03_meshes/assembled/verification/{angle}.png"
        )

    # 2. Verify live nicotest_run_01 verification renders & routing_audit.json
    nico_out = GREEK_ROOT / "outputs" / "nicotest_run_01"
    verif_dir = nico_out / "meshes" / "assembled" / "verification"
    for angle in ("front", "side", "three_quarter"):
        img_path = verif_dir / f"{angle}.png"
        assert img_path.is_file() and img_path.stat().st_size > 100_000
        with Image.open(img_path) as im:
            assert im.size == (1920, 1080)

    audit_file = nico_out / "routing_audit.json"
    assert audit_file.is_file()
    audit_data = json.loads(audit_file.read_text(encoding="utf-8"))
    assert audit_data.get("stage4_assembly_status") == "COMPLETE"
    s4 = audit_data.get("stage4_assembled")
    assert isinstance(s4, dict)
    assert s4["status"] == "COMPLETE"
    assert s4["decimation_applied"] is False
    assert s4["assembled_glb_uri"] == (
        "gs://3d-banana-player-assets/players/nicotest_nt01/runs/run_01/03_meshes/assembled/character_full.glb"
    )
    assert s4["telemetry_uri"] == (
        "gs://3d-banana-player-assets/players/nicotest_nt01/runs/run_01/03_meshes/assembled/assembly_telemetry.json"
    )
    assert set(s4["verification_uris"].keys()) == {"front", "side", "three_quarter"}
    assert "03_meshes.assembled.character_full_glb" in audit_data["gcs_objects"]
    assert "03_meshes.assembled.telemetry" in audit_data["gcs_objects"]

    # 3. Verify run_stage4_character_assembly intake from GCS -> assembly -> upload to 03_meshes/assembled/
    src_body = nico_out / "meshes" / "body.glb"
    src_head = nico_out / "meshes" / "head.glb"
    prefix = "players/nicotest_nt01/runs/test_s4"
    cloud_store: Dict[str, bytes] = {
        f"{prefix}/03_meshes/body/body.glb": src_body.read_bytes(),
        f"{prefix}/03_meshes/head/head.glb": src_head.read_bytes(),
    }
    uploaded_meta: Dict[str, Dict[str, Any]] = {}

    def _dl(object_key: str, local_dest: str) -> Dict[str, Any]:
        assert object_key in cloud_store, f"Unexpected download key: {object_key}"
        os.makedirs(os.path.dirname(local_dest), exist_ok=True)
        with open(local_dest, "wb") as f:
            f.write(cloud_store[object_key])
        return {
            "gcs_uri": f"gs://3d-banana-player-assets/{object_key}",
            "object_key": object_key,
            "local_path": local_dest,
            "size_bytes": len(cloud_store[object_key]),
            "sha256": sha256_file(local_dest),
        }

    def _ul(
        local_path: str,
        object_key: str,
        content_type: str,
        sha256_hex: str,
        metadata: Dict[str, str] | None = None,
    ) -> Dict[str, Any]:
        raw = Path(local_path).read_bytes()
        cloud_store[object_key] = raw
        rec = {
            "gcs_uri": f"gs://3d-banana-player-assets/{object_key}",
            "object_key": object_key,
            "local_path": local_path,
            "size_bytes": len(raw),
            "sha256": sha256_hex,
            "content_type": content_type,
            "metadata": dict(metadata or {}),
        }
        uploaded_meta[object_key] = rec
        return rec

    s4_out_dir = tmp_path / "s4_run"
    s4_out_dir.mkdir(parents=True, exist_ok=True)
    (s4_out_dir / "routing_audit.json").write_text(
        json.dumps({"status": "COMPLETE", "gcs_objects": {}}),
        encoding="utf-8",
    )

    s4_res = run_stage4_character_assembly(
        bucket_name="3d-banana-player-assets",
        player_name="nicotest",
        player_id="nt01",
        run_id="test_s4",
        output_dir=str(s4_out_dir),
        downloader_fn=_dl,
        uploader_fn=_ul,
        render_verification=False,
    )

    assert s4_res["status"] == "COMPLETE"
    assert f"{prefix}/03_meshes/assembled/character_full.glb" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/character_apose.glb" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/assembly_telemetry.json" in uploaded_meta
    assert f"{prefix}/routing_audit.json" in uploaded_meta
    assert uploaded_meta[f"{prefix}/03_meshes/assembled/character_full.glb"]["metadata"]["pass_group"] == "assembled"


def test_spec039_dual_body_apose_and_tpose_gcs_assembly_routing(tmp_path: Path) -> None:
    """
    Verifies Spec 039 5-Asset Modular Player Suite dual-body assembly routing:
    When `03_meshes/head/head.glb`, `03_meshes/body_apose/body_apose.glb`, and
    `03_meshes/body_tpose/body_tpose.glb` exist in GCS (`pass_group="all"`),
    `run_stage4_character_assembly` pulls all 3 meshes, concurrently assembles
    both `character_apose.glb` and `character_tpose.glb` (plus backward-compatible
    `character_full.glb`), and uploads all deliverables and telemetry manifests to
    `03_meshes/assembled/`.
    """
    nico_out = GREEK_ROOT / "outputs" / "nicotest_run_01"
    src_head = nico_out / "meshes" / "head.glb"
    src_body_apose = nico_out / "meshes" / "body.glb"
    src_body_tpose = Path("/Users/diesel/Desktop/Doom_Rig/Luis_BODY_COLOR.glb")
    assert src_head.is_file()
    assert src_body_apose.is_file()
    assert src_body_tpose.is_file()

    prefix = "players/nicotest_nt01/runs/spec039_dual"
    cloud_store: Dict[str, bytes] = {
        f"{prefix}/03_meshes/head/head.glb": src_head.read_bytes(),
        f"{prefix}/03_meshes/body_apose/body_apose.glb": src_body_apose.read_bytes(),
        f"{prefix}/03_meshes/body_tpose/body_tpose.glb": src_body_tpose.read_bytes(),
    }
    uploaded_meta: Dict[str, Dict[str, Any]] = {}

    def _dl(object_key: str, local_dest: str) -> Dict[str, Any]:
        if object_key not in cloud_store:
            raise FileNotFoundError(f"Missing cloud object: {object_key}")
        os.makedirs(os.path.dirname(local_dest), exist_ok=True)
        with open(local_dest, "wb") as f:
            f.write(cloud_store[object_key])
        return {
            "gcs_uri": f"gs://3d-banana-player-assets/{object_key}",
            "object_key": object_key,
            "local_path": local_dest,
            "size_bytes": len(cloud_store[object_key]),
            "sha256": sha256_file(local_dest),
        }

    def _ul(
        local_path: str,
        object_key: str,
        content_type: str,
        sha256_hex: str,
        metadata: Dict[str, str] | None = None,
    ) -> Dict[str, Any]:
        raw = Path(local_path).read_bytes()
        cloud_store[object_key] = raw
        rec = {
            "gcs_uri": f"gs://3d-banana-player-assets/{object_key}",
            "object_key": object_key,
            "local_path": local_path,
            "size_bytes": len(raw),
            "sha256": sha256_hex,
            "content_type": content_type,
            "metadata": dict(metadata or {}),
        }
        uploaded_meta[object_key] = rec
        return rec

    dual_out_dir = tmp_path / "dual_s4_run"
    dual_out_dir.mkdir(parents=True, exist_ok=True)
    (dual_out_dir / "routing_audit.json").write_text(
        json.dumps({"status": "COMPLETE", "gcs_objects": {}}),
        encoding="utf-8",
    )

    dual_res = run_stage4_character_assembly(
        bucket_name="3d-banana-player-assets",
        player_name="nicotest",
        player_id="nt01",
        run_id="spec039_dual",
        output_dir=str(dual_out_dir),
        downloader_fn=_dl,
        uploader_fn=_ul,
        render_verification=False,
        pass_group="all",
    )

    assert dual_res["status"] == "COMPLETE"
    assert dual_res["assembled_poses"] == ["apose", "tpose"]
    assert Path(dual_res["character_apose_glb_path"]).is_file()
    assert Path(dual_res["character_tpose_glb_path"]).is_file()
    assert Path(dual_res["assembled_glb_path"]).is_file()

    # Verify both character_apose.glb and character_tpose.glb were uploaded to 03_meshes/assembled/
    assert f"{prefix}/03_meshes/assembled/character_apose.glb" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/character_tpose.glb" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/character_full.glb" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/assembly_apose_telemetry.json" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/assembly_tpose_telemetry.json" in uploaded_meta
    assert f"{prefix}/03_meshes/assembled/assembly_telemetry.json" in uploaded_meta

    # Verify distinct SHA-256 digests between assembled A-pose and T-pose characters
    apose_sha = uploaded_meta[f"{prefix}/03_meshes/assembled/character_apose.glb"]["sha256"]
    tpose_sha = uploaded_meta[f"{prefix}/03_meshes/assembled/character_tpose.glb"]["sha256"]
    full_sha = uploaded_meta[f"{prefix}/03_meshes/assembled/character_full.glb"]["sha256"]
    assert apose_sha != tpose_sha
    assert full_sha == apose_sha

    # Verify routing_audit.json lineage
    updated_audit = json.loads((dual_out_dir / "routing_audit.json").read_text(encoding="utf-8"))
    s4_audit = updated_audit["stage4_assembled"]
    assert s4_audit["assembled_poses"] == ["apose", "tpose"]
    assert s4_audit["character_apose_glb_uri"].endswith("03_meshes/assembled/character_apose.glb")
    assert s4_audit["character_tpose_glb_uri"].endswith("03_meshes/assembled/character_tpose.glb")
    assert s4_audit["poses"]["apose"]["decimation_applied"] is False
    assert s4_audit["poses"]["tpose"]["decimation_applied"] is False

