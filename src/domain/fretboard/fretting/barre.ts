/** One finger laid flat across a fret. */
export interface Barre {
  readonly finger: number;
  readonly fret: number;
  /** Strings it holds down, lowest first. */
  readonly strings: readonly number[];
}
