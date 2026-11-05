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
const BEND_RANGE = 0.4;
const MAX_BEND = 2;
/** A fingertip presses only this close to a string (in spacings); beyond the outer strings it is resting off the neck. */
const PRESS_REACH = 0.6;
/**
 * A string being bent stays under its finger this far (in spacings) — a whole step is reached at 0.75 — until the
 * tip comes within 0.2 of the next string: then it has moved there, not bent.
 */
const BEND_HOLD = 0.8;
/** A tip on a wire, or just past it (share of the next fret's width), still stops the string at the fret behind it. */
const WIRE_GRACE = 0.1;
/** A tip keeps its fret until it is this far past the wire (share of the new fret's width): no flicker at the boundary. */
const FRET_HYSTERESIS = 0.2;
/** One fingertip's press before the hand is put together. */
interface TipPress {
  string: number;
  fret: number;
  finger: number;
  /** Signed distance from the string, in spacings. */
  offset: number;
  bend: number;
}

/**
 * Maps the fretting hand onto strings and frets, as a real fretboard would.
 *
 * @remarks
 * - Each tip snaps to the nearest string line at its x (with hysteresis against `previous`) and to the fret zone under
 *   it; only a tip within `PRESS_REACH` of a string presses — a finger resting below the neck doesn't.
 * - Frets: a tip on the wire stops the fret behind it, and a tip keeps its fret until clearly past the wire, so a
 *   finger placed just behind the wire (good technique) doesn't flicker between two frets.
 * - A string sounds the highest fret pressed on it — the fret nearest the bridge stops the string.
 * - Bend: tension grows with the square of lateral deflection δ, and pitch with tension, so the bend in
 *   semitones is quadratic in δ beyond a dead zone: MAX_BEND · ((|δ| − dz) / range)², clamped. A string being
 *   bent stays with its finger up to `BEND_HOLD` spacings, so a whole-step bend doesn't jump to the next string;
 *   a tip that reaches the next string has moved there.
 * - Two fingers can't stop one string on one fret: when tracking puts them there (crowded shapes like A), the one
 *   further off moves to the free neighbouring string on its side.
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

  const tips: TipPress[] = [];
  for (const [idx, finger] of FRETTING_TIPS) {
    if (barres.some((b) => b.finger === finger)) continue;
    const tip = hand[idx];
    if (!tip || !onNeck(l, tip)) continue;
    const before = previous?.presses.find((p) => p.finger === finger);
    const fret = fretWithGrace(l, tip, before?.fret);
    if (fret === 0) continue;
    const spacing = (2 * spreadAt(l, tip.x)) / (l.strings - 1);
    const offsetFrom = (s: number) => (tip.y - stringY(l, s, tip.x)) / spacing;
    const isBending = before !== undefined && before.fret === fret && Math.abs(offsetFrom(before.string)) <= BEND_HOLD;
    const string = isBending ? before.string : nearestString(l, tip, before?.string);
    const offset = offsetFrom(string);
    if (!isBending && Math.abs(offset) > PRESS_REACH) continue;
    const push = Math.max(0, Math.abs(offset) - BEND_DEAD_ZONE) / BEND_RANGE;
    tips.push({ string, fret, finger, offset, bend: Math.min(MAX_BEND, MAX_BEND * push * push) });
  }
  separateCrowded(tips, l.strings);
  for (const t of tips) {
    if (t.fret >= (frets[t.string] ?? 0)) {
      frets[t.string] = t.fret;
      bends[t.string] = t.bend;
    }
    presses.push({ string: t.string, fret: t.fret, finger: t.finger });
  }
  return { frets, bends, presses, barre: barres[0]?.fret ?? 0 };
}

/** The fret under a tip, counting the wire (and a little past it) as the fret behind, and holding `previous` near the boundary. */
function fretWithGrace(l: FretboardLayout, tip: Point, previous: number | undefined): number {
  const raw = fretAt(l, tip);
  if (raw === 0) return 0;
  const a = l.fretX[raw - 1] ?? l.nutX;
  const b = l.fretX[raw] ?? a;
  const k = b === a ? 0.5 : (tip.x - a) / (b - a);
  if (previous === raw + 1 && k > 1 - FRET_HYSTERESIS) return previous;
  if (raw > 1 && (k < WIRE_GRACE || (previous === raw - 1 && k < FRET_HYSTERESIS))) return raw - 1;
  return raw;
}

/** Two tips on one string and fret: the one further off the string moves to the free neighbour on its side. */
function separateCrowded(tips: TipPress[], strings: number): void {
  for (const a of tips) {
    for (const b of tips) {
      if (a === b || a.string !== b.string || a.fret !== b.fret) continue;
      const off = Math.abs(a.offset) >= Math.abs(b.offset) ? a : b;
      const to = off.string + Math.sign(off.offset);
      if (to < 0 || to >= strings || tips.some((t) => t.string === to)) continue;
      off.offset -= Math.sign(off.offset);
      off.string = to;
      off.bend = 0;
    }
  }
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
