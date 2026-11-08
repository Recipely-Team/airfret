/**
 * What an instrument does in the band — one job each, as an arranger gives them (docs/research/reports/Ensemble
 * arranging system rules.md):
 * - **melody** carries the tune; **double** plays it too, an octave or a unison away; **heterophony** plays it in its
 *   own idiom (a plucked instrument re-striking long notes, a wind joining them into one breath), as a folk ensemble does;
 * - **counter** an inner line under the tune, moving where the tune holds; **harmony** the chords in a pattern;
 *   **pad** the chords held;
 * - **bass** the lowest voice; **rhythm** the beat; **off** silent.
 */
export const BandRole = {
  melody: 'melody',
  double: 'double',
  heterophony: 'heterophony',
  counter: 'counter',
  harmony: 'harmony',
  pad: 'pad',
  bass: 'bass',
  rhythm: 'rhythm',
  off: 'off',
} as const;
export type BandRole = (typeof BandRole)[keyof typeof BandRole];
