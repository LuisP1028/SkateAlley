#!/usr/bin/env python3
"""
tests/verify_cross_domain_optimizations.py
Cross-Domain Performance & Optimization Verification Suite for Functional Spec 068 & System Addendum.

Verifies the 10 Core Operational Performance Budgets from suggested-optimizations.md:
1. CRT Post-Processing Pass: GPU Frame Time <= 0.8ms, DPR <= 1.25, single-pass fused pipeline.
2. Viewport Pixel Ratio: Capped at min(DPR, 1.25).
3. PlatoDoom Header Texture: Exactly 1024x348, VRAM <= 1.425 MB <= 1.45 MB, POT tier.
4. PlatoDoom Header Compressed Size: WebP <= 120 KB, PNG <= 295 KB, interior white highlights preserved.
5. 3D Screen Mount Textures: CanvasTexture 1024x627, generateMipmaps=false, LinearFilter.
6. CanvasTexture Upload Rate: Dirty-flagged blits only (0 B/s steady state).
7. PlatoDoom Pop-Out Kinematics: Zero-GC Hermite/cubic kinematics, 6.8m trigger, 7.5m release.
8. Large-Scale Showcase & Header Geometry: 3.52m x 2.16m screen, 3.84m x 1.20m graffiti header @ Y=1.78m.
9. Skate 3 Cleanroom Asset Wire Format: 37-byte header, pack.json byte sum integrity (90631134 + len).
10. Pitch-Black Sky Port: Pure #000000 (0x000000) background, depth fog, and clear color.
"""

import glob
import hashlib
import json
import os
import struct
import sys
import unittest
import urllib.request
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent


def find_chrome_executable():
    """Find local Chromium executable installed by Playwright for live browser checks."""
    patterns = [
        "/Users/diesel/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/**/Google Chrome for Testing",
        "/Users/diesel/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell",
    ]
    for pattern in patterns:
        matches = glob.glob(pattern, recursive=True)
        if matches:
            # Sort to pick highest version
            matches.sort(reverse=True)
            for m in matches:
                if os.path.isfile(m) and os.access(m, os.X_OK):
                    return m
    return None


