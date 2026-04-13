"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  Volume2,
  Delete,
  Trash2,
  Check,
  SkipForward,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/lesson";
import { useLanguage, useLessonContext, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import {
  praiseAudioUrl,
  retryAudioUrl,
  revealAudioUrl,
  writingInstructionUrl,
} from "@/lib/quran";
import type { WordSlide } from "@/types";

// ---------- Constants ----------

const HARAKAT_MAP: Record<string, string> = {
  fatha: "\u064E",
  kasra: "\u0650",
  damma: "\u064F",
  sukun: "\u0652",
  shadda: "\u0651",
};

const HARAKAT_BUTTONS = [
  { key: "fatha", display: "ـَ", label: "فتحة", labelEn: "Fatha" },
  { key: "kasra", display: "ـِ", label: "كسرة", labelEn: "Kasra" },
  { key: "damma", display: "ـُ", label: "ضمة", labelEn: "Damma" },
  { key: "sukun", display: "ـْ", label: "سكون", labelEn: "Sukun" },
  { key: "shadda", display: "ـّ", label: "شدة", labelEn: "Shadda" },
];

const ALL_ARABIC_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");

type LetterCluster = {
  base: string;
  vowel: string | null; // fatha | kasra | damma
  shadda: boolean;
  sukun: boolean;
};

// ---------- Helpers ----------

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildClusterString(c: LetterCluster): string {
  let result = c.base;
  if (c.shadda) result += HARAKAT_MAP.shadda;
  if (c.vowel) result += HARAKAT_MAP[c.vowel];
  if (c.sukun) result += HARAKAT_MAP.sukun;
  return result;
}

function getTypedWord(clusters: LetterCluster[]): string {
  return clusters.map(buildClusterString).join("");
}

function getBaseLetters(word: string): string[] {
  const harakatRegex = /[\u064B-\u0652]/g;
  const base = word.replace(harakatRegex, "");
  const unique: string[] = [];
  for (const ch of base) {
    if (
      !unique.includes(ch) &&
      ch.charCodeAt(0) >= 0x0600 &&
      ch.charCodeAt(0) <= 0x06ff
    ) {
      unique.push(ch);
    }
  }
  return unique;
}

function normalizeArabic(str: string): string {
  try {
    return str.normalize("NFC");
  } catch {
    return str;
  }
}

function fireConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
  function frame() {
    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  }
  frame();
}

// ---------- Component ----------

