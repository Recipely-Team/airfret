import type { Instrument } from '@domain/instruments/instrument';

/** An instrument played from a keyboard: its sound, the keys it has, and how its keys respond and look. */
export interface KeyboardInstrument {
  readonly instrument: Instrument;
  /** Lowest and highest key (MIDI): the keyboard slides between them. */
  readonly low: number;
  readonly high: number;
  /** A piano plays louder the harder a key is struck; a harpsichord's plucked strings sound the same however hard. */
  readonly isTouchSensitive: boolean;
  /** Dark naturals and light sharps, as on a French harpsichord, instead of a piano's ivory and ebony. */
  readonly isReversedColours: boolean;
}
