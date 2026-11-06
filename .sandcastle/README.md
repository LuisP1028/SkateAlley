# myCastle — 4-Stage Multi-Agent Blackboard Architecture

Domain-agnostic Sandcastle multi-agent pipeline with 4 Blackboard sessions and exclusive file-claim deconfliction:

1. **Stage 1 — Discovery & Specification Refinement (`stage1-discovery`):**
   - Scanners: `codebase-mapper`, `api-schema-mapper`, `mcp-provisioner`, `library-installer`, and kickstarted `function-mapper` (`--kickstart=blackboard|handoff`)
   - Background Listener: `plan-1` (`plan.md`) -> writes `wayfinder/{{RUN_ID}}/refined-specification.md`
2. **Stage 2 — Architecture Planning (`stage2-planning`):**
   - Coordinator: `plan-2` (`plan-scan.md`)
   - Specialist Planners: `planner-2.1` (Architecture & DAG), `planner-2.2` (Storage & Consistency), `planner-2.3` (Stack Usage Guide), `planner-2.4` (Cross-Domain Optimizations), `planner-2.5` (Conditional Visual & Taste Direction)
   - Background Listener: `implementer` -> writes `wayfinder/{{RUN_ID}}/implementation-blueprint.md`
3. **Stage 3 — Production Implementation (`stage3-implementation`):**
   - 1-to-1 Paired Implementers: `implementer-1`..`5` with Blackboard pre-code file claim gates (`FILE_CLAIM_CONFLICT`)
   - Background Listener: `tester` (`reviewer.md`) -> writes `wayfinder/{{RUN_ID}}/verification-blueprint.md`
4. **Stage 4 — Unified Review, Testing & End-to-End Validation (`stage4-testing`):**
   - 1-to-1 Paired Reviewers/Testers: `tester-1`..`5`
   - Background Listener & Solo E2E Validator: `validator` (`validator.md`, `gemini-4-argon-high`) -> listens to `tester-1`..`5`, executes real end-to-end validation on the consolidated code, and either passes (`handoff/{{RUN_ID}}/validated.txt` `STATUS: PASS`) or crafts `wayfinder/{{RUN_ID}}/validation-remediation-spec.md` (`STATUS: FAIL`) to kickstart the next stateful iteration on `planBranch`.
5. **Stage 5 — Final Local Join (`merger`):**
   - Merges verified `planBranch` into `main` locally once `validator` passes.

## Usage

```bash
npx tsx .sandcastle/multi-stage-blackboard-pipeline.mts <seed.md> --kickstart=blackboard [--max-iterations=3]
```
