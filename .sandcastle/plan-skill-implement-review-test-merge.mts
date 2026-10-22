import { execFileSync } from "node:child_process";
import {
    appendFileSync,
    chmodSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "@ai-hero/sandcastle";
import type { AgentProvider } from "@ai-hero/sandcastle";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";

// Ultra path: agy runs on the host so the macOS keychain session is used.
// Do not set GEMINI_API_KEY or modelProvider=gemini. That switches off Ultra.
// Run with: npx tsx .sandcastle/plan-skill-implement-review-test-merge.mts
//
// handoff/authored.txt must already be committed on main.
// Start this script from main. The merger runs in that folder.
// One registered specification path is one seed. Seeds run one at a time.
// Each seed is plan and both scans, implement, review, test, then merge.
// The next seed is copied from the open project after that merge.
// Each run uses new branch names, so old copies are not reopened.
// The merger joins this run into the open project. Do not pass TARGET_BRANCH.
// Model slugs come from `agy models`. A display name fails the run.
// Within one seed, the planner and both scanners stay parallel.
// Transient git/config/worktree/ref locks are retried, not treated as immediate failure.
// Each run waits 25 minutes of silence before Sandcastle's idle timeout fires.

export const IDLE_TIMEOUT_SECONDS = 25 * 60;
export const MAX_ITERATIONS = 5;

export const HIGH_REASONING_MODELS = new Set([
    "gemini-4-argon-high",
    "gemini-3.8-flash-high",
]);

export const STAGE_MODELS = {
    plan: "gemini-4-argon-high",
    "plan-scan-1": "gemini-3.8-flash-high",
    "plan-scan-2": "gemini-3.8-flash-high",
    implement: "gemini-4-argon-high",
    review: "gemini-4-argon-high",
    tester: "gemini-4-argon-high",
    merger: "gemini-3.8-flash-high",
} as const;

export interface ImplementerStatusRecord {
    path: string;
    status: "CHANGED" | "UNCHANGED" | "READ_ONLY_CONTEXT";
    reference: string;
}

export function buildSequentialStages(runId: string) {
    if (!runId || typeof runId !== "string" || runId.trim().length === 0) {
        throw new Error("buildSequentialStages requires a non-empty runId.");
    }
    return [
        {
            name: "implement",
            promptFile: "./.sandcastle/implementer.md",
            model: STAGE_MODELS.implement,
            manifests: [
                `handoff/${runId}/implementer.txt`,
                `handoff/${runId}/implementer-status.txt`,
            ],
        },
        {
            name: "review",
            promptFile: "./.sandcastle/reviewer.md",
            model: STAGE_MODELS.review,
            manifests: [`handoff/${runId}/reviewer.txt`],
        },
        {
            name: "tester",
            promptFile: "./.sandcastle/tester.md",
            model: STAGE_MODELS.tester,
            manifests: [
                `handoff/${runId}/tester.txt`,
                `handoff/${runId}/test-plan.txt`,
            ],
        },
    ] as const;
}

export const REQUIRED_SANDCASTLE_FILES = [
    ".gitignore",
    "LANGUAGE.md",
    ".sandcastle/bin/grep",
    ".sandcastle/bin/blackboard",
    ".sandcastle/mcp.md",
    ".sandcastle/plan.md",
    ".sandcastle/plan-scan-1.md",
    ".sandcastle/plan-scan-2.md",
    ".sandcastle/plan-scan.md",
    ".sandcastle/implementer.md",
    ".sandcastle/reviewer.md",
    ".sandcastle/tester.md",
    ".sandcastle/merger.md",
] as const;

const TRANSIENT_CACHE_NAMES = new Set([
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".DS_Store",
    ".coverage",
    "scratch",
    ".scratch",
]);

export type BlackboardAgentId = "plan" | "plan-scan-1" | "plan-scan-2";
export type BlackboardTarget = "all" | "scanners" | "plan" | "plan-scan-1" | "plan-scan-2";
export type BlackboardEntryType = "finding" | "request" | "claim" | "response";
export type BlackboardRequestStatus = "open" | "claimed" | "resolved" | "unfulfillable";
export type BlackboardAgentStatus = "active" | "done" | "settled" | "terminated";

export const BLACKBOARD_AGENTS: readonly BlackboardAgentId[] = [
    "plan",
    "plan-scan-1",
    "plan-scan-2",
] as const;

export const BLACKBOARD_TARGETS: readonly BlackboardTarget[] = [
    "all",
    "scanners",
    "plan",
    "plan-scan-1",
    "plan-scan-2",
] as const;

export interface BlackboardEntry {
    seq: number;
    timestamp: string;
    sender: BlackboardAgentId;
    target: BlackboardTarget;
    type: BlackboardEntryType;
    content: string;
    replyTo?: number | null;
    status?: BlackboardRequestStatus;
    claimedBy?: BlackboardAgentId | null;
    resolvedBy?: BlackboardAgentId | null;
    responseSeq?: number | null;
}

export interface BlackboardParticipantState {
    agent: BlackboardAgentId;
    status: BlackboardAgentStatus;
    lastSeenSeq: number;
    updatedAt: string;
}

export interface BlackboardEventRecord {
    eventId: number;
    timestamp: string;
    kind: string;
    actor?: BlackboardAgentId | "orchestrator";
    seq?: number;
    detail: Record<string, unknown>;
}

export interface BlackboardSnapshot {
    runId: string;
    url: string;
    port: number;
    startedAt: string;
    stoppedAt: string | null;
    lastSeq: number;
    participants: Record<BlackboardAgentId, BlackboardParticipantState>;
    entries: BlackboardEntry[];
    events: BlackboardEventRecord[];
}

export interface ActiveRunState {
    runId: string;
    planBranch: string;
    scanBranch1: string;
    scanBranch2: string;
    scan1MergedIntoPlan: boolean;
    scan2MergedIntoPlan: boolean;
    planMergedAndVerifiedOnMain: boolean;
    blackboard?: BlackboardServer | null;
}

let activeRunState: ActiveRunState | null = null;

// Define the absolute path to the bin directory where the grep and blackboard shims live
export const SHIM_BIN_DIR = resolve(process.cwd(), ".sandcastle", "bin");

export const GREP_SHIM_CONTENT = `#!/usr/bin/env bash
# Auto-generated Sandcastle POSIX-compatible grep shim
# Prevents agents from hanging by respecting .gitignore on recursive searches while preserving POSIX/BSD grep flags

# 1. Locate the real system grep (bypassing this shim) to avoid infinite fork loops
REAL_GREP="/usr/bin/grep"
if [ ! -x "$REAL_GREP" ]; then
    REAL_GREP=$(PATH=$(getconf PATH 2>/dev/null || echo "/usr/bin:/bin") command -v grep || echo "/usr/bin/grep")
fi

# 2. Detect whether grep was invoked with recursive directory flags (-r, -R, --recursive, -d recurse)
IS_RECURSIVE=0
 prev_arg=""
for arg in "$@"; do
    if [[ "$arg" == "--" ]]; then
        break
    fi
    if [[ "$prev_arg" == "-d" || "$prev_arg" == "--directories" ]] && [[ "$arg" == "recurse" ]]; then
        IS_RECURSIVE=1
        break
    fi
    case "$arg" in
        --recursive|--directories=recurse)
            IS_RECURSIVE=1
            break
            ;;
        -[!-]*)
            # Short flag cluster (e.g. -r, -rn, -RnE); ignore values attached to -e/-f/-m/-A/-B/-C/-d
            short_flags="\${arg#-}"
            case "$short_flags" in
                e*|f*|m*|A*|B*|C*|d*) ;;
                *r*|*R*)
                    IS_RECURSIVE=1
                    break
                    ;;
            esac
            ;;
    esac
    prev_arg="$arg"
done

# If not a recursive search (e.g. grepping an explicit file or stdin pipe), execute real grep directly
if [[ "$IS_RECURSIVE" -eq 0 ]]; then
    exec "$REAL_GREP" "$@"
fi

# 3. Parse .gitignore to build exclusion flags for recursive grep (honoring !-negated file patterns)
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
EXCLUDES=("--exclude-dir=.git" "--exclude-dir=node_modules" "--exclude-dir=.venv" "--exclude-dir=__pycache__")

if [ -f "$GIT_ROOT/.gitignore" ]; then
    NEGATED="|"
    while IFS= read -r line || [[ -n "$line" ]]; do
        line="\${line%$'\\r'}"
        line="\${line#"\${line%%[![:space:]]*}"}"
        line="\${line%"\${line##*[![:space:]]}"}"
        if [[ "$line" == \\!* ]]; then
            neg_base=$(basename "\${line#!}")
            [[ -n "$neg_base" ]] && NEGATED="\${NEGATED}\${neg_base}|"
        fi
    done < "$GIT_ROOT/.gitignore"

    while IFS= read -r line || [[ -n "$line" ]]; do
        line="\${line%$'\\r'}"
        line="\${line#"\${line%%[![:space:]]*}"}"
        line="\${line%"\${line##*[![:space:]]}"}"
        [[ -z "$line" || "$line" == \\#* || "$line" == \\!* ]] && continue
        clean_name=$(basename "\${line%/}")
        [[ -z "$clean_name" || "$clean_name" == "." || "$clean_name" == ".." ]] && continue
        [[ "$NEGATED" == *"|\${clean_name}|"* ]] && continue

        if [[ "$line" == */ ]]; then
            EXCLUDES+=("--exclude-dir=$clean_name")
        elif [[ "$line" == *.* ]]; then
            EXCLUDES+=("--exclude=$clean_name")
        else
            EXCLUDES+=("--exclude-dir=$clean_name" "--exclude=$clean_name")
        fi
    done < "$GIT_ROOT/.gitignore"
fi

# 4. Execute the system grep with the injected exclusions
exec "$REAL_GREP" "\${EXCLUDES[@]}" "$@"
`;

export const BLACKBOARD_SHIM_CONTENT = `#!/usr/bin/env node
// Auto-generated Sandcastle Three-Way Ephemeral Blackboard CLI shim
// Communicates strictly over loopback HTTP (127.0.0.1) without touching Git worktrees or Ultra keychain auth.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const VALID_AGENTS = new Set(["plan", "plan-scan-1", "plan-scan-2"]);
const VALID_TARGETS = new Set(["all", "scanners", "plan", "plan-scan-1", "plan-scan-2"]);

function printUsage() {
    const usage = [
        "Usage: blackboard <command> [options] [content...]",
        "",
        "Commands:",
        "  post-finding [--to <target>] <content>       Publish a finding (default --to all)",
        "  post-request --to <target> <content>         Publish a request to scanners|plan|plan-scan-1|plan-scan-2|all",
        "  claim [--seq <seq>] [content]                Claim an open request (--seq) or announce a directory/module scan scope",
        "  reply --reply-to <seq> <content>             Publish a response resolving request <seq>",
        "  read [--since <seq>] [--wait <sec>]          Read ledger entries since <seq> (default 0) with optional bounded long-poll",
        "  wait-request --seq <seq> [--wait <sec>]      Block until request <seq> resolves or target peer(s) are no longer active",
        "  wait-scanners [--since <seq>] [--wait <sec>] Block until both plan-scan-1 and plan-scan-2 reach done/settled/terminated",
        "  done                                         Mark calling agent done (enforces unread & open-request Obligation Gate)",
        "  status                                       Read unread delta and current peer/request statuses",
    ].join("\\n");
    console.log(usage);
}

function parseArgs(argv) {
    const positional = [];
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--help" || arg === "-h") {
            flags.help = true;
        } else if (arg === "--json") {
            flags.json = true;
        } else if (arg === "--unread") {
            flags.unread = true;
        } else if (arg.startsWith("--") && arg.includes("=")) {
            const idx = arg.indexOf("=");
            const key = arg.slice(2, idx);
            const val = arg.slice(idx + 1);
            flags[key] = val;
        } else if (
            arg === "--to" ||
            arg === "--target" ||
            arg === "--seq" ||
            arg === "--reply-to" ||
            arg === "--since" ||
            arg === "--wait" ||
            arg === "--type" ||
            arg === "--content" ||
            arg === "--message" ||
            arg === "--scope" ||
            arg === "-m" ||
            arg === "--agent" ||
            arg === "--run-id" ||
            arg === "--url"
        ) {
            const next = argv[i + 1];
            if (next === undefined) {
                throw new Error(\`Missing value for flag \${arg}\`);
            }
            const key = arg === "-m" ? "content" : arg.replace(/^-+/, "");
            flags[key] = next;
            i++;
        } else {
            positional.push(arg);
        }
    }
    return { positional, flags };
}

function detectGitBranchContext() {
    try {
        const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        const match = /^agent\\/(plan-scan-1|plan-scan-2|plan)-(.+)$/.exec(branch);
        if (!match) return null;
        return { agentId: match[1], runId: match[2] };
    } catch {
        return null;
    }
}

function detectRepoRoot() {
    try {
        const commonDir = execFileSync("git", ["rev-parse", "--git-common-dir"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        if (commonDir) {
            return dirname(resolve(process.cwd(), commonDir));
        }
    } catch {
        // Fallback to process.cwd() if not in git worktree
    }
    return process.cwd();
}

function resolveContext(flags) {
    let agentId = flags.agent || process.env.SANDCASTLE_AGENT_ID || "";
    let runId = flags["run-id"] || process.env.SANDCASTLE_RUN_ID || "";
    let url = flags.url || process.env.SANDCASTLE_BLACKBOARD_URL || "";

    if (!agentId || !runId) {
        const gitCtx = detectGitBranchContext();
        if (gitCtx) {
            if (!agentId) agentId = gitCtx.agentId;
            if (!runId) runId = gitCtx.runId;
        }
    }

    if (!url && runId) {
        const repoRoot = detectRepoRoot();
        const snapshotPath = resolve(repoRoot, ".sandcastle", "logs", \`\${runId}-blackboard.json\`);
        if (existsSync(snapshotPath)) {
            try {
                const snap = JSON.parse(readFileSync(snapshotPath, "utf8"));
                if (typeof snap.url === "string" && snap.url.length > 0) {
                    url = snap.url;
                }
            } catch {
                // Handled below by fail-fast validation
            }
        }
    }

    if (!agentId || !VALID_AGENTS.has(agentId)) {
        throw new Error(
            \`Blackboard context error: missing or invalid agent identity '\${agentId}'. Expected SANDCASTLE_AGENT_ID in {plan, plan-scan-1, plan-scan-2}.\`,
        );
    }
    if (!runId) {
        throw new Error("Blackboard context error: missing SANDCASTLE_RUN_ID.");
    }
    if (!url) {
        throw new Error(
            \`Blackboard context error: missing SANDCASTLE_BLACKBOARD_URL for runId=\${runId}.\`,
        );
    }

    return { agentId, runId, url: url.replace(/\\/+$/, "") };
}

function formatEntryLine(entry) {
    const meta = [\`type=\${entry.type}\`];
    if (entry.status) meta.push(\`status=\${entry.status}\`);
    if (entry.replyTo !== undefined && entry.replyTo !== null) meta.push(\`replyTo=#\${entry.replyTo}\`);
    if (entry.claimedBy) meta.push(\`claimedBy=\${entry.claimedBy}\`);
    if (entry.resolvedBy) meta.push(\`resolvedBy=\${entry.resolvedBy}\`);
    if (entry.responseSeq !== undefined && entry.responseSeq !== null) meta.push(\`responseSeq=#\${entry.responseSeq}\`);
    return \`  [seq=#\${entry.seq}] [\${entry.timestamp}] \${entry.sender} -> \${entry.target} (\${meta.join(", ")}): \${entry.content}\`;
}

function formatOutput(data, isWrite) {
    const lines = [];
    const p = data.participants || {};
    const peerStr = ["plan", "plan-scan-1", "plan-scan-2"]
        .map((id) => \`\${id}=\${p[id]?.status || "unknown"}\`)
        .join(" | ");

    lines.push(
        \`=== BLACKBOARD [run_id=\${data.runId} | agent=\${data.caller} | last_seq=\${data.last_seq}] ===\`,
    );
    lines.push(\`STATUS: \${data.action_status || (data.ok ? "OK" : "ERROR")}\`);
    lines.push(\`PEERS: \${peerStr}\`);

    if (data.message) {
        lines.push(\`MESSAGE: \${data.message}\`);
    }

    if (data.entry) {
        lines.push(\`PUBLISHED: \${formatEntryLine(data.entry).trim()}\`);
    }

    if (data.scanners_complete !== undefined) {
        lines.push(\`BARRIER: scanners_complete=\${Boolean(data.scanners_complete)}\`);
    }

    if (data.waited_request) {
        const wr = data.waited_request;
        lines.push(
            \`WAITED REQUEST #\${wr.seq}: status=\${wr.status} target=\${wr.target} claimedBy=\${wr.claimedBy || "none"} resolvedBy=\${wr.resolvedBy || "none"} responseSeq=\${wr.responseSeq ?? "none"}\`,
        );
        if (data.resolving_response) {
            lines.push(\`RESOLVING RESPONSE: \${formatEntryLine(data.resolving_response).trim()}\`);
        }
    }

    const reqForYou = Array.isArray(data.requests_for_you) ? data.requests_for_you : [];
    lines.push(\`REQUESTS TARGETING YOU (\${reqForYou.length}):\`);
    if (reqForYou.length === 0) {
        lines.push("  (none)");
    } else {
        for (const r of reqForYou) {
            lines.push(formatEntryLine(r));
        }
    }

    const otherReqs = Array.isArray(data.other_open_requests) ? data.other_open_requests : [];
    if (otherReqs.length > 0) {
        lines.push(\`OTHER UNRESOLVED REQUESTS (\${otherReqs.length}):\`);
        for (const r of otherReqs) {
            lines.push(formatEntryLine(r));
        }
    }

    const deltaList = isWrite
        ? Array.isArray(data.piggybacked_entries)
            ? data.piggybacked_entries
            : []
        : Array.isArray(data.entries)
          ? data.entries
          : [];
    const deltaHeader = isWrite
        ? \`PIGGYBACKED UNREAD DELTA (\${deltaList.length}):\`
        : \`LEDGER DELTA (\${deltaList.length}):\`;
    lines.push(deltaHeader);
    if (deltaList.length === 0) {
        lines.push("  (none)");
    } else {
        for (const entry of deltaList) {
            lines.push(formatEntryLine(entry));
        }
    }

    if (Array.isArray(data.pending_obligations) && data.pending_obligations.length > 0) {
        lines.push(\`PENDING OBLIGATIONS BLOCKING DONE (\${data.pending_obligations.length}):\`);
        for (const req of data.pending_obligations) {
            lines.push(formatEntryLine(req));
        }
    }

    return lines.join("\\n");
}

async function main() {
    const rawArgs = process.argv.slice(2);
    const { positional, flags } = parseArgs(rawArgs);

    if (flags.help || positional.length === 0) {
        printUsage();
        process.exit(positional.length === 0 && !flags.help ? 1 : 0);
    }

    let subcommand = positional[0];
    const restPositional = positional.slice(1);

    if (subcommand === "help") {
        printUsage();
        process.exit(0);
    }

    if (subcommand === "post") {
        const t = flags.type || "finding";
        if (t === "finding") subcommand = "post-finding";
        else if (t === "request") subcommand = "post-request";
        else if (t === "claim") subcommand = "claim";
        else if (t === "response" || t === "reply") subcommand = "reply";
        else throw new Error(\`Unsupported --type '\${t}' for post command.\`);
    }

    const { agentId, runId, url } = resolveContext(flags);
    const contentText = (
        flags.content ??
        flags.message ??
        flags.scope ??
        restPositional.join(" ")
    ).trim();

    let endpoint = "";
    let method = "GET";
    let bodyObj = null;
    let isWrite = false;

    if (subcommand === "post-finding" || subcommand === "finding") {
        const target = flags.to || flags.target || "all";
        if (!VALID_TARGETS.has(target)) {
            throw new Error(\`Invalid target '\${target}'. Expected one of: all, scanners, plan, plan-scan-1, plan-scan-2.\`);
        }
        if (!contentText) {
            throw new Error("post-finding requires non-empty content.");
        }
        endpoint = \`\${url}/api/finding\`;
        method = "POST";
        bodyObj = { sender: agentId, target, content: contentText };
        isWrite = true;
    } else if (subcommand === "post-request" || subcommand === "request") {
        const defaultTarget = agentId === "plan" ? "scanners" : "plan";
        const target = flags.to || flags.target || defaultTarget;
        if (!VALID_TARGETS.has(target)) {
            throw new Error(\`Invalid target '\${target}'. Expected one of: all, scanners, plan, plan-scan-1, plan-scan-2.\`);
        }
        if (!contentText) {
            throw new Error("post-request requires non-empty content.");
        }
        endpoint = \`\${url}/api/request\`;
        method = "POST";
        bodyObj = { sender: agentId, target, content: contentText };
        isWrite = true;
    } else if (subcommand === "claim") {
        const seqRaw = flags.seq ?? flags["reply-to"];
        const seq = seqRaw !== undefined ? Number.parseInt(String(seqRaw), 10) : null;
        if (seqRaw !== undefined && (!Number.isInteger(seq) || seq < 1)) {
            throw new Error(\`Invalid --seq '\${seqRaw}' for claim. Must be a positive integer.\`);
        }
        const target = flags.to || flags.target || "all";
        const claimContent =
            contentText || (seq !== null ? \`Claimed request #\${seq} for investigation.\` : "");
        if (!claimContent) {
            throw new Error("claim requires either --seq <seq> or a scope description.");
        }
        endpoint = \`\${url}/api/claim\`;
        method = "POST";
        bodyObj = { sender: agentId, target, seq, content: claimContent };
        isWrite = true;
    } else if (subcommand === "reply" || subcommand === "respond") {
        const seqRaw = flags["reply-to"] ?? flags.seq;
        if (seqRaw === undefined) {
            throw new Error("reply requires --reply-to <seq> (or --seq <seq>).");
        }
        const seq = Number.parseInt(String(seqRaw), 10);
        if (!Number.isInteger(seq) || seq < 1) {
            throw new Error(\`Invalid --reply-to '\${seqRaw}'. Must be a positive integer.\`);
        }
        if (!contentText) {
            throw new Error("reply requires non-empty response content.");
        }
        endpoint = \`\${url}/api/reply\`;
        method = "POST";
        bodyObj = { sender: agentId, replyTo: seq, content: contentText };
        isWrite = true;
    } else if (subcommand === "read" || subcommand === "poll" || subcommand === "status") {
        const sinceRaw =
            flags.since !== undefined
                ? Number.parseInt(String(flags.since), 10)
                : flags.unread || subcommand === "status"
                  ? -1
                  : 0;
        if (Number.isNaN(sinceRaw) || sinceRaw < -1) {
            throw new Error(\`Invalid --since '\${flags.since}'.\`);
        }
        const waitSec = flags.wait !== undefined ? Number.parseFloat(String(flags.wait)) : 0;
        const params = new URLSearchParams({
            agent: agentId,
            since: String(sinceRaw),
            wait: String(Number.isFinite(waitSec) && waitSec > 0 ? waitSec : 0),
        });
        endpoint = \`\${url}/api/read?\${params.toString()}\`;
        method = "GET";
    } else if (subcommand === "wait-request") {
        const seqRaw = flags.seq ?? flags["reply-to"];
        if (seqRaw === undefined) {
            throw new Error("wait-request requires --seq <seq>.");
        }
        const seq = Number.parseInt(String(seqRaw), 10);
        if (!Number.isInteger(seq) || seq < 1) {
            throw new Error(\`Invalid --seq '\${seqRaw}'.\`);
        }
        const waitSec = flags.wait !== undefined ? Number.parseFloat(String(flags.wait)) : 30;
        const params = new URLSearchParams({
            agent: agentId,
            seq: String(seq),
            wait: String(Number.isFinite(waitSec) && waitSec > 0 ? waitSec : 30),
        });
        endpoint = \`\${url}/api/wait-request?\${params.toString()}\`;
        method = "GET";
    } else if (subcommand === "wait-scanners") {
        const sinceRaw =
            flags.since !== undefined ? Number.parseInt(String(flags.since), 10) : -1;
        if (Number.isNaN(sinceRaw) || sinceRaw < -1) {
            throw new Error(\`Invalid --since '\${flags.since}'.\`);
        }
        const waitSec = flags.wait !== undefined ? Number.parseFloat(String(flags.wait)) : 45;
        const params = new URLSearchParams({
            agent: agentId,
            since: String(sinceRaw),
            wait: String(Number.isFinite(waitSec) && waitSec > 0 ? waitSec : 45),
        });
        endpoint = \`\${url}/api/wait-scanners?\${params.toString()}\`;
        method = "GET";
    } else if (subcommand === "done") {
        endpoint = \`\${url}/api/done\`;
        method = "POST";
        bodyObj = { sender: agentId };
    } else {
        throw new Error(\`Unknown blackboard subcommand '\${subcommand}'. Run 'blackboard --help' for usage.\`);
    }

    const response = await fetch(endpoint, {
        method,
        headers: bodyObj ? { "content-type": "application/json" } : undefined,
        body: bodyObj ? JSON.stringify(bodyObj) : undefined,
    });

    const data = await response.json();
    if (flags.json) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log(formatOutput(data, isWrite));
    }

    if (!response.ok || data.ok === false) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(\`[blackboard error] \${err instanceof Error ? err.message : String(err)}\`);
    process.exit(1);
});
`;

export function bootstrapBlackboardShim(repoDir: string = process.cwd()): string {
    const binDir = resolve(repoDir, ".sandcastle", "bin");
    mkdirSync(binDir, { recursive: true });
    const shimPath = join(binDir, "blackboard");

    const currentContent = existsSync(shimPath) ? readFileSync(shimPath, "utf8") : null;
    if (currentContent !== BLACKBOARD_SHIM_CONTENT) {
        writeFileSync(shimPath, BLACKBOARD_SHIM_CONTENT, { encoding: "utf8" });
    }
    chmodSync(shimPath, 0o755);
    return shimPath;
}

export function bootstrapGrepShim(repoDir: string = process.cwd()): string {
    const binDir = resolve(repoDir, ".sandcastle", "bin");
    mkdirSync(binDir, { recursive: true });
    const shimPath = join(binDir, "grep");

    const currentContent = existsSync(shimPath) ? readFileSync(shimPath, "utf8") : null;
    if (currentContent !== GREP_SHIM_CONTENT) {
        writeFileSync(shimPath, GREP_SHIM_CONTENT, { encoding: "utf8" });
    }
    chmodSync(shimPath, 0o755);
    bootstrapBlackboardShim(repoDir);
    return shimPath;
}

if (existsSync(resolve(process.cwd(), ".sandcastle"))) {
    bootstrapGrepShim(process.cwd());
    bootstrapBlackboardShim(process.cwd());
}

export function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

export function errorText(error: unknown): string {
    if (error instanceof Error) {
        const anyErr = error as Error & { stderr?: unknown; stdout?: unknown; cause?: unknown };
        const parts = [
            error.message,
            typeof anyErr.stderr === "string" || Buffer.isBuffer(anyErr.stderr) ? String(anyErr.stderr) : "",
            typeof anyErr.stdout === "string" || Buffer.isBuffer(anyErr.stdout) ? String(anyErr.stdout) : "",
            anyErr.cause !== undefined ? errorText(anyErr.cause) : "",
        ];
        return parts.filter((p) => p.length > 0).join("\n");
    }
    return String(error ?? "");
}

export function isGitLock(error: unknown): boolean {
    const text = errorText(error).toLowerCase();
    return (
        text.includes("could not lock config file") ||
        text.includes("index.lock") ||
        text.includes("config.lock") ||
        text.includes("cannot lock ref") ||
        (text.includes("unable to create") && text.includes(".lock")) ||
        text.includes(".lock': file exists") ||
        text.includes(".lock: file exists") ||
        text.includes("another git process seems to be running") ||
        text.includes("worktreetimeouterror") ||
        text.includes("worktree creation timed out") ||
        text.includes("worktree prune timed out") ||
        /\b[\w./-]+\.lock\b/.test(text)
    );
}

export const isGitConfigLock = isGitLock;

type StreamEvent =
    | { type: "text"; text: string }
    | { type: "result"; result: string }
    | { type: "tool_call"; name: string; args: string };

export function antigravity(
    model: string,
    extraEnv: Record<string, string> = {},
): AgentProvider {
    const streamedSteps = new Set<number>();
    return {
        name: "antigravity",
        env: {
            ...process.env,
            ...extraEnv,
            PATH: `${SHIM_BIN_DIR}:${process.env.PATH || ""}`,
        },
        captureSessions: false,
        buildPrintCommand({ prompt }) {
            return {
                command: [
                    "agy",
                    "-p",
                    shellQuote(prompt),
                    "--model",
                    shellQuote(model),
                    "--output-format",
                    "stream-json",
                    "--dangerously-skip-permissions",
                ].join(" "),
            };
        },
        parseStreamLine(line) {
            try {
                const ev = JSON.parse(line) as {
                    event?: string;
                    step_update?: {
                        step_index?: number;
                        state?: string;
                        step_type?: string;
                        tool_name?: string;
                        text_delta?: string;
                        thought?: string;
                        thinking?: string;
                        reasoning?: string;
                        tool_info?: unknown;
                    };
                    result?: { response?: string; error?: string };
                };
                if (ev.event === "result") {
                    const response = ev.result?.response;
                    const error = ev.result?.error;
                    const resultText =
                        typeof response === "string" && response.length > 0
                            ? response
                            : (error ?? "");
                    return [
                        {
                            type: "result",
                            result: resultText,
                        },
                    ];
                }
                if (ev.event !== "step_update" || !ev.step_update) return [];

                const step = ev.step_update;
                const events: StreamEvent[] = [];
                const thought = [step.thought, step.thinking, step.reasoning].find(
                    (value) => typeof value === "string" && value.length > 0,
                );
                if (thought) {
                    events.push({ type: "text", text: `[thought] ${thought}` });
                }
                if (
                    step.step_type === "agent_response" &&
                    typeof step.text_delta === "string" &&
                    step.text_delta.length > 0
                ) {
                    const index = step.step_index ?? -1;
                    const alreadyStreamed = streamedSteps.has(index);
                    if (step.state === "ACTIVE") {
                        streamedSteps.add(index);
                        events.push({ type: "text", text: step.text_delta });
                    } else if (!alreadyStreamed) {
                        events.push({ type: "text", text: step.text_delta });
                    }
                }
                if (step.step_type === "tool") {
                    events.push({
                        type: "tool_call",
                        name: step.tool_name ?? "tool",
                        args: JSON.stringify(step.tool_info ?? {}),
                    });
                }
                return events;
            } catch {
                // Non-JSON log lines are ignored. verbose still keeps the raw line.
            }
            return [];
        },
    };
}

export function ignoreMissing(command: string[], cwd?: string) {
    try {
        execFileSync(command[0], command.slice(1), { cwd, stdio: "ignore" });
    } catch {
        // Ignore already-removed worktrees or absent refs when explicitly requested.
    }
}

export function worktreeDir(branch: string, repoDir?: string): string {
    const rel = `.sandcastle/worktrees/${branch.replaceAll("/", "-")}`;
    return repoDir ? join(repoDir, rel) : rel;
}

export function cleanTransientWorktreeArtifacts(dir: string): void {
    if (!existsSync(dir)) return;

    function walkAndClean(currentDir: string) {
        let entries: string[] = [];
        try {
            entries = readdirSync(currentDir);
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry === ".git" || entry === "node_modules" || entry === ".venv") continue;
            const fullPath = join(currentDir, entry);
            if (TRANSIENT_CACHE_NAMES.has(entry)) {
                try {
                    rmSync(fullPath, { recursive: true, force: true });
                } catch {
                    // Best-effort cleanup of transient caches
                }
                continue;
            }
            try {
                if (statSync(fullPath).isDirectory()) {
                    walkAndClean(fullPath);
                }
            } catch {
                // Ignore broken symlinks or concurrently removed files
            }
        }
    }

    walkAndClean(dir);
}

