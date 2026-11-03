const SHAPER_POINTS = 2048;
/** Slight asymmetry adds even harmonics, closer to a tube stage. */
const SHAPER_ASYMMETRY = 0.08;
const BUTTERWORTH_Q = 0.707;

/** Peaking EQ band. */
export function peaking(ctx: BaseAudioContext, freq: number, gainDb: number, q = 1): BiquadFilterNode {
  const f = filter(ctx, 'peaking', freq, q);
  f.gain.value = gainDb;
  return f;
}

/** Any biquad filter. */
export function filter(ctx: BaseAudioContext, type: BiquadFilterType, freq: number, q = BUTTERWORTH_Q): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** High shelf. */
export function shelf(ctx: BaseAudioContext, freq: number, gainDb: number): BiquadFilterNode {
  const f = filter(ctx, 'highshelf', freq);
  f.gain.value = gainDb;
  return f;
}

/** Soft-clipping saturation stage. */
export function shaper(ctx: BaseAudioContext, drive: number): WaveShaperNode {
  const ws = ctx.createWaveShaper();
  const curve = new Float32Array(SHAPER_POINTS);
  const norm = Math.tanh(drive);
  for (let i = 0; i < SHAPER_POINTS; i++) {
    const x = (i / (SHAPER_POINTS - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * (x + SHAPER_ASYMMETRY * x * x)) / norm;
  }
  ws.curve = curve;
  ws.oversample = '4x';
  return ws;
}

/** Fixed gain. */
export function gain(ctx: BaseAudioContext, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

/** Gentle bus compressor. */
export function compressor(ctx: BaseAudioContext): DynamicsCompressorNode {
  const c = ctx.createDynamicsCompressor();
  c.threshold.value = -20;
  c.ratio.value = 4;
  c.attack.value = 0.01;
  c.release.value = 0.2;
  return c;
}

/** Connects nodes in order. */
export function series(nodes: readonly AudioNode[]): void {
  nodes.forEach((n, i) => {
    const next = nodes[i + 1];
    if (next) n.connect(next);
  });
}
