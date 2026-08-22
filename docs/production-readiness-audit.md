# Citizens’ Record / ProofFlow Production-Readiness Audit

**Audit date:** August 22, 2026  
**Scope:** Non-destructive review of the explicitly selected repository, `Thomascallen16/citizens-record`, its `main` branch at `b51e91f`, and the documented public Citizens’ Record deployment.

## Executive Finding

The repository selected for this task is already a **full-stack, authenticated, database-backed private evidence workspace**. It is materially more advanced than the localStorage-only static Record Builder described in the project deployment guide. It persists user-owned cases, sources, evidence rows, chronology events, acquisition items, subscription entitlements, and motion drafts in MySQL/TiDB through Drizzle; it also uses Manus OAuth and server-enforced ownership checks.

However, the documented live public URL, `https://citizensrc-bjbhhbxb.manus.space`, is a **different static civic-library project**. The shared deployment guide identifies its source as `Thomascallen16/The-Citizens-Record`, whereas the explicitly selected repository is `Thomascallen16/citizens-record`. The public URL does not display the authenticated ProofFlow-style workspace. There is therefore no safe basis to deploy the selected application to that URL or treat it as the existing deployment without your confirmation.

> No application files, database records, deployment settings, secrets, or live services were modified during this audit.

## Source of Truth and Deployment Status

| Item | Finding | Implication |
|---|---|---|
| Selected repository | `https://github.com/Thomascallen16/citizens-record` | This is the repository cloned and audited. Its default branch is `main`. |
| Current codebase | React, Vite, Express, tRPC, Drizzle, MySQL/TiDB, Manus OAuth, Stripe integration, Manus storage helper | It supports an in-place production hardening path; no replacement project is needed. |
| Current public civic URL | `https://citizensrc-bjbhhbxb.manus.space` | It serves the older static civic-library interface, not the selected authenticated workspace. |
| Static-site source named in shared guide | `Thomascallen16/The-Citizens-Record` | This is distinct from the selected repository. |
| Deployment configuration in selected repository | No GitHub Pages site, no visible GitHub Actions deployment workflow, no homepage URL, and deployment API access was unavailable | The active deployment target for the selected full-stack workspace cannot be verified from repository metadata. |
| Repository visibility | Public | The source code is public. This does not itself expose database contents, but source/configuration hygiene must remain strict. |

## What Already Exists and Should Be Preserved

| Capability | Existing implementation | Readiness assessment |
|---|---|---|
| Authentication | Manus OAuth with a secure, HTTP-only session flow | Implemented and appropriate for a private workspace. |
| Authorization | Protected tRPC procedures; each case-linked read/write is scoped by authenticated user ID; paid drafting separately checks server-side entitlement | Strong baseline user isolation. |
| Persistent storage | Drizzle schema and migrations for users, legal cases, sources, evidence rows, chronology events, acquisition queue, subscriptions, and motion drafts | Core workspace data is already server-persisted, not browser-only. |
| Evidence workflow | User can create a case, add source records, evidence rows, chronology events, and missing-record queue items | Functional verification-first core loop. |
| Exports | Server-generated case-bundle CSV and Markdown; client-side downloads | Present, with provenance/disclaimer framing. |
| Drafting safeguards | Server-enforced subscription entitlement; case ownership checks; selected-row-only drafting; source table, warnings, adverse material, and visible review-before-filing label | Good control foundation; remains organization/research software rather than filing automation. |
| File infrastructure | S3-compatible storage helper is included | Infrastructure exists, but the application does not currently attach files to domain records. |
| Baseline validation | Type check passed; 5 test files passed; 1 Stripe-price test was intentionally skipped; production build passed | Baseline is buildable, with analytics-token and bundle-size warnings noted below. |

## Material Gaps Before Broad Production Use

| Domain | Current gap | Recommended implementation direction |
|---|---|---|
| Source files and evidence items | No normalized attachment/evidence-item model, file metadata, upload workflow, content restrictions, or object-level access policy | Add `evidence_items`/`attachments` metadata tables, server-authorized upload initiation, owner-scoped signed downloads, permitted file-type/size rules, and clear processing status. Store object references, not file bytes, in the database. |
| Excerpts and citations | Sources are linked to matrix rows through free-text source IDs. There is no normalized excerpt, pinpoint citation, source-to-evidence join, or reusable citation entity. | Add `source_excerpts`, `citations`, and join tables so claims can point to a source, page/line/timestamp, quoted passage, and verification status. Preserve user-entered material as attributed rather than established fact. |
| Timeline integrity | Chronology events use a free-text source-ID field. | Replace or augment it with event-to-source citations, optional precision/range fields, and explicit conflicts. |
| Revisions and audit trail | `updatedAt` is present, but no immutable history records who changed what, when, or why. Deletes are permanent. | Add append-only revision/audit events and soft deletion. Provide a recovery path instead of irreversible user deletion. |
| Controlled sharing | The application has private user isolation only; it has no invited collaborators, public sharing, permission levels, revocation, or publication boundary. | Add an explicit workspace/case-sharing model with default-private records, time-bounded invitation tokens or designated collaborators, roles, revocation, and a separate reviewed publication entity. Do not expose private source URLs or documents through public records. |
| Privacy and sensitive data | The UI includes a legal disclaimer but lacks a dedicated privacy notice, sensitive-data warning/acknowledgement, takedown/correction intake, retention/deletion policy, or moderation workflow. | Add clear notices and safety confirmations at intake; block or warn against minors’ data, health data, account secrets, identifiers, and privileged material; add correction/takedown/contact records; document escalation and retention decisions. |
| Analytics | A passive Umami script placeholder exists, but configured variables were missing at build time and no product events are emitted. | Add server-side or first-party event capture for `start_record`, `record_created`, `source_attached`, `record_activated`, and `return`, with consent-aware aggregation and no sensitive case content in analytics payloads. |
| Deployment verification | The selected app’s live deployment is unknown; the known public URL belongs to a different site. | Confirm the exact Manus WebDev project/deployment that corresponds to this repository before publishing. Use that project only. |
| Client performance | Production build warns of a JavaScript chunk slightly exceeding the default warning threshold. | Address after core privacy/readiness work, using route-level code splitting or focused dependency review without changing functional behavior. |

