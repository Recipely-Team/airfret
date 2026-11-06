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

/** A fingertip coming straight down at `x` from above the keys to `toY`, at `speed` screen heights per second. */
function stroke(d: KeyPressDetector, x: number, toY: number, speed = 1.5, t0 = 0) {
  const steps = 8;
  const fromY = desk.top - 60;
  const dt = (toY - fromY) / desk.h / speed / steps;
  const out = [];
  for (let i = 0; i <= steps; i++) out.push(d.update({ x, y: fromY + ((toY - fromY) * i) / steps }, t0 + i * dt, desk));
  return out.filter((r) => r.press || r.release);
}

describe('Pressing keys with a fingertip', () => {
  it('presses the white key a fingertip comes down on, past the black keys', () => {
    const e = white(desk, 52)!;
    const events = stroke(new KeyPressDetector(), (e.x0 + e.x1) / 2, desk.bottom - 5);
    expect(events.map((r) => r.press?.midi)).toEqual([52]);
  });

  it('presses a black key from its middle, and does not press the white under it as well', () => {
    const cs = black(desk, 49)!;
    const events = stroke(new KeyPressDetector(), (cs.x0 + cs.x1) / 2, desk.bottom - 5);
    expect(events.map((r) => r.press?.midi)).toEqual([49]);
  });

  it('plays a fast stroke louder than a gentle one', () => {
    const g = white(desk, 55)!;
    const x = (g.x0 + g.x1) / 2;
    const hard = stroke(new KeyPressDetector(), x, desk.bottom - 5, 3)[0]?.press?.velocity ?? 0;
    const soft = stroke(new KeyPressDetector(), x, desk.bottom - 5, 0.3)[0]?.press?.velocity ?? 0;
    expect(hard).toBeGreaterThan(soft);
    expect(soft).toBeGreaterThan(0);
  });

  it('holds the key while the finger rests on it, and lets it go when the finger lifts', () => {
    const d = new KeyPressDetector();
    const a = white(desk, 57)!;
    const x = (a.x0 + a.x1) / 2;
    stroke(d, x, desk.bottom - 5);
    for (let i = 0; i < 10; i++) expect(d.update({ x: x + (i % 2), y: desk.bottom - 5 + (i % 3) }, 1 + i / 30, desk)).toEqual({ press: null, release: null });
    expect(d.holding).toBe(57);
    expect(d.update({ x, y: desk.top - 80 }, 2, desk).release).toBe(57);
    expect(d.holding).toBeNull();
  });

  it('does not play a finger drifting slowly down (camera jitter, a hand settling)', () => {
    const f = white(desk, 53)!;
    expect(stroke(new KeyPressDetector(), (f.x0 + f.x1) / 2, desk.bottom - 5, 0.05)).toEqual([]);
  });

  it('lets the key go when tracking loses the finger for a moment', () => {
    const d = new KeyPressDetector();
    const c = white(desk, 60)!;
    stroke(d, (c.x0 + c.x1) / 2, desk.bottom - 5);
    expect(d.update(null, 2, desk).release).toBe(60);
  });
});
