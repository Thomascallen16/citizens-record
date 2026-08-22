import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  acquisitionItems,
  analyticsEvents,
  caseMembers,
  citations,
  chronologyEvents,
  evidenceItems,
  evidenceRows,
  InsertUser,
  legalCases,
  motionDrafts,
  privacyRequests,
  revisionEvents,
  sourceExcerpts,
  sourceRecords,
  subscriptionEntitlements,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod", "stripeCustomerId"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

async function logRevision(input: {
  userId: number;
  caseId: number;
  actorUserId: number;
  entityType: string;
  entityId: number;
  action: "CREATED" | "UPDATED" | "SOFT_DELETED" | "RESTORED" | "PRIVACY_REQUESTED";
  summary: string;
  changedFields?: string[];
}) {
  const db = await requireDb();
  await db.insert(revisionEvents).values({
    ...input,
    summary: input.summary.slice(0, 500),
    changedFields: input.changedFields?.length ? JSON.stringify(input.changedFields) : null,
  });
}

async function recordAnalyticsEvent(
  userId: number,
  eventName: "START_RECORD" | "RECORD_CREATED" | "SOURCE_ATTACHED" | "RECORD_ACTIVATED" | "RETURN",
  options: { caseId?: number | null; channel: "workspace" | "case_form" | "source_form" | "sample_record" },
) {
  const db = await requireDb();
  const day = new Date().toISOString().slice(0, 10);
  const dedupeKey = eventName === "RETURN"
    ? `return:${userId}:${day}`
    : `${eventName.toLowerCase()}:${userId}:${options.caseId ?? "none"}:${crypto.randomUUID()}`;
  await db.insert(analyticsEvents).values({
    userId,
    caseId: options.caseId ?? null,
    eventName,
    dedupeKey,
    metadata: JSON.stringify({ channel: options.channel }),
  }).onDuplicateKeyUpdate({ set: { dedupeKey } });
}

async function recordActivationIfEligible(userId: number, caseId: number) {
  const db = await requireDb();
  const [sources, evidence, chronology, acquisition] = await Promise.all([
    db.select({ id: sourceRecords.id }).from(sourceRecords).where(and(eq(sourceRecords.userId, userId), eq(sourceRecords.caseId, caseId), isNull(sourceRecords.deletedAt))),
    db.select({ id: evidenceRows.id }).from(evidenceRows).where(and(eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId), isNull(evidenceRows.deletedAt))),
    db.select({ id: chronologyEvents.id }).from(chronologyEvents).where(and(eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId), isNull(chronologyEvents.deletedAt))),
    db.select({ id: acquisitionItems.id }).from(acquisitionItems).where(and(eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId), isNull(acquisitionItems.deletedAt))),
  ]);
  if (sources.length >= 1 && evidence.length + chronology.length + acquisition.length >= 2) {
    const existing = await db.select({ id: analyticsEvents.id }).from(analyticsEvents).where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.caseId, caseId), eq(analyticsEvents.eventName, "RECORD_ACTIVATED"))).limit(1);
    if (!existing.length) await recordAnalyticsEvent(userId, "RECORD_ACTIVATED", { caseId, channel: "workspace" });
  }
}

export async function listCasesForUser(userId: number) {
  const db = await requireDb();
  return db.select().from(legalCases).where(eq(legalCases.userId, userId)).orderBy(desc(legalCases.updatedAt));
}
export async function getCaseForUser(userId: number, caseId: number) {
  const db = await requireDb();
  return (await db.select().from(legalCases).where(and(eq(legalCases.id, caseId), eq(legalCases.userId, userId))).limit(1))[0];
}
export async function createCaseForUser(userId: number, data: Omit<typeof legalCases.$inferInsert, "userId" | "id" | "createdAt" | "updatedAt">) {
  const db = await requireDb();
  const result = await db.insert(legalCases).values({ ...data, userId });
  const caseId = Number(result[0].insertId);
  await db.insert(caseMembers).values({ caseId, userId, role: "OWNER", status: "ACTIVE" }).onDuplicateKeyUpdate({ set: { role: "OWNER", status: "ACTIVE" } });
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "case", entityId: caseId, action: "CREATED", summary: "Private case workspace created." });
  await recordAnalyticsEvent(userId, "RECORD_CREATED", { caseId, channel: "case_form" });
  return caseId;
}
export async function updateCaseForUser(userId: number, caseId: number, data: Partial<Pick<typeof legalCases.$inferInsert, "caseNumber" | "court" | "caption" | "partyRole" | "isVerified">>) {
  const db = await requireDb();
  await db.update(legalCases).set(data).where(and(eq(legalCases.id, caseId), eq(legalCases.userId, userId)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "case", entityId: caseId, action: "UPDATED", summary: "Case metadata updated.", changedFields: Object.keys(data) });
}

