/** Pieces of the backing drum kit. */
export const DrumKind = {
  kick: 'kick',
  snare: 'snare',
  hat: 'hat',
} as const;

export type DrumKind = (typeof DrumKind)[keyof typeof DrumKind];
