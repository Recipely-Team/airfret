/** A key going down: which, how hard (0–1), and where within the frame it happened (0–1). */
export interface KeyPress {
  readonly midi: number;
  readonly velocity: number;
  readonly frac: number;
}
