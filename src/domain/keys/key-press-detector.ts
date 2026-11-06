import type { Point } from '@domain/fretboard/point';
import { keyAt } from '@domain/keys/compute-keyboard-layout';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import type { KeyPress } from '@domain/keys/key-press';

const DEFAULTS = {
  /** Slower than this (screen heights per second) a fingertip is drifting, not pressing. */
  minSpeed: 0.12,
  /** Speed that plays at full strength. */
  fullSpeed: 1.6,
  /** The weakest press still sounds this loud. */
  floor: 0.15,
  /** The key comes up once the fingertip rises this far (share of the key length) above the line it pressed. */
  lift: 0.08,
  /** A fingertip lost by tracking for longer than this lets its key go, seconds. */
  dropout: 0.2,
} as const;

/** A glissando's keys sound a little softer than the stroke that started it. */
const GLISS_LEVEL = 0.85;

/**
 * **KeyPressDetector** — one fingertip on the keyboard: presses a key when it comes down through a press
 * line over it, holds it while the finger stays down, lets it go when the finger lifts.
 *
 * @remarks
 * - Two lines, as on a real keyboard: halfway down the black keys (only a black key under the fingertip there
 *   presses), and below the black keys' ends (the white key under it).
 * - Velocity from the downward speed: 1 − e^(−v/v_full), never below `floor`.
 * - A held key isn't pressed again until the finger has lifted: a resting finger doesn't repeat.
 * - Sliding a held finger sideways is a glissando: it plays every key it passes on the row it pressed (white keys
 *   from a white, black from a black), each one even when the hand jumps several keys between two frames.
 */
export class KeyPressDetector {
  private prev: Point | null = null;
  private prevT = 0;
  private held: { midi: number; line: number; isBlack: boolean; velocity: number } | null = null;

  /** The key this fingertip holds down, if any. */
  get holding(): number | null {
    return this.held?.midi ?? null;
  }

  /** What one new sample of the fingertip did: keys pressed (in order) and keys let go. */
  update(tip: Point | null, t: number, l: KeyboardLayout): { presses: KeyPress[]; releases: number[] } {
    const none = { presses: [], releases: [] };
    if (!tip) {
      if (!this.prev || t - this.prevT <= DEFAULTS.dropout) return none;
      this.prev = null;
      return this.lift();
    }
    const prev = this.prev;
    const dt = Math.max(1e-3, t - this.prevT);
    this.prev = tip;
    this.prevT = t;
    const keyLength = l.bottom - l.top;
    if (this.held) {
      if (tip.y < this.held.line - keyLength * DEFAULTS.lift) return this.lift();
      return prev ? this.slide(prev, tip, l) : none;
    }
    if (!prev) return none;
    const dy = tip.y - prev.y;
    const speed = dy / dt / l.h;
    if (speed < DEFAULTS.minSpeed) return none;
    for (const [line, isBlackLine] of [[l.blackLine, true], [l.whiteLine, false]] as const) {
      if (!(prev.y < line && tip.y >= line)) continue;
      const frac = (line - prev.y) / dy;
      const at = { x: prev.x + (tip.x - prev.x) * frac, y: line };
      const key = keyAt(l, at);
      if (!key || key.isBlack !== isBlackLine) continue;
      const velocity = Math.max(DEFAULTS.floor, 1 - Math.exp(-speed / DEFAULTS.fullSpeed));
      this.held = { midi: key.midi, line, isBlack: key.isBlack, velocity };
      return { presses: [{ midi: key.midi, velocity, frac }], releases: [] };
    }
    return none;
  }

  /** A held finger moved: every key of its row between where it was and where it is now, in order. */
  private slide(prev: Point, tip: Point, l: KeyboardLayout): { presses: KeyPress[]; releases: number[] } {
    const held = this.held;
    if (!held) return { presses: [], releases: [] };
    const row = l.keys.filter((k) => k.isBlack === held.isBlack);
    const under = row.find((k) => tip.x >= k.x0 && tip.x < k.x1);
    if (!under || under.midi === held.midi) return { presses: [], releases: [] };
    const isGoingUp = under.midi > held.midi;
    const passed = row
      .filter((k) => (isGoingUp ? k.midi > held.midi && k.midi <= under.midi : k.midi < held.midi && k.midi >= under.midi))
      .sort((a, b) => (isGoingUp ? a.midi - b.midi : b.midi - a.midi));
    const span = Math.max(1, Math.abs(tip.x - prev.x));
    const presses = passed.map((k) => ({ midi: k.midi, velocity: held.velocity * GLISS_LEVEL, frac: Math.min(1, Math.abs((k.x0 + k.x1) / 2 - prev.x) / span) }));
    const releases = [held.midi, ...passed.slice(0, -1).map((k) => k.midi)];
    this.held = { ...held, midi: under.midi };
    return { presses, releases };
  }

  private lift(): { presses: KeyPress[]; releases: number[] } {
    const midi = this.held?.midi;
    this.held = null;
    return { presses: [], releases: midi === undefined ? [] : [midi] };
  }
}
