"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Volume2, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Card replaced with client-style divs
import { ProgressIndicator } from "@/components/lesson";
import { VercelTabs } from "@/components/common";
import { useLanguage, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import { useSelectedWord } from "../selected-word-context";

const LESSON_ID = "lesson2";

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

function extractLettersFromWord(word: string): string[] {
  const harakatRegex = /[\u064B-\u0652]/g;
  const base = word.replace(harakatRegex, "");
  const result: string[] = [];
  for (const ch of base) {
    if (ch.charCodeAt(0) >= 0x0600 && ch.charCodeAt(0) <= 0x06ff) {
      result.push(ch);
    }
  }
  return result;
}

export function LettersPanel() {
  const { language } = useLanguage();
  const { playUrl, playLetterAudio, stop, isPlaying } = useAudioContext();
  const { selectedWord } = useSelectedWord();
  const { saveProgress, saveLastLesson, completeLesson, getLessonProgress } =
    useProgress();
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<Position>("beginning");
  const [isLoading, setIsLoading] = useState(true);
  const restored = useRef(false);

  const getLessonProgressRef = useRef(getLessonProgress);
  getLessonProgressRef.current = getLessonProgress;
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;
  const saveLastLessonRef = useRef(saveLastLesson);
  saveLastLessonRef.current = saveLastLesson;
  const completeLessonRef = useRef(completeLesson);
  completeLessonRef.current = completeLesson;

  useEffect(() => {
    fetch("/data/letters/letter_positions.json")
      .then((r) => r.json())
      .then((data: { letters: LetterData[] }) => {
        setLetters(data.letters);
        if (!restored.current) {
          restored.current = true;
          const saved = getLessonProgressRef.current(LESSON_ID);
          if (saved && saved.slideIndex > 0 && saved.slideIndex < data.letters.length) {
            setIndex(saved.slideIndex);
          }
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const total = letters.length;
  const currentLetter = letters[index];
  const currentPosition = currentLetter?.positions[position];

  useEffect(() => {
    if (total > 0) {
      saveProgressRef.current({ lessonId: LESSON_ID, slideIndex: index });
      saveLastLessonRef.current(LESSON_ID);
      if (index === total - 1) {
        completeLessonRef.current(LESSON_ID);
      }
    }
  }, [index, total]);

  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  const playLetterSound = useCallback(() => {
    if (!currentLetter) return;
    stop(); // stop any current audio first
    const audioPath = LETTER_AUDIO[currentLetter.glyph];
    if (audioPath) playLetterAudio(audioPath);
  }, [currentLetter, playLetterAudio, stop]);

  // When a letter in the word display is clicked:
  // Only play that letter's audio — don't change position tab or word
  const handleLetterInWordClick = useCallback(
    (clickedLetter: string) => {
      const baseGlyph = clickedLetter.replace(/[\u064B-\u0652]/g, "");
      stop();
      const audioPath = LETTER_AUDIO[baseGlyph];
      if (audioPath) playLetterAudio(audioPath);
    },
    [playLetterAudio, stop],
  );

  const playWordSound = useCallback(() => {
    if (!currentPosition?.audioUrl) return;
    stop(); // stop any current audio first
    playUrl(currentPosition.audioUrl);
  }, [currentPosition, playUrl, stop]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (!selectedWord && letters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar" ? "لا توجد بيانات للحروف" : "No letter data available"}
        </p>
      </div>
    );
  }

  // When a word is selected from the Verse tab, show its letter breakdown
  if (selectedWord) {
    const wordLetters = extractLettersFromWord(selectedWord.word);
    return <SelectedWordLetters
      word={selectedWord.word}
      surah={selectedWord.surah}
      ayah={selectedWord.ayah}
      wordLetters={wordLetters}
      language={language}
      playLetterAudio={playLetterAudio}
      stop={stop}
      isPlaying={isPlaying}
      letterAudioMap={LETTER_AUDIO}
    />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      {/* Headline */}
      <div className="flex w-full items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {language === "ar" ? "أشكال الحروف في الكلمة" : "Letter Forms in Words"}
        </span>
        <Badge variant="outline" className="text-xs">
          {index + 1} / {total}
        </Badge>
      </div>

      <ProgressIndicator current={index} total={total} className="w-full max-w-md" />

      {/* Letter card */}
      <div className="w-full max-w-md rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        {currentPosition && (
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground" dir="rtl">
            {currentPosition.titleAr}
          </p>
        )}

        <div className="mb-6 flex justify-center">
          <VercelTabs
            tabs={language === "ar" ? POSITION_TABS_AR : POSITION_TABS}
            activeTab={position}
            onTabChange={(v) => setPosition(v as Position)}
          />
        </div>

        <div className="mb-6 flex justify-center">
          <Button variant="outline" className="gap-2 rounded-full cursor-pointer" onClick={playLetterSound}>
            <Volume2 className="h-4 w-4" />
            {language === "ar" ? "استمع للحرف" : "Listen to Letter"}
          </Button>
        </div>

        {currentPosition ? (
          <div className="mb-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-1 font-uthmani text-4xl leading-relaxed sm:text-5xl" dir="rtl">
              {currentPosition.letters.map((letter, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-block cursor-pointer rounded-lg px-1 py-0.5 transition-all duration-200",
                    letter === currentPosition.targetLetter
                      ? "text-emerald-700 dark:text-emerald-400 scale-110 border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                      : "border-2 border-transparent hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-muted/50",
                  )}
                  onClick={() =>
                    handleLetterInWordClick(letter)
                  }
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{currentPosition.roman}</p>
            <div className="mt-3 flex items-center justify-center gap-3 rounded-lg bg-muted/50 px-4 py-2">
              <span className="font-uthmani text-2xl" dir="rtl">{currentPosition.formShape}</span>
              <span className="text-sm text-muted-foreground">
                {language === "ar" ? currentPosition.positionAr : position}
              </span>
            </div>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="lg"
              className={cn("mt-4 gap-2 rounded-full cursor-pointer", isPlaying && "bg-emerald-500 hover:bg-emerald-600")}
              onClick={playWordSound}
            >
              <Volume2 className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
              {language === "ar" ? "تشغيل الكلمة" : "Play Word"}
            </Button>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {language === "ar" ? "لا يوجد مثال لهذا الموضع" : "No example for this position"}
          </div>
        )}

        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">
            {language === "ar" ? `حرف ${currentLetter.nameAr}` : `Letter: ${currentLetter.nameEn}`}
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer"
          onClick={prev}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer"
          onClick={next}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Shows the letter breakdown of a selected word from the Verse tab
function SelectedWordLetters({
  word,
  surah,
  ayah,
  wordLetters,
  language,
  playLetterAudio,
  stop,
  isPlaying,
  letterAudioMap,
}: {
  word: string;
  surah: number;
  ayah: number;
  wordLetters: string[];
  language: string;
  playLetterAudio: (path: string) => void;
  stop: () => void;
  isPlaying: boolean;
  letterAudioMap: Record<string, string>;
}) {
  const [activeLetterIdx, setActiveLetterIdx] = useState(0);
  const activeLetter = wordLetters[activeLetterIdx];
  const letterName = activeLetter
    ? Object.entries(letterAudioMap).find(([glyph]) => glyph === activeLetter)?.[0]
    : null;

  const handleLetterClick = (idx: number) => {
    setActiveLetterIdx(idx);
    stop();
    const glyph = wordLetters[idx];
    const audioPath = letterAudioMap[glyph];
    if (audioPath) playLetterAudio(audioPath);
  };

  const handlePlayActive = () => {
    if (activeLetter) {
      stop();
      const audioPath = letterAudioMap[activeLetter];
      if (audioPath) playLetterAudio(audioPath);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      {/* Headline */}
      <div className="flex w-full items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {language === "ar" ? "حروف الكلمة المختارة" : "Letters of Selected Word"}
        </span>
        <Badge variant="outline" className="text-xs">
          {language === "ar"
            ? `سورة ${surah} · آية ${ayah}`
            : `Surah ${surah} · Ayah ${ayah}`}
        </Badge>
      </div>

      {/* Word display */}
      <div className="w-full max-w-md rounded-[1.125rem] border border-border bg-card">
        <div className="p-6 sm:p-8">
          {/* Full word */}
          <p className="mb-2 text-center font-uthmani text-3xl" dir="rtl">
            {word}
          </p>
          <p className="mb-6 text-center text-xs text-muted-foreground">
            {language === "ar"
              ? "اضغط على أي حرف للاستماع إليه"
              : "Click any letter to listen"}
          </p>

          {/* Individual letters */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 font-uthmani text-4xl leading-relaxed sm:text-5xl" dir="rtl">
            {wordLetters.map((letter, i) => (
              <span
                key={i}
                className={cn(
                  "inline-block cursor-pointer rounded-lg px-1.5 py-0.5 transition-all duration-200",
                  i === activeLetterIdx
                    ? "text-emerald-700 dark:text-emerald-400 scale-110 border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                    : "border-2 border-transparent hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-muted/50",
                )}
                onClick={() => handleLetterClick(i)}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Active letter info */}
          {activeLetter && (
            <div className="text-center">
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="lg"
                className={cn("gap-2 rounded-full cursor-pointer", isPlaying && "bg-emerald-500 hover:bg-emerald-600")}
                onClick={handlePlayActive}
              >
                <Volume2 className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
                {isPlaying
                  ? language === "ar" ? "إيقاف" : "Stop"
                  : language === "ar" ? "استمع للحرف" : "Listen to Letter"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Letter nav */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer"
          onClick={() => setActiveLetterIdx((i) => (i - 1 + wordLetters.length) % wordLetters.length)}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer"
          onClick={() => setActiveLetterIdx((i) => (i + 1) % wordLetters.length)}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
