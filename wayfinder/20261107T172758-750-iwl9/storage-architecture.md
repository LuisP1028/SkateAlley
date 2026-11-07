# Storage Engine, Data Persistence & ACID Consistency Architecture (`storage-architecture.md`)

- **Run ID:** `20261107T172758-750-iwl9`
- **Agent Node:** `storage-planner`
- **Branch:** `agent/storage-planner-20261107T172758-750-iwl9`
- **Authoritative Seed Specification:** [`functional_specification_068.md`](functional_specification_068.md) (Core Pillars §1–§8 & System Addendum Pillars §9–§15)
- **Authoritative Domain Vocabulary:** [`LANGUAGE.md`](LANGUAGE.md) (`{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`)
- **Peer References & Inputs:**
  - `codebase-mapper`: [`wayfinder/20261107T172758-750-iwl9/codebase-map.md`](codebase-map.md)
  - `api-schema-mapper`: [`wayfinder/20261107T172758-750-iwl9/api-schemas.md`](api-schemas.md)
  - `mcp-provisioner`: [`wayfinder/20261107T172758-750-iwl9/mcp-tools.md`](mcp-tools.md)
  - `library-installer`: [`wayfinder/20261107T172758-750-iwl9/installed-libraries.md`](installed-libraries.md)
  - `function-mapper`: [`wayfinder/20261107T172758-750-iwl9/library-functions.md`](library-functions.md)

---

## 1. Executive Summary & Storage Directives

This document establishes the persistence layer architecture, storage engine physics, concurrency control protocols, transaction boundaries, and binary wire formats for **Functional Specification 068** and its **System Addendum** across the Freeman Alley 3D interactive portfolio (`SkateAlley`).

### 1.1 Strict Pre-Implementation Gate
> [!IMPORTANT]
> **DO NOT CODE APPLICATION DIFFS YET.** In strict alignment with `RULE[user_global]`, this document specifies data layouts, binary offsets, database schemas, indexing physics, and consistency trade-offs to eliminate ambiguity before downstream implementation begins.

### 1.2 Five Core Storage & Persistence Architectural Pillars
1. **Pillar 1: Skate 3 Binary `.part` Wire Format & `pack.json` Invariant Integrity:**
   Architect the exact 37-byte pack entry header, glTF 2.0 binary layout, Torus / visualizer node eradication, skateboard primitive splicing, and the mathematical formula for `pack.json` character/core byte size and SHA-256 hash recalculation based on the fixed `90,631,134` bytes surrounding part sum.
2. **Pillar 2: GTA Vice City RenderWare Override Asset Persistence & Emscripten `Module.FS`:**
   Architect the local storage and virtual filesystem mounting of `player.dff` (`292,864 B` / `143` sectors), `player.txd` (`45,056 B` / `22` sectors), and `player.bmp` (`66,612 B`), specifying exact in-memory paths in `Module.FS`, 32-byte directory entry mutation in `/vc-assets/local/models/gta3.dir`, and deterministic startup telemetry synchronization (`window.__REVCDOS_STATUS__.luisPlayerMounted = true`).
3. **Pillar 3: Git Sparse-Checkout & Worktree File Materialization Engine:**
   Architect automated, atomic worktree asset materialization in [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) to resolve sparse-checkout exclusions (`!/revcdos/`, `!/character_hoodie.glb`) using zero-copy symlinks/link trees, eliminating HTTP 404s without redundant `~150 MB` disk churn.
4. **Pillar 4: PostgreSQL `alpha` Persistence, Indexing & Concurrency Control:**
   Architect the relational data layer for `skatealley_scene_layouts` and `skatealley_placed_stickers`, specifying B+Tree indexing, Read Committed isolation, Optimistic Concurrency Control (OCC) version fencing, and connection pool failover across candidate DSNs.
5. **Pillar 5: HTTP 206 Partial Content Byte-Range Streaming Engine:**
   Architect the byte-range streaming engine in [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) per RFC 9110, specifying range parsing, 416 bounds checking, 64 KB streaming buffers, and CORS exposure headers for large binary streaming.

---

## 2. Authoritative Domain Vocabulary Alignment ([`LANGUAGE.md`](LANGUAGE.md))

| Parameter | Operational Definition & Qualification in Storage Planning |
| :--- | :--- |
| **`{functionality}`** | The end-to-end data persistence, asset delivery, and state synchronization capabilities enabling reliable loading of 3D models (`character_hoodie.glb`), cleanroom game packages (`skate3_cleanroom/pack.json`), RenderWare player models, scene layouts, and stickers across network, memory, and database boundaries under production conditions. |
| **`{correctness}`** | Absolute byte-for-byte fidelity across binary wire formats (e.g. 37-byte `.part` header, 32-byte `gta3.dir` records), exact checksum verification (`sha256[:16]`), deterministic schema migrations, mathematical consistency in range requests (`bytes start-end/total`), and zero data-loss state transitions. |
| **`{errors}`** | Corrupted `.part` downloads, stale `pack.json` byte totals, missing worktree symlinks causing HTTP 404s, dirty reads, lost updates during concurrent layout edits, uncaught `BrokenPipeError` during byte streaming, or silent fallback to unverified defaults (`RULE[user_global]`). |
| **`{correct required outputs}`** | 1. Persistent storage architecture plan [`wayfinder/20261107T172758-750-iwl9/storage-architecture.md`](wayfinder/20261107T172758-750-iwl9/storage-architecture.md).<br/>2. Exact mathematical formulas for `pack.json` recalculation (`90,631,134 B + payload`).<br/>3. SQL DDL schemas and B+Tree indexing specifications.<br/>4. Handoff descriptor [`handoff/20261107T172758-750-iwl9/storage-planner.txt`](handoff/20261107T172758-750-iwl9/storage-planner.txt). |
| **`{sufficient}`** | Complete, unambiguous specifications for all file offsets, byte lengths, data structures, isolation levels, concurrency mechanisms, and error handling so implementers can build the persistence layer without guessing. |
| **`{insufficient}`** | Omitting binary byte offsets, vague statements like "cache the files", unmodeled multi-threaded race conditions, or unverified assumptions about database transaction semantics. |

