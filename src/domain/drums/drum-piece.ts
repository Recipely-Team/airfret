/** Pieces of the drum kit, and the darbuka's three strokes (one head, struck in three ways). */
export const DrumPiece = {
  kick: 'kick',
  snare: 'snare',
  hihat: 'hihat',
  tom1: 'tom1',
  tom2: 'tom2',
  floor: 'floor',
  crash: 'crash',
  ride: 'ride',
  /** Darbuka: the open, deep stroke in the middle of the head. */
  doum: 'doum',
  /** Darbuka: the sharp stroke on the edge with the strong hand. */
  tek: 'tek',
  /** Darbuka: the edge stroke with the other hand, a little softer. */
  ka: 'ka',
} as const;

export type DrumPiece = (typeof DrumPiece)[keyof typeof DrumPiece];
