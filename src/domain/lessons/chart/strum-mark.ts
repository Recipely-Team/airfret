/** Strum marks in a rhythm pattern. */
export const StrumMark = {
  down: 'D',
  up: 'U',
} as const;

export type StrumMark = (typeof StrumMark)[keyof typeof StrumMark];
