/** What the fretting hand holds down in free mode. */
export interface Fretting {
  /** Fret per string, 0 = open. */
  readonly frets: readonly number[];
  /** Pitch bend per string in semitones (string pushed sideways). */
  readonly bends: readonly number[];
  /** Fingertips that are pressing a string, for drawing. */
  readonly presses: readonly { readonly string: number; readonly fret: number; readonly finger: number }[];
  /** Fret held by a barre (the index finger's when several fingers barre), or 0. */
  readonly barre: number;
}
