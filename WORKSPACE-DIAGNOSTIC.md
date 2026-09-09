# ProofFlow Workspace Functional Diagnostic

**Repository:** `Thomascallen16/citizens-record`  
**Branch audited:** `main`  
**Audit date:** September 9, 2026  
**Scope:** `/workspace` entry, frontend bootstrap, auth/session, API, database, prompt/evidence path, browser console, deployment evidence, and source-level verification.

## Executive finding

The deployed URL that could be identified from the repository documentation is **not the full-stack workspace**. `https://citizensrc-bjbhhbxb.manus.space/workspace` is a separate static publication and returns a real 404 page. The full-stack repository explicitly records its production URL as **UNVERIFIED**.

The repository itself also had a deterministic routing defect: `client/src/App.tsx` registered `/record` but did not register `/workspace`. Therefore a request to `/workspace` rendered the fallback `NotFound` component even when the correct full-stack server was running. This was the first source-level failure and has been fixed by adding `/workspace` as an alias of the existing `RecordWorkspace` component.

The requested `USER → LOGIN → WORKSPACE → QUESTION/PROMPT → SUBMIT → BACKEND → EVIDENCE/SEARCH ENGINE → RESULT` path does **not exist** in the current architecture after the route is corrected. The current workspace is a protected record/evidence CRUD editor. There is no prompt input in `RecordWorkspace`, no submit handler for a question, no `workspace.ask`/search procedure in `server/routers.ts` or `server/canonicalRecord.ts`, and no evidence-search engine call. The built-in LLM helper exists, but nothing in the workspace invokes it. Consequently, there is no downstream request that can be traced to an AI/evidence result; the flow becomes a no-op because the feature is absent, not because a hidden handler is failing.

## Trace results

| Step | Result | Evidence |
|---|---|---|
| Open `/workspace` | **Failed before fix** | `App.tsx` had no `/workspace` route. The live known URL returned a 404 page. |
| Frontend initialization | **Source healthy** | `client/src/main.tsx` creates the React root and tRPC provider; `pnpm check` and `pnpm build` pass. |
| Authentication/session initialization | **Implemented in source, unverified live** | `main.tsx` uses `auth.me` through the tRPC client indirectly and redirects unauthorized tRPC errors to `startLogin()`. Server context calls `sdk.authenticateRequest()`. Live OAuth/session variables and cookies could not be verified because the full-stack production URL is unknown. |
| Backend/API connection | **Correct in source, unverified live** | Client uses same-origin `/api/trpc` with `credentials: include`; Express mounts tRPC at `/api/trpc`. No production host was available to exercise it. |
| Main prompt/search input | **Absent** | No prompt/question input or submit handler exists in the active `RecordWorkspace` implementation. `AIChatBox` is only a reusable component; it is not mounted by the workspace and has no connected mutation. |
| Backend/AI/evidence pipeline | **Absent for questions** | No router procedure accepts a question and no procedure calls `invokeLLM` or a search provider. Existing procedures create/list cases, sources, evidence, chronology, claims, findings, and unknowns. |
| Exact failure point | **Route first; feature contract second** | `/workspace` fell into `NotFound`. After aliasing it to `RecordWorkspace`, a user still cannot submit a question because no such UI or backend contract exists. |
| Browser/client console | **No console errors on observed static deployment** | Console was empty while opening the known static URL; this does not validate the unverified full-stack runtime. |
| Server/runtime/deployment logs | **Not available for the full-stack service** | GitHub shows CI workflows, but no authoritative deployment workflow or verified public full-stack URL is present in the repository. |
| Environment/API configuration | **Cannot be verified for production** | Local diagnostic shell had all required runtime variables unset. The repository documents their names only. |
| Authentication configuration | **Cannot be verified for production** | OAuth code and session cookie code exist, but `OAUTH_SERVER_URL`, `VITE_APP_ID`, and `JWT_SECRET` values are not exposed to source inspection. |
| CORS/origin | **No explicit global CORS middleware** | Same-origin `/api/trpc` is the intended architecture. MCP has its own origin policy. The full-stack host/origin could not be verified. |
| Database | **Lazy dependency, unverified live** | `getDb()` only initializes when `DATABASE_URL` is present; protected CRUD operations throw `Database unavailable` when it is not. No live database connection or migration state could be tested. |
| Production API target | **Correct only if served same-origin** | Client hardcodes relative `/api/trpc`, not localhost. The problem is deployment identity/routing, not a localhost API URL in the client. |

## ROOT CAUSE

1. **Wrong deployed application/URL:** the only discoverable public URL is a separate static site, not this full-stack repository. `/workspace` on that site is a 404.
2. **Missing `/workspace` route:** the full-stack source registered `/record` but not `/workspace`, so the requested entry point was guaranteed to render `NotFound`.
3. **Missing feature implementation:** no question/prompt-to-search/AI/evidence result flow exists in the current source. The workspace architecture is record CRUD, not a prompt-driven research workspace.

## SECONDARY FAILURES

- Production ownership and URL are not recorded or verifiable.
- Production environment variables, OAuth provider configuration, session secret, database reachability, and migration state are not verifiable.
- There is no deployment workflow in `.github/workflows`; CI validates code but does not publish it.
- The public `system.health` procedure is not dependency health; it does not test database, OAuth, storage, or LLM connectivity.
- The local `.env.example` omits some frontend-safe documented variables such as `VITE_OAUTH_PORTAL_URL` and `VITE_FRONTEND_FORGE_API_URL`, although the current client does not directly use them for tRPC.

## BROKEN FILES/COMPONENTS

