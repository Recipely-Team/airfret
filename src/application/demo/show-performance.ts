import type { DemoFrame } from '@application/demo/demo-frame';
import type { Player } from '@application/play/player';

/** The pick's fading trail, seconds — as long as a tracked fingertip's. */
const TRAIL_SECONDS = 0.25;

/**
 * Puts a self-playing frame on the player the stage draws: the hand's fretting and fingers, the pick and
 * its trail, each sounding string set vibrating. `null` hands the stage back to the tracked hands.
 */
export function showPerformance(player: Player, frame: DemoFrame | null, now: number): void {
  const wasPerforming = player.isPerforming;
  player.isPerforming = frame !== null;
  if (!frame) {
    if (!wasPerforming) return;
    player.fretting = null;
    player.fretHand = null;
    player.strumHand = null;
    player.strumPoint = null;
    player.lastChordName = '';
    player.trail.length = 0;
    return;
  }
  player.fretting = frame.fretting;
  player.fretHand = frame.fretHand;
  player.strumHand = frame.strumHand;
  player.strumPoint = frame.pick;
  player.lastChordName = frame.chord;
  player.trail.push({ p: frame.pick, t: now });
  while (player.trail.length && now - (player.trail[0]?.t ?? now) > TRAIL_SECONDS) player.trail.shift();
  for (const h of frame.hits) player.energy[h.string] = Math.max(player.energy[h.string] ?? 0, h.amp);
}
