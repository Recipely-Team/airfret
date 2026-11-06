import { describe, expect, it } from 'vitest';
import { computeKeyboardLayout, keyAt } from '@domain/keys/compute-keyboard-layout';
import { KeyPressDetector } from '@domain/keys/key-press-detector';
import type { KeyboardLayout } from '@domain/keys/keyboard-layout';
import { PIANO, PIANO_LOWEST_MIDI } from '@domain/keys/piano';

const desk = computeKeyboardLayout(1440, 900);
const white = (l: KeyboardLayout, midi: number) => l.keys.find((k) => k.midi === midi && !k.isBlack);
const black = (l: KeyboardLayout, midi: number) => l.keys.find((k) => k.midi === midi && k.isBlack);

describe('The keyboard on screen', () => {
  it('fits three octaves on a wide screen, two on a tablet, more than one on an upright phone — always from a C', () => {
    expect([desk.firstMidi, desk.lastMidi]).toEqual([48, 84]);
    const tablet = computeKeyboardLayout(800, 1000);
    expect([tablet.firstMidi, tablet.lastMidi]).toEqual([48, 72]);
    const phone = computeKeyboardLayout(390, 844);
    expect([phone.firstMidi, phone.lastMidi]).toEqual([60, 76]);
  });

  it('lays the keys out like a piano: 7 whites and 5 blacks an octave, no black between E–F and B–C', () => {
    const octave = desk.keys.filter((k) => k.midi >= 48 && k.midi < 60);
    expect(octave.filter((k) => !k.isBlack).map((k) => k.midi)).toEqual([48, 50, 52, 53, 55, 57, 59]);
    expect(octave.filter((k) => k.isBlack).map((k) => k.midi)).toEqual([49, 51, 54, 56, 58]);
  });

  it('puts a black key over the boundary of its two whites, shorter than them', () => {
    const cs = black(desk, 49);
    const c = white(desk, 48);
    expect(cs && c && cs.x0 < c.x1 && cs.x1 > c.x1).toBe(true);
    expect(cs && c && cs.y1 < c.y1).toBe(true);
  });

  it('finds the black key where it lies over a white, and the white below the black keys', () => {
    const cs = black(desk, 49);
    if (!cs) throw new Error('C#');
    expect(keyAt(desk, { x: (cs.x0 + cs.x1) / 2, y: desk.top + 10 })?.midi).toBe(49);
    expect(keyAt(desk, { x: cs.x0 + 2, y: desk.bottom - 10 })?.midi).toBe(48);
    expect(keyAt(desk, { x: 5, y: 5 })).toBeNull();
  });

  it('gives the engine one string per key, A0 to C8', () => {
    expect(PIANO.tuning).toHaveLength(88);
    expect(PIANO.tuning[0]).toBe(PIANO_LOWEST_MIDI);
    expect(PIANO.tuning[87]).toBe(108);
  });
});

/** The hand's size in px (wrist to middle knuckle), and how far a fingertip rests below its knuckle. */
const HAND = 120;
const REST = 0.5 * HAND;

/**
 * One finger over `x`: its knuckle at `knuckleY`, its tip `dip` below the knuckle (in hand sizes beyond its rest),
 * fed for `frames` frames at 30 fps from `t0`.
 */
function finger(d: KeyPressDetector, x: number, knuckleY: number, dips: readonly number[], t0 = 0) {
  return dips.map((dip, i) => d.update({ x, y: knuckleY + REST + dip * HAND }, { x, y: knuckleY }, HAND, t0 + i / 30, desk));
}
const events = (rs: { presses: { midi: number }[]; releases: number[] }[]) => rs.flatMap((r) => [...r.presses.map((p) => `+${p.midi}`), ...r.releases.map((m) => `-${m}`)]);
const over = (midi: number) => {
  const k = desk.keys.find((x) => x.midi === midi)!;
  return { x: (k.x0 + k.x1) / 2, knuckleY: k.y0 + (k.isBlack ? 0.25 : 0.6) * (k.y1 - k.y0) - REST };
};

