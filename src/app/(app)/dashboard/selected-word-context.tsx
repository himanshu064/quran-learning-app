"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type SelectedWord = {
  word: string;
  surah: number;
  ayah: number;
  wordIndex: number;
};

type SelectedWordContextValue = {
  selectedWord: SelectedWord | null;
  setSelectedWord: (word: SelectedWord | null) => void;
  clearSelectedWord: () => void;
};

const SelectedWordContext = createContext<SelectedWordContextValue | null>(null);

export function SelectedWordProvider({ children }: { children: React.ReactNode }) {
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const clearSelectedWord = useCallback(() => setSelectedWord(null), []);

  return (
    <SelectedWordContext.Provider value={{ selectedWord, setSelectedWord, clearSelectedWord }}>
      {children}
    </SelectedWordContext.Provider>
  );
}

export function useSelectedWord() {
  const ctx = useContext(SelectedWordContext);
  if (!ctx) throw new Error("useSelectedWord must be used within SelectedWordProvider");
  return ctx;
}
