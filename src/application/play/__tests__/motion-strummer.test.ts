import { describe, expect, it } from 'vitest';
import { MotionStrummer } from '@application/play/motion-strummer';
import type { Player } from '@application/play/player';
import { PlayMode } from '@domain/instruments/play-mode';

/** A picture whose lower half changes `level` per cell in frames where `isMoving`. */
const grid = (level: number) => {
  const cells = new Uint8Array(20 * 10);
  for (let i = 100; i < 200; i++) cells[i] = level;
  return { width: 20, height: 10, cells };
};
const zone = { x0: 0, y0: 0, x1: 1, y1: 1 };
const strum = (player: Partial<Player>) => {
  const played: number[] = [];
  const p = { strumHand: null, mode: PlayMode.chord, isPerforming: false, motionStrum: (dir: number) => played.push(dir), ...player } as unknown as Player;
  const m = new MotionStrummer();
  for (let i = 0; i < 60; i++) m.update(p, grid(i % 6 === 2 ? 30 : i % 6 === 1 || i % 6 === 3 ? 12 : 1), zone, i / 30, i / 30);
  return played.length;
};

describe('MotionStrummer', () => {
  it('strums from motion while the strumming hand is lost to blur', () => {
    expect(strum({})).toBeGreaterThanOrEqual(9);
  });

  it('leaves it to the tracked hand, to Notes mode and to self-play', () => {
    expect(strum({ strumHand: [] })).toBe(0);
    expect(strum({ mode: PlayMode.note })).toBe(0);
    expect(strum({ isPerforming: true })).toBe(0);
  });
});
