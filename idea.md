# Vortex — Initial Idea

> **Product spec (this file)** — what Vortex is and what V1 must deliver.  
> **Implementation:** [TECHNICAL.md](./TECHNICAL.md) · **API:** [openapi.yaml](./openapi.yaml)

Changes to V1 behavior belong here first; TECHNICAL and openapi follow.

---

## TLDR

- **What:** Local, open-source web app that refines messy documents into a **trustworthy context layer** for you and your agents.
- **How:** Create **spaces** → drop **sources** (PDFs, images, etc.) → ingest into **entities**, **facts**, and **decisions** → **link** everything → promote a **current truth** (true facts + active decisions).
- **Ask:** One natural-language search box—**Explore** or **Verified** mode; **hybrid keyword + vector** retrieval; answers cite evidence.
- **Export:** **Context packs** (versioned snapshots) agents can use as the highest-current source of truth.
- **Storage:** Files on disk for originals; **database** for structure, links, and truth—not Obsidian, not markdown-as-canonical.
- **V1:** Spaces, upload + ingest, review inbox, re-ingest, browse, truth curation, conflicts, search (Explore/Verified), context pack export.

---

A local, open-source **context refinery**: a place to save evidence, ingest it into structured knowledge, interlink it, and help users build the **best current source of truth** for their context—then query it and hand it to agents.

**Not** an Obsidian-native vault. **Not** a generic RAG chatbot. Inspired by personal wiki patterns (e.g. LLM Wiki / second-brain workflows) but implemented as a **web app with a database**, not markdown as the system of record.

---

## One-line pitch

**Local context refinery:** immutable **sources** → structured **entities**, **facts**, and **decisions** → typed **links** → curated **current truth** → natural-language Q&A and agent-ready context packs.

---

## Problem

People accumulate documents (PDFs, images, exports, notes) across a domain (finance, property, legal, work). They need:

- A place to **drop** that material into scoped workspaces
- **Automatic structure** (who/what/when, not just full-text search)
- **Connections** between topics and evidence
- A **single trustworthy layer** of what is true *now*—including owner decisions, not only text extracted from files
- **Answers and agent context** that cite evidence and respect canon, not a blend of outdated and current claims

---

## Product goal

Help users **refine context over time**:

1. **Evidence** — what we have (sources + citable chunks)
2. **Understanding** — what we extracted (entities, proposed facts, links)
3. **Truth** — what we stand behind now (true facts, active decisions, resolved conflicts)

The product closes the gap between understanding and truth by surfacing conflicts, supersession, and provenance—not by growing an unstructured note pile.

---

## Core objects

| Object | Description |
|--------|-------------|
| **Space** | Isolated knowledge universe (one domain: e.g. personal finance, a project). All data scoped by `space_id`. |
| **Source** | User-uploaded evidence: PDF, image, text, etc. **Immutable** blob on disk + metadata in DB (`sources` table). One source row per upload — there is no separate `assets` table. |
| **Chunk** | Extracted text span for citation (page, offset). **Embedded during ingest** (sqlite-vec) for hybrid search — required in V1, not a bolt-on. |
| **Entity** | Thing in the world: project, person, organization, regulation, account, locality, etc. V1 uses **global generic types** (not per-space custom schemas). |
| **Fact** | Atomic, checkable statement about an entity (amount, date, ID, rate). Has **status**, **provenance**, and optional supersession chain. |
| **Decision** | Owner choice or commitment without necessarily coming from a file (“30-year loan”, “canon ledger is X”, “SIP resumes Sep 2026”). First-class, not buried in notes. |
| **Link** | Typed edge between objects (see Interlinking). |
| **Context pack** | Versioned agent export (`as_of` date, monotonic version). V1 types: **`canon`** (true facts + active decisions) and **`full`** (+ unverified proposed appendix). JSON + optional Markdown. |

### Facts vs decisions

| | **Fact** | **Decision** |
|---|----------|--------------|
| Nature | Descriptive — “BSP is ₹X”, “RERA id is …” | Normative / chosen — “we take 30-year loan”, “execution numbers live in ledger X” |
| Origin | Usually extracted from sources | Usually owner-authored; may reference a source or stand alone |
| Change | Superseded when better evidence arrives | Superseded when user reverses or replaces the choice |
| Agent use | What is true about the world? | What are we committed to doing? |

A **decision** can **establish** or **override** facts (operational canon), similar to a flexible “store” layer in wiki vaults but enforced in data, not prose conventions.

