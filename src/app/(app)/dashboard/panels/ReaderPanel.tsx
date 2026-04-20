"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { Play, Pause, SkipBack, SkipForward, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage, useAudioContext, useLessonContext } from "@/providers";
import { useProgress } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { useSelectedWord } from "../selected-word-context";
import type { WordSlide, LetterSlide } from "@/types";

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

export function ReaderPanel() {
  const { language } = useLanguage();
  const {
    playWordAudio,
    playVerseSequence,
    playWbwSequence,
    stop,
    mode,
    setMode,
    isPlaying,
    currentWordIndex,
    currentAyah,
  } = useAudioContext();
  const { savePosition } = useProgress();
  const {
    currentSlide,
    slides,
    slideIndex,
    totalSlides,
    prev: lessonPrev,
    next: lessonNext,
    goTo: lessonGoTo,
  } = useLessonContext();
  const { selectedWord, setSelectedWord } = useSelectedWord();

  // Lesson overlay state
  const [showOverlay, setShowOverlay] = useState(false);

  // URL-bound state
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

  // Current lesson word/letter slide
  const wordSlide =
    currentSlide?.type === "word" ? (currentSlide as WordSlide) : null;
  const letterSlide =
    currentSlide?.type === "letter" ? (currentSlide as LetterSlide) : null;
  const activeSlide = wordSlide ?? letterSlide;

  // Auto-navigate to the verse only when lesson nav buttons change the slide
  const prevSlideIndexRef = useRef(slideIndex);
  useEffect(() => {
    if (prevSlideIndexRef.current === slideIndex) return;
    prevSlideIndexRef.current = slideIndex;
    if (!wordSlide) return;
    if (wordSlide.surah !== surah || wordSlide.ayah !== ayahFrom) {
      setSurah(wordSlide.surah);
      setAyahFrom(wordSlide.ayah);
      setAyahTo(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex]);

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

  // Save reading position
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

  // Navigate ayahs
  const goToAyah = useCallback(
    (delta: number) => {
      const currentAyahVal = ayahFrom ?? 1;
      const nextAyah = currentAyahVal + delta;

      if (nextAyah > maxAyah) {
        if (surah < 114) {
          setSurah(surah + 1);
          setAyahFrom(1);
        }
      } else if (nextAyah < 1) {
        if (surah > 1) {
          const prevSurahMeta = surahMeta?.[String(surah - 1)];
          const prevMaxAyah = prevSurahMeta?.verses_count ?? 1;
          setSurah(surah - 1);
          setAyahFrom(prevMaxAyah);
        }
      } else {
        setAyahFrom(nextAyah);
      }
      setAyahTo(0);
    },
    [surah, ayahFrom, maxAyah, surahMeta, setSurah, setAyahFrom, setAyahTo],
  );

  // When user clicks a word
  const handleWordClick = useCallback(
    (
      verseSurah: number,
      verseAyah: number,
      wordIdx: number,
      wordText: string,
    ) => {
      playWordAudio(verseSurah, verseAyah, wordIdx);
      setSelectedWord({
        word: wordText.trim(),
        surah: verseSurah,
        ayah: verseAyah,
        wordIndex: wordIdx,
      });
      const matchIndex = slides.findIndex(
        (s) =>
          s.type === "word" &&
          (s as WordSlide).surah === verseSurah &&
          (s as WordSlide).ayah === verseAyah &&
          (s as WordSlide).wordIndex === wordIdx,
      );
      if (matchIndex !== -1) {
        lessonGoTo(matchIndex);
      }
    },
    [playWordAudio, setSelectedWord, slides, lessonGoTo],
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

  const handlePlay = useCallback(() => {
    if (verseSpecs.length === 0) return;
    if (mode === "verse") {
      playVerseSequence(verseSpecs);
    } else {
      playWbwSequence(verseSpecs);
    }
  }, [mode, verseSpecs, playVerseSequence, playWbwSequence]);

  // Keyboard shortcuts: arrows navigate lesson when lesson-active, else ayah
  const lessonModeActive = totalSlides > 0;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") {
        if (lessonModeActive) lessonNext();
        else goToAyah(1);
      }
      if (e.key === "ArrowLeft") {
        if (lessonModeActive) lessonPrev();
        else goToAyah(-1);
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (isPlaying) stop();
        else handlePlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToAyah, isPlaying, stop, handlePlay, lessonModeActive, lessonNext, lessonPrev]);

  const showBasmala =
    ayahFrom === 1 &&
    surah !== 1 &&
    surah !== 9 &&
    currentSurah?.bismillah_pre !== false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2.5">
      {/* Location card */}
      <div className="rounded-[1.125rem] border border-border bg-card px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-muted-foreground">
            {language === "ar" ? "سورة" : "Surah"}
          </label>
          <Input
            type="number"
            min={1}
            max={114}
            value={surah}
            onChange={(e) => setSurah(Number(e.target.value) || 1)}
            className="w-16 rounded-lg text-sm"
            dir="ltr"
          />
          <span className="text-muted-foreground/70">|</span>
          <label className="text-muted-foreground">
            {language === "ar" ? "آية" : "Ayah"}
          </label>
          <Input
            type="number"
            min={1}
            max={maxAyah}
            value={ayahFrom}
            onChange={(e) => setAyahFrom(Number(e.target.value) || 1)}
            className="w-16 rounded-lg text-sm"
            dir="ltr"
          />
          <span className="text-muted-foreground/70">–</span>
          <Input
            type="number"
            min={0}
            max={maxAyah}
            value={ayahTo || ""}
            onChange={(e) => setAyahTo(Number(e.target.value) || 0)}
            className="w-16 rounded-lg text-sm"
            dir="ltr"
            placeholder="—"
          />
        </div>
      </div>

      {/* Surah header ornament */}
      {currentSurah && (
        <div
          className="relative mx-auto grid h-[3.5rem] w-full grid-cols-[1fr_2fr_1fr] items-center overflow-hidden sm:h-[4.25rem]"
          dir="ltr"
          style={{
            backgroundImage: "url(/surah_header.png)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "100% 100%",
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

      {/* Ayah box */}
      {isTextLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <div
          className={cn(
            "relative flex min-h-48 cursor-default items-center justify-center overflow-hidden rounded-[1.125rem] border border-border bg-card p-6",
            "dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),rgba(15,23,42,0.98)_45%)]",
          )}
          onClick={() => {
            if (activeSlide) setShowOverlay((p) => !p);
          }}
        >
          {/* Halo glow — dark mode only */}
          <div className="ayah-halo hidden dark:block" />

          {/* Verse text */}
          <div
            className={cn(
              "relative z-10 space-y-6 transition-opacity duration-200",
              showOverlay && activeSlide && "opacity-0",
            )}
            dir="rtl"
          >
            {verses.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {language === "ar"
                  ? "اختر سورة وآية للعرض"
                  : "Select a surah and ayah to display"}
              </p>
            ) : (
              <p
                className="font-uthmani text-[2.2rem] sm:text-[2.6rem] md:text-[3rem] leading-[2.35] text-center"
              >
                {showBasmala && (
                  <span className="block">
                    بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                  </span>
                )}
                {verses.map((verse) => (
                  <span key={verse.verse_key}>
                    {verse.text.split(" ").map((word, i) => {
                      const wordIdx = i + 1;
                      const isAudioActive =
                        currentWordIndex === wordIdx &&
                        currentAyah === verse.ayah;
                      const highlightSource = selectedWord || wordSlide;
                      const isLessonWord =
                        highlightSource &&
                        highlightSource.surah === verse.surah &&
                        highlightSource.ayah === verse.ayah &&
                        highlightSource.wordIndex === wordIdx;

                      return (
                        <span
                          key={i}
                          role="button"
                          tabIndex={0}
                          style={{
                            animationDelay: `${i * 40}ms`,
                            padding: "0.1875rem 0.625rem",
                            margin: "0.25rem 0.1875rem",
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleWordClick(
                                verse.surah,
                                verse.ayah,
                                wordIdx,
                                word,
                              );
                            }
                          }}
                          className={cn(
                            "verse-word inline-block cursor-pointer rounded-full transition-all duration-200",
                            "hover:bg-slate-400/18",
                            isAudioActive &&
                              "bg-blue-500/14 text-blue-500 outline outline-2 outline-blue-500/70 scale-[1.04]",
                            !isAudioActive &&
                              isLessonWord &&
                              "bg-primary/10 text-primary",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordClick(
                              verse.surah,
                              verse.ayah,
                              wordIdx,
                              word,
                            );
                          }}
                        >
                          {word}
                          {" "}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Lesson overlay (flash card) */}
          {showOverlay && activeSlide && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/95 p-8 text-center backdrop-blur-sm"
              dir="rtl"
            >
              <div className="font-uthmani text-[2.4rem] leading-[2.3]">
                {wordSlide?.word ?? letterSlide?.glyph}
              </div>
              {letterSlide && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {language === "ar"
                    ? letterSlide.name_ar
                    : letterSlide.name_en}
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                {language === "ar"
                  ? "اضغط على البطاقة لإظهار الآية الكاملة"
                  : "Tap card to show full verse"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lesson word nav — previous/next only */}
      {totalSlides > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={lessonPrev}
            title={language === "ar" ? "السابق" : "Previous"}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={isPlaying ? stop : handlePlay}
            title={language === "ar" ? "تشغيل" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={lessonNext}
            title={language === "ar" ? "التالي" : "Next"}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lesson info card */}
      {activeSlide && (
        <div className="flex items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            {letterSlide
              ? language === "ar"
                ? "حرف من الأبجدية"
                : "Arabic Alphabet"
              : language === "ar"
                ? "كلمة من القرآن"
                : "Word from Quran"}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {wordSlide && wordSlide.count > 0 && (
              <span>
                {language === "ar"
                  ? `في القرآن: ${wordSlide.count} مرة`
                  : `In Quran: ${wordSlide.count} times`}
              </span>
            )}
            {letterSlide && (
              <span className="font-uthmani text-base">
                {letterSlide.glyph}
              </span>
            )}
            <span>
              {language === "ar" ? "التقدم:" : "Progress:"} {slideIndex + 1} /{" "}
              {totalSlides}
            </span>
          </div>
        </div>
      )}

      {/* Player / Recitation card */}
      {verses.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-3 rounded-[1.125rem] border border-border bg-card px-4 py-3">
            <span className="shrink-0 text-sm text-muted-foreground">
              {language === "ar" ? "تلاوة" : "Recitation"}
            </span>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 items-center justify-center gap-1 rounded-full border border-border p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto rounded-full px-4 py-1 text-xs cursor-pointer",
                    mode === "wbw"
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setMode("wbw")}
                >
                  {language === "ar" ? "كلمة بكلمة" : "Word by word"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto rounded-full px-4 py-1 text-xs cursor-pointer",
                    mode === "verse"
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setMode("verse")}
                >
                  {language === "ar" ? "الآية كاملة" : "Full verse"}
                </Button>
              </div>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-play cursor-pointer"
                onClick={isPlaying ? stop : handlePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-start text-xs text-muted-foreground">
            {language === "ar"
              ? "القارئ: محمود خليل الحصري (المعلّم)"
              : "Reciter: Mahmoud Khalil Al-Husary (Teacher)"}
          </p>
        </div>
      )}

      {/* Floating play/pause bubble — fixed bottom-right for quick control */}
      {verses.length > 0 && (
        <Button
          size="icon"
          className={cn(
            "fixed bottom-6 end-6 z-40 h-12 w-12 rounded-full shadow-play cursor-pointer",
            isPlaying
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-[rgba(15,23,42,0.96)] hover:bg-[rgba(15,23,42,0.96)]/90",
          )}
          onClick={isPlaying ? stop : handlePlay}
          title={
            language === "ar"
              ? isPlaying ? "إيقاف" : "تشغيل"
              : isPlaying ? "Pause" : "Play"
          }
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white" />
          )}
        </Button>
      )}
    </div>
  );
}
