// Fits the string model to measured recordings: node fit.mjs <refs.json> <label> <current-json-params>
import { readFileSync } from 'node:fs';
import { analyze, distance } from './analyze.mjs';
import { renderNote } from './model.mjs';

const [refsPath, label, currentJson] = process.argv.slice(2);
const refs = JSON.parse(readFileSync(refsPath, 'utf8'));
const current = JSON.parse(currentJson);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

// 1. Decay law T60₁(f) = A·(110/f)^p by robust least squares on logs (drop outliers > ±0.8 in ln).
let pts = refs.filter((r) => Number.isFinite(r.partials[0]?.t60)).map((r) => ({ x: Math.log(110 / r.f0), y: Math.log(Math.min(30, r.partials[0].t60)) }));
let A = 0;
let pw = 0;
for (let it = 0; it < 3; it++) {
  const mx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
  const my = pts.reduce((s, q) => s + q.y, 0) / pts.length;
  pw = pts.reduce((s, q) => s + (q.x - mx) * (q.y - my), 0) / (pts.reduce((s, q) => s + (q.x - mx) ** 2, 0) || 1);
  A = Math.exp(my - pw * mx);
  pts = pts.filter((q) => Math.abs(q.y - (Math.log(A) + pw * q.x)) < 0.8);
}
if (!Number.isFinite(pw) || Math.abs(pw) > 1.5) pw = 0;
const t60At = (f) => A * Math.pow(110 / f, pw);

// A representative subset across the range keeps the search fast.
const subset = refs.filter((_, i) => i % Math.max(1, Math.floor(refs.length / 5)) === 0).slice(0, 5);
const score = (params) => {
  const d = subset.map((r) => distance(analyze(renderNote({ freq: r.f0, ...params, t60: params.t60fn(r.f0) }), r.f0), r));
  return {
    profileDb: median(d.map((x) => x.profileDb)),
    decayLog: median(d.map((x) => x.decayLog)),
    inharmonicity: median(d.map((x) => x.inharmonicity)),
  };
};
const total = (s) => s.profileDb / 6 + s.decayLog + s.inharmonicity / 2;

const before = { ...current, t60fn: (f) => current.t60 * Math.pow(110 / f, 0.45) };
const sBefore = score(before);

// 2–4. One parameter at a time, each on the measurement it governs.
let best = { ...current, t60fn: t60At };
const search = (key, values, metric) => {
  let bestV = best[key];
  let bestS = Infinity;
  for (const v of values) {
    const s = score({ ...best, [key]: v })[metric];
    if (s < bestS) [bestV, bestS] = [v, s];
  }
  best = { ...best, [key]: bestV };
};
// Each parameter is fitted only on the measurement it physically governs; the early profile is also
// coloured by pickups and amps, so it must not steer the loss filter.
search('stiffness', [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35], 'inharmonicity');
search('bright', [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97], 'decayLog');
search('pick', [0.06, 0.09, 0.12, 0.16, 0.2, 0.25, 0.3, 0.4], 'profileDb');
const sAfter = score(best);

const r2 = (v) => Math.round(v * 100) / 100;
console.log(`${label}: measured T60₁(f) = ${r2(A)}·(110/f)^${r2(pw)}  B≈${median(refs.map((r) => r.B)).toExponential(1)}`);
console.log(`  before  profile ${r2(sBefore.profileDb)} dB  decay ${r2(sBefore.decayLog)}  inharm ${r2(sBefore.inharmonicity)}  → total ${r2(total(sBefore))}`);
console.log(`  after   profile ${r2(sAfter.profileDb)} dB  decay ${r2(sAfter.decayLog)}  inharm ${r2(sAfter.inharmonicity)}  → total ${r2(total(sAfter))}`);
console.log(`  params  ${JSON.stringify({ t60At110: r2(A), t60Exponent: r2(pw), bright: r2(best.bright), pick: r2(best.pick), stiffness: r2(best.stiffness) })}`);
