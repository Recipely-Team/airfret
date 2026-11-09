import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PluckRequest } from '@domain/audio/pluck-request';
import { Voice } from '@domain/audio/voice';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import type { Instrument } from '@domain/instruments/instrument';
import { INSTRUMENTS } from '@domain/instruments/instrument-catalog';
import { KEYBOARDS } from '@domain/keys/keyboard-instruments';
import { PIANO } from '@domain/keys/piano';
import { voicesFor, withVoice } from '@domain/instruments/voice-catalog';
import type { SampleManifest } from '@infrastructure/audio/samples/sample-manifest';
import type { SampleRef } from '@infrastructure/audio/samples/sample-ref';
import { SAMPLE_SET_BY_INSTRUMENT } from '@infrastructure/audio/samples/sample-sets';
import { analyze, distance } from '../../tools/calibrate/analyze.mjs';
import { decode } from '../../tools/calibrate/decode.mjs';
import { fundamental } from '../../tools/calibrate/pitch.mjs';
import { render, SR } from './render-performance';

/**
 * Every instrument against recordings of the real thing, note by note.
 *
 * - **What the app plays** (the recorded voice, re-pitched and tuning-corrected by SampleSet) must be in
 *   tune — including notes re-pitched past the recorded range (drop D, the top of the bass).
 * - **The synth fallback** (heard before a set loads, for muted strokes and outside the recordings) must be
 *   in tune and, for decay and tone colour, no further from the recording than it is today. These are
 *   ratchets like the coverage minimums: lower them as the string model improves, never raise them.
 */
/** What the app plays must be this close to true pitch (a trained ear notices about 5 c on a held note). */
const IN_TUNE_CENTS = 3;
/**
 * A piano's lowest octave (below C2): its thick strings are so stiff that their partials run sharp, and pianos are
 * tuned stretched; the meter reads the partial-pulled pitch (A0 +15 c, C1 +6 c on the KW upright). Held to this.
 */
const PIANO_BASS = { belowMidi: 36, cents: 20 } as const;
/** The synth's own pitch error; its dispersion allpass flattens low notes slightly (issue #14). */
const SYNTH_IN_TUNE_CENTS = 10;
/** Median distance of the synth from the recordings: |ln(T60 synth / T60 real)| and early harmonic profile (dB). */
const SYNTH_LIMITS: Record<string, { decayLog: number; profileDb: number }> = {
  // Measured 2026-11-04: the synth decays 2–6× faster than the real strings across its partials.
  acoustic: { decayLog: 1.35, profileDb: 15.5 },
  nylon: { decayLog: 1.9, profileDb: 15 },
  clean: { decayLog: 1.15, profileDb: 14.5 },
  drive: { decayLog: 1.15, profileDb: 13 },
  bass: { decayLog: 0.8, profileDb: 18.5 },
  // The 5-string shares the bass recordings; measured 2026-11-05.
  bass5: { decayLog: 0.8, profileDb: 18.5 },
  // Measured 2026-11-06 with the sets they share: the 12-string's steel recordings, the 7-string's electric,
  // the 6-string bass's bass recordings (its high C re-pitched from the G).
  twelve: { decayLog: 1.35, profileDb: 15.5 },
  guitar7: { decayLog: 1.15, profileDb: 14.5 },
  bass6: { decayLog: 0.8, profileDb: 18.5 },
  // Measured 2026-11-05: decay ×1.7, but the tone colour is the furthest of all — the banjo takes are
  // short (0.6–2 s) and their early harmonics swing ±20 dB note to note, so the profile metric is noisy here.
  banjo: { decayLog: 0.55, profileDb: 32 },
  // Measured 2026-11-07 against the short-neck baglama notes: the plain string synth stands in for a skin-topped lute.
  kopuz: { decayLog: 1.1, profileDb: 30 },
  // Measured 2026-11-10 against their new recordings (FreePats' ukulele; the bağlama set for the saz): the synths now
  // only fill in while the recordings load (and the saz above G4). The saz's tone is far from the bağlama's.
  ukulele: { decayLog: 1.25, profileDb: 11.5 },
  saz: { decayLog: 0.7, profileDb: 40 },
  // Measured 2026-11-06 against the KW upright: decay ×2.9 too short, tone colour 14.3 dB off.
  piano: { decayLog: 1.1, profileDb: 14.5 },
};
/** One recorded note in this many is compared (all strings and the whole range still come up). */
const EVERY = 3;
const START = 0.05;
const PREFERRED_LAYER = 1;

