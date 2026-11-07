/** What arranging needs to know of an instrument: its range, whether it plays chords, whether its notes hold. */
export interface InstrumentProfile {
  readonly id: string;
  /** Lowest and highest notes it plays (MIDI). */
  readonly low: number;
  readonly high: number;
  /** One note at a time (a wind, the kemençe). */
  readonly isMonophonic: boolean;
  /** Its notes hold for as long as they are played (bowed, blown); a plucked or struck note fades. */
  readonly isSustained: boolean;
  /** A drum: it keeps the beat, it has no notes. */
  readonly isDrum: boolean;
}
