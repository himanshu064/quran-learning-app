"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Volume2, ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/lesson";
import { useLanguage, useLessonContext, useAudioContext } from "@/providers";
import { useProgress } from "@/hooks";
import {
  praiseAudioUrl,
  retryAudioUrl,
  revealAudioUrl,
  listeningInstructionUrl,
} from "@/lib/quran";
import type { WordSlide } from "@/types";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

export function McqScreen() {
  const { language } = useLanguage();
  const { slides, isLoading, config } = useLessonContext();
  const { playWordAudio, playUrl, isPlaying } = useAudioContext();
  const { saveMcqScore, saveProgress, saveLastLesson } = useProgress();

  // Stable refs to avoid re-render loops from progress query invalidation
  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;
  const saveLastLessonRef = useRef(saveLastLesson);
  saveLastLessonRef.current = saveLastLesson;

  const [hasListened, setHasListened] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [selectedBtns, setSelectedBtns] = useState<
    Record<number, "correct" | "incorrect">
  >({});
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const instructionPlayed = useRef(false);

  const wordSlides = useMemo(
    () => slides.filter((s): s is WordSlide => s.type === "word"),
    [slides],
  );
  const totalQuestions = wordSlides.length;
  const currentWord = wordSlides[questionIndex];

  // Track progress on question change
  useEffect(() => {
    if (totalQuestions > 0) {
      saveProgressRef.current({ lessonId: config.id, slideIndex: questionIndex });
      saveLastLessonRef.current(config.id);
    }
  }, [questionIndex, totalQuestions, config.id]);

  // 4 options: 1 correct + 3 distractors
  const options = useMemo(() => {
    if (!currentWord || wordSlides.length < 4) return [];
    const others = wordSlides.filter((_, i) => i !== questionIndex);
    const uniqueWords = Array.from(new Set(others.map((w) => w.word))).filter(
      (w) => w !== currentWord.word,
    );
    const distractors = shuffleArray(uniqueWords).slice(0, 3);
    return shuffleArray([currentWord.word, ...distractors]);
  }, [currentWord, questionIndex, wordSlides]);

  // Play instruction every time the module is visited
  useEffect(() => {
    if (!instructionPlayed.current) {
      playUrl(listeningInstructionUrl());
      instructionPlayed.current = true;
    }
  }, [playUrl]);

  const playCurrentWord = useCallback(() => {
    if (currentWord) {
      playWordAudio(currentWord.surah, currentWord.ayah, currentWord.wordIndex);
      setHasListened(true);
    }
  }, [currentWord, playWordAudio]);

  const handleChoice = useCallback(
    (idx: number, chosenText: string) => {
      if (answeredCorrectly) return;

      if (chosenText === currentWord.word) {
        // Correct
        setAnsweredCorrectly(true);
        setSelectedBtns((prev) => ({ ...prev, [idx]: "correct" }));
        setScore((s) => s + 1);
        playUrl(praiseAudioUrl());
        fireConfetti();
      } else {
        // Incorrect
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setSelectedBtns((prev) => ({ ...prev, [idx]: "incorrect" }));

        if (newAttempts >= 2) {
          // Reveal correct answer
          setAnsweredCorrectly(true);
          const correctIdx = options.findIndex((o) => o === currentWord.word);
          if (correctIdx !== -1) {
            setSelectedBtns((prev) => ({ ...prev, [correctIdx]: "correct" }));
          }
          playUrl(revealAudioUrl());
        } else {
          playUrl(retryAudioUrl());
        }
      }
    },
    [answeredCorrectly, currentWord, attempts, options, playUrl],
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
  }, [questionIndex, totalQuestions, score, config.id, saveMcqScore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (wordSlides.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {language === "ar"
            ? "هذا الدرس لا يحتوي على كلمات كافية للاختبار"
            : "This lesson doesn't have enough words for the quiz"}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h2 className="text-2xl font-bold">
          {language === "ar" ? "أحسنت!" : "Well done!"}
        </h2>
        <p className="text-5xl font-bold text-primary">
          {score} / {totalQuestions}
        </p>
        <p className="text-muted-foreground">
          {language === "ar" ? "لقد أكملت الاختبار" : "You completed the quiz"}
        </p>
        <Button
          onClick={() => {
            setQuestionIndex(0);
            setScore(0);
            setFinished(false);
            setAttempts(0);
            setAnsweredCorrectly(false);
            setSelectedBtns({});
            setHasListened(false);
          }}
        >
          {language === "ar" ? "إعادة" : "Try Again"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <ProgressIndicator
        current={questionIndex}
        total={totalQuestions}
        label={
          language === "ar"
            ? `سؤال ${questionIndex + 1} / ${totalQuestions}`
            : `Question ${questionIndex + 1} / ${totalQuestions}`
        }
        className="w-full max-w-md"
      />

      {/* Listen button */}
      <Button
        size="lg"
        className="gap-2 rounded-full cursor-pointer"
        onClick={playCurrentWord}
      >
        <Volume2 className="h-5 w-5" />
        {language === "ar" ? "استمع للكلمة" : "Listen"}
      </Button>

      {/* 2x2 options grid */}
      <div className="grid w-full max-w-md grid-cols-2 gap-2">
        {options.map((opt, idx) => {
          const state = selectedBtns[idx];
          return (
            <button
              key={`${questionIndex}-${idx}`}
              onClick={() => handleChoice(idx, opt)}
              disabled={!hasListened || isPlaying || answeredCorrectly || state === "incorrect"}
              className={cn(
                "rounded-2xl border p-2 font-uthmani text-[2.4rem] leading-[2.3] transition-all",
                "disabled:cursor-not-allowed",
                state === "correct" &&
                  "border-emerald-500 bg-emerald-500/18 cursor-pointer",
                state === "incorrect" &&
                  "border-red-500 bg-red-500/16 cursor-pointer",
                !state &&
                  "border-border bg-muted hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
              )}
              dir="rtl"
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      <p
        className={cn(
          "min-h-5 text-center text-sm",
          answeredCorrectly && attempts === 0
            ? "text-emerald-500"
            : attempts > 0
              ? "text-red-500"
              : "text-muted-foreground",
        )}
      >
        {answeredCorrectly &&
          attempts === 0 &&
          (language === "ar"
            ? "أحسنت! اخترت الكلمة الصحيحة"
            : "Correct! You chose the right word")}
        {!answeredCorrectly &&
          attempts === 1 &&
          (language === "ar"
            ? "ليست هذه الكلمة، جرّب خيارًا آخر"
            : "Not this word, try another option")}
        {answeredCorrectly &&
          attempts >= 2 &&
          (language === "ar"
            ? "هذا هو الجواب الصحيح"
            : "This is the correct answer")}
      </p>

      {/* Next button */}
      {answeredCorrectly && (
        <Button onClick={handleNext} className="gap-2 cursor-pointer">
          {language === "ar" ? "الكلمة التالية" : "Next Word"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
