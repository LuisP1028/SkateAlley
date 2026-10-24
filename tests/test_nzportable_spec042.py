#!/usr/bin/env python3
"""
Automated End-to-End Integration & Behavioral Verification Suite for Functional Specification 042:
Standalone Playable WebAssembly/WebGL Web Application for Nazi Zombies: Portable (/nzportable/).

Compatible with both `pytest` and `python3 -m unittest`.
"""
import hashlib
import http.client
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import zipfile
from html.parser import HTMLParser

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import serve_skatealley  # noqa: E402


EXPECTED_ARTIFACTS = {
    "nzportable/default.fmf": {
        "size": 96,
        "sha256": "d3e89c92ff2b43b83e4a461a79b7986e3fd7ca3126ec1842588a688c539b3979",
        "mime": "application/octet-stream",
    },
    "nzportable/ftewebgl.js": {
        "size": 165608,
        "sha256": "7ae5352b39e21c5dc83dd2c27d0f49f842ce89462402400775ccb055a2d9da46",
        "mime": "application/javascript",
    },
    "nzportable/ftewebgl.wasm": {
        "size": 5178106,
        "sha256": "523141c46f2898fe1f4bb175eca6035ff8aed981e8f770993f98d15d7a2199e2",
        "mime": "application/wasm",
    },
    "nzportable/nzp/progs.pk3": {
        "size": 491379,
        "sha256": "47bc82fa1335f5748ac08372c2daf24c57f29e56f046ad0fa125eec90c9bf832",
        "mime": "application/octet-stream",
    },
    "nzportable/nzp/game.pk3": {
        "size": 94276834,
        "sha256": "847a6fb7c95b26eab0fdbfa31223a225608a5f9f7af4f88af1e04a1c0a14637d",
        "mime": "application/octet-stream",
    },
}

EXPECTED_PARTS = [
    (
        "nzportable/parts/game.pk3.part00",
        31457280,
        "ebe0d7be4f9d8e8a9e37550145ed7b95695f834fe0b727d5b17b0ba7471cc1bf",
    ),
    (
        "nzportable/parts/game.pk3.part01",
        31457280,
        "e8358e64daaee2b3985b90f034a27138adcb7f84310bb2058143e2173df765c8",
    ),
    (
        "nzportable/parts/game.pk3.part02",
        31362274,
        "3375f8725e139fbed7ab3848451fc6f312979b1f8268304ea47894de6dc450d0",
    ),
]

MAX_PART_BYTES = 35 * 1024 * 1024  # 35 MiB (36,700,160 bytes)
MAX_GIT_TRACKED_BYTES = 45 * 1024 * 1024  # 45 MiB (47,185,920 bytes)


