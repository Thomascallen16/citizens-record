# MCP Execution and Evidence Governance

The Citizens Record exposes a stateless, authenticated MCP HTTP endpoint at `/mcp`.

The MCP boundary is deliberately treated as an **evidence-access infrastructure layer**, not as an autonomous authority. An agent may retrieve governed record material, but the canonical application remains authoritative for identity, ownership, provenance, epistemic status, and audit history.

## Security boundary

1. Express validates the MCP Host/Origin policy.
2. The existing authentication layer authenticates the caller.
3. Only provider-neutral read-only tools are executable.
4. Tool arguments are validated by the same Zod contracts used by the agent surface.
5. The MCP executor creates an application caller with the authenticated user.
6. Canonical procedures perform ownership checks and database access.
7. MCP receives no database credentials and contains no second copy of ownership logic.

## Governed read surface

The MCP contract exposes:

- `record.list` — private records owned by the authenticated user
- `record.get` — one owned record
- `source.list` — sources belonging to an owned record
- `evidence.list` — source-backed evidence
- `claim.list` — canonical claims
- `finding.list` — canonical findings
- `finding.get` — one finding with linked claims, evidence, and source metadata
- `unknown.list` — unresolved questions/unknowns
- `audit.list` — append-only audit history

The final two additions are intentional: an agent should be able to inspect what remains unresolved and trace a material finding back through evidence and sources, while also inspecting the record's audit history.

## EIE invariant

MCP is not allowed to manufacture certainty.

The canonical epistemic categories remain:

**FACT · AUTHORITY · CLAIM · INFERENCE · CONTRADICTION · QUESTION · UNKNOWN**

Reliability/verification markers remain separate from epistemic category. An agent must not treat a confidence label, proximity, allegation, or model-generated explanation as proof.

A useful agent workflow is therefore:

**Question → Record → Sources → Evidence → Claims/Findings → Traceability → Unknowns → Audit**

This is the MCP expression of the Evidence Integrity Engine's core principle: evidence and provenance travel with the reasoning surface.

## Production configuration

Set `MCP_ALLOWED_HOSTS` explicitly for every public deployment.

Set `MCP_ALLOWED_ORIGINS` when browser-origin restrictions are required.

Before production exposure, independently verify authentication, owner isolation, audit behavior, and the deployed host. Do not infer production readiness from source code alone.
