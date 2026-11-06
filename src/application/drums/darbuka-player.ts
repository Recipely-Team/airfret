import { DrumArticulation } from '@domain/drums/drum-articulation';
import type { DrumPad } from '@domain/drums/drum-pad';
import type { DrumPiece } from '@domain/drums/drum-piece';
import { darbukaPad, darbukaStroke } from '@domain/drums/hand/darbuka-pad';
import { HitDetector } from '@domain/drums/hit-detector';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** The fingers that strike: index, middle and ring (a darbuka is played with the fingers, not a stick). */
const STRIKING = [HandLandmark.indexTip, HandLandmark.middleTip, HandLandmark.ringTip] as const;
const SCHEDULE_LEAD = 0.004;
/** A click or tap strikes at this strength. */
const POINTER_VELOCITY = 0.75;
/** How long a stroke's ripple shows, seconds. */
const RIPPLE_SECONDS = 0.6;

/** One stroke as the stage shows it: where, which, how hard, when. */
interface Ripple {
  readonly x: number;
  readonly y: number;
  readonly piece: DrumPiece;
  readonly velocity: number;
  readonly at: number;
}

/**
 * **DarbukaPlayer** — the goblet drum played with fingertips in the air, or by clicking and tapping its head.
 *
 * @remarks
 * - Each striking fingertip has its own `HitDetector` on the head: a stroke lands when it comes down through it.
 * - Where it lands sets the stroke (`darbukaStroke`): düm in the middle, tek on the edge with the right hand,
 *   ka with the left. Hands are told apart left to right on screen, so they keep their roles.
 */
export class DarbukaPlayer {
  pad: DrumPad = darbukaPad(1, 1);
  hands: readonly (readonly Point[])[] = [];
  readonly ripples: Ripple[] = [];
  private readonly detectors = new Map<string, HitDetector>();
  private h = 1;
  private lastT = 0;

  constructor(private readonly sound: SoundOutputInterface) {}

  configure(w: number, h: number): void {
    this.pad = darbukaPad(w, h);
    this.h = h;
  }

  updateHands(hands: readonly (readonly Point[])[], t: number, audioNow: number): void {
    const dt = this.lastT ? Math.min(0.05, t - this.lastT) : 0;
    this.lastT = t;
    const ordered = [...hands].sort((a, b) => (a[HandLandmark.wrist]?.x ?? 0) - (b[HandLandmark.wrist]?.x ?? 0));
    this.hands = ordered;
    ordered.forEach((hand, i) => {
      const isRight = ordered.length > 1 ? i === ordered.length - 1 : (hand[HandLandmark.wrist]?.x ?? 0) > this.pad.cx;
      for (const tip of STRIKING) {
        const id = `${i}:${tip}`;
        const d = this.detectors.get(id) ?? new HitDetector();
        this.detectors.set(id, d);
        const p = hand[tip] ?? null;
        for (const hit of d.update(p, t, [this.pad], this.h)) {
          this.strike(p ?? { x: this.pad.cx, y: this.pad.cy }, darbukaStroke(hit.radius, isRight), hit.velocity, audioNow + SCHEDULE_LEAD + hit.frac * dt, t);
        }
      }
    });
  }

  /** A click or tap: inside the head it strikes there — the left half's edge is ka, the right half's tek. */
  tap(p: Point, audioNow: number, now: number): void {
    const dx = (p.x - this.pad.cx) / this.pad.rx;
    const dy = (p.y - this.pad.cy) / this.pad.ry;
    const r = Math.hypot(dx, dy);
    if (r > 1) return;
    this.strike(p, darbukaStroke(r, dx >= 0), POINTER_VELOCITY, audioNow + SCHEDULE_LEAD, now);
  }

  /** Strokes still showing at `now`. */
  visibleRipples(now: number): Ripple[] {
    while (this.ripples.length && now - (this.ripples[0]?.at ?? now) > RIPPLE_SECONDS) this.ripples.shift();
    return this.ripples;
  }

  private strike(p: Point, piece: DrumPiece, velocity: number, when: number, now: number): void {
    this.sound.hitDrum({ piece, velocity, radius: 0, articulation: DrumArticulation.normal, when });
    this.ripples.push({ x: p.x, y: p.y, piece, velocity, at: now });
  }
}