export async function listSourcesForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(sourceRecords).where(and(eq(sourceRecords.userId, userId), eq(sourceRecords.caseId, caseId), isNull(sourceRecords.deletedAt))).orderBy(desc(sourceRecords.updatedAt));
}
export async function getSourceForCase(userId: number, caseId: number, sourceRecordId: number) {
  const db = await requireDb();
  return (await db.select().from(sourceRecords).where(and(eq(sourceRecords.id, sourceRecordId), eq(sourceRecords.userId, userId), eq(sourceRecords.caseId, caseId), isNull(sourceRecords.deletedAt))).limit(1))[0];
}
export async function createSourceForCase(userId: number, caseId: number, data: Omit<typeof sourceRecords.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">) {
  const db = await requireDb();
  const result = await db.insert(sourceRecords).values({ ...data, userId, caseId });
  const sourceId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "source", entityId: sourceId, action: "CREATED", summary: "Source record attached to private workspace." });
  await recordAnalyticsEvent(userId, "SOURCE_ATTACHED", { caseId, channel: "source_form" });
  await recordActivationIfEligible(userId, caseId);
  return sourceId;
}

export async function listEvidenceItemsForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(evidenceItems).where(and(eq(evidenceItems.userId, userId), eq(evidenceItems.caseId, caseId), isNull(evidenceItems.deletedAt))).orderBy(desc(evidenceItems.updatedAt));
}
export async function getEvidenceItemForCase(userId: number, caseId: number, evidenceItemId: number) {
  const db = await requireDb();
  return (await db.select().from(evidenceItems).where(and(eq(evidenceItems.id, evidenceItemId), eq(evidenceItems.userId, userId), eq(evidenceItems.caseId, caseId), isNull(evidenceItems.deletedAt))).limit(1))[0];
}
export async function createEvidenceItemForCase(userId: number, caseId: number, data: Omit<typeof evidenceItems.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt" | "storageKey" | "contentType" | "byteSize" | "sha256">) {
  const db = await requireDb();
  const result = await db.insert(evidenceItems).values({ ...data, userId, caseId, state: "REFERENCE_ONLY", storageKey: null, contentType: null, byteSize: null, sha256: null });
  const itemId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "evidence_item", entityId: itemId, action: "CREATED", summary: "Evidence-item metadata saved; no file was uploaded." });
  return itemId;
}

export async function listSourceExcerptsForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(sourceExcerpts).where(and(eq(sourceExcerpts.userId, userId), eq(sourceExcerpts.caseId, caseId), isNull(sourceExcerpts.deletedAt))).orderBy(desc(sourceExcerpts.updatedAt));
}
export async function getSourceExcerptForCase(userId: number, caseId: number, excerptId: number) {
  const db = await requireDb();
  return (await db.select().from(sourceExcerpts).where(and(eq(sourceExcerpts.id, excerptId), eq(sourceExcerpts.userId, userId), eq(sourceExcerpts.caseId, caseId), isNull(sourceExcerpts.deletedAt))).limit(1))[0];
}
export async function createSourceExcerptForCase(userId: number, caseId: number, data: Omit<typeof sourceExcerpts.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">) {
  const db = await requireDb();
  const result = await db.insert(sourceExcerpts).values({ ...data, userId, caseId });
  const excerptId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "source_excerpt", entityId: excerptId, action: "CREATED", summary: "Source excerpt saved with pinpoint locator." });
  return excerptId;
}

