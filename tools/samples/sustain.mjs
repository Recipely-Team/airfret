// Readies a sustained instrument's sample set (a wind, a bowed string) for playing held notes, in place:
//
//   node tools/samples/sustain.mjs <set-dir> [--to -14] [--loop] [--codec flac]
//
// Recordings of held notes often swell in slowly ("susLong" takes rise over a second or more) and differ from note
// to note by up to 20 dB, so short notes sound faint and unfinished and a tune jumps in loudness. For every
// recording in the set's manifest this:
//   1. starts it at the true onset and lets it reach its full level in ATTACK seconds, as a player tonguing a
//      note does — by lifting the slow swell until the note first reaches its steady level (changes slower than
//      SMOOTH; vibrato stays). After that the note keeps its own life: a ney's breath easing off is also its pitch
//      easing, and lifting it would bring the flat end up;
//   2. moves its steady level toward the set's median — or `--to` dB, so every held instrument sits at one level in
//      a band — keeping KEEP of the natural register difference (never past PEAK);
//   3. re-measures its tuning as it now plays (the evened start and any loop weigh in) for the manifest's `cents`;
//   4. with --loop, bakes a crossfaded loop into its steady part and writes `loopStart`/`loopEnd` (seconds) into
//      the manifest, so a note can be held for as long as it is played (use --codec flac: AAC's encoder delay
//      would shift the loop points).
// Run it once on a freshly prepared set (prepare.mjs); running it again re-applies to already even recordings.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decode } from '../calibrate/decode.mjs';
import { SR } from '../calibrate/analyze.mjs';
import { fundamental } from '../calibrate/pitch.mjs';

/** Seconds from the onset to the full level. */
const ATTACK = 0.05;
/** The onset: where the sound first comes within this many dB of its steady level. */
const ONSET_DB = 24;
/** Kept before the onset, seconds, so the breath or bow's first contact survives. */
const PRE_ROLL = 0.012;
/** Level changes slower than this (seconds) are evened out; faster ones (vibrato, bow changes) are kept. */
const SMOOTH = 0.3;
/** Over its first moments a note is evened on a shorter window, so the swell's soft start is lifted too. */
const EARLY = { seconds: 0.6, smooth: 0.06 };
/** The swell is over once the note comes this close to its steady level, dB; the lift hands back over HANDBACK s. */
const REACHED_DB = 3;
const HANDBACK = 0.1;
/** At most this much gain lifts a quiet stretch, dB. */
const MAX_LIFT_DB = 20;
/** Share of a note's difference from the set's median level that is kept — at most SPREAD dB either way. */
const KEEP = 0.35;
const SPREAD = 3;
/** The loop's crossfade, seconds, and the shortest loop worth making. */
const XFADE = 0.12;
const MIN_LOOP = 0.25;
/** The loop start is matched to the loop end over this long, seconds, trying every SEARCH_STEP samples. */
const MATCH = 0.03;
const SEARCH_STEP = 2;
/** How much a match may be traded for a longer loop (0: the best match wherever it is). */
const LONGER = 0.05;
/** The recording's own fade-out (prepare.mjs) is left out of the steady part, seconds. */
const TAIL = 0.35;
const AAC_BITRATE = '96k';
/** Where a note's steady level is read, seconds into it. */
const BODY = { from: 0.3, to: 2.5 };
/** A measured tuning error larger than this (cents) is an analysis mistake, as in prepare.mjs: the old one stays. */
const MAX_CORRECTION = 60;
/** Tuning is measured over this much of the note as it plays (a loop repeated), seconds. */
const HEARD = 3;
/** No sample peaks above this. */
const PEAK = 0.95;

