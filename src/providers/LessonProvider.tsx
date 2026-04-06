"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useLesson } from "@/hooks";
import type { LessonConfig } from "@/lib/quran";
import type { LessonSlide } from "@/types";

type LessonContextValue = {
  lessonId: string;
  slideIndex: number;
  currentSlide: LessonSlide | null;
  slides: LessonSlide[];
  totalSlides: number;
  isLoading: boolean;
  isError: boolean;
  config: LessonConfig;
  setLesson: (id: string) => void;
  goTo: (index: number) => void;
  prev: () => void;
  next: () => void;
  shuffle: () => void;
};

const LessonContext = createContext<LessonContextValue | null>(null);

export function LessonProvider({
  initialLessonId = "lesson1",
  children,
}: {
  initialLessonId?: string;
  children: React.ReactNode;
}) {
  const lesson = useLesson(initialLessonId);

  const value = useMemo<LessonContextValue>(
    () => ({
      lessonId: lesson.lessonId,
      slideIndex: lesson.slideIndex,
      currentSlide: lesson.currentSlide,
      slides: lesson.slides,
      totalSlides: lesson.total,
      isLoading: lesson.isLoading,
      isError: lesson.isError,
      config: lesson.config,
      setLesson: lesson.setLesson,
      goTo: lesson.goTo,
      prev: lesson.prev,
      next: lesson.next,
      shuffle: lesson.shuffle,
    }),
    [lesson],
  );

  return (
    <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
  );
}

export function useLessonContext() {
  const ctx = useContext(LessonContext);
  if (!ctx) {
    throw new Error("useLessonContext must be used within a LessonProvider");
  }
  return ctx;
}
