import { PlayMode } from '@domain/instruments/play-mode';
import { CHORD_SHAPES } from '@domain/music/chord-shapes';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';
import { dot, line } from '@presentation/canvas/draw-utils';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const SIZE = { w: 92, h: 108, margin: 36, bottom: 40 } as const;
const FRETS_SHOWN = 5;
const OPEN_POSITION_MAX = 4;

/** Real-guitar fingering of the held chord, so air practice carries over to a real instrument. */
export function paintChordDiagram({ ctx, player }: PaintContext): void {
  const shape = player.chord ? CHORD_SHAPES[player.chord] : undefined;
  if (player.mode !== PlayMode.chord || player.layout.strings !== GUITAR_STRING_COUNT || !shape || !player.chord) return;
  const l = player.layout;
  const fretted = shape.filter((f): f is number => f !== null && f > 0);
  const base = Math.max(0, ...fretted) > OPEN_POSITION_MAX ? Math.min(...fretted) : 1;
  const x0 = l.isLefty ? l.w - SIZE.w - SIZE.margin : SIZE.margin;
  const y0 = l.h - SIZE.h - SIZE.bottom;
  const sx = SIZE.w / (GUITAR_STRING_COUNT - 1);
  const sy = SIZE.h / FRETS_SHOWN;
  ctx.save();
  ctx.globalAlpha = player.isMuted ? 0.35 : 1;
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = rgba(Palette.ink, 0.9);
  ctx.fillText(player.chord, x0, y0 - 24);
  ctx.strokeStyle = rgba(Palette.ink, 0.35);
  for (let i = 0; i < GUITAR_STRING_COUNT; i++) {
    ctx.lineWidth = 1;
    line(ctx, x0 + i * sx, y0, x0 + i * sx, y0 + SIZE.h);
  }
  for (let j = 0; j <= FRETS_SHOWN; j++) {
    ctx.lineWidth = j === 0 && base === 1 ? 3 : 1;
    line(ctx, x0, y0 + j * sy, x0 + SIZE.w, y0 + j * sy);
  }
  ctx.font = `500 11px ${FONT}`;
  if (base > 1) {
    ctx.fillStyle = rgba(Palette.ink, 0.5);
    ctx.fillText(`${base}fr`, x0 + SIZE.w + 8, y0 + sy * 0.65);
  }
  ctx.textAlign = 'center';
  shape.forEach((f, i) => paintMark(ctx, x0 + i * sx, y0, sy, f, base));
  ctx.restore();
}

function paintMark(ctx: CanvasRenderingContext2D, x: number, y0: number, sy: number, fret: number | null, base: number): void {
  if (fret === null) {
    ctx.fillStyle = rgba(Palette.ink, 0.45);
    ctx.fillText('×', x, y0 - 6);
  } else if (fret === 0) {
    ctx.strokeStyle = rgba(Palette.ink, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y0 - 10, 3.5, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    dot(ctx, x, y0 + (fret - base + 0.5) * sy, 6, rgba(Palette.accent, 0.95));
  }
}
