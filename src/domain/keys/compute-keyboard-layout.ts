import type { Point } from '@domain/fretboard/point';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import type { PianoKey } from '@domain/keys/piano-key';

/** Semitones above C of the white keys, and which whites have a black key after them (C, D, F, G, A). */
const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const HAS_SHARP = [true, true, false, true, true, true, false];
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

/** The keyboard for a screen: as many octaves as fit comfortably, centred, in the lower half. */
export function computeKeyboardLayout(w: number, h: number): KeyboardLayout {
  const range = RANGES.find((r) => w >= r.minWidth) ?? RANGES[RANGES.length - 1];
  const whites = range?.whites ?? 10;
  const firstMidi: number = range?.firstMidi ?? 60;
  const span = w * SPAN_OF_WIDTH;
  const whiteW = span / whites;
  const left = (w - span) / 2;
  const top = h * TOP_OF_HEIGHT;
  const whiteH = Math.min(h * MAX_HEIGHT_OF_SCREEN, whiteW * KEY_ASPECT);
  const blackH = whiteH * BLACK.height;
  const keys: PianoKey[] = [];
  const blacks: PianoKey[] = [];
  let lastMidi: number = firstMidi;
  for (let i = 0; i < whites; i++) {
    const octave = Math.floor(i / WHITE_STEPS.length);
    const step = i % WHITE_STEPS.length;
    const midi = firstMidi + octave * OCTAVE + (WHITE_STEPS[step] ?? 0);
    const x0 = left + i * whiteW;
    keys.push({ midi, isBlack: false, x0, x1: x0 + whiteW, y0: top, y1: top + whiteH });
    lastMidi = midi;
    if (HAS_SHARP[step] && i < whites - 1) {
      const cx = x0 + whiteW;
      blacks.push({ midi: midi + 1, isBlack: true, x0: cx - (whiteW * BLACK.width) / 2, x1: cx + (whiteW * BLACK.width) / 2, y0: top, y1: top + blackH });
    }
  }
  return {
    w, h, keys: [...keys, ...blacks], firstMidi, lastMidi, top, bottom: top + whiteH,
    blackLine: top + blackH * LINES.black, whiteLine: top + whiteH * LINES.white,
  };
}

/** The key under a point — a black key wins where it lies over a white — or null off the keyboard. */
export function keyAt(l: KeyboardLayout, p: Point): PianoKey | null {
  const inside = (k: PianoKey) => p.x >= k.x0 && p.x < k.x1 && p.y >= k.y0 && p.y <= k.y1;
  return l.keys.find((k) => k.isBlack && inside(k)) ?? l.keys.find((k) => !k.isBlack && inside(k)) ?? null;
}
