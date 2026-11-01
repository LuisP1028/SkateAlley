#!/usr/bin/env python3
"""Idempotent RVZ-to-ISO decompression, GALE01 revision header normalization,
font-table signature verification, and multi-worktree provisioning for
Super Smash Bros. Melee (doldecomp/melee + aurora WebGPU at /melee/).
"""

import argparse
import hashlib
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile

SHARED_WORKSPACE_ROOT = "/Users/diesel/Desktop/SkateAlley"
SHARED_MELEE_DIR = os.path.join(SHARED_WORKSPACE_ROOT, "melee")
SOURCE_ZIP_PATH = os.path.join(SHARED_WORKSPACE_ROOT, "SUPERSMASH.zip")
SOURCE_RVZ_ENTRY_NAME = "Super Smash Bros. Melee (USA) (En,Ja).rvz"

SCRATCH_SPIKE_ISO_PATH = (
    "/Users/diesel/.gemini/antigravity-cli/brain/"
    "bbfa5107-c72b-4823-853d-f3cbeb6b2428/scratch/melee_spike/game.iso"
)

MELEE_SOURCE_ZIP_EXPECTED_SIZE = 1132538730
MELEE_RVZ_EXPECTED_SIZE = 1133221900
MELEE_ISO_EXPECTED_SIZE = 1459978240
MELEE_ISO_UNPATCHED_SHA1 = "5ab1553a941307bb949020fd582b68aabebecb30"

MELEE_WASM_EXPECTED_SIZE = 16353806
MELEE_WASM_EXPECTED_SHA1 = "ee228f56c874253d1eee3ed5a4be41075259f4aa"
MELEE_JS_EXPECTED_SIZE = 528343
MELEE_JS_EXPECTED_SHA1 = "005e9316995be14bce1190c62ab5f4ecfeb22137"

GC_MAGIC = b"\xc2\x33\x9f\x3d"
MELEE_DOL_OFFSET = 0x1CD00
MELEE_FST_OFFSET = 0x453400
MELEE_FST_SIZE = 29993
MELEE_DEBUG_FONT_MARK_OFFSET = MELEE_DOL_OFFSET + 0x4038D8
MELEE_DEBUG_FONT_MARKS = (0x10808000, 0x46808000, 0x7C808000, 0xB3808000)
MELEE_KERN_SIG_OFFSET = MELEE_DOL_OFFSET + 0x407B40
MELEE_KERN_SIG = bytes([0x09, 0x08, 0x09, 0x0C, 0x09, 0x08, 0x08, 0x08])

TRACKED_REL_PATHS = (
    "index.html",
    "shell.mjs",
    "disc-cache.mjs",
    "coi-sw.js",
    "melee_browser.js",
    "melee_browser.wasm",
    "_headers",
)

GIT_IGNORED_ARTIFACTS = (
    "game.iso",
)

