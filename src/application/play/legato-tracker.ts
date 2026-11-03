import { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Fretting } from '@domain/fretboard/fretting';

/** Strings vibrating louder than this are "ringing" and can be changed without a new pluck. */
const RINGING_ENERGY = 0.06;
const Glide = { hammer: 0.004, slide: 0.035, bend: 0.025 } as const;
const Excite = { hammer: 0.28, pullOff: 0.22, slide: 0 } as const;
/** Bend changes smaller than this (semitones) aren't worth a message. */
const BEND_EPSILON = 0.03;
const NO_FINGER = 0;

/**
 * **LegatoTracker** — turns fretting changes on ringing strings into pitch changes, the way a real
 * string answers the left hand alone.
 *
 * @remarks
 * - Same finger, same string, new fret → **slide** (glides through, no new attack).
 * - A different finger lands on or lifts off the string → **hammer-on / pull-off** (fast change plus a little energy).
 * - Same fret, sideways push → **bend / vibrato** (smooth glide).
 */
export class LegatoTracker {
  private lastFret: number[] = [];
  private lastBend: number[] = [];
  private lastFinger: number[] = [];

  constructor(private readonly sound: SoundOutputInterface) {}

  reset(strings: number): void {
    this.lastFret = new Array<number>(strings).fill(0);
    this.lastBend = new Array<number>(strings).fill(0);
    this.lastFinger = new Array<number>(strings).fill(NO_FINGER);
  }

  update(f: Fretting, tuning: readonly number[], soundingFret: (fret: number) => number, energy: readonly number[], when: number): void {
    tuning.forEach((open, s) => {
      const fret = f.frets[s] ?? 0;
      const bend = f.bends[s] ?? 0;
      const finger = f.presses.filter((p) => p.string === s && p.fret === fret)[0]?.finger ?? NO_FINGER;
      const prevFret = this.lastFret[s] ?? 0;
      const prevFinger = this.lastFinger[s] ?? NO_FINGER;
      const isBendOnly = fret === prevFret && Math.abs(bend - (this.lastBend[s] ?? 0)) >= BEND_EPSILON;
      this.lastBend[s] = bend;
      if (fret === prevFret && !isBendOnly) return;
      this.lastFret[s] = fret;
      this.lastFinger[s] = finger;
      if ((energy[s] ?? 0) < RINGING_ENERGY) return;
      const midi = open + soundingFret(fret) + bend;
      const isSlide = !isBendOnly && finger !== NO_FINGER && finger === prevFinger;
      const [glide, excite] = isBendOnly
        ? [Glide.bend, 0]
        : isSlide
          ? [Glide.slide, Excite.slide]
          : [Glide.hammer, fret > prevFret ? Excite.hammer : Excite.pullOff];
      this.sound.retune({ string: s, midi, glide, excite, when, voice: Voice.player });
    });
  }
}
