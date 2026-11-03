/** Something the player just played: a strum gesture (chord mode) or a note (note mode). */
export interface PlayEvent {
  /** Audio-clock time the sound starts. */
  readonly when: number;
  readonly chord?: string;
  readonly midi?: number;
  readonly isMuted: boolean;
}
