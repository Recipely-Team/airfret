import { describe, expect, it } from 'vitest';
import type { Player } from '@application/play/player';
import { TourSession } from '@application/tour/tour-session';
import { StrumDirection } from '@domain/gesture/strum-direction';

const strum = (over: Partial<{ amp: number; chord: string; dir: StrumDirection }> = {}) => ({ when: 0, isMuted: false, dir: StrumDirection.down, amp: 0.6, ...over });
const player = (p: Partial<Player>) => ({ fretHand: null, strumHand: null, chord: undefined, isMuted: false, ...p }) as unknown as Player;

describe('TourSession', () => {
  it('walks through every step from the actions the player makes', () => {
    const tour = new TourSession(true);
    tour.update(player({ fretHand: [], strumHand: [] }), 0);
    tour.update(player({ fretHand: [], strumHand: [] }), 1.1);
    expect(tour.step.id).toBe('point');
    tour.update(player({ chord: 'Em' }), 2);
    tour.update(player({ chord: 'Em' }), 2.5);
    expect(tour.step.id).toBe('strum');
    tour.onEvent(strum({ dir: StrumDirection.up }));
    expect(tour.step.id).toBe('strum');
    tour.onEvent(strum());
    tour.onEvent(strum({ amp: 0.3 }));
    tour.onEvent(strum({ amp: 0.9 }));
    expect(tour.step.id).toBe('change');
    tour.onEvent(strum({ chord: 'Am' }));
    tour.update(player({ isMuted: true }), 5);
    tour.update(player({ isMuted: true }), 5.4);
    expect(tour.isDone).toBe(true);
  });

  it('starts at pointing when there is no camera', () => {
    expect(new TourSession(false).step.id).toBe('point');
  });
});