RVZ2ISO_C_SOURCE = r"""
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <zstd.h>
#include <CommonCrypto/CommonDigest.h>

#define LFG_K 521
#define LFG_K_BYTES (LFG_K * 4)
#define LFG_J 32
#define SEED_SIZE 17
#define SEED_SIZE_BYTES (SEED_SIZE * 4)
#define SECTOR_SIZE 0x8000

typedef struct {
    uint32_t buffer[LFG_K];
    size_t position;
} LFG;

static inline uint32_t be32(const uint8_t* p) {
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

static inline uint64_t be64(const uint8_t* p) {
    return ((uint64_t)be32(p) << 32) | (uint64_t)be32(p + 4);
}

static void lfg_forward(LFG* lfg) {
    for (size_t i = 0; i < LFG_J; i++) {
        lfg->buffer[i] ^= lfg->buffer[i + LFG_K - LFG_J];
    }
    for (size_t i = LFG_J; i < LFG_K; i++) {
        lfg->buffer[i] ^= lfg->buffer[i - LFG_J];
    }
}

static void lfg_init(LFG* lfg, const uint8_t* seed_bytes) {
    for (size_t i = 0; i < SEED_SIZE; i++) {
        lfg->buffer[i] = be32(seed_bytes + i * 4);
    }
    for (size_t i = SEED_SIZE; i < LFG_K; i++) {
        lfg->buffer[i] = (lfg->buffer[i - SEED_SIZE] << 23)
                       ^ (lfg->buffer[i - SEED_SIZE + 1] >> 9)
                       ^ lfg->buffer[i - 1];
    }
    for (size_t i = 0; i < LFG_K; i++) {
        uint32_t x = lfg->buffer[i];
        uint32_t y = (x & 0xFF00FFFFu) | ((x >> 2) & 0x00FF0000u);
        lfg->buffer[i] = __builtin_bswap32(y);
    }
    for (int i = 0; i < 4; i++) {
        lfg_forward(lfg);
    }
    lfg->position = 0;
}

static void lfg_skip(LFG* lfg, size_t n) {
    lfg->position += n;
    while (lfg->position >= LFG_K_BYTES) {
        lfg_forward(lfg);
        lfg->position -= LFG_K_BYTES;
    }
}

static void lfg_fill(LFG* lfg, uint8_t* out, size_t len) {
    while (len > 0) {
        while (lfg->position >= LFG_K_BYTES) {
            lfg_forward(lfg);
            lfg->position -= LFG_K_BYTES;
        }
        const uint8_t* bytes = (const uint8_t*)lfg->buffer;
        size_t chunk = len < (LFG_K_BYTES - lfg->position) ? len : (LFG_K_BYTES - lfg->position);
        memcpy(out, bytes + lfg->position, chunk);
        lfg->position += chunk;
        out += chunk;
        len -= chunk;
    }
}

int main(int argc, char** argv) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <input.rvz> <output.iso>\n", argv[0]);
        return 1;
    }
    FILE* in = fopen(argv[1], "rb");
    if (!in) { perror("fopen in"); return 1; }

    uint8_t hdr[0x48 + 0xDC];
    if (fread(hdr, 1, sizeof(hdr), in) != sizeof(hdr)) {
        fprintf(stderr, "Short header read\n");
        return 1;
    }
    if (memcmp(hdr, "RVZ\x01", 4) != 0) {
        fprintf(stderr, "Not an RVZ file\n");
        return 1;
    }
    uint64_t iso_size = be64(hdr + 0x24);
    const uint8_t* disc = hdr + 0x48;
    uint32_t chunk_size = be32(disc + 0x0C);
    const uint8_t* dhead = disc + 0x10;
    uint32_t n_groups = be32(disc + 0xC4);
    uint64_t group_off = be64(disc + 0xC8);
    uint32_t group_size = be32(disc + 0xD0);

    uint8_t* grp_comp = malloc(group_size);
    fseeko(in, group_off, SEEK_SET);
    if (fread(grp_comp, 1, group_size, in) != group_size) {
        fprintf(stderr, "Short group table read\n");
        return 1;
    }
    size_t grp_decomp_len = (size_t)n_groups * 12;
    uint8_t* grp_table = malloc(grp_decomp_len);
    size_t zr = ZSTD_decompress(grp_table, grp_decomp_len, grp_comp, group_size);
    if (ZSTD_isError(zr) || zr != grp_decomp_len) {
        fprintf(stderr, "Failed to decompress group table: %s\n", ZSTD_getErrorName(zr));
        return 1;
    }
    free(grp_comp);

    FILE* out = fopen(argv[2], "wb");
    if (!out) { perror("fopen out"); return 1; }

    uint8_t* comp_buf = malloc(chunk_size * 2);
    uint8_t* decomp_buf = malloc(chunk_size * 2);
    uint8_t* chunk_out = malloc(chunk_size);
    CC_SHA1_CTX sha_ctx;
    CC_SHA1_Init(&sha_ctx);

    for (uint32_t i = 0; i < n_groups; i++) {
        const uint8_t* g = grp_table + i * 12;
        uint64_t doff = (uint64_t)be32(g) * 4ULL;
        uint32_t dsize_raw = be32(g + 4);
        uint32_t psize = be32(g + 8);
        int is_comp = (dsize_raw & 0x80000000u) != 0;
        uint32_t dsize = dsize_raw & 0x7FFFFFFFu;

        uint64_t section_offset = (uint64_t)i * (uint64_t)chunk_size;
        uint32_t expect_size = chunk_size;
        if (section_offset + expect_size > iso_size) {
            expect_size = (uint32_t)(iso_size - section_offset);
        }

        if (dsize == 0) {
            memset(chunk_out, 0, expect_size);
        } else {
            fseeko(in, doff, SEEK_SET);
            if (fread(comp_buf, 1, dsize, in) != dsize) {
                fprintf(stderr, "Short read at group %u\n", i);
                return 1;
            }
            const uint8_t* src = comp_buf;
            size_t src_len = dsize;
            if (is_comp) {
                src_len = ZSTD_decompress(decomp_buf, chunk_size * 2, comp_buf, dsize);
                if (ZSTD_isError(src_len)) {
                    fprintf(stderr, "ZSTD error at group %u: %s\n", i, ZSTD_getErrorName(src_len));
                    return 1;
                }
                src = decomp_buf;
            }
            if (psize > 0) {
                size_t pos = 0;
                size_t written = 0;
                LFG lfg;
                while (pos + 4 <= src_len) {
                    uint32_t sz_raw = be32(src + pos);
                    pos += 4;
                    if (sz_raw & 0x80000000u) {
                        uint32_t sz = sz_raw & 0x7FFFFFFFu;
                        if (pos + SEED_SIZE_BYTES > src_len || written + sz > expect_size) {
                            fprintf(stderr, "Pack junk overflow at group %u\n", i);
                            return 1;
                        }
                        lfg_init(&lfg, src + pos);
                        pos += SEED_SIZE_BYTES;
                        lfg_skip(&lfg, (size_t)((section_offset + written) % SECTOR_SIZE));
                        lfg_fill(&lfg, chunk_out + written, sz);
                        written += sz;
                    } else {
                        uint32_t sz = sz_raw;
                        if (pos + sz > src_len || written + sz > expect_size) {
                            fprintf(stderr, "Pack data overflow at group %u\n", i);
                            return 1;
                        }
                        memcpy(chunk_out + written, src + pos, sz);
                        pos += sz;
                        written += sz;
                    }
                }
                if (written != expect_size) {
                    fprintf(stderr, "Pack size mismatch at group %u: %zu != %u\n", i, written, expect_size);
                    return 1;
                }
            } else {
                if (src_len != expect_size) {
                    fprintf(stderr, "Decomp size mismatch at group %u: %zu != %u\n", i, src_len, expect_size);
                    return 1;
                }
                memcpy(chunk_out, src, expect_size);
            }
        }
        if (i == 0) {
            memcpy(chunk_out, dhead, 0x80);
        }
        CC_SHA1_Update(&sha_ctx, chunk_out, expect_size);
        if (i == 0 && chunk_out[7] == 0) {
            chunk_out[7] = 2;
        }
        fwrite(chunk_out, 1, expect_size, out);
    }

    uint8_t digest[CC_SHA1_DIGEST_LENGTH];
    CC_SHA1_Final(digest, &sha_ctx);
    for (int i = 0; i < CC_SHA1_DIGEST_LENGTH; i++) printf("%02x", digest[i]);
    printf("\n");

    fclose(out);
    fclose(in);
    return 0;
}
"""


