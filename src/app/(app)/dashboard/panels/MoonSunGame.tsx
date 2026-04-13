"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressIndicator } from "@/components/lesson";
import { useLanguage, useAudioContext } from "@/providers";

type MoonSunEntry = {
  word: string;
  wordIndex: number;
  exampleWord: string;
  count: number | null;
  baseLetter: string;
  displayLetter: string;
  type: "sun" | "moon";
};

type MoonSunSlide = MoonSunEntry & {
  surah: number;
  ayah: number;
};

type FilterMode = "all" | "moon" | "sun";

const MOON_ORDER = "ابجحخعغفقكمهوي".split("");
const SUN_ORDER = "تثدذرزسشصضطظلن".split("");

const LETTER_AUDIO: Record<string, string> = {
  ا: "/audio/letters/001-alif.mp3",
  ب: "/audio/letters/002-ba.mp3",
  ت: "/audio/letters/003-taa.mp3",
  ث: "/audio/letters/004-tha.mp3",
  ج: "/audio/letters/005-jeem.mp3",
  ح: "/audio/letters/006-haa.mp3",
  خ: "/audio/letters/007-khaa.mp3",
  د: "/audio/letters/008-dal.mp3",
  ذ: "/audio/letters/009-dhal.mp3",
  ر: "/audio/letters/010-raa.mp3",
  ز: "/audio/letters/011-zaa.mp3",
  س: "/audio/letters/012-seen.mp3",
  ش: "/audio/letters/013-sheen.mp3",
  ص: "/audio/letters/014-saad.mp3",
  ض: "/audio/letters/015-dhaad.mp3",
  ط: "/audio/letters/016-toa.mp3",
  ظ: "/audio/letters/017-dhaa.mp3",
  ع: "/audio/letters/018-ain.mp3",
  غ: "/audio/letters/019-ghain.mp3",
  ف: "/audio/letters/020-faa.mp3",
  ق: "/audio/letters/021-qaaf.mp3",
  ك: "/audio/letters/022-kaaf.mp3",
  ل: "/audio/letters/023-laam.mp3",
  م: "/audio/letters/024-meem.mp3",
  ن: "/audio/letters/025-noon.mp3",
  و: "/audio/letters/026-waw.mp3",
  ه: "/audio/letters/027-ha.mp3",
  ي: "/audio/letters/028-yaa.mp3",
};

// Split Arabic word into grapheme clusters (base letter + combining marks)
const COMBINING_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0671]/;

function splitGraphemes(word: string): string[] {
  const clusters: string[] = [];
  let current = "";
  for (const ch of word) {
    if (COMBINING_MARKS.test(ch)) {
      current += ch;
    } else {
      if (current) clusters.push(current);
      current = ch;
    }
  }
  if (current) clusters.push(current);
  return clusters;
}

function getBaseLetter(cluster: string): string {
  return cluster.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0671]/g, "");
}

// Find the target letter index (the letter after ال in the word)
function findTargetIndex(clusters: string[], targetLetter: string): number {
  for (let i = 0; i < clusters.length; i++) {
    const base = getBaseLetter(clusters[i]);
    if (base === targetLetter) return i;
  }
  return -1;
}

// Chained audio playback helper
function playAudioSequence(
  urls: string[],
  onDone?: () => void,
): { cancel: () => void } {
  let cancelled = false;
  let currentAudio: HTMLAudioElement | null = null;

  function playNext(index: number) {
    if (cancelled || index >= urls.length) {
      onDone?.();
      return;
    }
    const url = urls[index];
    if (!url) {
      playNext(index + 1);
      return;
    }
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => playNext(index + 1);
    audio.onerror = () => playNext(index + 1);
    audio.play().catch(() => playNext(index + 1));
  }

  playNext(0);
  return {
    cancel: () => {
      cancelled = true;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    },
  };
}

