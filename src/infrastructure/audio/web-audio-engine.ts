import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { midiToFreq } from '@domain/music/pitch';
import type { AudioChain } from '@infrastructure/audio/chains/audio-chain';
import { buildChain } from '@infrastructure/audio/chains/build-chain';
import { impulseResponse } from '@infrastructure/audio/chains/impulse-response';
import { DrumKit } from '@infrastructure/audio/drum-kit';
import { AssetPath } from '@infrastructure/constants/assets';

const Level = { master: 0.8, click: 0.5, chuck: 0.35, mutedPluck: 0.8, minAmp: 0.05 } as const;
const Reverb = { seconds: 2.2, decay: 3.2 } as const;
const Muted = { t60: 0.09, brightness: 0.6 } as const;
/** Higher notes ring shorter: t60 scales with (110 Hz / f)^exponent. */
const DECAY_REFERENCE_HZ = 110;
const DECAY_EXPONENT = 0.45;
const STEREO_WIDTH = 0.5;
const SMOOTHING = 0.02;
const CHUCK = { guitarHz: 2200, bassHz: 700, q: 1.2, attack: 0.003, length: 0.06 } as const;

/**
 * **WebAudioEngine** — the `SoundOutputInterface` on Web Audio.
 *
 * @remarks
 * - Strings come from a Karplus–Strong AudioWorklet (`public/worklets/strings.js`), sample-accurate.
 * - Graph: string bank → instrument chain → dry bus + shared reverb → master → limiter.
 */
export class WebAudioEngine implements SoundOutputInterface {
  private readonly ctx = new AudioContext({ latencyHint: 'interactive' });
  private readonly master: GainNode;
  private readonly chainOut: GainNode;
  private readonly reverbIn: GainNode;
  private readonly noise: AudioBuffer;
  private readonly drums: DrumKit;
  private readonly chains = new Map<ChainKind, AudioChain>();
  private bank: AudioWorkletNode | null = null;
  private current: AudioChain | null = null;
  private instrument: Instrument | null = null;

  constructor() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = Level.master;
    this.master.connect(limiter(ctx)).connect(ctx.destination);
    const reverb = ctx.createConvolver();
    reverb.buffer = impulseResponse(ctx, Reverb.seconds, Reverb.decay);
    this.reverbIn = ctx.createGain();
    this.reverbIn.connect(reverb).connect(this.master);
    this.chainOut = ctx.createGain();
    this.chainOut.connect(this.master);
    this.chainOut.connect(this.reverbIn);
    const clickBus = ctx.createGain();
    clickBus.gain.value = Level.click;
    clickBus.connect(this.master);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    this.noise.getChannelData(0).forEach((_, i, d) => (d[i] = Math.random() * 2 - 1));
    this.drums = new DrumKit(ctx, clickBus, this.noise);
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  async start(instrument: Instrument): Promise<Result<void, Failure>> {
    void this.ctx.resume();
    try {
      await this.ctx.audioWorklet.addModule(`${import.meta.env.BASE_URL}${AssetPath.stringWorklet}`);
    } catch (e) {
      return fail(new Failure(FailureCode.audioUnavailable, String(e)));
    }
    this.bank = new AudioWorkletNode(this.ctx, 'string-bank', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
    this.setInstrument(instrument);
    return ok(undefined);
  }

  setVolume(volume: number): void {
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTHING);
  }

  setInstrument(instrument: Instrument): void {
    this.instrument = instrument;
    if (!this.bank) return;
    this.damp(-1, 0);
    let chain = this.chains.get(instrument.chain);
    if (!chain) {
      chain = buildChain(this.ctx, instrument.chain);
      chain.output.connect(this.chainOut);
      this.chains.set(instrument.chain, chain);
    }
    if (this.current) this.bank.disconnect();
    this.bank.connect(chain.input);
    this.current = chain;
    this.reverbIn.gain.setTargetAtTime(chain.reverbSend, this.ctx.currentTime, SMOOTHING);
  }

  pluck(string: number, midi: number, amp: number, when: number, isMuted: boolean): void {
    const inst = this.instrument;
    if (!this.bank || !inst) return;
    const freq = midiToFreq(midi);
    const level = Math.min(1, Math.max(Level.minAmp, amp));
    this.bank.port.postMessage({
      type: 'pluck',
      when,
      string,
      freq,
      amp: inst.level * level * (isMuted ? Level.mutedPluck : 1),
      t60: isMuted ? Muted.t60 : inst.t60 * Math.pow(DECAY_REFERENCE_HZ / freq, DECAY_EXPONENT),
      bright: isMuted ? inst.bright * Muted.brightness : inst.bright * (0.75 + 0.25 * level),
      pick: inst.pick,
      pan: (string / Math.max(1, inst.tuning.length - 1) - 0.5) * STEREO_WIDTH,
    });
  }

  damp(string: number, when: number): void {
    this.bank?.port.postMessage({ type: 'damp', when, string });
  }

  chuck(amp: number, when: number): void {
    if (!this.current) return;
    const t = Math.max(when, this.ctx.currentTime);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = this.instrument?.chain === ChainKind.bass ? CHUCK.bassHz : CHUCK.guitarHz;
    bp.Q.value = CHUCK.q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(Level.chuck * amp, t + CHUCK.attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + CHUCK.length);
    src.connect(bp).connect(g).connect(this.current.input);
    src.start(t);
    src.stop(t + CHUCK.length + 0.02);
  }

  click(when: number, isAccent: boolean): void {
    this.drums.click(when, isAccent);
  }

  drum(kind: DrumKind, when: number, amp: number): void {
    this.drums.play(kind, when, amp);
  }
}

function limiter(ctx: AudioContext): DynamicsCompressorNode {
  const l = ctx.createDynamicsCompressor();
  l.threshold.value = -6;
  l.knee.value = 6;
  l.ratio.value = 12;
  l.attack.value = 0.002;
  l.release.value = 0.15;
  return l;
}
