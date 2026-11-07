/**
 * How a chord instrument plays the chords: on the afterbeats (the "pah" answering the bass's "oom"), broken into a
 * running arpeggio, or held as a pad for as long as each chord lasts.
 */
export const CompPattern = {
  afterbeat: 'afterbeat',
  arpeggio: 'arpeggio',
  held: 'held',
} as const;
export type CompPattern = (typeof CompPattern)[keyof typeof CompPattern];
