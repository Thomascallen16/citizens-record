import { describe, expect, it } from "vitest";
import { buildCaseExport } from "./caseExports";

describe("case export provenance", () => {
  it("includes disclaimer, source identifiers, and verification labels in CSV and Markdown", () => {
    const output = buildCaseExport({
      caseRecord: { caseNumber: "26-CR-101", caption: "State v. Example" },
      evidence: [{ id: 3, confidenceStatus: "VERIFY", sourceIds: "S-001", proposition: "A recording may exist.", supportingMaterial: "User report", adverseMaterial: "No original file", primaryRecordNeeded: "Native recording", nextAction: "Request production" }],
      chronology: [{ id: 4, dateText: "2026-01-12", confidenceStatus: "PRIMARY-RECORD", sourceIds: "S-002", eventDescription: "Hearing occurred.", validationRecordNeeded: "Certified minutes", nextAction: "Obtain minutes" }],
      acquisitions: [{ id: 5, priority: "High", sourceIds: "S-003", itemName: "Discovery log", purpose: "Verify production", primaryRecordNeeded: "Original log", nextAction: "Request log" }],
    });
    expect(output.csv).toContain("Organization/research disclaimer:");
    expect(output.csv).toContain("S-001");
    expect(output.csv).toContain("VERIFY");
    expect(output.markdown).toContain("S-002");
    expect(output.markdown).toContain("Record-Acquisition Queue");
  });
});
