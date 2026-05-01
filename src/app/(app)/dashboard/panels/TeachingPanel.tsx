"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Card replaced with client-style divs
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LetterFormsDisplay } from "@/components/lesson";
import { useLanguage, useLessonContext, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import { useSelectedWord } from "../selected-word-context";
import type { LetterSlide, LetterFormSlide, WordSlide } from "@/types";

export function TeachingPanel() {
  return <TeachingPanelInner />;
}

function TeachingPanelInner() {
  const { language } = useLanguage();
  const {
    lessonId,
    slideIndex,
    currentSlide,
    totalSlides,
    isLoading,
    config,
    prev,
    next,
    shuffle,
    goTo,
  } = useLessonContext();
  const { stop, playWordAudio, playLetterAudio, isPlaying, currentWordIndex } =
    useAudioContext();
  const { saveProgress, completeLesson, saveLastLesson, getLessonProgress } =
    useProgress();

  const getLessonProgressRef = useRef(getLessonProgress);
  getLessonProgressRef.current = getLessonProgress;
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;
  const saveLastLessonRef = useRef(saveLastLesson);
  saveLastLessonRef.current = saveLastLesson;
  const completeLessonRef = useRef(completeLesson);
  completeLessonRef.current = completeLesson;

  // Restore saved slide
  const restoredForLesson = useRef("");
  useEffect(() => {
    if (isLoading || totalSlides === 0) return;
    if (restoredForLesson.current === lessonId) return;
    restoredForLesson.current = lessonId;
    const saved = getLessonProgressRef.current(lessonId);
    if (saved && saved.slideIndex > 0 && saved.slideIndex < totalSlides) {
      goTo(saved.slideIndex);
    }
  }, [lessonId, isLoading, totalSlides, goTo]);

  // Note: don't call stop() on every slideIndex change — it conflicts with
  // auto-play in child letter card. Individual panels handle their own audio.

  useEffect(() => {
    if (totalSlides > 0) {
      saveProgressRef.current({ lessonId, slideIndex });
      saveLastLessonRef.current(lessonId);
      if (slideIndex === totalSlides - 1) {
        completeLessonRef.current(lessonId);
      }
    }
  }, [lessonId, slideIndex, totalSlides]);

  const { selectedWord, clearSelectedWord } = useSelectedWord();

  const wordSlide =
    currentSlide?.type === "word" ? (currentSlide as WordSlide) : null;

  // The active word: selected word from Verse tab takes priority over lesson slide
  const activeWord = selectedWord || wordSlide;

  const handlePlayWord = useCallback(() => {
    if (activeWord) {
      playWordAudio(activeWord.surah, activeWord.ayah, activeWord.wordIndex);
    }
  }, [activeWord, playWordAudio]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (!currentSlide || totalSlides === 0) {
    // Even with no lesson data, if a word was selected from Verse tab, show it
    if (!selectedWord) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? "لا توجد بيانات لهذا الدرس"
              : "No data available for this lesson"}
          </p>
        </div>
      );
    }
  }

  // Selected word from Verse tab takes priority over any lesson slide type
  // (skip letter/letter-forms branches if a word was selected)
  if (!selectedWord) {
    // Letter slides — focused "Letter of the day" card (client's reference)
    if (currentSlide?.type === "letter") {
      return (
        <LetterCard
          letterSlide={currentSlide as LetterSlide}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
          language={language}
          isPlaying={isPlaying}
          configLabelAr={config.labelAr}
          configLabelEn={config.labelEn}
          playLetterAudio={playLetterAudio}
          stop={stop}
          prev={prev}
          next={next}
          shuffle={shuffle}
        />
      );
    }

    if (currentSlide?.type === "letter-forms") {
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium">
              {language === "ar" ? config.labelAr : config.labelEn}
            </span>
            <Badge variant="outline" className="text-xs">
              {slideIndex + 1} / {totalSlides}
            </Badge>
          </div>
          <div className="w-full max-w-md">
            <LetterFormsDisplay slide={currentSlide as LetterFormSlide} />
          </div>
          <TeachingNav prev={prev} next={next} shuffle={shuffle} language={language} />
        </div>
      );
    }
  }

  // If there's no word to show (neither lesson word nor selected word)
  if (!wordSlide && !selectedWord) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "اختر كلمة من صفحة الآية أو اختر درساً يحتوي على كلمات"
            : "Select a word from the Verse page or choose a lesson with words"}
        </p>
      </div>
    );
  }

  // Word display — uses activeWord (selected word or lesson word)
  const isHighlighted = isPlaying && activeWord && currentWordIndex === activeWord.wordIndex;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2.5">
      {/* Headline card */}
      <div className="flex items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {selectedWord
            ? (language === "ar" ? "الكلمة المختارة" : "Selected word")
            : language === "ar"
              ? `درس اليوم: ${config.labelAr.split("—")[1]?.trim() || config.labelAr}`
              : `Today's lesson: ${config.labelEn.split("—")[1]?.trim() || config.labelEn}`}
        </span>
        <Badge variant="outline" className="text-xs">
          {selectedWord
            ? (language === "ar"
                ? `سورة ${selectedWord.surah} · آية ${selectedWord.ayah}`
                : `Surah ${selectedWord.surah} · Ayah ${selectedWord.ayah}`)
            : language === "ar"
              ? `الكلمة ${slideIndex + 1} / ${totalSlides}`
              : `Word ${slideIndex + 1} / ${totalSlides}`}
        </Badge>
      </div>

      {/* Main teaching card */}
      <div className="flex flex-col items-center rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        {/* Source tag — matches reference .teaching-tag font-size 1.5rem */}
        {activeWord && (
          <Badge variant="outline" className="mb-4 text-[1.5rem] leading-tight px-4 py-1.5">
            {language === "ar"
              ? `من سورة ${activeWord.surah} · آية ${activeWord.ayah}`
              : `From surah ${activeWord.surah} · Ayah ${activeWord.ayah}`}
          </Badge>
        )}

        {/* Large word */}
        <div
          className={cn(
            "font-uthmani text-[6rem] sm:text-[8rem] md:text-[10rem] leading-[2.3] transition-all duration-300 cursor-pointer",
            isHighlighted &&
              "text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.4)]",
          )}
          dir="rtl"
          onClick={handlePlayWord}
        >
          {activeWord?.word || "—"}
        </div>

        {/* Play + nav buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full bg-primary shadow-play cursor-pointer",
              isHighlighted && "bg-emerald-500 hover:bg-emerald-600",
            )}
            onClick={isPlaying ? stop : handlePlayWord}
            title={language === "ar" ? (isPlaying ? "إيقاف" : "تشغيل") : (isPlaying ? "Stop" : "Play")}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 rounded-full cursor-pointer"
            onClick={() => { clearSelectedWord(); prev(); }}
          >
            {language === "ar" ? "الكلمة السابقة" : "Previous word"}
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 rounded-full cursor-pointer"
            onClick={() => { clearSelectedWord(); next(); }}
          >
            {language === "ar" ? "الكلمة التالية" : "Next word"}
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 rounded-full cursor-pointer"
            onClick={() => { clearSelectedWord(); shuffle(); }}
          >
            {language === "ar" ? "🔀 عشوائي" : "🔀 Random"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeachingNav({
  prev,
  next,
  shuffle,
}: {
  prev: () => void;
  next: () => void;
  shuffle: () => void;
  language: string;
}) {
  return (
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
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full cursor-pointer"
        onClick={shuffle}
      >
        <span aria-hidden>🔀</span>
      </Button>
    </div>
  );
}

// Focused "Letter of the day" card for Lesson 1 in the Word tab.
// Auto-plays instruction on first entry, then the letter audio. On navigation: auto-plays letter audio.
function LetterCard({
  letterSlide,
  slideIndex,
  totalSlides,
  language,
  isPlaying,
  configLabelAr,
  configLabelEn,
  playLetterAudio,
  stop,
  prev,
  next,
  shuffle,
}: {
  letterSlide: LetterSlide;
  slideIndex: number;
  totalSlides: number;
  language: string;
  isPlaying: boolean;
  configLabelAr: string;
  configLabelEn: string;
  playLetterAudio: (path: string) => void;
  stop: () => void;
  prev: () => void;
  next: () => void;
  shuffle: () => void;
}) {
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  // Always-current refs so effects never capture stale closures
  const playLetterAudioRef = useRef(playLetterAudio);
  playLetterAudioRef.current = playLetterAudio;
  const letterAudioPathRef = useRef(letterSlide.audio ? `/${letterSlide.audio}` : "");
  letterAudioPathRef.current = letterSlide.audio ? `/${letterSlide.audio}` : "";

  const stopIntro = useCallback(() => {
    if (introAudioRef.current) {
      introAudioRef.current.onended = null;
      introAudioRef.current.pause();
      introAudioRef.current.src = "";
      introAudioRef.current = null;
    }
  }, []);

  const playLetterSound = useCallback(() => {
    stopIntro();
    stop();
    if (letterSlide.audio) playLetterAudio(`/${letterSlide.audio}`);
  }, [letterSlide.audio, playLetterAudio, stop, stopIntro]);

  // On mount: play instruction once, then auto-play the current letter audio.
  useEffect(() => {
    const audio = new Audio("/audio/lesson1_letters_instruction_en.mp3");
    introAudioRef.current = audio;
    const playLetter = () => {
      introAudioRef.current = null;
      const path = letterAudioPathRef.current;
      if (path) playLetterAudioRef.current(path);
    };
    audio.onended = playLetter;
    audio.play().catch(playLetter);
    return () => {
      if (introAudioRef.current) {
        introAudioRef.current.onended = null;
        introAudioRef.current.pause();
        introAudioRef.current.src = "";
        introAudioRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the letter changes (prev/next navigation): stop intro and auto-play new letter.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    stopIntro();
    if (letterSlide.audio) playLetterAudio(`/${letterSlide.audio}`);
  }, [letterSlide.audio, playLetterAudio, stopIntro]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2.5">
      {/* Headline card */}
      <div className="flex items-center justify-between rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">
          {language === "ar"
            ? `درس اليوم: ${configLabelAr.split("—")[1]?.trim() || configLabelAr}`
            : `Today's lesson: ${configLabelEn.split("—")[1]?.trim() || configLabelEn}`}
        </span>
        <Badge variant="outline" className="text-xs">
          {language === "ar"
            ? `حرف ${slideIndex + 1} / ${totalSlides}`
            : `Letter ${slideIndex + 1} / ${totalSlides}`}
        </Badge>
      </div>

      {/* Main focused card */}
      <div className="flex flex-col items-center rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        {/* Name pill: "ألف · alif" */}
        <Badge variant="outline" className="mb-6 gap-2 px-3 py-1 text-sm font-normal">
          <span className="font-uthmani">{letterSlide.name_ar}</span>
          <span className="text-muted-foreground">·</span>
          <span>{letterSlide.name_en}</span>
        </Badge>

        {/* Large glyph — matches reference .big-word 10rem */}
        <div
          className={cn(
            "font-uthmani text-[10rem] leading-none transition-all duration-300 cursor-pointer",
            isPlaying &&
              "text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.4)]",
          )}
          dir="rtl"
          onClick={playLetterSound}
        >
          {letterSlide.glyph}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full bg-primary shadow-play cursor-pointer",
              isPlaying && "bg-emerald-500 hover:bg-emerald-600",
            )}
            onClick={isPlaying ? stop : playLetterSound}
            title={language === "ar" ? (isPlaying ? "إيقاف" : "تشغيل") : (isPlaying ? "Stop" : "Play")}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="outline" className="gap-1.5 rounded-full cursor-pointer" onClick={prev}>
            {language === "ar" ? "الحرف السابق" : "Previous letter"}
          </Button>
          <Button variant="outline" className="gap-1.5 rounded-full cursor-pointer" onClick={next}>
            {language === "ar" ? "الحرف التالي" : "Next letter"}
          </Button>
          <Button variant="outline" className="gap-1.5 rounded-full cursor-pointer" onClick={shuffle}>
            {language === "ar" ? "🔀 عشوائي" : "🔀 Random"}
          </Button>
        </div>
      </div>
    </div>
  );
}
