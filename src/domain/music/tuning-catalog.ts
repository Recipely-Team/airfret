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

/**
 * The saz's duzens, each relative to Bozuk (G3 · D3 · A3, top · middle · bottom): the names Turkish folk music
 * gives them (alt · orta · ust in La terms: Bozuk La-Re-Sol, Baglama La-Re-Mi, Misket La-Re-Fa#, Abdal La-La-Sol,
 * Acem La-Re-Fa, Kutahya La-Re-Re, Mustezat La-Do-Sol). Sources: tr.wikipedia.org "Baglama", en "Baglama".
 */
export const SAZ_TUNINGS: readonly Tuning[] = [
  { id: 'standard', name: 'tuning.bozuk', offsets: [0, 0, 0] },
  { id: 'baglama', name: 'tuning.baglama', offsets: [-3, 0, 0] },
  { id: 'misket', name: 'tuning.misket', offsets: [-1, 0, 0] },
  { id: 'abdal', name: 'tuning.abdal', offsets: [0, 7, 0] },
  { id: 'acem', name: 'tuning.acem', offsets: [-2, 0, 0] },
  { id: 'kutahya', name: 'tuning.kutahya', offsets: [-5, 0, 0] },
  { id: 'mustezat', name: 'tuning.mustezat', offsets: [0, -2, 0] },
];

const BASSES: Readonly<Record<number, readonly Tuning[]>> = { 4: BASS_TUNINGS, 5: BASS5_TUNINGS, 6: BASS6_TUNINGS };
const GUITARS: Readonly<Record<number, readonly Tuning[]>> = { 3: SAZ_TUNINGS, 6: GUITAR_TUNINGS, 7: GUITAR7_TUNINGS };

/**
 * Tunings available for an instrument, by its family and string count (every tuning's offsets match its
 * strings): a 6-string bass gets bass tunings, not a guitar's drop D. An instrument's `own` list wins (a ukulele).
 */
export function tuningsFor(base: readonly number[], own?: readonly Tuning[]): readonly Tuning[] {
  if (own) return own;
  const family = isBassRange(base) ? BASSES : GUITARS;
  return family[base.length] ?? [{ id: 'standard', name: 'tuning.standard', offsets: base.map(() => 0) }];
}

/** Open-string pitches after the tuning and a capo: a capo raises every string by its fret. */
export function effectiveTuning(base: readonly number[], tuningId: string, capo: number, own?: readonly Tuning[]): number[] {
  const offsets = tuningsFor(base, own).find((t) => t.id === tuningId)?.offsets;
  return base.map((m, i) => m + (offsets?.[i] ?? 0) + capo);
}
