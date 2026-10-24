#!/usr/bin/env python3
"""
Automated End-to-End Integration & Behavioral Verification Suite for Functional Specification 043:
Standalone Playable WebAssembly/WebGL2 Web Application for GTA: Vice City (/revcdos/).

Compatible with both `pytest` and `python3 -m unittest`.
"""
import hashlib
import http.client
import json
import os
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.request
from html.parser import HTMLParser

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import serve_skatealley  # noqa: E402


EXPECTED_ARTIFACTS = {
    "revcdos/vcbr/vc-sky-en-v6.wasm": {
        "size": 7625877,
        "sha256": "db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2",
        "mime": "application/wasm",
    },
    "revcdos/vcbr/vc-sky-en-v6.data": {
        "size": 135355111,
        "sha256": "3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6",
        "mime": "application/octet-stream",
    },
    "revcdos/cover.jpg": {
        "size": 105208,
        "mime": "image/jpeg",
    },
    "revcdos/intro.mp4": {
        "size": 8019046,
        "mime": "video/mp4",
    },
    "revcdos/vcsky/sha256sums.txt": {
        "size": 10933,
        "mime": "text/plain",
    },
}

EXPECTED_PARTS = [
    (
        "revcdos/parts/vc-sky-en-v6.data.part00",
        33838778,
        "ab41a0abb9fb051cb5b394c12141a72f19880c043465736d79c8ab0f9e2f562b",
    ),
    (
        "revcdos/parts/vc-sky-en-v6.data.part01",
        33838778,
        "a5c7121bf6d042ab4b28b105c3f4b4731d00140714e1ddcbd9d6bd645f1dbcf5",
    ),
    (
        "revcdos/parts/vc-sky-en-v6.data.part02",
        33838778,
        "724ca066f919030e2e6ed1139348299c3b49defa22d53bb960e483dec9cf572c",
    ),
    (
        "revcdos/parts/vc-sky-en-v6.data.part03",
        33838777,
        "6c58863553713b85deb68f13a5e0d40c23c393286c4e6ea0c8e0bf26370aa6e2",
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

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        el_id = attr_dict.get("id")
        if el_id:
            self.elements_by_id[el_id] = {"tag": tag, "attrs": attr_dict}
        if tag == "script":
            self.scripts.append(attr_dict)


class TestReVCDOSSpec043(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_cwd = os.getcwd()
        os.chdir(REPO_ROOT)
        serve_skatealley.ensure_revcdos_data(REPO_ROOT)
        serve_skatealley.ensure_revcdos_vcsky(REPO_ROOT)

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
    # Group 1: Binary Artifacts, Multi-Part Chunks & Lowercase Asset Tree
    # -------------------------------------------------------------------------
    def test_01_runtime_artifacts_byte_size_and_sha256_parity(self):
        """AC-01: All core reVCDOS runtime artifacts exist on disk with exact byte and SHA-256 parity."""
        for rel_path, spec in EXPECTED_ARTIFACTS.items():
            abs_path = os.path.join(REPO_ROOT, rel_path)
            self.assertTrue(os.path.isfile(abs_path), f"Missing required artifact: {rel_path}")
            actual_size = os.path.getsize(abs_path)
            self.assertEqual(
                actual_size,
                spec["size"],
                f"Byte size mismatch for {rel_path}: expected {spec['size']}, got {actual_size}",
            )
            if "sha256" in spec:
                actual_sha256 = compute_sha256(abs_path)
                self.assertEqual(
                    actual_sha256,
                    spec["sha256"],
                    f"SHA-256 mismatch for {rel_path}: expected {spec['sha256']}, got {actual_sha256}",
                )

    def test_02_multipart_chunks_ceiling_and_reassembly_parity(self):
        """AC-01: parts/vc-sky-en-v6.data.part00..03 are <= 35 MB each and reassemble exactly to vc-sky-en-v6.data."""
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

        self.assertEqual(total_part_bytes, EXPECTED_ARTIFACTS["revcdos/vcbr/vc-sky-en-v6.data"]["size"])
        self.assertEqual(
            combined_hasher.hexdigest(),
            EXPECTED_ARTIFACTS["revcdos/vcbr/vc-sky-en-v6.data"]["sha256"],
            "Reassembled .part00..03 SHA-256 does not match vcbr/vc-sky-en-v6.data",
        )

    def test_03_pack_json_schema_and_digest_contract(self):
        """AC-01 & §5.1: /revcdos/pack.json schema matches exact artifact sizes, hashes, and 4 parts."""
        pack_path = os.path.join(REPO_ROOT, "revcdos", "pack.json")
        self.assertTrue(os.path.isfile(pack_path))
        with open(pack_path, "r", encoding="utf-8") as f:
            pack = json.load(f)

        self.assertEqual(pack.get("version"), 1)
        self.assertEqual(pack.get("cacheName"), "revcdos-pack-v1")

        engine = pack.get("engine", {})
        self.assertEqual(engine.get("wasm"), "./vcbr/vc-sky-en-v6.wasm")
        self.assertEqual(engine.get("size"), 7625877)
        self.assertEqual(engine.get("sha256"), EXPECTED_ARTIFACTS["revcdos/vcbr/vc-sky-en-v6.wasm"]["sha256"])

        data_meta = pack.get("data", {})
        self.assertEqual(data_meta.get("path"), "vcbr/vc-sky-en-v6.data")
        self.assertEqual(data_meta.get("size"), 135355111)
        self.assertEqual(data_meta.get("sha256"), EXPECTED_ARTIFACTS["revcdos/vcbr/vc-sky-en-v6.data"]["sha256"])
        self.assertEqual(
            data_meta.get("parts"),
            [
                "./parts/vc-sky-en-v6.data.part00",
                "./parts/vc-sky-en-v6.data.part01",
                "./parts/vc-sky-en-v6.data.part02",
                "./parts/vc-sky-en-v6.data.part03",
            ],
        )
        self.assertEqual(data_meta.get("partSizes"), [33838778, 33838778, 33838778, 33838777])

    def test_04_vcsky_fetched_hierarchy_and_strict_lowercase_normalization(self):
        """AC-01 & §4: revcdos/vcsky/fetched/ has all 15,611 assets and zero uppercase filenames or directories."""
        vcsky_dir = os.path.join(REPO_ROOT, "revcdos", "vcsky")
        fetched_dir = os.path.join(vcsky_dir, "fetched")
        self.assertTrue(os.path.isdir(fetched_dir))

        for subdir in ("anim", "audio", "data", "models", "mp3", "mss", "skins", "text", "txd"):
            self.assertTrue(
                os.path.isdir(os.path.join(fetched_dir, subdir)),
                f"Missing required fetched subdirectory: {subdir}",
            )

        uppercase_entries = []
        total_files = 0
        for root, dirs, files in os.walk(vcsky_dir):
            for d in dirs:
                if any(c.isupper() for c in d):
                    uppercase_entries.append(os.path.join(root, d))
            for f in files:
                total_files += 1
                if any(c.isupper() for c in f):
                    uppercase_entries.append(os.path.join(root, f))

        self.assertEqual(
            len(uppercase_entries),
            0,
            f"Found uppercase entries in revcdos/vcsky: {uppercase_entries[:10]}",
        )
        self.assertGreaterEqual(total_files, 15612, f"Expected >= 15,612 files in revcdos/vcsky, got {total_files}")

    # -------------------------------------------------------------------------
    # Group 2: Git Hygiene & .gitignore Protection
    # -------------------------------------------------------------------------
    def test_05_gitignore_excludes_raw_data_and_vcsky(self):
        """AC-03: revcdos/vcbr/vc-sky-en-v6.data and revcdos/vcsky/ are ignored by git and not tracked."""
        gitignore_path = os.path.join(REPO_ROOT, ".gitignore")
        with open(gitignore_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.read().splitlines()]
        self.assertIn("revcdos/vcbr/vc-sky-en-v6.data", lines)
        self.assertIn("revcdos/vcsky/", lines)
        self.assertIn("*.zip", lines)

        for ignored_target in ("revcdos/vcbr/vc-sky-en-v6.data", "revcdos/vcsky/sha256sums.txt"):
            res = subprocess.run(
                ["git", "check-ignore", "-q", ignored_target],
                cwd=REPO_ROOT,
                check=False,
            )
            self.assertEqual(res.returncode, 0, f"git check-ignore failed for {ignored_target}")

        tracked = subprocess.check_output(["git", "ls-files", "revcdos/"], cwd=REPO_ROOT, text=True).splitlines()
        self.assertNotIn("revcdos/vcbr/vc-sky-en-v6.data", tracked)
        self.assertFalse(any(t.startswith("revcdos/vcsky/") for t in tracked))
        for required_tracked in (
            "revcdos/index.html",
            "revcdos/game.js",
            "revcdos/index.js",
            "revcdos/pack.json",
            "revcdos/vcbr/vc-sky-en-v6.wasm",
            "revcdos/parts/vc-sky-en-v6.data.part00",
            "revcdos/parts/vc-sky-en-v6.data.part01",
            "revcdos/parts/vc-sky-en-v6.data.part02",
            "revcdos/parts/vc-sky-en-v6.data.part03",
        ):
            self.assertIn(required_tracked, tracked)

    def test_06_tracked_files_under_size_ceiling(self):
        """AC-03 & §7: Zero git-tracked files exceed 45 MB, and all tracked /revcdos/ files <= 35 MB."""
        tracked_files = subprocess.check_output(["git", "ls-files"], cwd=REPO_ROOT, text=True).splitlines()
        for rel_path in tracked_files:
            abs_path = os.path.join(REPO_ROOT, rel_path)
            if not os.path.isfile(abs_path):
                continue
            size = os.path.getsize(abs_path)
            self.assertLessEqual(size, MAX_GIT_TRACKED_BYTES, f"{rel_path} ({size} B) exceeds 45 MiB limit")
            if rel_path.startswith("revcdos/"):
                self.assertLessEqual(size, MAX_PART_BYTES, f"{rel_path} ({size} B) exceeds 35 MiB ceiling")

    # -------------------------------------------------------------------------
    # Group 3: Architectural Isolation, Dead-CDN Elimination & Launcher Link
    # -------------------------------------------------------------------------
    def test_07_zero_threejs_porting_and_dead_cdn_elimination(self):
        """§1 & §2: Zero porting of GTA Vice City formats into sandbox.js and zero dead CDN endpoints."""
        sandbox_path = os.path.join(REPO_ROOT, "sandbox.js")
        with open(sandbox_path, "r", encoding="utf-8") as f:
            sandbox_src = f.read()
        self.assertNotIn("vc-sky-en-v6", sandbox_src)
        self.assertNotIn("gta3.img", sandbox_src)
        self.assertNotIn("cuts.img", sandbox_src)

        index_html_path = os.path.join(REPO_ROOT, "revcdos", "index.html")
        with open(index_html_path, "r", encoding="utf-8") as f:
            index_html = f.read()
        self.assertNotIn("cdn.dos.zone", index_html)
        self.assertNotIn("br.cdn.dos.zone", index_html)
        self.assertNotIn("folder.morgen.qzz.io", index_html)

    def test_08_freeman_alley_hud_launcher_link_and_return_button(self):
        """§5.1 & §6.2: Freeman Alley index.html links to ./revcdos/ and revcdos/index.html links back to ../."""
        alley_html_path = os.path.join(REPO_ROOT, "index.html")
        with open(alley_html_path, "r", encoding="utf-8") as f:
            alley_html = f.read()
        self.assertIn('id="hud-enter-revcdos-btn"', alley_html)
        self.assertIn('href="./revcdos/"', alley_html)
        self.assertIn("GTA: Vice City (reVCDOS)", alley_html)

        revc_html_path = os.path.join(REPO_ROOT, "revcdos", "index.html")
        with open(revc_html_path, "r", encoding="utf-8") as f:
            revc_html = f.read()
        inspector = DOMInspector()
        inspector.feed(revc_html)
        for req_id in ("canvas", "click-to-play-button", "demo-off-disclaimer", "config-panel", "revcdos-back-to-alley-btn"):
            self.assertIn(req_id, inspector.elements_by_id, f"Missing #{req_id} in revcdos/index.html")

    # -------------------------------------------------------------------------
    # Group 4: Unified HTTP Server (scripts/serve_skatealley.py) Live Integration
    # -------------------------------------------------------------------------
    def test_09_live_http_case_insensitive_vcsky_and_range_requests(self):
        """§6.1: Live HTTP server resolves mixed-case /revcdos/vcsky/ paths and supports HTTP 206 byte ranges."""
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        try:
            # 1. Mixed-case request under /revcdos/vcsky/ resolves to lowercase file on disk
            conn.request("HEAD", "/revcdos/vcsky/fetched/AUDIO/AirHornL.wav")
            r_case = conn.getresponse()
            r_case.read()
            self.assertEqual(r_case.status, 200)
            self.assertEqual(int(r_case.getheader("Content-Length", "-1")), 14294)

            # 2. HTTP 206 Partial Content on vc-sky-en-v6.data
            conn.request("GET", "/revcdos/vcbr/vc-sky-en-v6.data", headers={"Range": "bytes=0-1023"})
            r_range = conn.getresponse()
            body = r_range.read()
            self.assertEqual(r_range.status, 206)
            self.assertEqual(r_range.getheader("Content-Range"), "bytes 0-1023/135355111")
            self.assertEqual(len(body), 1024)

            # 3. Verify /api/health reports revcdos_webapp: true
            with urllib.request.urlopen(f"{self.base_url}/api/health", timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("ok"))
            self.assertIs(data.get("revcdos_webapp"), True)
            self.assertIn("revcdos_webapp", data.get("services", []))
            self.assertIn("revcdos_webapp", data.get("components", []))
        finally:
            conn.close()

    def test_10_ensure_revcdos_data_auto_materialization(self):
        """Verify ensure_revcdos_data() reassembles vc-sky-en-v6.data from .part00..03 when absent."""
        with tempfile.TemporaryDirectory() as tmpdir:
            parts_dir = os.path.join(tmpdir, "revcdos", "parts")
            vcbr_dir = os.path.join(tmpdir, "revcdos", "vcbr")
            os.makedirs(parts_dir, exist_ok=True)
            os.makedirs(vcbr_dir, exist_ok=True)

            self.assertFalse(serve_skatealley.ensure_revcdos_data(tmpdir))

            for rel_part, _, _ in EXPECTED_PARTS:
                src = os.path.join(REPO_ROOT, rel_part)
                dst = os.path.join(tmpdir, rel_part)
                os.symlink(src, dst)

            self.assertTrue(serve_skatealley.ensure_revcdos_data(tmpdir))
            materialized = os.path.join(vcbr_dir, "vc-sky-en-v6.data")
            self.assertTrue(os.path.isfile(materialized))
            self.assertEqual(os.path.getsize(materialized), 135355111)
            self.assertEqual(
                compute_sha256(materialized),
                EXPECTED_ARTIFACTS["revcdos/vcbr/vc-sky-en-v6.data"]["sha256"],
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
