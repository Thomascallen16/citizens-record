# MVP Roadmap

**Status:** Planning only. No feature implementation is authorized by this document.

## Priority 0 — Canonical foundation

1. Canonical repository and architecture documentation.
2. Clean reproducible build and CI baseline.
3. Secret/configuration safety and immutable CI actions.
4. Verify authentication and server-side authorization.
5. Establish explicit distinction between verified facts, claims, inferences, contradictions, questions, and unknowns.
6. Confirm deployment ownership before any production release.

## Priority 1 — Core private record system

1. Projects and private records.
2. Question, Source, Evidence, Claim, Finding, and Unknown objects.
3. Source/document provenance and version preservation.
4. Pinpoint excerpts/citations and traceability.
5. Append-only audit history.
6. Default-private authorization across every object.
7. Safe document handling only after an approved upload policy.

The target core flow is:

**Question → Source → Evidence → Claim → Finding → Unknown**

The existing case/source/evidence/chronology structures are foundations for this work, not proof that the target model is already complete.

## Priority 2 — Public record and analysis surfaces

1. Timeline/Chronicle using source-linked TimelineEvent objects.
2. Basic relationship graph using Entity/Relationship objects and explicit relationship-evidence status.
3. Intentional public publishing with a separate reviewed/read-only representation.
4. Public record pages that cannot expose private source objects or documents.

## Explicitly deferred

- Autonomous agents
- Full Watchtower monitoring
- Broad web crawling
- Cross-user pattern detection
- Public collaboration
- Automatic legal advice
- Complex authority research
- Full social-media/creator ingestion
- Native apps
- Payment systems as an MVP dependency

## Existing capabilities to preserve but not prioritize

- Motion drafting and Stripe entitlement controls
- Acquisition/record-need queue
- CSV/Markdown exports
- Privacy/takedown request foundation
- First-party privacy-safe analytics events
- S3/Forge storage helper

## Acceptance gate before production

A Priority 1 release should not be called complete until authentication, ownership isolation, provenance, audit history, build/tests, secret scanning, and intentional publication controls have been verified from code and runtime—not inferred from UI labels or dashboards.


## Implementation Pass 1 Status

Complete on the feature branch: canonical private Record metadata, source-backed evidence, claims, findings, unknowns, normalized traceability links, server-enforced ownership checks, FACT-with-evidence validation, and canonical audit events.

Next implementation pass: provenance/versioning, timeline integration, entity relationships, and deliberate public publishing.
