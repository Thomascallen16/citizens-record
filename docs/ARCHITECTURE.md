# Canonical Architecture — The Citizens Record

**Status:** Forensic foundation, September 3, 2026

## Canonical repository

`Thomascallen16/citizens-record` is the canonical full-stack application and source of truth. It contains a React/Vite client, Express server, tRPC API, Drizzle ORM schema/migrations, MySQL/TiDB database integration, authenticated workspace controls, provenance-oriented records, exports, privacy controls, and server-side ownership checks. The repository is currently public; this repository must not contain private evidence, production secrets, or database exports.

`Thomascallen16/The-Citizens-Record` remains a separate public/static portal. It is not the canonical private application. Its useful public-facing content may be retained or extracted later without making it the full-stack source of truth.

## Two user-facing experiences

1. **The Citizens Record** — public, source-backed civic portal. Public material is deliberately separate from private case/workspace data.
2. **Open the Record** — the authenticated private investigative workspace experience of the same canonical application. Private records remain private unless deliberately published through an explicit publication boundary.

The current codebase already provides the authenticated workspace experience at the application root after login; it does not yet implement a separately named `/open-the-record` product route.

## Application modules

ProofFlow, MetaGraph, Chronicle, Watchtower, Record Builder, and Pro Se Compass are modules, subsystems, concepts, or historical implementations—not separate canonical products. They should share the same record model, database, provenance rules, and audit trail when incorporated. No autonomous-agent, broad-crawling, cross-user-pattern, or public-collaboration system is part of this foundation.

## Core record flow

**Question → Source → Evidence → Claim → Finding → Unknown**

The repository currently has strong foundations for cases, sources, evidence rows/items, chronology, acquisition needs, excerpts, citations, privacy requests, revision events, and exports. The exact canonical Claim/Finding/Unknown objects described here are not yet represented as a clean normalized set in the current schema and are therefore an MVP implementation target, not a claim about current completeness.

## Future canonical data model

- User
- Project
- Record
- Source
- Document
- DocumentVersion
- Evidence
- Claim
- Finding
- Question
- Unknown
- TimelineEvent
- Entity
- Relationship
- Authority
- Action
- AuditEvent

Current schema equivalents include `users`, `legal_cases`, `source_records`, `evidence_items`, `evidence_rows`, `source_excerpts`, `citations`, `chronology_events`, `acquisition_items`, `revision_events`, `case_members`, `privacy_requests`, `analytics_events`, `motion_drafts`, and subscription/entitlement tables. These are useful existing foundations but are not automatically declared identical to the future canonical model.

## Epistemic status model

The canonical model must distinguish:

- `FACT`
- `AUTHORITY`
- `CLAIM`
- `INFERENCE`
- `CONTRADICTION`
- `QUESTION`
- `UNKNOWN`

The existing application currently uses a different confidence vocabulary (`PRIMARY-RECORD`, `USER-REPORTED`, `VERIFY`, `SOURCE-UNAVAILABLE`, `CONFLICTING`). That vocabulary should be mapped deliberately during future implementation; it must not be silently treated as equivalent to the canonical epistemic statuses.

## Relationship-evidence model

Relationships use:

- `DOCUMENTED`
- `INFERRED`
- `ALLEGED`
- `UNKNOWN`

A relationship graph must never convert proximity, co-occurrence, allegation, shared attributes, or inference into proof. Graph edges must retain their evidentiary basis and status.

## Privacy and publication

Private records default to authenticated, server-authorized access. Public publication must be deliberate, reviewed, and separated from private source objects and documents. A public page must never become an indirect path to a private storage object merely because an object key, record ID, or client route is guessed.

## Legal boundary

The application is organization and research software. It does not provide legal advice, legal representation, filing automation, service, or a substitute for independent legal judgment.


## Implementation Pass 1 — Canonical Record Workflow

Implemented on feature/canonical-record-workflow: the existing `legal_cases` table remains the storage-compatible case/workspace anchor while `record_metadata` supplies the user-facing Record title, context, verbatim original question, lifecycle status, and private visibility. Existing `source_records` and `source_excerpts` are reused for sources and source-backed evidence, with small canonical metadata extensions. Claims, findings, unknowns, normalized evidence/source/claim/finding links, and canonical audit events are additive models.

The canonical epistemic vocabulary is FACT, AUTHORITY, CLAIM, INFERENCE, CONTRADICTION, QUESTION, UNKNOWN. Existing confidence values remain separate reliability/verification markers and are never treated as epistemic categories.
