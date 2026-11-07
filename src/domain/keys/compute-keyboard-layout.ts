import type { Point } from '@domain/fretboard/point';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import type { PianoKey } from '@domain/keys/piano-key';

/** Pitch classes that are black keys: C#, D#, F#, G#, A#. */
const BLACK_CLASSES = new Set([1, 3, 6, 8, 10]);
/** The piano's own range, A0 to C8: the keyboard can be slid along it but never past it. Others pass theirs. */
const PIANO_RANGE = { low: 21, high: 108 } as const;
/** How many white keys fit: wide screens get three octaves, tablets two, upright phones a bit over one. */
const RANGES = [
  { minWidth: 1100, whites: 22, firstMidi: 48 },
  { minWidth: 700, whites: 15, firstMidi: 48 },
  { minWidth: 0, whites: 10, firstMidi: 60 },
] as const;
const SPAN_OF_WIDTH = 0.94;
const TOP_OF_HEIGHT = 0.46;
const MAX_HEIGHT_OF_SCREEN = 0.38;
/** A real white key is about six times as long as it is wide. */
const KEY_ASPECT = 6;
const BLACK = { width: 0.58, height: 0.62 } as const;
/** Where the press lines run: halfway down the black keys, and below their ends on the whites. */
const LINES = { black: 0.5, white: 0.76 } as const;
const OCTAVE = 12;

/** A keyboard's lowest and highest key; an instrument with a `body` lays its notes out in one even row. */
interface KeyRange {
  readonly low: number;
  readonly high: number;
  readonly body?: string;
}
/** A row of notes holds about as many as the white and black keys of the same width would. */
const NOTES_PER_WHITE = 12 / 7;
const ROW_HEIGHT_OF_SCREEN = 0.3;

const isBlack = (midi: number) => BLACK_CLASSES.has(((midi % OCTAVE) + OCTAVE) % OCTAVE);
const nextWhite = (midi: number) => (isBlack(midi + 1) ? midi + 2 : midi + 1);
const whiteCount = (r: KeyRange) => Array.from({ length: r.high - r.low + 1 }, (_, i) => r.low + i).filter((m) => !isBlack(m)).length;

/**
 * The keyboard for a screen: as many octaves as fit comfortably, centred, in the lower half — slid `shift`
 * octaves from its home (C3, or C4 on a phone), but always within the piano's 88 keys (A0 at the far left).
 */
export function computeKeyboardLayout(w: number, h: number, shift = 0, range: KeyRange = PIANO_RANGE): KeyboardLayout {
  const fit = RANGES.find((r) => w >= r.minWidth) ?? RANGES[RANGES.length - 1];
  if (range.body) return rowLayout(w, h, shift, range, fit?.whites ?? 10, fit?.firstMidi ?? 60);
  const whites = Math.min(fit?.whites ?? 10, whiteCount(range));
  const firstMidi = keyboardStart(fit?.firstMidi ?? 60, whites, shift, range);
  const span = w * SPAN_OF_WIDTH;
  const whiteW = span / whites;
  const left = (w - span) / 2;
  const top = h * TOP_OF_HEIGHT;
  const whiteH = Math.min(h * MAX_HEIGHT_OF_SCREEN, whiteW * KEY_ASPECT);
  const blackH = whiteH * BLACK.height;
  const keys: PianoKey[] = [];
  const blacks: PianoKey[] = [];
  let lastMidi: number = firstMidi;
  let midi = firstMidi;
  for (let i = 0; i < whites; i++, midi = nextWhite(midi)) {
    const x0 = left + i * whiteW;
    keys.push({ midi, isBlack: false, x0, x1: x0 + whiteW, y0: top, y1: top + whiteH });
    lastMidi = midi;
    if (isBlack(midi + 1) && i < whites - 1) {
      const cx = x0 + whiteW;
      blacks.push({ midi: midi + 1, isBlack: true, x0: cx - (whiteW * BLACK.width) / 2, x1: cx + (whiteW * BLACK.width) / 2, y0: top, y1: top + blackH });
    }
  }
  return {
    w, h, keys: [...keys, ...blacks], firstMidi, lastMidi, top, bottom: top + whiteH,
    blackLine: top + blackH * LINES.black, whiteLine: top + whiteH * LINES.white,
  };
}

/** The first white key: the home start moved by whole octaves, kept inside A0–C8 with every white key on the piano. */
function keyboardStart(home: number, whites: number, shift: number, range: KeyRange): number {
  let lastStart = range.high;
  for (let n = 1; n < whites; ) {
    lastStart -= isBlack(lastStart - 1) ? 2 : 1;
    n++;
  }
  const wanted = home + shift * OCTAVE;
  // The lowest key may be black (a harpsichord's F1 is white, a piano's A0 too): start on the first white.
  const low = isBlack(range.low) ? range.low + 1 : range.low;
  return Math.max(low, Math.min(wanted, lastStart));
}

/** Notes in one even row along an instrument (a kanun, a ney), slid `shift` octaves within its range. */
function rowLayout(w: number, h: number, shift: number, range: KeyRange, whites: number, home: number): KeyboardLayout {
  const count = rowCount(whites, range);
  const firstMidi = rowStart(home, count, shift, range);
  const span = w * SPAN_OF_WIDTH;
  const colW = span / count;
  const left = (w - span) / 2;
  const top = h * TOP_OF_HEIGHT;
  const rowH = h * ROW_HEIGHT_OF_SCREEN;
  const keys: PianoKey[] = Array.from({ length: count }, (_, i) => ({ midi: firstMidi + i, isBlack: false, x0: left + i * colW, x1: left + (i + 1) * colW, y0: top, y1: top + rowH }));
  return { w, h, keys, firstMidi, lastMidi: firstMidi + count - 1, top, bottom: top + rowH, blackLine: top + rowH * LINES.black, whiteLine: top + rowH * LINES.black };
}

const rowCount = (whites: number, range: KeyRange) => Math.min(Math.round(whites * NOTES_PER_WHITE), range.high - range.low + 1);
const rowStart = (home: number, count: number, shift: number, range: KeyRange) => Math.max(range.low, Math.min(home + shift * OCTAVE, range.high - count + 1));

/** How far the keyboard can slide each way from home, in octaves, so the player's buttons know when to stop. */
export function shiftLimits(w: number, range: KeyRange = PIANO_RANGE): { down: number; up: number } {
  const fit = RANGES.find((r) => w >= r.minWidth) ?? RANGES[RANGES.length - 1];
  const home = fit?.firstMidi ?? 60;
  if (range.body) {
    const count = rowCount(fit?.whites ?? 10, range);
    return { down: -Math.ceil((home - rowStart(home, count, -99, range)) / OCTAVE), up: Math.ceil((rowStart(home, count, 99, range) - home) / OCTAVE) };
  }
  const whites = Math.min(fit?.whites ?? 10, whiteCount(range));
  const top = keyboardStart(home, whites, 99, range);
  const bottom = keyboardStart(home, whites, -99, range);
  return { down: -Math.ceil((home - bottom) / OCTAVE), up: Math.ceil((top - home) / OCTAVE) };
}

/** The key under a point — a black key wins where it lies over a white — or null off the keyboard. */
export function keyAt(l: KeyboardLayout, p: Point): PianoKey | null {
  const inside = (k: PianoKey) => p.x >= k.x0 && p.x < k.x1 && p.y >= k.y0 && p.y <= k.y1;
  return l.keys.find((k) => k.isBlack && inside(k)) ?? l.keys.find((k) => !k.isBlack && inside(k)) ?? null;
}
