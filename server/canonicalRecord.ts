import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  canonicalClaims,
  canonicalEvidenceMetadata,
  canonicalFindings,
  canonicalSourceMetadata,
  canonicalUnknowns,
  claimEvidenceLinks,
  claimSourceLinks,
  epistemicCategories,
  findingClaimLinks,
  findingEvidenceLinks,
  recordMetadata,
  canonicalRecordStatuses,
  canonicalVisibility,
  sourceDesignations,
  unknownStatuses,
  evidenceLinkRelationships,
} from "../drizzle/canonical";
import { caseMembers, legalCases, sourceExcerpts, sourceRecords, chronologyEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const recordId = z.object({ recordId: z.number().int().positive() });
const sourceId = z.object({ sourceRecordId: z.number().int().positive() });
const evidenceId = z.object({ evidenceId: z.number().int().positive() });
const epistemic = z.enum(epistemicCategories);
const relation = z.enum(evidenceLinkRelationships);

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

async function ownedCase(userId: number, caseId: number) {
  const db = await dbOrThrow();
  const row = (await db.select().from(legalCases).where(and(eq(legalCases.id, caseId), eq(legalCases.userId, userId))).limit(1))[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Private record not found" });
  return row;
}

async function ownedSource(userId: number, caseId: number, id: number) {
  const db = await dbOrThrow();
  const row = (await db.select().from(sourceRecords).where(and(eq(sourceRecords.id, id), eq(sourceRecords.caseId, caseId), eq(sourceRecords.userId, userId), isNull(sourceRecords.deletedAt))).limit(1))[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Source not found" });
  return row;
}

async function ownedEvidence(userId: number, caseId: number, ids: number[]) {
  if (!ids.length) return [];
  const db = await dbOrThrow();
  const rows = await db.select({ id: sourceExcerpts.id, sourceRecordId: sourceExcerpts.sourceRecordId }).from(sourceExcerpts).where(and(eq(sourceExcerpts.caseId, caseId), eq(sourceExcerpts.userId, userId), inArray(sourceExcerpts.id, ids), isNull(sourceExcerpts.deletedAt)));
  if (rows.length !== ids.length || rows.some(row => !row.sourceRecordId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Every canonical evidence link must point to source-backed evidence in this record." });
  return rows;
}

async function ownedClaimIds(userId: number, caseId: number, ids: number[]) {
  if (!ids.length) return [];
  const db = await dbOrThrow();
  const rows = await db.select({ id: canonicalClaims.id }).from(canonicalClaims).where(and(eq(canonicalClaims.caseId, caseId), eq(canonicalClaims.userId, userId), inArray(canonicalClaims.id, ids)));
  if (rows.length !== ids.length) throw new TRPCError({ code: "BAD_REQUEST", message: "One or more claims are outside this private record." });
  return rows;
}

async function audit(userId: number, caseId: number, entityType: string, entityId: number, action: string, summary: string, before?: unknown, after?: unknown) {
  const db = await dbOrThrow();
  await db.insert((await import("../drizzle/canonical")).canonicalAuditEvents).values({
    userId, caseId, actorUserId: userId, entityType, entityId, action: action as any,
    summary: summary.slice(0, 500), beforeJson: before == null ? null : JSON.stringify(before).slice(0, 10000), afterJson: after == null ? null : JSON.stringify(after).slice(0, 10000),
  });
}

async function createCaseWithMetadata(userId: number, input: { title: string; description: string; originalQuestion: string }) {
  const db = await dbOrThrow();
  const caseNumber = `REC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const result = await db.insert(legalCases).values({ userId, caseNumber, court: "Not specified", caption: input.title, partyRole: "Record owner", isVerified: false });
  const caseId = Number(result[0].insertId);
  await db.insert(caseMembers).values({ caseId, userId, role: "OWNER", status: "ACTIVE" });
  await db.insert(recordMetadata).values({ caseId, userId, title: input.title, description: input.description, originalQuestion: input.originalQuestion, status: "DRAFT", visibility: "PRIVATE" });
  await audit(userId, caseId, "record", caseId, "CREATED", "Private record created.", null, input);
  return caseId;
}

export const canonicalRouter = router({
  records: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      const cases = await db.select().from(legalCases).where(eq(legalCases.userId, ctx.user.id)).orderBy(desc(legalCases.updatedAt));
      if (!cases.length) return [];
      const ids = cases.map(row => row.id);
      const metadata = await db.select().from(recordMetadata).where(inArray(recordMetadata.caseId, ids));
      return cases.map(row => {
        const meta = metadata.find(item => item.caseId === row.id);
        return { id: row.id, title: meta?.title ?? row.caption, description: meta?.description ?? `${row.caseNumber} · ${row.court}`, originalQuestion: meta?.originalQuestion ?? "", status: meta?.status ?? "ACTIVE", visibility: meta?.visibility ?? "PRIVATE", createdAt: meta?.createdAt ?? row.createdAt, updatedAt: meta?.updatedAt ?? row.updatedAt };
      });
    }),
    get: protectedProcedure.input(recordId).query(async ({ ctx, input }) => {
      const kase = await ownedCase(ctx.user.id, input.recordId);
      const db = await dbOrThrow();
      const meta = (await db.select().from(recordMetadata).where(eq(recordMetadata.caseId, kase.id)).limit(1))[0];
      return { id: kase.id, title: meta?.title ?? kase.caption, description: meta?.description ?? "", originalQuestion: meta?.originalQuestion ?? "", status: meta?.status ?? "ACTIVE", visibility: meta?.visibility ?? "PRIVATE", legacy: { caseNumber: kase.caseNumber, court: kase.court, caption: kase.caption, partyRole: kase.partyRole } };
    }),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(255), description: z.string().max(20000).default(""), originalQuestion: z.string().min(1).max(20000) })).mutation(async ({ ctx, input }) => ({ id: await createCaseWithMetadata(ctx.user.id, input) })),
    update: protectedProcedure.input(recordId.extend({ title: z.string().trim().min(1).max(255), description: z.string().max(20000), originalQuestion: z.string().min(1).max(20000), status: z.enum(canonicalRecordStatuses) })).mutation(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId);
      const db = await dbOrThrow();
      const before = (await db.select().from(recordMetadata).where(eq(recordMetadata.caseId, input.recordId)).limit(1))[0];
      if (!before) await db.insert(recordMetadata).values({ caseId: input.recordId, userId: ctx.user.id, title: input.title, description: input.description, originalQuestion: input.originalQuestion, status: input.status, visibility: "PRIVATE" });
      else await db.update(recordMetadata).set({ title: input.title, description: input.description, originalQuestion: input.originalQuestion, status: input.status }).where(eq(recordMetadata.caseId, input.recordId));
      await audit(ctx.user.id, input.recordId, "record", input.recordId, "UPDATED", "Private record updated.", before, input);
      return { success: true };
    }),
  }),
  sources: router({
    list: protectedProcedure.input(recordId).query(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId);
      const db = await dbOrThrow();
      const rows = await db.select().from(sourceRecords).where(and(eq(sourceRecords.caseId, input.recordId), eq(sourceRecords.userId, ctx.user.id), isNull(sourceRecords.deletedAt))).orderBy(desc(sourceRecords.updatedAt));
      const ids = rows.map(row => row.id);
      const meta = ids.length ? await db.select().from(canonicalSourceMetadata).where(inArray(canonicalSourceMetadata.sourceRecordId, ids)) : [];
      return rows.map(row => ({ ...row, canonical: meta.find(item => item.sourceRecordId === row.id) ?? null }));
    }),
    create: protectedProcedure.input(recordId.extend({ title: z.string().trim().min(1).max(255), sourceType: z.string().trim().min(1).max(120), location: z.string().trim().min(1).max(2000), publisher: z.string().trim().max(255).default(""), publicationDate: z.string().trim().max(160).nullable(), retrievalAt: z.string().datetime().nullable(), designation: z.enum(sourceDesignations), citationText: z.string().max(10000).default(""), notes: z.string().max(10000).default("") })).mutation(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId);
      const db = await dbOrThrow();
      const sourceId = `SRC-${crypto.randomUUID()}`;
      const result = await db.insert(sourceRecords).values({ userId: ctx.user.id, caseId: input.recordId, sourceId, title: input.title, recordType: input.sourceType, origin: input.publisher || "Unknown", location: input.location, documentDate: input.publicationDate, provenanceNote: input.notes || input.citationText || "Source metadata entered by owner." });
      const id = Number(result[0].insertId);
      await db.insert(canonicalSourceMetadata).values({ sourceRecordId: id, caseId: input.recordId, userId: ctx.user.id, retrievalAt: input.retrievalAt ? new Date(input.retrievalAt) : new Date(), designation: input.designation, citationText: input.citationText, notes: input.notes });
      await audit(ctx.user.id, input.recordId, "source", id, "CREATED", "Source attached to private record.", null, input);
      return { id };
    }),
  }),
  evidence: router({
    list: protectedProcedure.input(recordId).query(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId);
      const db = await dbOrThrow();
      const rows = await db.select().from(sourceExcerpts).where(and(eq(sourceExcerpts.caseId, input.recordId), eq(sourceExcerpts.userId, ctx.user.id), isNull(sourceExcerpts.deletedAt))).orderBy(desc(sourceExcerpts.updatedAt));
      const ids = rows.map(row => row.id);
      const meta = ids.length ? await db.select().from(canonicalEvidenceMetadata).where(inArray(canonicalEvidenceMetadata.evidenceId, ids)) : [];
      return rows.filter(row => row.sourceRecordId).map(row => ({ ...row, notes: meta.find(item => item.evidenceId === row.id)?.notes ?? "" }));
    }),
    create: protectedProcedure.input(recordId.extend({ sourceRecordId: z.number().int().positive(), title: z.string().trim().min(1).max(255), excerpt: z.string().min(1).max(20000), locator: z.string().max(1000).nullable(), confidenceStatus: z.enum(["PRIMARY-RECORD", "USER-REPORTED", "VERIFY", "SOURCE-UNAVAILABLE", "CONFLICTING"]), notes: z.string().max(10000).default("") })).mutation(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId);
      await ownedSource(ctx.user.id, input.recordId, input.sourceRecordId);
      const db = await dbOrThrow();
      const result = await db.insert(sourceExcerpts).values({ userId: ctx.user.id, caseId: input.recordId, sourceRecordId: input.sourceRecordId, label: input.title, excerptText: input.excerpt, locator: input.locator, confidenceStatus: input.confidenceStatus, isRedacted: false });
      const id = Number(result[0].insertId);
      await db.insert(canonicalEvidenceMetadata).values({ evidenceId: id, caseId: input.recordId, userId: ctx.user.id, notes: input.notes });
      await audit(ctx.user.id, input.recordId, "evidence", id, "CREATED", "Source-backed evidence created.", null, input);
      return { id };
    }),
  }),
  claims: router({
    list: protectedProcedure.input(recordId).query(async ({ ctx, input }) => { await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow(); return db.select().from(canonicalClaims).where(and(eq(canonicalClaims.caseId, input.recordId), eq(canonicalClaims.userId, ctx.user.id))).orderBy(desc(canonicalClaims.updatedAt)); }),
    create: protectedProcedure.input(recordId.extend({ claimText: z.string().min(1).max(20000), claimant: z.string().max(255).nullable(), claimDate: z.string().max(160).nullable(), claimType: z.string().trim().min(1).max(120), notes: z.string().max(10000).default(""), supportingEvidenceIds: z.array(z.number().int().positive()).default([]), contraryEvidenceIds: z.array(z.number().int().positive()).default([]), sourceRecordIds: z.array(z.number().int().positive()).default([]) })).mutation(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow();
      const allEvidence = [...new Set([...input.supportingEvidenceIds, ...input.contraryEvidenceIds])]; await ownedEvidence(ctx.user.id, input.recordId, allEvidence);
      const sourceIds = [...new Set(input.sourceRecordIds)]; for (const id of sourceIds) await ownedSource(ctx.user.id, input.recordId, id);
      const result = await db.insert(canonicalClaims).values({ caseId: input.recordId, userId: ctx.user.id, claimText: input.claimText, claimant: input.claimant, claimDate: input.claimDate, claimType: input.claimType, epistemicCategory: "CLAIM", notes: input.notes });
      const id = Number(result[0].insertId);
      for (const evidence of input.supportingEvidenceIds) await db.insert(claimEvidenceLinks).values({ claimId: id, evidenceId: evidence, relationship: "SUPPORTING" }).onDuplicateKeyUpdate({ set: { relationship: "SUPPORTING" } });
      for (const evidence of input.contraryEvidenceIds) await db.insert(claimEvidenceLinks).values({ claimId: id, evidenceId: evidence, relationship: "CONTRARY" }).onDuplicateKeyUpdate({ set: { relationship: "CONTRARY" } });
      for (const source of sourceIds) await db.insert(claimSourceLinks).values({ claimId: id, sourceRecordId: source }).onDuplicateKeyUpdate({ set: { sourceRecordId: source } });
      await audit(ctx.user.id, input.recordId, "claim", id, "CREATED", "Claim created; assertion remains distinct from fact.", null, input);
      return { id };
    }),
    linkEvidence: protectedProcedure.input(recordId.extend({ claimId: z.number().int().positive(), evidenceId: z.number().int().positive(), relationship: relation })).mutation(async ({ ctx, input }) => { await ownedCase(ctx.user.id, input.recordId); await ownedClaimIds(ctx.user.id, input.recordId, [input.claimId]); await ownedEvidence(ctx.user.id, input.recordId, [input.evidenceId]); const db = await dbOrThrow(); await db.insert(claimEvidenceLinks).values({ claimId: input.claimId, evidenceId: input.evidenceId, relationship: input.relationship }).onDuplicateKeyUpdate({ set: { relationship: input.relationship } }); await audit(ctx.user.id, input.recordId, "claim_evidence", input.claimId, "LINKED", `Claim ${input.relationship.toLowerCase()} evidence link added.`); return { success: true }; }),
  }),
  findings: router({
    list: protectedProcedure.input(recordId).query(async ({ ctx, input }) => { await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow(); return db.select().from(canonicalFindings).where(and(eq(canonicalFindings.caseId, input.recordId), eq(canonicalFindings.userId, ctx.user.id))).orderBy(desc(canonicalFindings.updatedAt)); }),
    get: protectedProcedure.input(recordId.extend({ findingId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow(); const finding = (await db.select().from(canonicalFindings).where(and(eq(canonicalFindings.id, input.findingId), eq(canonicalFindings.caseId, input.recordId), eq(canonicalFindings.userId, ctx.user.id))).limit(1))[0]; if (!finding) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found" });
      const claims = await db.select({ id: canonicalClaims.id, claimText: canonicalClaims.claimText }).from(findingClaimLinks).innerJoin(canonicalClaims, eq(findingClaimLinks.claimId, canonicalClaims.id)).where(eq(findingClaimLinks.findingId, finding.id));
      const evidence = await db.select({ id: sourceExcerpts.id, title: sourceExcerpts.label, excerpt: sourceExcerpts.excerptText, locator: sourceExcerpts.locator, sourceRecordId: sourceExcerpts.sourceRecordId, relationship: findingEvidenceLinks.relationship }).from(findingEvidenceLinks).innerJoin(sourceExcerpts, eq(findingEvidenceLinks.evidenceId, sourceExcerpts.id)).where(eq(findingEvidenceLinks.findingId, finding.id));
      const sources = evidence.length ? await db.select({ id: sourceRecords.id, title: sourceRecords.title, location: sourceRecords.location }).from(sourceRecords).where(inArray(sourceRecords.id, evidence.map(e => e.sourceRecordId).filter((id): id is number => Boolean(id)))) : [];
      return { finding, claims, evidence, sources };
    }),
    create: protectedProcedure.input(recordId.extend({ findingText: z.string().min(1).max(20000), epistemicCategory: epistemic, rationale: z.string().min(1).max(20000), confidenceExplanation: z.string().max(10000).default(""), alternativeExplanation: z.string().max(10000).default(""), missingEvidence: z.string().max(10000).default(""), whatWouldChangeConclusion: z.string().max(10000).default(""), supportingEvidenceIds: z.array(z.number().int().positive()).default([]), contraryEvidenceIds: z.array(z.number().int().positive()).default([]), claimIds: z.array(z.number().int().positive()).default([]) })).mutation(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow();
      const allEvidence = [...new Set([...input.supportingEvidenceIds, ...input.contraryEvidenceIds])]; await ownedEvidence(ctx.user.id, input.recordId, allEvidence); await ownedClaimIds(ctx.user.id, input.recordId, input.claimIds);
      if (input.epistemicCategory === "FACT" && input.supportingEvidenceIds.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "A FACT finding requires at least one linked source-backed supporting evidence item." });
      const result = await db.insert(canonicalFindings).values({ caseId: input.recordId, userId: ctx.user.id, findingText: input.findingText, epistemicCategory: input.epistemicCategory, rationale: input.rationale, confidenceExplanation: input.confidenceExplanation, alternativeExplanation: input.alternativeExplanation, missingEvidence: input.missingEvidence, whatWouldChangeConclusion: input.whatWouldChangeConclusion });
      const id = Number(result[0].insertId);
      for (const evidence of input.supportingEvidenceIds) await db.insert(findingEvidenceLinks).values({ findingId: id, evidenceId: evidence, relationship: "SUPPORTING" }).onDuplicateKeyUpdate({ set: { relationship: "SUPPORTING" } });
      for (const evidence of input.contraryEvidenceIds) await db.insert(findingEvidenceLinks).values({ findingId: id, evidenceId: evidence, relationship: "CONTRARY" }).onDuplicateKeyUpdate({ set: { relationship: "CONTRARY" } });
      for (const claim of input.claimIds) await db.insert(findingClaimLinks).values({ findingId: id, claimId: claim }).onDuplicateKeyUpdate({ set: { claimId: claim } });
      await audit(ctx.user.id, input.recordId, "finding", id, "CREATED", "Finding created with explicit epistemic category.", null, input);
      return { id };
    }),
  }),
  unknowns: router({
    list: protectedProcedure.input(recordId).query(async ({ ctx, input }) => { await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow(); return db.select().from(canonicalUnknowns).where(and(eq(canonicalUnknowns.caseId, input.recordId), eq(canonicalUnknowns.userId, ctx.user.id))).orderBy(desc(canonicalUnknowns.updatedAt)); }),
    create: protectedProcedure.input(recordId.extend({ description: z.string().min(1).max(20000), whyItMatters: z.string().min(1).max(10000), relatedClaimId: z.number().int().positive().nullable(), relatedFindingId: z.number().int().positive().nullable(), relatedSourceRecordId: z.number().int().positive().nullable(), relatedChronologyEventId: z.number().int().positive().nullable() })).mutation(async ({ ctx, input }) => {
      await ownedCase(ctx.user.id, input.recordId); if (input.relatedClaimId) await ownedClaimIds(ctx.user.id, input.recordId, [input.relatedClaimId]); if (input.relatedSourceRecordId) await ownedSource(ctx.user.id, input.recordId, input.relatedSourceRecordId); if (input.relatedChronologyEventId) { const db = await dbOrThrow(); const event = (await db.select().from(chronologyEvents).where(and(eq(chronologyEvents.id, input.relatedChronologyEventId), eq(chronologyEvents.caseId, input.recordId), eq(chronologyEvents.userId, ctx.user.id))).limit(1))[0]; if (!event) throw new TRPCError({ code: "BAD_REQUEST", message: "Related chronology event is outside this record." }); }
      const db = await dbOrThrow(); const result = await db.insert(canonicalUnknowns).values({ caseId: input.recordId, userId: ctx.user.id, description: input.description, whyItMatters: input.whyItMatters, relatedClaimId: input.relatedClaimId, relatedFindingId: input.relatedFindingId, relatedSourceRecordId: input.relatedSourceRecordId, relatedChronologyEventId: input.relatedChronologyEventId, status: "OPEN", resolutionNotes: null }); const id = Number(result[0].insertId); await audit(ctx.user.id, input.recordId, "unknown", id, "CREATED", "Unknown or unresolved question preserved.", null, input); return { id };
    }),
    updateStatus: protectedProcedure.input(recordId.extend({ unknownId: z.number().int().positive(), status: z.enum(unknownStatuses), resolutionNotes: z.string().max(10000).nullable() })).mutation(async ({ ctx, input }) => { await ownedCase(ctx.user.id, input.recordId); const db = await dbOrThrow(); const before = (await db.select().from(canonicalUnknowns).where(and(eq(canonicalUnknowns.id, input.unknownId), eq(canonicalUnknowns.caseId, input.recordId), eq(canonicalUnknowns.userId, ctx.user.id))).limit(1))[0]; if (!before) throw new TRPCError({ code: "NOT_FOUND", message: "Unknown not found" }); await db.update(canonicalUnknowns).set({ status: input.status, resolutionNotes: input.resolutionNotes }).where(eq(canonicalUnknowns.id, input.unknownId)); await audit(ctx.user.id, input.recordId, "unknown", input.unknownId, "STATUS_CHANGED", "Unknown status changed; history preserved.", before, input); return { success: true }; }),
  }),
});
