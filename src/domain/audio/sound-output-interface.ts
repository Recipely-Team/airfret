import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { HandStroke } from '@domain/drums/hand/hand-stroke';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { RetuneRequest } from '@domain/audio/retune-request';
import type { Voice } from '@domain/audio/voice';
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
  pluck(request: PluckRequest): void;
  retune(request: RetuneRequest): void;
  setVoiceVolume(voice: Voice, volume: number): void;
  /** Stops a ringing string; -1 stops all of them. */
  damp(string: number, when: number): void;
  /** Percussive strum on strings muted by the fretting hand. */
  chuck(amp: number, when: number): void;
  /** A fingertip lands on a string: the string stops ringing in each of `voices`, silently. */
  touch(string: number, when: number, voices: readonly Voice[]): void;
  /** A drum-kit stroke or pedal. */
  hitDrum(request: DrumHitRequest): void;
  /** A stroke on a hand drum (darbuka, congas, handpan…), voiced from its description. */
  hitHandDrum(stroke: HandStroke, velocity: number, when: number): void;
  /** Stops a ringing open hi-hat (the cymbals close). */
  chokeHiHat(when: number): void;
  click(when: number, isAccent: boolean): void;
  drum(kind: DrumKind, when: number, amp: number): void;
}
