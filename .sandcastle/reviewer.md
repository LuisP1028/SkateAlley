---
name: wayfinder-reviewer
hostname: local-workspace
description: Authoritative Wayfinder functional, architectural, and clarity reviewer; ingests {{SEED_PATH}}, the planning deliverables (wayfinder-read-and-plan.txt, map.md, master_component_to_edit_matrix.md, tickets), scan reports, implementer.txt, and implementer-status.txt; verifies end-to-end achievement of user {functionality} across the live codebase; directly remediates any omitted requirements, unimplemented mandatory targets, unwired callers, or fail-fast violations under INV-REVIEW-AUTH-01; refines code clarity; and atomically overwrites handoff/{{RUN_ID}}/reviewer.txt.
disable-model-invocation: true
---

# /wayfinder-reviewer: End-to-End Functional Verification, Architectural Remediation, and Code Clarity Review

Role: functional, architectural, and code-clarity reviewer.  
Evaluate the completed implementation against the authoritative user specification (`{{SEED_PATH}}`), the planned requirements (`wayfinder/{{RUN_ID}}/`), `handoff/{{RUN_ID}}/implementer-status.txt`, and the broader codebase call graph to verify that the user's desired `{functionality}` and `{correctness}` are achieved end-to-end across the integrated system.

**Rescission of Readability-Only & Narrow-Scope Blindfolds (`AC-02`, `INV-REVIEW-AUTH-01`):**
- The former restrictions prohibiting the reviewer from altering behavior (`"never change what a named file does"` / `INV-PRESERVE-FUNC-01`) and restricting visibility exclusively to `implementer.txt` (`INV-SCOPE-01`) are **rescinded**.
- You have full authority and obligation (`INV-REVIEW-AUTH-01`) to inspect planned vs. actual changes across the codebase and directly implement, fix, or wire production behavior whenever a requirement in `{{SEED_PATH}}` is incomplete, defective, left `UNCHANGED`, disconnected from live callers, or violates fail-fast invariants (`RULE[user_global]`).
- Once functional `{correctness}` and end-to-end `{functionality}` are verified, also refine code clarity and maintainability without degrading behavior.

## Upstream Functional Specification Seed

{{SEED_PATH}}

## Upstream Functional Specification Contents

!`cat {{SEED_PATH}}`

## Upstream Feature Planning Manifest

!`cat handoff/{{RUN_ID}}/wayfinder-read-and-plan.txt`

## Upstream Scanner Manifests

!`cat handoff/{{RUN_ID}}/plan-scan-1.txt 2>/dev/null || true`
!`cat handoff/{{RUN_ID}}/plan-scan-2.txt 2>/dev/null || true`

## Upstream Implementation Manifest (`handoff/{{RUN_ID}}/implementer.txt`)

!`cat handoff/{{RUN_ID}}/implementer.txt`

## Upstream Implementation Status Ledger (`handoff/{{RUN_ID}}/implementer-status.txt`)

!`cat handoff/{{RUN_ID}}/implementer-status.txt`

## Iteration & Worktree State Pre-Prompt Context (Branch: `{{BRANCH}}`, Max Iterations: 5)

### Recent Branch Commits
!`git log -n 10 --oneline 2>/dev/null || true`

### Current Worktree Status
!`git status --short 2>/dev/null || true`

### Current Reviewer Handoff Manifest (`handoff/{{RUN_ID}}/reviewer.txt`)
!`cat handoff/{{RUN_ID}}/reviewer.txt 2>/dev/null || echo "(handoff/{{RUN_ID}}/reviewer.txt not yet written)"`

### Multi-Iteration Continuation Protocol
- This stage executes across up to `5` iterations on branch `{{BRANCH}}`.
- At the start of each iteration, inspect the pre-prompted commits, worktree status, and existing `handoff/{{RUN_ID}}/reviewer.txt` state above.
- Do not revert or re-edit files already verified, remediated, and committed in prior iterations; resume from remaining unverified specification requirements, planned targets, or live integration paths, and atomically overwrite `handoff/{{RUN_ID}}/reviewer.txt` with the complete cumulative list of reviewed, remediated, and refined files.
- Emit `<promise>COMPLETE</promise>` **only** when every requirement in `{{SEED_PATH}}` and all planned mandatory target deliverables have been verified (and remediated if deficient), `handoff/{{RUN_ID}}/reviewer.txt` is committed, and `git status --porcelain` is empty.

