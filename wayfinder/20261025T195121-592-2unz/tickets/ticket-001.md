# Ticket 001: Upstream `tkdr-recomp` WebAssembly Runtime & In-Browser Allegrex MIPS Recompiler Bundle Staging (`/tkdr/**`) & `.gitignore` Hygiene

- **Ticket ID**: `ticket-001`
- **Title**: Upstream `tkdr-recomp` WebAssembly Runtime & In-Browser Allegrex MIPS Recompiler Bundle Staging (`/tkdr/**`) & `.gitignore` Hygiene
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `None`
- **Blocks**: `ticket-002`, `ticket-003`, `ticket-004`

## 1. Decision Question

How should the `implement` stage acquire and stage the hostable `gasparegas/tkdr-recomp` WebAssembly runtime (`tkdr.wasm`, `tkdr.js`), disc/CSO/ZIP reader (`disc.mjs`), and in-browser Allegrex MIPS-to-WebAssembly recompiler (`recomp/*`) into `tkdr/`, configure `tkdr/config.json` and `tkdr/_headers`, and enforce `.gitignore` rules so `0 B` of copyrighted PSP game data is ever tracked in Git?

## 2. Authoritative Architectural Decision

### 2.1 Candidate Datasource Selection & Verified Commit / Blob Inventory
- **Authoritative Upstream Repository**: `https://github.com/gasparegas/tkdr-recomp`
  - Pre-cloned local git repository on disk: `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/tkdr-recomp`
  - `main` branch commit: `6b6196b539628bddad821bf850d203d8855e140e`
  - `deploy` branch commit (containing the prebuilt hostable `RECOMP_DYNAMIC=ON` WebAssembly bundle under `site/`): `786460f1c0c4360938d5d4e1dbaac2a23e8601bd`
- **Exact File Inventory & Byte Sizes to Stage in `tkdr/`**:
  | Target Path in Repo (`tkdr/`) | Source in `deploy` (`786460f1...`) | Exact Size (`Bytes`) | Git Blob SHA-1 |
  | :--- | :--- | :---: | :---: |
  | `tkdr/tkdr.wasm` | `deploy:site/tkdr.wasm` | `2,672,263` | `c05f5016e0547574dbbe2c331b4ffd9d0d04676a` |
  | `tkdr/tkdr.js` | `deploy:site/tkdr.js` | `230,442` | `5d68915055e9ebe5ccbfdd0d5b754cff77897e8d` |
  | `tkdr/disc.mjs` | `deploy:site/disc.mjs` | `13,046` | `d533f173ec878e2cb57faf4f99aa4633d9385847` |
  | `tkdr/_headers` | `deploy:site/_headers` | `167` | `41c6f326429a07056cc9bd20e733a9c6739507cf` |
  | `tkdr/recomp/analyze.mjs` | `deploy:site/recomp/analyze.mjs` | `6,668` | `31e90d00529c0c8c6feb92751755ef5da394bcdd` |
  | `tkdr/recomp/elf.mjs` | `deploy:site/recomp/elf.mjs` | `5,733` | `38c13d3f99c20fabb582abd114b4661ee6bf9bcf` |
  | `tkdr/recomp/index.mjs` | `deploy:site/recomp/index.mjs` | `1,853` | `5fcaf104689a20114148558316edf03a612c49f4` |
  | `tkdr/recomp/mips.mjs` | `deploy:site/recomp/mips.mjs` | `5,727` | `bb136284bf73ec3f827ab266f25578464dc9abb1` |
  | `tkdr/recomp/nids.json` | `deploy:site/recomp/nids.json` | `11,954` | `153560bfad6923d7fdc749d952224dd73d7fa061` |
  | `tkdr/recomp/wasm.mjs` | `deploy:site/recomp/wasm.mjs` | `8,261` | `64dc12bb36525f073bf50605961708ef48d33415` |
  | `tkdr/recomp/wasmgen.mjs` | `deploy:site/recomp/wasmgen.mjs` | `28,386` | `eb2fbe556ba1997b47a5ad75ad64bb2d61c4798f` |
  | `tkdr/recomp/worker.mjs` | `deploy:site/recomp/worker.mjs` | `562` | `247432c012e693db6857fbc2a9b8c53ff3ccc14d` |
  | `tkdr/tools/web_config.py` | `deploy:tools/web_config.py` | `1,027` | `e559a739305c680eb505752b491db2966173cab6` |

### 2.2 Deterministic Extraction Commands
The `implement` stage must extract these files from `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/tkdr-recomp` (or fetch `origin/deploy` from `https://github.com/gasparegas/tkdr-recomp.git` if needed):
```bash
mkdir -p tkdr/recomp tkdr/tools
TKDR_SRC="/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/tkdr-recomp"
for f in tkdr.js tkdr.wasm disc.mjs _headers; do
  git -C "$TKDR_SRC" show "deploy:site/$f" > "tkdr/$f"
done
for f in analyze.mjs elf.mjs index.mjs mips.mjs nids.json wasm.mjs wasmgen.mjs worker.mjs; do
  git -C "$TKDR_SRC" show "deploy:site/recomp/$f" > "tkdr/recomp/$f"
done
git -C "$TKDR_SRC" show "deploy:tools/web_config.py" > "tkdr/tools/web_config.py"
chmod +x tkdr/tools/web_config.py
```

### 2.3 `tkdr/config.json` Schema
Create `tkdr/config.json` so that if Secondary Mode (`serverMode()` when `?iso=` is not active and direct `./game.iso` streaming is bypassed) is ever queried, it points to `./game.zip`:
```json
{"pickFiles": false, "gameZip": "./game.zip"}
```

### 2.4 `.gitignore` Rules (`L50–L56` of `.gitignore`)
Append the following rules to `.gitignore` immediately after `revcdos/vcsky/` so that zero bytes of copyrighted game data inside `tkdr/` are ever committed to Git:
```gitignore
tkdr/*.iso
tkdr/*.cso
tkdr/*.bin
tkdr/*.elf
tkdr/*.zip
tkdr/*.data
tkdr/*.prx
```

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `.gitignore`
- `tkdr/_headers`
- `tkdr/config.json`
- `tkdr/disc.mjs`
- `tkdr/tkdr.js`
- `tkdr/tkdr.wasm`
- `tkdr/recomp/analyze.mjs`
- `tkdr/recomp/elf.mjs`
- `tkdr/recomp/index.mjs`
- `tkdr/recomp/mips.mjs`
- `tkdr/recomp/nids.json`
- `tkdr/recomp/wasm.mjs`
- `tkdr/recomp/wasmgen.mjs`
- `tkdr/recomp/worker.mjs`
- `tkdr/tools/web_config.py`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_057.md`
- `LANGUAGE.md`
- `assets/20261025T195121-592-2unz/plan-tkdr-runtime-and-crypto-manifest.json`
- `assets/20261025T195121-592-2unz/plan-upstream-shell-reference.html`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify all 14 staged runtime, recompiler, and config files exist in `tkdr/` with exact byte sizes matching the table in §2.1.
- Verify `git check-ignore tkdr/game.iso tkdr/eboot.bin tkdr/ULUS10139_EBOOT.BIN tkdr/game.zip tkdr/game.cso tkdr/dec.elf tkdr/test.data` succeeds for every pattern and `git status --porcelain` shows zero tracked `.iso`, `.cso`, `.bin`, `.elf`, `.zip`, or `.data` files.
