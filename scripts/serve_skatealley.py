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
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler

HF_ROUTER_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions"
DEFAULT_DOOM_CHAT_MODEL = "Qwen/Qwen3.8-27B"
DEFAULT_DOOM_STARTERS_MODEL = "Qwen/Qwen2.5-Coder-32B-Instruct"
DEFAULT_DOOM_PERSONA_PROMPT = ""
DEFAULT_STARTER_TOPIC_PROMPT = ""

CHAT_MODEL_FALLBACK_CHAIN = [
    "Qwen/Qwen3.8-27B",
    "Qwen/Qwen3-8B",
    "Qwen/Qwen3.5-27B",
]

STARTERS_MODEL_FALLBACK_CHAIN = [
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen3-8B",
]


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


def call_hf_chat_completions(token, model_candidates, messages, max_tokens=512, temperature=0.7, use_low_reasoning=False, timeout_sec=12.0):
    """Call Hugging Face Inference Provider router with bounded model failover."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "SkateAlley-HoloProxy/1.0",
    }
    last_error = None
    t0 = time.time()

    for idx, model_id in enumerate(model_candidates):
        payload = {
            "model": model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if use_low_reasoning and ("Qwen3.8" in model_id or "Qwen3" in model_id):
            payload["reasoning_effort"] = "low"

        req = urllib.request.Request(
            HF_ROUTER_COMPLETIONS_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
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
            # Retry without reasoning_effort if a specific provider rejects that parameter
            if e.code == 400 and "reasoning_effort" in payload:
                payload.pop("reasoning_effort", None)
                payload["max_tokens"] = max(max_tokens, 1200)
                req_retry = urllib.request.Request(
                    HF_ROUTER_COMPLETIONS_URL,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST",
                )
                try:
                    with urllib.request.urlopen(req_retry, timeout=timeout_sec) as resp2:
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
        "error": "UPSTREAM_INFERENCE_FAILED",
        "message": last_error or "All candidate Hugging Face models failed.",
    }


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
EXTRA_MIME_TYPES = {
    ".wasm": "application/wasm",
    ".pk3": "application/octet-stream",
    ".fmf": "application/octet-stream",
    ".data": "application/octet-stream",
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
            os.makedirs(os.path.join(target_fetched, sub), exist_ok=True)
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


class PgWireConnection:
    """Zero-dependency Python stdlib PostgreSQL v3 Wire Protocol + SCRAM-SHA-256 client."""

    def __init__(self, dsn, timeout=3.5):
        self.cfg = parse_postgres_dsn(dsn)
        self.sock = socket.create_connection((self.cfg["host"], self.cfg["port"]), timeout=timeout)
        self.sock.settimeout(timeout)
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

    def close(self):
        try:
            self._send_message("X")
        except Exception:
            pass
        try:
            self.sock.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def open_postgres_connection():
    """Open a PgWireConnection to the first reachable PostgreSQL DSN candidate."""
    global _ACTIVE_POSTGRES_DSN
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

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Origin, Authorization")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
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

    def _handle_doom_starters(self):
        token = resolve_hf_token()
        if not token:
            return self._send_json(503, {
                "ok": False,
                "error": "MISSING_HF_TOKEN",
                "message": "HF_TOKEN is not configured in environment or .env on the SkateAlley server.",
            })

        body = self._read_json_body()
        requested_model = str(body.get("model") or DEFAULT_DOOM_STARTERS_MODEL).strip()
        topic_prompt = str(body.get("topicPrompt") if body.get("topicPrompt") is not None else DEFAULT_STARTER_TOPIC_PROMPT).strip()

        candidates = []
        # Map generic Qwen2.5 aliases to live enabled HF router models first
        if requested_model in ("Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-3B-Instruct", "Qwen/Qwen2.5"):
            candidates.extend(STARTERS_MODEL_FALLBACK_CHAIN)
        else:
            candidates.append(requested_model)
            for fb in STARTERS_MODEL_FALLBACK_CHAIN:
                if fb not in candidates:
                    candidates.append(fb)

        user_instruction = (
            "Generate a JSON array containing exactly 2 short, intriguing conversation starter questions "
            "(each under 70 characters). Output ONLY a valid JSON array of 2 strings, e.g. [\"Question 1?\", \"Question 2?\"]."
        )
        if topic_prompt:
            user_instruction += f" Topic focus: {topic_prompt}"

        messages = [{"role": "user", "content": user_instruction}]
        res = call_hf_chat_completions(
            token=token,
            model_candidates=candidates,
            messages=messages,
            max_tokens=160,
            temperature=0.85,
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
        })

    def _handle_doom_chat(self):
        token = resolve_hf_token()
        if not token:
            return self._send_json(503, {
                "ok": False,
                "error": "MISSING_HF_TOKEN",
                "message": "HF_TOKEN is not configured in environment or .env on the SkateAlley server.",
            })

        body = self._read_json_body()
        requested_model = str(body.get("model") or DEFAULT_DOOM_CHAT_MODEL).strip()
        persona_prompt = str(body.get("personaPrompt") if body.get("personaPrompt") is not None else DEFAULT_DOOM_PERSONA_PROMPT).strip()
        raw_messages = body.get("messages")

        if not isinstance(raw_messages, list) or len(raw_messages) == 0:
            return self._send_json(400, {
                "ok": False,
                "error": "INVALID_MESSAGES",
                "message": "Request body must include a non-empty 'messages' array.",
            })

        messages = []
        if persona_prompt:
            messages.append({"role": "system", "content": persona_prompt})

        for m in raw_messages[-24:]:
            if isinstance(m, dict):
                role = str(m.get("role") or "user").strip().lower()
                if role not in ("system", "user", "assistant"):
                    role = "user"
                content = str(m.get("content") or "").strip()
                if content:
                    messages.append({"role": role, "content": content})

        if not messages:
            return self._send_json(400, {
                "ok": False,
                "error": "EMPTY_MESSAGES",
                "message": "No valid non-empty messages provided.",
            })

        candidates = [requested_model]
        for fb in CHAT_MODEL_FALLBACK_CHAIN:
            if fb not in candidates:
                candidates.append(fb)

        res = call_hf_chat_completions(
            token=token,
            model_candidates=candidates,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            use_low_reasoning=True,
            timeout_sec=12.0,
        )
        if not res.get("ok"):
            return self._send_json(502, res)

        return self._send_json(200, {
            "ok": True,
            "model": res["model"],
            "requestedModel": requested_model,
            "personaPrompt": persona_prompt,
            "reply": res["content"],
            "latencyMs": res.get("latencyMs", 0.0),
            "usage": res.get("usage", {}),
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

    def do_POST(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/")
        if clean_path == "/api/doom/starters":
            return self._handle_doom_starters()
        if clean_path == "/api/doom/chat":
            return self._handle_doom_chat()
        if clean_path == "/api/stickers":
            return self._handle_stickers_upsert()
        if clean_path == "/api/stickers/delete":
            return self._handle_stickers_delete()
        return self._send_json(404, {
            "ok": False,
            "error": "NOT_FOUND",
            "message": f"Unknown POST endpoint '{clean_path}'",
        })

    def do_PUT(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/")
        if clean_path == "/api/stickers" or clean_path.startswith("/api/stickers/"):
            return self._handle_stickers_upsert()
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
        sticker_db = get_sticker_db_health()
        components = [
            "freeman_alley_3d_portfolio",
            "skate3_cleanroom_skateroom",
            "doom_head_llm_proxy",
        ]
        if sticker_db.get("ready"):
            components.append("sticker_postgres_persistence")
        if nzportable_ready:
            components.append("nzportable_webapp")
        if revcdos_ready:
            components.append("revcdos_webapp")
        payload = json.dumps({
            "ok": True,
            "status": "ok",
            "service": "skatealley-app-local",
            "port": self.server.server_address[1],
            "hf_token_configured": bool(resolve_hf_token()),
            "doom_chat_model": DEFAULT_DOOM_CHAT_MODEL,
            "doom_starters_model": DEFAULT_DOOM_STARTERS_MODEL,
            "sticker_db_ready": bool(sticker_db.get("ready")),
            "sticker_storage": sticker_db.get("storage", "postgres"),
            "persisted_sticker_count": int(sticker_db.get("count", 0)),
            "nzportable_webapp": nzportable_ready,
            "revcdos_webapp": revcdos_ready,
            "services": list(components),
            "components": components,
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def _try_serve_range(self, head_only=False):
        range_header = self.headers.get("Range")
        if not range_header:
            return False

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return False

        m = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if not m:
            return False

        file_size = os.path.getsize(path)
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
            data = b""
            if not head_only:
                with open(path, "rb") as f:
                    f.seek(start)
                    data = f.read(length)
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length if head_only else len(data)))
            self.end_headers()
            if not head_only:
                self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass
        return True

    def do_HEAD(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=True)
        if self._try_serve_range(head_only=True):
            return
        super().do_HEAD()

    def do_GET(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=False)
        if clean_path == "/api/stickers":
            return self._handle_stickers_get()
        if self._try_serve_range(head_only=False):
            return
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser(description="Serve SkateAlley & SkateRoom static + WASM/Pack assets.")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=3002, help="Port number (default: 3002)")
    parser.add_argument("--dir", default=os.getcwd(), help="Root directory to serve")
    args = parser.parse_args()

    os.chdir(os.path.abspath(args.dir))
    ensure_nzportable_game_pk3(os.getcwd())
    ensure_revcdos_data(os.getcwd())
    ensure_revcdos_vcsky(os.getcwd())
    ensure_revcdos_luis_player(os.getcwd())
    try:
        ensure_sticker_schema()
        print("[skatealley-app-local] PostgreSQL skatealley_placed_stickers schema verified.", flush=True)
    except Exception as db_err:
        print(f"[skatealley-app-local] WARNING: Initial PostgreSQL schema check deferred: {db_err}", flush=True)
    with ThreadingHTTPServer((args.host, args.port), SkateAlleyRequestHandler) as httpd:
        print(f"[skatealley-app-local] Serving {os.getcwd()} on http://{args.host}:{args.port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
