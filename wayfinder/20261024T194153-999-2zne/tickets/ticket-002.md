# Ticket 002: On-Demand `vcsky.zip` Extraction & macOS APFS Two-Step Recursive Lowercase Normalization (`revcdos/vcsky/fetched/**`)

- **Ticket ID**: `ticket-002`
- **Title**: On-Demand `vcsky.zip` Extraction & macOS APFS Two-Step Recursive Lowercase Normalization (`revcdos/vcsky/fetched/**`)
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `ticket-001`
- **Blocks**: `ticket-004`, `ticket-006`

## 1. Decision Question

How should the `implement` stage acquire, unpack, and normalize the `618,960,890`-byte `vcsky.zip` on-demand streaming archive into `/revcdos/vcsky/fetched/**` so that 100% of directories and filenames are strictly lowercase on disk (avoiding the macOS APFS case-insensitive `os.rename` no-op trap) and all expected directory paths exist?

## 2. Authoritative Architectural Decision

### 2.1 Empirical Archive Schema (`vcsky.zip`)
Range-request inspection of the `vcsky.zip` central directory (`assets/20261024T194153-999-2zne/plan-vcsky-zip-header-probe.txt`) established the following ground-truth metrics:
- **Source URL**: `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcsky.zip`
- **Archive Byte Size**: `618,960,890` bytes (`590.29 MiB`, LFS SHA-256 `c582831b6b2f45ee5af947269fa62c517ca88eb4b7946634a0476ccb8fc972da`).
- **Total Archive Entries**: `15,619` entries (`~748 MB` unpacked).
- **Archive Internal Root Layout**:
  - `sha256sums.txt` (at `vcsky/sha256sums.txt`)
  - `fetched/` containing `fetched/anim/**`, `fetched/audio/**`, and `fetched/models/**` (`models/gta3.img/**`, etc.).
- **Mixed-Case Entries in Raw Archive**: Exactly `599` entries inside `vcsky.zip` contain uppercase characters (e.g., `fetched/audio/AirHornL.wav`, `fetched/audio/BAR_1.wav`, `fetched/audio/BeachAmb.mp3`, `fetched/audio/BikeRev.wav`, `fetched/audio/BK4_35a.wav`, `fetched/audio/WATER.MP3`).

### 2.2 Download, Extraction & Cleanup Commands
```bash
mkdir -p revcdos/vcsky
curl -L --fail --retry 3 -o revcdos/vcsky.zip \
  "https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcsky.zip"
unzip -q -o revcdos/vcsky.zip -d revcdos/vcsky
rm -f revcdos/vcsky.zip
```
Additionally, ensure all 9 canonical lowercase asset subdirectories listed in Specification 043 Section 5.1 item 5 exist under `revcdos/vcsky/fetched/`:
- `anim/`, `audio/`, `data/`, `models/`, `mp3/`, `mss/`, `skins/`, `text/`, `txd/`
(`anim/`, `audio/`, and `models/` are populated directly from `vcsky.zip`; creating `data/`, `mp3/`, `mss/`, `skins/`, `text/`, `txd/` via `os.makedirs(..., exist_ok=True)` ensures full directory hierarchy completeness alongside the preloaded `vc-sky-en-v6.data` filesystem).

### 2.3 macOS APFS Two-Step Recursive Lowercase Normalization Algorithm
Because macOS uses case-insensitive APFS by default (`FOO.MP3` and `foo.mp3` resolve to the same inode), calling `os.rename("revcdos/vcsky/fetched/audio/AirHornL.wav", "revcdos/vcsky/fetched/audio/airhornl.wav")` directly can silently no-op in directory table listings unless bounced through an intermediate filename with a distinct character sequence.

The `implement` stage must execute a bottom-up (`os.walk("revcdos/vcsky", topdown=False)`) Python normalization routine that:
1. Iterates over `files` in `root`:
   - Computes `lower_name = name.lower()`.
   - If `name != lower_name`:
     - Computes `old_path = os.path.join(root, name)`, `tmp_path = os.path.join(root, f"{lower_name}.__tmp_case__")`, and `new_path = os.path.join(root, lower_name)`.
     - Performs two-step rename: `os.replace(old_path, tmp_path)` followed by `os.replace(tmp_path, new_path)`.
2. Iterates over `dirs` in `root`:
   - Computes `lower_name = name.lower()`.
   - If `name != lower_name`:
     - Computes `old_path = os.path.join(root, name)`, `tmp_path = os.path.join(root, f"{lower_name}.__tmp_case__")`, and `new_path = os.path.join(root, lower_name)`.
     - Performs two-step rename: `os.replace(old_path, tmp_path)` followed by `os.replace(tmp_path, new_path)`.
3. Verifies after execution that `find revcdos/vcsky -name '*[A-Z]*'` returns completely empty output (`0` uppercase paths).

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `.gitignore` (ensuring `revcdos/vcsky/` and `*.zip` are ignored by Git)
- (Local disk runtime asset tree, Git-ignored): `revcdos/vcsky/fetched/**` and `revcdos/vcsky/sha256sums.txt`

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_043.md`
- `assets/20261024T194153-999-2zne/plan-hf-Dockerfile.txt`
- `assets/20261024T194153-999-2zne/plan-hf-fix_cases.py.txt`
- `assets/20261024T194153-999-2zne/plan-vcsky-zip-header-probe.txt`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `revcdos/vcsky/fetched/` exists and contains `anim/`, `audio/`, `data/`, `models/`, `mp3/`, `mss/`, `skins/`, `text/`, `txd/`.
- Verify `find revcdos/vcsky -name '*[A-Z]*'` outputs zero lines.
- Verify temporary `vcsky.zip` has been removed and `git status --porcelain` shows zero untracked files under `revcdos/vcsky/`.
