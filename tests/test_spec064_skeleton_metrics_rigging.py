#!/usr/bin/env python3
"""
Verification suite for functional_specification_064.md:
Post-Assembly Character-Specific Skeleton Metrics & Tailored Multi-Game Auto-Rigging.

Verifies:
- AC-01: Post-Assembly `skeleton_metrics` Emission & Schema Completeness (29 landmarks, Z-up / Y-up parity < 1e-5m, < 0.25s profiling budget).
- AC-02: Character-Specific Proportion Discrimination (`NICOTEST` A-pose vs `LUIS` T-pose, arm elevation angles, crotch & knee heights, <= 0.015m cross-section centroid accuracy).
- AC-03: Pose-Matched Stage 5 Intake & Standalone `.glb` Fallback (`preferred_pose="apose"` vs `"tpose"`, dual-pose resolution, and < 0.20s pure-NumPy fallback).
- AC-04: End-to-End Tailored Rigging Across All 5 Target Games (`alleyway`, `skate3`, `gta`, `zombies`, `melee`).
"""

import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
import unittest

import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCRIPTS_DIR = os.path.join(PROJECT_ROOT, "scripts")
BUILDERS_DIR = os.path.join(SCRIPTS_DIR, "builders")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)
if BUILDERS_DIR not in sys.path:
    sys.path.insert(0, BUILDERS_DIR)

import gcs_rig_intake
import assemble_characters

NICOTEST_GLB = "/Users/diesel/Desktop/Greek/outputs/nicotest_run_01/meshes/assembled/character_full.glb"
NICOTEST_TELEM = "/Users/diesel/Desktop/Greek/outputs/nicotest_run_01/meshes/assembled/assembly_telemetry.json"
LUIS_GLB = "/Users/diesel/Desktop/Greek/LUIS_ASSEMBLED.glb"


