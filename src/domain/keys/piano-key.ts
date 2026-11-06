/** One key on screen: its note and its rectangle. Black keys are shorter and sit on top of the whites. */
export interface PianoKey {
  readonly midi: number;
  readonly isBlack: boolean;
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}