describe('Pressing keys with a finger', () => {
  it('plays nothing when a hand moves into view and across the keys (it used to play as soon as it saw a hand)', () => {
    const d = new KeyPressDetector();
    const out = [];
    // The whole hand comes down from above the screen onto the keys and slides along them: tip and knuckle together.
    for (let i = 0; i < 40; i++) {
      const knuckleY = -200 + i * 25;
      const x = 300 + i * 15;
      out.push(d.update({ x, y: knuckleY + REST }, { x, y: knuckleY }, HAND, i / 30, desk));
    }
    expect(events(out)).toEqual([]);
  });

  it('holds no key down while a hand rests over the keys (keys used to stay lit)', () => {
    const d = new KeyPressDetector();
    const { x, knuckleY } = over(60);
    // Two seconds of a resting hand, its fingertip trembling a little.
    const out = finger(d, x, knuckleY, Array.from({ length: 60 }, (_, i) => (i % 3) * 0.01));
    expect(events(out)).toEqual([]);
    expect(d.holding).toBeNull();
  });

  it('plays the key under a finger that dips below its knuckle, and lets it go when the finger comes up', () => {
    const d = new KeyPressDetector();
    const { x, knuckleY } = over(64);
    const out = finger(d, x, knuckleY, [0, 0, 0, 0.12, 0.3, 0.32, 0.32, 0.15, 0.02, 0]);
    expect(events(out)).toEqual(['+64', '-64']);
  });

  it('presses a black key the same way', () => {
    const d = new KeyPressDetector();
    const { x, knuckleY } = over(61);
    expect(events(finger(d, x, knuckleY, [0, 0, 0.15, 0.32, 0.32]))).toEqual(['+61']);
  });

  it('plays a quick press louder than a slow one', () => {
    const { x, knuckleY } = over(67);
    const quick = finger(new KeyPressDetector(), x, knuckleY, [0, 0, 0.35]).flatMap((r) => r.presses)[0]?.velocity ?? 0;
    const slow = finger(new KeyPressDetector(), x, knuckleY, [0, 0, 0.05, 0.1, 0.15, 0.2, 0.25]).flatMap((r) => r.presses)[0]?.velocity ?? 0;
    expect(quick).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(0);
  });

  it('slides a pressed finger along the white keys as a glissando, every key once', () => {
    const d = new KeyPressDetector();
    const c = over(60);
    finger(d, c.x, c.knuckleY, [0, 0, 0.35]);
    const g = over(67);
    const r = d.update({ x: g.x, y: c.knuckleY + REST + 0.35 * HAND }, { x: g.x, y: c.knuckleY }, HAND, 0.2, desk);
    expect(r.presses.map((p) => p.midi)).toEqual([62, 64, 65, 67]);
    expect(r.releases).toEqual([60, 62, 64, 65]);
  });

  it('lets the key go when tracking loses the finger for a moment', () => {
    const d = new KeyPressDetector();
    const { x, knuckleY } = over(62);
    finger(d, x, knuckleY, [0, 0, 0.35]);
    expect(d.update(null, null, HAND, 0.1, desk).releases).toEqual([]);
    expect(d.update(null, null, HAND, 0.5, desk).releases).toEqual([62]);
  });
});

describe('Sliding the keyboard to reach all 88 keys', () => {
  it('moves by octaves, from A0 at the far left to C8 at the far right, never past them', async () => {
    const { shiftLimits } = await import('@domain/keys/compute-keyboard-layout');
    const { down, up } = shiftLimits(1440);
    expect(computeKeyboardLayout(1440, 900, 1).firstMidi).toBe(60);
    expect(computeKeyboardLayout(1440, 900, down).firstMidi).toBe(21);
    expect(computeKeyboardLayout(1440, 900, up).lastMidi).toBe(108);
    expect(computeKeyboardLayout(1440, 900, up + 3).lastMidi).toBe(108);
    expect(computeKeyboardLayout(1440, 900, down - 3).firstMidi).toBe(21);
  });

  it('reaches every key of the piano on any screen', async () => {
    const { shiftLimits } = await import('@domain/keys/compute-keyboard-layout');
    for (const w of [1440, 800, 390]) {
      const { down, up } = shiftLimits(w);
      const reached = new Set<number>();
      for (let s = down; s <= up; s++) for (const k of computeKeyboardLayout(w, 900, s).keys) reached.add(k.midi);
      expect(reached.size, `width ${w}`).toBe(88);
    }
  });
});
