#!/usr/bin/env python3
"""
Backwards-compatible entrypoint for Functional Specifications 058 & 059 that delegates to the
.glb-file-agnostic Tekken: Dark Resurrection Auto-Rigger & Adaptive Decimator (`compile_tkdr_character.py`).
"""

import os
import sys

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from compile_tkdr_character import (  # noqa: E402,F401
    CANONICAL_14_BONES,
    TEKKEN_ROSTER,
    compile_glb_for_tkdr,
    ensure_luis_glb_staged,
    main,
    resolve_tekken_fighter,
    update_registry,
)

if __name__ == "__main__":
    raise SystemExit(main())
