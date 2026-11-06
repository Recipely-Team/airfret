import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { HAND_DRUMS, handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import type { HandDrum } from '@domain/drums/hand/hand-drum';
import { headPads, strokeAt } from '@domain/drums/hand/hand-drum-pads';
import type { HandStroke } from '@domain/drums/hand/hand-stroke';
import { HitDetector } from '@domain/drums/hit-detector';
import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** The fingers that strike: index, middle and ring (hand drums are played with the fingers, not a stick). */
const STRIKING = [HandLandmark.indexTip, HandLandmark.middleTip, HandLandmark.ringTip] as const;
const SCHEDULE_LEAD = 0.004;
const MAX_SPREAD = 0.05;
/** A click or tap strikes at this strength. */
const POINTER_VELOCITY = 0.75;
/** How long a stroke's ripple shows, seconds. */
const RIPPLE_SECONDS = 0.6;

/** One stroke as the stage shows it. */
interface Ripple {
  readonly x: number;
  readonly y: number;
  readonly head: number;
  readonly stroke: HandStroke;
  readonly velocity: number;
  readonly at: number;
}

/**
 * **HandDrumPlayer** — any hand drum of the catalogue (darbuka, congas, tabla, handpan…) played with fingertips
 * in the air, or by clicking and tapping its heads.
 *
 * @remarks
 * - Each striking fingertip has its own `HitDetector` over all the heads: a stroke lands when it comes down
 *   through one. Where on the head, and with which hand, sets the stroke (`strokeAt`).
 * - Hands are told apart left to right on screen, so they keep their roles (tek right, ka left).
 */
export class HandDrumPlayer {
  drum: HandDrum = HAND_DRUMS[0] as HandDrum;
  pads = headPads(this.drum, 1, 1);
  hands: readonly (readonly Point[])[] = [];
  readonly ripples: Ripple[] = [];
  private readonly detectors = new Map<string, HitDetector>();
  private h = 1;
  private lastT = 0;

  constructor(private readonly sound: SoundOutputInterface) {}

  /** The drum to play (by instrument id) and the screen it fills. */
  configure(drumId: string, w: number, h: number): void {
    this.drum = handDrumFor(drumId) ?? this.drum;
    this.pads = headPads(this.drum, w, h);
    this.h = h;
  }

  updateHands(hands: readonly (readonly Point[])[], t: number, audioNow: number): void {
    const dt = this.lastT ? Math.min(MAX_SPREAD, t - this.lastT) : 0;
    this.lastT = t;
    const ordered = [...hands].sort((a, b) => (a[HandLandmark.wrist]?.x ?? 0) - (b[HandLandmark.wrist]?.x ?? 0));
    this.hands = ordered;
    const middle = this.pads.reduce((sum, p) => sum + p.cx, 0) / Math.max(1, this.pads.length);
    ordered.forEach((hand, i) => {
      const isRight = ordered.length > 1 ? i === ordered.length - 1 : (hand[HandLandmark.wrist]?.x ?? 0) > middle;
      for (const tip of STRIKING) {
        const id = `${i}:${tip}`;
        const d = this.detectors.get(id) ?? new HitDetector();
        this.detectors.set(id, d);
        const p = hand[tip] ?? null;
        for (const hit of d.update(p, t, this.pads, this.h)) {
          const index = this.pads.findIndex((pad) => pad.piece === hit.piece);
          const pad = this.pads[index];
          if (pad) this.strike(p ?? { x: pad.cx, y: pad.cy }, index, strokeAt(pad.head, hit.radius, isRight), hit.velocity, audioNow + SCHEDULE_LEAD + hit.frac * dt, t);
        }
      }
    });
  }

  /** A click or tap on a head strikes there: inside its edge the centre stroke, outside it the edge stroke of that side. */
  tap(p: Point, audioNow: number, now: number): void {
    const index = this.pads.findIndex((pad) => Math.hypot((p.x - pad.cx) / pad.rx, (p.y - pad.cy) / pad.ry) <= 1);
    const pad = this.pads[index];
    if (!pad) return;
    const r = Math.hypot((p.x - pad.cx) / pad.rx, (p.y - pad.cy) / pad.ry);
    this.strike(p, index, strokeAt(pad.head, r, p.x >= pad.cx), POINTER_VELOCITY, audioNow + SCHEDULE_LEAD, now);
  }

  /** Strokes still showing at `now`. */
  visibleRipples(now: number): Ripple[] {
    while (this.ripples.length && now - (this.ripples[0]?.at ?? now) > RIPPLE_SECONDS) this.ripples.shift();
    return this.ripples;
  }

  private strike(p: Point, head: number, stroke: HandStroke, velocity: number, when: number, now: number): void {
    this.sound.hitHandDrum(stroke, velocity, when);
    this.ripples.push({ x: p.x, y: p.y, head, stroke, velocity, at: now });
  }
}
