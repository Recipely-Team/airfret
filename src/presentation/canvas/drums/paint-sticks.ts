import type { Stick } from '@domain/drums/stick';

const WOOD = { light: '#e9cf9c', dark: '#b98d52' } as const;
const WIDTH = { butt: 10, tip: 5 } as const;

/** Hickory sticks from grip to tip, tapering, with a bead at the tip. Drawn under the real hands. */
export function paintSticks(ctx: CanvasRenderingContext2D, sticks: readonly { stick: Stick; alpha: number }[]): void {
  for (const { stick: s, alpha } of sticks) {
    ctx.globalAlpha = alpha;
    const dx = s.tip.x - s.grip.x;
    const dy = s.tip.y - s.grip.y;
    const len = Math.hypot(dx, dy) || 1;
    // Butt end sticks out a little behind the grip.
    const butt = { x: s.grip.x - (dx / len) * len * 0.18, y: s.grip.y - (dy / len) * len * 0.18 };
    const nx = -dy / len;
    const ny = dx / len;
    const wood = ctx.createLinearGradient(butt.x + nx * WIDTH.butt, butt.y + ny * WIDTH.butt, butt.x - nx * WIDTH.butt, butt.y - ny * WIDTH.butt);
    wood.addColorStop(0, WOOD.dark);
    wood.addColorStop(0.45, WOOD.light);
    wood.addColorStop(1, WOOD.dark);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.moveTo(butt.x + nx * WIDTH.butt / 2, butt.y + ny * WIDTH.butt / 2);
    ctx.lineTo(s.tip.x + nx * WIDTH.tip / 2, s.tip.y + ny * WIDTH.tip / 2);
    ctx.lineTo(s.tip.x - nx * WIDTH.tip / 2, s.tip.y - ny * WIDTH.tip / 2);
    ctx.lineTo(butt.x - nx * WIDTH.butt / 2, butt.y - ny * WIDTH.butt / 2);
    ctx.closePath();
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(s.tip.x, s.tip.y, WIDTH.tip, WIDTH.tip * 0.75, Math.atan2(dy, dx), 0, Math.PI * 2);
    ctx.fillStyle = WOOD.light;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
