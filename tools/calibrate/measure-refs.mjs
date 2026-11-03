// Measures every region of an SFZ instrument: node measure-refs.mjs <file.sfz> [out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { analyze } from './analyze.mjs';
import { decode } from './decode.mjs';

const [sfzPath, outPath] = process.argv.slice(2);
const text = readFileSync(sfzPath, 'utf8');
const regions = [];
let current = {};
for (const line of text.split(/\r?\n/)) {
  const sample = /sample=([^\r\n]+?\.(flac|wav))/i.exec(line)?.[1];
  const key = /(?:pitch_keycenter|\bkey)=(\d+)/.exec(line)?.[1];
  if (/<region>/.test(line)) current = {};
  if (key) current.key = Number(key);
  if (sample) {
    current.sample = sample.trim();
    if (current.key !== undefined) regions.push({ ...current });
  }
}
const seen = new Set();
const results = [];
for (const r of regions) {
  if (seen.has(r.sample)) continue;
  seen.add(r.sample);
  const f0 = 440 * Math.pow(2, (r.key - 69) / 12);
  const m = analyze(decode(join(dirname(sfzPath), r.sample)), f0);
  results.push({ sample: r.sample, midi: r.key, ...m });
  const p = (k) => m.partials[k - 1];
  const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—');
  console.log(`${String(r.key).padStart(3)} ${r.sample.padEnd(28)} f0=${m.f0.toFixed(1).padStart(6)} B=${m.B.toExponential(1)} T60[1,2,4,8]=${[1, 2, 4, 8].map((k) => fmt(p(k)?.t60)).join('/')}  early[2..6]=${[2, 3, 4, 5, 6].map((k) => fmt(p(k)?.early)).join(' ')}`);
}
if (outPath) writeFileSync(outPath, JSON.stringify(results, null, 1));
