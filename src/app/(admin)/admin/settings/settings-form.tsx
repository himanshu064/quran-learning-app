"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { saveAllSettings, resetAllSettings } from "@/lib/admin/actions";
import { useLanguage } from "@/providers";
import type { SiteSetting } from "@/db/schema";

const SETTING_GROUPS = [
  {
    titleKey: "settings.general",
    descKey: "settings.generalDesc",
    keys: ["app_name", "support_email", "announcement"],
  },
  {
    titleKey: "settings.defaults",
    descKey: "settings.defaultsDesc",
    keys: ["default_language", "default_theme"],
  },
  {
    titleKey: "settings.learning",
    descKey: "settings.learningDesc",
    keys: ["max_mcq_attempts", "reciter"],
  },
  {
    titleKey: "settings.accessControl",
    descKey: "settings.accessControlDesc",
    keys: ["registration_enabled", "maintenance_mode"],
  },
];

const SETTING_DICT_MAP: Record<string, { labelKey: string; descKey: string }> =
  {
    app_name: { labelKey: "settings.appName", descKey: "settings.appNameDesc" },
    announcement: {
      labelKey: "settings.announcement",
      descKey: "settings.announcementDesc",
    },
    support_email: {
      labelKey: "settings.supportEmail",
      descKey: "settings.supportEmailDesc",
    },
    default_language: {
      labelKey: "settings.defaultLanguage",
      descKey: "settings.defaultLanguageDesc",
    },
    default_theme: {
      labelKey: "settings.defaultTheme",
      descKey: "settings.defaultThemeDesc",
    },
    max_mcq_attempts: {
      labelKey: "settings.maxMcqAttempts",
      descKey: "settings.maxMcqAttemptsDesc",
    },
    reciter: { labelKey: "settings.reciter", descKey: "settings.reciterDesc" },
    registration_enabled: {
      labelKey: "settings.registrationEnabled",
      descKey: "settings.registrationEnabledDesc",
    },
    maintenance_mode: {
      labelKey: "settings.maintenanceMode",
      descKey: "settings.maintenanceModeDesc",
    },
  };

export function SettingsForm({ settings }: { settings: SiteSetting[] }) {
  const { t } = useLanguage();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s]));

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(settings.map((s) => [s.key, s.value ?? ""])),
  );
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const hasChanges = settings.some(
    (s) => (s.value ?? "") !== (values[s.key] ?? ""),
  );

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changes: { id: string; value: string }[] = [];
      for (const setting of settings) {
        const newValue = values[setting.key] ?? "";
        if (newValue !== (setting.value ?? "")) {
          changes.push({ id: setting.id, value: newValue });
        }
      }
      if (changes.length === 0) return;
      await saveAllSettings(changes);
      toast.success(
        `${changes.length} setting${changes.length > 1 ? "s" : ""} updated`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetAllSettings();
      toast.success("Settings reset to defaults");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setResetting(false);
    }
  };

  const renderField = (key: string) => {
    const setting = settingsMap[key];
    if (!setting) return null;

    const value = values[key] ?? "";
    const dictKeys = SETTING_DICT_MAP[key];
    const label = dictKeys ? t(dictKeys.labelKey) : key;
    const description = dictKeys
      ? t(dictKeys.descKey)
      : (setting.description ?? "");

    if (setting.dataType === "boolean") {
      return (
        <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) =>
              updateValue(key, checked ? "true" : "false")
            }
            className="shrink-0"
          />
        </div>
      );
    }

    if (key === "default_language" || key === "default_theme") {
      const options =
        key === "default_language"
          ? [
              { value: "ar", label: t("settings.arabic") },
              { value: "en", label: t("settings.english") },
            ]
          : [
              { value: "dark", label: t("settings.dark") },
              { value: "light", label: t("settings.light") },
            ];

      return (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-medium">{label}</Label>
          <Select value={value} onValueChange={(v) => updateValue(key, v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      );
    }

    if (setting.dataType === "number") {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-medium">{label}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          value={value}
          onChange={(e) => updateValue(key, e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Row 1: General + Defaults */}
      <div className="grid gap-6 lg:grid-cols-2">
        {SETTING_GROUPS.slice(0, 2).map((group) => {
          const groupKeys = group.keys.filter((k) => settingsMap[k]);
          if (groupKeys.length === 0) return null;
          return (
            <Card key={group.titleKey}>
              <CardHeader>
                <CardTitle>{t(group.titleKey)}</CardTitle>
                <CardDescription>{t(group.descKey)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {groupKeys.map((key) => renderField(key))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Learning + Access Control */}
      <div className="grid gap-6 lg:grid-cols-2">
        {SETTING_GROUPS.slice(2, 4).map((group) => {
          const groupKeys = group.keys.filter((k) => settingsMap[k]);
          if (groupKeys.length === 0) return null;
          return (
            <Card key={group.titleKey}>
              <CardHeader>
                <CardTitle>{t(group.titleKey)}</CardTitle>
                <CardDescription>{t(group.descKey)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {groupKeys.map((key) => renderField(key))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={resetting}
                className="cursor-pointer"
              >
                <RotateCcw className="me-2 h-4 w-4" />
                {resetting ? t("common.resetting") : t("common.reset")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("settings.resetConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.resetConfirmDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  {t("common.resetAll")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="cursor-pointer"
          >
            <Save className="me-2 h-4 w-4" />
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
