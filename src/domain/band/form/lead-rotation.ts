import { BandStyle } from '@domain/band/band-style';
import type { BandSection } from '@domain/band/form/band-section';
import type { MemberChoice } from '@domain/band/member-choice';
import type { BandPattern } from '@domain/band/seating/band-pattern';
import { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import type { InstrumentProfile } from '@domain/band/seating/instrument-profile';

/** The octaves a voice may take the tune in: as written, or one or two up. */
const UP = [0, 12, 24] as const;
/** The voices that can take the tune over: a line of their own, not the chords, the bass or the beat. */
const TAKES_OVER: ReadonlySet<BandRole> = new Set([BandRole.counter, BandRole.double, BandRole.heterophony, BandRole.pad]);
/** The textures that pass the tune around: a folk ensemble plays it all together; a march keeps it in the band's front. */
const ROTATES: ReadonlySet<BandStyle> = new Set([BandStyle.auto, BandStyle.full, BandStyle.quiet]);

/** Who leads a section other than the band's melody, and what the melody plays meanwhile. */
export interface LeadTurn {
  /** The seat that plays the tune. */
  readonly lead: string;
  /** Semitones it plays the tune at: as written when it reaches it, else the nearest octave up that it does. */
  readonly shift: number;
  /** What the melody instrument plays instead: the lead's own job. */
  readonly gives: { readonly role: BandRole; readonly pattern?: BandPattern; readonly voice?: number };
}

/**
 * Who carries the tune in each section — Ravel's Boléro model in the research report: when a section's music comes
 * back, the tune passes to the next voice able to carry it, and the voice that had it takes the other's job (its
 * inner line, its held tone, its doubling), so the band's layers stay as planned while the colour changes. The first
 * time each section is heard, and the last section, the band's own melody leads.
 *
 * Only a voice with a line of its own takes over (never the chords, the bass or the beat), only when it reaches the
 * tune's whole span, and never one whose role or entry the player chose — nor when the melody's role was chosen. A
 * band with chords and a bass only: the melody's written bass must be played by someone while it steps back.
 */
export function rotateLeads(sections: readonly BandSection[], seats: readonly BandSeat[], profiles: readonly InstrumentProfile[], tune: { low: number; high: number }, style: BandStyle, choices: Readonly<Record<string, MemberChoice>>, canRotate: boolean): (LeadTurn | null)[] {
  const none = sections.map(() => null);
  const melody = seats.find((s) => s.role === BandRole.melody);
  if (!canRotate || !melody || !ROTATES.has(style) || isChosen(choices[melody.id])) return none;
  const voices = seats.flatMap((s) => {
    const p = profiles.find((x) => x.id === s.id);
    const isLine = TAKES_OVER.has(s.role) && (s.role !== BandRole.pad || s.voice !== undefined);
    const shift = p && isLine && !isChosen(choices[s.id]) ? shiftFor(p, tune) : null;
    return shift === null ? [] : [{ seat: s, shift }];
  });
  if (!voices.length) return none;
  return sections.map((s) => {
    const k = s.occurrence % (voices.length + 1);
    const taker = s.isFinal || k === 0 ? undefined : voices[k - 1];
    if (!taker) return null;
    const { role, pattern, voice } = taker.seat;
    return { lead: taker.seat.id, shift: taker.shift, gives: { role, ...(pattern ? { pattern } : {}), ...(voice !== undefined ? { voice } : {}) } };
  });
}

function isChosen(choice: MemberChoice | undefined): boolean {
  return choice?.role !== undefined || choice?.from !== undefined;
}

/**
 * The octave an instrument plays the tune in: as written if it reaches it, else the nearest octave up; null if neither
 * fits. Never lower: the chords are voiced under the written tune, and must stay under the one heard.
 */
function shiftFor(p: InstrumentProfile, tune: { low: number; high: number }): number | null {
  return UP.find((shift) => tune.low + shift >= p.low && tune.high + shift <= p.high) ?? null;
}