---

## 3. Storage Engine Physics & Access Patterns

### 3.1 Tiered Data Plane Analysis & Storage Hierarchy

The SkateAlley application operates across five distinct storage and persistence tiers, each with sharply different latency, throughput, durability, and concurrency profiles:

```mermaid
flowchart TD
    subgraph Tier0 ["Tier 0: GPU VRAM (Volatile)"]
        VRAM["WebGL Textures (1024x627, 1024x348)<br/>Geometry Buffers (VAO, VBO, IBO)"]
    end

    subgraph Tier1 ["Tier 1: Browser In-Memory (Volatile)"]
        MEMFS["Emscripten Module.FS (MEMFS)<br/>• /vc-assets/local/models/gta3.img/ (DFF/TXD)<br/>• /vc-assets/local/models/gta3.dir (Index)"]
        JSHEAP["JavaScript Heap<br/>• HOLO_TAG_DESCRIPTIONS (28 items)<br/>• HOLO_PROJECT_STATIONS (7 items)<br/>• 2D Canvas Contexts"]
    end

    subgraph Tier2 ["Tier 2: Browser Persistent Storage (Local Client)"]
        CACHESTORAGE["Cache Storage API<br/>Key: Content Hash from pack.json<br/>Value: Binary .part Streams"]
        IDBFS["IndexedDB (IDBFS)<br/>/vc-assets/local/saves/"]
        LOCALSTORAGE["Window.localStorage<br/>vcsky.key, vcsky.revc.ini, vcsky.haveOriginalGame"]
    end

    subgraph Tier3 ["Tier 3: Network Transport Layer (HTTP / Streaming)"]
        HTTP206["HTTP 206 Partial Content<br/>Range: bytes=start-end<br/>Chunk Size: 64 KB"]
    end

    subgraph Tier4 ["Tier 4: Server Filesystem & OS Page Cache (POSIX)"]
        WORKTREE["Sandcastle Git Worktree (Sparse)<br/>• Local symlinks: revcdos/ -> Main Repo<br/>• Local symlinks: character_hoodie.glb<br/>• Raw .part & .glb Assets on Disk"]
    end

    subgraph Tier5 ["Tier 5: Relational Persistence Engine (PostgreSQL Alpha)"]
        PGDB[("PostgreSQL 16 (Port 5432)<br/>• skatealley_scene_layouts (B+Tree on PK)<br/>• skatealley_placed_stickers (Composite B+Tree)<br/>• Write-Ahead Log (WAL) & MVCC Heap")]
    end

    VRAM <--> Tier1
    Tier1 <--> Tier2
    Tier2 <--> HTTP206
    HTTP206 <--> WORKTREE
    WORKTREE <--> PGDB
```

### 3.2 Read/Write Access Patterns & Data Structure Selection

| Storage Subsystem | Access Pattern | Read / Write Ratio | Primary Data Structure | Architectural Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Scene Layouts (`skatealley_scene_layouts`)** | Point read on scene load; infrequent bulk update on layout edit. | `99.9% Read` / `0.1% Write` | **B+Tree on `layout_key` (PK)** | Low write volume makes B+Trees vastly superior to LSM-Trees. B+Tree yields $O(\log N)$ point lookups with zero background compaction debt or read amplification. |
| **Sticker Store (`skatealley_placed_stickers`)** | Range scan ordered by timestamp (`created_at_ms ASC`); point appends. | `95% Read` / `5% Write` | **Composite B+Tree on `(created_at_ms ASC, placed_id ASC)`** | Range query `SELECT ... ORDER BY created_at_ms ASC` is satisfied directly by index scan without heap sort, avoiding memory allocation during 60 FPS gameplay. |
| **Emscripten `Module.FS`** | Sequential read on GTA game boot; zero random writes after initialization. | `100% Read` (Post-mount) | **In-Memory Trie / Node Hash Map (`MEMFS`)** | In-memory inodes mapping file paths to contiguous `Uint8Array` buffers eliminate disk seeks during asset streaming into WebAssembly runtime. |
| **Cleanroom `.part` Archives** | Heavy sequential read with byte-range slicing on initial boot; write-once at asset build time. | `100% Read` (Runtime) | **Contiguous Binary Array Buffer (`.part`)** | Pre-allocated `Uint8Array(total_pack_size)` with fixed offsets eliminates dynamic resizing overhead and GC churn. |
| **Sparse Worktree Materialization** | Checked once at server boot or file request; read on HTTP GET. | `99.99% Read` | **POSIX Directory Symlink Tree** | `os.symlink` creates an $O(1)$ filesystem pointer, eliminating `150 MB` file duplication while preserving live repository updates. |

### 3.3 Read, Write & Space Amplification Matrix

$$\text{Amplification Factors: } A_R = \frac{\text{Bytes Read from Disk}}{\text{Bytes Requested by App}},\quad A_W = \frac{\text{Bytes Written to Disk}}{\text{Bytes Emitted by App}},\quad A_S = \frac{\text{Disk Space Occupied}}{\text{Logical Data Size}}$$

