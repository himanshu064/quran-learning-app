"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { UnifiedTopbar } from "@/components/app/UnifiedTopbar";
import type { TabKey } from "@/components/app/PillTabNav";
import { SelectedWordProvider } from "./selected-word-context";
import { useAudioContext, useLessonContext } from "@/providers";
import { isLetterLesson } from "@/lib/quran";
import {
  SurahsPanel,
  ReaderPanel,
  TeachingPanel,
  LettersPanel,
  McqPanel,
  WritingPanel,
} from "./panels";

export function UnifiedScreen() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "home" });
  const [, setSurah] = useQueryState("surah", parseAsInteger.withDefault(1));
  const [, setAyah] = useQueryState("ayah", parseAsInteger.withDefault(1));
  const [, setAyahTo] = useQueryState("to", parseAsInteger.withDefault(0));
  const { stop } = useAudioContext();
  const { lessonId } = useLessonContext();

  const activeTab = (tab as TabKey) || "home";

  // Lesson 1 & 2 → disable Surahs/Verse/Word.
  // Other lessons → disable Letters.
  const disabledTabs = useMemo<TabKey[]>(
    () =>
      isLetterLesson(lessonId)
        ? ["home", "reader", "teaching"]
        : ["letters"],
    [lessonId],
  );

  // If a lesson change makes the current tab invalid, hop to a safe default.
  useEffect(() => {
    if (!disabledTabs.includes(activeTab)) return;
    stop();
    setTab(isLetterLesson(lessonId) ? "letters" : "reader");
  }, [disabledTabs, activeTab, lessonId, setTab, stop]);

  const handleTabChange = useCallback(
    (newTab: TabKey) => {
      if (disabledTabs.includes(newTab)) return;
      stop();
      setTab(newTab);
    },
    [setTab, stop, disabledTabs],
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

  return (
    <SelectedWordProvider>
      {/* Main app card — matches client's single-card shell */}
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-[1.125rem] border border-border bg-card">
        <UnifiedTopbar activeTab={activeTab} onTabChange={handleTabChange} disabledTabs={disabledTabs} />

        <div className="min-h-0 flex-1 overflow-auto p-4">
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
