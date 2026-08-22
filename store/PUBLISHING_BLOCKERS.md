# Pro Se Compass — Publishing Credentials and Human Actions

## Current Status

The repository now contains non-secret EAS production and submission profiles. It does **not** contain, and must never contain, Apple private keys, Google service-account JSON, Expo access tokens, passwords, keystores, signing certificates, provisioning profiles, or store credentials.

> **No app build has been requested, uploaded, submitted to a store, published, or sent for review.** Those actions require the account holder’s developer-program enrollment, app records, credentials, and explicit confirmation.

## Google Play Console Blocker

| Item | Exact owner action |
| --- | --- |
| Website | [Google Play Console](https://play.google.com/console/) |
| Account requirement | Enroll the owning entity in a Google Play Developer account, then accept the applicable agreements and any identity verification requested by Google |
| Create app record | **All apps → Create app**. Use name `Pro Se Compass`, app type `App`, default language chosen by the owner, free/paid decision, and package ID `com.app.casecompass` in the Android artifact. Do not create a second package name. |
| Connect Google Cloud project | **Setup → API access**. Link or create the Google Cloud project used for Play Developer API access. |
| Create service account | In the linked [Google Cloud Console](https://console.cloud.google.com/) project, open **IAM & Admin → Service Accounts → Create service account**. Give it a release-specific name such as `prose-compass-eas-submit`. |
| Required permission | In Play Console, open **Users and permissions → Invite new users** or manage the service account under **Setup → API access**. Grant access only to the Pro Se Compass app and a release-management role sufficient to upload to the internal testing track. Do not grant broad account administration unless the owner intentionally requires it. |
| Create credential | Google Cloud Console: **IAM & Admin → Service Accounts → [service account] → Keys → Add key → Create new key → JSON**. Download the JSON once and store it only in a protected local location. |
| Where to provide it | Do **not** put the JSON in this repository, chat, `eas.json`, or GitHub. After authenticating with the owner’s Expo account, use **EAS Dashboard → Credentials → Android → `com.app.casecompass` → Service Credentials → Add a Google Service Account Key**, or run `eas credentials --platform android`, choose `production`, then upload the key when prompted. |
| Submission profile result | The committed `eas.json` submits Android to the **internal** track with `draft` release status, preventing an unintended public rollout. |

## Apple Developer and App Store Connect Blocker

| Item | Exact owner action |
| --- | --- |
| Websites | [Apple Developer Account](https://developer.apple.com/account/) and [App Store Connect](https://appstoreconnect.apple.com/) |
| Account requirement | Enroll the owning individual or organization in the paid Apple Developer Program and accept the current agreements. This step requires the account holder’s identity, legal, and payment information. |
| Register identifier | Apple Developer portal: **Certificates, Identifiers & Profiles → Identifiers → +**. Register App ID `com.app.casecompass` if it is not already registered. Do not register a different identifier for the same release. |
| Create app record | App Store Connect: **Apps → + → New App**. Enter display name `Pro Se Compass`, select the registered bundle ID `com.app.casecompass`, choose the SKU controlled by the owner, and create the record. |
| Get App Store Connect app ID | App Store Connect: **Apps → Pro Se Compass → App Store → General → App Information**. Copy the numeric **Apple ID**. This becomes `submit.production.ios.ascAppId` only after the owner supplies it. |
| Preferred EAS credential flow | After logging into the owner’s Expo account, run `eas credentials --platform ios`, choose the `production` profile, sign in to the owner’s Apple account when prompted, then select **App Store Connect: Manage your API Key → Set up your project to use an API Key for EAS Submit**. EAS can manage the submission credential without committing it. |
| Bring-your-own API key alternative | App Store Connect: **Users and Access → Integrations → Keys → +**. Create a key used only for Pro Se Compass EAS submissions. Assign the least-privileged role that can upload builds and manage the Pro Se Compass app; the account owner should confirm Apple’s current role requirements. Download the `.p8` file once. |
| Where to provide it | Do **not** commit or paste the `.p8` file, issuer ID, or key ID in source. Store the private key in the EAS credential manager through the credential flow above. If an owner elects a bring-your-own key, provide it only through the EAS credential workflow or a secure secret manager. |
| TestFlight result | Once the owner explicitly authorizes the upload, `eas submit --platform ios --profile production` uploads a selected `.ipa` to App Store Connect. It then appears in TestFlight after Apple processing; it is not public App Store release. |

## Shared Expo EAS Blocker

| Item | Exact owner action |
| --- | --- |
| Website | [Expo dashboard](https://expo.dev/) |
| Account requirement | Create or select the Expo account/organization that will own the EAS project and billing. |
| Link project | From the repository root, the owner must sign in with `npx eas-cli@22.2.0 login`, then allow `npx eas-cli@22.2.0 build:configure` or the first production build to associate this project with the correct Expo owner/project. Review the project ownership carefully before confirming. |
| Production build command | `pnpm release:android` for the `.aab`, or `pnpm release:ios` for the `.ipa`. EAS Build requires the Expo account owner’s login, build quota/billing approval, and signing-credential decisions. |
| Submission command | `pnpm submit:android` or `pnpm submit:ios` only after the app records and EAS credentials are configured and the owner explicitly approves the upload. |
| Version initialization | The first EAS production build initializes remote Android and iOS build versions from local `1` values. Later production builds auto-increment developer-facing build numbers; the human-visible `version` remains an owner-managed release decision. [1] |

## Required Store Console Work Before Review

| Store | Owner-only console work |
| --- | --- |
| Google Play | Store listing, privacy-policy URL, Data safety, ads declaration, target audience, content rating, app access instructions, release country/pricing decisions, and internal-testing release review. Google’s App content page requires these declarations to remain accurate. [2] |
| Apple | App information, age rating, pricing/availability, privacy answers, public privacy-policy URL, screenshots, review contact, review notes, export-compliance answers, and TestFlight/App Review release selection. Apple requires App Store Connect privacy responses to accurately reflect the app and third-party code. [3] |

## References

[1] [Expo, *App version management*](https://docs.expo.dev/build-reference/app-versions/)

[2] [Google Play Console Help, *Prepare your app for review*](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)

[3] [Apple, *Manage app privacy*](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