| Storage Component | $A_R$ (Read Amplification) | $A_W$ (Write Amplification) | $A_S$ (Space Amplification) | Physical Constraints & Trade-Offs |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Scene Layouts** | $1.00$ (Point lookup via PK index) | $\approx 2.50$ (WAL record + 8 KB heap page write + index leaf update) | $\approx 1.15$ (Header overhead + page fill-factor padding) | Write amplification is negligible due to tiny write frequency (admin save operations only). |
| **PostgreSQL Placed Stickers** | $1.00$ (Index-only or sequential range scan) | $\approx 3.00$ (WAL + heap + PK index + timestamp index) | $\approx 1.25$ (Two B+Tree indexes on table) | Index overhead is justified to guarantee $O(1)$ query time for sticker sync APIs. |
| **Cleanroom `.part` Streaming** | $1.00$ (Exact HTTP 206 byte slice requested) | $1.00$ (Sequential write at build time) | $1.00$ (Zero metadata bloat beyond 37-byte header) | Maximizes network streaming efficiency over cellular and low-bandwidth connections. |
| **Worktree Symlink Layer** | $1.00$ (VFS path traversal via kernel inode cache) | $0.00$ (Zero file data written; pointer only) | $\approx 0.00$ (40 bytes per symlink inode vs 150 MB file payload) | Saves 150 MB disk space per worktree; eliminates cache desynchronization. |

---

## 4. Concurrency Control Protocols & Contention Modeling

### 4.1 Client-Side Browser Concurrency (Single-Threaded Event Loop)
- **Run-to-Completion Guarantee:** The browser JavaScript runtime executes on a single event-loop thread. DOM modifications (`#holo-popup-window`), tag state transitions (`setActiveHoloTagPopup`), and custom scrollbar calculations (`syncHoloCustomScrollbar`) are non-preemptible, guaranteeing that intermediate DOM states are never observed by concurrent scripts.
- **Asynchronous Asset Fetch Memoization:**
  - Multiple simultaneous calls to `fetchLuisPlayerOverrideAssets()` or `fetchParts()` could trigger duplicate multi-megabyte network transfers.
  - **Protocol:** Implement Promise memoization. Maintain module-scoped in-flight promises (`activeFetchPromise`). Subsequent callers await the existing promise rather than initiating redundant HTTP roundtrips.

### 4.2 Server-Side Concurrency & Thread Synchronization (`scripts/serve_skatealley.py`)
- **Python Multi-Threaded HTTP Server (`ThreadingHTTPServer`):** Each incoming HTTP request is handled in a separate OS thread spawned by `socketserver.ThreadingMixIn`.
- **Database Connection Serialization:**
  - `_STICKER_DB_LOCK = threading.Lock()` serializes PostgreSQL connection pool acquisition and DDL schema validation.
  - While PostgreSQL supports concurrent connections, local dev environments share a pooled connection instance. Critical sections must be strictly bounded:
    ```python
    # Bounded critical section pattern
    with _STICKER_DB_LOCK:
        with open_postgres_connection() as conn:
            ensure_scene_layout_schema(conn)
            # Perform query immediately and release lock
            rows = conn.execute_params(sql, params)
    ```
- **Filesystem TOCTOU (Time-of-Check to Time-of-Use) Race Prevention:**
  - When two threads or processes simultaneously call `ensure_revcdos_data` or `ensure_worktree_revcdos_files`, checking `os.path.exists()` before creation can cause race conditions.
  - **Protocol:** Use atomic filesystem operations. Create temporary targets (`f"{target}.tmp.{os.getpid()}_{secrets.token_hex(4)}"`) and commit via atomic POSIX `os.replace()`, catching `FileExistsError` / `OSError`.

### 4.3 Optimistic Concurrency Control (OCC) for Scene Layout Mutations
- **Contention Model:** Multiple users or automated test harnesses may adjust camera layouts, math pods, or holographic column placements concurrently.
- **Protocol:** Implement Optimistic Concurrency Control via monotonic version fencing (`updated_at_ms`).
  1. **Read Phase:** Client reads layout: returns `{ "layout_key": "character_camera", "payload": { ... }, "updatedAtMs": 1731000000000 }`.
  2. **Mutation Phase:** Client submits update including the read `updatedAtMs` as a concurrency token.
  3. **Conditional Commit:**
     ```sql
     UPDATE skatealley_scene_layouts
     SET payload_json = $1,
         updated_at_ms = $2
     WHERE layout_key = $3
       AND updated_at_ms = $4;
     ```
  4. **Conflict Resolution:** If `rows_affected == 0`, a concurrent write occurred. The server rejects the mutation with `HTTP 409 Conflict` and returns the latest server state, preventing lost update anomalies.

---

## 5. Isolation Levels & Anomaly Prevention

### 5.1 ACID Guarantees in PostgreSQL Alpha Persistence

| Concurrency Anomaly | Read Uncommitted | Read Committed (Active Engine) | Repeatable Read | Serializable |
| :--- | :--- | :--- | :--- | :--- |
| **Dirty Read** | Allowed | **Prevented** (MVCC Snapshot) | Prevented | Prevented |
| **Non-Repeatable Read** | Allowed | Allowed (Acceptable for Point Lookups) | Prevented | Prevented |
| **Lost Update** | Allowed | **Prevented via OCC / `ON CONFLICT`** | Prevented via First-Committer-Wins | Prevented |
| **Phantom Read** | Allowed | Allowed (Prevented via Index Scan) | Prevented | Prevented |
| **Write Skew** | Allowed | Allowed (Not Applicable to Schema) | Allowed | Prevented |