export function commitLeftovers(dir: string, branch: string, stageName = "stage"): boolean {
    if (!existsSync(dir)) return false;
    cleanTransientWorktreeArtifacts(dir);
    const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: dir,
        encoding: "utf8",
    });
    if (status.trim().length === 0) return false;
    execFileSync("git", ["add", "-A"], { cwd: dir, stdio: "inherit" });
    execFileSync(
        "git",
        ["commit", "-m", `chore(${stageName}): keep uncommitted stage files on ${branch}`],
        { cwd: dir, stdio: "inherit" },
    );
    return true;
}

export function branchExists(branch: string, repoDir: string = process.cwd()): boolean {
    try {
        execFileSync("git", ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], {
            cwd: repoDir,
            stdio: "ignore",
        });
        return true;
    } catch {
        return false;
    }
}

export function isBranchAncestor(
    branch: string,
    targetRef = "HEAD",
    repoDir: string = process.cwd(),
): boolean {
    if (!branchExists(branch, repoDir)) return false;
    try {
        execFileSync("git", ["merge-base", "--is-ancestor", branch, targetRef], {
            cwd: repoDir,
            stdio: "ignore",
        });
        return true;
    } catch {
        return false;
    }
}

export function isWorkingTreeClean(repoDir: string = process.cwd()): boolean {
    const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: repoDir,
        encoding: "utf8",
    });
    return status.trim().length === 0;
}

