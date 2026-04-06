/** Raw Quran text: { [surah]: { [ayah]: "text..." } } */
export type QuranMetadata = Record<number, Record<number, string>>;

export type QuranWord = {
  text: string;
  surah: number;
  ayah: number;
  index: number; // 1-based word index within the ayah (stop signs don't increment)
  isStopSign: boolean;
};

export type SurahMeta = {
  number: number;
  name: string; // Arabic name e.g. "الفاتحة"
  englishName: string; // Transliteration e.g. "Al-Faatiha"
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
};
