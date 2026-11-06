import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { HandDrumPerformer } from '@application/drums/hand-drum-performer';
import { KitPerformer } from '@application/drums/kit-performer';
import { GROOVES } from '@domain/drums/grooves/groove-catalog';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { rhythmsFor } from '@domain/drums/hand/rhythms/hand-rhythm-catalog';

describe('Drums playing by themselves', () => {
  it('a darbuka sounds every stroke of its rhythm on the clock, each shown once as it lands, and stops at the end', () => {
    const sound = new FakeSoundOutput();
    const p = new HandDrumPerformer(sound);
    const maqsum = rhythmsFor('darbuka')[0]!;
    expect(p.start(maqsum, handDrumFor('darbuka')!, 0)).toBe(true);
    let shown = 0;
    for (let t = 0; p.isPlaying && t < 60; t += 1 / 60) shown += p.update(t)?.length ?? 0;
    expect(sound.handStrokes.length).toBe(shown);
    // The two-bar phrase (5 strokes, then 8 with the ghosts) four times over: eight bars.
    expect(sound.handStrokes.length).toBe(4 * 13);
    expect(sound.handStrokes[0]!.when).toBeCloseTo(0.3, 3);
    expect(p.isPlaying).toBe(false);
  });

  it('the kit plays its groove, the kick and the crash closing it', () => {
    const sound = new FakeSoundOutput();
    const p = new KitPerformer(sound);
    p.start(GROOVES[0]!, 0);
    for (let t = 0; p.isPlaying && t < 60; t += 1 / 60) p.update(t);
    expect(sound.drumHits.length).toBeGreaterThan(100);
    expect(sound.drumHits.filter((h) => h.piece === 'crash').length).toBe(2);
  });
});
