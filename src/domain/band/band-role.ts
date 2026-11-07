/**
 * What an instrument does in the band — one job each, as an arranger gives them: the tune; the tune doubled an
 * octave away; a held chord tone under it (a countermelody of long notes); the chords, struck in a pattern; the bass;
 * the beat.
 */
export const BandRole = {
  melody: 'melody',
  double: 'double',
  counter: 'counter',
  harmony: 'harmony',
  bass: 'bass',
  rhythm: 'rhythm',
} as const;
export type BandRole = (typeof BandRole)[keyof typeof BandRole];
