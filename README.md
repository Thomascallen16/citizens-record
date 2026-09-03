# Citizen's Record — Accountability Platform

This repository is the **full-stack application foundation** for the interactive Accountability Platform.

The Permanent Civic Portal lives separately in `The-Citizens-Record` and is intentionally static, public, and account-free. This application is where authenticated users can eventually build and manage records, evidence, sources, timelines, verification work, exports, and related accountability tools.

## Core principle

> **Don't ask people to trust the system. Give them the sources and the means to verify.**

The platform must distinguish FACT, AUTHORITY, CLAIM, INFERENCE, CONTRADICTION, QUESTION, and UNKNOWN. It must preserve provenance, show conflicting evidence, avoid manufactured certainty, and make material findings auditable.

## Ecosystem role

- `The-Citizens-Record` — Permanent Civic Portal / public static workbench
- `citizens-record` — interactive full-stack Accountability Platform foundation
- `ProofFlow` — evidence and provenance instrument
- `watchtower` — authorized privacy/exposure instrument
- `docs` — ecosystem documentation
- `The-Citizen-Main-File` — historical source archive

## Development status

This repository contains the substantial full-stack application source and is the canonical GitHub source for that application. Production deployment still depends on verifying its current build/test state and configuring external services such as database, authentication, billing, and other provider credentials.

Do not commit secrets or private evidence.

## Deployment truth

The project is not considered production-ready merely because the source builds. Production status requires successful tests, production build, appropriate environment configuration, deployment, and runtime verification.


## Canonical Evidence-First Record Workflow

The authenticated `/record` workspace provides the private Question → Source → Evidence → Claim → Finding → Unknown workflow. Records are private by default and ownership is enforced server-side.

### Local setup

1. Install Node.js and pnpm 10.
2. Copy `.env.example` to a local environment file and provide the required OAuth, database, and storage configuration.
3. Ensure `DATABASE_URL` points to a MySQL-compatible database.
4. Run migrations with `pnpm db:push` for local development; production changes should be applied through the checked-in Drizzle migrations rather than schema push.
5. Run `pnpm check`, `pnpm test`, and `pnpm build`.

Claims remain assertions. Evidence points to a source and locator. Findings explicitly declare an epistemic category; FACT requires supporting evidence. Unknowns remain visible instead of being converted into conclusions.