export function removeWorktreeDir(
    branch: string,
    options: { repoDir?: string; consolidateBeforeRemove?: boolean } = {},
): void {
    const repoDir = options.repoDir ?? process.cwd();
    const dir = worktreeDir(branch, repoDir);
    const mergeDir = join(repoDir, `.sandcastle/worktrees/merge-${branch.replaceAll("/", "-")}`);

    if (options.consolidateBeforeRemove !== false && existsSync(dir)) {
        try {
            commitLeftovers(dir, branch, "cleanup");
        } catch {
            // If git index is mid-operation during interrupt, proceed to worktree removal
        }
    }

    ignoreMissing(["git", "worktree", "remove", "--force", dir], repoDir);
    ignoreMissing(["git", "worktree", "remove", "--force", mergeDir], repoDir);
    ignoreMissing(["rm", "-rf", dir], repoDir);
    ignoreMissing(["rm", "-rf", mergeDir], repoDir);
}

export function teardownWorktree(
    branch: string,
    options: {
        repoDir?: string;
        deleteBranch?: boolean;
        verifiedTargetRef?: string;
        requireCleanHost?: boolean;
    } = {},
): { worktreeRemoved: boolean; branchDeleted: boolean } {
    const repoDir = options.repoDir ?? process.cwd();
    removeWorktreeDir(branch, { repoDir, consolidateBeforeRemove: true });

    const shouldDeleteBranch = options.deleteBranch ?? false;
    if (!shouldDeleteBranch) {
        if (branchExists(branch, repoDir)) {
            console.log(`[preserve] Preserving unmerged branch ${branch} for inspection/recovery.`);
        }
        return { worktreeRemoved: true, branchDeleted: false };
    }

    const targetRef = options.verifiedTargetRef ?? "HEAD";
    const ancestorVerified = isBranchAncestor(branch, targetRef, repoDir);
    const cleanVerified = options.requireCleanHost === false ? true : isWorkingTreeClean(repoDir);

    if (!ancestorVerified || !cleanVerified) {
        if (branchExists(branch, repoDir)) {
            console.log(
                `[preserve] Refusing to delete branch ${branch} (ancestorOf(${targetRef})=${ancestorVerified}, hostClean=${cleanVerified}).`,
            );
        }
        return { worktreeRemoved: true, branchDeleted: false };
    }

    if (branchExists(branch, repoDir)) {
        ignoreMissing(["git", "branch", "-D", branch], repoDir);
    }
    return { worktreeRemoved: true, branchDeleted: !branchExists(branch, repoDir) };
}

export const MAX_WAIT_SECONDS = 60;

interface BlackboardWaiter {
    id: number;
    kind: "read" | "wait-request" | "wait-scanners";
    agent: BlackboardAgentId;
    sinceSeq: number;
    requestSeq?: number;
    baselineStatuses: Record<BlackboardAgentId, BlackboardAgentStatus>;
    timer: ReturnType<typeof setTimeout>;
    resolve: () => void;
}

export function isBlackboardAgentId(value: unknown): value is BlackboardAgentId {
    return (
        typeof value === "string" &&
        (value === "plan" || value === "plan-scan-1" || value === "plan-scan-2")
    );
}

export function isBlackboardTarget(value: unknown): value is BlackboardTarget {
    return (
        typeof value === "string" &&
        (value === "all" ||
            value === "scanners" ||
            value === "plan" ||
            value === "plan-scan-1" ||
            value === "plan-scan-2")
    );
}

export function getEligibleAgentsForTarget(
    target: BlackboardTarget,
    sender: BlackboardAgentId,
): BlackboardAgentId[] {
    if (target === "plan") return ["plan"];
    if (target === "plan-scan-1") return ["plan-scan-1"];
    if (target === "plan-scan-2") return ["plan-scan-2"];
    if (target === "scanners") return ["plan-scan-1", "plan-scan-2"];
    return BLACKBOARD_AGENTS.filter((agent) => agent !== sender);
}

export function isAgentEligibleForTarget(
    agent: BlackboardAgentId,
    target: BlackboardTarget,
    sender: BlackboardAgentId,
): boolean {
    return getEligibleAgentsForTarget(target, sender).includes(agent);
}

export class BlackboardServer {
    public readonly runId: string;
    public readonly repoDir: string;
    public readonly logDir: string;
    public readonly logJsonPath: string;
    public readonly logTextPath: string;
    public readonly startedAt: string;
    public stoppedAt: string | null = null;

    private server: Server | null = null;
    private boundPort = 0;
    private nextSeq = 1;
    private nextEventId = 1;
    private nextWaiterId = 1;
    private readonly entries: BlackboardEntry[] = [];
    private readonly events: BlackboardEventRecord[] = [];
    private readonly participants: Record<BlackboardAgentId, BlackboardParticipantState>;
    private readonly waiters = new Set<BlackboardWaiter>();
    private closed = false;

    constructor(runId: string, options: { repoDir?: string } = {}) {
        if (!runId || typeof runId !== "string" || runId.trim().length === 0) {
            throw new Error("BlackboardServer requires a non-empty runId.");
        }
        this.runId = runId.trim();
        this.repoDir = options.repoDir ?? process.cwd();
        this.logDir = resolve(this.repoDir, ".sandcastle", "logs");
        mkdirSync(this.logDir, { recursive: true });
        this.logJsonPath = join(this.logDir, `${this.runId}-blackboard.json`);
        this.logTextPath = join(this.logDir, `${this.runId}-blackboard.log`);
        this.startedAt = new Date().toISOString();

        this.participants = {
            plan: {
                agent: "plan",
                status: "active",
                lastSeenSeq: 0,
                updatedAt: this.startedAt,
            },
            "plan-scan-1": {
                agent: "plan-scan-1",
                status: "active",
                lastSeenSeq: 0,
                updatedAt: this.startedAt,
            },
            "plan-scan-2": {
                agent: "plan-scan-2",
                status: "active",
                lastSeenSeq: 0,
                updatedAt: this.startedAt,
            },
        };
    }

    public get port(): number {
        return this.boundPort;
    }

    public get url(): string {
        if (!this.boundPort) {
            throw new Error(`BlackboardServer for ${this.runId} has not been started yet.`);
        }
        return `http://127.0.0.1:${this.boundPort}`;
    }

    public get lastSeq(): number {
        return this.entries.length;
    }

    public agentEnv(agentId: BlackboardAgentId): Record<string, string> {
        return {
            SANDCASTLE_BLACKBOARD_URL: this.url,
            SANDCASTLE_RUN_ID: this.runId,
            SANDCASTLE_AGENT_ID: agentId,
        };
    }

