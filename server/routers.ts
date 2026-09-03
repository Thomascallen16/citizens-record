import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  acquisitionPriorities,
  citationRelationships,
  citationTargetTypes,
  confidenceStatuses,
  evidenceItemKinds,
  sensitivityLevels,
} from "../drizzle/schema";
import {
  acknowledgePrivacyNoticeForUser,
  createAcquisitionForCase,
  createCaseForUser,
  createChronologyForCase,
  createCitationForCase,
  createEvidenceForCase,
  createEvidenceItemForCase,
  createMotionDraftForCase,
  createPrivacyRequestForUser,
  createSafeSampleCaseForUser,
  createSourceExcerptForCase,
  createSourceForCase,
  deleteAcquisitionForCase,
  deleteChronologyForCase,
  deleteEvidenceForCase,
  getAcquisitionForCase,
  getCaseForUser,
  getChronologyForCase,
  getEntitlementForUser,
  getEvidenceForCase,
  getEvidenceItemForCase,
  getMotionDraftForUser,
  getPrivacyStatusForUser,
  getSourceExcerptForCase,
  getSourceForCase,
  listAcquisitionForCase,
  listCasesForUser,
  listChronologyForCase,
  listCitationsForCase,
  listEvidenceForCase,
  listEvidenceItemsForCase,
  listMotionDraftsForCase,
  listPrivacyRequestsForUser,
  listRevisionEventsForCase,
  listSourceExcerptsForCase,
  listSourcesForCase,
  restoreAcquisitionForCase,
  restoreChronologyForCase,
  restoreEvidenceForCase,
  trackAnalyticsForUser,
  updateAcquisitionForCase,
  updateCaseForUser,
  updateChronologyForCase,
  updateEvidenceForCase,
} from "./db";
import { buildSourceLinkedMotionDraft } from "./legalDraft";
import { hasActiveMotionDraftingEntitlement } from "./entitlements";
import { buildCaseExport } from "./caseExports";
import { requireOwnedRecord } from "./ownership";
import { getStripeClient } from "./stripe";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { canonicalRouter } from "./canonicalRecord";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { PRIVACY_NOTICE_VERSION } from "../shared/workspacePolicies";

const confidenceStatusSchema = z.enum(confidenceStatuses);
const caseInput = z.object({
  caseNumber: z.string().trim().min(1).max(160),
  court: z.string().trim().min(1).max(255),
  caption: z.string().trim().min(1),
  partyRole: z.string().trim().min(1).max(160),
  isVerified: z.boolean(),
});
const caseIdInput = z.object({ caseId: z.number().int().positive() });
const optionalPositiveId = z.number().int().positive().nullable();
const excerptInput = caseIdInput.extend({
  sourceRecordId: optionalPositiveId,
  evidenceItemId: optionalPositiveId,
  label: z.string().trim().min(1).max(255),
  excerptText: z.string().trim().min(1).max(20000),
  locator: z.string().trim().max(255).nullable(),
  confidenceStatus: confidenceStatusSchema,
  isRedacted: z.boolean(),
}).refine(value => value.sourceRecordId || value.evidenceItemId, { message: "An excerpt must identify a source record or evidence item.", path: ["sourceRecordId"] });
const citationInput = caseIdInput.extend({
  targetType: z.enum(citationTargetTypes),
  targetId: z.number().int().positive(),
  sourceRecordId: optionalPositiveId,
  excerptId: optionalPositiveId,
  relationship: z.enum(citationRelationships),
  locator: z.string().trim().max(255).nullable(),
  note: z.string().trim().max(5000).nullable(),
}).refine(value => value.sourceRecordId || value.excerptId, { message: "A citation must point to a source record or excerpt.", path: ["sourceRecordId"] });
const safetyAcknowledgement = z.object({
  sensitiveDataAcknowledged: z.literal(true),
  authorizedToShareAcknowledged: z.literal(true),
});

async function requireOwnedCase(userId: number, caseId: number) {
  return requireOwnedRecord(await getCaseForUser(userId, caseId), "Case");
}

async function requireOwnedSource(userId: number, caseId: number, sourceRecordId: number) {
  return requireOwnedRecord(await getSourceForCase(userId, caseId, sourceRecordId), "Source");
}

