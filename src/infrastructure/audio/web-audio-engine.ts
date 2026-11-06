import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import type { DrumKind } from '@domain/audio/drum-kind';
import type { HandStroke } from '@domain/drums/hand/hand-stroke';
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
import { HandDrumVoice } from '@infrastructure/audio/drums/hand-drum-voice';
import { loadSampleSet } from '@infrastructure/audio/samples/load-sample-set';
import { SamplePlayer } from '@infrastructure/audio/samples/sample-player';
import type { SampleSet } from '@infrastructure/audio/samples/sample-set';
import { SAMPLE_SET_BY_INSTRUMENT } from '@infrastructure/audio/samples/sample-sets';
import { ringSeconds, stringPan, stringPluck } from '@infrastructure/audio/strings/string-pluck';
import { AssetPath } from '@infrastructure/constants/assets';
import { StringNoises } from '@infrastructure/audio/string-noises';
import { coursePair, courseStrings, pairInterval } from '@infrastructure/audio/strings/course-pair';

const Level = { master: 0.8, click: 0.5, samples: 0.9 } as const;
const Reverb = { seconds: 2.2, decay: 3.2 } as const;
/** Drums sit in a small room: a little of the shared reverb (`room`). */
const KIT = { level: 0.9, room: 0.6 } as const;
const SMOOTHING = 0.02;

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
  private readonly noises: StringNoises;
  private readonly drums: DrumKit;
  private readonly kit: AcousticKit;
  private readonly handDrum: HandDrumVoice;
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
    this.noises = new StringNoises(ctx, this.noise);
    this.drums = new DrumKit(ctx, clickBus, this.noise);
    const kitBus = ctx.createGain();
    kitBus.gain.value = KIT.level;
    kitBus.connect(this.master);
    const kitRoom = ctx.createGain();
    kitRoom.gain.value = KIT.room;
    kitBus.connect(kitRoom).connect(this.reverbIn);
    this.kit = new AcousticKit(ctx, kitBus, this.noise);
    this.handDrum = new HandDrumVoice(ctx, kitBus, this.noise);
    this.sampleBus = ctx.createGain();
    this.sampleBus.gain.value = Level.samples;
    this.sampleBus.connect(this.chainOut);
    this.samples = new SamplePlayer(ctx, this.sampleBus);
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  async start(instrument: Instrument): Promise<Result<void, Failure>> {
    // iPhone: as ringer sound the silent switch muted every note; as media it plays.
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
    this.pluckString(r);
    // A 12-string strikes both strings of the course.
    const pair = coursePair(this.instrument, r);
    if (pair) this.pluckString(pair);
  }

  private pluckString(r: PluckRequest): void {
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
    if (this.current && inst.chain !== ChainKind.nylon && r.attack === StrikeSurface.nail) this.noises.pick(this.current.input, r.when, r.amp);
  }

  retune(r: RetuneRequest): void {
    this.retuneString(r);
    const interval = pairInterval(this.instrument, r.string);
    const pair = courseStrings(this.instrument, r.string)[1];
    if (interval !== null && pair !== undefined) this.retuneString({ ...r, string: pair, midi: r.midi + interval });
  }

  private retuneString(r: RetuneRequest): void {
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

  touch(string: number, when: number, voices: readonly Voice[]): void {
    for (const v of voices) this.dampVoice(v, string, when);
  }

  damp(string: number, when: number): void {
    this.dampVoice(Voice.player, string, when);
  }

  /** Stops a string in one voice — both strings of a 12-string's course. */
  private dampVoice(voice: Voice, string: number, when: number): void {
    for (const s of courseStrings(this.instrument, string)) {
      this.banks.get(voice)?.port.postMessage({ type: 'damp', when, string: s });
      this.samples.damp(voice, s, when);
    }
  }

  chuck(amp: number, when: number): void {
    if (this.current) this.noises.chuck(this.current.input, when, amp, this.instrument?.chain === ChainKind.bass);
  }

  hitDrum(r: DrumHitRequest): void {
    this.kit.hit(r);
  }

  hitHandDrum(stroke: HandStroke, velocity: number, when: number): void {
    this.handDrum.hit(stroke, velocity, when);
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
