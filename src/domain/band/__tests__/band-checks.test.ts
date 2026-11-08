import { describe, expect, it } from 'vitest';
import { arrangeBand } from '@domain/band/arrange-band';
import type { BandArrangement } from '@domain/band/band-arrangement';
import { BandStyle } from '@domain/band/band-style';
import { chordTimeline } from '@domain/band/parts/chord-timeline';
import { BandRole } from '@domain/band/seating/band-role';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';

/**
 * The research report's automated checks ("Automated checks"), over real songs and bands: what makes a band sound
 * arranged rather than a jumble, held as tests.
 */
const chartOf = (song: Song) => {
  const c = parseSong(song, false);
  if (!c.isOk) throw new Error(song.id);
  return c.value;
};
const song = (id: string) => SONGS.find((s) => s.id === id) as Song;
const notesOf = (part: Song) => chartOf(part).targets.flatMap((t) => (t.midi === undefined ? [] : [{ beat: t.beat, dur: t.dur, midis: [t.midi, ...(t.harmony ?? [])] }]));
const partOf = (a: BandArrangement, role: string) => a.parts.find((p) => p.seat.role === role);
const EPS = 1e-6;

const BANDS = [
  ['clarinet', 'acoustic', 'piano', 'bass', 'drums'],
  ['flute', 'clarinet', 'trumpet', 'horn', 'tuba', 'kanun', 'davul'],
  ['nylon', 'kanun', 'ney', 'darbuka', 'bass'],
] as const;
const MELODIC = ['izmir-marsi', 'istiklal-marsi', 'katibim', 'greensleeves-melody'];

