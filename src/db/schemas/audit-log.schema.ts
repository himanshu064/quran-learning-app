import {
  pgEnum,
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth-schema";

export const actionCategoryEnum = pgEnum("action_category", [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "login",
  "logout",
]);

export const auditLogStatusEnum = pgEnum("audit_log_status", [
  "success",
  "failed",
  "partial",
]);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 100 }).notNull(),
    actionCategory: actionCategoryEnum("action_category").notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityName: varchar("entity_name", { length: 255 }),
    changes: jsonb("changes"),
    status: auditLogStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
    ipAddress: varchar("ip_address", { length: 45 }).notNull(),
    userAgent: text("user_agent"),
    requestMethod: varchar("request_method", { length: 10 }),
    requestUrl: text("request_url"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("audit_log_user_id_idx").on(t.userId),
    actionCategoryIdx: index("audit_log_action_category_idx").on(
      t.actionCategory,
    ),
    entityTypeIdx: index("audit_log_entity_type_idx").on(t.entityType),
    createdAtIdx: index("audit_log_created_at_idx").on(t.createdAt),
  }),
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
