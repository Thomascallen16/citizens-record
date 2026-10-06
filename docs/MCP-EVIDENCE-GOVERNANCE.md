# Evidence Integrity Engine — MCP Governance Profile

## Purpose

MCP is the interoperability layer. The Evidence Integrity Engine is the trust layer.

The system should let an external agent ask for evidence-backed material without giving that agent authority to redefine what is true.

## Design principles

### 1. Identity follows the request

Authentication and authorization happen at the application boundary. An agent gets the permissions of the authenticated principal, not a broader service identity.

### 2. Context follows the evidence

Sources, source-backed evidence, claims, findings, unknowns, and audit history remain separate objects. A downstream agent receives enough structure to reason without collapsing those distinctions.

### 3. Provenance beats confidence

A model's confidence is not evidence. A finding is useful because it can be traced to source material and its relationship to that source can be inspected.

### 4. Unknowns remain first-class

An unresolved question is returned as an unresolved question. MCP must not convert absence of evidence into evidence of absence.

### 5. Read before write

The initial MCP surface is read-only. Mutations, publication, ingestion, deployment, secrets, and legal conclusions remain outside autonomous agent authority.

### 6. Auditability is part of the interface

An agent should be able to inspect the audit trail rather than receiving only the current state. This makes downstream reasoning more accountable and makes agent orchestration easier to evaluate.

## Agent orchestration target

The long-term EIE pattern is:

**Agent → MCP → authenticated EIE boundary → canonical evidence/provenance → agent reasoning → independently verifiable result**

The important property is that the verification layer is reusable by many agents. EIE does not need to own the reasoning model; it owns the evidence contract and the integrity controls around it.

## Verification standard

A future verification tool should report structured evidence of its checks rather than a single opaque score. At minimum, a verification result should distinguish:

- source existence;
- source/evidence ownership;
- provenance completeness;
- supporting and contrary evidence;
- epistemic category;
- unresolved unknowns;
- audit state;
- verification timestamp/version.

No future verification endpoint should promote an item to FACT merely because an agent requested verification.

## Relationship to external MCP guidance

Current MCP guidance emphasizes identity-aware access, fine-grained permissions, audit logging, privacy boundaries, and clear tool scopes. EIE adopts those principles while adding a domain-specific requirement: **epistemic integrity must survive the protocol boundary.**

This profile is architecture guidance, not a claim that any external vendor's implementation or controls are equivalent to EIE.
