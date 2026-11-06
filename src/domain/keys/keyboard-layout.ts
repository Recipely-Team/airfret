import type { PianoKey } from '@domain/keys/piano-key';

/** The keyboard on screen, and the two lines a fingertip presses keys through. */
export interface KeyboardLayout {
  readonly w: number;
  readonly h: number;
  /** White keys first, then black, low to high within each. */
  readonly keys: readonly PianoKey[];
  readonly firstMidi: number;
  readonly lastMidi: number;
  readonly top: number;
  readonly bottom: number;
  /** A fingertip coming down through this line over a black key presses it. */
  readonly blackLine: number;
  /** Below the black keys: coming down through this line presses the white key under it. */
  readonly whiteLine: number;
}
