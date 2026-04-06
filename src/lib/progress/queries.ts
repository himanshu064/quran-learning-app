"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { userProgress, userSettings } from "@/db/schema";
import type { UserProgress, UserSettings } from "@/db/schema";

async function getUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/**
 * Get all progress rows for the current user.
 */
export async function getUserProgress(): Promise<UserProgress[]> {
  const userId = await getUserId();
  return db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(userProgress.lessonId);
}

/**
 * Get the current user's settings (reading position, last lesson, preferences).
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  const userId = await getUserId();
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return settings ?? null;
}
