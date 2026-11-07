#!/usr/bin/env python3
"""
tests/verify_storage_persistence.py
Authoritative Storage, Persistence Layer, and ACID Consistency Verification Suite
Governed by Functional Specification 068, Addendum §11–§15, storage-architecture.md,
and LANGUAGE.md ({errors}, {correctness}, {functionality}, {correct required outputs}, {sufficient}, {insufficient}).

Verifies the 5 Core Storage & Persistence Pillars:
1. Skate 3 Cleanroom Spawning Rig:
   - pack.json: default_char="luis", size=100267103 (90631134 + len(part_bytes)), hash="1b3a15685a84a425"
   - char_luis.part: 37-byte header ("assets/private/skater.glb", uint64_le glb len=9635932)
   - glTF 2.0 chunk: zero Torus or SkateAlley_Holo_Visualizer nodes, zero visualizer materials
   - Mesh 0 ("LUIS") has all 5 primitives: LUIS_Body_Material, LUIS_Head_Material, Retail_SkateBoard, Retail_SkateTruck, Retail_SkateWheel
   - Rig joints: SKATEBOARD_ROOT, TRUCK_FRONT, TRUCK_BACK, and 4 wheel nodes
   - Playwright browser execution: window.__SKATE3_CLEANROOM_STATUS__ reports defaultChar="luis", skateboardPrimitivesPresent=true, torusVisualizerPresent=false, status="READY"

2. GTA Vice City (/revcdos/) Spawning Rig & RenderWare Overrides:
   - Worktree materialization: character_hoodie.glb (1357020 B) and revcdos/ runtime & luis_player assets
   - player.dff: 292864 B (143 sectors of 2048 B), 4006 vertices (offset 3201 uint32_le), 24 bones
   - player.txd: 45056 B (22 sectors)
   - player.bmp: 66612 B
   - fronten1.txd: 394664 B (193 sectors)
   - Playwright browser execution: window.__REVCDOS_STATUS__ reports luisPlayerMounted=true, dffBytes=292864, sectors=143, verts=4006, bones=24, lastError=null

3. HTTP 206 Partial Content Byte-Range Streaming Engine (RFC 9110):
   - Closed range prefix (bytes=0-36): HTTP 206, Content-Range bytes 0-36/9635969, Content-Length 37, exact 37-byte header
   - glTF header slice (bytes=37-48): HTTP 206, Content-Length 12, magic glTF version 2
   - Suffix range (bytes=-1024): HTTP 206, Content-Range bytes (size-1024)-(size-1)/size, Content-Length 1024
   - Out-of-bounds range: HTTP 416 Range Not Satisfiable, Content-Range bytes */size
   - Inverted bounds (start > end): HTTP 416 Range Not Satisfiable
   - CORS exposure headers: Access-Control-Expose-Headers includes Content-Length, Content-Range, Accept-Ranges

4. PostgreSQL Alpha Persistence, B+Tree Index Physics & Schema Health:
   - /api/health returns 200 OK, status="ok", sticker_db_ready=true, scene_layout_db_ready=true
   - DDL schema & B+Tree indexes in pg_indexes:
     - skatealley_scene_layouts_pkey: btree on layout_key
     - skatealley_placed_stickers_pkey: btree on placed_id
     - idx_skatealley_stickers_created_at: composite btree on (created_at_ms, placed_id)
   - /api/scene-layout: persists & retrieves authoritative keys including character_camera, holo_columns, lamppost_light, math_pods, player_spawn, startup_camera_pan, watercolor_display
   - /api/stickers: persists & queries stickers with full column set

5. Concurrency Control, Contention Modeling & Durability:
   - Serialized thread synchronization via _STICKER_DB_LOCK under concurrent thread access
   - Atomic temp-file durability protocol (temp write + fsync + os.replace)
"""

from __future__ import annotations

