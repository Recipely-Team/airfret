import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-factories';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Instrument } from '@domain/instruments/instrument';

/** Records every sound request instead of making noise. */
export class FakeSoundOutput implements SoundOutputInterface {
  now = 0;
  readonly plucks: { string: number; midi: number; amp: number; when: number; isMuted: boolean }[] = [];
  readonly damps: number[] = [];
  readonly chucks: number[] = [];
  readonly clicks: { when: number; isAccent: boolean }[] = [];
  readonly drums: { kind: DrumKind; when: number }[] = [];

  start(): Promise<Result<void, never>> {
    return Promise.resolve(ok(undefined));
  }

  setInstrument(_instrument: Instrument): void {}
  setVolume(_volume: number): void {}

  pluck(string: number, midi: number, amp: number, when: number, isMuted: boolean): void {
    this.plucks.push({ string, midi, amp, when, isMuted });
  }

  damp(string: number): void {
    this.damps.push(string);
  }

  chuck(amp: number): void {
    this.chucks.push(amp);
  }

  click(when: number, isAccent: boolean): void {
    this.clicks.push({ when, isAccent });
  }

  drum(kind: DrumKind, when: number): void {
    this.drums.push({ kind, when });
  }
}
