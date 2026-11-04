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

const BY_STRING_COUNT: Readonly<Record<number, readonly Tuning[]>> = { 4: BASS_TUNINGS, 5: BASS5_TUNINGS, 6: GUITAR_TUNINGS };

/** Tunings available for an instrument with this many strings (every tuning's offsets match its strings). */
export function tuningsFor(strings: number): readonly Tuning[] {
  return BY_STRING_COUNT[strings] ?? [GUITAR_TUNINGS[0] as Tuning];
}

/** Open-string pitches after the tuning and a capo: a capo raises every string by its fret. */
export function effectiveTuning(base: readonly number[], tuningId: string, capo: number): number[] {
  const offsets = tuningsFor(base.length).find((t) => t.id === tuningId)?.offsets;
  return base.map((m, i) => m + (offsets?.[i] ?? 0) + capo);
}
