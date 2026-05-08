"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
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

// Per-lesson tab disable rules (matched to reference app):
// L1 only: Surahs (home) is disabled. Reader IS the default screen and stays enabled.
// L2: All tabs enabled — Home, Verse, Teaching, Letters, MCQ, Writing.
// L3+: Letters disabled; everything else active.
function getDisabledTabs(lessonId: string): TabKey[] {
  if (lessonId === "lesson1") return ["home"];
  if (lessonId === "lesson2") return [];
  return ["letters"];
}

// Tab walk order — same order they appear in the pill nav. Used to pick the
// "first enabled" tab when the requested/current tab is disabled.
const TAB_ORDER: TabKey[] = [
  "reader",
  "home",
  "teaching",
  "letters",
  "mcq",
  "writing",
];

// Default-tab rules:
// Reference defaults to Verse (reader) on every lesson, including L1
// (Omar App Final/index.html:6890 sets currentScreenName='reader' at startup,
// and the L1 reset path at :6834-6843 also lands on reader).
function getDefaultTab(lessonId: string): TabKey {
  const disabled = getDisabledTabs(lessonId);
  return TAB_ORDER.find((t) => !disabled.includes(t)) ?? "reader";
}

export function UnifiedScreen() {
  const { stop } = useAudioContext();
  const { lessonId } = useLessonContext();

  // Pre-compute the lesson-aware default so we can both:
  //  (a) feed it into useQueryState as the parser default (used when the URL has no ?tab=)
  //  (b) re-use it in the redirect effect below when the URL tab becomes disabled.
  const lessonDefaultTab = useMemo(() => getDefaultTab(lessonId), [lessonId]);

  // Verse (reader) tab is preferred on a fresh load with no ?tab= in the URL.
  // Using parseAsString.withDefault — the canonical nuqs v2 syntax for string params.
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault(lessonDefaultTab),
  );
  const [, setSurah] = useQueryState("surah", parseAsInteger.withDefault(1));
  const [, setAyah] = useQueryState("ayah", parseAsInteger.withDefault(1));
  const [, setAyahTo] = useQueryState("to", parseAsInteger.withDefault(0));

  // Fall back to the lesson default if the parser ever yields an empty string —
  // never silently revert to "home" (the previous fallback was masking the new default).
  const activeTab = ((tab || lessonDefaultTab) as TabKey);

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
    if (disabledTabs.includes(activeTab) && activeTab !== lessonDefaultTab) {
      setTab(lessonDefaultTab);
    }
  }, [disabledTabs, activeTab, lessonDefaultTab, setTab]);

  return (
    <SelectedWordProvider>
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
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
