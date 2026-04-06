"use client";

import { useCallback, useReducer } from "react";
import { useQuery } from "@tanstack/react-query";
import type { QuranMetadata, QuranWord, SurahMeta } from "@/types";

// -------------------------------------------------------------------
// Types (local)
// -------------------------------------------------------------------

type ReaderState = {
  surah: number;
  ayahFrom: number;
  ayahTo: number;
};

type ReaderAction =
  | { type: "SET"; surah: number; ayahFrom: number; ayahTo?: number }
  | { type: "NEXT_AYAH"; maxAyah: number }
  | { type: "PREV_AYAH" };

function readerReducer(state: ReaderState, action: ReaderAction): ReaderState {
  switch (action.type) {
    case "SET":
      return {
        surah: action.surah,
        ayahFrom: action.ayahFrom,
        ayahTo: action.ayahTo ?? action.ayahFrom,
      };
    case "NEXT_AYAH": {
      if (state.ayahFrom >= action.maxAyah) return state;
      const next = state.ayahFrom + 1;
      return { ...state, ayahFrom: next, ayahTo: next };
    }
    case "PREV_AYAH": {
      if (state.ayahFrom <= 1) return state;
      const prev = state.ayahFrom - 1;
      return { ...state, ayahFrom: prev, ayahTo: prev };
    }
    default:
      return state;
  }
}

// -------------------------------------------------------------------
// Data fetchers (TanStack Query)
// -------------------------------------------------------------------

async function fetchQuranText(): Promise<QuranMetadata> {
  const res = await fetch("/data/quran_text_uthmani.json");
  if (!res.ok) throw new Error("Failed to load Quran text");
  return res.json();
}

async function fetchSurahMeta(): Promise<SurahMeta[]> {
  const res = await fetch("/data/quran-metadata-surah-name.json");
  if (!res.ok) throw new Error("Failed to load surah metadata");
  return res.json();
}

// -------------------------------------------------------------------
// Word-stop-sign detection (matches spec logic)
// -------------------------------------------------------------------

const STOP_SIGNS = new Set([
  "\u06D6",
  "\u06D7",
  "\u06D8",
  "\u06D9",
  "\u06DA",
  "\u06DB",
  "\u06DC",
  "\u06DD",
  "\u06DE",
  "\u06DF",
  "\u06E0",
]);

function isStopSign(word: string): boolean {
  return word.split("").some((ch) => STOP_SIGNS.has(ch));
}

// -------------------------------------------------------------------
// Parse raw text into word tokens
// -------------------------------------------------------------------

function parseWords(rawText: string, surah: number, ayah: number): QuranWord[] {
  const tokens = rawText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  let wordIndex = 0;
  return tokens.map((text) => {
    const stop = isStopSign(text);
    const word: QuranWord = {
      text,
      surah,
      ayah,
      index: stop ? wordIndex : ++wordIndex,
      isStopSign: stop,
    };
    return word;
  });
}

// -------------------------------------------------------------------
// Hook
// -------------------------------------------------------------------

export function useQuranReader(initialSurah = 54, initialAyah = 17) {
  const [state, dispatch] = useReducer(readerReducer, {
    surah: initialSurah,
    ayahFrom: initialAyah,
    ayahTo: initialAyah,
  });

  // Load full Quran text once — cached indefinitely
  const { data: quranData, isLoading: isLoadingQuran } = useQuery({
    queryKey: ["quran-text"],
    queryFn: fetchQuranText,
    staleTime: Infinity,
  });

  // Load surah metadata once
  const { data: surahMeta = [], isLoading: isLoadingSurahMeta } = useQuery({
    queryKey: ["surah-meta"],
    queryFn: fetchSurahMeta,
    staleTime: Infinity,
  });

  const currentSurahMeta = surahMeta[state.surah - 1] ?? null;
  const maxAyah = currentSurahMeta?.numberOfAyahs ?? 286;

  // Extract words for the current ayah range
  const words: QuranWord[] = [];
  if (quranData) {
    for (let a = state.ayahFrom; a <= state.ayahTo; a++) {
      const raw = quranData?.[state.surah]?.[a];
      if (raw) {
        words.push(...parseWords(raw, state.surah, a));
      }
    }
  }

  const navigate = useCallback(
    (surah: number, ayahFrom: number, ayahTo?: number) => {
      dispatch({ type: "SET", surah, ayahFrom, ayahTo });
    },
    [],
  );

  const nextAyah = useCallback(() => {
    dispatch({ type: "NEXT_AYAH", maxAyah });
  }, [maxAyah]);

  const prevAyah = useCallback(() => {
    dispatch({ type: "PREV_AYAH" });
  }, []);

  return {
    surah: state.surah,
    ayahFrom: state.ayahFrom,
    ayahTo: state.ayahTo,
    words,
    surahMeta,
    currentSurahMeta,
    maxAyah,
    isLoading: isLoadingQuran || isLoadingSurahMeta,
    navigate,
    nextAyah,
    prevAyah,
  };
}
