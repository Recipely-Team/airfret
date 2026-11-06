import type { PluckRequest } from '@domain/audio/pluck-request';
import type { Instrument } from '@domain/instruments/instrument';

/**
 * A 12-string's second string sounds under its partner's number plus this, so both ring at once in the string
 * bank and the sample player (each keeps one note per string number).
 */
const PAIR_OFFSET = 16;
/** The pair is struck a moment after its partner (the pick reaches it second) and a little softer. */
const PAIR = { delay: 0.006, level: 0.75 } as const;

/** The paired string's pluck for a 12-string course, or null on a single-course instrument (or a muted stroke). */
export function coursePair(inst: Instrument | null, r: PluckRequest): PluckRequest | null {
  const interval = r.string >= 0 ? inst?.courses?.[r.string] : undefined;
  if (interval === undefined) return null;
  return { ...r, string: r.string + PAIR_OFFSET, midi: r.midi + interval, amp: r.amp * PAIR.level, when: r.when + PAIR.delay };
}

/** Every string number a string's course sounds under: itself, and its pair on a 12-string. */
export function courseStrings(inst: Instrument | null, string: number): number[] {
  return string >= 0 && inst?.courses?.[string] !== undefined ? [string, string + PAIR_OFFSET] : [string];
}

/** The interval (semitones) a string's pair is tuned above it, or null when it has none. */
export function pairInterval(inst: Instrument | null, string: number): number | null {
  return (string >= 0 ? inst?.courses?.[string] : undefined) ?? null;
}

/** The partner a paired string number belongs to — what its stereo position follows. */
export function partnerOf(string: number): number {
  return string >= PAIR_OFFSET ? string - PAIR_OFFSET : string;
}
