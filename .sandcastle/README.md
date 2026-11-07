# myCastle — 4-Stage Multi-Agent Blackboard Architecture

Domain-agnostic Sandcastle multi-agent pipeline with 4 Blackboard sessions and exclusive file-claim deconfliction:

1. **Stage 1 — Discovery & Specification Refinement (`stage1-discovery`):**
   - Scanners: `codebase-mapper`, `api-schema-mapper`, `mcp-provisioner`, `library-installer`, and kickstarted `function-mapper` (`--kickstart=blackboard|handoff`)
   - Background Listener: `spec-refiner` (`spec-refiner.md`) -> writes `wayfinder/{{RUN_ID}}/refined-specification.md`
2. **Stage 2 — Architecture Planning (`stage2-planning`):**
   - Coordinator: `planning-coordinator` (`planning-coordinator.md`)
   - Specialist Planners: `architecture-planner` (Architecture & DAG), `storage-planner` (Storage & Consistency), `stack-planner` (Stack Usage Guide), `optimization-planner` (Cross-Domain Optimizations), `visual-planner` (Conditional Visual & Taste Direction)
   - Background Listener: `implementation-coordinator` (`implementation-coordinator.md`) -> writes `wayfinder/{{RUN_ID}}/implementation-blueprint.md`
3. **Stage 3 — Production Implementation (`stage3-implementation`):**
   - 1-to-1 Paired Implementers: `architecture-implementer`, `storage-implementer`, `stack-implementer`, `optimization-implementer`, `visual-implementer` with Blackboard pre-code file claim gates (`FILE_CLAIM_CONFLICT`)
   - Background Listener: `verification-coordinator` (`verification-coordinator.md`) -> writes `wayfinder/{{RUN_ID}}/verification-blueprint.md`
4. **Stage 4 — Unified Review, Testing & End-to-End Validation (`stage4-testing`):**
   - 1-to-1 Paired Reviewers/Testers: `architecture-tester`, `storage-tester`, `stack-tester`, `optimization-tester`, `visual-tester`
   - Background Listener & Solo E2E Validator: `e2e-validator` (`e2e-validator.md`) -> listens to the specialist testers, executes real end-to-end validation on the consolidated code, and either passes (`handoff/{{RUN_ID}}/validated.txt` `STATUS: PASS`) or crafts `wayfinder/{{RUN_ID}}/validation-remediation-spec.md` (`STATUS: FAIL`) to kickstart the next stateful iteration on `planBranch`.
5. **Stage 5 — Final Local Join (`branch-merger`):**
   - Merges verified `planBranch` into `main` locally once `e2e-validator` passes (`branch-merger.md`).

## Usage

```bash
npx tsx .sandcastle/multi-stage-blackboard-pipeline.mts <seed.md> --kickstart=blackboard [--max-iterations=3]
```
