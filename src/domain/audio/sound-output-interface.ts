import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { Instrument } from '@domain/instruments/instrument';

/**
 * **SoundOutputInterface** — port for everything the app makes audible.
 *
 * @remarks
 * - Times are on the output's own clock (`now`), so events can be scheduled sample-accurately.
 * - `when = 0` means "as soon as possible".
 */
export interface SoundOutputInterface {
  readonly now: number;
  start(instrument: Instrument): Promise<Result<void, Failure>>;
  setInstrument(instrument: Instrument): void;
  setVolume(volume: number): void;
  pluck(string: number, midi: number, amp: number, when: number, isMuted: boolean): void;
  /** Stops a ringing string; -1 stops all of them. */
  damp(string: number, when: number): void;
  /** Percussive strum on strings muted by the fretting hand. */
  chuck(amp: number, when: number): void;
  click(when: number, isAccent: boolean): void;
  drum(kind: DrumKind, when: number, amp: number): void;
}
