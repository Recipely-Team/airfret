// Re-measures the tuning error of every recording in a sample set and rewrites its manifest's `cents`
// (nothing is re-encoded):  node tools/samples/retune-manifest.mjs public/samples/<set>
//
// Uses the long-FFT fundamental (tools/calibrate/pitch.mjs), which reads pitch offsets exactly; the
// inharmonicity fit used before over-read them by about 60 %, so its corrections pushed some notes
// further out of tune.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decode } from '../calibrate/decode.mjs';
import { fundamental } from '../calibrate/pitch.mjs';

/** Larger measured errors are analysis mistakes and are ignored (same limit as prepare.mjs and SampleSet). */
const MAX_CORRECTION = 60;

const dir = process.argv[2];
const path = join(dir, 'manifest.json');
const manifest = JSON.parse(readFileSync(path, 'utf8'));
let changed = 0;
for (const s of manifest.samples) {
  const nominal = 440 * 2 ** ((s.midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(nominal / fundamental(decode(join(dir, s.file)), nominal)));
  const next = Math.abs(cents) > MAX_CORRECTION ? 0 : cents;
  if (next !== s.cents) changed++;
  s.cents = next;
}
writeFileSync(path, `${JSON.stringify(manifest)}\n`);
console.log(`${dir}: ${manifest.samples.length} recordings, ${changed} corrections changed`);
