import type { DrumPiece } from '@domain/drums/drum-piece';

/** One stroke landing on a pad. */
export interface DrumHit {
  readonly piece: DrumPiece;
  /** 0–1 from the tip's downward speed. */
  readonly velocity: number;
  /** Distance from the pad centre, 0 = centre, 1 = rim/edge. */
  readonly radius: number;
  /** 0–1: where within the last frame the head was crossed. */
  readonly frac: number;
}