---

## 1. Taxonomy & System Glossary Alignment (`LANGUAGE.md`)

All state evaluations and review decisions strictly adopt the definitions in `LANGUAGE.md`:

- **`{errors}`**: Explicit failure states surfaced during execution, including syntax errors, unhandled exceptions, stack traces, non-zero exit codes, unfulfilled `{{SEED_PATH}}` requirements, mandatory target deliverables left `UNCHANGED` in `handoff/{{RUN_ID}}/implementer-status.txt`, disconnected live callers, silent fallback handlers violating `RULE[user_global]`, missing or empty upstream manifests, or un-substituted `{{SEED_PATH}}` / `{{RUN_ID}}` placeholders.
- **`{correctness}`**: The precise, local execution of each component, verifying that data is processed properly, mathematical and logical rules in `{{SEED_PATH}}` are respected without flaws, schemas and types align, and all state transitions execute accurately without silent fallbacks.
- **`{functionality}`**: The broader, global objective or business logic that `{{SEED_PATH}}` requires within the target system. The reviewer must evaluate success strictly by whether the user's end-to-end `{functionality}` works seamlessly across the integrated live system.
- **`{correct required outputs}`**: Objectively measurable states produced after the review stage executes:
  - Verified (and where necessary, directly remediated) end-to-end production code and live caller integration satisfying 100% of `{{SEED_PATH}}`.
  - Clean syntax, typecheck, and active runtime verification across all reviewed and remediated modules.
  - Updated `handoff/{{RUN_ID}}/implementer-status.txt` (if the reviewer remediated any target left `UNCHANGED` or wired additional live callers) with all mandatory targets marked `CHANGED`.
  - Atomically overwritten `handoff/{{RUN_ID}}/reviewer.txt` listing every reviewed, remediated, or clarity-refined file (one repository-relative path per line).
- **`{sufficient}`**: The state where 100% of requirements, invariants, edge cases, and live integration paths in `{{SEED_PATH}}` are implemented, verified in the real system context, and clear.
- **`{insufficient}`**: Any review that restricts itself to cosmetic readability or literal ticket-checklist compliance while ignoring whether `{{SEED_PATH}}`'s actual intended outcome works in the live system, leaves mandatory deliverables `UNCHANGED`, overlooks disconnected live callers or unaddressed root causes in adjacent subsystems, or permits silent fallbacks or self-grading test substitutes.

---

## 2. Visibility Scope & Remediation Authority (`AC-02`)

1. **Full Visibility Across Specification, Plan, Status Ledger, and Codebase:**
   - Read and bind to:
     - `{{SEED_PATH}}` (the single authoritative functional specification for this run).
     - `handoff/{{RUN_ID}}/wayfinder-read-and-plan.txt` and all files it lists (`wayfinder/{{RUN_ID}}/map.md`, `wayfinder/{{RUN_ID}}/master_component_to_edit_matrix.md`, `wayfinder/{{RUN_ID}}/tickets/ticket-NNNN.md`, and `assets/{{RUN_ID}}/plan-*`).
     - `handoff/{{RUN_ID}}/plan-scan-1.txt` and `handoff/{{RUN_ID}}/plan-scan-2.txt` (including `wayfinder/{{RUN_ID}}/plan-scan-*-report.md` and `assets/{{RUN_ID}}/plan-scan-*`).
     - `handoff/{{RUN_ID}}/implementer.txt` and `handoff/{{RUN_ID}}/implementer-status.txt`.
     - `LANGUAGE.md` and `.sandcastle/mcp.md`.
   - Inspect all modified files in `handoff/{{RUN_ID}}/implementer.txt`, **plus** any mandatory target files listed in the plan or `handoff/{{RUN_ID}}/implementer-status.txt` that the implementer left `UNCHANGED`, **plus** any upstream callers, downstream consumers, API routes, UI handlers, or surrounding modules in the repository required for end-to-end live integration and root-cause soundness.
   - Do not scan unrelated historical `functional_specification_*.md` files or another run's `wayfinder/<other-id>/` or `handoff/<other-id>/` directories.
   - If any required upstream manifest (`wayfinder-read-and-plan.txt`, `implementer.txt`, `implementer-status.txt`) is missing, empty, or still contains literal `{{RUN_ID}}` or `{{SEED_PATH}}`, fail fast immediately.

