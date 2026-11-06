import { GUITAR_TUNING } from '@domain/music/tunings';
import { describe, expect, it } from 'vitest';
import { chordFretting, holdNotes, noteFretting } from '@application/demo/demo-fretting';
import { ghostFretHand } from '@application/demo/ghost-hands';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { stringY } from '@domain/fretboard/neck-geometry';
import { HandLandmark } from '@domain/tracking/hand-landmark';

describe('the self-playing hand', () => {
  it('holds a chord in its standard shape and fingers', () => {
    const g = chordFretting('G', GUITAR_TUNING, 0);
    expect(g.frets).toEqual([3, 2, 0, 0, 0, 3]);
    expect(g.presses.map((p) => p.finger)).toEqual([2, 1, 3]);
  });

  it('holds an F barre with the index across every string on fret 1', () => {
    const f = chordFretting('F', GUITAR_TUNING, 0);
    expect(f.presses.filter((p) => p.finger === 1 && p.fret === 1).map((p) => p.string)).toEqual([0, 4, 5]);
  });

  it('moves a chord up with the capo', () => {
    expect(chordFretting('D', GUITAR_TUNING.map((m) => m + 2), 2).frets).toEqual([2, 2, 2, 4, 5, 4]);
  });

  it('lets notes ring while the hand stays in position, and lets them go when it moves', () => {
    const held = holdNotes(holdNotes([], [{ string: 0, fret: 3 }]), [{ string: 3, fret: 2 }]);
    expect(held).toEqual([{ string: 0, fret: 3 }, { string: 3, fret: 2 }]);
    expect(holdNotes(held, [{ string: 4, fret: 10 }])).toEqual([{ string: 4, fret: 10 }]);
  });

  it('frets single notes one finger per fret from the lowest', () => {
    const f = noteFretting([{ string: 1, fret: 5 }, { string: 2, fret: 7 }, { string: 3, fret: 0 }], 6, 0);
    expect(f.presses).toEqual([{ string: 1, fret: 5, finger: 1 }, { string: 2, fret: 7, finger: 3 }]);
    expect(f.frets).toEqual([0, 5, 7, 0, 0, 0]);
  });

  it('puts each pressing fingertip on its string', () => {
    const l = computeLayout(1440, 900, 6, false, 20);
    const hand = ghostFretHand(l, chordFretting('C', GUITAR_TUNING, 0), 0);
    const ring = hand[HandLandmark.ringTip];
    expect(ring && Math.abs(ring.y - stringY(l, 1, ring.x))).toBeLessThan(1);
  });

  it('holds chords on the strings that sound them: the upper six of a 7-string, the outline on a 6-string bass', async () => {
    const { GUITAR7_TUNING, BASS6_TUNING } = await import('@domain/music/tunings');
    expect(chordFretting('C', GUITAR7_TUNING, 0).frets).toEqual([0, 0, 3, 2, 0, 1, 0]);
    expect(chordFretting('Am', BASS6_TUNING, 0).frets).toEqual([0, 5, 7, 7, 5, 9]);
  });
});
