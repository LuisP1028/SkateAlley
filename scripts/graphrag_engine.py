#!/usr/bin/env python3
"""
Unified Property-Graph Retrieval Engine (GraphRAG) & Intro Deck JSON Schema Validator
for Freeman Alley (SkateAlley) — Functional Specification 065 (§5.3.2 & §5.4).

Pure Python 3 standard-library implementation (zero external pip dependencies,
compatible with read-only container bind mounts).
"""

import json
import math
import os
import re
import threading
import time
from collections import deque

ALLOWED_NODE_TYPES = frozenset({
    "Person",
    "Education",
    "Skill",
    "Technology",
    "ModelArchitecture",
    "ProjectStation",
    "MathPod",
    "GamePort",
    "Pipeline",
    "Story",
    "ContactChannel",
})

STOPWORDS = frozenset({
    "a", "about", "after", "all", "also", "am", "an", "and", "any", "are", "as",
    "at", "be", "because", "been", "before", "being", "between", "both", "but",
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each",
    "few", "for", "from", "further", "get", "getting", "got", "had", "has",
    "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
    "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
    "know", "let", "like", "make", "me", "more", "most", "my", "myself", "no",
    "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "our",
    "ours", "ourselves", "out", "over", "own", "please", "same", "she", "should",
    "so", "some", "such", "tell", "than", "that", "the", "their", "theirs",
    "them", "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "us", "very", "was", "we",
    "were", "what", "when", "where", "which", "while", "who", "whom", "why",
    "will", "with", "would", "you", "your", "yours", "yourself", "yourselves",
})

# ==============================================================================
# Authoritative 7-Card Anchor Deck & Draft 2020-12 JSON Schema (§5.3.1 & §5.3.2)
# ==============================================================================
AUTHORITATIVE_INTRO_ANCHOR_CARDS = [
    {
        "index": 1,
        "id": "card_01",
        "header": "01 // WELCOME",
        "body": "Welcome to my portfolio! My name’s Luis, I’m 26 and I build software that feels like magic.",
        "requires_question_prompt": False,
    },
    {
        "index": 2,
        "id": "card_02",
        "header": "02 // ABOUT ME",
        "body": (
            "My free time is split between hiking, swimming, eating good food and building. "
            "I studied corporate finance and accounting in college, but changed my major to "
            "Philosophy and Religion during the COVID era. I speedran AI psychosis with GPT3.5 "
            "back in 2022, and have been accelerating ever since. e/acc, baby."
        ),
        "requires_question_prompt": False,
    },
    {
        "index": 3,
        "id": "card_03",
        "header": "03 // PROJECTS & ARCHITECTURE",
        "body": (
            "Down this alley you will find some of my work on display, alongside descriptions "
            "of where I excel in the technical stack."
        ),
        "requires_question_prompt": False,
    },
    {
        "index": 4,
        "id": "card_04",
        "header": "04 // EXPLORE THE ALLEY",
        "body": (
            "Recently, a “reverse engineer anything” repo popped up on Github that led me and a "
            "bunch of other nerds to reverse-engineer— well— everything. From toilet sensors and "
            "smartTVs, to video games and critical infrastructure."
        ),
        "requires_question_prompt": False,
    },
    {
        "index": 5,
        "id": "card_05",
        "header": "05 // GAMES",
        "body": (
            "Let’s steer clear of reverse engineering critical infrastructure for now, and stick "
            "to games. Down the alleyway, you’ll find some decompiled games you can play, as well "
            "as a generative pipeline I created to put yourself in-game!"
        ),
        "requires_question_prompt": False,
    },
    {
        "index": 6,
        "id": "card_06",
        "header": "06 // GENERATIVE PIPELINE",
        "body": (
            "You can skate, commit grand theft auto, fight in Super Smash Bros, kill zombies, "
            "or just join me in the alleyway."
        ),
        "requires_question_prompt": False,
    },
    {
        "index": 7,
        "id": "card_07",
        "header": "07 // MENU",
        "body": (
            "You can use the menu to leave a message in the alleyway for myself and others to see. "
            "Job recruiters will be visiting the alleyway so TREAD LIGHTLY. I MEAN IT. DON’T BE A "
            "DICKHEAD, DEVON! You can also check out my GitHub, send me an email, or follow me on Twitter.\n\n"
            "Oh and by the way, this conversation is generative. Do you have any questions for me?"
        ),
        "requires_question_prompt": True,
    },
]