**V1 decision sources:** user creates manually (`origin: user`), or user **confirms** a `decision_suggestion` from ingest review (`origin: ingest_confirmed`). Ingest never writes `active` decisions directly.

### True facts

**True facts** are facts with `status = true` — the **current answer** Q&A, browse truth panels, and agent exports must use. Contradicting extractions stay `proposed` or `superseded`; they are not silently merged.

**V1 lifecycle** (per [TECHNICAL.md](./TECHNICAL.md) §5, §7):

```
proposed  ──(user promote)──►  true  ──(supersede)──►  superseded
```

- Ingest writes **`proposed`** only; promotion is manual.
- Promoting a fact to `true` for a given slot (`fact_key`) **auto-supersedes** any existing `true` fact for that slot.
- User may **dismiss** a `proposed` fact (wrong/noise) without promoting — row kept for audit, hidden from default views.
- **`corroborated`** exists in the schema but is **unused in V1** — reserved for post-V1 rules (e.g. auto-mark when N sources agree).

Supersession uses `supersedes_id` / `superseded_by_id` on the fact row; optional `supersedes` links mirror the chain.

---

## What we are not building (V1 / positioning)

- Obsidian-compatible folder layout as the product
- Markdown files as system of record (export-only is fine)
- “Another chat app” without provenance and truth layer
- Competitor scouting / generic note-taking as the center of gravity

---

## Architecture principles

### Storage

| Layer | Approach |
|-------|----------|
| **Blobs** | Original files on disk per space under `spaces/{space_id}/assets/{source_id}/` — folder name **assets** is filesystem layout only |
| **Semantic data** | **SQLite** database for V1 (local single-user); Postgres optional for hosted multi-tenant later |
| **Markdown** | **Export / display cache only** if needed for agents—not canonical |

