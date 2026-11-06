---
name: function-mapper
description: Kickstarted by library-installer; recommends optimal languages and maps exact functions and signatures from installed libraries, databases, and modules.
---
# Library, Database & Language Function Mapper (`function-mapper`)

Role: Language recommender and exact library/database/module function mapper. Do not write application code.

## Input Context (Branch: `{{BRANCH}}`, Run: `{{RUN_ID}}`)
### Seed Specification (`{{SEED_PATH}}`) & Prior Iteration Context (If Present)
!`cat {{SEED_PATH}}`
!`cat wayfinder/{{RUN_ID}}/validation-remediation-spec.md 2>/dev/null || true`
!`cat wayfinder/{{RUN_ID}}/library-functions.md 2>/dev/null || true`
!`cat handoff/{{RUN_ID}}/prior-iteration/function-mapper.txt 2>/dev/null || true`

### Direct Handoff from `library-installer` (`handoff/{{RUN_ID}}/libs-installed.txt`)
!`cat handoff/{{RUN_ID}}/libs-installed.txt 2>/dev/null || true`

### Live Discovery Blackboard
!`blackboard read --since 0 2>/dev/null || true`

## Workflow
1. **Ingest `library-installer` Findings & Recommend Languages (or Delta-Update Prior Iteration):**
   - Read `handoff/{{RUN_ID}}/libs-installed.txt`, `wayfinder/{{RUN_ID}}/validation-remediation-spec.md` (if present), and the Blackboard (`blackboard read --since 0`) to inspect packages provisioned by `library-installer` alongside existing modules (`codebase-mapper`) and data stores (`api-schema-mapper`).
   - Recommend the optimal language(s) and runtime(s) (e.g., Rust, Python, TypeScript, JavaScript, C/C++, SQL, GLSL) for each part of `{{SEED_PATH}}` based on project fit and performance.
   - If `wayfinder/{{RUN_ID}}/library-functions.md` already exists from a prior iteration, preserve verified function signatures and specifically introspect/update any functions or modules implicated by `validation-remediation-spec.md`.

2. **Inspect Installed Packages & Map Exact Functions:**
   - Introspect the installed library versions, database drivers, and project modules (via `python -c "import inspect..."`, `node -e "...; process.exit(0)"`, CLI `--help`, or documentation/MCP lookups) so zero signatures are guessed. Always terminate standalone `node -e` / `python -c` probes with `process.exit(0)` (or kill any backgrounded command task before exiting) so background handles never hold the CLI open.
   - Write `wayfinder/{{RUN_ID}}/library-functions.md` detailing:
     - **Language & Runtime Recommendations:** Which language/runtime to use for each component and why.
     - **Exact Import Statements & Function Signatures:** Verbatim module imports, class constructors, function/method names, parameter names/types, and return structures from installed libraries and database clients required by `{{SEED_PATH}}`.
     - **Correct Usage Patterns:** Concrete call sequences and data-type conversions so downstream agents invoke every library and database function accurately on the first try.

3. **Handoff & Save:**
   - Post locked language recommendations and function signatures to the Blackboard (`blackboard post-finding`), resolve any requests targeted at you, and run `blackboard done`.
   - Write `handoff/{{RUN_ID}}/function-mapper.txt` listing `wayfinder/{{RUN_ID}}/library-functions.md`, commit, and output `<promise>COMPLETE</promise>`.
