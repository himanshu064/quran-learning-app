"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Volume2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage, useLessonContext, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import {
  praiseAudioUrl,
  retryAudioUrl,
  revealAudioUrl,
  listeningInstructionUrl,
} from "@/lib/quran";
import { useQuery } from "@tanstack/react-query";
import { useSelectedWord } from "../selected-word-context";
import type { WordSlide, LetterSlide } from "@/types";

type QuranVerse = { text: string };

// Unified quiz item for both word and letter slides
type QuizItem = {
  text: string; // the display text (word or glyph)
  type: "word" | "letter";
  // Word-specific
  surah?: number;
  ayah?: number;
  wordIndex?: number;
  // Letter-specific
  audio?: string;
};

function toQuizItem(slide: WordSlide | LetterSlide): QuizItem {
  if (slide.type === "word") {
    return {
      text: slide.word,
      type: "word",
      surah: slide.surah,
      ayah: slide.ayah,
      wordIndex: slide.wordIndex,
    };
  }
  return {
    text: slide.glyph,
    type: "letter",
    audio: slide.audio,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

export function McqPanel() {
  const { language } = useLanguage();
  const { slides, isLoading, config } = useLessonContext();
  const { playWordAudio, playUrl, playLetterAudio, isPlaying } = useAudioContext();
  const { saveMcqScore, saveProgress, saveLastLesson } = useProgress();
  const { selectedWord } = useSelectedWord();

  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;
  const saveLastLessonRef = useRef(saveLastLesson);
  saveLastLessonRef.current = saveLastLesson;

  // Per-mount flag for the instruction audio. Component-scoped so the intro
  // plays each time the user enters the Listening panel, instead of staying
  // skipped after a single page-session play (which a module-level flag did).
  const introHasPlayedRef = useRef(false);

  const [hasListened, setHasListened] = useState(false);
  // Two-phase first-listen gate (question 0 only):
  //   phase 1 — audio has genuinely started (isPlaying went true)
  //   phase 2 — audio has ended (isPlaying went back to false after phase 1)
  // Using two phases avoids the race where hasListened=true is set one render
  // before AudioProvider sets isPlaying=true, which would otherwise cause the
  // single-phase effect to fire prematurely.
  const [firstAudioStarted, setFirstAudioStarted] = useState(false);
  const [hasFinishedFirstListen, setHasFinishedFirstListen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [selectedBtns, setSelectedBtns] = useState<Record<number, "correct" | "incorrect">>({});
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Pending flag: set to true whenever we want to auto-play the current item
  // (after instruction audio, after advancing to next question).
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  // 4 options stored in state — only regenerated when question changes, NOT on audio state changes.
  // Declared with the rest of the component state so the hook order stays at the top
  // (avoids HMR hook-count mismatches on edits).
  const [options, setOptions] = useState<string[]>([]);

  // Support both word AND letter slides
  const quizItems = useMemo(
    () =>
      slides
        .filter((s): s is WordSlide | LetterSlide => s.type === "word" || s.type === "letter")
        .map(toQuizItem),
    [slides],
  );
  const totalQuestions = quizItems.length;

  // Rebuild a fresh shuffled order whenever the quiz item pool changes (new lesson).
  // Mirrors the reference app's buildShuffledQuestionOrder() so questions don't
  // always start at alif / index 0.
  useEffect(() => {
    if (quizItems.length > 0) {
      setQuestionOrder(shuffleArray(Array.from({ length: quizItems.length }, (_, i) => i)));
      setQuestionIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizItems.length]);

  // Load quran text for generating word distractors from verses
  const { data: quranText } = useQuery({
    queryKey: ["quran-text"],
    queryFn: async () => {
      const res = await fetch("/data/quran_text_uthmani.json");
      return res.json() as Promise<Record<string, QuranVerse>>;
    },
    staleTime: Infinity,
  });

  // Stable key for the selected word to avoid re-shuffling on every render
  const selectedWordKey = selectedWord
    ? `${selectedWord.surah}:${selectedWord.ayah}:${selectedWord.wordIndex}`
    : "";

  // If a word was selected from the Verse tab, use it as the current quiz item
  const selectedQuizItem: QuizItem | null = selectedWord
    ? { text: selectedWord.word, type: "word", surah: selectedWord.surah, ayah: selectedWord.ayah, wordIndex: selectedWord.wordIndex }
    : null;
  // Resolve the actual quiz item index through the shuffled order
  const currentQuestionIdx = questionOrder.length > 0 ? (questionOrder[questionIndex] ?? questionIndex) : questionIndex;
  const currentItem = selectedQuizItem || quizItems[currentQuestionIdx];

  useEffect(() => {
    if (totalQuestions > 0) {
      saveProgressRef.current({ lessonId: config.id, slideIndex: questionIndex });
      saveLastLessonRef.current(config.id);
    }
  }, [questionIndex, totalQuestions, config.id]);

  useEffect(() => {
    if (!currentItem) { setOptions([]); return; }

    // When a word is selected from Verse tab, get distractors from nearby verses
    if (selectedWord && quranText) {
      const verseWords: string[] = [];
      for (let a = Math.max(1, selectedWord.ayah - 2); a <= selectedWord.ayah + 2; a++) {
        const verse = quranText[`${selectedWord.surah}:${a}`];
        if (verse) {
          verse.text.split(" ").forEach((w) => {
            const trimmed = w.trim();
            if (trimmed && trimmed !== selectedWord.word) verseWords.push(trimmed);
          });
        }
      }
      const unique = Array.from(new Set(verseWords));
      const distractors = shuffleArray(unique).slice(0, 3);
      if (distractors.length < 3) { setOptions([]); return; }
      setOptions(shuffleArray([currentItem.text, ...distractors]));
      return;
    }

    // Normal lesson-based quiz
    if (quizItems.length < 4) { setOptions([]); return; }
    const others = quizItems.filter((_, i) => i !== currentQuestionIdx);
    const uniqueTexts = Array.from(new Set(others.map((q) => q.text))).filter(
      (t) => t !== currentItem.text,
    );
    const distractors = shuffleArray(uniqueTexts).slice(0, 3);
    setOptions(shuffleArray([currentItem.text, ...distractors]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, selectedWordKey, quizItems.length, quranText, questionOrder]);

  // Always-current ref so the auto-play effect below never captures a stale closure.
  const playCurrentItemRef = useRef<() => void>(() => {});

  const playCurrentItem = useCallback(() => {
    if (!currentItem) return;
    if (currentItem.type === "word" && currentItem.surah && currentItem.ayah && currentItem.wordIndex) {
      playWordAudio(currentItem.surah, currentItem.ayah, currentItem.wordIndex);
    } else if (currentItem.type === "letter" && currentItem.audio) {
      playLetterAudio(`/${currentItem.audio}`);
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
  // the audio can actually start. A `cancelled` ref ensures the aborted first
  // attempt doesn't leak setState calls or mark the instruction as "played".
  useEffect(() => {
    if (introHasPlayedRef.current) {
      setPendingAutoPlay(true);
      return;
    }

    let cancelled = false;
    const audio = new Audio(listeningInstructionUrl());

    audio.addEventListener("ended", () => {
      if (cancelled) return;
      introHasPlayedRef.current = true;
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
        // play() rejected — autoplay blocked OR cleanup paused it. If we were
        // cancelled, leave the flag false so the next mount can retry.
        if (cancelled) return;
        introHasPlayedRef.current = true;
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

  // Phase 1: mark that audio has actually started playing (avoids premature trigger).
  useEffect(() => {
    if (hasListened && isPlaying && !firstAudioStarted) {
      setFirstAudioStarted(true);
    }
  }, [hasListened, isPlaying, firstAudioStarted]);

  // Phase 2: once audio has started AND stopped, reveal options for question 0.
  useEffect(() => {
    if (firstAudioStarted && !isPlaying && !hasFinishedFirstListen) {
      setHasFinishedFirstListen(true);
    }
  }, [firstAudioStarted, isPlaying, hasFinishedFirstListen]);

  const handleChoice = useCallback(
    (idx: number, chosenText: string) => {
      if (answeredCorrectly) return;
      if (chosenText === currentItem.text) {
        setAnsweredCorrectly(true);
        setSelectedBtns((prev) => ({ ...prev, [idx]: "correct" }));
        setScore((s) => s + 1);
        playUrl(praiseAudioUrl());
        fireConfetti();
      } else {
        // Single-attempt MCQ: reveal correct answer immediately on first wrong click
        setAttempts(1);
        setAnsweredCorrectly(true);
        setSelectedBtns((prev) => ({ ...prev, [idx]: "incorrect" }));
        const correctIdx = options.findIndex((o) => o === currentItem.text);
        if (correctIdx !== -1) setSelectedBtns((prev) => ({ ...prev, [correctIdx]: "correct" }));
        playUrl(revealAudioUrl());
      }
    },
    [answeredCorrectly, currentItem, attempts, options, playUrl],
  );

  const handleNext = useCallback(() => {
    if (questionIndex + 1 >= totalQuestions) {
      setFinished(true);
      saveMcqScore({ lessonId: config.id, score, total: totalQuestions });
      return;
    }
    setQuestionIndex((i) => i + 1);
    setAttempts(0);
    setAnsweredCorrectly(false);
    setSelectedBtns({});
    setHasListened(false);
    setFirstAudioStarted(false);
    setHasFinishedFirstListen(false);
    setShowResults(false);
    setPendingAutoPlay(true);
  }, [questionIndex, totalQuestions, score, config.id, saveMcqScore]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (!selectedWord && quizItems.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar" ? "هذا الدرس لا يحتوي على عناصر كافية للاختبار" : "This lesson doesn't have enough items for the quiz"}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h2 className="text-2xl font-bold">{language === "ar" ? "أحسنت!" : "Well done!"}</h2>
        <p className="text-5xl font-bold text-primary">{score} / {totalQuestions}</p>
        <p className="text-muted-foreground">{language === "ar" ? "لقد أكملت الاختبار" : "You completed the quiz"}</p>
        <Button onClick={() => { setQuestionOrder(shuffleArray(Array.from({ length: quizItems.length }, (_, i) => i))); setQuestionIndex(0); setScore(0); setFinished(false); setAttempts(0); setAnsweredCorrectly(false); setSelectedBtns({}); setHasListened(false); setFirstAudioStarted(false); setHasFinishedFirstListen(false); }}>
          {language === "ar" ? "إعادة" : "Try Again"}
        </Button>
      </div>
    );
  }

  const isLetterQuiz = currentItem?.type === "letter";

  const attempted = questionIndex + (answeredCorrectly ? 1 : 0);
  const progressPct = totalQuestions > 0 ? Math.round((attempted / totalQuestions) * 100) : 0;
  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;

  const handleReset = () => {
    setQuestionOrder(shuffleArray(Array.from({ length: quizItems.length }, (_, i) => i)));
    setQuestionIndex(0);
    setScore(0);
    setFinished(false);
    setAttempts(0);
    setAnsweredCorrectly(false);
    setSelectedBtns({});
    setHasListened(false);
    setFirstAudioStarted(false);
    setHasFinishedFirstListen(false);
    setShowResults(false);
    setPendingAutoPlay(true);
  };

  return (
    <div className="flex flex-1 items-start justify-center p-6">
    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      {/* Session tracking panel */}
      <div className="rounded-[1.125rem] border border-border bg-card px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium">
            {language === "ar" ? "تقدّم الجلسة" : "Session progress"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {language === "ar"
                ? `${attempted} من ${totalQuestions} كلمات مجرّبة`
                : `${attempted} of ${totalQuestions} words attempted`}
            </span>
            <span className="rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-primary">
              {language === "ar" ? "النتيجة:" : "Score:"} {score} / {attempted || 0}
            </span>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {attempted > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "ar" ? "الدقّة:" : "Accuracy:"} {accuracy}%
          </p>
        )}
      </div>

      <div className="rounded-[1.125rem] border border-border bg-card p-6 sm:p-8">
        <h2 className="mb-2 text-center text-lg font-semibold">
          {language === "ar"
            ? isLetterQuiz ? "اختر الحرف الذي تسمعه" : "اختر الكلمة التي تسمعها"
            : isLetterQuiz ? "Choose the letter you hear" : "Choose the word you hear"}
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {language === "ar"
            ? "اضغط زر الصوت 🔊 للاستماع، ثم اضغط على الكلمة الصحيحة من بين الخيارات الأربعة."
            : "Press the 🔊 sound button to listen, then press the correct word from the four options."}
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
            onClick={answeredCorrectly ? handleNext : undefined}
            disabled={!answeredCorrectly}
          >
            ⬅ {language === "ar" ? "الكلمة التالية" : "Next word"}
          </Button>
        </div>

        {/* 2x2 grid — hidden only on first question until its dictation ends; always visible for subsequent questions */}
        {(questionIndex > 0 || hasFinishedFirstListen) && <div className="grid grid-cols-2 gap-3">
          {options.map((opt, idx) => {
            const state = selectedBtns[idx];
            return (
              <button
                key={`${questionIndex}-${idx}`}
                onClick={() => handleChoice(idx, opt)}
                disabled={isPlaying || answeredCorrectly || state === "incorrect"}
                className={cn(
                  "h-auto rounded-[1.125rem] border border-border bg-card p-6 font-uthmani transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                  isLetterQuiz ? "text-[3.5rem] leading-[2]" : "text-[2.4rem] leading-[2.3]",
                  state === "correct" && "border-emerald-500 bg-emerald-500/18",
                  state === "incorrect" && "border-red-500 bg-red-500/16",
                  !state && "hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-px",
                )}
                dir="rtl"
              >
                {opt}
              </button>
            );
          })}
        </div>}

        {/* Feedback / status — matches reference mcqHeardFirstPlayback gate messages */}
        <p className={cn(
          "mt-4 min-h-5 text-center text-sm",
          answeredCorrectly && attempts === 0 ? "text-emerald-500"
            : attempts > 0 ? "text-red-500"
            : "text-muted-foreground",
        )}>
          {!hasListened && !answeredCorrectly && (language === "ar" ? "استمع إلى الكلمة أولًا." : "Listen to the word first.")}
          {hasListened && !answeredCorrectly && (language === "ar" ? "يمكنك الآن اختيار الإجابة." : "You can answer now.")}
          {answeredCorrectly && attempts === 0 && (language === "ar" ? "صحيح!" : "Correct!")}
          {answeredCorrectly && attempts >= 1 && (language === "ar" ? "أُظهرت الإجابة الصحيحة. يمكنك المتابعة أو عرض النتائج." : "The correct answer is shown. You can continue or view results.")}
        </p>
      </div>

      {/* Action row at the bottom — matches reference session-action-row placement */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" className="gap-2 rounded-full cursor-pointer" onClick={() => setShowResults((s) => !s)}>
          {language === "ar" ? "📊 عرض النتائج" : "📊 View Results"}
        </Button>
        <Button variant="outline" className="gap-2 rounded-full cursor-pointer" onClick={handleReset}>
          {language === "ar" ? "↻ إعادة الجلسة" : "↻ Restart Session"}
        </Button>
      </div>

      {/* Detailed results panel — toggled by View Results, lives at the bottom under the action row */}
      {showResults && (
        <div className="rounded-[1.125rem] border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {language === "ar" ? "ملخّص الجلسة" : "Session Summary"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {attempted === 0
                  ? language === "ar"
                    ? "لم يبدأ الطالب جلسة الاستماع بعد. يمكنه تجربة أي عدد من الكلمات وفتح النتائج في أي وقت."
                    : "The student has not started the Listening session yet. They can try any number of words and open results at any time."
                  : language === "ar"
                    ? `في جلسة الاستماع، حاول الطالب ${attempted} كلمة وأجاب بشكل صحيح على ${score} منها. لقد غطّى ${attempted} من أصل ${totalQuestions} كلمة متاحة في هذا الدرس، وتبقّى ${totalQuestions - attempted} كلمة لم يجرّبها بعد. الدقة الحالية: ${accuracy}%.`
                    : `In the Listening session, the student attempted ${attempted} word${attempted !== 1 ? "s" : ""} and answered ${score} correctly. They covered ${attempted} out of ${totalQuestions} available words in this lesson, with ${totalQuestions - attempted} still untouched. Current accuracy is ${accuracy}%.`}
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
    </div>
    </div>
  );
}
