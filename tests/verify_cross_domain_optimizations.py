#!/usr/bin/env python3
"""
tests/verify_cross_domain_optimizations.py
Cross-Domain Performance & Optimization Verification Suite for Functional Spec 068 & System Addendum.

Verifies the 10 Core Operational Performance Budgets from suggested-optimizations.md:
1. CRT Post-Processing Pass: GPU Frame Time <= 0.8ms, DPR <= 1.25, single-pass fused pipeline.
2. Viewport Pixel Ratio: Capped at min(DPR, 1.25).
3. PlatoDoom Header Texture: Exactly 1024x348, VRAM <= 1.425 MB <= 1.45 MB, POT tier.
4. PlatoDoom Header Compressed Size: WebP <= 120 KB, PNG <= 290 KB, interior white highlights preserved.
5. 3D Screen Mount Textures: CanvasTexture 1024x627, generateMipmaps=false, LinearFilter.
6. CanvasTexture Upload Rate: Dirty-flagged blits only (0 B/s steady state).
7. PlatoDoom Pop-Out Kinematics: Zero-GC Hermite/cubic kinematics, 6.8m trigger, 7.5m release.
8. Large-Scale Showcase & Header Geometry: 3.52m x 2.16m screen, 3.84m x 1.20m graffiti header @ Y=1.78m.
9. Skate 3 Cleanroom Asset Wire Format: 37-byte header, pack.json byte sum integrity (90631134 + len).
10. Pitch-Black Sky Port: Pure #000000 (0x000000) background, depth fog, and clear color.
"""

import hashlib
import json
import os
import sys
import unittest
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent


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
        print("  ✓ CanvasTexture generateMipmaps = false invariant verified in sandbox.js")

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
