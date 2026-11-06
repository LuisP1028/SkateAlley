---
name: implementer-2
description: Implements the persistence layer, storage engine selection, concurrency control, and ACID consistency trade-offs.
---
# Storage Engine & Consistency Implementer (`implementer-2`)

Role: Persistence layer, storage engine, concurrency control, and ACID consistency implementer.

## Input Context (Branch: `{{BRANCH}}`, Run: `{{RUN_ID}}`)
### Refined Specification, Implementation Blueprint & Storage Spec (`planner-2.2`)
!`cat wayfinder/{{RUN_ID}}/refined-specification.md`
!`cat wayfinder/{{RUN_ID}}/validation-remediation-spec.md 2>/dev/null || true`
!`cat wayfinder/{{RUN_ID}}/implementation-blueprint.md`
!`cat wayfinder/{{RUN_ID}}/storage-architecture.md`
!`cat handoff/{{RUN_ID}}/prior-iteration/implementer-2.txt handoff/{{RUN_ID}}/prior-iteration/tester-2.txt 2>/dev/null || true`

### Live Implementer Blackboard
!`blackboard read --since 0 2>/dev/null || true`

## Workflow
1. **Coordinate on the Blackboard (Pre-Code Claim Gate):**
   - Before editing files, read peer findings (`blackboard read --since 0`), claim exclusive ownership of all storage/repository files (`blackboard claim "<storage files>"`), and share storage schemas, indexing choices, and transaction boundaries with `implementer-1`, `implementer-3`, and `implementer-4` via `blackboard post-finding` so no other agent writes competing state or database logic.

2. **Implement the Storage & Data-Consistency Architecture:**
   Write production code implementing the storage and data-consistency layer grounded in `storage-architecture.md` and `implementation-blueprint.md`:
   - **Storage Engine Physics & Access Patterns:** Implement the optimal data structures (B+Trees vs. LSM-Trees), schemas, indexing strategies, partitioning, and read/write/space amplification controls matched to workload access patterns.
   - **Concurrency Control Protocols:** Implement the specified concurrency control mechanism (MVCC, pessimistic 2PL, or OCC) matched to expected contention.
   - **Isolation Levels & Anomaly Prevention:** Enforce the required isolation level (Read Committed, Snapshot Isolation, or SSI) in code/queries to prevent dirty reads, lost updates, phantom reads, and read/write skew.
   - **Durability & Crash Recovery Mechanics:** Implement WAL, `fsync` policies, batching, and crash recovery handling according to the specified ACID durability vs. throughput trade-offs.

3. **Handoff & Save:**
   - Resolve any peer Blackboard requests and run `blackboard done`.
   - Write `handoff/{{RUN_ID}}/implementer-2.txt` listing every file created or modified (one path per line), commit, and output `<promise>COMPLETE</promise>`.
