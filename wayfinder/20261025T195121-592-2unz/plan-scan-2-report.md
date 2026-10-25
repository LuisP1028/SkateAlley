# Wayfinder Plan-Scan-2 Report: Deterministic Codebase Static Scan, External API Reconnaissance, and Schema Auditing

## 1. Governing Context
- **Specification In Scope**: `functional_specification_057.md`
- **Domain Vocabulary Source**: `LANGUAGE.md`
- **Host MCP Registry Reference**: `.sandcastle/mcp.md`
- **Execution Run ID**: `20261025T195121-592-2unz`
- **Agent Role**: Planning Node Scanner 2 (`plan-scan-2`, Agent 2)
- **Worktree**: `agent-plan-scan-2-20261025T195121-592-2unz`
- **Strict Invariant**: Zero reading of `wayfinder/20261025T195121-592-2unz/map.md` or `wayfinder/20261025T195121-592-2unz/tickets/*` (`INV-PARALLEL-01`). Zero implementation code written (`INV-BOUNDARY-01`).

---

## 2. Master Component Dependency Cone Register

Every file inspected in the local repository has been qualified and classified as either a **Candidate Mandatory Target Deliverable (`MANDATORY_TARGET`)** (a production file, caller, or obstructing adjacent module that must be modified or refactored) or **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** (a reference file, schema, or asset inspected for context only).

| Repository-Relative Path | Classification | Verbatim Symbols / Key Interfaces | Grounding Justification & Operational Context |
| :--- | :---: | :--- | :--- |
| `scripts/serve_skatealley.py` | `MANDATORY_TARGET` | `end_headers` (L1131), `_serve_health` (L1472), `_try_serve_range` (L1520), `main` (L1583) | Primary HTTP server hosting SkateAlley. Must be enhanced to: (1) emit `COOP: same-origin` and `COEP: require-corp` on `/tkdr/*` responses; (2) stream byte ranges in bounded chunks (`1 MiB` loop) to prevent memory spike on `1.75 GB` ISO; (3) expose `tkdr_webapp` in `/api/health`; (4) include multi-worktree asset synchronization (`ensure_tkdr_assets(base_dir=None)`) so Sandcastle worktrees access game files from shared cache. |
| `.gitignore` | `MANDATORY_TARGET` | Tracking rules (L1-70) | Licensing & repository hygiene boundary. Must be amended to include `tkdr/*.iso`, `tkdr/*.cso`, `tkdr/*.bin`, `tkdr/*.elf`, `tkdr/*.zip`, `tkdr/*.data` so copyrighted game data is never committed to Git. |
| `tkdr/index.html` & `tkdr/tkdr.html` | `MANDATORY_TARGET` | Shell HTML5/WebGL2 interface, `ready`, `started`, `tryStart()`, `prepareGame()`, `startPlay()` | Upstream `deploy:site/index.html` requires enhancement: (1) auto-probing `./game.iso` (`Range: bytes=0-0` -> `HTTP 206`) and `./eboot.bin` (`HTTP 200`) when query params `?iso=`/`?eboot=` are absent; (2) exposing observable runtime telemetry on `window.__TKDR_STATUS__`; (3) adding Web Audio resume listener on user interaction. |
| `tkdr/tkdr.wasm` | `MANDATORY_TARGET` | WebAssembly runtime (`2,672,263 B`), `_web_frames()`, `_web_time()`, `_main`, `Module.tkShareGameModule` | Compiled runtime hosting Allegrex scheduler, HLE table, VFPU interpreter, WebGL2 GE renderer, ATRAC3+ audio, and FFmpeg H.264 movie player. Staged from `deploy:site/tkdr.wasm`. |
| `tkdr/tkdr.js` | `MANDATORY_TARGET` | Emscripten JS runtime glue (`230,442 B`), `PTHREAD_POOL_SIZE=48`, `INITIAL_MEMORY=768MB` | Manages 48-worker pthread pool, 768 MB shared heap, SDL2 input/audio bridges. Staged from `deploy:site/tkdr.js`. |
| `tkdr/disc.mjs` | `MANDATORY_TARGET` | `openDisc`, `httpFile`, `BLOCK = 256*1024`, `storeDisc`, `writeCso` | Browser ES module (`13,046 B`) for ISO/CSO sector reading, HTTP range streaming abstraction, and OPFS compression. Staged from `deploy:site/disc.mjs`. |
| `tkdr/config.json` | `MANDATORY_TARGET` | `{"pickFiles": false, "gameZip": ""}` | Config schema for standalone web host mode. Staged from `deploy:site/config.json`. |
| `tkdr/recomp/*` | `MANDATORY_TARGET` | `recomp/index.mjs`, `elf.mjs`, `mips.mjs`, `analyze.mjs`, `wasm.mjs`, `wasmgen.mjs`, `worker.mjs`, `nids.json` | In-browser MIPS-to-WebAssembly recompiler pipeline translating 641,720 MIPS instructions into 13,809 WebAssembly functions (`23.54 MB` `code.wasm` + `20.63 MB` `image.bin`). Staged from `deploy:site/recomp/*`. |
| `tests/tkdr_e2e_browser.test.mjs` | `MANDATORY_TARGET` | Playwright test suite, `waitForHealth`, `loadPlaywright`, `getFreePort` | End-to-end browser test verifying standalone WebApp execution at `/tkdr/`, `window.crossOriginIsolated === true`, `ebootSha1`, `13809` functions, `started === true`, `frames > 60`, `guestTimeSec > 1.0`, zero errors, and zero alley scene mutation. |
| `tests/test_tkdr_spec057.py` | `MANDATORY_TARGET` | Pytest integration test suite | Tests HTTP server `COOP`/`COEP` headers, `206 Partial Content` ISO sector streaming, `/api/health` `tkdr_webapp` probe, and cryptographic hash parity. |
| `package.json` | `READ_ONLY_CONTEXT` | npm scripts and devDependencies | Inspected for node test runner and Playwright execution patterns. |
| `tests/revcdos_e2e_browser.test.mjs` | `READ_ONLY_CONTEXT` | Node test runner, Playwright browser lifecycle, `getFreePort()`, `waitForHealth()` | Inspected as architectural reference for standalone WebApp test harness and port allocation. |
| `tests/nzportable_e2e_browser.test.mjs` | `READ_ONLY_CONTEXT` | WebAssembly webapp test patterns | Inspected for WebAssembly canvas lifecycle and frame progression assertions. |
| `tests/test_revcdos_spec043.py` | `READ_ONLY_CONTEXT` | Pytest server subprocess, range request verification | Inspected as architectural reference for byte-range streaming integration tests. |

