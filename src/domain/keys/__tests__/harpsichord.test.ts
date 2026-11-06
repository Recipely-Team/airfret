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
      // A hand over the key; its index finger dips below its knuckle (fast or slow), then rests again.
      const handAt = (dip: number) => {
        const pts = Array.from({ length: 21 }, () => ({ x, y: l.top }));
        pts[0] = { x, y: l.top - 200 };
        pts[9] = { x, y: l.top - 80 };
        pts[5] = { x, y: l.top };
        pts[8] = { x, y: l.top + 60 + dip * 120 };
        return pts;
      };
      const strike = (speed: number, t0: number) => {
        const steps = Math.max(1, Math.round(0.35 / speed / (1 / 30)));
        p.updateHands([handAt(0)], t0, 0);
        p.updateHands([handAt(0)], t0 + 1 / 30, 0);
        for (let i = 1; i <= steps; i++) p.updateHands([handAt((0.35 * i) / steps)], t0 + (i + 1) / 30, 0);
        for (let i = 0; i < 4; i++) p.updateHands([handAt(0)], t0 + (steps + 2 + i) / 30, 0);
      };
      strike(10, 0);
      strike(1.2, 5);
      return sound.plucks.map((pl) => pl.amp);
    };
    const [hard, soft] = play('harpsichord');
    expect(hard).toBe(soft);
    const [pHard, pSoft] = play('piano');
    expect(pHard).toBeGreaterThan(pSoft ?? 1);
    expect(harpsichord.isReversedColours).toBe(true);
  });
});
