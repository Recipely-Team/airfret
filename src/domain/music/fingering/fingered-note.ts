/** One note as a player fingers it: which string, which fret. */
export interface FingeredNote {
  readonly midi: number;
  /** 0 = lowest string. */
  readonly string: number;
  /** 0 = open. */
  readonly fret: number;
}
