"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers";
import { useDebounce } from "@/hooks";

type SurahMeta = {
  id: number;
  name: string;
  name_simple: string;
  name_arabic: string;
  name_arabic_tashkeel: string;
  revelation_place: string;
  verses_count: number;
};

export function HomeScreen() {
  const { language } = useLanguage();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "ar" ? "السور" : "Surahs"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? `${surahs.length} سورة في القرآن الكريم`
              : `${surahs.length} surahs in the Holy Quran`}
          </p>
        </div>
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
      </div>

      {/* Surah grid */}
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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((surah) => (
            <Link
              key={surah.id}
              href={`/reader?surah=${surah.id}&ayah=1`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              {/* Number */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {surah.id}
              </div>

              {/* Names */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {surah.name_simple}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {surah.verses_count} {language === "ar" ? "آية" : "verses"}
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

              {/* Arabic name */}
              <span
                className="shrink-0 font-uthmani text-lg font-semibold text-muted-foreground group-hover:text-foreground"
                dir="rtl"
              >
                {surah.name_arabic}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
