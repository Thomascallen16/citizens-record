export const PRIVACY_NOTICE_VERSION = "2026-08-private-workspace-v1";

export const privacyNotice = {
  title: "Private workspace notice",
  summary: "Cases, sources, evidence rows, excerpts, and draft materials are private to the authenticated workspace owner by default. This product is organization and research software, not legal advice, legal representation, or an e-filing service.",
  handling: "Do not enter or attach information unless you have authority to use it. Avoid unnecessary personal identifiers, minors’ information, account credentials, medical information, financial information, privileged communications, sealed material, and any material subject to a protective order.",
  sharing: "Owner-only access is enabled in this version. No public publishing or collaborator invitations are enabled by default.",
  correction: "Use the privacy and correction request workflow to report an access, correction, takedown, or deletion concern. Requests are recorded for review; they are not automatically published or resolved.",
} as const;

export const moderationRules = [
  "Do not represent an allegation, user report, or reconstructed material as a verified fact.",
  "Do not upload or reference material that you are not authorized to use or disclose.",
  "Do not include minors’ personal information, credentials, medical information, financial account information, privileged communications, or sealed material unless you have a lawful, necessary, and authorized basis.",
  "Preserve sources, limitations, contradictory material, and unresolved questions rather than deleting information solely because it is adverse to a position.",
  "Do not use the workspace to automate filing, service, signatures, or legal advice.",
] as const;

export type SensitiveDataAcknowledgement = {
  sensitiveDataAcknowledged: true;
  authorizedToShareAcknowledged: true;
};

export function isValidSensitiveDataAcknowledgement(value: Partial<SensitiveDataAcknowledgement>): value is SensitiveDataAcknowledgement {
  return value.sensitiveDataAcknowledged === true && value.authorizedToShareAcknowledged === true;
}
