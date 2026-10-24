# Ticket 001: Upstream Binary Acquisition, Multi-Part `.data` Chunking (`<= 35 MB`), `pack.json` Schema & `.gitignore` Hygiene

- **Ticket ID**: `ticket-001`
- **Title**: Upstream Binary Acquisition, Multi-Part `.data` Chunking (`<= 35 MB`), `pack.json` Schema & `.gitignore` Hygiene
- **Stage**: `implement` (independent test suite authoring and execution reserved for `tester` under `INV-NO-SELF-TEST-01`)
- **Status**: `RESOLVED`
- **Claimed by**: `wayfinder-read-and-plan`
- **Blocked By**: `None`
- **Blocks**: `ticket-002`, `ticket-003`, `ticket-004`, `ticket-006`

## 1. Decision Question

How should the `implement` stage acquire the pre-decompressed `reVCDOS` WebAssembly engine (`vcbr/vc-sky-en-v6.wasm`) and startup preload filesystem (`vcbr/vc-sky-en-v6.data`), split `vc-sky-en-v6.data` (`135,355,111 B`) into deterministic Git-trackable multi-part chunks (`<= 35 MB` each), define the `/revcdos/pack.json` manifest, and enforce `.gitignore` rules so zero tracked files exceed GitHub's single-file limit?

## 2. Authoritative Architectural Decision

### 2.1 Candidate Datasource Selection & Verified Endpoint Parameters
- **Dead Upstream Endpoints Eliminated**:
  1. `https://cdn.dos.zone/vcsky/` and `https://br.cdn.dos.zone/vcsky/` (`HTTP 403 Forbidden / AccessDenied` from S3 bucket `68bbc47d0de7-br-bundles`).
  2. `https://folder.morgen.qzz.io/revcdos.bin` (`HTTP 525 Cloudflare SSL Handshake Failed`).
- **Authoritative Pre-Decompressed Binary Source (`HTTP 200 OK`)**:
  - Repository: `https://huggingface.co/spaces/th3w33knd/reVCDOS`
  - Tree API Metadata: captured in `assets/20261024T194153-999-2zne/plan-hf-th3w33knd-revcdos-vcbr.json`.
  - **WASM Engine Binary (`revcdos/vcbr/vc-sky-en-v6.wasm`)**:
    - URL: `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcbr/vc-sky-en-v6.wasm`
    - Exact Size: `7,625,877` bytes (`7.27 MiB`)
    - LFS SHA-256: `db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2`
    - Git Tracking Policy: Tracked directly in Git (`< 45 MB`).
  - **Startup Preload Filesystem (`revcdos/vcbr/vc-sky-en-v6.data`)**:
    - URL: `https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcbr/vc-sky-en-v6.data`
    - Exact Size: `135,355,111` bytes (`129.08 MiB`, matching `remote_package_size: 135355111` in `revcdos/modules/packages/en.js`)
    - LFS SHA-256: `3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6`
    - Git Tracking Policy: Kept on local disk at `revcdos/vcbr/vc-sky-en-v6.data` for fast direct HTTP serving, **excluded from Git via `.gitignore`**, and split into 4 deterministic tracked chunks under `revcdos/parts/`.

### 2.2 Deterministic Acquisition & 4-Part Chunk Splitting Commands
The `implement` stage must execute:
```bash
mkdir -p revcdos/vcbr revcdos/parts
curl -L --fail --retry 3 -o revcdos/vcbr/vc-sky-en-v6.wasm \
  "https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcbr/vc-sky-en-v6.wasm"
curl -L --fail --retry 3 -o revcdos/vcbr/vc-sky-en-v6.data \
  "https://huggingface.co/spaces/th3w33knd/reVCDOS/resolve/main/vcbr/vc-sky-en-v6.data"
```
Verify exact byte lengths (`7625877` and `135355111`) and SHA-256 digests (`db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2` and `3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6`).

Split `revcdos/vcbr/vc-sky-en-v6.data` (`135,355,111` bytes) deterministically into 4 chunks using ceiling division (`chunk_size = math.ceil(135355111 / 4) = 33838778` bytes = `33.84 MB` / `32.27 MiB`, strictly `<= 35 MB`):
- `revcdos/parts/vc-sky-en-v6.data.part00`: bytes `0 .. 33838777` (`33,838,778` bytes)
- `revcdos/parts/vc-sky-en-v6.data.part01`: bytes `33838778 .. 67677555` (`33,838,778` bytes)
- `revcdos/parts/vc-sky-en-v6.data.part02`: bytes `67677556 .. 101516333` (`33,838,778` bytes)
- `revcdos/parts/vc-sky-en-v6.data.part03`: bytes `101516334 .. 135355110` (`33,838,777` bytes)
- Sum of parts: `33838778 * 3 + 33838777 == 135355111` bytes.

