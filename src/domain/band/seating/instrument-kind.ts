/**
 * The family an instrument belongs to, for arranging: its idioms (a neck strums, a keyboard plays block chords or an
 * Alberti bass, a kanun breaks its chords) and its weight in the mix (one trumpet weighs as much as two horns, and
 * a horn as two woodwinds — Rimsky-Korsakov).
 */
export const InstrumentKind = {
  fretted: 'fretted',
  keys: 'keys',
  mallet: 'mallet',
  zither: 'zither',
  wind: 'wind',
  brass: 'brass',
  bowed: 'bowed',
  drum: 'drum',
} as const;
export type InstrumentKind = (typeof InstrumentKind)[keyof typeof InstrumentKind];
