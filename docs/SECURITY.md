# Security Foundation

**Audit date:** September 3, 2026

## Secret scanning

- GitHub Actions includes a Gitleaks workflow pinned to an immutable action commit.
- The repository also contains an agent-facing supply-chain policy and deterministic audit script.
- No secret values are reproduced in this document.
- A source-level review did not identify a reason to publish or copy any private evidence, credential, token, key, or production database export.

**Important limitation:** repository inspection cannot prove that historical secrets never existed in prior commits or that current external provider secrets are configured safely. Gitleaks CI is the authoritative next check for committed-secret history.

## Environment/configuration

`.gitignore` excludes `.env`, `.env.local`, development/test/production local variants, generated output, logs, database files, and other common local artifacts. `.env.example` is present and lists variable names only.

Known configuration names include `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`, Forge/S3 integration variables, and Stripe variables. Values are intentionally omitted.

## Authentication

Authentication is implemented in code through Manus OAuth plus an application-signed HS256 JWT session. Requests first look for the session cookie and may fall back to a Bearer token for the documented preview/WebView path. `protectedProcedure` rejects missing users; `adminProcedure` additionally requires the database user role `admin`.

This is a real server-side authentication/authorization implementation in source. However, live OAuth configuration and secret strength cannot be verified without the deployment environment.

## Authorization

Case-linked procedures use the authenticated user's ID and ownership checks before reads/writes. The database schema also includes owner/case foreign-key relationships and a `case_members` foundation. The current v1 sharing policy remains owner-only.

This is a strong baseline, but every future canonical entity must preserve server-side object-level authorization. Client-side route visibility is not an authorization control.

## Storage and uploads

The repository contains an S3-compatible storage helper using Forge-generated presigned PUT/GET URLs. The current evidence-item route is explicitly reference-only and records metadata rather than accepting arbitrary file bytes.

Risks/gaps before broad uploads:

- No approved narrow file-type allowlist is established in the canonical MVP documentation.
- No verified malware/content scanning pipeline is established.
- Object-level authorization must be enforced before generating signed download URLs.
- Retention/deletion and privileged/sensitive evidence handling require policy decisions.
- The Express application accepts a 50 MB JSON body limit; this is not proof of a safe binary upload policy and should not be treated as one.

## CI/CD

CI actions are pinned to immutable commit SHAs. The application CI installs with `pnpm install --frozen-lockfile`, runs type checking, tests, and production build. The security workflow runs Gitleaks over full history. An agent-supply-chain workflow audits AI-facing files.

No deployment workflow was identified as the authoritative production deployment for this repository. A successful Railway-linked commit status exists, but that alone does not establish the live runtime state.

## Dependencies

The project has a committed pnpm lockfile and a declared pnpm package manager. Dependency versions are largely range-based in `package.json`, while the lockfile pins resolved versions. CI uses the lockfile. Future dependency changes should preserve lockfile review and the existing immutable-action policy.

## Operational-status caution

`system.health` is a public tRPC query that returns `{ ok: true }`. It validates an input timestamp but does not test the database, storage, OAuth provider, Stripe, or other dependencies. It therefore must not be presented as full infrastructure health.

## Highest-risk findings

1. **Repository visibility:** `citizens-record` is currently public. Because it is the canonical full-stack source, this creates a source-code/configuration exposure risk. Private evidence and secrets must never be committed. Whether the repository itself should be private is an owner decision.
2. **Live runtime is not independently verified:** external environment configuration, database connectivity, OAuth configuration, storage credentials, and deployment URL are not visible in Git source.
3. **Upload boundary is incomplete:** storage infrastructure exists, but a broad secure evidence-upload lifecycle is not established.
4. **Health endpoint is weak:** `{ ok: true }` is not dependency health.
5. **Epistemic model mismatch:** existing confidence statuses differ from the requested canonical evidence-status model; future implementation must avoid conflation.

## Immediate remediation priorities

- Keep secrets and private evidence out of Git.
- Confirm the intended visibility of the canonical full-stack repository before storing sensitive source artifacts.
- Verify CI secret scanning passes on the current branch.
- Verify runtime environment and deployment ownership before deployment.
- Preserve server-side ownership checks for every new record object.
- Do not enable broad file uploads until the upload/privacy policy is approved.
