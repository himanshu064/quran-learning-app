"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage, useAudioContext, useLessonContext } from "@/providers";
import { LetterFormsGame } from "./LetterFormsGame";

type LetterEntry = {
  id: number;
  glyph: string;
  name_ar: string;
  name_en: string;
  audio: string;
};


export function LettersPanel() {
  const { lessonId } = useLessonContext();

  // Lesson 2: show interactive letter forms game
  if (lessonId === "lesson2") {
    return <LetterFormsGame />;
  }

  return <AlphabetGrid />;
}

// Lesson 1 — 28 alphabet letters in a Surahs-style 3-column grid
function AlphabetGrid() {
  const { language } = useLanguage();
  const { playLetterAudio, stop, isPlaying } = useAudioContext();
  const [letters, setLetters] = useState<LetterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/lessons/lesson01_arabic_alphabet.json")
      .then((r) => r.json())
      .then((data: { letters: LetterEntry[] }) => {
        setLetters(data.letters);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // Auto-play the Lesson 1 Letters instruction on each visit to the tab.
  const instructionAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio("/audio/lesson1_letters_instruction_en.mp3");
    instructionAudioRef.current = audio;
    audio.play().catch(() => {});
    return () => {
      if (instructionAudioRef.current) {
        instructionAudioRef.current.pause();
        instructionAudioRef.current.src = "";
        instructionAudioRef.current = null;
      }
    };
  }, []);

  const handleLetterClick = (letter: LetterEntry) => {
    stop();
    setSelectedId(letter.id);
    setPlayingId(letter.id);
    const audioPath = `/${letter.audio}`;
    playLetterAudio(audioPath);
  };
  const visiblePlayingId = isPlaying ? playingId : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <h3 className="text-sm font-semibold text-primary">
        {language === "ar" ? "الحروف الهجائية" : "Arabic Alphabet"}
      </h3>

      {/* Letters grid — 28 letters shown as 4 rows of 7 (glyph-centric) */}
      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
        dir="rtl"
      >
        {letters.map((letter) => (
          <button
            key={letter.id}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-[1.35rem] border border-border bg-card px-2 py-3 cursor-pointer transition-all hover:-translate-y-[1px] hover:border-primary/40",
              "dark:bg-gradient-to-b dark:from-[#0a1530] dark:to-[#061027]",
              selectedId === letter.id &&
                "border-primary shadow-[0_0_0_2px_rgba(15,118,110,0.2)]",
              visiblePlayingId === letter.id &&
                "border-blue-500/80 shadow-[0_0_0_2px_rgba(37,99,235,0.18),0_0_20px_rgba(37,99,235,0.35)] scale-[1.02]",
            )}
            onClick={() => handleLetterClick(letter)}
            title={language === "ar" ? letter.name_ar : letter.name_en}
          >
            <span className="font-uthmani text-5xl font-semibold leading-none text-foreground" dir="rtl">
              {letter.glyph}
            </span>
            <span className="text-xs text-muted-foreground">
              {language === "ar" ? letter.name_ar : letter.name_en}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

