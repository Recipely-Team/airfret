import type { Point } from '@domain/fretboard/point';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import type { PianoKey } from '@domain/keys/piano-key';

/** Pitch classes that are black keys: C#, D#, F#, G#, A#. */
const BLACK_CLASSES = new Set([1, 3, 6, 8, 10]);
/** The piano's own range, A0 to C8: the keyboard can be slid along it but never past it. */
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

const isBlack = (midi: number) => BLACK_CLASSES.has(((midi % OCTAVE) + OCTAVE) % OCTAVE);
const nextWhite = (midi: number) => (isBlack(midi + 1) ? midi + 2 : midi + 1);

/**
 * The keyboard for a screen: as many octaves as fit comfortably, centred, in the lower half — slid `shift`
 * octaves from its home (C3, or C4 on a phone), but always within the piano's 88 keys (A0 at the far left).
 */
export function computeKeyboardLayout(w: number, h: number, shift = 0): KeyboardLayout {
  const range = RANGES.find((r) => w >= r.minWidth) ?? RANGES[RANGES.length - 1];
  const whites = range?.whites ?? 10;
  const firstMidi = keyboardStart(range?.firstMidi ?? 60, whites, shift);
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
function keyboardStart(home: number, whites: number, shift: number): number {
  let lastStart = PIANO_RANGE.high;
  for (let n = 1; n < whites; ) {
    lastStart -= isBlack(lastStart - 1) ? 2 : 1;
    n++;
  }
  const wanted = home + shift * OCTAVE;
  return Math.max(PIANO_RANGE.low, Math.min(wanted, lastStart));
}

/** How far the keyboard can slide each way from home, in octaves, so the player's buttons know when to stop. */
export function shiftLimits(w: number): { down: number; up: number } {
  const range = RANGES.find((r) => w >= r.minWidth) ?? RANGES[RANGES.length - 1];
  const home = range?.firstMidi ?? 60;
  const whites = range?.whites ?? 10;
  const top = keyboardStart(home, whites, 99);
  return { down: -Math.ceil((home - PIANO_RANGE.low) / OCTAVE), up: Math.ceil((top - home) / OCTAVE) };
}

/** The key under a point — a black key wins where it lies over a white — or null off the keyboard. */
export function keyAt(l: KeyboardLayout, p: Point): PianoKey | null {
  const inside = (k: PianoKey) => p.x >= k.x0 && p.x < k.x1 && p.y >= k.y0 && p.y <= k.y1;
  return l.keys.find((k) => k.isBlack && inside(k)) ?? l.keys.find((k) => !k.isBlack && inside(k)) ?? null;
}
