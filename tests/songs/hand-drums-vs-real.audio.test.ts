import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { SR } from '../../tools/calibrate/analyze.mjs';
import { decode } from '../../tools/calibrate/decode.mjs';
import { drumMetrics } from './drum-metrics';

/**
 * The hand drums that were synthesised, as they now play: from real takes (Freesound, CC0 — see CREDITS.md).
 * Measured against those takes, the synth had a djembe bass that was a bare sine (70 Hz centroid against 514 Hz,
 * ringing 0.25 s against 0.59 s) and slaps that were hiss (7–8.6 kHz against about 1 kHz).
 */
const DIR = 'public/samples/hand-drums';
const fileOf = (drum: string, head: number, part: 'center' | 'edge' | 'edgeLeft') => handDrumFor(drum)?.heads[head]?.[part]?.recording?.layers[0]?.[0];
const measure = (file: string | undefined) => drumMetrics(decode(`${DIR}/${file ?? ''}.m4a`) as Float32Array, SR);

describe('The hand drums, from real takes', () => {
  it('give every stroke of the djembe, the cajón and both bongos a recording that is there', () => {
    for (const [drum, heads] of [['djembe', 1], ['cajon', 1], ['bongos', 2]] as const) {
      for (let h = 0; h < heads; h++) {
        for (const part of ['center', 'edge'] as const) {
          const file = fileOf(drum, h, part);
          expect(file, `${drum} ${h} ${part}`).toBeDefined();
          expect(existsSync(`${DIR}/${file}.m4a`), `${file}`).toBe(true);
        }
      }
    }
    expect(fileOf('tabla', 1, 'edge')).toBe('tabla-na');
  });

  it('sound like skins, not sines or hiss: a djembe bass that rings with its skin, slaps around a kilohertz', () => {
    const bass = measure(fileOf('djembe', 0, 'center'));
    expect(bass.lowHz).toBeLessThan(100);
    expect(bass.centroid).toBeGreaterThan(300);
    expect(bass.t30).toBeGreaterThan(0.4);
    expect(measure(fileOf('djembe', 0, 'edgeLeft')).centroid).toBeLessThan(3000);
    expect(measure(fileOf('cajon', 0, 'center')).lowHz).toBeLessThan(80);
    for (const h of [0, 1]) expect(measure(fileOf('bongos', h, 'edge')).centroid).toBeLessThan(3000);
  });
});
