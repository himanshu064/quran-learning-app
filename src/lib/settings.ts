import { cache } from "react";

/**
 * Fetches all site settings as a key-value map.
 * In M1, returns defaults. Full DB-backed implementation in M3.
 */
export const getSettings = cache(async (): Promise<Record<string, string>> => {
  return {
    app_name: "Quran Learning",
    default_language: "ar",
    default_theme: "dark",
    maintenance_mode: "false",
    registration_enabled: "true",
  };
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