def compute_file_sha1(path, chunk_size=8 * 1024 * 1024):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def ensure_normalized_gale01_revision(iso_path):
    """Ensure byte 0x07 (disc_version) of a GALE01 ISO is set to 2 for aurora_dvd_open."""
    if not os.path.isfile(iso_path):
        return False
    try:
        with open(iso_path, "r+b") as f:
            hdr = f.read(32)
            if len(hdr) < 32 or hdr[:6] != b"GALE01" or hdr[0x1C:0x20] != GC_MAGIC:
                return False
            if hdr[7] != 2:
                f.seek(7)
                f.write(b"\x02")
                f.flush()
        return True
    except OSError:
        return False


def verify_melee_iso(iso_path):
    """Verify size, GALE01 rev 2 normalized header, DOL/FST offsets, and DOL font signatures."""
    if not os.path.isfile(iso_path):
        return False
    try:
        if os.path.getsize(iso_path) != MELEE_ISO_EXPECTED_SIZE:
            return False
        ensure_normalized_gale01_revision(iso_path)
        with open(iso_path, "rb") as f:
            hdr = f.read(0x440)
            if len(hdr) != 0x440:
                return False
            if hdr[:6] != b"GALE01" or hdr[7] != 2 or hdr[0x1C:0x20] != GC_MAGIC:
                return False
            dol_off, fst_off, fst_size = struct.unpack_from(">III", hdr, 0x420)
            if dol_off != MELEE_DOL_OFFSET or fst_off != MELEE_FST_OFFSET or fst_size != MELEE_FST_SIZE:
                return False
            f.seek(MELEE_DEBUG_FONT_MARK_OFFSET)
            mark_buf = f.read(32)
            if len(mark_buf) != 32:
                return False
            words = struct.unpack(">8I", mark_buf)
            if words[::2] != MELEE_DEBUG_FONT_MARKS:
                return False
            f.seek(MELEE_KERN_SIG_OFFSET)
            if f.read(8) != MELEE_KERN_SIG:
                return False
        return True
    except OSError:
        return False


