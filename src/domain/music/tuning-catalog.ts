import type { Tuning } from '@domain/music/tuning';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';

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

/** Tunings available for an instrument with this many strings. */
export function tuningsFor(strings: number): readonly Tuning[] {
  return strings === GUITAR_STRING_COUNT ? GUITAR_TUNINGS : BASS_TUNINGS;
}

/** Open-string pitches after the tuning and a capo: a capo raises every string by its fret. */
export function effectiveTuning(base: readonly number[], tuningId: string, capo: number): number[] {
  const offsets = tuningsFor(base.length).find((t) => t.id === tuningId)?.offsets;
  return base.map((m, i) => m + (offsets?.[i] ?? 0) + capo);
}
