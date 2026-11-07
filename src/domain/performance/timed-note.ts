/** A note of a piece, in beats from its start: when it sounds, how long it is held, how strongly, and whether it is the tune. */
export interface TimedNote {
  readonly beat: number;
  readonly dur: number;
  readonly midi: number;
  /** 0–1. */
  readonly velocity: number;
  /** The melody line (false: the bass and inner voices under it). */
  readonly isMelody: boolean;
}
