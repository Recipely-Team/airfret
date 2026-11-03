/**
 * - `chord`: the fretting hand points at a chord name (beginner).
 * - `note`: it holds one fret for every string (melodies).
 * - `free`: a real fretboard — every fingertip frets its own string; barres, bends, slides, hammer-ons.
 */
export const PlayMode = {
  chord: 'chord',
  note: 'note',
  free: 'free',
} as const;

export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode];
