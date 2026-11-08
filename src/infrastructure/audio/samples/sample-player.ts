import { Voice } from '@domain/audio/voice';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { RetuneRequest } from '@domain/audio/retune-request';
import type { ActiveSample } from '@infrastructure/audio/samples/active-sample';
import type { SampleSet } from '@infrastructure/audio/samples/sample-set';

const MIN_GAIN = 0.05;
/** Cutting or stopping a note fades it this fast — short enough to feel immediate, long enough not to click. */
const RELEASE_SECONDS = 0.03;
const CENTS_PER_SEMITONE = 100;
/** A looping note left unreleased stops by itself after this long, seconds (a lost key-up must not drone on). */
const MAX_HOLD = 30;

/**
 * **SamplePlayer** — voices an instrument from real recordings instead of the string synth.
 *
 * @remarks
 * - Keeps at most one note sounding per (voice, string): a new pluck on a string fades the old note,
 *   as a real string can only vibrate one way at a time.
 * - A ringing note can be bent or slid ({@link retune}) by ramping its detune, so legato still works.
 * - Output is dry (the recordings already carry the body and the room); the engine adds only reverb.
 */
export class SamplePlayer {
  private set: SampleSet | null = null;
  private readonly gains = new Map<Voice, GainNode>();
  private readonly active = new Map<string, ActiveSample>();

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    for (const voice of Object.values(Voice)) {
      const g = ctx.createGain();
      g.connect(destination);
      this.gains.set(voice, g);
    }
  }

  /** True while `string` of `voice` has a recording sounding (so a retune should bend it). */
  isSounding(voice: Voice, string: number): boolean {
    return this.active.has(this.key(voice, string));
  }

  get hasSet(): boolean {
    return this.set !== null && !this.set.isEmpty;
  }

  use(set: SampleSet | null): void {
    this.stopAll(this.ctx.currentTime);
    this.set = set;
  }

  setVoiceVolume(voice: Voice, volume: number): void {
    this.gains.get(voice)?.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
  }

  /** Plays a note from the set; returns false when the set can't cover it, so the caller can synth it. */
  pluck(r: PluckRequest, pan: number): boolean {
    const choice = this.set?.choose(r.string, r.midi);
    const bus = this.gains.get(r.voice);
    if (!choice || !bus) return false;
    const when = Math.max(r.when, this.ctx.currentTime);
    this.release(this.key(r.voice, r.string), when);
    const source = this.ctx.createBufferSource();
    source.buffer = choice.buffer;
    source.detune.value = choice.detune;
    const gain = this.ctx.createGain();
    gain.gain.value = Math.max(MIN_GAIN, Math.min(1, r.amp));
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(gain).connect(panner).connect(bus);
    if (choice.loop) {
      source.loop = true;
      source.loopStart = choice.loop.start;
      source.loopEnd = choice.loop.end;
    }
    source.start(when);
    source.stop(when + (choice.loop ? MAX_HOLD : choice.buffer.duration + RELEASE_SECONDS));
    this.active.set(this.key(r.voice, r.string), { source, gain, midi: r.midi, detune: choice.detune });
    return true;
  }

  retune(r: RetuneRequest): void {
    const note = this.active.get(this.key(r.voice, r.string));
    if (!note) return;
    const when = Math.max(r.when, this.ctx.currentTime);
    note.detune += (r.midi - note.midi) * CENTS_PER_SEMITONE;
    note.midi = r.midi;
    note.source.detune.linearRampToValueAtTime(note.detune, when + Math.max(0.001, r.glide));
  }

  damp(voice: Voice, string: number, when: number): void {
    if (string < 0) {
      for (const key of [...this.active.keys()]) if (key.startsWith(`${voice}:`)) this.release(key, when);
    } else {
      this.release(this.key(voice, string), when);
    }
  }

  stopAll(when: number): void {
    for (const key of [...this.active.keys()]) this.release(key, when);
  }

  private release(key: string, when: number): void {
    const note = this.active.get(key);
    if (!note) return;
    this.active.delete(key);
    const t = Math.max(when, this.ctx.currentTime);
    note.gain.gain.setTargetAtTime(0, t, RELEASE_SECONDS);
    note.source.stop(t + RELEASE_SECONDS * 4);
  }

  private key(voice: Voice, string: number): string {
    return `${voice}:${string}`;
  }
}
