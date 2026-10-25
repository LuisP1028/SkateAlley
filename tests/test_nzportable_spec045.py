#!/usr/bin/env python3
"""
Automated End-to-End Binary & Integration Verification Suite for Functional Specification 045:
Un-Rigged LUIS .glb Modular Limb Partitioning, 211/127-Frame Quake IDPO .mdl Compilation,
and Zombie AI Model Replacement for Nazi Zombies: Portable (/nzportable/).

Compatible with both `pytest` and `python3 -m unittest`.
"""

import hashlib
import http.client
import json
import math
import os
import struct
import sys
import threading
import unittest
import zipfile

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import serve_skatealley  # noqa: E402

STANDING_MODELS = {
    "models/ai/zb%.mdl": (250, 650, 211),
    "models/ai/zh^.mdl": (80, 280, 211),
    "models/ai/zal(.mdl": (50, 160, 211),
    "models/ai/zar(.mdl": (50, 160, 211),
    "models/ai/zfull.mdl": (400, 1000, 211),
}

CRAWLER_MODELS = {
    "models/ai/zbc%.mdl": (200, 500, 127),
    "models/ai/zhc^.mdl": (80, 280, 127),
    "models/ai/zalc(.mdl": (50, 160, 127),
    "models/ai/zarc(.mdl": (50, 160, 127),
    "models/ai/zcfull.mdl": (350, 850, 127),
}

ALL_ZOMBIE_SPECS = {**STANDING_MODELS, **CRAWLER_MODELS}


