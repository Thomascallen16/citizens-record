import { boolean, foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const confidenceStatuses = ["PRIMARY-RECORD", "USER-REPORTED", "VERIFY", "SOURCE-UNAVAILABLE", "CONFLICTING"] as const;
export const acquisitionPriorities = ["Critical", "High", "Medium", "Low"] as const;
export const caseMemberRoles = ["OWNER", "COLLABORATOR"] as const;
export const caseMemberStatuses = ["ACTIVE", "REVOKED"] as const;
export const evidenceItemKinds = ["DOCUMENT", "IMAGE", "AUDIO", "VIDEO", "COMMUNICATION", "OTHER"] as const;
export const evidenceItemStates = ["REFERENCE_ONLY", "UPLOAD_RESERVED", "READY", "QUARANTINED"] as const;
export const sensitivityLevels = ["STANDARD", "SENSITIVE", "RESTRICTED"] as const;
export const citationTargetTypes = ["EVIDENCE_ROW", "TIMELINE_EVENT", "MOTION_DRAFT"] as const;
export const citationRelationships = ["SUPPORTS", "LIMITS", "CONTRADICTS", "CONTEXT"] as const;
export const revisionActions = ["CREATED", "UPDATED", "SOFT_DELETED", "RESTORED", "PRIVACY_REQUESTED"] as const;
export const privacyRequestTypes = ["CORRECTION", "TAKEDOWN", "ACCESS", "DELETION", "OTHER"] as const;
export const privacyRequestStatuses = ["OPEN", "IN_REVIEW", "CLOSED"] as const;
export const analyticsEventNames = ["START_RECORD", "RECORD_CREATED", "SOURCE_ATTACHED", "RECORD_ACTIVATED", "RETURN"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  privacyNoticeVersion: varchar("privacyNoticeVersion", { length: 32 }),
  privacyNoticeAcknowledgedAt: timestamp("privacyNoticeAcknowledgedAt"),
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

/**
 * Sharing foundation. New workspaces receive an OWNER membership, but v1 routes
 * intentionally remain owner-only and do not expose invitations or public links.
 */
export const caseMembers = mysqlTable("case_members", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", caseMemberRoles).default("COLLABORATOR").notNull(),
  status: mysqlEnum("status", caseMemberStatuses).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  caseUserIdx: uniqueIndex("case_members_case_user_idx").on(table.caseId, table.userId),
  userIdx: index("case_members_user_idx").on(table.userId),
  caseFk: foreignKey({ columns: [table.caseId], foreignColumns: [legalCases.id], name: "case_members_case_fk" }).onDelete("cascade"),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "case_members_user_fk" }).onDelete("cascade"),
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
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseSourceIdx: uniqueIndex("source_records_owner_case_source_idx").on(table.userId, table.caseId, table.sourceId),
  ownerCaseIdx: index("source_records_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "source_records_owner_case_fk" }).onDelete("cascade"),
}));

/** Metadata only: the v1 application does not accept broad evidence-file uploads. */
export const evidenceItems = mysqlTable("evidence_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  sourceRecordId: int("sourceRecordId"),
  itemId: varchar("itemId", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  kind: mysqlEnum("kind", evidenceItemKinds).notNull(),
  state: mysqlEnum("state", evidenceItemStates).default("REFERENCE_ONLY").notNull(),
  sensitivity: mysqlEnum("sensitivity", sensitivityLevels).default("STANDARD").notNull(),
  externalReference: text("externalReference"),
  storageKey: varchar("storageKey", { length: 512 }),
  contentType: varchar("contentType", { length: 255 }),
  byteSize: int("byteSize"),
  sha256: varchar("sha256", { length: 64 }),
  provenanceNote: text("provenanceNote").notNull(),
  safetyAcknowledgedAt: timestamp("safetyAcknowledgedAt"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseItemIdx: uniqueIndex("evidence_items_owner_case_item_idx").on(table.userId, table.caseId, table.itemId),
  ownerCaseIdx: index("evidence_items_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "evidence_items_owner_case_fk" }).onDelete("cascade"),
  sourceFk: foreignKey({ columns: [table.sourceRecordId], foreignColumns: [sourceRecords.id], name: "evidence_items_source_fk" }).onDelete("set null"),
}));

export const sourceExcerpts = mysqlTable("source_excerpts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  sourceRecordId: int("sourceRecordId"),
  evidenceItemId: int("evidenceItemId"),
  label: varchar("label", { length: 255 }).notNull(),
  excerptText: text("excerptText").notNull(),
  locator: varchar("locator", { length: 255 }),
  confidenceStatus: mysqlEnum("confidenceStatus", confidenceStatuses).default("VERIFY").notNull(),
  isRedacted: boolean("isRedacted").default(false).notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("source_excerpts_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "source_excerpts_owner_case_fk" }).onDelete("cascade"),
  sourceFk: foreignKey({ columns: [table.sourceRecordId], foreignColumns: [sourceRecords.id], name: "source_excerpts_source_fk" }).onDelete("set null"),
  evidenceItemFk: foreignKey({ columns: [table.evidenceItemId], foreignColumns: [evidenceItems.id], name: "source_excerpts_evidence_item_fk" }).onDelete("set null"),
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
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("evidence_rows_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "evidence_rows_owner_case_fk" }).onDelete("cascade"),
}));

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
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("chronology_events_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "chronology_events_owner_case_fk" }).onDelete("cascade"),
}));

