import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Fretting } from '@domain/fretboard/fretting/fretting';
import { spreadAt, stringY } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';

/** Fingertips sit just behind the fret wire, as `paintFingering` draws them. */
const BEHIND_FRET = 0.72;
const LANDMARKS = 21;
const FINGERS = 4;
/** Fretting hand, in string spacings: knuckles below the treble string, wrist further down. */
const Fret = { knuckles: 1.6, wrist: 4.2, wristBack: 1, hover: 0.45, arch: 0.25 } as const;
/** Strumming hand, in string spacings from the pick (the index tip): where the wrist is, how wide the palm. */
const Strum = { wristAlong: 2.2, wristDown: 4.2, palm: 0.6 } as const;

const lerp = (a: Point, b: Point, k: number): Point => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
const add = (a: Point, b: Point, k = 1): Point => ({ x: a.x + b.x * k, y: a.y + b.y * k });

/** Screen x where a finger stops `fret`: just behind its wire. */
function fretFingerX(l: FretboardLayout, fret: number): number {
  const f = Math.max(1, Math.min(l.maxFret, fret));
  const a = l.fretX[f - 1] ?? l.nutX;
  const b = l.fretX[f] ?? a;
  return a + (b - a) * BEHIND_FRET;
}

/**
 * A fretting hand holding `fretting`, as the tracker's 21 landmarks — so the stage can show the hand that
 * plays by itself the way it shows a real one.
 *
 * @remarks
 * - Fingers come from below the neck, one per fret from the lowest stopped fret, like a real hand in position.
 * - A finger on one string arches onto it; a finger on several lies flat across them, tip on the lowest.
 * - Fingers with nothing to hold hover just below the treble string.
 */
export function ghostFretHand(l: FretboardLayout, fretting: Fretting | null, capo: number): Point[] {
  const dir = l.isLefty ? -1 : 1;
  const presses = fretting?.presses ?? [];
  const base = presses.length ? Math.min(...presses.map((p) => p.fret)) : capo + 1;
  const x0 = fretFingerX(l, base);
  const spacing = (2 * spreadAt(l, x0)) / Math.max(1, l.strings - 1);
  const bottom = stringY(l, l.strings - 1, x0);
  const pts: Point[] = new Array<Point>(LANDMARKS).fill({ x: x0, y: bottom });
  const knuckles: Point[] = [];
  for (let k = 1; k <= FINGERS; k++) {
    const own = presses.filter((p) => p.finger === k);
    const fret = own[0]?.fret ?? base + k - 1;
    const x = fretFingerX(l, fret);
    const mcp = { x: x + dir * spacing * 0.3, y: bottom + spacing * Fret.knuckles };
    const top = own.length ? Math.min(...own.map((p) => p.string)) : null;
    const tip = top === null ? { x, y: bottom + spacing * Fret.hover } : { x, y: stringY(l, top, x) };
    const arch = own.length === 1 ? -dir * spacing * Fret.arch : 0;
    const j = 1 + 4 * k;
    pts[j] = mcp;
    pts[j + 1] = add(lerp(mcp, tip, 0.45), { x: arch, y: 0 });
    pts[j + 2] = add(lerp(mcp, tip, 0.75), { x: arch * 0.6, y: 0 });
    pts[j + 3] = tip;
    knuckles.push(mcp);
  }
  const mid = knuckles.reduce((s, p) => s + p.x, 0) / knuckles.length;
  const wrist = { x: mid + dir * spacing * Fret.wristBack, y: bottom + spacing * Fret.wrist };
  const index = knuckles[0] ?? wrist;
  pts[0] = wrist;
  pts[1] = lerp(wrist, index, 0.3);
  pts[2] = add(lerp(wrist, index, 0.55), { x: -dir * spacing * 0.8, y: 0 });
  pts[3] = add(lerp(wrist, index, 0.75), { x: -dir * spacing * 1.2, y: 0 });
  pts[4] = add(index, { x: -dir * spacing * 1.4, y: spacing * 0.2 });
  return pts;
}

/**
 * A strumming hand holding the pick at `tip` (its index fingertip): index pointing at the strings, the other
 * fingers curled into the palm, the thumb pinching the pick against the index.
 */
export function ghostStrumHand(l: FretboardLayout, tip: Point): Point[] {
  const dir = l.isLefty ? -1 : 1;
  const spacing = (2 * l.spreadBody) / Math.max(1, l.strings - 1);
  const wrist = { x: tip.x + dir * spacing * Strum.wristAlong, y: tip.y + spacing * Strum.wristDown };
  const v = { x: tip.x - wrist.x, y: tip.y - wrist.y };
  const len = Math.hypot(v.x, v.y) || 1;
  // Across the palm, towards the little finger (away from the neck).
  const n = { x: (-v.y / len) * spacing * Strum.palm * -dir, y: (v.x / len) * spacing * Strum.palm * -dir };
  const pts: Point[] = new Array<Point>(LANDMARKS).fill(wrist);
  pts[0] = wrist;
  const indexMcp = add(wrist, v, 0.55);
  pts[5] = indexMcp;
  pts[6] = add(wrist, v, 0.72);
  pts[7] = add(wrist, v, 0.86);
  pts[8] = tip;
  for (let k = 2; k <= FINGERS; k++) {
    const mcp = add(add(wrist, v, 0.53 - 0.03 * k), n, k - 1);
    const j = 1 + 4 * k;
    pts[j] = mcp;
    pts[j + 1] = add(mcp, v, 0.16);
    pts[j + 2] = add(add(mcp, v, 0.1), n, 0.4);
    pts[j + 3] = add(add(mcp, v, 0.02), n, 0.3);
  }
  pts[1] = add(add(wrist, v, 0.2), n, -0.6);
  pts[2] = add(add(wrist, v, 0.4), n, -0.9);
  pts[3] = add(add(wrist, v, 0.62), n, -0.8);
  pts[4] = add(add(wrist, v, 0.82), n, -0.35);
  return pts;
}
