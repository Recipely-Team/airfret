import type { Instrument } from '@domain/instruments/instrument';

/** An instrument played from a keyboard: its sound, the keys it has, and how its keys respond and look. */
export interface KeyboardInstrument {
  readonly instrument: Instrument;
  /** Lowest and highest key (MIDI): the keyboard slides between them. */
  readonly low: number;
  readonly high: number;
  /** A piano plays louder the harder a key is struck; a harpsichord's plucked strings sound the same however hard. */
  readonly isTouchSensitive: boolean;
  /**
   * How its keys look: a piano's ivory and ebony, a French harpsichord's reversed (dark naturals), a marimba's
   * rosewood bars, a glockenspiel's or xylophone's metal or bright wood, a kanun's pale strings.
   */
  readonly look: 'ivory' | 'reversed' | 'rosewood' | 'metal' | 'kanun';
  /** A damper stops a note when its key rises (piano, harpsichord); a struck bar rings on (marimba, glockenspiel). */
  readonly isDamped: boolean;
  /** One note at a time (a clarinet, a trumpet): playing by itself, it keeps a song's melody alone. */
  readonly isMonophonic?: boolean;
}
