import { describe, expect, it } from 'vitest';
import { BandStyle } from '@domain/band/band-style';
import { planEnergy } from '@domain/band/form/energy-plan';
import { songForm } from '@domain/band/form/song-form';
import { comp } from '@domain/band/parts/comping';
import { drumBars } from '@domain/band/parts/drum-bars';
import { entryOf, isPlaying } from '@domain/band/parts/entries';
import { bassLine, heterophony, innerLine } from '@domain/band/parts/lines';
import { voiceChord } from '@domain/band/parts/voicing';
import { BandPattern } from '@domain/band/seating/band-pattern';
import { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import { InstrumentKind } from '@domain/band/seating/instrument-kind';
import { defaultPattern, patternsFor, rolesFor } from '@domain/band/seating/patterns-for';
import { profileOf } from '@domain/band/seating/profile-of';
import { seatBand } from '@domain/band/seating/seat-band';
import { parseGroove } from '@domain/drums/grooves/parse-groove';
import { parseRhythm } from '@domain/drums/hand/rhythms/parse-rhythm';
import { grooveForSong, rhythmForSong } from '@domain/drums/song-drums';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';

const part = (n: number) => Array.from({ length: n }, (_, k) => ({ start: k * 16, end: (k + 1) * 16, label: 'A', occurrence: k }));
const span = (beat: number, end: number, bass = 45, tones = [9, 0, 4]) => ({ beat, end, bass, tones });
const song = (over: Partial<Song>): Song => ({ id: 's', title: 'Song', credit: 'c', level: 1, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a', notes: 'C4:1', ...over });
const seat = (over: Partial<BandSeat>): BandSeat => ({ id: 'x', kind: InstrumentKind.keys, role: BandRole.harmony, centre: 60, gain: 1, ...over });

describe('The texture plan', () => {
  it('builds over the form whatever its length — one section in the middle, a dip before the last of many', () => {
    expect(planEnergy(part(1), BandStyle.auto, null).map((s) => s.energy)).toEqual([3]);
    expect(planEnergy(part(2), BandStyle.auto, null).map((s) => s.energy)).toEqual([3, 5]);
    expect(planEnergy(part(3), BandStyle.auto, null).map((s) => s.energy)).toEqual([2, 4, 5]);
    expect(planEnergy(part(6), BandStyle.auto, null).map((s) => s.energy)).toEqual([2, 3, 3, 4, 3, 5]);
  });

  it('keeps a quiet band gentle, a full one full, a fixed level throughout — and a folk usul unbroken', () => {
    expect(planEnergy(part(4), BandStyle.quiet, null).map((s) => s.energy)).toEqual([2, 3, 3, 3]);
    expect(planEnergy(part(4), BandStyle.full, null).map((s) => s.energy)).toEqual([4, 4, 4, 5]);
    expect(planEnergy(part(3), BandStyle.auto, 9).map((s) => s.energy)).toEqual([5, 5, 5]);
    expect(planEnergy(part(4), BandStyle.folk, null).some((s) => s.isThinEnd)).toBe(false);
    expect(planEnergy(part(4), BandStyle.auto, null).filter((s) => s.isThinEnd).map((s) => s.index)).toEqual([2]);
  });

  it('reads a song that does not repeat its tune in phrases, a returning phrase keeping its label, a short tail joining the last', () => {
    const formOf = (notes: string) => {
      const tune = song({ notes });
      const c = parseSong(tune, false);
      if (!c.isOk) throw new Error('chart');
      return songForm(tune, c.value);
    };
    const phrases = 'C4:4 D4:4 E4:4 F4:4 G4:4 A4:4 B4:4 C5:4 C4:4 D4:4 E4:4 F4:4';
    expect(formOf(phrases).map((p) => `${p.label}${p.occurrence}`)).toEqual(['A0', 'B0', 'A1']);
    // Two beats left over join the last phrase (which is then no longer the same as the first).
    expect(formOf(`${phrases} G4:2`)[2]).toMatchObject({ end: 50, label: 'C' });
  });
});

describe('Each part’s idiom', () => {
  const chord = [57, 60, 64];
  it('comps in blocks that get busier, strums with up-strums or a folk bass, breaks chords Alberti-style', () => {
    expect(comp(span(0, 4), chord, BandPattern.block, 0, 4, true).map((e) => e.beat)).toEqual([0, 2]);
    expect(comp(span(0, 4), chord, BandPattern.block, 1, 4, true)).toHaveLength(4);
    expect(comp(span(0, 4), chord, BandPattern.block, 2, 4, true)).toHaveLength(8);
    expect(comp(span(0, 4), chord, BandPattern.strum, 1, 4, true).map((e) => e.beat)).toEqual([0, 1, 1.5, 2, 3, 3.5]);
    const folk = comp(span(0, 4), chord, BandPattern.strum, 0, 4, false);
    expect(folk[0]?.midis).toEqual([45]);
    expect(folk[1]?.midis).toHaveLength(3);
    expect(comp(span(0, 2), chord, BandPattern.alberti, 1, 4, true).map((e) => e.midis[0])).toEqual([57, 64, 60, 64]);
    expect(comp(span(0.5, 0.5), chord, BandPattern.block, 1, 4, true)[0]?.dur).toBe(0);
  });

  it('answers the bass on the afterbeats: the "and"s in two, beats 2 and 3 in a waltz, every beat with no bass', () => {
    expect(comp(span(0, 2), chord, BandPattern.afterbeat, 1, 2, true).map((e) => e.beat)).toEqual([0.5, 1.5]);
    expect(comp(span(0, 3), chord, BandPattern.afterbeat, 1, 3, true).map((e) => e.beat)).toEqual([1, 2]);
    expect(comp(span(0, 4), chord, BandPattern.afterbeat, 1, 4, false).map((e) => e.beat)).toEqual([0, 1, 2, 3]);
  });

  it('walks a bass into the next chord by half step, doubles it in octaves, puts a high fifth below the root', () => {
    expect(bassLine(span(0, 4, 45), BandPattern.walk, 4, 50).map((e) => e.midis[0])).toEqual([45, 48, 40, 49]);
    expect(bassLine(span(0, 4, 45), BandPattern.walk, 4, null).map((e) => e.midis[0])).toEqual([45, 48, 40, 48]);
    expect(bassLine(span(0, 1, 40), BandPattern.octave, 4, null).map((e) => e.midis[0])).toEqual([40, 52]);
    expect(bassLine(span(0, 4, 40), BandPattern.rootFifth, 4, null).map((e) => e.midis[0])).toEqual([40, 47]);
  });

  it('plays the tune its own way: a plucked instrument re-strikes, a wind joins repeated notes, each in its own octave', () => {
    const tune = [{ beat: 0, dur: 2, midis: [64] }, { beat: 2, dur: 1, midis: [64] }, { beat: 3, dur: 0.5, midis: [62] }];
    expect(heterophony(tune, BandPattern.tremolo, 64, 1)).toHaveLength(7);
    expect(heterophony(tune, BandPattern.tremolo, 64, 0)).toHaveLength(4);
    expect(heterophony(tune, BandPattern.legato, 52, 1).map((e) => [e.dur, e.midis[0]])).toEqual([[3, 52], [0.5, 50]]);
  });

  it('moves an inner line where the tune holds, and keeps it between the bass and the tune', () => {
    const tune = [{ beat: 0, dur: 3, midis: [72] }, { beat: 3, dur: 1, midis: [71] }];
    const line = innerLine(span(0, 4), 0, 60, tune, true);
    expect(line.events.map((e) => e.beat)).toEqual([0, 1]);
    expect(line.events.every((e) => (e.midis[0] ?? 0) >= 52 && (e.midis[0] ?? 0) <= 69)).toBe(true);
    expect(innerLine(span(0, 4), 1, 60, tune, false).events).toHaveLength(1);
    expect(innerLine(span(0, 4), 0, 60, [{ beat: 0, dur: 4, midis: [54] }], false).events[0]?.midis[0]).toBeDefined();
  });

  it('voices each chord nearest the last, and thins it (no root, then the third alone) rather than cross a low tune', () => {
    expect(voiceChord([9, 0, 4], { low: 55, high: 69 }, null, [55, 60, 64])).toEqual([57, 60, 64]);
    expect(voiceChord([2, 5, 9], { low: 55, high: 69 }, 62, null, 50)).toEqual([53, 57]);
    expect(voiceChord([7, 10, 2], { low: 55, high: 69 }, 62, null, 50)).toEqual([58]);
    expect(voiceChord([7, 10, 2], { low: 55, high: 69 }, 54, null, 50).length).toBe(3);
  });
});

describe('Seating and entries', () => {
  it('reads every instrument’s family and weight from its catalogue', () => {
    expect(profileOf('trumpet')).toMatchObject({ kind: 'brass', weight: 4 });
    expect(profileOf('horn')).toMatchObject({ kind: 'brass', weight: 2 });
    expect(profileOf('kemence').kind).toBe('bowed');
    expect(profileOf('kanun').kind).toBe('zither');
    expect(profileOf('marimba').kind).toBe('mallet');
    expect(profileOf('piano').kind).toBe('keys');
  });

  it('offers each instrument the roles and patterns it can play', () => {
    expect(rolesFor(profileOf('davul'))).toEqual(['rhythm', 'off']);
    expect(rolesFor(profileOf('flute'))).not.toContain('bass');
    expect(rolesFor(profileOf('bassoon'))).toContain('bass');
    expect(rolesFor(profileOf('piano'))).toContain('harmony');
    expect(patternsFor(BandRole.heterophony, InstrumentKind.zither)).toEqual(['tremolo', 'legato']);
    expect(patternsFor(BandRole.heterophony, InstrumentKind.wind)).toEqual(['legato']);
    expect(patternsFor(BandRole.melody, InstrumentKind.wind)).toEqual([]);
    expect(defaultPattern(BandRole.bass, InstrumentKind.fretted, BandStyle.march, [])).toBe('rootFifth');
    expect(defaultPattern(BandRole.harmony, InstrumentKind.fretted, BandStyle.march, [])).toBe('afterbeat');
    expect(defaultPattern(BandRole.harmony, InstrumentKind.fretted, BandStyle.auto, ['strum'])).toBe('arpeggio');
  });

  it('makes a choice playable and says why: a tune instrument asked for the beat plays chords, a wind asked for chords holds one tone', () => {
    const seats = seatBand(['piano', 'flute', 'clarinet', 'oboe', 'bassoon', 'glockenspiel', 'trombone'].map(profileOf), { low: 60, high: 76 }, BandStyle.auto, { piano: { role: BandRole.rhythm }, flute: { role: BandRole.harmony }, oboe: { role: BandRole.off } });
    const by = Object.fromEntries(seats.map((s) => [s.id, s]));
    expect(by['piano']).toMatchObject({ role: 'harmony', hint: 'band.hint.noBeat' });
    expect(by['flute']).toMatchObject({ role: 'pad', hint: 'band.hint.oneNote' });
    expect(by['oboe']?.role).toBe('off');
    expect(by['glockenspiel']?.role).toBe('double');
    expect(seats.filter((s) => s.role === BandRole.bass).length).toBeLessThanOrEqual(2);
    expect(seatBand([profileOf('bass')], { low: 40, high: 52 }, BandStyle.folk)[0]?.role).toBe('melody');
  });

  it('brings each role in at its level — or from the section the player chose — and a Turkish lead drum from the first bar', () => {
    const plan = { sections: planEnergy(part(4), BandStyle.auto, null), hasBass: true, hasHarmony: false };
    expect(entryOf(seat({ role: BandRole.pad }), plan)).toBe(2);
    expect(entryOf(seat({ id: 'darbuka', role: BandRole.rhythm, isLeadDrum: true }), plan)).toBe(1);
    expect(entryOf(seat({ id: 'def', role: BandRole.rhythm }), plan)).toBe(3);
    expect(isPlaying(seat({ role: BandRole.double, from: 0 }), plan.sections[0]!, plan)).toBe(true);
    expect(isPlaying(seat({ role: BandRole.off }), plan.sections[3]!, plan)).toBe(false);
    const kit = drumBars(seat({ id: 'drums', role: BandRole.rhythm }), plan, { start: 0, bars: 16 }, 4);
    expect(kit.slice(0, 4)).toEqual([1, 1, 1, 1]);
    expect(kit[8]).toBe(3);
    expect(kit[11]).toBe(0);
    expect(drumBars(seat({ id: 'def', role: BandRole.rhythm }), plan, { start: 0, bars: 16 }, 4).slice(0, 4)).toEqual([0, 0, 0, 0]);
  });
});

describe('Drums written out bar by bar', () => {
  it('keep only kick and hi-hat in a light bar, rest in a silent one, crash a loud section in — the opening crash on the first hit', () => {
    const g = grooveForSong(song({}), 3, [0, 1, 3]);
    const hits = parseGroove(g);
    expect(hits.some((h) => h.piece === 'snare' && h.beat < 8)).toBe(false);
    expect(hits.some((h) => h.piece === 'kick' && h.beat >= 4 && h.beat < 8)).toBe(true);
    expect(hits.filter((h) => h.piece === 'crash').map((h) => h.beat)).toEqual([4, 8, 12]);
    expect(grooveForSong(song({ title: 'x' }), 1, undefined, true).lanes.snare).toBe('X.x.X.x.');
    const r = rhythmForSong(song({}), 'darbuka', 2, [1, 2]);
    const strokes = parseRhythm(r.phrase, r.subdiv, r.beatsPerBar, r.bars) ?? [];
    expect(strokes.filter((s) => s.beat < 4).every((s) => s.part === 'center')).toBe(true);
    expect(strokes.some((s) => s.beat >= 4 && s.part !== 'center')).toBe(true);
  });
});
