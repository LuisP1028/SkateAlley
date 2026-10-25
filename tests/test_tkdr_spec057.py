import hashlib
import json
import os
import struct
import unittest
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TKDR_DIR = os.path.join(REPO_ROOT, "tkdr")

TKDR_ISO_EXPECTED_SIZE = 1750237184
TKDR_ISO_EXPECTED_SHA1 = "8193a65dee49685db49284408c89bdb35324bc32"
TKDR_EBOOT_EXPECTED_SIZE = 4836160
TKDR_EBOOT_EXPECTED_SHA1 = "b9a0e3292738a833f4f8077e3959c3a0652c42cd"
ET_SCE_PRX = 0xFFA0


class TestTkdrSpec057(unittest.TestCase):
    def test_01_binary_and_cryptographic_artifacts(self):
        iso_path = os.path.join(TKDR_DIR, "game.iso")
        eboot_path = os.path.join(TKDR_DIR, "eboot.bin")
        ulus_path = os.path.join(TKDR_DIR, "ULUS10139_EBOOT.BIN")
        zip_path = os.path.join(TKDR_DIR, "game.zip")

        self.assertTrue(os.path.isfile(iso_path), f"Missing {iso_path}")
        self.assertEqual(os.path.getsize(iso_path), TKDR_ISO_EXPECTED_SIZE)
        with open(iso_path, "rb") as f:
            f.seek(32768)
            pvd = f.read(16)
        self.assertEqual(pvd, b"\x01CD001\x01\x00PSP GAME")

        for eb in (eboot_path, ulus_path):
            self.assertTrue(os.path.isfile(eb), f"Missing {eb}")
            self.assertEqual(os.path.getsize(eb), TKDR_EBOOT_EXPECTED_SIZE)
            with open(eb, "rb") as f:
                data = f.read()
            self.assertEqual(data[:4], b"\x7fELF")
            e_type = struct.unpack_from("<H", data, 16)[0]
            self.assertEqual(e_type, ET_SCE_PRX)
            self.assertEqual(hashlib.sha1(data).hexdigest(), TKDR_EBOOT_EXPECTED_SHA1)

        self.assertTrue(os.path.isfile(zip_path), f"Missing {zip_path}")
        self.assertGreater(os.path.getsize(zip_path), 1117233020)

        required_web_files = [
            "index.html",
            "tkdr.html",
            "tkdr.js",
            "tkdr.wasm",
            "disc.mjs",
            "config.json",
            "_headers",
            "recomp/index.mjs",
            "recomp/elf.mjs",
            "recomp/mips.mjs",
            "recomp/analyze.mjs",
            "recomp/wasm.mjs",
            "recomp/wasmgen.mjs",
            "recomp/worker.mjs",
            "recomp/nids.json",
            "tools/serve.py",
        ]
        for rel in required_web_files:
            p = os.path.join(TKDR_DIR, rel)
            self.assertTrue(os.path.isfile(p), f"Missing required tkdr file: {p}")

    def test_02_http_server_coop_coep_and_range_streaming(self):
        for base_url in ("http://127.0.0.1:3002", "http://127.0.0.1:8080"):
            with urllib.request.urlopen(f"{base_url}/api/health", timeout=5) as resp:
                self.assertEqual(resp.status, 200)
                health = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(health.get("tkdr_webapp"), f"tkdr_webapp false on {base_url}")
                self.assertIn("tkdr_webapp", health.get("components", []))

            for route in ("/tkdr/tkdr.html", "/tkdr/tkdr.wasm"):
                req = urllib.request.Request(f"{base_url}{route}", method="HEAD")
                with urllib.request.urlopen(req, timeout=5) as resp:
                    self.assertEqual(resp.status, 200)
                    self.assertEqual(resp.headers.get("Cross-Origin-Opener-Policy"), "same-origin")
                    self.assertEqual(resp.headers.get("Cross-Origin-Embedder-Policy"), "require-corp")

            range_req = urllib.request.Request(
                f"{base_url}/tkdr/game.iso",
                headers={"Range": "bytes=32768-34815"},
                method="GET",
            )
            with urllib.request.urlopen(range_req, timeout=5) as resp:
                self.assertEqual(resp.status, 206)
                self.assertEqual(
                    resp.headers.get("Content-Range"),
                    f"bytes 32768-34815/{TKDR_ISO_EXPECTED_SIZE}",
                )
                self.assertEqual(resp.headers.get("Content-Length"), "2048")
                body = resp.read()
                self.assertEqual(len(body), 2048)
                self.assertTrue(body.startswith(b"\x01CD001\x01\x00PSP GAME"))


if __name__ == "__main__":
    unittest.main()
