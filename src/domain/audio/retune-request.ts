import type { Voice } from '@domain/audio/voice';

/** Changes the pitch of a string that is already ringing — a slide, bend, hammer-on or pull-off. */
export interface RetuneRequest {
  readonly string: number;
  /** Target pitch; fractional for bends. */
  readonly midi: number;
  /** Seconds to glide to the new pitch (≈0 for a hammer-on, longer for slides and bends). */
  readonly glide: number;
  /** New energy put into the string, 0–1: a hammer-on or pull-off sounds the new note. */
  readonly excite: number;
  readonly when: number;
  readonly voice: Voice;
}
