// Adds the rim click (cross-stick) to the app's drum kit, which the MuldjordKit wasn't recorded with:
//
//   node tools/samples/kit-rim.mjs <one-hit-file> <many-hits-file> public/samples/kit
//
// Sources (both CC0, Freesound): mccaslinmusic "JP Cross-Stick 4" (476380, one hit) and studio501 "Risen 6 x 14 wood
// Side stick" (339806, a run of hits). Takes the one hit and the clearest few of the run, each cut from its onset with
// a fade, levelled to one peak a step under the kit's snare, and writes them as the `rim` piece of `manifest.json`
// (every band the same takes in turn — the kit's gain already follows the stroke's strength).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decode } from '../calibrate/decode.mjs';
import { SR } from '../calibrate/analyze.mjs';

const BANDS = 4;
const SECONDS = 0.35;
const FADE = 0.08;
/** A cross-stick's peak against a full snare stroke's (−4.4 dB): a knock, not a backbeat. */
const UNDER_SNARE = 0.6;
/** How many hits of the run are kept (the loudest, so the clearest). */
const FROM_RUN = 3;
const GAP = 0.5;
const AAC_BITRATE = '96k';

const [one, run, out] = process.argv.slice(2);
if (!one || !run || !out) throw new Error('usage: kit-rim.mjs <one-hit-file> <many-hits-file> <kit-dir>');
const hits = [cut(decode(one), 0), ...loudest(decode(run), FROM_RUN)];
const snarePeak = peakOf(decode(join(out, `snare-${BANDS}a.m4a`)));
const names = hits.map((h, i) => {
  const name = `rim-${'abcd'[i]}`;
  const scaled = h.map((v) => (v * snarePeak * UNDER_SNARE) / peakOf(h));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'aac', '-b:a', AAC_BITRATE, join(out, `${name}.m4a`)], { input: Buffer.from(Float32Array.from(scaled).buffer) });
  return name;
});
const manifestPath = join(out, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.pieces.rim = Array.from({ length: BANDS }, (_, b) => [names[b % names.length], names[(b + 2) % names.length]]);
writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`${names.length} rim takes, peak ${(snarePeak * UNDER_SNARE).toFixed(3)}`);

function peakOf(a) {
  let pk = 0;
  for (const v of a) pk = Math.max(pk, Math.abs(v));
  return pk;
}

/** The `count` loudest hits of a run, each its own cut; hits are at least GAP apart. */
function loudest(a, count) {
  const gap = Math.round(GAP * SR);
  const found = [];
  const pk = peakOf(a);
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i]) < pk * 0.25) continue;
    let top = i;
    for (let j = i; j < Math.min(a.length, i + gap); j++) if (Math.abs(a[j]) > Math.abs(a[top])) top = j;
    found.push({ at: i, level: Math.abs(a[top]) });
    i += gap;
  }
  return found.sort((x, y) => y.level - x.level).slice(0, count).map((h) => cut(a, Math.max(0, h.at - Math.round(0.05 * SR))));
}

/** From the onset (a millisecond before it) after `from`, SECONDS long, fading out over its last FADE. */
function cut(a, from) {
  const part = a.subarray(from, Math.min(a.length, from + Math.round((SECONDS + 0.1) * SR)));
  const pk = peakOf(part);
  const onset = Math.max(0, part.findIndex((v) => Math.abs(v) > pk * 0.02) - Math.round(0.001 * SR));
  const len = Math.min(part.length - onset, Math.round(SECONDS * SR));
  const outA = Float32Array.from(part.subarray(onset, onset + len));
  const fade = Math.min(len, Math.round(FADE * SR));
  for (let i = 0; i < fade; i++) outA[len - fade + i] *= 1 - i / fade;
  return outA;
}
