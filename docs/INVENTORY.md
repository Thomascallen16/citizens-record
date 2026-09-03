# Forensic Project Inventory

**Audit date:** September 3, 2026  
**Scope:** GitHub repositories, current `main` source, application configuration, documented deployments, CI, database/auth/storage code, and existing project documentation. No feature implementation or deployment was performed in this pass.

## Canonical inventory

| Asset | Location | What exists | Current condition | Classification | Evidence for conclusion | Recommended action |
|---|---|---|---|---|---|---|
| Full-stack application | `Thomascallen16/citizens-record` | React/Vite client, Express, tRPC, Drizzle/MySQL, auth, workspace UI, exports, privacy controls | Substantial and build-oriented; not independently built in this audit environment | KEEP | `package.json`, `client/src`, `server`, `drizzle`, CI | Canonical full-stack source |
| Public civic portal | `Thomascallen16/The-Citizens-Record` | Separate static/public site | Useful public-facing material; separate architecture | KEEP | Repository README and prior project audit identify it as the permanent civic portal | Keep public and separate; extract useful content later |
| ProofFlow repository | `Thomascallen16/ProofFlow` | Recovery/bootstrap evidence/provenance concept and source | Not the complete canonical deployable app | EXTRACT | Existing repository documentation describes it as recovery/bootstrap rather than complete production source | Preserve useful provenance concepts inside canonical app; do not treat as product |
| Watchtower repository | `Thomascallen16/watchtower` | Privacy/exposure intelligence MVP source | Separate prototype/integration surface; provider connections and long-running sync are not fully operational | EXTRACT | Existing README/audit describe deterministic risk engine and integration-ready workflows | Preserve as a module concept; defer broad monitoring |
| MetaGraph | Current ecosystem concept / scattered graph work | Relationship/graph concept | No verified standalone canonical implementation in this audit | REBUILD | No canonical normalized graph model identified in current schema | Implement later on shared Entity/Relationship model |
| Chronicle | Current app `chronology_events` | Timeline/chronology implementation | Real database-backed chronology foundation, but source linkage is currently free-text | EXTRACT | `drizzle/schema.ts`, `server/routers.ts` | Evolve into canonical TimelineEvent model later |
| Record Builder | Current `citizens-record` case/source/evidence UI | Case and evidence construction workflow | Real authenticated UI, not merely localStorage | EXTRACT | `Home.tsx` uses protected tRPC queries/mutations | Preserve workflow; normalize future record model |
| Pro Se Compass | Historical/current concept | Legal-research/navigation concept | No verified standalone canonical implementation in current app | EXTRACT | Existing project references and prior repo history | Treat as module; no legal-advice automation |
| Historical source archive | `Thomascallen16/The-Citizen-Main-File` | Historical static source/content archive | Not production application | ARCHIVE | Existing repository role documentation | Preserve for reference; do not develop as product |
| Ecosystem documentation | `Thomascallen16/docs` | Mintlify documentation source | Separate documentation repository | EXTRACT | Existing repository README/role | Extract authoritative docs into canonical docs as needed; avoid conflicting sources of truth |
| Open-the-Record | `Thomascallen16/Open-the-Record` | Previously used consolidation target/foundation | Now private, but not the selected canonical full-stack source under this pass | REJECT | User's current objective explicitly designates `citizens-record` as canonical | Do not migrate or redesign here; preserve until disposition is explicitly decided |
| `fear-the-wolves` | `Thomascallen16/fear-the-wolves` | Separate project | Unrelated to canonical civic-record architecture | REJECT | Repository is distinct and not part of requested product structure | Leave untouched |

## Application structure