def _link_or_copy(src, dst):
    if not os.path.isfile(src):
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try:
        if os.path.isfile(dst):
            if os.path.samefile(src, dst):
                return True
            if os.path.getsize(src) == os.path.getsize(dst) and int(os.path.getmtime(src)) == int(os.path.getmtime(dst)):
                return True
            os.unlink(dst)
    except OSError:
        pass
    try:
        os.link(src, dst)
        return True
    except OSError:
        shutil.copy2(src, dst)
        return True


def _extract_rvz_to_shared_iso(shared_iso_path):
    if verify_melee_iso(SCRATCH_SPIKE_ISO_PATH):
        os.makedirs(os.path.dirname(shared_iso_path), exist_ok=True)
        _link_or_copy(SCRATCH_SPIKE_ISO_PATH, shared_iso_path)
        ensure_normalized_gale01_revision(shared_iso_path)
        if verify_melee_iso(shared_iso_path):
            return MELEE_ISO_UNPATCHED_SHA1

    if not os.path.isfile(SOURCE_ZIP_PATH):
        raise FileNotFoundError(f"Source archive not found: {SOURCE_ZIP_PATH}")

    os.makedirs(os.path.dirname(shared_iso_path), exist_ok=True)
    tmp_iso_path = f"{shared_iso_path}.tmp.{os.getpid()}"
    try:
        with tempfile.TemporaryDirectory(prefix="melee_rvz_") as tmpdir:
            c_path = os.path.join(tmpdir, "rvz2iso.c")
            bin_path = os.path.join(tmpdir, "rvz2iso")
            rvz_path = os.path.join(tmpdir, "melee.rvz")
            with open(c_path, "w", encoding="utf-8") as f:
                f.write(RVZ2ISO_C_SOURCE)

            subprocess.run(
                [
                    "/usr/bin/clang",
                    "-O3",
                    c_path,
                    "-I/opt/homebrew/opt/zstd/include",
                    "-L/opt/homebrew/opt/zstd/lib",
                    "-Wl,-rpath,/opt/homebrew/opt/zstd/lib",
                    "-lzstd",
                    "-o",
                    bin_path,
                ],
                check=True,
            )

            with zipfile.ZipFile(SOURCE_ZIP_PATH, "r") as zf:
                with zf.open(SOURCE_RVZ_ENTRY_NAME, "r") as src_s, open(rvz_path, "wb") as dst_s:
                    shutil.copyfileobj(src_s, dst_s, length=8 * 1024 * 1024)

            proc = subprocess.run(
                [bin_path, rvz_path, tmp_iso_path],
                capture_output=True,
                text=True,
                check=True,
            )
            unpatched_sha1 = proc.stdout.strip().splitlines()[-1].strip()
            if unpatched_sha1 != MELEE_ISO_UNPATCHED_SHA1:
                raise RuntimeError(
                    f"RVZ unpatched ISO SHA-1 mismatch: got {unpatched_sha1}, expected {MELEE_ISO_UNPATCHED_SHA1}"
                )

        if not verify_melee_iso(tmp_iso_path):
            raise RuntimeError(f"Decompressed ISO failed validation at {tmp_iso_path}")
        os.replace(tmp_iso_path, shared_iso_path)
        return MELEE_ISO_UNPATCHED_SHA1
    except Exception:
        if os.path.exists(tmp_iso_path):
            try:
                os.remove(tmp_iso_path)
            except OSError:
                pass
        raise


