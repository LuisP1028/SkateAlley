# Master Component-to-Edit Matrix — Run `20261025T195121-592-2unz` (Functional Specification 057: `/tkdr/`)

This matrix establishes the authoritative separation between **Mandatory Target Deliverables (`MANDATORY_TARGET`)** that the `implement` stage must create or modify and mark `CHANGED` in `handoff/20261025T195121-592-2unz/implementer-status.txt`, and **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** inspected during reconnaissance and planning (`INV-DELIVERABLE-SPLIT-01`, `INV-NO-SELF-TEST-01`).

---

## Mandatory Target Deliverables (MANDATORY_TARGET)

All production files listed below must be created or modified by the `implement` stage to fulfill `functional_specification_057.md` end-to-end:

| Repository-Relative Path | Action | Line Range / Scope | Target Symbols / Structural Transformation | Governing Ticket |
| :--- | :---: | :---: | :--- | :---: |
| `.gitignore` | `MODIFY` | `L50–L58` | Append `tkdr/*.iso`, `tkdr/*.cso`, `tkdr/*.bin`, `tkdr/*.elf`, `tkdr/*.zip`, `tkdr/*.data`, and `tkdr/*.prx` so `0 B` of copyrighted game data in `tkdr/` is ever tracked in Git while the WebAssembly runtime and in-browser recompiler remain tracked. | `ticket-001` |
| `scripts/provision_tkdr.py` | `CREATE` | `L1–L210` | Idempotent provisioning module (`provision_tkdr(worktree_root=None, verify_sha1=False)` + CLI): extracts `game.iso` (`1,750,237,184` B, SHA-1 `8193a65dee49685db49284408c89bdb35324bc32`) from `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`, provisions Kirk-decrypted `eboot.bin` and `ULUS10139_EBOOT.BIN` (`4,836,160` B, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`) preserving the full `max(elf_size, psp_size)` buffer, builds 2-entry `game.zip`, and hardlink-syncs `/Users/diesel/Desktop/SkateAlley/tkdr/` with `<worktree>/tkdr/`. | `ticket-002` |
| `scripts/serve_skatealley.py` | `MODIFY` | `L216–L272`, `L453–L515`, `L1131–L1145`, `L1472–L1600` | 1. Add `TKDR_ISO_EXPECTED_SIZE = 1750237184` and `TKDR_EBOOT_EXPECTED_SIZE = 4836160`, and register `.iso`, `.cso`, `.bin`, `.elf`, `.prx`, `.zip` in `EXTRA_MIME_TYPES`.<br/>2. Implement and invoke `ensure_tkdr_assets(base_dir=None)` at module load and in `main()` to materialize/hardlink `tkdr/game.iso`, `tkdr/eboot.bin`, `tkdr/ULUS10139_EBOOT.BIN`, `tkdr/game.zip`, and `tkdr/**` between `/Users/diesel/Desktop/SkateAlley/tkdr/` and the active worktree.<br/>3. Update `SkateAlleyRequestHandler.end_headers(self)` to emit `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, and `Cross-Origin-Resource-Policy: same-origin` on all `/tkdr` and `/tkdr/*` responses.<br/>4. Refactor `SkateAlleyRequestHandler._try_serve_range(self, head_only=False)` to stream byte ranges in bounded `1 MiB` (`1024 * 1024` B) chunks rather than a single `f.read(length)` buffer.<br/>5. Update `SkateAlleyRequestHandler._serve_health(self, head_only=False)` to verify `tkdr/index.html`, `tkdr/tkdr.wasm`, `tkdr/game.iso`, and `tkdr/eboot.bin`, reporting `"tkdr_webapp": true` and appending `"tkdr_webapp"` to `"components"` and `"services"`. | `ticket-004` |
| `tkdr/index.html` | `CREATE` | `L1–L535` | Standalone HTML5/WebGL2 application shell for *Tekken: Dark Resurrection* (`tkdr-recomp`): initializes `window.__TKDR_STATUS__`, enforces COOP/COEP diagnostic check, auto-probes `./game.iso` (`HTTP 206`) and `./eboot.bin` (`HTTP 200`) for zero-friction boot, provides `./eboot.bin` fallback for ISO-only manual file drops, unlocks Web Audio on first user interaction, and runs `tkdr.js`. | `ticket-003` |
| `tkdr/tkdr.html` | `CREATE` | `L1–L535` | Byte-identical standalone HTML5/WebGL2 application shell matching `tkdr/index.html` so both `/tkdr/` and `/tkdr/tkdr.html` serve the enhanced runtime shell. | `ticket-003` |
| `tkdr/tkdr.js` | `CREATE` | JS (`230,442 B`) | Emscripten JavaScript runtime glue managing the 48-worker pthread pool (`PTHREAD_POOL_SIZE=48`), `768 MB` shared WebAssembly memory, SDL2 input/audio bridges, and `tkShareGameModule` dynamic dispatch. | `ticket-001` |
| `tkdr/tkdr.wasm` | `CREATE` | Binary (`2,672,263 B`) | Compiled WebAssembly runtime containing the PSP kernel thread scheduler, 31-library / 280-function HLE table, VFPU interpreter, WebGL2 & multi-threaded software GE renderer, ImGui settings UI (`F1`), ATRAC3/3+ audio decoder, and FFmpeg 7.1.1 H.264 movie decoder. | `ticket-001` |
| `tkdr/disc.mjs` | `CREATE` | JS (`13,046 B`) | Browser ES module providing ISO/CSO sector reading (`openDisc`), HTTP byte-range file abstraction (`httpFile`), ZIP/ZIP64 central directory parsing (`zipEntries`), and OPFS CSO block compression (`storeDisc` / `writeCso`). | `ticket-001` |
| `tkdr/config.json` | `CREATE` | JSON (`43 B`) | Deployer configuration `{"pickFiles": false, "gameZip": "./game.zip"}` for Secondary Mode archive fallback. | `ticket-001` |
| `tkdr/_headers` | `CREATE` | Text (`167 B`) | Static-host COOP/COEP header rules (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`). | `ticket-001` |
| `tkdr/recomp/analyze.mjs` | `CREATE` | JS (`6,668 B`) | Extracts `7,310` `.eh_frame` FDE boundaries plus `jal` and vtable targets (`13,809` guest functions) and resolves `388` `.rodata` jump tables. | `ticket-001` |
| `tkdr/recomp/elf.mjs` | `CREATE` | JS (`5,733 B`) | Parses the `ET_SCE_PRX` ELF (`ULUS10139_EBOOT.BIN`), maps segments to base `0x08804000`, and applies `SHT_PRXRELOC` (`0x700000A0`) MIPS relocations. | `ticket-001` |
| `tkdr/recomp/index.mjs` | `CREATE` | JS (`1,853 B`) | Validates `EBOOT_SHA1` (`"b9a0e3292738a833f4f8077e3959c3a0652c42cd"`), computes recompiler version hash, and orchestrates `recompile()`. | `ticket-001` |
| `tkdr/recomp/mips.mjs` | `CREATE` | JS (`5,727 B`) | Decodes `641,720` Allegrex, FPU, and VFPU instructions. | `ticket-001` |
| `tkdr/recomp/nids.json` | `CREATE` | JSON (`11,954 B`) | Maps 280 imported PSP NIDs across 31 libraries to human-readable HLE symbol names. | `ticket-001` |
| `tkdr/recomp/wasm.mjs` | `CREATE` | JS (`8,261 B`) | WebAssembly binary section and opcode encoding primitives. | `ticket-001` |
| `tkdr/recomp/wasmgen.mjs` | `CREATE` | JS (`28,386 B`) | Emits `23,544,922` B of binary WebAssembly bytecode (`code.wasm`) with one Wasm function per guest MIPS function and binary-search `dispatch(ctx, addr)`. | `ticket-001` |
| `tkdr/recomp/worker.mjs` | `CREATE` | JS (`562 B`) | Runs `recompile()` off the main thread inside a module Web Worker. | `ticket-001` |
| `tkdr/tools/serve.py` | `CREATE` | Python (`L1–L145`) | Standalone HTTP server for `tkdr/` emitting `COOP`/`COEP`/`CORP` headers, serving `1 MiB` chunked `HTTP 206 Partial Content` byte ranges on `GET` and `HEAD`, supporting `/tkdr/*` and `/<subpath>` routes, and exposing `/api/health`. | `ticket-004` |
| `tkdr/tools/web_config.py` | `CREATE` | Python (`1,027 B`) | Config generator utility for `tkdr/config.json`. | `ticket-001` |

### Local Disk Runtime Artifacts (Mandatory On-Disk Presence in `tkdr/` and `/Users/diesel/Desktop/SkateAlley/tkdr/`, Git-Ignored via `.gitignore`)
- `tkdr/game.iso` (`1,750,237,184 B`, CRC32 `0x3ffd7a9d`, SHA-1 `8193a65dee49685db49284408c89bdb35324bc32` — extracted from `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip` and auto-materialized across worktrees by `scripts/provision_tkdr.py` and `ensure_tkdr_assets` in `scripts/serve_skatealley.py`).
- `tkdr/eboot.bin` (`4,836,160 B`, `\x7fELF` `ET_SCE_PRX`, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd` — Kirk-decrypted `PSP_GAME/SYSDIR/EBOOT.BIN` preserving the full `max(elf_size, psp_size)` buffer).
- `tkdr/ULUS10139_EBOOT.BIN` (`4,836,160 B`, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd` — byte-identical copy/hardlink of `tkdr/eboot.bin`).
- `tkdr/game.zip` (`~1.12 GB` — combined `.zip` containing both the `1,750,237,184`-byte ISO and the `4,836,160`-byte `ULUS10139_EBOOT.BIN`).

---

## Read-Only Discovery Context (READ_ONLY_CONTEXT)

The following files were inspected or captured during `plan`, `plan-scan-1`, and `plan-scan-2` as ground-truth reference context and must **not** be conflated with mandatory edit targets:

- `functional_specification_057.md`
- `LANGUAGE.md`
- `.sandcastle/mcp.md`
- `index.html` (strictly read-only; zero *Tekken: Dark Resurrection* integration into the Three.js Freeman Alley scene)
- `sandbox.js` (strictly read-only; zero *Tekken: Dark Resurrection* integration into the Three.js Freeman Alley scene)
- `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`
- `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/tkdr-recomp/**`
- `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/**`
- `assets/20261025T195121-592-2unz/plan-tkdr-runtime-and-crypto-manifest.json`
- `assets/20261025T195121-592-2unz/plan-upstream-shell-reference.html`
- `assets/20261025T195121-592-2unz/plan-scan-1-*` and `assets/20261025T195121-592-2unz/plan-scan-2-*`
