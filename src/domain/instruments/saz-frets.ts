import { ratioCents } from '@domain/fretboard/fret-scale';

/**
 * The baglama's 17 frets in an octave, as string-length ratios — Yalcin Tura, *Turk Musikisinin Meseleleri*
 * (Pan, 1988), p. 159: the twelve Western semitones and five in-between notes. Fret 17 (2/1) is the octave.
 */
const TURA_RATIOS = [18 / 17, 12 / 11, 9 / 8, 81 / 68, 27 / 22, 81 / 64, 4 / 3, 24 / 17, 16 / 11, 3 / 2, 27 / 17, 18 / 11, 27 / 16, 16 / 9, 32 / 17, 64 / 33] as const;

/** One octave of saz frets in cents above the open string: 0, 99, 151, 204, 303 … 1147. */
export const SAZ_FRET_CENTS: readonly number[] = [0, ...TURA_RATIOS.map(ratioCents)];
