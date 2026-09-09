import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  emptyResult,
  investigationClassifications,
  validateInvestigationResult as validateEvidenceIntegrity,
  type InvestigationResult,
  type RetrievedEvidence,
} from "@thomascallen16/evidence-integrity-engine";
import { canonicalClaims, claimEvidenceLinks } from "../drizzle/canonical";
import { sourceExcerpts, sourceRecords, chronologyEvents } from "../drizzle/schema";
import { invokeLLM, type InvokeResult } from "./_core/llm";

const resultSchema = {
  name: "proof_flow_investigation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "findings", "contradictions", "unknowns"],
    properties: {
      summary: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["classification", "statement", "supportingEvidenceIds", "contradictingEvidenceIds", "confidence", "explanation", "provenance", "uncertainty"],
          properties: {
            classification: { type: "string", enum: [...investigationClassifications] },
            statement: { type: "string" },
            supportingEvidenceIds: { type: "array", items: { type: "integer" } },
            contradictingEvidenceIds: { type: "array", items: { type: "integer" } },
            confidence: { type: "string" },
            explanation: { type: "string" },
            provenance: { type: "string" },
            uncertainty: { type: "string" },
          },
        },
      },
      contradictions: { type: "array", items: { type: "string" } },
      unknowns: { type: "array", items: { type: "string" } },
    },
  },
} as const;

function questionTokens(question: string) {
  return Array.from(new Set(question.toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 2)));
}

export async function retrieveRelevantEvidence(db: any, userId: number, caseId: number, question: string): Promise<RetrievedEvidence[]> {
  const rows = await db.select({
    evidenceId: sourceExcerpts.id,
    sourceId: sourceExcerpts.sourceRecordId,
    label: sourceExcerpts.label,
    content: sourceExcerpts.excerptText,
    locator: sourceExcerpts.locator,
    confidenceStatus: sourceExcerpts.confidenceStatus,
    sourceTitle: sourceRecords.title,
    sourceRecordType: sourceRecords.recordType,
    sourceOrigin: sourceRecords.origin,
    sourceLocation: sourceRecords.location,
    sourceProvenance: sourceRecords.provenanceNote,
  }).from(sourceExcerpts)
    .leftJoin(sourceRecords, eq(sourceExcerpts.sourceRecordId, sourceRecords.id))
    .where(and(eq(sourceExcerpts.userId, userId), eq(sourceExcerpts.caseId, caseId), isNull(sourceExcerpts.deletedAt)))
    .orderBy(asc(sourceExcerpts.id));

  const tokens = questionTokens(question);
  const ranked = rows.map((row: any) => {
    const haystack = `${row.label} ${row.content} ${row.sourceTitle ?? ""} ${row.sourceProvenance ?? ""}`.toLowerCase();
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
    return { row, score };
  }).sort((a: any, b: any) => b.score - a.score || a.row.evidenceId - b.row.evidenceId).slice(0, 20);

  const evidenceIds = ranked.map((item: any) => item.row.evidenceId);
  const links = evidenceIds.length ? await db.select({ evidenceId: claimEvidenceLinks.evidenceId, claimId: claimEvidenceLinks.claimId }).from(claimEvidenceLinks).where(inArray(claimEvidenceLinks.evidenceId, evidenceIds)) : [];
  return ranked.map((item: any) => ({
    evidenceId: item.row.evidenceId,
    sourceId: item.row.sourceId,
    source: item.row.sourceId ? { title: item.row.sourceTitle, recordType: item.row.sourceRecordType, origin: item.row.sourceOrigin, location: item.row.sourceLocation, provenanceNote: item.row.sourceProvenance } : null,
    label: item.row.label,
    content: item.row.content,
    locator: item.row.locator,
    confidenceStatus: item.row.confidenceStatus,
    claimIds: links.filter((link: any) => link.evidenceId === item.row.evidenceId).map((link: any) => link.claimId),
  }));
}

export { emptyResult };

/** Validate model/application output without treating the model as truth. */
export function validateInvestigationResult(result: InvestigationResult, evidenceIds: number[]) {
  try {
    return validateEvidenceIntegrity(result, evidenceIds);
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? error.message : "Investigation validation failed.",
    });
  }
}

function parseResult(response: InvokeResult): InvestigationResult {
  const content = response.choices[0]?.message.content;
  const text = typeof content === "string" ? content : content.map(part => part.type === "text" ? part.text : "").join("\n");
  return JSON.parse(text) as InvestigationResult;
}

export async function analyzeInvestigation(question: string, evidence: RetrievedEvidence[], claims: unknown[], chronology: unknown[]) {
  if (!evidence.length) return { result: emptyResult(question), model: null };
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an evidence analyst. The supplied record is the only source of truth. Never invent evidence, sources, dates, or legal authority. Use UNKNOWN when the record does not establish an answer and CONTRADICTION when supplied evidence conflicts. Return JSON only." },
      { role: "user", content: JSON.stringify({ question, evidence, claims, chronology }) },
    ],
    responseFormat: { type: "json_schema", json_schema: resultSchema },
    maxTokens: 3000,
  });
  return { result: parseResult(response), model: response.model };
}

export async function retrieveClaimsAndChronology(db: any, userId: number, caseId: number, evidenceIds: number[]) {
  const claims = evidenceIds.length ? await db.select({ id: canonicalClaims.id, claimText: canonicalClaims.claimText, claimant: canonicalClaims.claimant }).from(canonicalClaims).innerJoin(claimEvidenceLinks, eq(claimEvidenceLinks.claimId, canonicalClaims.id)).where(and(eq(canonicalClaims.userId, userId), eq(canonicalClaims.caseId, caseId), inArray(claimEvidenceLinks.evidenceId, evidenceIds))) : [];
  const chronology = await db.select({ id: chronologyEvents.id, dateText: chronologyEvents.dateText, eventDescription: chronologyEvents.eventDescription, sourceIds: chronologyEvents.sourceIds }).from(chronologyEvents).where(and(eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId), isNull(chronologyEvents.deletedAt))).orderBy(asc(chronologyEvents.id));
  return { claims, chronology };
}
