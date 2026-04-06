"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  wbwUrl,
  verseUrl,
  letterAudioUrl,
  getWordTimings,
  getActiveWordIndex,
  generateFallbackTimings,
} from "@/lib/quran";
import type { WordTiming } from "@/lib/quran";

export type AudioMode = "wbw" | "verse";

export type VerseSpec = { surah: number; ayah: number; wordCount: number };

type AudioContextValue = {
  mode: AudioMode;
  setMode: (mode: AudioMode) => void;
  isPlaying: boolean;
  currentWordIndex: number;
  currentAyah: number;
  play: () => void;
  pause: () => void;
  replay: () => void;
  stop: () => void;
  playLetterAudio: (audioPath: string) => void;
  playWordAudio: (surah: number, ayah: number, wordIndex: number) => void;
  playVerseAudio: (surah: number, ayah: number, wordCount?: number) => void;
  playVerseSequence: (verses: VerseSpec[]) => void;
  playWbwSequence: (verses: VerseSpec[]) => void;
  playUrl: (url: string) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AudioMode>("wbw");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentAyah, setCurrentAyah] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timingsRef = useRef<WordTiming[]>([]);
  const sequenceRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Ensure we have a single audio element
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  // Stop any ongoing highlighting loop
  const stopHighlighting = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setCurrentWordIndex(-1);
    timingsRef.current = [];
  }, []);

  // Core stop
  const stop = useCallback(() => {
    sequenceRef.current.cancelled = true;
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    setIsPlaying(false);
    setCurrentAyah(-1);
    stopHighlighting();
  }, [getAudio, stopHighlighting]);

  // Play a URL (lowest level) — cancels any active sequence unless called from within one
  const playUrl = useCallback(
    (url: string) => {
      const audio = getAudio();
      audio.pause();
      stopHighlighting();
      audio.src = url;
      audio.play().catch(() => {});
      setIsPlaying(true);
    },
    [getAudio, stopHighlighting],
  );

  // Play/pause/replay controls
  const play = useCallback(() => {
    const audio = getAudio();
    if (audio.src) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [getAudio]);

  const pause = useCallback(() => {
    getAudio().pause();
    setIsPlaying(false);
  }, [getAudio]);

  const replay = useCallback(() => {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, [getAudio]);

  // Letter audio
  const playLetterAudio = useCallback(
    (audioPath: string) => {
      sequenceRef.current.cancelled = true;
      playUrl(letterAudioUrl(audioPath));
    },
    [playUrl],
  );

  // Word-by-word audio (single word, not part of a sequence)
  const playWordAudio = useCallback(
    (surah: number, ayah: number, wordIndex: number) => {
      sequenceRef.current.cancelled = true;
      playUrl(wbwUrl(surah, ayah, wordIndex));
      // Set after playUrl since playUrl calls stopHighlighting which resets these
      setCurrentAyah(ayah);
      setCurrentWordIndex(wordIndex);
    },
    [playUrl],
  );

  // Verse audio with word highlighting
  const playVerseAudio = useCallback(
    async (surah: number, ayah: number, wordCount?: number) => {
      const audio = getAudio();
      audio.pause();
      stopHighlighting();

      // Load timing data
      let timings = await getWordTimings(surah, ayah);
      timingsRef.current = timings;

      // Play the verse
      const url = verseUrl(surah, ayah);
      audio.src = url;
      audio.play().catch(() => {});
      setIsPlaying(true);

      // Start highlighting loop
      const tick = () => {
        if (audio.paused || audio.ended) return;
        const currentMs = audio.currentTime * 1000;

        let activeTimings = timingsRef.current;

        // Generate fallback timings on first tick if none loaded and we have duration
        if (activeTimings.length === 0 && wordCount && audio.duration > 0) {
          activeTimings = generateFallbackTimings(wordCount, audio.duration * 1000);
          timingsRef.current = activeTimings;
        }

        if (activeTimings.length > 0) {
          const idx = getActiveWordIndex(activeTimings, currentMs);
          setCurrentWordIndex(idx);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      // Wait for audio to start playing before beginning the highlight loop
      audio.addEventListener("playing", () => {
        rafRef.current = requestAnimationFrame(tick);
      }, { once: true });
    },
    [getAudio, stopHighlighting],
  );

  // Helper: wait for audio to finish playing
  const waitForEnded = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const audio = getAudio();
        audio.addEventListener("ended", () => resolve(), { once: true });
      }),
    [getAudio],
  );

  // Play a sequence of verses one after another (Full Verse mode)
  const playVerseSequence = useCallback(
    async (verses: VerseSpec[]) => {
      if (verses.length === 0) return;
      const token = { cancelled: false };
      sequenceRef.current.cancelled = true; // cancel any previous sequence
      sequenceRef.current = token;

      for (const v of verses) {
        if (token.cancelled) return;
        setCurrentAyah(v.ayah);
        await playVerseAudio(v.surah, v.ayah, v.wordCount);
        await waitForEnded();
      }
      if (!token.cancelled) {
        setIsPlaying(false);
        setCurrentAyah(-1);
        stopHighlighting();
      }
    },
    [playVerseAudio, waitForEnded, stopHighlighting],
  );

  // Play word-by-word across multiple verses sequentially
  const playWbwSequence = useCallback(
    async (verses: VerseSpec[]) => {
      if (verses.length === 0) return;
      const token = { cancelled: false };
      sequenceRef.current.cancelled = true;
      sequenceRef.current = token;

      for (const v of verses) {
        for (let w = 1; w <= v.wordCount; w++) {
          if (token.cancelled) return;
          playUrl(wbwUrl(v.surah, v.ayah, w));
          // Set after playUrl since playUrl calls stopHighlighting which resets these
          setCurrentAyah(v.ayah);
          setCurrentWordIndex(w);
          await waitForEnded();
        }
      }
      if (!token.cancelled) {
        setIsPlaying(false);
        setCurrentAyah(-1);
        stopHighlighting();
      }
    },
    [playUrl, waitForEnded, stopHighlighting],
  );

  // Handle audio ended — only reset state if no active sequence
  useEffect(() => {
    const audio = getAudio();
    const onEnded = () => {
      // If a sequence is actively playing (not cancelled), let it drive state
      if (!sequenceRef.current.cancelled) return;
      setIsPlaying(false);
      setCurrentAyah(-1);
      stopHighlighting();
    };
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [getAudio, stopHighlighting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      mode,
      setMode,
      isPlaying,
      currentWordIndex,
      currentAyah,
      play,
      pause,
      replay,
      stop,
      playLetterAudio,
      playWordAudio,
      playVerseAudio,
      playVerseSequence,
      playWbwSequence,
      playUrl,
    }),
    [
      mode,
      isPlaying,
      currentWordIndex,
      currentAyah,
      play,
      pause,
      replay,
      stop,
      playLetterAudio,
      playWordAudio,
      playVerseAudio,
      playVerseSequence,
      playWbwSequence,
      playUrl,
    ],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudioContext() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudioContext must be used within an AudioProvider");
  }
  return ctx;
}
