"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function ProgressIndicator({
  current,
  total,
  label,
  className,
}: {
  current: number;
  total: number;
  label?: string;
  className?: string;
}) {
  const percentage = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  const defaultLabel = `${current + 1} / ${total}`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label || defaultLabel}</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="h-2.5" />
    </div>
  );
}
