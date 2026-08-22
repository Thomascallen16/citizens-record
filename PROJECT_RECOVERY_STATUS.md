# Project Recovery Status — Citizen’s Record

> **Scope:** This is an operational recovery record for a source-first legal-document organization and research application. It is not legal advice, legal representation, or a claim that externally dependent services have been exercised.

| Field | Verified status |
|---|---|
| **PROJECT** | Citizen’s Record (paid source-linked evidence workspace) |
| **STATUS** | IN PROGRESS |
| **GITHUB REPOSITORY** | https://github.com/Thomascallen16/citizens-record |
| **BRANCH** | `main` |
| **AUDIT BASE COMMIT** | `073e9b578d09ae678c5f151a50afe0ed6df0af12` — “Document release readiness assessment” |
| **LATEST COMMIT** | Recovery-document preservation commit; verify with `git log -1 --format=%H` after synchronization. |
| **DEPLOYMENT** | No GitHub Pages site or GitHub deployment record was found during the audit. |
| **LIVE URL** | Not verified for this repository. |

## Working Features

- Authenticated, owner-scoped case workspaces with source records, evidence rows, chronology events, acquisition items, and source-linked exports.
- Protected paid drafting workflow that preserves source references, unresolved-state warnings, and the `DRAFT — REVIEW BEFORE FILING` boundary.
- Stripe entitlement and webhook implementation with automated coverage; external live payment verification is not claimed.
- Automated verification completed on the audit baseline: `pnpm check`, `pnpm test`, and `pnpm build` all exited successfully.

## Incomplete Features

- Final managed checkpoint and release synchronization remain unconfirmed.
- The intended GitHub destination for the managed release is recorded as `Thomascallen16/citizens-recordapp`, while this repository is `Thomascallen16/citizens-record`; the duplication/mismatch must be resolved deliberately.
- Stripe must not accept live customer payments until live mode keys, the intended product/price, and webhook delivery have been verified in the account dashboard and deployed application.

## Blocked By

- Managed-project checkpoint and hosting access are outside this repository-only audit.
- Stripe account activation, test/live key validation, and end-to-end authenticated checkout/webhook testing require authorized account access.
- A user decision is required before treating this repository or `citizens-recordapp` as the canonical release destination.

## Exact Action Required From Tommy

1. Select the canonical production repository: `citizens-record` or `citizens-recordapp`.
2. In the managed project settings, confirm the active deployment and save a publishable checkpoint.
3. In Stripe, verify whether the project is in test or live mode, configure matching keys and webhook signing secret in the managed secret store, and complete one controlled end-to-end test before accepting payments.
4. Sign in to the deployed workspace and perform a harmless upload/review/export check with non-sensitive sample content.

## Environment Variables Required

The managed runtime supplies database, OAuth, Forge/storage, session, and application identifiers. Source references include `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `MOTION_DRAFTING_PRICE_ID`. Store actual values only in managed secret configuration; never commit them.

## Next Command or Task

```bash
pnpm check && pnpm test && pnpm build
```

After the checks, preserve the resulting managed checkpoint and synchronize only the chosen canonical repository, excluding secrets, local uploads, `node_modules`, logs, and generated build output.

## Audit Evidence

- Audit executed against a fresh clone at the base commit listed above.
- Dependency installation using the lockfile succeeded.
- All three documented commands passed locally on 2026-08-22.
- No uncommitted source changes were present before this recovery document was added.
