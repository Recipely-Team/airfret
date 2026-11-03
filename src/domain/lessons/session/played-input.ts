/** What the player produced: a strummed chord or a plucked note. */
export interface PlayedInput {
  readonly chord?: string;
  readonly midi?: number;
  /** Free mode: the chord the strummed notes formed, matched by root and quality. */
  readonly recognized?: { readonly root: number; readonly quality: string };
}
