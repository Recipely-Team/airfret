import { spreadAt } from '@domain/fretboard/neck-geometry';
import { findPosition } from '@domain/music/find-position';
import { dot, line } from '@presentation/canvas/draw-utils';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const PAD_OF_HEIGHT = 0.03;
const INLAYS = [3, 5, 7, 9];
const OCTAVE = 12;
const INLAY_RADIUS = 4;
const LABEL_OFFSET = 16;

/** Fret wires, inlays, numbers; the held fret filled, the lesson's target fret outlined. */
export function paintFrets({ ctx, player, target }: PaintContext): void {
  const l = player.layout;
  const pad = l.h * PAD_OF_HEIGHT;
  const pos = target?.midi === undefined ? null : findPosition(target.midi, player.instrument.tuning, l.maxFret);
  for (let n = 1; n <= l.maxFret; n++) {
    const x = l.fretX[n] ?? l.neckEndX;
    const xa = l.fretX[n - 1] ?? l.nutX;
    const s = spreadAt(l, x);
    const box = { x: Math.min(xa, x), y: l.centerY - s - pad, w: Math.abs(x - xa), h: 2 * s + 2 * pad };
    if (n === player.fret) {
      ctx.fillStyle = rgba(Palette.accent, 0.22);
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }
    if (pos?.fret === n) {
      ctx.strokeStyle = rgba(Palette.accent, 0.9);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
    }
    ctx.strokeStyle = rgba(Palette.ink, 0.28);
    ctx.lineWidth = 1;
    line(ctx, x, box.y, x, box.y + box.h);
    const mid = (x + xa) / 2;
    if (INLAYS.includes(n)) dot(ctx, mid, l.centerY, INLAY_RADIUS, rgba(Palette.ink, 0.18));
    if (n === OCTAVE) {
      dot(ctx, mid, l.centerY - s / 2, INLAY_RADIUS, rgba(Palette.ink, 0.18));
      dot(ctx, mid, l.centerY + s / 2, INLAY_RADIUS, rgba(Palette.ink, 0.18));
    }
    ctx.font = `500 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(Palette.ink, n === player.fret ? 0.95 : 0.4);
    ctx.fillText(String(n), mid, box.y + box.h + LABEL_OFFSET);
  }
  if (pos?.fret === 0) {
    const s = spreadAt(l, l.nutX);
    ctx.strokeStyle = rgba(Palette.accent, 0.9);
    ctx.lineWidth = 2;
    line(ctx, l.nutX, l.centerY - s - pad * 1.3, l.nutX, l.centerY + s + pad * 1.3);
  }
}
