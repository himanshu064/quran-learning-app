"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Volume2, Delete, Trash2, Check, SkipForward, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  fathatan: "\u064B",
  kasratan: "\u064D",
  dammatan: "\u064C",
  superscript_alef: "\u0670",
  quranic_sukun: "\u06E1",
  madda: "\u0653",
  hamza_above: "\u0654",
  hamza_below: "\u0655",
  subscript_alef: "\u0656",
  inverted_damma: "\u0657",
  fatha_two_dots: "\u065E",
  small_waw: "\u06E5",
  small_yeh: "\u06E6",
};

const HARAKAT_BASIC = [
  { key: "fatha", display: "ـَ", label: "فتحة", labelEn: "Fatha" },
  { key: "kasra", display: "ـِ", label: "كسرة", labelEn: "Kasra" },
  { key: "damma", display: "ـُ", label: "ضمة", labelEn: "Damma" },
  { key: "sukun", display: "ـْ", label: "سكون", labelEn: "Sukun" },
  { key: "shadda", display: "ـّ", label: "شدة", labelEn: "Shadda" },
];

const HARAKAT_TANWIN = [
  { key: "fathatan", display: "ـً", label: "فتحتان", labelEn: "Fathatan" },
  { key: "kasratan", display: "ـٍ", label: "كسرتان", labelEn: "Kasratan" },
  { key: "dammatan", display: "ـٌ", label: "ضمتان", labelEn: "Dammatan" },
];

