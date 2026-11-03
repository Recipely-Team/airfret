import { assignHands } from '@application/play/assign-hands';
import type { PlayEvent } from '@application/play/play-event';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { chordSlotSelection } from '@application/play/chord-slot-selection';
import { inStrumArea, onNeck, strumStringYs, fretAt } from '@domain/fretboard/neck-geometry';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Point } from '@domain/fretboard/point';
import type { Crossing } from '@domain/gesture/crossing';
import { OneEuroFilter } from '@domain/gesture/one-euro-filter';
import { StrumDetector } from '@domain/gesture/strum-detector';
import { StrumDirection } from '@domain/gesture/strum-direction';
import { speedToAmp } from '@domain/gesture/strum-velocity';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { chordNotes } from '@domain/music/chord-voicing';
import { StrumFilter } from '@domain/settings/strum-filter';
import { HandLandmark } from '@domain/tracking/hand-landmark';
import { extendedFingers } from '@domain/tracking/hand-pose';

const Timing = {
  /** Crossings further apart than this start a new strum gesture, seconds. */
  gestureGap: 0.1,
  /** Small safety offset so scheduled plucks are never in the past. */
  scheduleLead: 0.004,
  /** Sub-frame strum spread is capped at this, seconds. */
  maxSpread: 0.035,
  defaultFrame: 0.016,
  maxFrame: 0.05,
  trail: 0.25,
} as const;
const FIST_FRAMES = 2;
const MUTED_ENERGY = 0.3;
const FRET_FILTER = { minCutoff: 1, beta: 0.02 } as const;
const STRUM_FILTER = { minCutoff: 4, beta: 0.05 } as const;

interface PlayerSetup {
  readonly layout: FretboardLayout;
  readonly instrument: Instrument;
  readonly mode: PlayMode;
  readonly chords: readonly string[];
  readonly strumFilter: StrumFilter;
}

/**
 * **Player** — turns tracked hands into sound.
 *
 * @remarks
 * - The fretting hand selects a chord box (chord mode) or a fret (note mode); a fist mutes.
 * - The strumming index fingertip plays every string it crosses, louder the faster it moves.
 * - Exposes its state read-only for the renderer: points, hands, per-string energy.
 */
export class Player {
  layout!: FretboardLayout;
  instrument!: Instrument;
  mode: PlayMode = PlayMode.chord;
  chords: readonly string[] = [];
  slot = 0;
  fret = 0;
  isMuted = false;
  fretPoint: Point | null = null;
  strumPoint: Point | null = null;
  fretHand: readonly Point[] | null = null;
  strumHand: readonly Point[] | null = null;
  readonly energy: number[] = [];
  readonly trail: { p: Point; t: number }[] = [];
  onEvent: (e: PlayEvent) => void = () => {};

  private strumFilter: StrumFilter = StrumFilter.both;
  private manualFret: number | null = null;
  private readonly strum = new StrumDetector();
  private readonly fretSmooth = [new OneEuroFilter(FRET_FILTER.minCutoff, FRET_FILTER.beta), new OneEuroFilter(FRET_FILTER.minCutoff, FRET_FILTER.beta)] as const;
  private readonly strumSmooth = [new OneEuroFilter(STRUM_FILTER.minCutoff, STRUM_FILTER.beta), new OneEuroFilter(STRUM_FILTER.minCutoff, STRUM_FILTER.beta)] as const;
  private stringCount = 0;
  private fistFrames = 0;
  private lastCross = { when: -1, dir: 0 };
  private lastFrame = 0;

  constructor(private readonly sound: SoundOutputInterface) {}

  get chord(): string | undefined {
    return this.chords[this.slot];
  }

  configure(setup: PlayerSetup): void {
    if (this.stringCount !== setup.layout.strings) this.strum.reset();
    this.stringCount = setup.layout.strings;
    ({ layout: this.layout, instrument: this.instrument, mode: this.mode, chords: this.chords, strumFilter: this.strumFilter } = setup);
    if (this.slot >= this.chords.length) this.slot = 0;
    this.energy.length = setup.layout.strings;
    this.energy.fill(0);
  }

  /** One camera frame of hands in screen px. `canStrum` is false while the mouse strums instead. */
  updateHands(hands: readonly (readonly Point[])[], t: number, audioNow: number, canStrum: boolean): void {
    const { fret, strum } = assignHands(hands, this.layout);
    this.fretHand = fret;
    this.strumHand = strum;
    this.updateFretHand(fret, t);
    if (canStrum) this.feedStrum(this.strumTip(strum, t), t, audioNow);
  }

