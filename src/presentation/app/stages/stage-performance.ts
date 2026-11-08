import type { Song } from '@domain/lessons/catalog/song';

/** A stage playing a song by itself (*Watch it play*): which songs it can, starting and stopping one, each frame of it. */
export interface StagePerformance {
  readonly isPlaying: boolean;
  /** The songs this instrument can play, its showcase piece first. */
  songs(all: readonly Song[]): Song[];
  /** Starts `song`; false when it can't be played here. */
  /** Starts a song; a drum given `drumPlan` (one entry a bar, see `drumBars`) plays it bar by bar as a band's build-up says. */
  play(song: Song, audioNow: number, drumPlan?: readonly number[]): boolean;
  stop(audioNow: number): void;
  /** One frame: sounds what comes up and shows it; false once the piece has ended. */
  perform(audioNow: number): boolean;
}
