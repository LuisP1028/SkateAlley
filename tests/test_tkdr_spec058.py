from __future__ import annotations

import json
import struct
import subprocess
import sys
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
TKDR_DIR = REPO_ROOT / "tkdr"
COMPILER_SCRIPT = REPO_ROOT / "scripts" / "compile_tkdr_character.py"
WRAPPER_SCRIPT = REPO_ROOT / "scripts" / "compile_luis_tkdr_fighter.py"


def _verify_compiled_bundle(
    bundle_dir: Path,
    expected_fighter_code: str,
    expected_fighter_id: int,
    rig_filename: str = "rig.bin",
    atlas_filename: str = "atlas.png",
) -> dict:
    meta_path = bundle_dir / "manifest.json"
    mesh_path = bundle_dir / rig_filename
    atlas_path = bundle_dir / atlas_filename

    assert meta_path.is_file(), f"Missing {meta_path}"
    assert mesh_path.is_file(), f"Missing {mesh_path}"
    assert atlas_path.is_file(), f"Missing {atlas_path}"

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    assert meta["targetFighterCode"] == expected_fighter_code
    assert meta["targetFighterId"] == expected_fighter_id
    assert 0 <= meta["targetFighterId"] <= 35

    vc = int(meta["vertexCount"])
    tc = int(meta["triangleCount"])
    assert 1800 <= vc <= 3600, f"vertexCount {vc} outside [1800, 3600] in {bundle_dir}"
    assert 2400 <= tc <= 5000, f"triangleCount {tc} outside [2400, 5000] in {bundle_dir}"
    assert meta["boneCount"] == 14
    assert len(meta["bones"]) == 14

    raw = mesh_path.read_bytes()
    expected_bytes = 40 + 14 * 12 + vc * 52 + tc * 6
    assert len(raw) == expected_bytes, (
        f"{rig_filename} byte length mismatch: got {len(raw)}, expected {expected_bytes}"
    )

    magic, ver, h_vc, h_tc, h_bc, h_fid, h_scale, sh_scale, lw_scale = struct.unpack_from(
        "<8sIIIIIfff", raw, 0
    )
    assert magic == b"LUISTKDR"
    assert ver == 1
    assert h_vc == vc
    assert h_tc == tc
    assert h_bc == 14
    assert h_fid == expected_fighter_id
    assert h_scale > 0.7 and sh_scale > 0.7 and lw_scale > 0.7

    # Inspect every vertex's positions, normals, UVs, bone indices, and L1-normalized weights
    vert_base = 40 + 14 * 12
    min_y = float("inf")
    max_y = float("-inf")
    for vi in range(vc):
        off = vert_base + vi * 52
        px, py, pz, nx, ny, nz, u, v, b0, b1, b2, b3, w0, w1, w2, w3 = struct.unpack_from(
            "<8f4B4f", raw, off
        )
        min_y = min(min_y, py)
        max_y = max(max_y, py)
        assert 0.0 <= u <= 1.0, f"Vertex {vi} u={u} out of [0, 1]"
        assert 0.0 <= v <= 1.0, f"Vertex {vi} v={v} out of [0, 1]"
        for bi in (b0, b1, b2, b3):
            assert 0 <= bi <= 13, f"Vertex {vi} bone index {bi} out of [0, 13]"
        w_sum = w0 + w1 + w2 + w3
        assert abs(w_sum - 1.0) <= 1e-4, f"Vertex {vi} weights sum to {w_sum} != 1.0"

    assert abs(min_y - 0.0) <= 1e-4, f"Grounded mesh min_y={min_y} != 0.0"
    assert abs(max_y - 1.0) <= 1e-3, f"Normalized mesh max_y={max_y} != 1.0"

    # Inspect triangle indices
    idx_base = vert_base + vc * 52
    for ti in range(tc):
        i0, i1, i2 = struct.unpack_from("<3H", raw, idx_base + ti * 6)
        assert 0 <= i0 < vc and 0 <= i1 < vc and 0 <= i2 < vc

    # Inspect 512x512 RGBA8888 atlas.png
    with Image.open(atlas_path) as img:
        assert img.size == (512, 512), f"Expected 512x512 atlas, got {img.size}"
        assert img.mode in ("RGBA", "RGB"), f"Expected RGBA/RGB atlas, got {img.mode}"
        rgba = img.convert("RGBA").tobytes()
        non_transparent = sum(1 for i in range(3, len(rgba), 4) if rgba[i] > 0)
        frac = non_transparent / (512 * 512)
        assert frac >= 0.25, f"Atlas non-transparent coverage {frac:.3f} < 0.25"

    return meta


