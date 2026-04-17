"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressIndicator } from "@/components/lesson";
import { useLanguage, useAudioContext } from "@/providers";

type PositionData = {
  titleAr: string;
  word: string;
  roman: string;
  positionAr: string;
  formShape: string;
  audioUrl: string;
  letters: string[];
  targetLetter: string;
};

type LetterData = {
  key: string;
  glyph: string;
  nameAr: string;
  nameEn: string;
  positions: {
    beginning: PositionData | null;
    middle: PositionData | null;
    end: PositionData | null;
  };
};

type Position = "beginning" | "middle" | "end";

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

const POSITION_LABELS: Record<Position, { ar: string; en: string }> = {
  beginning: { ar: "أول الكلمة", en: "Beginning" },
  middle: { ar: "وسط الكلمة", en: "Middle" },
  end: { ar: "آخر الكلمة", en: "End" },
};

export function LetterFormsGame() {
  const { language } = useLanguage();
  const { stop } = useAudioContext();
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<Position>("beginning");
  const [isLoading, setIsLoading] = useState(true);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const sequenceRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    fetch("/data/letters/letter_positions.json")
      .then((r) => r.json())
      .then((data: { letters: LetterData[] }) => {
        setLetters(data.letters);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const total = letters.length;
  const currentLetter = letters[index];
  const currentPosition = currentLetter?.positions[position];

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
    setShowForm(false);
    cancelSequence();
  }, [cancelSequence]);

  // Reset when letter or position changes
  useEffect(() => {
    resetState();
  }, [index, position, resetState]);

  // Cleanup on unmount
  useEffect(() => cancelSequence, [cancelSequence]);

  const playInstructions = useCallback(() => {
    if (!currentPosition || !currentLetter) return;
    stop();
    cancelSequence();
    resetState();

    const letterAudio = LETTER_AUDIO[currentLetter.glyph] || "";
    const wordAudio = currentPosition.audioUrl || "";

    sequenceRef.current = playAudioSequence([
      "/audio/ui/inst_part1.mp3",
      wordAudio,
      "/audio/ui/inst_part2.mp3",
      letterAudio,
    ]);
  }, [currentPosition, currentLetter, stop, cancelSequence, resetState]);

  const handleLetterClick = useCallback(
    (clickedLetter: string, clickedIdx: number) => {
      if (answered) return;
      if (!currentPosition || !currentLetter) return;

      stop();
      cancelSequence();

      const letterName = currentLetter.nameAr;
      const word = currentPosition.word;
      const posLabel = currentPosition.positionAr;

      if (clickedLetter === currentPosition.targetLetter) {
        // Correct
        setAnswered(true);
        setHighlightIdx(clickedIdx);
        setShowForm(true);
        setFeedback(
          language === "ar"
            ? `أحسنت! هذا هو حرف ${letterName} في كلمة ${word}.`
            : `Correct! This is the letter ${currentLetter.nameEn} in the word ${word}.`,
        );

        const letterAudio = LETTER_AUDIO[currentLetter.glyph] || "";
        sequenceRef.current = playAudioSequence([
          "/audio/ui/success_part1.mp3",
          "/audio/ui/success_part2.mp3",
          letterAudio,
        ]);
      } else {
        const newWrong = wrongAttempts + 1;
        setWrongAttempts(newWrong);

        // Find the correct letter index
        const correctIdx = currentPosition.letters.findIndex(
          (l) => l === currentPosition.targetLetter,
        );

        if (newWrong === 1) {
          // First wrong: highlight correct, show explanation
          setHighlightIdx(correctIdx);
          setShowForm(true);
          setFeedback(
            language === "ar"
              ? `انظر هنا، هذا هو حرف ${letterName} في كلمة ${word}، وهكذا يُكتب في ${posLabel}: ${currentPosition.formShape}`
              : `Look here, this is the letter ${currentLetter.nameEn} in the word ${word}, written in ${position} as: ${currentPosition.formShape}`,
          );

          const letterAudio = LETTER_AUDIO[currentLetter.glyph] || "";
          sequenceRef.current = playAudioSequence([
            "/audio/ui/wrong1_part1.mp3",
            "/audio/ui/wrong1_part2.mp3",
            letterAudio,
          ]);
        } else {
          // Subsequent wrongs: reminder
          setHighlightIdx(correctIdx);
          setFeedback(
            language === "ar"
              ? `هذا ليس حرف ${letterName}. تذكّر أين لونّنا هذا الحرف قبل قليل.`
              : `This is not the letter ${currentLetter.nameEn}. Remember where we highlighted it.`,
          );

          const letterAudio = LETTER_AUDIO[currentLetter.glyph] || "";
          sequenceRef.current = playAudioSequence([
            "/audio/ui/wrong2_part1.mp3",
            letterAudio,
            "/audio/ui/wrong2_part2.mp3",
          ]);
        }
      }
    },
    [
      answered,
      currentPosition,
      currentLetter,
      wrongAttempts,
      position,
      language,
      stop,
      cancelSequence,
    ],
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

  if (letters.length === 0 || !currentLetter) return null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
      {/* Title */}
      <div className="flex w-full items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {language === "ar" ? "أشكال الحروف في الكلمة" : "Letter Forms in Words"}
        </span>
        <Badge variant="outline" className="text-xs">
          {index + 1} / {total}
        </Badge>
      </div>

      <ProgressIndicator current={index} total={total} className="w-full max-w-md" />

      {/* Main card */}
      <div className="w-full rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        {/* Current letter title */}
        {currentPosition && (
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground" dir="rtl">
            {currentPosition.titleAr}
          </p>
        )}

        {/* Position mode switch buttons */}
        <div className="mb-4 flex justify-center gap-2">
          {(["beginning", "middle", "end"] as Position[]).map((pos) => (
            <Button
              key={pos}
              variant={position === pos ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-4 text-xs cursor-pointer",
                position === pos && "bg-primary text-primary-foreground",
              )}
              onClick={() => setPosition(pos)}
            >
              {language === "ar" ? POSITION_LABELS[pos].ar : POSITION_LABELS[pos].en}
            </Button>
          ))}
        </div>

        {/* Listen to instructions button */}
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

        {/* Word display with clickable letters */}
        {currentPosition ? (
          <div className="mb-4 text-center font-uthmani text-[4rem] leading-[1.5] sm:text-[4.5rem]" dir="rtl">
            {currentPosition.letters.map((letter, i) => (
              <span
                key={i}
                role="button"
                tabIndex={0}
                className={cn(
                  "inline cursor-pointer rounded-[0.4rem] px-[0.05em] transition-all duration-150",
                  "hover:text-emerald-400",
                  highlightIdx === i && [
                    "text-red-600 dark:text-red-400",
                    "shadow-[0_0_6px_rgba(0,0,0,0.35)]",
                    "scale-[1.12]",
                    "rounded-full px-[0.25em] py-[0.15em]",
                    "bg-amber-50/95 dark:bg-yellow-900/30",
                    "shadow-[0_0_0_4px_rgba(234,179,8,0.9)]",
                    "text-slate-900 dark:text-red-400",
                  ],
                )}
                onClick={() => handleLetterClick(letter, i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleLetterClick(letter, i);
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {language === "ar" ? "لا يوجد مثال لهذا الموضع" : "No example for this position"}
          </div>
        )}

        {/* Feedback text */}
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

        {/* Letter form shape reveal */}
        {showForm && currentPosition && (
          <div className="mb-4 flex items-center justify-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {language === "ar"
                ? `شكل حرف ${currentLetter.nameAr} في ${currentPosition.positionAr}:`
                : `Form of ${currentLetter.nameEn} in ${position}:`}
            </span>
            <span className="font-uthmani text-3xl" dir="rtl">
              {currentPosition.formShape}
            </span>
          </div>
        )}

        {/* Current letter indicator */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {language === "ar"
              ? `حرف ${currentLetter.nameAr}`
              : `Letter: ${currentLetter.nameEn}`}
          </span>
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
