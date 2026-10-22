---
name: system-glossary-evaluation-parameters
hostname: local-workspace
description: A comprehensive glossary defining the strict evaluation parameters used for assessing code errors, correctness, functionality, and documentation sufficiency within the system.
---

# Evaluation Parameters

## {errors}
- Explicit failure states or structural invariant breaches surfaced during the planning, execution, or verification of a component.
- **Qualifiers:** Stack traces, syntax errors, unhandled exceptions, compilation failures, non-zero exit codes, fatal timeouts, severe warnings that halt execution, silent exception suppression or arbitrary default fallbacks (`RULE[user_global]`), disconnected dead-code helpers, or unfulfilled specification requirements.

## {correctness}
- The precise execution and contract fidelity of a component within its operational context, verifying that it performs its designated task without logical, mathematical, or state-transition flaws and without silent fallbacks, even if no explicit `{errors}` are thrown.
- **Qualifiers:** The code processes data properly, math and domain invariants are accurate, loops and state transitions terminate deterministically, schemas/types are respected across upstream and downstream callers, and root causes are addressed directly rather than masked.

## {functionality}
- The broader, global objective or business logic the component is meant to achieve within the larger integrated system under real-world runtime conditions.
- **Qualifiers:** Does the outcome genuinely solve the user's problem end-to-end across the live system call graph? Does it integrate seamlessly with surrounding subsystems and operate reliably within real-world physical, scale, and operational constraints rather than only passing synthetic checks on paper?

## {correct required outputs}
- The exact, literal expected state and observable system behavior after a component executes successfully in its real runtime context. This must be objectively measurable.
- **Qualifiers:** Specific terminal log messages, exact return values (e.g., true, null), precise file or persistence state changes (e.g., "generates a file named data.json containing 5 specific keys"), verified live telemetry metrics, or specific API response codes (e.g., 200 OK).

## {sufficient}
- The state of documentation, planning, or verification where zero ambiguity remains, architectural root causes and surrounding system dependencies are accounted for, physical and runtime feasibility is empirically grounded, and the coding assistant can implement and verify the end-to-end `{functionality}` without guessing, inventing workarounds, or relying on synthetic mocks.
- **Qualifiers:** All necessary file structures, live caller wiring, and root-cause remediations in adjacent modules are provided; dependencies and operational budgets are empirically verified; step-by-step logic and edge cases are clearly outlined; and the `{correct required outputs}` are established.

## {insufficient}
- The state of documentation, planning, or verification where critical context is missing, ambiguous, physically unfeasible, or restricted to superficial symptoms, requiring the assistant to make assumptions, ignore surrounding systemic obstacles, or rely on narrow stubs.
- **Qualifiers:** Missing file schemas, undefined variables, vague instructions (e.g., "make it look better"), unverified throughput/latency assumptions, omitted live caller integration, unaddressed root causes in adjacent modules, missing error-handling parameters, or lack of context regarding how a component interacts with the broader codebase.