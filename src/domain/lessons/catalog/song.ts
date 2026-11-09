import type { PlayMode } from '@domain/instruments/play-mode';

/**
 * **Song** — a lesson written in compact text notation.
 *
 * @remarks
 * - `chords`: "G:4 D:4" — chord name : length in beats.
 * - `pattern`: "D.DU.UDU" — one bar of strums, `subdiv` slots per beat.
 * - `notes`: "E4:1 r:1" — pitch (r = rest) : length in beats. "E4+B3+E2:1/3" sounds several strings at
 *   once (melody first, graded; the rest is harmony the guide plays); lengths may be fractions (triplets).
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
  /** Tuning id the song is written for (`tuning-catalog`); standard when absent. */
  readonly tuning?: string;
  readonly chords?: string;
  readonly pattern?: string;
  readonly subdiv?: number;
  readonly notes?: string;
  /** i18n key of a one-line description. */
  readonly about: string;
  /** A Western-tonal march (the national marches): a band keeps its own chords — never quartal harmony. */
  readonly isMarch?: boolean;
  /** Position in the beginner course (1, 2, …); absent for library songs. */
  readonly course?: number;
  /** i18n keys of the practical tips shown before the lesson. */
  readonly tips?: readonly string[];
}