    public async start(): Promise<this> {
        if (this.server) return this;

        this.server = createServer((req, res) => {
            this.handleHttpRequest(req, res).catch((err) => {
                if (!res.headersSent) {
                    this.sendJson(res, 500, {
                        ok: false,
                        runId: this.runId,
                        action_status: "INTERNAL_ERROR",
                        message: errorText(err),
                    });
                }
            });
        });

        await new Promise<void>((resolveListen, rejectListen) => {
            this.server!.once("error", rejectListen);
            this.server!.listen(0, "127.0.0.1", () => {
                this.server!.removeListener("error", rejectListen);
                const addr = this.server!.address() as AddressInfo | null;
                if (!addr || typeof addr.port !== "number") {
                    rejectListen(new Error("Failed to bind ephemeral loopback port for BlackboardServer."));
                    return;
                }
                this.boundPort = addr.port;
                resolveListen();
            });
        });

        this.recordEvent("blackboard_started", "orchestrator", undefined, {
            url: this.url,
            port: this.boundPort,
        });
        return this;
    }

    public closeSync(): void {
        if (this.closed) return;
        this.closed = true;
        this.stoppedAt = new Date().toISOString();

        for (const waiter of Array.from(this.waiters)) {
            clearTimeout(waiter.timer);
            this.waiters.delete(waiter);
            waiter.resolve();
        }

        this.recordEvent("blackboard_stopped", "orchestrator", undefined, {
            lastSeq: this.lastSeq,
            participants: this.cloneParticipants(),
        });

        if (this.server) {
            try {
                this.server.close();
            } catch {
                // Ignore close error on already-closing server
            }
            this.server = null;
        }
    }

    public async close(): Promise<void> {
        if (this.closed) return;
        const srv = this.server;
        this.closeSync();
        if (srv) {
            await new Promise<void>((resolveClose) => {
                srv.close(() => resolveClose());
            });
        }
    }

    public getSnapshot(): BlackboardSnapshot {
        return {
            runId: this.runId,
            url: this.boundPort ? `http://127.0.0.1:${this.boundPort}` : "",
            port: this.boundPort,
            startedAt: this.startedAt,
            stoppedAt: this.stoppedAt,
            lastSeq: this.lastSeq,
            participants: this.cloneParticipants(),
            entries: this.entries.map((entry) => ({ ...entry })),
            events: this.events.map((ev) => ({ ...ev, detail: { ...ev.detail } })),
        };
    }

    public markAgentActive(agent: BlackboardAgentId): void {
        const p = this.participants[agent];
        const prevStatus = p.status;
        p.status = "active";
        p.updatedAt = new Date().toISOString();

        const reopenedSeqs: number[] = [];
        for (const entry of this.entries) {
            if (
                entry.type === "request" &&
                entry.status === "unfulfillable" &&
                isAgentEligibleForTarget(agent, entry.target, entry.sender)
            ) {
                entry.status = "open";
                entry.claimedBy = null;
                reopenedSeqs.push(entry.seq);
            }
        }

        this.recordEvent("agent_status_transition", "orchestrator", undefined, {
            agent,
            previousStatus: prevStatus,
            newStatus: "active",
            reopenedRequests: reopenedSeqs,
        });
        this.notifyWaiters();
    }

    public markAgentSettled(agent: BlackboardAgentId): void {
        const p = this.participants[agent];
        if (p.status === "done") {
            return;
        }
        const prevStatus = p.status;
        p.status = "settled";
        p.updatedAt = new Date().toISOString();

        const recovery = this.reconcileOrphanedRequests(agent);
        this.recordEvent("agent_status_transition", "orchestrator", undefined, {
            agent,
            previousStatus: prevStatus,
            newStatus: "settled",
            ...recovery,
        });
        this.notifyWaiters();
    }

    public markAgentTerminated(agent: BlackboardAgentId, reason = "stage failed"): void {
        const p = this.participants[agent];
        const prevStatus = p.status;
        p.status = "terminated";
        p.updatedAt = new Date().toISOString();

        const recovery = this.reconcileOrphanedRequests(agent);
        this.recordEvent("agent_status_transition", "orchestrator", undefined, {
            agent,
            previousStatus: prevStatus,
            newStatus: "terminated",
            reason,
            ...recovery,
        });
        this.notifyWaiters();
    }

    public hasActiveEligibleTarget(requestEntry: BlackboardEntry): boolean {
        const eligible = getEligibleAgentsForTarget(requestEntry.target, requestEntry.sender);
        return eligible.some((agentId) => this.participants[agentId].status === "active");
    }

    public areScannersComplete(): boolean {
        return (
            this.participants["plan-scan-1"].status !== "active" &&
            this.participants["plan-scan-2"].status !== "active"
        );
    }

    private reconcileOrphanedRequests(changedAgent: BlackboardAgentId): {
        revertedToOpen: number[];
        markedUnfulfillable: number[];
    } {
        const revertedToOpen: number[] = [];
        const markedUnfulfillable: number[] = [];

        for (const entry of this.entries) {
            if (entry.type !== "request") continue;

            if (entry.status === "claimed" && entry.claimedBy === changedAgent) {
                const otherEligibleActive = getEligibleAgentsForTarget(
                    entry.target,
                    entry.sender,
                ).some(
                    (candidate) =>
                        candidate !== changedAgent &&
                        this.participants[candidate].status === "active",
                );
                if (
                    (entry.target === "scanners" || entry.target === "all") &&
                    otherEligibleActive
                ) {
                    entry.status = "open";
                    entry.claimedBy = null;
                    revertedToOpen.push(entry.seq);
                } else {
                    entry.status = "unfulfillable";
                    markedUnfulfillable.push(entry.seq);
                }
            } else if (entry.status === "open") {
                if (!this.hasActiveEligibleTarget(entry)) {
                    entry.status = "unfulfillable";
                    markedUnfulfillable.push(entry.seq);
                }
            }
        }

        return { revertedToOpen, markedUnfulfillable };
    }

    private cloneParticipants(): Record<BlackboardAgentId, BlackboardParticipantState> {
        return {
            plan: { ...this.participants.plan },
            "plan-scan-1": { ...this.participants["plan-scan-1"] },
            "plan-scan-2": { ...this.participants["plan-scan-2"] },
        };
    }

    private recordEvent(
        kind: string,
        actor: BlackboardAgentId | "orchestrator",
        seq: number | undefined,
        detail: Record<string, unknown>,
    ): void {
        const record: BlackboardEventRecord = {
            eventId: this.nextEventId++,
            timestamp: new Date().toISOString(),
            kind,
            actor,
            ...(seq !== undefined ? { seq } : {}),
            detail,
        };
        this.events.push(record);
        this.flushLogs(record);
    }

    private flushLogs(latestEvent: BlackboardEventRecord): void {
        try {
            mkdirSync(this.logDir, { recursive: true });
            const line = `[${latestEvent.timestamp}] [event=#${latestEvent.eventId}] [${latestEvent.kind}] actor=${latestEvent.actor ?? "unknown"}${latestEvent.seq !== undefined ? ` seq=#${latestEvent.seq}` : ""} ${JSON.stringify(latestEvent.detail)}\n`;
            appendFileSync(this.logTextPath, line, { encoding: "utf8" });
            writeFileSync(this.logJsonPath, JSON.stringify(this.getSnapshot(), null, 2), {
                encoding: "utf8",
            });
        } catch {
            // Best-effort log persistence in .sandcastle/logs
        }
    }

    private computeRequestSummaries(caller: BlackboardAgentId): {
        requestsForYou: BlackboardEntry[];
        otherOpenRequests: BlackboardEntry[];
    } {
        const requestsForYou: BlackboardEntry[] = [];
        const otherOpenRequests: BlackboardEntry[] = [];

        for (const entry of this.entries) {
            if (entry.type !== "request") continue;
            if (entry.status !== "open" && entry.status !== "claimed") continue;

            const eligible = isAgentEligibleForTarget(caller, entry.target, entry.sender);
            const targetedAtCaller =
                (entry.status === "claimed" && entry.claimedBy === caller) ||
                (entry.status === "open" && eligible);

            if (targetedAtCaller) {
                requestsForYou.push({ ...entry });
            } else {
                otherOpenRequests.push({ ...entry });
            }
        }

        return { requestsForYou, otherOpenRequests };
    }

    private computeObligationsForDone(caller: BlackboardAgentId): BlackboardEntry[] {
        const obligations: BlackboardEntry[] = [];
        for (const entry of this.entries) {
            if (entry.type !== "request") continue;
            if (entry.status === "claimed" && entry.claimedBy === caller) {
                obligations.push({ ...entry });
                continue;
            }
            if (entry.status === "open") {
                if (entry.target === caller) {
                    obligations.push({ ...entry });
                } else if (
                    entry.target === "scanners" &&
                    (caller === "plan-scan-1" || caller === "plan-scan-2")
                ) {
                    obligations.push({ ...entry });
                } else if (entry.target === "all" && entry.sender !== caller) {
                    obligations.push({ ...entry });
                }
            }
        }
        return obligations;
    }

    private isWaiterSatisfied(waiter: BlackboardWaiter): boolean {
        if (this.closed) return true;

        if (waiter.kind === "read") {
            if (this.lastSeq > waiter.sinceSeq) return true;
            for (const agentId of BLACKBOARD_AGENTS) {
                if (this.participants[agentId].status !== waiter.baselineStatuses[agentId]) {
                    return true;
                }
            }
            return false;
        }

        if (waiter.kind === "wait-request") {
            const reqEntry = this.entries.find(
                (e) => e.seq === waiter.requestSeq && e.type === "request",
            );
            if (!reqEntry) return true;
            if (reqEntry.status === "resolved" || reqEntry.status === "unfulfillable") {
                return true;
            }
            if (!this.hasActiveEligibleTarget(reqEntry)) {
                return true;
            }
            return false;
        }

        if (waiter.kind === "wait-scanners") {
            return this.areScannersComplete();
        }

        return true;
    }

    private notifyWaiters(): void {
        for (const waiter of Array.from(this.waiters)) {
            if (this.isWaiterSatisfied(waiter)) {
                clearTimeout(waiter.timer);
                this.waiters.delete(waiter);
                waiter.resolve();
            }
        }
    }

    private waitForCondition(
        req: IncomingMessage,
        kind: BlackboardWaiter["kind"],
        agent: BlackboardAgentId,
        sinceSeq: number,
        waitSeconds: number,
        requestSeq?: number,
    ): Promise<void> {
        const clampedSeconds = Math.max(0, Math.min(MAX_WAIT_SECONDS, waitSeconds));
        const baselineStatuses: Record<BlackboardAgentId, BlackboardAgentStatus> = {
            plan: this.participants.plan.status,
            "plan-scan-1": this.participants["plan-scan-1"].status,
            "plan-scan-2": this.participants["plan-scan-2"].status,
        };

        const probe: BlackboardWaiter = {
            id: 0,
            kind,
            agent,
            sinceSeq,
            requestSeq,
            baselineStatuses,
            timer: setTimeout(() => {}, 0),
            resolve: () => {},
        };
        clearTimeout(probe.timer);

        if (clampedSeconds <= 0 || this.isWaiterSatisfied(probe)) {
            return Promise.resolve();
        }

        return new Promise<void>((resolveWait) => {
            const waiter: BlackboardWaiter = {
                id: this.nextWaiterId++,
                kind,
                agent,
                sinceSeq,
                requestSeq,
                baselineStatuses,
                timer: setTimeout(() => {
                    this.waiters.delete(waiter);
                    resolveWait();
                }, Math.round(clampedSeconds * 1000)),
                resolve: () => {
                    resolveWait();
                },
            };
            this.waiters.add(waiter);

            req.once("close", () => {
                if (this.waiters.has(waiter)) {
                    clearTimeout(waiter.timer);
                    this.waiters.delete(waiter);
                    resolveWait();
                }
            });
        });
    }