export async function listEvidenceForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(evidenceRows).where(and(eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId), isNull(evidenceRows.deletedAt))).orderBy(desc(evidenceRows.updatedAt));
}
export async function getEvidenceForCase(userId: number, caseId: number, evidenceId: number) {
  const db = await requireDb();
  return (await db.select().from(evidenceRows).where(and(eq(evidenceRows.id, evidenceId), eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId), isNull(evidenceRows.deletedAt))).limit(1))[0];
}
export async function createEvidenceForCase(userId: number, caseId: number, data: Omit<typeof evidenceRows.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">) {
  const db = await requireDb();
  const result = await db.insert(evidenceRows).values({ ...data, userId, caseId });
  const evidenceId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "evidence_row", entityId: evidenceId, action: "CREATED", summary: "Evidence matrix row created." });
  await recordActivationIfEligible(userId, caseId);
  return evidenceId;
}
export async function updateEvidenceForCase(userId: number, caseId: number, evidenceId: number, data: Partial<Omit<typeof evidenceRows.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">>) {
  const db = await requireDb();
  await db.update(evidenceRows).set(data).where(and(eq(evidenceRows.id, evidenceId), eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId), isNull(evidenceRows.deletedAt)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "evidence_row", entityId: evidenceId, action: "UPDATED", summary: "Evidence matrix row updated.", changedFields: Object.keys(data) });
}
export async function deleteEvidenceForCase(userId: number, caseId: number, evidenceId: number) {
  const db = await requireDb();
  await db.update(evidenceRows).set({ deletedAt: new Date() }).where(and(eq(evidenceRows.id, evidenceId), eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId), isNull(evidenceRows.deletedAt)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "evidence_row", entityId: evidenceId, action: "SOFT_DELETED", summary: "Evidence matrix row moved to recovery history." });
}
export async function restoreEvidenceForCase(userId: number, caseId: number, evidenceId: number) {
  const db = await requireDb();
  await db.update(evidenceRows).set({ deletedAt: null }).where(and(eq(evidenceRows.id, evidenceId), eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "evidence_row", entityId: evidenceId, action: "RESTORED", summary: "Evidence matrix row restored from recovery history." });
}

export async function listChronologyForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(chronologyEvents).where(and(eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId), isNull(chronologyEvents.deletedAt))).orderBy(asc(chronologyEvents.sortDate), asc(chronologyEvents.id));
}
export async function getChronologyForCase(userId: number, caseId: number, eventId: number) {
  const db = await requireDb();
  return (await db.select().from(chronologyEvents).where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId), isNull(chronologyEvents.deletedAt))).limit(1))[0];
}
export async function createChronologyForCase(userId: number, caseId: number, data: Omit<typeof chronologyEvents.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">) {
  const db = await requireDb();
  const result = await db.insert(chronologyEvents).values({ ...data, userId, caseId });
  const eventId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "timeline_event", entityId: eventId, action: "CREATED", summary: "Chronology event created." });
  await recordActivationIfEligible(userId, caseId);
  return eventId;
}
export async function updateChronologyForCase(userId: number, caseId: number, eventId: number, data: Partial<Omit<typeof chronologyEvents.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">>) {
  const db = await requireDb();
  await db.update(chronologyEvents).set(data).where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId), isNull(chronologyEvents.deletedAt)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "timeline_event", entityId: eventId, action: "UPDATED", summary: "Chronology event updated.", changedFields: Object.keys(data) });
}
export async function deleteChronologyForCase(userId: number, caseId: number, eventId: number) {
  const db = await requireDb();
  await db.update(chronologyEvents).set({ deletedAt: new Date() }).where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId), isNull(chronologyEvents.deletedAt)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "timeline_event", entityId: eventId, action: "SOFT_DELETED", summary: "Chronology event moved to recovery history." });
}
export async function restoreChronologyForCase(userId: number, caseId: number, eventId: number) {
  const db = await requireDb();
  await db.update(chronologyEvents).set({ deletedAt: null }).where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "timeline_event", entityId: eventId, action: "RESTORED", summary: "Chronology event restored from recovery history." });
}

export async function listCitationsForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(citations).where(and(eq(citations.userId, userId), eq(citations.caseId, caseId), isNull(citations.deletedAt))).orderBy(desc(citations.updatedAt));
}
export async function createCitationForCase(userId: number, caseId: number, data: Omit<typeof citations.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">) {
  const db = await requireDb();
  const result = await db.insert(citations).values({ ...data, userId, caseId });
  const citationId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "citation", entityId: citationId, action: "CREATED", summary: "Pinpoint citation created." });
  return citationId;
}