const [dir, ...rest] = process.argv.slice(2);
if (!dir) throw new Error('usage: sustain.mjs <set-dir> [--loop] [--codec flac]');
const shouldLoop = rest.includes('--loop');
const codec = rest.includes('--codec') ? rest[rest.indexOf('--codec') + 1] : 'aac';
const manifestPath = join(dir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
const lin = (d) => 10 ** (d / 20);

const notes = manifest.samples.map((s) => {
  const audio = decode(join(dir, s.file));
  const late = envelope(audio, Math.round(SMOOTH * SR));
  const early = envelope(audio, Math.round(EARLY.smooth * SR));
  const env = late.map((v, i) => (i < EARLY.seconds * SR ? early[i] : v));
  // The steady level: the median over the note's body (BODY, before its fade-out) — as held-notes.audio.test.ts
  // measures it; a short note's whole length.
  const end = Math.max(1, audio.length - Math.round(TAIL * SR));
  const from = Math.min(Math.round(BODY.from * SR), Math.floor(end / 2));
  const body = env.slice(from, Math.max(from + 1, Math.min(end, Math.round(BODY.to * SR))));
  const steady = percentile(body, 0.5);
  return { s, audio, env, early, late, steady };
});
const median = percentile(notes.map((n) => db(n.steady)), 0.5);
const level = rest.includes('--to') ? Number(rest[rest.indexOf('--to') + 1]) : median;

for (const n of notes) {
  const { s, audio, env, early, late, steady } = n;
  const onset = Math.max(0, env.findIndex((v) => v >= steady * lin(-ONSET_DB)) - Math.round(PRE_ROLL * SR));
  const attack = Math.round(ATTACK * SR);
  const keep = Math.max(-SPREAD, Math.min(SPREAD, KEEP * (db(steady) - median)));
  const target = lin(level + keep - db(steady));
  const reached = Math.max(onset, env.findIndex((v) => v >= steady * lin(-REACHED_DB)));
  const handback = Math.round(HANDBACK * SR);
  const out = new Float32Array(audio.length - onset);
  for (let i = 0; i < out.length; i++) {
    const at = onset + i;
    // From the short window to the long one over the first moments, so there is no seam.
    const k2 = Math.min(1, Math.max(0, (at / SR - EARLY.seconds / 2) / (EARLY.seconds / 2)));
    const heardNow = early[at] * (1 - k2) + late[at] * k2;
    const lift = Math.min(lin(MAX_LIFT_DB), Math.max(1, steady / Math.max(heardNow, 1e-9)));
    // Past the swell, the lift eases back to none: from there the note is as it was played.
    const past = Math.min(1, Math.max(0, (at - reached) / handback));
    const even = lift * (1 - past) + past;
    // The evening comes in over the attack: the note speaks from the true onset to its full level in ATTACK.
    const k = Math.min(1, i / attack);
    out[i] = audio[onset + i] * (1 + (even - 1) * k) * target;
  }
  const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  if (peak > PEAK) for (let i = 0; i < out.length; i++) out[i] *= PEAK / peak;
  const ref = { ...s, file: s.file.replace(/\.[a-z0-9]+$/, codec === 'flac' ? '.flac' : '.m4a') };
  if (shouldLoop) Object.assign(ref, bakeLoop(out));
  const cents = centsOff(heard(out, ref), s.midi);
  if (cents !== null) ref.cents = cents;
  encode(out, join(dir, ref.file));
  if (ref.file !== s.file) rmSync(join(dir, s.file));
  Object.assign(s, ref);
  console.log(`${s.file}: ${ref.cents} c, onset ${(onset / SR).toFixed(3)} s, level ${db(steady).toFixed(1)} → ${(level + keep).toFixed(1)} dB${ref.loopEnd ? `, loop ${ref.loopStart}–${ref.loopEnd} s` : ''}`);
}
writeFileSync(manifestPath, JSON.stringify({ samples: manifest.samples }));

/** RMS over a centred window of `w` samples, at every sample (a running sum). */
function envelope(a, w) {
  const sq = new Float64Array(a.length + 1);
  for (let i = 0; i < a.length; i++) sq[i + 1] = sq[i] + a[i] * a[i];
  const half = Math.floor(w / 2);
  const env = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(a.length, i + half);
    env[i] = Math.sqrt((sq[hi] - sq[lo]) / Math.max(1, hi - lo));
  }
  return env;
}

function percentile(xs, p) {
  const sorted = Array.from(xs).sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
}

/**
 * A loop over the steady part — from after the attack to before the fade-out — with its end crossfaded into what
 * precedes its start, so the jump back is seamless. The start is where the waveform best matches the stretch before
 * the end (cross-correlation over MATCH seconds): the crossfade then joins like with like, with no flutter.
 */
function bakeLoop(a) {
  const xf = Math.round(XFADE * SR);
  const match = Math.round(MATCH * SR);
  const end = a.length - Math.round(TAIL * SR);
  const earliest = Math.max(xf, Math.round(ATTACK * SR * 4));
  const latest = end - Math.round(MIN_LOOP * SR);
  if (latest <= earliest) return {};
  let start = earliest;
  let best = -Infinity;
  for (let c = earliest; c <= latest; c += SEARCH_STEP) {
    let dot = 0;
    let ea = 0;
    let eb = 0;
    for (let i = 0; i < match; i++) {
      const x = a[end - match + i];
      const y = a[c - match + i];
      dot += x * y;
      ea += x * x;
      eb += y * y;
    }
    // Normalised, and a longer loop preferred a little: fewer repeats are heard.
    const score = dot / Math.sqrt(ea * eb + 1e-12) - (c - earliest) / (latest - earliest + 1) * LONGER;
    if (score > best) {
      best = score;
      start = c;
    }
  }
  for (let i = 0; i < xf; i++) {
    const k = i / xf;
    a[end - xf + i] = a[end - xf + i] * Math.cos((k * Math.PI) / 2) + a[start - xf + i] * Math.sin((k * Math.PI) / 2);
  }
  return { loopStart: +(start / SR).toFixed(5), loopEnd: +(end / SR).toFixed(5) };
}

/** The note as a player holds it: the recording, its loop repeated, HEARD seconds long. */
function heard(a, ref) {
  if (ref.loopEnd === undefined) return a;
  const start = Math.round(ref.loopStart * SR);
  const end = Math.round(ref.loopEnd * SR);
  const out = new Float32Array(Math.round(HEARD * SR));
  for (let i = 0; i < out.length; i++) out[i] = a[i < end ? i : start + ((i - end) % (end - start))];
  return out;
}

/** Cents to add on playback to land in tune (prepare.mjs's convention); null when the meter can't be trusted. */
function centsOff(a, midi) {
  const nominal = 440 * 2 ** ((midi - 69) / 12);
  const measured = fundamental(a, nominal);
  const c = Number.isFinite(measured) ? Math.round(1200 * Math.log2(nominal / measured)) : NaN;
  return Number.isFinite(c) && Math.abs(c) <= MAX_CORRECTION ? c : null;
}

function encode(a, path) {
  const args = ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-'];
  execFileSync('ffmpeg', [...args, ...(codec === 'flac' ? ['-c:a', 'flac'] : ['-c:a', 'aac', '-b:a', AAC_BITRATE]), path], { input: Buffer.from(a.buffer) });
}