### 5.2 Transaction Isolation & Boundary Specifications
- **Selected Level:** **`Read Committed`** with PostgreSQL Extended Query Protocol (`Parse`, `Bind`, `Describe`, `Execute`, `Sync`).
- **Justification:**
  - `Read Committed` delivers maximum throughput and eliminates serialization failures (`40001 serialization_failure`) under concurrent sticker placement.
  - MVCC guarantees that readers never block writers, and writers never block readers.
  - All single-row upserts use atomic `INSERT ... ON CONFLICT (layout_key) DO UPDATE SET ...`, which acquires a row-level exclusive lock (`FOR UPDATE`) on the conflicting primary key leaf in the B+Tree, guaranteeing atomicity without requiring full table locks.
- **Connection Pool Failover Matrix (`scripts/serve_skatealley.py`):**
  1. `postgresql://user:pass@127.0.0.1:5432/alpha` (Primary local socket / TCP loopback, verified PID 551).
  2. `postgresql://user:pass@host.docker.internal:5432/alpha` (Docker container bridged network fallback).
  3. `postgresql://user:pass@10.0.0.62:5432/alpha` (Local LAN dev server fallback).
  - Pool limits retry attempts to **exactly 2** with a `3.5s` socket timeout per `RULE[user_global]`, failing fast with actionable diagnostics if the database is unreachable.

---

## 6. Durability, Write-Ahead Logging & Crash Recovery

### 6.1 Relational Durability & WAL Mechanics
- **Write-Ahead Logging (WAL):** PostgreSQL flushes transaction log buffers to disk before modifying heap or index pages in shared buffers.
- **Crash Recovery:** Upon unexpected process termination, PostgreSQL scans WAL records from the last valid checkpoint, replaying unwritten transactions (REDO) and discarding uncommitted transactions (UNDO), guaranteeing 100% ACID consistency for `skatealley_scene_layouts` and `skatealley_placed_stickers`.
- **Fsync Policy:** Default `synchronous_commit = on` ensures that transactions are durable on physical disk upon return from `execute_params`.

### 6.2 Filesystem Atomic Durability (Temp-File + Rename Invariant)
To guarantee crash consistency across binary asset compilation, worktree linking, and `.part` archive assembly, all disk-writing routines MUST follow the **Atomic Temp-File Protocol**:
1. Write raw bytes to unique temporary file on the **same physical filesystem**: `f"{target_path}.tmp.{os.getpid()}_{uuid4().hex[:8]}"`.
2. Flush application buffers: `file.flush()`.
3. Flush OS page cache to physical platter/flash: `os.fsync(file.fileno())`.
4. Close file descriptor.
5. Atomically replace target path via POSIX rename: `os.replace(temp_path, target_path)`.
- **Failure Recovery Guarantee:** A sudden system crash or kernel panic at any millisecond results in either the complete old file or the complete new file existing on disk. Partial writes, zero-byte truncated files, and half-spliced GLBs are physically impossible.

### 6.3 Browser Storage Durability: MEMFS vs. IDBFS vs. Cache Storage
- **Volatile MEMFS (`Module.FS`):** GTA Vice City and cleanroom engines run inside WebAssembly memory. MEMFS is entirely volatile and resets on page reload. This is intentional: override assets (`player.dff`, `player.txd`) are injected programmatically on every boot, ensuring corrupt save states cannot poison the cleanroom player rig.
- **Persistent IDBFS (`/vc-assets/local/saves/`):** Game save states and mission checkpoints are synchronized to IndexedDB via Emscripten's `IDBFS` sync mechanism (`FS.syncfs(populate, callback)`), maintaining cross-session progression.
- **Cache Storage API (Skate 3 `.part` files):** Downloads of large multi-megabyte `.part` files are cached in the browser's Cache Storage API keyed by the 16-character content hash (`pack.json`). Hashes absent from `pack.json` are purged on startup, guaranteeing automatic cache eviction on new builds.

---

## 7. Deep Architectural Pillar Specifications

### 7.1 Pillar 1: Skate 3 Binary `.part` Wire Format & `pack.json` Size/Hash Integrity

#### 7.1.1 Binary Wire Format Layout
Every `.part` file in `skate3_cleanroom/parts/` consists of a **37-byte proprietary pack entry header** followed immediately by the standard glTF 2.0 binary container:

```
+---------------------------------------------------------------------------------------------------+
|                                37-BYTE PACK ENTRY HEADER                                          |
+--------------------+------------------------------------------+------------------------------------+
| Offset 0..3 (4 B)  | Offset 4..28 (25 B)                      | Offset 29..36 (8 B)                |
| uint32_le = 25     | ASCII "assets/private/skater.glb"         | uint64_le = len(glb_bytes)         |
| (0x19000000)       | (Exact case-sensitive internal PS3 path) | (Total byte length of embedded GLB)|
+--------------------+------------------------------------------+------------------------------------+
|                                glTF 2.0 BINARY CONTAINER (from offset 37 to EOF)                  |
+--------------------+------------------------------------------+------------------------------------+
| Offset 37..48 (12B)| Offset 49..49+L_json (Chunk 0)           | Offset ... to EOF (Chunk 1)        |
| Magic: "glTF"      | ChunkType: 0x4E4F534A ("JSON")           | ChunkType: 0x004E4942 ("BIN\0")    |
| Version: 2         | Scene Graph, Meshes, Nodes, Skins        | Contiguous Vertex/Index/Tex Data   |
+--------------------+------------------------------------------+------------------------------------+
```

#### 7.1.2 GLB Splicing & Torus Eradication Mechanics
The existing assets in `skate3_cleanroom/parts/` have a critical architectural gap:
- `char_luis.part` (`5,652,217 B`): Contains Luis head and body meshes, but **zero skateboard meshes** (`Retail_SkateBoard`, `Retail_SkateTruck`, `Retail_SkateWheel` were omitted during prior rigging).
- `char_luis_holo.part` (`9,641,573 B`): Contains all 5 primitives (`CharacterMesh` 0–4: Luis body/head + skateboard deck, truck, and wheels) and textures (`Skate3_Board_Tex_16..21`), but also contains unwanted node 37 (`"SkateAlley_Holo_Visualizer"`) and Mesh 1 (`"Torus"`, `3,072` vertices, `HOLOSYS_Visualizer_Holo_Material`).