export async function listAcquisitionForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(acquisitionItems).where(and(eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId), isNull(acquisitionItems.deletedAt))).orderBy(asc(acquisitionItems.priority), desc(acquisitionItems.updatedAt));
}
export async function getAcquisitionForCase(userId: number, caseId: number, itemId: number) {
  const db = await requireDb();
  return (await db.select().from(acquisitionItems).where(and(eq(acquisitionItems.id, itemId), eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId), isNull(acquisitionItems.deletedAt))).limit(1))[0];
}
export async function createAcquisitionForCase(userId: number, caseId: number, data: Omit<typeof acquisitionItems.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">) {
  const db = await requireDb();
  const result = await db.insert(acquisitionItems).values({ ...data, userId, caseId });
  const itemId = Number(result[0].insertId);
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "acquisition_item", entityId: itemId, action: "CREATED", summary: "Record-acquisition item created." });
  await recordActivationIfEligible(userId, caseId);
  return itemId;
}
export async function updateAcquisitionForCase(userId: number, caseId: number, itemId: number, data: Partial<Omit<typeof acquisitionItems.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt" | "deletedAt">>) {
  const db = await requireDb();
  await db.update(acquisitionItems).set(data).where(and(eq(acquisitionItems.id, itemId), eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId), isNull(acquisitionItems.deletedAt)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "acquisition_item", entityId: itemId, action: "UPDATED", summary: "Record-acquisition item updated.", changedFields: Object.keys(data) });
}
export async function deleteAcquisitionForCase(userId: number, caseId: number, itemId: number) {
  const db = await requireDb();
  await db.update(acquisitionItems).set({ deletedAt: new Date() }).where(and(eq(acquisitionItems.id, itemId), eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId), isNull(acquisitionItems.deletedAt)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "acquisition_item", entityId: itemId, action: "SOFT_DELETED", summary: "Record-acquisition item moved to recovery history." });
}
export async function restoreAcquisitionForCase(userId: number, caseId: number, itemId: number) {
  const db = await requireDb();
  await db.update(acquisitionItems).set({ deletedAt: null }).where(and(eq(acquisitionItems.id, itemId), eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId)));
  await logRevision({ userId, caseId, actorUserId: userId, entityType: "acquisition_item", entityId: itemId, action: "RESTORED", summary: "Record-acquisition item restored from recovery history." });
}

export async function listRevisionEventsForCase(userId: number, caseId: number) {
  const db = await requireDb();
  return db.select().from(revisionEvents).where(and(eq(revisionEvents.userId, userId), eq(revisionEvents.caseId, caseId))).orderBy(desc(revisionEvents.occurredAt)).limit(100);
}

export async function acknowledgePrivacyNoticeForUser(userId: number, version: string) {
  const db = await requireDb();
  await db.update(users).set({ privacyNoticeVersion: version, privacyNoticeAcknowledgedAt: new Date() }).where(eq(users.id, userId));
}
export async function getPrivacyStatusForUser(userId: number) {
  const db = await requireDb();
  return (await db.select({ privacyNoticeVersion: users.privacyNoticeVersion, privacyNoticeAcknowledgedAt: users.privacyNoticeAcknowledgedAt }).from(users).where(eq(users.id, userId)).limit(1))[0];
}
export async function createPrivacyRequestForUser(userId: number, data: Omit<typeof privacyRequests.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt" | "resolvedAt" | "status">) {
  const db = await requireDb();
  const result = await db.insert(privacyRequests).values({ ...data, userId, status: "OPEN", resolvedAt: null });
  if (data.caseId) await logRevision({ userId, caseId: data.caseId, actorUserId: userId, entityType: "privacy_request", entityId: Number(result[0].insertId), action: "PRIVACY_REQUESTED", summary: "Privacy, correction, or takedown request opened." });
  return Number(result[0].insertId);
}
export async function listPrivacyRequestsForUser(userId: number) {
  const db = await requireDb();
  return db.select().from(privacyRequests).where(eq(privacyRequests.userId, userId)).orderBy(desc(privacyRequests.updatedAt));
}

export async function trackAnalyticsForUser(userId: number, eventName: "START_RECORD" | "RETURN", channel: "workspace" | "case_form" | "source_form" | "sample_record") {
  await recordAnalyticsEvent(userId, eventName, { channel });
}

