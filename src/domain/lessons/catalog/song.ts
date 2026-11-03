import type { PlayMode } from '@domain/instruments/play-mode';

/**
 * **Song** — a lesson written in compact text notation.
 *
 * @remarks
 * - `chords`: "G:4 D:4" — chord name : length in beats.
 * - `pattern`: "D.DU.UDU" — one bar of strums, `subdiv` slots per beat.
 * - `notes`: "E4:1 r:1" — pitch (r = rest) : length in beats.
 */
export interface Song {
  readonly id: string;
  readonly title: string;
  /** i18n key of the credit line. */
  readonly credit: string;
  readonly level: 1 | 2 | 3;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly mode: PlayMode;
  /** Suggested instrument id. */
  readonly instrument: string;
  readonly chords?: string;
  readonly pattern?: string;
  readonly subdiv?: number;
  readonly notes?: string;
  /** i18n key of a one-line description. */
  readonly about: string;
}