**The Splicing & Repacking Algorithm (Direct Python `struct` + `json` Chunk Surgery):**
> [!CAUTION]
> **Do NOT use `trimesh.load(...).export('glb')` for this transformation.** Trimesh drops or alters glTF 2.0 skin/joint inverse bind matrices and re-indexes nodes, which breaks the Skate 3 Rust/WebGPU engine's 35-joint skeletal rig (`SKATEBOARD_ROOT`, `TRUCK_FRONT`, `TRUCK_BACK`, 4 wheel joints). Direct binary chunk manipulation MUST be used:

1. Read `skate3_cleanroom/parts/char_luis_holo.part` (`9,641,573 B`).
2. Separate the 37-byte header (`raw[:37]`) from the raw GLB bytes (`raw[37:]`).
3. Unpack 12-byte GLB container header (`magic`, `version`, `length`) and Chunk 0 header (`chunk_length`, `chunk_type` `0x4E4F534A` / `JSON`).
4. Parse Chunk 0 JSON payload:
   - In `gjson["nodes"][36]["children"]`, remove node index 37 (`"SkateAlley_Holo_Visualizer"`).
   - Unlink node index 37 (`"SkateAlley_Holo_Visualizer"`), remove Mesh index 1 (`"Torus"`), and unreference material index 5 (`"HOLOSYS_Visualizer_Holo_Material"`).
   - Ensure `gjson["nodes"][35]["name"] = "LUIS"` and `gjson["meshes"][0]["name"] = "LUIS"`.
   - Preserve Mesh 0 with all 5 primitives:
     - Primitive 0: `LUIS_Body_Material` (`9,650` vertices)
     - Primitive 1: `LUIS_Head_Material` (`5,255` vertices)
     - Primitive 2: `Retail_SkateBoard` (`476` vertices)
     - Primitive 3: `Retail_SkateTruck` (`1,085` vertices)
     - Primitive 4: `Retail_SkateWheel` (`724` vertices)
   - Preserve Chunk 1 (`BIN\0`) binary data completely intact, maintaining original vertex buffers, accessors, and 35-joint skin matrices.
5. Re-serialize Chunk 0 JSON padded with `0x20` space bytes to strict 4-byte alignment.
6. Assemble new GLB: 12-byte GLB header + Chunk 0 (Header + JSON) + Chunk 1 (Header + BIN).
7. Prepend 37-byte pack entry header: `struct.pack("<I", 25) + b"assets/private/skater.glb" + struct.pack("<Q", len(clean_glb))`.
8. Write out `skate3_cleanroom/parts/char_luis.part` using the Atomic Temp-File Protocol.

#### 7.1.3 Mathematical Formulation for `pack.json` Size & Hash Recalculation
`skate3_cleanroom/loader.js` verifies pack integrity in `fetchParts` (line 376):
$$\text{Downloaded Bytes} \equiv \sum_{p \in \text{pack.characters}[c].\text{parts}} \text{len}(p) = \text{pack.characters}[c].\text{size}$$
Any discrepancy immediately throws `Error("Downloaded X of Y bytes; pack.json is stale")`.

The core bundle consists of four parts: `core_head.part`, `char_<key>.part`, `core_tail_0.part`, and `core_tail_1.part`. The sizes of the surrounding three parts are immutable:
$$\begin{aligned}
S_{\text{head}} &= \text{len}(\text{"parts/core_head.part"}) = 37{,}088{,}836\text{ bytes} \\
S_{\text{tail0}} &= \text{len}(\text{"parts/core_tail_0.part"}) = 27{,}000{,}000\text{ bytes} \\
S_{\text{tail1}} &= \text{len}(\text{"parts/core_tail_1.part"}) = 26{,}542{,}298\text{ bytes} \\
S_{\text{fixed}} &= S_{\text{head}} + S_{\text{tail0}} + S_{\text{tail1}} = \mathbf{90{,}631{,}134\text{ bytes}}
\end{aligned}$$

**Authoritative Invariant Formulas:**
$$\begin{aligned}
\text{part\_payload} &= \text{header}_{37} \,\|\, \text{clean\_glb\_bytes} \\
\text{pack["characters"]["luis"]["size"]} &= 90{,}631{,}134 + \text{len}(\text{part\_payload}) \\
\text{pack["characters"]["luis"]["hash"]} &= \text{hashlib.sha256}(\text{part\_payload}).\text{hexdigest}()[:16] \\
\text{pack["core"]["size"]} &= 90{,}631{,}134 + \text{len}(\text{part\_payload}) \\
\text{pack["core"]["hash"]} &= \text{hashlib.sha256}(\text{part\_payload}).\text{hexdigest}()[:16] \\
\text{pack["default\_char"]} &= \mathbf{"luis"}
\end{aligned}$$

---

### 7.2 Pillar 2: GTA Vice City RenderWare Override Asset Storage & Emscripten `Module.FS`

#### 7.2.1 RenderWare Binary Payloads on Disk
All custom player override assets are stored under `revcdos/vcbr/luis_player/`:

| File Name | Exact Byte Size | Physical Sectors ($2048\text{ B}$) | Format Description |
| :--- | :--- | :--- | :--- |
| **`player.dff`** | **`292,864` bytes** | **`143` sectors** | RenderWare 3.4 Clump binary. `4,006` vertices, `2,800` triangles, `24` skeleton bones. Vertex count is at byte offset `3201` (`uint32_le`). |
| **`player.txd`** | **`45,056` bytes** | **`22` sectors** | RenderWare Texture Dictionary containing uncompressed 32-bit RGBA diffuse textures for the Luis model. |
| **`player.bmp`** | **`66,612` bytes** | N/A | Windows Bitmap format skin preview graphic. |
| **`fronten1.txd`** | **`394,664` bytes** | **`193` sectors** | Frontend texture dictionary containing menu logos and branding overrides. |

