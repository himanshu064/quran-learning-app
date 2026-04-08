"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Volume2, Delete, Trash2, Check, SkipForward, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage, useLessonContext, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import { praiseAudioUrl, retryAudioUrl, revealAudioUrl, writingInstructionUrl } from "@/lib/quran";
import { useSelectedWord } from "../selected-word-context";
import type { WordSlide, LetterSlide } from "@/types";

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
  vowel: string | null;
  shadda: boolean;
  sukun: boolean;
};

// Unified write item for both word and letter slides
type WriteItem = {
  text: string;
  type: "word" | "letter";
  surah?: number;
  ayah?: number;
  wordIndex?: number;
  audio?: string;
};

function toWriteItem(slide: WordSlide | LetterSlide): WriteItem {
  if (slide.type === "word") {
    return { text: slide.word, type: "word", surah: slide.surah, ayah: slide.ayah, wordIndex: slide.wordIndex };
  }
  return { text: slide.glyph, type: "letter", audio: slide.audio };
}

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
    if (!unique.includes(ch) && ch.charCodeAt(0) >= 0x0600 && ch.charCodeAt(0) <= 0x06ff) {
      unique.push(ch);
    }
  }
  return unique;
}

function normalizeArabic(str: string): string {
  try { return str.normalize("NFC"); } catch { return str; }
}

