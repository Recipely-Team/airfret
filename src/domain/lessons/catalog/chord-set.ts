/** A free-play chord palette, laid out on the neck in order. */
export interface ChordSet {
  readonly id: string;
  readonly name: string;
  readonly chords: readonly string[];
}
