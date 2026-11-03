import type { Point } from '@domain/fretboard/point';

/** One detected hand: 21 landmarks in mirrored, normalised video space (0–1). */
export interface TrackedHand {
  readonly landmarks: readonly Point[];
}
