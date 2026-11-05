import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { findBarres } from '@domain/fretboard/fretting/find-barres';
import type { Fretting } from '@domain/fretboard/fretting/fretting';
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
/**
 * Maps the fretting hand onto strings and frets, as a real fretboard would.
 *
 * @remarks
 * - Each tip snaps to the nearest string line at its x (with hysteresis against `previous`) and to the fret zone under it.
 * - A string sounds the highest fret pressed on it — the fret nearest the bridge stops the string.
 * - Bend: tension grows with the square of lateral deflection δ, and pitch with tension, so the bend in
 *   semitones is quadratic in δ beyond a dead zone: MAX_BEND · ((|δ| − dz) / range)², clamped.
 * - Barre: any finger laid flat along a fret holds down every string from its tip to the edge of the neck (see
 *   `findBarres`); each string it holds is a press of that finger, so a sliding barre slides every string.
 */
export function mapFretting(l: FretboardLayout, hand: readonly Point[] | null, previous: Fretting | null): Fretting {
  const frets = new Array<number>(l.strings).fill(0);
  const bends = new Array<number>(l.strings).fill(0);
  const presses: { string: number; fret: number; finger: number }[] = [];
  if (!hand) return { frets, bends, presses, barre: 0 };

  const barres = findBarres(l, hand);
  for (const b of barres) {
    for (const string of b.strings) {
      frets[string] = Math.max(frets[string] ?? 0, b.fret);
      presses.push({ string, fret: b.fret, finger: b.finger });
    }
  }

  for (const [idx, finger] of FRETTING_TIPS) {
    if (barres.some((b) => b.finger === finger)) continue;
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
  return { frets, bends, presses, barre: barres[0]?.fret ?? 0 };
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
