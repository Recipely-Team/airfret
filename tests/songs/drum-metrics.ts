/** How a drum stroke sounds, measured: how fast it falls 10 and 30 dB, how bright its first 150 ms are, its low peak. */
export interface DrumMetrics {
  /** Seconds from the onset until 10 dB / 30 dB under its peak. */
  readonly t10: number;
  readonly t30: number;
  /** Spectral centroid of the first 150 ms, Hz. */
  readonly centroid: number;
  /** The strongest frequency between 30 and 600 Hz (a drum's pitch). */
  readonly lowHz: number;
  /** Share of the first 150 ms' spectrum above 5 kHz. */
  readonly hiShare: number;
}

const WINDOW = 0.005;
const FFT = 8192;
const BRIGHT_FROM = 5000;
const LOW = { from: 30, to: 600 } as const;

/** The same measures the real kit and the synth were compared by (docs/regressions.md, the drum kit). */
export function drumMetrics(a: Float32Array, sr: number): DrumMetrics {
  const w = Math.round(sr * WINDOW);
  const env: number[] = [];
  for (let i = 0; i + w <= a.length; i += w) {
    let e = 0;
    for (let j = i; j < i + w; j++) e += (a[j] ?? 0) ** 2;
    env.push(10 * Math.log10(e / w + 1e-20));
  }
  const top = Math.max(...env);
  const at = env.indexOf(top);
  const onset = env.findIndex((v) => v > top - 30);
  const fall = (db: number) => {
    for (let k = at; k < env.length; k++) if ((env[k] ?? 0) < top - db) return ((k - onset) * w) / sr;
    return ((env.length - onset) * w) / sr;
  };
  const re = new Float64Array(FFT);
  const im = new Float64Array(FFT);
  const start = onset * w;
  const len = Math.min(FFT, Math.round(sr * 0.15), a.length - start);
  for (let i = 0; i < len; i++) re[i] = (a[start + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / len));
  fft(re, im);
  let sum = 0;
  let weighted = 0;
  let hi = 0;
  let lowPeak = 0;
  let lowHz = 0;
  for (let k = 1; k < FFT / 2; k++) {
    const hz = (k * sr) / FFT;
    const m = Math.hypot(re[k] ?? 0, im[k] ?? 0);
    sum += m;
    weighted += m * hz;
    if (hz > BRIGHT_FROM) hi += m;
    if (hz >= LOW.from && hz <= LOW.to && m > lowPeak) {
      lowPeak = m;
      lowHz = hz;
    }
  }
  return { t10: fall(10), t30: fall(30), centroid: weighted / sum, lowHz, hiShare: hi / sum };
}

/** In-place radix-2 FFT. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j] ?? 0, re[i] ?? 0];
      [im[i], im[j]] = [im[j] ?? 0, im[i] ?? 0];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const ang = (-2 * Math.PI) / size;
    for (let s = 0; s < n; s += size) {
      for (let k = 0; k < size / 2; k++) {
        const c = Math.cos(ang * k);
        const d = Math.sin(ang * k);
        const p = s + k + size / 2;
        const xr = (re[p] ?? 0) * c - (im[p] ?? 0) * d;
        const xi = (re[p] ?? 0) * d + (im[p] ?? 0) * c;
        re[p] = (re[s + k] ?? 0) - xr;
        im[p] = (im[s + k] ?? 0) - xi;
        re[s + k] = (re[s + k] ?? 0) + xr;
        im[s + k] = (im[s + k] ?? 0) + xi;
      }
    }
  }
}