  /** Mouse / touch fallback for the strumming hand. */
  pointer(p: Point | null, t: number, audioNow: number): void {
    this.strumPoint = p;
    this.feedStrum(p, t, audioNow);
  }

  /** Keyboard selection: chord box in chord mode, fret in note mode. */
  select(index: number): void {
    if (this.mode === PlayMode.chord) {
      if (index < this.chords.length) this.slot = index;
    } else {
      this.manualFret = Math.min(index, this.layout.maxFret);
      this.fret = this.manualFret;
    }
  }

  private updateFretHand(hand: readonly Point[] | null, t: number): void {
    const tip = hand?.[HandLandmark.indexTip];
    const palm = hand?.[HandLandmark.middleMcp];
    if (!hand || !tip || !palm) {
      this.fretSmooth.forEach((f) => f.reset());
      this.fretPoint = null;
      this.fistFrames = 0;
      this.isMuted = false;
      if (this.mode === PlayMode.note) this.fret = this.manualFret ?? 0;
      return;
    }
    const p = { x: this.fretSmooth[0].filter(tip.x, t), y: this.fretSmooth[1].filter(tip.y, t) };
    this.fretPoint = p;
    this.fistFrames = extendedFingers(hand) === 0 && onNeck(this.layout, palm) ? this.fistFrames + 1 : 0;
    const wasMuted = this.isMuted;
    this.isMuted = this.fistFrames >= FIST_FRAMES;
    if (this.isMuted && !wasMuted) this.sound.damp(-1, 0);
    if (this.isMuted) return;
    if (this.mode === PlayMode.chord) this.slot = chordSlotSelection(this.layout, this.chords.length, p, this.slot);
    else this.fret = fretAt(this.layout, p);
  }

  private strumTip(hand: readonly Point[] | null, t: number): Point | null {
    const tip = hand?.[HandLandmark.indexTip];
    if (!tip) {
      this.strumSmooth.forEach((f) => f.reset());
      this.strumPoint = null;
      return null;
    }
    const p = { x: this.strumSmooth[0].filter(tip.x, t), y: this.strumSmooth[1].filter(tip.y, t) };
    this.strumPoint = inStrumArea(this.layout, p) ? p : null;
    return this.strumPoint;
  }

  private feedStrum(p: Point | null, t: number, audioNow: number): void {
    const dt = this.lastFrame ? Math.min(Timing.maxFrame, t - this.lastFrame) : Timing.defaultFrame;
    this.lastFrame = t;
    if (p) this.trail.push({ p, t });
    while (this.trail.length && t - (this.trail[0]?.t ?? t) > Timing.trail) this.trail.shift();
    const crossings = this.strum.update(p, t, strumStringYs(this.layout), this.layout.h);
    for (const c of crossings) this.play(c, audioNow + Timing.scheduleLead + c.frac * Math.min(dt, Timing.maxSpread));
  }

  private play(c: Crossing, when: number): void {
    if (this.strumFilter === StrumFilter.down && c.dir === StrumDirection.up) return;
    const tuning = this.instrument.tuning;
    const open = tuning[c.string] ?? 0;
    const midi = this.mode === PlayMode.chord
      ? (this.chord ? chordNotes(this.chord, tuning)[c.string] ?? null : open)
      : open + this.fret;
    const isNewGesture = when - this.lastCross.when > Timing.gestureGap || c.dir !== this.lastCross.dir;
    this.lastCross = { when, dir: c.dir };
    if (midi !== null) {
      const amp = speedToAmp(c.speed);
      this.sound.pluck(c.string, midi, amp, when, this.isMuted);
      if (this.isMuted && isNewGesture) this.sound.chuck(amp, when);
      this.energy[c.string] = Math.max(this.energy[c.string] ?? 0, this.isMuted ? amp * MUTED_ENERGY : amp);
    }
    if (this.mode === PlayMode.note && midi !== null) this.onEvent({ when, midi, isMuted: this.isMuted });
    else if (this.mode === PlayMode.chord && isNewGesture) this.emitChord(when);
  }

  private emitChord(when: number): void {
    const chord = this.isMuted ? undefined : this.chord;
    this.onEvent(chord === undefined ? { when, isMuted: this.isMuted } : { when, chord, isMuted: this.isMuted });
  }
}
