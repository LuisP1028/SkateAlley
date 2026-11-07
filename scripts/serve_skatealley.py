#!/usr/bin/env python3
"""
Production-grade static + byte-range + CORS HTTP server for SkateAlley & SkateRoom.
Serves the repository root on port 3002 (default) with:
- Full CORS headers (Access-Control-Allow-Origin: *, Access-Control-Allow-Methods: GET, HEAD, OPTIONS)
- Correct MIME types for .wasm, .js, .mjs, .glb, .skate, .pack, .part, .mp4, .mp3, .webp, .json
- HTTP 206 Partial Content Range Request support for large binary streaming
- Health endpoint at /api/health returning JSON status
"""
import argparse
import base64
import gzip
import hashlib
import hmac
import json
import math
import mimetypes
import os
import re
import secrets
import shutil
import socket
import socketserver
import struct
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler

_SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, _SCRIPTS_DIR)
_GREEK_SCRIPTS_DIR = "/Users/diesel/desktop/greek/scripts"
if os.path.isdir(_GREEK_SCRIPTS_DIR) and _GREEK_SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, _GREEK_SCRIPTS_DIR)

import studio_http_handlers_045

from graphrag_engine import (
    AUTHORITATIVE_INTRO_ANCHOR_CARDS,
    INTRO_DECK_JSON_SCHEMA,
    KnowledgeGraphEngine,
    validate_intro_deck_payload,
)

HF_ROUTER_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions"
DEFAULT_DOOM_CHAT_MODEL = "Qwen/Qwen3.8-27B"
DEFAULT_DOOM_STARTERS_MODEL = "Qwen/Qwen3.8-27B"
DEFAULT_INTRO_GENERATE_MODEL = "openai/gpt-oss-120b"
DEFAULT_DOOM_PERSONA_PROMPT = (
    "You are DOOM_HEAD, the floating amber holographic companion and Digital Twin guide inside "
    "Luis's interactive 3D Freeman Alley portfolio (SkateAlley). Speak with sharp technical precision, "
    "philosophical depth, and subtle MF DOOM cadence while answering questions directly, concisely, "
    "and factually."
)
DEFAULT_STARTER_TOPIC_PROMPT = ""

CHAT_MODEL_FALLBACK_CHAIN = [
    "Qwen/Qwen3.8-27B",
    "openai/gpt-oss-120b",
    "Qwen/Qwen2.5-72B-Instruct",
]

STARTERS_MODEL_FALLBACK_CHAIN = [
    "Qwen/Qwen3.8-27B",
    "openai/gpt-oss-120b",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
]

INTRO_MODEL_FALLBACK_CHAIN = [
    "openai/gpt-oss-120b",
    "Qwen/Qwen3.8-27B",
    "meta-llama/Llama-3.1-8B-Instruct",
]

_LEGACY_CHAT_MODEL_ALIASES = frozenset({
    "Qwen/Qwen3.5-27B",
    "Qwen/Qwen3-8B",
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-3B-Instruct",
    "Qwen/Qwen2.5",
})

_GRAPH_ENGINE_LOCK = threading.Lock()
_GRAPH_ENGINE_INSTANCE = None
_GRAPH_ENGINE_PATH = None


def resolve_knowledge_graph_path():
    override = os.environ.get("SKATEALLEY_KNOWLEDGE_GRAPH_PATH", "").strip()
    if override:
        return os.path.abspath(override)
    cwd_candidate = os.path.abspath(os.path.join(os.getcwd(), "data", "luis_knowledge_graph.json"))
    if os.path.isfile(cwd_candidate):
        return cwd_candidate
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.abspath(os.path.join(repo_root, "data", "luis_knowledge_graph.json"))


def get_knowledge_graph_engine():
    global _GRAPH_ENGINE_INSTANCE, _GRAPH_ENGINE_PATH
    target_path = resolve_knowledge_graph_path()
    with _GRAPH_ENGINE_LOCK:
        if _GRAPH_ENGINE_INSTANCE is None or _GRAPH_ENGINE_PATH != target_path:
            _GRAPH_ENGINE_INSTANCE = KnowledgeGraphEngine(target_path)
            _GRAPH_ENGINE_PATH = target_path
        else:
            _GRAPH_ENGINE_INSTANCE.ensure_fresh()
        return _GRAPH_ENGINE_INSTANCE


def resolve_hf_token():
    """Resolve Hugging Face API token from env vars, .env file, or ~/.cache/huggingface/token."""
    for env_key in ("HF_TOKEN", "HUGGINGFACE_HUB_TOKEN", "HUGGING_FACE_HUB_TOKEN"):
        val = os.environ.get(env_key, "").strip().strip("\"'")
        if val:
            return val

    candidate_env_files = [
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
    ]
    for env_path in candidate_env_files:
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for raw_line in f:
                        line = raw_line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        if k.strip() in ("HF_TOKEN", "HUGGINGFACE_HUB_TOKEN", "HUGGING_FACE_HUB_TOKEN"):
                            cleaned = v.strip().strip("\"'")
                            if cleaned:
                                return cleaned
            except OSError:
                pass

    for token_path in (
        os.path.expanduser("~/.cache/huggingface/token"),
        os.path.expanduser("~/.huggingface/token"),
    ):
        if os.path.isfile(token_path):
            try:
                with open(token_path, "r", encoding="utf-8") as f:
                    val = f.read().strip()
                    if val:
                        return val
            except OSError:
                pass

    return None


