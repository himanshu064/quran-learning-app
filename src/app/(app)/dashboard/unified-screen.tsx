"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const { lessonId, slides } = useLessonContext();

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

  // On a hard page reload (F5 / Ctrl-R), force the tab back to the lesson
  // default (Verse) regardless of what `?tab=` is in the URL. Client-side
  // navigations and back/forward keep their preserved tab.
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav?.type === "reload") {
      setTab(lessonDefaultTab);
    }
    // Run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On lesson change (user picks a new lesson from the dropdown), reset the
  // tab to Verse (reader) AND mark the verse position as needing a sync to
  // the new lesson's first word slide. Mirrors reference behaviour at
  // index.html:6835/6867-6868 (always end on reader) and :5150-5151
  // (showLesson(0) sets surahInput.value/ayahNumberInput.value from the
  // first slide). Skip the very first render so the URL's ?tab= and
  // ?surah=/?ayah= are not clobbered on initial mount.
  const prevLessonIdRef = useRef(lessonId);
  const pendingVerseSyncRef = useRef(false);
  useEffect(() => {
    if (prevLessonIdRef.current !== lessonId) {
      prevLessonIdRef.current = lessonId;
      setTab(lessonDefaultTab);
      pendingVerseSyncRef.current = true;
    }
  }, [lessonId, lessonDefaultTab, setTab]);

  // Once the new lesson's slides have loaded, snap the verse inputs/URL to
  // the first word slide's surah/ayah. Letter-only lessons (Lesson 1) have no
  // word slides — in that case we leave the verse position untouched, which
  // matches the reference's L1 reset path that doesn't call showLesson(0)
  // until the user navigates to a real lesson (index.html:6834-6863).
  useEffect(() => {
    if (!pendingVerseSyncRef.current) return;
    if (!slides || slides.length === 0) return;
    const firstWord = slides.find((s) => s.type === "word");
    if (!firstWord) {
      // Letter-only lesson — clear the pending flag without touching the URL.
      pendingVerseSyncRef.current = false;
      return;
    }
    pendingVerseSyncRef.current = false;
    setSurah(firstWord.surah);
    setAyah(firstWord.ayah);
    setAyahTo(0);
  }, [slides, setSurah, setAyah, setAyahTo]);

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
