export {
  LESSON_CONFIG,
  getLessonConfig,
  getAvailableLessons,
} from "./lesson-config";
export type { LessonConfig, LessonType } from "./lesson-config";

export {
  wbwUrl,
  verseUrl,
  letterAudioUrl,
  praiseAudioUrl,
  retryAudioUrl,
  revealAudioUrl,
  listeningInstructionUrl,
  writingInstructionUrl,
} from "./audio-urls";

export {
  loadSegments,
  getWordTimings,
  getActiveWordIndex,
  generateFallbackTimings,
} from "./segments";
export type { WordTiming, VerseSegment } from "./segments";
