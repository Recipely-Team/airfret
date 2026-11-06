import type { Point } from '@domain/fretboard/point';
import { keyAt } from '@domain/keys/compute-keyboard-layout';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import type { KeyPress } from '@domain/keys/key-press';

const DEFAULTS = {
  /** A press: the fingertip dips this far (share of the hand's size) below where that finger rests. */
  press: 0.2,
  /** It comes up again — the key rises — once the dip is back under this. */
  release: 0.1,
  /** How fast the resting position follows the finger (per second): a finger held down long becomes "resting". */
  settle: 0.8,
  /** The dip must be happening, not drifted into: at least this fast (hand sizes per second). */
  minSpeed: 0.6,
  /** Speed that plays at full strength (hand sizes per second). */
  fullSpeed: 4,
  /** The weakest press still sounds this loud. */
  floor: 0.15,
  /** A fingertip lost by tracking for longer than this lets its key go, seconds. */
  dropout: 0.2,
} as const;
/** A glissando's keys sound a little softer than the stroke that started it. */
const GLISS_LEVEL = 0.85;

/**
 * **KeyPressDetector** — one finger on the air keyboard, judged against its own hand, not the screen.
 *
 * @remarks
 * - A press is the finger dipping below its own knuckle, by more than it usually sits there (a slowly
 *   following baseline): moving or lowering the whole hand moves tip and knuckle together and plays nothing,
 *   and a hand resting over the keys holds none down. (A fixed line on the screen did both.)
 * - The key is the one under the fingertip; velocity comes from how fast it dips.
 * - The key rises when the finger comes back up, or after a while held still (the dip becomes its rest).
 * - Sliding a pressed finger sideways is a glissando over the keys of its row.
 */
export class KeyPressDetector {
  private baseline: number | null = null;
  private prevDip = 0;
  private prevT = 0;
  private lostAt: number | null = null;
  private held: { midi: number; isBlack: boolean; velocity: number } | null = null;
  private lastX = 0;

  /** The key this finger holds down, if any. */
  get holding(): number | null {
    return this.held?.midi ?? null;
  }

  /**
   * One camera frame of this finger: its tip, its knuckle, and the hand's size (wrist to middle knuckle, px).
   * Returns the keys pressed (in order) and let go.
   */
  update(tip: Point | null, knuckle: Point | null, handSize: number, t: number, l: KeyboardLayout): { presses: KeyPress[]; releases: number[] } {
    const none = { presses: [], releases: [] };
    if (!tip || !knuckle || handSize <= 0) {
      this.lostAt ??= t;
      if (t - this.lostAt <= DEFAULTS.dropout) return none;
      this.baseline = null;
      return this.lift();
    }
    this.lostAt = null;
    const dip = (tip.y - knuckle.y) / handSize;
    const dt = Math.max(1e-3, t - this.prevT);
    const speed = this.baseline === null ? 0 : (dip - this.prevDip) / dt;
    this.prevDip = dip;
    this.prevT = t;
    if (this.baseline === null) {
      this.baseline = dip;
      this.lastX = tip.x;
      return none;
    }
    const depth = dip - this.baseline;
    // The resting position follows slowly: a hand's posture drifts, and a long-held dip becomes the new rest.
    this.baseline += (dip - this.baseline) * Math.min(1, DEFAULTS.settle * dt);
    if (this.held) {
      if (depth < DEFAULTS.release) return this.lift();
      const slid = this.slide(tip, l);
      this.lastX = tip.x;
      return slid;
    }
    this.lastX = tip.x;
    if (depth < DEFAULTS.press || speed < DEFAULTS.minSpeed) return none;
    const key = keyAt(l, tip);
    if (!key) return none;
    const velocity = Math.max(DEFAULTS.floor, 1 - Math.exp(-speed / DEFAULTS.fullSpeed));
    this.held = { midi: key.midi, isBlack: key.isBlack, velocity };
    return { presses: [{ midi: key.midi, velocity, frac: 0 }], releases: [] };
  }

  /** A held finger moved sideways: every key of its row between where it was and where it is now, in order. */
  private slide(tip: Point, l: KeyboardLayout): { presses: KeyPress[]; releases: number[] } {
    const held = this.held;
    if (!held) return { presses: [], releases: [] };
    const row = l.keys.filter((k) => k.isBlack === held.isBlack);
    const under = row.find((k) => tip.x >= k.x0 && tip.x < k.x1);
    if (!under || under.midi === held.midi) return { presses: [], releases: [] };
    const isGoingUp = under.midi > held.midi;
    const passed = row
      .filter((k) => (isGoingUp ? k.midi > held.midi && k.midi <= under.midi : k.midi < held.midi && k.midi >= under.midi))
      .sort((a, b) => (isGoingUp ? a.midi - b.midi : b.midi - a.midi));
    const span = Math.max(1, Math.abs(tip.x - this.lastX));
    const presses = passed.map((k) => ({ midi: k.midi, velocity: held.velocity * GLISS_LEVEL, frac: Math.min(1, Math.abs((k.x0 + k.x1) / 2 - this.lastX) / span) }));
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