def compute_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(4 * 1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


class DOMInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements_by_id = {}
        self.scripts = []
        self.styles = []
        self._in_style = False

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        el_id = attr_dict.get("id")
        if el_id:
            self.elements_by_id[el_id] = {"tag": tag, "attrs": attr_dict}
        if tag == "script":
            self.scripts.append(attr_dict)
        if tag == "style":
            self._in_style = True

    def handle_endtag(self, tag):
        if tag == "style":
            self._in_style = False

    def handle_data(self, data):
        if self._in_style:
            self.styles.append(data)


class TestNZPortableSpec042(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_cwd = os.getcwd()
        os.chdir(REPO_ROOT)
        serve_skatealley.ensure_nzportable_game_pk3(REPO_ROOT)

        cls.httpd = serve_skatealley.ThreadingHTTPServer(
            ("127.0.0.1", 0), serve_skatealley.SkateAlleyRequestHandler
        )
        cls.port = cls.httpd.server_address[1]
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.server_thread.start()

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "httpd"):
            cls.httpd.shutdown()
            cls.httpd.server_close()
        os.chdir(cls.orig_cwd)

    # -------------------------------------------------------------------------
    # Group 1: Asset Acquisition, Byte Parity, SHA-256 & Multi-Part Chunking
    # -------------------------------------------------------------------------
    def test_01_runtime_artifacts_byte_size_and_sha256_parity(self):
        """AC-01: All 5 NZ:P runtime artifacts exist on disk with exact byte and SHA-256 parity."""
        for rel_path, spec in EXPECTED_ARTIFACTS.items():
            abs_path = os.path.join(REPO_ROOT, rel_path)
            self.assertTrue(os.path.isfile(abs_path), f"Missing required artifact: {rel_path}")
            actual_size = os.path.getsize(abs_path)
            self.assertEqual(
                actual_size,
                spec["size"],
                f"Byte size mismatch for {rel_path}: expected {spec['size']}, got {actual_size}",
            )
            actual_sha256 = compute_sha256(abs_path)
            self.assertEqual(
                actual_sha256,
                spec["sha256"],
                f"SHA-256 mismatch for {rel_path}: expected {spec['sha256']}, got {actual_sha256}",
            )

    def test_02_multipart_chunks_ceiling_and_reassembly_parity(self):
        """AC-01: parts/game.pk3.part00..02 are <= 35 MB each and reassemble exactly to game.pk3."""
        combined_hasher = hashlib.sha256()
        total_part_bytes = 0

        for rel_path, expected_size, expected_sha256 in EXPECTED_PARTS:
            abs_path = os.path.join(REPO_ROOT, rel_path)
            self.assertTrue(os.path.isfile(abs_path), f"Missing chunk file: {rel_path}")
            actual_size = os.path.getsize(abs_path)
            self.assertEqual(actual_size, expected_size, f"Chunk size mismatch for {rel_path}")
            self.assertLessEqual(
                actual_size,
                MAX_PART_BYTES,
                f"Chunk {rel_path} ({actual_size} B) exceeds 35 MiB ceiling ({MAX_PART_BYTES} B)",
            )
            part_hasher = hashlib.sha256()
            with open(abs_path, "rb") as f:
                while True:
                    buf = f.read(4 * 1024 * 1024)
                    if not buf:
                        break
                    part_hasher.update(buf)
                    combined_hasher.update(buf)
            self.assertEqual(
                part_hasher.hexdigest(),
                expected_sha256,
                f"SHA-256 mismatch for chunk {rel_path}",
            )
            total_part_bytes += actual_size

        self.assertEqual(total_part_bytes, EXPECTED_ARTIFACTS["nzportable/nzp/game.pk3"]["size"])
        self.assertEqual(
            combined_hasher.hexdigest(),
            EXPECTED_ARTIFACTS["nzportable/nzp/game.pk3"]["sha256"],
            "Reassembled .part00..02 SHA-256 does not match nzp/game.pk3",
        )

    def test_03_pack_json_schema_and_digest_contract(self):
        """AC-01 & §5.1: /nzportable/pack.json schema matches exact artifact sizes, hashes, and parts."""
        pack_path = os.path.join(REPO_ROOT, "nzportable", "pack.json")
        self.assertTrue(os.path.isfile(pack_path))
        with open(pack_path, "r", encoding="utf-8") as f:
            pack = json.load(f)

        self.assertEqual(pack.get("version"), 1)
        self.assertEqual(pack.get("cacheName"), "nzportable-pack-v1")

        engine = pack.get("engine", {})
        self.assertEqual(engine.get("js"), "./ftewebgl.js")
        self.assertEqual(engine.get("jsSize"), 165608)
        self.assertEqual(engine.get("jsSha256"), EXPECTED_ARTIFACTS["nzportable/ftewebgl.js"]["sha256"])
        self.assertEqual(engine.get("wasm"), "./ftewebgl.wasm")
        self.assertEqual(engine.get("size"), 5178106)
        self.assertEqual(engine.get("sha256"), EXPECTED_ARTIFACTS["nzportable/ftewebgl.wasm"]["sha256"])
        self.assertEqual(engine.get("hash"), EXPECTED_ARTIFACTS["nzportable/ftewebgl.wasm"]["sha256"][:16])

        files = pack.get("files", {})
        for vfs_key, disk_rel in (
            ("default.fmf", "nzportable/default.fmf"),
            ("nzp/progs.pk3", "nzportable/nzp/progs.pk3"),
            ("nzp/game.pk3", "nzportable/nzp/game.pk3"),
        ):
            self.assertIn(vfs_key, files)
            entry = files[vfs_key]
            expected = EXPECTED_ARTIFACTS[disk_rel]
            self.assertEqual(entry.get("path"), vfs_key)
            self.assertEqual(entry.get("url"), f"./{vfs_key}")
            self.assertEqual(entry.get("size"), expected["size"])
            self.assertEqual(entry.get("sha256"), expected["sha256"])
            self.assertEqual(entry.get("hash"), expected["sha256"][:16])

        game_entry = files["nzp/game.pk3"]
        self.assertEqual(
            game_entry.get("parts"),
            [
                "./parts/game.pk3.part00",
                "./parts/game.pk3.part01",
                "./parts/game.pk3.part02",
            ],
        )
        self.assertEqual(game_entry.get("partSizes"), [31457280, 31457280, 31362274])

    def test_04_default_fmf_manifest_directives(self):
        """§3.2: default.fmf (96 B) configures FTEQW with exact NZ:P directives."""
        fmf_path = os.path.join(REPO_ROOT, "nzportable", "default.fmf")
        with open(fmf_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("game nzp", content)
        self.assertIn('name "Nazi Zombies Portable"', content)
        self.assertIn("basegame nzp", content)
        self.assertIn('mainconfig "nzportable.cfg"', content)
        self.assertIn("disablehomedir 1", content)

    def test_05_pk3_zip_archive_structural_integrity(self):
        """§3.1: Verify progs.pk3 and game.pk3 are valid PK3 (ZIP) archives containing QuakeC & maps."""
        progs_path = os.path.join(REPO_ROOT, "nzportable", "nzp", "progs.pk3")
        with zipfile.ZipFile(progs_path, "r") as zf:
            self.assertIsNone(zf.testzip(), "progs.pk3 contains corrupted ZIP entries")
            names = set(zf.namelist())
            self.assertTrue(
                any(n.endswith("progs.dat") or n.endswith("csprogs.dat") for n in names),
                f"Expected QuakeC .dat bytecode in progs.pk3, found: {sorted(names)[:10]}",
            )

        game_path = os.path.join(REPO_ROOT, "nzportable", "nzp", "game.pk3")
        with zipfile.ZipFile(game_path, "r") as zf:
            names = zf.namelist()
            self.assertGreater(len(names), 100, "Expected full NZ:P game assets inside game.pk3")
            bsp_maps = [n for n in names if n.lower().endswith(".bsp")]
            self.assertTrue(
                any("ndu.bsp" in n.lower() for n in bsp_maps),
                f"Expected Nacht der Untoten (ndu.bsp) in game.pk3, found maps: {bsp_maps}",
            )

    # -------------------------------------------------------------------------
    # Group 2: Git Hygiene & .gitignore Protection
    # -------------------------------------------------------------------------
    def test_06_gitignore_excludes_raw_game_pk3(self):
        """AC-03: nzportable/nzp/game.pk3 is in .gitignore, ignored by git, and not tracked."""
        gitignore_path = os.path.join(REPO_ROOT, ".gitignore")
        with open(gitignore_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.read().splitlines()]
        self.assertIn("nzportable/nzp/game.pk3", lines)

        res = subprocess.run(
            ["git", "check-ignore", "-q", "nzportable/nzp/game.pk3"],
            cwd=REPO_ROOT,
            check=False,
        )
        self.assertEqual(res.returncode, 0, "git check-ignore failed for nzportable/nzp/game.pk3")

        tracked = subprocess.check_output(["git", "ls-files", "nzportable/"], cwd=REPO_ROOT, text=True).splitlines()
        self.assertNotIn("nzportable/nzp/game.pk3", tracked)
        for required_tracked in (
            "nzportable/default.fmf",
            "nzportable/ftewebgl.js",
            "nzportable/ftewebgl.wasm",
            "nzportable/index.html",
            "nzportable/loader.js",
            "nzportable/nzp/progs.pk3",
            "nzportable/pack.json",
            "nzportable/parts/game.pk3.part00",
            "nzportable/parts/game.pk3.part01",
            "nzportable/parts/game.pk3.part02",
        ):
            self.assertIn(required_tracked, tracked, f"Expected {required_tracked} to be tracked in git")

    def test_07_tracked_files_under_size_ceiling(self):
        """AC-03 & §7: Zero git-tracked files exceed 45 MB, and all tracked /nzportable/ files <= 35 MB."""
        tracked_files = subprocess.check_output(["git", "ls-files"], cwd=REPO_ROOT, text=True).splitlines()
        self.assertGreater(len(tracked_files), 0)
        for rel_path in tracked_files:
            abs_path = os.path.join(REPO_ROOT, rel_path)
            if not os.path.isfile(abs_path):
                continue
            size = os.path.getsize(abs_path)
            self.assertLessEqual(
                size,
                MAX_GIT_TRACKED_BYTES,
                f"Tracked file {rel_path} ({size} B) exceeds 45 MiB repository limit",
            )
            if rel_path.startswith("nzportable/"):
                self.assertLessEqual(
                    size,
                    MAX_PART_BYTES,
                    f"Tracked /nzportable/ file {rel_path} ({size} B) exceeds 35 MiB ceiling",
                )

    # -------------------------------------------------------------------------
    # Group 3: Architectural Isolation & Freeman Alley HUD Launcher Link
    # -------------------------------------------------------------------------
    def test_08_zero_threejs_porting_invariant(self):
        """§1 & §2: Zero parsing/porting of .pk3, .bsp, .mdl, or QuakeC .dat into Three.js sandbox.js."""
        sandbox_path = os.path.join(REPO_ROOT, "sandbox.js")
        with open(sandbox_path, "r", encoding="utf-8") as f:
            sandbox_src = f.read()
        self.assertNotIn("game.pk3", sandbox_src)
        self.assertNotIn("progs.pk3", sandbox_src)
        self.assertNotIn("ftewebgl", sandbox_src)
        self.assertNotIn("ndu.bsp", sandbox_src)

        for nzp_file in ("index.html", "loader.js"):
            p = os.path.join(REPO_ROOT, "nzportable", nzp_file)
            with open(p, "r", encoding="utf-8") as f:
                src = f.read()
            self.assertNotIn("from 'three'", src)
            self.assertNotIn('from "three"', src)
            self.assertNotIn("THREE.", src)

    def test_09_freeman_alley_hud_launcher_link(self):
        """§6.2 & ticket-004: Freeman Alley index.html includes launcher link to ./nzportable/."""
        alley_html_path = os.path.join(REPO_ROOT, "index.html")
        with open(alley_html_path, "r", encoding="utf-8") as f:
            alley_html = f.read()
        self.assertIn('id="hud-enter-nzportable-btn"', alley_html)
        self.assertIn('href="./nzportable/"', alley_html)
        self.assertIn("NZ: Portable (Zombies)", alley_html)

    # -------------------------------------------------------------------------
    # Group 4: Standalone /nzportable/index.html & /nzportable/loader.js Contracts
    # -------------------------------------------------------------------------
    def test_10_nzportable_index_html_dom_and_canvas_calibration(self):
        """§5.1 & ticket-002: Verify /nzportable/index.html DOM elements, CSS calibration, and no #dropzone."""
        html_path = os.path.join(REPO_ROOT, "nzportable", "index.html")
        with open(html_path, "r", encoding="utf-8") as f:
            raw_html = f.read()

        self.assertNotIn("dropzone", raw_html.lower())
        self.assertNotIn("showfiles(", raw_html)

        inspector = DOMInspector()
        inspector.feed(raw_html)

        for required_id in (
            "game",
            "canvas",
            "splash",
            "overlay",
            "panel",
            "overlay-title",
            "status",
            "progress",
            "mb-counter",
            "overlay-return-alley",
            "hudbar",
            "return-alley-btn",
            "fullscreen",
        ):
            self.assertIn(
                required_id,
                inspector.elements_by_id,
                f"Missing required DOM element #{required_id} in nzportable/index.html",
            )

        canvas_info = inspector.elements_by_id["canvas"]
        self.assertEqual(canvas_info["tag"], "canvas")
        self.assertEqual(canvas_info["attrs"].get("class"), "emscripten")
        self.assertEqual(canvas_info["attrs"].get("oncontextmenu"), "event.preventDefault()")
        self.assertEqual(canvas_info["attrs"].get("tabindex"), "0")

        return_link = inspector.elements_by_id["overlay-return-alley"]
        self.assertEqual(return_link["attrs"].get("href"), "../")

        return_btn = inspector.elements_by_id["return-alley-btn"]
        self.assertIn("window.location.assign('../')", return_btn["attrs"].get("onclick", ""))

        module_scripts = [
            s for s in inspector.scripts if s.get("type") == "module" and s.get("src") == "./loader.js"
        ]
        self.assertEqual(len(module_scripts), 1, "Expected <script type='module' src='./loader.js'>")

        combined_css = "\n".join(inspector.styles)
        self.assertIn("border: 0px none", combined_css)
        self.assertIn("width: 100%", combined_css)
        self.assertIn("height: 100%", combined_css)
        self.assertIn("padding: 0", combined_css)
        self.assertIn("margin: 0", combined_css)

        for required_text in (
            "Nazi Zombies: Portable",
            "FTEQW WebGL Clean-Room Build",
            "nzp-team",
            "WASD",
            "Mouse",
            "Reload",
            "Interact/Buy",
            "Sprint",
            "Crouch",
            "Esc",
            "Click or Press Any Key to Launch",
        ):
            self.assertIn(required_text, raw_html)

    def test_11_loader_js_contracts_and_telemetry_schema(self):
        """§5.2 & ticket-003: Verify loader.js implements AudioContext Proxy, CacheStorage, Module.files, and telemetry."""
        loader_path = os.path.join(REPO_ROOT, "nzportable", "loader.js")
        with open(loader_path, "r", encoding="utf-8") as f:
            loader_src = f.read()

        for telemetry_key in (
            "initialized:",
            "engineReady:",
            "gamePk3Bytes:",
            "progsPk3Bytes:",
            "fmfBytes:",
            "wasmLoaded:",
            "cacheHit:",
            "fps:",
            "errors:",
        ):
            self.assertIn(telemetry_key, loader_src)

        self.assertIn("nzportable-pack-v1", loader_src)
        self.assertIn("AudioContext", loader_src)
        self.assertIn("webkitAudioContext", loader_src)
        self.assertIn("new Proxy(", loader_src)
        self.assertIn("preserveDrawingBuffer: true", loader_src)
        self.assertIn("'default.fmf'", loader_src)
        self.assertIn("'nzp/progs.pk3'", loader_src)
        self.assertIn("'nzp/game.pk3'", loader_src)
        self.assertIn("Module.sched", loader_src)
        self.assertIn("mayregisterscemes: false", loader_src)
        self.assertIn("../tunnel.json", loader_src)
        self.assertIn("autostart", loader_src)
        self.assertIn("useparts", loader_src)

    # -------------------------------------------------------------------------
    # Group 5: Unified HTTP Server (scripts/serve_skatealley.py) Live Integration
    # -------------------------------------------------------------------------
    def test_12_mime_type_registrations(self):
        """§6.1 & ticket-004: Verify EXTRA_MIME_TYPES and CUSTOM_MIME_TYPES cover .wasm, .pk3, .fmf, .part00..99."""
        self.assertEqual(serve_skatealley.EXTRA_MIME_TYPES.get(".wasm"), "application/wasm")
        self.assertEqual(serve_skatealley.EXTRA_MIME_TYPES.get(".pk3"), "application/octet-stream")
        self.assertEqual(serve_skatealley.EXTRA_MIME_TYPES.get(".fmf"), "application/octet-stream")
        self.assertEqual(serve_skatealley.EXTRA_MIME_TYPES.get(".part"), "application/octet-stream")
        for i in range(100):
            ext = f".part{i:02d}"
            self.assertEqual(
                serve_skatealley.EXTRA_MIME_TYPES.get(ext),
                "application/octet-stream",
                f"Missing {ext} in EXTRA_MIME_TYPES",
            )
            self.assertEqual(
                serve_skatealley.CUSTOM_MIME_TYPES.get(ext),
                "application/octet-stream",
                f"Missing {ext} in CUSTOM_MIME_TYPES",
            )

    def test_13_live_http_get_head_options_and_cors(self):
        """§2 & §6.1: Live HTTP server serves all /nzportable/ routes with HTTP 200, CORS, and exact Content-Length."""
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        try:
            # OPTIONS preflight
            conn.request("OPTIONS", "/nzportable/ftewebgl.wasm")
            opt_resp = conn.getresponse()
            opt_resp.read()
            self.assertEqual(opt_resp.status, 204)
            self.assertEqual(opt_resp.getheader("Access-Control-Allow-Origin"), "*")
            self.assertIn("GET", opt_resp.getheader("Access-Control-Allow-Methods", ""))

            # HEAD & GET on key routes
            routes = [
                ("/nzportable/index.html", "text/html", os.path.getsize(os.path.join(REPO_ROOT, "nzportable/index.html"))),
                ("/nzportable/loader.js", "application/javascript", os.path.getsize(os.path.join(REPO_ROOT, "nzportable/loader.js"))),
                ("/nzportable/pack.json", "application/json", os.path.getsize(os.path.join(REPO_ROOT, "nzportable/pack.json"))),
                ("/nzportable/default.fmf", "application/octet-stream", 96),
                ("/nzportable/ftewebgl.js", "application/javascript", 165608),
                ("/nzportable/ftewebgl.wasm", "application/wasm", 5178106),
                ("/nzportable/nzp/progs.pk3", "application/octet-stream", 491379),
                ("/nzportable/parts/game.pk3.part00", "application/octet-stream", 31457280),
                ("/nzportable/parts/game.pk3.part01", "application/octet-stream", 31457280),
                ("/nzportable/parts/game.pk3.part02", "application/octet-stream", 31362274),
            ]
            for route, expected_mime_prefix, expected_len in routes:
                conn.request("HEAD", route)
                head_resp = conn.getresponse()
                head_resp.read()
                self.assertEqual(head_resp.status, 200, f"HEAD {route} failed with {head_resp.status}")
                self.assertEqual(head_resp.getheader("Access-Control-Allow-Origin"), "*")
                self.assertEqual(head_resp.getheader("Accept-Ranges"), "bytes")
                self.assertEqual(int(head_resp.getheader("Content-Length", "-1")), expected_len)
                self.assertTrue(
                    head_resp.getheader("Content-Type", "").startswith(expected_mime_prefix),
                    f"Unexpected Content-Type for {route}: {head_resp.getheader('Content-Type')}",
                )

            # Verify HEAD on 94.28 MB /nzportable/nzp/game.pk3
            conn.request("HEAD", "/nzportable/nzp/game.pk3")
            game_head = conn.getresponse()
            game_head.read()
            self.assertEqual(game_head.status, 200)
            self.assertEqual(int(game_head.getheader("Content-Length", "-1")), 94276834)
            self.assertEqual(game_head.getheader("Content-Type"), "application/octet-stream")
        finally:
            conn.close()

    def test_14_live_http_206_partial_content_and_416_range_not_satisfiable(self):
        """§2 & §6.1: Live HTTP server supports HTTP 206 byte-range requests and returns HTTP 416 for invalid ranges."""
        game_disk_path = os.path.join(REPO_ROOT, "nzportable", "nzp", "game.pk3")
        with open(game_disk_path, "rb") as f:
            first_1024 = f.read(1024)
            f.seek(31457280)
            mid_64 = f.read(64)
            f.seek(94276800)
            tail_34 = f.read(34)

        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        try:
            # 1. Prefix range bytes=0-1023
            conn.request("GET", "/nzportable/nzp/game.pk3", headers={"Range": "bytes=0-1023"})
            r1 = conn.getresponse()
            body1 = r1.read()
            self.assertEqual(r1.status, 206)
            self.assertEqual(r1.getheader("Content-Range"), "bytes 0-1023/94276834")
            self.assertEqual(int(r1.getheader("Content-Length", "-1")), 1024)
            self.assertEqual(body1, first_1024)

            # 2. Middle range at chunk 1 boundary bytes=31457280-31457343
            conn.request("GET", "/nzportable/nzp/game.pk3", headers={"Range": "bytes=31457280-31457343"})
            r2 = conn.getresponse()
            body2 = r2.read()
            self.assertEqual(r2.status, 206)
            self.assertEqual(r2.getheader("Content-Range"), "bytes 31457280-31457343/94276834")
            self.assertEqual(body2, mid_64)

            # 3. Open-ended range bytes=94276800-
            conn.request("GET", "/nzportable/nzp/game.pk3", headers={"Range": "bytes=94276800-"})
            r3 = conn.getresponse()
            body3 = r3.read()
            self.assertEqual(r3.status, 206)
            self.assertEqual(r3.getheader("Content-Range"), "bytes 94276800-94276833/94276834")
            self.assertEqual(len(body3), 34)
            self.assertEqual(body3, tail_34)

            # 4. HEAD with Range
            conn.request("HEAD", "/nzportable/nzp/game.pk3", headers={"Range": "bytes=0-255"})
            r_head = conn.getresponse()
            body_head = r_head.read()
            self.assertEqual(r_head.status, 206)
            self.assertEqual(r_head.getheader("Content-Range"), "bytes 0-255/94276834")
            self.assertEqual(int(r_head.getheader("Content-Length", "-1")), 256)
            self.assertEqual(len(body_head), 0)

            # 5. Out-of-bounds range -> HTTP 416
            conn.request("GET", "/nzportable/nzp/game.pk3", headers={"Range": "bytes=999999999-1000000000"})
            r_416 = conn.getresponse()
            r_416.read()
            self.assertEqual(r_416.status, 416)
            self.assertEqual(r_416.getheader("Content-Range"), "bytes */94276834")

            # 6. Inverted range -> HTTP 416
            conn.request("GET", "/nzportable/nzp/game.pk3", headers={"Range": "bytes=500-100"})
            r_inv = conn.getresponse()
            r_inv.read()
            self.assertEqual(r_inv.status, 416)
        finally:
            conn.close()

    def test_15_api_health_endpoint_readiness_and_failure_isolation(self):
        """§2 & §6.1: /api/health reports nzportable_webapp: true when ready and false when assets are missing."""
        with urllib.request.urlopen(f"{self.base_url}/api/health", timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("status"), "ok")
        self.assertIs(data.get("nzportable_webapp"), True)
        self.assertIn("nzportable_webapp", data.get("services", []))
        self.assertIn("nzportable_webapp", data.get("components", []))

        # Verify HEAD /api/health
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            conn.request("HEAD", "/api/health")
            hresp = conn.getresponse()
            hresp.read()
            self.assertEqual(hresp.status, 200)
        finally:
            conn.close()

        # Verify failure isolation when a required file is absent
        with tempfile.TemporaryDirectory() as tmpdir:
            os.makedirs(os.path.join(tmpdir, "nzportable", "nzp"), exist_ok=True)
            with open(os.path.join(tmpdir, "nzportable", "index.html"), "w", encoding="utf-8") as f:
                f.write("<html></html>")
            # Intentionally omit ftewebgl.wasm and progs.pk3
            saved_cwd = os.getcwd()
            try:
                os.chdir(tmpdir)
                with urllib.request.urlopen(f"{self.base_url}/api/health", timeout=5) as resp2:
                    data2 = json.loads(resp2.read().decode("utf-8"))
                self.assertIs(data2.get("nzportable_webapp"), False)
                self.assertNotIn("nzportable_webapp", data2.get("services", []))
            finally:
                os.chdir(saved_cwd)

    def test_16_ensure_nzportable_game_pk3_auto_materialization_and_corruption_recovery(self):
        """Verify ensure_nzportable_game_pk3() materializes game.pk3 from .part00..02 and recovers from truncation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            parts_dir = os.path.join(tmpdir, "nzportable", "parts")
            nzp_dir = os.path.join(tmpdir, "nzportable", "nzp")
            os.makedirs(parts_dir, exist_ok=True)
            os.makedirs(nzp_dir, exist_ok=True)

            # 1. Missing parts -> returns False cleanly
            self.assertFalse(serve_skatealley.ensure_nzportable_game_pk3(tmpdir))

            # 2. Symlink the 3 authentic parts and materialize
            for rel_part, _, _ in EXPECTED_PARTS:
                src = os.path.join(REPO_ROOT, rel_part)
                dst = os.path.join(tmpdir, rel_part)
                os.symlink(src, dst)

            self.assertTrue(serve_skatealley.ensure_nzportable_game_pk3(tmpdir))
            materialized_path = os.path.join(nzp_dir, "game.pk3")
            self.assertTrue(os.path.isfile(materialized_path))
            self.assertEqual(os.path.getsize(materialized_path), 94276834)
            self.assertEqual(
                compute_sha256(materialized_path),
                EXPECTED_ARTIFACTS["nzportable/nzp/game.pk3"]["sha256"],
            )

            # 3. Truncate game.pk3 and confirm ensure_nzportable_game_pk3 heals it
            with open(materialized_path, "wb") as f:
                f.write(b"truncated")
            self.assertEqual(os.path.getsize(materialized_path), 9)
            self.assertTrue(serve_skatealley.ensure_nzportable_game_pk3(tmpdir))
            self.assertEqual(os.path.getsize(materialized_path), 94276834)


if __name__ == "__main__":
    unittest.main(verbosity=2)
