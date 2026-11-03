const WET = 0.45;
const BASE_DELAY = 0.012;
const SIDE_DELAY_STEP = 0.004;
const LFO_RATE = 0.6;
const LFO_RATE_STEP = 0.17;
const DEPTH = 0.0022;
const WIDTH = 0.6;
const MAX_DELAY = 0.05;

/** Stereo chorus: two modulated delays panned apart, mixed under the dry signal. */
export function makeChorus(ctx: BaseAudioContext): { input: AudioNode; output: AudioNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = WET;
  input.connect(output);
  for (const side of [0, 1]) {
    const d = ctx.createDelay(MAX_DELAY);
    d.delayTime.value = BASE_DELAY + side * SIDE_DELAY_STEP;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = LFO_RATE + side * LFO_RATE_STEP;
    const depth = ctx.createGain();
    depth.gain.value = DEPTH;
    lfo.connect(depth).connect(d.delayTime);
    lfo.start();
    const pan = ctx.createStereoPanner();
    pan.pan.value = side ? WIDTH : -WIDTH;
    input.connect(d).connect(pan).connect(wet);
  }
  wet.connect(output);
  return { input, output };
}
