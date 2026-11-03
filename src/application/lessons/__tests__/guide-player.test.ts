import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

describe('GuidePlayer', () => {
  it('strums each target on the guide voice, on the beat, low string first on a downstroke', () => {
    const sound = new FakeSoundOutput();
    const guide = new GuidePlayer(sound);
    const r = new StartLessonUseCase().execute(SONGS.find((s) => s.id === 'c-em')!, { tempo: 1, shouldWait: false, isEasy: false, hasDrums: false, hasGuide: true, latency: 0 }, 0);
    if (!r.isOk) throw new Error('lesson');
    const first = r.value.timeOfBeat(r.value.chart.targets[0]!.beat);
    guide.update(r.value, instrumentById('acoustic'), first - 0.1);
    expect(sound.plucks.map((p) => p.midi)).toEqual([40, 47, 52, 55, 59, 64]);
    expect(sound.plucks.every((p) => p.voice === 'guide')).toBe(true);
    expect(sound.plucks[0]!.when).toBeCloseTo(first);
    expect(sound.plucks[5]!.when).toBeGreaterThan(sound.plucks[0]!.when);
  });
});
