# Agent Interface

**Status:** Foundational contract, September 4, 2026

The Citizens Record is designed to be agent-compatible without making the agent runtime part of the application's core data model.

## Boundary

Agents must interact through an application-owned tool interface. They must not receive direct database credentials, object-store credentials, or unrestricted access to private records.

The first interface is intentionally **read-only**. It is provider-neutral and can later be adapted to MCP, A2A, Dedalus, OpenAI, Anthropic, or another runtime without changing the canonical record model.

## Initial tools

| Tool | Purpose | Access |
| --- | --- | --- |
| `record.list` | List the authenticated user's private records | Read |
| `record.get` | Retrieve one owned record | Read |
| `source.list` | List sources for one owned record | Read |
| `evidence.list` | List source-backed evidence for one owned record | Read |
| `claim.list` | List canonical claims for one owned record | Read |
| `finding.list` | List canonical findings for one owned record | Read |
| `unknown.list` | List canonical unknowns for one owned record | Read |

The machine-readable definitions live in `server/agent/toolContract.ts`.

## Authorization invariant

Every tool invocation must resolve the authenticated user first and enforce ownership before returning private data. Tool names and record IDs are not authorization mechanisms.

## Evidence invariant

Agent output may reason over records, sources, evidence, claims, findings, and unknowns, but the agent interface must preserve the distinction between epistemic status and reliability/confidence. It must never silently turn an inference, allegation, or unknown into a fact.

## Write boundary

Write tools are deliberately excluded from this first pass. Future write operations must have explicit schemas, authorization checks, audit events, and a clear distinction between proposing an action and executing an action.

## Runtime adapters

A future MCP adapter should map MCP tool calls to this contract. A future A2A or provider-specific adapter should do the same. The canonical application remains the authority for authorization, provenance, privacy, and persistence.
