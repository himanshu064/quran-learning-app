/**
 * Audio URL builders for Quran playback.
 *
 * WBW (Word-by-Word): qurancdn.com CDN
 * Verse (Full Ayah): tarteel.ai CDN (Mahmoud Khalil Al-Husary, teacher version)
 * Letters: local MP3s from /audio/letters/
 */

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

/**
 * Word-by-word audio URL.
 * Format: https://audio.qurancdn.com/wbw/054_017_001.mp3
 */
export function wbwUrl(surah: number, ayah: number, wordIndex: number): string {
  return `https://audio.qurancdn.com/wbw/${pad(surah, 3)}_${pad(ayah, 3)}_${pad(wordIndex, 3)}.mp3`;
}

/**
 * Full verse audio URL (Husary recitation).
 * Format: https://audio-cdn.tarteel.ai/quran/husary/054017.mp3
 */
export function verseUrl(surah: number, ayah: number): string {
  return `https://audio-cdn.tarteel.ai/quran/husary/${pad(surah, 3)}${pad(ayah, 3)}.mp3`;
}

/**
 * Local letter audio URL.
 * @param filename - e.g. "audio/letters/001-alif.mp3" or "001-alif.mp3"
 */
export function letterAudioUrl(filename: string): string {
  if (filename.startsWith("/")) return filename;
  if (filename.startsWith("audio/")) return `/${filename}`;
  return `/audio/letters/${filename}`;
}

/**
 * Random praise audio URL (1 of 3 variants).
 */
export function praiseAudioUrl(): string {
  const tracks = [
    "/audio/praise_awesome_en.mp3",
    "/audio/praise_nice_job_en.mp3",
    "/audio/praise_well_done.mp3",
  ];
  return tracks[Math.floor(Math.random() * tracks.length)];
}

/**
 * Retry/try-again audio URL.
 */
export function retryAudioUrl(): string {
  return "/audio/retry_try_again_en.mp3";
}

/**
 * Correct answer reveal audio URL.
 */
export function revealAudioUrl(): string {
  return "/audio/reveal_correct_en.mp3";
}

/**
 * Game instruction audio URLs.
 */
export function listeningInstructionUrl(): string {
  return "/audio/listening_instruction_en.mp3";
}

export function writingInstructionUrl(): string {
  return "/audio/writing_instruction_en.mp3";
}
