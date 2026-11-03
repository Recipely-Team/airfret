// Audio graph: string bank → instrument chain → (dry + reverb) → master.
// Everything is synthesised; the app ships no samples.

import { midiToFreq } from '../music/theory';
import type { ChainKind, Instrument } from './instruments';

interface Chain {
  input: AudioNode;
  output: AudioNode;
  reverbSend: number;
}

export class AudioEngine {
  readonly ctx: AudioContext;
  private bank!: AudioWorkletNode;
  private master: GainNode;
  private bus: GainNode;
  private reverb: ConvolverNode;
  private reverbIn: GainNode;
  private chainOut: GainNode;
  private chains = new Map<ChainKind, Chain>();
  private current: Chain | null = null;
  private instrument!: Instrument;
  private noise: AudioBuffer;
  private clickGain: GainNode;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    this.master.connect(limiter).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulse(ctx, 2.2, 3.2);
    this.reverbIn = ctx.createGain();
    this.reverbIn.connect(this.reverb).connect(this.master);

    this.chainOut = ctx.createGain();
    this.chainOut.connect(this.bus);
    this.chainOut.connect(this.reverbIn);

    this.clickGain = ctx.createGain();
    this.clickGain.gain.value = 0.5;
    this.clickGain.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  async init(instrument: Instrument): Promise<void> {
    await this.ctx.audioWorklet.addModule(`${import.meta.env.BASE_URL}worklets/strings.js`);
    this.bank = new AudioWorkletNode(this.ctx, 'string-bank', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    this.setInstrument(instrument);
  }

  resume(): Promise<void> {
    return this.ctx.resume();
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  setVolume(v: number): void {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  setInstrument(inst: Instrument): void {
    this.instrument = inst;
    if (!this.bank) return; // not initialised yet; init() applies it
    this.bank.port.postMessage({ type: 'damp', when: 0, string: -1 });
    let chain = this.chains.get(inst.chain);
    if (!chain) {
      chain = buildChain(this.ctx, inst.chain);
      chain.output.connect(this.chainOut);
      this.chains.set(inst.chain, chain);
    }
    if (this.current) this.bank.disconnect();
    this.bank.connect(chain.input);
    this.current = chain;
    this.reverbIn.gain.setTargetAtTime(chain.reverbSend, this.ctx.currentTime, 0.05);
  }

  /** Pluck a string. `amp` 0–1, `when` in context time (defaults to now). */
  pluck(string: number, midi: number, amp: number, when = 0, opts: { muted?: boolean } = {}): void {
    const inst = this.instrument;
    if (!this.bank) return;
    const freq = midiToFreq(midi);
    const t60 = opts.muted ? 0.09 : inst.t60 * Math.pow(110 / freq, 0.45);
    const stringCount = inst.tuning.length;
    this.bank.port.postMessage({
      type: 'pluck',
      when,
      string,
      freq,
      amp: inst.level * Math.min(1, Math.max(0.05, amp)) * (opts.muted ? 0.8 : 1),
      t60,
      bright: opts.muted ? inst.bright * 0.6 : inst.bright * (0.75 + 0.25 * amp),
      pick: inst.pick,
      // Spread strings slightly across the stereo field, low strings left.
      pan: ((string / (stringCount - 1)) - 0.5) * 0.5,
    });
  }

  damp(string: number, when = 0): void {
    this.bank?.port.postMessage({ type: 'damp', when, string });
  }

  /** Percussive "chuck": strings damped by the fretting hand while strummed. */
  chuck(amp: number, when = 0): void {
    const ctx = this.ctx;
    if (!this.current) return;
    const t = Math.max(when, ctx.currentTime);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = this.instrument.chain === 'bass' ? 700 : 2200;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35 * amp, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(bp).connect(g).connect(this.current!.input);
    src.start(t);
    src.stop(t + 0.08);
  }

  /** Metronome click; accented on the downbeat. */
  click(when: number, accent: boolean): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = accent ? 1760 : 1320;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    o.connect(g).connect(this.clickGain);
    o.start(when);
    o.stop(when + 0.05);
  }

  /** Minimal drum kit for play-along backing. */
  drum(kind: 'kick' | 'snare' | 'hat', when: number, amp = 1): void {
    const ctx = this.ctx;
    if (kind === 'kick') {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(140, when);
      o.frequency.exponentialRampToValueAtTime(42, when + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.9 * amp, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.35);
      o.connect(g).connect(this.clickGain);
      o.start(when);
      o.stop(when + 0.4);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    if (kind === 'snare') {
      f.type = 'bandpass';
      f.frequency.value = 1800;
      f.Q.value = 0.7;
      g.gain.setValueAtTime(0.45 * amp, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
      const body = ctx.createOscillator();
      body.frequency.setValueAtTime(220, when);
      body.frequency.exponentialRampToValueAtTime(160, when + 0.08);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.35 * amp, when);
      bg.gain.exponentialRampToValueAtTime(0.001, when + 0.1);
      body.connect(bg).connect(this.clickGain);
      body.start(when);
      body.stop(when + 0.12);
    } else {
      f.type = 'highpass';
      f.frequency.value = 7000;
      g.gain.setValueAtTime(0.16 * amp, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    }
    src.connect(f).connect(g).connect(this.clickGain);
    const offset = Math.random() * 0.5;
    src.start(when, offset);
    src.stop(when + 0.25);
  }
}

function peaking(ctx: AudioContext, freq: number, gain: number, q = 1): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = 'peaking';
  f.frequency.value = freq;
  f.gain.value = gain;
  f.Q.value = q;
  return f;
}

function filter(ctx: AudioContext, type: BiquadFilterType, freq: number, q = 0.707): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function shaper(ctx: AudioContext, drive: number): WaveShaperNode {
  const ws = ctx.createWaveShaper();
  const n = 2048;
  const curve = new Float32Array(n);
  const norm = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    // Slight asymmetry adds even harmonics, closer to a tube stage.
    curve[i] = Math.tanh(drive * (x + 0.08 * x * x)) / norm;
  }
  ws.curve = curve;
  ws.oversample = '4x';
  return ws;
}

function gain(ctx: AudioContext, v: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

function series(nodes: AudioNode[]): Chain['input'] {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return nodes[0];
}

function buildChain(ctx: AudioContext, kind: ChainKind): Chain {
  let nodes: AudioNode[];
  let reverbSend = 0.18;
  switch (kind) {
    case 'acoustic':
      // Body resonances of a dreadnought, plus a little air on top.
      nodes = [
        filter(ctx, 'highpass', 70),
        peaking(ctx, 105, 5, 1.4),
        peaking(ctx, 220, 2.5, 1.2),
        peaking(ctx, 650, -2.5, 1),
        filter(ctx, 'highshelf', 3500),
        gain(ctx, 1.1),
      ];
      (nodes[4] as BiquadFilterNode).gain.value = 3;
      reverbSend = 0.2;
      break;
    case 'nylon':
      nodes = [
        filter(ctx, 'highpass', 70),
        peaking(ctx, 120, 4, 1.2),
        peaking(ctx, 400, 1.5, 1),
        filter(ctx, 'lowpass', 5200),
        gain(ctx, 1.1),
      ];
      reverbSend = 0.24;
      break;
    case 'clean': {
      const chorus = makeChorus(ctx);
      nodes = [
        filter(ctx, 'highpass', 90),
        shaper(ctx, 1.2),
        peaking(ctx, 180, 2, 1),
        peaking(ctx, 2600, 2.5, 0.9),
        filter(ctx, 'lowpass', 6500),
        chorus.input,
      ];
      series(nodes);
      return { input: nodes[0], output: chorus.output, reverbSend: 0.22 };
    }
    case 'drive':
      nodes = [
        filter(ctx, 'highpass', 140),
        peaking(ctx, 900, 6, 0.8),
        gain(ctx, 6),
        shaper(ctx, 4.5),
        filter(ctx, 'highpass', 90),
        // 4x12 cabinet: low thump, mid scoop, steep top-end roll-off.
        peaking(ctx, 110, 4, 1),
        peaking(ctx, 450, -4, 1.2),
        peaking(ctx, 2200, 3, 1),
        filter(ctx, 'lowpass', 4600, 0.9),
        filter(ctx, 'lowpass', 6500, 0.6),
        gain(ctx, 0.32),
      ];
      reverbSend = 0.16;
      break;
    case 'bass':
      nodes = [
        filter(ctx, 'highpass', 32),
        peaking(ctx, 80, 4, 1),
        peaking(ctx, 700, 2, 1),
        gain(ctx, 1.6),
        shaper(ctx, 1.5),
        filter(ctx, 'lowpass', 2600, 0.8),
        compressor(ctx),
        gain(ctx, 1.3),
      ];
      reverbSend = 0.04;
      break;
  }
  series(nodes);
  return { input: nodes[0], output: nodes[nodes.length - 1], reverbSend };
}

function compressor(ctx: AudioContext): DynamicsCompressorNode {
  const c = ctx.createDynamicsCompressor();
  c.threshold.value = -20;
  c.ratio.value = 4;
  c.attack.value = 0.01;
  c.release.value = 0.2;
  return c;
}

function makeChorus(ctx: AudioContext): { input: AudioNode; output: AudioNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  input.connect(output);
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  [0, 1].forEach((side) => {
    const d = ctx.createDelay(0.05);
    d.delayTime.value = 0.012 + side * 0.004;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.6 + side * 0.17;
    const depth = ctx.createGain();
    depth.gain.value = 0.0022;
    lfo.connect(depth).connect(d.delayTime);
    lfo.start();
    const pan = ctx.createStereoPanner();
    pan.pan.value = side ? 0.6 : -0.6;
    input.connect(d).connect(pan).connect(wet);
  });
  wet.connect(output);
  return { input, output };
}

/** Synthetic stereo hall impulse response. */
function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // Darken over time: air absorbs high frequencies first.
      const a = 0.2 + 0.7 * t;
      lp = a * lp + (1 - a) * (Math.random() * 2 - 1);
      d[i] = lp * Math.pow(1 - t, decay) * (i < ctx.sampleRate * 0.01 ? i / (ctx.sampleRate * 0.01) : 1);
    }
  }
  return buf;
}