**Naming (disk vs DB):** disk directories use `assets/`; the database uses a **`sources`** table for upload metadata and ingest state. Do not introduce a separate `assets` table — see [TECHNICAL.md §3](./TECHNICAL.md#3-directory--storage-layout).

### Graph

- Model knowledge as a **graph** (nodes + typed edges).
- Implement with a **`links` table** (or equivalent) and bounded traversal (1–2 hops) for V1.
- **Dedicated graph database** (Neo4j, etc.) deferred until graph exploration or heavy path analytics is a headline feature.

### Search & Q&A

One search box per space with a **mode selector** (default **Explore**; choice persisted per space). Details in [TECHNICAL.md](./TECHNICAL.md) §8.

| | **Explore** | **Verified** |
|---|-------------|--------------|
| **UI subtitle** | Search everything, including unverified extractions | Promoted facts and active decisions only |
| **Facts used** | `proposed` + `true` (not dismissed/superseded) | **`true` only** |
| **Decisions used** | `active`; pending decision suggestions flagged unconfirmed | **`active` only** |
| **Proposed in answer** | Allowed with **“unverified”** label | **Never** in synthesis |
| **No verified truth on topic** | Answer from source excerpts; softer disclaimer | Same fallback; stronger disclaimer — never labeled as verified |

**Shared (both modes):**

- **Hybrid retrieval (required in V1):** SQLite FTS5 on chunks, entities, and facts **plus** chunk embeddings (sqlite-vec). Keyword and semantic scores merged — not FTS-only. See [TECHNICAL.md](./TECHNICAL.md) §2, §8.
- Pipeline: retrieve → expand along **high-trust** links → synthesize with **mandatory citations** (`chunk_id`, and `fact_id` / `decision_id` when applicable).
- UX: answer with inline footnotes `[1]`, `[2]` + collapsible **Evidence** panel.
- Superseded and dismissed facts never appear silently.

**LLM / embeddings:** bring your own API key or local model (Ollama, etc.) — embeddings use the same provider as ingest. Changing the embedding model triggers a **re-embed** job (TECH §4), not a full re-ingest.

### Ingest

Async pipeline per source:

1. Store immutable asset
2. Extract text / OCR → chunks
3. Structure: entities mentioned, candidate facts, links
4. Entity resolution (match, suggest merge, low-confidence → **review queue**; ingest otherwise runs automatically)
5. Write facts as `proposed`; link provenance to chunks
6. Surface conflicts with existing true facts or decisions
7. **Embed chunks** → vector index (late ingest step; search depends on it)
8. Regenerate human-readable entity summary (derived cache, not SoT)

Truth promotion is **manual in V1** — user promotes `proposed` → `true`; ingest never auto-promotes.

Re-ingest: new asset or revision → new proposed facts → conflicts → user or rules update truth.

---

## Interlinking

Links are **first-class rows**, not `[[wikilinks]]` in prose.

### Link types (V1-minimal set)

| Type | From → To | Purpose |
|------|-----------|---------|
| `mentions` | chunk or source → entity | Extracted reference |
| `about` | source → entity | Primary subject(s) |
| `supports` | chunk → fact | Provenance (may also live in `fact_provenance`) |
| `related` | entity → entity | Curated or inferred association |
| `applies_to` | decision → entity | Decision scope |
| `establishes` / `overrides` | decision → fact | Operational canon |
| `canon_for` | decision or entity → fact | Points at the **canon fact** for a slot — grouping is by `fact_key` on the fact row, not a separate cluster object |
| `supersedes` | fact → fact | Truth chain (also on fact record) |

**Canon slots:** at most one `true` fact per `(entity_id, fact_key)`. `canon_for` links mark which fact (or decision/entity) owns the operational numbers for that slot — see [TECHNICAL.md §5, §7](./TECHNICAL.md#5-database-schema).

### Backlinks & browse

- **Entity page:** true facts, active decisions, conflicts, linked sources, related entities
- **Source page:** preview, chunks, entities mentioned, facts supported
- **Index views:** filter by kind (sources, entities, facts, decisions) and status

### Query expansion

After retrieval, expand 1–2 hops on an allowlist of link kinds; cap by token budget; prioritize true facts and decisions over weak co-mentions.

### Entity resolution

Every edge targets stable `entity_id` with canonical name + aliases; merge flow for duplicates; ingest suggestions for ambiguous mentions.

---

## UX primitives (“refinery” feel)

1. **Ingest status** — per-source pipeline progress (queued → extracting → structuring → complete/failed); job polling or SSE
2. **Review inbox** — entity match/create/merge suggestions and **decision suggestions** from ingest; unresolved items block some graph writes until resolved ([TECHNICAL.md](./TECHNICAL.md) §6)
3. **Conflicts** — same fact key, different values or provenance; resolution required (no dismiss-without-outcome)
4. **Truth panel** — per entity: `true` facts + `active` decisions only
5. **Timeline** — supersession, promotion, merge, and conflict events (audit for “highest *current* context”)
6. **Context pack** — export **`canon`** or **`full`** snapshot for agents; warns when open conflicts exist

Implementation routes and APIs: [TECHNICAL.md §10](./TECHNICAL.md#10-product--ui-map).

---

## UX information architecture (V1)

Product-level navigation and screens. Route paths and API wiring live in [TECHNICAL.md §10](./TECHNICAL.md#10-product--ui-map).

### Space shell

After picking a space, persistent nav (left or top):

| Nav item | Purpose | Badge |
| -------- | ------- | ----- |
| **Search** | Default landing — NL Q&A (Explore / Verified) | — |
| **Sources** | Upload + browse evidence; ingest status per file | Count `processing` |
| **Entities** | Browse things in the world | — |
| **Facts** | Browse claims; filter by status | — |
| **Decisions** | Browse owner commitments | — |
| **Review** | Human-in-the-loop ingest resolution | Count `pending` review items |
| **Conflicts** | Open truth collisions | Count `open` conflicts |
| **Timeline** | Space audit log | — |
| **Exports** | Context pack history + new export | — |

Global (outside space): **Spaces list** — create / switch workspace.

### Key screens

| Screen | Primary content | UX primitive |
| ------ | ----------------- | ------------ |
| **Search** | Query box, mode toggle (Explore / Verified), answer + Evidence footnotes | Search (Explore/Verified) |
| **Sources list** | Upload dropzone; columns: name, status, uploaded_at | Ingest status |
| **Source detail** | Preview, chunks, mentions, ingest run progress, re-ingest action | Ingest status |
| **Entity detail** | Truth panel, proposed/dismissed facts (toggle), conflicts, backlinks, entity-scoped events | Truth panel, Timeline (slice) |
| **Review inbox** | Filter by kind; resolve entity match / merge / decision suggestion | Review inbox |
| **Conflict detail** | Both sides, resolution actions, read-only after resolve | Conflicts |
| **Timeline** | Filterable event stream (promote, supersede, merge, ingest, export) | Timeline |
| **Exports** | List packs; export wizard → **Canon** or **Full** | Context pack |

### Embedded vs dedicated

- **Truth panel** — section on **Entity detail**, not its own top-level route.
- **Ingest progress** — on **Source detail** and **Sources list** status column; optional post-upload banner linking to source.
- **Post-ingest banner** — “N items need review” → Review inbox (see TECH §6.2).

### Empty / first-run

New space: Search + Sources (empty upload CTA). Review and Conflicts hidden or show zero state until first ingest.

---

## V1 scope

### In

- Create and list **spaces**
- Upload **sources** (PDF, images, text); soft-delete with asset retained
- Background **ingest** → chunks (FTS + embeddings), entities, proposed facts, links
- **Re-ingest** — new run on a source → new proposed facts/chunks; prior runs kept for provenance
- **Review inbox** — resolve entity ambiguity, merge suggestions, confirm/dismiss **decision suggestions** from ingest
- **Browse:** entities, sources, facts (by status), decisions; index filters by kind and status
- **Entity detail:** truth panel, conflicts, backlinks, timeline
- **Truth curation:** promote / dismiss / undismiss facts; create decisions manually; supersede facts and decisions; merge entities; resolve conflicts
- **Search:** natural-language Q&A with **Explore** and **Verified** modes + cited answers
- **Context packs:** export **`canon`** or **`full`** via API (`pack.json` + optional `pack.md`)

### Out (defer)

- Obsidian import/export as primary feature
- Full graph visualization
- Automatic resolution of all conflicts
- Multi-user / teams (design with `space_id` anyway)
- Real-time collaboration
- Mobile apps
- Federated search across spaces
- **Context pack MCP** server (export API is V1; MCP wrapper post-V1)
- **Full-space JSON dump** (portability export of entire space — post-V1; context packs cover agent handoff in V1)

### High value soon after V1

- Auto-`corroborated` / auto-promote when N sources agree
- Per-space entity type schemas
- Co-mention inference as explicit link type
- Obsidian vault import (one-time migration)

---

## Open source & local deployment

- Run locally; data stays on machine
- SQLite + asset directory per space for simple installs
- LLM: bring your own API key or local model (Ollama, etc.)
- Agent handoff in V1 via **context packs**; full-space JSON export deferred (see V1 scope)

---

## Risks

1. **Entity resolution** — wrong merges poison browse and Q&A
2. **Numeric fact drift** — money, dates, rates need structured fields + supersession, not prose-only
3. **Ingest cost/latency** — incremental/chunked processing; status per file in UI
4. **Trust** — answers must cite chunks; page-level fluff citations are insufficient
5. **Dual sources of truth** — avoid maintaining DB and markdown canon in parallel

---

## Reference (personal, not product requirements)

Development thinking was informed by a personal Obsidian vault using the LLM Wiki pattern (`raw/` → `wiki/` sources, entities, concepts + `store/` for owner records, lean canon playbooks, `confidence` in frontmatter). Vortex **productizes the workflow** (ingest, graph, truth, query) without requiring Obsidian or markdown maintenance.

---

## Product decisions (V1 locked)

Decisions below are fixed for V1. Implementation detail lives in [TECHNICAL.md](./TECHNICAL.md).

| Decision | V1 choice |
| -------- | --------- |
| **Deploy target** | Laptop-local **SQLite** monolith + on-disk assets (`~/.vortex` or `./data` in dev). Postgres deferred until hosted multi-tenant. |
| **Review model** | **Auto-ingest** by default. Review queue only for low-confidence entity matches, merge suggestions, and decision suggestions — not every upload. |
| **True facts** | **User-promoted only** in V1. Ingest writes `proposed`; user promotes to `true`. No auto-promote when N sources agree (reserved for post-V1). |
| **Entity types** | **Global generic types** (`person`, `organization`, `account`, `regulation`, …). Per-space custom schemas deferred. |
| **Search index** | **Hybrid FTS5 + vectors required in V1** (sqlite-vec on chunks). Embeddings written during ingest; `reembed` job if model changes. |
| **Branding** | Product name **Vortex**; repo **`vortex-app`**. Local context refinery positioning. |

---

## Open decisions

_None for V1 — add new items here when product scope is intentionally unset._

## Next steps

Product spec and stack are set. Build order and schema are in [TECHNICAL.md](./TECHNICAL.md) and [openapi.yaml](./openapi.yaml).

1. Implement ingest + entity browse before polishing NL answers
2. Sketch one end-to-end user journey (upload → conflict → promote → query) against the API spec
3. Keep idea updated when product behavior changes; keep TECHNICAL/openapi in sync
