# Pro Se Compass Phase 2 Release-Readiness Checklist

## Current Release Position

Pro Se Compass Phase 2 is a **local-first case organization and legal-information research workspace**. The current build adds evidence metadata, a reconstruction timeline, discovery lifecycle tracking, source-controlled research entries, editable public-records request drafts, source-linked filing-workspace drafts, people profiles, a local workspace-review assistant, clipboard export, local clearing, and optional native-device re-authentication.

> **Not ready for public marketplace submission:** The app is not yet equipped for real document uploads, encrypted structured case storage, cloud backup, formal legal research coverage, remote AI analysis, court integration, electronic filing, payment/subscription management, or an independently reviewed privacy/security program.

## Release Gate Checklist

| Gate | Current Phase 2 state | Required before App Store / Google Play release |
| --- | --- | --- |
| **Privacy policy** | In-app local-only explanation and export/clear controls are present | Publish a public privacy-policy URL stating data practices, retention, export/deletion behavior, support contact, and changes by platform/region |
| **Terms of use** | Organization-only boundary is visible in app | Publish terms that clearly disclaim legal representation, outcome guarantees, and court-filing capability; obtain legal review for jurisdictions and marketing claims |
| **Data mapping** | Case content is designed to remain local by default | Inventory every SDK, network request, device permission, analytics event, support channel, processor, and retention path; refresh this map on every change |
| **Apple privacy disclosure** | Needs final, build-specific response | Complete App Privacy answers after final SDK inventory and build review; update if any data leaves device or any third-party SDK changes [1] |
| **Google Play Data safety** | Needs final, build-specific response | Complete Data safety and App content declarations after final SDK and permission review; maintain a listing privacy policy [2] [3] |
| **Account deletion** | No end-user account or sync is implemented | If accounts or cloud content are added, implement and test account deletion, exported-data handling, retention, and user-facing deletion documentation before submission [2] |
| **AI disclosure** | Local deterministic workspace review is present; no remote model call is enabled | Before remote analysis: obtain explicit selection/consent for transmitted content, disclose model/processor use, preserve citations/limitations, prevent unsupported case-fact output, and update Apple/Google disclosures |
| **Security review** | Device re-authentication option and local clear/export are present | Threat model, dependency audit, secure-storage design, encrypted document/data approach, incident handling, access control, and independent security review proportional to real-data use |
| **Native testing** | Type checks and state tests are required for each build | Test on physical iPhone/iPad and Android devices, including Face ID/fingerprint/passcode fallback, background timeout, clipboard export, deletion confirmation, offline behavior, and accessibility |
| **Store screenshots** | No final release screenshots prepared | Capture actual production-build screenshots at required device sizes, showing the true local-only and organization-only experience without sensitive demo data |
| **Store metadata** | App name and icon are configured | Finalize store descriptions, privacy URL, support URL, review notes, age rating, content rating, screenshots, app category, pricing, regional availability, and business contact |
| **Subscriptions / in-app purchases** | Not implemented | If offered, configure platform-native purchase flow, pricing/renewal disclosures, restore/manage subscription flow, and related support/refund policy before release |
| **Publication approval** | Not authorized | Obtain the account holder’s explicit approval before any App Store Connect, Play Console, or web-publication action |

## Functional Acceptance Checklist

| Workflow | Acceptance criterion |
| --- | --- |
| Evidence intelligence | A user can create a source-linked record with verification state, item name, dates, custody/reliability fields, people, potential discrepancy, and next action; all values persist locally |
| Timeline | Exact, approximate, ranged, conflicting, and unspecified time precision render distinctly and retain source status |
| Discovery | Expected materials move through `Expected → Requested → Received → Reviewed → Possibly Missing` without asserting destruction or withholding |
| Research | A user can store a question, public-source metadata, URL, access date, quotation, and neutral summary; the app does not portray a research topic as verified law |
| Records request | A user can build a local, editable draft with agency, subject, timeframe, categories, deadline, and lifecycle fields; it is labeled for review and not sent by the app |
| Filing workspace | A draft statement shows its linked source records or a `No supporting source attached` flag; it is never labeled as filed or legally validated |
| People workspace | A user can record source-limited roles and relationships without a private-data, contact, surveillance, or harassment feature |
| Assistant | Queries return only local source links, research entries, discrepancy flags, task questions, or a `No source located` response; no remote model processing occurs |
| Privacy controls | Users can copy a JSON export, clear local workspace data with confirmation, and optionally enable supported native-device session protection |

## External Dependencies and Explicit Approvals

The following items are not bundled in the local Phase 2 build and require external accounts, credentials, contracts, or explicit owner approval: App Store Connect, Google Play Console, web domain/hosting, privacy-policy and terms hosting, support mailbox, security assessor, legal/compliance review, paid public-record or docket services, encrypted cloud storage, document OCR provider, remote AI provider, billing/subscription account, and any court-integrated service. No publication, purchase, external search, case-data upload, or remote AI analysis should occur without the user’s explicit confirmation.

## References

[1] [Apple, *App privacy details on the App Store*](https://developer.apple.com/app-store/app-privacy-details/)

[2] [Google Play, *User Data*](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)

[3] [Google Play, *Prepare your app for review*](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
