import { describe, expect, it } from 'vitest';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { CHORD_SETS } from '@domain/lessons/catalog/chord-set-catalog';
import { chordNotes, chordRoot } from '@domain/music/chords/chord-voicing';
import { UKULELE_SHAPES } from '@domain/music/chords/ukulele-shapes';
import { effectiveTuning, tuningsFor } from '@domain/music/tuning-catalog';

/** The chord's notes as pitch classes, from its name: root plus the quality's intervals. */
function tones(name: string): Set<number> {
  const quality = name.replace(/^[A-G][#b]?/, '');
  const intervals: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], '5': [0, 7], add9: [0, 2, 4, 7] };
  const root = chordRoot(name);
  return new Set((intervals[quality] ?? []).map((i) => (root + i) % 12));
}

const ukulele = instrumentById('ukulele');

describe('Ukulele', () => {
  it('voices every shape as its chord: only the chord’s notes, the root among them', () => {
    for (const name of Object.keys(UKULELE_SHAPES)) {
      const notes = chordNotes(name, ukulele.tuning, ukulele.chordShapes).filter((n): n is number => n !== null);
      const want = tones(name);
      expect(notes.length, name).toBe(4);
      for (const n of notes) expect(want.has(n % 12), `${name}: ${n}`).toBe(true);
      expect(notes.some((n) => n % 12 === chordRoot(name)), `${name}: root`).toBe(true);
    }
  });

  it('has a shape for every chord in every chord set, so no strum on a ukulele is silent', () => {
    for (const set of CHORD_SETS) for (const c of set.chords) expect(UKULELE_SHAPES[c], `${set.id}: ${c}`).toBeDefined();
  });

  it('is re-entrant G4 C4 E4 A4, with a low-G option', () => {
    expect(effectiveTuning(ukulele.tuning, 'standard', 0, ukulele.tunings)).toEqual([67, 60, 64, 69]);
    expect(effectiveTuning(ukulele.tuning, 'lowG', 0, ukulele.tunings)).toEqual([55, 60, 64, 69]);
  });
});

describe('Mandolin, balalaika and bouzoukis', () => {
  it('tune as their sources say', () => {
    const tune = (id: string, t = 'standard') => {
      const i = instrumentById(id);
      return effectiveTuning(i.tuning, t, 0, i.tunings);
    };
    expect(tune('mandolin')).toEqual([55, 62, 69, 76]);
    expect(tune('balalaika')).toEqual([64, 64, 69]);
    expect(tune('balalaika', 'guitarStyle')).toEqual([55, 59, 62]);
    expect(tune('balalaika', 'domra')).toEqual([64, 69, 74]);
    expect(tune('balalaika', 'folkD')).toEqual([62, 66, 69]);
    expect(tune('balalaika', 'folkC')).toEqual([60, 64, 67]);
    expect(tune('bouzouki')).toEqual([43, 50, 57, 62]);
    expect(tune('bouzouki', 'gdae')).toEqual([43, 50, 57, 64]);
    expect(tune('greekBouzouki')).toEqual([50, 57, 62]);
  });

  it('ring their courses: mandolin and Irish bouzouki in unison, the Greek bouzouki’s low course an octave', () => {
    expect(instrumentById('mandolin').courses).toEqual([0, 0, 0, 0]);
    expect(instrumentById('bouzouki').courses).toEqual([0, 0, 0, 0]);
    expect(instrumentById('greekBouzouki').courses).toEqual([12, 0, 0]);
  });

  it('offer notes and free play (no guitar chord shapes), each with only its own tunings', () => {
    for (const id of ['mandolin', 'balalaika', 'bouzouki', 'greekBouzouki']) {
      const i = instrumentById(id);
      expect(i.modes, id).toEqual([PlayMode.note, PlayMode.free]);
      expect(tuningsFor(i.tuning, i.tunings), id).toBe(i.tunings);
    }
  });
});