EXPECTED_CARD_IDS = [c["id"] for c in AUTHORITATIVE_INTRO_ANCHOR_CARDS]
EXPECTED_CARD_HEADERS = [c["header"] for c in AUTHORITATIVE_INTRO_ANCHOR_CARDS]

INTRO_DECK_JSON_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "FreemanAlleyGenerativeIntroDeck",
    "type": "object",
    "additionalProperties": False,
    "required": ["schema_version", "cards"],
    "properties": {
        "schema_version": {
            "type": "string",
            "const": "1.0",
        },
        "cards": {
            "type": "array",
            "minItems": 7,
            "maxItems": 7,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "index",
                    "id",
                    "header",
                    "body",
                    "requires_question_prompt",
                ],
                "properties": {
                    "index": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 7,
                    },
                    "id": {
                        "type": "string",
                        "enum": EXPECTED_CARD_IDS,
                    },
                    "header": {
                        "type": "string",
                        "enum": EXPECTED_CARD_HEADERS,
                    },
                    "body": {
                        "type": "string",
                        "minLength": 45,
                        "maxLength": 440,
                    },
                    "requires_question_prompt": {
                        "type": "boolean",
                    },
                },
            },
        },
    },
}


def validate_intro_deck_payload(payload):
    """
    Strictly validate a decoded JSON payload against INTRO_DECK_JSON_SCHEMA
    and the §5.3.2 server-side post-generation invariants.
    Returns (is_valid: bool, errors: list[str], normalized_deck: dict | None).
    """
    errors = []
    if not isinstance(payload, dict):
        return False, ["Root payload must be a JSON object."], None

    extra_root = set(payload.keys()) - {"schema_version", "cards"}
    if extra_root:
        errors.append(f"Disallowed additional root properties: {sorted(extra_root)}")

    if payload.get("schema_version") != "1.0":
        errors.append(f"schema_version must equal '1.0', got {payload.get('schema_version')!r}")

    cards = payload.get("cards")
    if not isinstance(cards, list) or len(cards) != 7:
        count = len(cards) if isinstance(cards, list) else type(cards).__name__
        errors.append(f"cards must be an array of exactly 7 items, got {count}")
        return False, errors, None

    allowed_card_keys = {"index", "id", "header", "body", "requires_question_prompt"}
    normalized_cards = []

    for pos, card in enumerate(cards):
        expected_idx = pos + 1
        expected_id = EXPECTED_CARD_IDS[pos]
        expected_header = EXPECTED_CARD_HEADERS[pos]
        expected_q_prompt = expected_idx == 7

        if not isinstance(card, dict):
            errors.append(f"Card at position {pos} must be an object.")
            continue

        missing = allowed_card_keys - set(card.keys())
        extra = set(card.keys()) - allowed_card_keys
        if missing:
            errors.append(f"Card {expected_idx} missing required keys: {sorted(missing)}")
        if extra:
            errors.append(f"Card {expected_idx} has disallowed additional properties: {sorted(extra)}")

        idx_val = card.get("index")
        if type(idx_val) is not int or idx_val != expected_idx:
            errors.append(f"Card {expected_idx} index must be integer {expected_idx}, got {idx_val!r}")

        id_val = card.get("id")
        if id_val != expected_id:
            errors.append(f"Card {expected_idx} id must be {expected_id!r}, got {id_val!r}")

        header_val = card.get("header")
        if header_val != expected_header:
            errors.append(f"Card {expected_idx} header must be {expected_header!r}, got {header_val!r}")

        body_val = card.get("body")
        if not isinstance(body_val, str):
            errors.append(f"Card {expected_idx} body must be a string.")
            body_clean = ""
        else:
            body_clean = body_val.strip()
            if len(body_clean) < 45 or len(body_clean) > 440:
                errors.append(
                    f"Card {expected_idx} body length must be within [45, 440], got {len(body_clean)}"
                )

        req_q = card.get("requires_question_prompt")
        if type(req_q) is not bool or req_q != expected_q_prompt:
            errors.append(
                f"Card {expected_idx} requires_question_prompt must be {expected_q_prompt}, got {req_q!r}"
            )

        normalized_cards.append({
            "index": expected_idx,
            "id": expected_id,
            "header": expected_header,
            "body": body_clean,
            "requires_question_prompt": expected_q_prompt,
        })

    if not errors and len(normalized_cards) == 7:
        c1_lower = normalized_cards[0]["body"].lower()
        c2_lower = normalized_cards[1]["body"].lower()
        c7_body = normalized_cards[6]["body"]
        c7_lower = c7_body.lower()

        if "luis" not in c1_lower or "26" not in c1_lower:
            errors.append("Card 1 body must preserve mandatory anchor beats ('Luis' and age '26').")
        if "e/acc" not in c2_lower:
            errors.append("Card 2 body must preserve mandatory anchor beat ('e/acc').")
        if "philosophy" not in c2_lower:
            errors.append("Card 2 body must preserve mandatory anchor beat ('Philosophy').")
        if "devon" not in c7_lower:
            errors.append("Card 7 body must preserve the recruiter/Devon warning ('DEVON').")
        if not c7_body.rstrip().endswith("?"):
            errors.append("Card 7 body must conclude with a direct question ('?').")

    if errors:
        return False, errors, None

    return True, [], {
        "schema_version": "1.0",
        "cards": normalized_cards,
    }


