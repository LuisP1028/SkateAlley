# Functional Specification 062: End-to-End Pipeline Integration & Parallel Multi-Game Auto-Rigging Orchestration (Stage 5)

## 1. Executive Summary & Architectural Scope

This specification defines the functional requirements, concurrency invariants, operational budgets, failure-isolation boundaries, and live verification criteria for integrating **Stage 5 (Parallel Multi-Game Character Auto-Rigging)** directly into the end-to-end 3D character generation pipeline.

All definitions of `{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, and `{insufficient}` in this specification are governed by [LANGUAGE.md](file:///Users/diesel/desktop/skatealley/LANGUAGE.md).

### 1.1 End-to-End Five-Stage Pipeline Topology

When triggered end-to-end (or resumed from Stage 5 against an existing Google Cloud Storage run), the pipeline executes five sequential stages, with internal parallelism inside Stage 2, Stage 3, and Stage 5:

1. **Stage 1 — User Reference Photo Intake**: Validates 1 to 6 user-uploaded reference photos and uploads raw source slots to `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/01_inputs/`.
2. **Stage 2 — NanoBanana 2 Orthographic View Generation & Normalization**: Generates 6 orthographic views (`4` head views + `2` body views) in parallel waves, normalizes to `2048×2048` RGBA, builds registration diagnostics and `.zip` conditioning bundles, and syncs to `02_orthographic/`.
3. **Stage 3 — Headless Colab GPU 3D Mesh Synthesis (Hunyuan3D)**: Synthesizes textured `head.glb` and `body.glb` meshes (`~40,000` triangles each) and syncs to `03_meshes/head/` and `03_meshes/body/`.
4. **Stage 4 — Lossless `.glb` Head-to-Body Assembly**: Aligns, scales, and grounds `head.glb` onto `body.glb` into a unified `2.000m` character mesh (`character_full.glb`) and `assembly_telemetry.json`, publishing to `03_meshes/assembled/`.
5. **Stage 5 — Parallel Multi-Game Character Auto-Rigging**: Consumes `03_meshes/assembled/character_full.glb` and `03_meshes/assembled/assembly_telemetry.json` once, dispatches the **3 game riggers concurrently in parallel** (**Skate 3**, **GTA: Vice City**, and **Zombies**), publishes all game-ready rigged deliverables to `04_rigged/{skate3,gta,zombies}/`, and commits a consolidated Stage 5 lineage record to `routing_audit.json` locally and in GCS.

---

## 2. Core Pipeline & Concurrency Invariants

### 2.1 Single Shared Pre-Flight Intake (`INV-PARALLEL-INTAKE-01`)
- Before fanning out the 3 parallel game rigging workers, the Stage 5 coordinator must resolve, download (if not already present and SHA-256-verified on local disk), and validate `03_meshes/assembled/character_full.glb` and `03_meshes/assembled/assembly_telemetry.json` **exactly once**.
- Concurrent workers must never simultaneously download or write to the same local cache path (`<output_dir>/meshes/assembled/character_full.glb` or `assembly_telemetry.json`).
- All individual GCS downloads must write to a process- and thread-isolated temporary file path and atomically replace the destination file only after byte-size and cryptographic digest verification succeed.

### 2.2 Strict Parallel Execution Across the 3 Game Riggers (`INV-PARALLEL-RIG-01`)
- Stage 5 must execute the 3 game riggers (**Skate 3**, **GTA: Vice City**, and **Zombies**) **concurrently in parallel**, never sequentially one after another.
- Each parallel branch operates on the shared read-only local `character_full.glb` and writes to strictly disjoint local and remote output namespaces:
  1. **Skate 3 (`skate3`)**:
     - Local staging: `<output_dir>/rigged/skate3/{character_skate3_rigged.glb, rig_telemetry.json}` and `/Users/diesel/desktop/skatealley/skate3_cleanroom/parts/char_{player_slug}.part` + `/Users/diesel/desktop/skatealley/skate3_cleanroom/pack.json`.
     - Remote GCS destination: `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/04_rigged/skate3/{character_skate3_rigged.glb, char_{player_slug}.part, rig_telemetry.json}`.
  2. **GTA: Vice City (`gta`)**:
     - Local staging: `<output_dir>/rigged/gta/{player.dff, player.txd, player.bmp, rig_telemetry.json}` and `/Users/diesel/desktop/skatealley/revcdos/vcbr/luis_player/` + `/Users/diesel/desktop/skatealley/revcdos/gamefiles/` (including the 36 outfit/cutscene mirrors).
     - Remote GCS destination: `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/04_rigged/gta/{player.dff, player.txd, player.bmp, rig_telemetry.json}`.
  3. **Zombies (`zombies`)**:
     - Local staging: `<output_dir>/rigged/zombies/{ai_zombie.mdl, luis_zombies.pk3, rig_telemetry.json}` and `/Users/diesel/desktop/skatealley/nzportable/nzp/{luis_zombies.pk3, models/ai/*.mdl}`.
     - Remote GCS destination: `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/04_rigged/zombies/{ai_zombie.mdl, luis_zombies.pk3, rig_telemetry.json}`.
- Stage 5 telemetry must record per-target start timestamps, end timestamps, and individual elapsed durations alongside overall Stage 5 parallel wall-clock duration, proving concurrent overlap (`overall_elapsed_seconds < sum(target_elapsed_seconds)`).

### 2.3 Race-Free Consolidated Audit Commit (`INV-AUDIT-ATOMIC-01`)
- Parallel rigging workers must not engage in uncoordinated read-modify-write races on `<output_dir>/routing_audit.json` or `gs://<bucket>/players/{player_slug}_{player_id}/runs/{run_id}/routing_audit.json`.
- During parallel Stage 5 orchestration:
  - Each parallel worker uploads its own game deliverables and `rig_telemetry.json` to `04_rigged/<target>/` in GCS and returns its uploaded object metadata and telemetry summary to the Stage 5 coordinator.
  - Once all parallel workers complete, the coordinator performs a single atomic update of `<output_dir>/routing_audit.json` (protected by an exclusive advisory lock and atomic file replacement) and a single upload of the consolidated `routing_audit.json` to GCS.
- When any individual game rigger is invoked standalone outside the parallel coordinator, its update to `<output_dir>/routing_audit.json` must still acquire the advisory lock and perform atomic file replacement so concurrent standalone invocations cannot corrupt or drop entries from `routing_audit.json`.

### 2.4 End-to-End Router Integration (`INV-E2E-STAGE5-01`)
- The primary pipeline router ([`nanobanana_router.py`](file:///Users/diesel/Desktop/Greek/nanobanana_router.py)) must automatically chain Stage 5 parallel auto-rigging immediately after Stage 4 character assembly succeeds whenever `pass_group == "both"` and Stage 4 assembly is active (controllable via `--run-rig` / `--no-run-rig`, defaulting to enabled).
- The router must also support a dedicated Stage 5 / post-assembly execution mode (or direct CLI invocation on [`gcs_rig_intake.py`](file:///Users/diesel/desktop/skatealley/scripts/gcs_rig_intake.py)) so Stage 5 parallel auto-rigging can be executed and verified directly against any existing GCS run (`--gcs-bucket`, `--player-name`, `--player-id`, `--run-id`, `--output-dir`) without re-running Stages 1–4.

---

## 3. Operational & Performance Budgets

All Stage 5 parallel runs on an 8-core, 8 GB macOS host against a full-resolution Stage 4 assembled character (`~80,000` triangles, `~7.4 MB` `.glb`) must satisfy the following physical budgets:

| Operational Metric | Mandatory Target / Budget | Physical Rationale |
| :--- | :--- | :--- |
| **Shared Pre-Flight Intake Latency** | $\le 2.0\text{s}$ (cached) / $\le 8.0\text{s}$ (cold GCS pull) | Single `7.41 MB` `.glb` + `6.6 KB` `.json` download + glTF binary header & SHA-256 verification |
| **Parallel Worker Concurrency** | `3` concurrent workers (`skate3`, `gta`, `zombies`) | Matches the 3 game targets; spawns at most 3 concurrent headless Blender processes (`< 800 MB` total RSS on an 8 GB host) |
| **Parallel Speedup Factor** | `overall_elapsed_seconds < sum(target_elapsed_seconds)` (at least `1.30x` speedup over sequential sum) | Confirms true concurrent execution rather than serialized execution |
| **Total Stage 5 Parallel Wall-Clock Budget** | $\le 25.0\text{s}$ end-to-end (including GCS uploads & audit sync) | Bounded by $\max(T_{\text{skate3}}, T_{\text{gta}}, T_{\text{zombies}}) + T_{\text{intake}} + T_{\text{audit}}$ (`~10–15s` typical) |
| **Redundant Stage 4 `.glb` Downloads** | `0` redundant downloads during parallel fan-out | Pre-flight intake runs once prior to worker dispatch |
| **`routing_audit.json` Lost Updates** | `0` dropped keys across `stage5_rigged` and `gcs_objects` | Guaranteed by single consolidated coordinator commit + advisory file locking |

---

## 4. Edge Cases, Failure Modes & Fail-Fast Isolation

1. **Missing or Unassembled Stage 4 Artifacts in GCS**:
   - If `03_meshes/assembled/character_full.glb` is absent, empty (`0` bytes), fails glTF binary magic validation (`glTF`), or fails SHA-256 parity against `03_meshes/assembled/assembly_telemetry.json`, the Stage 5 coordinator must abort during pre-flight intake (`< 2.0s`) before spawning any of the 3 parallel riggers.
2. **Single-Target Worker Failure Under Parallel Execution**:
   - If any of the 3 parallel game riggers fails (e.g., non-zero Blender exit code, vertex/triangle budget breach, `.abin` animation clip failure, or GCS upload failure), the coordinator must capture the exact target name and diagnostic stack trace, wait for in-flight sibling workers to terminate cleanly, record the failed status in `routing_audit.json` (`stage5_rigging_status = "FAILED"`), and raise a fatal error with per-target diagnostic context (`RULE[user_global]`). Silent fallbacks or partial success masking are strictly prohibited.
3. **Concurrent File System Contention**:
   - Temporary files created during decimation, texture baking, or GCS transfers must use unique per-process/per-thread paths so the 3 parallel riggers never collide in `/tmp` or `<output_dir>`.
4. **Idempotent Re-Execution on Existing GCS Runs**:
   - Re-running Stage 5 parallel auto-rigging against an already-assembled GCS run (such as `nicotest_nt01/runs/run_01`) must deterministically overwrite the `04_rigged/{skate3,gta,zombies}/` objects in GCS, refresh all local game deliverables, and update `routing_audit.json` with valid SHA-256 digests and `stage5_rigging_status = "COMPLETE"` without leaving stale `alleyway` keys or orphaned temporary files.

---

## 5. Observable `{correct required outputs}` & Live Verification Criteria ("Nico" GCS Run)

To consider implementation `{sufficient}`, the system must be verified live against Nico's assembled character in Google Cloud Storage (`gs://3d-banana-player-assets/players/nicotest_nt01/runs/run_01/03_meshes/assembled/character_full.glb`, `player_name="nicotest"`, `player_id="nt01"`, `run_id="run_01"`):

1. **Parallel Execution Proof**:
   - Running the Stage 5 parallel orchestrator against `nicotest_nt01/runs/run_01` dispatches `skate3`, `gta`, and `zombies` concurrently.
   - The returned Stage 5 telemetry JSON contains:
     - `status == "COMPLETE"`
     - `completed_targets == ["skate3", "gta", "zombies"]`
     - `parallel_workers == 3`
     - `overall_elapsed_seconds` strictly less than `targets["skate3"]["elapsed_seconds"] + targets["gta"]["elapsed_seconds"] + targets["zombies"]["elapsed_seconds"]`, with overlapping `[started_at, completed_at]` intervals across all 3 targets.
2. **Remote GCS Object Verification (`gs://3d-banana-player-assets/players/nicotest_nt01/runs/run_01/04_rigged/`)**:
   - All 10 Stage 5 objects exist in GCS with non-zero byte sizes matching local SHA-256 digests:
     - `04_rigged/skate3/character_skate3_rigged.glb`
     - `04_rigged/skate3/char_nicotest.part`
     - `04_rigged/skate3/rig_telemetry.json`
     - `04_rigged/gta/player.dff`
     - `04_rigged/gta/player.txd`
     - `04_rigged/gta/player.bmp`
     - `04_rigged/gta/rig_telemetry.json`
     - `04_rigged/zombies/ai_zombie.mdl`
     - `04_rigged/zombies/luis_zombies.pk3`
     - `04_rigged/zombies/rig_telemetry.json`
3. **Consolidated `routing_audit.json` Verification**:
   - Both `/Users/diesel/Desktop/Greek/outputs/nicotest_run_01/routing_audit.json` and `gs://3d-banana-player-assets/players/nicotest_nt01/runs/run_01/routing_audit.json` contain:
     - `stage5_rigging_status == "COMPLETE"`
     - `stage5_completed_targets == ["skate3", "gta", "zombies"]`
     - `stage5_rigged.skate3`, `stage5_rigged.gta`, and `stage5_rigged.zombies` each marked `"status": "COMPLETE"` with complete `gcs_uris` and `source_assembled_sha256 == "658605cee4c4e53f6438d3f426e019fe47bc648f7d9d6b288d70922513bcae5d"`.
     - `stage5_parallel_summary` recording `overall_elapsed_seconds`, `sum_target_elapsed_seconds`, `speedup_factor`, and per-target timing.
4. **End-to-End Router Integration Verification**:
   - [`nanobanana_router.py`](file:///Users/diesel/Desktop/Greek/nanobanana_router.py) exposes Stage 5 parallel auto-rigging both automatically at the conclusion of Stage 4 (`execute_nanobanana_router(..., run_rig=True)`) and via `run_stage5_character_rigging(...)` for direct GCS run invocation.
