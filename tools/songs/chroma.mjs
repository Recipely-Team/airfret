// Chroma features — how much of each of the 12 pitch classes sounds in each short frame — for audio and
// for a score, so a performance can be aligned with a recording whatever the instrument or octave.

import { SR } from '../calibrate/analyze.mjs';

/** Frames per second of every chroma sequence. */
export const FPS = 20;
const N = 8192;
const MIN_HZ = 60;
const MAX_HZ = 2100;
/** A plucked or bowed note's weight in the score's chroma fades with this time constant (s). */
const SCORE_DECAY = 0.9;
const SCORE_LENGTH = 2.5;
/** Overtones present in any real instrument note: octave and twelfth (+12, +19 semitones). */
const HARMONICS = [[0, 1], [12, 0.5], [19, 0.33], [24, 0.25]];

/** Chroma of a mono signal at `SR`, one 12-vector per frame, each L2-normalised (silence stays 0). */
export function audioChroma(x) {
  const hop = Math.round(SR / FPS);
  const frames = [];
  const window = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  const pcOfBin = Int8Array.from({ length: N / 2 }, (_, b) => {
    const hz = (b * SR) / N;
    return hz < MIN_HZ || hz > MAX_HZ ? -1 : ((Math.round(12 * Math.log2(hz / 440)) % 12) + 12 + 9) % 12;
  });
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let start = 0; start + hop <= x.length; start += hop) {
    for (let i = 0; i < N; i++) {
      re[i] = (x[start + i - N / 2] ?? 0) * window[i];
      im[i] = 0;
    }
    fft(re, im);
    const c = new Float64Array(12);
    for (let b = 1; b < N / 2; b++) if (pcOfBin[b] >= 0) c[pcOfBin[b]] += Math.log1p(100 * Math.hypot(re[b], im[b]));
    frames.push(normalise(c));
  }
  return frames;
}

/** Chroma of a score: `notes` as [seconds, midi]; each note rings with a plucked decay. */
export function scoreChroma(notes, seconds) {
  const frames = Array.from({ length: Math.ceil(seconds * FPS) }, () => new Float64Array(12));
  for (const [t, midi] of notes) {
    const first = Math.round(t * FPS);
    for (let f = first; f < Math.min(frames.length, first + SCORE_LENGTH * FPS); f++) {
      const w = Math.exp(-(f - first) / FPS / SCORE_DECAY);
      for (const [semis, h] of HARMONICS) frames[f][(midi + semis) % 12] += w * h;
    }
  }
  return frames.map(normalise);
}

function normalise(c) {
  const n = Math.hypot(...c);
  return n > 1e-9 ? c.map((v) => v / n) : c;
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
        const a = i + k;
        const b = a + len / 2;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        [wr, wi] = [wr * wr0 - wi * wi0, wr * wi0 + wi * wr0];
      }
    }
  }
}