def test_roster_36_tekken_fighters_and_registry() -> None:
    registry_path = TKDR_DIR / "custom_fighters" / "registry.json"
    assert registry_path.is_file(), "Missing tkdr/custom_fighters/registry.json"
    reg = json.loads(registry_path.read_text(encoding="utf-8"))

    assert reg["version"] == 1
    assert reg["rosterFighterCount"] == 36
    roster = reg["roster"]
    assert len(roster) == 36, f"Expected 36 Tekken fighters, got {len(roster)}"

    codes = [r["code"] for r in roster]
    assert codes[0] == "PAU"
    assert codes[1] == "LAW"
    assert codes[9] == "JIN"
    assert codes[13] == "BRY"
    assert codes[14] == "HEI"
    assert codes[15] == "KAZ"
    assert codes[33] == "LIL"
    assert codes[35] == "JPC"

    for idx, entry in enumerate(roster):
        assert entry["id"] == idx
        assert entry["heightScale"] > 0.75
        assert entry["shoulderScale"] > 0.75
        assert entry["limbWidthScale"] > 0.75


def test_glb_agnostic_bundles_across_distinct_topologies() -> None:
    # 1. Default LUIS.glb -> JIN (fighterId=9) mirrored in tkdr/luis_fighter/
    meta_luis = _verify_compiled_bundle(
        TKDR_DIR / "luis_fighter",
        "JIN",
        9,
        rig_filename="luis_rig.bin",
        atlas_filename="luis_atlas.png",
    )
    assert meta_luis["normalization"]["detectedPose"] in ("T_POSE", "A_POSE")

    # 2. Custom Fighter Registry Bundles: luis_jin, nicotest_pau, hoodie_law
    _verify_compiled_bundle(TKDR_DIR / "custom_fighters" / "luis_jin", "JIN", 9)
    meta_nico = _verify_compiled_bundle(TKDR_DIR / "custom_fighters" / "nicotest_pau", "PAU", 0)
    meta_hoodie = _verify_compiled_bundle(TKDR_DIR / "custom_fighters" / "hoodie_law", "LAW", 1)

    # Verify character_hoodie.glb had pre-existing skins stripped and multi-material textures packed
    assert meta_hoodie["sourceSkinCount"] >= 1
    assert meta_hoodie["sourcePrimitiveCount"] >= 2
    assert meta_nico["inputTriangleCount"] >= 10000


def test_cli_list_fighters_and_wrapper() -> None:
    res = subprocess.run(
        [sys.executable, str(COMPILER_SCRIPT), "--list-fighters"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=True,
    )
    assert "PAU" in res.stdout and "Paul Phoenix" in res.stdout
    assert "JIN" in res.stdout and "Jin Kazama" in res.stdout
    assert "LIL" in res.stdout and "Lili" in res.stdout
    assert WRAPPER_SCRIPT.is_file()


def test_html_and_webgl2_bridge_contract() -> None:
    index_html = (TKDR_DIR / "index.html").read_text(encoding="utf-8")
    tkdr_html = (TKDR_DIR / "tkdr.html").read_text(encoding="utf-8")
    assert index_html == tkdr_html, "tkdr/index.html and tkdr/tkdr.html must remain byte-for-byte identical"
    assert '<script src="./luis_fighter_bridge.js"></script>' in index_html

    bridge_js = (TKDR_DIR / "luis_fighter_bridge.js").read_text(encoding="utf-8")
    assert "window.__TKDR_CUSTOM_FIGHTERS__" in bridge_js
    assert "function(...args)" in bridge_js or "(...args)" in bridge_js
    assert "origBufferData.apply(this, args)" in bridge_js
    assert "tkdr-fighter-rig-panel" in bridge_js
    assert "setBinding" in bridge_js
    assert "compileUploadedGlbInBrowser" in bridge_js