---

## 3. Candidate External Datasource, Empirical Asset & Schema Audit Register

All external sources, tools, pre-staged binaries, and upstream assets have been empirically probed, verified against authentic payloads, and captured into `assets/20261025T195121-592-2unz/plan-scan-2-*`.

### 3.1 Captured Ground-Truth Asset Manifest

| Asset File Path in Repository | Size (`Bytes`) | Format / Schema Type | Source / Upstream Provenance | Audited Contents & Verification Status |
| :--- | :---: | :---: | :--- | :--- |
| `assets/20261025T195121-592-2unz/plan-scan-2-tkdr-deploy-tree.json` | `2,995 B` | JSON Manifest | `https://github.com/gasparegas/tkdr-recomp` branch `deploy` (commit `786460f1c0c4360938d5d4e1dbaac2a23e8601bd`) | Complete tree listing of all 15 prebuilt web assets including `tkdr.wasm` (`2,672,263 B`), `tkdr.js` (`230,442 B`), `tkdr.html` (`32,079 B`), `disc.mjs` (`13,046 B`), and `recomp/*` modules. |
| `assets/20261025T195121-592-2unz/plan-scan-2-tkdr-nids.json` | `11,954 B` | JSON Dictionary | Upstream `tkdr-recomp/web/recomp/nids.json` | 280 imported PSP NID mappings across 31 libraries (`UtilsForUser`, `sceDisplay`, `sceCtrl`, `sceSasCore`, `sceAtrac3plus`, `sceMpeg`, etc.) mapping 32-bit hex NIDs to human-readable C/HLE symbol names. |
| `assets/20261025T195121-592-2unz/plan-scan-2-tkdr-web-headers.txt` | `167 B` | Plaintext HTTP Headers | Upstream `tkdr-recomp/web/_headers` | Authoritative security header requirements: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on `/*`. |
| `assets/20261025T195121-592-2unz/plan-scan-2-tkdr-config.json` | `41 B` | JSON Object | Upstream `tkdr-recomp/web/config.json` | Default runtime configuration: `{"pickFiles": false, "gameZip": ""}`. |
| `assets/20261025T195121-592-2unz/plan-scan-2-eboot-sha1-verification.json` | `1,437 B` | JSON Object | Host local filesystem & scratch cryptographic probe | Ground-truth empirical hashes: source zip (`1,117,233,020 B`, CRC32 `0x3ffd7a9d`), sector 28 `enc_eboot.bin` (`4,836,160 B`, SHA-1 `584141a993156e290fcc0adff2d1df0509e3ae13`), decrypted ELF `dec_eboot.elf` (`4,835,824 B`, SHA-1 `24b7f09db51a86a72fe3860f672617294b07fb2b`), full PPSSPP `ULUS10139_EBOOT.BIN` (`4,836,160 B`, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`). |
| `assets/20261025T195121-592-2unz/plan-scan-2-upstream-serve-py.txt` | `3,244 B` | Python Source | Upstream `tkdr-recomp/tools/serve.py` | Reference standalone server showing `1 MiB` (`1 << 20`) bounded chunk streaming loop in `send_file`, `COOP`/`COEP` header injection in `end_headers()`, and range request response (`HTTP 206`). |
| `assets/20261025T195121-592-2unz/plan-scan-2-recomp-worker-spec.json` | `1,249 B` | JSON Specification | Upstream `tkdr-recomp/web/recomp/worker.mjs` & runtime contract | Detailed interface contract for module Web Worker input message (`eboot: ArrayBuffer`), progress events, output result structure (`image: Uint8Array`, `gameTxt: string`, `code: Uint8Array`, `functions: 13809`), IndexedDB cache keying (`<SHA1>-<version>`), and `window.__TKDR_STATUS__` schema. |

### 3.2 Cryptographic & Physical Artifact Inventory

1. **Source Archive**:
   - Path: `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`
   - Size: `1,117,233,020` bytes (`1.04 GiB`)
   - Entry: `Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso` (`1,750,237,184` bytes, CRC32 `0x3ffd7a9d`, SHA-1 `8193a65dee49685db49284408c89bdb35324bc32`).
2. **Encrypted EBOOT**:
   - Location: ISO Sector 28 (`LBA 28`, byte offset `57,344` / `0xE000`)
   - Size: `4,836,160` bytes
   - Magic: `~PSP` (`0x5053507E`), Tag at `0xD0`: `0xC0CB167C`, SHA-1: `584141a993156e290fcc0adff2d1df0509e3ae13`.
3. **Decrypted PRX**:
   - Tool: Kirk PRX Decryption Engine (`dec_eboot` via `pspDecryptPRX`)
   - Truncated ELF size: `4,835,824` bytes (SHA-1 `24b7f09db51a86a72fe3860f672617294b07fb2b`)
   - Full PPSSPP buffer (`max(elf_size, psp_size)`): `4,836,160` bytes (SHA-1 **`b9a0e3292738a833f4f8077e3959c3a0652c42cd`**). Pre-staged and verified at `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/ULUS10139_EBOOT.BIN`.
4. **Recompiled WebAssembly Module**:
   - Input: Decrypted `ULUS10139_EBOOT.BIN` (`4,836,160 B`)
   - Analysis: `641,720` Allegrex MIPS instructions -> `13,809` functions, `388` jump tables, `280` HLE imports.
   - Emitted Output: `code.wasm` (`23,544,922 B`), `image.bin` (`20,629,396 B`), `game.txt` (`281` lines).
   - Recompilation Latency: Measured at `969 ms` cold on host CPU; `< 50 ms` warm from IndexedDB cache.

---

## 4. Explicit Deficiency & Systemic Obstacle Register

| Specced Requirement / Behavior | Existing State in Codebase / Obstacle | Impact on Spec 057 Execution | Recommended Remediation (`MANDATORY_TARGET`) |
| :--- | :--- | :--- | :--- |
| **Route `/tkdr/*` Hosting & Multi-Worktree Isolation** | Worktree does not contain `/tkdr/` directory yet; game binaries are git-ignored. | Sandcastle worktrees (review, tester) will lack game assets after git checkout/merge unless materialized. | Implement `ensure_tkdr_assets(base_dir=None)` in `scripts/serve_skatealley.py` (analogous to `ensure_revcdos_vcsky`) to stage web runtime and link/copy `game.iso` and `eboot.bin` from shared cache. |
| **Cross-Origin Isolation (`COOP`/`COEP`)** | `scripts/serve_skatealley.py`'s `end_headers` (L1131-1140) emits CORS headers but omits `COOP` and `COEP`. | `tkdr.wasm` requires `SharedArrayBuffer` for its 48 pthread workers; without `COOP`/`COEP`, browser throws `SharedArrayBuffer is not defined` and aborts. | Add conditional header injection in `end_headers()` for paths starting with `/tkdr/` emitting `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. |
| **Large ISO Range Streaming Buffer** | `scripts/serve_skatealley.py`'s `_try_serve_range` (L1552) calls `f.read(length)` in a single allocation. | For open-ended range requests (e.g. `Range: bytes=0-`) on `1.75 GB` `game.iso`, the server attempts to read all 1.75 GB into heap memory, causing OOM. | Refactor `_try_serve_range` to stream in bounded `1 MiB` (`1,048,576 B`) buffer chunks with `try/except (BrokenPipeError, ConnectionResetError)` handling, matching `tools/serve.py`. |
| **`/api/health` Telemetry** | `_serve_health` (L1472-1519) does not check `tkdr/` assets or report `"tkdr_webapp": true`. | Automated health checks and orchestrator cannot verify that `/tkdr/` is healthy and ready. | Add `tkdr_ready` probe checking existence of `/tkdr/index.html`, `/tkdr/tkdr.wasm`, `/tkdr/game.iso`, and `/tkdr/eboot.bin`; append `"tkdr_webapp"` to `components` and include `"tkdr_webapp": true`. |
| **Git Tracking Hygiene** | `.gitignore` currently has rules for `revcdos/` and `*.zip`, but zero rules for `tkdr/`. | Staging `game.iso` (`1.75 GB`) or `eboot.bin` (`4.84 MB`) in `tkdr/` risks accidental git staging/commit of copyrighted binaries. | Add `tkdr/*.iso`, `tkdr/*.cso`, `tkdr/*.bin`, `tkdr/*.elf`, `tkdr/*.zip`, `tkdr/*.data` to `.gitignore`. |
| **Client-Side Zero-Friction Boot & Telemetry** | Upstream `site/index.html` only checks `?iso=`/`?eboot=` query parameters, requires manual drop when absent, lacks `window.__TKDR_STATUS__`, and lacks Web Audio unlock. | Opening `http://localhost:3002/tkdr/` stops at `#pick` drop box; automated test cannot query telemetry; audio is suspended by autoplay policy. | Enhance staged `tkdr/index.html` to auto-probe `./game.iso` via `HTTP 206` and `./eboot.bin` via `HTTP 200`, populate `window.__TKDR_STATUS__`, and add user-interaction audio context resume listener. |
| **Automated Test Coverage** | No test suites currently exist for `tkdr`. | Regression or startup failure would go undetected in continuous integration. | Create `tests/test_tkdr_spec057.py` (server, headers, ranges, health) and `tests/tkdr_e2e_browser.test.mjs` (Playwright E2E browser boot, WebGL2 frames, status telemetry). |

---

## 5. Sufficiency & Scan Certification

- **Deterministic Exhaustiveness**: All components across the complete dependency cone—from the HTTP server and range reader, through the Kirk decryption and ISO extraction pipeline, down to the in-browser recompiler, WebAssembly runtime, and Playwright verification harness—have been exhaustively audited.
- **Empirical Grounding**: All external file schemas, git trees, and cryptographic hashes are grounded in verifiable live measurements and captured authentic assets in `assets/20261025T195121-592-2unz/plan-scan-2-*`.
- **Zero Invention**: All components, contracts, and interfaces reflect authentic codebase symbols and verified upstream repository structures without speculative invention.

---

## 6. Handoff Manifest Affirmation

The manifest file at `handoff/20261025T195121-592-2unz/plan-scan-2.txt` has been atomically created/overwritten with exactly one repository-relative path per line. It contains exclusively:
1. Qualified codebase component files reviewed during static analysis.
2. The authored scan report at `wayfinder/20261025T195121-592-2unz/plan-scan-2-report.md`.
3. Ground-truth captured assets and schemas in `assets/20261025T195121-592-2unz/plan-scan-2-*`.

It records zero seed specification paths and leaves predecessor manifests fully intact.

---

## 7. Coding Gate Affirmation

**DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.**
