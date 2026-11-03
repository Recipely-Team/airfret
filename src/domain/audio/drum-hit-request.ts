import type { DrumArticulation } from '@domain/drums/drum-articulation';
import type { DrumPiece } from '@domain/drums/drum-piece';

/** One drum or cymbal sound to play. */
export interface DrumHitRequest {
  readonly piece: DrumPiece;
  readonly velocity: number;
  /** 0 centre … 1 edge: drums get brighter and thinner towards the rim. */
  readonly radius: number;
  readonly articulation: DrumArticulation;
  readonly when: number;
}