def provision_melee(worktree_root=None):
    """Idempotently provision melee/game.iso and synchronize runtime files
    between /Users/diesel/Desktop/SkateAlley/melee/ and <worktree_root>/melee/.
    """
    repo_root = os.path.abspath(
        worktree_root or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    worktree_melee_dir = os.path.join(repo_root, "melee")
    os.makedirs(SHARED_MELEE_DIR, exist_ok=True)
    os.makedirs(worktree_melee_dir, exist_ok=True)

    shared_iso_path = os.path.join(SHARED_MELEE_DIR, "game.iso")
    if not verify_melee_iso(shared_iso_path):
        _extract_rvz_to_shared_iso(shared_iso_path)

    if not os.path.samefile(worktree_melee_dir, SHARED_MELEE_DIR):
        for artifact in GIT_IGNORED_ARTIFACTS:
            src_art = os.path.join(SHARED_MELEE_DIR, artifact)
            dst_art = os.path.join(worktree_melee_dir, artifact)
            _link_or_copy(src_art, dst_art)

        for rel in TRACKED_REL_PATHS:
            wt_file = os.path.join(worktree_melee_dir, rel)
            sh_file = os.path.join(SHARED_MELEE_DIR, rel)
            if os.path.isfile(wt_file):
                os.makedirs(os.path.dirname(sh_file), exist_ok=True)
                shutil.copy2(wt_file, sh_file)
            elif os.path.isfile(sh_file):
                os.makedirs(os.path.dirname(wt_file), exist_ok=True)
                shutil.copy2(sh_file, wt_file)

    iso_path = os.path.join(worktree_melee_dir, "game.iso")
    wasm_path = os.path.join(worktree_melee_dir, "melee_browser.wasm")
    js_path = os.path.join(worktree_melee_dir, "melee_browser.js")

    if not verify_melee_iso(iso_path):
        raise RuntimeError(f"Provisioned Melee ISO validation failed at {iso_path}")
    if not os.path.isfile(wasm_path) or os.path.getsize(wasm_path) != MELEE_WASM_EXPECTED_SIZE:
        raise RuntimeError(f"Provisioned melee_browser.wasm missing or size mismatch at {wasm_path}")
    if not os.path.isfile(js_path) or os.path.getsize(js_path) != MELEE_JS_EXPECTED_SIZE:
        raise RuntimeError(f"Provisioned melee_browser.js missing or size mismatch at {js_path}")

    return {
        "ok": True,
        "worktree_melee_dir": worktree_melee_dir,
        "shared_melee_dir": SHARED_MELEE_DIR,
        "iso_bytes": os.path.getsize(iso_path),
        "iso_unpatched_sha1": MELEE_ISO_UNPATCHED_SHA1,
        "wasm_bytes": os.path.getsize(wasm_path),
        "wasm_sha1": compute_file_sha1(wasm_path),
        "js_bytes": os.path.getsize(js_path),
        "js_sha1": compute_file_sha1(js_path),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Provision Super Smash Bros. Melee (GALE01) raw ISO and standalone /melee/ runtime."
    )
    parser.add_argument("--worktree-root", default=None, help="Target repository/worktree root directory")
    args = parser.parse_args()

    result = provision_melee(worktree_root=args.worktree_root)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
