import { seededRandom } from '@core/math/seeded-random';

/**
 * Fills the current clip with wood: a base colour and many thin, gently waving grain lines
 * running along x (the direction of the strings).
 */
export function paintWood(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, base: string, grain: string, density: number, seed: number): void {
  const rand = seededRandom(seed);
  ctx.fillStyle = base;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = grain;
  const lines = Math.round(box.h * density);
  for (let k = 0; k < lines; k++) {
    const y0 = box.y + rand() * box.h;
    const amp = 0.5 + rand() * 2.5;
    const freq = 0.002 + rand() * 0.006;
    const phase = rand() * Math.PI * 2;
    ctx.globalAlpha = 0.04 + rand() * 0.14;
    ctx.lineWidth = 0.4 + rand() * 1.4;
    ctx.beginPath();
    for (let x = box.x; x <= box.x + box.w; x += 12) {
      const y = y0 + Math.sin(x * freq + phase) * amp;
      if (x === box.x) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
