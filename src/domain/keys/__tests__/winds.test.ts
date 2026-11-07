import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { PianoPlayer } from '@application/keys/piano-player';
import { computeKeyboardLayout, shiftLimits } from '@domain/keys/compute-keyboard-layout';
import { isKeyboard, keyboardFor } from '@domain/keys/keyboard-instruments';

const RANGES = {
  clarinet: [50, 91], flute: [60, 96], trumpet: [52, 84], oboe: [57, 89], bassoon: [33, 76], horn: [36, 77], trombone: [33, 65], tuba: [29, 62],
} as const;

describe('The wind instruments', () => {
  it('reach every note of their range on any screen, and no further', () => {
    for (const [id, [lo, hi]] of Object.entries(RANGES)) {
      expect(isKeyboard(id), id).toBe(true);
      const k = keyboardFor(id)!;
      expect(k.instrument.isRecorded, id).toBe(true);
      for (const w of [1440, 800, 390]) {
        const { down, up } = shiftLimits(w, k);
        const reached = new Set<number>();
        for (let s = down; s <= up; s++) {
          const l = computeKeyboardLayout(w, 900, s, k);
          expect(l.firstMidi, `${id} ${w} ${s}`).toBeGreaterThanOrEqual(lo);
          expect(l.lastMidi, `${id} ${w} ${s}`).toBeLessThanOrEqual(hi);
          for (const key of l.keys) reached.add(key.midi);
        }
        expect(reached.size, `${id} ${w}`).toBe(hi - lo + 1);
      }
    }
  });

  it('sound a note as long as its key is held, and stop it when the key rises', () => {
    for (const id of Object.keys(RANGES)) {
      const sound = new FakeSoundOutput();
      const p = new PianoPlayer(sound);
      p.fit(1440, 900, id, 0);
      const key = p.layout!.keys.find((k) => !k.isBlack)!;
      p.pointer(1, { x: (key.x0 + key.x1) / 2, y: p.layout!.top + 10 }, 0);
      expect(sound.damps.length, id).toBe(0);
      p.pointer(1, null, 2);
      expect({ plucks: sound.plucks.length, damps: sound.damps.length }, id).toEqual({ plucks: 1, damps: 1 });
    }
  });
});

describe('Instruments that are not keyboards', () => {
  it('lay their notes out in one even row — no white and black keys — on a kanun, a ney, a kemence and every wind', () => {
    for (const id of ['kanun', 'ney', 'kemence', 'clarinet', 'flute', 'trumpet', 'tuba']) {
      const k = keyboardFor(id)!;
      expect(k.body, id).toBeDefined();
      const l = computeKeyboardLayout(1280, 800, 0, k);
      expect(l.keys.every((key) => !key.isBlack), id).toBe(true);
      const widths = new Set(l.keys.map((key) => Math.round(key.x1 - key.x0)));
      expect(widths.size, id).toBe(1);
      for (let i = 1; i < l.keys.length; i++) expect(l.keys[i]!.midi - l.keys[i - 1]!.midi, id).toBe(1);
    }
    expect(keyboardFor('piano')!.body).toBeUndefined();
    expect(keyboardFor('marimba')!.body).toBeUndefined();
  });
});
