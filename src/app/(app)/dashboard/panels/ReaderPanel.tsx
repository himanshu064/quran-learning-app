"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { Play, Pause, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

// Quranic letter range — anything outside this is treated as an ornament/stop-sign token
// (verse-end numbers ١-٩, Rub el Hizb ۞, sajdah signs, pause marks, etc.) and rendered
// non-clickable, non-highlightable, and excluded from the word index counter so word-by-word
// audio aligns to actual words. Mirrors the reference's `isStopSignToken` at
// Omar App Final/index.html:4153-4157.
const QURAN_LETTER_REGEX = /[ء-يٮ-ۓ]/;

type VerseToken =
  | { kind: "word"; text: string; wordIdx: number }
  | { kind: "symbol"; text: string };

function parseVerseTokens(text: string): VerseToken[] {
  const out: VerseToken[] = [];
  let counter = 0;
  // Split on ANY whitespace (regular space, non-breaking space U+00A0, tab, etc.) —
  // the Uthmani JSON glues some symbols to adjacent words with NBSP, e.g.
  // "بَصِيرٞ ٢٧" and "۞ وَلَوۡ". Plain split(" ") would leave those as a
  // single token and the highlight ring would wrap the symbol along with the word.
  for (const piece of text.split(/\s+/)) {
    if (!piece) continue;
    if (QURAN_LETTER_REGEX.test(piece)) {
      counter += 1;
      out.push({ kind: "word", text: piece, wordIdx: counter });
    } else {
      out.push({ kind: "symbol", text: piece });
    }
  }
  return out;
}

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
    lessonId,
    currentSlide,
    slides,
    slideIndex,
    totalSlides,
    prev: lessonPrev,
    next: lessonNext,
    goTo: lessonGoTo,
    shuffle: lessonShuffle,
  } = useLessonContext();
  const { selectedWord, setSelectedWord } = useSelectedWord();

  // Flashcard overlay: show word card by default when a lesson slide is active,
  // hide it (show full verse) after the user taps the card — matches reference behaviour.
  const [showOverlay, setShowOverlay] = useState(false);
  // When a word is clicked in the verse we navigate the lesson slide but must NOT
  // flip to the flashcard — the user is already looking at the verse.
  const skipNextOverlayRef = useRef(false);
  // Word clicks also must NOT sync the URL's surah/ayah/to to the new lesson
  // slide. If the user has a range like 1-5 active and clicks a word inside
  // ayah 3, snapping the URL to ayah 3 (and clearing `to`) collapses their
  // range view. Reference behaviour: a word click only plays audio
  // (index.html:4479-4497), never alters the displayed verse range.
  const skipNextNavSyncRef = useRef(false);

  // Inline error message shown right after the `to` input when the user
  // enters a number that doesn't correspond to a real ayah in this surah.
  const [ayahToError, setAyahToError] = useState("");

  // Floating bubble is only shown after user has triggered playback at least once.
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  // Local string states for the three inputs — allows the user to clear and retype freely.
  // Synced FROM URL state when lesson navigation changes surah/ayah externally.
  const [surahInput, setSurahInput] = useState(String(1));
  const [ayahFromInput, setAyahFromInput] = useState(String(1));
  const [ayahToInput, setAyahToInput] = useState("");

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

  // Auto-navigate to the verse when the lesson changes or the slide index changes.
  // Two separate refs so we can detect each trigger independently.
  // We intentionally defer updating refs until wordSlide is available so the
  // effect re-fires when the async slides finish loading after a lesson switch.
  const prevLessonIdRef = useRef(lessonId);
  const prevSlideIndexRef = useRef(slideIndex);
  useEffect(() => {
    const lessonChanged = prevLessonIdRef.current !== lessonId;
    const slideChanged = prevSlideIndexRef.current !== slideIndex;
    if (!lessonChanged && !slideChanged) return;
    if (!wordSlide) return; // slides still loading — keep refs stale so effect re-runs on load
    prevLessonIdRef.current = lessonId;
    prevSlideIndexRef.current = slideIndex;
    // Word click: suppress this nav sync so the user's selected range / displayed
    // ayah is preserved (reference plays audio only on word click).
    if (skipNextNavSyncRef.current) {
      skipNextNavSyncRef.current = false;
      return;
    }
    if (wordSlide.surah !== surah || wordSlide.ayah !== ayahFrom) {
      setSurah(wordSlide.surah);
      setAyahFrom(wordSlide.ayah);
      setAyahTo(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, slideIndex, slides]);

  // Reset to flashcard view on every word slide change — reference shows word card first.
  // Only applies to word slides (Lesson 3+). Letter slides (Lesson 1) never show an overlay.
  // Suppressed when the change was triggered by a word click (user is viewing the verse).
  useEffect(() => {
    if (!wordSlide) return;
    if (skipNextOverlayRef.current) {
      skipNextOverlayRef.current = false;
      return;
    }
    setShowOverlay(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordSlide]);

  // Clear cross-tab "selected word" state and the flashcard overlay whenever
  // the displayed verse no longer matches them. Mirrors the reference's
  // behaviour of stripping `.lesson-focus` / clearing lesson UI on every
  // surah/ayah navigation (index.html:4136-4140 surah card click,
  // 4926-4930 ayah prev/next, 4960-4964 "continue where you left",
  // 6825-6829 lesson change), so a word selected in one verse doesn't
  // bleed into a different surah/ayah after the user navigates away.
  //
  // Word clicks themselves do NOT trigger a clear: the click sets
  // selectedWord and lessonGoTo's auto-navigate keeps wordSlide.surah/ayah
  // in step with the displayed verse, so the mismatch checks below stay
  // false. A clear only fires on external navigation (Surahs tab click,
  // lesson prev/next, manual surah/ayah input change).
  useEffect(() => {
    if (selectedWord && (selectedWord.surah !== surah || selectedWord.ayah !== ayahFrom)) {
      setSelectedWord(null);
    }
    if (wordSlide && (wordSlide.surah !== surah || wordSlide.ayah !== ayahFrom)) {
      setShowOverlay(false);
    }
  }, [surah, ayahFrom, selectedWord, wordSlide, setSelectedWord]);

  // Keep local input strings in sync when URL state changes externally (lesson nav)
  useEffect(() => { setSurahInput(String(surah)); setAyahToError(""); }, [surah]);
  useEffect(() => { setAyahFromInput(String(ayahFrom)); setAyahToError(""); }, [ayahFrom]);
  useEffect(() => { setAyahToInput(ayahTo > 0 ? String(ayahTo) : ""); }, [ayahTo]);

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

  // Save reading position on every surah/ayah change. The initial mount is
  // skipped ONLY when the URL has no explicit `?surah=`/`?ayah=` params (i.e.,
  // the panel mounted at parser defaults 1:1 with no user intent) — that
  // protects a previously-saved position from being clobbered on a fresh app
  // load that happens to land on the Verse tab. Any URL with explicit params
  // (e.g., navigated from the Surahs card, lesson change, deep link) is saved
  // immediately so the Continue card reflects the user's actual position.
  // Mirrors reference's `saveLastRead()` call inside `renderAyah`
  // (Omar App Final/index.html:4862).
  const hasMountedReader = useRef(false);
  useEffect(() => {
    if (!hasMountedReader.current) {
      hasMountedReader.current = true;
      const sp = new URLSearchParams(window.location.search);
      const urlHasPosition = sp.has("surah") || sp.has("ayah");
      if (!urlHasPosition) return;
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
      if (lessonId !== "lesson1") {
        setSelectedWord({
          word: wordText.trim(),
          surah: verseSurah,
          ayah: verseAyah,
          wordIndex: wordIdx,
        });
      }
      const matchIndex = slides.findIndex(
        (s) =>
          s.type === "word" &&
          (s as WordSlide).surah === verseSurah &&
          (s as WordSlide).ayah === verseAyah &&
          (s as WordSlide).wordIndex === wordIdx,
      );
      if (matchIndex !== -1) {
        skipNextOverlayRef.current = true; // don't flip to flashcard on word click
        skipNextNavSyncRef.current = true; // don't snap URL/range to the clicked word's ayah
        lessonGoTo(matchIndex);
      }
    },
    [playWordAudio, setSelectedWord, slides, lessonGoTo, lessonId],
  );

  // Build verse specs for sequence playback. wordCount counts only real words
  // (excluding ornaments/stop-signs/verse-end numbers) so word-by-word audio
  // sequencing doesn't overshoot past the actual word count.
  const verseSpecs = useMemo(
    () =>
      verses.map((v) => {
        const tokens = parseVerseTokens(v.text);
        const wordCount = tokens.reduce(
          (n, t) => (t.kind === "word" ? n + 1 : n),
          0,
        );
        return { surah: v.surah, ayah: v.ayah, wordCount };
      }),
    [verses],
  );

  const handlePlay = useCallback(() => {
    if (verseSpecs.length === 0) return;
    setHasPlayedOnce(true);
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
    <div className="flex flex-1 items-start justify-center p-6">
    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {/* Surah / Ayah selector */}
      <div
        className="flex items-center gap-3 rounded-[1.125rem] border border-border bg-card px-4 py-2.5"
        dir="ltr"
      >
        <span className="text-sm text-muted-foreground">
          {language === "ar" ? "سورة" : "Surah"}
        </span>
        <input
          type="number"
          min={1}
          max={114}
          value={surahInput}
          onChange={(e) => {
            setSurahInput(e.target.value);
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1 && v <= 114) {
              setSurah(v);
              setAyahFrom(1);
              setAyahTo(0);
            }
          }}
          onBlur={() => {
            const v = parseInt(surahInput, 10);
            if (isNaN(v) || v < 1 || v > 114) setSurahInput(String(surah));
          }}
          className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-primary"
        />
        <span className="text-sm text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground">
          {language === "ar" ? "آية" : "Ayah"}
        </span>
        <input
          type="number"
          min={1}
          max={maxAyah}
          value={ayahFromInput}
          onChange={(e) => {
            setAyahFromInput(e.target.value);
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1 && v <= maxAyah) setAyahFrom(v);
          }}
          onBlur={() => {
            const v = parseInt(ayahFromInput, 10);
            if (isNaN(v) || v < 1 || v > maxAyah) setAyahFromInput(String(ayahFrom));
          }}
          className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-primary"
        />
        <span className="text-sm text-muted-foreground">–</span>
        <input
          type="number"
          min={ayahFrom}
          max={maxAyah}
          value={ayahToInput}
          placeholder={String(maxAyah)}
          onChange={(e) => {
            const raw = e.target.value;
            setAyahToInput(raw);
            if (raw === "") {
              setAyahTo(0);
              setAyahToError("");
              return;
            }
            const v = parseInt(raw, 10);
            if (isNaN(v)) {
              setAyahToError("");
              return;
            }
            if (v > maxAyah) {
              setAyahToError(
                language === "ar"
                  ? `الآية ${v} غير موجودة في هذه السورة`
                  : `Ayah ${v} does not exist in this surah`,
              );
              return;
            }
            if (v < ayahFrom) {
              setAyahToError(
                language === "ar"
                  ? "نطاق الآيات غير صحيح"
                  : "Ayah range is incorrect",
              );
              return;
            }
            setAyahToError("");
            setAyahTo(v);
          }}
          onBlur={() => {
            if (ayahToInput === "") {
              setAyahToError("");
              return;
            }
            const v = parseInt(ayahToInput, 10);
            if (isNaN(v) || v < ayahFrom || v > maxAyah) {
              setAyahTo(0);
              return;
            }
            setAyahToError("");
          }}
          className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-primary"
        />
        {ayahToError && (
          <span
            className="ms-2 rounded-md bg-red-500/15 px-2 py-1 text-xs font-medium text-red-400"
            role="alert"
          >
            {ayahToError}
          </span>
        )}
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

      {/* Ayah box — grows naturally with verse content; the card scrolls. */}
      {isTextLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <div
          className={cn(
            "relative flex min-h-48 items-center justify-center overflow-hidden rounded-[1.125rem] border border-border bg-card p-6",
            "dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),rgba(15,23,42,0.98)_45%)]",
            wordSlide ? "cursor-pointer" : "cursor-default",
          )}
          onClick={() => {
            if (wordSlide) setShowOverlay((p) => !p);
          }}
        >
          {/* Halo glow — dark mode only */}
          <div className="ayah-halo hidden dark:block" />

          {/* Verse text */}
          <div
            className={cn(
              "relative z-10 space-y-6 transition-opacity duration-200",
              showOverlay && wordSlide && "opacity-0",
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
                {verses.map((verse) => {
                  const tokens = parseVerseTokens(verse.text);
                  return (
                    <span key={verse.verse_key}>
                      {tokens.map((tok, i) => {
                        // Symbol tokens (verse-end numbers, Rub el Hizb, sajdah signs,
                        // pause marks, etc.) render as plain non-interactive spans —
                        // never highlighted, never clickable. Matches the reference.
                        if (tok.kind === "symbol") {
                          return (
                            <span
                              key={i}
                              className="inline-block select-none text-muted-foreground/80"
                              style={{ margin: "0.25rem 0.1875rem" }}
                            >
                              {tok.text}
                              {" "}
                            </span>
                          );
                        }

                        const wordIdx = tok.wordIdx;
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
                                  tok.text,
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
                                "font-bold ring-1 ring-primary/80 scale-[1.04]",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWordClick(
                                verse.surah,
                                verse.ayah,
                                wordIdx,
                                tok.text,
                              );
                            }}
                          >
                            {tok.text}
                            {" "}
                          </span>
                        );
                      })}
                    </span>
                  );
                })}
              </p>
            )}
          </div>

          {/* Lesson overlay (flash card) — word slides only, not letter slides.
              The flashcard tracks the same source the verse highlight does
              (selectedWord first, falling back to wordSlide). Otherwise a
              user-clicked word that isn't part of the lesson slide list
              would highlight in the verse but the flashcard would still
              show the old lesson word — a confusing mismatch. */}
          {(() => {
            const flashWord = selectedWord || wordSlide;
            if (!showOverlay || !flashWord) return null;
            return (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-card/95 p-6 text-center backdrop-blur-sm"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playWordAudio(
                      flashWord.surah,
                      flashWord.ayah,
                      flashWord.wordIndex,
                    );
                  }}
                  className={cn(
                    "font-uthmani text-[4rem] sm:text-[4.5rem] leading-[1.5] truncate max-w-full px-6 py-2 rounded-2xl",
                    "cursor-pointer transition-all duration-200",
                    "hover:bg-primary/10 hover:text-primary hover:scale-[1.04]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70",
                    isPlaying &&
                      currentAyah === flashWord.ayah &&
                      currentWordIndex === flashWord.wordIndex &&
                      "bg-blue-500/14 text-blue-500 outline outline-2 outline-blue-500/70",
                  )}
                >
                  {flashWord.word}
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  {language === "ar"
                    ? "اضغط على الكلمة للاستماع، أو على البطاقة لإظهار الآية"
                    : "Tap the word to hear it, or tap the card for the full verse"}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Ayah-level nav (◀ / ▶) — sequentially walk through verses.
          Mirrors reference's `ayahNavRow` (index.html:3535-3553); hidden in
          lesson mode per index.html:4316 (`lessonModeActive ? 'none' : 'flex'`)
          so only the lesson nav row's prev/next/shuffle shows when a lesson
          is active. */}
      {verses.length > 0 && totalSlides === 0 && (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={() => goToAyah(-1)}
            disabled={surah === 1 && ayahFrom === 1}
            title={language === "ar" ? "الآية السابقة" : "Previous ayah"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={() => goToAyah(1)}
            disabled={surah === 114 && ayahFrom === maxAyah}
            title={language === "ar" ? "الآية التالية" : "Next ayah"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lesson word nav — prev / next / shuffle. Matches reference's
          `lessonNavRow` (index.html:2452-2477) which contains exactly these
          three buttons. The Play/Pause control lives in the recitation card
          below (matching the reference's separate recitation section), not
          here.

          Hidden on L1 (letter slides) to match the reference: when
          `currentLessonId === 'lesson1'` the reference's `gridMode` is true and
          `updateLessonUIVisibility` (index.html:4310-4312) hides the lesson
          nav row entirely. */}
      {totalSlides > 0 && !letterSlide && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={lessonPrev}
            title={language === "ar" ? "الكلمة السابقة" : "Previous"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={lessonNext}
            title={language === "ar" ? "الكلمة التالية" : "Next"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={lessonShuffle}
            title={language === "ar" ? "اختيار عشوائي" : "Random"}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lesson info card */}
      {activeSlide && (
        <div className="flex items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm">
            📘{" "}
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
          <p className="text-left text-xs text-muted-foreground">
            {language === "ar"
              ? "القارئ: محمود خليل الحصري (المعلّم)"
              : "Reciter: Mahmoud Khalil Al-Husary (Teacher)"}
          </p>
        </div>
      )}

    </div>

      {/* Floating play/pause bubble — only after first play, matches reference currentMode !== null */}
      {verses.length > 0 && hasPlayedOnce && (
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
