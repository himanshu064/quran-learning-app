"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers";
import { useDebounce, useProgress } from "@/hooks";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => {
    fetch("/data/quran-metadata-surah-name.json")
      .then((r) => r.json())
      .then((data: Record<string, SurahMeta>) => {
        setSurahs(Object.values(data));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = debouncedSearch
    ? surahs.filter(
        (s) =>
          s.name_simple.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          s.name_arabic.includes(debouncedSearch) ||
          String(s.id) === debouncedSearch,
      )
    : surahs;

  const lastSurah = settings?.lastReadSurah;
  const lastAyah = settings?.lastReadAyah;
  const lastSurahMeta = lastSurah
    ? surahs.find((s) => s.id === lastSurah)
    : null;

  const handleSurahClick = (surahId: number, ayah = 1) => {
    onNavigate("reader", { surah: String(surahId), ayah: String(ayah) });
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
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
          <p className="text-sm text-primary">
            {language === "ar" ? "تابع من حيث توقفت" : "Continue where you left"}
          </p>
          <Card
            role="button"
            tabIndex={0}
            className="cursor-pointer transition-all hover:-translate-y-px"
            onClick={() => handleSurahClick(lastSurah!, lastAyah || 1)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSurahClick(lastSurah!, lastAyah || 1); }}
          >
            <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {lastSurah}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {lastSurahMeta.name_simple} · {lastSurahMeta.verses_count}{" "}
                  {language === "ar" ? "آيات" : "verses"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {language === "ar" ? "آخر آية:" : "Last ayah:"}{" "}
                  {lastAyah || 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-uthmani text-lg font-semibold text-muted-foreground"
                  dir="rtl"
                >
                  {lastSurahMeta.name_arabic}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            language === "ar" ? "ابحث عن سورة..." : "Search surahs..."
          }
          className="ps-9"
        />
      </div>

      {/* All Surahs */}
      <p className="text-sm text-primary">
        {language === "ar" ? "كل السور" : "All Surahs"}
      </p>

      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {language === "ar" ? "لم يتم العثور على سور" : "No surahs found"}
        </div>
      ) : (
        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((surah) => (
            <div
              key={surah.id}
              role="button"
              tabIndex={0}
              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-px"
              onClick={() => handleSurahClick(surah.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSurahClick(surah.id); }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {surah.id}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {surah.name_simple}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {surah.verses_count}{" "}
                  {language === "ar" ? "آية" : "verses"}
                  {" · "}
                  {surah.revelation_place === "makkah"
                    ? language === "ar"
                      ? "مكية"
                      : "Meccan"
                    : language === "ar"
                      ? "مدنية"
                      : "Medinan"}
                </p>
              </div>
              <span
                className="shrink-0 font-uthmani text-lg font-semibold text-muted-foreground group-hover:text-foreground"
                dir="rtl"
              >
                {surah.name_arabic}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
