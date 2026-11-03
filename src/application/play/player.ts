import { assignHands } from '@application/play/assign-hands';
import { GestureCollector } from '@application/play/gesture-collector';
import { LegatoTracker } from '@application/play/legato-tracker';
import { chordSlotSelection } from '@application/play/chord-slot-selection';
import type { PlayEvent } from '@application/play/play-event';
import { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Fretting } from '@domain/fretboard/fretting';
import { mapFretting } from '@domain/fretboard/map-fretting';
import { fingerStrike } from '@domain/gesture/finger-strike';
import { isPalmMuting } from '@domain/gesture/palm-mute';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { fretAt, inStrumArea, onNeck, strumStringYs } from '@domain/fretboard/neck-geometry';
import { pluckPosition } from '@domain/fretboard/pluck-position';
import type { Point } from '@domain/fretboard/point';
import type { Crossing } from '@domain/gesture/crossing';
import { OneEuroFilter } from '@domain/gesture/one-euro-filter';
import { StrumDetector } from '@domain/gesture/strum-detector';
import { StrumDirection } from '@domain/gesture/strum-direction';
import { speedToAmp } from '@domain/gesture/strum-velocity';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { CHORD_SHAPES } from '@domain/music/chords/chord-shapes';
import { chordNotes } from '@domain/music/chords/chord-voicing';
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
/** A fingertip resting on a string this long stops it; passing over it on the way does not. */
const REST_TO_DAMP_SECONDS = 0.15;
const MUTED_ENERGY = 0.3;
const FRET_FILTER = { minCutoff: 1, beta: 0.02 } as const;
const STRUM_FILTER = { minCutoff: 4, beta: 0.05 } as const;

interface PlayerSetup {
  readonly layout: FretboardLayout;
  readonly instrument: Instrument;
  readonly mode: PlayMode;
  readonly chords: readonly string[];
  readonly strumFilter: StrumFilter;
  /** Capo fret; the tuning passed in already includes it. */
  readonly capo: number;
}

