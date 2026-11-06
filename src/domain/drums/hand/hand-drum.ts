import type { HandDrumHead } from '@domain/drums/hand/hand-drum-head';

/** A drum played with the hands — darbuka, congas, handpan…: its id (and page), name, and heads. */
export interface HandDrum {
  readonly id: string;
  readonly name: string;
  readonly heads: readonly HandDrumHead[];
}
