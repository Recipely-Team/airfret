import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { Player } from '@application/play/player';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { fretSemitones } from '@domain/fretboard/fret-scale';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { SAZ_FRET_CENTS } from '@domain/instruments/saz-frets';
import { effectiveTuning, tuningsFor } from '@domain/music/tuning-catalog';
import { StrumFilter } from '@domain/settings/strum-filter';

const saz = instrumentById('saz');

describe('The saz (baglama)', () => {
  it("has Tura's 17 frets an octave: the Western semitones and five in-between notes", () => {
    expect(SAZ_FRET_CENTS).toHaveLength(17);
    const round = SAZ_FRET_CENTS.map((c) => Math.round(c));
    expect(round).toEqual([0, 99, 151, 204, 303, 355, 408, 498, 597, 649, 702, 801, 853, 906, 996, 1095, 1147]);
    // Twelve of them sit within 12 c of an equal-tempered semitone: twelve-tone songs can be played.
    expect(round.filter((c) => Math.abs(c - Math.round(c / 100) * 100) <= 12)).toHaveLength(12);
  });

  it('repeats the table every octave: fret 17 is the octave, fret 27 the octave fifth', () => {
    const semis = fretSemitones(34, SAZ_FRET_CENTS);
    expect(semis[17]).toBe(12);
    expect(semis[27]).toBeCloseTo(12 + 7.02, 2);
    expect(semis[34]).toBe(24);
    expect(fretSemitones(3)).toEqual([0, 1, 2, 3]);
  });

  it('places its frets by pitch: the in-between fret lies between its neighbours, closer together than on a guitar', () => {
    const l = computeLayout(1440, 900, 3, false, saz.maxFret, saz.fretCents);
    for (let n = 1; n <= saz.maxFret; n++) expect(l.fretX[n] ?? 0).toBeGreaterThan(l.fretX[n - 1] ?? 0);
    const guitar = computeLayout(1440, 900, 6, false, 12);
    expect((l.fretX[2] ?? 0) - (l.fretX[1] ?? 0)).toBeLessThan((guitar.fretX[2] ?? 0) - (guitar.fretX[1] ?? 0));
  });

  it('offers its own duzens: Bozuk G3 D3 A3, Baglama with the top string on E, Misket on F#', () => {
    expect(tuningsFor(saz.tuning).map((t) => t.id)).toEqual(['standard', 'baglama', 'misket', 'abdal', 'acem', 'kutahya', 'mustezat']);
    expect(effectiveTuning(saz.tuning, 'standard', 0)).toEqual([55, 50, 57]);
    expect(effectiveTuning(saz.tuning, 'baglama', 0)).toEqual([52, 50, 57]);
    expect(effectiveTuning(saz.tuning, 'misket', 0)).toEqual([54, 50, 57]);
  });

  it('plays the in-between note of a fret, not the nearest semitone', () => {
    const sound = new FakeSoundOutput();
    const player = new Player(sound);
    const layout = computeLayout(1440, 900, 3, false, saz.maxFret, saz.fretCents);
    player.configure({ layout, instrument: saz, mode: PlayMode.note, chords: [], strumFilter: StrumFilter.both, capo: 0 });
    player.select(2);
    const ys = strumStringYs(layout);
    const x = (layout.strumX0 + layout.strumX1) / 2;
    player.pointer({ x, y: (ys[0] ?? 0) - 40 }, 1, 0);
    player.pointer({ x, y: (ys[ys.length - 1] ?? 0) + 40 }, 1.03, 0);
    // Fret 2 is 12/11 above each string: 151 c, a neutral second.
    expect(sound.plucks.map((p) => +(p.midi - (saz.tuning[p.string] ?? 0)).toFixed(2))).toEqual([1.51, 1.51, 1.51]);
  });

  it('offers notes and free play, not guitar chords, and plays only through its synth', () => {
    expect(saz.modes).toEqual([PlayMode.note, PlayMode.free]);
    expect(saz.isRecorded).toBe(false);
  });
});
