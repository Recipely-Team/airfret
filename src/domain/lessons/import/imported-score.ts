/** A piece read from a file (MIDI, MusicXML, ABC): its notes in beats (quarter notes), its tempo and meter, maybe a title. */
export interface ImportedScore {
  readonly title?: string;
  readonly bpm: number;
  /** Quarter-note beats in a bar (6/8 → 3). */
  readonly beatsPerBar: number;
  readonly notes: readonly { readonly beat: number; readonly dur: number; readonly midi: number }[];
}