### 2.3 Target Schema for `revcdos/pack.json`
Generate `revcdos/pack.json` containing the computed SHA-256 hashes and byte sizes of the engine and startup `.data` chunks (following the `nzportable/pack.json` contract):
```json
{
  "version": 1,
  "cacheName": "revcdos-pack-v1",
  "engine": {
    "js": "./index.js",
    "wasm": "./vcbr/vc-sky-en-v6.wasm",
    "size": 7625877,
    "sha256": "db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2"
  },
  "data": {
    "path": "vcbr/vc-sky-en-v6.data",
    "url": "./vcbr/vc-sky-en-v6.data",
    "size": 135355111,
    "sha256": "3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6",
    "parts": [
      "./parts/vc-sky-en-v6.data.part00",
      "./parts/vc-sky-en-v6.data.part01",
      "./parts/vc-sky-en-v6.data.part02",
      "./parts/vc-sky-en-v6.data.part03"
    ],
    "partSizes": [
      33838778,
      33838778,
      33838778,
      33838777
    ],
    "partSha256": [
      "<computed-sha256-part00>",
      "<computed-sha256-part01>",
      "<computed-sha256-part02>",
      "<computed-sha256-part03>"
    ]
  },
  "files": {
    "vcbr/vc-sky-en-v6.data": {
      "path": "vcbr/vc-sky-en-v6.data",
      "url": "./vcbr/vc-sky-en-v6.data",
      "size": 135355111,
      "sha256": "3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6",
      "parts": [
        "./parts/vc-sky-en-v6.data.part00",
        "./parts/vc-sky-en-v6.data.part01",
        "./parts/vc-sky-en-v6.data.part02",
        "./parts/vc-sky-en-v6.data.part03"
      ],
      "partSizes": [
        33838778,
        33838778,
        33838778,
        33838777
      ],
      "partSha256": [
        "<computed-sha256-part00>",
        "<computed-sha256-part01>",
        "<computed-sha256-part02>",
        "<computed-sha256-part03>"
      ]
    },
    "vcbr/vc-sky-en-v6.wasm": {
      "path": "vcbr/vc-sky-en-v6.wasm",
      "url": "./vcbr/vc-sky-en-v6.wasm",
      "size": 7625877,
      "sha256": "db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2"
    }
  }
}
```
Including both top-level `"data"` and `"files": { "vcbr/vc-sky-en-v6.data": ..., "vcbr/vc-sky-en-v6.wasm": ... }` ensures compatibility with both `nzportable/pack.json`-style consumers and direct `pack.data` / `pack.files` lookups.

### 2.4 `.gitignore` Rules (Lines 50–55 of `.gitignore`)
Append the following rules to `.gitignore` immediately after `nzportable/nzp/game.pk3`:
```gitignore
revcdos/vcbr/vc-sky-en-v6.data
revcdos/vcbr/vc-sky-ru-v6.data
revcdos/vcsky/
*.zip
```

## Mandatory Target Deliverables (MANDATORY_TARGET)
- `.gitignore`
- `revcdos/pack.json`
- `revcdos/vcbr/vc-sky-en-v6.wasm`
- `revcdos/parts/vc-sky-en-v6.data.part00`
- `revcdos/parts/vc-sky-en-v6.data.part01`
- `revcdos/parts/vc-sky-en-v6.data.part02`
- `revcdos/parts/vc-sky-en-v6.data.part03`
- (Local disk runtime artifact, Git-ignored): `revcdos/vcbr/vc-sky-en-v6.data` (`135,355,111 B`)

## Read-Only Discovery Context (READ_ONLY_CONTEXT)
- `functional_specification_043.md`
- `nzportable/pack.json`
- `assets/20261024T194153-999-2zne/plan-hf-th3w33knd-revcdos-tree.json`
- `assets/20261024T194153-999-2zne/plan-hf-th3w33knd-revcdos-vcbr.json`
- `assets/20261024T194153-999-2zne/plan-hf-dist-modules-packages-en-tail.js.txt`

## Verification Criteria for `tester` (`INV-NO-SELF-TEST-01`)
- Verify `revcdos/vcbr/vc-sky-en-v6.wasm` exists with exact size `7,625,877` B and SHA-256 `db6aa7b9169a638e06b17f7bed5a6b3e473e00ae7bbb47354729fa94b971ebf2`.
- Verify `revcdos/vcbr/vc-sky-en-v6.data` exists on disk with exact size `135,355,111` B and SHA-256 `3da895fd1a0c8e8968d0937da45becc35efc697f13a26a0d0463bd6a22acfff6`.
- Verify `revcdos/parts/vc-sky-en-v6.data.part00..03` exist, each `<= 35,000,000` B, and their concatenation equals `revcdos/vcbr/vc-sky-en-v6.data` byte-for-byte.
- Verify `git check-ignore revcdos/vcbr/vc-sky-en-v6.data revcdos/vcsky/ vcsky.zip` succeeds and zero tracked files in Git exceed `45 MB`.
