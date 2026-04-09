"use client";

import { Sun, Moon, PanelLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PillTabNav, type TabKey } from "@/components/app/PillTabNav";
import { LessonSelector } from "@/components/app/LessonSelector";
import { LanguageToggle } from "@/components/common";
import { useLanguage } from "@/providers";
import { useTheme } from "next-themes";

export function UnifiedTopbar({
  activeTab,
  onTabChange,
  disabledTabs,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  disabledTabs?: TabKey[];
}) {
  const { language } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: surah/verse toggle + title */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="-ms-1 h-8 w-8 shrink-0 cursor-pointer rounded-full text-foreground hover:bg-accent"
          onClick={() => {
            const target: TabKey = activeTab === "home" ? "reader" : "home";
            if (disabledTabs?.includes(target)) return;
            onTabChange(target);
          }}
          aria-label={activeTab === "home" ? "Go to Verse" : "Go to Surahs"}
          title={activeTab === "home" ? "Verse" : "Surahs"}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <span className="truncate text-sm font-semibold tracking-wide">
          {language === "ar" ? "صراط المستقيم" : "Straight Path"}
        </span>
      </div>

      {/* Right: tabs + controls */}
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <PillTabNav activeTab={activeTab} onTabChange={onTabChange} disabledTabs={disabledTabs} />
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
