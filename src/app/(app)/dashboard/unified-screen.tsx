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

// Per-lesson tab disable rules — matches client's isLettersTabAllowed and
// isHomeReaderAllowed from Omar App Final.
// L1: Home/Reader disabled. Word, Letters, MCQ, Writing all active.
// L2: All tabs active (Letters tab available, Home/Reader also available).
// L3+: Letters tab disabled; all other tabs active.
function getDisabledTabs(lessonId: string): TabKey[] {
  if (lessonId === "lesson1") {
    return ["home", "reader"];
  }
  if (lessonId === "lesson2") {
    return [];
  }
  return ["letters"];
}

// Default tab to redirect to when current tab becomes disabled
function getDefaultTab(lessonId: string): TabKey {
  if (lessonId === "lesson1") return "letters";
  return "home";
}

export function UnifiedScreen() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "home" });
  const [, setSurah] = useQueryState("surah", parseAsInteger.withDefault(1));
  const [, setAyah] = useQueryState("ayah", parseAsInteger.withDefault(1));
  const [, setAyahTo] = useQueryState("to", parseAsInteger.withDefault(0));
  const { stop } = useAudioContext();
  const { lessonId } = useLessonContext();

  const activeTab = (tab as TabKey) || "home";

  const disabledTabs = useMemo<TabKey[]>(
    () => getDisabledTabs(lessonId),
    [lessonId],
  );

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

  // If current tab becomes disabled due to lesson change, redirect to safe default
  useEffect(() => {
    if (disabledTabs.includes(activeTab)) {
      setTab(getDefaultTab(lessonId));
    }
  }, [disabledTabs, activeTab, lessonId, setTab]);

  return (
    <SelectedWordProvider>
      {/* Main app card — matches client's single-card shell */}
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[53rem] flex-1 flex-col overflow-hidden rounded-[1.125rem] border border-border bg-card">
        <UnifiedTopbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          disabledTabs={disabledTabs}
          lessonId={lessonId}
        />

        <div className="min-h-0 flex-1 overflow-auto p-4 pb-24 sm:pb-4">
          {activeTab === "home" && <SurahsPanel onNavigate={handleNavigate} />}
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
