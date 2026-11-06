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

/**
 * **KeyPressDetector** — one fingertip on the keyboard: presses a key when it comes down through a press
 * line over it, holds it while the finger stays down, lets it go when the finger lifts.
 *
 * @remarks
 * - Two lines, as on a real keyboard: halfway down the black keys (only a black key under the fingertip there
 *   presses), and below the black keys' ends (the white key under it).
 * - Velocity from the downward speed: 1 − e^(−v/v_full), never below `floor`.
 * - A held key isn't pressed again until the finger has lifted: a resting finger doesn't repeat.
 */
export class KeyPressDetector {
  private prev: Point | null = null;
  private prevT = 0;
  private held: { midi: number; line: number } | null = null;

  /** The key this fingertip holds down, if any. */
  get holding(): number | null {
    return this.held?.midi ?? null;
  }

  update(tip: Point | null, t: number, l: KeyboardLayout): { press: KeyPress | null; release: number | null } {
    const none = { press: null, release: null };
    if (!tip) {
      if (!this.prev || t - this.prevT <= DEFAULTS.dropout) return none;
      this.prev = null;
      return { press: null, release: this.let() };
    }
    const prev = this.prev;
    const dt = Math.max(1e-3, t - this.prevT);
    this.prev = tip;
    this.prevT = t;
    const keyLength = l.bottom - l.top;
    if (this.held) return tip.y < this.held.line - keyLength * DEFAULTS.lift ? { press: null, release: this.let() } : none;
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
      this.held = { midi: key.midi, line };
      const velocity = Math.max(DEFAULTS.floor, 1 - Math.exp(-speed / DEFAULTS.fullSpeed));
      return { press: { midi: key.midi, velocity, frac }, release: null };
    }
    return none;
  }

  private let(): number | null {
    const midi = this.held?.midi ?? null;
    this.held = null;
    return midi;
  }
}
