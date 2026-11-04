import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { ACOUSTIC_BOUTS, CLASSICAL_BOUTS, SOLID_BOUTS, traceBody } from '@presentation/canvas/guitar/body-shape';
import type { BodyGeometry } from '@presentation/canvas/guitar/body-geometry';
import type { GuitarLook } from '@presentation/canvas/guitar/guitar-look';
import { paintBanjoPot } from '@presentation/canvas/guitar/paint-banjo-pot';
import { paintWood } from '@presentation/canvas/guitar/wood';

const SHADOW = { color: 'rgba(0,0,0,0.55)', blur: 50, offsetY: 22 } as const;

/** Body: shadow, wood top with edge burst, binding, then hole/pickups, pickguard and bridge. */
export function paintArtBody(ctx: CanvasRenderingContext2D, l: FretboardLayout, g: BodyGeometry, look: GuitarLook): void {
  if (look.style === 'banjo') {
    paintBanjoPot(ctx, l, g, look);
    return;
  }
  const bouts = look.style === 'acoustic' ? ACOUSTIC_BOUTS : look.style === 'classical' ? CLASSICAL_BOUTS : SOLID_BOUTS;
  const outline = () => traceBody(ctx, g.x0, g.cy, g.length, g.width, bouts.upper, bouts.lower);
  const box = { x: g.x0, y: g.cy - g.width / 2, w: g.length, h: g.width };

  ctx.save();
  outline();
  ctx.shadowColor = SHADOW.color;
  ctx.shadowBlur = SHADOW.blur;
  ctx.shadowOffsetY = SHADOW.offsetY;
  ctx.fillStyle = look.burst;
  ctx.fill();
  ctx.restore();

  ctx.save();
  outline();
  ctx.clip();
  paintWood(ctx, box, look.top, look.topGrain, look.style === 'electric' || look.style === 'bass' ? 0.05 : 0.45, 7);
  // Edge burst + soft light from the upper left.
  const burst = ctx.createRadialGradient(g.x0 + g.length * 0.55, g.cy, g.width * 0.15, g.x0 + g.length * 0.55, g.cy, g.length * 0.62);
  burst.addColorStop(0, 'rgba(0,0,0,0)');
  burst.addColorStop(0.7, 'rgba(0,0,0,0.12)');
  burst.addColorStop(1, look.burst);
  ctx.fillStyle = burst;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const light = ctx.createLinearGradient(box.x, box.y, box.x + box.w * 0.6, box.y + box.h);
  light.addColorStop(0, 'rgba(255,255,255,0.10)');
  light.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = light;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();

  outline();
  ctx.lineWidth = look.style === 'electric' || look.style === 'bass' ? 1 : 3;
  ctx.strokeStyle = look.style === 'electric' || look.style === 'bass' ? 'rgba(255,255,255,0.12)' : look.binding;
  ctx.stroke();

  if (look.style === 'acoustic' || look.style === 'classical') paintSoundhole(ctx, g, look);
  else paintPickups(ctx, l, g, look);
  paintBridge(ctx, l, g, look);
}