export const appRouter = router({
  system: systemRouter,
  canonical: canonicalRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  privacy: router({
    status: protectedProcedure.query(async ({ ctx }) => ({
      ...(await getPrivacyStatusForUser(ctx.user.id)),
      currentVersion: PRIVACY_NOTICE_VERSION,
    })),
    acknowledge: protectedProcedure.input(z.object({ version: z.literal(PRIVACY_NOTICE_VERSION) })).mutation(async ({ ctx, input }) => {
      await acknowledgePrivacyNoticeForUser(ctx.user.id, input.version);
      return { success: true };
    }),
    listRequests: protectedProcedure.query(({ ctx }) => listPrivacyRequestsForUser(ctx.user.id)),
    request: protectedProcedure.input(z.object({
      caseId: optionalPositiveId,
      requestType: z.enum(["CORRECTION", "TAKEDOWN", "ACCESS", "DELETION", "OTHER"]),
      details: z.string().trim().min(10).max(5000),
    })).mutation(async ({ ctx, input }) => {
      if (input.caseId) await requireOwnedCase(ctx.user.id, input.caseId);
      return { id: await createPrivacyRequestForUser(ctx.user.id, input) };
    }),
  }),
  analytics: router({
    track: protectedProcedure.input(z.object({
      eventName: z.enum(["START_RECORD", "RETURN"]),
      channel: z.enum(["workspace", "case_form", "source_form", "sample_record"]),
    })).mutation(async ({ ctx, input }) => {
      await trackAnalyticsForUser(ctx.user.id, input.eventName, input.channel);
      return { success: true };
    }),
  }),
  cases: router({
    list: protectedProcedure.query(({ ctx }) => listCasesForUser(ctx.user.id)),
    create: protectedProcedure.input(caseInput).mutation(async ({ ctx, input }) => ({ id: await createCaseForUser(ctx.user.id, input) })),
    update: protectedProcedure.input(caseIdInput.merge(caseInput)).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      await updateCaseForUser(ctx.user.id, input.caseId, input);
      return { success: true };
    }),
    createSample: protectedProcedure.mutation(async ({ ctx }) => createSafeSampleCaseForUser(ctx.user.id)),
  }),
  sources: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listSourcesForCase(ctx.user.id, input.caseId);
    }),
    create: protectedProcedure.input(caseIdInput.extend({
      sourceId: z.string().trim().min(1).max(80),
      title: z.string().trim().min(1).max(255),
      recordType: z.string().trim().min(1).max(120),
      origin: z.string().trim().min(1).max(255),
      location: z.string().trim().min(1).max(2000),
      documentDate: z.string().trim().max(160).nullable(),
      provenanceNote: z.string().trim().min(1).max(5000),
    })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return { id: await createSourceForCase(ctx.user.id, input.caseId, input) };
    }),
  }),
  evidenceItems: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listEvidenceItemsForCase(ctx.user.id, input.caseId);
    }),
    createReference: protectedProcedure.input(caseIdInput.merge(safetyAcknowledgement).extend({
      sourceRecordId: optionalPositiveId,
      itemId: z.string().trim().min(1).max(80),
      title: z.string().trim().min(1).max(255),
      kind: z.enum(evidenceItemKinds),
      sensitivity: z.enum(sensitivityLevels),
      externalReference: z.string().trim().url().max(2000).nullable(),
      provenanceNote: z.string().trim().min(1).max(5000),
    })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      if (input.sourceRecordId) await requireOwnedSource(ctx.user.id, input.caseId, input.sourceRecordId);
      return {
        id: await createEvidenceItemForCase(ctx.user.id, input.caseId, {
          sourceRecordId: input.sourceRecordId,
          itemId: input.itemId,
          title: input.title,
          kind: input.kind,
          state: "REFERENCE_ONLY",
          sensitivity: input.sensitivity,
          externalReference: input.externalReference,
          provenanceNote: input.provenanceNote,
          safetyAcknowledgedAt: new Date(),
        }),
      };
    }),
    get: protectedProcedure.input(caseIdInput.extend({ evidenceItemId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return requireOwnedRecord(await getEvidenceItemForCase(ctx.user.id, input.caseId, input.evidenceItemId), "Evidence item");
    }),
  }),
  excerpts: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listSourceExcerptsForCase(ctx.user.id, input.caseId);
    }),
    create: protectedProcedure.input(excerptInput).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      if (input.sourceRecordId) await requireOwnedSource(ctx.user.id, input.caseId, input.sourceRecordId);
      if (input.evidenceItemId) await requireOwnedRecord(await getEvidenceItemForCase(ctx.user.id, input.caseId, input.evidenceItemId), "Evidence item");
      return { id: await createSourceExcerptForCase(ctx.user.id, input.caseId, input) };
    }),
  }),
  citations: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listCitationsForCase(ctx.user.id, input.caseId);
    }),
    create: protectedProcedure.input(citationInput).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      if (input.targetType === "EVIDENCE_ROW") await requireOwnedRecord(await getEvidenceForCase(ctx.user.id, input.caseId, input.targetId), "Evidence row");
      if (input.targetType === "TIMELINE_EVENT") await requireOwnedRecord(await getChronologyForCase(ctx.user.id, input.caseId, input.targetId), "Timeline event");
      if (input.targetType === "MOTION_DRAFT") {
        const draft = requireOwnedRecord(await getMotionDraftForUser(ctx.user.id, input.targetId), "Motion draft");
        if (draft.caseId !== input.caseId) throw new TRPCError({ code: "FORBIDDEN", message: "Motion draft is outside the current private case." });
      }
      if (input.sourceRecordId) await requireOwnedSource(ctx.user.id, input.caseId, input.sourceRecordId);
      if (input.excerptId) await requireOwnedRecord(await getSourceExcerptForCase(ctx.user.id, input.caseId, input.excerptId), "Source excerpt");
      return { id: await createCitationForCase(ctx.user.id, input.caseId, input) };
    }),
  }),
  evidence: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listEvidenceForCase(ctx.user.id, input.caseId);
    }),
    create: protectedProcedure.input(caseIdInput.extend({
      proposition: z.string().trim().min(1).max(10000),
      confidenceStatus: confidenceStatusSchema,
      sourceIds: z.string().trim().min(1).max(5000),
      supportingMaterial: z.string().trim().min(1).max(10000),
      adverseMaterial: z.string().trim().min(1).max(10000),
      primaryRecordNeeded: z.string().trim().min(1).max(10000),
      nextAction: z.string().trim().min(1).max(5000),
    })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return { id: await createEvidenceForCase(ctx.user.id, input.caseId, input) };
    }),
    update: protectedProcedure.input(caseIdInput.extend({ evidenceId: z.number().int().positive(), nextAction: z.string().trim().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
      await requireOwnedRecord(await getEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId), "Evidence row");
      await updateEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId, { nextAction: input.nextAction });
      return { success: true };
    }),
    remove: protectedProcedure.input(caseIdInput.extend({ evidenceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireOwnedRecord(await getEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId), "Evidence row");
      await deleteEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId);
      return { success: true };
    }),
    restore: protectedProcedure.input(caseIdInput.extend({ evidenceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      await restoreEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId);
      return { success: true };
    }),
  }),
  chronology: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listChronologyForCase(ctx.user.id, input.caseId);
    }),
    create: protectedProcedure.input(caseIdInput.extend({
      dateText: z.string().trim().min(1).max(160),
      sortDate: z.string().datetime().nullable(),
      eventDescription: z.string().trim().min(1).max(10000),
      sourceIds: z.string().trim().min(1).max(5000),
      confidenceStatus: confidenceStatusSchema,
      validationRecordNeeded: z.string().trim().min(1).max(10000),
      nextAction: z.string().trim().min(1).max(5000),
    })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return { id: await createChronologyForCase(ctx.user.id, input.caseId, { ...input, sortDate: input.sortDate ? new Date(input.sortDate) : null }) };
    }),
    update: protectedProcedure.input(caseIdInput.extend({ eventId: z.number().int().positive(), nextAction: z.string().trim().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
      await requireOwnedRecord(await getChronologyForCase(ctx.user.id, input.caseId, input.eventId), "Timeline event");
      await updateChronologyForCase(ctx.user.id, input.caseId, input.eventId, { nextAction: input.nextAction });
      return { success: true };
    }),
    remove: protectedProcedure.input(caseIdInput.extend({ eventId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireOwnedRecord(await getChronologyForCase(ctx.user.id, input.caseId, input.eventId), "Timeline event");
      await deleteChronologyForCase(ctx.user.id, input.caseId, input.eventId);
      return { success: true };
    }),
    restore: protectedProcedure.input(caseIdInput.extend({ eventId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      await restoreChronologyForCase(ctx.user.id, input.caseId, input.eventId);
      return { success: true };
    }),
  }),
  acquisition: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listAcquisitionForCase(ctx.user.id, input.caseId);
    }),
    create: protectedProcedure.input(caseIdInput.extend({
      itemName: z.string().trim().min(1).max(255),
      priority: z.enum(acquisitionPriorities),
      primaryRecordNeeded: z.string().trim().min(1).max(10000),
      purpose: z.string().trim().min(1).max(10000),
      sourceIds: z.string().trim().min(1).max(5000),
      nextAction: z.string().trim().min(1).max(5000),
    })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return { id: await createAcquisitionForCase(ctx.user.id, input.caseId, { ...input, status: "OPEN" }) };
    }),
    update: protectedProcedure.input(caseIdInput.extend({ itemId: z.number().int().positive(), nextAction: z.string().trim().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
      await requireOwnedRecord(await getAcquisitionForCase(ctx.user.id, input.caseId, input.itemId), "Record-acquisition item");
      await updateAcquisitionForCase(ctx.user.id, input.caseId, input.itemId, { nextAction: input.nextAction });
      return { success: true };
    }),
    remove: protectedProcedure.input(caseIdInput.extend({ itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireOwnedRecord(await getAcquisitionForCase(ctx.user.id, input.caseId, input.itemId), "Record-acquisition item");
      await deleteAcquisitionForCase(ctx.user.id, input.caseId, input.itemId);
      return { success: true };
    }),
    restore: protectedProcedure.input(caseIdInput.extend({ itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      await restoreAcquisitionForCase(ctx.user.id, input.caseId, input.itemId);
      return { success: true };
    }),
  }),
  audit: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listRevisionEventsForCase(ctx.user.id, input.caseId);
    }),
  }),
  motion: router({
    entitlement: protectedProcedure.query(async ({ ctx }) => {
      const entitlement = await getEntitlementForUser(ctx.user.id);
      return { allowed: hasActiveMotionDraftingEntitlement(entitlement), entitlement: entitlement ?? null };
    }),
    createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      const priceId = process.env.MOTION_DRAFTING_PRICE_ID;
      if (!priceId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paid plan price is not configured yet." });
      const origin = ctx.req.headers.origin;
      if (!origin) throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout must start from the workspace." });
      const session = await getStripeClient().checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email ?? undefined,
        metadata: { user_id: ctx.user.id.toString(), customer_email: ctx.user.email ?? "", customer_name: ctx.user.name ?? "" },
        subscription_data: { metadata: { user_id: ctx.user.id.toString() } },
        success_url: `${origin}/?checkout=success`,
        cancel_url: `${origin}/?checkout=cancelled`,
      });
      if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Checkout session did not provide a URL." });
      return { url: session.url };
    }),
    createPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const entitlement = await getEntitlementForUser(ctx.user.id);
      if (!entitlement?.stripeCustomerId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No Stripe customer record is available for this workspace." });
      const origin = ctx.req.headers.origin;
      if (!origin) throw new TRPCError({ code: "BAD_REQUEST", message: "Subscription management must start from the workspace." });
      const portal = await getStripeClient().billingPortal.sessions.create({ customer: entitlement.stripeCustomerId, return_url: `${origin}/` });
      return { url: portal.url };
    }),
    createDraft: protectedProcedure.input(caseIdInput.extend({
      motionType: z.string().trim().min(1).max(255),
      requestedRelief: z.string().trim().min(1).max(10000),
      evidenceIds: z.array(z.number().int().positive()).min(1),
    })).mutation(async ({ ctx, input }) => {
      const entitlement = await getEntitlementForUser(ctx.user.id);
      if (!hasActiveMotionDraftingEntitlement(entitlement)) throw new TRPCError({ code: "FORBIDDEN", message: "ACTIVE_SUBSCRIPTION_REQUIRED" });
      const caseRecord = await requireOwnedCase(ctx.user.id, input.caseId);
      const evidence = (await listEvidenceForCase(ctx.user.id, input.caseId)).filter(row => input.evidenceIds.includes(row.id));
      if (evidence.length !== input.evidenceIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Selected evidence rows are unavailable in this case." });
      const draft = buildSourceLinkedMotionDraft({ caseRecord, motionType: input.motionType, requestedRelief: input.requestedRelief, evidence });
      return {
        id: await createMotionDraftForCase(ctx.user.id, input.caseId, {
          motionType: input.motionType,
          requestedRelief: input.requestedRelief,
          selectedEvidenceIds: JSON.stringify(input.evidenceIds),
          sourceTable: JSON.stringify(draft.sourceTable),
          unresolvedWarnings: JSON.stringify(draft.unresolvedWarnings),
          authorityPlaceholders: JSON.stringify(draft.authorityPlaceholders),
          bodyMarkdown: draft.bodyMarkdown,
        }),
        ...draft,
      };
    }),
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      await requireOwnedCase(ctx.user.id, input.caseId);
      return listMotionDraftsForCase(ctx.user.id, input.caseId);
    }),
    get: protectedProcedure.input(z.object({ draftId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const draft = await getMotionDraftForUser(ctx.user.id, input.draftId);
      if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found in this workspace." });
      return draft;
    }),
  }),
  exports: router({
    caseBundle: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => {
      const caseRecord = await requireOwnedCase(ctx.user.id, input.caseId);
      const [evidence, chronology, acquisitions] = await Promise.all([
        listEvidenceForCase(ctx.user.id, input.caseId),
        listChronologyForCase(ctx.user.id, input.caseId),
        listAcquisitionForCase(ctx.user.id, input.caseId),
      ]);
      return buildCaseExport({ caseRecord, evidence, chronology, acquisitions });
    }),
  }),
});

export type AppRouter = typeof appRouter;