#### 7.2.2 Virtual Filesystem Mounting Architecture (`Module.FS`)
On game startup, [`revcdos/game.js`](revcdos/game.js) fetches the override binaries and mounts them into the Emscripten MEMFS before the GTA 3D engine initializes:

```
Emscripten MEMFS Root (/)
└── vc-assets/
    └── local/
        └── models/
            ├── fronten1.txd                  <-- Overwritten with fronten1.txd (394,664 B)
            ├── generic/
            │   └── player.bmp                <-- Overwritten with player.bmp (66,612 B)
            ├── gta3.dir                      <-- Binary Sector Table (Patched with 143 & 22)
            └── gta3.img/
                ├── player.dff                <-- Overwritten with player.dff (292,864 B)
                ├── player.txd                <-- Overwritten with player.txd (45,056 B)
                ├── csplay.dff                <-- Overwritten with player.dff (Cutscene model)
                └── csplay.txd                <-- Overwritten with player.txd (Cutscene texture)
```

#### 7.2.3 Directory Table (`gta3.dir`) 32-Byte Record Structure & Patching
The GTA Vice City archive table `/vc-assets/local/models/gta3.dir` is an array of 32-byte binary structures:
```
+-----------------------------------+-----------------------------------+-----------------------------------+
| Offset 0..3 (4 B, uint32_le)      | Offset 4..7 (4 B, uint32_le)      | Offset 8..31 (24 B, ASCII null-pad|
| Sector Offset in gta3.img         | Sector Count in gta3.img          | Case-insensitive file name        |
+-----------------------------------+-----------------------------------+-----------------------------------+
```
When `player.dff` and `player.txd` are replaced with custom Luis models, their sector sizes differ from Tommy Vercetti's stock assets. The patching routine iterates through `gta3.dir` in 32-byte increments:
- For entries matching `player.dff`, `csplay.dff`, `player[2-9].dff`, `csplay([2-9]|10|11).dff`:
  Write `uint32_le(143)` at `offset + 4`.
- For entries matching `player.txd`, `csplay.txd`, `player[2-9].txd`, `csplay([2-9]|10|11).txd`:
  Write `uint32_le(22)` at `offset + 4`.

#### 7.2.4 Deterministic Telemetry Contract (`window.__REVCDOS_STATUS__`)
To prevent test timeouts and verify mounting deterministically, [`revcdos/game.js`](revcdos/game.js) exposes:
```javascript
window.__REVCDOS_STATUS__ = {
  haveOriginalGame: true,
  dataLoadedBytes: 135355111,
  wasmReady: true,
  mainCalled: true,
  lastError: null,
  luisPlayerMounted: true,          // MUST be true on startup
  luisPlayerDffBytes: 292864,       // Exact DFF byte size
  luisPlayerDirSectors: 143,        // Math.ceil(292864 / 2048)
  luisPlayerVerts: 4006,            // Extracted from DFF offset 3201
  luisPlayerBones: 24,              // Standard GTA skeleton bones
  customMenuLogoMounted: true,
  fronten1TxdBytes: 394664
};
```
**Eager Startup Pre-Verification:** In addition to mounting during `mainCalled()`, `revcdos/game.js` eagerly pre-fetches and verifies `player.dff`, `player.txd`, and `player.bmp` immediately when the script executes, ensuring that `luisPlayerMounted === true` is reflected in telemetry even before the full 54 MB game data archive completes compilation.

---

### 7.3 Pillar 3: Git Sparse-Checkout & Worktree File Materialization Engine

#### 7.3.1 Root-Cause Analysis of Sandcastle Sparse Exclusions
In Sandcastle multi-agent git worktrees, `.git/info/sparse-checkout` is configured by default with:
```
/*
!/revcdos/
!/character_hoodie.glb
!/archive/
!/villainy_assets/
!/mkd/
!/tkdr/
!/LUIS*.glb
!/PLATODOOM*.glb
```
Because of these exclusions, a newly cloned worktree lacks `character_hoodie.glb` and the entire `revcdos/` runtime directory. If a developer or automated test starts `scripts/serve_skatealley.py` inside the worktree without manual git re-configuration:
- Request for `/character_hoodie.glb?v=051` returns **HTTP 404 Not Found**, halting Three.js scene initialization.
- Request for `/revcdos/` returns **HTTP 404 Not Found**, breaking Vice City verification.

#### 7.3.2 Worktree Asset Materialization Engine (`scripts/serve_skatealley.py`)
Rather than forcing manual `git sparse-checkout add` commands (which alter git tracking and may fail in read-only worktree environments), [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) MUST include native worktree materialization hooks that run automatically on server boot:

