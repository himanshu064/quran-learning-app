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

  return (
    <Select value={lessonId} onValueChange={setLesson}>
      <SelectTrigger className="h-8 w-auto max-w-64 rounded-full border-border px-3 text-xs cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        style={{ maxHeight: "20rem" }}
      >
        {lessons.map((l) => (
          <SelectItem key={l.id} value={l.id} className="cursor-pointer">
            {language === "ar" ? l.labelAr : l.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
