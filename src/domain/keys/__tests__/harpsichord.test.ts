import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { PianoPlayer } from '@application/keys/piano-player';
import { computeKeyboardLayout, shiftLimits } from '@domain/keys/compute-keyboard-layout';
import { isKeyboard, keyboardFor } from '@domain/keys/keyboard-instruments';

const harpsichord = keyboardFor('harpsichord')!;

describe('The harpsichord', () => {
  it('is a keyboard instrument with its own keys, F1 to F6, every one reachable on any screen', () => {
    expect(isKeyboard('harpsichord')).toBe(true);
    expect(isKeyboard('acoustic')).toBe(false);
    for (const w of [1440, 800, 390]) {
      const { down, up } = shiftLimits(w, harpsichord);
      const reached = new Set<number>();
      for (let s = down; s <= up; s++) {
        const l = computeKeyboardLayout(w, 900, s, harpsichord);
        expect(l.firstMidi, `width ${w}, shift ${s}`).toBeGreaterThanOrEqual(29);
        expect(l.lastMidi, `width ${w}, shift ${s}`).toBeLessThanOrEqual(89);
        for (const k of l.keys) reached.add(k.midi);
      }
      expect(reached.size, `width ${w}`).toBe(89 - 29 + 1);
    }
  });

  it('plucks every key at the same level, however hard it is struck — a piano plays louder', () => {
    const play = (id: string) => {
      const sound = new FakeSoundOutput();
      const p = new PianoPlayer(sound);
      p.fit(1440, 900, id, 0);
      const l = p.layout!;
      const key = l.keys.find((k) => k.midi === 60)!;
      const x = (key.x0 + key.x1) / 2;
      const strike = (speed: number, t0: number) => {
        for (let i = 0; i <= 8; i++) p.updateHands([[...Array.from({ length: 21 }, () => ({ x, y: l.top - 300 })).map((pt, j) => (j === 8 ? { x, y: l.top - 60 + ((l.bottom - 5 - (l.top - 60)) * i) / 8 } : pt))]], t0 + (i * ((l.bottom - l.top) / l.h)) / speed / 8, 0);
        p.updateHands([Array.from({ length: 21 }, () => ({ x, y: l.top - 300 }))], t0 + 1, 0);
      };
      strike(3, 0);
      strike(0.3, 5);
      return sound.plucks.map((pl) => pl.amp);
    };
    const [hard, soft] = play('harpsichord');
    expect(hard).toBe(soft);
    const [pHard, pSoft] = play('piano');
    expect(pHard).toBeGreaterThan(pSoft ?? 1);
    expect(harpsichord.isReversedColours).toBe(true);
  });
});
