"use client";

import { useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserProgress,
  getUserSettings,
  saveSlideProgress,
  markLessonCompleted,
  saveMcqScore,
  saveReadingPosition,
  saveLastLesson,
} from "@/lib/progress";
import { getAvailableLessons } from "@/lib/quran";

const PROGRESS_KEY = ["user-progress"];
const SETTINGS_KEY = ["user-settings"];

export function useProgress() {
  const queryClient = useQueryClient();

  // Debounce refs to prevent duplicate saves
  const lastSavedProgress = useRef("");
  const lastSavedPosition = useRef("");
  const lastSavedLesson = useRef("");
  const lastCompletedLesson = useRef("");

  const { data: progress = [], isLoading: isProgressLoading } = useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: getUserProgress,
    staleTime: 30_000, // Cache for 30s — dashboard refetches on mount via refetchOnMount
    refetchOnMount: "always",
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: getUserSettings,
    staleTime: 30_000,
    refetchOnMount: "always",
  });

  // Fire-and-forget saves — no cache invalidation to avoid re-render/refetch loops.
  // Dashboard gets fresh data on mount via refetchOnMount: "always".
  const saveProgress = useCallback(
    ({ lessonId, slideIndex }: { lessonId: string; slideIndex: number }) => {
      const key = `${lessonId}:${slideIndex}`;
      if (key === lastSavedProgress.current) return;
      lastSavedProgress.current = key;
      saveSlideProgress(lessonId, slideIndex).catch(() => {});
    },
    [],
  );

  const savePosition = useCallback(
    ({ surah, ayah }: { surah: number; ayah: number }) => {
      const key = `${surah}:${ayah}`;
      if (key === lastSavedPosition.current) return;
      lastSavedPosition.current = key;
      saveReadingPosition(surah, ayah).catch(() => {});
    },
    [],
  );

  const saveLastLessonFn = useCallback(
    (lessonId: string) => {
      if (lessonId === lastSavedLesson.current) return;
      lastSavedLesson.current = lessonId;
      saveLastLesson(lessonId).catch(() => {});
    },
    [],
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
      if (lessonId === lastCompletedLesson.current) return;
      lastCompletedLesson.current = lessonId;
      markLessonCompleted(lessonId).catch(() => {});
    },
    [],
  );

  const saveMcqScoreFn = useCallback(
    ({
      lessonId,
      score,
      total,
    }: {
      lessonId: string;
      score: number;
      total: number;
    }) => {
      saveMcqScore(lessonId, score, total)
        .then(() => queryClient.invalidateQueries({ queryKey: PROGRESS_KEY }))
        .catch(() => {});
    },
    [queryClient],
  );

  const getLessonProgress = useCallback(
    (lessonId: string) =>
      progress.find((p) => p.lessonId === lessonId) ?? null,
    [progress],
  );

  const availableLessonIds = useMemo(
    () => new Set(getAvailableLessons().map((l) => l.id)),
    [],
  );
  const completedCount = progress.filter(
    (p) => p.completed && availableLessonIds.has(p.lessonId),
  ).length;

  return {
    progress,
    settings,
    isLoading: isProgressLoading || isSettingsLoading,
    completedCount,
    getLessonProgress,
    saveProgress,
    completeLesson,
    saveMcqScore: saveMcqScoreFn,
    savePosition,
    saveLastLesson: saveLastLessonFn,
  };
}