def compute_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(4 * 1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


class TestNZPortableSpec045(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_cwd = os.getcwd()
        os.chdir(REPO_ROOT)
        serve_skatealley.ensure_nzportable_game_pk3(REPO_ROOT)
        cls.pk3_path = os.path.join(REPO_ROOT, "nzportable", "nzp", "luis_zombies.pk3")

        cls.httpd = serve_skatealley.ThreadingHTTPServer(
            ("127.0.0.1", 0), serve_skatealley.SkateAlleyRequestHandler
        )
        cls.port = cls.httpd.server_address[1]
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.server_thread.start()

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "httpd"):
            cls.httpd.shutdown()
            cls.httpd.server_close()
        os.chdir(cls.orig_cwd)

    def test_01_unrigged_source_glb_integrity(self):
        """§4.1: Verify LUIS_TPOSE_STANDALONE_BACKUP.glb exists, is un-rigged, and has 14,905 verts / 20,018 tris."""
        glb_path = os.path.join(REPO_ROOT, "LUIS_TPOSE_STANDALONE_BACKUP.glb")
        self.assertTrue(os.path.isfile(glb_path), "Missing LUIS_TPOSE_STANDALONE_BACKUP.glb")
        with open(glb_path, "rb") as f:
            header = f.read(20)
            magic, version, _ = struct.unpack_from("<4sII", header, 0)
            self.assertEqual(magic, b"glTF")
            self.assertEqual(version, 2)
            j_len = struct.unpack_from("<I", header, 12)[0]
            gltf = json.loads(f.read(j_len).decode("utf-8"))

        self.assertFalse(gltf.get("skins"), "Source GLB must be un-rigged (zero skins)")
        prims = gltf["meshes"][0]["primitives"]
        self.assertEqual(len(prims), 2)
        total_verts = sum(gltf["accessors"][p["attributes"]["POSITION"]]["count"] for p in prims)
        total_tris = sum(gltf["accessors"][p["indices"]]["count"] // 3 for p in prims)
        self.assertEqual(total_verts, 14905)
        self.assertEqual(total_tris, 20018)
        self.assertEqual(len(gltf.get("images", [])), 2)

    def test_02_luis_zombies_pk3_packaging_and_pack_json_contract(self):
        """§4.3 & §5: Verify luis_zombies.pk3 exists (< 5 MB), is ZIP_STORED, and matches pack.json."""
        self.assertTrue(os.path.isfile(self.pk3_path), "Missing nzportable/nzp/luis_zombies.pk3")
        size = os.path.getsize(self.pk3_path)
        self.assertGreater(size, 500_000)
        self.assertLess(size, 5 * 1024 * 1024, "luis_zombies.pk3 must be < 5 MB")

        sha256 = compute_sha256(self.pk3_path)
        pack_path = os.path.join(REPO_ROOT, "nzportable", "pack.json")
        with open(pack_path, "r", encoding="utf-8") as f:
            pack = json.load(f)

        self.assertIn("nzp/luis_zombies.pk3", pack["files"])
        entry = pack["files"]["nzp/luis_zombies.pk3"]
        self.assertEqual(entry["path"], "nzp/luis_zombies.pk3")
        self.assertEqual(entry["url"], "./nzp/luis_zombies.pk3")
        self.assertEqual(entry["size"], size)
        self.assertEqual(entry["sha256"], sha256)
        self.assertEqual(entry["hash"], sha256[:16])

    def test_03_all_10_mdl_binary_headers_skins_stverts_triangles_and_frames(self):
        """§3.1, §3.2 & §6.1: Verify all 10 compiled .mdl files satisfy Quake 1 IDPO v6 binary contracts."""
        with zipfile.ZipFile(self.pk3_path, "r") as zf:
            self.assertIsNone(zf.testzip())
            names = set(zf.namelist())
            for mdl_path, (min_v, max_v, expected_frames) in ALL_ZOMBIE_SPECS.items():
                self.assertIn(mdl_path, names, f"Missing {mdl_path} in luis_zombies.pk3")
                info = zf.getinfo(mdl_path)
                self.assertEqual(info.compress_type, zipfile.ZIP_STORED)

                data = zf.read(mdl_path)
                self.assertGreater(len(data), 84)
                ident, version = struct.unpack_from("<4si", data, 0)
                self.assertEqual(ident, b"IDPO")
                self.assertEqual(version, 6)

                scale = struct.unpack_from("<3f", data, 8)
                origin = struct.unpack_from("<3f", data, 20)
                for s_val in scale:
                    self.assertGreater(s_val, 0.0)
                    self.assertFalse(math.isnan(s_val))
                for o_val in origin:
                    self.assertFalse(math.isnan(o_val))

                numskins, skinw, skinh, numverts, numtris, numframes, synctype, flags, size = (
                    struct.unpack_from("<iiiiiiiif", data, 48)
                )
                self.assertEqual(numskins, 1)
                self.assertEqual(skinw, 256)
                self.assertEqual(skinh, 256)
                self.assertEqual(skinw % 4, 0)
                self.assertEqual(skinh % 4, 0)
                self.assertGreaterEqual(numverts, min_v, f"{mdl_path} numverts {numverts} < {min_v}")
                self.assertLessEqual(numverts, max_v, f"{mdl_path} numverts {numverts} > {max_v}")
                self.assertGreater(numtris, 50)
                self.assertEqual(numframes, expected_frames, f"{mdl_path} frame count mismatch")

                expected_bytes = (
                    84
                    + numskins * (4 + skinw * skinh)
                    + numverts * 12
                    + numtris * 16
                    + numframes * (28 + numverts * 4)
                )
                self.assertEqual(len(data), expected_bytes, f"Exact byte size mismatch for {mdl_path}")

                # Verify non-blank palette skin (indices 0..223)
                skin_group = struct.unpack_from("<i", data, 84)[0]
                self.assertEqual(skin_group, 0)
                skin_bytes = data[88 : 88 + skinw * skinh]
                unique_colors = set(skin_bytes)
                self.assertGreater(len(unique_colors), 25, "Skin must not be blank or monochrome")
                self.assertLessEqual(max(unique_colors), 223, "Skin must exclude fullbright indices 224..255")

                # Verify stverts
                st_off = 88 + skinw * skinh
                st_coords = []
                for v_i in range(numverts):
                    onseam, s_coord, t_coord = struct.unpack_from("<3i", data, st_off + v_i * 12)
                    self.assertIn(onseam, (0, 0x20))
                    self.assertGreaterEqual(s_coord, 0)
                    self.assertLess(s_coord, skinw)
                    self.assertGreaterEqual(t_coord, 0)
                    self.assertLess(t_coord, skinh)
                    st_coords.append((s_coord, t_coord))

                # Verify triangles & Spec 046 Fix 1: 0% cross-hemisphere / cross-island UV stretch
                tri_off = st_off + numverts * 12
                tris = []
                for t_i in range(numtris):
                    facesfront, v0, v1, v2 = struct.unpack_from("<4i", data, tri_off + t_i * 16)
                    self.assertIn(facesfront, (0, 1))
                    for vi in (v0, v1, v2):
                        self.assertGreaterEqual(vi, 0)
                        self.assertLess(vi, numverts)
                    self.assertEqual(len({v0, v1, v2}), 3, f"Degenerate triangle in {mdl_path}")
                    s0, t0 = st_coords[v0]
                    s1, t1 = st_coords[v1]
                    s2, t2 = st_coords[v2]
                    s_min, s_max = min(s0, s1, s2), max(s0, s1, s2)
                    self.assertFalse(
                        s_min < 128 and s_max >= 128,
                        f"Triangle {t_i} in {mdl_path} crosses Front/Back s=128 hemisphere boundary ({s0}, {s1}, {s2})",
                    )
                    self.assertLessEqual(
                        s_max - s_min, 95, f"Triangle {t_i} in {mdl_path} has excessive UV s-span ({s_max - s_min}px)"
                    )
                    tris.append((v0, v1, v2))

                # Verify all animation frames, lightnormalindex & Spec 046 Fix 4: bounded edge lengths (no Frame 45 explosion)
                frame_off = tri_off + numtris * 16
                f0_coords = []
                f_mid_coords = []
                mid_f = expected_frames // 2
                sample_frames = {0, 10, 45, mid_f, expected_frames - 1}
                for f_i in range(numframes):
                    ftype = struct.unpack_from("<i", data, frame_off)[0]
                    self.assertEqual(ftype, 0)
                    raw_name = data[frame_off + 12 : frame_off + 28].split(b"\x00")[0].decode("ascii")
                    self.assertEqual(raw_name, f"frame_{f_i}")
                    v_base = frame_off + 28
                    cur_coords = []
                    for v_i in range(numverts):
                        vx, vy, vz, lni = struct.unpack_from("<4B", data, v_base + v_i * 4)
                        self.assertLess(lni, 162, f"Invalid lightnormalindex {lni} in {mdl_path}")
                        if f_i in sample_frames:
                            pt = (
                                vx * scale[0] + origin[0],
                                vy * scale[1] + origin[1],
                                vz * scale[2] + origin[2],
                            )
                            cur_coords.append(pt)
                            if f_i == 0:
                                f0_coords.append(pt)
                            elif f_i == mid_f:
                                f_mid_coords.append(pt)
                    if f_i in sample_frames:
                        for v0, v1, v2 in tris:
                            p0, p1, p2 = cur_coords[v0], cur_coords[v1], cur_coords[v2]
                            max_e = max(math.dist(p0, p1), math.dist(p1, p2), math.dist(p2, p0))
                            self.assertLessEqual(
                                max_e,
                                18.0,
                                f"Triangle explosion in {mdl_path} frame {f_i}: max edge {max_e:.2f} > 18.0 Quake units",
                            )
                    frame_off += 28 + numverts * 4

                # Verify dynamic multi-frame deformation (not a static 1-frame pose repeated)
                disp = sum(
                    math.dist(f0_coords[i], f_mid_coords[i]) for i in range(numverts)
                ) / numverts
                self.assertGreater(
                    disp, 1.5, f"{mdl_path} frames 0 and {mid_f} show insufficient animation motion ({disp:.2f})"
                )

    def test_04_world_bbox_and_dismemberment_seam_alignment(self):
        """§2, §3.1 & §5: Verify Frame 0 world bounding boxes and < 1.5 Quake unit seam gap at neck/shoulders."""
        f0_verts = {}
        with zipfile.ZipFile(self.pk3_path, "r") as zf:
            for mdl_path in ("models/ai/zb%.mdl", "models/ai/zh^.mdl", "models/ai/zal(.mdl", "models/ai/zar(.mdl", "models/ai/zfull.mdl"):
                data = zf.read(mdl_path)
                scale = struct.unpack_from("<3f", data, 8)
                origin = struct.unpack_from("<3f", data, 20)
                numskins, skinw, skinh, numverts, numtris, _, _, _, _ = struct.unpack_from("<iiiiiiiif", data, 48)
                v_base = 84 + numskins * (4 + skinw * skinh) + numverts * 12 + numtris * 16 + 28
                pts = []
                for v_i in range(numverts):
                    vx, vy, vz, _ = struct.unpack_from("<4B", data, v_base + v_i * 4)
                    pts.append((vx * scale[0] + origin[0], vy * scale[1] + origin[1], vz * scale[2] + origin[2]))
                f0_verts[mdl_path] = pts

        zfull_pts = f0_verts["models/ai/zfull.mdl"]
        zs = [p[2] for p in zfull_pts]
        ys = [p[1] for p in zfull_pts]
        self.assertAlmostEqual(min(zs), -32.6, delta=1.5)
        self.assertAlmostEqual(max(zs), 40.1, delta=1.5)
        # Spec 046 Fix 3: Uniform isotropic scaling preserves LUIS's true torso width (no 1.73x horizontal bloat)
        zb_pts = f0_verts["models/ai/zb%.mdl"]
        zb_torso_ys = [p[1] for p in zb_pts if p[2] > 0.0]
        zb_torso_width = max(zb_torso_ys) - min(zb_torso_ys)
        self.assertGreaterEqual(zb_torso_width, 12.0)
        self.assertLessEqual(zb_torso_width, 17.5, f"zb%.mdl torso width ({zb_torso_width:.2f}) indicates horizontal bloat")
        self.assertGreaterEqual(max(ys) - min(ys), 18.0)
        self.assertLessEqual(max(ys) - min(ys), 28.5)

        for limb_path in ("models/ai/zh^.mdl", "models/ai/zal(.mdl", "models/ai/zar(.mdl"):
            limb_pts = f0_verts[limb_path]
            min_gap = min(math.dist(lp, bp) for lp in limb_pts for bp in zb_pts)
            self.assertLess(
                min_gap,
                1.5,
                f"Seam gap between {limb_path} and zb%.mdl ({min_gap:.3f}) exceeds 1.5 Quake unit budget",
            )

    def test_05_pcx_skin_overrides_and_live_http_serving(self):
        """Verify zfull.mdl_0..3.pcx skin overrides in luis_zombies.pk3 and live HTTP serving."""
        with zipfile.ZipFile(self.pk3_path, "r") as zf:
            names = set(zf.namelist())
            for i in range(4):
                pcx_name = f"models/ai/zfull.mdl_{i}.pcx"
                hint_name = f"models/ai/zfull.mdl_{i}.palhint"
                self.assertIn(pcx_name, names)
                self.assertIn(hint_name, names)
                pcx = zf.read(pcx_name)
                mfg, ver, enc, bpp, xmin, ymin, xmax, ymax = struct.unpack_from("<BBBBHHHH", pcx, 0)
                self.assertEqual((mfg, ver, enc, bpp), (10, 5, 1, 8))
                self.assertEqual(xmax - xmin + 1, 256)
                self.assertEqual(ymax - ymin + 1, 256)
                self.assertEqual(pcx[-769], 0x0C)

        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            conn.request("HEAD", "/nzportable/nzp/luis_zombies.pk3")
            resp = conn.getresponse()
            resp.read()
            self.assertEqual(resp.status, 200)
            self.assertEqual(int(resp.getheader("Content-Length", "-1")), os.path.getsize(self.pk3_path))
        finally:
            conn.close()

    def test_06_spec046_root_visual_comparison_png_exists_and_valid(self):
        """Spec 046 §6: Verify 00_luis_zombie_mdl_comparison.png exists at root and has valid PNG dimensions."""
        for png_name in ("00_luis_zombie_mdl_comparison.png", "luis_glb_vs_current_mdl_comparison.png"):
            p = os.path.join(REPO_ROOT, png_name)
            self.assertTrue(os.path.isfile(p), f"Missing root visual comparison PNG: {p}")
            self.assertGreater(os.path.getsize(p), 50_000)
            with open(p, "rb") as f:
                hdr = f.read(24)
            self.assertEqual(hdr[:8], b"\x89PNG\r\n\x1a\n")
            w, h = struct.unpack(">II", hdr[16:24])
            self.assertGreaterEqual(w, 1600)
            self.assertGreaterEqual(h, 500)


if __name__ == "__main__":
    unittest.main(verbosity=2)
