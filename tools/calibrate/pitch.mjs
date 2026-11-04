// Precise pitch of a plucked note, independent of the inharmonicity fit in analyze.mjs: the fundamental's
// peak in one long Hann-windowed FFT (0.73 Hz bins at 48 kHz) over the steady part of the note, refined by
// parabolic interpolation on log magnitude. Accurate to well under a cent for notes from E1 up.

import { SR } from './analyze.mjs';

const N = 65536;
/** Skip the attack (pitch is briefly sharp while the pluck stretches the string). */
const SKIP = 0.08;
/** Search this far either side of the expected pitch (cents). */
const SEARCH = 80;

/** Measured fundamental (Hz) of `x`, looked for within ±80 cents of `nominalHz`. */
export function fundamental(x, nominalHz) {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  let onset = 0;
  while (onset < x.length && Math.abs(x[onset]) < peak * 0.1) onset++;
  const start = onset + Math.round(SKIP * SR);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let i = 0; i < N; i++) re[i] = (x[start + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  fft(re, im);
  const db = (b) => 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-30);
  const lo = Math.floor((nominalHz * 2 ** (-SEARCH / 1200) * N) / SR);
  const hi = Math.ceil((nominalHz * 2 ** (SEARCH / 1200) * N) / SR);
  let best = lo;
  for (let b = lo; b <= hi; b++) if (db(b) > db(best)) best = b;
  const [a, b, c] = [db(best - 1), db(best), db(best + 1)];
  const d = (0.5 * (a - c)) / (a - 2 * b + c || 1);
  return ((best + d) * SR) / N;
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr0 = Math.cos(ang);
    const wi0 = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1;
      let wi = 0;
      for (let k = 0; k < len / 2; k++) {
        const p = i + k;
        const q = p + len / 2;
        const xr = re[q] * wr - im[q] * wi;
        const xi = re[q] * wi + im[q] * wr;
        re[q] = re[p] - xr;
        im[q] = im[p] - xi;
        re[p] += xr;
        im[p] += xi;
        [wr, wi] = [wr * wr0 - wi * wi0, wr * wi0 + wi * wr0];
      }
    }
  }
}
