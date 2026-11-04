import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { GuitarLook } from '@presentation/canvas/guitar/guitar-look';

/** Where the body sits, derived from the playable layout so strings, bridge and hole line up. */
export interface BodyGeometry {
  /** Neck joint x (body starts here). */
  readonly x0: number;
  readonly length: number;
  readonly width: number;
  readonly cy: number;
  /** Soundhole (acoustic) or neck pickup (electric) centre x. */
  readonly holeX: number;
  readonly holeR: number;
  /** Where the fingerboard ends over the body. */
  readonly boardEnd: number;
}

/** Fraction of body length from the joint to the bridge, per style (dreadnought ≈ 0.66). */
const BRIDGE_AT = { acoustic: 0.66, classical: 0.66, electric: 0.56, bass: 0.6, banjo: 0.72 } as const;
/** A banjo pot is round: as wide as it is long. */
const WIDTH_OF_LENGTH = { acoustic: 0.8, classical: 0.76, electric: 0.7, bass: 0.72, banjo: 1 } as const;
const MAX_WIDTH_OF_HEIGHT = 0.92;
/** How far a banjo's fingerboard reaches onto the head, as a fraction of the pot. */
const BANJO_BOARD_OVER_HEAD = 0.22;
/** The pot stays on screen with this fraction of the width to spare (the tailpiece is past the bridge). */
const EDGE_MARGIN = 0.01;

export function bodyGeometry(l: FretboardLayout, look: GuitarLook): BodyGeometry {
  const x0 = l.neckEndX - l.w * 0.01;
  const length = (l.strumX1 - x0) / BRIDGE_AT[look.style];
  const width = Math.min(length * WIDTH_OF_LENGTH[look.style], l.h * MAX_WIDTH_OF_HEIGHT);
  // A round pot keeps its shape: when the screen caps its width, its length shrinks to match.
  // The bridge stays where the strings end, so a smaller pot slides towards it; the neck runs on over the head.
  if (look.style === 'banjo') {
    const d = Math.min(length, width, (l.w * (1 - EDGE_MARGIN) - l.strumX1) / (1 - BRIDGE_AT.banjo));
    const start = l.strumX1 - d * BRIDGE_AT.banjo;
    return { x0: start, length: d, width: d, cy: l.centerY, holeX: start + d / 2, holeR: d / 2, boardEnd: Math.max(x0, start + d * BANJO_BOARD_OVER_HEAD) };
  }
  const isHollow = look.style === 'acoustic' || look.style === 'classical';
  const holeX = x0 + length * (isHollow ? 0.3 : 0.2);
  const holeR = length * 0.085;
  const boardEnd = isHollow ? holeX - holeR - length * 0.012 : x0 + length * 0.1;
  return { x0, length, width, cy: l.centerY, holeX, holeR, boardEnd };
}
