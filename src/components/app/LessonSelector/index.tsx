"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLessonContext } from "@/providers";
import { useLanguage } from "@/providers";
import { getAvailableLessons } from "@/lib/quran";
import type { TabKey } from "@/components/app/PillTabNav";

export function LessonSelector({
  activeTab: _activeTab,
}: { activeTab?: TabKey } = {}) {
  void _activeTab;
  const { lessonId, setLesson } = useLessonContext();
  const { language } = useLanguage();
  // Always show every lesson — tabs get enabled/disabled based on the
  // selected lesson, not the other way around.
  const lessons = getAvailableLessons();

  // Show only the short lesson number part (before em-dash) to match client
  const shortLabel = (l: { labelAr: string; labelEn: string }) =>
    (language === "ar" ? l.labelAr : l.labelEn).split("—")[0].trim();

  const current = lessons.find((l) => l.id === lessonId);

  return (
    <Select value={lessonId} onValueChange={setLesson}>
      <SelectTrigger className="h-8 w-auto max-w-64 rounded-full border-border px-3 text-xs cursor-pointer">
        <SelectValue>{current ? shortLabel(current) : ""}</SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        style={{ maxHeight: "20rem" }}
      >
        {lessons.map((l) => (
          <SelectItem key={l.id} value={l.id} className="cursor-pointer">
            {shortLabel(l)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
