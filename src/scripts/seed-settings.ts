import { config } from "dotenv";
config({ path: ".env" });

import { db } from "../lib/database";
import { siteSetting } from "../db/schema";

const SEED_SETTINGS = [
  {
    key: "maintenance_mode",
    value: "false",
    description: "Enable maintenance mode (blocks user access during updates)",
    dataType: "boolean" as const,
  },
  {
    key: "app_name",
    value: "Quran Learning",
    description: "Application display name shown in topbar and branding",
    dataType: "string" as const,
  },
  {
    key: "default_language",
    value: "ar",
    description: "Default UI language for new users (ar or en)",
    dataType: "string" as const,
  },
  {
    key: "default_theme",
    value: "dark",
    description: "Default theme for new users (dark or light)",
    dataType: "string" as const,
  },
  {
    key: "registration_enabled",
    value: "true",
    description: "Allow new user sign-ups (set to false to disable registration)",
    dataType: "boolean" as const,
  },
  {
    key: "max_mcq_attempts",
    value: "2",
    description: "Wrong attempts allowed before auto-revealing the correct answer",
    dataType: "number" as const,
  },
  {
    key: "reciter",
    value: "husary",
    description: "Audio reciter for Quran playback (husary)",
    dataType: "string" as const,
  },
  {
    key: "support_email",
    value: "",
    description: "Support email shown on suspended page and app footer",
    dataType: "string" as const,
  },
  {
    key: "announcement",
    value: "",
    description: "Optional banner message displayed to all users (leave empty to hide)",
    dataType: "string" as const,
  },
];

async function seedSettings() {
  for (const setting of SEED_SETTINGS) {
    await db
      .insert(siteSetting)
      .values(setting)
      .onConflictDoNothing({ target: siteSetting.key });
  }
  console.log(`Seeded ${SEED_SETTINGS.length} site settings`);
  process.exit(0);
}

seedSettings().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
