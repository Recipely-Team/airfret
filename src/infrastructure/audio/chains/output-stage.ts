/**
 * Master safety stage: a fast hard-knee limiter, then a tanh soft-clipper.
 *
 * @remarks
 * - Six strings struck within milliseconds sum far above full scale; a compressor alone lets the first
 *   transient through and the output clips square. The shaper rounds whatever is left: y = 0.97·tanh(u),
 *   so the output can never pass ±0.97 and stays clean instead of crackling.
 * - The shaper's input domain [−1, 1] stands for signals of ±2 (half-gain in front, tanh(2x) curve).
 */
export function outputStage(ctx: BaseAudioContext, input: AudioNode): AudioNode {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -9;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.12;
  const half = ctx.createGain();
  half.gain.value = 0.5;
  const clip = ctx.createWaveShaper();
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) curve[i] = 0.97 * Math.tanh(2 * ((i / (n - 1)) * 2 - 1));
  clip.curve = curve;
  clip.oversample = '2x';
  input.connect(limiter).connect(half).connect(clip);
  return clip;
}
