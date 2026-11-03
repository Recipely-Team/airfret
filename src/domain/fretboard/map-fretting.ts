import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Fretting } from '@domain/fretboard/fretting';
import { fretAt, onNeck, spreadAt, stringY } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** Fingertips that can fret, with their finger numbers (1 index … 4 pinky). */
const FRETTING_TIPS: readonly [number, number][] = [
  [HandLandmark.indexTip, 1],
  [HandLandmark.middleTip, 2],
  [HandLandmark.ringTip, 3],
  [HandLandmark.pinkyTip, 4],
];
/** A tip stays on its string until another string is this much (of the spacing) closer. */
const STRING_HYSTERESIS = 0.25;
/** Sideways push (fraction of string spacing) before a fretted string starts to bend. */
const BEND_DEAD_ZONE = 0.35;
/** Push (fraction of spacing, past the dead zone) that bends a full `MAX_BEND`. */
const BEND_RANGE = 0.65;
const MAX_BEND = 2;
/** An index finger counts as a barre when it lies across at least this many strings. */
const BARRE_MIN_STRINGS = 3;
/** Joints may sit this far beyond the outer strings (as a multiple of the half-spread). */
const BARRE_SPAN_SLACK = 1.25;
/** Max bend at the DIP joint for a flat finger, radians (~25°). */
const BARRE_MAX_BEND = 0.44;
/** Max horizontal drift per vertical span: the finger must lie along the fret wire. */
const BARRE_MAX_SLANT = 0.35;
const BARRE_EDGE_PX = 4;

/**
 * Maps the fretting hand onto strings and frets, as a real fretboard would.
 *
 * @remarks
 * - Each tip snaps to the nearest string line at its x (with hysteresis against `previous`) and to the fret zone under it.
 * - A string sounds the highest fret pressed on it — the fret nearest the bridge stops the string.
 * - Bend: tension grows with the square of lateral deflection δ, and pitch with tension, so the bend in
 *   semitones is quadratic in δ beyond a dead zone: MAX_BEND · ((|δ| − dz) / range)², clamped.
 * - Barre: a flat index finger lying along the fret across ≥ 3 strings frets all of them (see `barreFret`).
 */
export function mapFretting(l: FretboardLayout, hand: readonly Point[] | null, previous: Fretting | null): Fretting {
  const frets = new Array<number>(l.strings).fill(0);
  const bends = new Array<number>(l.strings).fill(0);
  const presses: { string: number; fret: number; finger: number }[] = [];
  if (!hand) return { frets, bends, presses, barre: 0 };

  const barre = barreFret(l, hand);
  if (barre.fret > 0) barre.strings.forEach((s) => (frets[s] = Math.max(frets[s] ?? 0, barre.fret)));

  for (const [idx, finger] of FRETTING_TIPS) {
    const tip = hand[idx];
    if (!tip || !onNeck(l, tip)) continue;
    const fret = fretAt(l, tip);
    if (fret === 0) continue;
    const prevString = previous?.presses.find((p) => p.finger === finger)?.string;
    const string = nearestString(l, tip, prevString);
    const spacing = (2 * spreadAt(l, tip.x)) / (l.strings - 1);
    const delta = Math.abs(tip.y - stringY(l, string, tip.x)) / spacing;
    const push = Math.max(0, delta - BEND_DEAD_ZONE) / BEND_RANGE;
    if (fret >= (frets[string] ?? 0)) {
      frets[string] = fret;
      bends[string] = Math.min(MAX_BEND, MAX_BEND * push * push);
    }
    presses.push({ string, fret, finger });
  }
  return { frets, bends, presses, barre: barre.fret };
}

function nearestString(l: FretboardLayout, p: Point, previous: number | undefined): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < l.strings; i++) {
    const d = Math.abs(p.y - stringY(l, i, p.x));
    if (d < bestD) [best, bestD] = [i, d];
  }
  if (previous === undefined || previous === best) return best;
  const spacing = (2 * spreadAt(l, p.x)) / (l.strings - 1);
  const prevD = Math.abs(p.y - stringY(l, previous, p.x));
  return prevD - bestD > STRING_HYSTERESIS * spacing ? best : previous;
}

/**
 * A barre is a *flat* index finger: PIP, DIP and tip all lie on the strings, the finger is nearly
 * straight (bend at the DIP under BARRE_MAX_BEND), and it runs along the fret wire rather than
 * along the strings. An arched finger reaching a single string fails the first test — its middle
 * joint sits outside the strings — even though, seen from the front, it passes over them.
 */
function barreFret(l: FretboardLayout, hand: readonly Point[]): { fret: number; strings: number[] } {
  const none = { fret: 0, strings: [] };
  const pip = hand[HandLandmark.indexPip];
  const dip = hand[HandLandmark.indexDip];
  const tip = hand[HandLandmark.indexTip];
  if (!pip || !dip || !tip) return none;
  const onStrings = (p: Point) => onNeck(l, p) && Math.abs(p.y - l.centerY) <= spreadAt(l, p.x) * BARRE_SPAN_SLACK;
  if (!onStrings(pip) || !onStrings(dip) || !onStrings(tip)) return none;
  const a = { x: dip.x - pip.x, y: dip.y - pip.y };
  const b = { x: tip.x - dip.x, y: tip.y - dip.y };
  const bend = Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y) || 1))));
  const span = Math.abs(tip.y - pip.y);
  const isAlongFret = Math.abs(tip.x - pip.x) < span * BARRE_MAX_SLANT;
  if (bend > BARRE_MAX_BEND || !isAlongFret) return none;
  const top = Math.min(pip.y, tip.y);
  const bottom = Math.max(pip.y, tip.y);
  const x = (pip.x + tip.x) / 2;
  const strings = Array.from({ length: l.strings }, (_, i) => i).filter((i) => {
    const y = stringY(l, i, x);
    return y >= top - BARRE_EDGE_PX && y <= bottom + BARRE_EDGE_PX;
  });
  return strings.length >= BARRE_MIN_STRINGS ? { fret: fretAt(l, { x, y: (top + bottom) / 2 }), strings } : none;
}