    private async readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, unknown>;
    }

    private sendJson(res: ServerResponse, statusCode: number, payload: Record<string, unknown>): void {
        const body = JSON.stringify(payload);
        res.writeHead(statusCode, {
            "content-type": "application/json; charset=utf-8",
            "content-length": Buffer.byteLength(body),
            "cache-control": "no-store",
        });
        res.end(body);
    }

    private buildWritePayload(
        caller: BlackboardAgentId,
        previousLastSeen: number,
        createdEntry: BlackboardEntry,
        actionStatus: string,
        message: string,
    ): Record<string, unknown> {
        const piggybacked = this.entries
            .filter((e) => e.seq > previousLastSeen && e.seq < createdEntry.seq)
            .map((e) => ({ ...e }));
        this.participants[caller].lastSeenSeq = this.lastSeq;
        this.participants[caller].updatedAt = new Date().toISOString();

        const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(caller);
        return {
            ok: true,
            runId: this.runId,
            caller,
            action_status: actionStatus,
            message,
            last_seq: this.lastSeq,
            entry: { ...createdEntry },
            piggybacked_entries: piggybacked,
            entries: piggybacked,
            participants: this.cloneParticipants(),
            requests_for_you: requestsForYou,
            other_open_requests: otherOpenRequests,
        };
    }

    private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const parsedUrl = new URL(req.url ?? "/", `http://127.0.0.1:${this.boundPort || 80}`);
        const pathname = parsedUrl.pathname;

        if (req.method === "POST" && pathname === "/api/finding") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const target = body.target ?? "all";
            const content = typeof body.content === "string" ? body.content.trim() : "";

            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_SENDER",
                    message: `Invalid sender '${String(sender)}'.`,
                });
                return;
            }
            if (!isBlackboardTarget(target)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "INVALID_TARGET",
                    message: `Invalid target '${String(target)}'.`,
                });
                return;
            }
            if (!content) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "EMPTY_CONTENT",
                    message: "Finding content must not be empty.",
                });
                return;
            }

            const prevSeen = this.participants[sender].lastSeenSeq;
            const entry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "finding",
                content,
            };
            this.entries.push(entry);
            this.recordEvent("finding_published", sender, entry.seq, {
                target,
                content,
            });
            this.notifyWaiters();

            this.sendJson(
                res,
                201,
                this.buildWritePayload(
                    sender,
                    prevSeen,
                    entry,
                    "PUBLISHED_FINDING",
                    `Published finding #${entry.seq} to '${target}'.`,
                ),
            );
            return;
        }

        if (req.method === "POST" && pathname === "/api/request") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const target = body.target ?? (sender === "plan" ? "scanners" : "plan");
            const content = typeof body.content === "string" ? body.content.trim() : "";

            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_SENDER",
                    message: `Invalid sender '${String(sender)}'.`,
                });
                return;
            }
            if (!isBlackboardTarget(target)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "INVALID_TARGET",
                    message: `Invalid target '${String(target)}'.`,
                });
                return;
            }
            if (!content) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "EMPTY_CONTENT",
                    message: "Request content must not be empty.",
                });
                return;
            }

            const prevSeen = this.participants[sender].lastSeenSeq;
            const entry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "request",
                content,
                status: "open",
                claimedBy: null,
                resolvedBy: null,
                responseSeq: null,
            };
            if (!this.hasActiveEligibleTarget(entry)) {
                entry.status = "unfulfillable";
            }

            this.entries.push(entry);
            this.recordEvent("request_published", sender, entry.seq, {
                target,
                status: entry.status,
                content,
            });
            this.notifyWaiters();

            this.sendJson(
                res,
                201,
                this.buildWritePayload(
                    sender,
                    prevSeen,
                    entry,
                    "PUBLISHED_REQUEST",
                    `Published request #${entry.seq} to '${target}' (status=${entry.status}).`,
                ),
            );
            return;
        }

        if (req.method === "POST" && pathname === "/api/claim") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const target = isBlackboardTarget(body.target) ? body.target : "all";
            const seqRaw = body.seq;
            const reqSeq =
                typeof seqRaw === "number" && Number.isInteger(seqRaw) ? seqRaw : null;
            const content = typeof body.content === "string" ? body.content.trim() : "";

            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_SENDER",
                    message: `Invalid sender '${String(sender)}'.`,
                });
                return;
            }

            const prevSeen = this.participants[sender].lastSeenSeq;

            if (reqSeq !== null) {
                const targetReq = this.entries.find(
                    (e) => e.seq === reqSeq && e.type === "request",
                );
                if (!targetReq) {
                    const { requestsForYou, otherOpenRequests } =
                        this.computeRequestSummaries(sender);
                    this.sendJson(res, 404, {
                        ok: false,
                        runId: this.runId,
                        caller: sender,
                        last_seq: this.lastSeq,
                        action_status: "REQUEST_NOT_FOUND",
                        message: `Request #${reqSeq} does not exist.`,
                        participants: this.cloneParticipants(),
                        requests_for_you: requestsForYou,
                        other_open_requests: otherOpenRequests,
                        piggybacked_entries: this.entries.filter((e) => e.seq > prevSeen),
                    });
                    return;
                }

                if (!isAgentEligibleForTarget(sender, targetReq.target, targetReq.sender)) {
                    const { requestsForYou, otherOpenRequests } =
                        this.computeRequestSummaries(sender);
                    this.sendJson(res, 403, {
                        ok: false,
                        runId: this.runId,
                        caller: sender,
                        last_seq: this.lastSeq,
                        action_status: "INELIGIBLE_CLAIM_TARGET",
                        message: `Agent '${sender}' is not an eligible target for request #${reqSeq} (target='${targetReq.target}', sender='${targetReq.sender}').`,
                        participants: this.cloneParticipants(),
                        requests_for_you: requestsForYou,
                        other_open_requests: otherOpenRequests,
                        piggybacked_entries: this.entries.filter((e) => e.seq > prevSeen),
                    });
                    return;
                }

                if (
                    targetReq.status === "resolved" ||
                    targetReq.status === "unfulfillable" ||
                    (targetReq.status === "claimed" &&
                        targetReq.claimedBy !== sender &&
                        targetReq.claimedBy &&
                        this.participants[targetReq.claimedBy].status === "active")
                ) {
                    const { requestsForYou, otherOpenRequests } =
                        this.computeRequestSummaries(sender);
                    this.sendJson(res, 409, {
                        ok: false,
                        runId: this.runId,
                        caller: sender,
                        last_seq: this.lastSeq,
                        action_status: "CLAIM_CONFLICT",
                        message: `Request #${reqSeq} cannot be claimed (status=${targetReq.status}, claimedBy=${targetReq.claimedBy ?? "none"}, resolvedBy=${targetReq.resolvedBy ?? "none"}).`,
                        participants: this.cloneParticipants(),
                        requests_for_you: requestsForYou,
                        other_open_requests: otherOpenRequests,
                        piggybacked_entries: this.entries.filter((e) => e.seq > prevSeen),
                    });
                    return;
                }

                targetReq.status = "claimed";
                targetReq.claimedBy = sender;

                const claimEntry: BlackboardEntry = {
                    seq: this.nextSeq++,
                    timestamp: new Date().toISOString(),
                    sender,
                    target: targetReq.sender,
                    type: "claim",
                    replyTo: reqSeq,
                    content: content || `Claimed request #${reqSeq} for investigation.`,
                };
                this.entries.push(claimEntry);
                this.recordEvent("request_claimed", sender, claimEntry.seq, {
                    requestSeq: reqSeq,
                    content: claimEntry.content,
                });
                this.notifyWaiters();

                this.sendJson(
                    res,
                    200,
                    this.buildWritePayload(
                        sender,
                        prevSeen,
                        claimEntry,
                        "CLAIMED_REQUEST",
                        `Claimed request #${reqSeq}.`,
                    ),
                );
                return;
            }

            if (!content) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "EMPTY_CLAIM",
                    message: "Scope claim requires non-empty content or --seq <seq>.",
                });
                return;
            }

            const scopeEntry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target,
                type: "claim",
                content,
            };
            this.entries.push(scopeEntry);
            this.recordEvent("scope_claimed", sender, scopeEntry.seq, {
                target,
                content,
            });
            this.notifyWaiters();

            this.sendJson(
                res,
                201,
                this.buildWritePayload(
                    sender,
                    prevSeen,
                    scopeEntry,
                    "CLAIMED_SCOPE",
                    `Published scope claim #${scopeEntry.seq}.`,
                ),
            );
            return;
        }

        if (req.method === "POST" && pathname === "/api/reply") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;
            const replyTo =
                typeof body.replyTo === "number" && Number.isInteger(body.replyTo)
                    ? body.replyTo
                    : null;
            const content = typeof body.content === "string" ? body.content.trim() : "";

            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_SENDER",
                    message: `Invalid sender '${String(sender)}'.`,
                });
                return;
            }
            if (replyTo === null || replyTo < 1) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "INVALID_REPLY_TO",
                    message: "reply requires a positive integer replyTo sequence number.",
                });
                return;
            }
            if (!content) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "EMPTY_CONTENT",
                    message: "Reply content must not be empty.",
                });
                return;
            }

            const prevSeen = this.participants[sender].lastSeenSeq;
            const targetReq = this.entries.find(
                (e) => e.seq === replyTo && e.type === "request",
            );
            if (!targetReq) {
                const { requestsForYou, otherOpenRequests } =
                    this.computeRequestSummaries(sender);
                this.sendJson(res, 404, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    last_seq: this.lastSeq,
                    action_status: "REQUEST_NOT_FOUND",
                    message: `Request #${replyTo} does not exist.`,
                    participants: this.cloneParticipants(),
                    requests_for_you: requestsForYou,
                    other_open_requests: otherOpenRequests,
                    piggybacked_entries: this.entries.filter((e) => e.seq > prevSeen),
                });
                return;
            }

            if (!isAgentEligibleForTarget(sender, targetReq.target, targetReq.sender)) {
                const { requestsForYou, otherOpenRequests } =
                    this.computeRequestSummaries(sender);
                this.sendJson(res, 403, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    last_seq: this.lastSeq,
                    action_status: "INELIGIBLE_REPLY_TARGET",
                    message: `Agent '${sender}' is not an eligible target for request #${replyTo} (target='${targetReq.target}').`,
                    participants: this.cloneParticipants(),
                    requests_for_you: requestsForYou,
                    other_open_requests: otherOpenRequests,
                    piggybacked_entries: this.entries.filter((e) => e.seq > prevSeen),
                });
                return;
            }

            if (targetReq.status === "resolved") {
                const { requestsForYou, otherOpenRequests } =
                    this.computeRequestSummaries(sender);
                this.sendJson(res, 409, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    last_seq: this.lastSeq,
                    action_status: "ALREADY_RESOLVED",
                    message: `Request #${replyTo} was already resolved by '${targetReq.resolvedBy}' in seq #${targetReq.responseSeq}.`,
                    participants: this.cloneParticipants(),
                    requests_for_you: requestsForYou,
                    other_open_requests: otherOpenRequests,
                    piggybacked_entries: this.entries.filter((e) => e.seq > prevSeen),
                });
                return;
            }

            const responseEntry: BlackboardEntry = {
                seq: this.nextSeq++,
                timestamp: new Date().toISOString(),
                sender,
                target: targetReq.sender,
                type: "response",
                replyTo,
                content,
            };
            this.entries.push(responseEntry);

            if (!targetReq.claimedBy) {
                targetReq.claimedBy = sender;
            }
            targetReq.status = "resolved";
            targetReq.resolvedBy = sender;
            targetReq.responseSeq = responseEntry.seq;

            this.recordEvent("request_resolved", sender, responseEntry.seq, {
                requestSeq: replyTo,
                responseSeq: responseEntry.seq,
                target: targetReq.sender,
                content,
            });
            this.notifyWaiters();

            this.sendJson(
                res,
                200,
                this.buildWritePayload(
                    sender,
                    prevSeen,
                    responseEntry,
                    "RESOLVED_REQUEST",
                    `Resolved request #${replyTo} with response #${responseEntry.seq}.`,
                ),
            );
            return;
        }

        if (req.method === "GET" && pathname === "/api/read") {
            const agent = parsedUrl.searchParams.get("agent") ?? "plan";
            if (!isBlackboardAgentId(agent)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_AGENT",
                    message: `Invalid agent '${agent}'.`,
                });
                return;
            }
            const rawSince = Number.parseInt(parsedUrl.searchParams.get("since") ?? "0", 10);
            const effectiveSince =
                rawSince < 0 ? this.participants[agent].lastSeenSeq : Math.max(0, rawSince);
            const waitSec = Number.parseFloat(parsedUrl.searchParams.get("wait") ?? "0") || 0;

            await this.waitForCondition(req, "read", agent, effectiveSince, waitSec);

            const deltaEntries = this.entries
                .filter((e) => e.seq > effectiveSince)
                .map((e) => ({ ...e }));
            this.participants[agent].lastSeenSeq = Math.max(
                this.participants[agent].lastSeenSeq,
                this.lastSeq,
            );
            this.participants[agent].updatedAt = new Date().toISOString();

            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(agent);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: agent,
                action_status: `READ_SINCE_${effectiveSince}`,
                last_seq: this.lastSeq,
                since_seq: effectiveSince,
                entries: deltaEntries,
                participants: this.cloneParticipants(),
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        if (req.method === "GET" && pathname === "/api/wait-request") {
            const agent = parsedUrl.searchParams.get("agent") ?? "plan";
            const reqSeq = Number.parseInt(parsedUrl.searchParams.get("seq") ?? "0", 10);
            const waitSec = Number.parseFloat(parsedUrl.searchParams.get("wait") ?? "30") || 30;

            if (!isBlackboardAgentId(agent)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_AGENT",
                    message: `Invalid agent '${agent}'.`,
                });
                return;
            }

            const targetReq = this.entries.find(
                (e) => e.seq === reqSeq && e.type === "request",
            );
            if (!targetReq) {
                this.sendJson(res, 404, {
                    ok: false,
                    runId: this.runId,
                    caller: agent,
                    last_seq: this.lastSeq,
                    action_status: "REQUEST_NOT_FOUND",
                    message: `Request #${reqSeq} does not exist.`,
                });
                return;
            }

            const prevSeen = this.participants[agent].lastSeenSeq;
            await this.waitForCondition(req, "wait-request", agent, prevSeen, waitSec, reqSeq);

            if (targetReq.status === "open" && !this.hasActiveEligibleTarget(targetReq)) {
                targetReq.status = "unfulfillable";
            }

            const resolvingResponse =
                targetReq.responseSeq !== null && targetReq.responseSeq !== undefined
                    ? this.entries.find((e) => e.seq === targetReq.responseSeq) ?? null
                    : null;

            const deltaEntries = this.entries
                .filter((e) => e.seq > prevSeen)
                .map((e) => ({ ...e }));
            this.participants[agent].lastSeenSeq = Math.max(
                this.participants[agent].lastSeenSeq,
                this.lastSeq,
            );
            this.participants[agent].updatedAt = new Date().toISOString();

            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(agent);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: agent,
                action_status: `WAIT_REQUEST_${targetReq.status?.toUpperCase() ?? "UNKNOWN"}`,
                last_seq: this.lastSeq,
                waited_request: { ...targetReq },
                resolving_response: resolvingResponse ? { ...resolvingResponse } : null,
                entries: deltaEntries,
                participants: this.cloneParticipants(),
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        if (req.method === "GET" && pathname === "/api/wait-scanners") {
            const agent = parsedUrl.searchParams.get("agent") ?? "plan";
            if (!isBlackboardAgentId(agent)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_AGENT",
                    message: `Invalid agent '${agent}'.`,
                });
                return;
            }
            const rawSince = Number.parseInt(parsedUrl.searchParams.get("since") ?? "-1", 10);
            const effectiveSince =
                rawSince < 0 ? this.participants[agent].lastSeenSeq : Math.max(0, rawSince);
            const waitSec = Number.parseFloat(parsedUrl.searchParams.get("wait") ?? "45") || 45;

            await this.waitForCondition(req, "wait-scanners", agent, effectiveSince, waitSec);

            const scannersComplete = this.areScannersComplete();
            const deltaEntries = this.entries
                .filter((e) => e.seq > effectiveSince)
                .map((e) => ({ ...e }));
            this.participants[agent].lastSeenSeq = Math.max(
                this.participants[agent].lastSeenSeq,
                this.lastSeq,
            );
            this.participants[agent].updatedAt = new Date().toISOString();

            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(agent);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: agent,
                action_status: scannersComplete ? "SCANNERS_COMPLETE" : "SCANNERS_STILL_ACTIVE",
                scanners_complete: scannersComplete,
                message: scannersComplete
                    ? "Both plan-scan-1 and plan-scan-2 have finished. Reconcile final delta before marking done."
                    : "Wait window elapsed while at least one scanner is still active; re-run wait-scanners to continue waiting.",
                last_seq: this.lastSeq,
                since_seq: effectiveSince,
                entries: deltaEntries,
                participants: this.cloneParticipants(),
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        if (req.method === "POST" && pathname === "/api/done") {
            const body = await this.readJsonBody(req);
            const sender = body.sender;

            if (!isBlackboardAgentId(sender)) {
                this.sendJson(res, 400, {
                    ok: false,
                    runId: this.runId,
                    action_status: "INVALID_SENDER",
                    message: `Invalid sender '${String(sender)}'.`,
                });
                return;
            }

            const prevSeen = this.participants[sender].lastSeenSeq;
            const unreadPeerEntries = this.entries
                .filter((e) => e.seq > prevSeen && e.sender !== sender)
                .map((e) => ({ ...e }));
            const pendingObligations = this.computeObligationsForDone(sender);

            // Advance lastSeenSeq so any unread peer entries are delivered in this response
            this.participants[sender].lastSeenSeq = Math.max(prevSeen, this.lastSeq);
            this.participants[sender].updatedAt = new Date().toISOString();

            if (unreadPeerEntries.length > 0 || pendingObligations.length > 0) {
                this.recordEvent("done_rejected", sender, undefined, {
                    unreadPeerCount: unreadPeerEntries.length,
                    pendingObligationSeqs: pendingObligations.map((r) => r.seq),
                });
                const { requestsForYou, otherOpenRequests } =
                    this.computeRequestSummaries(sender);
                this.sendJson(res, 409, {
                    ok: false,
                    runId: this.runId,
                    caller: sender,
                    action_status: "REJECTED_OBLIGATIONS",
                    message: `Cannot mark '${sender}' done: ${unreadPeerEntries.length} unread peer entry(ies) and ${pendingObligations.length} unresolved request obligation(s) require attention.`,
                    last_seq: this.lastSeq,
                    entries: unreadPeerEntries,
                    pending_obligations: pendingObligations,
                    participants: this.cloneParticipants(),
                    requests_for_you: requestsForYou,
                    other_open_requests: otherOpenRequests,
                });
                return;
            }

            const prevStatus = this.participants[sender].status;
            this.participants[sender].status = "done";
            this.participants[sender].updatedAt = new Date().toISOString();

            const recovery = this.reconcileOrphanedRequests(sender);
            this.recordEvent("agent_status_transition", sender, undefined, {
                agent: sender,
                previousStatus: prevStatus,
                newStatus: "done",
                ...recovery,
            });
            this.notifyWaiters();

            const { requestsForYou, otherOpenRequests } = this.computeRequestSummaries(sender);
            this.sendJson(res, 200, {
                ok: true,
                runId: this.runId,
                caller: sender,
                action_status: "DONE",
                message: `Agent '${sender}' marked done (all obligations satisfied).`,
                last_seq: this.lastSeq,
                entries: [],
                participants: this.cloneParticipants(),
                requests_for_you: requestsForYou,
                other_open_requests: otherOpenRequests,
            });
            return;
        }

        this.sendJson(res, 404, {
            ok: false,
            runId: this.runId,
            action_status: "NOT_FOUND",
            message: `Unknown blackboard endpoint ${req.method} ${pathname}`,
        });
    }
}