/**
 * **Player** — turns tracked hands into sound.
 *
 * @remarks
 * - The fretting hand selects a chord (chord mode) or a fret (note mode); a fist mutes; changing chord squeaks the wound strings.
 * - The strumming fingertip bends each string it presses and plucks it when it slips off; where along the string it plucks sets the tone.
 * - Re-strumming lets strings ring on; only a fingertip *resting* on a string (≥ 0.15 s) stops it.
 * - Exposes its state read-only for the renderer: points, hands, touched strings, per-string energy.
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
  /** Strings currently bent under the strumming fingertip. */
  touching: readonly number[] = [];
  /** Release distance in px — how far a string bends before it snaps. */
  releaseBand = 0;
  /** Free mode: what the fretting hand holds. */
  fretting: Fretting | null = null;
  /** Free mode: name of the last chord strummed. */
  lastChordName = '';
  /** Part of the finger striking the strings right now. */
  strike: StrikeSurface = StrikeSurface.nail;
  isPalmMuted = false;
  capo = 0;
  readonly energy: number[] = [];
  readonly trail: { p: Point; t: number }[] = [];
  onEvent: (e: PlayEvent) => void = () => {};
  private readonly gestures = new GestureCollector((e) => {
    if (e.chord) this.lastChordName = e.chord;
    this.onEvent(e);
  });
  private readonly legato: LegatoTracker;

  private strumFilter: StrumFilter = StrumFilter.both;
  private manualFret: number | null = null;
  private readonly strum = new StrumDetector();
  private readonly fretSmooth = [new OneEuroFilter(FRET_FILTER.minCutoff, FRET_FILTER.beta), new OneEuroFilter(FRET_FILTER.minCutoff, FRET_FILTER.beta)] as const;
  private readonly strumSmooth = [new OneEuroFilter(STRUM_FILTER.minCutoff, STRUM_FILTER.beta), new OneEuroFilter(STRUM_FILTER.minCutoff, STRUM_FILTER.beta)] as const;
  private stringCount = 0;
  private fistFrames = 0;
  private lastCross = { when: -1, dir: 0 };
  private lastFrame = 0;
  /** When each currently touched string was first touched, and whether it has been damped. */
  private readonly touchedSince = new Map<number, { since: number; isDamped: boolean }>();

  constructor(private readonly sound: SoundOutputInterface) {
    this.legato = new LegatoTracker(sound);
  }

  get chord(): string | undefined {
    return this.chords[this.slot];
  }

  /** Fret (counted from the nut) each string is stopped at right now, 0 = open; for tone and drawing. */
  stringFret(string: number): number {
    if (this.mode === PlayMode.free) return this.fretting?.frets[string] ?? 0;
    if (this.mode === PlayMode.note) return this.fret;
    const shapeFret = (this.chord ? CHORD_SHAPES[this.chord]?.[string] : 0) ?? 0;
    return shapeFret > 0 ? shapeFret + this.capo : this.capo;
  }

  /** Free mode works in absolute frets; the tuning already includes the capo. */
  private soundingFret = (fret: number): number => (fret > this.capo ? fret - this.capo : 0);

  configure(setup: PlayerSetup): void {
    if (this.stringCount !== setup.layout.strings) this.strum.reset();
    this.stringCount = setup.layout.strings;
    ({ layout: this.layout, instrument: this.instrument, mode: this.mode, chords: this.chords, strumFilter: this.strumFilter, capo: this.capo } = setup);
    this.legato.reset(setup.layout.strings);
    this.fretting = null;
    if (this.slot >= this.chords.length) this.slot = 0;
    this.energy.length = setup.layout.strings;
    this.energy.fill(0);
    this.releaseBand = this.strum.releaseBand(setup.layout.h);
  }

  /** One camera frame of hands in screen px. `canStrum` is false while the mouse strums instead. */
  updateHands(hands: readonly (readonly Point[])[], t: number, audioNow: number, canStrum: boolean): void {
    const { fret, strum } = assignHands(hands, this.layout);
    this.fretHand = fret;
    this.strumHand = strum;
    this.updateFretHand(fret, t, audioNow);
    if (canStrum) this.feedStrum(this.strumTip(strum, t), t, audioNow);
  }

  /** Mouse / touch fallback for the strumming hand. */
  pointer(p: Point | null, t: number, audioNow: number): void {
    this.strumPoint = p;
    this.feedStrum(p, t, audioNow);
  }

  /** Keyboard selection: chord in chord mode, fret in note mode. */
  select(index: number): void {
    if (this.mode === PlayMode.chord) {
      if (index < this.chords.length) this.slot = index;
    } else {
      this.manualFret = Math.min(index, this.layout.maxFret);
      this.fret = this.manualFret;
    }
  }

  private updateFretHand(hand: readonly Point[] | null, t: number, audioNow: number): void {
    const tip = hand?.[HandLandmark.indexTip];
    const palm = hand?.[HandLandmark.middleMcp];
    if (!hand || !tip || !palm) {
      this.fretSmooth.forEach((f) => f.reset());
      this.fretPoint = null;
      this.fretting = null;
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
    if (this.mode === PlayMode.free) {
      this.fretting = mapFretting(this.layout, hand, this.fretting);
      this.legato.update(this.fretting, this.instrument.tuning, this.soundingFret, this.energy, audioNow);
      return;
    }
    const before = this.mode === PlayMode.chord ? this.slot : this.fret;
    if (this.mode === PlayMode.chord) this.slot = chordSlotSelection(this.layout, this.chords.length, p, this.slot);
    else this.fret = fretAt(this.layout, p);
    if ((this.mode === PlayMode.chord ? this.slot : this.fret) !== before) this.sound.fretNoise(audioNow);
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
    const ys = strumStringYs(this.layout);
    this.isPalmMuted = isPalmMuting(this.layout, this.strumHand);
    const crossings = this.strum.update(p, t, ys, this.layout.h);
    for (const c of crossings) this.play(c, audioNow + Timing.scheduleLead + c.frac * Math.min(dt, Timing.maxSpread));
    this.touching = this.strum.touching(p, ys, this.layout.h);
    this.dampRestingStrings(t, audioNow);
    this.gestures.tick(t);
  }

  /** Only a fingertip that stays on a string mutes it — a hand sweeping past lets everything ring. */
  private dampRestingStrings(t: number, audioNow: number): void {
    for (const s of [...this.touchedSince.keys()]) if (!this.touching.includes(s)) this.touchedSince.delete(s);
    for (const s of this.touching) {
      const touch = this.touchedSince.get(s) ?? { since: t, isDamped: false };
      if (!touch.isDamped && t - touch.since >= REST_TO_DAMP_SECONDS) {
        this.sound.touch(s, audioNow);
        touch.isDamped = true;
      }
      this.touchedSince.set(s, touch);
    }
  }

  private play(c: Crossing, when: number): void {
    if (this.strumFilter === StrumFilter.down && c.dir === StrumDirection.up) return;
    // A tracked hand must strike with nail or pad; the mouse always plays.
    this.strike = this.strumHand ? fingerStrike(this.strumHand, c.dir, !this.layout.isLefty) : StrikeSurface.nail;
    if (this.strike === StrikeSurface.none) return;
    const midi = this.noteOf(c.string);
    const isNewGesture = when - this.lastCross.when > Timing.gestureGap || c.dir !== this.lastCross.dir;
    this.lastCross = { when, dir: c.dir };
    const amp = speedToAmp(c.speed);
    if (midi !== null) {
      const position = pluckPosition(this.layout, c.x, this.stringFret(c.string));
      this.sound.pluck({
        string: c.string, midi, amp, when, isMuted: this.isMuted, position, voice: Voice.player,
        attack: this.strike, isPalmMuted: this.isPalmMuted,
      });
      if (this.isMuted && isNewGesture) this.sound.chuck(amp, when);
      const isDamped = this.isMuted || this.isPalmMuted;
      this.energy[c.string] = Math.max(this.energy[c.string] ?? 0, isDamped ? amp * MUTED_ENERGY : amp);
    }
    this.report(c, when, amp, midi, isNewGesture);
  }

  /** Pitch the string sounds when plucked now, or null if the chord shape leaves it out. */
  private noteOf(string: number): number | null {
    const tuning = this.instrument.tuning;
    const open = tuning[string] ?? 0;
    if (this.mode === PlayMode.free) {
      const fret = this.fretting?.frets[string] ?? 0;
      return open + this.soundingFret(fret) + (this.fretting?.bends[string] ?? 0);
    }
    if (this.mode === PlayMode.note) return open + this.fret;
    return this.chord ? chordNotes(this.chord, tuning)[string] ?? null : open;
  }

  private report(c: Crossing, when: number, amp: number, midi: number | null, isNewGesture: boolean): void {
    const base = { when, isMuted: this.isMuted, dir: c.dir, amp };
    if (this.mode === PlayMode.free) {
      this.gestures.add(this.lastFrame, when, c.dir, amp, this.isMuted, midi === null ? null : Math.round(midi), isNewGesture);
    } else if (this.mode === PlayMode.note && midi !== null) {
      this.onEvent({ ...base, midi });
    } else if (this.mode === PlayMode.chord && isNewGesture) {
      const chord = this.isMuted ? undefined : this.chord;
      this.onEvent(chord === undefined ? base : { ...base, chord });
    }
  }
}
