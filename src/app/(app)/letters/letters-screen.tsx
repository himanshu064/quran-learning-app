"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProgressIndicator, LessonNav } from "@/components/lesson";
import { VercelTabs } from "@/components/common";
import { useLanguage, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";

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

const POSITION_TABS = [
  { value: "beginning", label: "Beginning" },
  { value: "middle", label: "Middle" },
  { value: "end", label: "End" },
];

const POSITION_TABS_AR = [
  { value: "beginning", label: "أول الكلمة" },
  { value: "middle", label: "وسط الكلمة" },
  { value: "end", label: "آخر الكلمة" },
];

// Map letter glyph → audio file
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

export function LettersScreen() {
  const { language } = useLanguage();
  const { playUrl, playLetterAudio, isPlaying } = useAudioContext();
  const { saveProgress, saveLastLesson, completeLesson, getLessonProgress } =
    useProgress();
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<Position>("beginning");
  const [isLoading, setIsLoading] = useState(true);
  const restored = useRef(false);

  useEffect(() => {
    fetch("/data/letters/letter_positions.json")
      .then((r) => r.json())
      .then((data: { letters: LetterData[] }) => {
        setLetters(data.letters);
        // Restore saved position
        if (!restored.current) {
          restored.current = true;
          const saved = getLessonProgress("lesson2");
          if (
            saved &&
            saved.slideIndex > 0 &&
            saved.slideIndex < data.letters.length
          ) {
            setIndex(saved.slideIndex);
          }
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [getLessonProgress]);

  const total = letters.length;
  const currentLetter = letters[index];
  const currentPosition = currentLetter?.positions[position];

  // Track progress on letter change
  useEffect(() => {
    if (total > 0) {
      saveProgress({ lessonId: "lesson2", slideIndex: index });
      saveLastLesson("lesson2");
      if (index === total - 1) {
        completeLesson("lesson2");
      }
    }
  }, [index, total, saveProgress, saveLastLesson, completeLesson]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const shuffle = useCallback(() => {
    setIndex(Math.floor(Math.random() * total));
  }, [total]);

  const playLetterSound = useCallback(() => {
    if (!currentLetter) return;
    const audioPath = LETTER_AUDIO[currentLetter.glyph];
    if (audioPath) playLetterAudio(audioPath);
  }, [currentLetter, playLetterAudio]);

  const playWordSound = useCallback(() => {
    if (!currentPosition?.audioUrl) return;
    playUrl(currentPosition.audioUrl);
  }, [currentPosition, playUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (letters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "لا توجد بيانات للحروف"
            : "No letter data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-6">
      <h2 className="text-lg font-semibold">
        {language === "ar" ? "أشكال الحروف في الكلمة" : "Letter Forms in Words"}
      </h2>

      <ProgressIndicator
        current={index}
        total={total}
        className="w-full max-w-md"
      />

      {/* Letter card */}
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8">
        {/* Title */}
        {currentPosition && (
          <p
            className="mb-4 text-center text-sm font-medium text-muted-foreground"
            dir="rtl"
          >
            {currentPosition.titleAr}
          </p>
        )}

        {/* Position tabs */}
        <div className="mb-6 flex justify-center">
          <VercelTabs
            tabs={language === "ar" ? POSITION_TABS_AR : POSITION_TABS}
            activeTab={position}
            onTabChange={(v) => setPosition(v as Position)}
          />
        </div>

        {/* Play letter audio button */}
        <div className="mb-6 flex justify-center">
          <Button
            variant="outline"
            className="gap-2 rounded-full"
            onClick={playLetterSound}
          >
            <Volume2 className="h-4 w-4" />
            {language === "ar" ? "استمع للحرف" : "Listen to Letter"}
          </Button>
        </div>

        {/* Large word display with highlighted target letter */}
        {currentPosition ? (
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-1 font-uthmani text-6xl leading-relaxed sm:text-7xl" dir="rtl">
              {currentPosition.letters.map((letter, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-block cursor-pointer rounded-lg px-1 py-0.5 transition-all duration-200",
                    letter === currentPosition.targetLetter
                      ? "text-emerald-400 scale-110 border-2 border-emerald-400 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                      : "border-2 border-transparent hover:text-emerald-300 hover:bg-muted/50",
                  )}
                  onClick={playWordSound}
                >
                  {letter}
                </span>
              ))}
            </div>

            {/* Roman transliteration */}
            <p className="mt-3 text-sm text-muted-foreground">
              {currentPosition.roman}
            </p>

            {/* Form shape badge */}
            <div className="mt-3 flex items-center justify-center gap-3 rounded-lg bg-muted/50 px-4 py-2">
              <span className="font-uthmani text-2xl" dir="rtl">
                {currentPosition.formShape}
              </span>
              <span className="text-sm text-muted-foreground">
                {language === "ar"
                  ? currentPosition.positionAr
                  : position}
              </span>
            </div>

            {/* Play word button */}
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="lg"
              className={cn(
                "mt-4 gap-2 rounded-full cursor-pointer",
                isPlaying && "bg-emerald-500 hover:bg-emerald-600",
              )}
              onClick={playWordSound}
            >
              <Volume2 className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
              {isPlaying
                ? language === "ar" ? "يعمل..." : "Playing..."
                : language === "ar" ? "تشغيل الكلمة" : "Play Word"}
            </Button>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {language === "ar"
              ? "لا يوجد مثال لهذا الموضع"
              : "No example for this position"}
          </div>
        )}

        {/* Letter indicator */}
        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">
            {language === "ar"
              ? `حرف ${currentLetter.nameAr}`
              : `Letter: ${currentLetter.nameEn}`}
          </span>
        </div>
      </div>

      <LessonNav onPrev={prev} onNext={next} onShuffle={shuffle} />
    </div>
  );
}
