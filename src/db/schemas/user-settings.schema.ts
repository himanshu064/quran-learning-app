import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth-schema";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  language: text("language").default("ar").notNull(),
  theme: text("theme").default("dark").notNull(),
  lastReadSurah: integer("last_read_surah"),
  lastReadAyah: integer("last_read_ayah"),
  lastLesson: text("last_lesson").default("lesson1").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
