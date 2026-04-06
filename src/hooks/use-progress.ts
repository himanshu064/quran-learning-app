"use client";

import { useCallback, useRef } from "react";
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

const PROGRESS_KEY = ["user-progress"];
const SETTINGS_KEY = ["user-settings"];

export function useProgress() {
  const queryClient = useQueryClient();

  // Debounce refs to prevent duplicate saves
  const lastSavedProgress = useRef("");
  const lastSavedPosition = useRef("");
  const lastSavedLesson = useRef("");

  const { data: progress = [], isLoading: isProgressLoading } = useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: getUserProgress,
    staleTime: 0, // Always refetch when component mounts (e.g. navigating to dashboard)
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: getUserSettings,
    staleTime: 0,
  });

  // Fire-and-forget saves — invalidate progress so dashboard picks up changes
  const saveProgress = useCallback(
    ({ lessonId, slideIndex }: { lessonId: string; slideIndex: number }) => {
      const key = `${lessonId}:${slideIndex}`;
      if (key === lastSavedProgress.current) return;
      lastSavedProgress.current = key;
      saveSlideProgress(lessonId, slideIndex)
        .then(() => queryClient.invalidateQueries({ queryKey: PROGRESS_KEY }))
        .catch(() => {});
    },
    [queryClient],
  );

  const savePosition = useCallback(
    ({ surah, ayah }: { surah: number; ayah: number }) => {
      const key = `${surah}:${ayah}`;
      if (key === lastSavedPosition.current) return;
      lastSavedPosition.current = key;
      saveReadingPosition(surah, ayah)
        .then(() => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }))
        .catch(() => {});
    },
    [queryClient],
  );

  const saveLastLessonFn = useCallback(
    (lessonId: string) => {
      if (lessonId === lastSavedLesson.current) return;
      lastSavedLesson.current = lessonId;
      saveLastLesson(lessonId)
        .then(() => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }))
        .catch(() => {});
    },
    [queryClient],
  );

  // Important mutations — invalidate cache
  const completeLesson = useCallback(
    (lessonId: string) => {
      markLessonCompleted(lessonId)
        .then(() => queryClient.invalidateQueries({ queryKey: PROGRESS_KEY }))
        .catch(() => {});
    },
    [queryClient],
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

  const completedCount = progress.filter((p) => p.completed).length;

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