## Proposed Data Model Evolution

The recommended evolution is additive and migration-based. It retains `legal_cases`, `source_records`, `evidence_rows`, and `chronology_events` so existing data and features remain intact.

| New or extended entity | Purpose | Privacy/control boundary |
|---|---|---|
| `case_members` | Owner and invited collaborator roles for a case | Every query resolves membership on the server; owner remains sole default member. |
| `evidence_items` | A normalized document, photograph, communication, or other material connected to a case | Owner/case scoped; object key and metadata only; no public URL by default. |
| `source_excerpts` | Exact passages with page, line, or media timestamp | Linked to an owned source or evidence item; retains the quoted material’s provenance. |
| `citations` | Reusable pinpoint reference for a proposition, event, or draft | Supports many-to-many relationships without free-text joins. |
| `timeline_event_citations` | Sources/excerpts supporting or limiting a timeline event | Maintains the difference between support, limitation, conflict, and unresolved question. |
| `revision_events` | Append-only change history and restoration metadata | Records actor, entity, action, summary, timestamp, and before/after metadata appropriate for auditing. |
| `share_links` or `case_invitations` | Controlled collaboration or reviewed sharing | Defaults off; uses role, expiry, revocation, and least privilege. |
| `privacy_requests` | Correction, takedown, deletion, and privacy review queue | Restricted to owner/admin handling and does not make underlying records public. |
| `analytics_events` | Minimal product funnel measurement | Contains event category and non-sensitive identifiers/aggregation fields, never source text or case details. |

## Security and Privacy Posture

The existing ownership controls are a strong foundation, but production readiness requires preserving them at every new boundary. File retrieval must be authorized by case membership before a signed download URL is generated. Private records must never become publicly accessible merely because an object key or client route is guessed. Public publication should be a separate, deliberate, reviewed copy with sensitive fields removed and source disclosure rules enforced.

The existing motion-drafting framing should remain unchanged: it is source-linked organizational output that requires review and must not claim to automate filing, legal advice, legal conclusions, or service. New privacy language should direct users not to upload unnecessary personally identifying data, minors’ information, financial credentials, medical records, privileged communications, or material they lack authority to share.

## Approval Required Before Implementation or Deployment

Only the following decisions block safe continuation. All other work can proceed in the existing repository after these are answered.

| Decision | Why approval is required | Recommended default |
|---|---|---|
| **Which project is in scope?** | The selected full-stack repository and the documented live static site are different codebases and deployments. Applying this work to the static site would be a different architecture and could disrupt its live experience. | Proceed in `Thomascallen16/citizens-record` only, because it is the explicitly selected repository and already has the appropriate full-stack foundation. |
| **Which existing deployment owns this repository?** | The active live target cannot be confirmed from GitHub metadata; publishing to the static civic URL would be unsafe. | Provide or attach the existing Manus WebDev project that is linked to `Thomascallen16/citizens-record`; I will deploy through it only. |
| **Collaboration policy** | Inviting collaborators and sharing case evidence changes who can access sensitive private material. | Keep v1 **owner-only and private**. Add the database foundation for future collaboration, but do not enable sharing links or invitations. |
| **File-upload policy** | Evidence files can contain highly sensitive or privileged data. | Implement metadata and ownership boundaries now; enable uploads only for a narrow allowlist after explicit size, retention, malware-scanning, and legal/privilege policy decisions are confirmed. |
| **Data-retention/deletion policy** | Hard deletion, recovery windows, retention periods, and takedown handling are operational/legal choices. | Use soft deletion and a documented manual privacy-request workflow; do not promise a fixed retention period absent your policy. |
| **Analytics processor/consent configuration** | The code needs a real collection endpoint or first-party data destination and an agreed privacy notice. | Add privacy-safe event contracts and UI hooks now; activate external analytics only after endpoint and consent configuration are supplied. |

## Baseline Verification

The existing project passed `pnpm check`, `pnpm test`, and `pnpm build`. The test suite reports five passing test files and one intentionally skipped Stripe-price test. The production build reports missing analytics template variables for the passive Umami tag and a slightly oversized JavaScript chunk. Neither prevented the build, but both should be resolved before considering a production analytics rollout complete.

## Recommended Next Step

Confirm that the implementation should proceed in **`Thomascallen16/citizens-record`** and attach or identify the **existing Manus WebDev deployment/project** that owns it. With the default owner-only/private scope, I can then add the additive data-model foundations, privacy/takedown controls, audit history, corrected analytics contract, low-risk sample record, automated tests, and a committed change set—without publishing anything to the unrelated static civic-library deployment.
