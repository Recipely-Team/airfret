/** Inharmonic ratios of a struck metal plate: six square oscillators give a convincing cymbal. */
const RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];

/**
 * Starts a metallic oscillator bank at `when` into `out` and returns a gain to shape (and choke) it.
 * Square waves at non-integer ratios beat against each other into a dense, cymbal-like spectrum.
 */
export function metalBank(ctx: AudioContext, base: number, when: number, length: number, out: AudioNode): GainNode {
  const mix = ctx.createGain();
  mix.gain.value = 1 / RATIOS.length;
  for (const r of RATIOS) {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = base * r * (1 + (Math.random() - 0.5) * 0.01);
    o.connect(mix);
    o.start(when);
    o.stop(when + length + 0.05);
  }
  const env = ctx.createGain();
  mix.connect(env).connect(out);
  return env;
}
