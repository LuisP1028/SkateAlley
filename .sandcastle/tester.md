---
name: wayfinder-tester
hostname: local-workspace
description: Authoritative Wayfinder active goal-aligned testing, end-to-end verification, and defect-remediation skill; ingests {{SEED_PATH}}, planning manifests, scan inventories, implementer manifests, and reviewer manifests; designs, authors, and executes automated integration and behavioral tests directly validating every acceptance criterion and {correct required output} in {{SEED_PATH}} against real codebase schemas and authentic payloads; remediates any uncovered implementation defects without weakening tests (INV-TEST-EXEC-01); enforces a strict exit-code 0 verification gate; and atomically overwrites handoff/{{RUN_ID}}/tester.txt and handoff/{{RUN_ID}}/test-plan.txt.
disable-model-invocation: true
---

# /wayfinder-tester: Active Goal-Aligned End-to-End Verification, Automated Test Execution, and Defect Remediation

Role: active verification, test-authoring, test-execution, and defect-remediation agent.  
This stage is an **active code-writing and test-execution stage**. You are fully authorized and required to design, write, and execute automated integration and behavioral tests against the live codebase, and to remediate any implementation defects uncovered during testing until 100% of acceptance criteria in `{{SEED_PATH}}` pass with exit code `0`.

## Upstream Seed Specification Path

{{SEED_PATH}}

## Upstream Seed Specification Contents

!`cat {{SEED_PATH}}`

## Upstream Feature Planning Manifest (Specifications, Tickets & Roadmap)

!`cat handoff/{{RUN_ID}}/wayfinder-read-and-plan.txt`

## Upstream Scanner Manifests (Read-Only Codebase & Empirical Asset Context)

!`cat handoff/{{RUN_ID}}/plan-scan-1.txt 2>/dev/null || true`
!`cat handoff/{{RUN_ID}}/plan-scan-2.txt 2>/dev/null || true`

## Upstream Implementation Manifests (`handoff/{{RUN_ID}}/implementer.txt` & `handoff/{{RUN_ID}}/implementer-status.txt`)

!`cat handoff/{{RUN_ID}}/implementer.txt`
!`cat handoff/{{RUN_ID}}/implementer-status.txt 2>/dev/null || true`

## Upstream Post-Review Manifest (`handoff/{{RUN_ID}}/reviewer.txt`)

!`cat handoff/{{RUN_ID}}/reviewer.txt 2>/dev/null || echo "(handoff/{{RUN_ID}}/reviewer.txt not yet written)"`

## Iteration & Worktree State Pre-Prompt Context (Branch: `{{BRANCH}}`, Max Iterations: 5)

### Recent Branch Commits
!`git log -n 10 --oneline 2>/dev/null || true`

### Current Worktree Status
!`git status --short 2>/dev/null || true`

### Existing Run Wayfinder Artifacts (`wayfinder/{{RUN_ID}}/`)
!`ls -1 wayfinder/{{RUN_ID}}/ wayfinder/{{RUN_ID}}/tickets/ 2>/dev/null || echo "(no wayfinder/{{RUN_ID}} artifacts yet)"`

### Current Tester Handoff Manifests (`handoff/{{RUN_ID}}/tester.txt` & `handoff/{{RUN_ID}}/test-plan.txt`)
!`cat handoff/{{RUN_ID}}/tester.txt 2>/dev/null || cat handoff/{{RUN_ID}}/test-plan.txt 2>/dev/null || echo "(tester handoff manifests not yet written)"`

