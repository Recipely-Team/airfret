import type { Song } from '@domain/lessons/catalog/song';

/** A stage playing a song by itself (*Watch it play*): which songs it can, starting and stopping one, each frame of it. */
export interface StagePerformance {
  readonly isPlaying: boolean;
  /** The songs this instrument can play, its showcase piece first. */
  songs(all: readonly Song[]): Song[];
  /** Starts `song`; false when it can't be played here. */
  play(song: Song, audioNow: number): boolean;
  stop(audioNow: number): void;
  /** One frame: sounds what comes up and shows it; false once the piece has ended. */
  perform(audioNow: number): boolean;
}
