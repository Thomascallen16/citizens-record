# Agent Interface

**Status:** Provider-neutral governed read contract; October 5, 2026

The Citizens Record is designed to be agent-compatible without making an agent runtime part of the application's canonical data model.

## Boundary

Agents interact through an application-owned interface. They do not receive direct database credentials, object-store credentials, or unrestricted private-record access.

The first interface remains **read-only** and provider-neutral. MCP is one transport adapter; other agent protocols can consume the same contract.

## Tools

| Tool | Purpose | Access |
| --- | --- | --- |
| `record.list` | List the authenticated user's private records | Read |
| `record.get` | Retrieve one owned record | Read |
| `source.list` | List sources for one owned record | Read |
| `evidence.list` | List source-backed evidence for one owned record | Read |
| `claim.list` | List canonical claims for one owned record | Read |
| `finding.list` | List canonical findings for one owned record | Read |
| `finding.get` | Retrieve a finding with linked claims, evidence, and sources | Read |
| `unknown.list` | List canonical unknowns for one owned record | Read |
| `audit.list` | Retrieve append-only audit history for one owned record | Read |

## Authorization invariant

Every invocation resolves the authenticated user first and enforces ownership before returning private data. Tool names and record IDs are not authorization mechanisms.

## Evidence invariant

Agent output may reason over records, sources, evidence, claims, findings, and unknowns, but the interface preserves the distinction between epistemic status and reliability/confidence. It must never silently turn an inference, allegation, or unknown into a fact.

## Traceability invariant

A material finding exposed to an agent should remain traceable to its linked claims, source-backed evidence, and source metadata. Audit history is separately available so downstream agents can distinguish current state from recorded activity.

## Write boundary

Write tools remain excluded. Future write operations require explicit schemas, authorization checks, audit events, and a clear distinction between proposing an action and executing it.

## Runtime adapters

MCP, A2A, and provider-specific adapters should map to this same contract. The canonical application remains the authority for authorization, provenance, privacy, persistence, and epistemic policy.