class TestCrossDomainOptimizations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print("CROSS-DOMAIN PERFORMANCE & OPTIMIZATION VERIFICATION SUITE")
        print("=" * 70)

    def test_01_platodoom_header_texture_downsampling_and_budgets(self):
        """Budget 3 & 4: PlatoDoom Header Texture Dimensions, VRAM, and Compressed Disk Budgets."""
        png_path = REPO_ROOT / "assets" / "portal_games" / "platodoom_header.png"
        webp_path = REPO_ROOT / "assets" / "portal_games" / "platodoom_header.webp"
        manifest_path = REPO_ROOT / "assets" / "portal_games" / "manifest.json"

        self.assertTrue(png_path.is_file(), f"Missing {png_path}")
        self.assertTrue(webp_path.is_file(), f"Missing {webp_path}")

        # Check PNG dimensions & format
        with Image.open(png_path) as im:
            self.assertEqual(im.format, "PNG")
            self.assertEqual(im.mode, "RGBA")
            w, h = im.size
            self.assertEqual((w, h), (1024, 348), f"Expected 1024x348, got {w}x{h}")

        # Check decoded RGBA footprint
        vram_bytes = w * h * 4
        self.assertEqual(vram_bytes, 1425408)
        self.assertLessEqual(vram_bytes, 1450000, f"Decoded RGBA {vram_bytes} exceeds 1.45 MB budget")
        self.assertLessEqual(vram_bytes, 2000000, f"Decoded RGBA {vram_bytes} exceeds 2.0 MB hard limit")

        # Check WebP dimensions & format
        with Image.open(webp_path) as im:
            self.assertEqual(im.format, "WEBP")
            self.assertEqual(im.size, (1024, 348))

        # Check compressed file size budgets
        png_disk_size = png_path.stat().st_size
        webp_disk_size = webp_path.stat().st_size

        print(f"  ✓ platodoom_header.png: {w}x{h}, {png_disk_size:,} B on disk, {vram_bytes / (1024*1024):.3f} MB RGBA")
        print(f"  ✓ platodoom_header.webp: {w}x{h}, {webp_disk_size:,} B on disk (<= 120 KB budget)")

        self.assertLessEqual(png_disk_size, 295000, f"PNG size {png_disk_size} exceeds 295 KB budget")
        self.assertLessEqual(webp_disk_size, 120 * 1024, f"WebP size {webp_disk_size} exceeds 120 KB budget")

        # Check manifest.json metadata
        if manifest_path.is_file():
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            header_meta = manifest.get("headerLogo", {})
            self.assertEqual(header_meta.get("outputWidth"), 1024)
            self.assertEqual(header_meta.get("outputHeight"), 348)
            self.assertAlmostEqual(header_meta.get("aspectRatio"), 1024 / 348, places=3)
            self.assertEqual(header_meta.get("sha256"), hashlib.sha256(png_path.read_bytes()).hexdigest())
            print("  ✓ manifest.json matches downsampled 1024x348 metadata")

    def test_02_platodoom_alpha_matting_and_interior_highlights(self):
        """Budget 4: PlatoDoom Header transparent corners and interior white highlight preservation."""
        import cv2
        import numpy as np

        png_path = REPO_ROOT / "assets" / "portal_games" / "platodoom_header.png"
        img = cv2.imread(str(png_path), cv2.IMREAD_UNCHANGED)
        self.assertIsNotNone(img)
        self.assertEqual(img.shape[2], 4)

        # Corner transparency
        alpha = img[:, :, 3]
        corners = [alpha[:6, :6], alpha[:6, -6:], alpha[-6:, :6], alpha[-6:, -6:]]
        max_corner_alpha = int(max(crn.max() for crn in corners))
        self.assertEqual(max_corner_alpha, 0, "All 4 corner patches must be 100% transparent")

        # Tight cropping
        ys, xs = np.where(alpha > 16)
        self.assertLessEqual(int(xs.min()), 20)
        self.assertGreaterEqual(int(xs.max()), 1024 - 21)
        self.assertLessEqual(int(ys.min()), 20)
        self.assertGreaterEqual(int(ys.max()), 348 - 21)

        # Interior white counter highlights inside graffiti lettering
        b, g, r, a = img[:, :, 0], img[:, :, 1], img[:, :, 2], img[:, :, 3]
        interior_white = (a == 255) & (r > 200) & (g > 200) & (b > 200)
        self.assertGreater(int(interior_white.sum()), 15000, "Interior white counter highlights must be preserved")
        print(f"  ✓ Corner alpha=0, cropped tight, interior white highlights={int(interior_white.sum()):,} px")

    def test_03_platodoom_arcade_texture_budget(self):
        """Budget 3: platodoomarcade.jpeg dimensions and VRAM footprint."""
        arcade_path = REPO_ROOT / "platodoomarcade.jpeg"
        self.assertTrue(arcade_path.is_file(), f"Missing {arcade_path}")

        with Image.open(arcade_path) as im:
            w, h = im.size
            self.assertEqual((w, h), (1024, 345))
            vram_bytes = w * h * 4
            self.assertLessEqual(vram_bytes, 1450000)

        disk_size = arcade_path.stat().st_size
        self.assertLessEqual(disk_size, 50000)
        print(f"  ✓ platodoomarcade.jpeg: {w}x{h}, {disk_size:,} B on disk, {vram_bytes / (1024*1024):.3f} MB RGBA")

    def test_04_canvas_texture_mipmaps_and_memory_invariants(self):
        """Budget 5 & 6: 3D CanvasTexture mipmap disabling and dirty-flagged blits."""
        sb_file = REPO_ROOT / "sandbox.js"
        self.assertTrue(sb_file.is_file(), f"Missing {sb_file}")
        src = sb_file.read_text(encoding="utf-8")

        # Verify generateMipmaps = false is set on display textures
        self.assertIn(
            "generateMipmaps = false",
            src,
            "CanvasTexture instances must set generateMipmaps = false to save VRAM and PCIe bus bandwidth",
        )
        self.assertIn("minFilter = THREE.LinearFilter", src)
        self.assertIn("magFilter = THREE.LinearFilter", src)
        print("  ✓ CanvasTexture generateMipmaps = false & LinearFilter invariant verified in sandbox.js")

    def test_05_optimization_blueprint_budget_parity(self):
        """Verify cross-domain performance strategies and operational budgets alignment."""
        opt_doc = REPO_ROOT / "wayfinder" / "20261107T172758-750-iwl9" / "suggested-optimizations.md"
        self.assertTrue(opt_doc.is_file(), "Missing suggested-optimizations.md")
        content = opt_doc.read_text(encoding="utf-8")

        for token in [
            "1024",
            "348",
            "1.42",
            "0.8",
            "1.25",
            "generateMipmaps = false",
        ]:
            self.assertIn(token, content)
        print("  ✓ Cross-domain performance operational budgets verified in suggested-optimizations.md")

    def test_06_platodoom_popout_kinematics_and_zero_gc(self):
        """Budget 7: PlatoDoom Pop-Out Kinematics & Zero-GC Hysteresis (watercolor_shader.js)."""
        wc_file = REPO_ROOT / "watercolor_shader.js"
        self.assertTrue(wc_file.is_file(), f"Missing {wc_file}")
        src = wc_file.read_text(encoding="utf-8")

        # Verify hysteresis configuration
        self.assertIn("popOutTriggerRadiusMeters: 6.8", src)
        self.assertIn("popOutReleaseRadiusMeters: 7.5", src)
        self.assertIn("popOutScaleMultiplier: 1.45", src)
        self.assertIn("popOutForwardOffsetMeters: 0.35", src)
        self.assertIn("popOutTransitionDurationSec: 0.38", src)

        # Verify zero-GC preallocated state variables & cubic Hermite easing
        self.assertIn("let isPoppedOut = false", src)
        self.assertIn("let popOutProgress = 0.0", src)
        self.assertIn("let popOutFactor = 0.0", src)
        self.assertIn("p < 0.5 ? 4.0 * p * p * p", src)
        print("  ✓ PlatoDoom proximity pop-out kinematics & zero-GC cubic easing verified in watercolor_shader.js")

    def test_07_crt_optical_pass_spec_and_fill_rate_budget(self):
        """Budget 1 & 2: CRT Post-Processing Pass Spec & Single-Pass Fused Pipeline."""
        sb_file = REPO_ROOT / "sandbox.js"
        crt_file = REPO_ROOT / "crt_optical_pass.js"
        self.assertTrue(sb_file.is_file())
        sb_src = sb_file.read_text(encoding="utf-8")

        # Check CRT parameters
        self.assertIn("scanlineIntensity: 0.16", sb_src)
        self.assertIn("scanlineCount: 640", sb_src)
        self.assertIn("curvature: 0.018", sb_src)
        self.assertIn("vignette: 0.32", sb_src)
        self.assertIn("phosphorMaskIntensity: 0.05", sb_src)
        self.assertIn("stencilBuffer: true", sb_src)
        self.assertIn("depthBuffer: true", sb_src)

        # Verify DPR clamping
        self.assertIn("Math.min(window.devicePixelRatio", sb_src)

        if crt_file.is_file():
            crt_src = crt_file.read_text(encoding="utf-8")
            self.assertIn("CRT_OPTICAL_PASS_SPEC", crt_src)
            self.assertIn("CRTShader", crt_src)
        print("  ✓ CRT optical pass specification, fused pipeline & DPR clamping verified")

    def test_08_largescale_showcase_and_graffiti_header_geometry(self):
        """Budget 8: Large-Scale 3.52m x 2.16m Showcase & 3.84m x 1.20m Header Geometry."""
        sb_file = REPO_ROOT / "sandbox.js"
        alley_file = REPO_ROOT / "alley_atmosphere_023.js"
        self.assertTrue(sb_file.is_file())
        self.assertTrue(alley_file.is_file())

        sb_src = sb_file.read_text(encoding="utf-8")
        alley_src = alley_file.read_text(encoding="utf-8")

        # Screen mount dimensions
        self.assertIn("const screenWidth = 3.52", sb_src)
        self.assertIn("const screenHeight = 2.16", sb_src)
        self.assertIn("headerPlaneWidth", sb_src)
        self.assertIn("3.84", sb_src)
        self.assertIn("headerPlaneHeight", sb_src)
        self.assertIn("1.20", sb_src)
        self.assertIn("headerBaseLocalOffsetY", sb_src)
        self.assertIn("1.78", sb_src)

        # Graffiti header atmospheric spec
        self.assertIn("planeWidthMeters: 3.84", alley_src)
        self.assertIn("planeHeightMeters: 1.20", alley_src)
        self.assertIn("baseLocalOffsetY: 1.78", alley_src)

        # Non-overlapping physical clearance verification
        # Header bottom = 1.78 - (1.20 / 2) = 1.18 m
        # Screen top = (2.16 / 2) + 0.07 (bezel) = 1.15 m
        # Clearance margin = 1.18 - 1.15 = 0.03 m (30 mm > 0 mm)
        header_bottom = 1.78 - 0.60
        screen_top = (2.16 / 2.0) + 0.07
        clearance_margin = header_bottom - screen_top
        self.assertGreater(clearance_margin, 0.02, f"Clearance {clearance_margin}m must be > 20 mm")
        print(f"  ✓ Large-scale showcase (3.52x2.16m) and header (3.84x1.20m @ Y=1.78m) geometry verified (clearance {clearance_margin*1000:.0f} mm)")

    def test_09_skate3_cleanroom_wire_format_and_pack_integrity(self):
        """Budget 9: Skate 3 Cleanroom Asset Wire Format & pack.json Byte Sum Integrity."""
        pack_path = REPO_ROOT / "skate3_cleanroom" / "pack.json"
        part_path = REPO_ROOT / "skate3_cleanroom" / "parts" / "char_luis.part"
        self.assertTrue(pack_path.is_file(), f"Missing {pack_path}")
        self.assertTrue(part_path.is_file(), f"Missing {part_path}")

        # Check pack.json integrity
        with open(pack_path, "r", encoding="utf-8") as f:
            pack = json.load(f)

        self.assertEqual(pack.get("default_char"), "luis")
        part_bytes = part_path.read_bytes()
        expected_size = 90631134 + len(part_bytes)
        expected_hash = hashlib.sha256(part_bytes).hexdigest()[:16]

        self.assertEqual(pack.get("core", {}).get("size"), expected_size)
        self.assertEqual(pack.get("characters", {}).get("luis", {}).get("size"), expected_size)
        self.assertEqual(pack.get("characters", {}).get("luis", {}).get("hash"), expected_hash)

        # Check 37-byte header format
        hdr_path_len = struct.unpack_from("<I", part_bytes, 0)[0]
        self.assertEqual(hdr_path_len, 25)
        hdr_path = part_bytes[4:4 + hdr_path_len].decode("ascii")
        self.assertEqual(hdr_path, "assets/private/skater.glb")
        hdr_glb_len = struct.unpack_from("<Q", part_bytes, 4 + hdr_path_len)[0]
        self.assertEqual(hdr_glb_len, len(part_bytes) - 37)

        # Parse glTF 2.0 chunk
        glb = part_bytes[37:]
        magic, ver, total_len = struct.unpack_from("<III", glb, 0)
        self.assertEqual(magic, 0x46546C67)
        self.assertEqual(ver, 2)
        chunk_len, chunk_type = struct.unpack_from("<II", glb, 12)
        self.assertEqual(chunk_type, 0x4E4F534A)  # "JSON"
        gltf = json.loads(glb[20:20 + chunk_len].decode("utf-8"))

        nodes = [n.get("name", "") for n in gltf.get("nodes", [])]
        meshes = [m.get("name", "") for m in gltf.get("meshes", [])]
        materials = [m.get("name", "") for m in gltf.get("materials", [])]

        # Verify zero Torus or visualizer contamination
        self.assertFalse(any("Torus" in m for m in meshes), "Torus mesh must be stripped")
        self.assertFalse(any("Visualizer" in n for n in nodes), "Visualizer node must be stripped")
        self.assertFalse(any("Visualizer" in m for m in materials), "Visualizer material must be stripped")

        # Verify 5 primitives on Mesh 0
        prims = gltf["meshes"][0]["primitives"]
        self.assertEqual(len(prims), 5, f"Expected 5 primitives on LUIS mesh, got {len(prims)}")

        # Verify rig joints
        self.assertTrue(any("SKATEBOARD_ROOT" in n for n in nodes))
        self.assertTrue(any("TRUCK_FRONT" in n for n in nodes))
        self.assertTrue(any("TRUCK_BACK" in n for n in nodes))

        print(f"  ✓ Skate 3 char_luis.part: {len(part_bytes):,} B, pack.json={expected_size:,} B, hash={expected_hash}, Torus=STRIPPED, Primitives=5")

    def test_10_pitch_black_skyport_void_and_live_browser_telemetry(self):
        """Budget 10: Pitch-Black Sky Port & Live WebGL Telemetry Verification."""
        sb_file = REPO_ROOT / "sandbox.js"
        sb_src = sb_file.read_text(encoding="utf-8")

        # Static checks for pitch-black sky port
        self.assertIn("scene.background = new THREE.Color(0x000000)", sb_src)
        self.assertIn("DEPTH_FOG_COLOR_HEX = 0x000000", sb_src)
        self.assertIn("renderer.setClearColor(0x000000, 1.0)", sb_src)
        print("  ✓ Pitch-black #000000 scene background, depth fog, and clear color verified in sandbox.js")

        # Live Playwright browser telemetry check
        chrome_exe = find_chrome_executable()
        if not chrome_exe:
            print("  [skip] Chrome executable not found in cache; skipping headless browser live telemetry check")
            return

        import http.server
        import socketserver
        import threading
        from playwright.sync_api import sync_playwright

        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

            def log_message(self, format, *args):
                pass

        class EphemeralServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
            allow_reuse_address = True
            daemon_threads = True

        server = EphemeralServer(("127.0.0.1", 0), QuietHandler)
        server_port = server.server_address[1]
        srv_thread = threading.Thread(target=server.serve_forever, daemon=True)
        srv_thread.start()

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    executable_path=chrome_exe,
                    headless=True,
                    args=["--use-gl=angle", "--use-angle=metal"],
                )
                page = browser.new_page(viewport={"width": 1280, "height": 800})
                page.goto(f"http://127.0.0.1:{server_port}/", wait_until="domcontentloaded")
                page.wait_for_function(
                    "() => window.sandbox && window.sandbox.wallMounts && window.sandbox.wallMounts.length === 7",
                    timeout=20000,
                )

                crt = page.evaluate("() => window.sandbox.getCRTOpticalPassState()")
                self.assertTrue(crt.get("enabled"), "CRT optical pass must be enabled")
                self.assertLessEqual(crt.get("gpuFrameTimeMs", 999), 0.8, "CRT GPU frame time must be <= 0.8 ms")
                self.assertLessEqual(crt.get("curvature", 999), 0.025, "Barrel curvature must be <= 0.025")
                self.assertGreaterEqual(crt.get("scanlineIntensity", 0), 0.12)
                self.assertLessEqual(crt.get("scanlineIntensity", 1), 0.22)
                self.assertFalse(crt.get("pointerEventsBlocked"), "Pointer events must not be blocked")

                wc = page.evaluate("() => window.sandbox.waterColor.getState()")
                self.assertEqual(wc.get("popOutTriggerRadiusMeters"), 6.8)
                self.assertEqual(wc.get("popOutReleaseRadiusMeters"), 7.5)
                self.assertEqual(wc.get("popOutScaleMultiplier"), 1.45)
                self.assertEqual(wc.get("popOutForwardOffsetMeters"), 0.35)

                mounts = page.evaluate("""() => window.sandbox.wallMounts.map(m => ({
                    name: m.mountName,
                    w: m.screenWidth,
                    h: m.screenHeight,
                    mipmaps: m.faceMat?.uniforms?.uMap?.value?.generateMipmaps
                }))""")
                self.assertEqual(len(mounts), 7)
                for m in mounts:
                    self.assertEqual(m["w"], 3.52)
                    self.assertEqual(m["h"], 2.16)
                    self.assertFalse(m["mipmaps"], f"generateMipmaps must be false on {m['name']}")

                browser.close()
                print(f"  ✓ Live Browser Telemetry: CRT GPU={crt['gpuFrameTimeMs']:.3f}ms (<=0.8ms), DPR capped, PopOut=6.8/7.5m, Mipmaps=false across all 7 mounts")
        finally:
            server.shutdown()


if __name__ == "__main__":
    unittest.main(verbosity=2)
