#!/usr/bin/env python3
"""Serve the tkdr-recomp web build with Cross-Origin Isolation (COOP/COEP/CORP) headers
and 1 MiB chunked HTTP 206 Partial Content range streaming.

usage: serve.py [DIR] [PORT] [--iso PATH] [--eboot PATH] [--zip PATH] [--host HOST]
  --iso exposes PATH at /game.iso, --eboot at /eboot.bin, --zip at /game.zip (all with
  Range support on GET and HEAD). Any file inside DIR also supports HTTP 206 Range requests
  and both /<subpath> and /tkdr/<subpath> routing.
"""
import http.server
import json
import os
import re
import sys

ISO = None
EBOOT = None
ZIP = None
TKDR_ISO_EXPECTED_SIZE = 1750237184
TKDR_EBOOT_EXPECTED_SIZE = 4836160


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "application/javascript; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".wasm": "application/wasm",
        ".json": "application/json; charset=utf-8",
        ".iso": "application/octet-stream",
        ".cso": "application/octet-stream",
        ".bin": "application/octet-stream",
        ".elf": "application/octet-stream",
        ".prx": "application/octet-stream",
        ".zip": "application/zip",
    }

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Origin")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _normalize_path(self):
        raw_path = self.path.split("?", 1)[0].split("#", 1)[0]
        if raw_path == "/tkdr":
            return "/"
        if raw_path.startswith("/tkdr/"):
            return raw_path[len("/tkdr"):]
        return raw_path

    def translate_path(self, path):
        normalized = path
        if normalized == "/tkdr":
            normalized = "/"
        elif normalized.startswith("/tkdr/"):
            normalized = normalized[len("/tkdr"):]
        return super().translate_path(normalized)

    def _serve_health(self, head_only=False):
        iso_path = ISO or os.path.join(self.directory, "game.iso")
        eboot_path = EBOOT or os.path.join(self.directory, "eboot.bin")
        tkdr_ready = (
            os.path.isfile(os.path.join(self.directory, "index.html"))
            and os.path.isfile(os.path.join(self.directory, "tkdr.wasm"))
            and os.path.isfile(iso_path)
            and os.path.getsize(iso_path) == TKDR_ISO_EXPECTED_SIZE
            and os.path.isfile(eboot_path)
            and os.path.getsize(eboot_path) == TKDR_EBOOT_EXPECTED_SIZE
        )
        components = ["tkdr_webapp"] if tkdr_ready else []
        payload = json.dumps({
            "ok": True,
            "status": "ok",
            "service": "tkdr-standalone",
            "tkdr_webapp": tkdr_ready,
            "services": list(components),
            "components": components,
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def _resolve_override_or_local(self):
        norm = self._normalize_path()
        for url, override in (("/game.iso", ISO), ("/eboot.bin", EBOOT), ("/game.zip", ZIP)):
            if override and norm == url and os.path.isfile(override):
                return override
        local_path = self.translate_path(self.path)
        if os.path.isfile(local_path):
            return local_path
        return None

    def send_file(self, name, head_only=False, force_octet_stream=False):
        size = os.path.getsize(name)
        start, end = 0, size - 1
        rng = self.headers.get("Range")
        ctype = "application/octet-stream" if force_octet_stream else self.guess_type(name)
        if rng:
            m = re.match(r"bytes=(\d+)-(\d*)", rng)
            if m:
                start = int(m.group(1))
                end = int(m.group(2)) if m.group(2) else size - 1
                if start >= size or start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                end = min(end, size - 1)
                self.send_response(206)
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            else:
                self.send_response(200)
        else:
            self.send_response(200)
        length = end - start + 1
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.end_headers()
        if head_only:
            return
        with open(name, "rb") as f:
            f.seek(start)
            left = length
            try:
                while left > 0:
                    chunk = f.read(min(left, 1 << 20))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def do_HEAD(self):
        norm = self._normalize_path()
        if norm in ("/api/health", "/health"):
            return self._serve_health(head_only=True)
        for url, file in (("/game.iso", ISO), ("/eboot.bin", EBOOT), ("/game.zip", ZIP)):
            if file and norm == url:
                return self.send_file(file, head_only=True, force_octet_stream=True)
        if self.headers.get("Range"):
            target = self._resolve_override_or_local()
            if target:
                return self.send_file(target, head_only=True)
        return super().do_HEAD()

    def do_GET(self):
        norm = self._normalize_path()
        if norm in ("/api/health", "/health"):
            return self._serve_health(head_only=False)
        for url, file in (("/game.iso", ISO), ("/eboot.bin", EBOOT), ("/game.zip", ZIP)):
            if file and norm == url:
                return self.send_file(file, head_only=False, force_octet_stream=True)
        if self.headers.get("Range"):
            target = self._resolve_override_or_local()
            if target:
                return self.send_file(target, head_only=False)
        return super().do_GET()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    args = sys.argv[1:]
    host = "127.0.0.1"
    if "--host" in args:
        i = args.index("--host")
        host = args[i + 1]
        del args[i:i + 2]
    if "--iso" in args:
        i = args.index("--iso")
        ISO = os.path.abspath(args[i + 1])
        del args[i:i + 2]
    if "--eboot" in args:
        i = args.index("--eboot")
        EBOOT = os.path.abspath(args[i + 1])
        del args[i:i + 2]
    if "--zip" in args:
        i = args.index("--zip")
        ZIP = os.path.abspath(args[i + 1])
        del args[i:i + 2]
    default_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    directory = os.path.abspath(args[0]) if args else default_dir
    port = int(args[1]) if len(args) > 1 else 8080
    handler = lambda *a, **k: Handler(*a, directory=directory, **k)
    print(f"serving {directory} on http://{host}:{port}" + (f" (ISO at /game.iso)" if ISO else ""), flush=True)
    http.server.ThreadingHTTPServer((host, port), handler).serve_forever()
