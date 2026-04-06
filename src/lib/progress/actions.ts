"use server";

import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { userProgress, userSettings } from "@/db/schema";

async function getUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/**
 * Upsert slide progress for a lesson.
 */
export async function saveSlideProgress(lessonId: string, slideIndex: number) {
  const userId = await getUserId();

  await db
    .insert(userProgress)
    .values({ userId, lessonId, slideIndex })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.lessonId],
      set: { slideIndex, updatedAt: new Date() },
    });
}

/**
 * Mark a lesson as completed.
 */
export async function markLessonCompleted(lessonId: string) {
  const userId = await getUserId();

  await db
    .insert(userProgress)
    .values({
      userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.lessonId],
      set: {
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Save MCQ score for a lesson.
 */
export async function saveMcqScore(
  lessonId: string,
  score: number,
  total: number,
) {
  const userId = await getUserId();

  await db
    .insert(userProgress)
    .values({
      userId,
      lessonId,
      mcqScore: score,
      mcqTotal: total,
      mcqCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.lessonId],
      set: {
        mcqScore: score,
        mcqTotal: total,
        mcqCompletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Save the user's last reading position (surah + ayah).
 */
export async function saveReadingPosition(surah: number, ayah: number) {
  const userId = await getUserId();

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (existing.length === 0) {
    await db.insert(userSettings).values({
      userId,
      lastReadSurah: surah,
      lastReadAyah: ayah,
    });
  } else {
    await db
      .update(userSettings)
      .set({ lastReadSurah: surah, lastReadAyah: ayah })
      .where(eq(userSettings.userId, userId));
  }
}

/**
 * Save the user's last active lesson.
 */
export async function saveLastLesson(lessonId: string) {
  const userId = await getUserId();

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (existing.length === 0) {
    await db.insert(userSettings).values({ userId, lastLesson: lessonId });
  } else {
    await db
      .update(userSettings)
      .set({ lastLesson: lessonId })
      .where(eq(userSettings.userId, userId));
  }
}
