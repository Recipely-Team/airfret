import { describe, expect, it } from 'vitest';
import type { PluckRequest } from '@domain/audio/pluck-request';
import { Voice } from '@domain/audio/voice';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { coursePair, courseStrings, pairInterval, partnerOf } from '@infrastructure/audio/strings/course-pair';

const pluck = (string: number, midi: number): PluckRequest => ({ string, midi, amp: 0.8, when: 1, isMuted: false, position: 0.15, voice: Voice.player, attack: StrikeSurface.nail, isPalmMuted: false });
const twelve = instrumentById('twelve');

describe('A 12-string sounds both strings of every course', () => {
  it('pairs the four low strings an octave up and the top two in unison, struck a moment later and softer', () => {
    expect(coursePair(twelve, pluck(0, 40))?.midi).toBe(52);
    expect(coursePair(twelve, pluck(3, 55))?.midi).toBe(67);
    expect(coursePair(twelve, pluck(5, 64))?.midi).toBe(64);
    const pair = coursePair(twelve, pluck(1, 45));
    expect(pair?.when).toBeGreaterThan(1);
    expect(pair?.amp).toBeLessThan(0.8);
  });

  it('gives the pair its own string number, so both ring at once, and puts it where its partner is', () => {
    const pair = coursePair(twelve, pluck(2, 50));
    expect(pair?.string).not.toBe(2);
    expect(partnerOf(pair?.string ?? -1)).toBe(2);
    expect(courseStrings(twelve, 2)).toEqual([2, pair?.string]);
  });

  it('leaves single-course instruments alone, and "every string" (-1) as it is', () => {
    expect(coursePair(instrumentById('acoustic'), pluck(0, 40))).toBeNull();
    expect(courseStrings(instrumentById('acoustic'), 3)).toEqual([3]);
    expect(courseStrings(twelve, -1)).toEqual([-1]);
    expect(pairInterval(twelve, 4)).toBe(0);
    expect(pairInterval(instrumentById('bass'), 0)).toBeNull();
  });
});
