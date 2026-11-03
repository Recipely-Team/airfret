import type { StrumDirection } from '@domain/gesture/strum-direction';
import type { RecognizedChord } from '@domain/music/chords/recognized-chord';

/** Something the player just played: a strum gesture (chord mode) or a note (note mode). */
export interface PlayEvent {
  /** Audio-clock time the sound starts. */
  readonly when: number;
  readonly chord?: string;
  readonly midi?: number;
  readonly isMuted: boolean;
  /** Direction of the first string crossed. */
  readonly dir: StrumDirection;
  /** Strength of the stroke, 0–1. */
  readonly amp: number;
  /** Free mode: the chord the strummed notes actually form. */
  readonly recognized?: RecognizedChord;
}