export async function startBlackboardServer(
    runId: string,
    options: { repoDir?: string } = {},
): Promise<BlackboardServer> {
    const server = new BlackboardServer(runId, options);
    await server.start();
    return server;
}

export function finalizeRunCleanup(state: ActiveRunState | null, repoDir: string = process.cwd()): void {
    if (!state) return;

    if (state.blackboard) {
        try {
            state.blackboard.closeSync();
        } catch {
            // Best-effort blackboard shutdown during cleanup
        }
        state.blackboard = null;
    }

    // 1. Always remove and prune temporary worktree directories (after consolidating any leftover files)
    removeWorktreeDir(state.scanBranch1, { repoDir, consolidateBeforeRemove: true });
    removeWorktreeDir(state.scanBranch2, { repoDir, consolidateBeforeRemove: true });
    removeWorktreeDir(state.planBranch, { repoDir, consolidateBeforeRemove: true });
    ignoreMissing(["git", "worktree", "prune"], repoDir);

    // 2. Delete scanner branches ONLY if their commits are verified ancestors of planBranch or HEAD
    const scan1Merged =
        state.scan1MergedIntoPlan &&
        (isBranchAncestor(state.scanBranch1, state.planBranch, repoDir) ||
            isBranchAncestor(state.scanBranch1, "HEAD", repoDir));
    if (scan1Merged) {
        ignoreMissing(["git", "branch", "-D", state.scanBranch1], repoDir);
    } else if (branchExists(state.scanBranch1, repoDir)) {
        console.log(`[preserve] Preserving unmerged scanner branch ${state.scanBranch1}.`);
    }

    const scan2Merged =
        state.scan2MergedIntoPlan &&
        (isBranchAncestor(state.scanBranch2, state.planBranch, repoDir) ||
            isBranchAncestor(state.scanBranch2, "HEAD", repoDir));
    if (scan2Merged) {
        ignoreMissing(["git", "branch", "-D", state.scanBranch2], repoDir);
    } else if (branchExists(state.scanBranch2, repoDir)) {
        console.log(`[preserve] Preserving unmerged scanner branch ${state.scanBranch2}.`);
    }

    // 3. Delete planBranch IF AND ONLY IF merger completed, planBranch is an ancestor of HEAD on main, and main is clean
    const canDeletePlanBranch =
        state.planMergedAndVerifiedOnMain &&
        isBranchAncestor(state.planBranch, "HEAD", repoDir) &&
        isWorkingTreeClean(repoDir);

    if (canDeletePlanBranch) {
        ignoreMissing(["git", "branch", "-D", state.planBranch], repoDir);
    } else if (branchExists(state.planBranch, repoDir)) {
        console.log(
            `[preserve] Preserving unmerged plan branch ${state.planBranch} so committed stage work is not lost.`,
        );
    }
}

function handleInterrupt() {
    console.log("\n[!] Process interrupted. Cleaning Sandcastle worktree directories while preserving unmerged branches...");
    finalizeRunCleanup(activeRunState, process.cwd());
    activeRunState = null;
    process.exit(1);
}

process.on("SIGINT", handleInterrupt);
process.on("SIGTERM", handleInterrupt);

export function mergeInto(branch: string, fromBranch: string, repoDir: string = process.cwd()): void {
    const sourceWorktree = worktreeDir(fromBranch, repoDir);
    if (existsSync(sourceWorktree)) {
        commitLeftovers(sourceWorktree, fromBranch, "pre-merge-source");
    }

    const existing = worktreeDir(branch, repoDir);
    if (existsSync(existing)) {
        commitLeftovers(existing, branch, "pre-merge-target");
        try {
            execFileSync("git", ["merge", "--no-ff", "--no-edit", fromBranch], {
                cwd: existing,
                stdio: "inherit",
            });
        } catch (error) {
            let conflicted = "";
            try {
                conflicted = execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], {
                    cwd: existing,
                    encoding: "utf8",
                }).trim();
            } catch {
                // Ignore diff error
            }
            ignoreMissing(["git", "merge", "--abort"], existing);
            throw new Error(
                `Failed to merge ${fromBranch} into ${branch}${conflicted ? ` (conflicting paths: ${conflicted.split("\n").join(", ")})` : ""}: ${errorText(error)}`,
                { cause: error },
            );
        }
        return;
    }

    const dir = join(repoDir, `.sandcastle/worktrees/merge-${branch.replaceAll("/", "-")}`);
    ignoreMissing(["git", "worktree", "remove", "--force", dir], repoDir);
    ignoreMissing(["rm", "-rf", dir], repoDir);
    execFileSync("git", ["worktree", "add", dir, branch], { cwd: repoDir, stdio: "inherit" });
    try {
        execFileSync("git", ["merge", "--no-ff", "--no-edit", fromBranch], {
            cwd: dir,
            stdio: "inherit",
        });
    } catch (error) {
        let conflicted = "";
        try {
            conflicted = execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], {
                cwd: dir,
                encoding: "utf8",
            }).trim();
        } catch {
            // Ignore diff error
        }
        ignoreMissing(["git", "merge", "--abort"], dir);
        throw new Error(
            `Failed to merge ${fromBranch} into ${branch}${conflicted ? ` (conflicting paths: ${conflicted.split("\n").join(", ")})` : ""}: ${errorText(error)}`,
            { cause: error },
        );
    } finally {
        ignoreMissing(["git", "worktree", "remove", "--force", dir], repoDir);
        ignoreMissing(["rm", "-rf", dir], repoDir);
    }
}

export function parseImplementerStatusManifest(content: string): ImplementerStatusRecord[] {
    const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));

    if (lines.length === 0) {
        throw new Error(
            "Implementer status manifest is empty; expected at least one CHANGED mandatory target deliverable.",
        );
    }

    const records: ImplementerStatusRecord[] = [];
    for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length < 2) {
            throw new Error(
                `Malformed line in implementer-status.txt: '${line}'. Expected '<path> <CHANGED|UNCHANGED|READ_ONLY_CONTEXT> [reference]'.`,
            );
        }
        const [filePath, rawStatus, ...rest] = parts;
        if (
            rawStatus !== "CHANGED" &&
            rawStatus !== "UNCHANGED" &&
            rawStatus !== "READ_ONLY_CONTEXT"
        ) {
            throw new Error(
                `Invalid status '${rawStatus}' for '${filePath}' in implementer-status.txt. Expected CHANGED, UNCHANGED, or READ_ONLY_CONTEXT.`,
            );
        }
        records.push({
            path: filePath,
            status: rawStatus,
            reference: rest.join(" ") || "unspecified",
        });
    }
    return records;
}

export function isCandidateRepoTargetPath(candidate: string): boolean {
    if (!candidate || candidate.length === 0) return false;
    if (
        candidate.startsWith("/") ||
        candidate.startsWith("http://") ||
        candidate.startsWith("https://") ||
        candidate.startsWith("handoff/") ||
        candidate.startsWith("wayfinder/") ||
        candidate.startsWith("assets/") ||
        candidate === "LANGUAGE.md" ||
        /^functional_specification_\d+\.md$/i.test(candidate)
    ) {
        return false;
    }
    if (/[\s():;<>]/.test(candidate)) {
        return false;
    }
    if (/^ticket-\d+(?:\.md)?$/i.test(candidate) || /^INV-[A-Z0-9-]+$/.test(candidate) || /^AC-\d+$/.test(candidate)) {
        return false;
    }
    if (candidate === "Dockerfile" || candidate === "Makefile" || candidate.endsWith("/Dockerfile") || candidate.endsWith("/Makefile")) {
        return true;
    }
    if (candidate.includes("/")) {
        return /\.[a-zA-Z0-9]+$/.test(candidate);
    }
    return /\.(?:[mc]?[jt]sx?|py|json|ya?ml|toml|sh|sql|css|html|rs|go|md)$/i.test(candidate);
}

