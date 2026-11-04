import { describe, expect, it } from 'vitest';
import type { SampleRef } from '@infrastructure/audio/samples/sample-ref';
import { SampleSet } from '@infrastructure/audio/samples/sample-set';

const buffer = (id: number) => ({ id }) as unknown as AudioBuffer;
const idOf = (b: AudioBuffer | undefined) => (b as unknown as { id: number } | undefined)?.id;
const ref = (midi: number, string: number, lo = midi, hi = midi, cents = 0): SampleRef => ({ file: `${midi}`, midi, lo, hi, string, layer: 0, cents });

describe('SampleSet', () => {
  it('voices a note from the string it is played on, even when another string has the same pitch', () => {
    const set = new SampleSet([{ ref: ref(59, 3), buffer: buffer(1) }, { ref: ref(59, 4), buffer: buffer(2) }]);
    expect(idOf(set.choose(4, 59)?.buffer)).toBe(2);
    expect(idOf(set.choose(3, 59)?.buffer)).toBe(1);
  });

  it('re-pitches the nearest recording and corrects its measured tuning error', () => {
    const set = new SampleSet([{ ref: ref(40, 0, 38, 42, -7), buffer: buffer(1) }]);
    expect(set.choose(0, 41)?.detune).toBe(100 - 7);
  });

  it('leaves notes far outside every recording to the synth (no chipmunk re-pitching)', () => {
    const set = new SampleSet([{ ref: ref(39, -1, 39, 45), buffer: buffer(1) }]);
    expect(set.choose(-1, 48)).not.toBeNull();
    expect(set.choose(-1, 49)).toBeNull();
    expect(new SampleSet([]).choose(0, 40)).toBeNull();
  });

  it('plays the top frets in tune even when their recordings are 40 cents flat', () => {
    const set = new SampleSet([{ ref: ref(83, 5, 83, 83, 40), buffer: buffer(1) }]);
    expect(set.choose(5, 83)?.detune).toBe(40);
  });
});
