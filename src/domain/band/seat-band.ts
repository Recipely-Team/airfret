import { BandRole } from '@domain/band/band-role';
import type { BandSeat } from '@domain/band/band-seat';
import { CompPattern } from '@domain/band/comp-pattern';
import type { InstrumentProfile } from '@domain/band/instrument-profile';

/** An instrument whose whole range lies this low is a bass: it reaches E2 or below and no higher than C5. */
const BASS = { reachesDown: 40, topsOut: 72 } as const;
/** An instrument that starts this high (a glockenspiel) only doubles the tune, an octave or two up. */
const HIGH_ONLY = 72;
/** At most this many basses: a second doubles the first an octave away; more would muddy the low end. */
const MAX_BASSES = 2;
/** Chord instruments take these patterns in turn, so two never strike the same chords at the same moments. */
const PATTERNS = [CompPattern.afterbeat, CompPattern.arpeggio, CompPattern.held] as const;
const GAIN: Readonly<Record<BandRole, number>> = { melody: 1, double: 0.6, counter: 0.5, harmony: 0.6, bass: 0.85, rhythm: 1 };
const PATTERN_GAIN: Readonly<Record<CompPattern, number>> = { afterbeat: 0.6, arpeggio: 0.45, held: 0.4 };

/**
 * Seats a band for a tune (its lowest and highest notes), from the instruments' profiles alone — the arranger's rules:
 * - the drums keep the beat; the instruments that live low (to E2 and no higher than C5) play the bass, two at most;
 * - the tune goes to the one best able to carry it: a held voice first (a wind, a bow), one that covers the tune's
 *   span, nearest its register;
 * - chord instruments play the chords, each in a pattern of its own (afterbeats, then arpeggios, then held pads);
 * - other single-line voices hold chord tones under the tune when there are chords or a bass to belong to — else
 *   they play the tune with the lead, as a folk ensemble does (heterophony) — and a voice that lives only high
 *   doubles the tune above it.
 * Whatever the band, someone plays the tune.
 */
export function seatBand(profiles: readonly InstrumentProfile[], tune: { low: number; high: number }): BandSeat[] {
  const role = new Map<string, BandRole>();
  for (const p of profiles) if (p.isDrum) role.set(p.id, BandRole.rhythm);
  profiles.filter((p) => !p.isDrum && p.low <= BASS.reachesDown && p.high <= BASS.topsOut).slice(0, MAX_BASSES).forEach((p) => role.set(p.id, BandRole.bass));
  const free = () => profiles.filter((p) => !role.has(p.id));
  const lead = best(free().filter((p) => p.low < HIGH_ONLY), tune) ?? best(free(), tune) ?? best(profiles.filter((p) => role.get(p.id) === BandRole.bass), tune);
  if (lead) role.set(lead.id, BandRole.melody);
  const isBacked = profiles.some((p) => !role.has(p.id) && !p.isMonophonic && p.low < HIGH_ONLY) || [...role.values()].includes(BandRole.bass);
  for (const p of free()) role.set(p.id, !p.isMonophonic && p.low < HIGH_ONLY ? BandRole.harmony : p.low >= HIGH_ONLY || !isBacked ? BandRole.double : BandRole.counter);
  let comps = 0;
  let counters = 0;
  return profiles.map((p) => {
    const r = role.get(p.id) ?? BandRole.double;
    const centre = Math.round((p.low + p.high) / 2);
    if (r === BandRole.harmony) {
      const pattern = PATTERNS[comps++ % PATTERNS.length] ?? CompPattern.afterbeat;
      return { id: p.id, role: r, pattern, centre, gain: PATTERN_GAIN[pattern] };
    }
    if (r === BandRole.counter) return { id: p.id, role: r, voice: counters++, centre, gain: GAIN.counter };
    return { id: p.id, role: r, centre, gain: GAIN[r] };
  });
}

/** The instrument best able to carry the tune: a held voice, covering its span, nearest its register. */
function best(candidates: readonly InstrumentProfile[], tune: { low: number; high: number }): InstrumentProfile | undefined {
  const span = tune.high - tune.low;
  const middle = (tune.low + tune.high) / 2;
  const score = (p: InstrumentProfile) =>
    (p.isSustained ? 3 : 0) + (p.isMonophonic ? 1 : 0) + (p.high - p.low >= span ? 2 : 0) - Math.abs((p.low + p.high) / 2 - middle) / 24;
  return [...candidates].sort((a, b) => score(b) - score(a))[0];
}
