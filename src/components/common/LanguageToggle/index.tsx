"use client";

import { useLanguage } from "@/providers";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  // Label shows the OTHER language (click to toggle to it), matching client's format
  const label = language === "ar" ? "English" : "العربية";

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground select-none min-w-[5rem] justify-center hover:bg-accent"
      aria-label="Toggle language"
      title="Toggle language"
    >
      <span>🌐</span>
      <span>{label}</span>
    </button>
  );
}
