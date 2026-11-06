/**
 * **FretboardLayout** — where the virtual instrument sits on screen.
 *
 * @remarks
 * - Right-handed players see a mirror: the neck runs from the left edge, strumming happens on the right.
 * - Lefty layouts are mirrored, so `nutX > neckEndX` there.
 */
export interface FretboardLayout {
  readonly w: number;
  readonly h: number;
  readonly isLefty: boolean;
  readonly strings: number;
  readonly nutX: number;
  readonly neckEndX: number;
  readonly strumX0: number;
  readonly strumX1: number;
  readonly centerY: number;
  /** Half the distance between the outer strings at the nut and at the body. */
  readonly spreadNut: number;
  readonly spreadBody: number;
  /** x of each fret wire; index 0 is the nut. */
  readonly fretX: readonly number[];
  readonly maxFret: number;
  /** Pitch of each fret above the open string, in semitones (0, 1, 2… on a guitar; a saz has in-between frets). */
  readonly fretSemis: readonly number[];
  /** The fret table it was built from (one octave, cents), when it isn't twelve equal semitones. */
  readonly octaveCents?: readonly number[];
}
