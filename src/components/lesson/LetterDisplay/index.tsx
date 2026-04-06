"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAudioContext } from "@/providers";
import { useLanguage } from "@/providers";
import type { LetterSlide } from "@/types";

export function LetterDisplay({
  slide,
  className,
}: {
  slide: LetterSlide;
  className?: string;
}) {
  const { playLetterAudio, isPlaying } = useAudioContext();
  const { language } = useLanguage();

  const handlePlay = () => {
    if (slide.audio) playLetterAudio(slide.audio);
  };

  return (
    <div
      className={cn(
        "group cursor-pointer select-none rounded-2xl border bg-card p-8 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        isPlaying && "border-emerald-500/50 shadow-lg shadow-emerald-500/10",
        className,
      )}
      onClick={handlePlay}
    >
      {/* Glyph with subtle glow */}
      <div className="relative mx-auto mb-6 flex h-40 w-40 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl transition-colors",
            isPlaying ? "bg-emerald-500/15" : "bg-primary/5",
          )}
        />
        <span
          className={cn(
            "relative font-uthmani text-8xl leading-none transition-all sm:text-9xl",
            isPlaying
              ? "scale-105 text-emerald-500"
              : "transition-transform group-hover:scale-105",
          )}
          dir="rtl"
        >
          {slide.glyph}
        </span>
      </div>

      {/* Names */}
      <p className="text-xl font-bold" dir="rtl">
        {slide.name_ar}
      </p>
      <p className="mt-1 text-sm capitalize text-muted-foreground">
        {slide.name_en}
      </p>

      {/* Play button */}
      {slide.audio && (
        <Button
          variant={isPlaying ? "default" : "outline"}
          size="lg"
          className={cn(
            "mt-6 gap-2 rounded-full cursor-pointer",
            isPlaying && "bg-emerald-500 hover:bg-emerald-600",
          )}
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
        >
          <Volume2 className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
          {isPlaying
            ? language === "ar"
              ? "يعمل..."
              : "Playing..."
            : language === "ar"
              ? "تشغيل"
              : "Play"}
        </Button>
      )}
    </div>
  );
}
