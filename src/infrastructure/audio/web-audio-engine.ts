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
import type { AudioChain } from '@infrastructure/audio/chains/audio-chain';
import { buildChain } from '@infrastructure/audio/chains/build-chain';
import { impulseResponse } from '@infrastructure/audio/chains/impulse-response';
import { outputStage } from '@infrastructure/audio/chains/output-stage';
import { DrumKit } from '@infrastructure/audio/drum-kit';
import { AcousticKit } from '@infrastructure/audio/drums/acoustic-kit';
import { loadSampleSet } from '@infrastructure/audio/samples/load-sample-set';
import { SamplePlayer } from '@infrastructure/audio/samples/sample-player';
import type { SampleSet } from '@infrastructure/audio/samples/sample-set';
import { SAMPLE_SET_BY_INSTRUMENT } from '@infrastructure/audio/samples/sample-sets';
import { ringSeconds, stringPan, stringPluck } from '@infrastructure/audio/strings/string-pluck';
import { AssetPath } from '@infrastructure/constants/assets';

const Level = { master: 0.8, click: 0.5, chuck: 0.35, samples: 0.9 } as const;
const Reverb = { seconds: 2.2, decay: 3.2 } as const;
/** Drums sit in a small room: a little of the shared reverb (`room`). */
const KIT = { level: 0.9, room: 0.6 } as const;
const SMOOTHING = 0.02;
const CHUCK = { guitarHz: 2200, bassHz: 700, q: 1.2, attack: 0.003, length: 0.06 } as const;
/** Pick hitting the string: a 3 ms bright tick, louder for harder strokes. */
const PICK = { highpassHz: 3000, level: 0.09, length: 0.004 } as const;
/** Fingertip landing on a string. */
const TOUCH = { bandHz: 3200, level: 0.025, length: 0.03 } as const;
/** Fingers sliding over wound strings: a short rising squeak. */
const SQUEAK = { fromHz: 1400, toHz: 3200, q: 6, level: 0.05, length: 0.12 } as const;

/**
 * **WebAudioEngine** — the `SoundOutputInterface` on Web Audio.
 *
 * @remarks
 * - Notes come from real recordings (`public/samples/`, see `SAMPLE_SET_BY_INSTRUMENT`) when the
 *   instrument has a set and it covers the note; otherwise, and for muted strokes, from a Karplus–Strong
 *   AudioWorklet (`public/worklets/strings.js`). Both are sample-accurate. Sets load in the background:
 *   until one is ready the synth plays.
 * - Graph: string bank → instrument chain → dry bus + shared reverb → master → limiter. Recordings
 *   already carry body and room, so they skip the chain — except the drive guitar, which needs its amp.
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
  private readonly sampleBus: GainNode;
  private readonly samples: SamplePlayer;
  private readonly sampleSets = new Map<string, Promise<SampleSet | null>>();
  /** The sample set in use (or being loaded); null = synth only. */
  private sampleSetId: string | null = null;
  /** The finished mix, after the limiter: what the speakers get, and what a recording taps. */
  private readonly out: AudioNode;
  private tap: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = Level.master;
    this.out = outputStage(ctx, this.master);
    this.out.connect(ctx.destination);
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
    kitBus.gain.value = KIT.level;
    kitBus.connect(this.master);
    const kitRoom = ctx.createGain();
    kitRoom.gain.value = KIT.room;
    kitBus.connect(kitRoom).connect(this.reverbIn);
    this.kit = new AcousticKit(ctx, kitBus, this.noise);
    this.sampleBus = ctx.createGain();
    this.sampleBus.gain.value = Level.samples;
    this.sampleBus.connect(this.chainOut);
    this.samples = new SamplePlayer(ctx, this.sampleBus);
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  async start(instrument: Instrument): Promise<Result<void, Failure>> {
    // iPhone: web audio counts as ringer sound, so the silent switch muted every note; as media it plays.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
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

  /** Everything the speakers play, as a stream for video recordings; made once and shared by every clip. */
  recordingStream(): MediaStream {
    void this.ctx.resume();
    if (!this.tap) {
      this.tap = this.ctx.createMediaStreamDestination();
      this.out.connect(this.tap);
    }
    return this.tap.stream;
  }

  setVolume(volume: number): void {
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTHING);
  }

  setVoiceVolume(voice: Voice, volume: number): void {
    this.voiceGains.get(voice)?.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTHING);
    this.samples.setVoiceVolume(voice, volume);
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
    this.sampleBus.disconnect();
    this.sampleBus.connect(instrument.chain === ChainKind.drive ? chain.input : this.chainOut);
    this.useSamples(instrument);
  }

  /**
   * Switches the sample player to the voice's set, loading it once; the synth plays meanwhile. Settings
   * changes re-apply the instrument constantly, so nothing happens unless the set itself changes —
   * otherwise every volume nudge would cut the ringing notes.
   */
  private useSamples(instrument: Instrument): void {
    const setId = instrument.isRecorded ? (SAMPLE_SET_BY_INSTRUMENT[instrument.id] ?? null) : null;
    if (setId === this.sampleSetId) return;
    this.sampleSetId = setId;
    this.samples.use(null);
    if (!setId) return;
    let pending = this.sampleSets.get(setId);
    if (!pending) {
      pending = loadSampleSet(this.ctx, import.meta.env.BASE_URL, setId).catch(() => null);
      this.sampleSets.set(setId, pending);
    }
    void pending.then((set) => {
      if (this.sampleSetId === setId) this.samples.use(set);
    });
  }

  pluck(r: PluckRequest): void {
    const inst = this.instrument;
    const bank = this.banks.get(r.voice);
    if (!bank || !inst) return;
    const isRecorded = !r.isMuted && !r.isPalmMuted && this.samples.pluck(r, stringPan(inst, r.string));
    if (isRecorded) {
      // The recording has replaced whatever this string's synth voice was doing.
      bank.port.postMessage({ type: 'damp', when: r.when, string: r.string });
      return;
    }
    this.samples.damp(r.voice, r.string, r.when);
    bank.port.postMessage(stringPluck(inst, r));
    if (inst.chain !== ChainKind.nylon && r.attack === StrikeSurface.nail) this.noiseBurst('highpass', PICK.highpassHz, 0.7, r.when, PICK.level * Math.min(1, r.amp), PICK.length);
  }

  retune(r: RetuneRequest): void {
    const inst = this.instrument;
    if (this.samples.isSounding(r.voice, r.string)) {
      this.samples.retune(r);
      return;
    }
    const freq = midiToFreq(r.midi);
    this.banks.get(r.voice)?.port.postMessage({
      type: 'retune', when: r.when, string: r.string, freq, glide: r.glide, excite: r.excite,
      t60: inst ? ringSeconds(inst, freq) : 0,
    });
  }

  touch(string: number, when: number): void {
    this.damp(string, when);
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
    this.samples.damp(Voice.player, string, when);
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
