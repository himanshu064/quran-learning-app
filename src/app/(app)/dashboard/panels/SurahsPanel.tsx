"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3">
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
            <div className="flex flex-col gap-0.5">
              <span className="font-uthmani text-base font-semibold" dir="rtl">
                {lastSurahMeta.name_arabic}
              </span>
              <span className="text-xs text-muted-foreground">
                {lastSurahMeta.name_simple} · {lastSurahMeta.verses_count}{" "}
                {language === "ar" ? "آيات" : "verses"}
              </span>
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? "آخر آية:" : "Last ayah:"} {lastAyah || 1}
              </span>
            </div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </div>
        </>
      )}

      {/* All Surahs */}
      <p className="text-sm text-muted-foreground">
        {language === "ar" ? "كل السور" : "All Surahs"}
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : surahs.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {language === "ar" ? "لم يتم العثور على سور" : "No surahs found"}
        </div>
      ) : (
        <div className="surah-scroll rounded-[1.125rem] border border-border bg-card">
          {surahs.map((surah, idx) => (
            <div
              key={surah.id}
              role="button"
              tabIndex={0}
              className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 transition-all hover:bg-primary/5 ${
                idx < surahs.length - 1 ? "border-b border-border" : ""
              }`}
              onClick={() => handleSurahClick(surah.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSurahClick(surah.id); }}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-sm font-bold text-primary">
                {surah.id}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {surah.name_simple} · {surah.verses_count}{" "}
                  {language === "ar" ? "آيات" : "verses"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {surah.revelation_place === "makkah"
                    ? language === "ar" ? "مكّية" : "Meccan"
                    : language === "ar" ? "مدنيّة" : "Medinan"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-uthmani text-base font-semibold" dir="rtl">
                  {surah.name_arabic}
                </span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
