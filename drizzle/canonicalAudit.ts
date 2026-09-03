import { foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { legalCases, users } from "./schema";

export const canonicalAuditActions = ["CREATED", "UPDATED", "ARCHIVED", "LINKED", "UNLINKED", "STATUS_CHANGED"] as const;

export const canonicalAuditEvents = mysqlTable("canonical_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", canonicalAuditActions).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  beforeJson: text("beforeJson"),
  afterJson: text("afterJson"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => ({
  ownerCaseIdx: index("canonical_audit_events_owner_case_idx").on(table.userId, table.caseId, table.occurredAt),
  ownerCaseFk: foreignKey({ columns: [table.userId, table.caseId], foreignColumns: [legalCases.userId, legalCases.id], name: "canonical_audit_events_owner_case_fk" }).onDelete("cascade"),
  actorFk: foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "canonical_audit_events_actor_fk" }).onDelete("cascade"),
}));
