"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { PillTabNav, type TabKey } from "@/components/app/PillTabNav";
import { LessonSelector } from "@/components/app/LessonSelector";
import { LanguageToggle, ThemeToggle } from "@/components/common";
import { useLanguage } from "@/providers";

export function UnifiedTopbar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}) {
  const { language } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: sidebar trigger + title */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ms-1 shrink-0" />
        <Separator orientation="vertical" className="mx-1 h-4 shrink-0" />
        <span className="truncate text-sm font-semibold tracking-wide">
          {language === "ar"
            ? "صراط المستقيم في تعليم القرآن بالقرآن"
            : "Straight Path in Teaching Quran by Quran"}
        </span>
      </div>

      {/* Right: tabs + controls — single line */}
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <PillTabNav activeTab={activeTab} onTabChange={onTabChange} />
        <LanguageToggle />
        <LessonSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}
