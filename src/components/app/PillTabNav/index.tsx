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
  disabledTabs = [],
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  disabledTabs?: TabKey[];
}) {
  const { language } = useLanguage();

  return (
    <div className="inline-flex shrink-0 items-center gap-0 overflow-hidden rounded-full border border-border">
      {TABS.map((tab) => {
        const isDisabled = disabledTabs.includes(tab.key);
        return (
          <Button
            key={tab.key}
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "h-auto rounded-none px-3 py-1.5 text-xs font-medium cursor-pointer",
              "text-muted-foreground hover:text-foreground hover:bg-transparent",
              activeTab === tab.key &&
                "bg-primary/[0.16] text-primary hover:bg-primary/[0.16] hover:text-primary",
              isDisabled && "opacity-30 cursor-not-allowed",
            )}
          >
            {language === "ar" ? tab.ar : tab.en}
          </Button>
        );
      })}
    </div>
  );
}
