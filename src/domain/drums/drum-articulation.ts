/** How a piece was struck — the synth voices each differently. */
export const DrumArticulation = {
  normal: 'normal',
  /** Snare hit at the very edge: the stick catches rim and head together. */
  rim: 'rim',
  /** Ride struck on its raised centre. */
  bell: 'bell',
  hatOpen: 'hatOpen',
  hatClosed: 'hatClosed',
  /** Hi-hat cymbals clapped shut by the foot. */
  hatPedal: 'hatPedal',
} as const;

export type DrumArticulation = (typeof DrumArticulation)[keyof typeof DrumArticulation];
