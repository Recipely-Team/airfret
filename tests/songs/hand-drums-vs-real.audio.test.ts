import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { SR } from '../../tools/calibrate/analyze.mjs';
import { decode } from '../../tools/calibrate/decode.mjs';
import { drumMetrics } from './drum-metrics';
import { fundamental } from '../../tools/calibrate/pitch.mjs';

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
    for (const [h, part] of [[0, 'center'], [0, 'edge'], [1, 'center']] as const) expect(fileOf('tabla', h, part), `tabla ${h} ${part}`).toBeDefined();
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

  it('a tabla whose ge booms low and rings, and a handpan whose every note plays its real take exactly in tune', () => {
    const ge = measure(fileOf('tabla', 0, 'center'));
    expect(ge.lowHz).toBeLessThan(200);
    expect(ge.t30).toBeGreaterThan(0.25);
    const pan = handDrumFor('handpan')?.heads ?? [];
    expect(pan.length).toBe(9);
    for (const head of pan) {
      const midi = Number(head.center.label.replace('note.', ''));
      const rec = head.center.recording;
      expect(rec, `${midi}`).toBeDefined();
      const audio = decode(`${DIR}/${rec?.layers[0]?.[0] ?? ''}.m4a`) as Float32Array;
      const target = 440 * 2 ** ((midi - 69) / 12);
      const heard = fundamental(audio.subarray(Math.round(0.1 * SR), Math.round(1.5 * SR)), target / (rec?.rate ?? 1)) * (rec?.rate ?? 1);
      expect(Math.abs(1200 * Math.log2(heard / target)), `${midi}`).toBeLessThan(3);
    }
  });
});