export async function createSafeSampleCaseForUser(userId: number) {
  const existing = (await listCasesForUser(userId)).find(item => item.caseNumber === "SAMPLE-TRAINING-2026");
  if (existing) return { id: existing.id, created: false };
  const caseId = await createCaseForUser(userId, {
    caseNumber: "SAMPLE-TRAINING-2026",
    court: "Training records workspace — no court filing",
    caption: "Sample agency notice record — training only",
    partyRole: "Research demonstration",
    isVerified: false,
  });
  const sourceId = await createSourceForCase(userId, caseId, {
    sourceId: "S-TRAIN-001",
    title: "Fictional training agency notice",
    recordType: "Training document",
    origin: "Sample materials only",
    location: "https://example.gov/training-notice",
    documentDate: "2026-01-15",
    provenanceNote: "Clearly fictional, low-risk example used only to test the private workspace flow. It is not a public record or legal matter.",
  });
  const itemId = await createEvidenceItemForCase(userId, caseId, {
    sourceRecordId: sourceId,
    itemId: "EI-TRAIN-001",
    title: "Training notice reference",
    kind: "DOCUMENT",
    state: "REFERENCE_ONLY",
    sensitivity: "STANDARD",
    externalReference: "https://example.gov/training-notice",
    provenanceNote: "Reference-only training item. No file uploaded.",
    safetyAcknowledgedAt: new Date(),
  });
  await createSourceExcerptForCase(userId, caseId, {
    sourceRecordId: sourceId,
    evidenceItemId: itemId,
    label: "Training excerpt",
    excerptText: "The fictional agency will publish a training notice and supporting materials.",
    locator: "Training page 1",
    confidenceStatus: "USER-REPORTED",
    isRedacted: false,
  });
  await createEvidenceForCase(userId, caseId, {
    proposition: "What action does the training notice describe?",
    confidenceStatus: "VERIFY",
    sourceIds: "S-TRAIN-001",
    supportingMaterial: "The fictional training notice describes publication of a notice and supporting materials.",
    adverseMaterial: "This is a fictional training item and cannot establish a real agency action.",
    primaryRecordNeeded: "A real official notice would be required for any real-world conclusion.",
    nextAction: "Use this sample only to practice source, evidence, and unknown labeling.",
  });
  await createChronologyForCase(userId, caseId, {
    dateText: "January 15, 2026",
    sortDate: new Date("2026-01-15T00:00:00.000Z"),
    eventDescription: "Fictional training notice date.",
    sourceIds: "S-TRAIN-001",
    confidenceStatus: "USER-REPORTED",
    validationRecordNeeded: "No validation is available because this is a demonstration record.",
    nextAction: "Do not treat the sample as an actual event.",
  });
  await createAcquisitionForCase(userId, caseId, {
    itemName: "Real primary record (not included)",
    priority: "Low",
    primaryRecordNeeded: "Official public notice, if this were a real matter.",
    purpose: "Demonstrates how unknowns and acquisition paths remain visible.",
    sourceIds: "S-TRAIN-001",
    nextAction: "No action required; this is a training-only record.",
    status: "CLOSED",
  });
  await recordAnalyticsEvent(userId, "START_RECORD", { caseId, channel: "sample_record" });
  return { id: caseId, created: true };
}

export async function getEntitlementForUser(userId: number) { const db = await requireDb(); return (await db.select().from(subscriptionEntitlements).where(eq(subscriptionEntitlements.userId, userId)).limit(1))[0]; }
export async function getEntitlementBySubscriptionId(stripeSubscriptionId: string) { const db = await requireDb(); return (await db.select().from(subscriptionEntitlements).where(eq(subscriptionEntitlements.stripeSubscriptionId, stripeSubscriptionId)).limit(1))[0]; }
export async function updateEntitlementFromStripe(data: { userId: number; stripeCustomerId: string | null; stripeSubscriptionId: string | null; stripePriceId: string | null; status: "inactive" | "active" | "past_due" | "canceled"; currentPeriodEnd: Date | null; }) { const db = await requireDb(); await db.insert(subscriptionEntitlements).values(data).onDuplicateKeyUpdate({ set: data }); if (data.stripeCustomerId) await db.update(users).set({ stripeCustomerId: data.stripeCustomerId }).where(eq(users.id, data.userId)); }
export async function createMotionDraftForCase(userId: number, caseId: number, data: Omit<typeof motionDrafts.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(motionDrafts).values({ ...data, userId, caseId }); return Number(result[0].insertId); }
export async function getMotionDraftForUser(userId: number, draftId: number) { const db = await requireDb(); return (await db.select().from(motionDrafts).where(and(eq(motionDrafts.id, draftId), eq(motionDrafts.userId, userId))).limit(1))[0]; }
export async function listMotionDraftsForCase(userId: number, caseId: number) { const db = await requireDb(); return db.select().from(motionDrafts).where(and(eq(motionDrafts.userId, userId), eq(motionDrafts.caseId, caseId))).orderBy(desc(motionDrafts.updatedAt)); }
