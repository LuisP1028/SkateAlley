# Wayfinder Plan-Scan-2 Report: Deterministic Static Codebase Scan, External API Reconnaissance, and Schema Auditing

- **Run ID**: `20261024T194153-999-2zne`
- **Agent**: `plan-scan-2` (Agent 2, Planning Node)
- **Worktree Branch**: `agent/plan-scan-2-20261024T194153-999-2zne`
- **Governing Specification**: `functional_specification_043.md`
- **Authoritative Vocabulary**: [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/LANGUAGE.md)
- **Host MCP Registry**: [`.sandcastle/mcp.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/mcp.md)

---

## 1. Governing Context & Invariant Binding

This scan report binds strictly and exclusively to:
1. `functional_specification_043.md` ("Standalone Playable WebAssembly/WebGL2 Web Application for GTA: Vice City (`/revcdos/`)").
2. Core domain evaluation parameters established in [`LANGUAGE.md`](file:///Users/diesel/Desktop/SkateAlley/LANGUAGE.md) (`{functionality}`, `{correctness}`, `{correct required outputs}`, `{errors}`, `{sufficient}`, `{insufficient}`).
3. Host MCP configuration in [`.sandcastle/mcp.md`](file:///Users/diesel/Desktop/SkateAlley/.sandcastle/mcp.md).
4. Direct empirical reconnaissance of external repositories and live HTTP endpoints, with all captured reference schemas and scripts preserved under `assets/20261024T194153-999-2zne/plan-scan-2-*`.

### Key Architectural Invariants Enforced:
- **`INV-STRICT-NATIVE-ENGINE-01`**: GTA: Vice City executes exclusively via its native Emscripten WebAssembly/WebGL2 engine (`vc-sky-en-v6.wasm` + `vc-sky-en-v6.data` + modular runtime `modules/*.js`) inside `/revcdos/`. Zero Three.js porting; [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/sandbox.js) scene graph is strictly isolated.
- **`INV-DEAD-CDN-REMEDIATION-01`**: Upstream CDN endpoints `https://cdn.dos.zone/vcsky/` and `https://br.cdn.dos.zone/vcsky/` return `HTTP 403 Forbidden / AccessDenied` from S3 buckets `68bbc47d0-doszone-uploads` and `68bbc47d0de7-br-bundles`. `https://folder.morgen.qzz.io/revcdos.bin` hosts a monolithic unsplit 1.08 GB file. The system must self-host all assets locally and route via relative paths (`vcsky/` and `vcbr/`).
- **`INV-RETAIL-OWNERSHIP-BYPASS-01`**: Automatic full-game activation on page load (`localStorage.setItem('vcsky.haveOriginalGame', 'true')` and `ownerShipConfirmed()`) ensures the button displays "Click to play" without triggering `#demo-off-disclaimer` or file-upload inputs.
- **`INV-APFS-CASE-NORMALIZATION-01`**: Because macOS APFS is case-insensitive by default, directory and filename lowercase normalization cannot rely on single-step `os.rename(name, name.lower())` (which can silently no-op). A two-step intermediate rename (`.__case_tmp__`) is strictly mandatory.
- **`INV-GIT-HYGIENE-CHUNK-01`**: Unsplit `vc-sky-en-v6.data` (`135,355,111 B`), unpacked `vcsky/` (`~748 MB`), and `*.zip` are excluded via [`.gitignore`](file:///Users/diesel/Desktop/SkateAlley/.gitignore). The startup package is tracked as 4 deterministic chunks (`revcdos/parts/vc-sky-en-v6.data.part00..03`, each $\le 35\text{ MB}$, sum $= 135,355,111\text{ B}$).

---

## 2. Master Component Dependency Cone Register

Every file inspected in the local repository is cataloged below, explicitly categorized into **Candidate Mandatory Target Deliverables (`MANDATORY_TARGET`)** (production files that must be modified or refactored) and **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** (reference files inspected for architectural patterns).

| File Path | Role Classification | Verbatim Symbols / Key Sections | Grounding Justification & Operational Context |
| :--- | :--- | :--- | :--- |
| [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | **`MANDATORY_TARGET`** | `EXTRA_MIME_TYPES`, `CUSTOM_MIME_TYPES`, `ensure_nzportable_game_pk3`, `_serve_health`, `guess_type`, `translate_path`, `_try_serve_range` | Must be updated to: (1) Register `.data`, `.txd`, `.dff`, `.col`, `.img`, `.dir`, `.dat`, `.scm`, `.gxt`, `.raw`, `.adf`, `.part\d+` as `application/octet-stream`, `.wasm` as `application/wasm`, `.mp3` as `audio/mpeg`; (2) Auto-materialize `revcdos/vcbr/vc-sky-en-v6.data` from `parts/vc-sky-en-v6.data.part00..03` if absent; (3) Implement case-insensitive path resolution under `/revcdos/vcsky/`; (4) Report `"revcdos_webapp": true` in `/api/health`. |
| [`.gitignore`](file:///Users/diesel/Desktop/SkateAlley/.gitignore) | **`MANDATORY_TARGET`** | Lines 45–50 (unsplit binary exclusions) | Currently ignores `skate3_cleanroom/core.pack` and `nzportable/nzp/game.pk3`. Must append `revcdos/vcbr/vc-sky-en-v6.data` (`135.36 MB`), `revcdos/vcsky/` (`~748 MB`), and `*.zip` to prevent GitHub's 100 MiB per-file rejection, while allowing `revcdos/parts/` and `revcdos/pack.json` to be tracked. |
| [`index.html`](file:///Users/diesel/Desktop/SkateAlley/index.html) | **`MANDATORY_TARGET`** | Lines 2242–2247 (`#hud-enter-nzportable-btn`) | Must add a clean, non-intrusive launcher button (`#hud-enter-revcdos-btn`) inside `#sandbox-hud-body` linking to `./revcdos/` (`🌴 Vice City (reVCDOS)`), matching the existing Skate 3 and NZ:Portable launcher buttons. |
| [`skate3_cleanroom/loader.js`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/loader.js) | `READ_ONLY_CONTEXT` | `openPackCache`, `fetchWithTunnelFailover`, `readStreamIntoBuffer`, `fetchMultipartBuffer`, `resolveAssetArrayBuffer` | Proves clean-room WebAssembly architecture, `CacheStorage` caching contract (`skate3-pack-v1`), multi-part binary assembly (`.part00..06`), and `window.__SKATE3_STATUS__` telemetry pattern. |
| [`skate3_cleanroom/index.html`](file:///Users/diesel/Desktop/SkateAlley/skate3_cleanroom/index.html) | `READ_ONLY_CONTEXT` | `#splash`, `#overlay`, `#canvas`, `#hudbar`, return link to `../` | Architectural layout precedent for standalone fullscreen WebGL canvas app with return navigation button (`← 3D Portfolio (Alley)`). |
| [`nzportable/loader.js`](file:///Users/diesel/Desktop/SkateAlley/nzportable/loader.js) | `READ_ONLY_CONTEXT` | `window.__NZP_STATUS__`, `getServerTunnelBaseUrl`, `fetchMultipartBuffer`, `beforeunload` override | Proves multi-part chunk streaming (`parts/game.pk3.part00..02`), tunnel failover lookup via `../tunnel.json`, and FPS/error telemetry loop. |
| [`nzportable/pack.json`](file:///Users/diesel/Desktop/SkateAlley/nzportable/pack.json) | `READ_ONLY_CONTEXT` | `version`, `cacheName`, `engine`, `files` (with `parts`, `partSizes`, `partSha256`) | Serves as authoritative schema template for `revcdos/pack.json`. |
| [`sandbox.js`](file:///Users/diesel/Desktop/SkateAlley/sandbox.js) | `READ_ONLY_CONTEXT` | Freeman Alley Three.js scene graph, audio player, character animation loop | Confirms complete isolation between the 3D alley portfolio and standalone webapp canvas routes; zero engine coupling. |

---

## 3. External Datasource & Schema Audit Register

Active empirical reconnaissance was performed using non-mutating HTTP requests (`curl`, Python `urllib`) and the Hugging Face Hub REST API. All ground-truth reference files and schemas have been downloaded and saved into `assets/20261024T194153-999-2zne/plan-scan-2-*`.

### 3.1 Probed Endpoints & Empirical Status Verification

| Target URL | Observed Status | Content-Type | Exact Content-Length | Notes & Verified Response |
| :--- | :---: | :---: | :---: | :--- |
| `https://huggingface.co/api/spaces/th3w33knd/reVCDOS/tree/main` | `HTTP 200 OK` | `application/json` | `2,049 B` | Hugging Face Spaces repository tree API. Full payload saved to `plan-scan-2-hf-tree.json`. |
| `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcbr/vc-sky-en-v6.wasm` | `HTTP 200 OK` | `application/wasm` | `7,625,877 B` | Emscripten compiled WebAssembly binary. LFS SHA-256: `db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2`. |
| `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcbr/vc-sky-en-v6.data` | `HTTP 200 OK` | `application/octet-stream` | `135,355,111 B` | Startup preloaded filesystem package. LFS SHA-256: `3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6`. |
| `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcsky.zip` | `HTTP 200 OK` | `application/zip` | `618,960,890 B` | Full on-demand asset archive (~748 MB unpacked). Git OID: `c5ddcc138f3ac34867a9be089eec620faa228714`. |
| `https://cdn.dos.zone/vcsky/` | `HTTP 403 Forbidden` | `application/xml` | `263 B` | Dead upstream CDN. S3 Bucket: `68bbc47d0-doszone-uploads`. Body contains `<Code>AccessDenied</Code>`. |
| `https://br.cdn.dos.zone/vcsky/` | `HTTP 403 Forbidden` | `application/xml` | `258 B` | Dead upstream CDN. S3 Bucket: `68bbc47d0de7-br-bundles`. Body contains `<Code>AccessDenied</Code>`. |
| `https://folder.morgen.qzz.io/revcdos.bin` | `HTTP 200 OK` | `text/plain` | `1,084,364,719 B` | Monolithic unsplit 1.08 GB binary. Prone to SSL handshake failures (HTTP 525) and unacceptable for Git tracking. |
| `https://raw.githubusercontent.com/Lolendor/reVCDOS/main/README.md` | `HTTP 200 OK` | `text/plain` | `12,661 B` | Deobfuscated reVCDOS documentation. Saved to `plan-scan-2-lolendor-readme.md`. |
| `https://raw.githubusercontent.com/Carter54git/revcdos/master/src/preload_files.list` | `HTTP 200 OK` | `text/plain` | `92,984 B` | Upstream preload package manifest (1,775 files). Saved to `plan-scan-2-carter54-preload_files.list`. |

### 3.2 Inventory of Captured Reference Artifacts (`assets/20261024T194153-999-2zne/plan-scan-2-*`)

All files below were written to disk during this session and are prefixed strictly with `plan-scan-2-`:

1. `assets/20261024T194153-999-2zne/plan-scan-2-hf-tree.json` — Raw JSON schema from Hugging Face Spaces Tree API (`th3w33knd/reVCDOS`), verifying repository structure and Git LFS pointers.
2. `assets/20261024T194153-999-2zne/plan-scan-2-hf-dockerfile` — Upstream Dockerfile proving extraction and lowercase execution flow (`unzip -o vcsky.zip -d vcsky && python fix_cases.py`).
3. `assets/20261024T194153-999-2zne/plan-scan-2-hf-fix_cases.py` — Upstream case-fixing script (`os.walk("vcsky", topdown=False)`).
4. `assets/20261024T194153-999-2zne/plan-scan-2-hf-game.js` — Upstream launcher script containing the verified ownership bypass: `if (params.get('request_original_game') !== "1") localStorage.setItem('vcsky.haveOriginalGame', 'true');`.
5. `assets/20261024T194153-999-2zne/plan-scan-2-lolendor-game.js` — Original Lolendor launcher script displaying the retail gate and `replaceFetch` / `replaceBR` URL rewriting.
6. `assets/20261024T194153-999-2zne/plan-scan-2-lolendor-server.py` — Python HTTP server from Lolendor repository implementing byte-range requests and local caching flags.
7. `assets/20261024T194153-999-2zne/plan-scan-2-lolendor-cache.py` — Upstream caching helper from `Lolendor/reVCDOS/additions/cache.py`.
8. `assets/20261024T194153-999-2zne/plan-scan-2-lolendor-readme.md` — Upstream README document.
9. `assets/20261024T194153-999-2zne/plan-scan-2-carter54-readme.md` — Carter54git upstream README detailing DOS.Zone Team attribution.
10. `assets/20261024T194153-999-2zne/plan-scan-2-carter54-preload_files.list` — Upstream list of 1,775 files bundled into `vc-sky-en-v6.data`.
11. `assets/20261024T194153-999-2zne/plan-scan-2-probe-headers.json` — Empirical JSON record of HTTP headers and status codes probed across all upstream URLs.
12. `assets/20261024T194153-999-2zne/plan-scan-2-pack.schema.json` — Formal JSON schema modeling `revcdos/pack.json` and the 4-part deterministic chunk decomposition of `vc-sky-en-v6.data`.

---

## 4. Physical Payload Model & Chunk Split Architecture

To satisfy GitHub's strict 50–100 MiB single-file limit without sacrificing runtime performance:

$$135,355,111\text{ bytes} = 3 \times 33,838,778\text{ bytes} + 1 \times 33,838,777\text{ bytes}$$

| Chunk Identifier | Byte Offset Start | Byte Offset End (exclusive) | Chunk Size (`bytes`) | Chunk Size (`MiB`) | Git Tracking Policy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `revcdos/parts/vc-sky-en-v6.data.part00` | 0 | 33,838,778 | 33,838,778 | ~32.27 MiB | Tracked in Git ($\le 35\text{ MB}$) |
| `revcdos/parts/vc-sky-en-v6.data.part01` | 33,838,778 | 67,677,556 | 33,838,778 | ~32.27 MiB | Tracked in Git ($\le 35\text{ MB}$) |
| `revcdos/parts/vc-sky-en-v6.data.part02` | 67,677,556 | 101,516,334 | 33,838,778 | ~32.27 MiB | Tracked in Git ($\le 35\text{ MB}$) |
| `revcdos/parts/vc-sky-en-v6.data.part03` | 101,516,334 | 135,355,111 | 33,838,777 | ~32.27 MiB | Tracked in Git ($\le 35\text{ MB}$) |
| **Combined (`vcbr/vc-sky-en-v6.data`)** | **0** | **135,355,111** | **135,355,111** | **~129.08 MiB** | **Ignored in `.gitignore`** |

### Auto-Materialization Precedent
[`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) already contains `ensure_nzportable_game_pk3(base_dir)` (lines 243–291), which reconstructs `nzportable/nzp/game.pk3` (94,276,834 B) from `nzportable/parts/game.pk3.part00..02` on server startup. An identical routine `ensure_revcdos_vc_sky_data(base_dir)` must be implemented to assemble `revcdos/vcbr/vc-sky-en-v6.data` automatically.

---

## 5. Explicit Deficiency & Systemic Obstacle Register

| Item ID | Component / Area | Defect / Deficiency Description | Architectural Impact & Recommended Remediation (`plan`) |
| :--- | :--- | :--- | :--- |
| `DEF-REVCDOS-DIR` | Codebase Filesystem | `/revcdos/` does not exist in worktree or parent repository. | Implementer must create `/revcdos/` directory layout with `index.html`, `game.js`, `modules/`, `vcbr/`, `parts/`, and `vcsky/fetched/`. |
| `DEF-GITIGNORE-EXCLUSIONS` | [`.gitignore`](file:///Users/diesel/Desktop/SkateAlley/.gitignore) | Missing exclusions for `revcdos/vcbr/vc-sky-en-v6.data` (`135.36 MB`), `revcdos/vcsky/` (`~748 MB`), and `*.zip`. | If committed un-ignored, Git will fail push due to GitHub's 100 MiB ceiling. Add explicit entries to `.gitignore` under large binaries section. |
| `DEF-MIME-REVCDOS` | [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | Missing reVC binary and data format MIME associations (`.data`, `.txd`, `.dff`, `.col`, `.img`, `.dir`, `.dat`, `.scm`, `.gxt`, `.raw`, `.adf`). | Add extensions to `EXTRA_MIME_TYPES` / `CUSTOM_MIME_TYPES` mapping to `application/octet-stream`. |
| `DEF-SERVER-CASE-ROUTING` | [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | No case-insensitive filesystem fallback for `/revcdos/vcsky/` requests. | Override path resolution in `translate_path()` to match disk entries case-insensitively, preventing `HTTP 404` errors if uppercase requests slip through. |
| `DEF-SERVER-HEALTH` | [`scripts/serve_skatealley.py`](file:///Users/diesel/Desktop/SkateAlley/scripts/serve_skatealley.py) | `/api/health` does not check or report `/revcdos/` status. | Add health check verifying `revcdos/index.html`, `revcdos/vcbr/vc-sky-en-v6.wasm`, and `revcdos/vcsky/fetched`, appending `"revcdos_webapp"` to `services`. |
| `DEF-APFS-CASE-RENAME` | File Normalization | Calling single-step `os.rename(p, p.lower())` on macOS APFS is a silent no-op when case differences exist. | Mandate two-step renaming (`p` $\rightarrow$ `p + '.__case_tmp__'` $\rightarrow$ `p.lower()`) during `fix_cases.py` execution. |
| `DEF-OWNERSHIP-BYPASS` | Client Launcher | Default `Lolendor/reVCDOS` requires local retail file upload if `vcsky.haveOriginalGame` is unset. | Incorporate upstream `th3w33knd/reVCDOS` top-of-file bypass: `if (params.get('request_original_game') !== '1') localStorage.setItem('vcsky.haveOriginalGame', 'true');`. |
| `DEF-TELEMETRY-CONTRACT` | Client Launcher | Original upstream repos lack programmatic telemetry for browser testing. | Instrument `game.js` to expose `window.__REVCDOS_STATUS__ = { haveOriginalGame, dataLoadedBytes, wasmReady, mainCalled, fetchedAssetsCount, failedFetchesCount, lastFetchedUrl, lastError }`. |

---

## 6. Sufficiency & Scan Certification

- **Deterministic Exhaustiveness**: All components touching `functional_specification_043.md` have been enumerated down to leaf utilities and persistence layers.
- **Empirical Grounding**: All external endpoints, byte sizes, MIME types, and SHA-256 checksums were verified through live HTTP probes and recorded in `assets/20261024T194153-999-2zne/plan-scan-2-*`.
- **Zero Ambiguity**: The physical payload budget, chunk split boundaries, case-sensitivity workarounds, ownership gate remediations, and server integration points are fully documented.
- **Sufficiency State**: `{sufficient}`.

---

## 7. Handoff Manifest Affirmation

The dedicated handoff manifest at [`handoff/20261024T194153-999-2zne/plan-scan-2.txt`](file:///Users/diesel/Desktop/SkateAlley/handoff/20261024T194153-999-2zne/plan-scan-2.txt) has been atomically overwritten with the exact repository-relative paths of all qualified codebase files, this authored report, and all captured assets in `assets/20261024T194153-999-2zne/plan-scan-2-*`.

---

## 8. Coding Gate Affirmation

> [!IMPORTANT]
> **DO NOT CODE YET**: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated.
