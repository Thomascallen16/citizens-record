# ProofFlow Production Verification Report

**Repository:** `Thomascallen16/citizens-record`

**Verified production deployment:** `https://citizens-record-production.up.railway.app`

**Verification date:** 2026-09-10 UTC

## Executive finding

The actual full-stack production deployment is the Railway service at `citizens-record-production.up.railway.app`. It is serving the new investigation bundle: the deployed JavaScript contains `Run investigation`, `canonical.investigations.ask`, and `Investigation result`.

The first production blocker is authentication configuration in the frontend build. The deployed bundle contains the compiled login implementation with `new URL("undefined/app-auth")` and `appId` set to `undefined`. This proves `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` were not available at frontend build time. The login button itself is present and wired, but clicking it cannot navigate to a valid OAuth portal URL.

The backend is reachable and the protected investigation API route is deployed. An unauthenticated request to `canonical.investigations.list` returns the expected `401 UNAUTHORIZED`, proving the route and authorization middleware are active. The investigation database migration, authenticated session, real evidence retrieval, LLM invocation, persistence, and audit trail remain blocked from live verification because the OAuth flow cannot complete and no Railway CLI or managed database project is attached to this session.

## Production component table

| Component | Status | Evidence |
|---|---|---|
| Production URL | VERIFIED | GitHub deployment status identifies `citizens-record-production.up.railway.app`; HTTPS root and `/workspace` return HTTP 200 from Railway/Express. |
| Frontend deployment | VERIFIED | Production HTML and JS served from Railway; deployed bundle contains the new investigation UI and procedure markers. |
| Backend/API deployment | VERIFIED | `/api/trpc/auth.me` returns HTTP 200; protected investigation route returns expected HTTP 401 when unauthenticated. |
| Database provider | BLOCKED | Repository uses MySQL/TiDB through `DATABASE_URL`, but the actual Railway database service and connection cannot be inspected from this session. |
| Authentication provider | FAILED | The app intends to use Manus OAuth, but the deployed bundle has `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` compiled as undefined. |
| LLM provider/endpoint | BLOCKED | Source invokes the built-in Forge LLM through `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`; production values cannot be inspected without Railway project access. Result validation is additionally delegated to the pinned `@thomascallen16/evidence-integrity-engine` package on current `main`. |
| Login | FAILED | Login button is rendered and handler is wired, but the compiled handler constructs `new URL("undefined/app-auth")` with `appId` undefined. |
| Session | VERIFIED | Unauthenticated session initialization works: `/api/trpc/auth.me` returns `{ data: null }`. Authenticated session cannot be established because login fails first. |
| `/workspace` initialization | VERIFIED | Railway `/workspace` returns the workspace UI; browser shows “Open the Record” and the OAuth button. Browser console has no runtime errors before login. |
| Database connectivity | BLOCKED | No authenticated request can reach the owned-record database path; no Railway database inspection access is available. |
| Migration `0005_investigations.sql` | BLOCKED | Migration exists in source, but the production migration table cannot be checked or changed without database/deployment access. |
| Question API | VERIFIED | Deployed bundle contains `canonical.investigations.ask`; protected API surface is present behind tRPC. |
| Evidence retrieval | BLOCKED | Requires authenticated case access and production database rows. No demo evidence was created. |
| Provenance | BLOCKED | Source implementation preserves source/evidence IDs and provenance, but no live authenticated result was possible. |
| LLM | BLOCKED | Requires authenticated request plus production Forge variables; no live invocation was attempted without those prerequisites. |
| Integrity validation | VERIFIED | Current `main` delegates validation to the pinned `@thomascallen16/evidence-integrity-engine`; local tests cover unavailable evidence IDs and contradiction/unknown status calculation. Live validation is blocked by authentication. |
| Investigation persistence | BLOCKED | Requires production migration and authenticated mutation. |
| Audit trail | BLOCKED | Requires successful persisted investigation. |
| Result UI | VERIFIED | Production bundle contains the result renderer; live result rendering is blocked by authentication. |
| Browser/client console | VERIFIED | No console output/errors on initial production `/workspace` load. The login configuration failure is visible from the deployed bundle and handler behavior rather than a browser crash. |
| Server/runtime logs | BLOCKED | Railway logs are not exposed through the repository, GitHub, or an attached Railway CLI in this session. |
| CORS/origin configuration | VERIFIED | Same-origin `/api/trpc` calls return from the Railway host; no cross-origin API is configured in the client. OAuth callback origin cannot complete until OAuth variables are fixed. |
| Production API target | VERIFIED | Client uses same-origin tRPC; no localhost API reference is present in the deployed bundle check. |

