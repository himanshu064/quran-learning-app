"use client";

import { Sun, Moon, PanelLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PillTabNav, type TabKey } from "@/components/app/PillTabNav";
import { LessonSelector } from "@/components/app/LessonSelector";
import { LanguageToggle } from "@/components/common";
import { useLanguage } from "@/providers";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function UnifiedTopbar({
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
  const { toggleSidebar } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur",
        "dark:bg-[linear-gradient(120deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9))]",
      )}
    >
      {/* Left: sidebar trigger + surah/verse toggle + title */}
      <div className="flex min-w-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="-ms-1 h-8 w-8 shrink-0 cursor-pointer rounded-full text-foreground hover:bg-accent"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <span className="whitespace-nowrap text-sm font-semibold tracking-wide">
          {language === "ar" ? "صراط المستقيم في تعليم القرآن بالقرآن" : "Straight Path in Teaching Quran by Quran"}
        </span>
      </div>

      {/* Right: tabs + controls */}
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <PillTabNav activeTab={activeTab} onTabChange={onTabChange} disabledTabs={disabledTabs} lessonId={lessonId} />
        <LanguageToggle />
        <LessonSelector activeTab={activeTab} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer rounded-full"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
