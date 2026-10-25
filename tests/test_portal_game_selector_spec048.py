#!/usr/bin/env python3
"""
Verification suite for functional_specification_048.md:
Back-Alley Watercolor Portal Screen-Mount-Styled Holographic Game Selector Pop-Up
& Cropped RGBA Game Logos (platodoom header, Skate 3, GTA, Zombies).
"""

import json
import os
import sys
import unittest
from pathlib import Path

PREFERRED_PYTHON = "/opt/anaconda3/envs/greek_env/bin/python"
if os.path.exists(PREFERRED_PYTHON) and os.path.realpath(sys.executable) != os.path.realpath(PREFERRED_PYTHON):
    os.execv(PREFERRED_PYTHON, [PREFERRED_PYTHON] + sys.argv)

import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
PORTAL_ASSETS_DIR = REPO_ROOT / "assets" / "portal_games"


class TestPortalGameSelectorSpec048(unittest.TestCase):
    def test_01_cropped_rgba_logo_assets_and_alpha_matting(self):
        """AC-03: Verify all 4 cropped RGBA PNGs exist, have transparent corners, and fit <= 12 MB decoded RGBA budget."""
        expected_files = [
            "platodoom_header.png",
            "skate3_logo.png",
            "gta_logo.png",
            "zombies_logo.png",
            "manifest.json",
        ]
        for fname in expected_files:
            fpath = PORTAL_ASSETS_DIR / fname
            self.assertTrue(fpath.is_file(), f"Missing portal game asset: {fpath}")
            self.assertGreater(fpath.stat().st_size, 100, f"Empty portal game asset: {fpath}")

        manifest = json.loads((PORTAL_ASSETS_DIR / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["spec"], "functional_specification_048")
        self.assertEqual(len(manifest["games"]), 3)

        total_rgba_bytes = 0
        for fname in ["platodoom_header.png", "skate3_logo.png", "gta_logo.png", "zombies_logo.png"]:
            img_bgra = cv2.imread(str(PORTAL_ASSETS_DIR / fname), cv2.IMREAD_UNCHANGED)
            self.assertIsNotNone(img_bgra, f"Failed to decode {fname}")
            self.assertEqual(img_bgra.ndim, 3, f"{fname} must be 2D multi-channel image")
            self.assertEqual(img_bgra.shape[2], 4, f"{fname} must have 4 RGBA channels")

            h, w, _ = img_bgra.shape
            total_rgba_bytes += h * w * 4

            # All 4 corner 6x6 patches must be 100% transparent (alpha == 0)
            alpha = img_bgra[:, :, 3]
            corners = [
                alpha[:6, :6],
                alpha[:6, -6:],
                alpha[-6:, :6],
                alpha[-6:, -6:],
            ]
            max_corner_alpha = int(max(c.max() for c in corners))
            self.assertEqual(
                max_corner_alpha,
                0,
                f"{fname} must have alpha == 0 across all 4 corners (got {max_corner_alpha})",
            )

            # Content bounding box must be tightly cropped (non-zero alpha near all 4 edges within padding)
            ys, xs = np.where(alpha > 16)
            self.assertGreater(len(xs), 1000, f"{fname} has too few opaque pixels")
            self.assertLessEqual(int(xs.min()), 20, f"{fname} left edge not tightly cropped")
            self.assertGreaterEqual(int(xs.max()), w - 21, f"{fname} right edge not tightly cropped")
            self.assertLessEqual(int(ys.min()), 20, f"{fname} top edge not tightly cropped")
            self.assertGreaterEqual(int(ys.max()), h - 21, f"{fname} bottom edge not tightly cropped")

        self.assertLessEqual(total_rgba_bytes, 12 * 1024 * 1024)

        # Verify platodoom_header.png preserves interior white counter highlights while removing exterior white paper
        header_bgra = cv2.imread(str(PORTAL_ASSETS_DIR / "platodoom_header.png"), cv2.IMREAD_UNCHANGED)
        b, g, r, a = (
            header_bgra[:, :, 0],
            header_bgra[:, :, 1],
            header_bgra[:, :, 2],
            header_bgra[:, :, 3],
        )
        interior_white = (a == 255) & (r > 200) & (g > 200) & (b > 200)
        self.assertGreater(
            int(interior_white.sum()),
            15000,
            "platodoom_header.png must preserve interior white counter highlights inside the graffiti lettering",
        )

    def test_02_watercolor_shader_portal_catalog_and_state_machine(self):
        """AC-01, AC-04, AC-05: Verify watercolor_shader.js exports PORTAL_HEADER_LOGO_SPEC, PORTAL_GAME_CATALOG, and portal popup methods."""
        wc_src = (REPO_ROOT / "watercolor_shader.js").read_text(encoding="utf-8")
        for token in [
            "export const PORTAL_HEADER_LOGO_SPEC",
            "export const PORTAL_GAME_CATALOG",
            "export function resolvePortalGameSpec",
            "./assets/portal_games/platodoom_header.png",
            "./assets/portal_games/skate3_logo.png",
            "./assets/portal_games/gta_logo.png",
            "./assets/portal_games/zombies_logo.png",
            "./skate3_cleanroom/?char=luis",
            "./revcdos/",
            "./nzportable/",
            "openPortalPopup(",
            "closePortalPopup(",
            "selectGame(",
            "launchGame(",
            "walkThroughDisarmedUntilExit",
        ]:
            self.assertIn(token, wc_src, f"Missing expected token in watercolor_shader.js: {token}")

    def test_03_index_html_screen_mount_styled_portal_popup_dom(self):
        """AC-02: Verify index.html defines #portal-game-holo-stage and #portal-game-holo-window with Screen-Mount styling."""
        html_src = (REPO_ROOT / "index.html").read_text(encoding="utf-8")
        for token in [
            'id="portal-game-holo-stage"',
            'id="portal-game-holo-window"',
            'class="holo-window mount-focus-active"',
            'data-holo-state="dormant"',
            'id="portal-header-logo-img"',
            './assets/portal_games/platodoom_header.png',
            'id="portal-game-cards-grid"',
            'id="portal-game-card-skate3"',
            'id="portal-game-card-gta"',
            'id="portal-game-card-zombies"',
            './assets/portal_games/skate3_logo.png',
            './assets/portal_games/gta_logo.png',
            './assets/portal_games/zombies_logo.png',
            'id="portal-holo-exit-btn"',
            '@keyframes holoPortalWindowMaterialize',
            '@keyframes holoPortalWindowCollapse',
            '@keyframes holoPortalCardMaterialize',
            '@keyframes holoPortalCardCollapse',
            'perspective: 1200px;',
        ]:
            self.assertIn(token, html_src, f"Missing expected DOM/CSS token in index.html: {token}")
        self.assertNotIn('id="hud-enter-skateroom-btn"', html_src, "Spec 055 AC-02: legacy #hud-enter-skateroom-btn must be removed")

    def test_04_sandbox_js_portal_popup_wiring(self):
        """AC-01, AC-04, AC-05: Verify sandbox.js wires openPortalGameSelectorPopup, closePortalGameSelectorPopup, selectPortalGame, and launchPortalGame."""
        sb_src = (REPO_ROOT / "sandbox.js").read_text(encoding="utf-8")
        for token in [
            "PORTAL_HEADER_LOGO_SPEC",
            "PORTAL_GAME_CATALOG",
            "solvePortalGameGridLayout",
            "setPortalGameCatalog(",
            "openPortalGameSelectorPopup(",
            "closePortalGameSelectorPopup(",
            "selectPortalGame(",
            "launchPortalGame(",
            "syncPortalGamePopupDOM(",
            "updatePortalGameHoloPopupUI(",
            "bindPortalGamePopupListeners(",
        ]:
            self.assertIn(token, sb_src, f"Missing expected portal popup integration in sandbox.js: {token}")

    def test_05_spec053_minimalist_logo_only_and_n_game_grid_solver(self):
        """Spec 053 AC-01 & AC-04: Verify minimalist logo-only DOM in index.html and solvePortalGameGridLayout in watercolor_shader.js."""
        wc_src = (REPO_ROOT / "watercolor_shader.js").read_text(encoding="utf-8")
        for token in [
            "export function normalizePortalGameEntry(",
            "export function solvePortalGameGridLayout(",
            "setAvailableGames(",
        ]:
            self.assertIn(token, wc_src, f"Missing Spec 053 token in watercolor_shader.js: {token}")

        html_src = (REPO_ROOT / "index.html").read_text(encoding="utf-8")
        stage_start = html_src.index('id="portal-game-holo-stage"')
        stage_end = html_src.index("</section>", stage_start)
        stage_html = html_src[stage_start:stage_end]

        for forbidden in [
            "portal-game-card-title",
            "portal-game-card-desc",
            "portal-game-slot-pill",
            "portal-game-launch-btn",
            "portal-pip-skate3",
            "portal-header-sub",
        ]:
            self.assertNotIn(
                forbidden,
                stage_html,
                f"Spec 053 violation: #portal-game-holo-stage must not contain cluttered element '{forbidden}'",
            )

    def test_06_spec055_walk_in_only_and_holographic_appear_disappear_choreography(self):
        """Spec 055 AC-01..AC-05: Verify click-to-popup removal, hover isolation outside edit mode, and bidirectional appear/disappear state machine."""
        sb_src = (REPO_ROOT / "sandbox.js").read_text(encoding="utf-8")
        self.assertNotIn("source: 'canvas-click'", sb_src, "Spec 055 AC-01: 3D canvas click-to-open must be removed")
        self.assertNotIn("hud-enter-skateroom-btn", sb_src, "Spec 055 AC-02: legacy HUD SkateRoom shortcut must be removed")
        for token in [
            "PORTAL_HOLO_OPEN_DURATION_MS = 320",
            "PORTAL_HOLO_CLOSE_DURATION_MS = 240",
            "applyPortalPopupLifecycleDOM(",
            "startPortalPopupOpenAnimation(",
            "startPortalPopupCloseAnimation(",
            "portalPopupAnimState: 'dormant'",
            "h.object?.userData?.holoColumnId !== 'watercolor_gallery'",
        ]:
            self.assertIn(token, sb_src, f"Missing Spec 055 token in sandbox.js: {token}")

        wc_src = (REPO_ROOT / "watercolor_shader.js").read_text(encoding="utf-8")
        for token in [
            "let popupAnimState = 'dormant'",
            "get popupAnimState()",
            "setPopupAnimState(",
        ]:
            self.assertIn(token, wc_src, f"Missing Spec 055 token in watercolor_shader.js: {token}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
