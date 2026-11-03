import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { DrumArticulation } from '@domain/drums/drum-articulation';
import type { DrumHit } from '@domain/drums/drum-hit';
import type { DrumPad } from '@domain/drums/drum-pad';
import { DrumPiece } from '@domain/drums/drum-piece';
import { HitDetector } from '@domain/drums/hit-detector';
import type { Stick } from '@domain/drums/stick';
import { stickFromHand } from '@domain/drums/stick-from-hand';
import type { Point } from '@domain/fretboard/point';
import { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import { PedalAction } from '@domain/input/pedal-action';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** Edge zone of the snare that counts as a rimshot. */
const RIM_RADIUS = 0.85;
/** Centre zone of the ride that is the bell. */
const BELL_RADIUS = 0.25;
const SCHEDULE_LEAD = 0.004;
const MAX_SPREAD = 0.033;
const PEDAL_CHICK_VELOCITY = 0.6;
const MOUSE_VELOCITY = 0.7;

/**
 * **DrumPlayer** — two sticks from two tracked hands, two feet from assignable pedals.
 *
 * @remarks
 * - Each hand holds a stick (`stickFromHand`); each stick has its own `HitDetector`.
 * - Articulation: snare edge → rimshot, ride centre → bell, hi-hat open/closed from the pedal.
 * - Hi-hat pedal: in `holdToClose` (a real kit) foot down closes and "chicks"; in `holdToOpen` the hat is
 *   closed unless the pedal is held. Closing a ringing open hat chokes it.
 */
export class DrumPlayer {
  pads: readonly DrumPad[] = [];
  sticks: (Stick | null)[] = [null, null];
  /** Last hit per piece, for the renderer's head/cymbal animation. */
  readonly lastHit = new Map<DrumPiece, { at: number; velocity: number }>();
  readonly pedalDown = new Set<PedalAction>();
  hands: readonly (readonly Point[])[] = [];

  private readonly detectors = [new HitDetector(), new HitDetector()];
  private hihatMode: HiHatPedalMode = HiHatPedalMode.holdToOpen;
  private h = 1;
  private lastT = 0;

  constructor(private readonly sound: SoundOutputInterface) {}

  configure(pads: readonly DrumPad[], h: number, hihatMode: HiHatPedalMode): void {
    this.pads = pads;
    this.h = h;
    this.hihatMode = hihatMode;
  }

  get isHatOpen(): boolean {
    return this.hatOpenNow();
  }

  /** One camera frame of hands in screen px; the left-most hand holds stick 0. */
  updateHands(hands: readonly (readonly Point[])[], t: number, audioNow: number, now: number): void {
    const dt = this.lastT ? Math.min(MAX_SPREAD, t - this.lastT) : 0;
    this.lastT = t;
    this.hands = hands;
    const ordered = [...hands].sort((a, b) => (a[HandLandmark.wrist]?.x ?? 0) - (b[HandLandmark.wrist]?.x ?? 0)).slice(0, 2);
    this.sticks = [0, 1].map((i) => {
      const hand = ordered[i];
      return hand ? stickFromHand(hand) : null;
    });
    this.sticks.forEach((stick, i) => {
      const hits = this.detectors[i]?.update(stick?.tip ?? null, t, this.pads, this.h) ?? [];
      for (const hit of hits) this.play(hit, audioNow + SCHEDULE_LEAD + hit.frac * dt, now);
    });
  }

  /** Mouse fallback: a click on a pad hits it. */
  click(p: Point, audioNow: number, now: number): void {
    const pad = [...this.pads].sort((a, b) => a.cy - b.cy).reverse().find((x) => ((p.x - x.cx) / x.rx) ** 2 + ((p.y - x.cy) / x.ry) ** 2 <= 1);
    if (pad) this.play({ piece: pad.piece, velocity: MOUSE_VELOCITY, radius: Math.min(1, Math.abs(p.x - pad.cx) / pad.rx), frac: 0 }, audioNow, now);
  }

  pedal(action: PedalAction, isDown: boolean, velocity: number, audioNow: number, now: number): void {
    const wasOpen = this.isHatOpen;
    if (isDown) this.pedalDown.add(action);
    else this.pedalDown.delete(action);
    if (action === PedalAction.hihatPedal) {
      if (wasOpen && !this.hatOpenNow()) {
        this.sound.chokeHiHat(audioNow);
        this.sound.hitDrum({ piece: DrumPiece.hihat, velocity: PEDAL_CHICK_VELOCITY * velocity, radius: 0, articulation: DrumArticulation.hatPedal, when: audioNow });
      }
      return;
    }
    if (isDown) this.play({ piece: DrumPiece.kick, velocity, radius: 0, frac: 0 }, audioNow, now);
  }

  /** A method, not a getter: the answer changes as pedals go up and down. */
  private hatOpenNow(): boolean {
    const isDown = this.pedalDown.has(PedalAction.hihatPedal);
    return this.hihatMode === HiHatPedalMode.holdToClose ? !isDown : isDown;
  }

  private play(hit: DrumHit, when: number, now: number): void {
    this.sound.hitDrum({ piece: hit.piece, velocity: hit.velocity, radius: hit.radius, articulation: this.articulation(hit), when });
    this.lastHit.set(hit.piece, { at: now, velocity: hit.velocity });
  }

  private articulation(hit: DrumHit): DrumArticulation {
    if (hit.piece === DrumPiece.hihat) return this.isHatOpen ? DrumArticulation.hatOpen : DrumArticulation.hatClosed;
    if (hit.piece === DrumPiece.snare && hit.radius > RIM_RADIUS) return DrumArticulation.rim;
    if (hit.piece === DrumPiece.ride && hit.radius < BELL_RADIUS) return DrumArticulation.bell;
    return DrumArticulation.normal;
  }
}