export const citations = mysqlTable("citations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  targetType: mysqlEnum("targetType", citationTargetTypes).notNull(),
  targetId: int("targetId").notNull(),
  sourceRecordId: int("sourceRecordId"),
  excerptId: int("excerptId"),
  relationship: mysqlEnum("relationship", citationRelationships).notNull(),
  locator: varchar("locator", { length: 255 }),
  note: text("note"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseTargetIdx: index("citations_owner_case_target_idx").on(table.userId, table.caseId, table.targetType, table.targetId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "citations_owner_case_fk" }).onDelete("cascade"),
  sourceFk: foreignKey({ columns: [table.sourceRecordId], foreignColumns: [sourceRecords.id], name: "citations_source_fk" }).onDelete("set null"),
  excerptFk: foreignKey({ columns: [table.excerptId], foreignColumns: [sourceExcerpts.id], name: "citations_excerpt_fk" }).onDelete("set null"),
}));

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
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("acquisition_items_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "acquisition_items_owner_case_fk" }).onDelete("cascade"),
}));

export const revisionEvents = mysqlTable("revision_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", revisionActions).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  changedFields: text("changedFields"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => ({
  ownerCaseOccurredIdx: index("revision_events_owner_case_occurred_idx").on(table.userId, table.caseId, table.occurredAt),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "revision_events_owner_case_fk" }).onDelete("cascade"),
  actorFk: foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "revision_events_actor_fk" }).onDelete("cascade"),
}));

export const privacyRequests = mysqlTable("privacy_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  requestType: mysqlEnum("requestType", privacyRequestTypes).notNull(),
  status: mysqlEnum("status", privacyRequestStatuses).default("OPEN").notNull(),
  details: text("details").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userStatusIdx: index("privacy_requests_user_status_idx").on(table.userId, table.status),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "privacy_requests_user_fk" }).onDelete("cascade"),
  caseFk: foreignKey({ columns: [table.caseId], foreignColumns: [legalCases.id], name: "privacy_requests_case_fk" }).onDelete("set null"),
}));

/** Product events carry no case text, source text, or document metadata. */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  eventName: mysqlEnum("eventName", analyticsEventNames).notNull(),
  dedupeKey: varchar("dedupeKey", { length: 190 }).notNull().unique(),
  metadata: text("metadata"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => ({
  eventOccurredIdx: index("analytics_events_event_occurred_idx").on(table.eventName, table.occurredAt),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "analytics_events_user_fk" }).onDelete("cascade"),
  caseFk: foreignKey({ columns: [table.caseId], foreignColumns: [legalCases.id], name: "analytics_events_case_fk" }).onDelete("set null"),
}));

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
}, table => ({
  ownerCaseIdx: index("motion_drafts_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "motion_drafts_owner_case_fk" }).onDelete("cascade"),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LegalCase = typeof legalCases.$inferSelect;
export type CaseMember = typeof caseMembers.$inferSelect;
export type SourceRecord = typeof sourceRecords.$inferSelect;
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type SourceExcerpt = typeof sourceExcerpts.$inferSelect;
export type Citation = typeof citations.$inferSelect;
export type EvidenceRow = typeof evidenceRows.$inferSelect;
export type ChronologyEvent = typeof chronologyEvents.$inferSelect;
export type AcquisitionItem = typeof acquisitionItems.$inferSelect;
export type RevisionEvent = typeof revisionEvents.$inferSelect;
export type PrivacyRequest = typeof privacyRequests.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type SubscriptionEntitlement = typeof subscriptionEntitlements.$inferSelect;
export type MotionDraft = typeof motionDrafts.$inferSelect;