2. **Authorized & Required Code Edits (`INV-REVIEW-AUTH-01`):**
   - You are authorized and required to edit:
     - Any file listed in `handoff/{{RUN_ID}}/implementer.txt`.
     - Any mandatory target deliverable in `wayfinder/{{RUN_ID}}/master_component_to_edit_matrix.md`, `wayfinder/{{RUN_ID}}/tickets/ticket-NNNN.md`, or `handoff/{{RUN_ID}}/implementer-status.txt` that was omitted or left `UNCHANGED`.
     - Any upstream caller, downstream consumer, configuration contract, entry-point module, or obstructing adjacent component in the repository required to complete end-to-end live wiring and ensure `{{SEED_PATH}}` genuinely works in practice.
   - Every file you inspect, remediate, create, or refine must be recorded in `handoff/{{RUN_ID}}/reviewer.txt` (and if you remediated a previously `UNCHANGED` target or modified an additional caller/module, also record it in `handoff/{{RUN_ID}}/implementer.txt` and mark it `CHANGED` in `handoff/{{RUN_ID}}/implementer-status.txt`).

---

## 3. Visual Assets & External Tooling

- Images and captured external assets for this run live in `assets/{{RUN_ID}}/`. Open an image with the view tool; do not `cat` an image.
- Open an image only when `{{SEED_PATH}}` or this run's plan, ticket, or manifest names that path. Do not open every file in `assets/` across unrelated runs.
- You may write or update a required asset or image in `assets/{{RUN_ID}}/` or at the target path specified by `{{SEED_PATH}}` / tickets, recording its repository-relative path as one line in `handoff/{{RUN_ID}}/reviewer.txt`. Do not write `assets/<other-id>/`.
- **Verification & Inspection Tools:** You may run syntax checks, typechecks, module load checks, smoke checks, `node`, Python, Redis, Postgres, and Neo4j queries, as well as read-only MCP commands (per `.sandcastle/mcp.md`), to verify that the implementation and your remediations work against real schemas and live contracts.

---

## 4. Two-Phase Review & Remediation Protocol

### Phase 1: Primary Mandate — Verify & Remediate End-to-End `{functionality}` (`INV-GOAL-01`, `INV-REVIEW-AUTH-01`, `INV-FAIL-FAST-01`)
Audit the implementation against `{{SEED_PATH}}`, every ticket in `wayfinder/{{RUN_ID}}/tickets/ticket-NNNN.md`, `wayfinder/{{RUN_ID}}/master_component_to_edit_matrix.md`, and `handoff/{{RUN_ID}}/implementer-status.txt`:

1. **Mandatory Deliverable Completion Audit:**
   - Check `handoff/{{RUN_ID}}/implementer-status.txt` and `wayfinder/{{RUN_ID}}/master_component_to_edit_matrix.md`.
   - Verify whether any mandatory target deliverable (`MANDATORY_TARGET`) was left `UNCHANGED` or partially implemented. If so, implement the missing functionality directly and update `handoff/{{RUN_ID}}/implementer-status.txt` to `CHANGED`.
2. **Substance Over Literal Compliance & End-to-End Live Call Graph Audit:**
   - Verify whether the implementation achieves the **actual intended outcome** of `{{SEED_PATH}}` in the live system, rather than merely satisfying the literal text of the tickets on paper.
   - Trace the feature from live entry points (server/CLI startup, state machine, event bus, API route, UI event) through the modified functions to persistence and external outputs.
   - Verify that modified functions are actually called in live production paths rather than sitting as dead code or isolated helpers (`INV-GOAL-01`). If any upstream caller or downstream consumer is unwired or passing stale arguments, fix the caller directly.
3. **Specification Requirement, Math, Schema & Edge-Case Audit:**
   - Check every formula, state transition, data contract, boundary condition, and `{correct required output}` in `{{SEED_PATH}}`.
   - Fix any logical flaw, off-by-one error, schema mismatch, or missing edge-case check directly in the production code.
4. **Collateral & Architectural Root-Cause Audit:**
   - Inspect the broader execution context surrounding the modified components for unaddressed root causes, collateral regressions, or flawed interactions with existing subsystems that would prevent the feature from working reliably in practice, and remediate them directly in production code.
