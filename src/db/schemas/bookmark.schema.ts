import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth-schema";

export const bookmark = pgTable(
  "bookmark",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    surah: integer("surah").notNull(),
    ayah: integer("ayah").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("bookmark_user_id_idx").on(t.userId),
    surahAyahIdx: index("bookmark_surah_ayah_idx").on(t.surah, t.ayah),
  }),
);

export type Bookmark = typeof bookmark.$inferSelect;
export type NewBookmark = typeof bookmark.$inferInsert;
