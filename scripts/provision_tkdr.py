#!/usr/bin/env python3
"""Idempotent ISO extraction, Sector-28 Kirk PRX EBOOT.BIN decryption, game.zip bundling,
and multi-worktree provisioning for Tekken: Dark Resurrection (ULUS-10139 v1.00, Spec 057).
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
SHARED_TKDR_DIR = os.path.join(SHARED_WORKSPACE_ROOT, "tkdr")
SOURCE_ZIP_PATH = os.path.join(
    SHARED_WORKSPACE_ROOT,
    "Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip",
)
SOURCE_ISO_ENTRY_NAME = "Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso"

SCRATCH_KIRK_DIR = "/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk"
PRE_STAGED_EBOOT_PATH = os.path.join(SCRATCH_KIRK_DIR, "ULUS10139_EBOOT.BIN")
KIRK_DEC_BINARY_PATH = os.path.join(SCRATCH_KIRK_DIR, "dec_eboot")

TKDR_SOURCE_ZIP_EXPECTED_SIZE = 1117233020
TKDR_ISO_EXPECTED_SIZE = 1750237184
TKDR_ISO_EXPECTED_SHA1 = "8193a65dee49685db49284408c89bdb35324bc32"
TKDR_ISO_PVD_OFFSET = 32768
TKDR_ISO_PVD_MAGIC = b"\x01CD001\x01\x00PSP GAME"

TKDR_ENC_EBOOT_LBA = 28
TKDR_ENC_EBOOT_OFFSET = 57344  # 28 * 2048 (0xE000)
TKDR_EBOOT_ELF_SIZE = 4835824
TKDR_EBOOT_EXPECTED_SIZE = 4836160
TKDR_EBOOT_EXPECTED_SHA1 = "b9a0e3292738a833f4f8077e3959c3a0652c42cd"
ET_SCE_PRX = 0xFFA0

TRACKED_REL_PATHS = (
    "index.html",
    "tkdr.html",
    "tkdr.js",
    "tkdr.wasm",
    "disc.mjs",
    "config.json",
    "_headers",
    "recomp/analyze.mjs",
    "recomp/elf.mjs",
    "recomp/index.mjs",
    "recomp/mips.mjs",
    "recomp/nids.json",
    "recomp/wasm.mjs",
    "recomp/wasmgen.mjs",
    "recomp/worker.mjs",
    "tools/serve.py",
    "tools/web_config.py",
)

GIT_IGNORED_ARTIFACTS = (
    "game.iso",
    "eboot.bin",
    "ULUS10139_EBOOT.BIN",
    "game.zip",
)


def compute_file_sha1(path, chunk_size=8 * 1024 * 1024):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def verify_iso_header_and_size(iso_path, verify_sha1=False):
    if not os.path.isfile(iso_path):
        return False
    try:
        if os.path.getsize(iso_path) != TKDR_ISO_EXPECTED_SIZE:
            return False
        with open(iso_path, "rb") as f:
            f.seek(TKDR_ISO_PVD_OFFSET)
            pvd = f.read(len(TKDR_ISO_PVD_MAGIC))
            if pvd != TKDR_ISO_PVD_MAGIC:
                return False
        if verify_sha1:
            return compute_file_sha1(iso_path) == TKDR_ISO_EXPECTED_SHA1
        return True
    except OSError:
        return False


def verify_decrypted_eboot_bytes(data):
    if len(data) != TKDR_EBOOT_EXPECTED_SIZE:
        return False
    if data[:4] != b"\x7fELF":
        return False
    e_type = struct.unpack_from("<H", data, 16)[0]
    if e_type != ET_SCE_PRX:
        return False
    digest = hashlib.sha1(data).hexdigest()
    return digest == TKDR_EBOOT_EXPECTED_SHA1


def verify_decrypted_eboot_file(path):
    if not os.path.isfile(path):
        return False
    try:
        if os.path.getsize(path) != TKDR_EBOOT_EXPECTED_SIZE:
            return False
        with open(path, "rb") as f:
            data = f.read()
        return verify_decrypted_eboot_bytes(data)
    except OSError:
        return False


def verify_combined_game_zip(zip_path):
    if not os.path.isfile(zip_path):
        return False
    try:
        if os.path.getsize(zip_path) <= TKDR_SOURCE_ZIP_EXPECTED_SIZE:
            return False
        with zipfile.ZipFile(zip_path, "r") as zf:
            infos = {info.filename: info for info in zf.infolist()}
            iso_info = infos.get(SOURCE_ISO_ENTRY_NAME)
            eb_info = infos.get("ULUS10139_EBOOT.BIN")
            if not iso_info or iso_info.file_size != TKDR_ISO_EXPECTED_SIZE:
                return False
            if not eb_info or eb_info.file_size != TKDR_EBOOT_EXPECTED_SIZE:
                return False
        return True
    except (OSError, zipfile.BadZipFile):
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


def _extract_iso_to_shared_cache(shared_iso_path):
    if not os.path.isfile(SOURCE_ZIP_PATH):
        raise FileNotFoundError(f"Source archive not found: {SOURCE_ZIP_PATH}")

    os.makedirs(os.path.dirname(shared_iso_path), exist_ok=True)
    tmp_path = f"{shared_iso_path}.tmp.{os.getpid()}"
    h = hashlib.sha1()
    total_written = 0
    try:
        with zipfile.ZipFile(SOURCE_ZIP_PATH, "r") as zf:
            with zf.open(SOURCE_ISO_ENTRY_NAME, "r") as src_stream, open(tmp_path, "wb") as out_f:
                while True:
                    chunk = src_stream.read(8 * 1024 * 1024)
                    if not chunk:
                        break
                    out_f.write(chunk)
                    h.update(chunk)
                    total_written += len(chunk)
        digest = h.hexdigest()
        if total_written != TKDR_ISO_EXPECTED_SIZE:
            raise RuntimeError(
                f"Extracted ISO size mismatch: got {total_written}, expected {TKDR_ISO_EXPECTED_SIZE}"
            )
        if digest != TKDR_ISO_EXPECTED_SHA1:
            raise RuntimeError(
                f"Extracted ISO SHA-1 mismatch: got {digest}, expected {TKDR_ISO_EXPECTED_SHA1}"
            )
        os.replace(tmp_path, shared_iso_path)
    except Exception:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise


def _decrypt_or_load_eboot_bytes(shared_iso_path):
    if verify_decrypted_eboot_file(PRE_STAGED_EBOOT_PATH):
        with open(PRE_STAGED_EBOOT_PATH, "rb") as f:
            return f.read()

    if not os.path.isfile(shared_iso_path):
        raise FileNotFoundError(f"Cannot extract sector 28 EBOOT; ISO missing at {shared_iso_path}")

    with open(shared_iso_path, "rb") as f:
        f.seek(TKDR_ENC_EBOOT_OFFSET)
        enc_eboot = f.read(TKDR_EBOOT_EXPECTED_SIZE)

    if len(enc_eboot) != TKDR_EBOOT_EXPECTED_SIZE or enc_eboot[:4] != b"~PSP":
        raise RuntimeError("Invalid ~PSP EBOOT header at ISO sector 28 (offset 0xE000)")

    if not os.path.isfile(KIRK_DEC_BINARY_PATH):
        raise FileNotFoundError(f"Kirk PRX decrypter binary not found at {KIRK_DEC_BINARY_PATH}")

    with tempfile.TemporaryDirectory(prefix="tkdr_kirk_") as tmpdir:
        enc_path = os.path.join(tmpdir, "enc_eboot.bin")
        dec_path = os.path.join(tmpdir, "dec_eboot.elf")
        with open(enc_path, "wb") as f:
            f.write(enc_eboot)
        subprocess.run([KIRK_DEC_BINARY_PATH, enc_path, dec_path], check=True)
        with open(dec_path, "rb") as f:
            dec_elf = f.read()

    if len(dec_elf) != TKDR_EBOOT_ELF_SIZE:
        raise RuntimeError(
            f"Kirk decrypted ELF size mismatch: got {len(dec_elf)}, expected {TKDR_EBOOT_ELF_SIZE}"
        )

    # Preserve full max(elf_size, psp_size) = 4,836,160 byte buffer required by EBOOT_SHA1
    full_eboot = dec_elf + enc_eboot[TKDR_EBOOT_ELF_SIZE:TKDR_EBOOT_EXPECTED_SIZE]
    if not verify_decrypted_eboot_bytes(full_eboot):
        actual_sha1 = hashlib.sha1(full_eboot).hexdigest()
        raise RuntimeError(
            f"Decrypted EBOOT SHA-1 verification failed: got {actual_sha1}, expected {TKDR_EBOOT_EXPECTED_SHA1}"
        )
    return full_eboot


def _provision_eboot_to_shared_cache(shared_tkdr_dir, shared_iso_path):
    eboot_path = os.path.join(shared_tkdr_dir, "eboot.bin")
    ulus_path = os.path.join(shared_tkdr_dir, "ULUS10139_EBOOT.BIN")
    if verify_decrypted_eboot_file(eboot_path) and verify_decrypted_eboot_file(ulus_path):
        return

    payload = _decrypt_or_load_eboot_bytes(shared_iso_path)
    os.makedirs(shared_tkdr_dir, exist_ok=True)
    for dst in (eboot_path, ulus_path):
        tmp_path = f"{dst}.tmp.{os.getpid()}"
        with open(tmp_path, "wb") as f:
            f.write(payload)
        os.replace(tmp_path, dst)


def _provision_game_zip_to_shared_cache(shared_tkdr_dir):
    zip_path = os.path.join(shared_tkdr_dir, "game.zip")
    ulus_path = os.path.join(shared_tkdr_dir, "ULUS10139_EBOOT.BIN")
    if verify_combined_game_zip(zip_path):
        return

    if not os.path.isfile(SOURCE_ZIP_PATH):
        raise FileNotFoundError(f"Source archive not found: {SOURCE_ZIP_PATH}")
    if not verify_decrypted_eboot_file(ulus_path):
        raise RuntimeError(f"Verified ULUS10139_EBOOT.BIN missing at {ulus_path}")

    tmp_path = f"{zip_path}.tmp.{os.getpid()}"
    try:
        shutil.copy2(SOURCE_ZIP_PATH, tmp_path)
        with zipfile.ZipFile(tmp_path, "a", compression=zipfile.ZIP_STORED) as zf:
            zf.write(ulus_path, arcname="ULUS10139_EBOOT.BIN", compress_type=zipfile.ZIP_STORED)
        if not verify_combined_game_zip(tmp_path):
            raise RuntimeError("Constructed game.zip failed central directory validation")
        os.replace(tmp_path, zip_path)
    except Exception:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise


def provision_tkdr(worktree_root=None, verify_sha1=False):
    """Idempotently provision game.iso, eboot.bin, ULUS10139_EBOOT.BIN, and game.zip
    in /Users/diesel/Desktop/SkateAlley/tkdr/ and synchronize with <worktree_root>/tkdr/.
    """
    repo_root = os.path.abspath(
        worktree_root or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    worktree_tkdr_dir = os.path.join(repo_root, "tkdr")
    os.makedirs(SHARED_TKDR_DIR, exist_ok=True)
    os.makedirs(worktree_tkdr_dir, exist_ok=True)

    shared_iso_path = os.path.join(SHARED_TKDR_DIR, "game.iso")
    if not verify_iso_header_and_size(shared_iso_path, verify_sha1=verify_sha1):
        _extract_iso_to_shared_cache(shared_iso_path)

    _provision_eboot_to_shared_cache(SHARED_TKDR_DIR, shared_iso_path)
    _provision_game_zip_to_shared_cache(SHARED_TKDR_DIR)

    # Synchronize git-ignored game artifacts from shared cache -> worktree
    if os.path.abspath(worktree_tkdr_dir) != os.path.abspath(SHARED_TKDR_DIR):
        for artifact in GIT_IGNORED_ARTIFACTS:
            src_art = os.path.join(SHARED_TKDR_DIR, artifact)
            dst_art = os.path.join(worktree_tkdr_dir, artifact)
            _link_or_copy(src_art, dst_art)

        # Synchronize tracked web application files between worktree and shared workspace
        for rel in TRACKED_REL_PATHS:
            wt_file = os.path.join(worktree_tkdr_dir, rel)
            sh_file = os.path.join(SHARED_TKDR_DIR, rel)
            if os.path.isfile(wt_file):
                os.makedirs(os.path.dirname(sh_file), exist_ok=True)
                shutil.copy2(wt_file, sh_file)
            elif os.path.isfile(sh_file):
                os.makedirs(os.path.dirname(wt_file), exist_ok=True)
                shutil.copy2(sh_file, wt_file)

    iso_path = os.path.join(worktree_tkdr_dir, "game.iso")
    eboot_path = os.path.join(worktree_tkdr_dir, "eboot.bin")
    ulus_path = os.path.join(worktree_tkdr_dir, "ULUS10139_EBOOT.BIN")
    zip_path = os.path.join(worktree_tkdr_dir, "game.zip")

    if not verify_iso_header_and_size(iso_path, verify_sha1=False):
        raise RuntimeError(f"Provisioned ISO validation failed at {iso_path}")
    if not (verify_decrypted_eboot_file(eboot_path) and verify_decrypted_eboot_file(ulus_path)):
        raise RuntimeError(f"Provisioned EBOOT validation failed at {eboot_path}")
    if not verify_combined_game_zip(zip_path):
        raise RuntimeError(f"Provisioned game.zip validation failed at {zip_path}")

    return {
        "ok": True,
        "worktree_tkdr_dir": worktree_tkdr_dir,
        "shared_tkdr_dir": SHARED_TKDR_DIR,
        "iso_bytes": os.path.getsize(iso_path),
        "iso_sha1": TKDR_ISO_EXPECTED_SHA1,
        "eboot_bytes": os.path.getsize(eboot_path),
        "eboot_sha1": TKDR_EBOOT_EXPECTED_SHA1,
        "game_zip_bytes": os.path.getsize(zip_path),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Provision Tekken: Dark Resurrection (ULUS-10139 v1.00) ISO, Kirk-decrypted EBOOT, and game.zip."
    )
    parser.add_argument("--worktree-root", default=None, help="Target repository/worktree root directory")
    parser.add_argument("--verify-sha1", action="store_true", help="Re-verify full 1.75 GB ISO SHA-1 digest")
    args = parser.parse_args()

    result = provision_tkdr(worktree_root=args.worktree_root, verify_sha1=args.verify_sha1)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
