"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioMode = "wbw" | "verse" | null;

export type AudioState = {
  mode: AudioMode;
  isPlaying: boolean;
  isPaused: boolean;
  activeWordIndex: number | null;
};

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    mode: null,
    isPlaying: false,
    isPaused: false,
    activeWordIndex: null,
  });

  // Lazily create the Audio element on the client
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const onEnded = () => {
      setState((s) => ({
        ...s,
        isPlaying: false,
        isPaused: false,
        activeWordIndex: null,
      }));
    };
    const onPause = () => {
      setState((s) => ({ ...s, isPlaying: false, isPaused: true }));
    };
    const onPlay = () => {
      setState((s) => ({ ...s, isPlaying: true, isPaused: false }));
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setState({
      mode: null,
      isPlaying: false,
      isPaused: false,
      activeWordIndex: null,
    });
  }, []);

  /** Play a single URL (letter audio or one-shot word audio) */
  const playSrc = useCallback(async (src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = src;
    setState((s) => ({ ...s, mode: "wbw", activeWordIndex: null }));
    try {
      await audio.play();
    } catch {
      setState((s) => ({ ...s, isPlaying: false }));
    }
  }, []);

  /** Play word-by-word through an array of audio URLs sequentially */
  const playWBW = useCallback(async (urls: string[], startIndex = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();

    setState((s) => ({ ...s, mode: "wbw", isPlaying: true, isPaused: false }));

    for (let i = startIndex; i < urls.length; i++) {
      setState((s) => ({ ...s, activeWordIndex: i }));
      audio.src = urls[i];
      try {
        await audio.play();
        // Wait for this word to finish before playing the next
        await new Promise<void>((resolve, reject) => {
          const onEnd = () => {
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("pause", onAbort);
            resolve();
          };
          const onAbort = () => {
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("pause", onAbort);
            reject();
          };
          audio.addEventListener("ended", onEnd, { once: true });
          audio.addEventListener("pause", onAbort, { once: true });
        });
      } catch {
        // Paused mid-sequence — stop iterating
        break;
      }
    }

    setState((s) => ({
      ...s,
      isPlaying: false,
      isPaused: false,
      activeWordIndex: null,
    }));
  }, []);

  /** Play a full verse audio URL */
  const playVerse = useCallback(async (src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = src;
    setState((s) => ({ ...s, mode: "verse", activeWordIndex: null }));
    try {
      await audio.play();
    } catch {
      setState((s) => ({ ...s, isPlaying: false }));
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    try {
      await audioRef.current?.play();
    } catch {
      // ignore
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else if (state.isPaused) {
      await resume();
    }
  }, [state.isPlaying, state.isPaused, pause, resume]);

  return {
    ...state,
    stop,
    playSrc,
    playWBW,
    playVerse,
    pause,
    resume,
    togglePlayPause,
  };
}
