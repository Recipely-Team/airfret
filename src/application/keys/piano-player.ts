import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { Voice } from '@domain/audio/voice';
import type { Point } from '@domain/fretboard/point';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { keyAt } from '@domain/keys/compute-keyboard-layout';
import { KeyPressDetector } from '@domain/keys/key-press-detector';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import { PIANO_LOWEST_MIDI } from '@domain/keys/piano';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** Every fingertip plays: thumb, index, middle, ring, little finger. */
const TIPS = [HandLandmark.thumbTip, HandLandmark.indexTip, HandLandmark.middleTip, HandLandmark.ringTip, HandLandmark.pinkyTip] as const;
/** A note is scheduled this far ahead, so it is never in the past. */
const LEAD = 0.004;
/** The hammer strikes about an eighth of the way along the string. */
const STRIKE_POINT = 0.12;
/** A clicked or tapped key plays at this strength. */
const POINTER_VELOCITY = 0.7;
/** How fast a key's glow fades on screen, per second. */
const GLOW_DECAY = 3;

/**
 * **PianoPlayer** — the piano played by hands in the air, the mouse, or fingers on a touch screen.
 *
 * @remarks
 * - Each fingertip of each hand has its own `KeyPressDetector`; hands are told apart left to right, so they
 *   keep their detectors when tracking lists them in another order.
 * - A key sounds while something holds it (a fingertip, the mouse, a touch) and stops when the last lets go
 *   — unless the sustain pedal is down; lifting the pedal stops every key no longer held.
 * - Each key is its own "string" of the sound engine (`PIANO`), so notes ring independently.
 */
export class PianoPlayer {
  layout: KeyboardLayout | null = null;
  /** Tracked hands in screen px, as the stage draws them. */
  hands: readonly (readonly Point[])[] = [];
  /** How brightly each key glows (its last strike, fading). */
  readonly glow = new Map<number, number>();
  private readonly detectors = new Map<string, KeyPressDetector>();
  private readonly holders = new Map<number, Set<string>>();
  private readonly ringing = new Set<number>();
  private isSustained = false;

  constructor(private readonly sound: SoundOutputInterface) {}

  configure(layout: KeyboardLayout): void {
    this.layout = layout;
  }

  /** Keys held down right now. */
  get pressed(): number[] {
    return [...this.holders.keys()];
  }

  get sustain(): boolean {
    return this.isSustained;
  }

  updateHands(hands: readonly (readonly Point[])[], t: number, audioNow: number): void {
    const l = this.layout;
    if (!l) return;
    // Left to right, so each hand keeps its detectors whatever order tracking reports them in.
    const ordered = [...hands].sort((a, b) => (a[HandLandmark.wrist]?.x ?? 0) - (b[HandLandmark.wrist]?.x ?? 0));
    this.hands = ordered;
    const seen = new Set<string>();
    ordered.forEach((hand, h) => TIPS.forEach((tip) => {
      const id = `hand${h}:${tip}`;
      seen.add(id);
      this.feed(id, hand[tip] ?? null, t, audioNow, l);
    }));
    for (const id of this.detectors.keys()) if (!seen.has(id)) this.feed(id, null, t, audioNow, l);
  }

  /** A pointer (mouse button or touch) down on, moving over, or lifted from the keyboard. Sliding plays each key it reaches. */
  pointer(id: number, p: Point | null, audioNow: number): void {
    const source = `pointer${id}`;
    const key = p && this.layout ? keyAt(this.layout, p) : null;
    const current = this.held(source);
    if (key?.midi === current) return;
    if (current !== null) this.release(source, current, audioNow + LEAD);
    if (key) this.press(source, key.midi, POINTER_VELOCITY, audioNow + LEAD);
  }

  setSustain(isDown: boolean, audioNow: number): void {
    this.isSustained = isDown;
    if (isDown) return;
    for (const midi of [...this.ringing]) if (!this.holders.has(midi)) this.stop(midi, audioNow + LEAD);
  }

  /** Fades the keys' glow; called once a drawn frame. */
  fade(dt: number): void {
    for (const [midi, g] of this.glow) {
      const next = g * Math.exp(-dt * GLOW_DECAY);
      if (next < 0.02) this.glow.delete(midi);
      else this.glow.set(midi, next);
    }
  }

  private feed(id: string, tip: Point | null, t: number, audioNow: number, l: KeyboardLayout): void {
    let d = this.detectors.get(id);
    if (!d) {
      d = new KeyPressDetector();
      this.detectors.set(id, d);
    }
    const { press, release } = d.update(tip, t, l);
    if (release !== null) this.release(id, release, audioNow + LEAD);
    if (press) this.press(id, press.midi, press.velocity, audioNow + LEAD);
  }

  private held(source: string): number | null {
    for (const [midi, set] of this.holders) if (set.has(source)) return midi;
    return null;
  }

  private press(source: string, midi: number, velocity: number, when: number): void {
    const set = this.holders.get(midi) ?? new Set<string>();
    set.add(source);
    this.holders.set(midi, set);
    this.ringing.add(midi);
    this.glow.set(midi, Math.max(this.glow.get(midi) ?? 0, velocity));
    this.sound.pluck({
      string: midi - PIANO_LOWEST_MIDI, midi, amp: velocity, when, isMuted: false, position: STRIKE_POINT,
      voice: Voice.player, attack: StrikeSurface.pad, isPalmMuted: false,
    });
  }

  private release(source: string, midi: number, when: number): void {
    const set = this.holders.get(midi);
    set?.delete(source);
    if (set?.size) return;
    this.holders.delete(midi);
    if (!this.isSustained) this.stop(midi, when);
  }

  private stop(midi: number, when: number): void {
    this.ringing.delete(midi);
    this.sound.damp(midi - PIANO_LOWEST_MIDI, when);
  }
}
