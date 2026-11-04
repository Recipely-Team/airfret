// Dynamic time warping between two chroma sequences: the best way to line one performance up with
// another, frame by frame, and what that says about their tempo and how alike they are.

import { FPS } from './chroma.mjs';

/** Central part of the path used for the tempo fit, so leading silence and a final fermata don't count. */
const FIT_FROM = 0.1;
const FIT_TO = 0.9;

/**
 * Aligns `a` with `b` (cost 1 − cosine of mean-centred chroma). Steps (1,1), (2,1) and (1,2) keep the
 * local tempo between half and double, so a different piece can't be bent into a good match. Returns the
 * path, the mean similarity along it, and the tempo of `b` relative to `a` (> 1: `b` takes longer).
 */
export function align(a, b) {
  const [ca, cb] = [centre(a), centre(b)];
  const n = ca.length;
  const m = cb.length;
  const W = m + 1;
  const acc = new Float32Array((n + 1) * W).fill(Infinity);
  const step = new Uint8Array((n + 1) * W);
  const cost = (i, j) => 1 - dot(ca[i - 1], cb[j - 1]);
  acc[0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const c = cost(i, j);
      const diag = acc[(i - 1) * W + j - 1];
      const tall = i >= 2 ? acc[(i - 2) * W + j - 1] + cost(i - 1, j) : Infinity;
      const wide = j >= 2 ? acc[(i - 1) * W + j - 2] + cost(i, j - 1) : Infinity;
      const best = Math.min(diag, tall, wide);
      acc[i * W + j] = c + best;
      step[i * W + j] = best === diag ? 0 : best === tall ? 1 : 2;
    }
  }
  const path = [];
  let [i, j] = [n, m];
  while (i > 0 && j > 0) {
    path.unshift([i - 1, j - 1]);
    const s = step[i * W + j];
    if (s === 1) {
      path.unshift([i - 2, j - 1]);
      [i, j] = [i - 2, j - 1];
    } else if (s === 2) {
      path.unshift([i - 1, j - 2]);
      [i, j] = [i - 1, j - 2];
    } else [i, j] = [i - 1, j - 1];
  }
  const similarity = path.reduce((s, [p, q]) => s + dot(ca[p], cb[q]), 0) / path.length;
  return { path, similarity, tempoRatio: slope(path) };
}

/** Removes the sequence's average chroma (noise floor, key colour), then renormalises each frame. */
function centre(seq) {
  const mean = new Float64Array(12);
  for (const f of seq) for (let k = 0; k < 12; k++) mean[k] += f[k] / seq.length;
  return seq.map((f) => {
    const c = Float64Array.from({ length: 12 }, (_, k) => f[k] - mean[k]);
    const norm = Math.hypot(...c);
    return norm > 1e-9 ? c.map((v) => v / norm) : c;
  });
}

/** Least-squares slope of b-frame against a-frame over the central part of the path. */
function slope(path) {
  const pts = path.slice(Math.floor(path.length * FIT_FROM), Math.ceil(path.length * FIT_TO));
  const mx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
  const my = pts.reduce((s, [, y]) => s + y, 0) / pts.length;
  const sxy = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const sxx = pts.reduce((s, [x]) => s + (x - mx) ** 2, 0) || 1;
  return sxy / sxx;
}

/** Seconds in `b` that correspond to second `t` in `a`, read off the path. */
export function mapTime(path, t) {
  const f = Math.round(t * FPS);
  const hit = path.find(([p]) => p >= f) ?? path.at(-1);
  return hit[1] / FPS;
}

function dot(x, y) {
  let s = 0;
  for (let k = 0; k < 12; k++) s += x[k] * y[k];
  return s;
}
