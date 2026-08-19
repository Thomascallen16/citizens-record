import type { EvidenceRow, LegalCase } from "../drizzle/schema";

const REVIEW_LABEL = "DRAFT — REVIEW BEFORE FILING";
const ORGANIZATION_DISCLAIMER = "This document is a source-linked working draft for organization and research. It is not legal advice and must be reviewed for jurisdiction, procedure, current authority, signature, service, and filing requirements before use.";

type DraftInput = {
  caseRecord: LegalCase;
  motionType: string;
  requestedRelief: string;
  evidence: EvidenceRow[];
};

export function buildSourceLinkedMotionDraft(input: DraftInput) {
  const warnings = input.evidence.filter(row =>
    ["VERIFY", "SOURCE-UNAVAILABLE", "CONFLICTING"].includes(row.confidenceStatus)
  );
  const sourceTable = input.evidence.map(row => ({
    evidenceId: row.id,
    proposition: row.proposition,
    confidenceStatus: row.confidenceStatus,
    sourceIds: row.sourceIds,
    supportingMaterial: row.supportingMaterial,
    adverseMaterial: row.adverseMaterial,
    primaryRecordNeeded: row.primaryRecordNeeded,
  }));
  const evidenceLines = input.evidence.length
    ? input.evidence.map(row => `| E-${row.id} | ${row.confidenceStatus} | ${row.sourceIds} | ${row.proposition} |`).join("\n")
    : "| — | SOURCE-UNAVAILABLE | — | No selected evidence rows were provided. |";
  const warningLines = warnings.length
    ? warnings.map(row => `- **E-${row.id} — ${row.confidenceStatus}:** ${row.primaryRecordNeeded}`).join("\n")
    : "- No selected rows currently carry a VERIFY, SOURCE-UNAVAILABLE, or CONFLICTING label.";
  const adverseLines = input.evidence.length
    ? input.evidence.map(row => `- **E-${row.id}:** ${row.adverseMaterial || "No adverse/limiting material entered."}`).join("\n")
    : "- No adverse/limiting rows selected.";

  const bodyMarkdown = `# ${REVIEW_LABEL}

**Court:** ${input.caseRecord.court}
**Case caption:** ${input.caseRecord.caption}
**Case number:** ${input.caseRecord.caseNumber}
**Party role:** ${input.caseRecord.partyRole}
**Motion type:** ${input.motionType}
**Requested relief:** ${input.requestedRelief}

> ${ORGANIZATION_DISCLAIMER}

## 1. Verified Case Context

The case identification above is drawn from the selected workspace record. Confirm the official caption, current posture, party role, and case number against the court record before relying on this draft.

## 2. Selected Source-Linked Record Facts and Gaps

| Evidence row | Confidence status | Source IDs | Neutral proposition |
|---|---|---|---|
${evidenceLines}

## 3. Unresolved Verification Warnings

${warningLines}

## 4. Material Adverse or Limiting Information

${adverseLines}

## 5. Efforts to Obtain or Clarify Material

[VERIFY: Insert only dated discovery requests, production records, correspondence, and responses supported by source IDs. Do not invent a request history.]

## 6. Applicable Authority

[AUTHORITY PLACEHOLDER: Insert only current, jurisdiction-specific authority that has been independently verified. Do not invent rules, deadlines, standards, or citations.]

## 7. Requested Relief

${input.requestedRelief}

WHEREFORE, the requesting party asks the Court to grant only the relief supported by the verified record and applicable law.

## Review Before Export

- Confirm the exact court, caption, case number, and party role from an official record.
- Review every unresolved verification warning and the adverse/limiting information above.
- Verify the governing authority, deadline, requested relief, signature block, service, and local formatting requirements.
- Do not file, sign, serve, or submit this draft without the required review.
`;

  return {
    bodyMarkdown,
    sourceTable,
    unresolvedWarnings: warnings.map(row => `E-${row.id}: ${row.confidenceStatus} — ${row.primaryRecordNeeded}`),
    authorityPlaceholders: ["Insert current jurisdiction-specific authority after independent verification."],
  };
}

export { ORGANIZATION_DISCLAIMER, REVIEW_LABEL };
