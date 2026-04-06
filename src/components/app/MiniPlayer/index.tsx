"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAudioContext } from "@/providers";

export function MiniPlayer() {
  const { isPlaying, play, pause, stop } = useAudioContext();
  const [visible, setVisible] = useState(false);
  const hasEverPlayed = useRef(false);

  // Show once audio starts, stay visible until dismissed
  useEffect(() => {
    if (isPlaying) {
      hasEverPlayed.current = true;
      setVisible(true);
    }
  }, [isPlaying]);

  const handleDismiss = () => {
    stop();
    setVisible(false);
    hasEverPlayed.current = false;
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 flex items-center gap-2 rounded-full border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      {/* Status dot */}
      {isPlaying ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
      )}

      <span className="text-xs font-medium text-muted-foreground">
        {isPlaying ? "Playing" : "Paused"}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-pointer"
        onClick={isPlaying ? pause : play}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ms-0.5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-pointer text-muted-foreground"
        onClick={handleDismiss}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
