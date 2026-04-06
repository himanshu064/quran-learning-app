"use client";

import { useCallback, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LetterDisplay,
  LetterFormsDisplay,
  WordDisplay,
  ProgressIndicator,
  LessonNav,
} from "@/components/lesson";
import { useLanguage, useLessonContext, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import type { LetterSlide, LetterFormSlide, WordSlide } from "@/types";


export function TeachingScreen() {
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
  const { stop } = useAudioContext();
  const { saveProgress, completeLesson, saveLastLesson, getLessonProgress } =
    useProgress();

  // Stable refs to avoid re-render loops from progress query invalidation
  const getLessonProgressRef = useRef(getLessonProgress);
  getLessonProgressRef.current = getLessonProgress;
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;
  const saveLastLessonRef = useRef(saveLastLesson);
  saveLastLessonRef.current = saveLastLesson;
  const completeLessonRef = useRef(completeLesson);
  completeLessonRef.current = completeLesson;

  // Restore saved slide position when slides finish loading for a lesson
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

  // Stop audio when navigating to a new slide
  useEffect(() => {
    stop();
  }, [slideIndex, stop]);

  // Save progress on slide change
  useEffect(() => {
    if (totalSlides > 0) {
      saveProgressRef.current({ lessonId, slideIndex });
      saveLastLessonRef.current(lessonId);
      if (slideIndex === totalSlides - 1) {
        completeLessonRef.current(lessonId);
      }
    }
  }, [lessonId, slideIndex, totalSlides]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  if (!currentSlide || totalSlides === 0) {
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

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-6">
      {/* Lesson title + progress badge */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {language === "ar" ? config.labelAr : config.labelEn}
        </h2>
      </div>

      {/* Progress indicator */}
      <ProgressIndicator
        current={slideIndex}
        total={totalSlides}
        className="w-full max-w-md"
      />

      {/* Slide display — based on type */}
      <div className="w-full max-w-md">
        {currentSlide.type === "letter" && (
          <LetterDisplay slide={currentSlide as LetterSlide} />
        )}
        {currentSlide.type === "letter-forms" && (
          <LetterFormsDisplay slide={currentSlide as LetterFormSlide} />
        )}
        {currentSlide.type === "word" && (
          <WordDisplay slide={currentSlide as WordSlide} />
        )}
      </div>

      {/* Navigation */}
      <LessonNav onPrev={prev} onNext={next} onShuffle={shuffle} />
    </div>
  );
}
