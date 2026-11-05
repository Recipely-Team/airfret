import type { Song } from '@domain/lessons/catalog/song';
import type { LessonOptions } from '@domain/lessons/session/lesson-options';
import { LessonMode } from '@domain/lessons/session/lesson-mode';
import type { Settings } from '@domain/settings/settings';

const MS_PER_SECOND = 1000;

/** A lesson's options from the player's settings. */
export function lessonOptions(st: Settings, song: Song): LessonOptions {
  return {
    tempo: st.lessonTempo,
    shouldWait: st.lessonMode === LessonMode.wait,
    hasGuide: st.lessonMode === LessonMode.shadow,
    // Course patterns are already simple; library songs can be thinned to one strum per bar.
    isEasy: song.course === undefined && st.isLessonEasy,
    hasDrums: st.hasLessonDrums,
    latency: st.latencyMs / MS_PER_SECOND,
  };
}