# ==============================================================================
# Tokenization & Property-Graph Retrieval Engine (§5.4)
# ==============================================================================
_RAW_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9._/$+-]*")
_ALNUM_SUBTOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize_text(text, include_stopwords=False):
    """Extract normalized search tokens (preserving compound tokens like 'bge-large-en-v1.5' and 'e/acc' plus sub-parts)."""
    if not text:
        return []
    lowered = str(text).lower().replace("’", "'").replace("“", '"').replace("”", '"')
    tokens = []
    for raw in _RAW_TOKEN_RE.findall(lowered):
        cleaned = raw.strip("._+-/$")
        if not cleaned:
            continue
        if include_stopwords or cleaned not in STOPWORDS:
            if len(cleaned) >= 2 or cleaned.isdigit():
                tokens.append(cleaned)
        for sub in _ALNUM_SUBTOKEN_RE.findall(cleaned):
            if sub != cleaned and (len(sub) >= 2 or sub.isdigit()):
                if include_stopwords or sub not in STOPWORDS:
                    tokens.append(sub)
    return tokens


def normalize_phrase(text):
    if not text:
        return ""
    lowered = str(text).lower().replace("’", "'")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9/$+.-]+", " ", lowered)).strip()


def _flatten_attributes_text(attrs):
    if not isinstance(attrs, dict):
        return ""
    parts = []
    for k, v in attrs.items():
        parts.append(str(k).replace("_", " "))
        if isinstance(v, (list, tuple)):
            parts.extend(str(item) for item in v)
        elif isinstance(v, dict):
            for sk, sv in v.items():
                parts.append(f"{sk} {sv}")
        else:
            parts.append(str(v))
    return " ".join(parts)


