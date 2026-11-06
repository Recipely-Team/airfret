import type { ChainKind } from '@domain/instruments/chain-kind';
import type { PlayMode } from '@domain/instruments/play-mode';
import type { Tuning } from '@domain/music/tuning';

/** A playable instrument: tuning plus the string-model parameters that give it its voice. */
export interface Instrument {
  readonly id: string;
  /** i18n key for the display name. */
  readonly name: string;
  readonly tuning: readonly number[];
  /** Frets drawn on the on-screen neck (what an air player can reach). */
  readonly maxFret: number;
  /** Frets on the real instrument (classical 19, steel-string 20, electric 22, bass 24): the guide and lessons use the full range. */
  readonly frets: number;
  /** Seconds for the fundamental to decay to −60 dB at 110 Hz. */
  readonly t60: number;
  /** Higher notes ring shorter: T60(f) = t60 · (110 / f)^t60Exponent. */
  readonly t60Exponent: number;
  /** 0 = dark and soft, 1 = bright and metallic. */
  readonly bright: number;
  /** Pluck point as a fraction of string length (0.5 = middle, warm). */
  readonly pick: number;
  /** Output trim per pluck. */
  readonly level: number;
  readonly chain: ChainKind;
  /** Which of its voices it plays with (`voice-catalog`). */
  readonly voice: string;
  /** Plays from recordings when they cover the note; false = the string synth only. */
  readonly isRecorded: boolean;
  readonly defaultMode: PlayMode;
  /**
   * A 12-string's courses: for each string, how many semitones above it its paired string is tuned (12 = an
   * octave, 0 = unison). Both sound on every pluck. Absent on single-course instruments.
   */
  readonly courses?: readonly number[];
  /**
   * One octave of fret positions in cents above the open string, when they aren't twelve equal semitones: a
   * saz's 17 (Yalcin Tura's ratios), with the in-between notes Turkish folk music needs.
   */
  readonly fretCents?: readonly number[];
  /** Its own tunings, when the guitar's or bass's by string count don't fit (a ukulele, a mandolin). */
  readonly tunings?: readonly Tuning[];
  /** Its own chord shapes (frets per string, null = not played), when they aren't the guitar's (a ukulele). */
  readonly chordShapes?: Readonly<Record<string, readonly (number | null)[]>>;
  /** The play modes it offers, when not all of them (a saz has no guitar chord shapes). */
  readonly modes?: readonly PlayMode[];
}
