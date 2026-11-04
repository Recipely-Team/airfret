// Turns a multisampled instrument into a web-ready sample set for the app's sample player.
//
//   node tools/samples/prepare.mjs sfz  <file.sfz>  <out-dir> [--seconds 4] [--codec flac]
//   node tools/samples/prepare.mjs meta <ogg-dir>   <out-dir> [--seconds 4.5] [--codec aac]
//
// `sfz`  — FreePats-style maps: one layer, each sample covers a key range and is re-pitched.
// `meta` — Meta Open Sound guitars: every string sampled at every fret in three dynamics, named
//          INSGuitar<Kind>_String<Name>_Vel0<n>[Technique]_<Note>_01.ogg. Nothing is re-pitched.
//
// For every sample: decode to mono, cut the silence before the attack, keep at most `seconds` with
// a fade-out, normalise the whole set to one reference peak, measure the pitch error, and write
// `manifest.json` — { samples: [{ file, midi, lo, hi, string, layer, cents }] }. `string` is −1 when
// the source does not say which string was played. CC0 sources only (public/samples/CREDITS.md).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { SR } from '../calibrate/analyze.mjs';
import { decode } from '../calibrate/decode.mjs';
import { fundamental } from '../calibrate/pitch.mjs';

const OUT_RATE = 44100;
/** The attack starts where the signal first passes this fraction of its peak. */
const ONSET = 0.02;
/** Keep this much before the detected onset so the pick transient survives. */
const PRE_ROLL = 0.003;
const FADE = 0.3;
/** Measured pitch errors larger than this (cents) are analysis mistakes and are ignored. */
const MAX_CORRECTION = 60;
// Pitch is read from the long-FFT fundamental: analyze()'s inharmonicity fit over-reads offsets (~60 %).
const AAC_BITRATE = '72k';
const STRINGS = ['LowE', 'A', 'D', 'G', 'B', 'HighE'];
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const [mode, source, outDir, ...rest] = process.argv.slice(2);
const flag = (name, fallback) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : fallback);
const seconds = Number(flag('--seconds', mode === 'meta' ? 4.5 : 4));
const codec = flag('--codec', mode === 'meta' ? 'aac' : 'flac');
if (!['sfz', 'meta'].includes(mode) || !source || !outDir) throw new Error('usage: prepare.mjs sfz|meta <source> <out-dir>');

const entries = mode === 'sfz' ? parseSfz(source) : parseMeta(source);
mkdirSync(outDir, { recursive: true });
const cuts = entries.map((e) => ({ ...e, audio: trim(decode(e.path)) }));
// One gain for the whole set keeps the recorded level differences — between notes and between soft
// and hard strokes — and puts the loudest sample at a fixed reference peak.
const setPeak = cuts.reduce((m, c) => Math.max(m, peakOf(c.audio)), 0);
const samples = [];
for (const c of cuts) {
  const gain = 0.9 / Math.max(1e-6, setPeak);
  const file = `${c.string >= 0 ? `s${c.string}-` : ''}${c.midi}${c.layer > 0 ? `-v${c.layer}` : ''}.${codec === 'aac' ? 'm4a' : 'flac'}`;
  encode(c.audio.map((v) => v * gain), join(outDir, file));
  const cents = centsOff(c.audio, c.midi);
  samples.push({ file, midi: c.midi, lo: c.lo, hi: c.hi, string: c.string, layer: c.layer, cents });
  console.log(`${file.padEnd(16)} ${(c.audio.length / SR).toFixed(2)} s  ${cents >= 0 ? '+' : ''}${cents} c`);
}
writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify({ samples })}\n`);

function trim(raw) {
  const peak = peakOf(raw);
  let start = raw.findIndex((v) => Math.abs(v) > peak * ONSET);
  start = Math.max(0, start - Math.round(PRE_ROLL * SR));
  const length = Math.min(raw.length - start, Math.round(seconds * SR));
  const cut = raw.slice(start, start + length);
  const fade = Math.min(length, Math.round(FADE * SR));
  for (let i = 0; i < fade; i++) cut[length - fade + i] *= 1 - i / fade;
  return cut;
}

function peakOf(x) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  return m;
}

function centsOff(audio, midi) {
  const nominal = 440 * Math.pow(2, (midi - 69) / 12);
  const measured = fundamental(audio, nominal);
  const cents = Number.isFinite(measured) ? Math.round(1200 * Math.log2(nominal / measured)) : 0;
  return Math.abs(cents) > MAX_CORRECTION ? 0 : cents;
}

function encode(audio, out) {
  const pcm = Buffer.from(Float32Array.from(audio).buffer);
  const codecArgs = codec === 'aac' ? ['-c:a', 'aac', '-b:a', AAC_BITRATE, '-movflags', '+faststart'] : ['-sample_fmt', 's16', '-c:a', 'flac', '-compression_level', '12'];
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-ar', String(OUT_RATE), ...codecArgs, out], { input: pcm });
}

function noteToMidi(name) {
  const m = /^([A-G])(s?)(\d)$/.exec(name);
  return m ? 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] ? 1 : 0) : null;
}

function parseMeta(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ogg'))
    .map((f) => {
      const m = /_String(\w+?)_Vel0(\d)\w*?_([A-G]s?\d)_\d+\.ogg$/.exec(f);
      const midi = m ? noteToMidi(m[3]) : null;
      if (!m || midi === null || !STRINGS.includes(m[1])) throw new Error(`unexpected file name ${f}`);
      return { path: join(dir, f), midi, lo: midi, hi: midi, string: STRINGS.indexOf(m[1]), layer: Number(m[2]) - 1 };
    })
    .sort((a, b) => a.string - b.string || a.midi - b.midi || a.layer - b.layer);
}

/** Regions with their key range and root key; the first sample per root wins. */
function parseSfz(path) {
  const text = readFileSync(path, 'utf8');
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur?.sample && cur.key !== undefined && !out.some((o) => o.midi === cur.key)) {
      out.push({ path: join(dirname(path), cur.sample), midi: cur.key, lo: cur.lo ?? cur.key, hi: cur.hi ?? cur.key, string: -1, layer: 0 });
    }
  };
  for (const token of text.replace(/\/\/[^\n]*/g, '').split(/\s+(?=<|\w+=)/)) {
    if (token.startsWith('<region>')) {
      flush();
      cur = {};
    }
    if (!cur) continue;
    for (const [, k, v] of token.matchAll(/(\w+)=([^\n<]+?)(?=\s+\w+=|\s*$|\s*<)/g)) {
      if (k === 'sample') cur.sample = v.trim();
      else if (k === 'key') cur.key = cur.lo = cur.hi = Number(v);
      else if (k === 'pitch_keycenter') cur.key = Number(v);
      else if (k === 'lokey') cur.lo = Number(v);
      else if (k === 'hikey') cur.hi = Number(v);
    }
  }
  flush();
  return out.sort((a, b) => a.midi - b.midi).map((e) => ({ ...e, name: basename(e.path) }));
}
