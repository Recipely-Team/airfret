import { describe, expect, it } from 'vitest';
import { planFingering } from '@domain/music/fingering/plan-fingering';
import { GUITAR_TUNING } from '@domain/music/tunings';

const DROP_D = [38, 45, 50, 55, 59, 64];

describe('planFingering', () => {
  it('puts every note of a chord on its own string', () => {
    const [shape] = planFingering([[64, 59, 55, 52, 47, 40]], GUITAR_TUNING, 20);
    expect(shape?.map((n) => n.string).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(shape?.every((n) => n.fret >= 0 && GUITAR_TUNING[n.string]! + n.fret === n.midi)).toBe(true);
  });

  it('reaches the top of a classical neck (B5 at the 19th fret)', () => {
    const [shape] = planFingering([[83]], GUITAR_TUNING, 19);
    expect(shape).toEqual([{ midi: 83, string: 5, fret: 19 }]);
  });

  it('keeps the hand in one place through a scale instead of jumping between strings', () => {
    const scale = [55, 57, 59, 60, 62, 64, 66, 67].map((m) => [m]);
    const plan = planFingering(scale, GUITAR_TUNING, 20);
    const stopped = plan.flat().filter((n) => n.fret > 0).map((n) => n.fret);
    expect(Math.max(...stopped) - Math.min(...stopped)).toBeLessThanOrEqual(5);
  });

  it('lets an arpeggio ring across strings rather than cutting a note off', () => {
    const plan = planFingering([[50], [55], [59]], GUITAR_TUNING, 20);
    expect(new Set(plan.flat().map((n) => n.string)).size).toBe(3);
  });

  it('plays the low D only when the sixth string is tuned down', () => {
    expect(planFingering([[38]], GUITAR_TUNING, 20)).toEqual([[]]);
    expect(planFingering([[38]], DROP_D, 20)).toEqual([[{ midi: 38, string: 0, fret: 0 }]]);
  });

  it('drops inner voices before the melody or the bass when there are more notes than strings', () => {
    const [shape] = planFingering([[76, 40, 41, 42, 43, 44, 45]], GUITAR_TUNING, 20);
    const notes = shape?.map((n) => n.midi) ?? [];
    expect(notes).toContain(76);
    expect(notes).toContain(40);
    expect(notes.length).toBeLessThanOrEqual(6);
  });

  it('returns nothing for an empty piece', () => {
    expect(planFingering([], GUITAR_TUNING, 20)).toEqual([]);
  });
});
