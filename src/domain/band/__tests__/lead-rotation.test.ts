import { describe, expect, it } from 'vitest';
import { arrangeBand } from '@domain/band/arrange-band';
import { BandStyle } from '@domain/band/band-style';
import { planEnergy } from '@domain/band/form/energy-plan';
import { rotateLeads } from '@domain/band/form/lead-rotation';
import { BandRole } from '@domain/band/seating/band-role';
import { profileOf } from '@domain/band/seating/profile-of';
import { seatBand } from '@domain/band/seating/seat-band';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';

const WINDS = ['flute', 'clarinet', 'trumpet', 'horn', 'tuba', 'kanun', 'davul'];
const TUNE = { low: 62, high: 74 };
const chartOf = (s: Song) => {
  const c = parseSong(s, false);
  if (!c.isOk) throw new Error(s.id);
  return c.value;
};
const izmir = SONGS.find((s) => s.id === 'izmir-marsi') as Song;
const stanzas = (n: number) => planEnergy(Array.from({ length: n }, (_, k) => ({ start: k * 16, end: (k + 1) * 16, label: 'A', occurrence: k })), BandStyle.auto, null);

describe('The tune passing around the band (Boléro)', () => {
  it('passes a stanza that comes back to the next voice with a line of its own, and gives the melody that voice’s job', () => {
    const a = arrangeBand(izmir, chartOf(izmir), WINDS);
    const melody = a.seats.find((s) => s.role === BandRole.melody);
    const turns = a.plan.leads ?? [];
    expect(turns[0]).toBeNull();
    const second = turns[1];
    expect(second).not.toBeNull();
    const taker = a.seats.find((s) => s.id === second?.lead);
    expect([BandRole.counter, BandRole.pad, BandRole.double, BandRole.heterophony]).toContain(taker?.role);
    expect(second?.gives.role).toBe(taker?.role);
    // The last stanza: the band's own melody leads, everyone in.
    expect(turns[turns.length - 1]).toBeNull();
    // Taking the tune brings a voice up, handing it over brings the melody down — there, and only there.
    const levelOf = (id: string | undefined) => a.parts.find((p) => p.seat.id === id)?.levels ?? [];
    expect(levelOf(taker?.id)[1]).toBeGreaterThan(1);
    expect(levelOf(melody?.id)[1]).toBeLessThan(1);
    expect(levelOf(melody?.id)[0]).toBe(1);
  });

  it('leaves the tune where it is when the player chose the melody, or in a folk or march band, or with no chords and bass', () => {
    const chosen = arrangeBand(izmir, chartOf(izmir), WINDS, BandStyle.auto, null, { flute: { role: BandRole.melody } });
    expect(chosen.plan.leads?.every((t) => t === null)).toBe(true);
    for (const style of [BandStyle.folk, BandStyle.march]) expect(arrangeBand(izmir, chartOf(izmir), WINDS, style).plan.leads?.every((t) => t === null)).toBe(true);
    const profiles = WINDS.map(profileOf);
    const seats = seatBand(profiles, TUNE);
    expect(rotateLeads(stanzas(4), seats, profiles, TUNE, BandStyle.auto, {}, false).every((t) => t === null)).toBe(true);
  });

  it('never hands the tune to the chords, the bass, the beat, a voice the player placed, or one that can’t reach it', () => {
    const profiles = WINDS.map(profileOf);
    const seats = seatBand(profiles, TUNE);
    const takers = rotateLeads(stanzas(6), seats, profiles, TUNE, BandStyle.auto, {}, true).flatMap((t) => (t ? [t.lead] : []));
    for (const id of takers) expect([BandRole.harmony, BandRole.bass, BandRole.rhythm]).not.toContain(seats.find((s) => s.id === id)?.role);
    const placed = Object.fromEntries(seats.filter((s) => s.role !== BandRole.melody).map((s) => [s.id, { from: 0 }]));
    expect(rotateLeads(stanzas(4), seats, profiles, TUNE, BandStyle.auto, placed, true).every((t) => t === null)).toBe(true);
    // A tune two octaves above everyone's reach goes to no one.
    expect(rotateLeads(stanzas(4), seats, profiles, { low: 100, high: 110 }, BandStyle.auto, {}, true).every((t) => t === null)).toBe(true);
  });

  it('plays the tune up an octave on a voice that only reaches it there — never under the chords', () => {
    const profiles = ['clarinet', 'flute', 'piano', 'bass'].map(profileOf);
    const low = { low: 50, high: 60 };
    const seats = seatBand(profiles, low);
    expect(seats.find((s) => s.id === 'clarinet')?.role).toBe(BandRole.melody);
    // The flute starts at C4: it takes this tune (D3–C4) an octave up.
    const turns = rotateLeads(stanzas(3), seats, profiles, low, BandStyle.auto, {}, true);
    expect(turns[1]).toMatchObject({ lead: 'flute', shift: 12 });
  });
});