const median = (xs: readonly number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? NaN;
const nominal = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const cents = (hz: number, midi: number) => 1200 * Math.log2(hz / nominal(midi));

function recordings(setId: string): SampleRef[] {
  const m = JSON.parse(readFileSync(`public/samples/${setId}/manifest.json`, 'utf8')) as SampleManifest;
  const layer = m.samples.some((s) => s.layer === PREFERRED_LAYER) ? PREFERRED_LAYER : 0;
  return m.samples.filter((s) => s.layer === layer);
}

/**
 * The real recording a voice is judged against: another take of the same note (a different dynamic layer)
 * when the set has one, so the recorded voice isn't scored against the very file it plays.
 */
function otherTake(setId: string, ref: SampleRef): SampleRef {
  const m = JSON.parse(readFileSync(`public/samples/${setId}/manifest.json`, 'utf8')) as SampleManifest;
  return m.samples.find((s) => s.midi === ref.midi && s.string === ref.string && s.layer !== ref.layer) ?? ref;
}

/** One number per voice, lower is closer to the real instrument: decay (ln ratio) + tone colour (per 10 dB) + pitch (per 3 c). */
function voiceScore(rows: readonly { decayLog: number; profileDb: number; cents: number }[]): number {
  return median(rows.map((r) => r.decayLog)) + median(rows.map((r) => r.profileDb)) / 10 + median(rows.map((r) => Math.abs(r.cents))) / IN_TUNE_CENTS;
}

/** The open string a note is played on: the recording's own, or the highest string that reaches it. */
function stringFor(inst: Instrument, ref: SampleRef | { midi: number; string: number }): number {
  return ref.string >= 0 ? ref.string : inst.tuning.reduce((best, open, i) => (ref.midi >= open ? i : best), 0);
}

function note(inst: Instrument, string: number, midi: number): PluckRequest {
  return { string, midi, amp: 0.7, when: START, isMuted: false, position: inst.pick, voice: Voice.guide, attack: StrikeSurface.nail, isPalmMuted: false };
}

function play(inst: Instrument, string: number, midi: number, useSamples: boolean): Float32Array {
  return render([note(inst, string, midi)], inst, { useSamples }).audio.subarray(Math.round(START * SR));
}

/** Resamples `x` so it sounds `shift` cents higher (what SampleSet's detune does). */
function repitch(x: Float32Array, shift: number): Float32Array {
  const rate = 2 ** (shift / 1200);
  return Float32Array.from({ length: Math.floor(x.length / rate) }, (_, i) => {
    const k = Math.floor(i * rate);
    const f = i * rate - k;
    return (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? 0) * f;
  });
}

describe('Every instrument against recordings of the real instrument', () => {
  it('the pitch meter reads a known shift exactly (an over-reading meter once mis-tuned the sample sets)', () => {
    const x = decode('public/samples/steel/s0-43-v1.m4a') as Float32Array;
    const base = cents(fundamental(x, nominal(43)), 43);
    for (const shift of [-40, -13, 13, 40]) expect(cents(fundamental(repitch(x, shift), nominal(43)), 43) - base).toBeCloseTo(shift, 0);
  });

  // The keyboard instruments (piano, mallets) aren't in the fretted catalogue, but are held to the same bar.
  const keyed = Object.values(KEYBOARDS).map((k) => k.instrument).filter((i) => i.id !== PIANO.id);
  // Bars and winds (marimba, glockenspiel, clarinet…) have no string to model: the string synth only fills in
  // while their recordings load, so it isn't held to sounding like them (bars measured 2026-11-06: ×2.5–51).
  const notStrings = new Set(keyed.map((i) => i.id));
  for (const inst of [...INSTRUMENTS, PIANO, ...keyed]) {
    const setId = SAMPLE_SET_BY_INSTRUMENT[inst.id];
    if (!setId) continue;
    const refs = recordings(setId).filter((_, i) => i % EVERY === 0);

    it(`${inst.id}: what the app plays is in tune on every string, across the whole range`, () => {
      const lowest = Math.min(...refs.map((r) => r.lo));
      const highest = Math.max(...refs.map((r) => r.hi));
      // Past the recordings by a whole tone (drop tunings, the top frets) — but a piano has nothing beyond its 88 keys.
      const isFixedRange = inst.frets === 0;
      // A keyboard instrument stops at its own keys (the horn's A1, not the piano's A0).
      const keys = KEYBOARDS[inst.id];
      const bottom = keys?.low ?? inst.tuning[0] ?? lowest;
      const top = keys?.high ?? inst.tuning[inst.tuning.length - 1] ?? highest;
      const low = isFixedRange ? Math.max(lowest - 2, bottom) : lowest - 2;
      const high = isFixedRange ? Math.min(highest + 2, top) : highest + 2;
      const stretched = [{ midi: low, string: 0 }, { midi: high, string: inst.tuning.length - 1 }];
      const off = [...refs, ...stretched].map((r) => ({ midi: r.midi, c: cents(fundamental(play(inst, stringFor(inst, r), r.midi, true), nominal(r.midi)), r.midi) }));
      const limit = (midi: number) => (inst.frets === 0 && midi < PIANO_BASS.belowMidi ? PIANO_BASS.cents : IN_TUNE_CENTS);
      const worst = off.reduce((a, b) => (Math.abs(b.c) / limit(b.midi) > Math.abs(a.c) / limit(a.midi) ? b : a));
      console.info(`${inst.id}: ${off.length} notes, worst ${worst.c.toFixed(1)} c at MIDI ${worst.midi}`);
      expect(Math.abs(worst.c)).toBeLessThan(limit(worst.midi));
    });

    it.skipIf(notStrings.has(inst.id))(`${inst.id}: the synth fallback is in tune and no further from the recordings than today`, () => {
      const rows = refs.map((r) => {
        const real = analyze(decode(`public/samples/${setId}/${r.file}`) as Float32Array, nominal(r.midi));
        const audio = play(inst, stringFor(inst, r), r.midi, false);
        return { c: cents(fundamental(audio, nominal(r.midi)), r.midi), ...distance(analyze(audio, nominal(r.midi)), real) };
      });
      const decayLog = median(rows.map((r) => r.decayLog));
      const profileDb = median(rows.map((r) => r.profileDb));
      console.info(`${inst.id} synth vs real: ${rows.length} notes · decay ×${Math.exp(decayLog).toFixed(2)} (ln ${decayLog.toFixed(2)}) · profile ${profileDb.toFixed(1)} dB`);
      expect(Math.max(...rows.map((r) => Math.abs(r.c)))).toBeLessThan(SYNTH_IN_TUNE_CENTS);
      const limit = SYNTH_LIMITS[inst.id];
      expect(decayLog).toBeLessThanOrEqual(limit?.decayLog ?? 0);
      expect(profileDb).toBeLessThanOrEqual(limit?.profileDb ?? 0);
    });
  }

  for (const base of INSTRUMENTS) {
    const setId = SAMPLE_SET_BY_INSTRUMENT[base.id];
    const voices = voicesFor(base.id);
    if (!setId || voices.length < 2) continue;
    it(`${base.id}: its voices are ranked best first, as measured against the real instrument`, () => {
      const refs = recordings(setId).filter((_, i) => i % (EVERY * 2) === 0);
      const scores = voices.map((v) => {
        const inst = withVoice(base, v.id);
        const rows = refs.map((r) => {
          const take = otherTake(setId, r);
          const real = analyze(decode(`public/samples/${setId}/${take.file}`) as Float32Array, nominal(r.midi));
          const audio = play(inst, stringFor(inst, r), r.midi, true);
          return { cents: cents(fundamental(audio, nominal(r.midi)), r.midi), ...distance(analyze(audio, nominal(r.midi)), real) };
        });
        return { voice: v.id, score: voiceScore(rows) };
      });
      console.info(`${base.id} voices: ${scores.map((x, i) => `${i + 1}. ${x.voice} ${x.score.toFixed(2)}`).join(' · ')}`);
      const measured = [...scores].sort((a, b) => a.score - b.score).map((x) => x.voice);
      expect(voices.map((v) => v.id), 'reorder VOICES in voice-catalog.ts to the measured ranking').toEqual(measured);
    });
  }
});
