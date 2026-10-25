# Functional Specification 056: Cross-Session 3D Sticker & Tag Message Persistence via Server SSH Mac PostgreSQL (`egg@10.0.0.62:5432`)

## 1. System Purpose & Core Objective

This specification defines the empirical root-cause diagnosis, desired `{functionality}`, first-principles physical and network modeling, relational PostgreSQL schema contract, HTTP API specification, Server SSH Mac (`egg@10.0.0.62`) container and boot-recovery integration, client-side startup hydration and mutation synchronization lifecycle, operational and latency budgets, edge-case failure-isolation boundaries, and verifiable `{correct required outputs}` for persisting placed 3D holographic stickers and their `"TAGGER:"` and `"MESSAGE:"` metadata across sessions in SkateAlley ([`/Users/diesel/desktop/skatealley/scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py), [`/Users/diesel/desktop/skatealley/holographic_stickers.js`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js), [`/Users/diesel/desktop/skatealley/sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js), [`/Users/diesel/desktop/skatealley/index.html`](file:///Users/diesel/desktop/skatealley/index.html), and `/Users/egg/.local/bin/ensure_docker_and_containers.sh` on `egg@10.0.0.62`).

The core objective is that whenever a user places a sticker on any calibrated wall or floor surface in Freeman Alley (or outside), sets or updates its `"MESSAGE:"` (e.g., `"x"`) and `"TAGGER:"` (e.g., `"y"`), transforms or repositions it, or deletes it, that state is durably persisted in PostgreSQL (`postgres:18` inside `polymarket-postgres` on the Server SSH Mac `egg@10.0.0.62:5432`) and automatically reconstructed in the 3D scene whenever the webapp is reloaded or opened in a new browser session across any supported entrypoint (local development server, Server Mac origin, Cloudflare HTTPS tunnel via [`tunnel.json`](file:///Users/diesel/desktop/skatealley/tunnel.json), or GitHub Static Pages).

**DO NOT CODE YET.** This document specifies functional requirements, relational data contracts, network and container invariants, state transitions, operational budgets, and observable outcomes only. It contains zero implementation code, concrete syntax, or mechanical diffs.

---

## 2. Authoritative Domain Vocabulary Alignment ([`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md))

All assessments of system state, design sufficiency, runtime invariants, and verification gates within this specification strictly adopt the evaluation taxonomy established in [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{functionality}`**: End-to-end cross-session persistence and 3D reconstruction of placed holographic stickers and their `"TAGGER:"` and `"MESSAGE:"` metadata backed by PostgreSQL on the Server SSH Mac (`egg@10.0.0.62:5432`) and exposed through [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py) and the Cloudflare HTTPS tunnel ([`tunnel.json`](file:///Users/diesel/desktop/skatealley/tunnel.json)), such that:
  1. Placing a sticker on a wall or floor and saving a `"TAGGER:"` (e.g., `"y"`) and `"MESSAGE:"` (e.g., `"x"`) persists the full 3D spatial placement record and message payload to PostgreSQL on `egg@10.0.0.62`.
  2. Closing and re-opening the webapp (or opening a fresh browser context/session) automatically fetches all persisted sticker records from PostgreSQL, reconstructs each 3D holographic sticker mesh at its exact wall or floor pose and size within $[0.25\text{ m}, 1.00\text{ m}]$, and restores its `"TAGGER:"` and `"MESSAGE:"` readout when clicked.
  3. Modifying a sticker's `"TAGGER:"`/`"MESSAGE:"`, rotating, resizing, or repositioning a placed sticker updates its corresponding PostgreSQL row idempotently, and deleting a placed sticker removes it from PostgreSQL so it does not reappear on subsequent session reloads.
- **`{correctness}`**:
  - **Complete 3D Spatial + Metadata Relational Contract:** Every persisted row in PostgreSQL stores not only `tagger` and `message`, but the complete spatial and catalog invariants required to deterministically reconstruct the 3D sticker (`placed_id`, `asset_id`, `code`, `anchor_x`, `anchor_y`, `anchor_z`, `pos_x`, `pos_y`, `pos_z`, `normal_x`, `normal_y`, `normal_z`, `rotation_rad`, `size_meters`, `surface_zone`, `surface_id`, `surface_label`, `wall_side`, `tagger`, `message`, `created_at_ms`, and `updated_at_ms`).
  - **Collision-Free Identity & Idempotent Hydration:** Client-generated `placed_id` values use globally unique identifiers (while honoring explicit caller-supplied `placedId` values for deterministic tests), and hydrating or re-hydrating a sticker record whose `placed_id` already exists in [`holographic_stickers.js`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js) updates the existing 3D instance in place rather than spawning duplicate meshes in `placedStickersGroup` or `placedRaycastTargets`.
  - **Visual Envelope Alignment Across Async Boot Order:** Whether database hydration completes before or after `freeman_alley.glb` finishes loading and [`syncVisualEnvelope`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js#L3006-L3029) executes, every hydrated 3D sticker is deterministically aligned to the calibrated wall/floor surface profile with locked size bounds $[0.25\text{ m}, 1.00\text{ m}]$ and plumb/level normal invariants ($|N_y| \le 10^{-6}$ on walls; $|N_x| \le 10^{-6}$ on floor).
  - **Zero-Dependency Container & Reboot Resilience:** [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py) connects to PostgreSQL on `egg@10.0.0.62:5432` without failing on missing third-party Python C-extensions inside the `lag-policy-engine:local` container image, and `/Users/egg/.local/bin/ensure_docker_and_containers.sh` on `egg@10.0.0.62` launches `skatealley-app-local` with `--add-host host.docker.internal:host-gateway` and authoritative PostgreSQL connection parameters so database connectivity survives container recreations and Server Mac reboots.
- **`{correct required outputs}`**:
  1. **PostgreSQL Health & Schema Output:** Querying `GET /api/health` and `GET /api/stickers` on both the local server (`http://localhost:8080/api/stickers`) and the Server SSH Mac / Cloudflare tunnel (`http://10.0.0.62:3002/api/stickers` and `https://<subdomain>.trycloudflare.com/api/stickers`) returns `HTTP 200 OK` with `"ok": true`, `"storage": "postgres"`, and `"dbConnected": true`.
  2. **End-to-End Persistence & Session Reload Output:** When Session A places a sticker on a wall with `message: "x"` and `tagger: "y"` (via interactive placement + popup save or `sandbox.placeStickerAt` + `sandbox.saveStickerTagAndMessage`), querying `polymarket-postgres` on `egg@10.0.0.62` confirms the row exists in `placed_stickers` with `tagger = 'y'` and `message = 'x'`. Opening a brand-new browser context (Session B) or reloading the page automatically hydrates the sticker into `sandbox.holographicStickers.placedStickers`, renders its 3D mesh on the wall, and displays `TAGGER: y` and `x` inside `#sticker-saved-readout` and the `"TAGGER:"` / `"MESSAGE:"` inputs when clicked.
  3. **Mutation & Deletion Persistence Output:** Updating `tagger`/`message`, resizing/rotating/repositioning the sticker, or deleting the sticker via `#sticker-delete-btn` / `sandbox.deleteSelectedSticker()` immediately persists the update or deletion to PostgreSQL on `egg@10.0.0.62` (`HTTP 200 OK`) and reflects accurately across subsequent page reloads.
- **`{errors}`**:
  - Storing only `tagger` and `message` without the 3D spatial placement coordinates (`asset_id`, `anchor_position`, `normal`, `rotation_rad`, `size`, `surface_zone`), making 3D scene reconstruction impossible on reload.
  - Relying on ephemeral in-memory server arrays or browser-only `localStorage` as the sole persistence layer instead of PostgreSQL on the Server SSH Mac (`egg@10.0.0.62:5432`).
  - Failing with `ModuleNotFoundError: No module named 'psycopg2'` inside `skatealley-app-local` on `egg@10.0.0.62` or omitting `--add-host host.docker.internal:host-gateway` in `/Users/egg/.local/bin/ensure_docker_and_containers.sh`.
  - Generating sequential `placed_sticker_1` IDs across separate browser sessions that collide with and overwrite previously persisted stickers in PostgreSQL.
  - Creating duplicate 3D meshes in `placedStickersGroup` when hydrating or updating an already-present `placedId`.
  - Swallowing database connection errors silently (`RULE[user_global]`) instead of surfacing explicit error telemetry (`lastSyncError`, HTTP `503`) and bounded local cache recovery.
- **`{sufficient}`**: Complete relational, network, container, API, and client lifecycle specification enabling deterministic end-to-end implementation and live verification against `polymarket-postgres` on `egg@10.0.0.62:5432` and the browser runtime without ambiguity or synthetic mocks.
- **`{insufficient}`**: Any specification that omits 3D spatial attributes from the database schema, ignores the Docker network isolation between `skatealley-net` and `polymarket-postgres` on `egg@10.0.0.62`, assumes `psycopg2` is pre-installed in `lag-policy-engine:local`, or fails to handle multi-origin API resolution (`localhost`, `:3002`, and `tunnel.json`).

---

## 3. Empirical Root-Cause Diagnosis & First-Principles Physical Modeling (`RULE[user_global]`)

### 3.1 Why Stickers and Messages Currently Vanish Across Sessions
1. **Purely Ephemeral In-Memory Client Array:**
   - In [`holographic_stickers.js`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js#L2518-L2819), `placedStickers` and `placedStickersById` exist exclusively as in-memory JavaScript objects inside `buildHolographicStickersSystem()`.
   - In [`sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js#L19973-L19980), `buildHolographicStickersSystem` is initialized on page load with `spawnDefaultCatalog: false` and zero network hydration calls.
   - When `placeStickerAt()`, `commitStickerPlacement()`, `saveStickerTagAndMessage()`, or `deleteSelectedSticker()` is invoked ([`sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js#L12951-L13260)), mutations only update the in-memory `record` object and DOM readout. Refreshing or closing the tab destroys the JavaScript heap, losing all placed stickers and messages.
2. **Naive Sequential `placed_sticker_<N>` Counter Collisions:**
   - [`holographic_stickers.js`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js#L2737-L2738) initializes `let placedCounter = 0` per page load and assigns `placed_sticker_1`, `placed_sticker_2`, etc. Across multiple sessions, every new page load resets `placedCounter` to `0`, which would cause new placements in Session 2 to collide with `placed_sticker_1` from Session 1 unless `placedId` generation is globally unique (or seeded past existing database IDs) and `placeStickerAt` is idempotent on existing `placedId` keys.

### 3.2 Empirical Infrastructure Audit on Server SSH Mac (`egg@10.0.0.62`)
Read-only telemetry inspection of `egg@10.0.0.62` establishes the exact physical runtime topology:
1. **PostgreSQL Instance (`polymarket-postgres`):**
   - Container `polymarket-postgres` runs `postgres:18` (`18.6-1.pgdg13+2`) bound to `0.0.0.0:5432->5432/tcp` on the default `bridge` network, with `POSTGRES_USER=user`, `POSTGRES_PASSWORD=pass`, default database `alpha` (plus `bartending` and `postgres`), and `scram-sha-256` TCP authentication in `pg_hba.conf`.
   - TCP port `5432` on `10.0.0.62` is directly reachable both from containers on `egg@10.0.0.62` via `host.docker.internal:5432` and from the local development Mac over the LAN (`10.0.0.62:5432`).
2. **SkateAlley Origin Container (`skatealley-app-local`):**
   - Container `skatealley-app-local` runs `python3 /srv/skatealley/scripts/serve_skatealley.py --host 0.0.0.0 --port 3002 --dir /srv/skatealley` on the `skatealley-net` Docker bridge network using image `lag-policy-engine:local` (Python `3.11.17`).
   - **Critical Finding 1 (Host Gateway Routing):** In `/Users/egg/.local/bin/ensure_docker_and_containers.sh`, `bartending-app-local` is created with `--add-host host.docker.internal:host-gateway`, whereas `skatealley-app-local` is created without `--add-host host.docker.internal:host-gateway` or `DATABASE_URL` environment variables. While Docker Desktop for Mac currently resolves `host.docker.internal`, explicitly enforcing `--add-host host.docker.internal:host-gateway` and `SKATEALLEY_DATABASE_URL` in `ensure_docker_and_containers.sh` prevents container config drift across reboots.
   - **Critical Finding 2 (Python Driver Availability in `lag-policy-engine:local`):** Inspection of `skatealley-app-local` confirms that `psycopg` and `psycopg2` are **not installed** in the `lag-policy-engine:local` image (`ModuleNotFoundError`). Furthermore, because `/srv/skatealley` is bind-mounted read-only (`:ro`) and `ensure_docker_and_containers.sh` recreates `skatealley-app-local` from `lag-policy-engine:local` if stopped, relying solely on an ephemeral `pip install` inside a running container would break upon container recreation.
   - **Architectural Resolution:** [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py) must include a self-contained, zero-dependency Python standard-library PostgreSQL v3 Wire Protocol + SCRAM-SHA-256 / MD5 / Trust client (`socket`, `struct`, `hashlib`, `hmac`, `secrets`, `base64`)—while also supporting `psycopg2`/`psycopg` if present—so [`serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py) can execute parameterized SQL transactions against `polymarket-postgres` (`host.docker.internal:5432` inside Docker on `egg@10.0.0.62`, or `10.0.0.62:5432` from the local dev Mac) with **zero external package dependencies**.

### 3.3 First-Principles Payload, Latency & Scale Modeling
- **Row Payload Size:** Each placed sticker record serializes to $\approx 380\text{–}520\text{ bytes}$ in JSON/SQL (`placed_id` $\le 64\text{ B}$, `asset_id` $\le 32\text{ B}$, 9 float64 coordinates $= 72\text{ B}$, `rotation_rad` + `size_meters` $= 16\text{ B}$, `surface_zone`/`surface_id` $\le 64\text{ B}$, `tagger` $\le 64\text{ chars}$, `message` $\le 280\text{ chars}$, timestamps $= 16\text{ B}$).
- **Scene Scale & Hydration Bandwidth:** Even with $N = 200$ persisted stickers across Freeman Alley, the total `GET /api/stickers` JSON payload is $< 100\text{ KB}$, requiring a single indexed `SELECT` query ($O(N)$ scan on $\le 500$ rows, $< 2\text{ ms}$ in PostgreSQL) and a single HTTP roundtrip ($< 15\text{ ms}$ on LAN, $< 80\text{ ms}$ over the Cloudflare HTTPS tunnel).
- **3D Instantiation Cost:** In [`holographic_stickers.js`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js), sticker textures (`base_color.png`, `master_alpha.png`, `foil_mask.png`, `border_mask.png`, `packed_control.png`) are cached per catalog asset ID (`STICKER_ASSET_MANIFEST`, 7 assets total). Reconstructing $N$ placed stickers reuses the shared texture cache and instantiates lightweight `PlaneGeometry(width, height, 1, 1)` meshes in $< 0.3\text{ ms}$ per sticker.

---

## 4. End-to-End Functional Architecture

```mermaid
flowchart LR
    subgraph Browser["Browser Client (index.html + sandbox.js + holographic_stickers.js)"]
        Boot["1. Scene Boot & GLB Load<br/>sandbox.loadPersistedStickers()"]
        Place["2. Place / Move / Resize / Rotate Sticker<br/>placeStickerAt() / commitStickerPlacement()"]
        TagSave["3. Submit Popup Form<br/>TAGGER: 'y' • MESSAGE: 'x'<br/>saveStickerTagAndMessage()"]
        Delete["4. Delete Sticker<br/>deleteSelectedSticker()"]
        LocalCache["Write-Through Local Cache<br/>(localStorage Backup)"]
    end

    subgraph Origin["SkateAlley HTTP Origin (scripts/serve_skatealley.py)"]
        GetAPI["GET /api/stickers<br/>Return All Active Placed Stickers"]
        UpsertAPI["POST /api/stickers<br/>Validate & Upsert Sticker + Tagger/Message"]
        DelAPI["DELETE /api/stickers/<placedId><br/>Delete Sticker Record"]
        HealthAPI["GET /api/health<br/>Include sticker_db_ready & sticker_count"]
    end

    subgraph ServerMac["Server SSH Mac (egg@10.0.0.62)"]
        CFTunnel["Cloudflare HTTPS Tunnel<br/>(skatealley-https-tunnel -> tunnel.json)"]
        AppContainer["Container: skatealley-app-local (:3002)<br/>host.docker.internal -> 10.0.0.62:5432"]
        Postgres["Container: polymarket-postgres (:5432)<br/>PostgreSQL 18 • Table: skatealley_placed_stickers"]
    end

    Boot -->|"GET /api/stickers"| CFTunnel
    Place -->|"POST /api/stickers (Upsert)"| CFTunnel
    TagSave -->|"POST /api/stickers (Upsert)"| CFTunnel
    Delete -->|"DELETE /api/stickers/:id"| CFTunnel
    Boot -.->|"Mirror / Offline Fallback"| LocalCache
    TagSave -.->|"Mirror"| LocalCache

    CFTunnel --> AppContainer
    AppContainer --> GetAPI & UpsertAPI & DelAPI & HealthAPI
    GetAPI & UpsertAPI & DelAPI & HealthAPI -->|"PostgreSQL v3 Wire (SCRAM-SHA-256)<br/>host.docker.internal:5432 / 10.0.0.62:5432"| Postgres
```

---

## 5. Detailed Functional Requirements

### 5.1 Pillar 1: Relational PostgreSQL Schema & Storage Invariants on `egg@10.0.0.62:5432`
1. **Target PostgreSQL Instance & Database Resolution:**
   - All sticker persistence targets the live `polymarket-postgres` (`postgres:18`) service on the Server SSH Mac (`egg@10.0.0.62:5432`).
   - Connection configuration must resolve from environment variables (`SKATEALLEY_DATABASE_URL` or `DATABASE_URL`), `.env` configuration, or deterministic Server Mac defaults:
     - Inside `skatealley-app-local` on `egg@10.0.0.62`: `postgresql://user:pass@host.docker.internal:5432/alpha` (or dedicated `skatealley` database if created, with automatic schema/table initialization on startup).
     - From the local development Mac (`serve_skatealley.py` running on `localhost:8080` or `localhost:3002`): `postgresql://user:pass@10.0.0.62:5432/alpha` (falling back to `localhost:5432` if a local tunnel/instance is active).
2. **Idempotent Table Initialization (`skatealley_placed_stickers`):**
   - On server startup (and lazily on first request if needed), [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py) must execute `CREATE TABLE IF NOT EXISTS skatealley_placed_stickers` with the following authoritative columns and constraints:
     - `placed_id VARCHAR(128) PRIMARY KEY`: Unique identifier for the placed sticker instance (e.g., `placed_sticker_<timestamp>_<rand>` or caller-supplied ID).
     - `asset_id VARCHAR(64) NOT NULL`: Catalog sticker ID matching `STICKER_ASSET_MANIFEST` (e.g., `'doom_tag'`, `'glass_doom'`, `'doom_cig'`, `'doom_watch'`, `'villainy_inc'`, `'skate3_doom'`, `'plato_arcade'`).
     - `code VARCHAR(32) NOT NULL DEFAULT 'HOLO-STK-01'`: Catalog code.
     - `anchor_x DOUBLE PRECISION NOT NULL`, `anchor_y DOUBLE PRECISION NOT NULL`, `anchor_z DOUBLE PRECISION NOT NULL`: 3D raycast anchor coordinates in meters.
     - `pos_x DOUBLE PRECISION NOT NULL`, `pos_y DOUBLE PRECISION NOT NULL`, `pos_z DOUBLE PRECISION NOT NULL`: Surface-offset adjusted 3D world coordinates in meters.
     - `normal_x DOUBLE PRECISION NOT NULL`, `normal_y DOUBLE PRECISION NOT NULL`, `normal_z DOUBLE PRECISION NOT NULL`: Unit surface normal vector components.
     - `rotation_rad DOUBLE PRECISION NOT NULL DEFAULT 0.0`: In-plane sticker rotation in radians $\in [-\pi, +\pi]$.
     - `size_meters DOUBLE PRECISION NOT NULL DEFAULT 0.65`: Sticker height in meters, clamped to the locked Spec 054 envelope $[0.25, 1.00]$.
     - `surface_zone VARCHAR(64) NOT NULL DEFAULT 'alley_wall_left'`: Calibrated surface zone identifier (`alley_wall_left`, `alley_wall_right`, `alley_floor`, `exterior_wall_left`, `exterior_wall_right`, `exterior_floor`).
     - `surface_id VARCHAR(64) NOT NULL DEFAULT 'COLLIDER_STICKER_WALL_L'`: Collider identifier.
     - `surface_label VARCHAR(128) NOT NULL DEFAULT 'Left Alley Wall (Interior)'`: Human-readable surface badge label.
     - `wall_side VARCHAR(16) NOT NULL DEFAULT 'L'`: `'L'`, `'R'`, or `'FLOOR'`.
     - `tagger VARCHAR(64) NOT NULL DEFAULT ''`: Tagger name/handle (trimmed, max 64 characters).
     - `message VARCHAR(280) NOT NULL DEFAULT ''`: Sticker message text (trimmed, max 280 characters).
     - `created_at_ms BIGINT NOT NULL`: Epoch timestamp in milliseconds when first placed.
     - `updated_at_ms BIGINT NOT NULL`: Epoch timestamp in milliseconds of most recent modification.
   - An index on `created_at_ms ASC` must be maintained so `GET /api/stickers` returns placed stickers in deterministic chronological placement order.

---

### 5.2 Pillar 2: HTTP Persistence API Contract in [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py)
1. **CORS & Method Support:**
   - [`SkateAlleyRequestHandler`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py#L453-L500) must include `DELETE` and `PUT` alongside `GET, HEAD, POST, OPTIONS` in `Access-Control-Allow-Methods` so cross-origin requests from `https://luisp1028.github.io` or local ports to the Cloudflare tunnel succeed without preflight rejection.
2. **`GET /api/stickers` — List All Persisted Stickers:**
   - Queries `skatealley_placed_stickers` ordered by `created_at_ms ASC, placed_id ASC`.
   - Returns `HTTP 200 OK` with JSON structure:
     - `ok: true`
     - `storage: "postgres"`
     - `dbConnected: true`
     - `count: <int>`
     - `stickers: [ { placedId, assetId, stickerId, code, anchorPosition: {x,y,z}, position: {x,y,z}, normal: {x,y,z}, rotationRad, size, sizeMeters, surfaceZone, surfaceId, surfaceLabel, wallSide, tagger, message, createdAt, updatedAt }, ... ]`
3. **`POST /api/stickers` (and `PUT /api/stickers`) — Upsert Placed Sticker & Tag/Message Metadata:**
   - Accepts a single sticker payload object (or `{ sticker: { ... } }` / `{ stickers: [ ... ] }` batch).
   - Validates and sanitizes all fields:
     - Verifies `assetId` / `stickerId` is a non-empty string (defaulting unknown IDs only if explicitly omitted, or validating against known catalog IDs).
     - Verifies `anchorPosition`, `position`, and `normal` contain finite numbers (`Number.isFinite`), rejecting `NaN`/`Infinity` with `HTTP 400 Bad Request`.
     - Clamps `size` / `sizeMeters` to $[0.25, 1.00]$ and normalizes `rotationRad` to $[-\pi, +\pi]$.
     - Trims and bounds `tagger` to $\le 64$ characters and `message` to $\le 280$ characters.
   - Executes an atomic PostgreSQL `INSERT INTO skatealley_placed_stickers ... ON CONFLICT (placed_id) DO UPDATE SET ...` so placing a new sticker, updating `"TAGGER:"` and `"MESSAGE:"`, or resizing/rotating/repositioning an existing sticker is 100% idempotent.
   - Returns `HTTP 200 OK` with `{ "ok": true, "storage": "postgres", "sticker": <persistedRecord> }`.
4. **`DELETE /api/stickers/<placedId>` (and `DELETE /api/stickers` with JSON body `{ "placedId": "..." }` or `POST /api/stickers/delete`):**
   - Deletes the specified `placed_id` row from `skatealley_placed_stickers` (supporting both path-parameter `DELETE /api/stickers/<placedId>` and `POST /api/stickers/delete` with JSON body `{ "placedId": "..." }` so environments or proxies that restrict `DELETE` bodies work seamlessly).
   - Returns `HTTP 200 OK` with `{ "ok": true, "deleted": <bool>, "placedId": "<placedId>" }`.
5. **`GET /api/health` Augmentation:**
   - Extends `_serve_health` in [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py#L676-L717) to report `"sticker_db_ready": <bool>`, `"sticker_storage": "postgres"`, and `"persisted_sticker_count": <int>`.

---

### 5.3 Pillar 3: Server SSH Mac (`egg@10.0.0.62`) Container & Boot-Recovery Alignment
1. **Updating `/Users/egg/.local/bin/ensure_docker_and_containers.sh` on `egg@10.0.0.62`:**
   - Update the `skatealley-app-local` container definition and drift check in `/Users/egg/.local/bin/ensure_docker_and_containers.sh` so `skatealley-app-local` is always launched with:
     - `--add-host host.docker.internal:host-gateway`
     - `-e SKATEALLEY_DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/alpha`
   - Synchronize the updated [`scripts/serve_skatealley.py`](file:///Users/diesel/desktop/skatealley/scripts/serve_skatealley.py) and frontend files to `/Users/egg/Desktop/SkateAlley` on `egg@10.0.0.62` and restart/verify `skatealley-app-local` and `skatealley-https-tunnel`.

---

### 5.4 Pillar 4: Client-Side API Endpoint Discovery, Startup Hydration & Real-Time Write-Through
1. **Multi-Origin Sticker API Endpoint Resolution:**
   - The browser client ([`sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js)) must resolve `/api/stickers` candidate origins in priority order:
     1. If served from a local `serve_skatealley.py` origin (`localhost` or `127.0.0.1` on the current `window.location.port`, e.g. `:8080` or `:3002`), try relative `./api/stickers` first.
     2. Next, try the active Cloudflare HTTPS tunnel origin from `sandbox.tunnelConfig.url` (loaded from [`tunnel.json`](file:///Users/diesel/desktop/skatealley/tunnel.json)).
     3. Next, try local fallback ports (`http://localhost:8080/api/stickers`, `http://localhost:3002/api/stickers`, `http://localhost:3000/api/stickers`).
   - This guarantees that whether the user opens the webapp via `http://localhost:8080/`, `http://10.0.0.62:3002/`, `https://<subdomain>.trycloudflare.com/`, or `https://luisp1028.github.io/SkateAlley/`, all sessions read and write to the same PostgreSQL database on `egg@10.0.0.62:5432`.
2. **Collision-Free `placedId` Generation & Idempotent `placeStickerAt()`:**
   - When `placeStickerAt(placeOpts)` in [`holographic_stickers.js`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js#L2616-L2820) creates a new sticker without an explicit `placeOpts.placedId`, it must generate a globally unique ID (e.g., `placed_sticker_<timestampMs>_<randomSuffix>`) rather than a bare `placed_sticker_1` counter that collides across sessions.
   - If `placeStickerAt(placeOpts)` is called with an explicit `placeOpts.placedId` that **already exists** in `placedStickersById`, it must update that existing record's 3D pose, size, normal, `tagger`, and `message` in place (without creating a second mesh or duplicate array entry) and advance `placedCounter` past any numeric suffix.
3. **Automatic Startup Hydration (`sandbox.loadPersistedStickers()`):**
   - During scene initialization (and automatically re-verified once `tunnel.json` and `visualAlleyMesh` / `syncVisualEnvelope` are ready), `sandbox.loadPersistedStickers()` fetches `GET /api/stickers` from the backend (hydrating immediately from a `localStorage` write-through mirror if available, then reconciling authoritatively with the PostgreSQL response from `GET /api/stickers`).
   - For each persisted sticker record returned by PostgreSQL, the client reconstructs the 3D sticker via `holographicStickers.placeStickerAt({ ...record, openPopup: false })` without opening the popup or interrupting the startup camera/character state.
   - Once `visualAlleyMesh` is loaded, `holographicStickers.syncVisualEnvelope(visualAlleyMesh, ...)` ensures all hydrated stickers sit flush against the exact visual wall/floor surface profile.
4. **Immediate Write-Through on Every Sticker Mutation:**
   - **Sticker Placement (`commitStickerPlacement` & `placeStickerAt`):** Whenever a user places a sticker on a wall/floor (or calls `sandbox.placeStickerAt`), the client immediately dispatches an async `POST /api/stickers` upsert with the full spatial record and initial `tagger`/`message` (unless `skipPersist: true` is passed during internal hydration).
   - **Tag & Message Save (`saveStickerTagAndMessage` & `#sticker-tag-form` submit):** Whenever a user submits `"TAGGER:"` and `"MESSAGE:"` in the popup (or calls `sandbox.saveStickerTagAndMessage(placedId, tagger, message)`), the client updates the record in memory, updates `#sticker-saved-readout` and `#sticker-holo-status-pill` (e.g., `SAVED TO POSTGRES // TAGGER: <tagger>`), mirrors to `localStorage`, and dispatches `POST /api/stickers` to persist the updated `tagger` and `message` in PostgreSQL.
   - **Transform & Reposition Mutations (`rotateStickerToDeg`, `rotateStickerByDeg`, `resizeStickerToMeters`, `resizeStickerByStep`, and `commitStickerPlacement` after `repositionSelectedSticker`):** Dispatches a debounced or immediate `POST /api/stickers` upsert so pose/size adjustments persist across reloads.
   - **Sticker Deletion (`deleteSelectedSticker` & `#sticker-delete-btn`):** Immediately removes the 3D mesh, removes the entry from `localStorage`, and dispatches `DELETE /api/stickers/<placedId>` (or `POST /api/stickers/delete`) so the deleted sticker is removed from PostgreSQL.
5. **Observable Sync Telemetry (`sandbox.stickerPersistenceState`):**
   - Expose live telemetry on `sandbox.stickerPersistenceState` (and inside `sandbox.getStickerSystemState()`):
     - `hydrated: <boolean>`
     - `hydrating: <boolean>`
     - `storageBackend: 'postgres' | 'local_fallback' | 'uninitialized'`
     - `dbConnected: <boolean>`
     - `persistedCount: <number>`
     - `pendingWrites: <number>`
     - `lastSyncAt: <number | null>`
     - `lastSyncError: <string | null>`

---

## 6. Operational & Performance Budgets

| Metric / Invariant | Target / Budget | Verification Method |
| :--- | :--- | :--- |
| **`GET /api/stickers` Latency (LAN / Local Server)** | $\le 25\text{ ms}$ (p95) for $\le 200$ stickers | Timed HTTP `GET /api/stickers` against `localhost:8080` and `10.0.0.62:3002` |
| **`GET /api/stickers` Latency (Cloudflare HTTPS Tunnel)** | $\le 250\text{ ms}$ (p95) | Timed HTTP `GET /api/stickers` against `tunnel.json` URL |
| **`POST /api/stickers` Upsert Latency** | $\le 35\text{ ms}$ (LAN) / $\le 280\text{ ms}$ (Tunnel) | Timed HTTP `POST /api/stickers` + PostgreSQL row query |
| **3D Scene Hydration Frame Impact** | Non-blocking async fetch; $< 0.5\text{ ms}$ main-thread instantiation per sticker | `performance.now()` around `loadPersistedStickers()` |
| **Locked Sticker Size Envelope** | $0.25\text{ m} \le \text{size} \le 1.00\text{ m}$ enforced in both client and PostgreSQL API | Attempt out-of-range size in `POST /api/stickers`; verify clamped to $[0.25, 1.00]$ |
| **Field Length Caps** | `tagger` $\le 64$ chars, `message` $\le 280$ chars | Submit strings exceeding caps; verify deterministic truncation |

---

## 7. Edge Cases & Failure-Isolation Boundaries

1. **Hydration Before vs. After `freeman_alley.glb` Load Completion:**
   - Because `fetch('/api/stickers')` runs asynchronously in parallel with `GLTFLoader.load('freeman_alley.glb')`, `loadPersistedStickers()` may resolve either before or after `visualAlleyMesh` is extracted.
   - If hydration resolves first, stickers are placed against the procedural fallback wall profile and then automatically snapped to the exact scanned masonry profile when `syncVisualEnvelope(visualAlleyMesh)` runs upon GLB load. If GLB load finishes first, hydrated stickers immediately use the extracted visual envelope.
2. **Rapid Placement + Tag Save Race Condition:**
   - When a user places a sticker (`POST /api/stickers` #1 with empty `tagger`/`message`) and immediately types `"TAGGER:"` = `"y"` and `"MESSAGE:"` = `"x"` and clicks Save (`POST /api/stickers` #2), an out-of-order network completion must never allow Request #1 to overwrite Request #2's non-empty `tagger`/`message` or newer `updated_at_ms`.
   - Both the client (per-`placedId` monotonic `updatedAt` timestamp) and the PostgreSQL `ON CONFLICT (placed_id) DO UPDATE` clause (`WHERE EXCLUDED.updated_at_ms >= skatealley_placed_stickers.updated_at_ms`) must enforce monotonic timestamp ordering so stale writes never clobber newer tag/message saves.
3. **Delete During In-Flight Upsert:**
   - If a user places a sticker and deletes it before the initial `POST /api/stickers` completes, the client must track a deleted-ID tombstone set so an in-flight upsert response does not re-insert or re-render a deleted sticker, and sequence the `DELETE` after any in-flight `POST` for that `placedId`.
4. **Special Characters, Unicode & SQL Injection Prevention:**
   - `tagger` and `message` strings containing single quotes (`'`), double quotes (`"`), backslashes (`\`), newlines, emojis, or SQL keywords (e.g., `'; DROP TABLE skatealley_placed_stickers; --`) must be handled via parameterized SQL queries (`$1, $2, ...`) on the server and rendered via `textContent` / `.value` (never `innerHTML`) on the client.
5. **Server SSH Mac Reboot or Container Restart:**
   - `/Users/egg/.local/bin/ensure_docker_and_containers.sh` on `egg@10.0.0.62` must verify that `skatealley-app-local` includes `host.docker.internal:host-gateway` and `SKATEALLEY_DATABASE_URL`, recreating the container automatically if configuration drift is detected.

---

## 8. Measurable Acceptance Criteria & `{correct required outputs}`

Implementation is complete and `{sufficient}` only when all of the following gates pass against the live runtime and live PostgreSQL database on `egg@10.0.0.62:5432`:

- **AC-01 (PostgreSQL Table & Server Health on `egg@10.0.0.62`):**
  - `polymarket-postgres` on `egg@10.0.0.62:5432` contains the `skatealley_placed_stickers` table.
  - Both local `http://localhost:8080/api/health` and remote `http://10.0.0.62:3002/api/health` (plus the active `trycloudflare.com` tunnel URL in `tunnel.json`) return `HTTP 200 OK` with `"sticker_db_ready": true` and `"sticker_storage": "postgres"`.
- **AC-02 (End-to-End Sticker + Message/Tagger Persistence Across Sessions):**
  - Placing a sticker on a wall in Session 1 and saving `message: "x"` and `tagger: "y"` persists the row to PostgreSQL on `egg@10.0.0.62:5432`.
  - Closing Session 1 and opening a fresh browser session (Session 2) at the webapp URL automatically loads the sticker from `/api/stickers`, renders its 3D holographic mesh at the exact wall coordinates and normal orientation, and displays `TAGGER: y` and `x` when the sticker is clicked to open `#sticker-holo-popup-panel`.
- **AC-03 (Update & Delete Persistence Across Sessions):**
  - Updating an existing sticker's `"TAGGER:"` / `"MESSAGE:"`, resizing/rotating it, or repositioning it updates the PostgreSQL row and persists across reloads.
  - Deleting the sticker via `#sticker-delete-btn` or `sandbox.deleteSelectedSticker()` deletes the row from PostgreSQL (`DELETE /api/stickers/<placedId>`), and reloading the webapp confirms the sticker does not reappear.
- **AC-04 (Container Drift & Reboot Resilience on `egg@10.0.0.62`):**
  - Running `/Users/egg/.local/bin/ensure_docker_and_containers.sh` on `egg@10.0.0.62` verifies `skatealley-app-local` is running with `host.docker.internal:host-gateway` and live PostgreSQL connectivity without manual intervention.
