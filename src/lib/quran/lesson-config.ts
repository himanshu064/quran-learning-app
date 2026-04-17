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
    labelAr: "الدرس ٢ — أشكال الحروف في الكلمة",
    labelEn: "Lesson 2 — Letter Forms in the Word",
    type: "word",
  },
  {
    id: "lesson3",
    file: "/data/lessons/lesson03_letters_with_fatha.json",
    labelAr: "الدرس ٣ — الحروف المفتوحة",
    labelEn: "Lesson 3 — Open Letters (Fatha)",
    type: "word",
  },
  {
    id: "lesson4",
    file: "/data/lessons/lesson04_letters_with_fatha_and_kasra.json",
    labelAr: "الدرس ٤ — الحروف المفتوحة والمكسورة",
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
    labelAr: "الدرس ٦ — المد بالألف",
    labelEn: "Lesson 6 — Extension with Alef",
    type: "word",
  },
  {
    id: "lesson7",
    file: "/data/lessons/lesson07_extended_kisra.json",
    labelAr: "الدرس ٧ — المد بالياء",
    labelEn: "Lesson 7 — Extension with Yaa",
    type: "word",
  },
  {
    id: "lesson8",
    file: "/data/lessons/lesson08_extended_damma.json",
    labelAr: "الدرس ٨ — المد بالواو",
    labelEn: "Lesson 8 — Extension with Waw",
    type: "word",
  },
  {
    id: "lesson9",
    file: "/data/lessons/lesson09_extended_fatha_damma.json",
    labelAr: "الدرس ٩ — المد بالألف والواو",
    labelEn: "Lesson 9 — Alif + Waw Extension",
    type: "word",
  },
  {
    id: "lesson10",
    file: "/data/lessons/lesson10_extended_fatha_kisra.json",
    labelAr: "الدرس ١٠ — المد بالألف والياء",
    labelEn: "Lesson 10 — Alif + Yaa Extension",
    type: "word",
  },
  {
    id: "lesson11",
    file: "/data/lessons/lesson11_mwma.json",
    labelAr: "الدرس ١١ — المد بالواو والألف",
    labelEn: "Lesson 11 — Waw + Alif Extension",
    type: "word",
  },
  {
    id: "lesson12",
    file: "/data/lessons/lesson12_mwmy.json",
    labelAr: "الدرس ١٢ — مد الواو والياء",
    labelEn: "Lesson 12 — Waw + Yaa Extension",
    type: "word",
  },
  {
    id: "lesson13",
    file: "/data/lessons/lesson13_myma.json",
    labelAr: "الدرس ١٣ — مد الياء والألف",
    labelEn: "Lesson 13 — Yaa + Alif Extension",
    type: "word",
  },
  {
    id: "lesson14",
    file: "/data/lessons/lesson14_mymw.json",
    labelAr: "الدرس ١٤ — مد الياء والواو",
    labelEn: "Lesson 14 — Yaa + Waw Extension",
    type: "word",
  },
  {
    id: "lesson15",
    file: "/data/lessons/lesson15_sukun_part_1.json",
    labelAr: "الدرس ١٥ — السكون الجزء الأول",
    labelEn: "Lesson 15 — Sukun Part 1",
    type: "word",
  },
  {
    id: "lesson16",
    file: "/data/lessons/lesson16_sukun_part_2.json",
    labelAr: "الدرس ١٦ — السكون الجزء الثاني",
    labelEn: "Lesson 16 — Sukun Part 2",
    type: "word",
  },
  {
    id: "lesson17",
    file: "/data/lessons/lesson17_sukun_part_3.json",
    labelAr: "الدرس ١٧ — السكون الجزء الثالث",
    labelEn: "Lesson 17 — Sukun Part 3",
    type: "word",
  },
  {
    id: "lesson18",
    file: "/data/lessons/lesson18_tanwin_fatha.json",
    labelAr: "الدرس ١٨ — تنوين الفتح",
    labelEn: "Lesson 18 — Tanwin Fatha",
    type: "word",
  },
  {
    id: "lesson19",
    file: "/data/lessons/lesson19_tanwin_kisrah.json",
    labelAr: "الدرس ١٩ — تنوين الكسر",
    labelEn: "Lesson 19 — Tanwin Kasra",
    type: "word",
  },
  {
    id: "lesson20",
    file: "/data/lessons/lesson20_tanwin_damm.json",
    labelAr: "الدرس ٢٠ — تنوين الضم",
    labelEn: "Lesson 20 — Tanwin Damma",
    type: "word",
  },
  {
    id: "lesson21",
    file: "/data/lessons/lesson21_tanwin_all.json",
    labelAr: "الدرس ٢١ — تمارين التنوين",
    labelEn: "Lesson 21 — Tanwin Exercises",
    type: "word",
  },
  {
    id: "lesson22",
    file: "/data/lessons/lesson22_hamza.json",
    labelAr: "الدرس ٢٢ — الهمزة",
    labelEn: "Lesson 22 — Hamza",
    type: "word",
  },
  {
    id: "lesson23",
    file: "/data/lessons/lesson23_shad_fatha_best.json",
    labelAr: "الدرس ٢٣ — الشدة مع الفتحة",
    labelEn: "Lesson 23 — Shadda + Fatha",
    type: "word",
  },
  {
    id: "lesson24",
    file: "/data/lessons/lesson24_shad_kisra.json",
    labelAr: "الدرس ٢٤ — الشدة مع الكسرة",
    labelEn: "Lesson 24 — Shadda + Kasra",
    type: "word",
  },
  {
    id: "lesson25",
    file: "/data/lessons/lesson25_shad_damma.json",
    labelAr: "الدرس ٢٥ — الشدة مع الضمة",
    labelEn: "Lesson 25 — Shadda + Damma",
    type: "word",
  },
  {
    id: "lesson26",
    file: "/data/lessons/lesson26_shad_exercises.json",
    labelAr: "الدرس ٢٦ — تمارين الشدة",
    labelEn: "Lesson 26 — Shadda Exercises",
    type: "word",
  },
  {
    id: "lesson27",
    file: "/data/lessons/lesson27_moon_letters.json",
    labelAr: "الدرس ٢٧ — اللام القمرية",
    labelEn: "Lesson 27 — Moon Letters",
    type: "word",
  },
  {
    id: "lesson28",
    file: "/data/lessons/lesson28_moon_letters_practice.json",
    labelAr: "الدرس ٢٨ — تمارين اللام القمرية",
    labelEn: "Lesson 28 — Moon Letters Practice",
    type: "word",
  },
  {
    id: "lesson29",
    file: "/data/lessons/lesson29_sun_letters.json",
    labelAr: "الدرس ٢٩ — اللام الشمسية",
    labelEn: "Lesson 29 — Sun Letters",
    type: "word",
  },
  {
    id: "lesson30",
    file: "/data/lessons/lesson30_sun_letters_practice.json",
    labelAr: "الدرس ٣٠ — تمارين اللام الشمسية",
    labelEn: "Lesson 30 — Sun Letters Practice",
    type: "word",
  },
  {
    id: "lesson31",
    file: "/data/lessons/lesson31_quran_initials.json",
    labelAr: "الدرس ٣١ — الحروف المقطعة",
    labelEn: "Lesson 31 — Quran Initials",
    type: "word",
  },
  {
    id: "lesson32",
    file: "",
    labelAr: "الدرس ٣٢",
    labelEn: "Lesson 32",
    type: "word",
  },
  {
    id: "lesson33",
    file: "",
    labelAr: "الدرس ٣٣",
    labelEn: "Lesson 33",
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
 * Lesson 1 (Arabic Alphabet) — Letters grid + Word (called "Letter") tabs only.
 * Lesson 2 (Letter Forms) — Surahs / Verse / Word / Letters tabs enabled.
 * Lesson 3+ (word lessons) — All tabs except Letters.
 */
export function isLetterLesson(lessonId: string): boolean {
  return lessonId === "lesson1" || lessonId === "lesson2";
}
