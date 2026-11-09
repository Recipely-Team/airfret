import { describe, expect, it } from 'vitest';
import { arrangeBand } from '@domain/band/arrange-band';
import { BandStyle } from '@domain/band/band-style';
import { chordTimeline } from '@domain/band/harmony/chord-timeline';
import { drone, fills, homeOf } from '@domain/band/parts/punctuation';
import { BandRole } from '@domain/band/seating/band-role';
import { profileOf } from '@domain/band/seating/profile-of';
import { rolesFor } from '@domain/band/seating/patterns-for';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';

const EPS = 1e-6;
const chartOf = (s: Song) => {
  const c = parseSong(s, false);
  if (!c.isOk) throw new Error(s.id);
  return c.value;
};
const song = (id: string) => SONGS.find((s) => s.id === id) as Song;
const notesOf = (part: Song) => chartOf(part).targets.flatMap((t) => (t.midi === undefined ? [] : [{ beat: t.beat, dur: t.dur, midis: [t.midi, ...(t.harmony ?? [])] }]));
const tuneOf = (s: Song) => chartOf(s).targets.flatMap((t) => (t.midi === undefined ? [] : [{ beat: t.beat, dur: t.dur, midis: [t.midi] }]));
const pc = (m: number) => ((m % 12) + 12) % 12;

describe('The drone', () => {
  it('holds the song’s home note (its last note, the karar) under the tune from the first bar — with its fifth on a kanun', () => {
    const s = song('katibim');
    const a = arrangeBand(s, chartOf(s), ['ney', 'kanun', 'bass'], BandStyle.auto, null, { kanun: { role: BandRole.drone } });
    const tune = tuneOf(s);
    const home = homeOf(tune, []);
    expect(home).toBe(pc(tune[tune.length - 1]?.midis[0] ?? 0));
    const notes = notesOf(a.parts.find((p) => p.seat.id === 'kanun')!.song);
    expect(notes[0]?.beat).toBe(0);
    const low = Math.min(...tune.map((n) => n.midis[0] ?? 0));
    for (const n of notes) {
      expect(n.midis.map(pc).sort()).toEqual([home, (home + 7) % 12].sort());
      expect(Math.max(...n.midis)).toBeLessThanOrEqual(low - 3);
    }
    // Plucked: sounded again every bar.
    expect((notes[1]?.beat ?? 0) - (notes[0]?.beat ?? 0)).toBe(s.beatsPerBar);
  });

  it('is one note on a held instrument, taken again every two bars, and never under G2', () => {
    const d = drone(2, 50, 70, 32, 4, true, false);
    expect(d.every((e) => e.midis.length === 1 && e.dur === 8)).toBe(true);
    expect(d.every((e) => (e.midis[0] ?? 0) >= 43 && pc(e.midis[0] ?? 0) === 2)).toBe(true);
    // A tune too low to fit under: the lowest home note there is, still no lower than G2.
    expect(drone(0, 40, 60, 4, 4, false, true)[0]?.midis).toEqual([55, 48]);
  });

  it('is offered to every instrument with notes, as are fills', () => {
    for (const id of ['flute', 'piano', 'kanun', 'acoustic']) expect(rolesFor(profileOf(id))).toEqual(expect.arrayContaining([BandRole.drone, BandRole.fills]));
    expect(rolesFor(profileOf('drums'))).not.toContain(BandRole.drone);
  });
});

describe('Fills', () => {
  const s = song('izmir-marsi');
  const chart = chartOf(s);
  const tune = tuneOf(s);
  const chords = chordTimeline(s, chart);
  const sounding = (beat: number) => tune.find((n) => beat >= n.beat - EPS && beat < n.beat + n.dur - EPS);

  it('play only where the tune holds or rests — a beat after its note — at most two a bar', () => {
    const run = fills(tune, chords, 76, false);
    expect(run.length).toBeGreaterThan(0);
    const starts = new Set(tune.map((n) => n.beat.toFixed(3)));
    for (const f of run) {
      expect(starts.has(f.beat.toFixed(3)), `${f.beat}`).toBe(false);
      const n = sounding(f.beat);
      if (n) expect(f.beat - n.beat).toBeGreaterThanOrEqual(1 - EPS);
    }
    // A fill starts where the note before it doesn't end: count those, bar by bar.
    const perBar = new Map<number, number>();
    run.forEach((f, i) => {
      const prev = run[i - 1];
      if (prev && Math.abs(prev.beat + prev.dur - f.beat) < EPS) return;
      const bar = Math.floor(f.beat / s.beatsPerBar);
      perBar.set(bar, (perBar.get(bar) ?? 0) + 1);
    });
    for (const count of perBar.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it('run on the chord’s own tones, rising into the next note; a keyboard stabs the chord once instead', () => {
    const chordAt = (beat: number) => chords.find((c) => beat >= c.beat - EPS && beat < c.end - EPS);
    for (const f of fills(tune, chords, 60, false)) expect(chordAt(f.beat)?.tones).toContain(pc(f.midis[0] ?? 0));
    const stabs = fills(tune, chords, 60, true);
    expect(stabs.length).toBeGreaterThan(0);
    for (const st of stabs) {
      expect(st.midis.length).toBeGreaterThan(1);
      expect(st.dur).toBeLessThan(0.5);
    }
  });

  it('come in only with the full band (level 4 and up)', () => {
    const quiet = arrangeBand(s, chart, ['clarinet', 'flute', 'piano', 'bass'], BandStyle.auto, 3, { flute: { role: BandRole.fills } });
    expect(notesOf(quiet.parts.find((p) => p.seat.id === 'flute')!.song)).toEqual([]);
    const full = arrangeBand(s, chart, ['clarinet', 'flute', 'piano', 'bass'], BandStyle.auto, 5, { flute: { role: BandRole.fills } });
    expect(notesOf(full.parts.find((p) => p.seat.id === 'flute')!.song).length).toBeGreaterThan(0);
  });
});
