import { cache } from "react";
import { db } from "./database";
import { siteSetting } from "@/db/schema";

/**
 * Fetches all site settings as a key-value map.
 * Cached per request via React `cache()` — safe to call multiple times
 * in the same server render without hitting the DB again.
 */
export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await db.select().from(siteSetting);
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
});

/**
 * Fetches a single setting value by key.
 */
export async function getSetting(key: string): Promise<string> {
  const all = await getSettings();
  return all[key] ?? "";
}

/**
 * Typed helper to check boolean settings.
 */
export async function isSettingEnabled(key: string): Promise<boolean> {
  const value = await getSetting(key);
  return value === "true";
}
