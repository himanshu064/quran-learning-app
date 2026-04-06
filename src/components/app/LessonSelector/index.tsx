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
      <SelectTrigger className="w-52 sm:w-64">
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