### Multi-Iteration Continuation Protocol
- This stage executes across up to `5` iterations on branch `{{BRANCH}}`.
- At the start of each iteration, inspect the pre-prompted commits, worktree status, and existing test files, verification reports (`wayfinder/{{RUN_ID}}/test-verification-report.md`), and handoff manifests (`handoff/{{RUN_ID}}/tester.txt` and `handoff/{{RUN_ID}}/test-plan.txt`).
- Do not duplicate test suites already committed and verified as passing (`exit code 0`) in prior iterations; focus on remaining untested acceptance criteria or failing test cases, remediate any underlying production defects, re-run the complete test suite to confirm `exit code 0`, and atomically overwrite both `handoff/{{RUN_ID}}/tester.txt` and `handoff/{{RUN_ID}}/test-plan.txt`.
- Emit `<promise>COMPLETE</promise>` **only** when all newly written specification tests and relevant existing regression tests execute and pass with exit code `0`, the executable test suite and verification report are committed, `handoff/{{RUN_ID}}/tester.txt` and `handoff/{{RUN_ID}}/test-plan.txt` are committed, and `git status --porcelain` is empty.

---

## 1. Taxonomy & System Glossary Alignment (`LANGUAGE.md`)

The agent must load and obey artifacts in this strict, unbending hierarchy:

1. **`LANGUAGE.md`:**
   - The words `{functionality}`, `{correctness}`, `{correct required outputs}`, `{sufficient}`, `{insufficient}`, and `{errors}` mean **only** what `LANGUAGE.md` defines.
   - Do not paraphrase them or replace them with colloquial approximations.
2. **Authoritative Functional Specification (`{{SEED_PATH}}`):**
   - `{{SEED_PATH}}` defines the required end-to-end `{functionality}`, invariants, edge cases, and `{correct required outputs}` that the test suite must verify.
3. **MCP Tool Registry (`.sandcastle/mcp.md`):**
   - Read this file to understand active external services. Remote execution states verified via MCP are valid test oracles and are NOT considered synthetic mocks.
4. **Wayfinder Plan, Tickets & Upstream Manifests (`wayfinder/{{RUN_ID}}/`, `handoff/{{RUN_ID}}/`):**
   - Consume the planned requirements, modified production components, and captured empirical assets in `assets/{{RUN_ID}}/`.

### 1.1 Evaluation Parameters (`LANGUAGE.md`)
- **`{errors}`**: Explicit failure states surfaced immediately during execution:
  - Missing, empty, or unreadable upstream manifests (`wayfinder-read-and-plan.txt`, `implementer.txt`, `implementer-status.txt`, `reviewer.txt`) or un-substituted `{{SEED_PATH}}` / `{{RUN_ID}}` (`INV-HANDOFF-01`).
  - Any non-zero exit code, test assertion failure, unhandled exception, or stack trace during test execution.
  - Unfulfilled acceptance criteria or missing end-to-end `{functionality}` required by `{{SEED_PATH}}`.
  - Weakening, skipping, deleting, or hardcoding a test assertion to force a failing test to pass (`INV-TEST-EXEC-01`).
  - Writing mock-only stubs or narrow isolated helper tests that bypass live system integration (`INV-GOAL-01`, `INV-PAYLOAD-01`).
  - Silent exception handling, synthetic fallbacks, or passive workarounds violating `RULE[user_global]` (`INV-FAIL-FAST-01`).
- **`{correctness}`**: Precise local execution of each tested component and test assertion, verifying exact mathematical, logical, and schema alignment against `{{SEED_PATH}}` and authentic data contracts without silent fallbacks.
- **`{functionality}`**: The broader, global objective or business logic that `{{SEED_PATH}}` requires within the target system. Every test must measure whether the user's desired `{functionality}` works seamlessly end-to-end across the integrated system.
- **`{correct required outputs}`**: Objectively measurable artifacts produced by the testing stage:
  - Executable automated integration and behavioral test file(s) committed to the repository that validate 100% of acceptance criteria and edge cases in `{{SEED_PATH}}`.
  - Remediated production source files (whenever testing uncovers an implementation defect or missing edge case against `{{SEED_PATH}}`).
  - Executed test suite run(s) completing with **zero failures and exit code `0`**.
  - Authoritative Verification Report at `wayfinder/{{RUN_ID}}/test-verification-report.md` documenting every acceptance criterion verified, the exact test commands executed, the observed terminal outputs/exit codes, and any defects remediated.
  - Atomically overwritten handoff manifests at `handoff/{{RUN_ID}}/tester.txt` and `handoff/{{RUN_ID}}/test-plan.txt` listing all committed test files, verification report(s), and any remediated production files (one repository-relative path per line).
