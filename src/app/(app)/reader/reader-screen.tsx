"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayerControls, LessonNav } from "@/components/lesson";
import { useLanguage, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import { useQuery } from "@tanstack/react-query";

type QuranVerse = {
  id: number;
  verse_key: string;
  surah: number;
  ayah: number;
  text: string;
};

type SurahMeta = {
  id: number;
  name_arabic: string;
  name_arabic_tashkeel: string;
  name_simple: string;
  verses_count: number;
  bismillah_pre: boolean;
};

export function ReaderScreen() {
  const { language } = useLanguage();
  const {
    playWordAudio,
    playVerseSequence,
    playWbwSequence,
    mode,
    currentWordIndex,
    currentAyah,
  } = useAudioContext();
  const { savePosition } = useProgress();

  // URL-bound state via nuqs — typing updates URL instantly, URL is shareable
  const [surah, setSurah] = useQueryState(
    "surah",
    parseAsInteger.withDefault(1),
  );
  const [ayahFrom, setAyahFrom] = useQueryState(
    "ayah",
    parseAsInteger.withDefault(1),
  );
  const [ayahTo, setAyahTo] = useQueryState(
    "to",
    parseAsInteger.withDefault(0),
  );

  // Load surah metadata
  const { data: surahMeta } = useQuery({
    queryKey: ["surah-meta"],
    queryFn: async () => {
      const res = await fetch("/data/quran-metadata-surah-name.json");
      return res.json() as Promise<Record<string, SurahMeta>>;
    },
    staleTime: Infinity,
  });

  // Load quran text
  const { data: quranText, isLoading: isTextLoading } = useQuery({
    queryKey: ["quran-text"],
    queryFn: async () => {
      const res = await fetch("/data/quran_text_uthmani.json");
      return res.json() as Promise<Record<string, QuranVerse>>;
    },
    staleTime: Infinity,
  });

  const currentSurah = surahMeta?.[String(surah)];
  const maxAyah = currentSurah?.verses_count ?? 286;

  // Get verses to display — reacts instantly to surah/ayahFrom/ayahTo changes
  const verses = useMemo(() => {
    if (!quranText || !surah || !ayahFrom) return [];
    const start = Math.max(1, Math.min(ayahFrom, maxAyah));
    const end = ayahTo > 0 ? Math.min(ayahTo, maxAyah) : start;
    const result: QuranVerse[] = [];
    for (let a = start; a <= end; a++) {
      const v = quranText[`${surah}:${a}`];
      if (v) result.push(v);
    }
    return result;
  }, [quranText, surah, ayahFrom, ayahTo, maxAyah]);

  // Save reading position — skip first render to avoid overwriting with defaults
  const hasUserNavigated = useRef(false);
  useEffect(() => {
    if (!hasUserNavigated.current) {
      hasUserNavigated.current = true;
      return;
    }
    if (surah && ayahFrom) {
      savePosition({ surah, ayah: ayahFrom });
    }
  }, [surah, ayahFrom, savePosition]);

  const goToAyah = useCallback(
    (delta: number) => {
      setAyahFrom((prev) => {
        const next = (prev ?? 1) + delta;
        if (next < 1) return maxAyah;
        if (next > maxAyah) return 1;
        return next;
      });
      setAyahTo(0);
    },
    [maxAyah, setAyahFrom, setAyahTo],
  );

  // Build verse specs for sequence playback
  const verseSpecs = useMemo(
    () =>
      verses.map((v) => ({
        surah: v.surah,
        ayah: v.ayah,
        wordCount: v.text.split(" ").length,
      })),
    [verses],
  );

  // Play handler for AudioPlayerControls — plays all displayed verses
  const handlePlay = useCallback(() => {
    if (verseSpecs.length === 0) return;
    if (mode === "verse") {
      playVerseSequence(verseSpecs);
    } else {
      playWbwSequence(verseSpecs);
    }
  }, [mode, verseSpecs, playVerseSequence, playWbwSequence]);

  // Keyboard shortcuts: arrows = prev/next ayah
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") goToAyah(1);
      if (e.key === "ArrowLeft") goToAyah(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToAyah]);

  // Show basmala for ayah 1 (except surah 1 and 9)
  const showBasmala =
    ayahFrom === 1 &&
    surah !== 1 &&
    surah !== 9 &&
    currentSurah?.bismillah_pre !== false;

  return (
    <div className="space-y-4">
      {/* Location picker — values bound to URL, renders instantly on change */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground mr-2">
            {language === "ar" ? "السورة" : "Surah"}
          </label>
          <Input
            type="number"
            min={1}
            max={114}
            value={surah}
            onChange={(e) => setSurah(Number(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground mr-2">
            {language === "ar" ? "من آية" : "From"}
          </label>
          <Input
            type="number"
            min={1}
            max={maxAyah}
            value={ayahFrom}
            onChange={(e) => setAyahFrom(Number(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground mr-2">
            {language === "ar" ? "إلى آية" : "To"}
          </label>
          <Input
            type="number"
            min={0}
            max={maxAyah}
            value={ayahTo || ""}
            onChange={(e) => setAyahTo(Number(e.target.value) || 0)}
            className="w-20"
            placeholder="—"
          />
        </div>
      </div>

      {/* Surah header — ornamental strip */}
      {currentSurah && (
        <div
          className="relative mx-auto grid w-full max-w-2xl grid-cols-[1fr_2fr_1fr] items-center overflow-hidden"
          dir="ltr"
          style={{
            backgroundImage: "url(/surah_header.png)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "100% 100%",
            height: "4.25rem",
            filter: "drop-shadow(0 0.75rem 1.25rem rgba(0, 0, 0, 0.45))",
          }}
        >
          <span
            className="flex items-center justify-center text-lg font-bold text-slate-800"
            dir="ltr"
          >
            {currentSurah.verses_count}
          </span>
          <span
            className="flex items-center justify-center font-uthmani text-[1.75rem] font-semibold text-slate-900"
            dir="rtl"
          >
            {currentSurah.name_arabic_tashkeel ||
              `سورة ${currentSurah.name_arabic}`}
          </span>
          <span
            className="flex items-center justify-center text-lg font-bold text-slate-800"
            dir="ltr"
          >
            {surah}
          </span>
        </div>
      )}

      {/* Basmala */}
      {showBasmala && (
        <p className="text-center font-uthmani text-xl" dir="rtl">
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {/* Ayah display */}
      {isTextLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : verses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === "ar"
              ? "اختر سورة وآية للعرض"
              : "Select a surah and ayah to display"}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6" dir="rtl">
              {verses.map((verse) => (
                <div key={verse.verse_key}>
                  {/* Ayah number badge (when showing range) */}
                  {verses.length > 1 && (
                    <div className="mb-2 flex items-center gap-2" dir="ltr">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {language === "ar"
                          ? `آية ${verse.ayah}`
                          : `Ayah ${verse.ayah}`}
                      </span>
                    </div>
                  )}
                  <p className="font-uthmani text-[1.8rem] leading-12 sm:text-[2.3rem] sm:leading-14">
                    {verse.text.split(" ").map((word, i) => {
                      const isActive =
                        currentWordIndex === i + 1 &&
                        currentAyah === verse.ayah;
                      return (
                        <span
                          key={i}
                          className={cn(
                            "inline-block cursor-pointer rounded-lg border-2 border-transparent px-1.5 py-1 transition-all duration-200 hover:bg-emerald-500/25 hover:text-emerald-300 hover:border-emerald-400 hover:scale-[1.08] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]",
                            isActive &&
                              "bg-emerald-500/25 text-emerald-300 border-emerald-400 scale-[1.08] shadow-[0_0_20px_rgba(16,185,129,0.35)]",
                          )}
                          onClick={() =>
                            playWordAudio(verse.surah, verse.ayah, i + 1)
                          }
                        >
                          {word}{" "}
                        </span>
                      );
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio controls */}
      {verses.length > 0 && <AudioPlayerControls onPlay={handlePlay} />}

      {/* Ayah navigation */}
      <LessonNav onPrev={() => goToAyah(-1)} onNext={() => goToAyah(1)} />
    </div>
  );
}
