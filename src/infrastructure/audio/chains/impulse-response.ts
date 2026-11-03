const FADE_IN = 0.01;
const DARKEN_START = 0.2;
const DARKEN_RANGE = 0.7;

/** Synthetic stereo hall impulse response that darkens as it decays. */
export function impulseResponse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const fade = ctx.sampleRate * FADE_IN;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const a = DARKEN_START + DARKEN_RANGE * t;
      lp = a * lp + (1 - a) * (Math.random() * 2 - 1);
      d[i] = lp * Math.pow(1 - t, decay) * Math.min(1, i / fade);
    }
  }
  return buf;
}
