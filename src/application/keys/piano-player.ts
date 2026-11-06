import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { Voice } from '@domain/audio/voice';
import type { Point } from '@domain/fretboard/point';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { computeKeyboardLayout, keyAt } from '@domain/keys/compute-keyboard-layout';
import { KEYBOARDS, keyboardFor } from '@domain/keys/keyboard-instruments';
import { PIANO_ID } from '@domain/keys/piano-id';
import { KeyPressDetector } from '@domain/keys/key-press-detector';
import type { KeyboardInstrument } from '@domain/keys/keyboard-instrument';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import { PIANO_LOWEST_MIDI } from '@domain/keys/piano';
import { HandLandmark } from '@domain/tracking/hand-landmark';

/** Every fingertip plays: thumb, index, middle, ring, little finger. */
/** Every finger plays, each judged against its own knuckle: thumb, index, middle, ring, little finger. */
const FINGERS = [
  [HandLandmark.thumbTip, HandLandmark.thumbMcp], [HandLandmark.indexTip, HandLandmark.indexMcp], [HandLandmark.middleTip, HandLandmark.middleMcp],
  [HandLandmark.ringTip, HandLandmark.ringMcp], [HandLandmark.pinkyTip, HandLandmark.pinkyMcp],
] as const;
/** A note is scheduled this far ahead, so it is never in the past. */
const LEAD = 0.004;
/** The hammer strikes about an eighth of the way along the string. */
const STRIKE_POINT = 0.12;
/** Keys a fast glissando passes within one frame are spread this far apart, seconds. */
const GLISS_STEP = 0.012;
/** A keyboard without dynamics plays every key at this strength. */
const FIXED_LEVEL = 0.7;
/** A clicked or tapped key plays at this strength. */
const POINTER_VELOCITY = 0.7;
/** How fast a key's glow fades on screen, per second. */
const GLOW_DECAY = 3;

/**
 * **PianoPlayer** — the piano played by hands in the air, the mouse, or fingers on a touch screen.
 *
 * @remarks
 * - Each finger of each hand has its own `KeyPressDetector`, judging it against its own knuckle (moving or resting
 *   the hand plays nothing); hands are told apart left to right, so they
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

  /** The keyboard instrument being played: whether it is touch-sensitive, how its keys look. */
  keyboard: KeyboardInstrument | null = null;

  /** Sets the keys up for a screen and the selected keyboard instrument (the piano's when it isn't one), slid `shift` octaves. */
  fit(w: number, h: number, instrumentId: string, shift: number): void {
    const keyboard = keyboardFor(instrumentId) ?? KEYBOARDS[PIANO_ID];
    this.configure(computeKeyboardLayout(w, h, shift, keyboard), keyboard);
  }

  configure(layout: KeyboardLayout, keyboard?: KeyboardInstrument): void {
    this.layout = layout;
    this.keyboard = keyboard ?? null;
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
    ordered.forEach((hand, h) => {
      const wrist = hand[HandLandmark.wrist];
      const knuckle = hand[HandLandmark.middleMcp];
      const size = wrist && knuckle ? Math.hypot(knuckle.x - wrist.x, knuckle.y - wrist.y) : 0;
      for (const [tip, mcp] of FINGERS) {
        const id = `hand${h}:${tip}`;
        seen.add(id);
        this.feed(id, hand[tip] ?? null, hand[mcp] ?? null, size, t, audioNow, l);
      }
    });
    for (const id of this.detectors.keys()) if (!seen.has(id)) this.feed(id, null, null, 0, t, audioNow, l);
  }

  /**
   * A pointer (mouse button or touch) down on, moving over, or lifted from the keyboard. Sliding is a glissando:
   * it plays every key of the row it is on that it passed, even when the pointer jumps several between events.
   */
  pointer(id: number, p: Point | null, audioNow: number): void {
    const source = `pointer${id}`;
    const key = p && this.layout ? keyAt(this.layout, p) : null;
    const current = this.held(source);
    if (key?.midi === current) return;
    const passed = key && current !== null && this.layout ? between(this.layout, current, key.midi, key.isBlack) : [];
    // Each key of the slide in turn: the one before is let go as the next sounds.
    let previous = current;
    [...passed, ...(key ? [key.midi] : [])].forEach((midi, i) => {
      const when = audioNow + LEAD + i * GLISS_STEP;
      if (previous !== null) this.release(source, previous, when);
      this.press(source, midi, POINTER_VELOCITY, when);
      previous = midi;
    });
    if (!key && current !== null) this.release(source, current, audioNow + LEAD);
  }

  setSustain(isDown: boolean, audioNow: number): void {
    this.isSustained = isDown;
    if (isDown || this.keyboard?.isDamped === false) return;
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

  private feed(id: string, tip: Point | null, knuckle: Point | null, handSize: number, t: number, audioNow: number, l: KeyboardLayout): void {
    let d = this.detectors.get(id);
    if (!d) {
      d = new KeyPressDetector();
      this.detectors.set(id, d);
    }
    const { presses, releases } = d.update(tip, knuckle, handSize, t, l);
    // Within a frame, a glissando's keys follow each other: let each go as the next sounds.
    releases.forEach((midi, i) => this.release(id, midi, audioNow + LEAD + i * GLISS_STEP));
    presses.forEach((p, i) => this.press(id, p.midi, p.velocity, audioNow + LEAD + i * GLISS_STEP));
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
      // A harpsichord's quill plucks the same however hard the key is struck.
      string: midi - PIANO_LOWEST_MIDI, midi, amp: this.keyboard?.isTouchSensitive === false ? FIXED_LEVEL : velocity, when, isMuted: false, position: STRIKE_POINT,
      voice: Voice.player, attack: StrikeSurface.pad, isPalmMuted: false,
    });
  }

  private release(source: string, midi: number, when: number): void {
    const set = this.holders.get(midi);
    set?.delete(source);
    if (set?.size) return;
    this.holders.delete(midi);
    // A struck bar (marimba, glockenspiel) rings on; only a damped instrument stops when its key rises.
    if (!this.isSustained && this.keyboard?.isDamped !== false) this.stop(midi, when);
  }

  private stop(midi: number, when: number): void {
    this.ringing.delete(midi);
    this.sound.damp(midi - PIANO_LOWEST_MIDI, when);
  }
}

/** Keys of one row strictly between two keys, in the direction travelled. */
function between(l: KeyboardLayout, from: number, to: number, isBlack: boolean): number[] {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const keys = l.keys.filter((k) => k.isBlack === isBlack && k.midi > lo && k.midi < hi).map((k) => k.midi);
  return to > from ? keys.sort((a, b) => a - b) : keys.sort((a, b) => b - a);
}
