import type { Song } from '@domain/lessons/catalog/song';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';

/** One instrument of the band: it plays its part of a song by itself and draws itself playing it, in its own tile. */
export interface BandMember {
  readonly id: string;
  /** Sizes the instrument to its tile. */
  fit(w: number, h: number): void;
  /** Starts its part; false when it has none (the song doesn't suit it). */
  play(song: Song, audioNow: number): boolean;
  stop(audioNow: number): void;
  /** Advances one frame: what it plays now shows; false once its part has ended. */
  perform(audioNow: number, now: number): boolean;
  draw(renderer: StageRenderer, audioNow: number, now: number): void;
}
