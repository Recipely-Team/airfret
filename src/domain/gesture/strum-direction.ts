/** Downstroke moves towards the floor (screen y grows); upstroke the opposite. */
export const StrumDirection = {
  down: 1,
  up: -1,
} as const;

export type StrumDirection = (typeof StrumDirection)[keyof typeof StrumDirection];
