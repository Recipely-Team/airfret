import { BandStyle } from '@domain/band/band-style';
import type { MemberChoice } from '@domain/band/member-choice';
import { seatGain } from '@domain/band/seating/balance';
import type { BandPattern } from '@domain/band/seating/band-pattern';
import { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import type { InstrumentProfile } from '@domain/band/seating/instrument-profile';
import { defaultPattern, patternsFor } from '@domain/band/seating/patterns-for';

/** An instrument whose whole range lies this low is a bass: it reaches E2 or below and no higher than C5. */
const BASS = { reachesDown: 40, topsOut: 72 } as const;
/** An instrument that starts this high (a glockenspiel) only doubles the tune, an octave or two up. */
const HIGH_ONLY = 72;
/** At most this many basses: a second doubles the first an octave away; more would muddy the low end. */
const MAX_BASSES = 2;
/** Held inner voices take the chord's third, fifth and root in turn. */
const INNER_VOICES = 3;
const NOTE_ROLES: ReadonlySet<BandRole> = new Set([BandRole.melody, BandRole.double, BandRole.heterophony, BandRole.counter, BandRole.harmony, BandRole.pad, BandRole.drone, BandRole.fills, BandRole.bass]);

/**
 * Seats a band for a tune (its lowest and highest notes) — the arranger's rules from the research report, with the
 * player's own choices first:
 * - a choice is kept when the instrument can play it, else the nearest it can (a drum keeps the beat; a single-line
 *   instrument asked for chords holds one chord tone) — and a second tune doubles the first: one melody at a time;
 * - the drums keep the beat; the instruments that live low (to E2, no higher than C5) play the bass, two at most;
 * - the tune goes to the one best able to carry it: a held voice first (a wind, a bow), covering its span, nearest
 *   its register;
 * - chord instruments play the chords, each in a pattern of its own; the next single-line voice takes an inner line,
 *   the ones after hold chord tones; a voice that lives only high doubles the tune above it;
 * - with no chords or bass to belong to — or in the folk style — they play the tune with the lead, each in its own
 *   idiom (heterophony), as a Turkish ensemble does.
 * Whatever the band, someone plays the tune.
 */
export function seatBand(profiles: readonly InstrumentProfile[], tune: { low: number; high: number }, style: BandStyle = BandStyle.auto, choices: Readonly<Record<string, MemberChoice>> = {}): BandSeat[] {
  const role = new Map<string, BandRole>();
  const hint = new Map<string, string>();
  for (const p of profiles) {
    const wanted = choices[p.id]?.role;
    if (!wanted) continue;
    const playable = playableRole(wanted, p);
    if (playable !== wanted) hint.set(p.id, p.isDrum ? 'band.hint.drum' : p.isMonophonic ? 'band.hint.oneNote' : 'band.hint.noBeat');
    role.set(p.id, playable);
  }
  // One tune at a time: a second the player chose doubles the first.
  profiles.filter((p) => role.get(p.id) === BandRole.melody).slice(1).forEach((p) => {
    role.set(p.id, BandRole.double);
    hint.set(p.id, 'band.hint.oneTune');
  });
  seatTheRest(profiles, role, tune, style);
  return dealPatterns(profiles, role, hint, style, choices);
}

/** The band's own choices for every instrument the player left to it. */
function seatTheRest(profiles: readonly InstrumentProfile[], role: Map<string, BandRole>, tune: { low: number; high: number }, style: BandStyle): void {
  const isFolk = style === BandStyle.folk;
  const free = () => profiles.filter((p) => !role.has(p.id));
  for (const p of free()) if (p.isDrum) role.set(p.id, BandRole.rhythm);
  if (!isFolk) {
    const basses = [...role.values()].filter((r) => r === BandRole.bass).length;
    free().filter((p) => p.low <= BASS.reachesDown && p.high <= BASS.topsOut).slice(0, Math.max(0, MAX_BASSES - basses)).forEach((p) => role.set(p.id, BandRole.bass));
  }
  if (![...role.values()].includes(BandRole.melody)) {
    const lead = best(free().filter((p) => p.low < HIGH_ONLY), tune) ?? best(free(), tune) ?? best(profiles.filter((p) => role.get(p.id) === BandRole.bass), tune);
    if (lead) role.set(lead.id, BandRole.melody);
  }
  const hasChords = [...role.values()].some((r) => r === BandRole.harmony || r === BandRole.pad) || free().some((p) => !p.isMonophonic && p.low < HIGH_ONLY);
  const isBacked = !isFolk && (hasChords || [...role.values()].includes(BandRole.bass));
  let lines = [...role.values()].filter((r) => r === BandRole.counter).length;
  for (const p of free()) {
    if (!isBacked) role.set(p.id, BandRole.heterophony);
    else if (p.low >= HIGH_ONLY) role.set(p.id, BandRole.double);
    else if (!p.isMonophonic) role.set(p.id, BandRole.harmony);
    // One inner line at a time (the report's cap): the next single-line voices hold chord tones.
    else role.set(p.id, lines++ === 0 ? BandRole.counter : BandRole.pad);
  }
}

/** Each seat's pattern, inner voice and level — chord instruments in patterns of their own. */
function dealPatterns(profiles: readonly InstrumentProfile[], role: ReadonlyMap<string, BandRole>, hint: ReadonlyMap<string, string>, style: BandStyle, choices: Readonly<Record<string, MemberChoice>>): BandSeat[] {
  const taken: BandPattern[] = [];
  const voices = new Map<BandRole, number>();
  const sharing = (r: BandRole) => [...role.values()].filter((x) => x === r).length;
  let isFirstDrum = true;
  return profiles.map((p): BandSeat => {
    const r = role.get(p.id) ?? BandRole.off;
    const choice = choices[p.id];
    const chosen = choice?.pattern && patternsFor(r, p.kind).includes(choice.pattern) ? choice.pattern : undefined;
    const pattern = chosen ?? defaultPattern(r, p.kind, style, taken);
    if (pattern && r === BandRole.harmony) taken.push(pattern);
    const isInner = r === BandRole.counter || (r === BandRole.pad && p.isMonophonic);
    const voice = isInner ? (voices.get(r) ?? 0) % INNER_VOICES : undefined;
    if (isInner) voices.set(r, (voices.get(r) ?? 0) + 1);
    const isLeadDrum = r === BandRole.rhythm && isFirstDrum;
    if (r === BandRole.rhythm) isFirstDrum = false;
    const reason = hint.get(p.id);
    return {
      id: p.id, kind: p.kind, role: r, centre: Math.round((p.low + p.high) / 2), gain: seatGain(r, p.weight, sharing(r), choice?.level ?? 1),
      ...(pattern ? { pattern } : {}), ...(voice !== undefined ? { voice } : {}), ...(choice?.from !== undefined ? { from: choice.from } : {}),
      ...(isLeadDrum ? { isLeadDrum } : {}), ...(reason ? { hint: reason } : {}),
    };
  });
}

/** The role nearest to the one asked for that the instrument can play: a drum only keeps the beat; a single line holds one chord tone. */
function playableRole(wanted: BandRole, p: InstrumentProfile): BandRole {
  if (wanted === BandRole.off) return wanted;
  if (p.isDrum) return BandRole.rhythm;
  if (wanted === BandRole.rhythm) return BandRole.harmony;
  if (p.isMonophonic && wanted === BandRole.harmony) return BandRole.pad;
  return NOTE_ROLES.has(wanted) ? wanted : BandRole.off;
}

/** The instrument best able to carry the tune: a held voice, covering its span, nearest its register. */
function best(candidates: readonly InstrumentProfile[], tune: { low: number; high: number }): InstrumentProfile | undefined {
  const span = tune.high - tune.low;
  const middle = (tune.low + tune.high) / 2;
  const score = (p: InstrumentProfile) =>
    (p.isSustained ? 3 : 0) + (p.isMonophonic ? 1 : 0) + (p.high - p.low >= span ? 2 : 0) - Math.abs((p.low + p.high) / 2 - middle) / 24;
  return [...candidates].filter((p) => !p.isDrum).sort((a, b) => score(b) - score(a))[0];
}