export function extractMandatoryTargetsFromMatrix(matrixMarkdown: string): string[] {
    const lines = matrixMarkdown.split("\n");
    const targets = new Set<string>();
    let inMandatorySection = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (/^#{1,4}\s+/.test(line)) {
            if (/mandatory\s+target|MANDATORY_TARGET/i.test(line) && !/READ_ONLY_CONTEXT/i.test(line)) {
                inMandatorySection = true;
            } else if (/read-only|READ_ONLY_CONTEXT|discovery\s+context/i.test(line) || /^#{1,2}\s+/.test(line)) {
                inMandatorySection = false;
            }
            continue;
        }

        const explicitTag = /\bMANDATORY_TARGET\b/.test(line) && !/\bREAD_ONLY_CONTEXT\b/.test(line);
        if (!inMandatorySection && !explicitTag) continue;

        // Ignore prose paragraphs that are neither markdown table rows nor list items
        const isTableRow = line.startsWith("|");
        const isListItem = /^(?:[-*+]|\d+\.)\s+/.test(line);
        if (!isTableRow && !isListItem) continue;

        if (isTableRow) {
            const cells = line
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c.length > 0);
            if (cells.length === 0) continue;
            // Skip table separator rows (e.g. |---|---|)
            if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;

            // Inspect only the file-path column (column 0, or column 1 if column 0 is a row index like '1' or '#')
            const pathCellIndex = /^\d+$/.test(cells[0]) ? 1 : 0;
            const pathCell = cells[pathCellIndex] ?? "";
            const cellSpans = Array.from(pathCell.matchAll(/`([^`]+)`/g)).map((m) => m[1].trim());
            const candidates = cellSpans.length > 0 ? cellSpans : [pathCell];
            for (const candidate of candidates) {
                if (isCandidateRepoTargetPath(candidate)) {
                    targets.add(candidate);
                    break;
                }
            }
            continue;
        }

        // For bulleted/numbered list items, only take the first valid repo path code span on the line
        // so description references (e.g. "- `src/a.js` — reads from `src/b.js` or `/styles.css`") are ignored
        const codeSpans = Array.from(line.matchAll(/`([^`]+)`/g)).map((m) => m[1].trim());
        for (const candidate of codeSpans) {
            if (isCandidateRepoTargetPath(candidate)) {
                targets.add(candidate);
                break;
            }
        }
    }

    return Array.from(targets);
}

export function validateImplementerStatusManifest(
    content: string,
    options: {
        mandatoryTargets?: Iterable<string>;
        readOnlyContextPaths?: Iterable<string>;
    } = {},
): {
    records: ImplementerStatusRecord[];
    changedPaths: string[];
    readOnlyPaths: string[];
} {
    const records = parseImplementerStatusManifest(content);
    const mandatorySet = new Set(
        Array.from(options.mandatoryTargets ?? [])
            .map((p) => p.trim())
            .filter((p) => p.length > 0),
    );
    const readOnlySet = new Set(
        Array.from(options.readOnlyContextPaths ?? [])
            .map((p) => p.trim())
            .filter((p) => p.length > 0),
    );

    const byPath = new Map<string, ImplementerStatusRecord>();
    for (const rec of records) {
        byPath.set(rec.path, rec);
    }

    const isReadOnlyContextPath = (rec: ImplementerStatusRecord): boolean => {
        if (mandatorySet.has(rec.path)) return false;
        if (rec.status === "READ_ONLY_CONTEXT") return true;
        if (rec.path.startsWith("assets/") || rec.path.startsWith("wayfinder/")) return true;
        if (readOnlySet.has(rec.path)) return true;
        return false;
    };

    const skippedMandatory: string[] = [];
    for (const mandatoryPath of mandatorySet) {
        const rec = byPath.get(mandatoryPath);
        if (!rec || rec.status !== "CHANGED") {
            skippedMandatory.push(
                `${mandatoryPath} (${rec ? rec.status : "MISSING_FROM_STATUS_MANIFEST"})`,
            );
        }
    }

    for (const rec of records) {
        if (rec.status === "UNCHANGED" && !isReadOnlyContextPath(rec)) {
            if (!mandatorySet.has(rec.path)) {
                skippedMandatory.push(`${rec.path} (UNCHANGED ${rec.reference})`);
            }
        }
    }

    if (skippedMandatory.length > 0) {
        throw new Error(
            `INV-FAIL-FAST-01 violation: mandatory target deliverable(s) left unimplemented/UNCHANGED in implementer-status.txt: ${skippedMandatory.join(", ")}`,
        );
    }

    const changedPaths = records
        .filter((rec) => rec.status === "CHANGED")
        .map((rec) => rec.path);
    const readOnlyPaths = records
        .filter((rec) => rec.status !== "CHANGED")
        .map((rec) => rec.path);

    if (changedPaths.length === 0) {
        throw new Error(
            "INV-FAIL-FAST-01 violation: implementer-status.txt contains zero CHANGED production files.",
        );
    }

    return { records, changedPaths, readOnlyPaths };
}

function readGitFileIfPresent(
    branch: string,
    relPath: string,
    repoDir: string,
): string | null {
    try {
        return execFileSync("git", ["show", `${branch}:${relPath}`], {
            cwd: repoDir,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        });
    } catch {
        return null;
    }
}

export function assertStageManifest(
    stageName: string,
    branch: string,
    manifestPaths: string | string[],
    repoDir: string = process.cwd(),
): void {
    const wtDir = worktreeDir(branch, repoDir);
    if (existsSync(wtDir)) {
        commitLeftovers(wtDir, branch, stageName);
    }

    const paths = Array.isArray(manifestPaths) ? manifestPaths : [manifestPaths];
    for (const manifestPath of paths) {
        let content: string;
        try {
            content = execFileSync("git", ["show", `${branch}:${manifestPath}`], {
                cwd: repoDir,
                encoding: "utf8",
                stdio: ["ignore", "pipe", "pipe"],
            });
        } catch (error) {
            throw new Error(
                `Stage '${stageName}' (${branch}) failed mandatory handoff verification: required manifest '${manifestPath}' is missing on branch '${branch}'.`,
                { cause: error },
            );
        }

        if (content.trim().length === 0) {
            throw new Error(
                `Stage '${stageName}' (${branch}) failed mandatory handoff verification: required manifest '${manifestPath}' is empty on branch '${branch}'.`,
            );
        }

        const statusMatch = /^handoff\/([^/]+)\/implementer-status\.txt$/.exec(manifestPath);
        if (statusMatch) {
            const runId = statusMatch[1];
            const scan1 = readGitFileIfPresent(branch, `handoff/${runId}/plan-scan-1.txt`, repoDir) ?? "";
            const scan2 = readGitFileIfPresent(branch, `handoff/${runId}/plan-scan-2.txt`, repoDir) ?? "";
            const readOnlyContextPaths = [...scan1.split("\n"), ...scan2.split("\n")]
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
            const matrixMd = readGitFileIfPresent(
                branch,
                `wayfinder/${runId}/master_component_to_edit_matrix.md`,
                repoDir,
            );
            const mandatoryTargets = matrixMd ? extractMandatoryTargetsFromMatrix(matrixMd) : [];
            validateImplementerStatusManifest(content, {
                mandatoryTargets,
                readOnlyContextPaths,
            });
        }
    }
}

export function assertPreMergeVerificationGate(
    planBranch: string,
    runId: string,
    repoDir: string = process.cwd(),
    options: {
        mandatoryTargets?: Iterable<string>;
        readOnlyContextPaths?: Iterable<string>;
    } = {},
): void {
    assertStageManifest(
        "pre-merge-gate",
        planBranch,
        [
            `handoff/${runId}/wayfinder-read-and-plan.txt`,
            `handoff/${runId}/implementer.txt`,
            `handoff/${runId}/implementer-status.txt`,
            `handoff/${runId}/reviewer.txt`,
        ],
        repoDir,
    );

    const statusContent = readGitFileIfPresent(
        planBranch,
        `handoff/${runId}/implementer-status.txt`,
        repoDir,
    );
    if (!statusContent) {
        throw new Error(
            `Pre-merge verification gate failed: 'handoff/${runId}/implementer-status.txt' is missing on '${planBranch}'.`,
        );
    }

    const scan1 = readGitFileIfPresent(planBranch, `handoff/${runId}/plan-scan-1.txt`, repoDir) ?? "";
    const scan2 = readGitFileIfPresent(planBranch, `handoff/${runId}/plan-scan-2.txt`, repoDir) ?? "";
    const defaultReadOnly = [...scan1.split("\n"), ...scan2.split("\n")]
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const matrixMd = readGitFileIfPresent(
        planBranch,
        `wayfinder/${runId}/master_component_to_edit_matrix.md`,
        repoDir,
    );
    const defaultMandatory = matrixMd ? extractMandatoryTargetsFromMatrix(matrixMd) : [];

    validateImplementerStatusManifest(statusContent, {
        mandatoryTargets: options.mandatoryTargets ?? defaultMandatory,
        readOnlyContextPaths: options.readOnlyContextPaths ?? defaultReadOnly,
    });

    const testerTxt = readGitFileIfPresent(planBranch, `handoff/${runId}/tester.txt`, repoDir);
    const testPlanTxt = readGitFileIfPresent(planBranch, `handoff/${runId}/test-plan.txt`, repoDir);
    const activeTesterManifest =
        testerTxt && testerTxt.trim().length > 0
            ? testerTxt
            : testPlanTxt && testPlanTxt.trim().length > 0
              ? testPlanTxt
              : null;

    if (!activeTesterManifest) {
        throw new Error(
            `Pre-merge verification gate failed: neither 'handoff/${runId}/tester.txt' nor 'handoff/${runId}/test-plan.txt' is committed and non-empty on '${planBranch}'.`,
        );
    }

    const testerArtifacts = activeTesterManifest
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (testerArtifacts.length === 0) {
        throw new Error(
            `Pre-merge verification gate failed: tester manifest on '${planBranch}' lists zero test artifacts.`,
        );
    }

    for (const artifactPath of testerArtifacts) {
        const existsOnBranch = readGitFileIfPresent(planBranch, artifactPath, repoDir);
        if (existsOnBranch === null) {
            throw new Error(
                `Pre-merge verification gate failed: test artifact '${artifactPath}' listed in tester manifest is not committed on '${planBranch}'.`,
            );
        }
    }
}

export function readSeeds(path: string, repoDir: string = process.cwd()): string[] {
    const fullPath = resolve(repoDir, path);
    if (!existsSync(fullPath)) {
        throw new Error(`${path} is missing. No run starts.`);
    }
    const seeds = readFileSync(fullPath, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    if (seeds.length === 0) {
        throw new Error(`${path} is empty. No run starts.`);
    }
    const seen = new Set<string>();
    for (const seed of seeds) {
        if (seen.has(seed)) {
            throw new Error(`duplicate seed ${seed}. No run starts.`);
        }
        seen.add(seed);
        if (!existsSync(resolve(repoDir, seed))) {
            throw new Error(`missing seed ${seed}. No run starts.`);
        }
    }
    return seeds;
}

export function isCommittedOnHead(relPath: string, repoDir: string = process.cwd()): boolean {
    try {
        execFileSync("git", ["cat-file", "-e", `HEAD:${relPath}`], {
            cwd: repoDir,
            stdio: "ignore",
        });
        const status = execFileSync("git", ["status", "--porcelain", "--", relPath], {
            cwd: repoDir,
            encoding: "utf8",
        });
        return status.trim().length === 0;
    } catch {
        return false;
    }
}

export function assertPreFlightReady(
    authoredPath = "handoff/authored.txt",
    repoDir: string = process.cwd(),
): string[] {
    // 1. Ensure grep and blackboard shims are bootstrapped and identical to tracked versions
    bootstrapGrepShim(repoDir);
    bootstrapBlackboardShim(repoDir);

    // 2. Verify active branch is 'main'
    const currentBranch = execFileSync("git", ["branch", "--show-current"], {
        cwd: repoDir,
        encoding: "utf8",
    }).trim();
    if (currentBranch !== "main") {
        throw new Error(
            `Pre-flight check failed: active branch is '${currentBranch || "detached HEAD"}', but must be 'main'. No run starts.`,
        );
    }

    // 3. Verify no node_modules or transient cache files are tracked in the git index
    const trackedFiles = execFileSync("git", ["ls-files"], {
        cwd: repoDir,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
    })
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const prohibitedTracked = trackedFiles.filter((filePath) => {
        const segments = filePath.split("/");
        return (
            segments[0] === "node_modules" ||
            filePath.endsWith(".blend") ||
            filePath.endsWith(".blend1") ||
            filePath.endsWith(".obj") ||
            segments.some((seg) => TRANSIENT_CACHE_NAMES.has(seg))
        );
    });
    if (prohibitedTracked.length > 0) {
        const sample = prohibitedTracked.slice(0, 10).join(", ");
        throw new Error(
            `Pre-flight check failed: ${prohibitedTracked.length} prohibited transient/dependency file(s) are tracked in git (${sample}${prohibitedTracked.length > 10 ? ", ..." : ""}). Untrack them with 'git rm -r --cached' and commit before starting.`,
        );
    }

    // Clean any untracked OS/Python cache artifacts on the host before checking git status
    cleanTransientWorktreeArtifacts(repoDir);

    // 4. Verify working tree on 'main' is completely clean
    const dirtyStatus = execFileSync("git", ["status", "--porcelain"], {
        cwd: repoDir,
        encoding: "utf8",
    });
    if (dirtyStatus.trim().length > 0) {
        throw new Error(
            `Pre-flight check failed: working tree on 'main' is dirty prior to launch. Dirty paths:\n${dirtyStatus.trim()}`,
        );
    }

    // 5. Verify handoff/authored.txt and all seeds exist and are committed on HEAD
    const seeds = readSeeds(authoredPath, repoDir);
    if (!isCommittedOnHead(authoredPath, repoDir)) {
        throw new Error(
            `Pre-flight check failed: '${authoredPath}' is not committed on HEAD. Commit '${authoredPath}' on 'main' before starting.`,
        );
    }

    for (const seed of seeds) {
        if (!isCommittedOnHead(seed, repoDir)) {
            throw new Error(
                `Pre-flight check failed: seed specification '${seed}' listed in '${authoredPath}' is not committed on HEAD.`,
            );
        }
    }

    // 6. Verify all required .sandcastle prompt, registry, and shim files exist and are committed on HEAD
    for (const requiredFile of REQUIRED_SANDCASTLE_FILES) {
        const fullRequiredPath = resolve(repoDir, requiredFile);
        if (!existsSync(fullRequiredPath)) {
            throw new Error(
                `Pre-flight check failed: required file '${requiredFile}' is missing from disk.`,
            );
        }
        if (!isCommittedOnHead(requiredFile, repoDir)) {
            throw new Error(
                `Pre-flight check failed: required file '${requiredFile}' is not committed on HEAD.`,
            );
        }
    }

    return seeds;
}

export function mintRunId(): string {
    return `${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "")}-${String(Date.now() % 1000).padStart(3, "0")}-${Math.random().toString(36).slice(2, 6)}`;
}

export function assertClean(planBranch: string, repoDir: string = process.cwd()): void {
    const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: repoDir,
        encoding: "utf8",
    });
    if (status.trim().length > 0) {
        throw new Error(
            `open project dirty after joining ${planBranch}:\n${status.trim()}`,
        );
    }
}

