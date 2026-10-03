# Recursive Evidence Improvement

## Purpose

The Evidence Integrity Engine now has a bounded recursive-improvement primitive. It is not model self-modification. It is a controlled architecture for proposing, testing, independently verifying, and retaining demonstrably better evidence-handling procedures.

The loop is:

**Baseline → Propose → Test → Independently Verify → Measure → Accept/Reject → Repeat**

An improvement cannot be promoted merely because an agent says it is better.

## Safety invariants

1. **Evidence before promotion.** A candidate needs at least one evidence item tied to the verification result.
2. **Independent verification.** The proposer cannot also be the verifier.
3. **Strict improvement.** The candidate score must be greater than the current baseline.
4. **Regression stops the loop.** A failed candidate is recorded and not promoted.
5. **Duplicate protection.** Proposal fingerprints prevent the same proposal from recursively repeating.
6. **Bounded recursion.** Every run has an explicit maximum iteration count.
7. **No epistemic escalation.** Improvement status is separate from FACT/AUTHORITY/CLAIM/INFERENCE/CONTRADICTION/QUESTION/UNKNOWN.
8. **No automatic production mutation.** This subsystem evaluates procedures; it does not grant itself deployment, secret, database, or publication authority.

## What counts as an improvement

A verified improvement requires:

- a measurable evaluation score;
- passing tests;
- independently supplied evidence;
- a distinct proposer and verifier;
- a strict improvement over the current baseline.

The engine records every attempted iteration, including failures and rejections, so unsuccessful changes remain auditable.

## Integration boundary

The current implementation is a pure, deterministic server-side module with unit tests. It can be connected to the canonical audit-event stream and authenticated agent executor without giving an agent direct database access.

That boundary is deliberate: the same ownership, provenance, privacy, and audit controls remain authoritative.

## Future persistence

When persisted improvement runs are introduced, they should use append-only records linked to the canonical audit history. A persisted run must store the baseline, proposal fingerprint, verifier identity, test evidence, score delta, resulting state, and supersession relationship. It must never overwrite prior verification history.