```mermaid
flowchart TD
    ServerBoot["Server Boot (scripts/serve_skatealley.py)"] --> CheckRevcdos{"Does worktree/revcdos/<br/>index.html exist?"}
    ServerBoot --> CheckHoodie{"Does worktree/<br/>character_hoodie.glb exist?"}

    CheckRevcdos -- Yes --> RevcdosReady["revcdos/ already present"]
    CheckRevcdos -- No --> FindRevcdosSrc["Locate revcdos in main repo<br/>/Users/diesel/Desktop/SkateAlley/revcdos"]
    FindRevcdosSrc --> LinkRevcdos["Atomic os.symlink(src_revcdos, worktree_revcdos)<br/>(0ms I/O, saves 150 MB disk churn)"]

    CheckHoodie -- Yes --> HoodieReady["character_hoodie.glb already present"]
    CheckHoodie -- No --> FindHoodieSrc["Locate character_hoodie.glb in main repo<br/>/Users/diesel/Desktop/SkateAlley/character_hoodie.glb"]
    FindHoodieSrc --> LinkHoodie["Atomic os.symlink(src_hoodie, worktree_hoodie)<br/>(0ms I/O, saves 1.35 MB disk churn)"]

    LinkRevcdos --> RevcdosData["Run ensure_revcdos_data() & ensure_revcdos_luis_player()"]
    LinkHoodie --> StaticReady["Static HTTP File Server Ready"]
    RevcdosData --> StaticReady
```

**Materialization Implementation Contract:**
1. **`ensure_worktree_revcdos_files(base_dir=None)`:**
   - Evaluates `target = os.path.join(root, "revcdos")`.
   - If `os.path.isdir(target)` and `os.path.isfile(os.path.join(target, "index.html"))`, returns `True`.
   - Locates primary repository source: `"/Users/diesel/Desktop/SkateAlley/revcdos"` or `os.path.abspath(os.path.join(root, "..", "..", "..", "revcdos"))`.
   - Creates directory symlink `os.symlink(src_revcdos, target)` (or directory link-tree if cross-filesystem symlinks are restricted).
   - Falls back to `shutil.copytree(src, dst, copy_function=os.link)` if symlinks are disallowed.
2. **`ensure_worktree_character_hoodie(base_dir=None)`:**
   - Evaluates `target = os.path.join(root, "character_hoodie.glb")`.
   - If `os.path.isfile(target)` and `os.path.getsize(target) == 1357020`, returns `True`.
   - Creates symlink `os.symlink("/Users/diesel/Desktop/SkateAlley/character_hoodie.glb", target)`.
3. **Execution Point:** These routines MUST be invoked at **module import time** in [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) before `ensure_revcdos_data()` runs, and repeated in `main()` prior to `server.serve_forever()`.

---

### 7.4 Pillar 4: PostgreSQL Alpha Persistence Architecture

#### 7.4.1 Schema DDL & Physical Table Storage
Both persistence tables reside in the `alpha` database on PostgreSQL 16 (port `5432`):

```sql
-- 1. Scene Layout Persistence Table
CREATE TABLE IF NOT EXISTS skatealley_scene_layouts (
    layout_key VARCHAR(64) PRIMARY KEY,
    payload_json TEXT NOT NULL,
    updated_at_ms BIGINT NOT NULL
);

-- 2. Placed Holographic Sticker Persistence Table
CREATE TABLE IF NOT EXISTS skatealley_placed_stickers (
    placed_id VARCHAR(128) PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL,
    code VARCHAR(32) NOT NULL DEFAULT 'HOLO-STK-01',
    anchor_x DOUBLE PRECISION NOT NULL,
    anchor_y DOUBLE PRECISION NOT NULL,
    anchor_z DOUBLE PRECISION NOT NULL,
    pos_x DOUBLE PRECISION NOT NULL,
    pos_y DOUBLE PRECISION NOT NULL,
    pos_z DOUBLE PRECISION NOT NULL,
    normal_x DOUBLE PRECISION NOT NULL,
    normal_y DOUBLE PRECISION NOT NULL,
    normal_z DOUBLE PRECISION NOT NULL,
    rotation_rad DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    size_meters DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    surface_zone VARCHAR(64) NOT NULL DEFAULT 'alley_wall_left',
    surface_id VARCHAR(64) NOT NULL DEFAULT 'COLLIDER_STICKER_WALL_L',
    surface_label VARCHAR(128) NOT NULL DEFAULT 'Left Alley Wall (Interior)',
    wall_side VARCHAR(16) NOT NULL DEFAULT 'L',
    tagger VARCHAR(64) NOT NULL DEFAULT '',
    message VARCHAR(280) NOT NULL DEFAULT '',
    created_at_ms BIGINT NOT NULL,
    updated_at_ms BIGINT NOT NULL
);

-- Index for O(1) chronological range queries
CREATE INDEX IF NOT EXISTS idx_skatealley_stickers_created_at
    ON skatealley_placed_stickers (created_at_ms ASC, placed_id ASC);
```

#### 7.4.2 Active Keys & Schema Invariants
- `skatealley_scene_layouts` currently stores **6 authoritative keys**:
  1. `'holo_columns'`: 7 station column transform matrices and heights.
  2. `'math_pods'`: Levitating mathematical symbol cluster positions.
  3. `'character_camera'`: Free-roam third-person camera offset vectors.
  4. `'player_spawn'`: Default avatar spawn transform in alley corridor.
  5. `'startup_camera_pan'`: Intro fly-through camera spline waypoints.
  6. `'lamppost_light'`: Street lamp point light color and attenuation radii.
- **Validation Constraint:** Any upsert to `skatealley_scene_layouts` MUST validate that `payload_json` parses into a valid JSON object or array (`isinstance(payload, (dict, list))`) and that `layout_key` matches `^[a-zA-Z0-9_.-]+$` before issuing SQL.

---

### 7.5 Pillar 5: HTTP 206 Partial Content Byte-Range Streaming Engine

#### 7.5.1 RFC 9110 Specification Compliance
For high-performance 3D streaming (e.g. streaming `50 MB` Skate 3 `.part` files, `135 MB` GTA Vice City `.data` files, and `1.35 MB` GLB models), [`scripts/serve_skatealley.py`](scripts/serve_skatealley.py) implements the HTTP byte-range standard:

