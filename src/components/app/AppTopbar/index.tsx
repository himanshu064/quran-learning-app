"use client";

import { BookOpenCheck } from "lucide-react";
import { ThemeToggle, LanguageToggle } from "@/components/common";
import { useLanguage } from "@/providers";

export function AppTopbar({ appName }: { appName?: string }) {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo / App name */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpenCheck className="h-4 w-4" />
        </div>
        <span className="hidden text-sm font-bold sm:inline">
          {appName || t("common.appName")}
        </span>
      </div>

      {/* Right side controls */}
      <div className="ms-auto flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
