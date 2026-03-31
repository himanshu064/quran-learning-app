"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import enDict from "@/dictionaries/en.json";
import arDict from "@/dictionaries/ar.json";

export type Language = "ar" | "en";
export type Direction = "rtl" | "ltr";

type Dictionary = typeof enDict;

type LanguageContextValue = {
  language: Language;
  direction: Direction;
  dict: Dictionary;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const COOKIE_NAME = "app_language";

const dictionaries: Record<Language, Dictionary> = { en: enDict, ar: arDict };

function getDirection(lang: Language): Direction {
  return lang === "ar" ? "rtl" : "ltr";
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

/**
 * Sets a cookie readable by the server (not HttpOnly, so JS can set it).
 * Max-age 1 year.
 */
function setLangCookie(lang: Language) {
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function LanguageProvider({
  defaultLanguage = "ar",
  children,
}: {
  defaultLanguage?: Language;
  children: React.ReactNode;
}) {
  // No localStorage read on mount — defaultLanguage comes from the server
  // (read from cookie in the layout), so SSR and client match perfectly.
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  const direction = getDirection(language);
  const dict = dictionaries[language];

  // Sync dir/lang on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", direction);
    html.setAttribute("lang", language);
  }, [language, direction]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setLangCookie(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string) => getNestedValue(dict as unknown as Record<string, unknown>, key),
    [dict],
  );

  const value = useMemo(
    () => ({ language, direction, dict, setLanguage, toggleLanguage, t }),
    [language, direction, dict, setLanguage, toggleLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