export function WritingScreen() {
  const { language } = useLanguage();
  const { slides, isLoading, config } = useLessonContext();
  const { playWordAudio, playUrl, isPlaying } = useAudioContext();
  const { saveProgress, saveLastLesson, getLessonProgress } = useProgress();
  const restoredWriting = useRef(false);

  // Stable refs to avoid re-render loops from progress query invalidation
  const getLessonProgressRef = useRef(getLessonProgress);
  getLessonProgressRef.current = getLessonProgress;
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;
  const saveLastLessonRef = useRef(saveLastLesson);
  saveLastLessonRef.current = saveLastLesson;

  const [hasListened, setHasListened] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState<LetterCluster[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "ok" | "error" | "";
  }>({ text: "", type: "" });
  const [revealed, setRevealed] = useState(false);
  const instructionPlayed = useRef(false);

  const wordSlides = useMemo(
    () => slides.filter((s): s is WordSlide => s.type === "word"),
    [slides],
  );
  const total = wordSlides.length;
  const currentWord = wordSlides[wordIndex];

  // Restore saved position on mount
  useEffect(() => {
    if (restoredWriting.current || total === 0) return;
    restoredWriting.current = true;
    const saved = getLessonProgressRef.current(config.id);
    if (saved && saved.slideIndex > 0 && saved.slideIndex < total) {
      setWordIndex(saved.slideIndex);
    }
  }, [total, config.id]);

  // Track progress on word change
  useEffect(() => {
    if (total > 0) {
      saveProgressRef.current({ lessonId: config.id, slideIndex: wordIndex });
      saveLastLessonRef.current(config.id);
    }
  }, [wordIndex, total, config.id]);

  const letterPool = ALL_ARABIC_LETTERS;

  // Play instruction every time the module is visited
  useEffect(() => {
    if (!instructionPlayed.current) {
      playUrl(writingInstructionUrl());
      instructionPlayed.current = true;
    }
  }, [playUrl]);

  const typedWord = useMemo(() => getTypedWord(typedLetters), [typedLetters]);

  const playCurrentWord = useCallback(() => {
    if (currentWord) {
      playWordAudio(currentWord.surah, currentWord.ayah, currentWord.wordIndex);
      setHasListened(true);
    }
  }, [currentWord, playWordAudio]);

  const appendLetter = useCallback(
    (ch: string) => {
      if (revealed) return;
      setTypedLetters((prev) => [
        ...prev,
        { base: ch, vowel: null, shadda: false, sukun: false },
      ]);
      setFeedback({ text: "", type: "" });
    },
    [revealed],
  );

  const applyHaraka = useCallback(
    (type: string) => {
      if (revealed) return;
      setTypedLetters((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };

        if (type === "fatha" || type === "kasra" || type === "damma") {
          last.vowel = type;
          last.sukun = false;
        } else if (type === "shadda") {
          last.shadda = !last.shadda;
          if (last.shadda) last.sukun = false;
        } else if (type === "sukun") {
          last.sukun = true;
          last.vowel = null;
        }

        updated[updated.length - 1] = last;
        return updated;
      });
      setFeedback({ text: "", type: "" });
    },
    [revealed],
  );

  const handleBackspace = useCallback(() => {
    setTypedLetters((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };

      // Delete in reverse order: sukun → vowel → shadda → base
      if (last.sukun) {
        last.sukun = false;
        updated[updated.length - 1] = last;
      } else if (last.vowel) {
        last.vowel = null;
        updated[updated.length - 1] = last;
      } else if (last.shadda) {
        last.shadda = false;
        updated[updated.length - 1] = last;
      } else {
        updated.pop();
      }
      return updated;
    });
    setFeedback({ text: "", type: "" });
  }, []);

  const clearAll = useCallback(() => {
    setTypedLetters([]);
    setFeedback({ text: "", type: "" });
  }, []);

  const checkAnswer = useCallback(() => {
    if (!currentWord || !typedWord) {
      setFeedback({
        text: language === "ar" ? "اكتب الكلمة أولاً." : "Type the word first.",
        type: "error",
      });
      playUrl(retryAudioUrl());
      return;
    }

    const typedNorm = normalizeArabic(typedWord);
    const targetNorm = normalizeArabic(currentWord.word);

    if (typedNorm === targetNorm) {
      // Correct
      setFeedback({
        text:
          language === "ar" ? "أحسنت! الإجابة صحيحة." : "Correct! Well done.",
        type: "ok",
      });
      playUrl(praiseAudioUrl());
      fireConfetti();
      // Auto-advance
      setTimeout(() => {
        if (wordIndex + 1 < total) {
          setWordIndex((i) => i + 1);
          setTypedLetters([]);
          setAttempts(0);
          setFeedback({ text: "", type: "" });
          setRevealed(false);
          setHasListened(false);
        }
      }, 1500);
    } else {
      // Incorrect
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setFeedback({
        text:
          language === "ar"
            ? "ليست مطابقة تمامًا، حاول مرة أخرى."
            : "Not quite right, try again.",
        type: "error",
      });

      if (newAttempts >= 3) {
        setRevealed(true);
        playUrl(revealAudioUrl());
        setTimeout(() => {
          if (wordIndex + 1 < total) {
            setWordIndex((i) => i + 1);
            setTypedLetters([]);
            setAttempts(0);
            setFeedback({ text: "", type: "" });
            setRevealed(false);
            setHasListened(false);
          }
        }, 2500);
      } else {
        playUrl(retryAudioUrl());
      }
    }
  }, [typedWord, currentWord, attempts, wordIndex, total, language, playUrl]);

  const skipWord = useCallback(() => {
    if (wordIndex + 1 < total) {
      setWordIndex((i) => i + 1);
      setTypedLetters([]);
      setAttempts(0);
      setFeedback({ text: "", type: "" });
      setRevealed(false);
      setHasListened(false);
    }
  }, [wordIndex, total]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (wordSlides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "لا توجد كلمات للكتابة"
            : "No words for writing practice"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <ProgressIndicator
        current={wordIndex}
        total={total}
        label={
          language === "ar"
            ? `كلمة ${wordIndex + 1} / ${total}`
            : `Word ${wordIndex + 1} / ${total}`
        }
        className="w-full max-w-md"
      />

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          size="lg"
          className="gap-2 rounded-full cursor-pointer"
          onClick={playCurrentWord}
        >
          <Volume2 className="h-5 w-5" />
          {language === "ar" ? "استمع للكلمة" : "Listen"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2 rounded-full cursor-pointer"
          onClick={skipWord}
        >
          <SkipForward className="h-4 w-4" />
          {language === "ar" ? "كلمة جديدة" : "New Word"}
        </Button>
      </div>

      {/* Preview area */}
      <div className="w-full max-w-md rounded-xl border bg-muted p-4 text-center">
        <span
          className={cn(
            "font-uthmani text-[2.4rem] leading-[2.3]",
            !typedWord && "text-muted-foreground/30",
          )}
          dir="rtl"
        >
          {typedWord || (language === "ar" ? "..." : "...")}
        </span>
      </div>

      {/* Revealed answer */}
      {revealed && currentWord && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-center">
          <p className="text-xs text-amber-500 mb-1">
            {language === "ar" ? "الكلمة الصحيحة:" : "Correct answer:"}
          </p>
          <span className="font-uthmani text-2xl" dir="rtl">
            {currentWord.word}
          </span>
        </div>
      )}

      {/* Letter buttons */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {letterPool.map((letter, i) => (
          <button
            key={`${letter}-${i}`}
            onClick={() => appendLetter(letter)}
            disabled={!hasListened || isPlaying || revealed}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 font-uthmani text-xl text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            dir="rtl"
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Harakat toolbar */}
      <div className="flex items-center gap-1.5 rounded-xl border bg-muted px-3 py-2">
        <span className="text-xs text-muted-foreground me-1">
          {language === "ar" ? "حركات:" : "Harakat:"}
        </span>
        {HARAKAT_BUTTONS.map((h) => (
          <button
            key={h.key}
            onClick={() => applyHaraka(h.key)}
            disabled={!hasListened || isPlaying || revealed || typedLetters.length === 0}
            className="rounded-full bg-orange-500 px-3 py-1.5 font-uthmani text-sm text-white transition-colors hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
            title={language === "ar" ? h.label : h.labelEn}
          >
            {h.display}
          </button>
        ))}
      </div>

      {/* Edit controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={handleBackspace}
          disabled={!hasListened || isPlaying}
        >
          <Delete className="h-4 w-4" />
          {language === "ar" ? "حذف" : "Delete"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={clearAll}
          disabled={!hasListened || isPlaying}
        >
          <Trash2 className="h-4 w-4" />
          {language === "ar" ? "مسح" : "Clear"}
        </Button>
        <Button
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={checkAnswer}
          disabled={!hasListened || isPlaying || revealed}
        >
          <Check className="h-4 w-4" />
          {language === "ar" ? "تحقق" : "Check"}
        </Button>
      </div>

      {/* Feedback */}
      <p
        className={cn(
          "min-h-5 text-center text-sm",
          feedback.type === "ok" && "text-emerald-500",
          feedback.type === "error" && "text-red-500",
        )}
      >
        {feedback.text}
      </p>
    </div>
  );
}
