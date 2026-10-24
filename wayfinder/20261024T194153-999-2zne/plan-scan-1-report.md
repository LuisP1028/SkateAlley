# Wayfinder Plan-Scan-1 Static Codebase Scan, External Reconnaissance & Schema Audit Report

**Run ID**: `20261024T194153-999-2zne`  
**Agent**: `plan-scan-1` (Planning Node Scanner 1)  
**Governing Specification Seed**: `functional_specification_043.md`  
**Execution Context**: Isolated worktree `agent/plan-scan-1-20261024T194153-999-2zne`  

---

## 1. Governing Context & Operational Objective

This report documents the exhaustive static codebase scan, active external API reconnaissance, schema audit, and ground-truth asset capture performed by `plan-scan-1` in strict compliance with `functional_specification_043.md`, `LANGUAGE.md`, and `.sandcastle/mcp.md`.

The primary system objective is deploying **GTA: Vice City (`reVCDOS`)** as a **standalone, full-screen playable HTML5 WebAssembly/WebGL2 web application** mounted at `/revcdos/` (`/Users/diesel/desktop/skatealley/revcdos/`).

### Architectural Invariant: Strict Native Engine Execution (Zero Three.js Porting)
GTA: Vice City (`reVCDOS`) **MUST** execute its native compiled C++ $\rightarrow$ Emscripten WebAssembly engine (`vc-sky-en-v6.wasm` + `vc-sky-en-v6.data` + modular runtime `modules/*.js`, derived from `Lolendor/reVCDOS`, `Carter54git/revcdos`, and `th3w33knd/reVCDOS`) inside its own dedicated, isolated HTML5 `<canvas>` web application route (`/revcdos/`), following the clean-room precedent established by `skate3_cleanroom/` and `nzportable/`. Under no circumstances may a coding assistant attempt to parse, convert, or port `.dff`, `.txd`, `.col`, `.ipl`, `.ide`, or `.img` game files into the Three.js Freeman Alley scene graph (`sandbox.js`).

---

## 2. Master Component Dependency Cone Register

Every qualified local codebase component has been inspected across its surrounding control flow, shared state, and active execution paths. Components are explicitly classified into **Candidate Mandatory Target Deliverables (`MANDATORY_TARGET`)** (production files that must be modified or created to satisfy `functional_specification_043.md`) and **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** (reference files inspected for architectural patterns and constraints):

