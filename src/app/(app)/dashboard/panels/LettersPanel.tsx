"use client";

import { useEffect, useState } from "react";
import { BookOpen, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage, useAudioContext, useLessonContext } from "@/providers";
import { useSelectedWord } from "../selected-word-context";
import { LetterFormsGame } from "./LetterFormsGame";

type LetterEntry = {
  id: number;
  glyph: string;
  name_ar: string;
  name_en: string;
  audio: string;
};

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
  const { playLetterAudio, stop, isPlaying } = useAudioContext();
  const { lessonId } = useLessonContext();
  const { selectedWord } = useSelectedWord();

  // Lesson 2: show interactive letter forms game
  if (lessonId === "lesson2") {
    return <LetterFormsGame />;
  }
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

  // Reset playing indicator when audio stops
  useEffect(() => {
    if (!isPlaying) setPlayingId(null);
  }, [isPlaying]);

  const handleLetterClick = (letter: LetterEntry) => {
    stop();
    setPlayingId(letter.id);
    const audioPath = `/${letter.audio}`;
    playLetterAudio(audioPath);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  // When a word is selected from the Verse tab, show its letter breakdown
  if (selectedWord) {
    const wordLetters = extractLettersFromWord(selectedWord.word);
    return (
      <SelectedWordLetters
        word={selectedWord.word}
        surah={selectedWord.surah}
        ayah={selectedWord.ayah}
        wordLetters={wordLetters}
        language={language}
        playLetterAudio={playLetterAudio}
        stop={stop}
        isPlaying={isPlaying}
        letterAudioMap={LETTER_AUDIO}
      />
    );
  }

  if (letters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar" ? "لا توجد بيانات للحروف" : "No letter data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {/* Title */}
      <h3 className="text-sm font-semibold text-primary">
        {language === "ar" ? "الحروف الهجائية" : "Arabic Alphabet"}
      </h3>

      {/* Letters grid — same layout as Surahs */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {letters.map((letter) => (
          <div
            key={letter.id}
            role="button"
            tabIndex={0}
            className={cn(
              "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.125rem] border border-border bg-card px-3 py-3 transition-all hover:-translate-y-px hover:border-primary/30 hover:bg-primary/5",
              playingId === letter.id && "border-primary/50 bg-primary/10",
            )}
            onClick={() => handleLetterClick(letter)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleLetterClick(letter);
            }}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-sm font-bold text-primary">
              {letter.id}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {language === "ar" ? letter.name_ar : letter.name_en}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {language === "ar" ? letter.name_en : letter.name_ar}
              </p>
            </div>
            <span className="font-uthmani shrink-0 text-2xl font-semibold" dir="rtl">
              {letter.glyph}
            </span>
          </div>
        ))}
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

      <div className="w-full max-w-md rounded-[1.125rem] border border-border bg-card">
        <div className="p-6 sm:p-8">
          <p className="mb-2 text-center font-uthmani text-3xl" dir="rtl">
            {word}
          </p>
          <p className="mb-6 text-center text-xs text-muted-foreground">
            {language === "ar"
              ? "اضغط على أي حرف للاستماع إليه"
              : "Click any letter to listen"}
          </p>

          <div
            className="mb-6 flex flex-wrap items-center justify-center gap-1.5 font-uthmani text-4xl leading-relaxed sm:text-5xl"
            dir="rtl"
          >
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

          {activeLetter && (
            <div className="text-center">
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="lg"
                className={cn(
                  "gap-2 rounded-full cursor-pointer",
                  isPlaying && "bg-emerald-500 hover:bg-emerald-600",
                )}
                onClick={handlePlayActive}
              >
                <Volume2
                  className={cn("h-5 w-5", isPlaying && "animate-pulse")}
                />
                {isPlaying
                  ? language === "ar"
                    ? "إيقاف"
                    : "Stop"
                  : language === "ar"
                    ? "استمع للحرف"
                    : "Listen to Letter"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
