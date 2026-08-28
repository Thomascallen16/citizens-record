# Project Recovery Status — Citizen’s Record

> **Scope:** Operational recovery record for the source-first legal-document organization and research application. It is not legal advice, legal representation, or a claim that externally dependent services have been exercised.

| Field | Verified status |
|---|---|
| **PROJECT** | Citizen’s Record interactive Accountability Platform |
| **STATUS** | READY FOR REPRODUCIBLE BUILD VERIFICATION; EXTERNAL DEPLOYMENT BLOCKED |
| **GITHUB REPOSITORY** | `Thomascallen16/citizens-record` |
| **BRANCH** | `main` |
| **DEPLOYMENT** | No verified deployment record in this repository |
| **LIVE URL** | Not verified |

## Verified source state

- This repository contains the substantial full-stack application source, including client, server, database/migration configuration, security documentation, environment template, and package scripts.
- The documented development scripts provide type-checking, tests, production build, and production start commands.
- Repository search found no obvious `TODO`, `FIXME`, `YOUR-`, or placeholder markers requiring immediate cleanup.
- The public/static Citizen’s Record portal is intentionally maintained separately in `Thomascallen16/The-Citizens-Record`.

## Production boundary

The application is **not** declared production-ready merely because source exists. Production release requires reproducible dependency installation, `pnpm check`, `pnpm test`, `pnpm build`, secure environment configuration, deployment, and runtime verification.

External services include database, authentication/OAuth, storage/Forge services, and Stripe. Actual credentials and secrets must remain in managed secret configuration and must never be committed.

## Canonical-repository decision

`citizens-record` is currently treated as the canonical GitHub source for the interactive application unless a separate `citizens-recordapp` repository is deliberately selected after direct comparison. Do not merge or delete repositories solely to resolve the naming discrepancy.

## Next verification sequence

```bash
pnpm check && pnpm test && pnpm build
```

Then:

1. Confirm the deployment target and required environment variables.
2. Deploy only after build/test verification succeeds.
3. Verify the running application without using real sensitive evidence.
4. Verify authentication, storage, evidence workflow, exports, and payment boundaries separately.
5. Do not enable live payments until controlled Stripe test/live verification is complete.

## User action required

No immediate action is required for repository cleanup. Account-level deployment, managed secrets, Stripe configuration, or a final production repository decision will be requested explicitly if and when they become the actual blocker.