function paintSoundhole(ctx: CanvasRenderingContext2D, g: BodyGeometry, look: GuitarLook): void {
  if (look.style === 'acoustic') {
    // Teardrop pickguard on the treble side, below the strings.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(g.holeX + g.holeR * 0.9, g.cy + g.holeR * 1.25, g.holeR * 1.25, g.holeR * 0.85, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = look.pickguard;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }
  // Rosette rings, then the hole.
  const rings: [number, string, number][] = look.style === 'classical'
    ? [[1.42, '#5a3a22', 4], [1.32, '#d9c49a', 3], [1.24, '#2b1a10', 5], [1.14, '#c9a46c', 2]]
    : [[1.36, '#1b120c', 2], [1.28, look.binding, 2.5], [1.2, '#1b120c', 1.5], [1.12, look.binding, 1]];
  for (const [k, color, width] of rings) {
    ctx.beginPath();
    ctx.arc(g.holeX, g.cy, g.holeR * k, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  const hole = ctx.createRadialGradient(g.holeX - g.holeR * 0.2, g.cy - g.holeR * 0.2, g.holeR * 0.1, g.holeX, g.cy, g.holeR);
  hole.addColorStop(0, '#0b0806');
  hole.addColorStop(1, '#000000');
  ctx.beginPath();
  ctx.arc(g.holeX, g.cy, g.holeR, 0, Math.PI * 2);
  ctx.fillStyle = hole;
  ctx.fill();
}

function paintPickups(ctx: CanvasRenderingContext2D, l: FretboardLayout, g: BodyGeometry, look: GuitarLook): void {
  const span = l.spreadBody * 2;
  const isBass = look.style === 'bass';
  const positions = isBass ? [0.3, 0.46] : [0.27, 0.45];
  // Pickguard plate behind the pickups.
  ctx.beginPath();
  ctx.roundRect(g.x0 + g.length * 0.16, g.cy + span * 0.62, g.length * 0.36, g.width * 0.22, 16);
  ctx.fillStyle = look.pickguard;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();
  for (const p of positions) {
    const x = g.x0 + g.length * p;
    const w = g.length * (isBass ? 0.05 : 0.075);
    const h = span * 1.2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, g.cy - h / 2, w, h, 4);
    ctx.fillStyle = '#0c0c0d';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();
    for (const y of strumStringYs(l)) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = look.hardware;
      ctx.fill();
    }
  }
  // Volume / tone knobs.
  for (const [dx, dy] of [[0.72, 0.3], [0.8, 0.36], [0.76, 0.22]] as const) {
    const grad = ctx.createRadialGradient(g.x0 + g.length * dx - 3, g.cy + g.width * dy - 3, 1, g.x0 + g.length * dx, g.cy + g.width * dy, 11);
    grad.addColorStop(0, '#f2f2f2');
    grad.addColorStop(1, '#6d6d70');
    ctx.beginPath();
    ctx.arc(g.x0 + g.length * dx, g.cy + g.width * dy, 11, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function paintBridge(ctx: CanvasRenderingContext2D, l: FretboardLayout, g: BodyGeometry, look: GuitarLook): void {
  const ys = strumStringYs(l);
  const spacing = (2 * l.spreadBody) / Math.max(1, l.strings - 1);
  const top = (ys[0] ?? g.cy) - spacing * 0.6;
  const bottom = (ys[ys.length - 1] ?? g.cy) + spacing * 0.6;
  const x = l.strumX1;
  if (look.style === 'electric' || look.style === 'bass') {
    const metal = ctx.createLinearGradient(0, top, 0, bottom);
    metal.addColorStop(0, '#e9e9ea');
    metal.addColorStop(0.5, '#8d8d90');
    metal.addColorStop(1, '#d5d5d7');
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.roundRect(x - 6, top, 26, bottom - top, 4);
    ctx.fill();
    ys.forEach((y) => {
      ctx.fillStyle = '#5c5c5f';
      ctx.fillRect(x - 3, y - 2, 8, 4);
    });
    return;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#24160f';
  ctx.beginPath();
  // Moustache-less belly bridge: wider than it is tall, the strings anchored by pins behind the saddle.
  ctx.roundRect(x - g.length * 0.035, top - spacing * 0.8, g.length * (look.style === 'classical' ? 0.1 : 0.085), bottom - top + spacing * 1.6, 8);
  ctx.fill();
  ctx.restore();
  // Bone saddle where the strings break.
  ctx.fillStyle = look.binding;
  ctx.fillRect(x - 2, top, 4, bottom - top);
  ys.forEach((y) => {
    ctx.beginPath();
    ctx.arc(x + g.length * 0.028, y, look.style === 'classical' ? 2 : 3.2, 0, Math.PI * 2);
    ctx.fillStyle = look.style === 'classical' ? '#d9c49a' : '#efe4cc';
    ctx.fill();
  });
}
