import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth-schema";

export const userProgress = pgTable(
  "user_progress",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    slideIndex: integer("slide_index").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    mcqScore: integer("mcq_score"),
    mcqTotal: integer("mcq_total"),
    mcqCompletedAt: timestamp("mcq_completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    userLessonUniq: unique("user_progress_user_lesson_uniq").on(
      t.userId,
      t.lessonId,
    ),
    userIdIdx: index("user_progress_user_id_idx").on(t.userId),
    completedIdx: index("user_progress_completed_idx").on(t.completed),
  }),
);

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
