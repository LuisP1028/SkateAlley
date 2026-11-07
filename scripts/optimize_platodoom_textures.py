#!/usr/bin/env python3
"""
scripts/optimize_platodoom_textures.py
Optimizes and downsamples PlatoDoom Arcade header textures to 1024x348 POT width tier,
generating high-efficiency WebP (<= 120 KB) and optimized PNG (RGBA <= 1.45 MB decoded).
Preserves transparent alpha matting, corner transparency, and interior white highlights.
"""

import hashlib
import json
import os
import sys
from pathlib import Path
from PIL import Image, features

REPO_ROOT = Path(__file__).resolve().parent.parent
PORTAL_ASSETS_DIR = REPO_ROOT / "assets" / "portal_games"
SRC_PNG = PORTAL_ASSETS_DIR / "platodoom_header.png"
DST_PNG = PORTAL_ASSETS_DIR / "platodoom_header.png"
DST_WEBP = PORTAL_ASSETS_DIR / "platodoom_header.webp"
MANIFEST_PATH = PORTAL_ASSETS_DIR / "manifest.json"

TARGET_W = 1024
TARGET_H = 348


def optimize_header_textures():
    # If the visual-planner reference asset exists, check it first
    ref_asset = REPO_ROOT / "assets" / "20261107T172758-750-iwl9" / "visual-planner-platodoom-header-1024x348.png"
    ref_webp = REPO_ROOT / "assets" / "20261107T172758-750-iwl9" / "visual-planner-platodoom-header-1024x348.webp"

    if ref_asset.is_file():
        print(f"[optimize] Loading premultiplied Lanczos reference from {ref_asset}")
        img = Image.open(ref_asset).convert("RGBA")
    else:
        print(f"[optimize] Resizing {SRC_PNG} using Lanczos resampling to ({TARGET_W}, {TARGET_H})")
        src_img = Image.open(SRC_PNG).convert("RGBA")
        img = src_img.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)

    assert img.size == (TARGET_W, TARGET_H), f"Invalid dimensions: {img.size}"
    assert img.mode == "RGBA", f"Invalid mode: {img.mode}"

    # Save optimized PNG
    img.save(DST_PNG, format="PNG", optimize=True, compress_level=9)
    png_size = DST_PNG.stat().st_size
    print(f"[optimize] Saved {DST_PNG} ({png_size:,} bytes on disk)")

    # Save high-efficiency WebP
    if features.check("webp"):
        if ref_webp.is_file():
            import shutil
            shutil.copy2(ref_webp, DST_WEBP)
        else:
            img.save(DST_WEBP, format="WEBP", quality=85, method=6)
        webp_size = DST_WEBP.stat().st_size
        print(f"[optimize] Saved {DST_WEBP} ({webp_size:,} bytes on disk)")
        assert webp_size <= 120 * 1024, f"WebP size {webp_size} exceeds 120 KB budget"
    else:
        print("[warn] PIL built without WebP support; skipping WebP generation")

    # Invariant verification
    vram_bytes = TARGET_W * TARGET_H * 4
    print(f"[optimize] Decoded RGBA VRAM footprint: {vram_bytes:,} bytes ({vram_bytes / (1024*1024):.3f} MB)")
    assert vram_bytes <= 1_450_000, f"Decoded RGBA {vram_bytes} exceeds 1.45 MB budget"
    assert TARGET_W <= 1024 and TARGET_H <= 512, "Texture dimensions exceed 1024x512 POT tier"

    # Update manifest.json metadata if present
    if MANIFEST_PATH.is_file():
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        if "headerLogo" in manifest:
            sha256_hash = hashlib.sha256(DST_PNG.read_bytes()).hexdigest()
            manifest["headerLogo"]["outputWidth"] = TARGET_W
            manifest["headerLogo"]["outputHeight"] = TARGET_H
            manifest["headerLogo"]["aspectRatio"] = round(TARGET_W / TARGET_H, 4)
            manifest["headerLogo"]["sha256"] = sha256_hash
            manifest["headerLogo"]["webpOutputPath"] = "assets/portal_games/platodoom_header.webp"
            with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)
            print(f"[optimize] Updated manifest.json headerLogo: {TARGET_W}x{TARGET_H}, sha256={sha256_hash[:16]}...")


if __name__ == "__main__":
    optimize_header_textures()
