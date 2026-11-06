import { isBassRange } from '@domain/music/tunings';
import type { Tuning } from '@domain/music/tuning';

export const GUITAR_TUNINGS: readonly Tuning[] = [
  { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0, 0, 0] },
  { id: 'dropD', name: 'tuning.dropD', offsets: [-2, 0, 0, 0, 0, 0] },
  { id: 'halfDown', name: 'tuning.halfDown', offsets: [-1, -1, -1, -1, -1, -1] },
  { id: 'dadgad', name: 'tuning.dadgad', offsets: [-2, 0, 0, 0, -2, -2] },
  { id: 'openG', name: 'tuning.openG', offsets: [-2, -2, 0, 0, 0, -2] },
];

export const BASS_TUNINGS: readonly Tuning[] = [
  { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0] },
  { id: 'dropD', name: 'tuning.dropD', offsets: [-2, 0, 0, 0] },
  { id: 'halfDown', name: 'tuning.halfDown', offsets: [-1, -1, -1, -1] },
];

/** Offsets line up with the 5-string's strings, low B first: drop D would retune the wrong string. */
export const BASS5_TUNINGS: readonly Tuning[] = [
  { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0, 0] },
  { id: 'dropA', name: 'tuning.dropA', offsets: [-2, 0, 0, 0, 0] },
  { id: 'halfDown', name: 'tuning.halfDown', offsets: [-1, -1, -1, -1, -1] },
];

/** The 6-string bass: the five's tunings, with its high C following along. */
export const BASS6_TUNINGS: readonly Tuning[] = [
  { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0, 0, 0] },
  { id: 'dropA', name: 'tuning.dropA', offsets: [-2, 0, 0, 0, 0, 0] },
  { id: 'halfDown', name: 'tuning.halfDown', offsets: [-1, -1, -1, -1, -1, -1] },
];

/** The 7-string guitar: drop A lowers its low B, the way drop D lowers a six-string's low E. */
export const GUITAR7_TUNINGS: readonly Tuning[] = [
  { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0, 0, 0, 0] },
  { id: 'dropA', name: 'tuning.dropA', offsets: [-2, 0, 0, 0, 0, 0, 0] },
  { id: 'halfDown', name: 'tuning.halfDown', offsets: [-1, -1, -1, -1, -1, -1, -1] },
];

const BASSES: Readonly<Record<number, readonly Tuning[]>> = { 4: BASS_TUNINGS, 5: BASS5_TUNINGS, 6: BASS6_TUNINGS };
const GUITARS: Readonly<Record<number, readonly Tuning[]>> = { 6: GUITAR_TUNINGS, 7: GUITAR7_TUNINGS };

/**
 * Tunings available for an instrument, by its family and string count (every tuning's offsets match its
 * strings): a 6-string bass gets bass tunings, not a guitar's drop D.
 */
export function tuningsFor(base: readonly number[]): readonly Tuning[] {
  const family = isBassRange(base) ? BASSES : GUITARS;
  return family[base.length] ?? [{ id: 'standard', name: 'tuning.standard', offsets: base.map(() => 0) }];
}

/** Open-string pitches after the tuning and a capo: a capo raises every string by its fret. */
export function effectiveTuning(base: readonly number[], tuningId: string, capo: number): number[] {
  const offsets = tuningsFor(base).find((t) => t.id === tuningId)?.offsets;
  return base.map((m, i) => m + (offsets?.[i] ?? 0) + capo);
}