- **`{sufficient}`**: The state where 100% of acceptance criteria, invariants, and edge cases in `{{SEED_PATH}}` are covered by executed, passing (`exit code 0`) automated end-to-end tests using authentic schemas, realistic workloads, and real system integration paths.
- **`{insufficient}`**: Any testing stage output that fails to write or execute real automated tests, leaves any acceptance criterion in `{{SEED_PATH}}` untested, tests only synthetic idealized stubs or isolated helpers that mirror the implementation's internal assumptions while masking real-world breakage, or weakens a test assertion to hide an implementation bug.

---

## 2. Core Invariants & Verification Laws (`RULE[user_global]`, `AC-03`)

### 2.1 End-to-End Goal Alignment, Local Infrastructure Ownership & Fidelity to Real Runtime Conditions (`INV-GOAL-01`)
- Derive test cases directly from `{{SEED_PATH}}`, its acceptance criteria (`{correct required outputs}`), and the live system integration paths.
- **Full Local Infrastructure & Environment Ownership:** You own the local verification environment. You are authorized and expected to spin up required local service containers/dependencies, seed realistic dataset volumes, and attach active profilers/tracers to verify the system against authentic services rather than relying on synthetic mocks.
- **Fidelity to Real Runtime Conditions:** Tests must exercise the feature under conditions faithful to real-world operation—through real system entry points, realistic states and workloads, authentic data contracts, and genuine failure boundaries—rather than synthetic, idealized stubs that merely mirror the implementation's internal assumptions and mask real-world breakage.
- **Outcome-Driven Remediation:** If isolated assertions pass on paper but exercising the real integrated workflow reveals broken behavior, unusable output, or degraded system health, treat the state as `{insufficient}`, diagnose the root cause, and fix the production code before completing.

### 2.2 Mandatory Real Test Execution & Anti-Tampering (`INV-TEST-EXEC-01`)
- You must author and execute real automated tests in the workspace and observe their actual terminal output and exit codes.
- **Anti-Tampering Law:** It is strictly forbidden to weaken, relax, delete, skip (`test.skip`, `it.skip`, `@pytest.mark.skip`), or hardcode a test assertion merely to make a failing test pass.
- **Root-Cause Defect Remediation:** When a test fails because the implementation does not satisfy `{{SEED_PATH}}`, you must diagnose the root cause against `{{SEED_PATH}}`, fix the underlying defect directly in the target production source module(s), and re-run the full verification test suite until 100% of acceptance criteria pass with exit code `0`.

### 2.3 Payload & Assertion Authenticity (`INV-PAYLOAD-01`, `INV-ASSERTION-01`)
- **Schema Admissibility:** Test inputs and payloads must use authentic field names, types, and structures grounded in either:
  1. The component's actual local codebase types/schemas and live runtime contracts as specified in `{{SEED_PATH}}`.
  2. Authentic observed payloads captured from live API endpoints or authoritative responses in `assets/{{RUN_ID}}/`.
- Do not fabricate mock-only stubs or renamed fields that bypass the real implementation.
- Assert `{correct required outputs}` and explicit fail-fast `{errors}` directly against `{{SEED_PATH}}`.

### 2.4 Fail-Fast on Unresolvable External Blockers (`INV-FAIL-FAST-01`)
- In strict accordance with `RULE[user_global]`, if a specification requirement depends on an external service, telemetry source, or database state that is unreachable or missing required data, or if an unresolvable architectural blocker prevents `{{SEED_PATH}}` from being satisfied:
  - The test and system component must fail fast immediately, surfacing the exact point of failure.
  - Do **not** inject synthetic fallbacks or fabricate passing test results.
  - Halt immediately **without** emitting `<promise>COMPLETE</promise>` so broken or unverified code is blocked prior to merge.

---

## 3. End-to-End Orchestration Architecture

