import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { spreadAt, stringY } from '@domain/fretboard/neck-geometry';
import type { BodyGeometry } from '@presentation/canvas/guitar/body-geometry';
import type { GuitarLook } from '@presentation/canvas/guitar/guitar-look';
import { allFretX } from '@presentation/canvas/guitar/neck-frets';
import { paintWood } from '@presentation/canvas/guitar/wood';

/** Fingerboard overhang beyond the outer strings, as a fraction of string spacing. */
const EDGE_OF_SPACING = 0.55;
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17];
const DOUBLE_INLAY = 12;
const HEADSTOCK_OF_WIDTH = 0.075;

/** Fingerboard, fret wires, inlays, nut, headstock and tuners. */
export function paintArtNeck(ctx: CanvasRenderingContext2D, l: FretboardLayout, g: BodyGeometry, look: GuitarLook): void {
  const spacing = (x: number) => (2 * spreadAt(l, x)) / (l.strings - 1);
  const half = (x: number) => spreadAt(l, x) + spacing(x) * EDGE_OF_SPACING;
  const x0 = l.nutX;
  const x1 = g.boardEnd;

  paintHeadstock(ctx, l, look, half(x0));

  // Neck shadow on the body / background, then the board itself.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  boardPath(ctx, l.centerY, x0, x1, half);
  ctx.fillStyle = look.board;
  ctx.fill();
  ctx.restore();

  ctx.save();
  boardPath(ctx, l.centerY, x0, x1, half);
  ctx.clip();
  const top = l.centerY - half(x1);
  paintWood(ctx, { x: x0, y: top, w: x1 - x0, h: half(x1) * 2 }, look.board, look.boardGrain, 0.9, 3);
  // Rounded neck: lighter along the middle, darker towards the edges.
  const round = ctx.createLinearGradient(0, top, 0, l.centerY + half(x1));
  round.addColorStop(0, 'rgba(0,0,0,0.35)');
  round.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  round.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = round;
  ctx.fillRect(x0, top, x1 - x0, half(x1) * 2);
  paintInlays(ctx, l, look, allFretX(l, x1), spacing);
  paintFretWires(ctx, l, look, allFretX(l, x1), half);
  ctx.restore();

  if (look.style === 'acoustic' || look.style === 'electric') {
    ctx.strokeStyle = look.binding;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    boardPath(ctx, l.centerY, x0, x1, half);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Bone nut.
  const nut = ctx.createLinearGradient(x0 - 4, 0, x0 + 4, 0);
  nut.addColorStop(0, '#d8cfb9');
  nut.addColorStop(0.5, '#f4eee0');
  nut.addColorStop(1, '#bfb59c');
  ctx.fillStyle = nut;
  ctx.fillRect(x0 - 5, l.centerY - half(x0) - 1, 7, half(x0) * 2 + 2);
}

function boardPath(ctx: CanvasRenderingContext2D, cy: number, x0: number, x1: number, half: (x: number) => number): void {
  ctx.beginPath();
  ctx.moveTo(x0, cy - half(x0));
  ctx.lineTo(x1, cy - half(x1));
  ctx.lineTo(x1, cy + half(x1));
  ctx.lineTo(x0, cy + half(x0));
  ctx.closePath();
}

function paintFretWires(ctx: CanvasRenderingContext2D, l: FretboardLayout, look: GuitarLook, frets: number[], half: (x: number) => number): void {
  frets.slice(1).forEach((x) => {
    const h = half(x);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + 1.5, l.centerY - h, 2, h * 2);
    const wire = ctx.createLinearGradient(x - 1.5, 0, x + 1.5, 0);
    wire.addColorStop(0, '#7f7b73');
    wire.addColorStop(0.5, look.hardware === '#c9b98f' ? '#efe3bd' : '#f3f1ec');
    wire.addColorStop(1, '#8a867d');
    ctx.fillStyle = wire;
    ctx.fillRect(x - 1.5, l.centerY - h, 3, h * 2);
  });
}

function paintInlays(ctx: CanvasRenderingContext2D, l: FretboardLayout, look: GuitarLook, frets: number[], spacing: (x: number) => number): void {
  if (look.style === 'classical') return;
  const dot = (x: number, y: number, r: number) => {
    const pearl = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    pearl.addColorStop(0, '#ffffff');
    pearl.addColorStop(0.6, look.inlay);
    pearl.addColorStop(1, 'rgba(160,150,130,0.9)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = pearl;
    ctx.fill();
  };
  frets.forEach((x, n) => {
    const prev = frets[n - 1];
    if (prev === undefined) return;
    const mid = (x + prev) / 2;
    const r = spacing(mid) * 0.2;
    if (SINGLE_INLAYS.includes(n)) dot(mid, l.centerY, r);
    if (n === DOUBLE_INLAY) {
      dot(mid, stringY(l, 1, mid) + spacing(mid) / 2, r);
      dot(mid, stringY(l, l.strings - 3, mid) + spacing(mid) / 2, r);
    }
  });
}

function paintHeadstock(ctx: CanvasRenderingContext2D, l: FretboardLayout, look: GuitarLook, halfAtNut: number): void {
  const len = l.w * HEADSTOCK_OF_WIDTH;
  const x0 = l.nutX - len;
  const cy = l.centerY;
  const flare = look.style === 'bass' ? 1.5 : 1.38;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.moveTo(l.nutX, cy - halfAtNut);
  ctx.quadraticCurveTo(l.nutX - len * 0.4, cy - halfAtNut * flare * 1.05, x0, cy - halfAtNut * flare);
  ctx.lineTo(x0 - len * 0.08, cy);
  ctx.lineTo(x0, cy + halfAtNut * flare);
  ctx.quadraticCurveTo(l.nutX - len * 0.4, cy + halfAtNut * flare * 1.05, l.nutX, cy + halfAtNut);
  ctx.closePath();
  ctx.fillStyle = look.headstock;
  ctx.fill();
  ctx.restore();

  // Tuner posts: half on each side (3+3, 2+2), strings fan from the nut to them.
  const perSide = Math.ceil(l.strings / 2);
  for (let i = 0; i < l.strings; i++) {
    const isTop = i < perSide;
    const k = isTop ? i : i - perSide;
    const px = l.nutX - len * (0.22 + 0.26 * (isTop ? perSide - 1 - k : k));
    const py = cy + (isTop ? -1 : 1) * halfAtNut * (flare * 0.62);
    ctx.strokeStyle = 'rgba(220,215,205,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l.nutX, stringY(l, i, l.nutX));
    ctx.lineTo(px, py);
    ctx.stroke();
    const post = ctx.createRadialGradient(px - 1.5, py - 1.5, 0.5, px, py, 5);
    post.addColorStop(0, '#ffffff');
    post.addColorStop(1, '#77736b');
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = post;
    ctx.fill();
    // Tuner button sticking out past the edge.
    const by = cy + (isTop ? -1 : 1) * (halfAtNut * flare + 9);
    ctx.beginPath();
    ctx.roundRect(px - 7, by - 5, 14, 10, 4);
    ctx.fillStyle = look.style === 'classical' ? '#e6dcc4' : '#cfcbc3';
    ctx.fill();
  }
}
