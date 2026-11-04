/** Standard tunings as MIDI numbers, lowest string first. */

/** E2 A2 D3 G3 B3 E4 */
export const GUITAR_TUNING: readonly number[] = [40, 45, 50, 55, 59, 64];

/** E1 A1 D2 G2 */
export const BASS_TUNING: readonly number[] = [28, 33, 38, 43];

/** B0 E1 A1 D2 G2 — the 5-string bass adds a low B under the four. */
export const BASS5_TUNING: readonly number[] = [23, 28, 33, 38, 43];

export const GUITAR_STRING_COUNT = 6;
