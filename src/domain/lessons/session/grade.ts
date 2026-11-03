/** How a played event was judged. */
export const Grade = {
  perfect: 'perfect',
  good: 'good',
  miss: 'miss',
  wrong: 'wrong',
} as const;

export type Grade = (typeof Grade)[keyof typeof Grade];
