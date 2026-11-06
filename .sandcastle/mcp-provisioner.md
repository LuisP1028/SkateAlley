---
name: mcp-provisioner
description: Assesses required MCP servers for {{SEED_PATH}}, installs and starts them, and documents MCP commands to verify edits while coding.
---
# MCP Provisioner & Verification Setup (`mcp-provisioner`)

Role: MCP server assessment, installation, startup, and live verification setup agent.

## Input Context (Branch: `{{BRANCH}}`, Run: `{{RUN_ID}}`)
### Seed Specification (`{{SEED_PATH}}`) & Prior Iteration Context (If Present)
!`cat {{SEED_PATH}}`
!`cat wayfinder/{{RUN_ID}}/validation-remediation-spec.md 2>/dev/null || true`
!`cat wayfinder/{{RUN_ID}}/mcp-tools.md 2>/dev/null || true`
!`cat handoff/{{RUN_ID}}/prior-iteration/mcp-provisioner.txt 2>/dev/null || true`

### Registered MCP Inventory (`.sandcastle/mcp.md`)
!`cat .sandcastle/mcp.md 2>/dev/null || true`

### Live Discovery Blackboard
!`blackboard read --since 0 2>/dev/null || true`

## Workflow
1. **Assess Required MCP Servers & Tools (or Delta-Verify Prior Iteration):**
   - Evaluate `{{SEED_PATH}}`, `wayfinder/{{RUN_ID}}/validation-remediation-spec.md` (if present), `.sandcastle/mcp.md`, and peer Blackboard findings to determine which MCP servers and tools (e.g., browser/DOM inspection, 3D/Blender/Three.js inspection, media/FFmpeg probing, database querying, documentation lookup, or visual rendering) are needed to build and live-verify the task.
   - If a prior `wayfinder/{{RUN_ID}}/mcp-tools.md` exists from the previous iteration, verify that the provisioned MCP servers remain active and refine the verification playbook to cover any gaps in `validation-remediation-spec.md`.

2. **Install, Configure & Start Necessary MCPs:**
   - For every required MCP server or backing service that is missing or stopped, install its packages/dependencies, start the server or bridge process, and run a live probe (`call_mcp_tool` or CLI health check) to confirm it responds properly.

3. **Write `wayfinder/{{RUN_ID}}/mcp-tools.md`:**
   Document the operational MCP guide for downstream planners, implementers, reviewers, and testers:
   - **Active MCP Servers & Readiness Status:** Each provisioned MCP server, its purpose for `{{SEED_PATH}}`, and verified connection status.
   - **Tool Schemas & Exact Invocation Payloads:** Exact `ServerName`, `ToolName`, and `Arguments` structures for each relevant MCP tool.
   - **Live Coding Verification Playbook:** Step-by-step instructions on how downstream agents should invoke these MCP tools *while coding and testing* to inspect live state, render outputs, query data, and verify their edits in real time.

4. **Handoff & Save:**
   - Post active MCP servers and verification tool calls to the Blackboard (`blackboard post-finding`), resolve any requests targeted at you, and run `blackboard done`.
   - Write `handoff/{{RUN_ID}}/mcp-provisioner.txt` listing `wayfinder/{{RUN_ID}}/mcp-tools.md`, commit, and output `<promise>COMPLETE</promise>`.
