/**
 * Which strum directions sound. A webcam can't see depth, so lifting the hand
 * back up after a downstroke can read as an upstroke; `down` filters that out.
 */
export const StrumFilter = {
  both: 'both',
  down: 'down',
} as const;

export type StrumFilter = (typeof StrumFilter)[keyof typeof StrumFilter];
