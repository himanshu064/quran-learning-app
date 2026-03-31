"use client";

import { useLanguage } from "@/providers";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="cursor-pointer gap-1 px-2 font-semibold"
      aria-label="Toggle language"
    >
      <span className={language === "ar" ? "text-primary" : "text-muted-foreground"}>
        AR
      </span>
      <span className="text-muted-foreground">/</span>
      <span className={language === "en" ? "text-primary" : "text-muted-foreground"}>
        EN
      </span>
    </Button>
  );
}
