"use client";

import { useCallback } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { UnifiedTopbar } from "@/components/app/UnifiedTopbar";
import type { TabKey } from "@/components/app/PillTabNav";
import { SelectedWordProvider } from "./selected-word-context";
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

  const activeTab = (tab as TabKey) || "home";

  const handleTabChange = useCallback(
    (newTab: TabKey) => {
      setTab(newTab);
    },
    [setTab],
  );

  // Navigate to a tab with optional surah/ayah params — all via nuqs
  const handleNavigate = useCallback(
    (targetTab: TabKey, params?: Record<string, string>) => {
      if (params?.surah) setSurah(Number(params.surah));
      if (params?.ayah) setAyah(Number(params.ayah));
      setAyahTo(0);
      setTab(targetTab);
    },
    [setTab, setSurah, setAyah, setAyahTo],
  );

  return (
    <SelectedWordProvider>
      <div className="flex flex-1 flex-col">
        <UnifiedTopbar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 overflow-auto bg-background p-4">
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
