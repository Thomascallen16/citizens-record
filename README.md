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
