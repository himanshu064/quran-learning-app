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

// Lesson 1 — 28 alphabet letters as a 7-column glyph grid, matching the client's reference.
// Exported because the Teaching tab also renders it for Lesson 1 (matches reference where
// `teachingLettersWrap` is shown and `teachingWord` is hidden — index.html:3708).
export function AlphabetGrid() {
  const { language } = useLanguage();
  const { playLetterAudio, stop, isPlaying } = useAudioContext();
  const { slideIndex, totalSlides, config, goTo } = useLessonContext();
  const [letters, setLetters] = useState<LetterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

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

  const handleLetterClick = (letter: LetterEntry, idx: number) => {
    stop();
    setPlayingId(letter.id);
    // Sync the lesson slide so the highlight follows the user's pick AND
    // the Teaching/Word tab shows the same letter.
    if (idx >= 0 && idx < totalSlides) goTo(idx);
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
    <div className="flex flex-1 items-start justify-center p-6">
    <div className="flex w-full max-w-5xl flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      {/* Today's lesson header banner — matches reference. Topic is ALWAYS in Arabic
          (extracted from labelAr); only the prefix is localized — mirrors the reference's
          updateHeadlineForCurrentLesson at index.html:3640-3657 where cfg.topic is the
          Arabic string and only `headlinePrefix` flips between languages. */}
      <div className="flex items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {(language === "ar" ? "درس اليوم: " : "Today's lesson: ")}
          <span dir="rtl" className="font-uthmani">
            {config.labelAr.split("—")[1]?.trim() || config.labelAr}
          </span>
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs">
          {language === "ar"
            ? `حرف ${slideIndex + 1} / ${totalSlides || letters.length}`
            : `Letter ${slideIndex + 1} / ${totalSlides || letters.length}`}
        </span>
      </div>

      {/* Letters grid — 7 columns matching the reference, large glyph-only tiles */}
      <div
        className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
        dir="rtl"
      >
        {letters.map((letter, idx) => (
          <button
            key={letter.id}
            className={cn(
              "flex aspect-square items-center justify-center rounded-[1.35rem] border border-border bg-card cursor-pointer transition-all hover:-translate-y-[1px] hover:border-primary/40",
              "dark:bg-gradient-to-b dark:from-[#0a1530] dark:to-[#061027]",
              idx === slideIndex &&
                "border-primary shadow-[0_0_0_2px_rgba(15,118,110,0.25)]",
              visiblePlayingId === letter.id &&
                "border-blue-500/80 shadow-[0_0_0_2px_rgba(37,99,235,0.18),0_0_20px_rgba(37,99,235,0.35)] scale-[1.02]",
            )}
            onClick={() => handleLetterClick(letter, idx)}
            title={language === "ar" ? letter.name_ar : letter.name_en}
          >
            <span className="font-uthmani text-6xl font-semibold leading-none text-foreground sm:text-7xl" dir="rtl">
              {letter.glyph}
            </span>
          </button>
        ))}
      </div>
    </div>
    </div>
  );
}