class KnowledgeGraphEngine:
    """
    Hot-reloadable in-memory property graph with mtime watching, referential-integrity
    validation, IDF-weighted lexical + alias seed resolution, and bounded k-hop weighted BFS.
    """

    def __init__(self, json_path):
        self._json_path = os.path.abspath(json_path)
        self._lock = threading.RLock()
        self._last_checked_mtime_ns = None
        self._ready = False
        self._error_code = "UNINITIALIZED"
        self._error_message = "Knowledge graph has not been loaded yet."
        self._last_loaded_at_ms = 0
        self._dataset_version = None
        self._schema_version = None
        self._nodes = []
        self._nodes_by_id = {}
        self._edges = []
        self._outgoing = {}
        self._incoming = {}
        self._categories = {}
        self._idf = {}
        self._node_index = {}
        self.ensure_fresh()

    @property
    def json_path(self):
        return self._json_path

    def ensure_fresh(self):
        """Check file mtime and atomically reload/validate whenever edited on disk."""
        with self._lock:
            try:
                st = os.stat(self._json_path)
                mtime_ns = st.st_mtime_ns
            except OSError as exc:
                self._mark_invalid(
                    "GRAPH_FILE_MISSING",
                    f"Knowledge graph file '{self._json_path}' is missing or unreadable: {exc}",
                    mtime_ns=None,
                )
                return False

            if self._last_checked_mtime_ns == mtime_ns:
                return self._ready

            return self._load_from_disk_unlocked(mtime_ns)

    def _mark_invalid(self, code, message, mtime_ns):
        self._ready = False
        self._error_code = code
        self._error_message = message
        self._last_checked_mtime_ns = mtime_ns
        self._last_loaded_at_ms = int(time.time() * 1000)

    def _load_from_disk_unlocked(self, mtime_ns):
        try:
            with open(self._json_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
        except OSError as exc:
            self._mark_invalid("GRAPH_READ_ERROR", f"Failed reading '{self._json_path}': {exc}", mtime_ns)
            return False

        try:
            doc = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            self._mark_invalid(
                "GRAPH_JSON_SYNTAX_ERROR",
                f"Malformed JSON in '{os.path.basename(self._json_path)}' at line {exc.lineno}, column {exc.colno}: {exc.msg}",
                mtime_ns,
            )
            return False

        if not isinstance(doc, dict):
            self._mark_invalid("GRAPH_SCHEMA_ERROR", "Root JSON value must be an object.", mtime_ns)
            return False

        dataset_version = doc.get("dataset_version")
        if not isinstance(dataset_version, str) or not dataset_version.strip():
            self._mark_invalid("GRAPH_SCHEMA_ERROR", "Missing non-empty string 'dataset_version'.", mtime_ns)
            return False

        raw_nodes = doc.get("nodes")
        raw_edges = doc.get("edges")
        if not isinstance(raw_nodes, list) or len(raw_nodes) == 0:
            self._mark_invalid("GRAPH_SCHEMA_ERROR", "'nodes' must be a non-empty array.", mtime_ns)
            return False
        if not isinstance(raw_edges, list) or len(raw_edges) == 0:
            self._mark_invalid("GRAPH_SCHEMA_ERROR", "'edges' must be a non-empty array.", mtime_ns)
            return False

        nodes = []
        nodes_by_id = {}
        categories = {}

        for idx, n in enumerate(raw_nodes):
            if not isinstance(n, dict):
                self._mark_invalid("GRAPH_NODE_INVALID", f"Node at index {idx} is not an object.", mtime_ns)
                return False

            node_id = n.get("id")
            node_type = n.get("type")
            label = n.get("label")
            aliases = n.get("aliases")
            summary = n.get("summary")
            attributes = n.get("attributes")
            priority = n.get("priority")

            if not isinstance(node_id, str) or not node_id.strip():
                self._mark_invalid("GRAPH_NODE_INVALID", f"Node at index {idx} missing valid string 'id'.", mtime_ns)
                return False
            if node_id in nodes_by_id:
                self._mark_invalid("GRAPH_DUPLICATE_NODE", f"Duplicate node id '{node_id}'.", mtime_ns)
                return False
            if node_type not in ALLOWED_NODE_TYPES:
                self._mark_invalid(
                    "GRAPH_NODE_TYPE_INVALID",
                    f"Node '{node_id}' has unsupported type {node_type!r}; allowed: {sorted(ALLOWED_NODE_TYPES)}.",
                    mtime_ns,
                )
                return False
            if not isinstance(label, str) or not label.strip():
                self._mark_invalid("GRAPH_NODE_INVALID", f"Node '{node_id}' missing non-empty 'label'.", mtime_ns)
                return False
            if not isinstance(aliases, list) or not all(isinstance(a, str) for a in aliases):
                self._mark_invalid("GRAPH_NODE_INVALID", f"Node '{node_id}' 'aliases' must be an array of strings.", mtime_ns)
                return False
            if not isinstance(summary, str) or not summary.strip():
                self._mark_invalid("GRAPH_NODE_INVALID", f"Node '{node_id}' missing non-empty 'summary'.", mtime_ns)
                return False
            if not isinstance(attributes, dict):
                self._mark_invalid("GRAPH_NODE_INVALID", f"Node '{node_id}' 'attributes' must be an object.", mtime_ns)
                return False
            if not isinstance(priority, (int, float)) or isinstance(priority, bool) or not (0.0 < float(priority) <= 1.0):
                self._mark_invalid(
                    "GRAPH_NODE_INVALID",
                    f"Node '{node_id}' 'priority' must be a number in (0.0, 1.0], got {priority!r}.",
                    mtime_ns,
                )
                return False

            clean_node = {
                "id": node_id.strip(),
                "type": node_type,
                "label": label.strip(),
                "aliases": [a.strip().lower() for a in aliases if a.strip()],
                "summary": summary.strip(),
                "attributes": attributes,
                "priority": float(priority),
            }
            nodes.append(clean_node)
            nodes_by_id[clean_node["id"]] = clean_node
            categories[node_type] = categories.get(node_type, 0) + 1

        edges = []
        outgoing = {nid: [] for nid in nodes_by_id}
        incoming = {nid: [] for nid in nodes_by_id}

        for idx, e in enumerate(raw_edges):
            if not isinstance(e, dict):
                self._mark_invalid("GRAPH_EDGE_INVALID", f"Edge at index {idx} is not an object.", mtime_ns)
                return False
            src = e.get("source")
            dst = e.get("target")
            rel = e.get("relation")
            weight = e.get("weight")
            evidence = e.get("evidence")

            if not isinstance(src, str) or src not in nodes_by_id:
                self._mark_invalid(
                    "GRAPH_DANGLING_EDGE_SOURCE",
                    f"Edge at index {idx} references missing source node {src!r}.",
                    mtime_ns,
                )
                return False
            if not isinstance(dst, str) or dst not in nodes_by_id:
                self._mark_invalid(
                    "GRAPH_DANGLING_EDGE_TARGET",
                    f"Edge at index {idx} ('{src}' -> {dst!r}) references missing target node {dst!r}.",
                    mtime_ns,
                )
                return False
            if not isinstance(rel, str) or not rel.strip():
                self._mark_invalid("GRAPH_EDGE_INVALID", f"Edge at index {idx} missing non-empty 'relation'.", mtime_ns)
                return False
            if not isinstance(weight, (int, float)) or isinstance(weight, bool) or not (0.0 < float(weight) <= 1.0):
                self._mark_invalid(
                    "GRAPH_EDGE_INVALID",
                    f"Edge at index {idx} ('{src}' -> '{dst}') weight must be in (0.0, 1.0], got {weight!r}.",
                    mtime_ns,
                )
                return False
            if not isinstance(evidence, str) or not evidence.strip():
                self._mark_invalid("GRAPH_EDGE_INVALID", f"Edge at index {idx} missing non-empty 'evidence'.", mtime_ns)
                return False

            clean_edge = {
                "index": idx,
                "source": src,
                "target": dst,
                "relation": rel.strip(),
                "weight": float(weight),
                "evidence": evidence.strip(),
            }
            edges.append(clean_edge)
            outgoing[src].append(clean_edge)
            incoming[dst].append(clean_edge)

        # Build IDF table and per-node field token bags + normalized alias phrases
        doc_freq = {}
        node_index = {}
        num_nodes = len(nodes)

        for n in nodes:
            nid = n["id"]
            label_tokens = set(tokenize_text(n["label"]))
            alias_tokens = set()
            alias_phrases = []
            for a in n["aliases"]:
                norm_a = normalize_phrase(a)
                if norm_a:
                    alias_phrases.append(norm_a)
                alias_tokens.update(tokenize_text(a))
            norm_label = normalize_phrase(n["label"])
            if norm_label:
                alias_phrases.append(norm_label)

            summary_tokens = set(tokenize_text(n["summary"]))
            attr_text = _flatten_attributes_text(n["attributes"])
            attr_tokens = set(tokenize_text(attr_text))
            type_tokens = set(tokenize_text(re.sub(r"([a-z])([A-Z])", r"\1 \2", n["type"])))

            all_node_tokens = label_tokens | alias_tokens | summary_tokens | attr_tokens | type_tokens
            for tok in all_node_tokens:
                doc_freq[tok] = doc_freq.get(tok, 0) + 1

            node_index[nid] = {
                "label_tokens": label_tokens,
                "alias_tokens": alias_tokens,
                "alias_phrases": alias_phrases,
                "summary_tokens": summary_tokens,
                "attr_tokens": attr_tokens,
                "type_tokens": type_tokens,
                "degree": len(outgoing[nid]) + len(incoming[nid]),
            }

        idf = {
            tok: math.log((num_nodes + 1.0) / (df + 1.0)) + 1.0
            for tok, df in doc_freq.items()
        }

        self._dataset_version = dataset_version.strip()
        self._schema_version = str(doc.get("schema_version") or "1.0")
        self._nodes = nodes
        self._nodes_by_id = nodes_by_id
        self._edges = edges
        self._outgoing = outgoing
        self._incoming = incoming
        self._categories = categories
        self._idf = idf
        self._node_index = node_index
        self._last_checked_mtime_ns = mtime_ns
        self._last_loaded_at_ms = int(time.time() * 1000)
        self._ready = True
        self._error_code = None
        self._error_message = None
        return True

    def status(self):
        self.ensure_fresh()
        with self._lock:
            if not self._ready:
                return {
                    "ok": False,
                    "ready": False,
                    "error": self._error_code or "GRAPH_NOT_READY",
                    "message": self._error_message or "Knowledge graph failed validation.",
                    "path": self._json_path,
                    "lastLoadedAtMs": self._last_loaded_at_ms,
                }
            return {
                "ok": True,
                "ready": True,
                "datasetVersion": self._dataset_version,
                "schemaVersion": self._schema_version,
                "nodeCount": len(self._nodes),
                "edgeCount": len(self._edges),
                "categories": dict(sorted(self._categories.items())),
                "referentialIntegrityVerified": True,
                "lastLoadedAtMs": self._last_loaded_at_ms,
            }

    def build_biographical_anchor_summary(self):
        """Return a compact, verified biographical & project context block for POST /api/intro/generate."""
        self.ensure_fresh()
        with self._lock:
            if not self._ready:
                return ""
            featured_types = ("Person", "Education", "ProjectStation", "Story", "GamePort", "Pipeline")
            selected = [
                n for n in sorted(self._nodes, key=lambda item: (-item["priority"], item["id"]))
                if n["type"] in featured_types
            ][:22]
            lines = [f"[KNOWLEDGE_GRAPH dataset_version={self._dataset_version}]"]
            for n in selected:
                lines.append(f"- ({n['type']}) {n['label']}: {n['summary']}")
            return "\n".join(lines)

    def _score_nodes_for_text(self, text_str):
        norm_q = normalize_phrase(text_str)
        padded_q = f" {norm_q} " if norm_q else ""
        q_tokens = tokenize_text(text_str)
        if not norm_q and not q_tokens:
            return {}

        q_token_counts = {}
        for t in q_tokens:
            q_token_counts[t] = q_token_counts.get(t, 0) + 1

        scores = {}
        for n in self._nodes:
            nid = n["id"]
            idx_entry = self._node_index[nid]
            raw_score = 0.0

            # 1. Exact/substring multi-word or distinctive alias phrase matches
            for phrase in idx_entry["alias_phrases"]:
                if len(phrase) < 3:
                    continue
                if f" {phrase} " in padded_q:
                    word_count = phrase.count(" ") + 1
                    # Multi-word alias phrases carry strong entity specificity
                    if phrase == "luis" and len(q_token_counts) > 2:
                        raw_score += 0.45
                    else:
                        raw_score += 3.2 * (1.0 + 0.55 * (word_count - 1))
                elif len(phrase) >= 6 and phrase in norm_q:
                    raw_score += 2.2

            # 2. IDF-weighted lexical overlap across node fields
            for tok, q_cnt in q_token_counts.items():
                if tok == "luis" and len(q_token_counts) > 2:
                    tok_idf = 0.25
                else:
                    tok_idf = self._idf.get(tok, 1.35)
                tf_boost = 1.0 + 0.2 * min(3, q_cnt - 1)
                field_weight = 0.0
                if tok in idx_entry["label_tokens"]:
                    field_weight = max(field_weight, 2.6)
                if tok in idx_entry["alias_tokens"]:
                    field_weight = max(field_weight, 2.45)
                if tok in idx_entry["summary_tokens"]:
                    field_weight += 1.30
                if tok in idx_entry["attr_tokens"]:
                    field_weight += 1.15
                if tok in idx_entry["type_tokens"]:
                    field_weight += 0.90
                if field_weight > 0.0:
                    raw_score += tok_idf * field_weight * tf_boost

            if raw_score > 0.0:
                scores[nid] = raw_score * (0.78 + 0.22 * n["priority"])

        return scores

    def query(
        self,
        query_text,
        recent_messages=None,
        max_hops=2,
        max_seeds=5,
        max_nodes=14,
        max_edges=24,
        decay=0.72,
    ):
        """
        Execute multi-hop GraphRAG retrieval (§5.4.2):
        1. Entity-alias + IDF lexical seed scoring across query_text (+ 2-turn window).
        2. Bounded k-hop (k in [1, 3]) weighted BFS expansion across outgoing & incoming edges.
        3. Structured [ENTITY] and [LINEAGE_PATH] serialization capped at <= 1,400 tokens.
        """
        t0 = time.perf_counter()
        self.ensure_fresh()

        with self._lock:
            if not self._ready:
                raise RuntimeError(f"{self._error_code}: {self._error_message}")

            hops = max(1, min(3, int(max_hops if max_hops is not None else 2)))
            primary_scores = self._score_nodes_for_text(query_text or "")

            # Blend recent 2-turn conversation window with lower weight (0.32) for pronoun follow-ups
            combined_scores = dict(primary_scores)
            if isinstance(recent_messages, list) and recent_messages:
                history_chunks = []
                for msg in recent_messages[-4:]:
                    if isinstance(msg, dict) and msg.get("content"):
                        history_chunks.append(str(msg["content"]))
                    elif isinstance(msg, str):
                        history_chunks.append(msg)
                if history_chunks:
                    hist_scores = self._score_nodes_for_text(" ".join(history_chunks))
                    for nid, h_val in hist_scores.items():
                        combined_scores[nid] = combined_scores.get(nid, 0.0) + 0.32 * h_val

            ranked_candidates = sorted(
                ((nid, sc) for nid, sc in combined_scores.items() if sc >= 1.15),
                key=lambda item: (-item[1], item[0]),
            )

            seed_fallback_used = False
            if ranked_candidates:
                top_score = ranked_candidates[0][1]
                # Keep top S <= max_seeds within meaningful relative confidence of top seed
                seeds = [
                    (nid, sc / top_score)
                    for nid, sc in ranked_candidates[:max_seeds]
                    if sc >= top_score * 0.22
                ]
            else:
                seed_fallback_used = True
                fallback_nodes = []
                if "Person:luis" in self._nodes_by_id:
                    fallback_nodes.append(("Person:luis", 1.0))
                top_neighbors = sorted(
                    (
                        n for n in self._nodes
                        if n["id"] != "Person:luis" and n["type"] in ("ProjectStation", "Skill", "Story")
                    ),
                    key=lambda item: (-item["priority"], item["id"]),
                )[: max(1, max_seeds - len(fallback_nodes))]
                for n in top_neighbors:
                    fallback_nodes.append((n["id"], round(0.85 * n["priority"], 4)))
                seeds = fallback_nodes

            seed_ids = [nid for nid, _ in seeds]
            seed_set = set(seed_ids)

            # Bounded k-hop weighted BFS traversal across outgoing & incoming edges
            node_relevance = {nid: float(score) for nid, score in seeds}
            node_hop_distance = {nid: 0 for nid in seed_ids}
            edge_scores = {}

            queue = deque((nid, 0, float(score)) for nid, score in seeds)
            while queue:
                u_id, depth, r_u = queue.popleft()
                if depth >= hops:
                    continue
                next_depth = depth + 1

                # Gentle hub damping when bouncing *through* a high-degree hub (e.g., Person:luis)
                # that wasn't the sole seed, preventing unrelated leaves from tie-flooding domain queries.
                deg_u = self._node_index[u_id]["degree"]
                hub_damping = 1.0
                if deg_u > 8 and not (u_id in seed_set and len(seed_set) == 1):
                    hub_damping = max(0.42, min(1.0, math.sqrt(6.0 / float(deg_u))))

                incident_edges = []
                for e in self._outgoing.get(u_id, ()):
                    incident_edges.append((e, e["target"]))
                for e in self._incoming.get(u_id, ()):
                    incident_edges.append((e, e["source"]))

                for edge, v_id in incident_edges:
                    propagated = r_u * edge["weight"] * (decay ** next_depth) * hub_damping
                    e_idx = edge["index"]
                    if propagated > edge_scores.get(e_idx, 0.0):
                        edge_scores[e_idx] = propagated

                    prev_best = node_relevance.get(v_id, 0.0)
                    if propagated > prev_best:
                        node_relevance[v_id] = propagated
                        if v_id not in node_hop_distance or next_depth < node_hop_distance[v_id]:
                            node_hop_distance[v_id] = next_depth
                        queue.append((v_id, next_depth, propagated))
                    elif v_id in node_relevance:
                        # Small multi-path reinforcement bonus when multiple seeds converge on v_id
                        boosted = min(1.35, prev_best + 0.12 * propagated)
                        node_relevance[v_id] = boosted

            # Always ensure Person:luis context node is available if connected
            if "Person:luis" in self._nodes_by_id and "Person:luis" not in node_relevance:
                node_relevance["Person:luis"] = 0.25
                node_hop_distance["Person:luis"] = hops

            retained_ranked = sorted(
                node_relevance.items(),
                key=lambda item: (-item[1], node_hop_distance.get(item[0], 99), item[0]),
            )[:max_nodes]
            retained_ids = {nid for nid, _ in retained_ranked}

            # Collect connecting lineage edges inside retained subgraph, ranked by edge traversal score
            candidate_edges = []
            for edge in self._edges:
                if edge["source"] in retained_ids and edge["target"] in retained_ids:
                    sc = edge_scores.get(
                        edge["index"],
                        0.5 * (node_relevance[edge["source"]] + node_relevance[edge["target"]]) * edge["weight"],
                    )
                    candidate_edges.append((sc, edge))

            candidate_edges.sort(key=lambda item: (-item[0], item[1]["index"]))
            retained_edges = [
                {
                    "source": e["source"],
                    "target": e["target"],
                    "relation": e["relation"],
                    "weight": e["weight"],
                    "evidence": e["evidence"],
                    "score": round(sc, 4),
                }
                for sc, e in candidate_edges[:max_edges]
            ]

            retrieved_nodes = []
            for nid, rel_score in retained_ranked:
                n = self._nodes_by_id[nid]
                retrieved_nodes.append({
                    "id": n["id"],
                    "type": n["type"],
                    "label": n["label"],
                    "summary": n["summary"],
                    "attributes": n["attributes"],
                    "priority": n["priority"],
                    "hopDistance": node_hop_distance.get(nid, 0),
                    "relevanceScore": round(rel_score, 4),
                    "isSeed": nid in seed_set,
                })

            context_block = self._serialize_context_block(
                retrieved_nodes=retrieved_nodes,
                retained_edges=retained_edges,
                max_tokens=1400,
            )

            elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 3)

            return {
                "ok": True,
                "datasetVersion": self._dataset_version,
                "query": query_text or "",
                "hops": hops,
                "seedFallbackUsed": seed_fallback_used,
                "seedNodeIds": seed_ids,
                "retrievedNodeCount": len(retrieved_nodes),
                "retrievedEdgeCount": len(retained_edges),
                "retrievalLatencyMs": elapsed_ms,
                "retrievedNodes": retrieved_nodes,
                "retrievedEdges": retained_edges,
                "contextBlock": context_block,
            }

    def _serialize_context_block(self, retrieved_nodes, retained_edges, max_tokens=1400):
        """
        Deterministically serialize [ENTITY] and [LINEAGE_PATH] blocks capped at <= max_tokens
        (~3.7 chars/token conservative bound => 5,180 chars max).
        """
        max_chars = int(max_tokens * 3.7)
        lines = [
            f"[GRAPHRAG_SUBGRAPH dataset_version={self._dataset_version} nodes={len(retrieved_nodes)} edges={len(retained_edges)}]"
        ]
        used_chars = len(lines[0])

        for n in retrieved_nodes:
            attr_pairs = []
            for k, v in n["attributes"].items():
                if isinstance(v, list):
                    val_str = ", ".join(str(x) for x in v[:6])
                else:
                    val_str = str(v)
                attr_pairs.append(f"{k}={val_str}")
            attr_suffix = f" | attrs: {'; '.join(attr_pairs)}" if attr_pairs else ""
            entry = (
                f"[ENTITY id={n['id']} type={n['type']} hop={n['hopDistance']} score={n['relevanceScore']:.2f}] "
                f"{n['label']}: {n['summary']}{attr_suffix}"
            )
            if used_chars + len(entry) + 1 > int(max_chars * 0.68):
                break
            lines.append(entry)
            used_chars += len(entry) + 1

        for e in retained_edges:
            src_label = self._nodes_by_id[e["source"]]["label"]
            dst_label = self._nodes_by_id[e["target"]]["label"]
            entry = (
                f"[LINEAGE_PATH {e['source']} -[{e['relation']} w={e['weight']:.2f}]-> {e['target']}] "
                f"{src_label} -> {dst_label}: {e['evidence']}"
            )
            if used_chars + len(entry) + 1 > max_chars:
                break
            lines.append(entry)
            used_chars += len(entry) + 1

        return "\n".join(lines)
