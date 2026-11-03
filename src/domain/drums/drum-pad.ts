import type { DrumPiece } from '@domain/drums/drum-piece';

/** A drum head or cymbal on screen: an ellipse (the head seen at an angle). */
export interface DrumPad {
  readonly piece: DrumPiece;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  /** Cymbals are struck on their surface, drums on the head; cymbals sit higher. */
  readonly isCymbal: boolean;
}