function fireConfetti() {
  try {
    const duration = 1500;
    const end = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    function frame() {
      confetti({ ...defaults, particleCount: 40, origin: { x: Math.random(), y: Math.random() - 0.2 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();
  } catch { /* graceful degradation if confetti not supported */ }
}

export function WritingPanel() {
  const { language } = useLanguage();
  const { slides, isLoading, config } = useLessonContext();
  const { playWordAudio, playUrl, playLetterAudio, isPlaying } = useAudioContext();
  const { saveProgress, saveLastLesson, getLessonProgress } = useProgress();
  const restoredWriting = useRef(false);

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
  const [feedback, setFeedback] = useState<{ text: string; type: "ok" | "error" | "" }>({ text: "", type: "" });
  const [revealed, setRevealed] = useState(false);
  const instructionPlayed = useRef(false);
  const { selectedWord } = useSelectedWord();

  // Support both word AND letter slides
  const writeItems = useMemo(
    () =>
      slides
        .filter((s): s is WordSlide | LetterSlide => s.type === "word" || s.type === "letter")
        .map(toWriteItem),
    [slides],
  );
  const total = writeItems.length;

  // If a word was selected from the Verse tab, use it as the current write item
  const selectedWriteItem: WriteItem | null = selectedWord
    ? { text: selectedWord.word, type: "word" as const, surah: selectedWord.surah, ayah: selectedWord.ayah, wordIndex: selectedWord.wordIndex }
    : null;
  const currentItem: WriteItem | undefined = selectedWriteItem || writeItems[wordIndex];

  useEffect(() => {
    if (restoredWriting.current || total === 0) return;
    restoredWriting.current = true;
    const saved = getLessonProgressRef.current(config.id);
    if (saved && saved.slideIndex > 0 && saved.slideIndex < total) setWordIndex(saved.slideIndex);
  }, [total, config.id]);

  useEffect(() => {
    if (total > 0) {
      saveProgressRef.current({ lessonId: config.id, slideIndex: wordIndex });
      saveLastLessonRef.current(config.id);
    }
  }, [wordIndex, total, config.id]);

  // Stable key for the current item to avoid reshuffling on unrelated re-renders
  const currentItemKey = selectedWord
    ? `sw:${selectedWord.surah}:${selectedWord.ayah}:${selectedWord.wordIndex}`
    : `li:${wordIndex}`;

  const [letterPool, setLetterPool] = useState<string[]>([]);

  useEffect(() => {
    if (!currentItem) { setLetterPool([]); return; }
    const base = getBaseLetters(currentItem.text);
    const distractors = shuffleArray(ALL_ARABIC_LETTERS.filter((l) => !base.includes(l))).slice(0, 3);
    setLetterPool(shuffleArray([...base, ...distractors]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItemKey]);

  useEffect(() => {
    if (!instructionPlayed.current) {
      playUrl(writingInstructionUrl());
      instructionPlayed.current = true;
    }
  }, [playUrl]);

  const typedWord = useMemo(() => getTypedWord(typedLetters), [typedLetters]);

  const isLetterMode = (currentItem as WriteItem | undefined)?.type === "letter";

  const playCurrentItem = useCallback(() => {
    if (!currentItem) return;
    if (currentItem.type === "word" && currentItem.surah && currentItem.ayah && currentItem.wordIndex) {
      playWordAudio(currentItem.surah, currentItem.ayah, currentItem.wordIndex);
    } else if (currentItem.type === "letter" && currentItem.audio) {
      playLetterAudio(currentItem.audio);
    }
    setHasListened(true);
  }, [currentItem, playWordAudio, playLetterAudio]);

  const appendLetter = useCallback((ch: string) => {
    if (revealed) return;
    setTypedLetters((prev) => [...prev, { base: ch, vowel: null, shadda: false, sukun: false }]);
    setFeedback({ text: "", type: "" });
  }, [revealed]);

  const applyHaraka = useCallback((type: string) => {
    if (revealed) return;
    setTypedLetters((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      if (type === "fatha" || type === "kasra" || type === "damma") { last.vowel = type; last.sukun = false; }
      else if (type === "shadda") { last.shadda = !last.shadda; if (last.shadda) last.sukun = false; }
      else if (type === "sukun") { last.sukun = true; last.vowel = null; }
      updated[updated.length - 1] = last;
      return updated;
    });
    setFeedback({ text: "", type: "" });
  }, [revealed]);

  const handleBackspace = useCallback(() => {
    setTypedLetters((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      if (last.sukun) { last.sukun = false; updated[updated.length - 1] = last; }
      else if (last.vowel) { last.vowel = null; updated[updated.length - 1] = last; }
      else if (last.shadda) { last.shadda = false; updated[updated.length - 1] = last; }
      else { updated.pop(); }
      return updated;
    });
    setFeedback({ text: "", type: "" });
  }, []);

  const clearAll = useCallback(() => { setTypedLetters([]); setFeedback({ text: "", type: "" }); }, []);

  const advanceToNext = useCallback(() => {
    if (wordIndex + 1 < total) {
      setWordIndex((i) => i + 1);
      setTypedLetters([]);
      setAttempts(0);
      setFeedback({ text: "", type: "" });
      setRevealed(false);
      setHasListened(false);
    }
  }, [wordIndex, total]);

  const checkAnswer = useCallback(() => {
    if (!currentItem || !typedWord) {
      setFeedback({ text: language === "ar" ? "اكتب الإجابة أولاً." : "Type the answer first.", type: "error" });
      playUrl(retryAudioUrl()); return;
    }
    const typedNorm = normalizeArabic(typedWord);
    const targetNorm = normalizeArabic(currentItem.text);
    if (typedNorm === targetNorm) {
      setFeedback({ text: language === "ar" ? "أحسنت! الإجابة صحيحة." : "Correct! Well done.", type: "ok" });
      playUrl(praiseAudioUrl()); fireConfetti();
      setTimeout(advanceToNext, 1500);
    } else {
      const newAttempts = attempts + 1; setAttempts(newAttempts);
      setFeedback({ text: language === "ar" ? "ليست مطابقة تمامًا، حاول مرة أخرى." : "Not quite right, try again.", type: "error" });
      if (newAttempts >= 3) {
        setRevealed(true); playUrl(revealAudioUrl());
        setTimeout(advanceToNext, 2500);
      } else { playUrl(retryAudioUrl()); }
    }
  }, [typedWord, currentItem, attempts, language, playUrl, advanceToNext]);

  const skipWord = useCallback(() => advanceToNext(), [advanceToNext]);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;

  if (!selectedWord && writeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد عناصر للكتابة" : "No items for writing practice"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="mb-2 text-center text-lg font-semibold">
            {language === "ar"
              ? isLetterMode ? "اكتب الحرف الذي تسمعه" : "اكتب الكلمة التي تسمعها"
              : isLetterMode ? "Write the letter you hear" : "Write the word you hear"}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {language === "ar"
              ? isLetterMode
                ? "اضغط على استمع ثم اختر الحرف الصحيح."
                : "اكتب الكلمة التي تسمعها باستخدام الحروف والحركات الصحيحة. اضغط على استمع للكلمة عندما تكون جاهزًا."
              : isLetterMode
                ? "Press Listen, then select the correct letter."
                : "Write the word you hear using correct letters and diacritics. Press Listen to word when ready."}
          </p>

          {/* Word progress */}
          <div className="mb-4 text-end">
            <Badge variant="secondary" className="text-xs">
              {language === "ar"
                ? `${isLetterMode ? "حرف" : "كلمة"} ${wordIndex + 1} / ${total}`
                : `${isLetterMode ? "Letter" : "Word"} ${wordIndex + 1} / ${total}`}
            </Badge>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 rounded-full cursor-pointer"
              onClick={playCurrentItem}
            >
              <Volume2 className="h-4 w-4" />
              {language === "ar" ? "استمع" : "Listen"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-full cursor-pointer"
              onClick={skipWord}
            >
              <SkipForward className="h-4 w-4" />
              {language === "ar" ? "التالي" : "Next"}
            </Button>
          </div>

          {/* Preview area */}
          <div className="mb-4 w-full rounded-xl border bg-muted p-4 text-center">
            <span className={cn(
              "font-uthmani leading-[2.3]",
              isLetterMode ? "text-[3.5rem]" : "text-[2.4rem]",
              !typedWord && "text-muted-foreground/30",
            )} dir="rtl">
              {typedWord || "..."}
            </span>
          </div>

          {/* Revealed answer */}
          {revealed && currentItem && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-center">
              <p className="mb-1 text-xs text-amber-500">{language === "ar" ? "الإجابة الصحيحة:" : "Correct answer:"}</p>
              <span className={cn("font-uthmani", isLetterMode ? "text-3xl" : "text-2xl")} dir="rtl">{currentItem.text}</span>
            </div>
          )}

          {/* Letter buttons */}
          <div className="mb-4 flex flex-wrap justify-center gap-1.5">
            {letterPool.map((letter, i) => (
              <Button
                key={`${letter}-${i}`}
                onClick={() => appendLetter(letter)}
                disabled={!hasListened || isPlaying || revealed}
                className={cn(
                  "rounded-xl bg-emerald-600 font-uthmani text-white hover:bg-emerald-700 cursor-pointer",
                  isLetterMode ? "h-14 w-14 text-2xl" : "h-12 w-12 text-xl",
                )}
                dir="rtl"
              >
                {letter}
              </Button>
            ))}
          </div>

          {/* Harakat toolbar — hide for letter mode since single letters don't need diacritics */}
          {!isLetterMode && (
            <div className="mb-4 flex items-center justify-center gap-1.5 rounded-xl border bg-muted px-3 py-2">
              <span className="me-1 text-xs text-muted-foreground">{language === "ar" ? "الحركات:" : "Diacritics:"}</span>
              {HARAKAT_BUTTONS.map((h) => (
                <Button
                  key={h.key}
                  size="sm"
                  onClick={() => applyHaraka(h.key)}
                  disabled={!hasListened || isPlaying || revealed || typedLetters.length === 0}
                  className="rounded-full bg-orange-500 px-3 py-1.5 font-uthmani text-sm text-white hover:bg-orange-600 cursor-pointer"
                  title={language === "ar" ? h.label : h.labelEn}
                >
                  {h.display}
                </Button>
              ))}
            </div>
          )}

          {/* Edit controls */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={handleBackspace} disabled={!hasListened || isPlaying}>
              <Delete className="h-4 w-4" />
              {language === "ar" ? "حذف" : "Delete"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={clearAll} disabled={!hasListened || isPlaying}>
              <Trash2 className="h-4 w-4" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
            <Button size="sm" className="gap-1.5 cursor-pointer" onClick={checkAnswer} disabled={!hasListened || isPlaying || revealed}>
              <Check className="h-4 w-4" />
              {language === "ar" ? "تحقق" : "Check"}
            </Button>
          </div>

          {/* Feedback */}
          <p className={cn("min-h-5 text-center text-sm", feedback.type === "ok" && "text-emerald-500", feedback.type === "error" && "text-red-500")}>
            {feedback.text}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
