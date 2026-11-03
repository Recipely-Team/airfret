import { rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const BODY_HEIGHT_OF_SPREAD = 1.75;
const BODY_OVERHANG_OF_WIDTH = 0.02;
const BRIDGE = { width: 4, overhang: 10 } as const;

/** Guitar body outline behind the strum area, plus the bridge. */
export function paintBody({ ctx, player }: PaintContext): void {
  const l = player.layout;
  const x0 = Math.min(l.strumX0, l.strumX1);
  const x1 = Math.max(l.strumX0, l.strumX1);
  ctx.beginPath();
  ctx.ellipse((x0 + x1) / 2, l.centerY, (x1 - x0) / 2 + l.w * BODY_OVERHANG_OF_WIDTH, l.spreadBody * BODY_HEIGHT_OF_SPREAD, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgba(Palette.shade, 0.42);
  ctx.fill();
  ctx.strokeStyle = rgba(Palette.ink, 0.1);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = rgba(Palette.ink, 0.22);
  ctx.fillRect(l.strumX1 - BRIDGE.width / 2, l.centerY - l.spreadBody - BRIDGE.overhang, BRIDGE.width, l.spreadBody * 2 + BRIDGE.overhang * 2);
}
