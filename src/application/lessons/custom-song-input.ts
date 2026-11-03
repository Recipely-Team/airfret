/** What the player types to add a song. */
export interface CustomSongInput {
  readonly title: string;
  readonly bpm: number;
  readonly beatsPerBar: number;
  /** "G:4 D:4 Em:4 C:4" — chord : beats. A bare chord ("G") lasts one bar. */
  readonly chords: string;
  readonly pattern: string;
}
