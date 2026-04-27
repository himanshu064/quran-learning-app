"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { cn } from "@/lib/utils";
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

// Per-lesson tab disable rules from the client's PDF/meeting feedback.
// L1/L2: Surahs, Verse, and Word disabled; Letters, Listening, Writing active.
// L3+: Letters disabled; Surahs, Verse, Word, Listening, Writing active.
function getDisabledTabs(lessonId: string): TabKey[] {
  if (lessonId === "lesson1" || lessonId === "lesson2") {
    return ["home", "reader", "teaching"];
  }
  return ["letters"];
}

// Default tab to redirect to when current tab becomes disabled
function getDefaultTab(lessonId: string): TabKey {
  if (lessonId === "lesson1" || lessonId === "lesson2") return "letters";
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

  const isHome = activeTab === "home";

  return (
    <SelectedWordProvider>
      {isHome ? (
        /* Surahs — full page width, no padding, no card */
        <div className="flex h-full min-h-0 w-full flex-1 flex-col">
          <UnifiedTopbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            disabledTabs={disabledTabs}
            lessonId={lessonId}
          />
          <div className="min-h-0 flex-1 overflow-auto p-4 pb-24 sm:pb-4">
            <SurahsPanel onNavigate={handleNavigate} />
          </div>
        </div>
      ) : (
        /* All other tabs — padded card container */
        <div className="flex h-full min-h-0 w-full flex-1 flex-col p-3 md:p-5 lg:p-6">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[64rem] flex-1 flex-col overflow-hidden rounded-[1.125rem] border border-border bg-card">
            <UnifiedTopbar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              disabledTabs={disabledTabs}
              lessonId={lessonId}
            />
            <div className="min-h-0 flex-1 overflow-auto p-4 pb-24 sm:pb-4">
              {activeTab === "reader" && <ReaderPanel />}
              {activeTab === "teaching" && <TeachingPanel />}
              {activeTab === "letters" && <LettersPanel />}
              {activeTab === "mcq" && <McqPanel />}
              {activeTab === "writing" && <WritingPanel />}
            </div>
          </div>
        </div>
      )}
    </SelectedWordProvider>
  );
}
