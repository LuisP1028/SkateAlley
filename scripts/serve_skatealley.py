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
import json
import mimetypes
import os
import re
import shutil
import socketserver
import time
import urllib.error
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
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
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

    def do_POST(self):
        clean_path = self.path.split("?", 1)[0].rstrip("/")
        if clean_path == "/api/doom/starters":
            return self._handle_doom_starters()
        if clean_path == "/api/doom/chat":
            return self._handle_doom_chat()
        return self._send_json(404, {
            "ok": False,
            "error": "NOT_FOUND",
            "message": f"Unknown POST endpoint '{clean_path}'",
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
        components = [
            "freeman_alley_3d_portfolio",
            "skate3_cleanroom_skateroom",
            "doom_head_llm_proxy",
        ]
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
        clean_path = self.path.split("?", 1)[0]
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=False)
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
    with ThreadingHTTPServer((args.host, args.port), SkateAlleyRequestHandler) as httpd:
        print(f"[skatealley-app-local] Serving {os.getcwd()} on http://{args.host}:{args.port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
