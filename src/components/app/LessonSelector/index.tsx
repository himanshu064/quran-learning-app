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

export function LessonSelector() {
  const { lessonId, setLesson } = useLessonContext();
  const { language } = useLanguage();
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
