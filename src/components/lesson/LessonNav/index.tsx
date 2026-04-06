"use client";

import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers";

export function LessonNav({
  onPrev,
  onNext,
  onShuffle,
  className,
}: {
  onPrev: () => void;
  onNext: () => void;
  onShuffle?: () => void;
  className?: string;
}) {
  const { direction } = useLanguage();

  const PrevIcon = direction === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = direction === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <button
        onClick={onPrev}
        className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-muted cursor-pointer"
      >
        <PrevIcon className="h-5 w-5" />
      </button>

      {onShuffle && (
        <button
          onClick={onShuffle}
          className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-muted cursor-pointer"
        >
          <Shuffle className="h-5 w-5" />
        </button>
      )}

      <button
        onClick={onNext}
        className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-muted cursor-pointer"
      >
        <NextIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