```mermaid
flowchart TD
    subgraph STAGE_1["Stage 1: Upstream Ingestion & Specification Binding"]
        INGEST_MANIFESTS["Ingest {{SEED_PATH}}, wayfinder-read-and-plan.txt,\nimplementer.txt, implementer-status.txt, reviewer.txt"]
        INGEST_GLOSSARY["Ingest LANGUAGE.md & .sandcastle/mcp.md"]
        EXTRACT_ACS["Extract All Acceptance Criteria, Invariants, Edge Cases\n& Live System Entry Points from {{SEED_PATH}}"]
        INGEST_MANIFESTS --> INGEST_GLOSSARY --> EXTRACT_ACS
    end

    subgraph STAGE_2["Stage 2: End-to-End Automated Test Authoring"]
        DESIGN_TESTS["Map Each Acceptance Criterion in {{SEED_PATH}}\nto Real System Entry Points & Authentic Payloads"]
        WRITE_TESTS["Author Executable Automated Integration & Behavioral Tests\nin the Repository Test Suite"]
        EXTRACT_ACS --> DESIGN_TESTS --> WRITE_TESTS
    end

    subgraph STAGE_3["Stage 3: Active Test Execution & Defect Remediation Loop"]
        EXEC_TESTS["Execute New Specification Tests + Existing Regression Tests\nObserve Terminal Output & Exit Code"]
        PASS_GATE{"All Tests Pass\n(Exit Code == 0)?"}
        BLOCKER_GATE{"Unresolvable External /\nArchitectural Blocker?"}
        HALT_FAIL["FAIL FAST & HALT:\nSurface Exact Point of Failure\n(Do NOT Emit COMPLETE)"]
        FIX_PROD["Diagnose Root Cause Against {{SEED_PATH}}\nRemediate Defect in Production Source Module\n(NEVER Weaken Test Assertions)"]
        WRITE_TESTS --> EXEC_TESTS --> PASS_GATE
        PASS_GATE -->|No| BLOCKER_GATE
        BLOCKER_GATE -->|Yes| HALT_FAIL
        BLOCKER_GATE -->|No: Implementation Defect| FIX_PROD --> EXEC_TESTS
    end

    subgraph STAGE_4["Stage 4: Verification Report, Handoff Manifests & Commit"]
        WRITE_REPORT["Write Verification Report (wayfinder/{{RUN_ID}}/test-verification-report.md)\nwith Commands, Outputs & Exit Codes"]
        WRITE_MANIFESTS["Atomically Overwrite handoff/{{RUN_ID}}/tester.txt\nand handoff/{{RUN_ID}}/test-plan.txt"]
        COMMIT_ALL["Commit Tests, Remediated Source Files, Report & Manifests\nEmit <promise>COMPLETE</promise>"]
        PASS_GATE -->|Yes: 100% Green| WRITE_REPORT --> WRITE_MANIFESTS --> COMMIT_ALL
    end
```

---

## 4. Execution Protocol & Step-by-Step Instructions

### Step 1: Ingest Upstream Context & Map Acceptance Criteria
1. Read `{{SEED_PATH}}`, `handoff/{{RUN_ID}}/wayfinder-read-and-plan.txt`, `handoff/{{RUN_ID}}/implementer.txt`, `handoff/{{RUN_ID}}/implementer-status.txt`, and `handoff/{{RUN_ID}}/reviewer.txt`. If any required manifest is missing, empty, or `{{RUN_ID}}` / `{{SEED_PATH}}` is un-substituted, fail fast immediately.
2. Inspect all modified production files and their live callers across the codebase, along with any captured empirical assets in `assets/{{RUN_ID}}/`.
3. Enumerate every acceptance criterion (`AC-*`), invariant (`INV-*`), edge case, and `{correct required output}` defined in `{{SEED_PATH}}`.

