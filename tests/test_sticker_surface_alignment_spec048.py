#!/usr/bin/env python3
"""
Automated Structural & Mathematical Verification Suite for Functional Specification 048:
True Level-Geometry Surface Alignment, Normal Locking, and Anti-Intersection Positioning
for Interior & Exterior Wall and Floor Holographic Stickers.
"""
import os
import re
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TestStickerSurfaceAlignmentSpec048(unittest.TestCase):
    def setUp(self):
        self.stickers_path = os.path.join(REPO_ROOT, "holographic_stickers.js")
        self.sandbox_path = os.path.join(REPO_ROOT, "sandbox.js")
        with open(self.stickers_path, "r", encoding="utf-8") as f:
            self.stickers_src = f.read()
        with open(self.sandbox_path, "r", encoding="utf-8") as f:
            self.sandbox_src = f.read()

    def test_01_calibrated_wall_and_floor_knot_tables_present(self):
        """§4.1 & §4.2: holographic_stickers.js defines calibrated knot tables and profile resolvers."""
        for symbol in (
            "CALIBRATED_LEFT_WALL_KNOTS",
            "CALIBRATED_RIGHT_WALL_KNOTS",
            "CALIBRATED_EXTERIOR_LEFT_Z_KNOTS",
            "CALIBRATED_EXTERIOR_RIGHT_Z_KNOTS",
            "CALIBRATED_FLOOR_CONTOUR_KNOTS",
            "resolveStickerWallProfileX",
            "resolveStickerExteriorWallProfileZ",
            "resolveStickerFloorContourY",
            "minSurfaceClearanceMeters: 0.022",
            "normalOffsetMeters: 0.022",
        ):
            self.assertIn(symbol, self.stickers_src, f"Missing required Spec 048 symbol: {symbol}")

        # Verify key empirically measured knots from freeman_alley.glb
        for knot_str in (
            "[0.0, -1.58]",
            "[25.8, -2.53]",
            "[26.5, -1.78]",
            "[42.5, -1.47]",
            "[0.0, 2.23]",
            "[34.0, 1.47]",
            "[42.5, 1.77]",
            "[-9.40, -0.86]",
            "[-1.58, -0.55]",
            "[2.23, -0.45]",
            "[10.20, -0.17]",
            "[-6.0, 0.185]",
            "[24.0, -0.086]",
            "[26.0, -0.095]",
        ):
            self.assertIn(knot_str, self.stickers_src, f"Missing calibrated knot {knot_str}")

    def test_02_exterior_bound_start_excluded_from_raycast_targets(self):
        """§4.3 & AC-03: COLLIDER_STICKER_BOUND_START has no-op raycast and is excluded from raycastTargets."""
        self.assertIn("meshBoundStart.raycast = () => {};", self.stickers_src)
        m = re.search(r"const raycastTargets\s*=\s*\[(.*?)\];", self.stickers_src, re.DOTALL)
        self.assertIsNotNone(m, "raycastTargets array definition must exist")
        self.assertNotIn("meshBoundStart", m.group(1), "meshBoundStart must be excluded from raycastTargets")
        for target in ("meshWallL", "meshWallR", "meshExtL", "meshExtR", "meshFloor"):
            self.assertIn(target, m.group(1), f"{target} must be included in raycastTargets")

    def test_03_visual_surface_envelope_and_9_point_footprint_clearance(self):
        """§4.4, §5.2 & AC-05: One-time O(N) visual envelope extraction and O(1) 9-point footprint evaluation."""
        for symbol in (
            "extractVisualSurfaceEnvelope",
            "evaluateFootprintClearance",
            "syncVisualEnvelope",
            "anchorPosition",
            "clearanceMeters",
            "polygonOffsetFactor = -4",
            "polygonOffsetUnits = -4",
        ):
            self.assertIn(symbol, self.stickers_src, f"Missing Spec 048 clearance/envelope symbol: {symbol}")

    def test_04_sandbox_wires_visual_mesh_and_floor_reflector_envelope(self):
        """§5.3 & AC-04: sandbox.js passes visualAlleyMesh and syncs PlanarFloorReflectionMesh envelope."""
        self.assertIn("visualMesh: visualAlleyMesh", self.sandbox_src)
        self.assertIn("sandbox.holographicStickers.syncVisualEnvelope(visualAlleyMesh", self.sandbox_src)
        self.assertIn("resolveStickerExteriorWallProfileZ", self.sandbox_src)


if __name__ == "__main__":
    unittest.main()
