# Citizen's Record Ecosystem Role

This repository is the **canonical full-stack Citizen's Record application**.

It is separate from `The-Citizens-Record`, which is the canonical public/static website. The static site should not be treated as a mirror of this application's server or database code.

## Canonical responsibilities

- Authenticated owner-scoped workspaces
- Source and evidence records
- Chronology and acquisition records
- Source-linked exports
- Protected drafting workflow with explicit review boundary
- Application API/server and database layer
- Paid entitlement/payment integration when externally configured and verified

## Important repository-status correction

The repository contains a substantial application codebase and is therefore not merely an empty recovery/bootstrap repository. Its operational recovery document records that the managed-release destination `citizens-recordapp` was previously expected, but no such repository currently exists under the connected GitHub account.

Until another canonical destination is actually established, **`citizens-record` is the canonical GitHub source for this full-stack application**.

## Deployment boundary

This application requires an application host, database, managed secrets, OAuth/runtime configuration, and (for paid features) verified Stripe configuration. GitHub Pages is not the deployment target for the full-stack application.

Never commit credentials, private evidence, database contents, webhook secrets, or customer data.

## Accountability boundary

The application organizes evidence and information. It must preserve source provenance, distinguish facts from claims and inferences, expose unknowns and contradictions, and avoid presenting generated material as individualized legal advice.
