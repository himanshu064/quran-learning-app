"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers";

const TABS = [
  { href: "/dashboard", ar: "السور", en: "Surahs" },
  { href: "/dashboard/reader", ar: "الآية", en: "Reader" },
  { href: "/dashboard/teaching", ar: "الكلمة", en: "Word" },
  { href: "/dashboard/letters", ar: "الحروف", en: "Letters" },
  { href: "/dashboard/mcq", ar: "اختر", en: "Choose" },
  { href: "/dashboard/writing", ar: "اكتب", en: "Write" },
];

export function ScreenNav() {
  const pathname = usePathname();
  const { language } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex gap-1 overflow-x-auto border-b bg-background px-4 py-2 scrollbar-none">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            isActive(tab.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {language === "ar" ? tab.ar : tab.en}
        </Link>
      ))}
    </nav>
  );
}
