"use client";

import { SettingsForm } from "./settings-form";
import type { SiteSetting } from "@/db/schema";

export function SettingsFormWrapper({ settings }: { settings: SiteSetting[] }) {
  return <SettingsForm settings={settings} />;
}
