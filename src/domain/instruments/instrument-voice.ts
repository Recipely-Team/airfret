/**
 * One way an instrument can sound: real recordings, or the string synth with a given set of parameters.
 * Each instrument offers several, ranked by how close they come to recordings of the real instrument.
 */
export interface InstrumentVoice {
  readonly id: string;
  /** i18n key of the name shown in settings. */
  readonly name: string;
  /** Plays the instrument's recorded sample set (the synth still covers notes outside it). */
  readonly isRecorded: boolean;
  /** String-synth parameters that differ from the instrument's own (see `Instrument`). */
  readonly synth?: { readonly t60?: number; readonly t60Exponent?: number; readonly bright?: number };
}
