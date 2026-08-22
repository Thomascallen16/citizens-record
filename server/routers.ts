import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { acquisitionPriorities, confidenceStatuses } from "../drizzle/schema";
import { createAcquisitionForCase, createCaseForUser, createChronologyForCase, createEvidenceForCase, createMotionDraftForCase, createSourceForCase, deleteAcquisitionForCase, deleteChronologyForCase, deleteEvidenceForCase, getCaseForUser, getEntitlementForUser, getMotionDraftForUser, listAcquisitionForCase, listCasesForUser, listChronologyForCase, listEvidenceForCase, listMotionDraftsForCase, listSourcesForCase, updateAcquisitionForCase, updateCaseForUser, updateChronologyForCase, updateEvidenceForCase } from "./db";
import { buildSourceLinkedMotionDraft } from "./legalDraft";
import { hasActiveMotionDraftingEntitlement } from "./entitlements";
import { buildCaseExport } from "./caseExports";
import { requireOwnedRecord } from "./ownership";
import { getStripeClient } from "./stripe";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const confidenceStatusSchema = z.enum(confidenceStatuses);
const caseInput = z.object({ caseNumber: z.string().trim().min(1).max(160), court: z.string().trim().min(1).max(255), caption: z.string().trim().min(1), partyRole: z.string().trim().min(1).max(160), isVerified: z.boolean() });
const caseIdInput = z.object({ caseId: z.number().int().positive() });
async function requireOwnedCase(userId: number, caseId: number) { return requireOwnedRecord(await getCaseForUser(userId, caseId), "Case"); }

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }) }),
  cases: router({
    list: protectedProcedure.query(({ ctx }) => listCasesForUser(ctx.user.id)),
    create: protectedProcedure.input(caseInput).mutation(async ({ ctx, input }) => ({ id: await createCaseForUser(ctx.user.id, input) })),
    update: protectedProcedure.input(caseIdInput.merge(caseInput)).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await updateCaseForUser(ctx.user.id, input.caseId, input); return { success: true }; }),
  }),
  sources: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return listSourcesForCase(ctx.user.id, input.caseId); }),
    create: protectedProcedure.input(caseIdInput.extend({ sourceId: z.string().trim().min(1).max(80), title: z.string().trim().min(1).max(255), recordType: z.string().trim().min(1).max(120), origin: z.string().trim().min(1).max(255), location: z.string().trim().min(1), documentDate: z.string().trim().max(160).nullable(), provenanceNote: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return { id: await createSourceForCase(ctx.user.id, input.caseId, input) }; }),
  }),
  evidence: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return listEvidenceForCase(ctx.user.id, input.caseId); }),
    create: protectedProcedure.input(caseIdInput.extend({ proposition: z.string().trim().min(1), confidenceStatus: confidenceStatusSchema, sourceIds: z.string().trim().min(1), supportingMaterial: z.string().trim().min(1), adverseMaterial: z.string().trim().min(1), primaryRecordNeeded: z.string().trim().min(1), nextAction: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return { id: await createEvidenceForCase(ctx.user.id, input.caseId, input) }; }),
    update: protectedProcedure.input(caseIdInput.extend({ evidenceId: z.number().int().positive(), nextAction: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await updateEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId, { nextAction: input.nextAction }); return { success: true }; }),
    remove: protectedProcedure.input(caseIdInput.extend({ evidenceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await deleteEvidenceForCase(ctx.user.id, input.caseId, input.evidenceId); return { success: true }; }),
  }),
  chronology: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return listChronologyForCase(ctx.user.id, input.caseId); }),
    create: protectedProcedure.input(caseIdInput.extend({ dateText: z.string().trim().min(1).max(160), sortDate: z.string().datetime().nullable(), eventDescription: z.string().trim().min(1), sourceIds: z.string().trim().min(1), confidenceStatus: confidenceStatusSchema, validationRecordNeeded: z.string().trim().min(1), nextAction: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return { id: await createChronologyForCase(ctx.user.id, input.caseId, { ...input, sortDate: input.sortDate ? new Date(input.sortDate) : null }) }; }),
    update: protectedProcedure.input(caseIdInput.extend({ eventId: z.number().int().positive(), nextAction: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await updateChronologyForCase(ctx.user.id, input.caseId, input.eventId, { nextAction: input.nextAction }); return { success: true }; }),
    remove: protectedProcedure.input(caseIdInput.extend({ eventId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await deleteChronologyForCase(ctx.user.id, input.caseId, input.eventId); return { success: true }; }),
  }),
  acquisition: router({
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return listAcquisitionForCase(ctx.user.id, input.caseId); }),
    create: protectedProcedure.input(caseIdInput.extend({ itemName: z.string().trim().min(1).max(255), priority: z.enum(acquisitionPriorities), primaryRecordNeeded: z.string().trim().min(1), purpose: z.string().trim().min(1), sourceIds: z.string().trim().min(1), nextAction: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return { id: await createAcquisitionForCase(ctx.user.id, input.caseId, { ...input, status: "OPEN" }) }; }),
    update: protectedProcedure.input(caseIdInput.extend({ itemId: z.number().int().positive(), nextAction: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await updateAcquisitionForCase(ctx.user.id, input.caseId, input.itemId, { nextAction: input.nextAction }); return { success: true }; }),
    remove: protectedProcedure.input(caseIdInput.extend({ itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); await deleteAcquisitionForCase(ctx.user.id, input.caseId, input.itemId); return { success: true }; }),
  }),
  motion: router({
    entitlement: protectedProcedure.query(async ({ ctx }) => { const entitlement = await getEntitlementForUser(ctx.user.id); return { allowed: hasActiveMotionDraftingEntitlement(entitlement), entitlement: entitlement ?? null }; }),
    createCheckout: protectedProcedure.mutation(async ({ ctx }) => { const priceId = process.env.MOTION_DRAFTING_PRICE_ID; if (!priceId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paid plan price is not configured yet." }); const origin = ctx.req.headers.origin; if (!origin) throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout must start from the workspace." }); const session = await getStripeClient().checkout.sessions.create({ mode: "subscription", line_items: [{ price: priceId, quantity: 1 }], allow_promotion_codes: true, client_reference_id: ctx.user.id.toString(), customer_email: ctx.user.email ?? undefined, metadata: { user_id: ctx.user.id.toString(), customer_email: ctx.user.email ?? "", customer_name: ctx.user.name ?? "" }, subscription_data: { metadata: { user_id: ctx.user.id.toString() } }, success_url: `${origin}/?checkout=success`, cancel_url: `${origin}/?checkout=cancelled` }); if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Checkout session did not provide a URL." }); return { url: session.url }; }),
    createPortal: protectedProcedure.mutation(async ({ ctx }) => { const entitlement = await getEntitlementForUser(ctx.user.id); if (!entitlement?.stripeCustomerId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No Stripe customer record is available for this workspace." }); const origin = ctx.req.headers.origin; if (!origin) throw new TRPCError({ code: "BAD_REQUEST", message: "Subscription management must start from the workspace." }); const portal = await getStripeClient().billingPortal.sessions.create({ customer: entitlement.stripeCustomerId, return_url: `${origin}/` }); return { url: portal.url }; }),
    createDraft: protectedProcedure.input(caseIdInput.extend({ motionType: z.string().trim().min(1).max(255), requestedRelief: z.string().trim().min(1), evidenceIds: z.array(z.number().int().positive()).min(1) })).mutation(async ({ ctx, input }) => { const entitlement = await getEntitlementForUser(ctx.user.id); if (!hasActiveMotionDraftingEntitlement(entitlement)) throw new TRPCError({ code: "FORBIDDEN", message: "ACTIVE_SUBSCRIPTION_REQUIRED" }); const caseRecord = await requireOwnedCase(ctx.user.id, input.caseId); const evidence = (await listEvidenceForCase(ctx.user.id, input.caseId)).filter(row => input.evidenceIds.includes(row.id)); if (evidence.length !== input.evidenceIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Selected evidence rows are unavailable in this case." }); const draft = buildSourceLinkedMotionDraft({ caseRecord, motionType: input.motionType, requestedRelief: input.requestedRelief, evidence }); return { id: await createMotionDraftForCase(ctx.user.id, input.caseId, { motionType: input.motionType, requestedRelief: input.requestedRelief, selectedEvidenceIds: JSON.stringify(input.evidenceIds), sourceTable: JSON.stringify(draft.sourceTable), unresolvedWarnings: JSON.stringify(draft.unresolvedWarnings), authorityPlaceholders: JSON.stringify(draft.authorityPlaceholders), bodyMarkdown: draft.bodyMarkdown }), ...draft }; }),
    list: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => { await requireOwnedCase(ctx.user.id, input.caseId); return listMotionDraftsForCase(ctx.user.id, input.caseId); }),
    get: protectedProcedure.input(z.object({ draftId: z.number().int().positive() })).query(async ({ ctx, input }) => { const draft = await getMotionDraftForUser(ctx.user.id, input.draftId); if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found in this workspace." }); return draft; }),
  }),
  exports: router({
    caseBundle: protectedProcedure.input(caseIdInput).query(async ({ ctx, input }) => { const caseRecord = await requireOwnedCase(ctx.user.id, input.caseId); const [evidence, chronology, acquisitions] = await Promise.all([listEvidenceForCase(ctx.user.id, input.caseId), listChronologyForCase(ctx.user.id, input.caseId), listAcquisitionForCase(ctx.user.id, input.caseId)]); return buildCaseExport({ caseRecord, evidence, chronology, acquisitions }); }),
  }),
});

export type AppRouter = typeof appRouter;
