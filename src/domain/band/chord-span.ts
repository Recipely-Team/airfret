/** A chord of a song over a span of beats: its bass note (MIDI) and its tones (pitch classes, root first). */
export interface ChordSpan {
  readonly beat: number;
  readonly end: number;
  readonly bass: number;
  readonly tones: readonly number[];
}
