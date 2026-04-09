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

export function LessonSelector({ activeTab: _activeTab }: { activeTab?: TabKey } = {}) {
  void _activeTab;
  const { lessonId, setLesson } = useLessonContext();
  const { language } = useLanguage();
  // Always show every lesson — tabs get enabled/disabled based on the
  // selected lesson, not the other way around.
  const lessons = getAvailableLessons();

  return (
    <Select value={lessonId} onValueChange={setLesson}>
      <SelectTrigger className="h-8 w-auto max-w-48 rounded-full border-border px-3 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {lessons.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {language === "ar" ? l.labelAr : l.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
