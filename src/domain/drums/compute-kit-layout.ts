import type { DrumPad } from '@domain/drums/drum-pad';
import { DrumPiece } from '@domain/drums/drum-piece';

/**
 * Pad positions as fractions of the screen, seen from the drummer's seat (the mirrored camera
 * view): hi-hat and crash on the left, snare in front, toms across the middle, floor tom and ride
 * on the right, kick at the bottom centre (played with the foot).
 */
const PADS: readonly [DrumPiece, number, number, number, boolean][] = [
  [DrumPiece.crash, 0.2, 0.32, 0.12, true],
  [DrumPiece.hihat, 0.17, 0.55, 0.1, true],
  [DrumPiece.snare, 0.37, 0.66, 0.1, false],
  [DrumPiece.tom1, 0.42, 0.42, 0.075, false],
  [DrumPiece.tom2, 0.58, 0.42, 0.08, false],
  [DrumPiece.floor, 0.66, 0.7, 0.11, false],
  [DrumPiece.ride, 0.82, 0.4, 0.13, true],
  [DrumPiece.kick, 0.5, 0.84, 0.14, false],
];
/** Heads are seen from above at an angle: vertical radius = this × horizontal. */
const PERSPECTIVE = { drum: 0.42, cymbal: 0.26 } as const;

/** Places the kit on a screen of w × h; mirrored for left-handed drummers. */
export function computeKitLayout(w: number, h: number, isLefty: boolean): DrumPad[] {
  const unit = Math.min(w, h * 1.6);
  return PADS.map(([piece, fx, fy, fr, isCymbal]) => {
    const rx = unit * fr;
    return {
      piece,
      cx: (isLefty ? 1 - fx : fx) * w,
      cy: fy * h,
      rx,
      ry: rx * (isCymbal ? PERSPECTIVE.cymbal : PERSPECTIVE.drum),
      isCymbal,
    };
  });
}
