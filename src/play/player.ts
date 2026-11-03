// Turns tracked hands into sound: which hand frets, what chord/fret it holds,
// and which strings the strumming finger crosses.

import type { AudioEngine } from '../audio/engine';
import type { Instrument, PlayMode } from '../audio/instruments';
import { chordNotes } from '../music/theory';
import { extendedFingers, OneEuro, type Point } from '../tracking';
import { fretAt, inStrumArea, onNeck, onStrumSide, slotAt, strumStringYs, type Layout } from './layout';
import { speedToAmp, StrumDetector, type Crossing } from './strum';

export interface PlayEvent {
  when: number; // audio time
  chord?: string;
  midi?: number;
  muted: boolean;
}

export class Player {
  layout!: Layout;
  instrument!: Instrument;
  mode: PlayMode = 'chord';
  chords: string[] = [];

  /** Selected chord slot (chord mode) — persists when the fret hand leaves. */
  slot = 0;
  /** Fret held (note mode). 0 = open strings. */
  fret = 0;
  muted = false;
  /** Manual overrides from the keyboard, used while no fretting hand is visible. */
  manualFret: number | null = null;

  fretPoint: Point | null = null;
  strumPoint: Point | null = null;
  fretHand: Point[] | null = null;
  strumHand: Point[] | null = null;
  /** Per-string vibration energy for the renderer. */
  energy: number[] = [];
  trail: { p: Point; t: number }[] = [];

  onEvent: (e: PlayEvent) => void = () => {};

  private strum = new StrumDetector();
  private fretFilter = [new OneEuro(1.0, 0.02), new OneEuro(1.0, 0.02)];
  private strumFilter = [new OneEuro(4, 0.05), new OneEuro(4, 0.05)];
  private fistFrames = 0;
  private lastCross = { when: -1, dir: 0 };
  private lastFrame = 0;

  constructor(private engine: AudioEngine) {}

  configure(layout: Layout, instrument: Instrument, mode: PlayMode, chords: string[]): void {
    const restrum = !this.layout || this.layout.strings !== layout.strings;
    this.layout = layout;
    this.instrument = instrument;
    this.mode = mode;
    this.chords = chords;
    if (this.slot >= chords.length) this.slot = 0;
    if (restrum) this.strum.reset();
    this.energy = Array.from({ length: layout.strings }, (_, i) => this.energy[i] ?? 0);
  }

  get chord(): string | undefined {
    return this.chords[this.slot];
  }

  /** Called once per camera frame with hands in screen px. */
  updateHands(hands: Point[][], t: number, audioNow: number, allowStrum = true): void {
    const l = this.layout;
    let fret: Point[] | null = null;
    let strum: Point[] | null = null;
    if (hands.length >= 2) {
      const [a, b] = [...hands].sort((h1, h2) => h1[9].x - h2[9].x);
      [fret, strum] = l.lefty ? [b, a] : [a, b];
    } else if (hands.length === 1) {
      if (onStrumSide(l, hands[0][9])) strum = hands[0];
      else fret = hands[0];
    }
    this.fretHand = fret;
    this.strumHand = strum;

    // Fretting hand.
    if (fret) {
      const tip = fret[8];
      const p = { x: this.fretFilter[0].filter(tip.x, t), y: this.fretFilter[1].filter(tip.y, t) };
      this.fretPoint = p;
      const fist = extendedFingers(fret) === 0 && onNeck(l, fret[9]);
      this.fistFrames = fist ? this.fistFrames + 1 : 0;
      const wasMuted = this.muted;
      this.muted = this.fistFrames >= 2;
      if (this.muted && !wasMuted) this.engine.damp(-1);
      if (!this.muted) {
        if (this.mode === 'chord') {
          const s = slotAt(l, this.chords.length, p);
          if (s >= 0) this.slot = s;
        } else {
          this.fret = fretAt(l, p);
        }
      }
    } else {
      this.fretFilter.forEach((f) => f.reset());
      this.fretPoint = null;
      this.fistFrames = 0;
      this.muted = false;
      if (this.mode === 'note') this.fret = this.manualFret ?? 0;
    }

    // Strumming hand (skipped while the mouse is strumming instead).
    if (!allowStrum) return;
    let sp: Point | null = null;
    if (strum) {
      const tip = strum[8];
      sp = { x: this.strumFilter[0].filter(tip.x, t), y: this.strumFilter[1].filter(tip.y, t) };
      if (!inStrumArea(l, sp)) sp = null;
    } else {
      this.strumFilter.forEach((f) => f.reset());
    }
    this.strumPoint = sp;
    this.feedStrum(sp, t, audioNow);
  }

  /** Mouse / touch fallback for the strumming hand. */
  pointer(p: Point | null, t: number, audioNow: number): void {
    this.strumPoint = p;
    this.feedStrum(p, t, audioNow);
  }

  selectSlot(i: number): void {
    if (this.mode === 'chord') {
      if (i < this.chords.length) this.slot = i;
    } else {
      this.manualFret = i;
      this.fret = i;
    }
  }

  private feedStrum(p: Point | null, t: number, audioNow: number): void {
    const dt = this.lastFrame ? Math.min(0.05, t - this.lastFrame) : 0.016;
    this.lastFrame = t;
    if (p) {
      this.trail.push({ p, t });
      while (this.trail.length && t - this.trail[0].t > 0.25) this.trail.shift();
    }
    const crossings = this.strum.update(p, t, strumStringYs(this.layout), this.layout.h);
    for (const c of crossings) this.play(c, audioNow + 0.004 + c.frac * Math.min(dt, 0.035));
  }

  private play(c: Crossing, when: number): void {
    const amp = speedToAmp(c.speed);
    const tuning = this.instrument.tuning;
    let midi: number | null;
    if (this.mode === 'chord') {
      midi = this.chord ? chordNotes(this.chord, tuning)[c.string] : tuning[c.string];
    } else {
      midi = tuning[c.string] + this.fret;
    }
    const newGesture = when - this.lastCross.when > 0.1 || c.dir !== this.lastCross.dir;
    this.lastCross = { when, dir: c.dir };

    if (midi === null) {
      // String not part of the chord shape — it's muted by the fretting hand.
      if (newGesture) this.emit(when);
      return;
    }
    this.engine.pluck(c.string, midi, amp, when, { muted: this.muted });
    if (this.muted && newGesture) this.engine.chuck(amp, when);
    this.energy[c.string] = Math.max(this.energy[c.string], this.muted ? amp * 0.3 : amp);

    if (this.mode === 'chord') {
      if (newGesture) this.emit(when);
    } else {
      this.onEvent({ when, midi, muted: this.muted });
    }
  }

  private emit(when: number): void {
    this.onEvent({ when, chord: this.muted ? undefined : this.chord, muted: this.muted });
  }
}
