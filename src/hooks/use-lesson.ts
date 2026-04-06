"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LESSON_CONFIG, getLessonConfig } from "@/lib/quran";
import type { LessonSlide, LetterSlide, WordSlide } from "@/types";

// -------------------------------------------------------------------
// JSON → slides parser
// -------------------------------------------------------------------

function parseSlides(data: unknown): LessonSlide[] {
  if (!data || typeof data !== "object") return [];

  const asObj = data as Record<string, unknown>;

  // Letter-style: { letters: [...] }
  if (Array.isArray(asObj.letters)) {
    return (asObj.letters as Array<Record<string, unknown>>).map(
      (letter, idx) => ({
        type: "letter" as const,
        id: (letter.id as number) ?? idx + 1,
        glyph: (letter.glyph as string) ?? "",
        name_ar: (letter.name_ar as string) ?? "",
        name_en: (letter.name_en as string) ?? "",
        audio: (letter.audio as string) ?? "",
      }),
    );
  }

  // Word-style: { "54:17": [{ wordIndex, word, count }, ...], ... }
  const slides: WordSlide[] = [];
  for (const key of Object.keys(asObj)) {
    const parts = key.split(":");
    if (parts.length !== 2) continue;
    const surah = parseInt(parts[0], 10);
    const ayah = parseInt(parts[1], 10);
    if (!surah || !ayah) continue;
    const arr = asObj[key];
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      if (typeof entry.wordIndex !== "number") continue;
      slides.push({
        type: "word" as const,
        surah,
        ayah,
        wordIndex: entry.wordIndex as number,
        word: (entry.word ?? entry.quranWord ?? entry.exampleWord) as string,
        count: (entry.count as number) ?? 0,
        letter: entry.letter as string | undefined,
        positionEn: entry.positionEn as string | undefined,
        formShape: entry.formShape as string | undefined,
        moonSunType: entry.type as "moon" | "sun" | undefined,
        baseLetter: entry.baseLetter as string | undefined,
        displayLetter: entry.displayLetter as string | undefined,
      });
    }
  }
  return slides;
}

async function fetchLessonSlides(file: string): Promise<LessonSlide[]> {
  if (!file) return [];
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Failed to load lesson: ${file}`);
  return parseSlides(await res.json());
}

// -------------------------------------------------------------------
// Hook
// -------------------------------------------------------------------

export function useLesson(initialLessonId = "lesson1") {
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [slideIndex, setSlideIndex] = useState(0);

  const config = getLessonConfig(lessonId) ?? LESSON_CONFIG[0];

  const {
    data: slides = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lesson-slides", lessonId],
    queryFn: () => fetchLessonSlides(config.file),
    staleTime: Infinity,
    enabled: !!config.file,
  });

  const total = slides.length;

  const setLesson = useCallback((id: string) => {
    setLessonId(id);
    setSlideIndex(0);
  }, []);

  const goTo = useCallback((index: number) => {
    setSlideIndex(index);
  }, []);

  const prev = useCallback(() => {
    setSlideIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setSlideIndex((i) => (i + 1) % total);
  }, [total]);

  const shuffle = useCallback(() => {
    setSlideIndex(Math.floor(Math.random() * total));
  }, [total]);

  return {
    lessonId,
    slideIndex,
    currentSlide: slides[slideIndex] ?? null,
    slides,
    total,
    isLoading,
    isError,
    config,
    setLesson,
    goTo,
    prev,
    next,
    shuffle,
  };
}
