/** A section of a song as the band plays it: where it lies, what it repeats, and how full it sounds. */
export interface BandSection {
  readonly index: number;
  /** Beats from the song's start. */
  readonly start: number;
  readonly end: number;
  /** Sections with the same label are the same music (a stanza, a refrain): they are arranged alike. */
  readonly label: string;
  /** How many times this label has come before (0: its first time). */
  readonly occurrence: number;
  /** 1–5: how full the band plays it — 1 a single line, 5 everyone (the research report's energy levels). */
  readonly energy: number;
  /** Its last bar thins out (bass and beat drop) before the final climax: the strip-back. */
  readonly isThinEnd: boolean;
  /** The song's last section: it ends on a held chord, the beat on a final hit. */
  readonly isFinal: boolean;
}
