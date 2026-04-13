export type LessonType = "letter" | "letter-forms" | "word";

export type LessonConfig = {
  id: string;
  file: string;
  labelAr: string;
  labelEn: string;
  type: LessonType;
};

export const LESSON_CONFIG: LessonConfig[] = [
  {
    id: "lesson1",
    file: "/data/lessons/lesson01_arabic_alphabet.json",
    labelAr: "الدرس ١ — الحروف الهجائية",
    labelEn: "Lesson 1 — Arabic Alphabet",
    type: "letter",
  },
  {
    id: "lesson2",
    file: "/data/lessons/lesson02_letter_forms_in_the_word.json",
    labelAr: "الدرس ٢ — أشكال الحروف",
    labelEn: "Lesson 2 — Letter Forms",
    type: "word",
  },
  {
    id: "lesson3",
    file: "/data/lessons/lesson03_letters_with_fatha.json",
    labelAr: "الدرس ٣ — الحروف المفتوحة",
    labelEn: "Lesson 3 — Fatha",
    type: "word",
  },
  {
    id: "lesson4",
    file: "/data/lessons/lesson04_letters_with_fatha_and_kasra.json",
    labelAr: "الدرس ٤ — المفتوحة والمكسورة",
    labelEn: "Lesson 4 — Fatha + Kasra",
    type: "word",
  },
  {
    id: "lesson5",
    file: "/data/lessons/lesson05_letters_with_fatha_kasra_damma.json",
    labelAr: "الدرس ٥ — المفتوحة والمكسورة والمضمومة",
    labelEn: "Lesson 5 — Fatha + Kasra + Damma",
    type: "word",
  },
  {
    id: "lesson6",
    file: "/data/lessons/lesson06_extended_fatha.json",
    labelAr: "الدرس ٦ — المفتوحة الممدودة",
    labelEn: "Lesson 6 — Extended Fatha",
    type: "word",
  },
  {
    id: "lesson7",
    file: "/data/lessons/lesson07_extended_damma.json",
    labelAr: "الدرس ٧ — المضمومة الممدودة",
    labelEn: "Lesson 7 — Extended Damma",
    type: "word",
  },
  {
    id: "lesson8",
    file: "/data/lessons/lesson08_extended_kisra.json",
    labelAr: "الدرس ٨ — المكسورة الممدودة",
    labelEn: "Lesson 8 — Extended Kasra",
    type: "word",
  },
  {
    id: "lesson9",
    file: "/data/lessons/lesson09_extended_fatha_damma.json",
    labelAr: "الدرس ٩ — مد الألف والواو",
    labelEn: "Lesson 9 — Alif/Waw Extension",
    type: "word",
  },
  {
    id: "lesson10",
    file: "/data/full_practice_lessons/lesson01_full_sharik_words.json",
    labelAr: "الدرس ١٠ — تمرين ١",
    labelEn: "Lesson 10 — Practice Set 1",
    type: "word",
  },
  {
    id: "lesson11",
    file: "/data/full_practice_lessons/lesson02_full_sharik_words.json",
    labelAr: "الدرس ١١ — تمرين ٢",
    labelEn: "Lesson 11 — Practice Set 2",
    type: "word",
  },
  {
    id: "lesson12",
    file: "",
    labelAr: "الدرس ١٢",
    labelEn: "Lesson 12",
    type: "word",
  },
  {
    id: "lesson13",
    file: "",
    labelAr: "الدرس ١٣",
    labelEn: "Lesson 13",
    type: "word",
  },
  {
    id: "lesson14",
    file: "",
    labelAr: "الدرس ١٤",
    labelEn: "Lesson 14",
    type: "word",
  },
  {
    id: "lesson15",
    file: "",
    labelAr: "الدرس ١٥",
    labelEn: "Lesson 15",
    type: "word",
  },
  {
    id: "lesson16",
    file: "/data/lessons/lesson16_moon_sun_letters.json",
    labelAr: "الدرس ١٦ — حروف القمر والشمس",
    labelEn: "Lesson 16 — Moon & Sun Letters",
    type: "word",
  },
];

export function getLessonConfig(id: string): LessonConfig | undefined {
  return LESSON_CONFIG.find((l) => l.id === id);
}

export function getAvailableLessons(): LessonConfig[] {
  return LESSON_CONFIG.filter((l) => l.file !== "");
}

/**
 * Lessons 1 & 2 are alphabet lessons that live under the Letters tab.
 * They disable Surahs / Verse / Word and only allow Letters / Choose / Write.
 */
export function isLetterLesson(lessonId: string): boolean {
  return lessonId === "lesson1" || lessonId === "lesson2";
}
