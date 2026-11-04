import type { Point } from '@domain/fretboard/point';
import { FINGERTIPS, HandLandmark } from '@domain/tracking/hand-landmark';
import { rgba, Palette } from '@presentation/canvas/palette';

/** The 21 landmarks joined as MediaPipe's hand model joins them: palm, then each finger from its base. */
const BONES: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];
const PALM = [0, 1, 5, 9, 13, 17];
/** Sizes as fractions of the wrist → middle-knuckle distance, so the drawing scales with the hand. */
const Size = { bone: 0.045, halo: 0.11, joint: 0.05, tip: 0.085, minPx: 1 } as const;
const Alpha = { palm: 0.07, halo: 0.55, bone: 0.7, joint: 0.85, tip: 0.95 } as const;

/**
 * The hands as the tracker sees them — 21 points and the bones between them — for the hands-only view,
 * where the camera picture is hidden.
 *
 * @remarks
 * - A dark halo under every bone keeps the skeleton readable over light wood and bright strings.
 * - Fingertips, the parts that play, are the only accent-coloured marks; the rest stays neutral ink.
 */
export function paintHandSkeleton(ctx: CanvasRenderingContext2D, hands: readonly (readonly Point[])[]): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const hand of hands) {
    const wrist = hand[HandLandmark.wrist];
    const knuckle = hand[HandLandmark.middleMcp];
    if (!wrist || !knuckle) continue;
    const size = Math.hypot(knuckle.x - wrist.x, knuckle.y - wrist.y);
    const px = (f: number) => Math.max(Size.minPx, size * f);
    palm(ctx, hand);
    bones(ctx, hand, px(Size.halo), rgba(Palette.shade, Alpha.halo));
    bones(ctx, hand, px(Size.bone), rgba(Palette.ink, Alpha.bone));
    hand.forEach((p, i) => {
      const isTip = FINGERTIPS.includes(i as HandLandmark);
      ctx.fillStyle = isTip ? rgba(Palette.accent, Alpha.tip) : rgba(Palette.ink, Alpha.joint);
      ctx.beginPath();
      ctx.arc(p.x, p.y, px(isTip ? Size.tip : Size.joint), 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function palm(ctx: CanvasRenderingContext2D, hand: readonly Point[]): void {
  ctx.fillStyle = rgba(Palette.ink, Alpha.palm);
  ctx.beginPath();
  PALM.forEach((i, k) => {
    const p = hand[i];
    if (!p) return;
    if (k === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
}

function bones(ctx: CanvasRenderingContext2D, hand: readonly Point[], width: number, colour: string): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (const [a, b] of BONES) {
    const p = hand[a];
    const q = hand[b];
    if (!p || !q) continue;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
  }
  ctx.stroke();
}