class TestSpec064SkeletonMetricsRigging(unittest.TestCase):
    def test_ac01_skeleton_metrics_schema_and_coordinate_parity(self):
        """AC-01: Verify 29 landmarks, schema completeness, <0.25s budget, and <1e-5m Z-up/Y-up parity."""
        self.assertTrue(os.path.isfile(NICOTEST_TELEM), f"Missing {NICOTEST_TELEM}")
        with open(NICOTEST_TELEM, "r", encoding="utf-8") as f:
            telem = json.load(f)

        self.assertIn("skeleton_metrics", telem)
        sm = telem["skeleton_metrics"]
        self.assertTrue(gcs_rig_intake._is_valid_skeleton_metrics(sm))

        self.assertEqual(sm["schema_version"], "1.0")
        self.assertAlmostEqual(float(sm["stature_meters"]), 2.0, places=4)
        self.assertLess(float(sm.get("profiling_elapsed_sec", 0.0)), 0.25)

        joints_z = sm["joints_z_up"]
        joints_y = sm["joints_y_up"]
        self.assertEqual(len(gcs_rig_intake.REQUIRED_SKELETON_LANDMARKS), 29)
        for lm in gcs_rig_intake.REQUIRED_SKELETON_LANDMARKS:
            self.assertIn(lm, joints_z, f"Missing landmark {lm} in joints_z_up")
            self.assertIn(lm, joints_y, f"Missing landmark {lm} in joints_y_up")
            xz, yz, zz = [float(c) for c in joints_z[lm]]
            xy, yy, zy = [float(c) for c in joints_y[lm]]
            err = max(abs(xy - xz), abs(yy - zz), abs(zy - (-yz)))
            self.assertLessEqual(
                err,
                1e-5,
                f"Coordinate parity breach on {lm}: Z-up={joints_z[lm]} vs Y-up={joints_y[lm]} (err={err})",
            )

    def test_ac02_character_proportion_discrimination_and_centroid_accuracy(self):
        """AC-02: Verify A-pose vs T-pose discrimination and cross-section centroid accuracy <= 0.015m."""
        t0 = time.perf_counter()
        nico_sm = gcs_rig_intake.compute_skeleton_metrics_from_glb(NICOTEST_GLB)
        nico_elapsed = time.perf_counter() - t0

        t1 = time.perf_counter()
        luis_sm = gcs_rig_intake.compute_skeleton_metrics_from_glb(LUIS_GLB)
        luis_elapsed = time.perf_counter() - t1

        self.assertLess(nico_elapsed, 0.20)
        self.assertLess(luis_elapsed, 0.20)

        # Pose discrimination
        self.assertEqual(nico_sm["pose_type"], "A_POSE")
        self.assertTrue(nico_sm["is_apose"])
        nico_deg = float(nico_sm["arm_elevation_deg"]["mean"])
        self.assertGreaterEqual(nico_deg, -50.0)
        self.assertLessEqual(nico_deg, -20.0)

        self.assertEqual(luis_sm["pose_type"], "T_POSE")
        self.assertFalse(luis_sm["is_apose"])
        luis_deg = float(luis_sm["arm_elevation_deg"]["mean"])
        self.assertGreaterEqual(luis_deg, -12.0)
        self.assertLessEqual(luis_deg, 12.0)

        # Crotch and knee height discrimination
        for label, sm in [("NICOTEST", nico_sm), ("LUIS", luis_sm)]:
            z_crotch = float(sm["joints_z_up"]["crotch"][2])
            z_knee_l = float(sm["joints_z_up"]["knee_l"][2])
            z_knee_r = float(sm["joints_z_up"]["knee_r"][2])
            self.assertGreaterEqual(z_crotch, 0.62, f"{label} crotch Z too low: {z_crotch}")
            self.assertLessEqual(z_crotch, 0.82, f"{label} crotch Z too high: {z_crotch}")
            self.assertGreaterEqual(z_knee_l, 0.34, f"{label} knee_l Z too low: {z_knee_l}")
            self.assertLessEqual(z_knee_l, 0.48, f"{label} knee_l Z too high: {z_knee_l}")
            self.assertGreaterEqual(z_knee_r, 0.34, f"{label} knee_r Z too low: {z_knee_r}")
            self.assertLessEqual(z_knee_r, 0.48, f"{label} knee_r Z too high: {z_knee_r}")

        # Verify distinct proportions between NICOTEST and LUIS
        self.assertNotAlmostEqual(
            float(nico_sm["joints_z_up"]["crotch"][2]),
            float(luis_sm["joints_z_up"]["crotch"][2]),
            places=2,
        )
        self.assertNotAlmostEqual(
            float(nico_sm["joints_z_up"]["knee_l"][2]),
            float(luis_sm["joints_z_up"]["knee_l"][2]),
            places=2,
        )

        # Verify shoulder/elbow/wrist centroids lie within <= 0.015m of actual mesh cross-section centroids
        for glb_path, sm in [(NICOTEST_GLB, nico_sm), (LUIS_GLB, luis_sm)]:
            with open(glb_path, "rb") as f:
                raw = f.read()
            import struct
            _, _, _, j_len, _ = struct.unpack("<4sIIII", raw[:20])
            gltf = json.loads(raw[20 : 20 + j_len].decode("utf-8"))
            b_start = 20 + j_len + 8
            bin_buf = raw[b_start:]
            accessors = gltf["accessors"]
            bvs = gltf["bufferViews"]
            v_list = []
            all_meshes = gltf["meshes"]
            for mesh in all_meshes:
                m_name = str(mesh.get("name") or "").lower()
                if len(all_meshes) > 1 and any(t in m_name for t in ("companion", "prop", "weapon", "skateboard", "board")):
                    continue
                for prim in mesh["primitives"]:
                    acc = accessors[prim["attributes"]["POSITION"]]
                    bv = bvs[acc["bufferView"]]
                    off = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
                    arr = np.frombuffer(bin_buf, dtype=np.float32, count=acc["count"] * 3, offset=off).reshape(-1, 3)
                    v_list.append(arr)
            v_y = np.vstack(v_list).astype(np.float64)
            # Convert Y-up to Z-up and standardize to 2.0m
            v_z = np.column_stack([v_y[:, 0], -v_y[:, 2], v_y[:, 1]])
            z_min, z_max = float(v_z[:, 2].min()), float(v_z[:, 2].max())
            s = 2.0 / max(1e-6, z_max - z_min)
            v_z[:, 0] = (v_z[:, 0] - 0.5 * (v_z[:, 0].min() + v_z[:, 0].max())) * s
            v_z[:, 1] = (v_z[:, 1] - 0.5 * (v_z[:, 1].min() + v_z[:, 1].max())) * s
            v_z[:, 2] = (v_z[:, 2] - z_min) * s

            for j_name in ["shoulder_l", "shoulder_r", "elbow_l", "elbow_r", "wrist_l", "wrist_r"]:
                j_pt = np.asarray(sm["joints_z_up"][j_name], dtype=np.float64)
                # Find local mesh cross-section vertices near j_pt and compute hollow-tube axis center
                z_tol = 0.070 if "shoulder" in j_name else 0.18
                dists_x = np.abs(v_z[:, 0] - j_pt[0])
                dists_z = np.abs(v_z[:, 2] - j_pt[2])
                local_mask = (dists_x <= 0.030) & (dists_z <= z_tol)
                self.assertGreater(int(np.count_nonzero(local_mask)), 5, f"Empty cross section at {j_name}")
                pts = v_z[local_mask]
                local_centroid = 0.5 * (np.percentile(pts, 10.0, axis=0) + np.percentile(pts, 90.0, axis=0))
                err = float(np.linalg.norm(j_pt - local_centroid))
                self.assertLessEqual(err, 0.015, f"{j_name} centroid error {err:.4f}m > 0.015m")

    def test_ac03_pose_matched_intake_and_standalone_fallback(self):
        """AC-03: Verify preferred_pose selection, dual-pose resolution, and standalone .glb fallback."""
        # 1. Standalone .glb without telemetry
        with tempfile.TemporaryDirectory() as tmpdir:
            standalone_glb = os.path.join(tmpdir, "standalone_luis.glb")
            shutil.copy2(LUIS_GLB, standalone_glb)
            t0 = time.perf_counter()
            intake = gcs_rig_intake.intake_assembled_character_for_rigging(
                glb_path=standalone_glb,
                preferred_pose="tpose",
                target_game="gta",
            )
            elapsed = time.perf_counter() - t0
            self.assertLess(elapsed, 0.25)
            self.assertEqual(intake["resolved_pose"], "tpose")
            self.assertTrue(gcs_rig_intake._is_valid_skeleton_metrics(intake["skeleton_metrics"]))
            self.assertEqual(intake["skeleton_metrics"]["pose_type"], "T_POSE")

        # 2. Dual-pose directory with both character_apose.glb and character_tpose.glb
        with tempfile.TemporaryDirectory() as tmpdir:
            apose_glb = os.path.join(tmpdir, "character_apose.glb")
            tpose_glb = os.path.join(tmpdir, "character_tpose.glb")
            full_glb = os.path.join(tmpdir, "character_full.glb")
            shutil.copy2(NICOTEST_GLB, apose_glb)
            shutil.copy2(LUIS_GLB, tpose_glb)
            shutil.copy2(NICOTEST_GLB, full_glb)

            apose_sm = gcs_rig_intake.compute_skeleton_metrics_from_glb(apose_glb)
            tpose_sm = gcs_rig_intake.compute_skeleton_metrics_from_glb(tpose_glb)
            with open(os.path.join(tmpdir, "assembly_apose_telemetry.json"), "w", encoding="utf-8") as f:
                json.dump({"status": "COMPLETE", "skeleton_metrics": apose_sm}, f)
            with open(os.path.join(tmpdir, "assembly_tpose_telemetry.json"), "w", encoding="utf-8") as f:
                json.dump({"status": "COMPLETE", "skeleton_metrics": tpose_sm}, f)
            with open(os.path.join(tmpdir, "assembly_telemetry.json"), "w", encoding="utf-8") as f:
                json.dump({"status": "COMPLETE", "skeleton_metrics": apose_sm}, f)

            # Request A-pose (e.g. Skate 3)
            intake_a = gcs_rig_intake.intake_assembled_character_for_rigging(
                glb_path=full_glb,
                preferred_pose="apose",
                target_game="skate3",
            )
            self.assertEqual(intake_a["resolved_pose"], "apose")
            self.assertEqual(os.path.basename(intake_a["local_glb_path"]), "character_apose.glb")
            self.assertEqual(intake_a["skeleton_metrics"]["pose_type"], "A_POSE")

            # Request T-pose (e.g. GTA / Zombies / Alleyway)
            intake_t = gcs_rig_intake.intake_assembled_character_for_rigging(
                glb_path=full_glb,
                preferred_pose="tpose",
                target_game="gta",
            )
            self.assertEqual(intake_t["resolved_pose"], "tpose")
            self.assertEqual(os.path.basename(intake_t["local_glb_path"]), "character_tpose.glb")
            self.assertEqual(intake_t["skeleton_metrics"]["pose_type"], "T_POSE")

    def test_ac04_end_to_end_tailored_rigging_across_all_5_games(self):
        """AC-04: Verify all 5 game riggers consume skeleton_metrics and emit telemetry with skeleton_metrics."""
        import rig_skate3_character
        import compile_luis_revcdos_player
        import compile_luis_zombies_mdl
        import rig_melee_character
        import rig_characters

        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Skate 3 rigger
            s3_out = os.path.join(tmpdir, "skate3_nicotest.glb")
            s3_telem = rig_skate3_character.rig_glb_to_skate3(
                input_glb_path=NICOTEST_GLB,
                output_glb_path=s3_out,
                character_name="NICOTEST",
                skeleton_metrics=gcs_rig_intake.compute_skeleton_metrics_from_glb(NICOTEST_GLB),
            )
            self.assertTrue(os.path.isfile(s3_out))
            self.assertEqual(s3_telem["joint_count"], 35)
            self.assertIn("skeleton_metrics", s3_telem)
            self.assertEqual(s3_telem["skeleton_metrics"]["pose_type"], "A_POSE")

            # 2. GTA: Vice City rigger
            gta_res = compile_luis_revcdos_player.rig_assembled_glb_for_gta(
                glb_path=NICOTEST_GLB,
                telemetry_path=NICOTEST_TELEM,
                char_id="NICOTEST",
                output_dir=os.path.join(tmpdir, "gta_out"),
                sync_audit=False,
            )
            self.assertIn(gta_res["status"], ("SUCCESS", "COMPLETE"))
            self.assertIn("skeleton_metrics", gta_res)
            self.assertEqual(gta_res["skeleton_metrics"]["pose_type"], "A_POSE")
            self.assertIn(gta_res["resolved_pose"], ("tpose", "full", "apose"))

            # 3. Call of Duty: Nazi Zombies rigger (test helper & metric consumption)
            nico_sm = gcs_rig_intake.compute_skeleton_metrics_from_glb(NICOTEST_GLB)
            pos0, uv0, tris0, pos1, uv1, tris1, *_ = compile_luis_zombies_mdl.load_luis_glb(
                NICOTEST_GLB,
                skeleton_metrics=nico_sm,
            )
            self.assertGreater(len(pos0) + len(pos1), 1000)
            total_h = max(float(pos0[:, 1].max()), float(pos1[:, 1].max())) - min(float(pos0[:, 1].min()), float(pos1[:, 1].min()))
            self.assertAlmostEqual(total_h, 2.0, places=2)

            # 4. Super Smash Bros. Melee rigger (Captain Falcon 'Ca')
            melee_telem = rig_melee_character.rig_character_for_melee_fighter(
                player_folder="nicotest_nt01",
                run_id="run_01",
                fighter_code="Ca",
                glb_path=NICOTEST_GLB,
                force_rebuild=True,
                sync_gcs=False,
            )
            self.assertEqual(melee_telem["status"], "ok")
            self.assertLess(melee_telem["max_ibm_orthogonality_error"], 1e-4)
            self.assertLessEqual(melee_telem["max_envelopes_per_pobj"], 10)
            self.assertIn("skeleton_metrics", melee_telem)
            self.assertEqual(melee_telem["skeleton_metrics"]["pose_type"], "A_POSE")

            # 5. The Alleyway rigger (Blender headless)
            alley_out_dir = os.path.join(tmpdir, "alleyway_out")
            alley_res = rig_characters.rig_assembled_glb_for_alleyway(
                glb_path=NICOTEST_GLB,
                telemetry_path=NICOTEST_TELEM,
                char_id="NICOTEST",
                output_dir=alley_out_dir,
            )
            self.assertIn(alley_res["status"], ("SUCCESS", "COMPLETE"))
            self.assertIn("skeleton_metrics", alley_res)
            self.assertEqual(alley_res["skeleton_metrics"]["pose_type"], "A_POSE")


if __name__ == "__main__":
    unittest.main(verbosity=2)
