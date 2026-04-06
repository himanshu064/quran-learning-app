"use client";

import { useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioContext } from "@/providers";
import { useLanguage } from "@/providers";

export function AudioPlayerControls({
  className,
  onPlay,
}: {
  className?: string;
  onPlay?: () => void;
}) {
  const { mode, setMode, isPlaying, play, pause, replay } = useAudioContext();
  const { language } = useLanguage();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (onPlay) {
      onPlay();
    } else {
      play();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Mode toggle */}
      <div className="inline-flex rounded-full border p-1">
        <ModeButton
          active={mode === "wbw"}
          onClick={() => setMode("wbw")}
          label={language === "ar" ? "كلمة بكلمة" : "Word by Word"}
        />
        <ModeButton
          active={mode === "verse"}
          onClick={() => setMode("verse")}
          label={language === "ar" ? "الآية كاملة" : "Full Verse"}
        />
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={replay}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-muted cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={handlePlayPause}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all cursor-pointer",
            isPlaying
              ? "bg-muted-foreground text-background hover:bg-muted-foreground/80"
              : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25",
          )}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ms-0.5" />
          )}
        </button>

        {/* Pulsing status */}
        {isPlaying && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-500">
              {language === "ar" ? "يعمل" : "Playing"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium transition-all cursor-pointer",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
