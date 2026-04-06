/**
 * Word-level audio timing data from husary_segments.json.
 * Used for real-time word highlighting during verse playback.
 *
 * Each verse entry:
 * {
 *   "1:1": {
 *     "surah_number": 1,
 *     "ayah_number": 1,
 *     "audio_url": "...",
 *     "segments": [[wordIndex, startMs, endMs], ...]
 *   }
 * }
 */

export type WordTiming = [number, number, number]; // [wordIndex, startMs, endMs]

export type VerseSegment = {
  surah_number: number;
  ayah_number: number;
  audio_url: string;
  segments: WordTiming[];
};

let segmentsCache: Record<string, VerseSegment> | null = null;

/**
 * Loads husary_segments.json (cached after first load).
 */
export async function loadSegments(): Promise<Record<string, VerseSegment>> {
  if (segmentsCache) return segmentsCache;

  const res = await fetch("/data/husary_segments.json");
  if (!res.ok) throw new Error("Failed to load husary_segments.json");

  segmentsCache = await res.json();
  return segmentsCache!;
}

/**
 * Get word timings for a specific verse.
 * Returns empty array if no segments exist for this verse.
 */
export async function getWordTimings(
  surah: number,
  ayah: number,
): Promise<WordTiming[]> {
  const segments = await loadSegments();
  const key = `${surah}:${ayah}`;
  return segments[key]?.segments ?? [];
}

/**
 * Get the word index that should be highlighted at a given playback time.
 * Returns -1 if no word matches.
 */
export function getActiveWordIndex(
  timings: WordTiming[],
  currentTimeMs: number,
): number {
  for (const [wordIndex, startMs, endMs] of timings) {
    if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
      return wordIndex;
    }
  }
  return -1;
}

/**
 * Generates equal-time-sliced timings as fallback when segments are unavailable.
 */
export function generateFallbackTimings(
  wordCount: number,
  durationMs: number,
): WordTiming[] {
  const sliceMs = durationMs / wordCount;
  return Array.from({ length: wordCount }, (_, i) => [
    i + 1,
    Math.round(i * sliceMs),
    Math.round((i + 1) * sliceMs),
  ] as WordTiming);
}