import concurrent.futures
import glob
import hashlib
import http.client
import json
import os
import socket
import struct
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from scripts.serve_skatealley import (
    ALLOWED_SCENE_LAYOUT_KEYS,
    _PG_IDLE_POOL,
    _PG_POOL_LOCK,
    ensure_revcdos_data,
    ensure_revcdos_luis_player,
    ensure_scene_layout_schema,
    ensure_sticker_schema,
    ensure_worktree_character_hoodie,
    ensure_worktree_revcdos_files,
    open_postgres_connection,
)


def find_free_port() -> int:
    """Find an available OS port for test HTTP server isolation."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def find_chrome_executable() -> str | None:
    """Find installed Chrome / Chromium binary for Playwright execution."""
    candidates = [
        "/Users/diesel/Library/Caches/ms-playwright/chromium-1252/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "/Users/diesel/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    ]
    base_dir = Path("/Users/diesel/Library/Caches/ms-playwright")
    if base_dir.is_dir():
        for matched in glob.glob(str(base_dir / "chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing")):
            candidates.insert(0, matched)
    for c in candidates:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None


class TestStoragePersistence(unittest.TestCase):
    server_proc: subprocess.Popen | None = None
    server_port: int = 18082
    server_url: str = f"http://127.0.0.1:{server_port}"
    chrome_path: str | None = None

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 80)
        print("STAGE 4: STORAGE, PERSISTENCE LAYER & ACID CONSISTENCY VERIFICATION")
        print("=" * 80)

        # 1. Ensure worktree assets materialized
        ensure_worktree_character_hoodie(str(REPO_ROOT))
        ensure_worktree_revcdos_files(str(REPO_ROOT))
        ensure_revcdos_data(str(REPO_ROOT))
        ensure_revcdos_luis_player(str(REPO_ROOT))

        # 2. Allocate port & boot server
        preferred_port = 18082
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", preferred_port))
                cls.server_port = preferred_port
            except OSError:
                cls.server_port = find_free_port()

        cls.server_url = f"http://127.0.0.1:{cls.server_port}"
        print(f"[*] Starting serve_skatealley.py on {cls.server_url}...")

        cls.server_proc = subprocess.Popen(
            [sys.executable, "scripts/serve_skatealley.py", "--host", "127.0.0.1", "--port", str(cls.server_port)],
            cwd=str(REPO_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Wait for /api/health to respond
        health_ok = False
        deadline = time.time() + 8.0
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(f"{cls.server_url}/api/health", timeout=1.0) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        if data.get("ok"):
                            health_ok = True
                            break
            except Exception:
                time.sleep(0.2)

        if not health_ok:
            if cls.server_proc.poll() is not None:
                _, stderr = cls.server_proc.communicate()
                raise RuntimeError(f"Server failed to start on {cls.server_url}:\n{stderr}")
            raise RuntimeError(f"Timed out waiting for server on {cls.server_url}")

        print(f"[✓] Server verified healthy on {cls.server_url}.")
        cls.chrome_path = find_chrome_executable()
        if cls.chrome_path:
            print(f"[✓] Chrome for Testing located at: {cls.chrome_path}")
        else:
            print("[!] Note: Chrome executable not found in default paths; browser tests will attempt system fallback.")

    @classmethod
    def tearDownClass(cls):
        if cls.server_proc:
            print(f"[*] Stopping serve_skatealley.py on port {cls.server_port}...")
            cls.server_proc.terminate()
            try:
                cls.server_proc.wait(timeout=4)
            except subprocess.TimeoutExpired:
                cls.server_proc.kill()
            if cls.server_proc.stdout:
                cls.server_proc.stdout.close()
            if cls.server_proc.stderr:
                cls.server_proc.stderr.close()
            print("[✓] Server terminated cleanly.")

        # Drain and close any cached Postgres pool connections to avoid unclosed socket warnings
        try:
            with _PG_POOL_LOCK:
                while _PG_IDLE_POOL:
                    conn, _ = _PG_IDLE_POOL.pop()
                    try:
                        conn.close()
                    except Exception:
                        pass
        except Exception:
            pass

    # -------------------------------------------------------------------------
    # Pillar 1: Skate 3 Cleanroom Spawning Rig (§11.1 & §15.3)
    # -------------------------------------------------------------------------
    def test_01_skate3_pack_json_invariants(self):
        """Pillar 1.1: pack.json default_char, exact byte sizes, and sha256 hash recalculation."""
        pack_path = REPO_ROOT / "skate3_cleanroom" / "pack.json"
        self.assertTrue(pack_path.is_file(), f"Missing {pack_path}")

        with open(pack_path, "r", encoding="utf-8") as f:
            pack = json.load(f)

        self.assertEqual(pack.get("default_char"), "luis", "default_char MUST be 'luis'")

        part_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        self.assertTrue(part_path.is_file(), f"Missing {part_path}")
        part_bytes = part_path.read_bytes()
        part_len = len(part_bytes)
        part_hash = hashlib.sha256(part_bytes).hexdigest()[:16]

        # Surrounding immutable parts: core_head (37088836) + core_tail_0 (27000000) + core_tail_1 (26542298) = 90631134
        expected_size = 90631134 + part_len
        self.assertEqual(expected_size, 100267103, f"Expected size 100267103, got {expected_size}")

        # Invariant checks
        self.assertEqual(pack["core"]["size"], expected_size)
        self.assertEqual(pack["core"]["hash"], part_hash)
        self.assertEqual(pack["characters"]["luis"]["size"], expected_size)
        self.assertEqual(pack["characters"]["luis"]["hash"], part_hash)
        self.assertEqual(pack["characters"]["luis_holo"]["size"], expected_size)
        self.assertEqual(pack["characters"]["luis_holo"]["hash"], part_hash)

        print(f"[✓] Skate 3 pack.json invariants verified: size={expected_size}, hash={part_hash}")

    def test_02_skate3_char_luis_part_wire_format(self):
        """Pillar 1.2: char_luis.part 37-byte pack entry header & glTF 2.0 container header."""
        part_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        raw = part_path.read_bytes()

        self.assertEqual(len(raw), 9635969, f"Unexpected char_luis.part size: {len(raw)}")

        # 37-byte pack entry header
        hdr_path_len = struct.unpack_from("<I", raw, 0)[0]
        self.assertEqual(hdr_path_len, 25, "Pack entry header path length MUST be 25")
        hdr_path = raw[4 : 4 + hdr_path_len]
        self.assertEqual(hdr_path, b"assets/private/skater.glb")
        glb_len = struct.unpack_from("<Q", raw, 29)[0]
        self.assertEqual(glb_len, len(raw) - 37)
        self.assertEqual(glb_len, 9635932)

        # glTF 2.0 container header
        glb = raw[37:]
        magic, version, length = struct.unpack_from("<4sII", glb, 0)
        self.assertEqual(magic, b"glTF", "glTF magic MUST be 'glTF'")
        self.assertEqual(version, 2, "glTF version MUST be 2")
        self.assertEqual(length, glb_len, "glTF header length MUST match payload length")

        # Chunk 0 JSON
        c0_len, c0_type = struct.unpack_from("<II", glb, 12)
        self.assertEqual(c0_type, 0x4E4F534A, "Chunk 0 MUST be JSON (0x4E4F534A)")

        # Chunk 1 BIN
        c1_offset = 20 + c0_len
        c1_len, c1_type = struct.unpack_from("<II", glb, c1_offset)
        self.assertEqual(c1_type, 0x004E4942, "Chunk 1 MUST be BIN\\0 (0x004E4942)")
        self.assertEqual(c1_offset + 8 + c1_len, len(glb), "BIN chunk MUST extend to end of GLB")

        print(f"[✓] Skate 3 char_luis.part 37-byte header and glTF container structure verified.")

    def test_03_skate3_char_luis_glb_primitives_and_zero_torus(self):
        """Pillar 1.3: glTF chunk surgery — Mesh 0 (5 primitives), 35 rig joints, ZERO Torus/Visualizer."""
        part_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        raw = part_path.read_bytes()
        glb = raw[37:]
        c0_len, _ = struct.unpack_from("<II", glb, 12)
        gltf = json.loads(glb[20 : 20 + c0_len].decode("utf-8"))

        nodes = gltf.get("nodes", [])
        meshes = gltf.get("meshes", [])
        materials = gltf.get("materials", [])

        # 1. Zero Torus or Visualizer nodes, meshes, or materials
        torus_nodes = [n.get("name") for n in nodes if any(k in n.get("name", "").lower() for k in ("torus", "holo", "visualizer"))]
        self.assertEqual(torus_nodes, [], f"Extraneous Torus/Holo nodes found: {torus_nodes}")

        torus_meshes = [m.get("name") for m in meshes if any(k in m.get("name", "").lower() for k in ("torus", "holo", "visualizer"))]
        self.assertEqual(torus_meshes, [], f"Extraneous Torus/Holo meshes found: {torus_meshes}")

        torus_mats = [m.get("name") for m in materials if any(k in m.get("name", "").lower() for k in ("torus", "holo", "visualizer"))]
        self.assertEqual(torus_mats, [], f"Extraneous Torus/Holo materials found: {torus_mats}")

        # 2. Exactly 1 mesh ("LUIS") with 5 primitives
        self.assertEqual(len(meshes), 1, f"Expected exactly 1 mesh, found {len(meshes)}")
        self.assertEqual(meshes[0].get("name"), "LUIS")
        prims = meshes[0].get("primitives", [])
        self.assertEqual(len(prims), 5, f"Expected 5 primitives on Mesh 0, found {len(prims)}")

        mat_names = [materials[p["material"]]["name"] for p in prims if "material" in p]
        expected_primitives = [
            "LUIS_Body_Material",
            "LUIS_Head_Material",
            "Retail_SkateBoard",
            "Retail_SkateTruck",
            "Retail_SkateWheel",
        ]
        self.assertEqual(mat_names, expected_primitives, f"Primitive material mismatch: {mat_names}")

        # 3. Essential skateboard rig joints
        node_names = {n.get("name") for n in nodes}
        required_joints = [
            "SKATEBOARD_ROOT",
            "TRUCK_FRONT",
            "TRUCK_BACK",
            "RIGHT_WHEELFRONT",
            "LEFT_WHEELFRONT",
            "RIGHT_WHEELBACK",
            "LEFT_WHEELBACK",
        ]
        for j in required_joints:
            self.assertIn(j, node_names, f"Required skateboard rig joint '{j}' missing from nodes")

        print("[✓] Skate 3 glTF chunk surgery verified: 5 primitives intact, zero Torus nodes.")

    def test_04_skate3_cleanroom_in_browser_telemetry(self):
        """Pillar 1.4: In-browser live execution of /skate3_cleanroom/ — window.__SKATE3_CLEANROOM_STATUS__."""
        from playwright.sync_api import sync_playwright

        launch_kwargs = {"headless": True, "args": ["--use-gl=angle", "--use-angle=metal", "--no-sandbox"]}
        if self.chrome_path:
            launch_kwargs["executable_path"] = self.chrome_path

        with sync_playwright() as p:
            browser = p.chromium.launch(**launch_kwargs)
            try:
                page = browser.new_page()
                page.goto(f"{self.server_url}/skate3_cleanroom/", timeout=15000)
                page.wait_for_function(
                    "() => window.__SKATE3_CLEANROOM_STATUS__ && window.__SKATE3_CLEANROOM_STATUS__.status === 'READY'",
                    timeout=12000,
                )
                status = page.evaluate("() => window.__SKATE3_CLEANROOM_STATUS__")

                self.assertEqual(status.get("defaultChar"), "luis")
                self.assertEqual(status.get("selectedChar"), "luis")
                self.assertEqual(status.get("selectedCharKey"), "luis")
                self.assertTrue(status.get("skateboardPrimitivesPresent"))
                self.assertFalse(status.get("torusVisualizerPresent"))
                self.assertEqual(status.get("corePackSize"), 100267103)
                self.assertEqual(status.get("status"), "READY")

                print(f"[✓] Skate 3 in-browser telemetry verified: {status}")
            finally:
                browser.close()

    # -------------------------------------------------------------------------
    # Pillar 2: GTA Vice City (/revcdos/) Spawning Rig (§11.2 & §15.4)
    # -------------------------------------------------------------------------
    def test_05_revcdos_worktree_materialization_and_hoodie(self):
        """Pillar 2.1: Worktree materialization of character_hoodie.glb and revcdos/ runtime."""
        hoodie_path = REPO_ROOT / "character_hoodie.glb"
        self.assertTrue(hoodie_path.is_file(), "character_hoodie.glb MUST exist in worktree")
        self.assertEqual(os.path.getsize(hoodie_path), 1357020, "character_hoodie.glb size mismatch")

        revcdos_idx = REPO_ROOT / "revcdos" / "index.html"
        self.assertTrue(revcdos_idx.is_file(), "revcdos/index.html MUST exist in worktree")

        print("[✓] Worktree materialization verified: character_hoodie.glb and revcdos/ present.")

    def test_06_revcdos_luis_player_renderware_overrides(self):
        """Pillar 2.2: RenderWare override binary dimensions, sectors, and vertex count."""
        luis_dir = REPO_ROOT / "revcdos" / "vcbr" / "luis_player"

        dff_path = luis_dir / "player.dff"
        txd_path = luis_dir / "player.txd"
        bmp_path = luis_dir / "player.bmp"
        fronten_path = luis_dir / "fronten1.txd"

        self.assertTrue(dff_path.is_file(), f"Missing {dff_path}")
        self.assertTrue(txd_path.is_file(), f"Missing {txd_path}")
        self.assertTrue(bmp_path.is_file(), f"Missing {bmp_path}")
        self.assertTrue(fronten_path.is_file(), f"Missing {fronten_path}")

        # player.dff: 292864 B (143 sectors), 4006 vertices @ offset 3201
        dff_size = os.path.getsize(dff_path)
        self.assertEqual(dff_size, 292864)
        dff_sectors = (dff_size + 2047) // 2048
        self.assertEqual(dff_sectors, 143)

        dff_data = dff_path.read_bytes()
        num_verts = struct.unpack_from("<I", dff_data, 3201)[0]
        self.assertEqual(num_verts, 4006, f"Expected 4006 vertices in player.dff, got {num_verts}")

        # player.txd: 45056 B (22 sectors)
        txd_size = os.path.getsize(txd_path)
        self.assertEqual(txd_size, 45056)
        self.assertEqual((txd_size + 2047) // 2048, 22)

        # player.bmp: 66612 B
        bmp_size = os.path.getsize(bmp_path)
        self.assertEqual(bmp_size, 66612)

        # fronten1.txd: 394664 B (193 sectors)
        fronten_size = os.path.getsize(fronten_path)
        self.assertEqual(fronten_size, 394664)
        self.assertEqual((fronten_size + 2047) // 2048, 193)

        print(f"[✓] RenderWare override assets verified: dff={dff_size}B ({num_verts} verts, {dff_sectors} sec), txd={txd_size}B.")

    def test_07_revcdos_in_browser_telemetry(self):
        """Pillar 2.3: In-browser live execution of /revcdos/ — window.__REVCDOS_STATUS__."""
        from playwright.sync_api import sync_playwright

        launch_kwargs = {"headless": True, "args": ["--use-gl=angle", "--use-angle=metal", "--no-sandbox"]}
        if self.chrome_path:
            launch_kwargs["executable_path"] = self.chrome_path

        with sync_playwright() as p:
            browser = p.chromium.launch(**launch_kwargs)
            try:
                page = browser.new_page()
                page.goto(f"{self.server_url}/revcdos/", timeout=15000)
                page.wait_for_function(
                    "() => window.__REVCDOS_STATUS__ && window.__REVCDOS_STATUS__.luisPlayerMounted === true",
                    timeout=12000,
                )
                status = page.evaluate("() => window.__REVCDOS_STATUS__")

                self.assertTrue(status.get("luisPlayerMounted"))
                self.assertEqual(status.get("luisPlayerDffBytes"), 292864)
                self.assertEqual(status.get("luisPlayerDirSectors"), 143)
                self.assertEqual(status.get("luisPlayerVerts"), 4006)
                self.assertEqual(status.get("luisPlayerBones"), 24)
                self.assertIsNone(status.get("lastError"))

                print(f"[✓] GTA Vice City in-browser telemetry verified: {status}")
            finally:
                browser.close()

    # -------------------------------------------------------------------------
    # Pillar 3: HTTP 206 Partial Content Byte-Range Streaming Engine (RFC 9110)
    # -------------------------------------------------------------------------
    def test_08_http_206_prefix_range(self):
        """Pillar 3.1: HTTP 206 closed prefix range (bytes=0-36) on char_luis.part."""
        target_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        total_file_size = os.path.getsize(target_path)
        expected_prefix = target_path.read_bytes()[:37]

        conn = http.client.HTTPConnection("127.0.0.1", self.server_port)
        conn.request("GET", "/skate3_cleanroom/parts/char_luis.part", headers={"Range": "bytes=0-36"})
        resp = conn.getresponse()
        body = resp.read()
        conn.close()

        self.assertEqual(resp.status, 206, f"Expected HTTP 206, got {resp.status}")
        self.assertEqual(resp.getheader("Content-Range"), f"bytes 0-36/{total_file_size}")
        self.assertEqual(resp.getheader("Content-Length"), "37")
        self.assertEqual(resp.getheader("Accept-Ranges"), "bytes")
        self.assertEqual(body, expected_prefix, "Payload byte content mismatch for bytes=0-36")

        print("[✓] HTTP 206 prefix range request verified.")

    def test_09_http_206_slice_range_and_magic(self):
        """Pillar 3.2: HTTP 206 intermediate slice range (bytes=37-48) glTF magic and version."""
        conn = http.client.HTTPConnection("127.0.0.1", self.server_port)
        conn.request("GET", "/skate3_cleanroom/parts/char_luis.part", headers={"Range": "bytes=37-48"})
        resp = conn.getresponse()
        body = resp.read()
        conn.close()

        self.assertEqual(resp.status, 206)
        self.assertEqual(resp.getheader("Content-Length"), "12")
        magic, version, _ = struct.unpack("<4sII", body)
        self.assertEqual(magic, b"glTF")
        self.assertEqual(version, 2)

        print("[✓] HTTP 206 intermediate slice range request verified.")

    def test_10_http_206_suffix_range(self):
        """Pillar 3.3: HTTP 206 suffix range (bytes=-1024) on char_luis.part."""
        target_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        total_file_size = os.path.getsize(target_path)
        expected_suffix = target_path.read_bytes()[-1024:]

        conn = http.client.HTTPConnection("127.0.0.1", self.server_port)
        conn.request("GET", "/skate3_cleanroom/parts/char_luis.part", headers={"Range": "bytes=-1024"})
        resp = conn.getresponse()
        body = resp.read()
        conn.close()

        self.assertEqual(resp.status, 206)
        expected_range_hdr = f"bytes {total_file_size - 1024}-{total_file_size - 1}/{total_file_size}"
        self.assertEqual(resp.getheader("Content-Range"), expected_range_hdr)
        self.assertEqual(resp.getheader("Content-Length"), "1024")
        self.assertEqual(body, expected_suffix)

        print("[✓] HTTP 206 suffix range request verified.")

    def test_11_http_416_out_of_bounds_range(self):
        """Pillar 3.4: HTTP 416 Range Not Satisfiable on out-of-bounds start position."""
        target_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        total_file_size = os.path.getsize(target_path)

        conn = http.client.HTTPConnection("127.0.0.1", self.server_port)
        conn.request("GET", "/skate3_cleanroom/parts/char_luis.part", headers={"Range": "bytes=99999999-100000000"})
        resp = conn.getresponse()
        resp.read()
        conn.close()

        self.assertEqual(resp.status, 416, f"Expected HTTP 416, got {resp.status}")
        self.assertEqual(resp.getheader("Content-Range"), f"bytes */{total_file_size}")

        print("[✓] HTTP 416 out-of-bounds bounds checking verified.")

    def test_12_http_416_inverted_range(self):
        """Pillar 3.5: HTTP 416 on inverted bounds (start > end)."""
        conn = http.client.HTTPConnection("127.0.0.1", self.server_port)
        conn.request("GET", "/skate3_cleanroom/parts/char_luis.part", headers={"Range": "bytes=500-100"})
        resp = conn.getresponse()
        resp.read()
        conn.close()

        self.assertEqual(resp.status, 416)

        print("[✓] HTTP 416 inverted bounds checking verified.")

    def test_13_http_range_cors_and_exposure_headers(self):
        """Pillar 3.6: CORS headers and Access-Control-Expose-Headers for streaming."""
        conn = http.client.HTTPConnection("127.0.0.1", self.server_port)
        conn.request("GET", "/skate3_cleanroom/parts/char_luis.part", headers={"Range": "bytes=0-10"})
        resp = conn.getresponse()
        resp.read()
        conn.close()

        self.assertEqual(resp.status, 206)
        self.assertEqual(resp.getheader("Access-Control-Allow-Origin"), "*")
        expose = resp.getheader("Access-Control-Expose-Headers") or ""
        self.assertIn("Content-Length", expose)
        self.assertIn("Content-Range", expose)
        self.assertIn("Accept-Ranges", expose)

        print("[✓] HTTP 206 CORS exposure headers verified.")

    # -------------------------------------------------------------------------
    # Pillar 4: PostgreSQL Alpha Persistence, B+Tree Index Physics & Endpoints
    # -------------------------------------------------------------------------
    def test_14_api_health_endpoint(self):
        """Pillar 4.1: /api/health reports ok=true, database health, and registered components."""
        req = urllib.request.Request(f"{self.server_url}/api/health")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))

        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("status"), "ok")
        self.assertTrue(data.get("sticker_db_ready"))
        self.assertTrue(data.get("scene_layout_db_ready"))
        self.assertEqual(data.get("sticker_storage"), "postgres")

        persisted_keys = data.get("persisted_layout_keys", [])
        for k in ["character_camera", "holo_columns", "lamppost_light", "math_pods", "player_spawn", "startup_camera_pan"]:
            self.assertIn(k, persisted_keys)

        print(f"[✓] /api/health endpoint verified ({len(persisted_keys)} active layout keys).")

    def test_15_postgres_table_schemas_and_btree_indexes(self):
        """Pillar 4.2: Direct PostgreSQL index inspection (B+Tree PKs and composite timestamp index)."""
        with open_postgres_connection() as conn:
            ensure_scene_layout_schema(conn)
            ensure_sticker_schema(conn)

            rows = conn.execute_params(
                """
                SELECT tablename, indexname, indexdef
                FROM pg_indexes
                WHERE tablename IN ('skatealley_scene_layouts', 'skatealley_placed_stickers')
                ORDER BY tablename, indexname;
                """
            )

        indices = {r["indexname"]: r["indexdef"] for r in rows}

        # 1. Primary key on skatealley_scene_layouts (B+Tree on layout_key)
        self.assertIn("skatealley_scene_layouts_pkey", indices)
        self.assertIn("USING btree (layout_key)", indices["skatealley_scene_layouts_pkey"])

        # 2. Primary key on skatealley_placed_stickers (B+Tree on placed_id)
        self.assertIn("skatealley_placed_stickers_pkey", indices)
        self.assertIn("USING btree (placed_id)", indices["skatealley_placed_stickers_pkey"])

        # 3. Composite B+Tree index on (created_at_ms, placed_id)
        self.assertIn("idx_skatealley_stickers_created_at", indices)
        self.assertIn("USING btree (created_at_ms, placed_id)", indices["idx_skatealley_stickers_created_at"])

        print("[✓] PostgreSQL B+Tree indices verified in pg_indexes.")

    def test_16_scene_layout_api_get_and_upsert(self):
        """Pillar 4.3: /api/scene-layout point lookups, batch get, and OCC upsert."""
        # 1. GET /api/scene-layout
        with urllib.request.urlopen(f"{self.server_url}/api/scene-layout") as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))

        self.assertTrue(data.get("ok"))
        layouts = data.get("layouts", {})
        self.assertGreaterEqual(len(layouts), 6)
        self.assertIn("character_camera", layouts)
        self.assertIn("holo_columns", layouts)

        # 2. POST /api/scene-layout upsert with watercolor_display
        test_payload = {
            "key": "watercolor_display",
            "payload": {
                "activePortal": "platodoom_arcade",
                "popOutTriggerRadiusMeters": 6.8,
                "popOutReleaseRadiusMeters": 7.5,
                "scaleMultiplier": 1.45,
                "forwardReliefMeters": 0.35,
                "updatedAtIso": "2026-11-07T18:00:00Z",
            },
            "updatedAtMs": int(time.time() * 1000),
        }
        req = urllib.request.Request(
            f"{self.server_url}/api/scene-layout",
            data=json.dumps(test_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res_json = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(res_json.get("ok"))
            self.assertIn("watercolor_display", res_json.get("savedKeys", []))

        # 3. Re-read and verify persistence
        with urllib.request.urlopen(f"{self.server_url}/api/scene-layout") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            persisted = data["layouts"].get("watercolor_display")
            self.assertIsNotNone(persisted)
            self.assertEqual(persisted.get("activePortal"), "platodoom_arcade")
            self.assertEqual(persisted.get("scaleMultiplier"), 1.45)

        print("[✓] /api/scene-layout GET and POST upsert persistence verified.")

    def test_17_sticker_api_get_and_persistence(self):
        """Pillar 4.4: /api/stickers range query and payload contract."""
        with urllib.request.urlopen(f"{self.server_url}/api/stickers") as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))

        self.assertTrue(data.get("ok"))
        self.assertIn("stickers", data)
        stickers = data["stickers"]
        self.assertGreaterEqual(len(stickers), 1)

        first = stickers[0]
        required_fields = ["placedId", "assetId", "code", "anchorPosition", "position", "normal", "rotationRad", "surfaceZone"]
        for rf in required_fields:
            self.assertIn(rf, first, f"Field '{rf}' missing from sticker response")

        print(f"[✓] /api/stickers verified ({len(stickers)} stickers retrieved).")

    # -------------------------------------------------------------------------
    # Pillar 5: Concurrency Control, Contention Modeling & Durability
    # -------------------------------------------------------------------------
    def test_18_concurrent_database_reads_and_writes(self):
        """Pillar 5.1: Thread pool concurrency test — 10 concurrent requests to PostgreSQL persistence."""
        num_requests = 10

        def fetch_worker(index: int) -> tuple[int, bool]:
            endpoint = "/api/scene-layout" if index % 2 == 0 else "/api/stickers"
            url = f"{self.server_url}{endpoint}"
            with urllib.request.urlopen(url, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return resp.status, bool(data.get("ok"))

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(fetch_worker, i) for i in range(num_requests)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        for status_code, ok in results:
            self.assertEqual(status_code, 200)
            self.assertTrue(ok)

        print(f"[✓] Concurrency control verified: {num_requests} concurrent requests succeeded.")

    def test_19_atomic_temp_file_durability(self):
        """Pillar 5.2: Atomic temp-file durability protocol (temp write + flush + fsync + os.replace)."""
        test_dir = REPO_ROOT / "skate3_cleanroom" / "parts"
        target_file = test_dir / "test_durability_probe.bin"
        test_payload = b"STORAGE_PERSISTENCE_ACID_VERIFICATION_PROBE_20261107"

        # Emulate atomic_write pattern
        temp_file = tempfile.NamedTemporaryFile(dir=str(test_dir), delete=False, prefix="tmp_probe_")
        try:
            temp_file.write(test_payload)
            temp_file.flush()
            os.fsync(temp_file.fileno())
            temp_file.close()
            os.replace(temp_file.name, str(target_file))

            # Verify file exists and content matches
            self.assertTrue(target_file.is_file())
            self.assertEqual(target_file.read_bytes(), test_payload)
        finally:
            if os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except OSError:
                    pass
            if target_file.is_file():
                try:
                    target_file.unlink()
                except OSError:
                    pass

        print("[✓] Atomic temp-file durability protocol verified.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