let worktreeCreationChain: Promise<void> = Promise.resolve();

export function ensureWorktree(branch: string, repoDir: string = process.cwd()): Promise<string> {
    const task = worktreeCreationChain.then(() => {
        if (branch === "main" || branch === "HEAD") {
            return repoDir;
        }
        const wtDir = worktreeDir(branch, repoDir);
        if (existsSync(wtDir)) {
            return wtDir;
        }
        mkdirSync(join(repoDir, ".sandcastle", "worktrees"), { recursive: true });
        ignoreMissing(["git", "worktree", "prune"], repoDir);
        const args = [
            "-c",
            "checkout.workers=0",
            "-c",
            "branch.autoSetupMerge=false",
            "-c",
            "push.autoSetupRemote=false",
            "worktree",
            "add",
            ...(branchExists(branch, repoDir) ? [wtDir, branch] : ["-b", branch, wtDir, "HEAD"]),
        ];
        execFileSync("git", args, { cwd: repoDir, stdio: "inherit" });
        return wtDir;
    });
    worktreeCreationChain = task.then(
        () => undefined,
        () => undefined,
    );
    return task;
}

export async function runWithLockRetry<T extends { commits: unknown[] }>(
    name: string,
    branch: string,
    launch: () => Promise<T>,
    options: { maxAttempts?: number; baseDelayMs?: number; repoDir?: string } = {},
): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 6;
    const baseDelayMs = options.baseDelayMs ?? 500;
    const repoDir = options.repoDir ?? process.cwd();
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await ensureWorktree(branch, repoDir);
            const result = await launch();
            console.log(`${name} (${branch}) commits: ${result.commits.length}`);
            return result;
        } catch (error) {
            if (!isGitLock(error) || attempt === maxAttempts) throw error;
            console.log(`${name} (${branch}) hit git/worktree lock, retry ${attempt}/${maxAttempts - 1}`);
            await sleep(baseDelayMs * attempt);
        }
    }
    throw new Error(`${name} (${branch}) failed after git lock retries`);
}

export async function runStageWithManifestGate<T extends { commits: unknown[] }>(
    stageName: string,
    branch: string,
    manifestPaths: string | string[],
    launch: () => Promise<T>,
    options: {
        repoDir?: string;
        maxStageAttempts?: number;
        onAttemptStart?: (attempt: number) => void;
        onStageSettled?: (outcome: "settled" | "terminated", error?: unknown) => void;
    } = {},
): Promise<T> {
    const repoDir = options.repoDir ?? process.cwd();
    const maxStageAttempts = options.maxStageAttempts ?? 2;

    let lastError: unknown;
    try {
        for (let stageAttempt = 1; stageAttempt <= maxStageAttempts; stageAttempt++) {
            options.onAttemptStart?.(stageAttempt);
            const result = await runWithLockRetry(stageName, branch, launch, { repoDir });
            const wtDir = worktreeDir(branch, repoDir);
            if (existsSync(wtDir)) {
                commitLeftovers(wtDir, branch, stageName);
            }
            try {
                assertStageManifest(stageName, branch, manifestPaths, repoDir);
                options.onStageSettled?.("settled");
                return result;
            } catch (manifestError) {
                lastError = manifestError;
                if (stageAttempt < maxStageAttempts) {
                    console.warn(
                        `[manifest-gate] ${errorText(manifestError)} Retrying stage '${stageName}' (${stageAttempt}/${maxStageAttempts - 1})...`,
                    );
                }
            }
        }
    } catch (fatalError) {
        options.onStageSettled?.("terminated", fatalError);
        throw fatalError;
    }

    const finalErr =
        lastError instanceof Error
            ? lastError
            : new Error(`Stage '${stageName}' (${branch}) failed manifest verification gate.`);
    options.onStageSettled?.("terminated", finalErr);
    throw finalErr;
}

export async function runPipeline(authoredPath = "handoff/authored.txt"): Promise<void> {
    const seeds = assertPreFlightReady(authoredPath, process.cwd());
    mkdirSync(".sandcastle/logs", { recursive: true });

    for (const seed of seeds) {
        // Re-verify pre-flight cleanliness on main before each seed run starts
        assertPreFlightReady(authoredPath, process.cwd());

        const runId = mintRunId();
        const planBranch = `agent/plan-${runId}`;
        const scanBranch1 = `agent/plan-scan-1-${runId}`;
        const scanBranch2 = `agent/plan-scan-2-${runId}`;

        const runState: ActiveRunState = {
            runId,
            planBranch,
            scanBranch1,
            scanBranch2,
            scan1MergedIntoPlan: false,
            scan2MergedIntoPlan: false,
            planMergedAndVerifiedOnMain: false,
            blackboard: null,
        };
        activeRunState = runState;

        try {
            const base = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
            console.log(`seed ${seed} from ${base} (runId=${runId})`);

            function fileLog(name: string) {
                return {
                    type: "file" as const,
                    verbose: true,
                    path: `.sandcastle/logs/${runId}-${name}.log`,
                };
            }

            const parallel: ReadonlyArray<{
                name: BlackboardAgentId;
                branch: string;
                promptFile: string;
                model: string;
                manifest: string;
            }> = [
                {
                    name: "plan",
                    branch: planBranch,
                    promptFile: "./.sandcastle/plan.md",
                    model: STAGE_MODELS.plan,
                    manifest: `handoff/${runId}/wayfinder-read-and-plan.txt`,
                },
                {
                    name: "plan-scan-1",
                    branch: scanBranch1,
                    promptFile: "./.sandcastle/plan-scan-1.md",
                    model: STAGE_MODELS["plan-scan-1"],
                    manifest: `handoff/${runId}/plan-scan-1.txt`,
                },
                {
                    name: "plan-scan-2",
                    branch: scanBranch2,
                    promptFile: "./.sandcastle/plan-scan-2.md",
                    model: STAGE_MODELS["plan-scan-2"],
                    manifest: `handoff/${runId}/plan-scan-2.txt`,
                },
            ];

            for (const agent of parallel) {
                await ensureWorktree(agent.branch);
            }

            const blackboard = await startBlackboardServer(runId, { repoDir: process.cwd() });
            runState.blackboard = blackboard;
            console.log(`[blackboard] Started ephemeral three-way mesh for ${runId} at ${blackboard.url}`);

            let settled: PromiseSettledResult<{ commits: unknown[] }>[];
            try {
                settled = await Promise.allSettled(
                    parallel.map((agent) =>
                        runStageWithManifestGate(
                            agent.name,
                            agent.branch,
                            agent.manifest,
                            () =>
                                run({
                                    name: agent.name,
                                    agent: antigravity(
                                        agent.model,
                                        blackboard.agentEnv(agent.name),
                                    ),
                                    sandbox: noSandbox(),
                                    maxIterations: 5,
                                    promptFile: agent.promptFile,
                                    promptArgs: {
                                        BRANCH: agent.branch,
                                        RUN_ID: runId,
                                        SEED_PATH: seed,
                                    },
                                    branchStrategy: { type: "branch", branch: agent.branch },
                                    logging: fileLog(agent.name),
                                    idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
                                }),
                            {
                                onAttemptStart: () => blackboard.markAgentActive(agent.name),
                                onStageSettled: (outcome, err) => {
                                    if (outcome === "settled") {
                                        blackboard.markAgentSettled(agent.name);
                                    } else {
                                        blackboard.markAgentTerminated(
                                            agent.name,
                                            errorText(err),
                                        );
                                    }
                                },
                            },
                        ),
                    ),
                );
            } finally {
                await blackboard.close();
                runState.blackboard = null;
            }

            // Consolidate any leftover worktree changes across all three parallel branches before checking rejections
            for (const agent of parallel) {
                const wtDir = worktreeDir(agent.branch);
                if (existsSync(wtDir)) {
                    commitLeftovers(wtDir, agent.branch, agent.name);
                }
            }

            for (const [index, result] of settled.entries()) {
                const agent = parallel[index];
                if (result.status === "rejected") {
                    throw new Error(
                        `${agent.name} (${agent.branch}) failed for ${seed}. Later seeds do not start.`,
                        {
                            cause: result.reason,
                        },
                    );
                }
            }

            mergeInto(planBranch, scanBranch1);
            runState.scan1MergedIntoPlan = isBranchAncestor(scanBranch1, planBranch);

            mergeInto(planBranch, scanBranch2);
            runState.scan2MergedIntoPlan = isBranchAncestor(scanBranch2, planBranch);

            // Verify all three parallel manifests are committed and non-empty on planBranch after join
            assertStageManifest("parallel-join", planBranch, [
                `handoff/${runId}/wayfinder-read-and-plan.txt`,
                `handoff/${runId}/plan-scan-1.txt`,
                `handoff/${runId}/plan-scan-2.txt`,
            ]);

            // Reclaim scanner worktree disk copies and delete merged scanner branches
            console.log(`[cleanup] Reclaiming scanner worktrees for ${runId}...`);
            teardownWorktree(scanBranch1, {
                deleteBranch: runState.scan1MergedIntoPlan,
                verifiedTargetRef: planBranch,
                requireCleanHost: false,
            });
            teardownWorktree(scanBranch2, {
                deleteBranch: runState.scan2MergedIntoPlan,
                verifiedTargetRef: planBranch,
                requireCleanHost: false,
            });

            const sequence = buildSequentialStages(runId);

            for (const step of sequence) {
                await runStageWithManifestGate(step.name, planBranch, step.manifests, () =>
                    run({
                        name: step.name,
                        agent: antigravity(step.model),
                        sandbox: noSandbox(),
                        maxIterations: 5,
                        promptFile: step.promptFile,
                        promptArgs: { BRANCH: planBranch, RUN_ID: runId, SEED_PATH: seed },
                        branchStrategy: { type: "branch", branch: planBranch },
                        logging: fileLog(step.name),
                        idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
                    }),
                );
            }

            // Consolidate any remaining changes and remove the planBranch worktree directory before merger runs on main
            removeWorktreeDir(planBranch, { consolidateBeforeRemove: true });
            ignoreMissing(["git", "worktree", "prune"]);

            // Enforce Pre-Merge Verification Gate across plan, implement, review, and tester manifests & test artifacts
            assertPreMergeVerificationGate(planBranch, runId, process.cwd());

            const merger = await runWithLockRetry("merger", "main", () =>
                run({
                    name: "merger",
                    agent: antigravity(STAGE_MODELS.merger),
                    sandbox: noSandbox(),
                    maxIterations: 5,
                    promptFile: "./.sandcastle/merger.md",
                    promptArgs: { PLAN_BRANCH: planBranch, RUN_ID: runId },
                    branchStrategy: { type: "head" },
                    logging: fileLog("merger"),
                    idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
                }),
            );
            console.log(`merger (${planBranch}) commits: ${merger.commits.length}`);

            if (!isBranchAncestor(planBranch, "HEAD")) {
                throw new Error(
                    `merger failed verification: ${planBranch} is not an ancestor of HEAD on main.`,
                );
            }
            assertClean(planBranch);
            runState.planMergedAndVerifiedOnMain = true;
            console.log(`joined ${planBranch} for ${seed}`);
        } finally {
            // Runs unconditionally on success, crash, or error:
            // Removes worktree directories and prunes, but deletes planBranch ONLY if merged & verified on main
            finalizeRunCleanup(runState, process.cwd());
            activeRunState = null;
        }
    }

    console.log(`joined ${seeds.length} plan branch(es)`);
}

function isMainEntry(): boolean {
    if (!process.argv[1]) return false;
    try {
        return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
    } catch {
        return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
    }
}

if (isMainEntry()) {
    runPipeline("handoff/authored.txt").catch((error) => {
        console.error(errorText(error));
        process.exit(1);
    });
}