1. **Client Request Syntax:**
   - Closed Range: `Range: bytes=0-1048575` (requests the first 1 MB).
   - Open-Ended Range: `Range: bytes=1048576-` (requests from 1 MB to EOF).
   - Suffix Range: `Range: bytes=-65536` (requests the final 64 KB of the file).
2. **Bounds Checking & 416 Guardrails:**
   - Let $S_{\text{file}} = \text{os.path.getsize}(\text{path})$.
   - If $\text{start} \ge S_{\text{file}}$ or $\text{start} > \text{end}$:
     Return `HTTP 416 Range Not Satisfiable`, `Content-Range: bytes */S_file`, `Content-Length: 0`.
3. **Successful Range Response (`HTTP 206 Partial Content`):**
   - Headers emitted:
     ```http
     HTTP/1.1 206 Partial Content
     Content-Type: <guessed_mime_type>
     Content-Range: bytes <start>-<end>/<file_size>
     Content-Length: <end - start + 1>
     Accept-Ranges: bytes
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Headers: Range, Content-Type, Accept, Origin, Authorization, X-Visitor-Token
     Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges
     ```
4. **Optimized 64 KB Streaming Loop:**
   - Rather than loading entire multi-megabyte ranges into RAM, the server seeks to `start` and writes in **64 KB chunks** (`65,536 bytes`), matching standard TCP socket buffer limits and keeping server memory flat under high concurrent load:
     ```python
     chunk_size = 64 * 1024  # 64 KB streaming buffer
     with open(path, "rb") as f:
         f.seek(start)
         remaining = length
         while remaining > 0:
             buf = f.read(min(chunk_size, remaining))
             if not buf:
                 break
             self.wfile.write(buf)
             remaining -= len(buf)
     ```
   - Socket disconnects (`BrokenPipeError`, `ConnectionResetError`) are caught silently to prevent worker thread crashes when a user navigates away mid-download.

---

## 8. Implementation & Verification Playbook for Downstream Agents

Downstream implementation agents (`storage-implementer`, `architecture-implementer`, `visual-implementer`) and testers (`*-tester`, `e2e-validator`) MUST verify the following concrete `{correct required outputs}`:

### 8.1 Skate 3 Cleanroom Verification
```bash
# 1. Verify pack.json default_char and hash integrity
python3 -c '
import json, hashlib, os
with open("skate3_cleanroom/pack.json") as f:
    p = json.load(f)
assert p["default_char"] == "luis", f"Invalid default_char: {p[\"default_char\"]}"
part_bytes = open("skate3_cleanroom/parts/char_luis.part", "rb").read()
expected_size = 90631134 + len(part_bytes)
assert p["characters"]["luis"]["size"] == expected_size, f"Size mismatch: {p[\"characters\"][\"luis\"][\"size\"]} != {expected_size}"
assert p["characters"]["luis"]["hash"] == hashlib.sha256(part_bytes).hexdigest()[:16]
print("✓ Skate 3 pack.json & part integrity VERIFIED.")
'

# 2. Verify Torus removal & Skateboard primitives in char_luis.part
python3 -c '
import trimesh
part = open("skate3_cleanroom/parts/char_luis.part", "rb").read()
scene = trimesh.load(trimesh.util.wrap_as_stream(part[37:]), file_type="glb")
nodes = [n for n in scene.graph.nodes if "torus" in n.lower() or "holo" in n.lower()]
assert len(nodes) == 0, f"Found extraneous nodes: {nodes}"
geoms = list(scene.geometry.keys())
assert len(geoms) >= 5, f"Expected 5 mesh primitives, got {len(geoms)}: {geoms}"
print("✓ Skate 3 char_luis.part primitives & zero-torus VERIFIED.")
'
```

### 8.2 Worktree Asset Materialization Verification
```bash
# Verify character_hoodie.glb and revcdos/ are materialized without 404s
python3 -c '
import os
from scripts.serve_skatealley import ensure_worktree_character_hoodie, ensure_worktree_revcdos_files
root = os.getcwd()
ensure_worktree_character_hoodie(root)
ensure_worktree_revcdos_files(root)
assert os.path.exists("character_hoodie.glb"), "character_hoodie.glb missing!"
assert os.path.exists("revcdos/index.html"), "revcdos/index.html missing!"
assert os.path.exists("revcdos/vcbr/luis_player/player.dff"), "player.dff missing!"
print("✓ Worktree asset materialization VERIFIED.")
'
```

### 8.3 PostgreSQL Persistence & Concurrency Verification
```bash
# Verify connection pool and table integrity
python3 -c '
from scripts.serve_skatealley import open_postgres_connection, ensure_scene_layout_schema, ensure_sticker_schema
with open_postgres_connection() as conn:
    ensure_scene_layout_schema(conn)
    ensure_sticker_schema(conn)
    layouts = conn.execute_params("SELECT layout_key FROM skatealley_scene_layouts")
    assert len(layouts) >= 6, f"Expected >= 6 layout keys, got {len(layouts)}"
    stickers = conn.execute_params("SELECT placed_id FROM skatealley_placed_stickers")
    print(f"✓ PostgreSQL Alpha tables VERIFIED ({len(layouts)} layouts, {len(stickers)} stickers).")
'
```

### 8.4 HTTP 206 Byte-Range Streaming Verification
```bash
# Test HTTP 206 Partial Content range query via curl
python3 scripts/serve_skatealley.py --host 127.0.0.1 --port 8089 &
PID=$!
sleep 1
curl -s -i -H "Range: bytes=0-1023" http://127.0.0.1:8089/skate3_cleanroom/parts/core_head.part | head -n 10
kill $PID
# Expected: "HTTP/1.1 206 Partial Content", "Content-Range: bytes 0-1023/37088836", "Content-Length: 1024"
```
