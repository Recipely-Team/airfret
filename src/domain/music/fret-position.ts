/** A place on the fretboard: string index (0 = lowest) and fret (0 = open). */
export interface FretPosition {
  readonly string: number;
  readonly fret: number;
}
