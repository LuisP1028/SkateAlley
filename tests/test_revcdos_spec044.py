#!/usr/bin/env python3
"""
Automated Structural, Binary & Skeletal-Rigging Verification Suite for Functional Specification 044:
Un-Rigged LUIS .glb Auto-Rigging, RenderWare 3.4 .dff/.txd Compilation, and Master ped.ifp Playable
Character Integration for GTA: Vice City (/revcdos/).

Compatible with both `pytest` and `python3 -m unittest`.
"""
import json
import math
import os
import struct
import sys
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import serve_skatealley  # noqa: E402

LUIS_DIR = os.path.join(REPO_ROOT, "revcdos", "vcbr", "luis_player")
FETCHED_GTA3_DIR = os.path.join(REPO_ROOT, "revcdos", "vcsky", "fetched", "models", "gta3.img")
VC_DATA_PATH = os.path.join(REPO_ROOT, "revcdos", "vcbr", "vc-sky-en-v6.data")
SOURCE_GLB_PATH = os.path.join(REPO_ROOT, "LUIS_TPOSE_STANDALONE_BACKUP.glb")


class TestReVCDOSSpec044(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        serve_skatealley.ensure_revcdos_data(REPO_ROOT)
        serve_skatealley.ensure_revcdos_vcsky(REPO_ROOT)
        serve_skatealley.ensure_revcdos_luis_player(REPO_ROOT)
        with open(VC_DATA_PATH, "rb") as f:
            f.seek(103503374)
            cls.stock_dff = f.read(88064)
            f.seek(103591438)
            cls.stock_txd = f.read(45056)
            f.seek(52711611)
            cls.stock_bmp = f.read(66612)

    def test_01_unrigged_source_glb_integrity(self):
        """§4.1: LUIS_TPOSE_STANDALONE_BACKUP.glb is 5,285,932 B, un-rigged (skins: []), with 2 primitives."""
        self.assertTrue(os.path.isfile(SOURCE_GLB_PATH))
        self.assertEqual(os.path.getsize(SOURCE_GLB_PATH), 5285932)
        with open(SOURCE_GLB_PATH, "rb") as f:
            hdr = f.read(20)
            magic, ver, length, j_len, j_type = struct.unpack("<IIIII", hdr)
            self.assertEqual(magic, 0x46546C67)
            self.assertEqual(ver, 2)
            gltf = json.loads(f.read(j_len).decode("utf-8"))
        self.assertEqual(len(gltf.get("skins", [])), 0)
        prims = gltf["meshes"][0]["primitives"]
        self.assertEqual(len(prims), 2)
        self.assertEqual(gltf["accessors"][prims[0]["attributes"]["POSITION"]]["count"], 9650)
        self.assertEqual(gltf["accessors"][prims[1]["attributes"]["POSITION"]]["count"], 5255)

    def test_02_compiled_dff_framelist_hanim_and_inverse_bind_parity(self):
        """§4.3 & §6.1: Compiled player.dff has valid 0x0C02FFFF Clump, verbatim FrameList/HAnim, and 24 inverse-bind matrices."""
        dff_path = os.path.join(LUIS_DIR, "player.dff")
        self.assertTrue(os.path.isfile(dff_path))
        with open(dff_path, "rb") as f:
            dff = f.read()

        self.assertGreater(len(dff), 88064)
        self.assertEqual(len(dff) % 2048, 0)

        cid, csize, cver = struct.unpack_from("<III", dff, 0)
        self.assertEqual(cid, 0x0010)
        self.assertEqual(cver, 0x0C02FFFF)

        # Exact byte-for-byte parity on Clump Struct (12..36) + FrameList (36..3141, 25 frames + 24 HAnim bones)
        self.assertEqual(dff[12:3141], self.stock_dff[12:3141])

        # Inspect Geometry Struct (starts at 3193)
        g_flags, n_tris, n_verts, n_morph, amb, spec, diff = struct.unpack_from("<IIIIfff", dff, 3193)
        self.assertEqual(g_flags, 0x00010037)
        self.assertGreaterEqual(n_verts, 1500)
        self.assertLessEqual(n_verts, 4500)
        self.assertGreaterEqual(n_tris, 2000)
        self.assertLessEqual(n_tris, 6500)
        self.assertEqual(n_morph, 1)

        # Verify vertex bounding box aligns with stock player.dff T-pose bind space
        uv_off = 3193 + 28
        tri_off = uv_off + n_verts * 8
        morph_off = tri_off + n_tris * 8
        pos_off = morph_off + 24
        xs, ys, zs = [], [], []
        for i in range(n_verts):
            x, y, z = struct.unpack_from("<fff", dff, pos_off + i * 12)
            xs.append(x)
            ys.append(y)
            zs.append(z)
        self.assertAlmostEqual(min(xs), -0.873, delta=0.03)
        self.assertAlmostEqual(max(xs), 0.873, delta=0.03)
        self.assertAlmostEqual(min(ys), -0.981, delta=0.02)
        self.assertAlmostEqual(max(ys), 0.855, delta=0.02)
        self.assertGreaterEqual(min(zs), -0.20)
        self.assertLessEqual(max(zs), 0.18)

        # Locate Skin PLG (0x0116) inside Geometry Extension
        geom_struct_size = struct.unpack_from("<I", dff, 3181 + 4)[0]
        mat_list_off = 3181 + 12 + geom_struct_size
        mat_list_size = struct.unpack_from("<I", dff, mat_list_off + 4)[0]
        # Verify MaterialList is identical to stock (1 material referencing "player")
        self.assertEqual(dff[mat_list_off : mat_list_off + 12 + mat_list_size], self.stock_dff[50981:51153])

        ext_off = mat_list_off + 12 + mat_list_size
        ext_cid, ext_size, _ = struct.unpack_from("<III", dff, ext_off)
        self.assertEqual(ext_cid, 0x0003)

        # BinMesh PLG (0x050E) followed by Skin PLG (0x0116)
        bm_off = ext_off + 12
        bm_cid, bm_size, _ = struct.unpack_from("<III", dff, bm_off)
        self.assertEqual(bm_cid, 0x050E)

        skin_off = bm_off + 12 + bm_size
        skin_cid, skin_size, _ = struct.unpack_from("<III", dff, skin_off)
        self.assertEqual(skin_cid, 0x0116)
        self.assertEqual(skin_size, 4 + n_verts * 4 + n_verts * 16 + 24 * 68)

        num_bones, num_used, max_w, pad = struct.unpack_from("<BBBB", dff, skin_off + 12)
        self.assertEqual(num_bones, 24)

        idx_base = skin_off + 16
        w_base = idx_base + n_verts * 4
        inv_base = w_base + n_verts * 16

        used_bones = set()
        for i in range(n_verts):
            b0, b1, b2, b3 = struct.unpack_from("<BBBB", dff, idx_base + i * 4)
            w0, w1, w2, w3 = struct.unpack_from("<ffff", dff, w_base + i * 16)
            w_sum = w0 + w1 + w2 + w3
            self.assertAlmostEqual(w_sum, 1.0, delta=1e-5, msg=f"Vertex {i} weight sum={w_sum}")
            for b, w in ((b0, w0), (b1, w1), (b2, w2), (b3, w3)):
                self.assertLess(b, 24)
                if w > 0:
                    self.assertGreaterEqual(b, 1, "Root bone 0 must not carry skin weight")
                    used_bones.add(b)

        # All 23 anatomical bones (1..23) should be active across the character mesh
        self.assertEqual(used_bones, set(range(1, 24)))

        # Exact byte-for-byte parity on the 24 4x4 inverse-bind matrices (1,632 B)
        stock_inv = self.stock_dff[86101 - 1632 : 86101]
        self.assertEqual(dff[inv_base : inv_base + 1632], stock_inv)

    def test_03_compiled_txd_and_bmp_contracts(self):
        """§4.1: player.txd and player.bmp exist with valid headers and unified texture atlas."""
        txd_path = os.path.join(LUIS_DIR, "player.txd")
        bmp_path = os.path.join(LUIS_DIR, "player.bmp")
        self.assertTrue(os.path.isfile(txd_path))
        self.assertTrue(os.path.isfile(bmp_path))

        with open(txd_path, "rb") as f:
            txd = f.read()
        self.assertEqual(len(txd), 45056)
        self.assertNotEqual(txd, self.stock_txd)
        cid, _, cver = struct.unpack_from("<III", txd, 0)
        self.assertEqual(cid, 0x0016)
        self.assertEqual(cver, 0x1003FFFF)
        tex_name = txd[52 + 8 : 52 + 40].split(b"\x00")[0].decode("ascii")
        self.assertEqual(tex_name, "player")

        with open(bmp_path, "rb") as f:
            bmp = f.read()
        self.assertEqual(len(bmp), 66612)
        self.assertNotEqual(bmp, self.stock_bmp)
        self.assertEqual(bmp[:54], self.stock_bmp[:54])

    def test_04_mirrored_outfit_and_cutscene_files(self):
        """§4.4: Outfit (player2..9) and cutscene (csplay2..11) .dff/.txd files match compiled LUIS binaries."""
        dff_size = os.path.getsize(os.path.join(LUIS_DIR, "player.dff"))
        txd_size = os.path.getsize(os.path.join(LUIS_DIR, "player.txd"))
        targets = [f"player{i}" for i in range(2, 10)] + [f"csplay{i}" for i in range(2, 12)]
        for base in targets:
            self.assertEqual(os.path.getsize(os.path.join(FETCHED_GTA3_DIR, f"{base}.dff")), dff_size)
            self.assertEqual(os.path.getsize(os.path.join(FETCHED_GTA3_DIR, f"{base}.txd")), txd_size)


if __name__ == "__main__":
    unittest.main(verbosity=2)
