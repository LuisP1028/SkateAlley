# Ticket 001: Upstream NZ:P Asset Acquisition, Deterministic <= 35 MB Multi-Part Chunking (`parts/game.pk3.part00..02`), `/nzportable/pack.json` Manifest Generation, and `.gitignore` Hygiene

- **Ticket ID**: `ticket-001`
- **Target Stage**: `implement` (independent test authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: Resolved / Decided
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: None
- **Blocks**: `ticket-002`, `ticket-003`, `ticket-004`

---

## 1. Decision Question

How should the `implement` stage acquire the authoritative upstream Nazi Zombies: Portable (`nzportable`) WebGL/WebAssembly runtime binaries and game archives, split the `94,276,834`-byte `nzp/game.pk3` archive into deterministic $\le 35\text{ MB}$ chunks for GitHub Static Pages compatibility, schema-lock `/nzportable/pack.json`, and configure `.gitignore` so that zero tracked files exceed Git's single-file size ceiling?

---

## 2. Empirical Ground-Truth Findings (`nzp-team/nzportable` & `nzp-team/nzp-team.github.io`)

Inspection of `https://github.com/nzp-team/nzportable` (`README.md`, `generate-nightly.sh`) and `https://github.com/nzp-team/nzp-team.github.io` (`index.html`, `default.fmf`, `ftewebgl.js`, `ftewebgl.wasm`, `nzp/progs.pk3`, `nzp/game.pk3`) established the exact byte sizes and SHA-256 digests of the five runtime artifacts:

| Relative Path in `/nzportable/` | Exact Byte Size | Size (`MiB`) | Verified SHA-256 Digest | Upstream Raw URL (`HTTP 200 OK`) | Git Tracking Policy |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `nzportable/default.fmf` | `96` | `< 0.01` | `d3e89c92ff2b43b83e4a461a79b7986e3fd7ca3126ec1842588a688c539b3979` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/default.fmf` | Tracked in Git |
| `nzportable/ftewebgl.js` | `165,608` | `0.16` | `7ae5352b39e21c5dc83dd2c27d0f49f842ce89462402400775ccb055a2d9da46` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.js` | Tracked in Git |
| `nzportable/ftewebgl.wasm` | `5,178,106` | `4.94` | `523141c46f2898fe1f4bb175eca6035ff8aed981e8f770993f98d15d7a2199e2` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.wasm` | Tracked in Git (`< 35 MB`) |
| `nzportable/nzp/progs.pk3` | `491,379` | `0.47` | `47bc82fa1335f5748ac08372c2daf24c57f29e56f046ad0fa125eec90c9bf832` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/progs.pk3` | Tracked in Git (`< 35 MB`) |
| `nzportable/nzp/game.pk3` | `94,276,834` | `89.91` | `847a6fb7c95b26eab0fdbfa31223a225608a5f9f7af4f88af1e04a1c0a14637d` | `https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/game.pk3` | Kept on disk for single-stream local/LAN serving; **excluded from Git via `.gitignore`** |

---

## 3. Locked Architectural Decisions for `implement`

### 3.1 Asset Acquisition & Byte-Parity Verification
1. Create directories `nzportable/`, `nzportable/nzp/`, and `nzportable/parts/`.
2. Copy or download the five upstream files into `nzportable/`:
   - `nzportable/default.fmf` (`96` bytes) — may be copied directly from `assets/20261024T185706-137-m9j7/plan-default.fmf` or downloaded via `curl -L --fail --retry 3 https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/default.fmf -o nzportable/default.fmf`.
   - `nzportable/ftewebgl.js` (`165,608` bytes) — may be copied directly from `assets/20261024T185706-137-m9j7/plan-ftewebgl.js` or downloaded via `curl -L --fail --retry 3 https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.js -o nzportable/ftewebgl.js`.
   - `nzportable/nzp/progs.pk3` (`491,379` bytes) — may be copied directly from `assets/20261024T185706-137-m9j7/plan-progs.pk3` or downloaded via `curl -L --fail --retry 3 https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/progs.pk3 -o nzportable/nzp/progs.pk3`.
   - `nzportable/ftewebgl.wasm` (`5,178,106` bytes) — copy from `assets/20261024T185706-137-m9j7/plan-scan-2-ftewebgl.wasm` if present or download via `curl -L --fail --retry 3 https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/ftewebgl.wasm -o nzportable/ftewebgl.wasm`.
   - `nzportable/nzp/game.pk3` (`94,276,834` bytes) — download via `curl -L --fail --retry 3 https://raw.githubusercontent.com/nzp-team/nzp-team.github.io/main/nzp/game.pk3 -o nzportable/nzp/game.pk3`.
3. Verify exact byte counts and SHA-256 digests against the table in Section 2 before proceeding. Fail fast if any byte count or SHA-256 digest mismatches.

### 3.2 Deterministic 3-Part Chunking of `nzportable/nzp/game.pk3`
1. Using `python3`, split `nzportable/nzp/game.pk3` (`94,276,834` bytes) into 3 deterministic chunks of $\le 35\text{ MB}$ (`31,457,280` bytes = `30 MiB` for parts `00` and `01`, and `31,362,274` bytes for part `02`):
   - `nzportable/parts/game.pk3.part00`: bytes `[0 : 31457280]` (`31,457,280` bytes)
   - `nzportable/parts/game.pk3.part01`: bytes `[31457280 : 62914560]` (`31,457,280` bytes)
   - `nzportable/parts/game.pk3.part02`: bytes `[62914560 : 94276834]` (`31,362,274` bytes)
2. Verify that `len(part00) + len(part01) + len(part02) == 94276834` and that the SHA-256 of `part00 + part01 + part02` equals `847a6fb7c95b26eab0fdbfa31223a225608a5f9f7af4f88af1e04a1c0a14637d`.

### 3.3 Authoritative `/nzportable/pack.json` Schema
Write `nzportable/pack.json` with the following exact structure (populating the computed 16-hex-char SHA-256 prefix and full 64-hex-char SHA-256 digest for each file and part):
```json
{
  "version": 1,
  "cacheName": "nzportable-pack-v1",
  "engine": {
    "js": "./ftewebgl.js",
    "jsSize": 165608,
    "jsSha256": "7ae5352b39e21c5dc83dd2c27d0f49f842ce89462402400775ccb055a2d9da46",
    "wasm": "./ftewebgl.wasm",
    "size": 5178106,
    "hash": "523141c46f2898fe",
    "sha256": "523141c46f2898fe1f4bb175eca6035ff8aed981e8f770993f98d15d7a2199e2"
  },
  "files": {
    "default.fmf": {
      "path": "default.fmf",
      "url": "./default.fmf",
      "size": 96,
      "hash": "d3e89c92ff2b43b8",
      "sha256": "d3e89c92ff2b43b83e4a461a79b7986e3fd7ca3126ec1842588a688c539b3979"
    },
    "nzp/progs.pk3": {
      "path": "nzp/progs.pk3",
      "url": "./nzp/progs.pk3",
      "size": 491379,
      "hash": "47bc82fa1335f574",
      "sha256": "47bc82fa1335f5748ac08372c2daf24c57f29e56f046ad0fa125eec90c9bf832"
    },
    "nzp/game.pk3": {
      "path": "nzp/game.pk3",
      "url": "./nzp/game.pk3",
      "size": 94276834,
      "hash": "847a6fb7c95b26ea",
      "sha256": "847a6fb7c95b26eab0fdbfa31223a225608a5f9f7af4f88af1e04a1c0a14637d",
      "parts": [
        "./parts/game.pk3.part00",
        "./parts/game.pk3.part01",
        "./parts/game.pk3.part02"
      ],
      "partSizes": [
        31457280,
        31457280,
        31362274
      ]
    }
  }
}
```

### 3.4 `.gitignore` Hygiene (`MANDATORY_TARGET`)
Update `.gitignore` (around line 49, below `skate3_cleanroom/LUIS_HOLO_RIGGED.glb`) to add:
```gitignore
nzportable/nzp/game.pk3
```
Verify that `nzportable/nzp/game.pk3` stays on disk for local and Server Mac (`egg@10.0.0.62`) single-stream serving while `git status` ignores `nzportable/nzp/game.pk3` and tracks `nzportable/parts/game.pk3.part00..02`, `nzportable/nzp/progs.pk3`, `nzportable/ftewebgl.wasm`, `nzportable/ftewebgl.js`, `nzportable/default.fmf`, and `nzportable/pack.json`.

---

## 4. Deliverable Register (`INV-DELIVERABLE-SPLIT-01`)

### Mandatory Target Deliverables (`MANDATORY_TARGET`)
- `.gitignore`
- `nzportable/default.fmf`
- `nzportable/ftewebgl.js`
- `nzportable/ftewebgl.wasm`
- `nzportable/nzp/progs.pk3`
- `nzportable/parts/game.pk3.part00`
- `nzportable/parts/game.pk3.part01`
- `nzportable/parts/game.pk3.part02`
- `nzportable/pack.json`
- *(Note: `nzportable/nzp/game.pk3` MUST be created on disk with `94,276,834` bytes, and ignored by Git via `.gitignore`.)*

### Read-Only Discovery Context (`READ_ONLY_CONTEXT`)
- `skate3_cleanroom/pack.json`
- `assets/20261024T185706-137-m9j7/plan-default.fmf`
- `assets/20261024T185706-137-m9j7/plan-ftewebgl.js`
- `assets/20261024T185706-137-m9j7/plan-progs.pk3`
- `assets/20261024T185706-137-m9j7/plan-nzportable-README.md`
- `assets/20261024T185706-137-m9j7/plan-nzportable-generate-nightly.sh`
