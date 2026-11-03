import { FINGERTIPS } from '@domain/tracking/hand-landmark';
import { dot } from '@presentation/canvas/draw-utils';
import { rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const TIP_RADIUS = 2.5;
const FRET_RING = 11;
const PICK_RADIUS = 7;
const TRAIL_SECONDS = 0.25;

/** Fingertip dots, a ring on the fretting finger, and the pick with its fading trail. */
export function paintHands({ ctx, player, now }: PaintContext): void {
  for (const hand of [player.fretHand, player.strumHand]) {
    for (const idx of FINGERTIPS) {
      const p = hand?.[idx];
      if (p) dot(ctx, p.x, p.y, TIP_RADIUS, rgba(Palette.ink, 0.35));
    }
  }
  if (player.fretPoint) {
    ctx.strokeStyle = rgba(Palette.accent, player.isMuted ? 0.4 : 0.95);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.fretPoint.x, player.fretPoint.y, FRET_RING, 0, Math.PI * 2);
    ctx.stroke();
  }
  player.trail.forEach((cur, i) => {
    const prev = player.trail[i - 1];
    if (!prev) return;
    const a = Math.max(0, 1 - (now - cur.t) / TRAIL_SECONDS);
    ctx.strokeStyle = rgba(Palette.ink, 0.5 * a);
    ctx.lineWidth = 3 * a + 0.5;
    ctx.beginPath();
    ctx.moveTo(prev.p.x, prev.p.y);
    ctx.lineTo(cur.p.x, cur.p.y);
    ctx.stroke();
  });
  if (player.strumPoint) dot(ctx, player.strumPoint.x, player.strumPoint.y, PICK_RADIUS, rgba(Palette.ink, 0.95));
}
