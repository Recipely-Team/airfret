import type { Barre } from '@domain/fretboard/fretting/barre';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { fretAt, onNeck, spreadAt, stringY } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** Each fretting finger's joints, knuckle → tip, with its finger number (1 index … 4 pinky). */
const FINGERS: readonly { finger: number; joints: readonly [number, number, number, number] }[] = [
  { finger: 1, joints: [HandLandmark.indexMcp, HandLandmark.indexPip, HandLandmark.indexDip, HandLandmark.indexTip] },
  { finger: 2, joints: [HandLandmark.middleMcp, HandLandmark.middlePip, HandLandmark.middleDip, HandLandmark.middleTip] },
  { finger: 3, joints: [HandLandmark.ringMcp, HandLandmark.ringPip, HandLandmark.ringDip, HandLandmark.ringTip] },
  { finger: 4, joints: [HandLandmark.pinkyMcp, HandLandmark.pinkyPip, HandLandmark.pinkyDip, HandLandmark.pinkyTip] },
];
/** A barre lies across at least this many strings (two: the small F barre on B and e). */
const BARRE_MIN_STRINGS = 2;
/** Joints may sit this far from the centre line (as a multiple of the half-spread): a barring tip overhangs the outer string. */
const BARRE_SPAN_SLACK = 1.5;
/** Max bend at the DIP joint for a flat finger, radians (~25°). */
const BARRE_MAX_DIP_BEND = 0.44;
/** Max bend at the PIP joint, radians (~35°): a hooked finger with a straight last segment isn't flat. */
const BARRE_MAX_PIP_BEND = 0.6;
/** Max sideways drift per unit across the strings (~27°): the finger lies along the fret wire, often slightly rolled. */
const BARRE_MAX_SLANT = 0.5;

/**
 * Fingers laid flat across a fret, read from each finger's angle.
 *
 * @remarks
 * - Flat: tip, DIP and PIP all over the strings, the finger nearly straight at both joints, and its last two
 *   segments running across the strings (along the fret wire) rather than along them.
 * - A flat finger holds down every string from its tip towards its knuckle, to the edge of the neck — on a
 *   real guitar a finger is longer than the neck is wide, and the camera may show the hand smaller than the
 *   neck drawn over it, so where the knuckle lands on screen says nothing about how far the finger reaches.
 *   Tip on the low E → full barre; tip on the D → partial barre over D, G, B, e.
 * - An arched finger reaching one string fails the first test — its middle joint sits outside the strings —
 *   even though, seen from the front, it passes over them.
 */
export function findBarres(l: FretboardLayout, hand: readonly Point[]): Barre[] {
  const barres: Barre[] = [];
  for (const { finger, joints } of FINGERS) {
    const [mcp, pip, dip, tip] = joints.map((j) => hand[j]);
    if (!mcp || !pip || !dip || !tip) continue;
    const barre = flatAcross(l, mcp, pip, dip, tip);
    if (barre) barres.push({ finger, ...barre });
  }
  return barres;
}

function flatAcross(l: FretboardLayout, mcp: Point, pip: Point, dip: Point, tip: Point): { fret: number; strings: number[] } | null {
  const onStrings = (p: Point) => onNeck(l, p) && Math.abs(p.y - l.centerY) <= spreadAt(l, p.x) * BARRE_SPAN_SLACK;
  if (!onStrings(pip) || !onStrings(dip) || !onStrings(tip)) return null;
  if (bendAt(pip, dip, tip) > BARRE_MAX_DIP_BEND || bendAt(mcp, pip, dip) > BARRE_MAX_PIP_BEND) return null;
  const across = tip.y - pip.y;
  if (Math.abs(tip.x - pip.x) >= Math.abs(across) * BARRE_MAX_SLANT) return null;
  const x = (pip.x + tip.x) / 2;
  const fret = fretAt(l, { x, y: (pip.y + tip.y) / 2 });
  if (fret === 0) return null;
  const first = nearestStringAt(l, tip.y, x);
  // The knuckle is below the tip on screen when `across` < 0: the finger runs towards the higher strings.
  const strings = across < 0 ? range(first, l.strings - 1) : range(0, first);
  return strings.length >= BARRE_MIN_STRINGS ? { fret, strings } : null;
}

/** Angle between segments a→b and b→c, radians (0 = straight). */
function bendAt(a: Point, b: Point, c: Point): number {
  const u = { x: b.x - a.x, y: b.y - a.y };
  const v = { x: c.x - b.x, y: c.y - b.y };
  const cos = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) || 1);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

function nearestStringAt(l: FretboardLayout, y: number, x: number): number {
  let best = 0;
  for (let i = 1; i < l.strings; i++) if (Math.abs(y - stringY(l, i, x)) < Math.abs(y - stringY(l, best, x))) best = i;
  return best;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
