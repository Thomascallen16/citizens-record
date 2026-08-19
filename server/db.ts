import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { acquisitionItems, chronologyEvents, evidenceRows, InsertUser, legalCases, motionDrafts, sourceRecords, subscriptionEntitlements, users } from "../drizzle/schema";
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

export async function listCasesForUser(userId: number) { const db = await requireDb(); return db.select().from(legalCases).where(eq(legalCases.userId, userId)).orderBy(desc(legalCases.updatedAt)); }
export async function getCaseForUser(userId: number, caseId: number) { const db = await requireDb(); return (await db.select().from(legalCases).where(and(eq(legalCases.id, caseId), eq(legalCases.userId, userId))).limit(1))[0]; }
export async function createCaseForUser(userId: number, data: Omit<typeof legalCases.$inferInsert, "userId" | "id" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(legalCases).values({ ...data, userId }); return Number(result[0].insertId); }
export async function updateCaseForUser(userId: number, caseId: number, data: Partial<Pick<typeof legalCases.$inferInsert, "caseNumber" | "court" | "caption" | "partyRole" | "isVerified">>) { const db = await requireDb(); await db.update(legalCases).set(data).where(and(eq(legalCases.id, caseId), eq(legalCases.userId, userId))); }
export async function listSourcesForCase(userId: number, caseId: number) { const db = await requireDb(); return db.select().from(sourceRecords).where(and(eq(sourceRecords.userId, userId), eq(sourceRecords.caseId, caseId))).orderBy(desc(sourceRecords.updatedAt)); }
export async function createSourceForCase(userId: number, caseId: number, data: Omit<typeof sourceRecords.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(sourceRecords).values({ ...data, userId, caseId }); return Number(result[0].insertId); }
export async function listEvidenceForCase(userId: number, caseId: number) { const db = await requireDb(); return db.select().from(evidenceRows).where(and(eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId))).orderBy(desc(evidenceRows.updatedAt)); }
export async function createEvidenceForCase(userId: number, caseId: number, data: Omit<typeof evidenceRows.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(evidenceRows).values({ ...data, userId, caseId }); return Number(result[0].insertId); }
export async function updateEvidenceForCase(userId: number, caseId: number, evidenceId: number, data: Partial<Omit<typeof evidenceRows.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">>) { const db = await requireDb(); await db.update(evidenceRows).set(data).where(and(eq(evidenceRows.id, evidenceId), eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId))); }
export async function deleteEvidenceForCase(userId: number, caseId: number, evidenceId: number) { const db = await requireDb(); await db.delete(evidenceRows).where(and(eq(evidenceRows.id, evidenceId), eq(evidenceRows.userId, userId), eq(evidenceRows.caseId, caseId))); }
export async function listChronologyForCase(userId: number, caseId: number) { const db = await requireDb(); return db.select().from(chronologyEvents).where(and(eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId))).orderBy(asc(chronologyEvents.sortDate), asc(chronologyEvents.id)); }
export async function createChronologyForCase(userId: number, caseId: number, data: Omit<typeof chronologyEvents.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(chronologyEvents).values({ ...data, userId, caseId }); return Number(result[0].insertId); }
export async function updateChronologyForCase(userId: number, caseId: number, eventId: number, data: Partial<Omit<typeof chronologyEvents.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">>) { const db = await requireDb(); await db.update(chronologyEvents).set(data).where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId))); }
export async function deleteChronologyForCase(userId: number, caseId: number, eventId: number) { const db = await requireDb(); await db.delete(chronologyEvents).where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.userId, userId), eq(chronologyEvents.caseId, caseId))); }
export async function listAcquisitionForCase(userId: number, caseId: number) { const db = await requireDb(); return db.select().from(acquisitionItems).where(and(eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId))).orderBy(asc(acquisitionItems.priority), desc(acquisitionItems.updatedAt)); }
export async function createAcquisitionForCase(userId: number, caseId: number, data: Omit<typeof acquisitionItems.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(acquisitionItems).values({ ...data, userId, caseId }); return Number(result[0].insertId); }
export async function updateAcquisitionForCase(userId: number, caseId: number, itemId: number, data: Partial<Omit<typeof acquisitionItems.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">>) { const db = await requireDb(); await db.update(acquisitionItems).set(data).where(and(eq(acquisitionItems.id, itemId), eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId))); }
export async function deleteAcquisitionForCase(userId: number, caseId: number, itemId: number) { const db = await requireDb(); await db.delete(acquisitionItems).where(and(eq(acquisitionItems.id, itemId), eq(acquisitionItems.userId, userId), eq(acquisitionItems.caseId, caseId))); }
export async function getEntitlementForUser(userId: number) { const db = await requireDb(); return (await db.select().from(subscriptionEntitlements).where(eq(subscriptionEntitlements.userId, userId)).limit(1))[0]; }
export async function getEntitlementBySubscriptionId(stripeSubscriptionId: string) { const db = await requireDb(); return (await db.select().from(subscriptionEntitlements).where(eq(subscriptionEntitlements.stripeSubscriptionId, stripeSubscriptionId)).limit(1))[0]; }
export async function updateEntitlementFromStripe(data: { userId: number; stripeCustomerId: string | null; stripeSubscriptionId: string | null; stripePriceId: string | null; status: "inactive" | "active" | "past_due" | "canceled"; currentPeriodEnd: Date | null; }) { const db = await requireDb(); await db.insert(subscriptionEntitlements).values(data).onDuplicateKeyUpdate({ set: data }); if (data.stripeCustomerId) await db.update(users).set({ stripeCustomerId: data.stripeCustomerId }).where(eq(users.id, data.userId)); }
export async function createMotionDraftForCase(userId: number, caseId: number, data: Omit<typeof motionDrafts.$inferInsert, "id" | "userId" | "caseId" | "createdAt" | "updatedAt">) { const db = await requireDb(); const result = await db.insert(motionDrafts).values({ ...data, userId, caseId }); return Number(result[0].insertId); }
export async function getMotionDraftForUser(userId: number, draftId: number) { const db = await requireDb(); return (await db.select().from(motionDrafts).where(and(eq(motionDrafts.id, draftId), eq(motionDrafts.userId, userId))).limit(1))[0]; }
export async function listMotionDraftsForCase(userId: number, caseId: number) { const db = await requireDb(); return db.select().from(motionDrafts).where(and(eq(motionDrafts.userId, userId), eq(motionDrafts.caseId, caseId))).orderBy(desc(motionDrafts.updatedAt)); }
