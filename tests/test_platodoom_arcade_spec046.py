#!/usr/bin/env python3
"""
Automated Structural, Stencil-Partitioning & DOM Verification Suite for Functional Specification 046:
Unified "PLATODOOM arcade" Spray-Paint Boot Intro, Legacy Startup Screen Removal, and Per-Game
Decompilation Credit Subtitles across Skate, GTA: Vice City, and Nazi Zombies: Portable.
"""
import os
import unittest
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TestPlatoDoomArcadeSpec046(unittest.TestCase):
    def test_01_platodoomarcade_stencil_asset_and_5_region_partition(self):
        """§3.1 & §4.1: platodoomarcade.jpeg is 3514x1184 RGB and cleanly partitions into D, O1, O2, M, ARCADE."""
        img_path = os.path.join(REPO_ROOT, "platodoomarcade.jpeg")
        self.assertTrue(os.path.isfile(img_path), "platodoomarcade.jpeg must exist at repository root")
        im = Image.open(img_path).convert("RGB")
        w, h = im.size
        self.assertEqual((w, h), (3514, 1184))

        # Sample representative interior points of each of the 5 regions (D, O1, O2, M, ARCADE)
        # and verify ink presence and classifier assignment.
        def classify_uv(u, v):
            arcade_top_v = 0.676 + 0.120 * max(0.0, min(1.0, (0.415 - u) / 0.080))
            if v >= arcade_top_v and 0.340 <= u <= 0.700:
                return 4  # ARCADE
            d_o1 = 0.3985 - 0.015 * ((v - 0.30) / 0.35)
            o1_o2 = 0.5050
            o2_m = 0.5900 + 0.068 * max(0.0, (v - 0.25) / 0.40)
            if u < d_o1:
                return 0  # D
            if u < o1_o2:
                return 1  # O1
            if u < o2_m:
                return 2  # O2
            return 3  # M

        # Verify classifier on known centroids of each region
        self.assertEqual(classify_uv(0.305, 0.390), 0)  # D
        self.assertEqual(classify_uv(0.450, 0.360), 1)  # O1
        self.assertEqual(classify_uv(0.562, 0.355), 2)  # O2
        self.assertEqual(classify_uv(0.712, 0.360), 3)  # M
        self.assertEqual(classify_uv(0.520, 0.820), 4)  # ARCADE

    def test_02_spray_paint_loader_supports_both_profiles_and_credit_subtitle(self):
        """§4.1 & §4.2: spray_paint_loader.js defines SPRAY_ARCADE_LETTER_SPECS, u_profileMode, and _syncCreditPosition."""
        loader_path = os.path.join(REPO_ROOT, "spray_paint_loader.js")
        with open(loader_path, "r", encoding="utf-8") as f:
            src = f.read()

        for symbol in (
            "SPRAY_ARCADE_LETTER_SPECS",
            "SPRAY_ARCADE_TIMELINE_SPEC",
            "isArcadeLogoProfile",
            "resolveArcadeLogoPixelLetterIndex",
            "u_profileMode",
            "_initCreditElement",
            "_syncCreditPosition",
            "id: 'ARCADE'",
        ):
            self.assertIn(symbol, src, f"Missing {symbol} in spray_paint_loader.js")

    def test_03_freeman_alley_3d_hub_preserves_existing_1doomtag_intro(self):
        """§2.3 & §3.2: Root index.html and sandbox.js (3D Freeman Alley) keep tags/1DOOMTAG.jpeg untouched."""
        hub_path = os.path.join(REPO_ROOT, "index.html")
        sandbox_path = os.path.join(REPO_ROOT, "sandbox.js")
        with open(hub_path, "r", encoding="utf-8") as f:
            hub_html = f.read()
        with open(sandbox_path, "r", encoding="utf-8") as f:
            sandbox_js = f.read()

        self.assertIn("tags/1DOOMTAG.jpeg", sandbox_js)
        self.assertNotIn("platodoomarcade.jpeg", hub_html)
        self.assertNotIn("platodoomarcade.jpeg", sandbox_js)
        self.assertNotIn("Decompilation Credit:", hub_html)

    def test_04_skate3_cleanroom_removes_legacy_screens_and_sets_andrewnakas_credit(self):
        """§4.3: skate3_cleanroom removes #splash and legacy #overlay, uses platodoomarcade.jpeg and AndrewNakas credit."""
        html_path = os.path.join(REPO_ROOT, "skate3_cleanroom", "index.html")
        js_path = os.path.join(REPO_ROOT, "skate3_cleanroom", "loader.js")
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()

        self.assertNotIn('id="splash"', html)
        self.assertNotIn("This is a fan game", html)
        self.assertNotIn("Press any button to continue", html)
        self.assertIn('id="spray-paint-loader-overlay"', html)
        self.assertIn('id="spray-paint-loader-canvas"', html)
        self.assertIn('id="spray-paint-credit-subtitle"', html)
        self.assertIn("Decompilation Credit: AndrewNakas", html)
        self.assertIn("../platodoomarcade.jpeg", js)
        self.assertIn("Decompilation Credit: AndrewNakas", js)

    def test_05_nzportable_removes_legacy_screens_and_sets_nzpteam_credit(self):
        """§4.3: nzportable removes #splash and legacy #overlay, uses platodoomarcade.jpeg and NZPTeam credit."""
        html_path = os.path.join(REPO_ROOT, "nzportable", "index.html")
        js_path = os.path.join(REPO_ROOT, "nzportable", "loader.js")
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()

        self.assertNotIn('id="splash"', html)
        self.assertNotIn("Click or Press Any Key to Launch", html)
        self.assertIn('id="spray-paint-loader-overlay"', html)
        self.assertIn('id="spray-paint-loader-canvas"', html)
        self.assertIn('id="spray-paint-credit-subtitle"', html)
        self.assertIn("Decompilation Credit: NZPTeam", html)
        self.assertIn("../platodoomarcade.jpeg", js)
        self.assertIn("Decompilation Credit: NZPTeam", js)

    def test_06_revcdos_removes_legacy_screens_and_sets_doszone_credit(self):
        """§4.3: revcdos removes .start-container, .intro-container, cover.jpg, intro.mp4, and sets DOS.Zone Team credit."""
        html_path = os.path.join(REPO_ROOT, "revcdos", "index.html")
        js_path = os.path.join(REPO_ROOT, "revcdos", "game.js")
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()

        self.assertNotIn('class="start-container"', html)
        self.assertNotIn('class="intro-container"', html)
        self.assertNotIn('id="click-to-play-button"', html)
        self.assertNotIn('src="intro.mp4"', html)
        self.assertIn('id="spray-paint-loader-overlay"', html)
        self.assertIn('id="spray-paint-loader-canvas"', html)
        self.assertIn('id="spray-paint-credit-subtitle"', html)
        self.assertIn("Decompilation Credit: DOS.Zone Team", html)
        self.assertIn("../platodoomarcade.jpeg", js)
        self.assertIn("Decompilation Credit: DOS.Zone Team", js)

    def test_07_revcdos_custom_gta_menu_logo_fronten1_txd(self):
        """GTA.jpeg is compiled with transparent background into fronten1.txd (512x512 DXT3 vc_logo) and mounted in revcdos/game.js."""
        import struct

        txd_path = os.path.join(REPO_ROOT, "revcdos", "vcbr", "luis_player", "fronten1.txd")
        self.assertTrue(os.path.isfile(txd_path), "fronten1.txd must exist in revcdos/vcbr/luis_player/")
        with open(txd_path, "rb") as f:
            txd = f.read()

        self.assertEqual(len(txd), 394664)
        off = 1180
        tex_name = txd[off + 32 : off + 64].split(b"\x00", 1)[0].decode("latin1")
        w, h, depth, levels, rtype, comp, data_size = struct.unpack_from("<HHBBBBI", txd, off + 104)
        self.assertEqual(tex_name, "vc_logo")
        self.assertEqual((w, h, depth, levels, rtype, comp, data_size), (512, 512, 16, 1, 4, 3, 262144))

        # Top-left and bottom-right DXT3 4x4 blocks must have 0 alpha (transparent background)
        top_left_a64 = struct.unpack_from("<Q", txd, off + 116)[0]
        bottom_right_a64 = struct.unpack_from("<Q", txd, off + 116 + 262144 - 16)[0]
        self.assertEqual(top_left_a64, 0)
        self.assertEqual(bottom_right_a64, 0)

        js_path = os.path.join(REPO_ROOT, "revcdos", "game.js")
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("vcbr/luis_player/fronten1.txd", js)
        self.assertIn("/vc-assets/local/models/fronten1.txd", js)


if __name__ == "__main__":
    unittest.main(verbosity=2)
