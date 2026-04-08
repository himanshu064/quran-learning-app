"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/providers";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{language === "ar" ? "العربية" : "English"}</span>
    </Button>
  );
}
