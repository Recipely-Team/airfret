/**
 * How a lesson runs.
 * - `wait`: the song stops at each strum until you play it right.
 * - `along`: the song keeps going; you play along and get scored.
 * - `shadow`: a guide guitarist plays the song for you to hear and see; you imitate it, scored.
 */
export const LessonMode = {
  wait: 'wait',
  along: 'along',
  shadow: 'shadow',
} as const;

export type LessonMode = (typeof LessonMode)[keyof typeof LessonMode];
