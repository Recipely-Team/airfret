/** Chord mode: the fretting hand picks a chord. Note mode: it picks a fret. */
export const PlayMode = {
  chord: 'chord',
  note: 'note',
} as const;

export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode];