const HARAKAT_QURANIC = [
  { key: "quranic_sukun", display: "ـۡ", label: "سكون قرآني", labelEn: "Q. Sukun" },
  { key: "superscript_alef", display: "ـٰ", label: "ألف خنجرية", labelEn: "Sup. Alef" },
  { key: "madda", display: "ـٓ", label: "مدة", labelEn: "Madda" },
  { key: "hamza_above", display: "ـٔ", label: "همزة فوق", labelEn: "Hamza ↑" },
  { key: "hamza_below", display: "ـٕ", label: "همزة تحت", labelEn: "Hamza ↓" },
  { key: "subscript_alef", display: "ـٖ", label: "ألف صغيرة سفلية", labelEn: "Sub. Alef" },
  { key: "inverted_damma", display: "ـٗ", label: "ضمة مقلوبة", labelEn: "Inv. Damma" },
  { key: "fatha_two_dots", display: "ـٞ", label: "فتحة بنقطتين", labelEn: "Fatha 2-dots" },
  { key: "small_waw", display: "ـۥ", label: "واو صغيرة", labelEn: "Small Waw" },
  { key: "small_yeh", display: "ـۦ", label: "ياء صغيرة", labelEn: "Small Yeh" },
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

// Module-level flag so the instruction plays once per page load, not on every tab switch.
let writingInstructionHasPlayed = false;

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
  const [sessionAttempted, setSessionAttempted] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [showResults, setShowResults] = useState(false);
  // Pending flag: set to true whenever we want to auto-play the current item.
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
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

  // Always-current ref so the mount/auto-play effects never capture a stale closure.
  const playCurrentItemRef = useRef<() => void>(() => {});

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

  // Keep ref current so the mount effect never stales.
  playCurrentItemRef.current = playCurrentItem;

  // On mount: play instruction once (per page load), then auto-play the first item.
  // On subsequent visits to this tab: skip instruction, auto-play immediately.
  //
  // The flag is set ONLY after play() resolves, so that React 18 StrictMode's
  // double-invoke (mount → cleanup → mount) doesn't burn the single-shot before
  // the audio can actually start. A `cancelled` flag ensures the aborted first
  // attempt doesn't leak setState calls or mark the instruction as "played".
  useEffect(() => {
    if (writingInstructionHasPlayed) {
      setPendingAutoPlay(true);
      return;
    }

    let cancelled = false;
    const audio = new Audio(writingInstructionUrl());

    audio.addEventListener("ended", () => {
      if (cancelled) return;
      writingInstructionHasPlayed = true;
      setPendingAutoPlay(true);
    });

    audio.play().then(
      () => {
        if (cancelled) {
          audio.pause();
          audio.src = "";
        }
      },
      () => {
        if (cancelled) return;
        writingInstructionHasPlayed = true;
        setPendingAutoPlay(true);
      },
    );

    return () => {
      cancelled = true;
      audio.pause();
      audio.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire auto-play as soon as the current item is ready.
  useEffect(() => {
    if (!pendingAutoPlay || !currentItem) return;
    setPendingAutoPlay(false);
    playCurrentItemRef.current();
  }, [pendingAutoPlay, currentItem]);

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
      if (type === "shadda") {
        last.shadda = !last.shadda;
      } else if (type === "sukun") {
        last.sukun = true; last.vowel = null;
      } else {
        // All vowels, tanwin, and quranic marks go in the vowel slot (exclusive)
        last.vowel = type; last.sukun = false;
      }
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
      setPendingAutoPlay(true);
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
      setFeedback({ text: language === "ar" ? "أحسنت! الإجابة صحيحة." : "Excellent! Correct answer.", type: "ok" });
      playUrl(praiseAudioUrl()); fireConfetti();
      // Count correct on first-attempt win
      if (attempts === 0) setSessionCorrect((c) => c + 1);
      setSessionAttempted((a) => a + 1);
      setTimeout(advanceToNext, 1500);
    } else {
      const newAttempts = attempts + 1; setAttempts(newAttempts);
      setFeedback({ text: language === "ar" ? "ليست مطابقة تمامًا، حاول مرة أخرى." : "Not exactly matching, try again.", type: "error" });
      if (newAttempts >= 3) {
        setRevealed(true); playUrl(revealAudioUrl());
        setSessionAttempted((a) => a + 1);
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

  const progressPct = total > 0 ? Math.round((sessionAttempted / total) * 100) : 0;
  const accuracy = sessionAttempted > 0 ? Math.round((sessionCorrect / sessionAttempted) * 100) : 0;

  const handleResetSession = () => {
    setWordIndex(0);
    setTypedLetters([]);
    setAttempts(0);
    setFeedback({ text: "", type: "" });
    setRevealed(false);
    setHasListened(false);
    setSessionAttempted(0);
    setSessionCorrect(0);
    setShowResults(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
      {/* Session tracking panel */}
      <div className="rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium">
            {language === "ar" ? "تقدّم الجلسة" : "Session progress"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {language === "ar"
                ? `${sessionAttempted} من ${total} كلمات مجرّبة`
                : `${sessionAttempted} of ${total} words attempted`}
            </span>
            <span className="rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-primary">
              {language === "ar" ? "النتيجة:" : "Score:"} {sessionCorrect} / {sessionAttempted || 0}
            </span>
            <Button variant="ghost" size="sm" className="h-7 cursor-pointer text-xs" onClick={() => setShowResults((s) => !s)}>
              {language === "ar" ? "عرض النتائج" : "View Results"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 cursor-pointer text-xs" onClick={handleResetSession}>
              {language === "ar" ? "إعادة" : "Reset"}
            </Button>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {sessionAttempted > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "ar" ? "الدقّة:" : "Accuracy:"} {accuracy}%
          </p>
        )}
      </div>

      {/* Detailed results panel */}
      {showResults && (
        <div className="rounded-[1.125rem] border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                {language === "ar" ? "ملخّص الجلسة" : "Session summary"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {sessionAttempted === 0
                  ? language === "ar"
                    ? "لم تبدأ الجلسة بعد. اضغط استمع للبدء."
                    : "Session not started. Press listen to begin."
                  : language === "ar"
                    ? `حاولت ${sessionAttempted} كلمات من أصل ${total}، أجبت بشكل صحيح عن ${sessionCorrect} منها.`
                    : `Attempted ${sessionAttempted} of ${total} words, answered ${sessionCorrect} correctly.`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {language === "ar" ? "التغطية:" : "Coverage:"} {sessionAttempted}/{total}
              </p>
            </div>
            {/* Accuracy ring */}
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" className="stroke-muted" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  className="stroke-primary transition-all duration-500"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - accuracy / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {accuracy}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        <h2 className="mb-2 text-center text-lg font-semibold">
          {language === "ar"
            ? isLetterMode ? "اكتب الحرف الذي تسمعه" : "اكتب الكلمة التي تسمعها"
            : isLetterMode ? "Write the letter you hear" : "Write the word you hear"}
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {language === "ar"
            ? isLetterMode
              ? "اضغط على استمع ثم اختر الحرف الصحيح."
              : "اكتب الكلمة التي تسمعها باستخدام الحروف والحركات الصحيحة. اضغط على 🔊 استمع للكلمة عندما تكون جاهزًا."
            : isLetterMode
              ? "Press Listen, then select the correct letter."
              : "Write the word you hear using correct letters and diacritics. Press 🔊 Listen to word when ready."}
        </p>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="gap-2 rounded-full bg-primary cursor-pointer"
            onClick={playCurrentItem}
          >
            <Volume2 className="h-4 w-4" />
            {language === "ar" ? "استمع للكلمة" : "Listen to word"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-full cursor-pointer"
            onClick={skipWord}
          >
            <SkipForward className="h-4 w-4" />
            {language === "ar" ? "كلمة جديدة" : "Next word"}
          </Button>
        </div>

        {/* Word you typed label */}
        <div className="mb-1 text-end text-xs text-muted-foreground">
          {language === "ar" ? "الكلمة التي كتبتها:" : "Word you typed:"}
        </div>

        {/* Preview area */}
        <div className="mb-4 w-full rounded-[1.125rem] border border-border bg-muted p-4 text-center">
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

        {/* Letter buttons — green circles */}
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {letterPool.map((letter, i) => (
            <button
              key={`${letter}-${i}`}
              onClick={() => appendLetter(letter)}
              disabled={!hasListened || isPlaying || revealed}
              className={cn(
                "flex items-center justify-center rounded-xl bg-emerald-500 font-uthmani text-white transition-all hover:bg-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                "min-w-[3.5rem] px-[1.4rem] py-4 text-[2rem]",
              )}
              dir="rtl"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Harakat toolbar — 3 groups: Basic, Tanwin, Quranic */}
        {!isLetterMode && (
          <div className="mb-4 space-y-2">
            {[
              { label: language === "ar" ? "أساسية:" : "Basic:", items: HARAKAT_BASIC },
              { label: language === "ar" ? "تنوين:" : "Tanwin:", items: HARAKAT_TANWIN },
              { label: language === "ar" ? "قرآنية:" : "Quranic:", items: HARAKAT_QURANIC },
            ].map((group) => (
              <div key={group.label} className="flex items-center justify-center gap-2 rounded-[1.125rem] border border-border bg-muted px-3 py-2">
                <span className="me-1 shrink-0 text-xs text-muted-foreground">{group.label}</span>
                {group.items.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => applyHaraka(h.key)}
                    disabled={!hasListened || isPlaying || revealed || typedLetters.length === 0}
                    className="flex items-center justify-center rounded-xl bg-orange-500 font-uthmani text-[2.2rem] text-white transition-all hover:bg-orange-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 min-w-[3.25rem] px-[0.7rem] py-[0.55rem]"
                    title={language === "ar" ? h.label : h.labelEn}
                  >
                    {h.display}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Edit controls */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <Button variant="outline" className="gap-1.5 rounded-full cursor-pointer" onClick={handleBackspace} disabled={!hasListened || isPlaying}>
            <Delete className="h-4 w-4" />
            {language === "ar" ? "حذف آخر حرف/حركة" : "Delete last letter/diacritic"}
          </Button>
          <Button variant="outline" className="gap-1.5 rounded-full cursor-pointer" onClick={clearAll} disabled={!hasListened || isPlaying}>
            <Trash2 className="h-4 w-4" />
            {language === "ar" ? "مسح الكلمة" : "Clear word"}
          </Button>
          <Button className="gap-1.5 rounded-full cursor-pointer" onClick={checkAnswer} disabled={!hasListened || isPlaying || revealed}>
            <Check className="h-4 w-4" />
            {language === "ar" ? "تحقق من الكلمة" : "Check word"}
          </Button>
        </div>

        {/* Feedback */}
        <p className={cn("min-h-5 text-center text-sm", feedback.type === "ok" && "text-emerald-500", feedback.type === "error" && "text-red-500")}>
          {feedback.text}
        </p>
      </div>
    </div>
  );
}
