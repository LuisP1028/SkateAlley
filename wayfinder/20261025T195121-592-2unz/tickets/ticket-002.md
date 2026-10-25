# Ticket 002: Idempotent ISO Extraction, Sector-28 Kirk PRX `EBOOT.BIN` Decryption (`4,836,160` B `psp_size` Layout), `game.zip` Bundling & Multi-Worktree Provisioning (`scripts/provision_tkdr.py`)

- **Ticket ID**: `ticket-002`
- **Title**: Idempotent ISO Extraction, Sector-28 Kirk PRX `EBOOT.BIN` Decryption (`4,836,160` B `psp_size` Layout), `game.zip` Bundling & Multi-Worktree Provisioning (`scripts/provision_tkdr.py`)
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`
- **Blocks**: `ticket-003`, `ticket-004`

## 1. Decision Question

How should the system deterministically extract the `1,750,237,184`-byte Redump ISO from `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`, extract and Kirk-decrypt `PSP_GAME/SYSDIR/EBOOT.BIN` from ISO LBA sector 28 while preserving the exact `4,836,160`-byte `psp_size` buffer (`SHA-1: b9a0e3292738a833f4f8077e3959c3a0652c42cd`), build `tkdr/game.zip` containing both the ISO and decrypted EBOOT without re-deflating `1.75 GB`, and synchronize these git-ignored files across `/Users/diesel/Desktop/SkateAlley/tkdr/` and any active Sandcastle worktree (`tkdr/`)?

## 2. Authoritative Architectural Decision

### 2.1 Physical & Cryptographic Invariants
1. **Source Archive**:
   - Path: `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`
   - Size: `1,117,233,020` bytes (`1.04 GiB`), containing 1 entry: `Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso` (`1,750,237,184` bytes uncompressed, Deflate method `8`).
2. **Uncompressed UMD ISO (`tkdr/game.iso`)**:
   - Exact Size: `1,750,237,184` bytes (`854,608` sectors × `2,048` B)
   - CRC32: `0x3ffd7a9d`
   - **SHA-1**: `8193a65dee49685db49284408c89bdb35324bc32`
   - ISO9660 Primary Volume Descriptor (Sector 16, byte offset `32,768`, length `2,048`): starts with `b"\x01CD001\x01\x00PSP GAME"`.
3. **Encrypted Disc `EBOOT.BIN` (Sector 28 of ISO)**:
   - Location inside `game.iso`: LBA sector `28`, byte offset `57,344` (`0xE000`), length `4,836,160` bytes (`0x49CB00`).
   - Header: Magic `~PSP` (`0x5053507E`), module `tkpsp`, `elf_size = 4,835,824` (`0x49C9B0`), `psp_size = 4,836,160` (`0x49CB00`), Kirk Tag at offset `0xD0` = `0xC0CB167C`.
4. **Decrypted PRX Executable (`tkdr/eboot.bin` and `tkdr/ULUS10139_EBOOT.BIN`)**:
   - **Root-Cause Buffer Layout (`INV-ROOT-CAUSE-AGENCY-01`)**: Standard `pspDecryptPRX` returns `elf_size = 4,835,824` bytes (`SHA-1: 24b7f09db51a86a72fe3860f672617294b07fb2b`), whereas `tkdr-recomp/web/recomp/index.mjs` asserts `EBOOT_SHA1 = "b9a0e3292738a833f4f8077e3959c3a0652c42cd"` corresponding to PPSSPP's `DumpFileIfEnabled` buffer of `max(elf_size, psp_size) = 4,836,160` bytes:
     - Bytes `0 .. 4,835,823` (`4,835,824` B): Kirk-decrypted `\x7fELF` (`ET_SCE_PRX = 0xFFA0`) output from `pspDecryptPRX`.
     - Bytes `4,835,824 .. 4,836,159` (`336` B): Trailing `336` bytes retained from the original `4,836,160`-byte `psp_size` buffer (`enc_eboot[4835824:4836160]`).
   - Pre-staged verified file on disk: `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/ULUS10139_EBOOT.BIN` (`4,836,160` B, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`) and compiled Kirk decrypter binary `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/dec_eboot`.
   - Both `tkdr/eboot.bin` and `tkdr/ULUS10139_EBOOT.BIN` must be staged with exact size `4,836,160` B and verified against SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`.
5. **Combined `tkdr/game.zip` Bundle**:
   - Rather than re-compressing `1.75 GB` of ISO data from scratch (which takes ~45–60s), `scripts/provision_tkdr.py` copies `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip` (`1,117,233,020` B) to a temporary file and appends `ULUS10139_EBOOT.BIN` (`4,836,160` B) using `zipfile.ZipFile(..., "a", compression=zipfile.ZIP_STORED)`, producing a valid 2-entry `.zip` archive (`Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso` + `ULUS10139_EBOOT.BIN`) compatible with `disc.mjs`'s `zipEntries()` and `sortFiles()` in `< 1 second`.

### 2.2 `scripts/provision_tkdr.py` Architecture & Multi-Worktree Synchronization
Create `scripts/provision_tkdr.py` with an importable function `provision_tkdr(worktree_root=None, verify_sha1=False)` and CLI entrypoint (`python3 scripts/provision_tkdr.py [--verify-sha1]`):
1. **Shared Cache First (`/Users/diesel/Desktop/SkateAlley/tkdr/`)**:
   - Ensure `/Users/diesel/Desktop/SkateAlley/tkdr/` exists.
   - If `/Users/diesel/Desktop/SkateAlley/tkdr/game.iso` is missing or its size != `1,750,237,184`:
     - Stream-extract `Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso` from `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip` in `8 MiB` chunks to `/Users/diesel/Desktop/SkateAlley/tkdr/game.iso.tmp.<pid>`, computing SHA-1 on the fly.
     - Assert `size == 1750237184` and `sha1 == "8193a65dee49685db49284408c89bdb35324bc32"`, then atomically `os.replace` to `/Users/diesel/Desktop/SkateAlley/tkdr/game.iso`.
   - If `/Users/diesel/Desktop/SkateAlley/tkdr/eboot.bin` is missing or its size != `4,836,160` or SHA-1 != `"b9a0e3292738a833f4f8077e3959c3a0652c42cd"`:
     - If `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/ULUS10139_EBOOT.BIN` exists with SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`, copy it; otherwise read `4,836,160` bytes from `game.iso` at offset `57,344` (`0xE000`), invoke `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/dec_eboot` to obtain the `4,835,824`-byte decrypted ELF, append `enc_eboot[4835824:4836160]` (`336` bytes), and assert SHA-1 == `"b9a0e3292738a833f4f8077e3959c3a0652c42cd"`.
     - Write both `/Users/diesel/Desktop/SkateAlley/tkdr/eboot.bin` and `/Users/diesel/Desktop/SkateAlley/tkdr/ULUS10139_EBOOT.BIN`.
   - If `/Users/diesel/Desktop/SkateAlley/tkdr/game.zip` is missing or its size <= `1,117,233,020`:
     - Copy the source `.zip` to `/Users/diesel/Desktop/SkateAlley/tkdr/game.zip.tmp.<pid>`, append `ULUS10139_EBOOT.BIN` as `ULUS10139_EBOOT.BIN` with `ZIP_STORED`, and atomically `os.replace` to `/Users/diesel/Desktop/SkateAlley/tkdr/game.zip`.
