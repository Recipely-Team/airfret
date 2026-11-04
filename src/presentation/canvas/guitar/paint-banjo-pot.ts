import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import type { BodyGeometry } from '@presentation/canvas/guitar/body-geometry';
import type { GuitarLook } from '@presentation/canvas/guitar/guitar-look';

const SHADOW = { color: 'rgba(0,0,0,0.55)', blur: 50, offsetY: 22 } as const;
/** Radii as fractions of the pot's: wooden resonator flange, nickel tension hoop, then the head. */
const RESONATOR = 1;
const HOOP_OUTER = 0.9;
const HEAD = 0.84;
const BRACKETS = 24;
/** Tailpiece anchor beyond the bridge, as a fraction of the pot radius. */
const TAIL_AT = 0.62;

/**
 * A banjo pot seen from the front: resonator flange with its brackets, nickel tension hoop, the drum
 * head the bridge stands on, a floating maple bridge and the tailpiece that anchors the strings.
 */
export function paintBanjoPot(ctx: CanvasRenderingContext2D, l: FretboardLayout, g: BodyGeometry, look: GuitarLook): void {
  const cx = g.holeX;
  const r = g.holeR;
  const circle = (k: number) => {
    ctx.beginPath();
    ctx.arc(cx, g.cy, r * k, 0, Math.PI * 2);
  };

  ctx.save();
  circle(RESONATOR);
  ctx.shadowColor = SHADOW.color;
  ctx.shadowBlur = SHADOW.blur;
  ctx.shadowOffsetY = SHADOW.offsetY;
  const wood = ctx.createRadialGradient(cx, g.cy, r * HOOP_OUTER, cx, g.cy, r);
  wood.addColorStop(0, '#5a321c');
  wood.addColorStop(1, look.burst);
  ctx.fillStyle = wood;
  ctx.fill();
  ctx.restore();

  // Brackets: small nickel shoes around the rim that hold the hoop down.
  for (let i = 0; i < BRACKETS; i++) {
    const a = (i / BRACKETS) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.95, g.cy + Math.sin(a) * r * 0.95, Math.max(1.5, r * 0.022), 0, Math.PI * 2);
    ctx.fillStyle = look.hardware;
    ctx.fill();
  }

  const hoop = ctx.createLinearGradient(cx - r, g.cy - r, cx + r, g.cy + r);
  hoop.addColorStop(0, '#f4f4f5');
  hoop.addColorStop(0.5, '#8d8d90');
  hoop.addColorStop(1, '#dcdcde');
  circle(HOOP_OUTER);
  ctx.fillStyle = hoop;
  ctx.fill();

  // The head: a matte, slightly translucent skin, lit from the upper left, darker towards the hoop.
  const head = ctx.createRadialGradient(cx - r * 0.25, g.cy - r * 0.25, r * 0.05, cx, g.cy, r * HEAD);
  head.addColorStop(0, '#f3ecda');
  head.addColorStop(0.75, look.top);
  head.addColorStop(1, look.topGrain);
  circle(HEAD);
  ctx.fillStyle = head;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  paintTailpiece(ctx, l, g, look);
  paintBridge(ctx, l);
}

function paintTailpiece(ctx: CanvasRenderingContext2D, l: FretboardLayout, g: BodyGeometry, look: GuitarLook): void {
  const ys = strumStringYs(l);
  const top = (ys[0] ?? g.cy) - 6;
  const bottom = (ys[ys.length - 1] ?? g.cy) + 6;
  const x = g.holeX + g.holeR * TAIL_AT;
  // Strings run on from the bridge to the tailpiece.
  ctx.strokeStyle = 'rgba(220,220,222,0.55)';
  ctx.lineWidth = 1;
  for (const y of ys) {
    ctx.beginPath();
    ctx.moveTo(l.strumX1, y);
    ctx.lineTo(x, g.cy + (y - g.cy) * 0.55);
    ctx.stroke();
  }
  const metal = ctx.createLinearGradient(0, top, 0, bottom);
  metal.addColorStop(0, '#ededee');
  metal.addColorStop(0.5, '#8d8d90');
  metal.addColorStop(1, '#d5d5d7');
  ctx.beginPath();
  ctx.moveTo(x - 4, g.cy - (g.cy - top) * 0.7);
  ctx.lineTo(x + g.holeR * 0.3, g.cy - (g.cy - top) * 0.35);
  ctx.lineTo(x + g.holeR * 0.3, g.cy + (bottom - g.cy) * 0.35);
  ctx.lineTo(x - 4, g.cy + (bottom - g.cy) * 0.7);
  ctx.closePath();
  ctx.fillStyle = metal;
  ctx.fill();
  ctx.strokeStyle = look.hardware;
  ctx.stroke();
}

/** A thin floating maple bridge with ebony cap, standing on the head under the strings. */
function paintBridge(ctx: CanvasRenderingContext2D, l: FretboardLayout): void {
  const ys = strumStringYs(l);
  const spacing = (2 * l.spreadBody) / Math.max(1, l.strings - 1);
  const top = (ys[0] ?? l.centerY) - spacing * 0.7;
  const bottom = (ys[ys.length - 1] ?? l.centerY) + spacing * 0.7;
  const x = l.strumX1;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.fillStyle = '#c99a5e';
  ctx.fillRect(x - 4, top, 8, bottom - top);
  ctx.restore();
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(x - 1.5, top, 3, bottom - top);
}
