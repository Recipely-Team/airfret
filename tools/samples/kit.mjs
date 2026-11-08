// Turns the MuldjordKit (FreePats, CC BY 4.0 — Lars Muldjord) into the app's drum kit, in place:
//
//   node tools/samples/kit.mjs <muldjordkit-checkout> public/samples/kit
//
// Its samples are numbered softest to hardest per piece. For each piece the app plays, this keeps BANDS strength bands
// with TAKES takes each (round robin), mixed to mono, cut to the piece's natural length with a fade, all scaled by one
// gain (the recorded balance between the drums is kept), and writes `manifest.json`:
// { pieces: { kick: [["kick-1a", "kick-1b"], …], … } } — bands soft → hard.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decode } from '../calibrate/decode.mjs';
import { SR } from '../calibrate/analyze.mjs';

const BANDS = 4;
const TAKES = 2;
/** Where each sits in its band (share of the way up it): the take a drummer's stroke of that strength sounds like. */
const IN_BAND = [0.55, 0.85];
const PEAK = 0.9;
const FADE = 0.12;
const AAC_BITRATE = '96k';
/** The app's pieces: the kit's folder, how long the sound is kept (seconds), and which band range of it is used. */
const PIECES = {
  kick: { dir: 'KdrumL', seconds: 1.2 },
  snare: { dir: 'Snare1', seconds: 1.0 },
  tom1: { dir: 'Tom1', seconds: 2.2 },
  tom2: { dir: 'Tom2', seconds: 2.2 },
  floor: { dir: 'Tom4', seconds: 2.5 },
  hatClosed: { dir: 'HihatClosed', seconds: 0.6 },
  // The pedal's chick: the softest closed hits, short.
  hatPedal: { dir: 'HihatClosed', seconds: 0.25, upTo: 0.3 },
  hatOpen: { dir: 'HihatOpen', seconds: 2.5 },
  crash: { dir: 'CrashL', seconds: 4.5 },
  ride: { dir: 'RideL', seconds: 5 },
  bell: { dir: 'RideLBell', seconds: 3 },
};

const [source, out] = process.argv.slice(2);
if (!source || !out) throw new Error('usage: kit.mjs <muldjordkit-checkout> <out-dir>');
mkdirSync(out, { recursive: true });
const cuts = [];
const manifest = {};
for (const [piece, spec] of Object.entries(PIECES)) {
  const dir = join(source, 'samples', spec.dir);
  const files = readdirSync(dir).filter((f) => f.endsWith('.flac')).sort((a, b) => parseInt(a) - parseInt(b));
  const usable = files.slice(0, Math.max(1, Math.round(files.length * (spec.upTo ?? 1))));
  manifest[piece] = [];
  for (let b = 0; b < BANDS; b++) {
    const band = [];
    for (let k = 0; k < TAKES; k++) {
      const at = Math.min(usable.length - 1, Math.floor(((b + IN_BAND[k]) / BANDS) * usable.length));
      const name = `${piece}-${b + 1}${'ab'[k]}`;
      cuts.push({ name, audio: cut(decode(join(dir, usable[at])), spec.seconds) });
      band.push(name);
    }
    manifest[piece].push(band);
  }
}
const peak = Math.max(...cuts.map((c) => c.audio.reduce((m, v) => Math.max(m, Math.abs(v)), 0)));
for (const c of cuts) {
  const scaled = c.audio.map((v) => (v * PEAK) / peak);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'aac', '-b:a', AAC_BITRATE, join(out, `${c.name}.m4a`)], { input: Buffer.from(Float32Array.from(scaled).buffer) });
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ pieces: manifest }));
console.log(`${cuts.length} takes, ${Object.keys(manifest).length} pieces, kit gain ${(PEAK / peak).toFixed(3)}`);

/** From the onset (a millisecond before it), at most `seconds` long, fading out over its last FADE. */
function cut(a, seconds) {
  let pk = 0;
  for (const v of a) pk = Math.max(pk, Math.abs(v));
  const onset = Math.max(0, a.findIndex((v) => Math.abs(v) > pk * 0.02) - Math.round(0.001 * SR));
  const len = Math.min(a.length - onset, Math.round(seconds * SR));
  const outA = Float32Array.from(a.subarray(onset, onset + len));
  const fade = Math.min(len, Math.round(FADE * SR));
  for (let i = 0; i < fade; i++) outA[len - fade + i] *= 1 - i / fade;
  return outA;
}
