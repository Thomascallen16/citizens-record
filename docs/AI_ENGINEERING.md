# AI Engineering Readiness

**Repository:** `Thomascallen16/citizens-record`  
**Audit baseline:** `main` at `d032b6af8ec3ca1bbab700fe71c33631389707e2`  
**Scope:** bounded Codex → GitHub → CI → AWS production-readiness audit. No production infrastructure or secrets were changed.

## Executive assessment

The repository is a credible first proving ground for AI-native engineering. The latest `main` commit has passing Application CI and Security Scan workflows. The codebase already establishes server-side authentication, user-scoped database access patterns, private storage authorization, and review-before-filing language for generated legal drafts.

**Overall readiness: Medium / progressing toward production.**

The strongest remaining work is not broad cleanup. It is proving the security boundary with adversarial regression tests, documenting deployment controls, and replacing the current managed-storage abstraction with an explicitly owned AWS storage boundary before production use.

## Findings

### High — Authorization is implemented, but adversarial coverage is too thin

Private tRPC procedures consistently use `protectedProcedure`, and case/resource reads generally pass the authenticated user ID into database functions. Nested resources are also checked against the current user and case. The central `requireOwnedRecord` helper only rejects missing records; it is intentionally not an ownership query itself.

The current ownership unit test verifies only the helper's null behavior. It does not prove cross-user/cross-case behavior through the real router/database boundary.

**Action:** add focused tests proving that a user cannot read, update, delete, restore, cite, or create nested resources against another user's case/resources by supplying valid IDs from outside their workspace.

### High — Storage boundary needs explicit AWS production design

`server/_core/storageProxy.ts` now checks the authenticated user and requires a matching READY, non-deleted evidence item before requesting a signed URL. That is a meaningful security improvement.

However, the proxy currently depends on the managed Forge storage API rather than an explicitly owned AWS S3 bucket/IAM boundary. Before AWS production, define a private S3 bucket, server-side IAM role, object-key namespace, encryption policy, and short-lived presigning path. Do not expose bucket credentials to clients.

**Action:** design and review the AWS storage boundary before provisioning it.

### Medium — Authentication is optional at context construction by design

The request context attempts authentication and allows `user = null` so public procedures can operate. `protectedProcedure` correctly rejects unauthenticated requests, while `adminProcedure` additionally checks `role === "admin"`.

This is acceptable, but future private procedures must never be added as `publicProcedure`. A route inventory test or lintable convention would reduce regression risk.

### Medium — Database mutation result handling should be hardened

Several update/delete functions issue scoped `UPDATE` statements and then write revision events without checking whether a row was actually changed. Current router guards make the normal path safe, but explicit affected-row assertions would make authorization failures and stale/deleted-object behavior easier to reason about.

**Action:** consider returning/validating affected-row counts in a later hardening pass, with tests.

### Medium — Production deployment controls are not yet established

CI is read-only with `contents: read`, uses pinned GitHub Action SHAs, installs with `--frozen-lockfile`, and runs typecheck, tests, and build. That is a strong baseline.

The repository should still require reviewed changes and successful CI before merging to `main`, and production deployment should be a separate controlled operation rather than an implicit consequence of an agent commit.

**Action:** configure GitHub rulesets/branch protection and an explicit AWS deployment environment with human approval when the production pipeline is introduced.

### Low — Dependency cleanup is not currently justified

The lockfile is present and CI is green. No dependency upgrade or cleanup is warranted merely for appearance. Changes should be driven by security, correctness, or operational need.

## Existing safeguards confirmed

- `AGENTS.md` establishes: inspect → propose → verify → change → test → review → merge → deploy.
- Secrets and private evidence are explicitly prohibited from source control by `SECURITY.md`.
- CI uses least-privilege read-only repository permissions.
- GitHub Actions are pinned to immutable commit SHAs in the main CI workflow.
- CI uses a frozen pnpm lockfile and runs typecheck, tests, and production build.
- Storage authorization checks user ownership, READY state, and non-deleted status before obtaining a signed URL.
- Legal drafting output is explicitly labeled as a review-required working draft and does not claim to be legal advice.

## AWS target architecture — minimal production shape

1. **Runtime:** containerized Node/Express application on ECS Fargate or an equivalent managed compute service.
2. **Database:** Amazon RDS for MySQL with private networking, encryption at rest, automated backups, and credentials in Secrets Manager.
3. **Evidence storage:** private Amazon S3 bucket with Block Public Access, server-side encryption, lifecycle/versioning policy as appropriate, and application-generated short-lived presigned URLs.
4. **Secrets:** AWS Secrets Manager or SSM Parameter Store; never baked into images or committed to Git.
5. **Observability:** CloudWatch logs/metrics and CloudTrail for AWS API activity.
6. **Network:** VPC with private database placement and tightly scoped security groups; public ingress only through the intended application edge/load balancer.
7. **Deployment:** GitHub Actions or an equivalent controlled pipeline assuming an AWS deployment role with narrowly scoped permissions. Production deployment should require an explicit approval gate.

## Future Codex AWS permissions

Codex should not receive broad administrator access merely to deploy this application. The eventual deployment role should be narrowly scoped to the exact resources it needs, such as:

- read application configuration needed for deployment;
- push a versioned application image to ECR;
- update the designated ECS service/task definition;
- read/write only the intended CloudWatch log groups and deployment metadata;
- read the specific deployment secret references without exposing secret values where possible;
- manage only the designated S3 bucket/prefix through the application runtime role, not through the deployment role;
- read deployment status and rollback information.

Infrastructure creation, IAM policy changes, secret rotation/deletion, database destruction, and production deployment approval remain human-controlled until separately authorized.

## Recommended next engineering step

Add the adversarial authorization regression suite first. It is the smallest change with the highest confidence value. Once those tests pass in CI, introduce the AWS deployment architecture as a separate reviewed change rather than mixing application security hardening with infrastructure provisioning.

## Validation

At audit time, the latest `main` commit had successful Application CI and Security Scan workflow runs. No production resources, secrets, or private evidence were changed as part of this audit.
