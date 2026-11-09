import { describe, expect, it } from 'vitest';
import { arrangeBand } from '@domain/band/arrange-band';
import { BandHarmony } from '@domain/band/band-harmony';
import { BandStyle } from '@domain/band/band-style';
import { isPerfectUnder, quartalChord } from '@domain/band/harmony/quartal';
import { BandRole } from '@domain/band/seating/band-role';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';

const EPS = 1e-6;
const LANE = { low: 52, high: 67 };
/** A minor (Hüseyni-like) scale on A: A B C D E F♯ G. */
const SCALE = new Set([9, 11, 0, 2, 4, 6, 7]);
const pc = (m: number) => ((m % 12) + 12) % 12;
const chartOf = (s: Song) => {
  const c = parseSong(s, false);
  if (!c.isOk) throw new Error(s.id);
  return c.value;
};
const song = (id: string) => SONGS.find((s) => s.id === id) as Song;

describe('Quartal harmony (Ilerici, by Kinik 2011)', () => {
  it('stacks fourths from the tune’s own scale, under the tune', () => {
    const chord = quartalChord(69, SCALE, LANE, 3, 'none', 0);
    expect(chord).toEqual([54, 59, 64]);
    for (const m of chord) expect(SCALE.has(pc(m))).toBe(true);
    expect(Math.max(...chord)).toBeLessThan(69);
  });

  it('allows no more than two perfect fourths or fifths in a row under the tune', () => {
    expect(isPerfectUnder(69, quartalChord(69, SCALE, LANE, 3, 'none', 1))).toBe(true);
    const third = quartalChord(69, SCALE, LANE, 3, 'none', 2);
    expect(isPerfectUnder(69, third)).toBe(false);
    expect(SCALE.has(pc(third[third.length - 1] ?? 0))).toBe(true);
  });

  it('ends a phrase on a fifth (asma karar) and the piece on a fourth', () => {
    expect((69 - (quartalChord(69, SCALE, LANE, 3, 'half', 0).at(-1) ?? 0)) % 12).toBe(7);
    expect((69 - (quartalChord(69, SCALE, LANE, 3, 'final', 2).at(-1) ?? 0)) % 12).toBe(5);
    // A tune above the lane: the stack an octave down, still a fourth (an eleventh) under it.
    const high = quartalChord(81, SCALE, LANE, 3, 'none', 0);
    expect(Math.max(...high)).toBeLessThanOrEqual(LANE.high);
    expect(isPerfectUnder(81, high)).toBe(true);
  });

  it('harmonises a türkü in fourths when asked — every chord in its scale, under the tune, never three perfect in a row', () => {
    const s = song('katibim');
    const chart = chartOf(s);
    const a = arrangeBand(s, chart, ['clarinet', 'piano', 'bass'], BandStyle.auto, 4, { piano: { pattern: 'held' } }, BandHarmony.quartal);
    expect(a.plan.isQuartal).toBe(true);
    const tune = chart.targets.flatMap((t) => (t.midi === undefined ? [] : [t]));
    const scale = new Set(tune.map((t) => pc(t.midi ?? 0)));
    const piano = chartOf(a.parts.find((p) => p.seat.id === 'piano')!.song).targets.filter((t) => t.midi !== undefined);
    expect(piano.length).toBeGreaterThan(0);
    const bass = chartOf(a.parts.find((p) => p.seat.id === 'bass')!.song).targets.filter((t) => t.midi !== undefined);
    let run = 0;
    for (const t of piano) {
      const notes = [t.midi ?? 0, ...(t.harmony ?? [])];
      for (const m of notes) expect(scale.has(pc(m)), `${t.beat} ${m}`).toBe(true);
      const over = tune.filter((n) => n.beat < t.beat + t.dur - EPS && n.beat + n.dur > t.beat + EPS).map((n) => n.midi ?? 0);
      const low = Math.min(...over);
      if (!over.length) continue;
      expect(Math.max(...notes)).toBeLessThan(low);
      run = isPerfectUnder(low, [...notes].sort((x, y) => x - y)) ? run + 1 : 0;
      const bassUnder = bass.filter((b) => b.beat < t.beat + t.dur - EPS && b.beat + b.dur > t.beat + EPS);
      for (const b of bassUnder) expect(b.midi ?? 0, `bass at ${t.beat}`).toBeLessThan(Math.min(...notes));
      expect(run, `${t.beat}`).toBeLessThanOrEqual(2);
    }
  });

  it('never puts a Western-tonal march into fourths: it keeps its own chords', () => {
    const s = song('izmir-marsi');
    expect(s.isMarch).toBe(true);
    const a = arrangeBand(s, chartOf(s), ['clarinet', 'piano', 'bass'], BandStyle.auto, null, {}, BandHarmony.quartal);
    expect(a.plan.isQuartal).toBe(false);
    expect(a.seats.find((x) => x.id === 'piano')?.role).toBe(BandRole.harmony);
  });
});
