"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers";
import { useProgress } from "@/hooks";
import type { TabKey } from "@/components/app/PillTabNav";

type SurahMeta = {
  id: number;
  name: string;
  name_simple: string;
  name_arabic: string;
  name_arabic_tashkeel: string;
  revelation_place: string;
  verses_count: number;
};

export function SurahsPanel({
  onNavigate,
}: {
  onNavigate: (tab: TabKey, params?: Record<string, string>) => void;
}) {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { settings } = useProgress();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/data/quran-metadata-surah-name.json")
      .then((r) => r.json())
      .then((data: Record<string, SurahMeta>) => {
        setSurahs(Object.values(data));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const lastSurah = settings?.lastReadSurah;
  const lastAyah = settings?.lastReadAyah;
  const lastSurahMeta = lastSurah
    ? surahs.find((s) => s.id === lastSurah)
    : null;

  const handleSurahClick = (surahId: number, ayah = 1) => {
    onNavigate("reader", { surah: String(surahId), ayah: String(ayah) });
  };

  return (
    <div className="flex flex-1 items-start justify-center p-6">
    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {/* Chips row */}
      <div className="flex flex-wrap gap-2">
        {lastSurahMeta && (
          <Badge variant="outline" className="text-xs font-medium">
            {language === "ar" ? "آخر ما قرأت" : "Last read"} ·{" "}
            {lastSurahMeta.name_simple} {lastSurah}:{lastAyah || 1}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs font-medium">
          {!mounted
            ? (language === "ar" ? "الوضع" : "Theme")
            : resolvedTheme === "dark"
              ? (language === "ar" ? "ليلاً · الوضع الداكن" : "Night · Dark mode")
              : (language === "ar" ? "نهاراً · الوضع الفاتح" : "Day · Light mode")}
        </Badge>
      </div>

      {/* Continue where you left */}
      {lastSurahMeta && (
        <>
          <p className="text-sm text-muted-foreground">
            {language === "ar" ? "تابع من حيث توقفت" : "Continue where you left"}
          </p>
          <div
            role="button"
            tabIndex={0}
            className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.125rem] border border-border bg-card p-3 transition-all hover:border-primary/30 hover:-translate-y-px"
            onClick={() => handleSurahClick(lastSurah!, lastAyah || 1)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSurahClick(lastSurah!, lastAyah || 1); }}
          >
            <div className="grid h-9 w-9 place-items-center rounded-full border border-border text-sm font-bold text-primary">
              {lastSurah}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {lastSurahMeta.name_simple} · {lastSurahMeta.verses_count}{" "}
                {language === "ar" ? "آيات" : "verses"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {language === "ar" ? "آخر آية:" : "Last ayah:"} {lastAyah || 1}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-uthmani text-base font-semibold" dir="rtl">
                {lastSurahMeta.name_arabic}
              </span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === "ar" ? "ابحث عن سورة..." : "Search surahs..."}
          className="w-full rounded-[1.125rem] border border-border bg-card py-2.5 ps-10 pe-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      {/* All Surahs */}
      <p className="text-sm text-muted-foreground">
        {language === "ar" ? "كل السور" : "All Surahs"}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (() => {
        const q = query.trim().toLowerCase();
        const filtered = q
          ? surahs.filter(
              (s) =>
                s.name_simple.toLowerCase().includes(q) ||
                String(s.id).includes(q) ||
                s.name_arabic.includes(query.trim()),
            )
          : surahs;
        if (filtered.length === 0) {
          return (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {language === "ar" ? "لم يتم العثور على سور" : "No surahs found"}
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((surah) => (
              <div
                key={surah.id}
                role="button"
                tabIndex={0}
                className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.125rem] border border-border bg-card px-3 py-3 transition-all hover:-translate-y-px hover:border-primary/30 hover:bg-primary/5"
                onClick={() => handleSurahClick(surah.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSurahClick(surah.id); }}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-sm font-bold text-primary">
                  {surah.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {surah.name_simple}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {surah.verses_count} {language === "ar" ? "آيات" : "verses"} ·{" "}
                    {surah.revelation_place === "makkah"
                      ? language === "ar" ? "مكّية" : "Meccan"
                      : language === "ar" ? "مدنيّة" : "Medinan"}
                  </p>
                </div>
                <span className="font-uthmani shrink-0 text-base font-semibold" dir="rtl">
                  {surah.name_arabic}
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
    </div>
  );
}
