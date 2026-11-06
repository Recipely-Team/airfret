/** Standard tunings as MIDI numbers, lowest string first. */

/** E2 A2 D3 G3 B3 E4 */
export const GUITAR_TUNING: readonly number[] = [40, 45, 50, 55, 59, 64];

/** E1 A1 D2 G2 */
export const BASS_TUNING: readonly number[] = [28, 33, 38, 43];

/** B0 E1 A1 D2 G2 — the 5-string bass adds a low B under the four. */
export const BASS5_TUNING: readonly number[] = [23, 28, 33, 38, 43];

/** B0 E1 A1 D2 G2 C3 — the 6-string bass adds a high C above the five. */
export const BASS6_TUNING: readonly number[] = [23, 28, 33, 38, 43, 48];

/** B1 E2 A2 D3 G3 B3 E4 — the 7-string guitar adds a low B under the six. */
export const GUITAR7_TUNING: readonly number[] = [35, 40, 45, 50, 55, 59, 64];

/**
 * The saz in Bozuk (Kara) duzen, written top string first as it is held (ust, orta, alt): G3 · D3 · A3. The
 * bottom course is the melody string — the highest, as a guitar's top E is.
 */
export const SAZ_TUNING: readonly number[] = [55, 50, 57];

/** A lowest string below this (G#1) is a bass's; every guitar tuning, a 7-string in drop A included, stays above. */
const BASS_BELOW_MIDI = 32;

/**
 * A bass, by its range rather than its string count: a 6-string bass and a guitar both have six strings but
 * play chords differently and take different tunings.
 */
export function isBassRange(tuning: readonly number[]): boolean {
  return (tuning[0] ?? 0) < BASS_BELOW_MIDI;
}

export const GUITAR_STRING_COUNT = 6;
