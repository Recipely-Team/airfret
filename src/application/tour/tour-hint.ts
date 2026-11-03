/** Where the tour points the player's attention. */
export const TourHint = {
  hands: 'hands',
  chip: 'chip',
  strings: 'strings',
  neck: 'neck',
  none: 'none',
} as const;

export type TourHint = (typeof TourHint)[keyof typeof TourHint];
