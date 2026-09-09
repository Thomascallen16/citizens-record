import { describe, expect, it } from "vitest";
import { analyzeInvestigation, emptyResult, retrieveRelevantEvidence, validateInvestigationResult, type InvestigationResult } from "./investigation";
import { appRouter } from "./routers";

function queryReturning(value: unknown) {
  const query = {
    from() { return query; },
    leftJoin() { return query; },
    innerJoin() { return query; },
    where() { return query; },
    orderBy() { return query; },
    then(resolve: (value: unknown) => unknown) { return Promise.resolve(resolve(value)); },
  };
  return query;
}

describe("investigation pipeline", () => {
  it("returns UNKNOWN without manufacturing an answer when no evidence exists", async () => {
    const result = await analyzeInvestigation("What happened?", [], [], []);
    expect(result.model).toBeNull();
    expect(result.result.findings[0]?.classification).toBe("UNKNOWN");
    expect(result.result.unknowns).toHaveLength(1);
  });

  it("preserves evidence and source provenance during retrieval", async () => {
    let selectCount = 0;
    const db = { select() { selectCount += 1; return queryReturning(selectCount === 1 ? [{ evidenceId: 7, sourceId: 3, label: "Order excerpt", content: "The order states the hearing date.", locator: "p. 4", confidenceStatus: "PRIMARY-RECORD", sourceTitle: "Court order", sourceRecordType: "order", sourceOrigin: "Court", sourceLocation: "https://example.test/order", sourceProvenance: "Official filing" }] : [{ evidenceId: 7, claimId: 11 }]); } };
    const evidence = await retrieveRelevantEvidence(db, 1, 2, "hearing date");
    expect(evidence[0]).toMatchObject({ evidenceId: 7, sourceId: 3, locator: "p. 4", claimIds: [11] });
    expect(evidence[0]?.source?.title).toBe("Court order");
  });

  it("marks contradiction results explicitly", () => {
    const result: InvestigationResult = { summary: "Conflict", findings: [{ classification: "CONTRADICTION", statement: "Sources conflict", supportingEvidenceIds: [1], contradictingEvidenceIds: [2], confidence: "medium", explanation: "The excerpts disagree.", provenance: "Evidence 1 and 2", uncertainty: "The record does not resolve the conflict." }], contradictions: ["Sources conflict"], unknowns: [] };
    expect(validateInvestigationResult(result, [1, 2]).validationStatus).toBe("CONTRADICTION");
  });

  it("rejects model evidence IDs that were not retrieved", () => {
    const result = emptyResult("Question");
    result.findings[0]!.supportingEvidenceIds = [99];
    expect(() => validateInvestigationResult(result, [1])).toThrow(/unavailable evidence/);
  });

  it("rejects unauthenticated investigation requests before database access", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(caller.canonical.investigations.ask({ recordId: 1, question: "What happened?" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
