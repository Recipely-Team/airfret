import { seededRandom } from '@core/math/seeded-random';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { Instrument } from '@domain/instruments/instrument';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { effectiveTuning } from '@domain/music/tuning-catalog';

/** Browser frames: mostly 60 fps, some 30 fps, now and then a 100 ms stall. */
const FRAME = { fast: 1 / 60, slow: 1 / 30, stall: 0.1, slowShare: 0.2, stallShare: 0.01 } as const;

/** What the guide played through a whole lesson, and on what. */
export interface Performance {
  readonly plucks: readonly PluckRequest[];
  /** The instrument as the app configures it: the song's tuning applied. */
  readonly instrument: Instrument;
}

/**
 * Plays a whole lesson in shadow mode the way the app loop does — session and guide updated frame by
 * uneven frame — and records every note the guide sent to the sound output.
 */
export function performSong(songId: string, instrumentId: string, tempo = 1): Performance {
  const song = SONGS.find((s) => s.id === songId);
  if (!song) throw new Error(`no song ${songId}`);
  const base = instrumentById(instrumentId);
  const instrument = { ...base, tuning: effectiveTuning(base.tuning, song.tuning ?? 'standard', 0, base.tunings) };
  const sound = new FakeSoundOutput();
  const guide = new GuidePlayer(sound);
  const started = new StartLessonUseCase().execute(song, { tempo, shouldWait: false, isEasy: false, hasGuide: true, hasDrums: false, latency: 0 }, 0);
  if (!started.isOk) throw new Error(started.failure.detail);
  const session = started.value;
  const rand = seededRandom(1);
  for (let t = 0; !session.isDone; ) {
    session.update(t, () => {});
    guide.update(session, instrument, t);
    const r = rand();
    t += r < FRAME.stallShare ? FRAME.stall : r < FRAME.slowShare ? FRAME.slow : FRAME.fast;
  }
  return { plucks: sound.plucks, instrument };
}
