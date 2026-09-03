# Deployment Record

**Audit date:** September 3, 2026  
**Deployment action:** None. This document records only verified configuration and evidence.

## Current configuration

The application is a Vite/React client with an Express server and bundled server entry. `package.json` defines:

- Build: `vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- Start: `NODE_ENV=production node dist/index.js`
- Type check: `tsc --noEmit`
- Test: `vitest run`
- Database script: `drizzle-kit generate && drizzle-kit migrate`

The database configuration is MySQL dialect through Drizzle and requires `DATABASE_URL`.

## Environment variable names

Only names are documented here; no values are stored or disclosed:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `VITE_APP_ID`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MOTION_DRAFTING_PRICE_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`

## Database

Drizzle is configured for MySQL. The migration journal contains four tracked migrations: `0000_stiff_sleepwalker`, `0001_next_malcolm_colcord`, `0002_mean_sheva_callister`, and `0003_living_pride`.

The source proves that the application can initialize a Drizzle connection when `DATABASE_URL` is present. This audit does **not** prove that the live deployment has a reachable database or that the current production database has all migrations applied.

## Hosting/deployment evidence

The latest GitHub commit has a successful external status named `lovely-flexibility - citizens-record` whose target is a Railway project/service. This is objective evidence of a GitHub-to-Railway status integration, but it does not expose or prove the public application URL, current runtime health, or database state.

The existing production-readiness audit records `https://citizensrc-bjbhhbxb.manus.space` as the known public civic URL for the separate static `The-Citizens-Record` site. It must not be treated as the full-stack `citizens-record` deployment URL.

**Current full-stack deployment URL:** UNVERIFIED.

## Build verification

The repository's own August 22 production-readiness audit states that `pnpm check`, `pnpm test`, and `pnpm build` passed, with five test files passing and one intentionally skipped Stripe-price test at that time. The current `main` commit is later than that audit.

This September 3 audit environment could not independently run `pnpm install`/`pnpm build` because outbound GitHub network access was unavailable when attempting to obtain a local checkout. Therefore this pass does **not** claim a fresh local build. The exact production build command configured by the repository is the `pnpm build` script shown above.

## Safe deployment plan — deferred

1. Verify the exact Railway/managed deployment that owns this repository.
2. Verify runtime environment variables without exposing their values.
3. Verify database reachability and migration state in the intended environment.
4. Run CI from the canonical branch and require type check, tests, build, and secret scan to pass.
5. Verify authentication and owner isolation against a non-sensitive test account/sample record.
6. Verify storage authorization only if/when uploads are approved.
7. Verify the actual deployed URL and critical read/write flows.
8. Record deployment evidence and rollback procedure.

No step above was executed as a deployment in this pass.
