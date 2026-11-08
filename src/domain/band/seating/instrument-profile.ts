import type { InstrumentKind } from '@domain/band/seating/instrument-kind';

/** What arranging needs to know of an instrument: its family, its range, whether it plays chords, whether its notes hold. */
export interface InstrumentProfile {
  readonly id: string;
  readonly kind: InstrumentKind;
  /** Lowest and highest notes it plays (MIDI). */
  readonly low: number;
  readonly high: number;
  /** One note at a time (a wind, the kemençe). */
  readonly isMonophonic: boolean;
  /** Its notes hold for as long as they are played (bowed, blown); a plucked or struck note fades. */
  readonly isSustained: boolean;
  /** A drum: it keeps the beat, it has no notes. */
  readonly isDrum: boolean;
  /** How loud it is against a woodwind at the same marking (1): a trumpet 4, a horn 2 (Rimsky-Korsakov's forte table). */
  readonly weight: number;
}
