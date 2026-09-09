# ProofFlow Investigation Pipeline Implementation

## Status

**Implemented:** The existing `/workspace` route now exposes the existing record workspace, and the Question tab now executes a provenance-first investigation pipeline without replacing the current UI or case/evidence architecture.

**Configured:** The server-side procedure, stored-evidence retrieval, structured LLM orchestration, evidence-ID integrity validation, persistence, audit metadata, structured result UI, and unit coverage are implemented in source.

**Requires deployment configuration:** The production database migration, OAuth/session secrets, and built-in LLM credentials must be applied in the actual deployment environment. No credentials were invented or committed.

## A. Files changed

- `drizzle/canonical.ts` — added the persistent `investigations` table and status enums.
- `drizzle/0005_investigations.sql` — added the MySQL migration.
- `drizzle/meta/_journal.json` — registered migration `0005_investigations`.
- `server/investigation.ts` — added stored-evidence retrieval, provenance shaping, structured LLM orchestration, UNKNOWN fallback, and integrity validation.
- `server/canonicalRecord.ts` — added protected `canonical.investigations.list` and `canonical.investigations.ask` procedures.
- `client/src/pages/RecordWorkspace.tsx` — wired the existing Question tab to submit investigations and display QUESTION, EVIDENCE USED, FINDINGS, CONTRADICTIONS, UNKNOWN/MISSING INFORMATION, SOURCES, and AUDIT TRAIL sections.
- `server/investigation.test.ts` — added retrieval, provenance, UNKNOWN, CONTRADICTION, invalid evidence-ID, and unauthenticated access tests.

## B. Database/schema changes

The new `investigations` table stores:

- `id`
- `caseId`
- `userId`
- `question`
- `status`
- `requestedBy`
- `retrievedEvidenceIds`
- `model`
- `resultJson`
- `validationStatus`
- `errorMessage`
- `completedAt`
- `createdAt`
- `updatedAt`

It is protected by composite owner/case and requester foreign keys. The migration is `drizzle/0005_investigations.sql` and must be applied through the normal deployment migration process with `DATABASE_URL` configured.

## C. API procedures added

### `canonical.investigations.list`

Protected query that lists investigations for an owned record.

### `canonical.investigations.ask`

Protected mutation accepting:

```ts
{
  recordId: number;
  question: string; // trimmed, 3–5000 characters
}
```

Execution path:

1. Server-side ownership check for the selected record.
2. Persistent investigation row created with `ANALYZING` status.
3. Retrieval of stored source excerpts owned by the user and case.
4. Provenance enrichment from `source_records`.
5. Claim relationship lookup through existing `claim_evidence_links`.
6. Chronology lookup from the existing chronology table.
7. Server-side structured LLM call through existing `invokeLLM`.
8. Validation that every model-referenced evidence ID was actually retrieved.
9. Validation status assigned as `VALID`, `UNKNOWN`, or `CONTRADICTION`.
10. Structured result and audit metadata persisted.
11. Result returned to the UI.

If no stored evidence exists, the procedure does not call the model and returns a persisted `UNKNOWN` result. If the model fails or returns an unavailable evidence ID, the investigation is marked failed and no fabricated result is returned.

## D. Investigation flow implemented

```text
USER
  → existing protected workspace
  → Question tab
  → canonical.investigations.ask
  → owned source excerpts
  → source provenance + claim relationships + chronology
  → server-side structured LLM analysis
  → evidence-ID integrity validation
  → persisted investigation + canonical audit event
  → structured result UI
```

The model is not treated as the source of truth. Stored evidence, provenance, relationships, validation state, contradictions, and unknowns remain authoritative.

## E. Tests added

`server/investigation.test.ts` covers:

- Question analysis with no evidence produces `UNKNOWN`.
- Retrieval preserves evidence ID, source ID, source metadata, locator, and claim IDs.
- Contradiction results produce `CONTRADICTION` validation status.
- Model references to unavailable evidence IDs are rejected.
- Unauthenticated investigation calls are rejected before database access.

Full suite result:

```text
12 test files passed
28 tests passed
1 existing Stripe test skipped intentionally
```

## F. Environment variables required

Required for the deployed flow:

- `DATABASE_URL` — production MySQL/TiDB connection string.
- `JWT_SECRET` — session signing secret.
- `OAUTH_SERVER_URL` — Manus OAuth backend.
- `VITE_APP_ID` — OAuth application ID.
- `BUILT_IN_FORGE_API_URL` — server-side built-in API base URL.
- `BUILT_IN_FORGE_API_KEY` — server-side LLM/API credential.

Existing authentication and application variables remain required as applicable:

- `OWNER_OPEN_ID`
- `PORT`
- `NODE_ENV`

No LLM or OAuth credential is exposed to the browser.

## G. Exact verification results

Commands run:

```text
pnpm check
pnpm test
pnpm build
git diff --check
```

Results:

- `pnpm check`: passed.
- `pnpm test`: passed — 28 tests passed, 1 skipped.
- `pnpm build`: passed.
- `git diff --check`: passed.
- Production bundle generated successfully.

The build emitted only the existing Vite large-chunk warning; it did not fail.

## H. Still incomplete

The following cannot be completed from the repository-only environment:

1. Apply `drizzle/0005_investigations.sql` to the production database.
2. Verify production `DATABASE_URL` reachability and migration state.
3. Configure and verify `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`.
4. Exercise a real authenticated production investigation using a non-sensitive account and stored evidence.
5. Confirm the production full-stack URL is serving this repository rather than the separate static publication.
6. Capture production server logs and browser network traces for the real deployment.

The source implementation is complete and tested. The remaining items are deployment configuration and live-environment verification, not UI redesign or architectural replacement.

> This is a software implementation handoff, not legal advice.
