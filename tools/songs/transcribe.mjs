// Listens to a rendered performance the way a music-information-retrieval evaluation does: finds the
// note onsets (spectral flux) and checks that each written pitch actually sounds when it should
// (harmonic salience rising at the onset), so a render can be scored against its score.

import { SR } from '../calibrate/analyze.mjs';

/** Window sizes: short for onsets (sharp in time), long for pitch (a semitone apart even at 70 Hz). */
export const WINDOW = { onsets: 2048, pitch: 8192 };
const HOP = 480; // 10 ms
/** Onset peaks must clear the local median by this much (in flux units) and be this far apart. */
const PICK = { delta: 0.06, medianFrames: 21, minGap: 0.035 };
const HARMONICS = 5;

/** Log-magnitude STFT frames, hop 10 ms, centred; the window size travels with the frames (`.n`). */
export function spectrogram(x, N = WINDOW.pitch) {
  const frames = [];
  frames.n = N;
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let c = 0; c < x.length; c += HOP) {
    for (let i = 0; i < N; i++) {
      re[i] = (x[c + i - N / 2] ?? 0) * win[i];
      im[i] = 0;
    }
    fft(re, im);
    const mag = new Float32Array(N / 2);
    for (let b = 0; b < N / 2; b++) mag[b] = Math.log1p(1000 * Math.hypot(re[b], im[b]));
    frames.push(mag);
  }
  return frames;
}

export const FRAME_SECONDS = HOP / SR;

/** Onset times (s): peaks of half-wave-rectified spectral flux above a moving median. */
export function onsets(spec) {
  const flux = spec.map((f, i) => {
    if (i === 0) return 0;
    let s = 0;
    const p = spec[i - 1];
    for (let b = 1; b < f.length; b++) s += Math.max(0, f[b] - p[b]);
    return s / f.length;
  });
  const out = [];
  let last = -Infinity;
  for (let i = 1; i < flux.length - 1; i++) {
    const lo = Math.max(0, i - (PICK.medianFrames >> 1));
    const local = flux.slice(lo, i + (PICK.medianFrames >> 1) + 1).sort((a, b) => a - b);
    const median = local[local.length >> 1];
    const t = i * FRAME_SECONDS;
    if (flux[i] > flux[i - 1] && flux[i] >= flux[i + 1] && flux[i] > median + PICK.delta && t - last >= PICK.minGap) {
      out.push(t);
      last = t;
    }
  }
  return out;
}

/** Onset F-measure (MIREX style): each reference onset may match one detected onset within ±window. */
export function onsetScore(reference, detected, window = 0.05) {
  const used = new Uint8Array(detected.length);
  let hits = 0;
  let j = 0;
  for (const r of reference) {
    while (j < detected.length && detected[j] < r - window) j++;
    for (let k = j; k < detected.length && detected[k] <= r + window; k++) {
      if (!used[k]) {
        used[k] = 1;
        hits++;
        break;
      }
    }
  }
  const precision = detected.length ? hits / detected.length : 0;
  const recall = reference.length ? hits / reference.length : 0;
  return { precision, recall, f: precision + recall ? (2 * precision * recall) / (precision + recall) : 0 };
}

/**
 * Harmonic contrast of a MIDI pitch in one spectrum: each of its first harmonics' peak minus the
 * spectrum halfway to the next. A real note scores high; a sub-harmonic (its odd harmonics fall on
 * gaps) or an octave above (its gaps fall on the note's harmonics) scores low, and broadband noise
 * cancels out.
 */
function salience(frame, midi, N) {
  const f0 = 440 * 2 ** ((midi - 69) / 12);
  const peak = (hz) => {
    const lo = Math.floor((hz * 2 ** (-0.3 / 12) * N) / SR);
    const hi = Math.ceil((hz * 2 ** (0.3 / 12) * N) / SR);
    let m = 0;
    for (let b = lo; b <= hi; b++) m = Math.max(m, frame[b] ?? 0);
    return m;
  };
  let s = 0;
  let n = 0;
  for (let h = 1; h <= HARMONICS && f0 * (h + 0.5) < SR / 2.5; h++) {
    s += peak(f0 * h) - 0.5 * (peak(f0 * (h - 0.5)) + peak(f0 * (h + 0.5)));
    n++;
  }
  return n ? s / n : 0;
}

/** Candidate pitches a heard note competes with: the whole guitar and bass range. */
const CANDIDATES = { lo: 26, hi: 96 };
/** Frames compared either side of an onset (s): far enough apart that the analysis windows don't overlap. */
const AROUND = 0.09;
/** A note counts as heard when it is at least this share of the strongest unrelated new pitch. */
const SHARE = 0.8;

/**
 * Share of written notes that can be heard being struck on time. At each onset the spectrum just
 * before is subtracted from just after (linear magnitude) — strings left ringing cancel out, only what
 * was just struck remains — and every note of the onset must be among that many strongest new pitches (an octave or
 * twelfth of it doesn't count against it: they share its harmonics).
 */
export function pitchRecall(spec, notes, { share = SHARE } = {}) {
  const ratios = pitchRatios(spec, notes);
  return ratios.length ? ratios.filter((r) => r >= share).length / ratios.length : 0;
}

/**
 * For each note: its strength among what was just struck, as a share of the strongest unrelated new
 * pitch (≥ 1: it is the strongest). Notes of the same onset don't compete with each other.
 */
export function pitchRatios(spec, notes) {
  const at = (s) => spec[Math.min(spec.length - 1, Math.max(0, Math.round(s / FRAME_SECONDS)))];
  const groups = new Map();
  for (const [t, midi] of notes) {
    const key = Math.round(t * 200);
    groups.set(key, [...(groups.get(key) ?? []), [t, midi]]);
  }
  const out = [];
  for (const group of groups.values()) {
    const t = group[0][0];
    const after = at(t + AROUND);
    const before = at(t - AROUND);
    const rise = after.map((v, b) => Math.max(0, linear(v) - linear(before[b])));
    const strength = new Map();
    for (let m = CANDIDATES.lo; m <= CANDIDATES.hi; m++) strength.set(m, salience(rise, m, spec.n));
    for (const [, midi] of group) {
      let rival = 1e-9;
      for (const [m, v] of strength) if (!related(m, midi) && m !== midi && !group.some(([, g]) => g === m)) rival = Math.max(rival, v);
      out.push(Math.max(0, strength.get(midi) ?? 0) / rival);
    }
  }
  return out;
}

/** Back from the stored log scale: on a linear scale tonal peaks dominate the pick's broadband noise. */
function linear(v) {
  return Math.expm1(v) / 1000;
}

/** Semitone distances at which one note's harmonic series lands on another's: 2nd–6th harmonics and octaves of them. */
const HARMONIC_INTERVALS = new Set([12, 19, 24, 28, 31, 36]);

/** True when `a` and `b` share harmonics so strongly that one can stand in for the other. */
function related(a, b) {
  return HARMONIC_INTERVALS.has(Math.abs(a - b));
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

