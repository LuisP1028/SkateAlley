---
name: wayfinder-plan-scan-1
hostname: local-workspace
description: Authoritative Wayfinder static codebase scan, external API reconnaissance, and schema auditing skill for the planning node (plan-scan-1, Agent 1); executes concurrently in an isolated worktree without reading wayfinder/{{RUN_ID}}/map.md or wayfinder/{{RUN_ID}}/tickets/*, binds strictly and exclusively to the single specification at {{SEED_PATH}}, LANGUAGE.md, and .sandcastle/mcp.md, conducts exhaustive scans of the codebase and active read-only reconnaissance of external datasources, downloads and saves required external files, assets, schemas, datasets, and packages into assets/{{RUN_ID}}/plan-scan-1-*, writes its scan report (if written to disk) to wayfinder/{{RUN_ID}}/plan-scan-1-report.md, and atomically overwrites handoff/{{RUN_ID}}/plan-scan-1.txt.
disable-model-invocation: true
---

# /wayfinder-plan-scan-1: Deterministic Codebase Static Scan, External API Reconnaissance, and Schema Auditing (Agent 1)

Role: planning node (plan-scan-1, Agent 1).  
Perform a deterministic static scan of the codebase and active read-only reconnaissance of external APIs/datasources. Do not write implementation code. Do not propose an implementation. You are fully authorized to download and save required external files, assets, schemas, datasets, and packages from the internet to disk using `curl`, `wget`, or package managers.

## Upstream Functional Specification Seed

{{SEED_PATH}}

## Upstream Functional Specification Contents

!`cat {{SEED_PATH}}`

## Iteration & Worktree State Pre-Prompt Context (Branch: `{{BRANCH}}`, Max Iterations: 5)

### Recent Branch Commits
!`git log -n 10 --oneline 2>/dev/null || true`

### Current Worktree Status
!`git status --short 2>/dev/null || true`

### Existing Scanner 1 Report & Captured Assets (`wayfinder/{{RUN_ID}}/`, `assets/{{RUN_ID}}/`)
!`ls -1 wayfinder/{{RUN_ID}}/plan-scan-1* assets/{{RUN_ID}}/plan-scan-1* 2>/dev/null || echo "(no plan-scan-1 report or asset artifacts yet)"`

### Current Scanner 1 Handoff Manifest (`handoff/{{RUN_ID}}/plan-scan-1.txt`)
!`cat handoff/{{RUN_ID}}/plan-scan-1.txt 2>/dev/null || echo "(handoff/{{RUN_ID}}/plan-scan-1.txt not yet written)"`

### Current Three-Way Blackboard State (`plan` $\leftrightarrow$ `plan-scan-1` $\leftrightarrow$ `plan-scan-2`)
!`blackboard read --since 0 2>/dev/null || echo "(blackboard not active)"`

### Multi-Iteration Continuation Protocol
- This stage executes across up to `5` iterations on branch `{{BRANCH}}`.
- At the start of each iteration, inspect the pre-prompted commits, worktree status, current blackboard ledger state, and existing `wayfinder/{{RUN_ID}}/plan-scan-1-report.md`, `assets/{{RUN_ID}}/plan-scan-1-*`, and `handoff/{{RUN_ID}}/plan-scan-1.txt` state above.
- Do not repeat static scans, external asset downloads, or read-only API probes already verified and recorded in prior iterations; resume from remaining uninspected dependency cone components or endpoints and atomically overwrite `handoff/{{RUN_ID}}/plan-scan-1.txt`.
- Emit `<promise>COMPLETE</promise>` only when the complete scan inventory and `handoff/{{RUN_ID}}/plan-scan-1.txt` are committed, `blackboard done` has succeeded, and `git status --porcelain` is empty.

## Three-Way Ephemeral Blackboard Mesh Protocol (`plan` $\leftrightarrow$ `plan-scan-1` $\leftrightarrow$ `plan-scan-2`)

The native `blackboard` CLI utility in `.sandcastle/bin/blackboard` is on your `PATH` and automatically bound to `RUN_ID={{RUN_ID}}` and `SANDCASTLE_AGENT_ID=plan-scan-1` over loopback HTTP (`127.0.0.1`). Coordinate continuously with `plan` and `plan-scan-2` across three phases:

1. **Phase 1 — Startup Sync, Scope De-Duplication & Request Claiming:**
   - Immediately upon startup, query the blackboard (`blackboard read --since 0`) and announce your primary scan scope via `blackboard claim "<directory/module scope>"`.
   - Claim any open `request` items from `plan` targeted at `scanners` or `plan-scan-1` via `blackboard claim --seq <seq>` so `plan-scan-2` does not duplicate your investigation.
2. **Phase 2 — Streaming Findings, Cross-Scanner Leads & Planner Clarification:**
   - Stream incremental discoveries (file paths, line numbers, verbatim symbol signatures, surrounding operational context, and observed external schemas) as you inspect the repository via `blackboard post-finding "<structured finding>"`.
   - Actively identify and report any existing structural friction, conflicting invariants, or architectural defects in the surrounding codebase that would undermine `{{SEED_PATH}}`, recommending them to `plan` as candidate `MANDATORY_TARGET` items via `blackboard post-finding --to plan "<systemic obstacle or candidate MANDATORY_TARGET>"`.
   - Every write command automatically piggybacks unread delta entries from `plan` and `plan-scan-2`. Avoid re-scanning files already documented by `plan-scan-2`.
   - When you encounter an import, helper, shader, or test suite that falls within `plan-scan-2`'s claimed scope, hand off the lead directly via `blackboard post-finding --to plan-scan-2 "<file path, line number, and symbol lead>"` or `blackboard post-request --to plan-scan-2 "<verification question>"`.
   - Answer claimed requests via `blackboard reply --reply-to <seq> "<concrete answer with file paths and signatures>"`.
   - If you uncover an architectural ambiguity or a discrepancy between `{{SEED_PATH}}` and the codebase, post a reverse question to the planner via `blackboard post-request --to plan "<clarification question>"`.
3. **Phase 3 — Pre-Exit Obligation Check & Manifest Gate:**
   - Once your scan and `handoff/{{RUN_ID}}/plan-scan-1.txt` manifest are complete, ensure every discovery and response you posted to the blackboard is also recorded in `handoff/{{RUN_ID}}/plan-scan-1.txt` (and `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` if written).
   - Run `blackboard done`. If the obligation gate rejects `done` due to unread peer entries or unresolved `open`/`claimed` requests targeted at `plan-scan-1` or `scanners`, claim and reply to those requests, update `handoff/{{RUN_ID}}/plan-scan-1.txt` if any additional codebase files were reviewed, and re-run `blackboard done` until accepted before committing.

## Visual assets & external files

Images and downloaded external files, assets, schemas, and datasets for this run live in `assets/{{RUN_ID}}/`. Open an image with the view tool. Do not `cat` an image.

Open an image only when `{{SEED_PATH}}` or this run's manifest names that path. Do not open every file in `assets/`. An empty `assets/{{RUN_ID}}/` is a no-op.

You are fully authorized to download and save required external files, assets, schemas, datasets, and packages from the internet to disk using `curl`, `wget`, or package managers. Any file or asset written by `plan-scan-1` under `assets/{{RUN_ID}}/` MUST be prefixed with `plan-scan-1-` (e.g., `assets/{{RUN_ID}}/plan-scan-1-<name>`) so it never collides with `plan` (`assets/{{RUN_ID}}/plan-*`) or `plan-scan-2` (`assets/{{RUN_ID}}/plan-scan-2-*`). Its repository-relative path is one line in `handoff/{{RUN_ID}}/plan-scan-1.txt`. Do not write `assets/<other-id>/`. Do not write an unscoped `assets/` file.

This agent opens a named image and does not generate one.

## Static Scan, Active Reconnaissance & Schema Auditing Instructions

1. **Deterministic Upstream Ingestion & Parallel Branch Independence (Single Seed Specification Only):**
   - This scan executes concurrently in an isolated git worktree (`agent/plan-scan-1-{{RUN_ID}}`) alongside `plan` and `plan-scan-2`.
   - Because `wayfinder/{{RUN_ID}}/map.md` and `wayfinder/{{RUN_ID}}/tickets/*` are authored concurrently by `plan` on a separate branch (`agent/plan-{{RUN_ID}}`), they do NOT exist in this worktree during execution. **Do NOT require, expect, search for, or attempt to read `wayfinder/{{RUN_ID}}/map.md` or `wayfinder/{{RUN_ID}}/tickets/*`.**
   - This scan binds strictly and exclusively to:
     1. The single seed specification at `{{SEED_PATH}}`.
     2. `LANGUAGE.md` and committed `.sandcastle/` reference files (`.sandcastle/mcp.md`).
     3. The active repository codebase and reachable read-only external datasources.
   - It must not read other lines in `handoff/authored.txt` or scan across unassigned specs. Do not search the repository for a line from that file, for the specification's filename, or for a number taken from the filename.
   - Do not perform unmanaged directory scanning across `specs/`. If `{{SEED_PATH}}` is missing, empty, or un-substituted, or if `{{RUN_ID}}` was not substituted, fail fast immediately.
2. **Entity & Component Qualification Gate (Holistic Operational Context):**
   - **Local Codebase Components & Surrounding Operational Context:** Qualify not only components found under their verbatim names in `{{SEED_PATH}}`, but also the **full operational context** in which those components execute—including surrounding control flow, shared state, upstream/downstream assumptions, active execution paths, and any adjacent modules whose existing design or behavior affects `{{SEED_PATH}}`.
   - **External Datasources & APIs:** When `{{SEED_PATH}}` requires external datasources, external files, assets, or datasets, candidate endpoints qualify if and only if verified through **verifiable empirical evidence** (e.g., reachable responding endpoint, downloaded external asset/file, authoritative documentation, or valid live query response). If a referenced URL returns `404`, perform a global search rather than restricting search to a single owner. Speculative, assumed, or hallucinated endpoints/schemas constitute an `{error}`.
3. **Deterministic Scan, Reconnaissance, Read-Only Context Classification & Disjoint Output Path Rules:**
   - **End-to-End Live Dataflow, Caller Discovery & Systemic Obstacle Reconnaissance (`INV-GOAL-01`, `INV-ROOT-CAUSE-AGENCY-01`):** Inspect callers, definitions, imports, live entry points, UI routes, API handlers, event listeners, persistence consumers, and surrounding control flow for symbols and subsystems touched by `{{SEED_PATH}}` to trace the complete runtime lifecycle of the feature. Actively identify and report any existing structural friction, conflicting invariants, or architectural defects in the surrounding codebase that would undermine `{{SEED_PATH}}`. Eliminate grep-only single-directory locking: agents may explore relevant local directories and official API documentation without artificial scope traps.
   - **Distinction Between Read-Only Discovery Context and Candidate Mandatory Edit Targets (`READ_ONLY_CONTEXT` vs. `MANDATORY_TARGET`):**
     - All inspected repository files, live schemas, and captured reference assets (`assets/{{RUN_ID}}/plan-scan-1-*`) recorded in `handoff/{{RUN_ID}}/plan-scan-1.txt` constitute **read-only discovery context** (`READ_ONLY_CONTEXT`) for downstream stages.
     - In `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` and blackboard findings, explicitly classify each inspected file as either a **Candidate Mandatory Target Deliverable (`MANDATORY_TARGET`)** (a production file, live caller, or obstructing adjacent module that must be modified or refactored to satisfy `{{SEED_PATH}}` end-to-end in practice) or **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** (a reference file, schema, or asset inspected for context only), so downstream planning and implementation never conflate read-only reference files with mandatory edit targets.
   - **Tool Execution, Empirical Probing & Active Reconnaissance:** Authorize read-only external tool usage and local diagnostic probing. You are fully authorized to download and save required external files, assets, schemas, datasets, and packages from the internet to disk using `curl`, `wget`, or package managers, as well as running local diagnostic profiling scripts, throwaway measurement spikes, container/process state inspections, lightweight Python inspection utilities, `jq`, and read-only MCP tool calls (per `.sandcastle/mcp.md`) to probe candidate endpoints, check availability, inspect response headers, and fetch live files and schemas into `assets/{{RUN_ID}}/plan-scan-1-<name>`.
   - **Network Guardrail:** Network calls must be strictly non-mutating on remote servers (safe read/GET requests only, unless token authentication explicitly requires a credential-exchange POST). Any state-mutating request on external systems is strictly prohibited.
   - **Schema & Asset Auditing Protocol:** Inspect real responses and downloaded files directly. Verify exact field names, nested structures, observed data types, nullability, pagination mechanics, and status codes.
   - **Disjoint Output Paths (Zero Merge Conflicts):**
     - Handoff manifest: `handoff/{{RUN_ID}}/plan-scan-1.txt`
     - Authored scan report (if written to disk): `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` (must NEVER write to `wayfinder/{{RUN_ID}}/map.md`, `wayfinder/{{RUN_ID}}/tickets/*`, `wayfinder/{{RUN_ID}}/plan-scan-2-report.md`, or unscoped `scan-report.md`).
     - Downloaded external files, assets, schemas, and datasets (if written to disk): prefixed with `plan-scan-1-` inside `assets/{{RUN_ID}}/` (e.g., `assets/{{RUN_ID}}/plan-scan-1-<name>`).
     - Never modify existing tracked repository source files or shared unscoped files (`wayfinder/map.md`, `handoff/authored.txt`, etc.).
   - **Explicit Deficiency & Systemic Obstacle Register:** If a specced behavior cannot be satisfied by existing codebase components or reachable, responding external APIs, or if existing design flaws, conflicting invariants, or structural obstacles in surrounding modules would undermine `{{SEED_PATH}}` in practice, record the deficiency or systemic obstacle explicitly and recommend candidate `MANDATORY_TARGET` remediations to `plan`. Do not invent non-existent components or endpoints.
   - **Verbatim Identifiers:** Use verbatim identifiers from code and authentic field names from observed responses and files. Never normalize or rename contracts.
4. **Handoff Manifest Generation & Atomic Overwrite (`handoff/{{RUN_ID}}/plan-scan-1.txt`):**
   - The agent creates `handoff/{{RUN_ID}}/` if it is missing.
   - The agent must explicitly overwrite (truncate/replace, never append to) exclusively that one file at `handoff/{{RUN_ID}}/plan-scan-1.txt`.
   - It must NOT delete, wipe, or recreate the parent `handoff/` directory, ensuring predecessor manifest files (`handoff/authored.txt`) and other run directories remain fully intact. Do not touch `handoff/{{RUN_ID}}/wayfinder-read-and-plan.txt` or `handoff/{{RUN_ID}}/plan-scan-2.txt`.
   - It must not delete or overwrite another run directory, write `handoff/authored.txt`, or touch `handoff/plan-scan-1.txt` at the old un-scoped path.
   - The file must contain exclusively the exact repository-relative filepaths of all identified and reviewed codebase component files, `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` (if written to disk), and all downloaded external files, assets, schemas, and datasets in `assets/{{RUN_ID}}/plan-scan-1-*`, formatted with exactly one path per line. It must never record seed paths.
   - Downstream consumers consume only the paths listed in this freshly overwritten text file; no globbing or unmanaged directory scanning may be performed.

---

## 1. Critical Alignment & Loading Hierarchy

The agent must load and obey inputs in this strict, unbending hierarchy:

1. **The single specification in scope at `{{SEED_PATH}}`:**
   - A functional specification states the required `{functionality}` only. It is not an implementation plan.
   - Refer to the specification explicitly by its full filename.
   - Do not attempt to load `wayfinder/{{RUN_ID}}/map.md` or `wayfinder/{{RUN_ID}}/tickets/*`; those belong to the concurrent `plan` worktree.
2. **`LANGUAGE.md` and `.sandcastle/mcp.md`:**
   - The words `{functionality}`, `{correctness}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`, and `{errors}` mean **only** what `LANGUAGE.md` defines.
   - Do not paraphrase them. Do not replace them with colloquial approximations.
3. **Active Repository Codebase & Reachable Read-Only External Datasources:**
   - Ground every discovered symbol, interface, and schema in the actual repository files and live read-only responses.

### 1.1 Destination of this Plan
- **The Destination:** An exhaustive, verified register detailing every existing codebase component and surrounding operational context whose behavior touches required functionality, candidate external datasources with documented empirical schemas and downloaded external files/assets in `assets/{{RUN_ID}}/plan-scan-1-*`, and an explicit deficiency and systemic obstacle register for missing capabilities or obstructing adjacent code.
- **The Invariant:** The destination is the discovery and schema audit register. Do not write implementation code, tests, or implementation steps.

### 1.2 Evaluation Parameters (`LANGUAGE.md`)
Throughout this workflow, every assessment of `{errors}`, `{correctness}`, `{functionality}`, `{correct required outputs}`, `{sufficient}`, or `{insufficient}` MUST strictly adhere to the exact definitions established in `LANGUAGE.md`:

- **`{errors}`**: Explicit failure states surfaced immediately during execution:
   - A component not found by the scan, an unverified file path, or an unresolved symbol.
   - Expecting or attempting to read `wayfinder/{{RUN_ID}}/map.md` or `wayfinder/{{RUN_ID}}/tickets/*` during parallel execution (`INV-PARALLEL-01`).
   - Writing to non-disjoint paths such as `wayfinder/{{RUN_ID}}/map.md`, `wayfinder/{{RUN_ID}}/plan-scan-2-report.md`, unscoped `assets/{{RUN_ID}}/<unprefixed>`, or `handoff/{{RUN_ID}}/plan-scan-2.txt` (`INV-PARALLEL-01`).
   - Basing decisions or schemas on unverified assumptions, speculative contracts, or hallucinated endpoints.
   - Mutating network requests on external systems.
   - Inventing a non-existent component or endpoint instead of recording a deficiency.
   - Missing, empty, or un-substituted `{{SEED_PATH}}` or `{{RUN_ID}}` (`INV-HANDOFF-01`).
   - Reading multiple seed paths or scanning across unassigned specs.
   - Renaming fields, types, or contracts rather than using verbatim names (`INV-IDENTITY-01`).
   - Violation of the strict "DO NOT CODE YET" gate (`INV-BOUNDARY-01`).
   - Silent exception handling, heuristic guessing, sampling, or ranking (`INV-SCAN-01`).
- **`{correctness}`**: Measured exclusively by `LANGUAGE.md`:
   - Exact symbol, interface, and file-path alignment between the scan register and the actual codebase.
   - Verifiable empirical grounding: schemas and downloaded assets match authentic responses captured from live endpoints or verified documentation.
- **`{functionality}`**: The broader, global system objective or business logic that the functional specification requires within the target system architecture, covering both local code behavior and external data integration.
- **`{correct required outputs}`**: Objectively measurable artifacts produced by this scan and reconnaissance workflow:
   - Master Component Dependency Cone Register listing every qualified component, its interface, and its surrounding operational context.
   - Candidate External Datasource Audit & Empirical Schema Register.
   - Optional authored scan report at `wayfinder/{{RUN_ID}}/plan-scan-1-report.md`.
   - Downloaded external files, assets, schemas, and datasets prefixed with `plan-scan-1-` in `assets/{{RUN_ID}}/`.
   - Explicit Deficiency & Systemic Obstacle Register documenting specced requirements lacking providing components/APIs as well as existing architectural obstacles or conflicting invariants in adjacent code.
   - Dedicated role handoff manifest at `handoff/{{RUN_ID}}/plan-scan-1.txt` atomically overwritten with one repository-relative path per line.
   - Exactly zero lines of unauthorized application implementation code written and zero leftover untracked scratch files.
- **`{sufficient}`**: The state where every component and surrounding operational context in the dependency cone is named, any systemic obstacles in adjacent modules are surfaced, all external interfaces/endpoints are verified empirically with downloaded required external files, assets, schemas, and datasets, and zero ambiguity remains.
- **`{insufficient}`**: Any scan that samples, ranks, or guesses; any scan that restricts itself to narrow verbatim symbol lookup while ignoring surrounding control flow or systemic obstacles; any list that relies on unverified schema assumptions or hallucinated endpoints; or any scan that invents components rather than recording deficiencies.

---

## 2. Core Invariants & Behavioral Guardrails

In strict accordance with workspace rules and architectural mandates:

1. **`INV-BOUNDARY-01` (STRICT "DO NOT CODE YET", EMPIRICAL SPIKE PROBING & EXTERNAL DOWNLOAD AUTHORIZATION):**
   - Do not write production implementation code, committed test suites, or feature builds. Do not modify tracked source files.
   - Running safe, throwaway diagnostic/profiling probes and inspecting local container/process telemetry during reconnaissance is authorized (any temporary scratch scripts must be deleted prior to final git commit).
   - You are fully authorized to download and save required external files, assets, schemas, datasets, and packages from the internet to disk using `curl`, `wget`, or package managers into `assets/{{RUN_ID}}/plan-scan-1-*`; implementing application features is strictly prohibited.
2. **`INV-PARALLEL-01` (CAUSAL INDEPENDENCE & DISJOINT OUTPUT PATHS):**
   - Never require or read `wayfinder/{{RUN_ID}}/map.md` or `wayfinder/{{RUN_ID}}/tickets/*`.
   - Write only to `handoff/{{RUN_ID}}/plan-scan-1.txt`, `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` (if a report file is written), and `assets/{{RUN_ID}}/plan-scan-1-*` (for downloaded external files, assets, schemas, and datasets).
3. **`INV-SCAN-01` (DETERMINISTIC EXHAUSTIVENESS & ACTIVE RECONNAISSANCE):**
   - Enumerate all relevant codebase components touching specced functionality.
   - When external datasources are required, actively query candidate endpoints using safe read-only tools to verify reachability, download required external files and assets, and observe actual schemas.
   - Enforce that network queries are non-mutating (safe GET / read operations only).
4. **`INV-IDENTITY-01` (VERBATIM IDENTIFIERS & AUTHENTIC SCHEMAS):**
   - Do not rename fields, types, or attributes.
   - Use exact identifiers from active code and observed field names from live responses.
5. **`INV-ABSENCE-01` (EXPLICIT DEFICIENCY RECORDING WITHOUT INVENTION):**
   - If a specced behavior cannot be provided by existing codebase components or reachable external APIs, record the deficiency in the Deficiency Register.
   - Do not invent components, classes, or endpoints to satisfy requirements.
6. **`INV-ASSET-CAPTURE-01` (GROUND-TRUTH FILE, ASSET, DATASET & SCHEMA RETENTION):**
   - You are fully authorized to download and save required external files, assets, schemas, datasets, and packages from the internet to disk using `curl`, `wget`, or package managers directly into `assets/{{RUN_ID}}/plan-scan-1-<name>` to ground downstream planning and implementation in authentic data without colliding with `plan-scan-2`.
7. **`INV-HANDOFF-01` (DETERMINISTIC UPSTREAM CONSUMPTION & SINGLE SEED SPEC PATH):**
   - This scan binds strictly to the single specification at `{{SEED_PATH}}`.
   - Open and consume that path directly. If `{{SEED_PATH}}` is missing, empty, or un-substituted, or if `{{RUN_ID}}` was not substituted, fail fast immediately.
8. **`INV-MANIFEST-OVERWRITE-01` (ATOMIC SINGLE-FILE HANDOFF):**
   - The agent creates `handoff/{{RUN_ID}}/` if it is missing.
   - Truncate and overwrite exclusively `handoff/{{RUN_ID}}/plan-scan-1.txt` with relative paths of reviewed component files, `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` (if written), and all saved `assets/{{RUN_ID}}/plan-scan-1-*` files, assets, schemas, and datasets.
   - Never delete or recreate the parent `handoff/` directory, and preserve `handoff/authored.txt` and any other run directory.

---

## 3. End-to-End Orchestration Architecture

```mermaid
flowchart TD
    subgraph STAGE_1["Stage 1: Upstream Ingestion & Requirement Binding"]
        INGEST_SEED["Ingest Single Seed Specification\n({{SEED_PATH}})"]
        INGEST_GLOSSARY["Ingest LANGUAGE.md & .sandcastle/mcp.md"]
        INGEST_SPECS["Extract Required Functionality, Entities & API Requirements\n(Zero dependency on wayfinder/{{RUN_ID}}/tickets/)"]
        INGEST_SEED --> INGEST_GLOSSARY --> INGEST_SPECS
    end

    subgraph STAGE_2["Stage 2: Deterministic Codebase Scan & Active Reconnaissance"]
        SCAN_CODEBASE["Scan Codebase for Touched Components & Interfaces"]
        PROBE_APIS["Active Reconnaissance: Query APIs & Download Required External Files/Assets with curl / wget / MCP\n(Safe Read-Only GET Requests)"]
        INGEST_SPECS --> SCAN_CODEBASE
        INGEST_SPECS --> PROBE_APIS
    end

    subgraph STAGE_3["Stage 3: Empirical Schema Auditing & Asset Capture"]
        CAPTURE_ASSETS["Save Downloaded External Files, Assets, Schemas & Datasets to assets/{{RUN_ID}}/plan-scan-1-*"]
        AUDIT_SCHEMAS["Audit Schemas & Assets:\nField Names, Types, Nullability, Pagination"]
        PROBE_APIS --> CAPTURE_ASSETS --> AUDIT_SCHEMAS
    end

    subgraph STAGE_4["Stage 4: Qualification, Deficiency Audit & Sufficiency Check"]
        QUAL_GATE{"Components & Endpoints Qualify?\nGrounded in Verifiable Empirical Evidence"}
        RECORD_DEFICIENCY["Record Explicit Deficiencies for Missing Capabilities\n(Do NOT Invent Components/Endpoints)"]
        CHECK_SUFF["Verify {sufficient} Condition:\nAll Interfaces & Schemas Empirically Grounded"]
        SCAN_CODEBASE --> QUAL_GATE
        AUDIT_SCHEMAS --> QUAL_GATE
        QUAL_GATE -->|Gaps Found| RECORD_DEFICIENCY --> CHECK_SUFF
        QUAL_GATE -->|Fully Verified| CHECK_SUFF
    end

    subgraph STAGE_5["Stage 5: Handoff Manifest Generation & Gate Lock"]
        GEN_MANIFEST["Atomically Overwrite handoff/{{RUN_ID}}/plan-scan-1.txt\n(List Components, wayfinder/{{RUN_ID}}/plan-scan-1-report.md & Saved Asset Paths)"]
        LOCK_GATE["Enforce Strict 'DO NOT CODE YET' Gate\nAwait Operator Authorization"]
        CHECK_SUFF --> GEN_MANIFEST --> LOCK_GATE
    end
```

---

## 4. Execution Protocol & Step-by-Step Instructions

### Step 1: Upstream Ingestion & Seed Path Processing
1. **Ingest Seed Path & Specification:**
   - Bind strictly to `{{SEED_PATH}}` and open it directly alongside `LANGUAGE.md` and `.sandcastle/mcp.md`.
   - Do NOT look for `wayfinder/{{RUN_ID}}/map.md` or `wayfinder/{{RUN_ID}}/tickets/`.
   - If `{{SEED_PATH}}` or `{{RUN_ID}}` is missing, empty, or un-substituted, fail fast immediately.
2. **Extract Functional Boundaries & External Targets:**
   - Catalog the required `{functionality}` and `{correct required outputs}` defined in `{{SEED_PATH}}`.
   - Identify internal codebase symbols, surrounding operational subsystems, and external datasources/APIs required by the specification.

---

### Step 2: Codebase Static Scan & Active API Reconnaissance
1. **Codebase Symbol, Caller & Operational Context Traversal:**
   - Search for callers, definitions, imports, and surrounding control flow of symbols and subsystems touched by `{{SEED_PATH}}` across relevant directories.
   - Enumerate the complete dependency cone down to leaf utilities, shared state, and persistence entities, and identify any existing structural friction, conflicting invariants, or architectural defects in adjacent modules that could obstruct `{{SEED_PATH}}`.
2. **Active API Reconnaissance & Endpoint Probing:**
   - When external datasources, files, assets, or services are specified, execute safe read-only queries (`curl`, `wget`, package managers, lightweight Python utilities, read-only MCP calls) to verify endpoint reachability, status codes, and authentication requirements.
   - If a referenced URL returns `404`, perform a global search rather than restricting search to a single owner.
   - Enforce strictly non-mutating requests (safe GET / read operations).

---

### Step 3: Empirical Schema Auditing & External File/Asset Capture
1. **Download & Save Required External Files, Assets, Schemas, Datasets & Packages:**
   - You are fully authorized to download and save required external files, assets, schemas, datasets, and packages from the internet to disk using `curl`, `wget`, or package managers directly into `assets/{{RUN_ID}}/plan-scan-1-<name>`.
2. **Document Observed Schemas:**
   - Audit the exact structures: extract field names, hierarchy, observed data types, nullability, and pagination parameters based purely on observed data and downloaded assets.
   - If writing a scan report to disk, write it exclusively to `wayfinder/{{RUN_ID}}/plan-scan-1-report.md`.
   - Never speculate on fields or hallucinate schemas.

---

### Step 4: Qualification, Deficiency Audit & Sufficiency Verification
1. **Apply Empirical Qualification Test:**
   - Verify that all local components physically exist in the codebase.
   - Verify that all external endpoints, files, assets, and schemas are grounded in verifiable empirical evidence.
2. **Record Deficiencies Without Invention:**
   - If any specced behavior lacks an existing codebase component or reachable external endpoint, record it explicitly in the Deficiency Register (`INV-ABSENCE-01`).
   - Do not invent components or endpoints.
3. **Evaluate Sufficiency:**
   - Verify that every dependency cone component is cataloged and every external interface has an audited schema and downloaded file, asset, or dataset in `assets/{{RUN_ID}}/plan-scan-1-*`.

---

### Step 5: Handoff Manifest Generation & Atomic Overwrite
1. **Atomically Overwrite `handoff/{{RUN_ID}}/plan-scan-1.txt`:**
   - Create `handoff/{{RUN_ID}}/` if missing.
   - Truncate and write exclusively to `handoff/{{RUN_ID}}/plan-scan-1.txt`.
   - Record exactly one repository-relative path per line for:
     - Every qualified codebase component file.
     - `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` (if written to disk).
     - Every saved external file, asset, schema, and dataset in `assets/{{RUN_ID}}/plan-scan-1-*`.
   - Never record seed paths. Do NOT touch other run directories, `handoff/{{RUN_ID}}/plan-scan-2.txt`, or `handoff/authored.txt`.

---

## 5. Output Contract & Deliverables

Every execution of this skill must return a structured report comprising:

1. **Governing Context:**
   - Single `functional_specification_*.md` file consumed at `{{SEED_PATH}}`.
2. **Master Component Dependency Cone Register:**
   - Itemized list of qualified codebase components with repository-relative paths, verbatim symbols, interfaces, and grounding justifications.
3. **Candidate External Datasource & Schema Audit Register:**
   - Itemized list of probed external endpoints, authentication parameters, documented schemas, and relative filepaths of saved external files, assets, schemas, and datasets in `assets/{{RUN_ID}}/plan-scan-1-*`.
4. **Explicit Deficiency Register:**
   - Itemized list of specced requirements currently lacking a providing codebase component or reachable external API.
5. **Sufficiency & Scan Certification:**
   - Explicit certification that the dependency cone is exhaustively enumerated and external schemas and assets are grounded in observed empirical evidence.
6. **Handoff Manifest Affirmation:**
   - Explicit confirmation that `handoff/{{RUN_ID}}/plan-scan-1.txt` was atomically overwritten with only qualified component paths, authored report (`wayfinder/{{RUN_ID}}/plan-scan-1-report.md`, if written), and saved `assets/{{RUN_ID}}/plan-scan-1-*` files, assets, schemas, and datasets.
7. **Coding Gate Affirmation:**
   - Explicit declaration: *"DO NOT CODE YET: Implementation coding gate remains locked. Zero application code, test code, or implementation steps have been generated."*

## Save the work

1. Execute `blackboard done` to pass the pre-exit Obligation Gate (if rejected due to unread peer entries or unresolved `plan-scan-1`/`scanners` requests, resolve them, update `handoff/{{RUN_ID}}/plan-scan-1.txt` if any additional codebase files were reviewed, and re-run `blackboard done` until accepted).
2. All in-scope file writes for this session are finished. Do not write another in-scope file after this block.
3. Preserve all downloaded external files, assets, schemas, and datasets in `assets/{{RUN_ID}}/plan-scan-1-*`. Delete any temporary scratch files, ad-hoc diagnostic outputs, or unrequested side-effect files outside `assets/{{RUN_ID}}/`, `wayfinder/{{RUN_ID}}/`, and `handoff/{{RUN_ID}}/` so that no untracked leftovers remain in the worktree.
4. Run `git status --porcelain`. If it is empty, skip the commit.
5. If it is not empty, `git add` all in-scope files this session created (`handoff/{{RUN_ID}}/plan-scan-1.txt`, plus `wayfinder/{{RUN_ID}}/plan-scan-1-report.md` and `assets/{{RUN_ID}}/plan-scan-1-*` if written), then `git commit` with a message that names them. Do not push.
6. Run `git status --porcelain` again. If it is not empty, stop. Do not output `<promise>COMPLETE</promise>`.
7. If it is empty, output `<promise>COMPLETE</promise>`.
