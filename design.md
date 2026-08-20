# Pro Se Compass — Mobile Interface Design Plan

## Product Intent and Safety Boundary

Pro Se Compass is a private case-organization and public-information research workspace for people representing themselves in a legal matter. It helps a person collect records, preserve where each item came from, compare accounts, prepare neutral questions, and track missing materials. It must never claim to be a lawyer, provide attorney-client representation, decide disputed facts, promise a legal outcome, or imply that a filing is ready to submit.

The MVP is deliberately **local-first**. Sample records are clearly identified as fictional, and live search, docket retrieval, automatic filing, e-signature, service, legal conclusions, and legal-advice chat are outside the first release. This makes the core evidence workflow reviewable before high-risk integrations are considered.

> **Visible product disclosure:** “Pro Se Compass is an organization and research tool, not a law firm or a substitute for legal advice. Review court rules and consult a qualified attorney or legal aid service before filing or relying on any document.”

## Design Principles

The interface is designed for **portrait 9:16 screens** and one-handed use. Navigation sits at the bottom, primary actions live in the lower thumb zone, and every dense legal concept is translated into plain labels with a short explanatory sentence. The visual language uses restrained cards, generous spacing, familiar iOS-style typography, and clear status colors rather than a visually intimidating “legal dashboard.”

Every statement that enters the workspace is classified and source-linked. `FACT` and `CLAIM` are visibly distinct, while unverified or absent materials stay as `VERIFY`, `SOURCE-UNAVAILABLE`, or `CONFLICTING` rather than being converted into conclusions. A user can always move from a timeline event or task to its source context.

## Screen List and Primary Content

| Screen | Primary content | Primary functions |
| --- | --- | --- |
| **Welcome & Scope** | Plain-language purpose, privacy notice, organization-only disclosure, and local storage explanation | Acknowledge scope and open the workspace |
| **Today** | Case overview, next high-priority action, source-verification progress, recent updates, and a “new record” action | Resume a case, start a guided record entry, review urgent gaps |
| **Evidence Matrix** | Filterable record list with neutral questions, source labels, confidence/state tags, potential limiting material, and next actions | Filter by status/category, inspect a record, create a source-linked entry |
| **Record Detail** | Statement, category, source, location, date, people, confidence, passage, status, supporting and limiting paths | Review provenance, update verification status, open related records |
| **Timeline** | Chronological event cards grouped by date and marked with source / claim / unresolved indicators | Scan sequence, open event detail, identify date conflicts |
| **Discovery Queue** | Missing-material cards with custodian, request/production history, priority, and handling note | Add or complete an acquisition task, view associated evidence question |
| **Research Notebook** | Neutral research prompts, jurisdiction field, source-of-law placeholder, and confirmation state | Capture a research topic without treating it as verified authority |
| **New Record Sheet** | Guided form for record type, statement/question, source details, date, people, and verification status | Save a source-linked record locally; prevent ambiguous or unsourced assertions |
| **Case Settings & Export** | Case identity fields, privacy controls, explanation of export limits, and a clear review-before-filing notice | Edit locally stored matter information and preview an organization-only export concept |

## Key User Flows

### First-use flow

The user opens Pro Se Compass and sees the scope disclosure before any substantive tool. After acknowledging it, the user arrives at **Today**, where a brief “Start with the record” prompt explains that a source can be a court record, a user-reported account, a research lead, or an item that still must be obtained. The user then selects **New record** and adds a neutral statement or question instead of a conclusion.

### Source-traceable evidence flow

The user taps **New record** from Today or Evidence Matrix. They choose a category such as `SOURCE`, `CLAIM`, `QUESTION`, `DATE`, or `MISSING EVIDENCE`; provide source name and location; select a verification state; and save. The matrix immediately displays a tag showing whether the material is a primary record, user-reported lead, verification task, conflict, or unavailable source. Selecting the card opens **Record Detail**, where provenance and related next actions remain visible.

### Timeline and contradiction-review flow

The user opens **Timeline** to inspect events in chronological order. Tapping an event opens its record detail, preserving the source and confidence status. If dates or identity details differ, the event is flagged `CONFLICTING` and the user is guided to create a source-comparison task rather than choose an account automatically.

### Discovery-gap flow

From **Discovery Queue**, the user reads a missing-material entry, including what original record is needed and which neutral question it could resolve. They can update the task state to requested, received, or needs-review. The app does not infer that an unproduced item was destroyed, withheld, favorable, or unfavorable.

### Research-notebook flow

The user saves an issue as a research question, specifies the jurisdiction if known, and records the primary authority or source link once independently verified. The app renders it as a research topic, never as established legal authority, and tells the user to confirm current law and court rules before relying on it.

## Navigation and Interaction Model

The main navigation uses four bottom tabs: **Today**, **Evidence**, **Timeline**, and **Queue**. Research is available from the Today dashboard and an action tile rather than competing with the core case loop. The prominent “+ Add record” action is located in the bottom thumb zone of the Today and Evidence screens. Destructive actions are intentionally absent from the MVP; editing uses explicit save/cancel patterns and source status is not changed silently.

| Interaction | Design choice | Rationale |
| --- | --- | --- |
| Primary entry point | Full-width, high-contrast “Add a record” button | Keeps the first useful action obvious and reachable |
| Evidence state | Text label plus color and icon | Does not rely on color alone; supports accessibility |
| Dense text | Two-line card summary with an expandable detail view | Preserves scanability without hiding provenance |
| Uncertainty | High-visibility `VERIFY`, `CONFLICTING`, and `SOURCE-UNAVAILABLE` tags | Prevents user-reported material from appearing settled |
| Legal boundary | Persistent small banner on key workspaces; full disclosure at onboarding and export | Keeps the organization-only role clear without blocking ordinary use |

## Color Choices

Pro Se Compass uses a calm, document-oriented palette that feels trustworthy without mimicking a court seal or law firm. The deep slate primary and warm paper background keep long-form reading comfortable; status colors are reserved for provenance and task states.

| Token | Hex value | Use |
| --- | --- | --- |
| **Ink Navy** | `#16324F` | Main brand color, primary actions, active navigation |
| **Paper** | `#F7F4EE` | Primary background, reduced glare for document review |
| **Card White** | `#FFFFFF` | Elevated records and forms |
| **Charcoal** | `#1F2933` | Primary text and high-contrast headings |
| **Slate** | `#667085` | Secondary text and metadata |
| **Verified Teal** | `#127A6A` | Primary-record and completed states |
| **Review Gold** | `#A25B00` | `VERIFY` and research-topic states |
| **Conflict Red** | `#B42318` | `CONFLICTING` and critical gaps |
| **Soft Blue** | `#E8F0F7` | Informational banners and source-link callouts |

## Accessibility and Privacy Requirements

Text must meet comfortable mobile sizes, labels must be explicit rather than icon-only, and contrast must remain legible in light and dark modes. Records should be persisted on the device for the MVP, with a future privacy review required before any account, sync, AI-processing, or external-search feature is introduced. The application should tell users to redact unnecessary personal identifiers before sharing or exporting records.

## Deferred Production Capabilities

The following capabilities need separate privacy, security, jurisdiction, content-policy, and technical design work before implementation: encrypted cross-device sync, account access controls, document uploading and OCR, live public-record research, verified legal-authority retrieval, AI-assisted summarization, collaboration, drafting tools, court-specific templates, reminders, push notifications, and store-ready privacy disclosures. Any live research must honor authorized access and platform terms; any AI draft must preserve source links, source limitations, and an unambiguous review-before-filing warning.
