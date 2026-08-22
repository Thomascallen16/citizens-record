import { ORGANIZATION_DISCLAIMER } from "./legalDraft";

type CaseExportInput = {
  caseRecord: { caseNumber: string; caption: string };
  evidence: Array<{ id: number; confidenceStatus: string; sourceIds: string; proposition: string; supportingMaterial: string; adverseMaterial: string; primaryRecordNeeded: string; nextAction: string }>;
  chronology: Array<{ id: number; dateText: string; confidenceStatus: string; sourceIds: string; eventDescription: string; validationRecordNeeded: string; nextAction: string }>;
  acquisitions: Array<{ id: number; priority: string; sourceIds: string; itemName: string; purpose: string; primaryRecordNeeded: string; nextAction: string }>;
};

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function buildCaseExport(input: CaseExportInput) {
  const disclaimer = `Organization/research disclaimer: ${ORGANIZATION_DISCLAIMER}`;
  const csvRows = [
    ["record_type", "case_number", "organization_research_disclaimer", "id", "confidence_or_priority", "source_ids", "proposition_or_event", "supporting_or_purpose", "adverse_or_validation", "primary_record_needed", "next_action"],
    ...input.evidence.map(row => ["EVIDENCE", input.caseRecord.caseNumber, disclaimer, `E-${row.id}`, row.confidenceStatus, row.sourceIds, row.proposition, row.supportingMaterial, row.adverseMaterial, row.primaryRecordNeeded, row.nextAction]),
    ...input.chronology.map(row => ["CHRONOLOGY", input.caseRecord.caseNumber, disclaimer, `CH-${row.id}`, row.confidenceStatus, row.sourceIds, `${row.dateText}: ${row.eventDescription}`, "", row.validationRecordNeeded, row.validationRecordNeeded, row.nextAction]),
    ...input.acquisitions.map(row => ["ACQUISITION", input.caseRecord.caseNumber, disclaimer, `AQ-${row.id}`, row.priority, row.sourceIds, row.itemName, row.purpose, "", row.primaryRecordNeeded, row.nextAction]),
  ];
  const csv = csvRows.map(row => row.map(csvEscape).join(",")).join("\n");
  const markdown = `# Evidence Workspace Export

**Case:** ${input.caseRecord.caption}
**Case number:** ${input.caseRecord.caseNumber}

> ${disclaimer}

## Evidence Matrix

${input.evidence.map(row => `- **E-${row.id} — ${row.confidenceStatus}:** ${row.proposition}  \n  Sources: ${row.sourceIds}  \n  Primary record needed: ${row.primaryRecordNeeded}  \n  Next action: ${row.nextAction}`).join("\n") || "No evidence rows."}

## Verification-First Chronology

${input.chronology.map(row => `- **${row.dateText} — ${row.confidenceStatus}:** ${row.eventDescription} (Sources: ${row.sourceIds}; Validation record: ${row.validationRecordNeeded})`).join("\n") || "No chronology events."}

## Record-Acquisition Queue

${input.acquisitions.map(row => `- **${row.priority}:** ${row.itemName} — ${row.primaryRecordNeeded}. Next action: ${row.nextAction}`).join("\n") || "No acquisition items."}`;
  return { csv, markdown, disclaimer };
}