2. **Bidirectional Hardlink/Copy Sync Between Shared Workspace and Active Worktree**:
   - Link/copy `game.iso`, `eboot.bin`, `ULUS10139_EBOOT.BIN`, and `game.zip` from `/Users/diesel/Desktop/SkateAlley/tkdr/` into `<worktree_root>/tkdr/` using `os.link` (falling back to `shutil.copy2` if across filesystems).
   - Sync all tracked `tkdr/` web runtime files (`index.html`, `tkdr.html`, `tkdr.js`, `tkdr.wasm`, `disc.mjs`, `config.json`, `_headers`, `recomp/*`, `tools/*`) between `<worktree_root>/tkdr/` and `/Users/diesel/Desktop/SkateAlley/tkdr/` so both locations always contain the complete staged webapp.

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `scripts/provision_tkdr.py`
- (Local disk runtime artifacts in `tkdr/` and `/Users/diesel/Desktop/SkateAlley/tkdr/`, Git-ignored via `.gitignore`):
  - `tkdr/game.iso` (`1,750,237,184` B, SHA-1 `8193a65dee49685db49284408c89bdb35324bc32`)
  - `tkdr/eboot.bin` (`4,836,160` B, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`)
  - `tkdr/ULUS10139_EBOOT.BIN` (`4,836,160` B, SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`)
  - `tkdr/game.zip` (2-entry ZIP containing `Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).iso` and `ULUS10139_EBOOT.BIN`)

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_057.md`
- `/Users/diesel/Desktop/SkateAlley/Tekken - Dark Resurrection (US) (2006) (Versus Fighting) (ISO) (PSP).zip`
- `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/ULUS10139_EBOOT.BIN`
- `/Users/diesel/.gemini/antigravity-cli/brain/9b118eda-fbcd-4e95-838e-a83a5769b3a9/scratch/kirk/dec_eboot`
- `assets/20261025T195121-592-2unz/plan-tkdr-runtime-and-crypto-manifest.json`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `tkdr/game.iso` and `/Users/diesel/Desktop/SkateAlley/tkdr/game.iso` exist with exact size `1,750,237,184` B and SHA-1 `8193a65dee49685db49284408c89bdb35324bc32`.
- Verify `tkdr/eboot.bin`, `tkdr/ULUS10139_EBOOT.BIN`, and `/Users/diesel/Desktop/SkateAlley/tkdr/eboot.bin` exist with exact size `4,836,160` B, `\x7fELF` header (`e_type == 0xFFA0`), and SHA-1 `b9a0e3292738a833f4f8077e3959c3a0652c42cd`.
- Verify `tkdr/game.zip` contains both the `1,750,237,184`-byte `.iso` entry and the `4,836,160`-byte `ULUS10139_EBOOT.BIN` entry.
