# Sandcastle Host MCP Registry

This project utilizes Host-Level MCP (Model Context Protocol) servers executed via `agy`. The agents are authorized to interact with external environments according to their strict role boundaries.

## Active MCP Servers
- `google-colab`: Provision and execute remote notebook cells.
- `google-drive`: Manage and read remote files.
- `blender-mcp`: Execute 3D/rendering workflows.
- `postgres`: Execute relational PostgreSQL queries against configured databases.
- `neo4j-cypher`: Inspect Neo4j graph schemas and run Cypher queries.
- `playwright`: Automate and inspect browser state.
- `context7`, `huggingface`, `glbforge`, `threejs-devtools-mcp`, `threejsresources`, `telegram-api-mcp`, `telegram-bot-mcp`: Specialized domain and documentation servers.

## Schema Discovery
Because `agy` lazy-loads tools, do NOT guess parameters. You must read the exact JSON schema for the tool before calling it from the host MCP schema directories:
- `/Users/diesel/.gemini/antigravity-cli/mcp/<serverName>/<toolName>.json`
- `/Users/diesel/.gemini/antigravity-ide/mcp/<serverName>/<toolName>.json`

Example shell inspection:
`cat /Users/diesel/.gemini/antigravity-cli/mcp/<serverName>/<toolName>.json 2>/dev/null || cat /Users/diesel/.gemini/antigravity-ide/mcp/<serverName>/<toolName>.json`

## Role-Based Access Boundaries
1. **Specification & Architecture Planners (`spec-refiner.md`, `planning-coordinator.md`, `architecture-planner.md`, `storage-planner.md`, `stack-planner.md`, `optimization-planner.md`, `visual-planner.md`)**: You may prescribe MCP tool calls as acceptance criteria in decision tickets and architectural blueprints.
2. **Discovery Scanners (`codebase-mapper.md`, `api-schema-mapper.md`, `mcp-provisioner.md`, `library-installer.md`, `function-mapper.md`)**: Strictly read-only reconnaissance (with `mcp-provisioner.md` authorized to start/verify local MCP bridges). You may use read-only MCP tool calls to verify external schemas and capture ground-truth payloads. Never mutate remote state.
3. **Implementers (`implementation-coordinator.md`, `architecture-implementer.md`, `storage-implementer.md`, `stack-implementer.md`, `optimization-implementer.md`, `visual-implementer.md`)**: Active specialist implementers are **authorized** to execute mutating actions via `call_mcp_tool` (e.g., creating files, running remote code) to fulfill ticket requirements. You must log created resource IDs/URLs in your handoff manifest.
4. **Verification & Testers (`verification-coordinator.md`, `architecture-tester.md`, `storage-tester.md`, `stack-tester.md`, `optimization-tester.md`, `visual-tester.md`)**: Authorized to inspect schemas, verify live contracts, poll/verify remote state via MCP, and remediate any unfulfilled ticket requirements or production code defects under `INV-REVIEW-AUTH-01` (avoiding unrequested destructive mutations on external production systems).
5. **End-to-End Validator (`e2e-validator.md`)**: Executes live end-to-end tool verification and MCP inspection without modifying source code.
