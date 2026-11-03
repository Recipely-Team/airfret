import { describe, expect, it } from 'vitest';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

const opts = { tempo: 1, shouldWait: true, isEasy: true, hasDrums: false, latency: 0 };

describe('StartLessonUseCase', () => {
  it('returns a started session whose neck chords are the song chords in order', () => {
    const r = new StartLessonUseCase().execute(SONGS.find((s) => s.id === 'four-chords')!, opts, 0);
    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.hasStarted).toBe(true);
      expect(r.value.chordSet).toEqual(['G', 'D', 'Em', 'C']);
    }
  });

  it('returns a failure for a song whose chart cannot be parsed', () => {
    const r = new StartLessonUseCase().execute({ ...SONGS[0]!, chords: 'G:x' }, opts, 0);
    expect(r.isOk).toBe(false);
  });
});
