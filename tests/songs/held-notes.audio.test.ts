import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { KEYBOARDS } from '@domain/keys/keyboard-instruments';
import type { SampleManifest } from '@infrastructure/audio/samples/sample-manifest';
import { SAMPLE_SET_BY_INSTRUMENT } from '@infrastructure/audio/samples/sample-sets';
import { SR } from '../../tools/calibrate/analyze.mjs';
import { decode } from '../../tools/calibrate/decode.mjs';

/**
 * The winds and bowed strings as their recordings are played: a held note must speak at once and sound whole — a
 * short note at a march's tempo lasts a quarter of a second — and a tune must not jump in loudness from note to note.
 * (Recordings of slowly swelling notes made the clarinet's short notes faint and unfinished; `sustain.mjs` fixes a
 * set, this keeps it fixed.)
 */
/** A note reaches within 6 dB of its steady level this soon, ms (a real wind speaks in 50–100 ms). */
const SPEAKS_WITHIN_MS = 80;
/** Neighbouring recordings differ in steady level by at most this much, dB. */
const NEIGHBOURS_WITHIN_DB = 7;
const WINDOW = 0.01;
/** A note's steady level is read over its body: from 0.3 s to 2.5 s, short of the fade-out its recording ends with. */
const BODY = { from: 0.3, to: 2.5, fadeOut: 0.35 } as const;

const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));
const held = [...new Set(Object.entries(KEYBOARDS).filter(([, k]) => k.isMonophonic).map(([id]) => SAMPLE_SET_BY_INSTRUMENT[id]).filter((s): s is string => s !== undefined))];

function measure(path: string): { speakMs: number; steady: number; seconds: number } {
  const a = decode(path) as Float32Array;
  const w = Math.round(WINDOW * SR);
  const rms: number[] = [];
  for (let i = 0; i + w <= a.length; i += w) {
    let e = 0;
    for (let j = i; j < i + w; j++) e += (a[j] ?? 0) * (a[j] ?? 0);
    rms.push(db(Math.sqrt(e / w)));
  }
  const end = Math.max(1, rms.length - BODY.fadeOut / WINDOW);
  const from = Math.min(BODY.from / WINDOW, Math.floor(end / 2));
  const body = rms.slice(from, Math.max(from + 1, Math.min(BODY.to / WINDOW, end))).sort((x, y) => x - y);
  const steady = body[Math.floor(body.length / 2)] ?? -120;
  return { speakMs: rms.findIndex((v) => v >= steady - 6) * WINDOW * 1000, steady, seconds: a.length / SR };
}

describe('Held notes, as their recordings play', () => {
  it.each(held)('%s: every note speaks at once, neighbours sound alike, and a loop lies within its recording', (set) => {
    const m = JSON.parse(readFileSync(`public/samples/${set}/manifest.json`, 'utf8')) as SampleManifest;
    const notes = [...m.samples].sort((a, b) => a.midi - b.midi).map((s) => ({ s, ...measure(`public/samples/${set}/${s.file}`) }));
    for (const n of notes) {
      expect(n.speakMs, `${set} ${n.s.midi}`).toBeLessThanOrEqual(SPEAKS_WITHIN_MS);
      if (n.s.loopEnd !== undefined) expect(n.s.loopEnd, `${set} ${n.s.midi} loop`).toBeLessThanOrEqual(n.seconds);
    }
    for (let i = 1; i < notes.length; i++) {
      expect(Math.abs((notes[i]?.steady ?? 0) - (notes[i - 1]?.steady ?? 0)), `${set} ${notes[i - 1]?.s.midi}→${notes[i]?.s.midi}`).toBeLessThanOrEqual(NEIGHBOURS_WITHIN_DB);
    }
  });
});
