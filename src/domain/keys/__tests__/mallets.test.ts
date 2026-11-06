import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { PianoPlayer } from '@application/keys/piano-player';
import { computeKeyboardLayout, shiftLimits } from '@domain/keys/compute-keyboard-layout';
import { isKeyboard, keyboardFor } from '@domain/keys/keyboard-instruments';

const RANGES = { marimba: [45, 96], xylophone: [65, 108], glockenspiel: [79, 108] } as const;

describe('The mallet instruments', () => {
  it('reach every bar of their range on any screen, and no further', () => {
    for (const [id, [lo, hi]] of Object.entries(RANGES)) {
      expect(isKeyboard(id), id).toBe(true);
      const k = keyboardFor(id)!;
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

  it('let a struck bar ring on after the key is let go — a piano damps it', () => {
    const damps = (id: string) => {
      const sound = new FakeSoundOutput();
      const p = new PianoPlayer(sound);
      p.fit(1440, 900, id, 0);
      const key = p.layout!.keys.find((k) => !k.isBlack)!;
      p.pointer(1, { x: (key.x0 + key.x1) / 2, y: p.layout!.top + 10 }, 0);
      p.pointer(1, null, 0.5);
      p.setSustain(true, 0.6);
      p.setSustain(false, 0.7);
      return { plucks: sound.plucks.length, damps: sound.damps.length };
    };
    for (const id of Object.keys(RANGES)) expect(damps(id), id).toEqual({ plucks: 1, damps: 0 });
    expect(damps('piano').damps).toBeGreaterThan(0);
  });
});
