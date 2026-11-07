import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Instrument } from '@domain/instruments/instrument';
import type { PlayMode } from '@domain/instruments/play-mode';
import type { StrumFilter } from '@domain/settings/strum-filter';

/** What the player plays on: the neck on screen, the instrument, the mode, the chords, which strokes count, the capo. */
export interface PlayerSetup {
  readonly layout: FretboardLayout;
  readonly instrument: Instrument;
  readonly mode: PlayMode;
  readonly chords: readonly string[];
  readonly strumFilter: StrumFilter;
  /** Capo fret; the tuning passed in already includes it. */
  readonly capo: number;
}
