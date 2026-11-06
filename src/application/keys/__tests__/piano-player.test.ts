import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { PianoPlayer } from '@application/keys/piano-player';
import type { Point } from '@domain/fretboard/point';
import { computeKeyboardLayout } from '@domain/keys/compute-keyboard-layout';
import { PIANO_LOWEST_MIDI } from '@domain/keys/piano';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const layout = computeKeyboardLayout(1440, 900);
const centre = (midi: number) => {
  const k = layout.keys.find((x) => x.midi === midi && !x.isBlack)!;
  return { x: (k.x0 + k.x1) / 2, y: layout.bottom - 10 };
};

function setup() {
  const sound = new FakeSoundOutput();
  const piano = new PianoPlayer(sound);
  piano.configure(layout);
  return { sound, piano };
}

/** A hand whose fingertips are all far above the keys, except `down` tips placed at their points. */
function hand(wristX: number, tipsAt: Partial<Record<number, Point>> = {}): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: wristX, y: layout.top - 200 }));
  pts[HandLandmark.wrist] = { x: wristX, y: layout.top - 260 };
  for (const [tip, p] of Object.entries(tipsAt)) pts[Number(tip)] = p as Point;
  return pts;
}

describe('Playing the piano', () => {
  it('plays a key when a fingertip comes down on it, each key on its own string', () => {
    const { sound, piano } = setup();
    const e = centre(64);
    piano.updateHands([hand(e.x)], 0, 0);
    for (let i = 1; i <= 6; i++) piano.updateHands([hand(e.x, { [HandLandmark.indexTip]: { x: e.x, y: layout.top - 200 + (e.y - layout.top + 200) * (i / 6) } })], i / 30, i / 30);
    expect(sound.plucks.map((p) => [p.midi, p.string])).toEqual([[64, 64 - PIANO_LOWEST_MIDI]]);
    expect(piano.pressed).toEqual([64]);
  });

  it('plays a chord: several fingers of both hands at once', () => {
    const { sound, piano } = setup();
    const [c, e, g, c2] = [centre(48), centre(52), centre(55), centre(72)];
    const up = (p: Point) => ({ x: p.x, y: layout.top - 200 });
    const frame = (k: number, t: number) => {
      const at = (p: Point) => ({ x: p.x, y: up(p).y + (p.y - up(p).y) * k });
      piano.updateHands([hand(c2.x, { [HandLandmark.indexTip]: at(c2) }), hand(c.x, { [HandLandmark.thumbTip]: at(c), [HandLandmark.middleTip]: at(e), [HandLandmark.pinkyTip]: at(g) })], t, t);
    };
    for (let i = 0; i <= 6; i++) frame(i / 6, i / 30);
    expect(sound.plucks.map((p) => p.midi).sort((a, b) => a - b)).toEqual([48, 52, 55, 72]);
  });

  it('stops a key when the finger lifts — unless the sustain pedal is down, then when the pedal comes up', () => {
    const { sound, piano } = setup();
    piano.pointer(1, centre(60), 0);
    piano.pointer(1, null, 0.5);
    expect(sound.damps).toEqual([60 - PIANO_LOWEST_MIDI]);
    sound.damps.length = 0;
    piano.setSustain(true, 1);
    piano.pointer(1, centre(62), 1);
    piano.pointer(1, null, 1.5);
    expect(sound.damps).toEqual([]);
    piano.setSustain(false, 2);
    expect(sound.damps).toEqual([62 - PIANO_LOWEST_MIDI]);
  });

  it('keeps a key sounding while anything still holds it: a mouse and a touch on the same key', () => {
    const { sound, piano } = setup();
    piano.pointer(1, centre(67), 0);
    piano.pointer(2, centre(67), 0.1);
    piano.pointer(1, null, 0.2);
    expect(sound.damps).toEqual([]);
    piano.pointer(2, null, 0.3);
    expect(sound.damps).toEqual([67 - PIANO_LOWEST_MIDI]);
  });

  it('slides from key to key with a held pointer, like a glissando', () => {
    const { sound, piano } = setup();
    for (const [i, midi] of [60, 62, 64, 65].entries()) piano.pointer(1, centre(midi), i / 10);
    expect(sound.plucks.map((p) => p.midi)).toEqual([60, 62, 64, 65]);
    expect(piano.pressed).toEqual([65]);
  });

  it('lights each struck key, fading over time', () => {
    const { piano } = setup();
    piano.pointer(1, centre(60), 0);
    const first = piano.glow.get(60) ?? 0;
    piano.fade(0.2);
    expect(piano.glow.get(60)).toBeLessThan(first);
    piano.fade(5);
    expect(piano.glow.has(60)).toBe(false);
  });

  it('plays every key a fast slide passes, though the pointer jumps several keys between two events', () => {
    const { sound, piano } = setup();
    piano.pointer(1, centre(60), 0);
    piano.pointer(1, centre(72), 0.05);
    expect(sound.plucks.map((p) => p.midi)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(piano.pressed).toEqual([72]);
  });
});
