import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { RetuneRequest } from '@domain/audio/retune-request';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { midiToFreq } from '@domain/music/pitch';
import { clamp } from '@core/math/clamp';
import type { AudioChain } from '@infrastructure/audio/chains/audio-chain';
import { buildChain } from '@infrastructure/audio/chains/build-chain';
import { impulseResponse } from '@infrastructure/audio/chains/impulse-response';
import { DrumKit } from '@infrastructure/audio/drum-kit';
import { AcousticKit } from '@infrastructure/audio/drums/acoustic-kit';
import { AssetPath } from '@infrastructure/constants/assets';

const Level = { master: 0.8, click: 0.5, chuck: 0.35, mutedPluck: 0.8, minAmp: 0.05 } as const;
const Reverb = { seconds: 2.2, decay: 3.2 } as const;
const Muted = { t60: 0.09, brightness: 0.6 } as const;
/** Palm resting by the bridge: notes still pitch, but die in a quarter second and lose their top. */
const PalmMuted = { t60: 0.25, brightness: 0.5 } as const;
/** Nail vs fleshy pad: the nail adds brightness and a pick-like tick; the pad rounds the attack off. */
const ATTACK_BRIGHTNESS = { nail: 0.12, pad: -0.18 } as const;
const STIFFNESS = { acoustic: 0.12, nylon: 0.05, clean: 0.1, drive: 0.1, bass: 0.22 } as const;
/** Higher notes ring shorter: t60 scales with (110 Hz / f)^exponent. */
const DECAY_REFERENCE_HZ = 110;
const DECAY_EXPONENT = 0.45;
const STEREO_WIDTH = 0.5;
const KIT_LEVEL = 0.9;
/** Drums sit in a small room: a little of the shared reverb. */
const KIT_ROOM = 0.6;
const SMOOTHING = 0.02;
const CHUCK = { guitarHz: 2200, bassHz: 700, q: 1.2, attack: 0.003, length: 0.06 } as const;
/** Pick hitting the string: a 3 ms bright tick, louder for harder strokes. */
const PICK = { highpassHz: 3000, level: 0.09, length: 0.004 } as const;
/** Fingertip landing on a string. */
const TOUCH = { bandHz: 3200, level: 0.025, length: 0.03 } as const;
/** Fingers sliding over wound strings: a short rising squeak. */
const SQUEAK = { fromHz: 1400, toHz: 3200, q: 6, level: 0.05, length: 0.12 } as const;
/** Plucking nearer the bridge than this is brighter, farther is darker. */
const NEUTRAL_POSITION = 0.2;
const POSITION_BRIGHTNESS = 1.1;

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
  private readonly kit: AcousticKit;
  private readonly chains = new Map<ChainKind, AudioChain>();
  private readonly banks = new Map<Voice, AudioWorkletNode>();
  private readonly voiceGains = new Map<Voice, GainNode>();
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
    const kitBus = ctx.createGain();
    kitBus.gain.value = KIT_LEVEL;
    kitBus.connect(this.master);
    const kitRoom = ctx.createGain();
    kitRoom.gain.value = KIT_ROOM;
    kitBus.connect(kitRoom).connect(this.reverbIn);
    this.kit = new AcousticKit(ctx, kitBus, this.noise);
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
    for (const voice of Object.values(Voice)) {
      const bank = new AudioWorkletNode(this.ctx, 'string-bank', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      const g = this.ctx.createGain();
      bank.connect(g);
      this.banks.set(voice, bank);
      this.voiceGains.set(voice, g);
    }
    this.setInstrument(instrument);
    return ok(undefined);
  }

  setVolume(volume: number): void {
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTHING);
  }

  setVoiceVolume(voice: Voice, volume: number): void {
    this.voiceGains.get(voice)?.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTHING);
  }

  setInstrument(instrument: Instrument): void {
    this.instrument = instrument;
    if (!this.banks.size) return;
    this.banks.forEach((b) => b.port.postMessage({ type: 'damp', when: 0, string: -1 }));
    let chain = this.chains.get(instrument.chain);
    if (!chain) {
      chain = buildChain(this.ctx, instrument.chain);
      chain.output.connect(this.chainOut);
      this.chains.set(instrument.chain, chain);
    }
    for (const g of this.voiceGains.values()) {
      if (this.current) g.disconnect();
      g.connect(chain.input);
    }
    this.current = chain;
    this.reverbIn.gain.setTargetAtTime(chain.reverbSend, this.ctx.currentTime, SMOOTHING);
  }

  pluck(r: PluckRequest): void {
    const inst = this.instrument;
    const bank = this.banks.get(r.voice);
    if (!bank || !inst) return;
    const freq = midiToFreq(r.midi);
    const level = Math.min(1, Math.max(Level.minAmp, r.amp));
    const attack = r.attack === StrikeSurface.pad ? ATTACK_BRIGHTNESS.pad : ATTACK_BRIGHTNESS.nail;
    const tone = inst.bright * (0.75 + 0.25 * level) + (NEUTRAL_POSITION - r.position) * POSITION_BRIGHTNESS + attack;
    const ring = inst.t60 * Math.pow(DECAY_REFERENCE_HZ / freq, DECAY_EXPONENT);
    bank.port.postMessage({
      type: 'pluck',
      when: r.when,
      string: r.string,
      freq,
      amp: inst.level * level * (r.isMuted ? Level.mutedPluck : 1),
      t60: r.isMuted ? Muted.t60 : r.isPalmMuted ? PalmMuted.t60 : ring,
      bright: r.isMuted ? inst.bright * Muted.brightness : clamp(r.isPalmMuted ? tone * PalmMuted.brightness : tone, 0.05, 1),
      stiffness: STIFFNESS[inst.chain],
      pick: r.position,
      pan: (r.string / Math.max(1, inst.tuning.length - 1) - 0.5) * STEREO_WIDTH,
    });
    if (inst.chain !== ChainKind.nylon && r.attack === StrikeSurface.nail) this.noiseBurst('highpass', PICK.highpassHz, 0.7, r.when, PICK.level * level, PICK.length);
  }

  retune(r: RetuneRequest): void {
    const inst = this.instrument;
    const freq = midiToFreq(r.midi);
    this.banks.get(r.voice)?.port.postMessage({
      type: 'retune', when: r.when, string: r.string, freq, glide: r.glide, excite: r.excite,
      t60: inst ? inst.t60 * Math.pow(DECAY_REFERENCE_HZ / freq, DECAY_EXPONENT) : 0,
    });
  }

  touch(string: number, when: number): void {
    this.banks.get(Voice.player)?.port.postMessage({ type: 'damp', when, string });
    this.noiseBurst('bandpass', TOUCH.bandHz, 1, when, TOUCH.level, TOUCH.length);
  }

  fretNoise(when: number): void {
    if (!this.current || this.instrument?.chain === ChainKind.nylon) return;
    const t = Math.max(when, this.ctx.currentTime);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = SQUEAK.q;
    bp.frequency.setValueAtTime(SQUEAK.fromHz, t);
    bp.frequency.exponentialRampToValueAtTime(SQUEAK.toHz, t + SQUEAK.length);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(SQUEAK.level, t + SQUEAK.length * 0.3);
    g.gain.linearRampToValueAtTime(0, t + SQUEAK.length);
    src.connect(bp).connect(g).connect(this.current.input);
    src.start(t, Math.random() * 0.5);
    src.stop(t + SQUEAK.length + 0.02);
  }

  damp(string: number, when: number): void {
    this.banks.get(Voice.player)?.port.postMessage({ type: 'damp', when, string });
  }

  private noiseBurst(type: BiquadFilterType, freq: number, q: number, when: number, level: number, length: number): void {
    if (!this.current) return;
    const t = Math.max(when, this.ctx.currentTime);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(f).connect(g).connect(this.current.input);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.01);
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

  hitDrum(r: DrumHitRequest): void {
    this.kit.hit(r);
  }

  chokeHiHat(when: number): void {
    this.kit.choke(when);
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
