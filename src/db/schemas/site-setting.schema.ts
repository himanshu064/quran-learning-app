import {
  pgEnum,
  pgTable,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth-schema";

export const siteSettingDataTypeEnum = pgEnum("site_setting_data_type", [
  "string",
  "number",
  "boolean",
  "json",
]);

export const siteSetting = pgTable(
  "site_setting",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value"),
    description: text("description"),
    dataType: siteSettingDataTypeEnum("data_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    updatedBy: text("updated_by").references(() => user.id),
  },
  (t) => ({
    dataTypeIdx: index("site_setting_data_type_idx").on(t.dataType),
  }),
);

export type SiteSetting = typeof siteSetting.$inferSelect;
export type NewSiteSetting = typeof siteSetting.$inferInsert;
