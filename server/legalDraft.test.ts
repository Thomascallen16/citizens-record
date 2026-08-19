import { describe, expect, it } from "vitest";
import { buildSourceLinkedMotionDraft, REVIEW_LABEL } from "./legalDraft";
import type { EvidenceRow, LegalCase } from "../drizzle/schema";

const caseRecord = {
  id: 1,
  userId: 7,
  caseNumber: "24-CR-001",
  court: "Example Circuit Court",
  caption: "State v. Example",
  partyRole: "Defendant",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies LegalCase;

const evidence = {
  id: 5,
  userId: 7,
  caseId: 1,
  proposition: "Whether body-camera media was produced.",
  confidenceStatus: "VERIFY",
  sourceIds: "S-001",
  supportingMaterial: "Discovery correspondence references a recording.",
  adverseMaterial: "Production status is not established.",
  primaryRecordNeeded: "Complete discovery index and native media export.",
  nextAction: "Request preservation and production status.",
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies EvidenceRow;

describe("source-linked motion draft safeguards", () => {
  it("preserves the required label, source trail, and verification warning", () => {
    const draft = buildSourceLinkedMotionDraft({
      caseRecord,
      motionType: "Motion to Compel Discovery",
      requestedRelief: "Order production or confirmation of nonexistence.",
      evidence: [evidence],
    });

    expect(draft.bodyMarkdown).toContain(REVIEW_LABEL);
    expect(draft.bodyMarkdown).toContain("VERIFY");
    expect(draft.bodyMarkdown).toContain("S-001");
    expect(draft.bodyMarkdown).toContain("Production status is not established.");
    expect(draft.unresolvedWarnings[0]).toContain("VERIFY");
  });
});