| Codebase File Path | Classification | Verbatim Symbols / Key Interfaces | Grounding Justification & Surrounding Operational Context |
| :--- | :--- | :--- | :--- |
| `scripts/serve_skatealley.py` | `MANDATORY_TARGET` | `CUSTOM_MIME_TYPES`, `EXTRA_MIME_TYPES`, `ensure_nzportable_game_pk3`, `SkateAlleyRequestHandler`, `guess_type`, `_serve_health`, `_try_serve_range`, `do_GET`, `do_HEAD` | Unified HTTP server on port 3002. Currently lacks MIME type registrations for `.data`, `.txd`, `.dff`, `.col`, `.img`, `.dir`, `.dat`, `.scm`, `.gxt`, `.raw`, `.adf`. Requires case-insensitive path resolution under `/revcdos/vcsky/` (e.g. by overriding `translate_path`), auto-materialization of `revcdos/vcbr/vc-sky-en-v6.data` from `parts/vc-sky-en-v6.data.part00..03` (`ensure_revcdos_data`), and updating `/api/health` to report `"revcdos_webapp": true`. |
| `.gitignore` | `MANDATORY_TARGET` | Binary exclusion rules at lines 45–50 (`core.pack`, `game.pk3`) | Must be updated to exclude the raw `135,355,111 B` `revcdos/vcbr/vc-sky-en-v6.data`, the `~748 MB` unpacked `revcdos/vcsky/` tree, and temporary `*.zip` archives from Git tracking, while explicitly allowing tracked split chunks `revcdos/parts/vc-sky-en-v6.data.part00..03` and `revcdos/pack.json`. |
| `index.html` | `MANDATORY_TARGET` | `#sandbox-hud-body` lines 2234–2247: `#hud-enter-skateroom-btn`, `#hud-portfolio-home-link`, `#hud-enter-nzportable-btn` | Freeman Alley portfolio HUD sidebar. Currently hosts launch buttons for SkateRoom (`skate3_cleanroom/`) and NZ: Portable (`nzportable/`). Requires an adjacent sibling link/button `#hud-enter-revcdos-btn` linking to `./revcdos/` (`🌴 GTA: Vice City (reVCDOS)`). |
| `revcdos/` *(New Target Subtree)* | `MANDATORY_TARGET` | `index.html`, `game.js`, `index.js`, `modules/**`, `vcbr/**`, `parts/**`, `pack.json`, `vcsky/fetched/**` | Complete standalone WebAssembly web application directory. Confirmed non-existent on disk. Must host the client HTML/JS files, modular Emscripten runtime, compiled WASM binary, split `.data` chunks, and lowercased on-demand assets. |
| `skate3_cleanroom/index.html` | `READ_ONLY_CONTEXT` | `#splash`, `#overlay`, `#status`, `#progress`, `#hudbar`, `#fullscreen`, `<canvas id="bevy">` | Clean-room architectural UI precedent for isolated WASM games within SkateAlley, documenting dark-themed HTML5 viewport, fullscreen toggle, and return navigation link (`../`). |
| `skate3_cleanroom/loader.js` | `READ_ONLY_CONTEXT` | `AudioContext` proxy, `unlockAudio`, `CacheStorage` (`openCache`, `cachedParts`), `fetchParts`, `resolveServerTunnelBaseUrl` | Runtime orchestration precedent documenting Web Audio unlock handlers, multi-part chunk streaming concatenation, `CacheStorage` caching with byte validation, and Cloudflare tunnel fallback. |
| `skate3_cleanroom/pack.json` | `READ_ONLY_CONTEXT` | Schema: `{ version, size, parts, hash }` | Reference JSON schema for multi-part binary asset catalogs with chunk paths and SHA-256 digests. |
| `nzportable/index.html` | `READ_ONLY_CONTEXT` | `#canvas`, `#splash`, `#overlay`, `.hud-btn` (`← 3D Portfolio (Alley)`) | Spec 042 standalone webapp UI precedent demonstrating isolated QuakeC/FTEQW canvas, return HUD navigation, and loading indicator. |
| `nzportable/loader.js` | `READ_ONLY_CONTEXT` | `materializeGamePk3`, `CacheStorage`, `fetchParts` | Multi-part chunk assembly and browser `CacheStorage` precedent for large binary game archives. |
| `nzportable/pack.json` | `READ_ONLY_CONTEXT` | `{ name, totalSize, partSize, parts: [{ file, size, sha256 }] }` | Precedent catalog schema for 3-part split binary (`game.pk3.part00..02`). |
| `sandbox.js` | `READ_ONLY_CONTEXT` | `teleportToSkateRoom`, `resolveSkateRoomPortalUrl`, `sandbox.ready`, `enterSkateRoomHudBtn` | Main Three.js Freeman Alley scene graph and HUD wiring. Confirms portal transitions navigate via URL assignment rather than loading external engine assets into the 3D scene. |
| `tunnel.json` | `READ_ONLY_CONTEXT` | `url`, `public_https_url`, `backend_url` | Production Cloudflare tunnel configuration referencing remote server Mac `egg@10.0.0.62` for dynamic fallback when hosted on static GitHub Pages. |
| `tests/test_nzportable_spec042.py` | `READ_ONLY_CONTEXT` | `EXPECTED_ARTIFACTS`, `EXPECTED_PARTS`, `TestNZPortableIntegration` | Comprehensive integration test suite pattern testing server MIME types, byte-range requests, auto-materialization, and HTML markup. |
| `tests/nzportable_e2e_browser.test.mjs` | `READ_ONLY_CONTEXT` | Playwright E2E browser test script validating canvas rendering, WebGL context, and telemetry contracts. |
| `package.json` | `READ_ONLY_CONTEXT` | `"scripts": { "dev": "python3 -m http.server 8080" }` | Project package configuration and script definitions. |
| `LANGUAGE.md` | `READ_ONLY_CONTEXT` | Authoritative domain glossary (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`) | Authoritative taxonomy governing all evaluation gates. |
| `.sandcastle/mcp.md` | `READ_ONLY_CONTEXT` | Sandcastle Host MCP Registry | Protocol and guidelines for host MCP servers (`playwright`, `blender-mcp`, `postgres`). |

---

## 3. Candidate External Datasource Audit & Empirical Schema Register

Active read-only reconnaissance was conducted across upstream repositories (`Lolendor/reVCDOS`, `Carter54git/revcdos`, `th3w33knd/reVCDOS`) and target binary endpoints. All candidate sources were probed with safe HTTP GET and HEAD requests. Ground-truth schemas, trees, scripts, and binaries were saved directly into `assets/20261024T194153-999-2zne/plan-scan-1-*`.

### 3.1 Upstream Repository Role Breakdown
1. **`https://github.com/Lolendor/reVCDOS` (Primary Deobfuscated Web Port)**:
   - `README.md` documents deployment options (Docker, PHP, Colab) and default CDN usage (`cdn.dos.zone`).
   - `server.py` implements FastAPI server with `--vcsky_url`, `--vcbr_url`, and `--packed` flags.
   - `dist/modules/` provides modular Emscripten runtime:
     - `loader.js`: `loadPackage` checks `Module.getPreloadedPackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE)`; if present, skips network fetch and unpacks directly into Emscripten FS.
     - `fetch.js`: Intercepts `fetchXHR`, rewrites URLs via `replaceFetch(UTF8ToString(url))`, and caches into IndexedDB `emscripten_filesystem` (`FILES` store).
     - `packages/en.js`: Contains `DATA_PACKAGE` defining `/vc-assets/local/...` directory structure and byte slices for 26 preloaded files totaling `135,355,111` bytes.
2. **`https://github.com/Carter54git/revcdos` (Upstream Sourceport Reference)**:
   - `README.md` documents port attribution requirements (credit DOS.Zone Team, keep menu logo intact) and binary distribution structure.
   - `src/preload_files.list` (1,775 lines, 92,984 bytes) catalogs all files preloaded into the startup `.data` package (`models/gta3.dir`, `cuts.img`, `ped.ifp`, `flash.adf`, `sfx.sdt`, `.col`, `.txd`, `.dff`, etc.).
3. **`https://huggingface.co/spaces/th3w33knd/reVCDOS` (Verified Decompressed Binary Mirror)**:
   - Hosts pre-decompressed raw WASM and `.data` files under `vcbr/`, eliminating `.br` decompression overhead.
   - `Dockerfile` documents standard pipeline: `unzip -o vcsky.zip -d vcsky && rm vcsky.zip && python fix_cases.py`.
   - `fix_cases.py` documents recursive bottom-up lowercase renaming (`os.walk("vcsky", topdown=False)`).
   - `dist/game.js` includes critical automatic full-game unlock:
     `if (params.get('request_original_game') !== "1") localStorage.setItem('vcsky.haveOriginalGame', 'true');`

### 3.2 Dead CDN Empirical Probe Register
Read-only probes against referenced CDNs confirmed their failure modes:

| Target Endpoint | Method | Status Code | Observed Failure / Telemetry | Grounding Justification |
| :--- | :---: | :---: | :--- | :--- |
| `https://cdn.dos.zone/vcsky/` | `HEAD` | `HTTP 403 Forbidden` | S3 `AccessDenied` (Bucket: `68bbc47d0-doszone-uploads`, Server: nginx / Caddy) | Confirms dead CDN. Hardcoded references cause instant `HTTP 403` failures. |
| `https://br.cdn.dos.zone/vcsky/` | `HEAD` | `HTTP 403 Forbidden` | S3 `AccessDenied` (Bucket: `68bbc47d0de7-br-bundles`, Server: nginx / Caddy) | Confirms dead CDN for brotli bundles. |
| `https://folder.morgen.qzz.io/revcdos.bin` | `HEAD` | `HTTP 200 OK` | `1,084,364,719 B` (~1.08 GB raw packed binary on Cloudflare) | Single massive binary file exceeding practical static repo limits; not chunked. |

*Captured telemetry saved in:* `assets/20261024T194153-999-2zne/plan-scan-1-dead-cdn-headers.json`.

### 3.3 Target Binary & Asset Verification Table
Ground-truth probes against `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/` confirmed exact byte parity:

| File Name / Resource | Upstream Resolved URL | Status | Content-Type | Exact Measured Size | LFS SHA-256 Digest | Local Captured Asset Path |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `vc-sky-en-v6.wasm` | `.../vcbr/vc-sky-en-v6.wasm` | `200 OK` | `application/wasm` | `7,625,877 B` | `db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2` | `assets/20261024T194153-999-2zne/plan-scan-1-upstream-vc-sky-en-v6.wasm` |
| `vc-sky-en-v6.data` | `.../vcbr/vc-sky-en-v6.data` | `200 OK` | `application/octet-stream` | `135,355,111 B` | `3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6` | Header audit in `assets/.../plan-scan-1-binary-headers-audit.json` |
| `vcsky.zip` | `.../vcsky.zip` | `200 OK` | `application/zip` | `618,960,890 B` | `c582831b6b2f45ee5af947269fa62c517ca88eb4b7946634a0476ccb8fc972da` | Header audit in `assets/.../plan-scan-1-binary-headers-audit.json` |

*Captured telemetry saved in:* `assets/20261024T194153-999-2zne/plan-scan-1-binary-headers-audit.json`.

### 3.4 Inventory of Ground-Truth Assets Captured in `assets/20261024T194153-999-2zne/`
The following 18 ground-truth files have been retrieved, audited, and stored with the mandatory `plan-scan-1-` prefix:

1. `assets/20261024T194153-999-2zne/plan-scan-1-hf-tree-main.json` — Hugging Face space root tree schema (files, directories, LFS hashes, sizes).
2. `assets/20261024T194153-999-2zne/plan-scan-1-hf-tree-vcbr.json` — Tree schema for `vcbr/` binaries (`en` and `ru` `.wasm` and `.data`).
3. `assets/20261024T194153-999-2zne/plan-scan-1-hf-tree-dist.json` — Tree schema for `dist/` client assets (`game.js`, `index.html`, `intro.mp4`, etc.).
4. `assets/20261024T194153-999-2zne/plan-scan-1-hf-tree-modules.json` — Tree schema for `dist/modules/` runtime files.
5. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-Dockerfile` — Upstream Docker build steps showing archive extraction and case fixing.
6. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-fix_cases.py` — Upstream lowercase conversion script.
7. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-game.js` — Client launcher script (ownership check, `loadData`, `startGame`, `replaceFetch`).
8. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-index.html` — Full HTML5 shell with viewport, loader, intro video, controls, and canvas.
9. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-packages-en.js` — `DATA_PACKAGE` byte slicing table and remote package size (`135,355,111 B`).
10. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-fetch.js` — Emscripten XHR fetch interceptor and IndexedDB cache store.
11. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-loader.js` — Package loader and `getPreloadedPackage` wiring.
12. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-preload_files.list` — Upstream file list bundled in startup `.data` package.
13. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-carter-readme.md` — Port attribution and binary structure documentation.
14. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-lolendor-readme.md` — Upstream deployment documentation.
15. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-lolendor-server.py` — Upstream FastAPI server implementation.
16. `assets/20261024T194153-999-2zne/plan-scan-1-upstream-vc-sky-en-v6.wasm` — Complete verified WASM binary (`7,625,877 B`, SHA256 verified).
17. `assets/20261024T194153-999-2zne/plan-scan-1-binary-headers-audit.json` — Empirical HTTP response headers and Content-Lengths for all binaries.
18. `assets/20261024T194153-999-2zne/plan-scan-1-dead-cdn-headers.json` — Empirical HTTP response headers demonstrating 403 Forbidden on dead CDNs.

---

## 4. Explicit Deficiency & Systemic Obstacle Register

In accordance with `INV-ABSENCE-01` and first-principles modeling, the scan identified the following deficiencies, conflicting invariants, and architectural obstacles in the existing repository:

| Deficiency / Systemic Obstacle ID | Codebase / System Location | Nature of Obstacle or Deficiency | Recommended Architectural Remediation (`MANDATORY_TARGET`) |
| :--- | :--- | :--- | :--- |
| **`DEF-REVCDOS-01`** | Worktree root / `/revcdos/` | `/revcdos/` directory is entirely absent. No client web application, WASM binaries, runtime modules, or streaming assets exist on disk. | Materialize `/revcdos/` containing `index.html`, `game.js`, `index.js`, `GamepadEmulator.js`, `idbfs.js`, `jsdos-cloud-sdk*.js`, `cover.jpg`, `intro.mp4`, `modules/**`, `vcbr/vc-sky-en-v6.wasm`, `parts/vc-sky-en-v6.data.part00..03`, `pack.json`, and extracted lowercased `vcsky/fetched/**`. |
| **`DEF-SERVER-MIME-01`** | `scripts/serve_skatealley.py` (lines 206–241) | `CUSTOM_MIME_TYPES` and `EXTRA_MIME_TYPES` do not define MIME types for reVC game formats: `.data`, `.txd`, `.dff`, `.col`, `.img`, `.dir`, `.dat`, `.scm`, `.gxt`, `.raw`, `.adf`. Default server falls back to generic text or fails. | Add all reVC binary extensions mapped to `application/octet-stream`, `.wasm` to `application/wasm`, and `.mp3` to `audio/mpeg`. |
| **`DEF-SERVER-CASE-01`** | `scripts/serve_skatealley.py` (lines 526–585) | Server does not implement case-insensitive path resolution. Under case-sensitive remote filesystems (e.g. Linux on GitHub Actions or remote Mac), XHR requests with mismatched casing return `HTTP 404 Not Found`. | Override `translate_path()` in `SkateAlleyRequestHandler` to resolve path segments under `/revcdos/vcsky/` case-insensitively against the physical directory tree on disk. |
| **`DEF-SERVER-AUTOMAT-01`** | `scripts/serve_skatealley.py` (lines 243–291, 595) | While `ensure_nzportable_game_pk3` automatically reassembles `game.pk3` from tracked chunks, no equivalent auto-materialization function exists for `revcdos/vcbr/vc-sky-en-v6.data` (`135,355,111 B`). | Implement `ensure_revcdos_data(base_dir)` that concatenates `revcdos/parts/vc-sky-en-v6.data.part00..03` into `revcdos/vcbr/vc-sky-en-v6.data` on server startup if the raw binary is absent. |
| **`DEF-SERVER-HEALTH-01`** | `scripts/serve_skatealley.py` (lines 492–525) | `_serve_health()` checks only `nzportable_required` files and omits `/revcdos/`. `/api/health` does not verify or report `"revcdos_webapp"`. | Extend `_serve_health()` to check `revcdos/index.html`, `revcdos/vcbr/vc-sky-en-v6.wasm`, and `revcdos/vcsky/fetched`, appending `"revcdos_webapp"` to `services` and setting `"revcdos_webapp": True`. |
| **`DEF-GITIGNORE-01`** | `.gitignore` (lines 45–50) | `.gitignore` does not exclude `revcdos/vcbr/vc-sky-en-v6.data` (`135.36 MB`), `revcdos/vcsky/` (`~748 MB`), or `*.zip` (`618.96 MB`), which would violate GitHub's 100 MiB hard file limit if committed. | Append `revcdos/vcbr/vc-sky-en-v6.data`, `revcdos/vcsky/`, and `*.zip` to `.gitignore` while allowing tracked split chunks `revcdos/parts/vc-sky-en-v6.data.part00..03` and `revcdos/pack.json`. |
| **`DEF-HUD-LAUNCH-01`** | `index.html` (lines 2234–2247) | Freeman Alley HUD sidebar links to SkateRoom and NZ: Portable, but lacks a launcher button for GTA: Vice City. | Add `#hud-enter-revcdos-btn` adjacent to `#hud-enter-nzportable-btn` linking to `./revcdos/` with distinctive styling (`🌴 GTA: Vice City (reVCDOS)`). |
| **`DEF-APFS-RENAME-01`** | `fix_cases.py` / Local macOS APFS | Upstream `fix_cases.py` uses direct `os.rename(old, old.lower())`. On macOS APFS (which is case-insensitive by default), renaming a file to its lowercased equivalent is a silent no-op in directory entry tables! | The normalization routine MUST use a two-step temporary rename (`name + ".__case_tmp__"` $\rightarrow$ `name.lower()`) whenever `old != new` to force the APFS filesystem driver to commit the lowercase directory entry. |
| **`DEF-OWNERSHIP-GATE-01`** | Upstream `dist/game.js` (lines 410–418, 557–573) | If `localStorage.getItem('vcsky.haveOriginalGame') !== 'true'`, clicking the play button triggers `alert(t('demoOffDisclaimer'))` and prompts for local file upload, blocking game boot. | `game.js` must pre-seed `localStorage.setItem('vcsky.haveOriginalGame', 'true')` before `ownerShipConfirmed()` executes, ensuring `#click-to-play-button` immediately reads "Click to play" and boots directly into `loadData()`. |
| **`DEF-LOWER-FETCH-01`** | Upstream `dist/game.js` / `modules/fetch.js` | Upstream `replaceFetch` only rewrites `https://cdn.dos.zone/vcsky/` to `vcsky/`, but does NOT normalize the subpath to lowercase. Any case mismatch in C++ engine path requests results in `HTTP 404`. | Enhance `replaceFetch(str)` to rewrite the prefix AND convert the path suffix after `vcsky/` to `.toLowerCase()`. |

---

## 5. Sufficiency & Scan Certification

In accordance with the evaluation parameters defined in `LANGUAGE.md`:

- **`{sufficient}` Criteria Satisfied**:
  - The complete dependency cone—including HTTP server routes, MIME types, auto-materialization, health endpoints, `.gitignore` ceilings, HUD launcher links, and the standalone `/revcdos/` runtime—has been itemized with zero ambiguity.
  - All external endpoints, schemas, and asset sizes have been empirically verified against live HTTP endpoints and verified documentation; exact byte counts match to the individual byte.
  - The macOS APFS case-rename trap and ownership gate blockers have been diagnosed at their architectural root cause with concrete, fail-fast remediations.
  - Exactly 18 ground-truth asset, schema, and binary files have been downloaded and persisted into `assets/20261024T194153-999-2zne/plan-scan-1-*`.
- **Certification**: The static scan, active reconnaissance, and schema auditing for `functional_specification_043.md` are **100% COMPLETE and {sufficient}**.

---

## 6. Handoff Manifest Affirmation

The role handoff manifest at `handoff/20261024T194153-999-2zne/plan-scan-1.txt` has been atomically overwritten with exclusively repository-relative filepaths corresponding to:
1. All reviewed local codebase component files (15 paths).
2. The authored scan report: `wayfinder/20261024T194153-999-2zne/plan-scan-1-report.md`.
3. All 18 ground-truth asset, schema, and binary files captured in `assets/20261024T194153-999-2zne/plan-scan-1-*`.

Seed path `functional_specification_043.md` has been strictly excluded from the manifest per `INV-HANDOFF-01`.

---

## 7. Coding Gate Affirmation

**DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.**
