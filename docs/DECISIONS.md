# Canonical Decisions

**Decision record date:** September 3, 2026

## D-001 — Canonical full-stack repository

**Decision:** `Thomascallen16/citizens-record` is the canonical full-stack application and source of truth.

**Reason:** It contains the substantial React/Vite + Express/tRPC + Drizzle/MySQL application, authenticated workspace, ownership controls, provenance-oriented evidence structures, migrations, tests, and CI.

## D-002 — Public/private product boundary

**Decision:** The public experience and private workspace are two experiences of the overall product, but private workspace data remains server-authorized and private by default. `The-Citizens-Record` remains the separate public/static portal.

**Reason:** The static portal and full-stack application have different security and data requirements. The known public civic URL is not proof of the full-stack deployment.

## D-003 — Modules are not separate products

**Decision:** ProofFlow, MetaGraph, Chronicle, Watchtower, Record Builder, and Pro Se Compass are modules, concepts, or historical implementations.

**Reason:** Splitting the evidence model across overlapping products would create duplicate databases, provenance, authorization, and audit trails.

## D-004 — Shared canonical record model

**Decision:** Future work converges on one model centered on Question → Source → Evidence → Claim → Finding → Unknown and one audit trail.

**Reason:** The current app has useful but differently named structures. Future changes must be additive and deliberate rather than silently conflating old confidence statuses with the new epistemic model.

## D-005 — Epistemic safety

**Decision:** FACT, AUTHORITY, CLAIM, INFERENCE, CONTRADICTION, QUESTION, and UNKNOWN are distinct statuses. Relationship evidence is DOCUMENTED, INFERRED, ALLEGED, or UNKNOWN.

**Reason:** A graph or confidence label must not manufacture certainty. Proximity, allegation, and inference are not proof.

## D-006 — Default privacy

**Decision:** Private records remain private unless deliberately published. No public publication is implied by a client route, object key, record ID, or UI label.

**Reason:** Sensitive records and evidence require server-side authorization and a separate publication boundary.

## D-007 — File uploads are not part of the immediate foundation

**Decision:** Preserve the existing S3/Forge storage helper and evidence metadata schema, but do not enable broad evidence-file uploads during the inventory pass.

**Reason:** A safe upload policy requires explicit file-type/size limits, object authorization, retention, malware/content handling, and privacy/privilege decisions. The current v1 evidence path intentionally stores reference metadata rather than accepting file bytes.

## D-008 — Health claims require dependency verification

**Decision:** The existing public `system.health` endpoint is not a production-health assertion.

**Reason:** It returns `{ ok: true }` without checking database, storage, OAuth, or other dependencies. Operational status must be based on actual checks, not labels.

## D-009 — Legal boundary

**Decision:** The product is organization and research software, not legal advice or legal representation. No automated filing, service, legal conclusion, or legal-advice feature is part of the MVP foundation.

## D-010 — Deployment is deferred

**Decision:** No hosting-provider change, database creation, migration execution, or deployment occurs in this pass.

**Reason:** The active full-stack deployment URL and runtime configuration are not objectively verified from repository metadata alone.

## D-011 — Foundation commit scope

**Decision:** This pass is documentation-only foundation work. No feature code, database schema, hosting, or production configuration is changed.

**Reason:** Establish a forensic baseline before implementation so later changes can be attributed and audited.


## Implementation Pass 1 Compatibility Note

Retained: `legal_cases`, `case_members`, `source_records`, `source_excerpts`, `evidence_items`, `chronology_events`, `citations`, and the existing revision/audit foundation. Extended through additive canonical metadata/link tables rather than replacing existing records.

The user-facing term is Record; `legal_cases` remains the compatible storage anchor. New records create both the legacy case row and canonical `record_metadata`. Existing cases continue to load through a legacy fallback when canonical metadata is absent. Existing confidence values (`PRIMARY-RECORD`, `USER-REPORTED`, `VERIFY`, `SOURCE-UNAVAILABLE`, `CONFLICTING`) remain distinct from epistemic category.
