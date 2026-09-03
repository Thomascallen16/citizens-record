import { foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { legalCases, sourceExcerpts, sourceRecords, users, chronologyEvents } from "./schema";

export const canonicalRecordStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const canonicalVisibility = ["PRIVATE"] as const;
export const sourceDesignations = ["PRIMARY", "SECONDARY", "UNKNOWN"] as const;
export const epistemicCategories = ["FACT", "AUTHORITY", "CLAIM", "INFERENCE", "CONTRADICTION", "QUESTION", "UNKNOWN"] as const;
export const unknownStatuses = ["OPEN", "PARTIALLY_RESOLVED", "RESOLVED"] as const;
export const evidenceLinkRelationships = ["SUPPORTING", "CONTRARY"] as const;

export const recordMetadata = mysqlTable("record_metadata", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  originalQuestion: text("originalQuestion").notNull(),
  status: mysqlEnum("status", canonicalRecordStatuses).default("DRAFT").notNull(),
  visibility: mysqlEnum("visibility", canonicalVisibility).default("PRIVATE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  caseUnique: uniqueIndex("record_metadata_case_unique").on(table.caseId),
  ownerIdx: index("record_metadata_owner_idx").on(table.userId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "record_metadata_owner_case_fk" }).onDelete("cascade"),
}));

export const canonicalSourceMetadata = mysqlTable("canonical_source_metadata", {
  id: int("id").autoincrement().primaryKey(),
  sourceRecordId: int("sourceRecordId").notNull(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  retrievalAt: timestamp("retrievalAt"),
  designation: mysqlEnum("designation", sourceDesignations).default("UNKNOWN").notNull(),
  citationText: text("citationText").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  sourceUnique: uniqueIndex("canonical_source_metadata_source_unique").on(table.sourceRecordId),
  ownerCaseIdx: index("canonical_source_metadata_owner_case_idx").on(table.userId, table.caseId),
  sourceFk: foreignKey({ columns: [table.sourceRecordId], foreignColumns: [sourceRecords.id], name: "canonical_source_metadata_source_fk" }).onDelete("cascade"),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "canonical_source_metadata_owner_case_fk" }).onDelete("cascade"),
}));

export const canonicalEvidenceMetadata = mysqlTable("canonical_evidence_metadata", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidenceId").notNull(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  evidenceUnique: uniqueIndex("canonical_evidence_metadata_evidence_unique").on(table.evidenceId),
  ownerCaseIdx: index("canonical_evidence_metadata_owner_case_idx").on(table.userId, table.caseId),
  evidenceFk: foreignKey({ columns: [table.evidenceId], foreignColumns: [sourceExcerpts.id], name: "canonical_evidence_metadata_evidence_fk" }).onDelete("cascade"),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "canonical_evidence_metadata_owner_case_fk" }).onDelete("cascade"),
}));

export const canonicalClaims = mysqlTable("canonical_claims", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  claimText: text("claimText").notNull(),
  claimant: varchar("claimant", { length: 255 }),
  claimDate: varchar("claimDate", { length: 160 }),
  claimType: varchar("claimType", { length: 120 }).notNull(),
  epistemicCategory: mysqlEnum("epistemicCategory", epistemicCategories).default("CLAIM").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("canonical_claims_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "canonical_claims_owner_case_fk" }).onDelete("cascade"),
}));

export const canonicalFindings = mysqlTable("canonical_findings", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  findingText: text("findingText").notNull(),
  epistemicCategory: mysqlEnum("epistemicCategory", epistemicCategories).notNull(),
  rationale: text("rationale").notNull(),
  confidenceExplanation: text("confidenceExplanation").notNull(),
  alternativeExplanation: text("alternativeExplanation").notNull(),
  missingEvidence: text("missingEvidence").notNull(),
  whatWouldChangeConclusion: text("whatWouldChangeConclusion").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("canonical_findings_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "canonical_findings_owner_case_fk" }).onDelete("cascade"),
}));

export const canonicalUnknowns = mysqlTable("canonical_unknowns", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  description: text("description").notNull(),
  whyItMatters: text("whyItMatters").notNull(),
  relatedClaimId: int("relatedClaimId"),
  relatedFindingId: int("relatedFindingId"),
  relatedSourceRecordId: int("relatedSourceRecordId"),
  relatedChronologyEventId: int("relatedChronologyEventId"),
  status: mysqlEnum("status", unknownStatuses).default("OPEN").notNull(),
  resolutionNotes: text("resolutionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerCaseIdx: index("canonical_unknowns_owner_case_idx").on(table.userId, table.caseId),
  caseOwnerFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "canonical_unknowns_owner_case_fk" }).onDelete("cascade"),
}));

export const claimEvidenceLinks = mysqlTable("claim_evidence_links", {
  id: int("id").autoincrement().primaryKey(),
  claimId: int("claimId").notNull(),
  evidenceId: int("evidenceId").notNull(),
  relationship: mysqlEnum("relationship", evidenceLinkRelationships).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueLink: uniqueIndex("claim_evidence_links_unique").on(table.claimId, table.evidenceId, table.relationship),
  claimFk: foreignKey({ columns: [table.claimId], foreignColumns: [canonicalClaims.id], name: "claim_evidence_links_claim_fk" }).onDelete("cascade"),
  evidenceFk: foreignKey({ columns: [table.evidenceId], foreignColumns: [sourceExcerpts.id], name: "claim_evidence_links_evidence_fk" }).onDelete("cascade"),
}));

export const claimSourceLinks = mysqlTable("claim_source_links", {
  id: int("id").autoincrement().primaryKey(),
  claimId: int("claimId").notNull(),
  sourceRecordId: int("sourceRecordId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueLink: uniqueIndex("claim_source_links_unique").on(table.claimId, table.sourceRecordId),
  claimFk: foreignKey({ columns: [table.claimId], foreignColumns: [canonicalClaims.id], name: "claim_source_links_claim_fk" }).onDelete("cascade"),
  sourceFk: foreignKey({ columns: [table.sourceRecordId], foreignColumns: [sourceRecords.id], name: "claim_source_links_source_fk" }).onDelete("cascade"),
}));

export const findingEvidenceLinks = mysqlTable("finding_evidence_links", {
  id: int("id").autoincrement().primaryKey(),
  findingId: int("findingId").notNull(),
  evidenceId: int("evidenceId").notNull(),
  relationship: mysqlEnum("relationship", evidenceLinkRelationships).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueLink: uniqueIndex("finding_evidence_links_unique").on(table.findingId, table.evidenceId, table.relationship),
  findingFk: foreignKey({ columns: [table.findingId], foreignColumns: [canonicalFindings.id], name: "finding_evidence_links_finding_fk" }).onDelete("cascade"),
  evidenceFk: foreignKey({ columns: [table.evidenceId], foreignColumns: [sourceExcerpts.id], name: "finding_evidence_links_evidence_fk" }).onDelete("cascade"),
}));

export const findingClaimLinks = mysqlTable("finding_claim_links", {
  id: int("id").autoincrement().primaryKey(),
  findingId: int("findingId").notNull(),
  claimId: int("claimId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueLink: uniqueIndex("finding_claim_links_unique").on(table.findingId, table.claimId),
  findingFk: foreignKey({ columns: [table.findingId], foreignColumns: [canonicalFindings.id], name: "finding_claim_links_finding_fk" }).onDelete("cascade"),
  claimFk: foreignKey({ columns: [table.claimId], foreignColumns: [canonicalClaims.id], name: "finding_claim_links_claim_fk" }).onDelete("cascade"),
}));