| Asset | Location | What exists | Current condition | Classification | Evidence for conclusion | Recommended action |
|---|---|---|---|---|---|---|
| React client | `client/src` | Pages, components, hooks, tRPC client, UI primitives | Real source | KEEP | `client/src/App.tsx`, `Home.tsx` | Keep |
| Express server | `server/_core/index.ts` | Express HTTP server, tRPC adapter, middleware, Stripe webhook route | Real source | KEEP | Server entry and package scripts | Keep |
| tRPC API | `server/routers.ts` | Protected/public procedures for cases, sources, evidence, chronology, privacy, exports, drafts, analytics | Real source | KEEP | `server/routers.ts` | Keep; future canonical entities should use same authorization pattern |
| Authentication | `server/_core/sdk.ts`, `context.ts`, `trpc.ts` | Manus OAuth integration, signed JWT session cookie, protected/admin procedures | Real implementation in code; external OAuth configuration unverified in this environment | KEEP | `authenticateRequest`, `verifySession`, `protectedProcedure`, `adminProcedure` | Verify runtime configuration before production use |
| Authorization/ownership | `server/ownership.ts`, router/db queries | User/case scoping and ownership guards | Strong baseline but future object types need the same enforcement | KEEP | `requireOwnedRecord`; user/case scoped queries | Preserve and extend only through server-side checks |
| Database | `drizzle/schema.ts`, `server/db.ts` | MySQL/TiDB schema and query layer | Real code; live connection not independently exercised here | KEEP | Drizzle schema and `DATABASE_URL` connection code | Verify live DB before claiming runtime readiness |
| Migrations | `drizzle/0000*` through `0003_living_pride.sql`, metadata journal | Four tracked MySQL migrations | Real migration history | KEEP | `drizzle/meta/_journal.json` | Apply only in controlled environment during implementation phase |
| File storage helper | `server/storage.ts` | Forge presigned PUT/GET helpers targeting S3 | Infrastructure is real in code; domain upload workflow is intentionally not enabled | EXTRACT | Storage helper plus evidence-item `REFERENCE_ONLY` state | Keep helper isolated; do not enable broad uploads yet |
| Evidence metadata | `evidence_items` | Document/image/audio/video/communication metadata with storage fields | Real schema; current v1 route explicitly creates reference-only metadata, not file bytes | KEEP | Schema comments and `createReference` procedure | Keep until upload policy is approved |
| Excerpts/citations | `source_excerpts`, `citations` | Source-linked excerpts and reusable citations | Real additive foundation | KEEP | Schema/router | Preserve and map to future Evidence/Source model |
| Audit/revision history | `revision_events` | Append-style revision records | Real schema and logging functions | KEEP | `server/db.ts`, migration journal | Preserve; future canonical AuditEvent should unify this |
| Privacy controls | `privacy_requests`, workspace policy UI | Notice acknowledgement and correction/access/takedown/deletion intake | Real code foundation | KEEP | `workspacePolicies.ts`, router, `PrivacySafetyPanel` | Preserve; review policy before public launch |
| Exports | `server/caseExports.ts` | CSV/Markdown case bundle | Real server-generated output | EXTRACT | Existing tests and router | Preserve as export surface; ensure canonical provenance model |
| Motion drafting | `server/legalDraft.ts`, `motion` router | Source-linked draft generation behind entitlement | Real code but outside core MVP | EXTRACT | Server entitlement and source review safeguards | Defer from initial canonical MVP |
| Payments | Stripe integration | Customer/subscription/checkout/portal code | Real integration code; external credentials/runtime not verified | DEFER/EXTRACT | `package.json`, router, entitlement code | Keep isolated; do not make payments part of MVP |
| Analytics | `analytics_events` | Owner-scoped first-party event records | Real code foundation | EXTRACT | Router/db event contract | Keep privacy-safe; external analytics is not required |

## UI: real vs presentation shell

**Real authenticated UI:** the root `Home` page switches from an unauthenticated login screen to a workspace after `useAuth()` reports a user. It queries and mutates cases, sources, evidence, chronology, acquisition items, entitlements, privacy/safety state, exports, and audit/revision data through tRPC. This is not a static mock dashboard.

**Real public UI:** `/civic-voices` is intentionally public and is documented as not retrieving or exposing case data. `/script-studio` is documented as a local/browser-only public utility.

**Presentation/branding shell:** labels such as “verification-first workspace” and visual badges are presentation. They are not evidence that an external service, database, deployment, or monitoring system is healthy.

**Hard-coded operational-status risk:** the current `system.health` tRPC procedure returns `{ ok: true }` from a public procedure without testing the database, storage, OAuth provider, or other dependencies. It is therefore only an application-process health response and must not be interpreted as full system health.

No verified current UI source was found that should be treated as proof of external deployment health merely because it displays a status badge.

## Current canonical evidence vocabulary mismatch

The database currently uses `PRIMARY-RECORD`, `USER-REPORTED`, `VERIFY`, `SOURCE-UNAVAILABLE`, and `CONFLICTING` as confidence statuses. The requested canonical model uses `FACT`, `AUTHORITY`, `CLAIM`, `INFERENCE`, `CONTRADICTION`, `QUESTION`, and `UNKNOWN`. This is a structural mismatch requiring a deliberate future mapping; no automatic equivalence is assumed.

## Git/configuration

- Default branch: `main`.
- Known branches: `main`, `pro-se-compass-release-prep`, `security/agent-supply-chain-hardening`.
- Repository clone/remote URL: `https://github.com/Thomascallen16/citizens-record.git` (GitHub repository metadata).
- Package manager: pnpm 10; lockfile present and lockfile version 9.
- `.gitignore`: excludes `.env`, local environment files, dependencies, build output, logs, database files, and other common generated files.
- `.env.example`: present and contains variable names only; no values were disclosed in this inventory.

## Deployment evidence

The latest GitHub commit has a successful external status named `lovely-flexibility - citizens-record` targeting a Railway project/service. That is evidence of a linked Railway status check, not sufficient evidence of a publicly reachable application URL or successful runtime workflow. The existing project audit also records the known `citizensrc-bjbhhbxb.manus.space` URL as belonging to the separate static civic site, not this full-stack repository. Therefore the full-stack deployment URL remains **unverified**.

## Security inventory

Automated secret scanning is present via a pinned Gitleaks action. CI actions are pinned to immutable commit SHAs. An agent-facing security policy and deterministic audit script are present. No actual secret values are reproduced here.

The highest-risk unresolved areas are: the canonical full-stack repository is still public; external runtime secrets/configuration cannot be verified from source; the storage helper can generate signed object URLs but domain-level upload authorization is not a complete active workflow; and `system.health` is too weak to represent dependency health.
