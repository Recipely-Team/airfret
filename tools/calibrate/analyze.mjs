// Measures a plucked-string note the same way for recordings and for our model, so they can be compared.
//
//   f0, inharmonicity B         partials at f_k = k·f0·√(1 + B·k²), B fitted by least squares
//   T60 per partial             linear fit of each partial's dB envelope over time
//   early harmonic profile      partial levels at 60 ms relative to the fundamental (pick position, attack)

export const SR = 48000;
const N = 8192;
const HOP = 1024;
const MAX_PARTIALS = 24;
const MAX_HZ = 9000;

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
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const ar = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const ai = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - ar;
        im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
      }
    }
  }
}

/** Magnitude spectrum (dB) of the Hann-windowed frame starting at `start`. */
function frameDb(x, start) {
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const v = x[start + i] ?? 0;
    re[i] = v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  }
  fft(re, im);
  const db = new Float64Array(N / 2);
  for (let i = 0; i < N / 2; i++) db[i] = 20 * Math.log10(Math.hypot(re[i], im[i]) + 1e-12);
  return db;
}

/** Peak (interpolated frequency, dB) near `hz` within ±tolerance. */
function peakNear(db, hz, tol) {
  const bin = (f) => Math.round((f * N) / SR);
  let best = bin(hz);
  for (let b = bin(hz * (1 - tol)); b <= bin(hz * (1 + tol)); b++) if (db[b] > db[best]) best = b;
  const [a, b, c] = [db[best - 1], db[best], db[best + 1]];
  const d = 0.5 * (a - c) / (a - 2 * b + c || 1);
  return { hz: ((best + d) * SR) / N, db: b - 0.25 * (a - c) * d };
}

export function analyze(x, f0Nominal) {
  // Start at the onset.
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  let onset = 0;
  while (onset < x.length && Math.abs(x[onset]) < peak * 0.1) onset++;
  const sig = x.subarray(onset);
  // Inharmonicity and true f0 from a frame at ~100 ms.
  const early = frameDb(sig, Math.round(0.1 * SR));
  const peaks = [];
  for (let k = 1; k <= MAX_PARTIALS && k * f0Nominal < MAX_HZ; k++) peaks.push({ k, ...peakNear(early, k * f0Nominal * Math.sqrt(1 + 0.0001 * k * k), 0.04 / Math.sqrt(k) + 0.015) });
  // (f_k / k)² = f0² (1 + B k²)  → linear in k²: slope = f0² B, intercept = f0².
  const strong = peaks.filter((p) => p.db > early[Math.round((peaks[0].hz * N) / SR)] - 45);
  const xs = strong.map((p) => p.k * p.k);
  const ys = strong.map((p) => (p.hz / p.k) ** 2);
  const mx = xs.reduce((s, v) => s + v, 0) / xs.length;
  const my = ys.reduce((s, v) => s + v, 0) / ys.length;
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0) || 1;
  const slope = sxy / sxx;
  const f0sq = my - slope * mx;
  const f0 = Math.sqrt(Math.max(1, f0sq));
  const B = Math.max(0, slope / f0sq);
  const partialHz = (k) => k * f0 * Math.sqrt(1 + B * k * k);
  // Partial envelopes over time.
  const frames = [];
  for (let s = 0; s + N < sig.length && s < 3 * SR; s += HOP) frames.push({ t: (s + N / 2) / SR, db: frameDb(sig, s) });
  const partials = [];
  for (let k = 1; k <= MAX_PARTIALS && partialHz(k) < MAX_HZ; k++) {
    const env = frames.map((f) => ({ t: f.t, db: peakNear(f.db, partialHz(k), 0.01).db }));
    const top = Math.max(...env.map((e) => e.db));
    // Fit the decay from 150 ms until the partial is 45 dB down (or the end).
    const fitPts = env.filter((e) => e.t > 0.15 && e.db > top - 45);
    let t60 = NaN;
    if (fitPts.length > 4) {
      const mt = fitPts.reduce((s, e) => s + e.t, 0) / fitPts.length;
      const md = fitPts.reduce((s, e) => s + e.db, 0) / fitPts.length;
      const sl = fitPts.reduce((s, e) => s + (e.t - mt) * (e.db - md), 0) / (fitPts.reduce((s, e) => s + (e.t - mt) ** 2, 0) || 1);
      t60 = sl < 0 ? -60 / sl : 30;
    }
    const at60ms = env.find((e) => e.t >= 0.06)?.db ?? top;
    partials.push({ k, hz: partialHz(k), t60, early: at60ms });
  }
  const ref = partials[0]?.early ?? 0;
  partials.forEach((p) => (p.early -= ref));
  return { f0, B, partials };
}

/** How far a model note is from a recording: dB distance of early profiles + log-ratio of decays. */
export function distance(model, rec) {
  let profile = 0;
  let decay = 0;
  let n = 0;
  rec.partials.forEach((r, i) => {
    const m = model.partials[i];
    if (!m || !Number.isFinite(r.t60) || !Number.isFinite(m.t60)) return;
    profile += (m.early - r.early) ** 2;
    decay += Math.log(m.t60 / r.t60) ** 2;
    n++;
  });
  return { profileDb: Math.sqrt(profile / n), decayLog: Math.sqrt(decay / n), inharmonicity: Math.abs(Math.log((model.B + 1e-7) / (rec.B + 1e-7))) };
}