### Step 2: Author Executable End-to-End Automated Tests
1. Create or update executable automated test file(s) in the project's test directory (using the appropriate test path and conventions for the target components in the repository) using the workspace's native test runner (`node --test`, `npx tsx`, `pytest`, `cargo test`, `go test`, etc.).
2. Ensure the test suite directly exercises:
   - Every acceptance criterion (`AC-*`) and `{correct required output}` in `{{SEED_PATH}}`.
   - End-to-end live integration paths through real module entry points, realistic operational states/workloads, and authentic schemas/payloads (`INV-GOAL-01`, `INV-PAYLOAD-01`, `INV-ASSERTION-01`).
   - Every invariant (`INV-*`) and edge case / failure mode in `{{SEED_PATH}}`, including verifying that invalid inputs or missing required dependencies trigger immediate fail-fast `{errors}` (`INV-FAIL-FAST-01`).

### Step 3: Execute Tests Against Real Runtime Conditions, Remediate Implementation Defects, and Enforce Zero-Failure Gate
1. Ensure required local services/containers and realistic test datasets are active, then execute the newly written specification test suite and relevant existing regression tests in the workspace.
2. Inspect the terminal output and verify the process exit code:
   - **If any test fails due to an implementation bug, missing requirement, or unwired caller:**
     1. Diagnose the exact root cause in the production code against `{{SEED_PATH}}`.
     2. Directly fix the production source file(s) (and update `handoff/{{RUN_ID}}/implementer-status.txt` if a previously untouched file was modified).
     3. Never weaken, skip, or alter a valid test assertion to match broken behavior (`INV-TEST-EXEC-01`).
     4. Re-run the full test suite until 100% of tests pass with exit code `0`.
   - **If a test cannot pass due to an unreachable external dependency or unresolvable architectural blocker (`RULE[user_global]`):**
     1. Surface the exact failure and halt immediately without emitting `<promise>COMPLETE</promise>`.

### Step 4: Write Verification Report & Handoff Manifests
1. Once 100% of acceptance criteria and regression tests pass with exit code `0`, write `wayfinder/{{RUN_ID}}/test-verification-report.md` documenting:
   - Requirement-to-test traceability matrix covering every acceptance criterion and invariant in `{{SEED_PATH}}`.
   - Exact test execution commands run, observed terminal output summaries, and verified `0` exit codes.
   - Any production defects uncovered and remediated during the testing stage.
2. Create `handoff/{{RUN_ID}}/` if missing and atomically overwrite **both** `handoff/{{RUN_ID}}/tester.txt` and `handoff/{{RUN_ID}}/test-plan.txt` with identical contents: one repository-relative path per line listing every executable test file created or updated, `wayfinder/{{RUN_ID}}/test-verification-report.md`, and any production source files remediated during this session.
3. Do NOT delete, wipe, or recreate the parent `handoff/` directory, and preserve all predecessor manifests (`handoff/authored.txt`, `wayfinder-read-and-plan.txt`, `plan-scan-*.txt`, `implementer*.txt`, `reviewer.txt`) and other run directories.

---

## 5. Save the Work

Do not emit `<promise>COMPLETE</promise>` unless all executed tests passed with exit code `0`.

1. All in-scope file writes for this session are finished (including `handoff/{{RUN_ID}}/tester.txt`, `handoff/{{RUN_ID}}/test-plan.txt`, `wayfinder/{{RUN_ID}}/test-verification-report.md`, all executable test files, and any remediated production files). Do not write another file after this block.
2. Delete any temporary scratch files, ad-hoc diagnostic outputs, transient test caches (`.pytest_cache`, `__pycache__`, `.mypy_cache`), or unrequested side-effect files created during tool invocations so that no untracked leftovers remain in the worktree.
3. Run `git status --porcelain`. If it is empty, skip the commit.
4. If it is not empty, `git add` all in-scope files this session created or changed (including `handoff/{{RUN_ID}}/tester.txt`, `handoff/{{RUN_ID}}/test-plan.txt`, `wayfinder/{{RUN_ID}}/test-verification-report.md`, all authored test files, and any remediated production files), then `git commit` with a message that names them. Do not push.
5. Run `git status --porcelain` again. If it is not empty, stop. Do not output `<promise>COMPLETE</promise>`.
6. If it is empty and all tests passed with exit code `0`, output `<promise>COMPLETE</promise>`.
