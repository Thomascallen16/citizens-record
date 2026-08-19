# CaseCompass — Marketplace Readiness Brief

## Scope of This Brief

CaseCompass is currently a **local-first mobile MVP** that runs through an Expo-based iOS, Android, and web codebase. It demonstrates source-traceable case organization, a neutral research notebook, a discovery queue, and uncertainty-preserving status labels. It does **not** yet provide a public-record search, accounts, cloud sync, document upload, AI processing, legal drafting, court filing, electronic service, or attorney representation.

> **Product boundary:** CaseCompass must be described as an organization and research tool. Store listing language, in-app copy, marketing, and any future automated feature must not claim that the app is a lawyer, supplies legal representation, guarantees a result, authenticates evidence, or determines what should be filed.

## Distribution Interpretation

The phrase “Google Marketplace” can refer to either the **Google Play Store** or the **Google Workspace Marketplace**. This mobile MVP is structured for the Apple App Store, Google Play, and a companion browser experience. It is **not** a Google Workspace add-on; that would require a separate integration and listing path.

| Destination | Current product fit | Main release artifact | MVP readiness |
| --- | --- | --- | --- |
| **Apple App Store** | Native iOS application | Signed iOS build, accurate App Store Connect metadata, screenshots, support URL, and privacy disclosure | Requires native-device testing, support/privacy pages, store metadata, and an Apple developer account |
| **Google Play** | Native Android application | Signed Android App Bundle, Play Console declarations, privacy policy, screenshots, and content rating | Requires native-device testing, privacy/data-safety declarations, store metadata, and a Google Play developer account |
| **Web** | Browser-accessible companion experience | Public HTTPS web deployment and policy pages | Technically supported; does not replace a native-store submission |
| **Google Workspace Marketplace** | Not in current scope | Workspace add-on and Google Workspace integration | Requires a separate product decision and implementation |

## Privacy and Sensitive-Information Design

Case files can include highly sensitive personal, legal, and potentially government-identifying information. The current local-first approach is intentional: records stay on the device and the app does not create an account or transmit case content to a server. Apple explains that data processed only on-device and never sent to a server is not “collected” for its App Store privacy disclosure framework; this position must be re-evaluated immediately if sync, analytics, upload, AI, support tooling, or a third-party SDK is added. [1]

Apple requires developers to provide and maintain accurate App Store privacy information covering data collected by the app and its third-party partners; it also requires a public privacy-policy URL for submission. [1] Google Play requires a privacy policy in the store listing and in the app, even where an app does not access personal or sensitive user data, and requires accurate Data safety disclosures. [2] [3]

| Capability | Current MVP decision | Requirement before launch with real case data |
| --- | --- | --- |
| Case notes and matrix records | Local storage only | Explain storage and deletion behavior plainly; provide a usable local-data reset option |
| User accounts and cloud sync | Not included | Add encryption in transit and at rest, access controls, deletion/export flows, data-retention policy, and account-deletion controls |
| Document upload, OCR, or media | Not included | Request only needed permissions, use explicit pre-permission disclosure, encrypt storage, define retention/deletion, and add redaction guidance |
| AI summarization, search, or drafting | Not included | Disclose whether case content is transmitted, identify every processor/SDK, obtain consent where required, preserve source linkage, and prohibit fabricated facts or legal claims |
| Analytics or advertising | Not included | Prefer no advertising and minimal telemetry; if added, reflect every SDK’s practice in Apple and Google disclosures |

Google Play requires developers to be transparent about collection, use, handling, and sharing of user data and holds developers responsible for the practices of third-party SDKs, including AI integrations. It also requires prominent in-app disclosure and affirmative consent before access, collection, use, or sharing of personal and sensitive data that is outside reasonable user expectations. [2]

## Required Release Work

Apple expects a complete, functional app with accurate metadata, accessible URLs, current contact information, and on-device testing; incomplete apps, placeholders, and obvious technical problems can be rejected. [4] Google Play’s App content process requires, among other declarations, a privacy policy, ad status, any sensitive-permission explanation, target audience/content information, and content-rating information. [3]

| Release workstream | Required before store submission | Owner decision needed |
| --- | --- | --- |
| **Legal and content posture** | Finalize organization-only disclaimer; create terms, privacy policy, and support policy; verify product claims do not imply representation or outcome prediction | Jurisdictions served, business entity, support contact, age policy |
| **Data governance** | Produce a data map covering every device permission, SDK, network request, retention period, and subprocesser | Whether CaseCompass will stay local-only or support accounts/sync/AI |
| **Security** | Threat model, encryption design, secure deletion approach, dependency audit, incident-response process, and independent security review proportionate to real-data scope | Security owner and acceptable risk model |
| **Product validation** | Test onboarding, add/edit/review records, timeline, discovery queue, local persistence, dark mode, iOS devices, Android devices, accessibility, offline behavior, and data-clear behavior | Supported device versions and accessibility acceptance criteria |
| **Store material** | Final app name, icon, screenshots from the actual release build, accurate description, support URL, privacy policy URL, App Store privacy answers, Play Data safety answers, and content ratings | Category, pricing, launch countries, screenshots, and target audience |
| **Review access** | Provide a functional demo mode or instructions for reviewers if future features are gated; explain non-obvious case-organizing features in review notes | Whether future version requires login or paid access |

## Store-Listing Positioning

The release listing should describe only what the app actually does: “Organize case records, track source details, build a timeline, and manage verification tasks in a private workspace.” It should not use attorney, representation, guarantee, legal outcome, evidence authentication, or filing-automation claims. Apple’s guidelines require accurate metadata and bar hidden or undocumented functionality; screenshots should show the actual app in use. [4]

The listing should explain that users are responsible for verifying records, current court rules, deadlines, and filing requirements. A review-before-filing notice should appear wherever an export or future drafting feature is offered. The first paid release should remain local-first until its privacy, security, and compliance design has been independently reviewed.

## Recommended Product Sequence

| Release stage | Product scope | Why this is the safer sequence |
| --- | --- | --- |
| **Stage 1 — Private organizer** | The local-first evidence matrix, timeline, discovery queue, research notebook, and clear disclosures in this MVP | Tests the core value without transmitting sensitive case material |
| **Stage 2 — Secure documents** | Encrypted upload, local redaction prompts, explicit source metadata, backup/export, and device-level access controls | Adds real records only after privacy and retention controls are designed |
| **Stage 3 — Optional assistance** | Permissioned public-source research, source-linked summaries, and verified-authority workflows | Enables assistance while preserving provenance and user control |
| **Stage 4 — Account services** | Optional encrypted sync, accounts, support, and subscription management | Adds the highest privacy and operational burden only after the local workflow is proven |

## References

[1] [Apple, *App privacy details on the App Store*](https://developer.apple.com/app-store/app-privacy-details/)

[2] [Google Play, *User Data*](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)

[3] [Google Play, *Prepare your app for review*](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)

[4] [Apple, *App Review Guidelines*](https://developer.apple.com/app-store/review/guidelines/)
