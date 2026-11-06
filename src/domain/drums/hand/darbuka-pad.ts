import type { DrumPad } from '@domain/drums/drum-pad';
import { DrumPiece } from '@domain/drums/drum-piece';

/** The head fills this much of the screen: wide enough for two hands, seen a little from above. */
const HEAD = { cxOfWidth: 0.5, cyOfHeight: 0.62, rOfWidth: 0.26, rOfHeight: 0.36, flatten: 0.55 } as const;
/** Strikes nearer the rim than this (share of the radius) are edge strokes: tek or ka. */
export const DARBUKA_EDGE = 0.62;

/** The darbuka's head on screen: one drum, held across the lap, its head an ellipse seen from above. */
export function darbukaPad(w: number, h: number): DrumPad {
  const rx = Math.min(w * HEAD.rOfWidth, h * HEAD.rOfHeight);
  return { piece: DrumPiece.doum, cx: w * HEAD.cxOfWidth, cy: h * HEAD.cyOfHeight, rx, ry: rx * HEAD.flatten, isCymbal: false };
}

/**
 * Which stroke a strike makes: the middle of the head sounds düm, the edge tek with the right hand and ka with
 * the left (the usual Turkish and Arabic hand roles), `radius` 0 at the centre to 1 at the rim.
 */
export function darbukaStroke(radius: number, isRightHand: boolean): DrumPiece {
  if (radius < DARBUKA_EDGE) return DrumPiece.doum;
  return isRightHand ? DrumPiece.tek : DrumPiece.ka;
}
