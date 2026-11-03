import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

/** Runs the guide through the first `beats` beats of a song (after the count-in). */
function run(songId: string, beats: number) {
  const sound = new FakeSoundOutput();
  const guide = new GuidePlayer(sound);
  const r = new StartLessonUseCase().execute(SONGS.find((s) => s.id === songId)!, { tempo: 1, shouldWait: false, isEasy: false, hasDrums: false, hasGuide: true, latency: 0 }, 0);
  if (!r.isOk) throw new Error('lesson');
  const until = r.value.timeOfBeat(beats);
  for (let t = 0; t < until; t += 0.05) guide.update(r.value, instrumentById('acoustic'), t);
  return { sound, session: r.value };
}

describe('GuidePlayer — plays like a guitarist, not a sequencer', () => {
  it('strums every chord tone on the guide voice, low string first, close to the beat', () => {
    const { sound, session } = run('c-em', 0.5);
    const first = session.timeOfBeat(session.chart.targets[0]!.beat);
    expect(sound.plucks.slice(0, 6).map((p) => p.midi)).toEqual([40, 47, 52, 55, 59, 64]);
    expect(sound.plucks.every((p) => p.voice === 'guide')).toBe(true);
    expect(Math.abs(sound.plucks[0]!.when - first)).toBeLessThan(0.006);
  });

  it('accents the downbeat over the other beats', () => {
    const { sound } = run('c-em', 4);
    const strokes = sound.plucks.filter((p) => p.string === 0);
    expect(strokes[0]!.amp).toBeGreaterThan(strokes[1]!.amp);
  });

  it('upstrokes catch only the top strings, lighter, with the finger pad', () => {
    const { sound } = run('c-rhythm', 8);
    const ups = sound.plucks.filter((p) => p.attack === 'pad');
    expect(ups.length).toBeGreaterThan(0);
    expect(Math.min(...ups.map((p) => p.string))).toBeGreaterThanOrEqual(2);
    const downs = sound.plucks.filter((p) => p.attack === 'nail');
    expect(Math.max(...ups.map((p) => p.amp))).toBeLessThan(Math.max(...downs.map((p) => p.amp)));
  });

  it('varies each stroke a little — not two strokes alike', () => {
    const { sound } = run('c-em', 4);
    const lows = sound.plucks.filter((p) => p.string === 0).map((p) => p.position);
    expect(new Set(lows.map((v) => v.toFixed(4))).size).toBeGreaterThan(1);
  });
});
