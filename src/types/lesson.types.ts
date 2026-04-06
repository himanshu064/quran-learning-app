// ---------- Slide Types ----------

export type LetterSlide = {
  type: "letter";
  id: number;
  glyph: string;
  name_ar: string;
  name_en: string;
  audio: string;
};

export type LetterFormSlide = {
  type: "letter-forms";
  id: string;
  glyph: string;
  nameAr: string;
  nameEn: string;
  order: number;
  forms: {
    isolated: string;
    initial: string;
    medial: string;
    final: string;
  };
  makhrajDescriptionAr: string;
  makhrajDescriptionEn: string;
  exampleWords: {
    text: string;
    surah: number;
    ayah: number;
    wordIndex: number;
    position: string;
  }[];
  tags: string[];
  // Word data from lesson file (if available)
  words?: WordSlide[];
};

export type WordSlide = {
  type: "word";
  surah: number;
  ayah: number;
  wordIndex: number;
  word: string;
  count: number;
  // Extra fields from lesson02 (letter forms in word)
  letter?: string;
  positionEn?: string;
  formShape?: string;
  // Extra fields from lesson16 (moon & sun letters)
  moonSunType?: "moon" | "sun";
  baseLetter?: string;
  displayLetter?: string;
};

export type LessonSlide = LetterSlide | LetterFormSlide | WordSlide;

// ---------- JSON Formats (raw from files) ----------

export type RawLetterData = {
  id: number;
  glyph: string;
  name_ar: string;
  name_en: string;
  audio: string;
};

export type RawLetterLesson = {
  letters: RawLetterData[];
};

export type RawWordData = {
  wordIndex: number;
  word: string;
  quranWord?: string;
  count: number;
  letter?: string;
  positionEn?: string;
  formShape?: string;
};

export type RawWordLesson = Record<string, RawWordData[]>;

export type RawEnhancedLetter = {
  id: string;
  glyph: string;
  nameAr: string;
  nameEn: string;
  order: number;
  tags: string[];
  makhrajDescriptionAr: string;
  makhrajDescriptionEn: string;
  forms: {
    isolated: string;
    initial: string;
    medial: string;
    final: string;
  };
  exampleWords: {
    text: string;
    surah: number;
    ayah: number;
    wordIndex: number;
    position: string;
  }[];
};

export type RawEnhancedLettersFile = {
  version: number;
  letters: RawEnhancedLetter[];
};

