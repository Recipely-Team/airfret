import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-factories';
import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { RetuneRequest } from '@domain/audio/retune-request';
import type { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Instrument } from '@domain/instruments/instrument';

/** Records every sound request instead of making noise. */
export class FakeSoundOutput implements SoundOutputInterface {
  now = 0;
  readonly plucks: PluckRequest[] = [];
  readonly retunes: RetuneRequest[] = [];
  readonly volumes: Partial<Record<Voice, number>> = {};
  readonly damps: number[] = [];
  readonly chucks: number[] = [];
  readonly clicks: { when: number; isAccent: boolean }[] = [];
  readonly drums: { kind: DrumKind; when: number }[] = [];

  start(): Promise<Result<void, never>> {
    return Promise.resolve(ok(undefined));
  }

  setInstrument(_instrument: Instrument): void {}
  setVolume(_volume: number): void {}

  pluck(request: PluckRequest): void {
    this.plucks.push(request);
  }

  retune(request: RetuneRequest): void {
    this.retunes.push(request);
  }

  setVoiceVolume(voice: Voice, volume: number): void {
    this.volumes[voice] = volume;
  }

  damp(string: number): void {
    this.damps.push(string);
  }

  chuck(amp: number): void {
    this.chucks.push(amp);
  }

  readonly touches: number[] = [];
  fretNoises = 0;

  /** Each touch's voices, in order. */
  readonly touchedVoices: (readonly Voice[])[] = [];

  touch(string: number, _when: number, voices: readonly Voice[]): void {
    this.touches.push(string);
    this.touchedVoices.push(voices);
  }

  fretNoise(): void {
    this.fretNoises++;
  }

  readonly drumHits: DrumHitRequest[] = [];
  chokes = 0;

  hitDrum(request: DrumHitRequest): void {
    this.drumHits.push(request);
  }

  chokeHiHat(): void {
    this.chokes++;
  }

  click(when: number, isAccent: boolean): void {
    this.clicks.push({ when, isAccent });
  }

  drum(kind: DrumKind, when: number): void {
    this.drums.push({ kind, when });
  }
}
