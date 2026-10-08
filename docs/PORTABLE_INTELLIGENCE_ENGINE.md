# Portable Intelligence Engine — Autopilot v0.1

## Mission

Build a portable, local-first autonomous intelligence engine that can run from removable storage, operate offline when possible, use stronger cloud models when authorized, and treat the Evidence Integrity Engine (EIE) as a verification boundary rather than an optional feature.

This is not a business-only agent. It is a general-purpose orchestration runtime.

## Core loop

Investigate → Retrieve → Read → Reason → Verify → Act → Observe → Receipt → Audit → Learn

No agent assertion becomes FACT merely because an AI model produced it.

## Capabilities

- Local filesystem discovery and document retrieval, limited to explicitly authorized roots.
- Search across PDFs, text, office documents, images/OCR, source code, and exported communications.
- Evidence bundles with hashes, provenance, timestamps, source references, and replayable receipts.
- Multi-agent orchestration with specialized workers: retrieval, research, analyst, contradiction hunter, timeline builder, coder, reviewer.
- Provider-neutral model routing: local model, cloud model, or hybrid.
- MCP tool boundary with explicit capability and approval policy.
- GitHub-aware engineering workflows.
- Web research when online access is authorized.
- Offline-first operation with graceful degradation.
- Human approval gates for consequential actions.
- Deterministic audit trail around non-deterministic model output.

## First usable milestone

Point the engine at a folder and ask:

> Find everything relevant to a question.

The engine should:

1. discover candidate files;
2. extract searchable content;
3. rank/retrieve relevant passages;
4. produce findings with source references;
5. classify each finding as FACT, CLAIM, LAW/AUTHORITY, QUESTION, or UNKNOWN;
6. identify contradictions and missing evidence;
7. emit an evidence bundle and verification receipt;
8. allow the user to inspect the original source.

## Security boundary

The portable engine must never silently scan the entire host computer, execute arbitrary commands, upload private files, or take consequential external actions.

Capabilities are opt-in and scoped.

Default posture: read-only.

## Portable deployment target

The first target is a removable drive with enough capacity for the runtime, indexes, configuration, logs, and one or more quantized local models. The runtime should also support a smaller "engine-only" footprint with models stored separately.

## Architectural principle

The model is replaceable.

The orchestration, evidence, provenance, policy, receipts, and audit layers are the durable asset.

## Relationship to Citizen's Record

Citizen's Record remains a product/workspace.

The Portable Intelligence Engine is infrastructure that can serve Citizen's Record, EIE, Watchtower, engineering work, research, and unrelated user projects without becoming coupled to any one application.

## Non-goals for v0.1

- No claim of human-level general intelligence.
- No autonomous legal advice.
- No unrestricted computer control.
- No silent network access.
- No automatic external publishing or financial transactions.
- No training a foundation model from scratch.

## Acceptance test

A clean machine with the engine on removable storage should be able to launch the runtime, authorize a local folder, index a small document set, answer a source-linked question, produce an evidence bundle, and verify that bundle without requiring the cloud.