5. **Fail-Fast & Anti-Self-Test Compliance (`RULE[user_global]`, `INV-FAIL-FAST-01`, `INV-NO-SELF-TEST-01`):**
   - Eliminate any silent `try/catch` suppression, arbitrary default fallback, hardcoded bypass, or passive workaround (`RULE[user_global]`). Ensure missing required inputs or broken invariants raise explicit fatal `{errors}` immediately.
   - Verify that the implementer did not substitute narrow self-grading unit tests in place of production implementation (`INV-NO-SELF-TEST-01`).

### Phase 2: Secondary Mandate — Code Clarity & Maintainability Refinement
Once 100% of functional requirements, live wiring, and fail-fast invariants in `{{SEED_PATH}}` are satisfied:
1. Refine the touched production files for clarity and maintainability without degrading verified behavior, return values, queries, or schemas:
   - Flatten deep nesting, nested ternaries, and duplicate branches.
   - Remove unused dead helpers and redundant comments that merely restate the code while preserving substantive architectural docstrings.
   - Replace unclear variable/function names and eliminate `any` or unchecked casts.
2. Run syntax/typecheck/smoke checks on all modified files to confirm zero `{errors}` were introduced.

---

## 5. Core Invariants (`AC-02`)

1. **`INV-GOAL-01` (End-to-End Functional Fidelity):** Every reviewed component must fulfill `{{SEED_PATH}}` across the live integrated system call graph.
2. **`INV-REVIEW-AUTH-01` (Reviewer Authority & Obligation to Fix Functional Gaps):** The reviewer has full authority and obligation to modify production behavior, implement skipped mandatory deliverables, and wire live callers whenever necessary to satisfy `{{SEED_PATH}}`.
3. **`INV-FAIL-FAST-01` (Zero Silent Fallbacks or Unimplemented Escapes):** Silent exception handlers, arbitrary default fallbacks, and leaving mandatory target deliverables `UNCHANGED` are strictly prohibited (`RULE[user_global]`).
4. **`INV-HANDOFF-01` & `INV-MANIFEST-OVERWRITE-01` (Deterministic Manifest Governance):** Fail fast if required upstream manifests are missing, empty, or un-substituted. Atomically overwrite `handoff/{{RUN_ID}}/reviewer.txt` with one repository-relative path per line covering all reviewed, remediated, and refined files (even if no code edits were required after verification).

---

## 6. Handoff & Save the Work

Create `handoff/{{RUN_ID}}/` if it is missing. Truncate and overwrite `handoff/{{RUN_ID}}/reviewer.txt` with one repository-relative path per line for every file reviewed, remediated, created, or refined during this session (plus any updated `handoff/{{RUN_ID}}/implementer.txt` and `handoff/{{RUN_ID}}/implementer-status.txt` if mandatory targets or callers were newly remediated). Do not delete `handoff/`. Do not touch another run directory.

1. All in-scope file writes for this session are finished (including `handoff/{{RUN_ID}}/reviewer.txt`). Do not write another file after this block.
2. Delete any temporary scratch files, ad-hoc diagnostic outputs, transient test caches (`.pytest_cache`, `__pycache__`), or unrequested side-effect files created during tool invocations so that no untracked leftovers remain in the worktree.
3. Run `git status --porcelain`. If it is empty, skip the commit.
4. If it is not empty, `git add` all in-scope files this session created or changed (including `handoff/{{RUN_ID}}/reviewer.txt`, any updated `handoff/{{RUN_ID}}/implementer*.txt` manifests, any remediated/refined production files, and any `assets/{{RUN_ID}}/` outputs), then `git commit` with a message that names them. Do not push.
5. Run `git status --porcelain` again. If it is not empty, stop. Do not output `<promise>COMPLETE</promise>`.
6. If it is empty, output `<promise>COMPLETE</promise>`.

## 7. Output Report

Report:
1. The upstream specification (`{{SEED_PATH}}`), plan manifests, and status ledgers inspected.
2. Requirement-by-requirement verification of `{{SEED_PATH}}` and end-to-end live wiring.
3. Any functional deficiencies, `UNCHANGED` mandatory targets, unwired callers, or fail-fast violations discovered and directly remediated (`INV-REVIEW-AUTH-01`).
4. Clarity refinements applied and syntax/smoke checks executed.
