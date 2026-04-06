"use client";

import { Volume2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudioContext } from "@/providers";
import { useLanguage } from "@/providers";
import type { WordSlide } from "@/types";

export function WordDisplay({
  slide,
  className,
}: {
  slide: WordSlide;
  className?: string;
}) {
  const { mode, isPlaying, currentWordIndex, playWordAudio, playVerseAudio } =
    useAudioContext();
  const { language } = useLanguage();

  const isHighlighted = isPlaying && currentWordIndex === slide.wordIndex;

  const handlePlay = () => {
    if (mode === "verse") {
      playVerseAudio(slide.surah, slide.ayah);
    } else {
      playWordAudio(slide.surah, slide.ayah, slide.wordIndex);
    }
  };

  return (
    <div
      className={cn(
        "group cursor-pointer select-none rounded-2xl border bg-card p-8 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        isHighlighted &&
          "border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.15)]",
        className,
      )}
      onClick={handlePlay}
    >
      {/* Word with glow */}
      <div className="relative mx-auto mb-6 flex min-h-32 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl transition-colors",
            isHighlighted ? "bg-emerald-500/15" : "bg-primary/5",
          )}
        />
        <span
          className={cn(
            "relative font-uthmani text-6xl leading-relaxed transition-all duration-300 sm:text-7xl",
            isHighlighted
              ? "scale-110 text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.4)]"
              : "transition-transform group-hover:scale-105",
          )}
          dir="rtl"
        >
          {slide.word}
        </span>
      </div>

      {/* Source reference */}
      <Badge variant="secondary" className="gap-1.5">
        <BookOpen className="h-3 w-3" />
        {language === "ar"
          ? `سورة ${slide.surah} · آية ${slide.ayah}`
          : `Surah ${slide.surah} · Ayah ${slide.ayah}`}
      </Badge>

      {/* Frequency */}
      {slide.count > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {language === "ar"
            ? `في القرآن: ${slide.count} مرة`
            : `In the Quran: ${slide.count} times`}
        </p>
      )}

      {/* Letter form info (for lesson 2) */}
      {slide.letter && slide.formShape && (
        <div className="mt-3 flex items-center justify-center gap-3 rounded-lg bg-muted/50 px-4 py-2">
          <span className="font-uthmani text-2xl" dir="rtl">
            {slide.formShape}
          </span>
          <span className="text-sm text-muted-foreground capitalize">
            {slide.positionEn}
          </span>
        </div>
      )}

      {/* Moon/Sun letter info (for lesson 16) */}
      {slide.moonSunType && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5",
              slide.moonSunType === "moon"
                ? "border-blue-500/30 bg-blue-500/10"
                : "border-amber-500/30 bg-amber-500/10",
            )}
          >
            <span className="text-lg">
              {slide.moonSunType === "moon" ? "🌙" : "☀️"}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                slide.moonSunType === "moon"
                  ? "text-blue-400"
                  : "text-amber-400",
              )}
            >
              {language === "ar"
                ? slide.moonSunType === "moon"
                  ? "حرف قمري"
                  : "حرف شمسي"
                : slide.moonSunType === "moon"
                  ? "Moon Letter"
                  : "Sun Letter"}
            </span>
          </div>
          {slide.displayLetter && (
            <p className="text-sm text-muted-foreground">
              {language === "ar"
                ? `الحرف: ${slide.displayLetter}`
                : `Letter: ${slide.displayLetter}`}
            </p>
          )}
        </div>
      )}

      {/* Play button */}
      <Button
        variant={isHighlighted ? "default" : "outline"}
        size="lg"
        className={cn(
          "mt-6 gap-2 rounded-full cursor-pointer",
          isHighlighted && "bg-emerald-500 hover:bg-emerald-600",
        )}
        onClick={(e) => {
          e.stopPropagation();
          handlePlay();
        }}
      >
        <Volume2 className={cn("h-5 w-5", isHighlighted && "animate-pulse")} />
        {isHighlighted
          ? language === "ar"
            ? "يعمل..."
            : "Playing..."
          : language === "ar"
            ? "تشغيل"
            : "Play"}
      </Button>
    </div>
  );
}
