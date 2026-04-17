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
  { key: "mcq", ar: "الاستماع", en: "Listening" },
  { key: "writing", ar: "الكتابة", en: "Writing" },
];

export function PillTabNav({
  activeTab,
  onTabChange,
  disabledTabs = [],
  lessonId,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  disabledTabs?: TabKey[];
  lessonId?: string;
}) {
  const { language } = useLanguage();

  const getLabels = (tab: (typeof TABS)[number]) => {
    let ar = tab.ar;
    let en = tab.en;
    if (tab.key === "teaching" && lessonId === "lesson1") {
      ar = "الحرف";
      en = "Letter";
    }
    return { ar, en };
  };

  return (
    <>
      {/* Desktop pill nav (hidden on mobile) */}
      <div className="hidden sm:inline-flex shrink-0 items-center gap-0 overflow-hidden rounded-full border border-border">
        {TABS.map((tab) => {
          const isDisabled = disabledTabs.includes(tab.key);
          const { ar, en } = getLabels(tab);
          return (
            <Button
              key={tab.key}
              variant="ghost"
              size="sm"
              disabled={isDisabled}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "h-auto rounded-none px-2.5 py-1.5 text-sm font-medium cursor-pointer",
                "text-muted-foreground hover:text-foreground hover:bg-transparent",
                activeTab === tab.key &&
                  "bg-primary/16 text-primary hover:bg-primary/16 hover:text-primary",
                isDisabled && "opacity-30 cursor-not-allowed",
              )}
            >
              {language === "ar" ? ar : en}
            </Button>
          );
        })}
      </div>

      {/* Mobile bottom fixed nav grid (visible only on mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 block border-t border-border bg-background/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-3 gap-1 p-2">
          {TABS.map((tab) => {
            const isDisabled = disabledTabs.includes(tab.key);
            const { ar, en } = getLabels(tab);
            return (
              <Button
                key={tab.key}
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "h-auto rounded-lg px-2 py-2 text-xs font-medium cursor-pointer",
                  "text-muted-foreground hover:text-foreground",
                  activeTab === tab.key &&
                    "bg-primary/16 text-primary hover:bg-primary/16 hover:text-primary",
                  isDisabled && "opacity-30 cursor-not-allowed",
                )}
              >
                {language === "ar" ? ar : en}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}
