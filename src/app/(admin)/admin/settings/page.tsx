import type { Metadata } from "next";
import { Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };
import { db } from "@/lib/database";
import { siteSetting } from "@/db/schema";
import { SettingsFormWrapper } from "./settings-form-wrapper";

export default async function AdminSettingsPage() {
  const settings = await db.select().from(siteSetting).orderBy(siteSetting.key);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage application configuration and preferences.
        </p>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <SettingsIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No settings configured
            </p>
            <p className="text-xs text-muted-foreground/60">
              Run <code className="rounded bg-muted px-1.5 py-0.5">npm run seed:settings</code> to add default settings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SettingsFormWrapper settings={JSON.parse(JSON.stringify(settings))} />
      )}
    </div>
  );
}
