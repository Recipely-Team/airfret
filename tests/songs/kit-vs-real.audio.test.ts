import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SR } from '../../tools/calibrate/analyze.mjs';
import { decode } from '../../tools/calibrate/decode.mjs';
import { drumMetrics } from './drum-metrics';

/**
 * The drum kit as the app plays it, held to how a real kit measures (the MuldjordKit's own recordings, measured
 * 2026-11-08). The synthesised kit it replaced failed every one of these: a snare and cymbals twice as bright (all
 * hiss, centroid 12 kHz), toms an octave high and cut short (0.22 s), a closed hi-hat a 20 ms tick, a ride that died
 * in 0.5 s.
 */
const KIT = 'public/samples/kit';
const manifest = JSON.parse(readFileSync(`${KIT}/manifest.json`, 'utf8')) as { pieces: Record<string, string[][]> };
/** A piece measured at its third strength band (a firm stroke), first take. */
const measure = (piece: string) => drumMetrics(decode(`${KIT}/${manifest.pieces[piece]?.[2]?.[0] ?? ''}.m4a`) as Float32Array, SR);

describe('The drum kit, against a real kit', () => {
  it('has every piece the kit page plays, in four strength bands of two takes', () => {
    for (const piece of ['kick', 'snare', 'tom1', 'tom2', 'floor', 'hatClosed', 'hatPedal', 'hatOpen', 'crash', 'ride', 'bell']) {
      expect(manifest.pieces[piece], piece).toHaveLength(4);
      for (const band of manifest.pieces[piece] ?? []) expect(band).toHaveLength(2);
    }
  });

  it('a kick that thumps low with a beater click, a snare bright but not hiss', () => {
    const kick = measure('kick');
    expect(kick.lowHz).toBeLessThan(70);
    expect(kick.centroid).toBeGreaterThan(500);
    const snare = measure('snare');
    expect(snare.centroid).toBeGreaterThan(2000);
    expect(snare.centroid).toBeLessThan(5000);
    expect(snare.t30).toBeGreaterThan(0.1);
  });

  it('toms tuned high to low that ring half a second and more', () => {
    const [t1, t2, floor] = ['tom1', 'tom2', 'floor'].map(measure);
    expect(t1!.lowHz).toBeGreaterThan(t2!.lowHz);
    expect(t2!.lowHz).toBeGreaterThan(floor!.lowHz);
    expect(floor!.lowHz).toBeLessThan(100);
    for (const t of [t1!, t2!, floor!]) expect(t.t30).toBeGreaterThan(0.4);
  });

  it('cymbals that shimmer (not hiss) and ring: a closed hat short, an open one longer, a ride for seconds', () => {
    for (const piece of ['hatClosed', 'hatOpen', 'crash', 'ride']) expect(measure(piece).centroid, piece).toBeLessThan(10000);
    expect(measure('hatClosed').t30).toBeGreaterThan(0.08);
    expect(measure('hatOpen').t30).toBeGreaterThan(0.4);
    expect(measure('crash').t30).toBeGreaterThan(1);
    expect(measure('ride').t30).toBeGreaterThan(2);
  });
});
