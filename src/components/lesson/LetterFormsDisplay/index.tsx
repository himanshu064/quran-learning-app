"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudioContext } from "@/providers";
import { useLanguage } from "@/providers";
import type { LetterFormSlide } from "@/types";

export function LetterFormsDisplay({
  slide,
  className,
}: {
  slide: LetterFormSlide;
  className?: string;
}) {
  const { playWordAudio, isPlaying, currentWordIndex } = useAudioContext();
  const { language } = useLanguage();

  const forms = [
    { label: language === "ar" ? "منفصل" : "Isolated", value: slide.forms.isolated },
    { label: language === "ar" ? "أول" : "Initial", value: slide.forms.initial },
    { label: language === "ar" ? "وسط" : "Medial", value: slide.forms.medial },
    { label: language === "ar" ? "آخر" : "Final", value: slide.forms.final },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-6 p-6 sm:p-8">
        {/* Large glyph + name */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-uthmani text-7xl leading-none sm:text-8xl" dir="rtl">
            {slide.glyph}
          </span>
          <div>
            <p className="text-lg font-semibold" dir="rtl">{slide.nameAr}</p>
            <p className="text-sm text-muted-foreground">{slide.nameEn}</p>
          </div>
        </div>

        {/* 4 contextual forms */}
        <div className="grid grid-cols-4 gap-3">
          {forms.map((form) => (
            <div
              key={form.label}
              className="flex flex-col items-center gap-1 rounded-lg border p-3"
            >
              <span className="font-uthmani text-3xl" dir="rtl">
                {form.value}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {form.label}
              </span>
            </div>
          ))}
        </div>

        {/* Makhraj */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            {language === "ar" ? "مخرج الحرف" : "Articulation Point"}
          </p>
          <p className="text-sm" dir="rtl">
            {language === "ar"
              ? slide.makhrajDescriptionAr
              : slide.makhrajDescriptionEn}
          </p>
        </div>

        {/* Example words */}
        {slide.exampleWords.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              {language === "ar" ? "أمثلة من القرآن" : "Examples from Quran"}
            </p>
            <div className="flex flex-wrap gap-2">
              {slide.exampleWords.map((ex, i) => {
                const isActive =
                  isPlaying && currentWordIndex === ex.wordIndex;
                return (
                  <button
                    key={i}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-start transition-all duration-200 hover:bg-muted/50 cursor-pointer",
                      isActive &&
                        "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
                    )}
                    onClick={() =>
                      playWordAudio(ex.surah, ex.ayah, ex.wordIndex)
                    }
                  >
                    <span
                      className={cn(
                        "font-uthmani text-lg transition-colors",
                        isActive && "text-emerald-400",
                      )}
                      dir="rtl"
                    >
                      {ex.text}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {ex.surah}:{ex.ayah}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {slide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {slide.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
