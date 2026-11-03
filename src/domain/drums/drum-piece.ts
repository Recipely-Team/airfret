/** Pieces of the drum kit. */
export const DrumPiece = {
  kick: 'kick',
  snare: 'snare',
  hihat: 'hihat',
  tom1: 'tom1',
  tom2: 'tom2',
  floor: 'floor',
  crash: 'crash',
  ride: 'ride',
} as const;

export type DrumPiece = (typeof DrumPiece)[keyof typeof DrumPiece];
