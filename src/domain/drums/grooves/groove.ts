import type { DrumPiece } from '@domain/drums/drum-piece';

/**
 * A groove the drum kit plays by itself: one lane of steps per piece, `subdiv` steps a beat, looped `bars` times.
 *
 * @remarks
 * Step: `.` rest, `x` a hit, `X` an accent, `g` a ghost note; on the hi-hat `o` is an open hit and `p` the pedal's
 * chick; on the snare `r` is a rim click (cross-stick); on the ride `b` is the bell.
 */
export interface Groove {
  readonly id: string;
  /** i18n keys of its name and of a line about it. */
  readonly title: string;
  readonly about: string;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly subdiv: number;
  readonly bars: number;
  readonly lanes: Readonly<Partial<Record<DrumPiece, string>>>;
}
