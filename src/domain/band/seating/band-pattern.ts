/**
 * How a part is played — the idioms of the research report's pattern table:
 * - chords: **held** (one attack a chord), **afterbeat** (the "pah" answering the bass), **block** (repeated chords),
 *   **strum** (down on the beats, up between), **arpeggio** (broken, rising and falling), **alberti** (low–high–mid–high);
 * - bass: **root**, **rootFifth** (root, then the fifth on the next strong beat), **walk** (to the next chord by step),
 *   **octave** (root and its octave in eighths);
 * - the tune in its own idiom: **legato** (repeated notes joined in one breath or bow), **tremolo** (long notes re-struck).
 */
export const BandPattern = {
  held: 'held',
  afterbeat: 'afterbeat',
  block: 'block',
  strum: 'strum',
  arpeggio: 'arpeggio',
  alberti: 'alberti',
  root: 'root',
  rootFifth: 'rootFifth',
  walk: 'walk',
  octave: 'octave',
  legato: 'legato',
  tremolo: 'tremolo',
} as const;
export type BandPattern = (typeof BandPattern)[keyof typeof BandPattern];
