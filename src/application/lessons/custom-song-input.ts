/** What the player types to add a song. */
export interface CustomSongInput {
  readonly title: string;
  readonly bpm: number;
  readonly beatsPerBar: number;
  /** "G:4 D:4 Em:4 C:4" — chord : beats (a bare chord lasts one bar); or a melody, as text or JSON (`readMelody`). */
  readonly chords: string;
  readonly pattern: string;
}
