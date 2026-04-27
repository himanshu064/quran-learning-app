"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="cursor-pointer px-2 py-1 text-sm font-medium tracking-wide select-none"
      aria-label="Toggle language"
      title="Toggle language"
    >
      <span className={cn(language === "ar" ? "text-primary" : "text-muted-foreground")}>
        AR
      </span>
      <span className="mx-1 text-muted-foreground">/</span>
      <span className={cn(language === "en" ? "text-primary" : "text-muted-foreground")}>
        EN
      </span>
    </button>
  );
}