def call_hf_chat_completions(
    token,
    model_candidates,
    messages,
    max_tokens=512,
    temperature=0.7,
    use_low_reasoning=False,
    timeout_sec=12.0,
    response_format=None,
    total_deadline_sec=None,
):
    """Call Hugging Face Inference Provider router with bounded model failover and optional JSON Schema response_format."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "SkateAlley-HoloProxy/1.0",
    }
    last_error = None
    t0 = time.time()
    deadline = (t0 + float(total_deadline_sec)) if total_deadline_sec else None

    for idx, model_id in enumerate(model_candidates):
        if deadline is not None:
            remaining = deadline - time.time()
            if remaining <= 0.4:
                last_error = last_error or f"Upstream deadline ({total_deadline_sec}s) exceeded before trying {model_id}"
                break
            call_timeout = min(float(timeout_sec), remaining)
        else:
            call_timeout = float(timeout_sec)

        payload = {
            "model": model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if response_format is not None:
            payload["response_format"] = response_format
        if use_low_reasoning and ("Qwen3.8" in model_id or "Qwen3" in model_id):
            payload["reasoning_effort"] = "low"

        req = urllib.request.Request(
            HF_ROUTER_COMPLETIONS_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=call_timeout) as resp:
                raw_body = resp.read().decode("utf-8")
                body = json.loads(raw_body)
                choices = body.get("choices") or []
                if not choices:
                    last_error = f"Empty choices from {model_id}"
                    continue
                msg = choices[0].get("message") or {}
                content = (msg.get("content") or "").strip()
                # Strip any <think>...</think> block if present
                if "<think>" in content and "</think>" in content:
                    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
                if not content:
                    last_error = f"Empty message content from {model_id}"
                    continue
                elapsed_ms = round((time.time() - t0) * 1000.0, 1)
                return {
                    "ok": True,
                    "model": model_id,
                    "content": content,
                    "usage": body.get("usage") or {},
                    "latencyMs": elapsed_ms,
                    "fallbackAttempt": idx,
                }
        except urllib.error.HTTPError as e:
            err_text = e.read().decode("utf-8", errors="replace")[:300]
            # Retry if a specific provider rejects reasoning_effort or strict json_schema parameter
            if e.code in (400, 422) and ("reasoning_effort" in payload or "response_format" in payload):
                retry_payload = dict(payload)
                if "reasoning_effort" in retry_payload:
                    retry_payload.pop("reasoning_effort", None)
                    retry_payload["max_tokens"] = max(max_tokens, 1200)
                elif "response_format" in retry_payload and isinstance(retry_payload["response_format"], dict):
                    if retry_payload["response_format"].get("type") == "json_schema":
                        retry_payload["response_format"] = {"type": "json_object"}
                    else:
                        retry_payload.pop("response_format", None)
                retry_timeout = (
                    min(float(timeout_sec), max(0.8, deadline - time.time()))
                    if deadline is not None
                    else float(timeout_sec)
                )
                req_retry = urllib.request.Request(
                    HF_ROUTER_COMPLETIONS_URL,
                    data=json.dumps(retry_payload).encode("utf-8"),
                    headers=headers,
                    method="POST",
                )
                try:
                    with urllib.request.urlopen(req_retry, timeout=retry_timeout) as resp2:
                        body2 = json.loads(resp2.read().decode("utf-8"))
                        choices2 = body2.get("choices") or []
                        if choices2:
                            msg2 = choices2[0].get("message") or {}
                            content2 = (msg2.get("content") or "").strip()
                            if "<think>" in content2 and "</think>" in content2:
                                content2 = re.sub(r"<think>.*?</think>", "", content2, flags=re.DOTALL).strip()
                            if content2:
                                elapsed_ms = round((time.time() - t0) * 1000.0, 1)
                                return {
                                    "ok": True,
                                    "model": model_id,
                                    "content": content2,
                                    "usage": body2.get("usage") or {},
                                    "latencyMs": elapsed_ms,
                                    "fallbackAttempt": idx,
                                }
                except Exception as retry_err:
                    last_error = f"HTTP {e.code} from {model_id}: {err_text} (retry: {retry_err})"
                    continue
            last_error = f"HTTP {e.code} from {model_id}: {err_text}"
        except Exception as e:
            last_error = f"Error calling {model_id}: {e}"

    return {
        "ok": False,
        "error": "UPSTREAM_HF_ERROR",
        "message": last_error or "All candidate Hugging Face models failed.",
    }


def extract_json_object_from_text(raw_text):
    """Strip optional markdown code fences around a JSON object response."""
    cleaned = (raw_text or "").strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def parse_two_starters_from_text(raw_text):
    """Parse 2 clean conversation starter strings from LLM JSON or line output."""
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    bracket_match = re.search(r"\[.*\]", cleaned, flags=re.DOTALL)
    if bracket_match:
        try:
            arr = json.loads(bracket_match.group(0))
            if isinstance(arr, list):
                valid = [str(item).strip() for item in arr if isinstance(item, (str, int, float)) and str(item).strip()]
                if len(valid) >= 2:
                    return [valid[0][:90], valid[1][:90]]
        except Exception:
            pass

    lines = []
    for line in cleaned.splitlines():
        s = re.sub(r"^\s*(?:[-*•]|\d+[.)])\s*", "", line).strip().strip("\"'")
        if len(s) >= 6 and not s.startswith("[") and not s.startswith("]"):
            lines.append(s[:90])
    if len(lines) >= 2:
        return [lines[0], lines[1]]
    return None

mimetypes.init()
NZP_GAME_PK3_EXPECTED_SIZE = 94276834
REVCDOS_DATA_EXPECTED_SIZE = 135355111
TKDR_ISO_EXPECTED_SIZE = 1750237184
TKDR_EBOOT_EXPECTED_SIZE = 4836160
MELEE_ISO_EXPECTED_SIZE = 1459978240
MELEE_WASM_EXPECTED_SIZE = 16353806
MELEE_JS_EXPECTED_SIZE = 528343
MKD_ISO_EXPECTED_SIZE = 1459978240
MKD_DOL_EXPECTED_SIZE = 3843104
EXTRA_MIME_TYPES = {
    ".dol": "application/octet-stream",
    ".wasm": "application/wasm",
    ".pk3": "application/octet-stream",
    ".fmf": "application/octet-stream",
    ".data": "application/octet-stream",
    ".iso": "application/octet-stream",
    ".gcm": "application/octet-stream",
    ".rvz": "application/octet-stream",
    ".cso": "application/octet-stream",
    ".bin": "application/octet-stream",
    ".elf": "application/octet-stream",
    ".prx": "application/octet-stream",
    ".zip": "application/zip",
    ".img": "application/octet-stream",
    ".dir": "application/octet-stream",
    ".dff": "application/octet-stream",
    ".txd": "application/octet-stream",
    ".col": "application/octet-stream",
    ".ifp": "application/octet-stream",
    ".adf": "application/octet-stream",
    ".raw": "application/octet-stream",
    ".sdt": "application/octet-stream",
    ".scm": "application/octet-stream",
    ".gxt": "application/octet-stream",
    ".save": "application/octet-stream",
    ".ini": "application/octet-stream",
    ".cfg": "application/octet-stream",
    ".dat": "application/octet-stream",
    ".ide": "application/octet-stream",
    ".ipl": "application/octet-stream",
    ".zon": "application/octet-stream",
    ".fxt": "application/octet-stream",
    ".part": "application/octet-stream",
    **{f".part{i:02d}": "application/octet-stream" for i in range(100)},
}
CUSTOM_MIME_TYPES = {
    ".wasm": "application/wasm",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".glb": "model/gltf-binary",
    ".skate": "application/octet-stream",
    ".pack": "application/octet-stream",
    ".part": "application/octet-stream",
    ".pk3": "application/octet-stream",
    ".fmf": "application/octet-stream",
    ".abin": "application/octet-stream",
    ".stategraph": "application/octet-stream",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".md": "text/markdown; charset=utf-8",
    ".py": "text/plain; charset=utf-8",
}
CUSTOM_MIME_TYPES.update(EXTRA_MIME_TYPES)
for ext, mime in CUSTOM_MIME_TYPES.items():
    mimetypes.add_type(mime, ext)


def ensure_nzportable_game_pk3(base_dir=None):
    """Materialize nzportable/nzp/game.pk3 from tracked .part00..02 chunks if absent on disk."""
    root = os.path.abspath(base_dir or os.getcwd())
    target_path = os.path.join(root, "nzportable", "nzp", "game.pk3")
    try:
        if os.path.isfile(target_path) and os.path.getsize(target_path) == NZP_GAME_PK3_EXPECTED_SIZE:
            return True
    except OSError:
        pass

    parts = [
        os.path.join(root, "nzportable", "parts", f"game.pk3.part{i:02d}")
        for i in range(3)
    ]
    if not all(os.path.isfile(p) for p in parts):
        return False

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    tmp_path = f"{target_path}.tmp.{os.getpid()}"
    try:
        total_written = 0
        with open(tmp_path, "wb") as out_f:
            for part_path in parts:
                with open(part_path, "rb") as in_f:
                    while True:
                        chunk = in_f.read(4 * 1024 * 1024)
                        if not chunk:
                            break
                        out_f.write(chunk)
                        total_written += len(chunk)
        if total_written != NZP_GAME_PK3_EXPECTED_SIZE:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
            return False
        os.replace(tmp_path, target_path)
        return True
    except OSError:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except OSError:
            pass
        return False


ensure_nzportable_game_pk3(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_nzportable_game_pk3(os.getcwd())


def ensure_worktree_character_hoodie(base_dir=None):
    """Materialize character_hoodie.glb in sparse worktrees via symlink or copy from primary repo."""
    root = os.path.abspath(base_dir or os.getcwd())
    target = os.path.join(root, "character_hoodie.glb")
    try:
        if os.path.isfile(target) and os.path.getsize(target) == 1357020:
            return True
    except OSError:
        pass

    candidates = [
        "/Users/diesel/Desktop/SkateAlley/character_hoodie.glb",
        os.path.abspath(os.path.join(root, "..", "..", "..", "character_hoodie.glb")),
    ]
    for src in candidates:
        if os.path.abspath(src) == os.path.abspath(target):
            continue
        if os.path.isfile(src) and os.path.getsize(src) == 1357020:
            try:
                if os.path.islink(target) or os.path.exists(target):
                    try:
                        os.unlink(target)
                    except OSError:
                        pass
                try:
                    os.symlink(src, target)
                    return True
                except OSError:
                    shutil.copyfile(src, target)
                    return True
            except OSError:
                pass

    try:
        subprocess.run(["git", "sparse-checkout", "add", "character_hoodie.glb"], cwd=root, capture_output=True, text=True)
        if os.path.isfile(target):
            return True
    except Exception:
        pass

    return os.path.isfile(target)


def ensure_worktree_revcdos_files(base_dir=None):
    """Materialize revcdos/ runtime & luis_player assets in sparse worktrees via symlink or copy from primary repo."""
    root = os.path.abspath(base_dir or os.getcwd())
    target = os.path.join(root, "revcdos")
    idx_target = os.path.join(target, "index.html")
    dff_target = os.path.join(target, "vcbr", "luis_player", "player.dff")
    if os.path.isfile(idx_target) and os.path.isfile(dff_target):
        return True

    try:
        subprocess.run(["git", "sparse-checkout", "add", "revcdos"], cwd=root, capture_output=True, text=True)
        if os.path.isfile(idx_target) and os.path.isfile(dff_target):
            return True
    except Exception:
        pass

    candidates = [
        "/Users/diesel/Desktop/SkateAlley/revcdos",
        os.path.abspath(os.path.join(root, "..", "..", "..", "revcdos")),
    ]
    for src in candidates:
        if os.path.abspath(src) == os.path.abspath(target):
            continue
        if os.path.isdir(src) and os.path.isfile(os.path.join(src, "index.html")):
            if not os.path.exists(target) and not os.path.islink(target):
                try:
                    os.symlink(src, target)
                    if os.path.isfile(idx_target):
                        return True
                except OSError:
                    pass
            try:
                shutil.copytree(src, target, copy_function=os.link, dirs_exist_ok=True)
                return True
            except OSError:
                try:
                    shutil.copytree(src, target, dirs_exist_ok=True)
                    return True
                except OSError:
                    pass

    return os.path.isfile(idx_target)


ensure_worktree_character_hoodie(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_worktree_character_hoodie(os.getcwd())
ensure_worktree_revcdos_files(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_worktree_revcdos_files(os.getcwd())


def ensure_revcdos_data(base_dir=None):
    """Materialize revcdos/vcbr/vc-sky-en-v6.data from tracked .part00..03 chunks if absent on disk."""
    root = os.path.abspath(base_dir or os.getcwd())
    target_path = os.path.join(root, "revcdos", "vcbr", "vc-sky-en-v6.data")
    try:
        if os.path.isfile(target_path) and os.path.getsize(target_path) == REVCDOS_DATA_EXPECTED_SIZE:
            return True
    except OSError:
        pass

    parts = [
        os.path.join(root, "revcdos", "parts", f"vc-sky-en-v6.data.part{i:02d}")
        for i in range(4)
    ]
    if not all(os.path.isfile(p) for p in parts):
        return False

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    tmp_path = f"{target_path}.tmp.{os.getpid()}"
    try:
        total_written = 0
        with open(tmp_path, "wb") as out_f:
            for part_path in parts:
                with open(part_path, "rb") as in_f:
                    while True:
                        chunk = in_f.read(4 * 1024 * 1024)
                        if not chunk:
                            break
                        out_f.write(chunk)
                        total_written += len(chunk)
        if total_written != REVCDOS_DATA_EXPECTED_SIZE:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
            return False
        os.replace(tmp_path, target_path)
        return True
    except OSError:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except OSError:
            pass
        return False


ensure_revcdos_data(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_revcdos_data(os.getcwd())


REVCDOS_VCSKY_SUBDIRS = ("anim", "audio", "data", "models", "mp3", "mss", "skins", "text", "txd")


def ensure_revcdos_vcsky(base_dir=None):
    """Materialize revcdos/vcsky/fetched/** from shared workspace cache if absent in a fresh worktree."""
    root = os.path.abspath(base_dir or os.getcwd())
    target_vcsky = os.path.join(root, "revcdos", "vcsky")
    target_fetched = os.path.join(target_vcsky, "fetched")
    if os.path.isdir(os.path.join(target_fetched, "models")) and os.path.isfile(
        os.path.join(target_vcsky, "sha256sums.txt")
    ):
        for sub in REVCDOS_VCSKY_SUBDIRS:
            try:
                os.makedirs(os.path.join(target_fetched, sub), exist_ok=True)
            except OSError:
                pass
        return True

    candidate_sources = [
        os.path.abspath(os.path.join(root, "..", "..", "..", "revcdos", "vcsky")),
        "/Users/diesel/Desktop/SkateAlley/revcdos/vcsky",
    ]
    for src_vcsky in candidate_sources:
        if os.path.abspath(src_vcsky) == os.path.abspath(target_vcsky):
            continue
        if os.path.isdir(os.path.join(src_vcsky, "fetched", "models")):
            try:
                os.makedirs(os.path.dirname(target_vcsky), exist_ok=True)
                shutil.copytree(src_vcsky, target_vcsky, copy_function=os.link, dirs_exist_ok=True)
                for sub in REVCDOS_VCSKY_SUBDIRS:
                    os.makedirs(os.path.join(target_fetched, sub), exist_ok=True)
                return True
            except OSError:
                try:
                    shutil.copytree(src_vcsky, target_vcsky, dirs_exist_ok=True)
                    for sub in REVCDOS_VCSKY_SUBDIRS:
                        os.makedirs(os.path.join(target_fetched, sub), exist_ok=True)
                    return True
                except OSError:
                    pass
    return os.path.isdir(target_fetched)


ensure_revcdos_vcsky(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_revcdos_vcsky(os.getcwd())


def ensure_revcdos_luis_player(base_dir=None):
    """Mirror revcdos/vcbr/luis_player/player.dff and player.txd across vcsky/fetched/models/gta3.img/ outfit & cutscene slots."""
    root = os.path.abspath(base_dir or os.getcwd())
    luis_dir = os.path.join(root, "revcdos", "vcbr", "luis_player")
    src_dff = os.path.join(luis_dir, "player.dff")
    src_txd = os.path.join(luis_dir, "player.txd")
    gta3_dir = os.path.join(root, "revcdos", "vcsky", "fetched", "models", "gta3.img")
    if not (os.path.isfile(src_dff) and os.path.isfile(src_txd) and os.path.isdir(gta3_dir)):
        return False

    try:
        with open(src_dff, "rb") as f:
            dff_bytes = f.read()
        with open(src_txd, "rb") as f:
            txd_bytes = f.read()
        targets = [f"player{i}" for i in range(2, 10)] + [f"csplay{i}" for i in range(2, 12)]
        for base in targets:
            for ext, payload in ((".dff", dff_bytes), (".txd", txd_bytes)):
                dst = os.path.join(gta3_dir, f"{base}{ext}")
                if os.path.isfile(dst) and os.path.getsize(dst) == len(payload):
                    continue
                if os.path.exists(dst):
                    try:
                        os.unlink(dst)
                    except OSError:
                        pass
                with open(dst, "wb") as out_f:
                    out_f.write(payload)
        return True
    except OSError:
        return False


ensure_revcdos_luis_player(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_revcdos_luis_player(os.getcwd())


def _link_or_copy_file(src, dst):
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
        try:
            shutil.copy2(src, dst)
            return True
        except OSError:
            return False


def ensure_tkdr_assets(base_dir=None):
    """Materialize tkdr/game.iso, tkdr/eboot.bin, tkdr/ULUS10139_EBOOT.BIN, and tkdr/game.zip
    between /Users/diesel/Desktop/SkateAlley/tkdr/ and the active worktree.
    """
    root = os.path.abspath(base_dir or os.getcwd())
    target_tkdr = os.path.join(root, "tkdr")
    candidate_sources = [
        "/Users/diesel/Desktop/SkateAlley/tkdr",
        os.path.abspath(os.path.join(root, "..", "..", "..", "tkdr")),
    ]

    def _has_valid_binaries(d):
        iso_p = os.path.join(d, "game.iso")
        eb_p = os.path.join(d, "eboot.bin")
        try:
            return (
                os.path.isfile(iso_p)
                and os.path.getsize(iso_p) == TKDR_ISO_EXPECTED_SIZE
                and os.path.isfile(eb_p)
                and os.path.getsize(eb_p) == TKDR_EBOOT_EXPECTED_SIZE
            )
        except OSError:
            return False

    src_tkdr = None
    for cand in candidate_sources:
        if _has_valid_binaries(cand):
            src_tkdr = cand
            break

    if not _has_valid_binaries(target_tkdr) and not src_tkdr:
        try:
            scripts_dir = os.path.dirname(os.path.abspath(__file__))
            if scripts_dir not in sys.path:
                sys.path.insert(0, scripts_dir)
            from provision_tkdr import provision_tkdr
            provision_tkdr(worktree_root=root, verify_sha1=False)
            return _has_valid_binaries(target_tkdr)
        except Exception:
            return False

    if src_tkdr and os.path.abspath(src_tkdr) != os.path.abspath(target_tkdr):
        os.makedirs(target_tkdr, exist_ok=True)
        for name in ("game.iso", "eboot.bin", "ULUS10139_EBOOT.BIN", "game.zip"):
            src_f = os.path.join(src_tkdr, name)
            dst_f = os.path.join(target_tkdr, name)
            if os.path.isfile(src_f):
                _link_or_copy_file(src_f, dst_f)
            elif os.path.isfile(dst_f):
                _link_or_copy_file(dst_f, src_f)

        # Ensure tracked web files are also synced between worktree and shared cache
        for rel in (
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
        ):
            wt_f = os.path.join(target_tkdr, rel)
            sh_f = os.path.join(src_tkdr, rel)
            if os.path.isfile(wt_f) and not os.path.isfile(sh_f):
                _link_or_copy_file(wt_f, sh_f)
            elif os.path.isfile(sh_f) and not os.path.isfile(wt_f):
                _link_or_copy_file(sh_f, wt_f)

    return _has_valid_binaries(target_tkdr)


ensure_tkdr_assets(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_tkdr_assets(os.getcwd())


def ensure_melee_assets(base_dir=None):
    """Materialize melee/game.iso and tracked runtime files between
    /Users/diesel/Desktop/SkateAlley/melee/ and the active worktree.
    """
    root = os.path.abspath(base_dir or os.getcwd())
    target_melee = os.path.join(root, "melee")
    candidate_sources = [
        "/Users/diesel/Desktop/SkateAlley/melee",
        os.path.abspath(os.path.join(root, "..", "..", "..", "melee")),
    ]

    def _has_valid_binaries(d):
        iso_p = os.path.join(d, "game.iso")
        wasm_p = os.path.join(d, "melee_browser.wasm")
        js_p = os.path.join(d, "melee_browser.js")
        try:
            return (
                os.path.isfile(iso_p)
                and os.path.getsize(iso_p) == MELEE_ISO_EXPECTED_SIZE
                and os.path.isfile(wasm_p)
                and os.path.getsize(wasm_p) == MELEE_WASM_EXPECTED_SIZE
                and os.path.isfile(js_p)
                and os.path.getsize(js_p) == MELEE_JS_EXPECTED_SIZE
            )
        except OSError:
            return False

    src_melee = None
    for cand in candidate_sources:
        if _has_valid_binaries(cand):
            src_melee = cand
            break

    if not _has_valid_binaries(target_melee) and not src_melee:
        try:
            scripts_dir = os.path.dirname(os.path.abspath(__file__))
            if scripts_dir not in sys.path:
                sys.path.insert(0, scripts_dir)
            from provision_melee import provision_melee
            provision_melee(worktree_root=root)
            return _has_valid_binaries(target_melee)
        except Exception:
            return False

    if src_melee and not (os.path.isdir(target_melee) and os.path.samefile(src_melee, target_melee)):
        os.makedirs(target_melee, exist_ok=True)
        for name in (
            "game.iso",
            "index.html",
            "shell.mjs",
            "disc-cache.mjs",
            "coi-sw.js",
            "melee_browser.js",
            "melee_browser.wasm",
            "_headers",
        ):
            src_f = os.path.join(src_melee, name)
            dst_f = os.path.join(target_melee, name)
            if os.path.isfile(src_f):
                _link_or_copy_file(src_f, dst_f)
            elif os.path.isfile(dst_f):
                _link_or_copy_file(dst_f, src_f)

    return _has_valid_binaries(target_melee)


ensure_melee_assets(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_melee_assets(os.getcwd())


def ensure_mkd_assets(base_dir=None):
    """Materialize mkd/game.iso, mkd/main.dol, mkd/bin/mkd_runtime, and mkd/decomp_manifest.json
    between /Users/diesel/Desktop/SkateAlley/mkd/ and the active worktree.
    """
    root = os.path.abspath(base_dir or os.getcwd())
    target_mkd = os.path.join(root, "mkd")
    candidate_sources = [
        "/Users/diesel/Desktop/SkateAlley/mkd",
        os.path.abspath(os.path.join(root, "..", "..", "..", "mkd")),
    ]

    def _has_valid_binaries(d):
        iso_p = os.path.join(d, "game.iso")
        dol_p = os.path.join(d, "main.dol")
        idx_p = os.path.join(d, "index.html")
        try:
            return (
                os.path.isfile(iso_p)
                and os.path.getsize(iso_p) == MKD_ISO_EXPECTED_SIZE
                and os.path.isfile(dol_p)
                and os.path.getsize(dol_p) == MKD_DOL_EXPECTED_SIZE
                and os.path.isfile(idx_p)
            )
        except OSError:
            return False

    src_mkd = None
    for cand in candidate_sources:
        if _has_valid_binaries(cand):
            src_mkd = cand
            break

    if not _has_valid_binaries(target_mkd) and not src_mkd:
        try:
            scripts_dir = os.path.dirname(os.path.abspath(__file__))
            if scripts_dir not in sys.path:
                sys.path.insert(0, scripts_dir)
            from provision_mkd import provision_mkd
            provision_mkd(worktree_root=root, verify_sha1=False)
            return _has_valid_binaries(target_mkd)
        except Exception:
            return False

    if src_mkd and not (os.path.isdir(target_mkd) and os.path.samefile(src_mkd, target_mkd)):
        os.makedirs(target_mkd, exist_ok=True)
        for name in (
            "game.iso",
            "main.dol",
            "decomp_manifest.json",
            "index.html",
            "shell.mjs",
            "disc-cache.mjs",
            "coi-sw.js",
            "_headers",
            "bin/mkd_runtime",
        ):
            src_f = os.path.join(src_mkd, name)
            dst_f = os.path.join(target_mkd, name)
            if os.path.isfile(src_f):
                _link_or_copy_file(src_f, dst_f)
            elif os.path.isfile(dst_f):
                _link_or_copy_file(dst_f, src_f)

    return _has_valid_binaries(target_mkd)


ensure_mkd_assets(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ensure_mkd_assets(os.getcwd())

MKD_LIVE_RGBA_PATH = "/tmp/mkd_live_frame.rgba"
MKD_INPUT_STATE_FILE = "/tmp/mkd_pad_state.txt"
MKD_RUNTIME_LOG_PATH = "/tmp/mkd_runtime.log"
MKD_RGBA_EXPECTED_BYTES = 16 + (640 * 480 * 4)

_MKD_LOCK = threading.Lock()
_MKD_PROC = None
_MKD_BOOT_TO_FRAME = 535
_MKD_PULSE_SEQ = 0
_MKD_LAST_CLIENT_SEQ = 0
_MKD_LAST_PULSE_BTN = 0
_MKD_LAST_PULSE_SX = 0
_MKD_LAST_PULSE_SY = 0
_MKD_CURRENT_BTN = 0
_MKD_CURRENT_SX = 0
_MKD_CURRENT_SY = 0
_MKD_CURRENT_CX = 0
_MKD_CURRENT_CY = 0


def _write_mkd_pad_state_unlocked():
    tmp_path = MKD_INPUT_STATE_FILE + ".tmp"
    line = (
        f"{_MKD_CURRENT_BTN} {_MKD_CURRENT_SX} {_MKD_CURRENT_SY} "
        f"{_MKD_CURRENT_CX} {_MKD_CURRENT_CY} "
        f"{_MKD_PULSE_SEQ} {_MKD_LAST_PULSE_BTN} {_MKD_LAST_PULSE_SX} {_MKD_LAST_PULSE_SY}\n"
    )
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(line)
        os.replace(tmp_path, MKD_INPUT_STATE_FILE)
    except OSError:
        pass


def read_mkd_live_header():
    """Return (width, height, frame_seq, draws_this_frame) from MKD_LIVE_RGBA_PATH."""
    try:
        if os.path.isfile(MKD_LIVE_RGBA_PATH) and os.path.getsize(MKD_LIVE_RGBA_PATH) >= 16:
            with open(MKD_LIVE_RGBA_PATH, "rb") as f:
                hdr = f.read(16)
            if len(hdr) == 16:
                return struct.unpack("<IIII", hdr)
    except OSError:
        pass
    return (640, 480, 0, 0)


def ensure_mkd_runtime(base_dir=None, force_restart=False, boot_to_frame=None):
    """Ensure the recompiled Mortal Kombat: Deception runtime (mkd/bin/mkd_runtime) is running."""
    global _MKD_PROC, _MKD_BOOT_TO_FRAME, _MKD_PULSE_SEQ
    global _MKD_LAST_PULSE_BTN, _MKD_LAST_PULSE_SX, _MKD_LAST_PULSE_SY
    global _MKD_CURRENT_BTN, _MKD_CURRENT_SX, _MKD_CURRENT_SY, _MKD_CURRENT_CX, _MKD_CURRENT_CY

    root = os.path.abspath(base_dir or os.getcwd())
    runtime_bin = os.path.join(root, "mkd", "bin", "mkd_runtime")
    dol_path = os.path.join(root, "mkd", "main.dol")
    iso_path = os.path.join(root, "mkd", "game.iso")

    if not (os.path.isfile(runtime_bin) and os.path.isfile(dol_path) and os.path.isfile(iso_path)):
        return False

    with _MKD_LOCK:
        if boot_to_frame is not None:
            _MKD_BOOT_TO_FRAME = max(0, int(boot_to_frame))

        if not force_restart:
            if _MKD_PROC is not None and _MKD_PROC.poll() is None:
                return True
            try:
                if os.path.isfile(MKD_LIVE_RGBA_PATH) and (time.time() - os.path.getmtime(MKD_LIVE_RGBA_PATH)) < 2.5:
                    return True
            except OSError:
                pass

        if _MKD_PROC is not None:
            try:
                _MKD_PROC.terminate()
                _MKD_PROC.wait(timeout=2.0)
            except Exception:
                try:
                    _MKD_PROC.kill()
                except Exception:
                    pass
            _MKD_PROC = None

        try:
            subprocess.run(["pkill", "-f", "mkd/bin/mkd_runtime"], capture_output=True)
        except OSError:
            pass

        _MKD_PULSE_SEQ = 0
        _MKD_LAST_PULSE_BTN = 0
        _MKD_LAST_PULSE_SX = 0
        _MKD_LAST_PULSE_SY = 0
        _MKD_CURRENT_BTN = 0
        _MKD_CURRENT_SX = 0
        _MKD_CURRENT_SY = 0
        _MKD_CURRENT_CX = 0
        _MKD_CURRENT_CY = 0
        _write_mkd_pad_state_unlocked()

        if sys.platform != "darwin":
            print(
                f"[skatealley-app-local] Skipping macOS Mach-O mkd_runtime spawn inside {sys.platform} container.",
                flush=True,
            )
            return False

        env = os.environ.copy()
        env["MKD_LIVE_RGBA_PATH"] = MKD_LIVE_RGBA_PATH
        env["MKD_INPUT_STATE_FILE"] = MKD_INPUT_STATE_FILE
        env["MKD_BOOT_TO_FRAME"] = str(_MKD_BOOT_TO_FRAME)
        env["MKD_PACE_60HZ"] = "1"

        try:
            log_f = open(MKD_RUNTIME_LOG_PATH, "wb")
            _MKD_PROC = subprocess.Popen(
                [
                    runtime_bin,
                    dol_path,
                    "--iso", iso_path,
                    "--no-card",
                    "--max-blocks", "999999999999",
                ],
                cwd=root,
                env=env,
                stdout=log_f,
                stderr=subprocess.STDOUT,
            )
        except OSError as exc:
            print(f"[skatealley-app-local] WARNING: Failed to spawn mkd_runtime: {exc}", flush=True)
            _MKD_PROC = None
            return False
        print(
            f"[skatealley-app-local] Started mkd_runtime pid={_MKD_PROC.pid} boot_to_frame={_MKD_BOOT_TO_FRAME}",
            flush=True,
        )
        return True


# ============================================================================
# PostgreSQL v3 Wire Protocol Client & Sticker Persistence Layer (Spec 056)
# ============================================================================

STICKER_CATALOG_CODES = {
    "doom_tag": "HOLO-STK-01",
    "glass_doom": "HOLO-STK-02",
    "doom_cig": "HOLO-STK-03",
    "doom_watch": "HOLO-STK-04",
    "villainy_inc": "HOLO-STK-05",
    "skate3_doom": "HOLO-STK-06",
    "plato_arcade": "HOLO-STK-07",
}

DEFAULT_POSTGRES_DSN_CANDIDATES = [
    "postgresql://user:pass@host.docker.internal:5432/alpha",
    "postgresql://user:pass@10.0.0.62:5432/alpha",
    "postgresql://user:pass@127.0.0.1:5432/alpha",
]

_STICKER_DB_LOCK = threading.RLock()
_ACTIVE_POSTGRES_DSN = None
_STICKER_SCHEMA_READY = False


def resolve_postgres_dsn_candidates():
    """Return ordered PostgreSQL DSN candidates from env, .env, and Server Mac defaults."""
    candidates = []
    if _ACTIVE_POSTGRES_DSN:
        candidates.append(_ACTIVE_POSTGRES_DSN)

    for env_key in ("SKATEALLEY_DATABASE_URL", "DATABASE_URL"):
        val = os.environ.get(env_key, "").strip().strip("\"'")
        if val.startswith(("postgres://", "postgresql://")) and val not in candidates:
            candidates.append(val)

    candidate_env_files = [
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
    ]
    for env_path in candidate_env_files:
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for raw_line in f:
                        line = raw_line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        if k.strip() in ("SKATEALLEY_DATABASE_URL", "DATABASE_URL"):
                            cleaned = v.strip().strip("\"'")
                            if cleaned.startswith(("postgres://", "postgresql://")) and cleaned not in candidates:
                                candidates.append(cleaned)
            except OSError:
                pass

    for default_dsn in DEFAULT_POSTGRES_DSN_CANDIDATES:
        if default_dsn not in candidates:
            candidates.append(default_dsn)
    return candidates


def parse_postgres_dsn(dsn):
    parsed = urllib.parse.urlparse(dsn)
    return {
        "host": parsed.hostname or "127.0.0.1",
        "port": int(parsed.port or 5432),
        "user": urllib.parse.unquote(parsed.username or "user"),
        "password": urllib.parse.unquote(parsed.password or "pass"),
        "database": (parsed.path or "/alpha").lstrip("/") or "alpha",
    }


_PG_POOL_LOCK = threading.Lock()
_PG_IDLE_POOL = []
_PG_POOL_MAX_IDLE = 3
_PG_POOL_MAX_AGE_SEC = 45.0


class PgWireConnection:
    """Zero-dependency Python stdlib PostgreSQL v3 Wire Protocol + SCRAM-SHA-256 client with idle pool support."""

    def __init__(self, dsn, timeout=3.5):
        self.dsn = dsn
        self.timeout = timeout
        self.cfg = parse_postgres_dsn(dsn)
        self.sock = None
        self._broken = False
        self._reused_from_pool = False
        self._connect()

    def _connect(self):
        if self.sock is not None:
            try:
                self.sock.close()
            except Exception:
                pass
        self.sock = socket.create_connection((self.cfg["host"], self.cfg["port"]), timeout=self.timeout)
        self.sock.settimeout(self.timeout)
        self._broken = False
        self._handshake()

    def _recv_exact(self, n):
        buf = bytearray()
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise ConnectionError("Unexpected EOF from PostgreSQL server")
            buf.extend(chunk)
        return bytes(buf)

    def _read_message(self):
        hdr = self._recv_exact(5)
        mtype = chr(hdr[0])
        length = struct.unpack("!I", hdr[1:5])[0]
        body = self._recv_exact(length - 4) if length > 4 else b""
        return mtype, body

    def _send_message(self, mtype, payload=b""):
        hdr = mtype.encode("ascii") + struct.pack("!I", len(payload) + 4)
        self.sock.sendall(hdr + payload)

    @staticmethod
    def _parse_error_body(body):
        fields = {}
        for part in body.split(b"\x00"):
            if len(part) >= 2:
                fields[chr(part[0])] = part[1:].decode("utf-8", errors="replace")
        return f"{fields.get('S', 'ERROR')} {fields.get('C', '')}: {fields.get('M', 'PostgreSQL error')}".strip()

    def _handshake(self):
        user_b = self.cfg["user"].encode("utf-8")
        db_b = self.cfg["database"].encode("utf-8")
        params = (
            b"user\x00" + user_b + b"\x00"
            b"database\x00" + db_b + b"\x00"
            b"client_encoding\x00UTF8\x00\x00"
        )
        startup_pkt = struct.pack("!II", len(params) + 8, 196608) + params
        self.sock.sendall(startup_pkt)

        c_nonce = base64.b64encode(secrets.token_bytes(18)).decode("ascii")
        c_first_bare = f"n=,r={c_nonce}"
        password_bytes = self.cfg["password"].encode("utf-8")

        while True:
            mtype, body = self._read_message()
            if mtype == "R":
                atype = struct.unpack("!I", body[:4])[0]
                if atype == 0:
                    continue
                elif atype == 3:
                    # Cleartext password
                    self._send_message("p", password_bytes + b"\x00")
                elif atype == 5:
                    # MD5 password
                    salt = body[4:8]
                    inner = hashlib.md5(password_bytes + user_b).hexdigest().encode("ascii")
                    digest = "md5" + hashlib.md5(inner + salt).hexdigest()
                    self._send_message("p", digest.encode("ascii") + b"\x00")
                elif atype == 10:
                    # SASL (SCRAM-SHA-256)
                    mech = b"SCRAM-SHA-256\x00"
                    client_first = ("n,," + c_first_bare).encode("utf-8")
                    self._send_message("p", mech + struct.pack("!I", len(client_first)) + client_first)
                elif atype == 11:
                    # SASLContinue
                    s_first = body[4:].decode("utf-8")
                    parts = dict(item.split("=", 1) for item in s_first.split(","))
                    r_nonce = parts["r"]
                    if not r_nonce.startswith(c_nonce):
                        raise RuntimeError("SCRAM-SHA-256 server nonce mismatch")
                    salt = base64.b64decode(parts["s"])
                    iters = int(parts["i"])
                    salted_pw = hashlib.pbkdf2_hmac("sha256", password_bytes, salt, iters)
                    c_key = hmac.new(salted_pw, b"Client Key", hashlib.sha256).digest()
                    s_key = hashlib.sha256(c_key).digest()
                    c_final_no_proof = f"c=biws,r={r_nonce}"
                    auth_msg = f"{c_first_bare},{s_first},{c_final_no_proof}".encode("utf-8")
                    c_sig = hmac.new(s_key, auth_msg, hashlib.sha256).digest()
                    proof = bytes(a ^ b for a, b in zip(c_key, c_sig))
                    b64_proof = base64.b64encode(proof).decode("ascii")
                    c_final = f"{c_final_no_proof},p={b64_proof}".encode("utf-8")
                    self._send_message("p", c_final)
                elif atype == 12:
                    # SASLFinal
                    continue
                else:
                    raise RuntimeError(f"Unsupported PostgreSQL auth type: {atype}")
            elif mtype == "Z":
                break
            elif mtype == "E":
                raise RuntimeError(self._parse_error_body(body))

    def execute_simple(self, sql):
        """Execute simple SQL batch (DDL or unparameterized statements)."""
        for attempt in range(2):
            was_reused = self._reused_from_pool
            self._reused_from_pool = False
            try:
                self._send_message("Q", sql.encode("utf-8") + b"\x00")
                err_msg = None
                while True:
                    mtype, body = self._read_message()
                    if mtype == "E":
                        err_msg = self._parse_error_body(body)
                    elif mtype == "Z":
                        break
                if err_msg:
                    raise RuntimeError(err_msg)
                return
            except (ConnectionError, OSError, socket.timeout):
                self._broken = True
                if was_reused and attempt == 0:
                    self._connect()
                    continue
                raise

    def execute_params(self, sql, params=()):
        """Execute parameterized SQL ($1, $2, ...) via PostgreSQL Extended Query Protocol."""
        # 1. Parse ('P'): unnamed statement, SQL, 0 parameter type OIDs
        parse_payload = b"\x00" + sql.encode("utf-8") + b"\x00" + struct.pack("!H", 0)
        # 2. Bind ('B'): unnamed portal, unnamed statement, 0 format codes (all text), N params, 0 result format codes (all text)
        bind_parts = [b"\x00\x00", struct.pack("!H", 0), struct.pack("!H", len(params))]
        for p in params:
            if p is None:
                bind_parts.append(struct.pack("!i", -1))
            else:
                val_b = str(p).encode("utf-8")
                bind_parts.append(struct.pack("!i", len(val_b)) + val_b)
        bind_parts.append(struct.pack("!H", 0))
        bind_payload = b"".join(bind_parts)
        # 3. Describe ('D'): portal ''
        describe_payload = b"P\x00"
        # 4. Execute ('E'): portal '', 0 max rows (unlimited)
        execute_payload = b"\x00" + struct.pack("!I", 0)
        # 5. Sync ('S')
        pkt = (
            b"P" + struct.pack("!I", len(parse_payload) + 4) + parse_payload
            + b"B" + struct.pack("!I", len(bind_payload) + 4) + bind_payload
            + b"D" + struct.pack("!I", len(describe_payload) + 4) + describe_payload
            + b"E" + struct.pack("!I", len(execute_payload) + 4) + execute_payload
            + b"S" + struct.pack("!I", 4)
        )

        for attempt in range(2):
            was_reused = self._reused_from_pool
            self._reused_from_pool = False
            try:
                self.sock.sendall(pkt)

                columns = []
                rows = []
                err_msg = None

                while True:
                    mtype, body = self._read_message()
                    if mtype == "T":
                        # RowDescription
                        col_count = struct.unpack("!H", body[:2])[0]
                        idx = 2
                        columns = []
                        for _ in range(col_count):
                            end_name = body.index(b"\x00", idx)
                            col_name = body[idx:end_name].decode("utf-8", errors="replace")
                            columns.append(col_name)
                            idx = end_name + 1 + 18  # tableOID(4)+colAttr(2)+typeOID(4)+typeSize(2)+typeMod(4)+fmt(2)
                    elif mtype == "D":
                        # DataRow
                        col_count = struct.unpack("!H", body[:2])[0]
                        idx = 2
                        row_dict = {}
                        for c_idx in range(col_count):
                            val_len = struct.unpack("!i", body[idx:idx + 4])[0]
                            idx += 4
                            if val_len == -1:
                                val_str = None
                            else:
                                val_str = body[idx:idx + val_len].decode("utf-8", errors="replace")
                                idx += val_len
                            col_key = columns[c_idx] if c_idx < len(columns) else f"col_{c_idx}"
                            row_dict[col_key] = val_str
                        rows.append(row_dict)
                    elif mtype == "E":
                        err_msg = self._parse_error_body(body)
                    elif mtype == "Z":
                        break

                if err_msg:
                    raise RuntimeError(err_msg)
                return rows
            except (ConnectionError, OSError, socket.timeout):
                self._broken = True
                if was_reused and attempt == 0:
                    self._connect()
                    continue
                raise

    def close(self):
        self._broken = True
        if self.sock is not None:
            try:
                self._send_message("X")
            except Exception:
                pass
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None or self._broken or self.sock is None:
            self.close()
            return
        returned = False
        with _PG_POOL_LOCK:
            if len(_PG_IDLE_POOL) < _PG_POOL_MAX_IDLE:
                _PG_IDLE_POOL.append((time.monotonic(), self))
                returned = True
        if not returned:
            self.close()


def open_postgres_connection():
    """Acquire an authenticated PgWireConnection from the idle pool or open a new one."""
    global _ACTIVE_POSTGRES_DSN
    now_mono = time.monotonic()
    while True:
        candidate = None
        with _PG_POOL_LOCK:
            if _PG_IDLE_POOL:
                candidate = _PG_IDLE_POOL.pop()
        if candidate is None:
            break
        ts_mono, pooled_conn = candidate
        if (now_mono - ts_mono) <= _PG_POOL_MAX_AGE_SEC and not pooled_conn._broken and pooled_conn.sock is not None:
            pooled_conn._reused_from_pool = True
            return pooled_conn
        pooled_conn.close()

    last_err = None
    for dsn in resolve_postgres_dsn_candidates():
        try:
            conn = PgWireConnection(dsn, timeout=3.0)
            _ACTIVE_POSTGRES_DSN = dsn
            return conn
        except Exception as e:
            last_err = e
    raise ConnectionError(f"Unable to connect to PostgreSQL: {last_err}")


def ensure_sticker_schema(conn=None):
    """Ensure skatealley_placed_stickers table and index exist on PostgreSQL."""
    global _STICKER_SCHEMA_READY
    if _STICKER_SCHEMA_READY:
        return True
    with _STICKER_DB_LOCK:
        if _STICKER_SCHEMA_READY:
            return True
        own_conn = conn is None
        active_conn = conn or open_postgres_connection()
        try:
            active_conn.execute_simple(
                """
                CREATE TABLE IF NOT EXISTS skatealley_placed_stickers (
                    placed_id VARCHAR(128) PRIMARY KEY,
                    asset_id VARCHAR(64) NOT NULL,
                    code VARCHAR(32) NOT NULL DEFAULT 'HOLO-STK-01',
                    anchor_x DOUBLE PRECISION NOT NULL,
                    anchor_y DOUBLE PRECISION NOT NULL,
                    anchor_z DOUBLE PRECISION NOT NULL,
                    pos_x DOUBLE PRECISION NOT NULL,
                    pos_y DOUBLE PRECISION NOT NULL,
                    pos_z DOUBLE PRECISION NOT NULL,
                    normal_x DOUBLE PRECISION NOT NULL,
                    normal_y DOUBLE PRECISION NOT NULL,
                    normal_z DOUBLE PRECISION NOT NULL,
                    rotation_rad DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                    size_meters DOUBLE PRECISION NOT NULL DEFAULT 0.65,
                    surface_zone VARCHAR(64) NOT NULL DEFAULT 'alley_wall_left',
                    surface_id VARCHAR(64) NOT NULL DEFAULT 'COLLIDER_STICKER_WALL_L',
                    surface_label VARCHAR(128) NOT NULL DEFAULT 'Left Alley Wall (Interior)',
                    wall_side VARCHAR(16) NOT NULL DEFAULT 'L',
                    tagger VARCHAR(64) NOT NULL DEFAULT '',
                    message VARCHAR(280) NOT NULL DEFAULT '',
                    created_at_ms BIGINT NOT NULL,
                    updated_at_ms BIGINT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_skatealley_stickers_created_at
                    ON skatealley_placed_stickers (created_at_ms ASC, placed_id ASC);
                """
            )
            _STICKER_SCHEMA_READY = True
            return True
        finally:
            if own_conn:
                active_conn.close()


def _parse_finite_vec3(obj, fallback=None):
    if not isinstance(obj, dict):
        if fallback is not None:
            return fallback
        raise ValueError("Expected vector3 object with finite x, y, z numbers")
    try:
        x = float(obj.get("x"))
        y = float(obj.get("y"))
        z = float(obj.get("z"))
    except (TypeError, ValueError):
        raise ValueError("Vector3 coordinates must be numeric")
    if not (math.isfinite(x) and math.isfinite(y) and math.isfinite(z)):
        raise ValueError("Vector3 coordinates must be finite numbers")
    return {"x": round(x, 6), "y": round(y, 6), "z": round(z, 6)}


def normalize_sticker_payload(raw):
    """Validate and sanitize incoming sticker payload per Spec 056 §5.1-5.2."""
    if not isinstance(raw, dict):
        raise ValueError("Sticker payload must be a JSON object")

    now_ms = int(time.time() * 1000)
    raw_placed_id = str(raw.get("placedId") or raw.get("placed_id") or "").strip()
    if not raw_placed_id:
        raw_placed_id = f"placed_sticker_{now_ms}_{secrets.token_hex(4)}"
    placed_id = raw_placed_id[:128]

    asset_id = str(raw.get("assetId") or raw.get("stickerId") or raw.get("asset_id") or "doom_tag").strip()[:64]
    if not asset_id:
        asset_id = "doom_tag"
    code = str(raw.get("code") or STICKER_CATALOG_CODES.get(asset_id, "HOLO-STK-01")).strip()[:32]

    pos_raw = raw.get("position")
    anchor_raw = raw.get("anchorPosition") or raw.get("anchor_position")
    if pos_raw is None and anchor_raw is None:
        raise ValueError("Sticker payload must include 'position' or 'anchorPosition'")
    position = _parse_finite_vec3(pos_raw if pos_raw is not None else anchor_raw)
    anchor = _parse_finite_vec3(anchor_raw if anchor_raw is not None else pos_raw, fallback=position)
    normal = _parse_finite_vec3(raw.get("normal"), fallback={"x": 1.0, "y": 0.0, "z": 0.0})

    # Normalize normal vector to unit length
    n_len = math.sqrt(normal["x"] ** 2 + normal["y"] ** 2 + normal["z"] ** 2)
    if n_len > 1e-9:
        normal = {
            "x": round(normal["x"] / n_len, 6),
            "y": round(normal["y"] / n_len, 6),
            "z": round(normal["z"] / n_len, 6),
        }
    else:
        normal = {"x": 1.0, "y": 0.0, "z": 0.0}

    raw_rot_rad = raw.get("rotationRad")
    if raw_rot_rad is None and raw.get("rotationDeg") is not None:
        raw_rot_rad = math.radians(float(raw.get("rotationDeg")))
    rot_rad = float(raw_rot_rad if raw_rot_rad is not None else 0.0)
    if not math.isfinite(rot_rad):
        raise ValueError("rotationRad must be finite")
    # Wrap to [-pi, +pi]
    rot_rad = ((rot_rad + math.pi) % (2.0 * math.pi)) - math.pi

    raw_size = raw.get("sizeMeters") if raw.get("sizeMeters") is not None else raw.get("size")
    size_val = float(raw_size if raw_size is not None else 0.65)
    if not math.isfinite(size_val):
        raise ValueError("sizeMeters must be finite")
    size_meters = round(min(1.0, max(0.25, size_val)), 4)

    surface_zone = str(raw.get("surfaceZone") or raw.get("surface_zone") or "alley_wall_left").strip()[:64] or "alley_wall_left"
    surface_id = str(raw.get("surfaceId") or raw.get("colliderName") or raw.get("surface_id") or "COLLIDER_STICKER_WALL_L").strip()[:64] or "COLLIDER_STICKER_WALL_L"
    surface_label = str(raw.get("surfaceLabel") or raw.get("surface_label") or "Left Alley Wall (Interior)").strip()[:128] or "Left Alley Wall (Interior)"
    wall_side = str(
        raw.get("wallSide")
        or raw.get("wall_side")
        or ("L" if normal["x"] > 0.5 else ("R" if normal["x"] < -0.5 else "FLOOR"))
    ).strip()[:16] or "L"

    tagger = str(raw.get("tagger") if raw.get("tagger") is not None else "").strip()[:64]
    message = str(raw.get("message") if raw.get("message") is not None else "").strip()[:280]

    try:
        created_at_ms = int(float(raw.get("createdAt") or raw.get("created_at_ms") or now_ms))
    except (TypeError, ValueError):
        created_at_ms = now_ms
    try:
        updated_at_ms = int(float(raw.get("updatedAt") or raw.get("updated_at_ms") or now_ms))
    except (TypeError, ValueError):
        updated_at_ms = now_ms

    return {
        "placed_id": placed_id,
        "asset_id": asset_id,
        "code": code,
        "anchor_x": anchor["x"],
        "anchor_y": anchor["y"],
        "anchor_z": anchor["z"],
        "pos_x": position["x"],
        "pos_y": position["y"],
        "pos_z": position["z"],
        "normal_x": normal["x"],
        "normal_y": normal["y"],
        "normal_z": normal["z"],
        "rotation_rad": round(rot_rad, 6),
        "size_meters": size_meters,
        "surface_zone": surface_zone,
        "surface_id": surface_id,
        "surface_label": surface_label,
        "wall_side": wall_side,
        "tagger": tagger,
        "message": message,
        "created_at_ms": created_at_ms,
        "updated_at_ms": updated_at_ms,
    }


def row_to_sticker_record(row):
    """Convert a PostgreSQL row dict from skatealley_placed_stickers into the frontend JSON contract."""
    rot_rad = float(row["rotation_rad"])
    size_m = float(row["size_meters"])
    asset_id = str(row["asset_id"])
    return {
        "placedId": str(row["placed_id"]),
        "assetId": asset_id,
        "stickerId": asset_id,
        "code": str(row["code"]),
        "anchorPosition": {
            "x": round(float(row["anchor_x"]), 4),
            "y": round(float(row["anchor_y"]), 4),
            "z": round(float(row["anchor_z"]), 4),
        },
        "position": {
            "x": round(float(row["pos_x"]), 4),
            "y": round(float(row["pos_y"]), 4),
            "z": round(float(row["pos_z"]), 4),
        },
        "normal": {
            "x": round(float(row["normal_x"]), 6),
            "y": round(float(row["normal_y"]), 6),
            "z": round(float(row["normal_z"]), 6),
        },
        "rotationRad": round(rot_rad, 6),
        "rotationDeg": round(math.degrees(rot_rad), 2),
        "size": round(size_m, 4),
        "sizeMeters": round(size_m, 4),
        "surfaceZone": str(row["surface_zone"]),
        "surfaceId": str(row["surface_id"]),
        "colliderName": str(row["surface_id"]),
        "surfaceLabel": str(row["surface_label"]),
        "wallSide": str(row["wall_side"]),
        "tagger": str(row["tagger"] or ""),
        "message": str(row["message"] or ""),
        "createdAt": int(row["created_at_ms"]),
        "updatedAt": int(row["updated_at_ms"]),
    }


SELECT_ALL_STICKERS_SQL = """
SELECT
    placed_id, asset_id, code,
    anchor_x, anchor_y, anchor_z,
    pos_x, pos_y, pos_z,
    normal_x, normal_y, normal_z,
    rotation_rad, size_meters,
    surface_zone, surface_id, surface_label, wall_side,
    tagger, message, created_at_ms, updated_at_ms
FROM skatealley_placed_stickers
ORDER BY created_at_ms ASC, placed_id ASC
"""

UPSERT_STICKER_SQL = """
INSERT INTO skatealley_placed_stickers (
    placed_id, asset_id, code,
    anchor_x, anchor_y, anchor_z,
    pos_x, pos_y, pos_z,
    normal_x, normal_y, normal_z,
    rotation_rad, size_meters,
    surface_zone, surface_id, surface_label, wall_side,
    tagger, message, created_at_ms, updated_at_ms
) VALUES (
    $1, $2, $3,
    $4, $5, $6,
    $7, $8, $9,
    $10, $11, $12,
    $13, $14,
    $15, $16, $17, $18,
    $19, $20, $21, $22
)
ON CONFLICT (placed_id) DO UPDATE SET
    asset_id = EXCLUDED.asset_id,
    code = EXCLUDED.code,
    anchor_x = EXCLUDED.anchor_x,
    anchor_y = EXCLUDED.anchor_y,
    anchor_z = EXCLUDED.anchor_z,
    pos_x = EXCLUDED.pos_x,
    pos_y = EXCLUDED.pos_y,
    pos_z = EXCLUDED.pos_z,
    normal_x = EXCLUDED.normal_x,
    normal_y = EXCLUDED.normal_y,
    normal_z = EXCLUDED.normal_z,
    rotation_rad = EXCLUDED.rotation_rad,
    size_meters = EXCLUDED.size_meters,
    surface_zone = EXCLUDED.surface_zone,
    surface_id = EXCLUDED.surface_id,
    surface_label = EXCLUDED.surface_label,
    wall_side = EXCLUDED.wall_side,
    tagger = CASE
        WHEN EXCLUDED.tagger = '' AND skatealley_placed_stickers.tagger <> '' AND EXCLUDED.updated_at_ms <= skatealley_placed_stickers.updated_at_ms
        THEN skatealley_placed_stickers.tagger
        ELSE EXCLUDED.tagger
    END,
    message = CASE
        WHEN EXCLUDED.message = '' AND skatealley_placed_stickers.message <> '' AND EXCLUDED.updated_at_ms <= skatealley_placed_stickers.updated_at_ms
        THEN skatealley_placed_stickers.message
        ELSE EXCLUDED.message
    END,
    updated_at_ms = GREATEST(skatealley_placed_stickers.updated_at_ms, EXCLUDED.updated_at_ms)
WHERE EXCLUDED.updated_at_ms >= skatealley_placed_stickers.updated_at_ms
RETURNING
    placed_id, asset_id, code,
    anchor_x, anchor_y, anchor_z,
    pos_x, pos_y, pos_z,
    normal_x, normal_y, normal_z,
    rotation_rad, size_meters,
    surface_zone, surface_id, surface_label, wall_side,
    tagger, message, created_at_ms, updated_at_ms
"""


def list_persisted_stickers():
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_sticker_schema(conn)
            rows = conn.execute_params(SELECT_ALL_STICKERS_SQL)
            return [row_to_sticker_record(r) for r in rows]


def upsert_persisted_sticker(raw_payload):
    norm = normalize_sticker_payload(raw_payload)
    params = (
        norm["placed_id"],
        norm["asset_id"],
        norm["code"],
        norm["anchor_x"],
        norm["anchor_y"],
        norm["anchor_z"],
        norm["pos_x"],
        norm["pos_y"],
        norm["pos_z"],
        norm["normal_x"],
        norm["normal_y"],
        norm["normal_z"],
        norm["rotation_rad"],
        norm["size_meters"],
        norm["surface_zone"],
        norm["surface_id"],
        norm["surface_label"],
        norm["wall_side"],
        norm["tagger"],
        norm["message"],
        norm["created_at_ms"],
        norm["updated_at_ms"],
    )
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_sticker_schema(conn)
            rows = conn.execute_params(UPSERT_STICKER_SQL, params)
            if not rows:
                rows = conn.execute_params(
                    SELECT_ALL_STICKERS_SQL.replace(
                        "ORDER BY created_at_ms ASC, placed_id ASC",
                        "WHERE placed_id = $1",
                    ),
                    (norm["placed_id"],),
                )
            return row_to_sticker_record(rows[0]) if rows else None


def delete_persisted_sticker(placed_id):
    clean_id = str(placed_id or "").strip()[:128]
    if not clean_id:
        raise ValueError("placedId is required for deletion")
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_sticker_schema(conn)
            rows = conn.execute_params(
                "DELETE FROM skatealley_placed_stickers WHERE placed_id = $1 RETURNING placed_id",
                (clean_id,),
            )
            return len(rows) > 0


def get_sticker_db_health():
    try:
        with _STICKER_DB_LOCK:
            with open_postgres_connection() as conn:
                ensure_sticker_schema(conn)
                rows = conn.execute_params("SELECT COUNT(*) AS cnt FROM skatealley_placed_stickers")
                cnt = int(rows[0]["cnt"]) if rows and rows[0].get("cnt") is not None else 0
                return {"ready": True, "storage": "postgres", "count": cnt, "error": None}
    except Exception as e:
        return {"ready": False, "storage": "postgres", "count": 0, "error": str(e)}


# ============================================================================
# PostgreSQL Scene Layout Persistence Layer (Hologram Columns & Scene Overrides)
# ============================================================================

_SCENE_LAYOUT_SCHEMA_READY = False

ALLOWED_SCENE_LAYOUT_KEYS = {
    "holo_columns",
    "math_pods",
    "character_camera",
    "lamppost_light",
    "player_spawn",
    "startup_camera_pan",
    "watercolor_display",
    "intro_dialogue_boxes",
    "scene_cuts",
}


def ensure_scene_layout_schema(conn=None):
    """Ensure skatealley_scene_layouts table exists on PostgreSQL."""
    global _SCENE_LAYOUT_SCHEMA_READY
    if _SCENE_LAYOUT_SCHEMA_READY:
        return True
    with _STICKER_DB_LOCK:
        if _SCENE_LAYOUT_SCHEMA_READY:
            return True
        own_conn = conn is None
        active_conn = conn or open_postgres_connection()
        try:
            active_conn.execute_simple(
                """
                CREATE TABLE IF NOT EXISTS skatealley_scene_layouts (
                    layout_key VARCHAR(64) PRIMARY KEY,
                    payload_json TEXT NOT NULL,
                    updated_at_ms BIGINT NOT NULL
                );
                """
            )
            _SCENE_LAYOUT_SCHEMA_READY = True
            return True
        finally:
            if own_conn:
                active_conn.close()


def list_persisted_scene_layouts():
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_scene_layout_schema(conn)
            rows = conn.execute_params(
                "SELECT layout_key, payload_json, updated_at_ms FROM skatealley_scene_layouts ORDER BY layout_key ASC"
            )
            layouts = {}
            updated_at = {}
            for r in rows:
                k = str(r["layout_key"])
                try:
                    layouts[k] = json.loads(r["payload_json"])
                    updated_at[k] = int(r["updated_at_ms"])
                except Exception:
                    continue
            return {"layouts": layouts, "updatedAtMs": updated_at}


def upsert_persisted_scene_layouts(entries, default_updated_at_ms=None):
    if not isinstance(entries, dict) or not entries:
        raise ValueError("entries must be a non-empty dict mapping layout_key -> JSON payload")
    now_ms = int(default_updated_at_ms if default_updated_at_ms is not None else time.time() * 1000)
    saved = {}
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_scene_layout_schema(conn)
            for raw_key, payload in entries.items():
                key = str(raw_key or "").strip()[:64]
                if not key or not re.match(r"^[a-zA-Z0-9_.-]+$", key):
                    raise ValueError(f"Invalid scene layout key '{raw_key}'")
                if not isinstance(payload, (dict, list)):
                    raise ValueError(f"Scene layout payload for '{key}' must be a JSON object or array")
                encoded = json.dumps(payload, separators=(",", ":"))
                conn.execute_params(
                    """
                    INSERT INTO skatealley_scene_layouts (layout_key, payload_json, updated_at_ms)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (layout_key) DO UPDATE SET
                        payload_json = EXCLUDED.payload_json,
                        updated_at_ms = EXCLUDED.updated_at_ms
                    """,
                    (key, encoded, now_ms),
                )
                saved[key] = now_ms
    return saved


def delete_persisted_scene_layout(layout_key):
    clean_key = str(layout_key or "").strip()[:64]
    if not clean_key:
        raise ValueError("layout key is required for deletion")
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_scene_layout_schema(conn)
            if clean_key == "all":
                rows = conn.execute_params("DELETE FROM skatealley_scene_layouts RETURNING layout_key")
            else:
                rows = conn.execute_params(
                    "DELETE FROM skatealley_scene_layouts WHERE layout_key = $1 RETURNING layout_key",
                    (clean_key,),
                )
            return [str(r["layout_key"]) for r in rows]


def get_scene_layout_db_health():
    try:
        with _STICKER_DB_LOCK:
            with open_postgres_connection() as conn:
                ensure_scene_layout_schema(conn)
                rows = conn.execute_params(
                    "SELECT layout_key FROM skatealley_scene_layouts ORDER BY layout_key ASC"
                )
                keys = [str(r["layout_key"]) for r in rows]
                return {"ready": True, "storage": "postgres", "keys": keys, "error": None}
    except Exception as e:
        return {"ready": False, "storage": "postgres", "keys": [], "error": str(e)}


def get_combined_db_health():
    """Execute sticker + scene-layout PostgreSQL health check in a single connection & query roundtrip."""
    try:
        with _STICKER_DB_LOCK:
            with open_postgres_connection() as conn:
                ensure_sticker_schema(conn)
                ensure_scene_layout_schema(conn)
                rows = conn.execute_params(
                    "SELECT "
                    "(SELECT COUNT(*) FROM skatealley_placed_stickers) AS sticker_cnt, "
                    "COALESCE((SELECT string_agg(layout_key, ',' ORDER BY layout_key ASC) FROM skatealley_scene_layouts), '') AS layout_keys"
                )
                row = rows[0] if rows else {}
                cnt = int(row.get("sticker_cnt") or 0)
                keys_raw = str(row.get("layout_keys") or "")
                keys = [k for k in keys_raw.split(",") if k]
                return (
                    {"ready": True, "storage": "postgres", "count": cnt, "error": None},
                    {"ready": True, "storage": "postgres", "keys": keys, "error": None},
                )
    except Exception as e:
        return get_sticker_db_health(), get_scene_layout_db_health()


class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class SkateAlleyRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def translate_path(self, path):
        resolved = super().translate_path(path)
        clean_path = path.split("?", 1)[0].split("#", 1)[0]
        if clean_path.lower().startswith("/revcdos/vcsky/"):
            rel = os.path.relpath(resolved, os.getcwd())
            if os.path.exists(resolved) and rel == rel.lower():
                return resolved
            parts = rel.split(os.sep)
            cur = os.getcwd()
            for part in parts:
                if not os.path.isdir(cur):
                    return resolved
                if part == part.lower():
                    candidate = os.path.join(cur, part)
                    if os.path.exists(candidate):
                        cur = candidate
                        continue
                part_lower = part.lower()
                matched = next(
                    (entry for entry in os.listdir(cur) if entry.lower() == part_lower),
                    None,
                )
                if matched is None:
                    return resolved
                cur = os.path.join(cur, matched)
            return cur
        if os.path.exists(resolved):
            return resolved
        return resolved

    def handle(self):
        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Origin, Authorization, X-Visitor-Token")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        self.send_header("Accept-Ranges", "bytes")
        req_path = getattr(self, "path", "").split("?", 1)[0].split("#", 1)[0]
        _, req_ext = os.path.splitext(req_path.lower())
        is_dynamic_or_code = (
            req_path in ("", "/", "/health", "/tunnel.json")
            or req_path.endswith("/")
            or req_path.startswith("/api/")
            or req_ext in ("", ".html", ".htm", ".js", ".mjs", ".css", ".json")
        )
        if is_dynamic_or_code:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        is_coi_route = (
            req_path == "/tkdr"
            or req_path.startswith("/tkdr/")
            or req_path == "/melee"
            or req_path.startswith("/melee/")
            or req_path == "/studio"
            or req_path.startswith("/studio/")
            or req_path == "/mkd"
            or req_path.startswith("/mkd/")
            or os.path.basename(os.getcwd()) in ("tkdr", "melee", "studio", "mkd")
        )
        if is_coi_route:
            self.send_header("Cross-Origin-Opener-Policy", "same-origin")
            self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
            self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        elif req_path.startswith(("/vendor/", "/api/studio/", "/api/melee/")):
            self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def guess_type(self, path):
        _, ext = os.path.splitext(path)
        ext_lower = ext.lower()
        if ext_lower in CUSTOM_MIME_TYPES:
            return CUSTOM_MIME_TYPES[ext_lower]
        if ext_lower in EXTRA_MIME_TYPES:
            return EXTRA_MIME_TYPES[ext_lower]
        if re.match(r"^\.part\d+$", ext_lower):
            return "application/octet-stream"
        return super().guess_type(path)

    def _send_json(self, status_code, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _read_json_body(self):
        try:
            length = int(self.headers.get("Content-Length") or "0")
        except ValueError:
            length = 0
        if length <= 0:
            return {}
        raw = self.rfile.read(min(length, 1024 * 512))
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def _handle_graphrag_status(self):
        engine = get_knowledge_graph_engine()
        st = engine.status()
        return self._send_json(200 if st.get("ready") else 503, st)

    def _handle_graphrag_query(self):
        engine = get_knowledge_graph_engine()
        st = engine.status()
        if not st.get("ready"):
            return self._send_json(503, {
                "ok": False,
                "ready": False,
                "error": st.get("error", "GRAPHRAG_UNAVAILABLE"),
                "message": st.get("message", "Knowledge graph failed validation."),
            })

        body = self._read_json_body()
        query_text = str(body.get("query") or "").strip()
        raw_hops = body.get("maxHops", 2)
        try:
            max_hops = max(1, min(3, int(raw_hops)))
        except (TypeError, ValueError):
            max_hops = 2

        recent_messages = body.get("recentMessages") if isinstance(body.get("recentMessages"), list) else None
        result = engine.query(
            query_text=query_text,
            recent_messages=recent_messages,
            max_hops=max_hops,
        )
        return self._send_json(200, result)

    def _handle_intro_generate(self):
        t0 = time.time()
        token = resolve_hf_token()
        if not token:
            return self._send_json(503, {
                "ok": False,
                "error": "MISSING_HF_TOKEN",
                "message": "HF_TOKEN is not configured in environment or .env on the SkateAlley server.",
            })

        engine = get_knowledge_graph_engine()
        st = engine.status()
        bio_summary = engine.build_biographical_anchor_summary() if st.get("ready") else ""
        dataset_version = st.get("datasetVersion") if st.get("ready") else None

        body = self._read_json_body()
        requested_model = str(body.get("model") or DEFAULT_INTRO_GENERATE_MODEL).strip()
        candidates = []
        if requested_model in _LEGACY_CHAT_MODEL_ALIASES:
            candidates.extend(INTRO_MODEL_FALLBACK_CHAIN)
        else:
            candidates.append(requested_model)
            for fb in INTRO_MODEL_FALLBACK_CHAIN:
                if fb not in candidates:
                    candidates.append(fb)

        anchor_json = json.dumps({
            "schema_version": "1.0",
            "cards": AUTHORITATIVE_INTRO_ANCHOR_CARDS,
        }, ensure_ascii=False, indent=2)

        system_prompt = (
            "You generate the 7-card first-person welcome dialogue sequence for Luis's interactive 3D "
            "Freeman Alley portfolio (SkateAlley). You MUST output ONLY a single valid JSON object "
            "conforming strictly to the FreemanAlleyGenerativeIntroDeck Draft 2020-12 JSON Schema.\n\n"
            "STRICT ANCHOR & VOICE INVARIANTS (NEVER HALLUCINATE BIOGRAPHY):\n"
            "1. Keep Luis's authentic, witty, energetic first-person voice closely anchored to the 7 hand-authored "
            "anchor cards below (lightly riffing phrasing is allowed, inventing fake jobs/degrees/projects is FORBIDDEN).\n"
            "2. Card 1 (index=1, id='card_01', header='01 // WELCOME', requires_question_prompt=false): "
            "Must introduce 'Luis', age '26', who builds software that feels like magic.\n"
            "3. Card 2 (index=2, id='card_02', header='02 // ABOUT ME', requires_question_prompt=false): "
            "Must preserve hiking, swimming, eating good food, and building; studying corporate finance and accounting "
            "in college before changing major to 'Philosophy and Religion' during the COVID era; speedrunning AI psychosis "
            "with GPT-3.5 / GPT3.5 in 2022; and 'e/acc, baby.'\n"
            "4. Card 3 (index=3, id='card_03', header='03 // PROJECTS & ARCHITECTURE', requires_question_prompt=false): "
            "Must describe Luis's work on display down the alley alongside where he excels in the technical stack.\n"
            "5. Card 4 (index=4, id='card_04', header='04 // EXPLORE THE ALLEY', requires_question_prompt=false): "
            "Must preserve the 'reverse engineer anything' GitHub repo leading Luis and other nerds to reverse-engineer "
            "toilet sensors, smart TVs, video games, and critical infrastructure.\n"
            "6. Card 5 (index=5, id='card_05', header='05 // GAMES', requires_question_prompt=false): "
            "Must steer clear of reverse engineering critical infrastructure for now, highlight playable decompiled games "
            "down the alleyway, and mention Luis's generative pipeline to put yourself in-game.\n"
            "7. Card 6 (index=6, id='card_06', header='06 // GENERATIVE PIPELINE', requires_question_prompt=false): "
            "Must list skating, committing grand theft auto, fighting in Super Smash Bros, killing zombies, or joining Luis in the alleyway.\n"
            "8. Card 7 (index=7, id='card_07', header='07 // MENU', requires_question_prompt=true): "
            "Must explain using the menu to leave a message in the alleyway, warn that job recruiters visit so TREAD LIGHTLY "
            "and explicitly include 'DON’T BE A DICKHEAD, DEVON!', mention GitHub/email/Twitter, note that this conversation "
            "is generative, and end with a direct question asking if the visitor has any questions for Luis (ending with '?').\n"
            "9. Every card 'body' string MUST be between 45 and 440 characters."
        )

        user_prompt = (
            f"AUTHORITATIVE 7 ANCHOR CARDS:\n{anchor_json}\n\n"
            f"VERIFIED BIOGRAPHICAL CONTEXT:\n{bio_summary}\n\n"
            "Generate the FreemanAlleyGenerativeIntroDeck JSON object now."
        )

        response_format_spec = {
            "type": "json_schema",
            "json_schema": {
                "name": "FreemanAlleyGenerativeIntroDeck",
                "strict": True,
                "schema": INTRO_DECK_JSON_SCHEMA,
            },
        }

        res = call_hf_chat_completions(
            token=token,
            model_candidates=candidates,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2200,
            temperature=0.40,
            use_low_reasoning=True,
            timeout_sec=8.0,
            response_format=response_format_spec,
            total_deadline_sec=8.0,
        )
        if not res.get("ok"):
            return self._send_json(502, {
                "ok": False,
                "error": res.get("error", "UPSTREAM_HF_ERROR"),
                "message": res.get("message", "Upstream Hugging Face intro generation failed."),
                "latencyMs": round((time.time() - t0) * 1000.0, 1),
            })

        cleaned_json_str = extract_json_object_from_text(res.get("content", ""))
        try:
            parsed_payload = json.loads(cleaned_json_str)
        except json.JSONDecodeError as exc:
            return self._send_json(502, {
                "ok": False,
                "error": "SCHEMA_VALIDATION_FAILED",
                "schemaValid": False,
                "model": res.get("model"),
                "message": f"Upstream LLM returned malformed JSON at line {exc.lineno}, col {exc.colno}: {exc.msg}",
                "validationErrors": [str(exc)],
                "latencyMs": round((time.time() - t0) * 1000.0, 1),
            })

        is_valid, validation_errors, normalized_deck = validate_intro_deck_payload(parsed_payload)
        if not is_valid or not normalized_deck:
            return self._send_json(502, {
                "ok": False,
                "error": "SCHEMA_VALIDATION_FAILED",
                "schemaValid": False,
                "model": res.get("model"),
                "message": "Generated intro deck violated FreemanAlleyGenerativeIntroDeck schema invariants.",
                "validationErrors": validation_errors,
                "latencyMs": round((time.time() - t0) * 1000.0, 1),
            })

        total_ms = round((time.time() - t0) * 1000.0, 1)
        return self._send_json(200, {
            "ok": True,
            "source": "hf_json_schema",
            "schemaValid": True,
            "schema_version": normalized_deck["schema_version"],
            "cards": normalized_deck["cards"],
            "model": res["model"],
            "requestedModel": requested_model,
            "datasetVersion": dataset_version,
            "latencyMs": total_ms,
            "upstreamLatencyMs": res.get("latencyMs", total_ms),
            "usage": res.get("usage", {}),
        })

    def _handle_doom_starters(self):
        token = resolve_hf_token()
        if not token:
            return self._send_json(503, {
                "ok": False,
                "error": "MISSING_HF_TOKEN",
                "message": "HF_TOKEN is not configured in environment or .env on the SkateAlley server.",
            })

        engine = get_knowledge_graph_engine()
        graph_status = engine.status()
        if not graph_status.get("ready"):
            return self._send_json(503, {
                "ok": False,
                "error": graph_status.get("error", "GRAPHRAG_UNAVAILABLE"),
                "message": graph_status.get("message", "Knowledge graph failed validation."),
            })

        body = self._read_json_body()
        requested_model = str(body.get("model") or DEFAULT_DOOM_STARTERS_MODEL).strip()
        topic_prompt = str(body.get("topicPrompt") if body.get("topicPrompt") is not None else DEFAULT_STARTER_TOPIC_PROMPT).strip()

        graph_query_seed = (
            topic_prompt
            if topic_prompt
            else "Luis Rejection Station resume scanner TopStepXFA GraphRAG college reverse engineering games"
        )
        graph_res = engine.query(query_text=graph_query_seed, max_hops=2)
        graphrag_meta = {
            "datasetVersion": graph_res["datasetVersion"],
            "seedNodeIds": graph_res["seedNodeIds"],
            "retrievedNodeCount": graph_res["retrievedNodeCount"],
            "retrievedEdgeCount": graph_res["retrievedEdgeCount"],
            "hops": graph_res["hops"],
            "retrievalLatencyMs": graph_res["retrievalLatencyMs"],
        }

        candidates = []
        if requested_model in _LEGACY_CHAT_MODEL_ALIASES:
            candidates.extend(STARTERS_MODEL_FALLBACK_CHAIN)
        else:
            candidates.append(requested_model)
            for fb in STARTERS_MODEL_FALLBACK_CHAIN:
                if fb not in candidates:
                    candidates.append(fb)

        user_instruction = (
            "Using the verified GraphRAG biographical subgraph below about Luis and his Freeman Alley portfolio, "
            "generate a JSON array containing exactly 2 short, specific, intriguing visitor questions "
            "(each under 70 characters) about Luis's projects, Rejection Station story, education, or decompiled games. "
            "Output ONLY a valid JSON array of 2 strings, e.g. [\"Question 1?\", \"Question 2?\"].\n\n"
            f"{graph_res['contextBlock']}"
        )
        if topic_prompt:
            user_instruction += f"\nTopic focus: {topic_prompt}"

        messages = [{"role": "user", "content": user_instruction}]
        res = call_hf_chat_completions(
            token=token,
            model_candidates=candidates,
            messages=messages,
            max_tokens=600,
            temperature=0.80,
            use_low_reasoning=True,
            timeout_sec=12.0,
        )
        if not res.get("ok"):
            return self._send_json(502, res)

        starters = parse_two_starters_from_text(res.get("content", ""))
        if not starters or len(starters) < 2:
            return self._send_json(502, {
                "ok": False,
                "error": "INVALID_STARTER_FORMAT",
                "message": f"Model {res.get('model')} returned unparseable starter format: {res.get('content', '')[:120]}",
            })

        return self._send_json(200, {
            "ok": True,
            "model": res["model"],
            "requestedModel": requested_model,
            "topicPrompt": topic_prompt,
            "starters": starters[:2],
            "latencyMs": res.get("latencyMs", 0.0),
            "graphrag": graphrag_meta,
        })

    def _handle_doom_chat(self):
        t0 = time.time()
        token = resolve_hf_token()
        if not token:
            return self._send_json(503, {
                "ok": False,
                "error": "MISSING_HF_TOKEN",
                "message": "HF_TOKEN is not configured in environment or .env on the SkateAlley server.",
            })

        engine = get_knowledge_graph_engine()
        graph_status = engine.status()
        if not graph_status.get("ready"):
            return self._send_json(503, {
                "ok": False,
                "error": graph_status.get("error", "GRAPHRAG_UNAVAILABLE"),
                "message": graph_status.get("message", "Knowledge graph failed validation."),
            })

        body = self._read_json_body()
        requested_model = str(body.get("model") or DEFAULT_DOOM_CHAT_MODEL).strip()
        raw_persona = body.get("personaPrompt")
        persona_prompt = (
            str(raw_persona).strip()
            if raw_persona is not None and str(raw_persona).strip()
            else DEFAULT_DOOM_PERSONA_PROMPT
        )
        raw_messages = body.get("messages")
        try:
            max_hops = max(1, min(3, int(body.get("maxHops", 2))))
        except (TypeError, ValueError):
            max_hops = 2

        if not isinstance(raw_messages, list) or len(raw_messages) == 0:
            return self._send_json(400, {
                "ok": False,
                "error": "INVALID_MESSAGES",
                "message": "Request body must include a non-empty 'messages' array.",
            })

        conversation_turns = []
        for m in raw_messages[-24:]:
            if isinstance(m, dict):
                role = str(m.get("role") or "user").strip().lower()
                if role not in ("system", "user", "assistant"):
                    role = "user"
                content = str(m.get("content") or "").strip()
                if content:
                    conversation_turns.append({"role": role, "content": content})

        if not conversation_turns:
            return self._send_json(400, {
                "ok": False,
                "error": "EMPTY_MESSAGES",
                "message": "No valid non-empty messages provided.",
            })

        latest_user_msg = ""
        for turn in reversed(conversation_turns):
            if turn["role"] == "user":
                latest_user_msg = turn["content"]
                break
        if not latest_user_msg:
            latest_user_msg = conversation_turns[-1]["content"]

        recent_window = [
            t for t in conversation_turns[:-1]
            if t["role"] in ("user", "assistant")
        ][-4:]

        graph_res = engine.query(
            query_text=latest_user_msg,
            recent_messages=recent_window,
            max_hops=max_hops,
        )
        graphrag_meta = {
            "datasetVersion": graph_res["datasetVersion"],
            "seedNodeIds": graph_res["seedNodeIds"],
            "retrievedNodeCount": graph_res["retrievedNodeCount"],
            "retrievedEdgeCount": graph_res["retrievedEdgeCount"],
            "hops": graph_res["hops"],
            "retrievalLatencyMs": graph_res["retrievalLatencyMs"],
        }

        grounded_system_prompt = (
            f"{persona_prompt}\n\n"
            "GRAPHRAG FACTUAL GROUNDING DIRECTIVE:\n"
            "Ground all factual claims about Luis's biography, age, education, projects, Rejection Station "
            "(bge-large-en-v1.5 + LinearSVC resume classifier & NYU film-major Talent Acquisition story), "
            "$50,000 TopStepXFA Bayesian state space model, Lymphemeda GraphRAG Policy Engine for Eli, "
            "MathPods, reverse-engineered games, and generative pipelines strictly in the retrieved "
            "[GRAPHRAG_SUBGRAPH] below. Cite concrete technical names and numbers when relevant, keep answers "
            "punchy (2-5 sentences unless asked for deep detail), and never fabricate unverified biographical claims.\n\n"
            f"{graph_res['contextBlock']}"
        )

        messages = [{"role": "system", "content": grounded_system_prompt}]
        for turn in conversation_turns:
            if turn["role"] != "system":
                messages.append(turn)

        candidates = []
        if requested_model in _LEGACY_CHAT_MODEL_ALIASES:
            candidates.extend(CHAT_MODEL_FALLBACK_CHAIN)
        else:
            candidates.append(requested_model)
            for fb in CHAT_MODEL_FALLBACK_CHAIN:
                if fb not in candidates:
                    candidates.append(fb)

        res = call_hf_chat_completions(
            token=token,
            model_candidates=candidates,
            messages=messages,
            max_tokens=1400,
            temperature=0.55,
            use_low_reasoning=True,
            timeout_sec=12.0,
            total_deadline_sec=12.0,
        )
        if not res.get("ok"):
            return self._send_json(502, res)

        total_ms = round((time.time() - t0) * 1000.0, 1)
        return self._send_json(200, {
            "ok": True,
            "model": res["model"],
            "requestedModel": requested_model,
            "personaPrompt": persona_prompt,
            "reply": res["content"],
            "latencyMs": total_ms,
            "upstreamLatencyMs": res.get("latencyMs", 0.0),
            "usage": res.get("usage", {}),
            "graphrag": graphrag_meta,
        })

    def _handle_stickers_get(self):
        t0 = time.time()
        try:
            stickers = list_persisted_stickers()
            elapsed_ms = round((time.time() - t0) * 1000.0, 2)
            return self._send_json(200, {
                "ok": True,
                "storage": "postgres",
                "dbConnected": True,
                "count": len(stickers),
                "stickers": stickers,
                "latencyMs": elapsed_ms,
            })
        except Exception as e:
            return self._send_json(503, {
                "ok": False,
                "storage": "postgres",
                "dbConnected": False,
                "error": "STICKER_DB_UNAVAILABLE",
                "message": str(e),
            })

    def _handle_stickers_upsert(self):
        t0 = time.time()
        body = self._read_json_body()
        if not isinstance(body, dict) or not body:
            return self._send_json(400, {
                "ok": False,
                "error": "INVALID_PAYLOAD",
                "message": "Request body must be a non-empty JSON object.",
            })

        try:
            if isinstance(body.get("stickers"), list):
                saved_list = []
                for item in body["stickers"]:
                    rec = upsert_persisted_sticker(item)
                    if rec:
                        saved_list.append(rec)
                elapsed_ms = round((time.time() - t0) * 1000.0, 2)
                return self._send_json(200, {
                    "ok": True,
                    "storage": "postgres",
                    "dbConnected": True,
                    "count": len(saved_list),
                    "stickers": saved_list,
                    "sticker": saved_list[-1] if saved_list else None,
                    "latencyMs": elapsed_ms,
                })

            payload = body.get("sticker") if isinstance(body.get("sticker"), dict) else body
            saved = upsert_persisted_sticker(payload)
            elapsed_ms = round((time.time() - t0) * 1000.0, 2)
            return self._send_json(200, {
                "ok": True,
                "storage": "postgres",
                "dbConnected": True,
                "sticker": saved,
                "latencyMs": elapsed_ms,
            })
        except ValueError as ve:
            return self._send_json(400, {
                "ok": False,
                "error": "VALIDATION_ERROR",
                "message": str(ve),
            })
        except Exception as e:
            return self._send_json(503, {
                "ok": False,
                "storage": "postgres",
                "dbConnected": False,
                "error": "STICKER_DB_UNAVAILABLE",
                "message": str(e),
            })

    def _handle_stickers_delete(self, path_placed_id=None):
        t0 = time.time()
        placed_id = path_placed_id
        if not placed_id:
            parsed_url = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed_url.query)
            if qs.get("placedId"):
                placed_id = qs["placedId"][0]
            elif qs.get("id"):
                placed_id = qs["id"][0]
        if not placed_id:
            body = self._read_json_body()
            if isinstance(body, dict):
                placed_id = body.get("placedId") or body.get("placed_id") or body.get("id")

        if not placed_id or not str(placed_id).strip():
            return self._send_json(400, {
                "ok": False,
                "error": "MISSING_PLACED_ID",
                "message": "placedId is required to delete a sticker.",
            })

        try:
            clean_id = urllib.parse.unquote(str(placed_id).strip())
            deleted = delete_persisted_sticker(clean_id)
            elapsed_ms = round((time.time() - t0) * 1000.0, 2)
            return self._send_json(200, {
                "ok": True,
                "storage": "postgres",
                "dbConnected": True,
                "deleted": deleted,
                "placedId": clean_id,
                "latencyMs": elapsed_ms,
            })
        except ValueError as ve:
            return self._send_json(400, {
                "ok": False,
                "error": "VALIDATION_ERROR",
                "message": str(ve),
            })
        except Exception as e:
            return self._send_json(503, {
                "ok": False,
                "storage": "postgres",
                "dbConnected": False,
                "error": "STICKER_DB_UNAVAILABLE",
                "message": str(e),
            })

    def _handle_scene_layout_get(self):
        t0 = time.time()
        try:
            res = list_persisted_scene_layouts()
            elapsed_ms = round((time.time() - t0) * 1000.0, 2)
            return self._send_json(200, {
                "ok": True,
                "storage": "postgres",
                "dbConnected": True,
                "layouts": res["layouts"],
                "updatedAtMs": res["updatedAtMs"],
                "count": len(res["layouts"]),
                "latencyMs": elapsed_ms,
            })
        except Exception as e:
            return self._send_json(503, {
                "ok": False,
                "storage": "postgres",
                "dbConnected": False,
                "error": "SCENE_LAYOUT_DB_UNAVAILABLE",
                "message": str(e),
            })

    def _handle_scene_layout_upsert(self):
        t0 = time.time()
        body = self._read_json_body()
        if not isinstance(body, dict) or not body:
            return self._send_json(400, {
                "ok": False,
                "error": "INVALID_PAYLOAD",
                "message": "Request body must be a non-empty JSON object.",
            })
        try:
            updated_at_ms = body.get("updatedAtMs")
            if updated_at_ms is not None:
                updated_at_ms = int(float(updated_at_ms))
            if isinstance(body.get("layouts"), dict):
                entries = body["layouts"]
            elif body.get("key") and "payload" in body:
                entries = {str(body["key"]): body["payload"]}
            else:
                raise ValueError("Request body must include either {'key': ..., 'payload': ...} or {'layouts': {...}}")
            saved = upsert_persisted_scene_layouts(entries, default_updated_at_ms=updated_at_ms)
            elapsed_ms = round((time.time() - t0) * 1000.0, 2)
            return self._send_json(200, {
                "ok": True,
                "storage": "postgres",
                "dbConnected": True,
                "savedKeys": list(saved.keys()),
                "updatedAtMs": saved,
                "latencyMs": elapsed_ms,
            })
        except ValueError as ve:
            return self._send_json(400, {
                "ok": False,
                "error": "VALIDATION_ERROR",
                "message": str(ve),
            })
        except Exception as e:
            return self._send_json(503, {
                "ok": False,
                "storage": "postgres",
                "dbConnected": False,
                "error": "SCENE_LAYOUT_DB_UNAVAILABLE",
                "message": str(e),
            })

    def _handle_scene_layout_delete(self, path_layout_key=None):
        t0 = time.time()
        layout_key = path_layout_key
        if not layout_key:
            parsed_url = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed_url.query)
            if qs.get("key"):
                layout_key = qs["key"][0]
        if not layout_key:
            body = self._read_json_body()
            if isinstance(body, dict):
                layout_key = body.get("key")
        if not layout_key or not str(layout_key).strip():
            return self._send_json(400, {
                "ok": False,
                "error": "MISSING_LAYOUT_KEY",
                "message": "key is required to delete a persisted scene layout.",
            })
        try:
            clean_key = urllib.parse.unquote(str(layout_key).strip())
            deleted_keys = delete_persisted_scene_layout(clean_key)
            elapsed_ms = round((time.time() - t0) * 1000.0, 2)
            return self._send_json(200, {
                "ok": True,
                "storage": "postgres",
                "dbConnected": True,
                "deletedKeys": deleted_keys,
                "latencyMs": elapsed_ms,
            })
        except ValueError as ve:
            return self._send_json(400, {
                "ok": False,
                "error": "VALIDATION_ERROR",
                "message": str(ve),
            })
        except Exception as e:
            return self._send_json(503, {
                "ok": False,
                "storage": "postgres",
                "dbConnected": False,
                "error": "SCENE_LAYOUT_DB_UNAVAILABLE",
                "message": str(e),
            })

    def _load_melee_rigger_module(self):
        import importlib
        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        import rig_melee_character
        return importlib.reload(rig_melee_character)

    def _handle_melee_fighters(self):
        try:
            rmc = self._load_melee_rigger_module()
            fighters = rmc.get_fighter_catalog_with_bone_counts()
            return self._send_json(200, {
                "ok": True,
                "status": "ok",
                "count": len(fighters),
                "fighters": fighters,
            })
        except Exception as e:
            return self._send_json(500, {
                "ok": False,
                "status": "error",
                "error": "MELEE_FIGHTERS_ERROR",
                "message": str(e),
            })

    def _handle_melee_gcs_characters(self):
        try:
            rmc = self._load_melee_rigger_module()
            characters = rmc.list_available_gcs_characters()
            return self._send_json(200, {
                "ok": True,
                "status": "ok",
                "count": len(characters),
                "characters": characters,
            })
        except Exception as e:
            return self._send_json(500, {
                "ok": False,
                "status": "error",
                "error": "MELEE_GCS_CHARACTERS_ERROR",
                "message": str(e),
            })

    def _handle_melee_rig(self):
        body = self._read_json_body()
        if not isinstance(body, dict):
            body = {}
        fighter = str(body.get("fighter") or body.get("fighter_code") or "Ca").strip()
        player_folder = str(body.get("player_folder") or body.get("player") or "nicotest_nt01").strip()
        run_id = str(body.get("run_id") or body.get("run") or "run_01").strip()
        glb_path = body.get("glb_path")
        force_rebuild = bool(body.get("force") or body.get("force_rebuild"))

        # Check if rig_melee_character can run in-process (requires numpy, cv2, scipy)
        try:
            rmc = self._load_melee_rigger_module()
            if getattr(rmc, "np", None) is None or getattr(rmc, "cv2", None) is None:
                raise ImportError("numpy/cv2 not loaded in current interpreter")
            res = rmc.rig_character_for_melee_fighter(
                fighter_code=fighter,
                player_folder=player_folder,
                run_id=run_id,
                glb_path=glb_path,
                sync_gcs=False,
                force_rebuild=force_rebuild,
            )
            return self._send_json(200, res)
        except ImportError:
            # Delegate to /opt/anaconda3/bin/python3 if current python lacks scientific libs
            py_bin = "/opt/anaconda3/bin/python3" if os.path.isfile("/opt/anaconda3/bin/python3") else sys.executable
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rig_melee_character.py")
            cmd = [
                py_bin,
                script_path,
                "--fighter", fighter,
                "--player-folder", player_folder,
                "--run-id", run_id,
            ]
            if glb_path:
                cmd.extend(["--glb-path", str(glb_path)])
            if force_rebuild:
                cmd.append("--force")
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if proc.returncode != 0:
                return self._send_json(400, {
                    "ok": False,
                    "status": "error",
                    "error": "MELEE_RIG_FAILED",
                    "message": (proc.stderr or proc.stdout or "Auto-rigger subprocess failed").strip(),
                })
            try:
                out_json = json.loads(proc.stdout)
                return self._send_json(200, out_json)
            except Exception as je:
                return self._send_json(500, {
                    "ok": False,
                    "status": "error",
                    "error": "MELEE_RIG_PARSE_ERROR",
                    "message": str(je),
                })
        except ValueError as ve:
            return self._send_json(400, {
                "ok": False,
                "status": "error",
                "error": "INVALID_RIG_REQUEST",
                "message": str(ve),
            })
        except Exception as e:
            return self._send_json(500, {
                "ok": False,
                "status": "error",
                "error": "MELEE_RIG_FAILED",
                "message": str(e),
            })

    def _handle_mkd_frame(self):
        ensure_mkd_runtime(os.getcwd())
        raw = None
        try:
            if os.path.isfile(MKD_LIVE_RGBA_PATH):
                with open(MKD_LIVE_RGBA_PATH, "rb") as f:
                    raw = f.read()
        except OSError:
            raw = None

        if not raw or len(raw) < MKD_RGBA_EXPECTED_BYTES:
            hdr = struct.pack("<IIII", 640, 480, 0, 0)
            raw = hdr + (b"\x00\x00\x00\xff" * (640 * 480))

        w, h, frame_seq, draws = struct.unpack("<IIII", raw[:16])
        try:
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-MKD-Width", str(w))
            self.send_header("X-MKD-Height", str(h))
            self.send_header("X-MKD-Frame-Seq", str(frame_seq))
            self.send_header("X-MKD-Draws", str(draws))
            self.send_header("X-MKD-Boot-To-Frame", str(_MKD_BOOT_TO_FRAME))
            self.end_headers()
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _handle_mkd_status(self):
        running = ensure_mkd_runtime(os.getcwd())
        w, h, frame_seq, draws = read_mkd_live_header()
        pid = _MKD_PROC.pid if (_MKD_PROC is not None and _MKD_PROC.poll() is None) else None
        return self._send_json(200, {
            "ok": True,
            "status": "ok",
            "gameId": "GQNE5D",
            "running": bool(running),
            "pid": pid,
            "width": w,
            "height": h,
            "frameSeq": frame_seq,
            "drawsThisFrame": draws,
            "bootToFrame": _MKD_BOOT_TO_FRAME,
            "buttons": _MKD_CURRENT_BTN,
            "stickX": _MKD_CURRENT_SX,
            "stickY": _MKD_CURRENT_SY,
            "pulseSeq": _MKD_PULSE_SEQ,
        })

    def _handle_mkd_input(self):
        global _MKD_PULSE_SEQ, _MKD_LAST_CLIENT_SEQ, _MKD_LAST_PULSE_BTN, _MKD_LAST_PULSE_SX, _MKD_LAST_PULSE_SY
        global _MKD_CURRENT_BTN, _MKD_CURRENT_SX, _MKD_CURRENT_SY, _MKD_CURRENT_CX, _MKD_CURRENT_CY

        ensure_mkd_runtime(os.getcwd())
        body = self._read_json_body()
        if not isinstance(body, dict):
            body = {}
        client_seq = int(body.get("clientSeq", 0))
        buttons = int(body.get("buttons", 0)) & 0xFFFF
        sx = max(-127, min(127, int(body.get("stickX", 0))))
        sy = max(-127, min(127, int(body.get("stickY", 0))))
        cx = max(-127, min(127, int(body.get("cstickX", 0))))
        cy = max(-127, min(127, int(body.get("cstickY", 0))))

        with _MKD_LOCK:
            if client_seq == 0 or client_seq >= _MKD_LAST_CLIENT_SEQ:
                if client_seq > 0:
                    _MKD_LAST_CLIENT_SEQ = client_seq
                _MKD_CURRENT_BTN = buttons
                _MKD_CURRENT_SX = sx
                _MKD_CURRENT_SY = sy
                _MKD_CURRENT_CX = cx
                _MKD_CURRENT_CY = cy
            if buttons != 0 or sx != 0 or sy != 0:
                _MKD_PULSE_SEQ += 1
                _MKD_LAST_PULSE_BTN = buttons
                _MKD_LAST_PULSE_SX = sx
                _MKD_LAST_PULSE_SY = sy
            _write_mkd_pad_state_unlocked()
            pulse_seq = _MKD_PULSE_SEQ

        _, _, frame_seq, draws = read_mkd_live_header()
        return self._send_json(200, {
            "ok": True,
            "status": "ok",
            "gameId": "GQNE5D",
            "buttons": buttons,
            "stickX": sx,
            "stickY": sy,
            "pulseSeq": pulse_seq,
            "frameSeq": frame_seq,
            "drawsThisFrame": draws,
        })

    def _handle_mkd_reset(self):
        body = self._read_json_body()
        if not isinstance(body, dict):
            body = {}
        boot_to = body.get("bootToFrame")
        if boot_to is None:
            boot_to = 535
        running = ensure_mkd_runtime(os.getcwd(), force_restart=True, boot_to_frame=int(boot_to))
        return self._send_json(200, {
            "ok": True,
            "status": "ok",
            "gameId": "GQNE5D",
            "running": bool(running),
            "bootToFrame": _MKD_BOOT_TO_FRAME,
        })

    def do_POST(self):
        if studio_http_handlers_045.try_handle_studio_post(self):
            return
        clean_path = self.path.split("?", 1)[0].rstrip("/")
        if clean_path == "/api/intro/generate":
            return self._handle_intro_generate()
        if clean_path == "/api/graphrag/query":
            return self._handle_graphrag_query()
        if clean_path == "/api/doom/starters":
            return self._handle_doom_starters()
        if clean_path == "/api/doom/chat":
            return self._handle_doom_chat()
        if clean_path == "/api/stickers":
            return self._handle_stickers_upsert()
        if clean_path == "/api/stickers/delete":
            return self._handle_stickers_delete()
        if clean_path == "/api/scene-layout":
            return self._handle_scene_layout_upsert()
        if clean_path == "/api/scene-layout/delete":
            return self._handle_scene_layout_delete()
        if clean_path == "/api/melee/rig":
            return self._handle_melee_rig()
        if clean_path == "/api/mkd/input":
            return self._handle_mkd_input()
        if clean_path == "/api/mkd/reset":
            return self._handle_mkd_reset()
        return self._send_json(404, {
            "ok": False,
            "error": "NOT_FOUND",
            "message": f"Unknown POST endpoint '{clean_path}'",
        })

    def do_PUT(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/")
        if clean_path == "/api/stickers" or clean_path.startswith("/api/stickers/"):
            return self._handle_stickers_upsert()
        if clean_path == "/api/scene-layout" or clean_path.startswith("/api/scene-layout/"):
            return self._handle_scene_layout_upsert()
        return self._send_json(404, {
            "ok": False,
            "error": "NOT_FOUND",
            "message": f"Unknown PUT endpoint '{clean_path}'",
        })

    def do_DELETE(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/")
        if clean_path == "/api/stickers":
            return self._handle_stickers_delete()
        if clean_path.startswith("/api/stickers/"):
            target_id = clean_path[len("/api/stickers/"):].strip("/")
            return self._handle_stickers_delete(path_placed_id=target_id)
        if clean_path == "/api/scene-layout":
            return self._handle_scene_layout_delete()
        if clean_path.startswith("/api/scene-layout/"):
            target_key = clean_path[len("/api/scene-layout/"):].strip("/")
            return self._handle_scene_layout_delete(path_layout_key=target_key)
        return self._send_json(404, {
            "ok": False,
            "error": "NOT_FOUND",
            "message": f"Unknown DELETE endpoint '{clean_path}'",
        })

    def _serve_health(self, head_only=False):
        nzp_required = (
            os.path.join(os.getcwd(), "nzportable", "index.html"),
            os.path.join(os.getcwd(), "nzportable", "ftewebgl.wasm"),
            os.path.join(os.getcwd(), "nzportable", "nzp", "progs.pk3"),
        )
        nzportable_ready = all(os.path.isfile(p) for p in nzp_required)
        revcdos_ready = (
            os.path.isfile(os.path.join(os.getcwd(), "revcdos", "index.html"))
            and os.path.isfile(os.path.join(os.getcwd(), "revcdos", "vcbr", "vc-sky-en-v6.wasm"))
            and os.path.isdir(os.path.join(os.getcwd(), "revcdos", "vcsky", "fetched"))
        )
        tkdr_iso_path = os.path.join(os.getcwd(), "tkdr", "game.iso")
        tkdr_eboot_path = os.path.join(os.getcwd(), "tkdr", "eboot.bin")
        tkdr_ready = (
            os.path.isfile(os.path.join(os.getcwd(), "tkdr", "index.html"))
            and os.path.isfile(os.path.join(os.getcwd(), "tkdr", "tkdr.wasm"))
            and os.path.isfile(tkdr_iso_path)
            and os.path.getsize(tkdr_iso_path) == TKDR_ISO_EXPECTED_SIZE
            and os.path.isfile(tkdr_eboot_path)
            and os.path.getsize(tkdr_eboot_path) == TKDR_EBOOT_EXPECTED_SIZE
        )
        melee_iso_path = os.path.join(os.getcwd(), "melee", "game.iso")
        melee_wasm_path = os.path.join(os.getcwd(), "melee", "melee_browser.wasm")
        melee_js_path = os.path.join(os.getcwd(), "melee", "melee_browser.js")
        melee_ready = (
            os.path.isfile(os.path.join(os.getcwd(), "melee", "index.html"))
            and os.path.isfile(melee_wasm_path)
            and os.path.getsize(melee_wasm_path) == MELEE_WASM_EXPECTED_SIZE
            and os.path.isfile(melee_js_path)
            and os.path.getsize(melee_js_path) == MELEE_JS_EXPECTED_SIZE
            and os.path.isfile(melee_iso_path)
            and os.path.getsize(melee_iso_path) == MELEE_ISO_EXPECTED_SIZE
        )
        mkd_iso_path = os.path.join(os.getcwd(), "mkd", "game.iso")
        mkd_dol_path = os.path.join(os.getcwd(), "mkd", "main.dol")
        mkd_ready = (
            os.path.isfile(os.path.join(os.getcwd(), "mkd", "index.html"))
            and os.path.isfile(os.path.join(os.getcwd(), "mkd", "shell.mjs"))
            and os.path.isfile(os.path.join(os.getcwd(), "mkd", "decomp_manifest.json"))
            and os.path.isfile(mkd_iso_path)
            and os.path.getsize(mkd_iso_path) == MKD_ISO_EXPECTED_SIZE
            and os.path.isfile(mkd_dol_path)
            and os.path.getsize(mkd_dol_path) == MKD_DOL_EXPECTED_SIZE
        )
        sticker_db, layout_db = get_combined_db_health()
        graph_status = get_knowledge_graph_engine().status()
        graphrag_ready = bool(graph_status.get("ready"))
        components = [
            "freeman_alley_3d_portfolio",
            "skate3_cleanroom_skateroom",
            "doom_head_llm_proxy",
            "intro_json_schema_generator",
        ]
        if graphrag_ready:
            components.append("graphrag_property_graph_engine")
        if sticker_db.get("ready"):
            components.append("sticker_postgres_persistence")
        if layout_db.get("ready"):
            components.append("scene_layout_postgres_persistence")
        if nzportable_ready:
            components.append("nzportable_webapp")
        if revcdos_ready:
            components.append("revcdos_webapp")
        if tkdr_ready:
            components.append("tkdr_webapp")
        if melee_ready:
            components.append("melee_webapp")
        if mkd_ready:
            components.append("mkd_webapp")
        payload = json.dumps({
            "ok": True,
            "status": "ok",
            "service": "skatealley-app-local",
            "port": self.server.server_address[1],
            "hf_token_configured": bool(resolve_hf_token()),
            "doom_chat_model": DEFAULT_DOOM_CHAT_MODEL,
            "doom_starters_model": DEFAULT_DOOM_STARTERS_MODEL,
            "intro_generate_model": DEFAULT_INTRO_GENERATE_MODEL,
            "graphrag_ready": graphrag_ready,
            "graphrag_dataset_version": graph_status.get("datasetVersion"),
            "graphrag_node_count": int(graph_status.get("nodeCount", 0)),
            "graphrag_edge_count": int(graph_status.get("edgeCount", 0)),
            "graphrag_error": None if graphrag_ready else graph_status.get("message"),
            "sticker_db_ready": bool(sticker_db.get("ready")),
            "sticker_storage": sticker_db.get("storage", "postgres"),
            "persisted_sticker_count": int(sticker_db.get("count", 0)),
            "scene_layout_db_ready": bool(layout_db.get("ready")),
            "persisted_layout_keys": layout_db.get("keys", []),
            "nzportable_webapp": nzportable_ready,
            "revcdos_webapp": revcdos_ready,
            "tkdr_webapp": tkdr_ready,
            "melee_webapp": melee_ready,
            "mkd_webapp": mkd_ready,
            "services": list(components),
            "components": components,
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def _try_serve_gzip_static(self, head_only=False):
        if self.headers.get("Range"):
            return False
        accept_enc = (self.headers.get("Accept-Encoding") or "").lower()
        if "gzip" not in accept_enc:
            return False

        clean_url_path = self.path.split("?", 1)[0].split("#", 1)[0]
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            if not clean_url_path.endswith("/"):
                return False
            for idx_name in ("index.html", "index.htm"):
                candidate = os.path.join(path, idx_name)
                if os.path.isfile(candidate):
                    path = candidate
                    break
            else:
                return False
        if not os.path.isfile(path):
            return False

        _, ext = os.path.splitext(path)
        if ext.lower() not in (".html", ".htm", ".js", ".mjs", ".css", ".json", ".svg"):
            return False

        try:
            st = os.stat(path)
        except OSError:
            return False
        if st.st_size <= 256 or st.st_size > 16 * 1024 * 1024:
            return False

        cache_dict = getattr(SkateAlleyRequestHandler, "_gzip_cache", None)
        cache_lock = getattr(SkateAlleyRequestHandler, "_gzip_lock", None)
        if cache_dict is None or cache_lock is None:
            SkateAlleyRequestHandler._gzip_cache = {}
            SkateAlleyRequestHandler._gzip_lock = threading.Lock()
            cache_dict = SkateAlleyRequestHandler._gzip_cache
            cache_lock = SkateAlleyRequestHandler._gzip_lock

        gz_bytes = None
        with cache_lock:
            entry = cache_dict.get(path)
            if entry and entry[0] == st.st_mtime_ns and entry[1] == st.st_size:
                gz_bytes = entry[2]
        if gz_bytes is None:
            try:
                with open(path, "rb") as f:
                    raw_bytes = f.read()
                gz_bytes = gzip.compress(raw_bytes, compresslevel=5)
            except OSError:
                return False
            with cache_lock:
                if len(cache_dict) >= 128:
                    cache_dict.clear()
                cache_dict[path] = (st.st_mtime_ns, st.st_size, gz_bytes)

        ctype = self.guess_type(path)
        try:
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("Content-Length", str(len(gz_bytes)))
            self.send_header("Last-Modified", self.date_time_string(st.st_mtime))
            self.end_headers()
            if not head_only:
                self.wfile.write(gz_bytes)
        except (BrokenPipeError, ConnectionResetError):
            pass
        return True

    def _try_serve_range(self, head_only=False):
        range_header = self.headers.get("Range")
        if not range_header:
            return False

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return False

        file_size = os.path.getsize(path)

        m = re.match(r"bytes=(\d+)-(\d*)", range_header)
        m_suffix = re.match(r"bytes=-(\d+)", range_header) if not m else None
        if not m and not m_suffix:
            return False

        if m_suffix:
            suffix_len = int(m_suffix.group(1))
            start = max(0, file_size - suffix_len)
            end = file_size - 1
        else:
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else file_size - 1

        if start >= file_size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{file_size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return True

        end = min(end, file_size - 1)
        length = end - start + 1
        ctype = self.guess_type(path)

        try:
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length))
            self.end_headers()
            if not head_only:
                chunk_size = 64 * 1024
                with open(path, "rb") as f:
                    f.seek(start)
                    remaining = length
                    while remaining > 0:
                        chunk = f.read(min(chunk_size, remaining))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass
        return True

    def do_HEAD(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=True)
        if studio_http_handlers_045.try_handle_studio_or_melee_get(self, head_only=True):
            return
        if self._try_serve_range(head_only=True):
            return
        if self._try_serve_gzip_static(head_only=True):
            return
        super().do_HEAD()

    def do_GET(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=False)
        if studio_http_handlers_045.try_handle_studio_or_melee_get(self, head_only=False):
            return
        if clean_path == "/api/graphrag/status":
            return self._handle_graphrag_status()
        if clean_path == "/api/stickers":
            return self._handle_stickers_get()
        if clean_path == "/api/scene-layout":
            return self._handle_scene_layout_get()
        if clean_path == "/api/melee/fighters":
            return self._handle_melee_fighters()
        if clean_path == "/api/melee/gcs-characters":
            return self._handle_melee_gcs_characters()
        if clean_path == "/api/mkd/frame":
            return self._handle_mkd_frame()
        if clean_path == "/api/mkd/status":
            return self._handle_mkd_status()
        if self._try_serve_range(head_only=False):
            return
        if self._try_serve_gzip_static(head_only=False):
            return
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser(description="Serve SkateAlley & SkateRoom static + WASM/Pack assets.")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=3002, help="Port number (default: 3002)")
    parser.add_argument("--dir", default=os.getcwd(), help="Root directory to serve")
    args = parser.parse_args()

    os.chdir(os.path.abspath(args.dir))
    ensure_worktree_character_hoodie(os.getcwd())
    ensure_worktree_revcdos_files(os.getcwd())
    ensure_nzportable_game_pk3(os.getcwd())
    ensure_revcdos_data(os.getcwd())
    ensure_revcdos_vcsky(os.getcwd())
    ensure_revcdos_luis_player(os.getcwd())
    ensure_tkdr_assets(os.getcwd())
    ensure_melee_assets(os.getcwd())
    ensure_mkd_assets(os.getcwd())
    ensure_mkd_runtime(os.getcwd())
    try:
        ensure_sticker_schema()
        ensure_scene_layout_schema()
        print("[skatealley-app-local] PostgreSQL skatealley_placed_stickers & skatealley_scene_layouts schemas verified.", flush=True)
    except Exception as db_err:
        print(f"[skatealley-app-local] WARNING: Initial PostgreSQL schema check deferred: {db_err}", flush=True)
    try:
        studio_http_handlers_045.maybe_boot_background_coordinator()
    except Exception as studio_err:
        print(f"[skatealley-app-local] WARNING: Studio coordinator startup warning: {studio_err}", flush=True)
    with ThreadingHTTPServer((args.host, args.port), SkateAlleyRequestHandler) as httpd:
        actual_port = httpd.server_address[1]
        print(f"[skatealley-app-local] Serving {os.getcwd()} on http://{args.host}:{actual_port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
