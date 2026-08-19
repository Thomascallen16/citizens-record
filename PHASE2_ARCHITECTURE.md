# CaseCompass Phase 2 Architecture

## Operating Model

CaseCompass remains a **local-first case organization and legal-information research workspace**. Its Phase 2 workflow is centered on a user-owned case workspace, not a legal service. Every record, research item, task, draft, and alert must display its provenance and current verification state. The product records uncertainty rather than resolving it: a user report remains `USER_REPORTED`, an unlocated item remains `SOURCE_UNAVAILABLE` or `POSSIBLY_MISSING`, and a mismatch remains a `POTENTIAL_DISCREPANCY` for review.

> **Safety boundary:** CaseCompass does not represent users, create an attorney-client relationship, authenticate evidence, determine admissibility, recommend a legal strategy, promise an outcome, or file or serve documents. Generated records requests and filing materials are user-generated drafts that require review.

## Local Data Model

| Entity | Purpose | Required provenance controls |
| --- | --- | --- |
| **Case profile** | Local case label, court, verified identifier, jurisdiction, and matter-level notes | Do not infer a case identifier or court from an unverified item |
| **Evidence record** | Source-linked factual item, claim, question, date, or missing-evidence entry | Source, location, record status, confidence, next action, related people/events, authentication and reliability notes |
| **Discovery item** | Expected evidence category and request/review lifecycle | `EXPECTED → REQUESTED → RECEIVED → REVIEWED → POSSIBLY_MISSING`; absence does not imply destruction or withholding |
| **Timeline event** | Exact, approximate, ranged, or conflicting event chronology | Time precision and source status are visible on every event |
| **Research item** | User-defined public-source research lead or result | Publisher, URL, access date, quotation, research summary, linked case question, and `RESEARCH_TOPIC` status |
| **Records request** | Editable, user-generated public-records request draft | Agency, jurisdiction, category list, lifecycle fields, and an unambiguous review-before-sending notice |
| **Filing workspace item** | Source-linked motion, exhibit, notice, correspondence, or memo draft | Each statement either maps to a supporting record/location or is flagged `NO SUPPORTING SOURCE ATTACHED` |
| **Person profile** | User-entered or lawfully obtained public/authorized relationship record | Role, event relationship, sources, questions, and safe-use notice; no private-data collection workflow |
| **Security preference** | Local-only setting, time-out preference, and optional biometric gate | Does not claim that AsyncStorage case content is encrypted at rest |

## Assistant Boundary

The Phase 2 assistant is a **grounded workspace navigator**. Its default local review searches and groups only the user’s stored workspace records, then returns source IDs and labels each point as a verified record, user-provided account, research finding, potential discrepancy, or unresolved question. It must return “No source located in this workspace” instead of supplying an unsupported case fact.

Remote model analysis, document uploads, OCR, court-record access, cloud synchronization, and account-backed sharing are deliberately deferred. Before any of those features are enabled, the product must obtain explicit user confirmation for transmission of selected records, map all data processors, create deletion/export controls, provide clear disclosures, and complete a security and privacy review.

## Application Layers

| Layer | Responsibility | Phase 2 approach |
| --- | --- | --- |
| **Mobile UI** | Case dashboard, evidence review, chronology, task workflows, forms, and controls | Expo Router screens built for one-handed mobile use and responsive web layouts |
| **Local workspace state** | Living case data, state migration, export, deletion, and deterministic assistant lookup | AsyncStorage-backed structured state, with source-safe migration from the original MVP |
| **Optional session gate** | Prevent access to the workspace after app backgrounding when enabled | Device biometric/passcode flow on supported native devices; web does not claim equivalent protection |
| **Server integration** | Future opt-in AI, file storage, and account/sync services | Not used for case contents in Phase 2’s default local-only mode |

## Explicitly Deferred Production Requirements

The present implementation does not claim encrypted document storage, secure cloud backup, formal legal research coverage, authenticated court records, document OCR, full-text comparison of uploaded media, background legal monitoring, attorney review, or electronic filing/service. These require separate implementation, authorization, jurisdiction-specific review, data governance, and in several cases external accounts or paid services.
