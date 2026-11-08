/** One moment of a part: when (beats), how long, and the notes it sounds (MIDI, highest first). */
export interface PartEvent {
  readonly beat: number;
  readonly dur: number;
  readonly midis: readonly number[];
}
