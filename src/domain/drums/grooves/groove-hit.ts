import type { DrumArticulation } from '@domain/drums/drum-articulation';
import type { DrumPiece } from '@domain/drums/drum-piece';

/** One hit of a groove, at a beat from its start. */
export interface GrooveHit {
  readonly beat: number;
  readonly piece: DrumPiece;
  readonly velocity: number;
  readonly articulation: DrumArticulation;
}
