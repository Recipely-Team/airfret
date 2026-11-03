/** What a foot does on a drum kit. */
export const PedalAction = {
  kick: 'kick',
  /** Second bass-drum pedal (double kick). */
  kick2: 'kick2',
  hihatPedal: 'hihatPedal',
} as const;

export type PedalAction = (typeof PedalAction)[keyof typeof PedalAction];
