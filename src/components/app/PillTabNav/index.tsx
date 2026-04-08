"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers";

export type TabKey =
  | "home"
  | "reader"
  | "teaching"
  | "letters"
  | "mcq"
  | "writing";

const TABS: { key: TabKey; ar: string; en: string }[] = [
  { key: "home", ar: "السور", en: "Surahs" },
  { key: "reader", ar: "الآية", en: "Verse" },
  { key: "teaching", ar: "الكلمة", en: "Word" },
  { key: "letters", ar: "الحروف", en: "Letters" },
  { key: "mcq", ar: "اختر", en: "Choose" },
  { key: "writing", ar: "اكتب", en: "Write" },
];

export function PillTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}) {
  const { language } = useLanguage();

  return (
    <div className="inline-flex shrink-0 gap-0 overflow-hidden rounded-full border border-border bg-muted">
      {TABS.map((tab) => (
        <Button
          key={tab.key}
          variant="ghost"
          size="sm"
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "h-auto rounded-none px-4 py-2 text-sm font-medium cursor-pointer",
            "text-muted-foreground hover:text-foreground hover:bg-transparent",
            activeTab === tab.key &&
              "bg-primary/16 text-primary hover:bg-primary/16 hover:text-primary",
          )}
        >
          {language === "ar" ? tab.ar : tab.en}
        </Button>
      ))}
    </div>
  );
}
