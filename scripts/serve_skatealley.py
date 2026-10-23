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
import socketserver
from http.server import SimpleHTTPRequestHandler

mimetypes.init()
CUSTOM_MIME_TYPES = {
    ".wasm": "application/wasm",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".glb": "model/gltf-binary",
    ".skate": "application/octet-stream",
    ".pack": "application/octet-stream",
    ".part": "application/octet-stream",
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
for ext, mime in CUSTOM_MIME_TYPES.items():
    mimetypes.add_type(mime, ext)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class SkateAlleyRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Origin")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        self.send_header("Accept-Ranges", "bytes")
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
        return super().guess_type(path)

    def _serve_health(self, head_only=False):
        payload = json.dumps({
            "ok": True,
            "status": "ok",
            "service": "skatealley-app-local",
            "port": self.server.server_address[1],
            "components": ["freeman_alley_3d_portfolio", "skate3_cleanroom_skateroom"],
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def do_HEAD(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=True)
        super().do_HEAD()

    def do_GET(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path in ("/api/health", "/health"):
            return self._serve_health(head_only=False)

        range_header = self.headers.get("Range")
        if not range_header:
            return super().do_GET()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().do_GET()

        m = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if not m:
            return super().do_GET()

        file_size = os.path.getsize(path)
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else file_size - 1
        if start >= file_size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{file_size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        end = min(end, file_size - 1)
        length = end - start + 1
        ctype = self.guess_type(path)

        try:
            with open(path, "rb") as f:
                f.seek(start)
                data = f.read(length)
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass


def main():
    parser = argparse.ArgumentParser(description="Serve SkateAlley & SkateRoom static + WASM/Pack assets.")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=3002, help="Port number (default: 3002)")
    parser.add_argument("--dir", default=os.getcwd(), help="Root directory to serve")
    args = parser.parse_args()

    os.chdir(os.path.abspath(args.dir))
    with ThreadingHTTPServer((args.host, args.port), SkateAlleyRequestHandler) as httpd:
        print(f"[skatealley-app-local] Serving {os.getcwd()} on http://{args.host}:{args.port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
