"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { UnifiedTopbar } from "@/components/app/UnifiedTopbar";
import type { TabKey } from "@/components/app/PillTabNav";
import { SelectedWordProvider } from "./selected-word-context";
import { useAudioContext, useLessonContext } from "@/providers";
import {
  SurahsPanel,
  ReaderPanel,
  TeachingPanel,
  LettersPanel,
  McqPanel,
  WritingPanel,
} from "./panels";

// Tabs to disable when Lesson 1 or 2 is selected (letter-based lessons)
const LETTER_LESSON_DISABLED_TABS: TabKey[] = ["home", "reader", "teaching"];

export function UnifiedScreen() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "home" });
  const [, setSurah] = useQueryState("surah", parseAsInteger.withDefault(1));
  const [, setAyah] = useQueryState("ayah", parseAsInteger.withDefault(1));
  const [, setAyahTo] = useQueryState("to", parseAsInteger.withDefault(0));
  const { stop } = useAudioContext();
  const { lessonId, setLesson } = useLessonContext();

  const activeTab = (tab as TabKey) || "home";

  const isLetterLesson = lessonId === "lesson1" || lessonId === "lesson2";
  const disabledTabs = useMemo<TabKey[]>(
    () => (isLetterLesson ? LETTER_LESSON_DISABLED_TABS : []),
    [isLetterLesson],
  );

  const handleTabChange = useCallback(
    (newTab: TabKey) => {
      stop();
      if (newTab === "letters") {
        setLesson("lesson1");
      }
      setTab(newTab);
    },
    [setTab, setLesson, stop],
  );

  // Navigate to a tab with optional surah/ayah params — all via nuqs
  const handleNavigate = useCallback(
    (targetTab: TabKey, params?: Record<string, string>) => {
      stop();
      if (params?.surah) setSurah(Number(params.surah));
      if (params?.ayah) setAyah(Number(params.ayah));
      setAyahTo(0);
      setTab(targetTab);
    },
    [setTab, setSurah, setAyah, setAyahTo, stop],
  );

  // If user switches to lesson 1/2 while on a disabled tab, redirect to "letters"
  useEffect(() => {
    if (isLetterLesson && LETTER_LESSON_DISABLED_TABS.includes(activeTab)) {
      setTab("letters");
    }
  }, [isLetterLesson, activeTab, setTab]);

  return (
    <SelectedWordProvider>
      {/* Main app card — matches client's single-card shell */}
      <div className="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-[1.125rem] border border-border bg-card">
        <UnifiedTopbar activeTab={activeTab} onTabChange={handleTabChange} disabledTabs={disabledTabs} />

        <div className="overflow-auto p-4">
          {activeTab === "home" && (
            <SurahsPanel onNavigate={handleNavigate} />
          )}
          {activeTab === "reader" && <ReaderPanel />}
          {activeTab === "teaching" && <TeachingPanel />}
          {activeTab === "letters" && <LettersPanel />}
          {activeTab === "mcq" && <McqPanel />}
          {activeTab === "writing" && <WritingPanel />}
        </div>
      </div>
    </SelectedWordProvider>
  );
}
