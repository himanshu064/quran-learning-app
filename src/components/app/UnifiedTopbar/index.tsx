"use client";

import { Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PillTabNav, type TabKey } from "@/components/app/PillTabNav";
import { LessonSelector } from "@/components/app/LessonSelector";
import { LanguageToggle } from "@/components/common";
import { useLanguage } from "@/providers";
import { useTheme } from "next-themes";

export function UnifiedTopbar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}) {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: sidebar trigger + title */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ms-1 shrink-0" />
        <span className="truncate text-sm font-semibold tracking-wide">
          {language === "ar" ? "صراط المستقيم" : "Straight Path"}
        </span>
      </div>

      {/* Right: tabs + controls */}
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <PillTabNav activeTab={activeTab} onTabChange={onTabChange} />
        <LanguageToggle />
        <LessonSelector />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
