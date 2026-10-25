# Plan-Scan-1 Report: Deterministic Codebase Static Scan, External API Reconnaissance, and Schema Auditing

- **Run ID**: `20261025T195121-592-2unz`
- **Agent Node**: `plan-scan-1` (Agent 1)
- **Branch**: `agent/plan-scan-1-20261025T195121-592-2unz`
- **Governing Specification**: `functional_specification_057.md`
- **Authoritative Vocabulary**: `LANGUAGE.md`
- **Status**: Completed (Zero application implementation code written, "DO NOT CODE YET" gate locked)

---

## 1. Governing Context & Invariants

This static scan and reconnaissance audit binds strictly and exclusively to `functional_specification_057.md` under the authoritative vocabulary of `LANGUAGE.md`.

### Core Architectural Invariants
1. **Strict Standalone WebApp Route (`/tkdr/`)**: *Tekken: Dark Resurrection* (`tkdr-recomp`) executes exclusively as an isolated standalone HTML5/WebGL2/WebAssembly web application served at `/tkdr/` via `scripts/serve_skatealley.py` (and/or standalone `tkdr/tools/serve.py`). Zero Three.js alley scene integration (`index.html` / `sandbox.js` are never modified or coupled).
2. **Deterministic Cryptographic Verification**:
   - Source UMD ISO disc image: `1,750,237,184` bytes, CRC32 `0x3ffd7a9d`, SHA-1 `8193a65dee49685db49284408c89bdb35324bc32`.
   - Decrypted PRX Executable `ULUS10139_EBOOT.BIN` (`eboot.bin`): `4,836,160` bytes, magic `\x7fELF`, `e_type = 0xFFA0` (`ET_SCE_PRX`), SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`. (Must preserve the full `max(elf_size, psp_size)` buffer; truncating to `elf_size = 4,835,824` yields `24b7f09db51a86a72fe3860f672617294b07fb2b` which halts `tkdr-recomp`).
3. **Cross-Origin Isolation Enforcement**: Both `scripts/serve_skatealley.py` (scoped to `/tkdr/*`) and `tkdr/tools/serve.py` must emit `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, and `Cross-Origin-Resource-Policy: same-origin` to ensure `window.crossOriginIsolated === true` for Emscripten's 48-worker `SharedArrayBuffer` pthread pool (`768 MB` heap).
4. **Chunked HTTP 206 Partial Content Streaming**: The HTTP server must serve `Range: bytes=start-end` requests for `/tkdr/game.iso` using bounded `1 MiB` chunk iteration rather than monolithic memory allocations.
5. **Clean Repository Hygiene**: `0 B` of copyrighted game binaries (`.iso`, `.cso`, `.bin`, `.elf`, `.zip`, `.data`) tracked in Git.

---

## 2. Master Component Dependency Cone Register

| Codebase File Path | Classification | Verbatim Symbols & Handlers | Operational Context & Qualification Rationale |
| :--- | :--- | :--- | :--- |
| `scripts/serve_skatealley.py` | `MANDATORY_TARGET` | `SkateAlleyRequestHandler.end_headers` (L1131-1140)<br/>`SkateAlleyRequestHandler._try_serve_range` (L1520-1563)<br/>`SkateAlleyRequestHandler._serve_health` (L1472-1519)<br/>`ensure_tkdr_assets` (new, analogous to `ensure_revcdos_vcsky` L379-419)<br/>`main` (L1583-1606) | Production static HTTP server. Requires: (1) COOP/COEP headers scoped to `/tkdr/*` in `end_headers` for `SharedArrayBuffer` support; (2) refactoring `_try_serve_range` from single `f.read(length)` buffer allocation to bounded `1 MiB` chunk streaming loop to prevent memory exhaustion on `1.75 GB` game image; (3) adding `tkdr_webapp` probe to `_serve_health` and registering `"tkdr_webapp"` in `components`; (4) adding `ensure_tkdr_assets(base_dir=None)` multi-worktree cache materializer. |
| `.gitignore` | `MANDATORY_TARGET` | `tkdr/*.iso`<br/>`tkdr/*.cso`<br/>`tkdr/*.bin`<br/>`tkdr/*.elf`<br/>`tkdr/*.zip`<br/>`tkdr/*.data` | Git hygiene contract. Must explicitly exclude copyrighted game binaries (`game.iso`, `eboot.bin`, `ULUS10139_EBOOT.BIN`, `game.zip`, `.cso`, `.bin`, `.elf`, `.data`) under `tkdr/` while allowing tracked source/runtime web files to be committed. |
| `LANGUAGE.md` | `READ_ONLY_CONTEXT` | `{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}` | Authoritative domain glossary and evaluation parameters across all systems and models. |
| `.sandcastle/mcp.md` | `READ_ONLY_CONTEXT` | Host MCP Registry, `playwright`, `call_mcp_tool` | Authoritative protocol for MCP tools and role-based execution boundaries. |
| `tests/test_revcdos_spec043.py` | `READ_ONLY_CONTEXT` | `test_health_endpoint`, `test_range_requests`, `test_artifact_integrity` | Reference Python integration test pattern for testing HTTP 206 byte-ranges, header assertions, and `/api/health` contracts. |
| `tests/revcdos_e2e_browser.test.mjs` | `READ_ONLY_CONTEXT` | `loadPlaywright`, `getFreePort`, `waitForHealth` | Reference Playwright browser E2E test suite pattern with dynamic ephemeral port binding and live telemetry verification. |

---

## 3. Candidate External Datasource & Schema Audit Register

### 3.1 Probed External Datasources & Upstream Repositories
- **Upstream Repository**: `https://github.com/gasparegas/tkdr-recomp`
  - **Reconnaissance Source**: Local mirrored repository at `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/tkdr-recomp/`
  - **Git Branch / Commit**: `deploy` branch (commit `786460f1c0c4360938d5d4e1dbaac2a23e8601bd`)
  - **Tree Contents**: Complete prebuilt web application distribution under `site/` (`index.html`, `tkdr.html`, `tkdr.js`, `tkdr.wasm`, `disc.mjs`, `_headers`, `recomp/index.mjs`, `recomp/elf.mjs`, `recomp/mips.mjs`, `recomp/analyze.mjs`, `recomp/wasm.mjs`, `recomp/wasmgen.mjs`, `recomp/worker.mjs`, `recomp/nids.json`).
  - **Empirical Web Runtime Hashes**:
    - `site/tkdr.wasm`: `2,672,263` bytes, SHA-1 `c8b5a0298a0cf0765398cb07384204ff75657a9f`
    - `site/tkdr.js`: `230,442` bytes, SHA-1 `b404b61c90700bb9779be2403c73d850cd6441c6`
    - `site/disc.mjs`: `13,046` bytes, SHA-1 `f9754edc924b4ebb1921bc3c851341dea8ee0f68`
    - `site/index.html` & `site/tkdr.html`: `32,079` bytes, SHA-1 `df806c738def9a1802382fb5e43b0a24e2b51bd9`
    - `site/recomp/nids.json`: `11,954` bytes, 31 libraries, 280 NID stubs.
- **Local Game Archive**: `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`
  - **Zip Size**: `1,117,233,020` bytes
  - **Archive Entry**: `Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso` (`1,750,237,184` bytes, CRC32 `0x3ffd7a9d`, SHA-1 `8193a65dee49685db49284408c89bdb35324bc32`).
  - **Sector 16 (PVD)**: Offset `32,768` (`0x8000`), magic `\x01CD001\x01\x00PSP GAME`.
  - **Sector 28 (EBOOT)**: Offset `57,344` (`0xE000`), magic `~PSP`, `elf_size = 4,835,824`, `psp_size = 4,836,160`, Kirk Tag `0xC0CB167C`.
- **Kirk Decryption Artifact**: `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/ULUS10139_EBOOT.BIN`
  - **Size**: `4,836,160` bytes
  - **Magic**: `\x7fELF` (`ET_SCE_PRX = 0xFFA0`)
  - **SHA-1**: `b9a0e3292738a833f4f8077e3959c3a0652c42cd` (Exact match with `tkdr-recomp`'s `EBOOT_SHA1`).

### 3.2 Saved Ground-Truth Assets & Empirical Schemas
The following ground-truth artifacts were empirically generated and preserved in `assets/20261025T195121-592-2unz/`:
1. `assets/20261025T195121-592-2unz/plan-scan-1-upstream-deploy-manifest.json`: Full tree inventory of the `deploy` branch of `tkdr-recomp`, detailing file sizes, git blobs, SHA-1 and SHA-256 hashes.
2. `assets/20261025T195121-592-2unz/plan-scan-1-eboot-cryptographic-audit.json`: Header and cryptographic audit comparing encrypted `~PSP` EBOOT vs Kirk-decrypted `ET_SCE_PRX` ELF across full `psp_size` vs truncated `elf_size`.
3. `assets/20261025T195121-592-2unz/plan-scan-1-inbrowser-recompiler-spec.json`: Benchmarked execution metrics of the MIPS-to-Wasm recompiler (969.6 ms duration, 13,809 functions, 23.54 MB code, 20.63 MB memory, 280 HLE stubs).
4. `assets/20261025T195121-592-2unz/plan-scan-1-http-streaming-coop-schema.json`: Complete specification of security headers, byte-range HTTP 206 protocol, 1 MiB chunk streaming buffer contract, `/api/health` payload schema, and `window.__TKDR_STATUS__` telemetry object.
5. `assets/20261025T195121-592-2unz/plan-scan-1-iso-archive-audit.json`: Verification data for the user's `.zip` file, ISO9660 volume descriptors, and sector layout.

---

## 4. Explicit Deficiency & Systemic Obstacle Register

1. **Systemic Obstacle: Large Range Request Memory Exhaustion in Python HTTP Server**:
   - *Location*: `scripts/serve_skatealley.py` lines 1548-1560 (`_try_serve_range`).
   - *Defect*: `_try_serve_range` executes `data = f.read(length)` in a single call. An open-ended range request (`Range: bytes=0-`) on `/tkdr/game.iso` (`1.75 GB`) causes an immediate `1.75 GB` allocation on the Python heap, risking OOM crashes.
   - *Remediation*: Implement bounded chunk streaming (looping with `min(left, 1024 * 1024)` buffer writes and catching socket exceptions) matching `tkdr-recomp`'s `tools/serve.py`.
2. **Systemic Obstacle: Missing COOP/COEP Headers on Route `/tkdr/*`**:
   - *Location*: `scripts/serve_skatealley.py` lines 1131-1140 (`end_headers`).
   - *Defect*: The server currently emits standard CORS and cache-control headers, but completely lacks `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. Without these headers, `window.crossOriginIsolated` is `false`, causing `SharedArrayBuffer` to be undefined and halting the 48-worker pthread pool on startup.
   - *Remediation*: Intercept paths starting with `/tkdr` in `end_headers` and inject `COOP: same-origin`, `COEP: require-corp`, and `CORP: same-origin`.
3. **Deficiency: Missing `tkdr_webapp` Component in `/api/health`**:
   - *Location*: `scripts/serve_skatealley.py` lines 1472-1519 (`_serve_health`).
   - *Defect*: `/api/health` probes `nzportable` and `revcdos`, but has no check for `tkdr_webapp`.
   - *Remediation*: Add probe for `tkdr/index.html`, `tkdr/tkdr.wasm`, `tkdr/game.iso`, `tkdr/eboot.bin` and report `"tkdr_webapp": bool` and append `"tkdr_webapp"` to `components`.
4. **Systemic Obstacle: Multi-Worktree Git-Ignored Asset Disconnect (`INV-ROOT-CAUSE-AGENCY-01`)**:
   - *Location*: Sandcastle isolated git worktrees.
   - *Defect*: Because `tkdr/game.iso`, `tkdr/eboot.bin`, `tkdr/ULUS10139_EBOOT.BIN`, and `tkdr/game.zip` are git-ignored, subsequent agents (reviewer, tester) working in clean worktree checkouts will lack these multi-gigabyte binaries.
   - *Remediation*: Implement `ensure_tkdr_assets(base_dir=None)` in `scripts/serve_skatealley.py` (matching the existing `ensure_revcdos_vcsky` pattern at L379-419) to automatically link or copy game assets from `/Users/diesel/Desktop/SkateAlley/tkdr` or the pre-staged scratch directories on server startup and test setup.
5. **Deficiency: Incomplete `.gitignore` Rules**:
   - *Location*: `.gitignore` lines 1-70.
   - *Defect*: Lacks rules for `tkdr/*.iso`, `tkdr/*.cso`, `tkdr/*.bin`, `tkdr/*.elf`, `tkdr/*.zip`, `tkdr/*.data`.
   - *Remediation*: Add explicit exclusions for `tkdr/` binary artifacts to ensure zero bytes of copyrighted data are tracked in git.

---

## 5. Sufficiency & Scan Certification

I hereby certify that:
1. The dependency cone for `functional_specification_057.md` has been exhaustively scanned down to leaf handlers and operational callers.
2. All required external datasources, repository branches, and binary artifacts have been empirically verified with physical disk probes and cryptographic checksums.
3. All systemic obstacles in surrounding modules (`scripts/serve_skatealley.py`, `.gitignore`, multi-worktree staging) have been identified and classified with exact line numbers and remediation requirements.
4. Five authentic ground-truth schema and audit files have been saved into `assets/20261025T195121-592-2unz/plan-scan-1-*`.
5. Zero ambiguity remains for downstream planning and implementation.

---

## 6. Handoff Manifest Affirmation

The handoff manifest at `handoff/20261025T195121-592-2unz/plan-scan-1.txt` has been atomically overwritten with exactly the qualified codebase component files, the authored scan report, and all five captured asset files. Predecessor manifests and sibling run directories remain untouched.

---

## 7. Coding Gate Affirmation

**DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.**