## Environment variable classification

Values and secrets were not printed.

| Variable | Status | Evidence / required purpose |
|---|---|---|
| `DATABASE_URL` | UNKNOWN | Required by server database initialization; actual Railway environment is not inspectable from this session. |
| `OAUTH_SERVER_URL` | UNKNOWN | Required by the server OAuth SDK; not exposed by source or public response. |
| `VITE_APP_ID` | MISSING | Public client value is compiled as `undefined` in the production JavaScript bundle. Must be set before rebuilding frontend assets. |
| `VITE_OAUTH_PORTAL_URL` | MISSING | Compiled login handler contains `new URL("undefined/app-auth")`. Must be set before rebuilding frontend assets. |
| `BUILT_IN_FORGE_API_URL` | UNKNOWN | Required by server-side LLM invocation; not inspectable without Railway access. |
| `BUILT_IN_FORGE_API_KEY` | UNKNOWN | Required server-side credential; presence cannot be safely inferred from public behavior. |
| `JWT_SECRET` | UNKNOWN | Required for signed session cookies; cannot be inspected from the public deployment. |
| `VITE_FRONTEND_FORGE_API_URL` | NOT REQUIRED for this flow | The investigation implementation invokes LLM server-side; no frontend Forge call is used. |
| `VITE_FRONTEND_FORGE_API_KEY` | NOT REQUIRED for this flow | The investigation implementation invokes LLM server-side; no frontend Forge credential is used. |

## Exact failure path

```text
GET /workspace
  → frontend initializes successfully
  → auth.me query returns null, as expected for anonymous browser
  → private workspace renders login button
  → login handler executes
  → handler reads compiled client values
  → VITE_OAUTH_PORTAL_URL = undefined
  → VITE_APP_ID = undefined
  → constructs new URL("undefined/app-auth")
  → OAuth navigation cannot start
  → no OAuth callback
  → no authenticated session
  → protected canonical.investigations.ask cannot run
  → no database/evidence/LLM/persistence/audit live test possible
```

## What was configured automatically

- The repository already contains the investigation implementation and migration.
- The Railway deployment is serving the implementation commit’s investigation UI/API markers.
- No production secrets were changed.
- No database records were inserted.
- No migration was applied blindly.
- Authentication was not bypassed.

## What was verified successfully

- Actual production URL identified.
- Railway frontend and backend are reachable.
- `/workspace` loads.
- Frontend initializes.
- Anonymous session initialization returns null normally.
- No initial browser console errors.
- Same-origin API routing works.
- Protected investigation route exists and rejects anonymous access correctly.
- New investigation bundle is deployed.
- Local typecheck, full test suite, production build, and diff validation pass.

## What must be configured manually

1. In the Railway service environment, set the correct public Manus OAuth application ID as `VITE_APP_ID`.
2. Set the correct Manus OAuth portal base URL as `VITE_OAUTH_PORTAL_URL`.
3. Ensure the OAuth application allowlists the exact callback URL:

   ```text
   https://citizens-record-production.up.railway.app/api/oauth/callback
   ```

4. Rebuild and redeploy the frontend after setting the `VITE_*` variables. Vite embeds these values at build time; setting them only at runtime is insufficient.
5. Verify server-side `OAUTH_SERVER_URL`, `JWT_SECRET`, and `DATABASE_URL` are present.
6. Verify `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are present for the server-side LLM call.
7. Run the migration safely against the production database:

   ```text
   drizzle/0005_investigations.sql
   ```

8. Confirm the `investigations` table exists and then run one authenticated investigation using existing stored evidence.

## First remaining blocker

**Missing `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` in the production frontend build.** This blocks login and every downstream authenticated step.

## Exact next action

In Railway, configure `VITE_APP_ID` and `VITE_OAUTH_PORTAL_URL` for the production service, confirm the callback allowlist, trigger a new deployment, then reload `/workspace` and verify that clicking “Sign in with Manus OAuth” navigates to the Manus OAuth portal instead of attempting to construct `undefined/app-auth`.

After login works, the next verification request should be:

```text
GET /api/trpc/auth.me
```

with the authenticated browser session, followed by one question submission:

```text
What evidence is currently available in this case?
```

> This is a software deployment report, not legal advice.