describe('A band arrangement, by the arranger’s checks', () => {
  for (const id of MELODIC) {
    for (const band of BANDS) {
      const s = song(id);
      const chart = chartOf(s);
      const a = arrangeBand(s, chart, band);
      const tune = chart.targets.flatMap((t) => (t.midi === undefined ? [] : [t]));
      const chords = chordTimeline(s, chart);
      const chordAt = (beat: number) => chords.find((c) => beat >= c.beat - EPS && beat < c.end - EPS);
      const tuneAt = (beat: number) => tune.find((t) => beat >= t.beat - EPS && beat < t.beat + t.dur - EPS);

      it(`${id} · ${band.join(' ')}: one instrument carries every note of the tune`, () => {
        const lead = partOf(a, BandRole.melody);
        expect(lead).toBeDefined();
        const played = notesOf(lead!.song);
        for (const t of tune) expect(played.some((n) => Math.abs(n.beat - t.beat) < EPS && n.midis[0] === t.midi), `${t.beat}`).toBe(true);
      });

      it(`${id} · ${band.join(' ')}: chords are the song's chords, voiced under the tune and clear of the low interval limits`, () => {
        for (const p of a.parts.filter((x) => x.seat.role === BandRole.harmony || x.seat.role === BandRole.pad)) {
          for (const n of notesOf(p.song)) {
            const c = chordAt(n.beat);
            if (!c) continue;
            for (const m of n.midis) expect(c.tones, `${p.seat.id} ${n.beat} ${m}`).toContain(((m % 12) + 12) % 12);
            const sorted = [...n.midis].sort((x, y) => x - y);
            for (let i = 1; i < sorted.length; i++) {
              const gap = (sorted[i] ?? 0) - (sorted[i - 1] ?? 0);
              const low = sorted[i - 1] ?? 0;
              // Verified limits (C4 = 60): m2 from E3, M2 from E♭3, m3 from C3, M3 from B2.
              if (gap === 1) expect(low).toBeGreaterThanOrEqual(52);
              if (gap === 2) expect(low).toBeGreaterThanOrEqual(51);
              if (gap === 3) expect(low).toBeGreaterThanOrEqual(48);
              if (gap === 4) expect(low).toBeGreaterThanOrEqual(47);
            }
            const t = tuneAt(n.beat);
            if (t?.midi !== undefined && p.seat.kind !== 'mallet') expect(Math.max(...n.midis), `${p.seat.id} at ${n.beat} under ${t.midi}`).toBeLessThan(t.midi);
          }
        }
      });

      it(`${id} · ${band.join(' ')}: the bass is the lowest voice, and no role outweighs the tune`, () => {
        const bass = partOf(a, BandRole.bass);
        const comps = a.parts.filter((x) => x.seat.role === BandRole.harmony || x.seat.role === BandRole.pad).flatMap((x) => notesOf(x.song));
        for (const b of bass ? notesOf(bass.song) : []) {
          const over = comps.filter((c) => c.beat < b.beat + b.dur - EPS && c.beat + c.dur > b.beat + EPS);
          for (const c of over) expect(b.midis[0]).toBeLessThan(Math.min(...c.midis));
        }
        const lead = a.seats.find((x) => x.role === BandRole.melody)?.gain ?? 0;
        for (const role of new Set(a.seats.map((x) => x.role))) {
          if (role === BandRole.melody || role === BandRole.rhythm) continue;
          const sum = Math.sqrt(a.seats.filter((x) => x.role === role).reduce((t, x) => t + x.gain ** 2, 0));
          expect(sum, role).toBeLessThanOrEqual(lead + EPS);
        }
      });
    }
  }

  it('builds up over the Izmir March: a single line first, then everyone; thins before the last stanza; ends on a held chord', () => {
    const s = song('izmir-marsi');
    const a = arrangeBand(s, chartOf(s), BANDS[0]);
    expect(a.sections.map((x) => x.energy)).toEqual([2, 3, 4, 5]);
    expect(a.sections.map((x) => x.label)).toEqual(['A', 'A', 'A', 'A']);
    expect(a.sections[2]?.isThinEnd).toBe(true);
    const kit = partOf(a, BandRole.rhythm)?.drumPlan ?? [];
    expect(kit[0]).toBe(1);
    expect(kit).toContain(3);
    const stripBar = Math.floor(((a.sections[2]?.end ?? 0) - 4) / 4);
    expect(kit.slice(stripBar - 1, stripBar + 1)).toContain(0);
    const guitar = notesOf(a.parts.find((p) => p.seat.id === 'acoustic')!.song);
    const last = guitar[guitar.length - 1];
    expect(last?.midis.length).toBeGreaterThan(1);
    expect((last?.beat ?? 0) + (last?.dur ?? 0)).toBeCloseTo(chartOf(s).length, 4);
  });

  it('plays a repeated stanza alike at one level: the same music gets the same arrangement', () => {
    const s = song('izmir-marsi');
    const a = arrangeBand(s, chartOf(s), BANDS[0], BandStyle.auto, 3);
    const guitar = notesOf(a.parts.find((p) => p.seat.id === 'acoustic')!.song);
    const rel = (k: number) => guitar.filter((n) => n.beat >= (a.sections[k]?.start ?? 0) && n.beat < (a.sections[k]?.end ?? 0) - 4).map((n) => `${(n.beat - (a.sections[k]?.start ?? 0)).toFixed(3)}:${n.midis.join('/')}`);
    expect(rel(1)).toEqual(rel(2));
  });

  it('keeps a Turkish ensemble in heterophony, the usul running from the first bar to the last', () => {
    const s = song('katibim');
    const a = arrangeBand(s, chartOf(s), ['saz', 'kanun', 'ney', 'darbuka', 'def'], BandStyle.folk);
    expect(Object.fromEntries(a.seats.map((x) => [x.id, x.role]))).toEqual({ saz: 'heterophony', kanun: 'heterophony', ney: 'melody', darbuka: 'rhythm', def: 'rhythm' });
    expect(a.parts.find((p) => p.seat.id === 'darbuka')?.drumPlan?.every((b) => b > 0)).toBe(true);
    const tune = chartOf(s).targets;
    for (const n of notesOf(a.parts.find((p) => p.seat.id === 'kanun')!.song)) {
      const t = tune.find((x) => n.beat >= x.beat - EPS && n.beat < x.beat + x.dur - EPS);
      expect(((n.midis[0] ?? 0) - (t?.midi ?? 0)) % 12).toBe(0);
    }
  });

  it('honours the player: a chosen role, pattern, level and entry — and explains a choice it had to change', () => {
    const s = song('izmir-marsi');
    const a = arrangeBand(s, chartOf(s), ['clarinet', 'flute', 'acoustic', 'drums'], BandStyle.auto, null, {
      flute: { role: BandRole.melody }, clarinet: { role: BandRole.melody }, acoustic: { pattern: 'arpeggio', from: 0, level: 0.5 }, drums: { role: BandRole.melody },
    });
    const by = Object.fromEntries(a.seats.map((x) => [x.id, x]));
    expect(by['clarinet']?.role).toBe(BandRole.melody);
    expect(by['flute']).toMatchObject({ role: BandRole.double, hint: 'band.hint.oneTune' });
    expect(by['drums']).toMatchObject({ role: BandRole.rhythm, hint: 'band.hint.drum' });
    expect(by['acoustic']).toMatchObject({ pattern: 'arpeggio', from: 0 });
    const guitar = notesOf(a.parts.find((p) => p.seat.id === 'acoustic')!.song);
    expect(guitar[0]?.beat).toBeLessThan(4);
    // Broken chords, one note at a time — until the final chord, held by everyone.
    expect(guitar.slice(0, -1).every((n) => n.midis.length === 1)).toBe(true);
    expect(guitar[guitar.length - 1]?.midis.length).toBeGreaterThan(1);
  });

  it('turns an instrument off, and gives a chord song a bass of its roots under strummed chords', () => {
    const s = song('four-chords');
    const a = arrangeBand(s, chartOf(s), ['acoustic', 'piano', 'bass'], BandStyle.auto, 4, { piano: { role: BandRole.off } });
    expect(notesOf(a.parts.find((p) => p.seat.id === 'piano')!.song)).toEqual([]);
    expect(notesOf(partOf(a, BandRole.bass)!.song).length).toBeGreaterThan(0);
  });
});
