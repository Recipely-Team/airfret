import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { onStrumSide } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/**
 * Decides which visible hand frets and which strums.
 *
 * @remarks
 * - Two hands: the one nearer the neck frets (by palm centre).
 * - One hand: whichever side of the screen it's on.
 */
export function assignHands(
  hands: readonly (readonly Point[])[],
  l: FretboardLayout,
): { fret: readonly Point[] | null; strum: readonly Point[] | null } {
  const palmX = (h: readonly Point[]) => h[HandLandmark.middleMcp]?.x ?? 0;
  const [a, b] = [...hands].sort((h1, h2) => palmX(h1) - palmX(h2));
  if (a && b) return l.isLefty ? { fret: b, strum: a } : { fret: a, strum: b };
  const palm = a?.[HandLandmark.middleMcp];
  if (!a || !palm) return { fret: null, strum: null };
  return onStrumSide(l, palm) ? { fret: null, strum: a } : { fret: a, strum: null };
}