| File | Finding |
|---|---|
| `client/src/App.tsx` | Missing `/workspace` route. **Fixed in this pass.** |
| `client/src/pages/RecordWorkspace.tsx` | Existing protected CRUD editor; contains no question input, search handler, AI mutation, or result display. |
| `server/routers.ts` | Has auth, cases, evidence, chronology, billing, and export procedures; has no question/search/AI procedure. |
| `server/canonicalRecord.ts` | Has canonical source/claim/finding/unknown CRUD; has no question/search/AI procedure. |
| `client/src/components/AIChatBox.tsx` | Reusable UI only; not mounted in the workspace and not connected to a real backend mutation. |
| `.github/workflows/*.yml` | CI/security only; no authoritative deployment workflow. |
| `docs/DEPLOYMENT.md` | Correctly says the full-stack URL is unverified, which is the operational blocker. |

## MISSING ENVIRONMENT VARIABLES

The following were **missing in the diagnostic shell**; production values remain unknown and must be checked in the actual deployment service without exposing secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `VITE_APP_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

For a production deployment, also verify the variables used by optional features:

- `OWNER_OPEN_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MOTION_DRAFTING_PRICE_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_OAUTH_PORTAL_URL` if the login portal is supplied separately

## BROKEN API ROUTES

- `/workspace`: missing in source before this pass; now aliased to the existing `RecordWorkspace`.
- `/api/trpc`: correctly mounted in source, but live availability is unverified because the full-stack deployment URL is unknown.
- **No question API route exists.** There is no route/procedure to submit a prompt, run search, invoke AI, or return evidence-backed results.

## BROKEN AUTH FLOW

The source auth flow is structurally present:

1. OAuth callback: `/api/oauth/callback`.
2. Session cookie: created by `sdk.createSessionToken` and set by the callback.
3. API context: `sdk.authenticateRequest` reads the cookie or preview Bearer token.
4. Protected procedures: reject missing users.

The live flow cannot be certified because the correct production host and runtime environment are not identified. In particular, verify the OAuth callback allowlist, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `JWT_SECRET`, HTTPS forwarding headers, and `SameSite=None; Secure` cookie behavior on the actual full-stack host.

## BROKEN UI HANDLERS

- The requested main prompt/search input is not present.
- No prompt submit event exists.
- No tRPC mutation for question submission exists.
- No result state or result renderer exists for an AI/evidence answer.
- The existing record forms do have real tRPC handlers for CRUD operations, subject to auth and database availability.

## DEPLOYMENT CONFIGURATION PROBLEMS

1. The deployed URL is ambiguous: the known `manus.space` URL is the static publication, not the full-stack app.
2. No authoritative deployment workflow is present in GitHub Actions.
3. No runtime log source or service ownership is recorded in the repository.
4. The full-stack service must be configured with the required environment variables and current migrations.
5. The deployed service must expose the same-origin frontend and `/api/trpc`; a static-only host cannot serve the protected workspace.

## FIXES APPLIED

- Added `/workspace` to `client/src/App.tsx` as an alias of the existing `RecordWorkspace`, preserving the existing UI and architecture.

## EXACT FIXES REQUIRED TO COMPLETE THE REQUESTED FLOW

The route alias alone does not create the missing prompt pipeline. To complete the requested end-to-end behavior without replacing the existing architecture:

1. **Deployment identity:** identify the Railway/full-stack service and record its canonical HTTPS URL. Deploy the current `main` build there; do not point users at the static `citizensrc-bjbhhbxb.manus.space` site.
2. **Runtime configuration:** set and verify `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`; run/apply all Drizzle migrations.
3. **Question contract:** add a protected tRPC procedure, for example `workspace.ask`, accepting a bounded question and optional case ID/source constraints.
4. **Evidence/search adapter:** implement the repository’s intended provider-neutral search/read seam (`server/agent/toolContract.ts` / MCP adapter) or connect an approved search provider. Do not claim an answer is evidence-backed until sources are actually returned.
5. **AI synthesis:** call the existing server-side `invokeLLM` helper with the retrieved source material and require structured output containing answer, source citations, uncertainty, and unknowns.
6. **UI wiring:** add the prompt input and submit mutation to the existing workspace surface without changing its visual system; render loading, error, source, result, and unknown states.
7. **End-to-end verification:** use a non-sensitive test account and sample question; capture browser console, network request, server logs, database query result, source retrieval, AI response, and rendered result.

## Verification after the applied fix

- `pnpm install --frozen-lockfile`: passed.
- `pnpm check`: passed.
- `pnpm test`: passed — 11 test files, 23 tests passed, 1 intentionally skipped.
- `pnpm build`: passed.
- Static deployment observation: `/workspace` returned 404 because it is not the full-stack application.
- Source route correction: `/workspace` now resolves to `RecordWorkspace` in `App.tsx`.

## What remains broken

The deployed full-stack URL, live auth/session, live database, live API, server logs, and production environment cannot be verified from the available evidence. More importantly, the prompt/search/evidence/AI feature requested by the user is not implemented anywhere in the current repository. The smallest honest fix applied is the missing route alias; completing the remaining flow requires implementing the explicit question/search/AI contract and configuring the actual full-stack deployment.

No UI redesign or architectural replacement was performed.

## Evidence inspected

- `client/src/App.tsx`
- `client/src/main.tsx`
- `client/src/pages/RecordWorkspace.tsx`
- `client/src/components/AIChatBox.tsx`
- `server/routers.ts`
- `server/canonicalRecord.ts`
- `server/_core/index.ts`
- `server/_core/context.ts`
- `server/_core/oauth.ts`
- `server/_core/cookies.ts`
- `server/_core/llm.ts`
- `server/db.ts`
- `.env.example`
- `docs/DEPLOYMENT.md`
- `docs/SECURITY.md`
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/agent-security.yml`

All conclusions distinguish verified source facts from production facts that remain unavailable.

> This diagnostic is a software/deployment assessment, not legal advice.