export function MoonSunGame() {
  const { language } = useLanguage();
  const { stop } = useAudioContext();
  const [rawData, setRawData] = useState<MoonSunSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<FilterMode>("all");
  const [index, setIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showRule, setShowRule] = useState(false);
  const sequenceRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    fetch("/data/lessons/lesson16_moon_sun_letters.json")
      .then((r) => r.json())
      .then((data: Record<string, MoonSunEntry[]>) => {
        const slides: MoonSunSlide[] = [];
        const seen = new Set<string>();
        for (const [key, entries] of Object.entries(data)) {
          const [s, a] = key.split(":");
          for (const entry of entries) {
            const dedup = `${entry.type}:${entry.baseLetter}`;
            if (seen.has(dedup)) continue;
            seen.add(dedup);
            slides.push({
              ...entry,
              surah: Number(s),
              ayah: Number(a),
            });
          }
        }
        setRawData(slides);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // Filter and sort slides by mode
  const slides = useMemo(() => {
    let filtered = rawData;
    if (mode === "moon") filtered = rawData.filter((s) => s.type === "moon");
    if (mode === "sun") filtered = rawData.filter((s) => s.type === "sun");

    return filtered.sort((a, b) => {
      if (mode === "all") {
        // Moon first, then sun
        if (a.type !== b.type) return a.type === "moon" ? -1 : 1;
      }
      const order = a.type === "moon" ? MOON_ORDER : SUN_ORDER;
      return order.indexOf(a.baseLetter) - order.indexOf(b.baseLetter);
    });
  }, [rawData, mode]);

  const total = slides.length;
  const current = slides[index];

  const cancelSequence = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.cancel();
      sequenceRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setWrongAttempts(0);
    setAnswered(false);
    setHighlightIdx(null);
    setFeedback("");
    setShowRule(false);
    cancelSequence();
  }, [cancelSequence]);

  useEffect(() => {
    resetState();
  }, [index, mode, resetState]);

  useEffect(() => cancelSequence, [cancelSequence]);

  const applyMode = useCallback(
    (newMode: FilterMode) => {
      cancelSequence();
      stop();
      setMode(newMode);
      setIndex(0);
    },
    [cancelSequence, stop],
  );

  const wordAudioUrl = useMemo(() => {
    if (!current) return "";
    const s = String(current.surah).padStart(3, "0");
    const a = String(current.ayah).padStart(3, "0");
    const w = String(current.wordIndex).padStart(3, "0");
    return `https://audio.qurancdn.com/wbw/${s}_${a}_${w}.mp3`;
  }, [current]);

  const playInstructions = useCallback(() => {
    if (!current) return;
    stop();
    cancelSequence();
    resetState();

    const letterAudio = LETTER_AUDIO[current.baseLetter] || "";
    const ruleAudio =
      current.type === "sun"
        ? "/audio/ui_moonsun/ms_inst_sun.mp3"
        : "/audio/ui_moonsun/ms_inst_moon.mp3";
    const tryAudio =
      current.type === "sun"
        ? "/audio/ui_moonsun/ms_try_sun.mp3"
        : "/audio/ui_moonsun/ms_try_moon.mp3";

    sequenceRef.current = playAudioSequence([
      "/audio/ui_moonsun/ms_inst_1.mp3",
      wordAudioUrl,
      "/audio/ui_moonsun/ms_inst_2.mp3",
      letterAudio,
      ruleAudio,
      tryAudio,
    ]);
  }, [current, wordAudioUrl, stop, cancelSequence, resetState]);

  const handleClusterClick = useCallback(
    (clusterIdx: number, baseChar: string) => {
      if (answered) return;
      if (!current) return;

      stop();
      cancelSequence();

      if (baseChar === current.baseLetter) {
        // Correct
        setAnswered(true);
        setHighlightIdx(clusterIdx);
        setShowRule(true);
        setFeedback(
          language === "ar"
            ? `أحسنت! هذا هو الحرف ${current.displayLetter} ${current.type === "sun" ? "الشمسي" : "القمري"} بعد (ٱلـ) في كلمة ${current.word}`
            : `Correct! This is the ${current.type} letter ${current.displayLetter} after (al-) in the word ${current.word}`,
        );

        const letterAudio = LETTER_AUDIO[current.baseLetter] || "";
        const ruleAudio =
          current.type === "sun"
            ? "/audio/ui_moonsun/ms_inst_sun.mp3"
            : "/audio/ui_moonsun/ms_inst_moon.mp3";

        sequenceRef.current = playAudioSequence([
          "/audio/ui_moonsun/ms_success_1.mp3",
          "/audio/ui_moonsun/ms_success_2.mp3",
          letterAudio,
          ruleAudio,
        ]);
      } else {
        const newWrong = wrongAttempts + 1;
        setWrongAttempts(newWrong);

        // Find correct index
        const clusters = splitGraphemes(current.word);
        const correctIdx = findTargetIndex(clusters, current.baseLetter);
        setHighlightIdx(correctIdx);

        if (newWrong === 1) {
          setShowRule(true);
          setFeedback(
            language === "ar"
              ? "انظر هنا: هذا هو الحرف بعد (ٱلـ). جرّب مرة أخرى."
              : "Look here: this is the letter after (al-). Try again.",
          );

          const letterAudio = LETTER_AUDIO[current.baseLetter] || "";
          sequenceRef.current = playAudioSequence([
            "/audio/ui_moonsun/ms_wrong_1.mp3",
            letterAudio,
            "/audio/ui_moonsun/ms_wrong_3.mp3",
          ]);
        } else {
          setFeedback(
            language === "ar"
              ? "ليس هذا هو الحرف بعد (ٱلـ). تذكّر مكان الحرف الملوّن."
              : "This is not the letter after (al-). Remember the highlighted letter.",
          );

          const letterAudio = LETTER_AUDIO[current.baseLetter] || "";
          sequenceRef.current = playAudioSequence([
            "/audio/ui_moonsun/ms_wrong_1.mp3",
            letterAudio,
            "/audio/ui_moonsun/ms_wrong_3.mp3",
          ]);
        }
      }
    },
    [answered, current, wrongAttempts, language, stop, cancelSequence],
  );

  const prev = useCallback(() => {
    cancelSequence();
    stop();
    setIndex((i) => Math.max(0, i - 1));
  }, [cancelSequence, stop]);

  const next = useCallback(() => {
    cancelSequence();
    stop();
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total, cancelSequence, stop]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (!current) return null;

  const clusters = splitGraphemes(current.word);

  const sunRule =
    language === "ar"
      ? "حرف شمسي: لا تُنطق اللام في (ٱلـ)، ويُشدَّد الحرف الذي بعدها"
      : "Sun letter: the lam in (al-) is silent, and the following letter is doubled";
  const moonRule =
    language === "ar"
      ? "حرف قمري: تُنطق اللام في (ٱلـ) بوضوح"
      : "Moon letter: the lam in (al-) is pronounced clearly";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
      {/* Title bar */}
      <div className="flex w-full items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {language === "ar"
            ? "الحروف الشمسية والقمرية"
            : "Moon & Sun Letters"}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            current.type === "sun" ? "text-amber-500" : "text-blue-400",
          )}
        >
          {current.type === "sun" ? "☀️" : "🌙"}{" "}
          {index + 1} / {total}
        </Badge>
      </div>

      <ProgressIndicator current={index} total={total} className="w-full max-w-md" />

      {/* Main card */}
      <div className="w-full rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        {/* Mode filter buttons */}
        <div className="mb-4 flex justify-center gap-2">
          {(["all", "moon", "sun"] as FilterMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-4 text-xs cursor-pointer",
                mode === m && "bg-primary text-primary-foreground",
              )}
              onClick={() => applyMode(m)}
            >
              {m === "all"
                ? language === "ar"
                  ? "الكل"
                  : "All"
                : m === "moon"
                  ? language === "ar"
                    ? "🌙 قمرية"
                    : "🌙 Moon"
                  : language === "ar"
                    ? "☀️ شمسية"
                    : "☀️ Sun"}
            </Button>
          ))}
        </div>

        {/* Listen to instructions */}
        <div className="mb-5 flex justify-center">
          <Button
            variant="outline"
            className="gap-2 rounded-full cursor-pointer"
            onClick={playInstructions}
          >
            <Volume2 className="h-4 w-4" />
            {language === "ar" ? "استمع للتعليمات" : "Listen to Instructions"}
          </Button>
        </div>

        {/* Word display with clickable grapheme clusters */}
        <div className="mb-4">
          <div
            className="flex flex-wrap items-center justify-center gap-2 font-uthmani text-[3rem] leading-relaxed sm:text-[4rem]"
            dir="rtl"
          >
            {clusters.map((cluster, i) => {
              const base = getBaseLetter(cluster);
              return (
                <span
                  key={i}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "inline-block cursor-pointer rounded-lg px-2 py-1 transition-all duration-200",
                    "border-2 border-transparent",
                    "hover:bg-muted/50",
                    highlightIdx === i && [
                      "text-red-600 dark:text-red-400 scale-110",
                      "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30",
                      "shadow-[0_0_16px_rgba(250,204,21,0.4)]",
                    ],
                  )}
                  onClick={() => handleClusterClick(i, base)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleClusterClick(i, base);
                  }}
                >
                  {cluster}
                </span>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={cn(
              "mb-4 rounded-xl p-3 text-center text-sm",
              answered
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
            dir="rtl"
          >
            {feedback}
          </div>
        )}

        {/* Rule explanation */}
        {showRule && (
          <div className="mb-4 rounded-xl bg-muted/50 px-4 py-3 text-center text-sm" dir="rtl">
            <span
              className={cn(
                "font-semibold",
                current.type === "sun"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400",
              )}
            >
              {current.type === "sun" ? sunRule : moonRule}
            </span>
            <p className="mt-1 text-muted-foreground">
              {language === "ar"
                ? `مثال: ${current.word}`
                : `Example: ${current.word}`}
            </p>
          </div>
        )}

        {/* Current letter indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              current.type === "sun"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-400",
            )}
          >
            {current.type === "sun"
              ? language === "ar"
                ? "شمسي"
                : "Sun"
              : language === "ar"
                ? "قمري"
                : "Moon"}
          </span>
          <span className="font-uthmani text-lg">{current.displayLetter}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer"
          onClick={prev}
          disabled={index === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer"
          onClick={next}
          disabled={index === total - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
