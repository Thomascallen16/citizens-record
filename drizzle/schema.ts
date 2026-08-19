import { boolean, foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const confidenceStatuses = ["PRIMARY-RECORD", "USER-REPORTED", "VERIFY", "SOURCE-UNAVAILABLE", "CONFLICTING"] as const;
export const acquisitionPriorities = ["Critical", "High", "Medium", "Low"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const legalCases = mysqlTable("legal_cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseNumber: varchar("caseNumber", { length: 160 }).notNull(),
  court: varchar("court", { length: 255 }).notNull(),
  caption: text("caption").notNull(),
  partyRole: varchar("partyRole", { length: 160 }).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerIdx: index("legal_cases_owner_idx").on(table.userId),
  ownerCaseIdx: uniqueIndex("legal_cases_owner_case_idx").on(table.userId, table.caseNumber),
  ownerIdIdx: uniqueIndex("legal_cases_owner_id_idx").on(table.userId, table.id),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "legal_cases_user_fk" }).onDelete("cascade"),
}));

export const sourceRecords = mysqlTable("source_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  sourceId: varchar("sourceId", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  recordType: varchar("recordType", { length: 120 }).notNull(),
  origin: varchar("origin", { length: 255 }).notNull(),
  location: text("location").notNull(),
  documentDate: varchar("documentDate", { length: 160 }),
  provenanceNote: text("provenanceNote").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseSourceIdx: uniqueIndex("source_records_owner_case_source_idx").on(table.userId, table.caseId, table.sourceId),
  ownerCaseIdx: index("source_records_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "source_records_owner_case_fk" }).onDelete("cascade"),
}));

export const evidenceRows = mysqlTable("evidence_rows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  proposition: text("proposition").notNull(),
  confidenceStatus: mysqlEnum("confidenceStatus", confidenceStatuses).notNull(),
  sourceIds: text("sourceIds").notNull(),
  supportingMaterial: text("supportingMaterial").notNull(),
  adverseMaterial: text("adverseMaterial").notNull(),
  primaryRecordNeeded: text("primaryRecordNeeded").notNull(),
  nextAction: text("nextAction").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ ownerCaseIdx: index("evidence_rows_owner_case_idx").on(table.userId, table.caseId), caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "evidence_rows_owner_case_fk" }).onDelete("cascade") }));

export const chronologyEvents = mysqlTable("chronology_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  dateText: varchar("dateText", { length: 160 }).notNull(),
  sortDate: timestamp("sortDate"),
  eventDescription: text("eventDescription").notNull(),
  sourceIds: text("sourceIds").notNull(),
  confidenceStatus: mysqlEnum("confidenceStatus", confidenceStatuses).notNull(),
  validationRecordNeeded: text("validationRecordNeeded").notNull(),
  nextAction: text("nextAction").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ ownerCaseIdx: index("chronology_events_owner_case_idx").on(table.userId, table.caseId), caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "chronology_events_owner_case_fk" }).onDelete("cascade") }));

export const acquisitionItems = mysqlTable("acquisition_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  priority: mysqlEnum("priority", acquisitionPriorities).notNull(),
  primaryRecordNeeded: text("primaryRecordNeeded").notNull(),
  purpose: text("purpose").notNull(),
  sourceIds: text("sourceIds").notNull(),
  nextAction: text("nextAction").notNull(),
  status: mysqlEnum("status", ["OPEN", "REQUESTED", "RECEIVED", "CLOSED"]).default("OPEN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ ownerCaseIdx: index("acquisition_items_owner_case_idx").on(table.userId, table.caseId), caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "acquisition_items_owner_case_fk" }).onDelete("cascade") }));

export const subscriptionEntitlements = mysqlTable("subscription_entitlements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  status: mysqlEnum("status", ["inactive", "active", "past_due", "canceled"]).default("inactive").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  subscriptionIdx: uniqueIndex("subscription_entitlement_subscription_idx").on(table.stripeSubscriptionId),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "subscription_entitlements_user_fk" }).onDelete("cascade"),
}));

export const motionDrafts = mysqlTable("motion_drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  motionType: varchar("motionType", { length: 255 }).notNull(),
  requestedRelief: text("requestedRelief").notNull(),
  selectedEvidenceIds: text("selectedEvidenceIds").notNull(),
  sourceTable: text("sourceTable").notNull(),
  unresolvedWarnings: text("unresolvedWarnings").notNull(),
  authorityPlaceholders: text("authorityPlaceholders").notNull(),
  bodyMarkdown: text("bodyMarkdown").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ ownerCaseIdx: index("motion_drafts_owner_case_idx").on(table.userId, table.caseId), caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "motion_drafts_owner_case_fk" }).onDelete("cascade") }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LegalCase = typeof legalCases.$inferSelect;
export type SourceRecord = typeof sourceRecords.$inferSelect;
export type EvidenceRow = typeof evidenceRows.$inferSelect;
export type ChronologyEvent = typeof chronologyEvents.$inferSelect;
export type AcquisitionItem = typeof acquisitionItems.$inferSelect;
export type SubscriptionEntitlement = typeof subscriptionEntitlements.$inferSelect;
export type MotionDraft = typeof motionDrafts.$inferSelect;
