/** What the player produced: a strummed chord or a plucked note. */
export interface PlayedInput {
  readonly chord?: string;
  readonly midi?: number;
}
