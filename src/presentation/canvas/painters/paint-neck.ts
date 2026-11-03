import { spreadAt } from '@domain/fretboard/neck-geometry';
import { PlayMode } from '@domain/instruments/play-mode';
import { rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { paintChordSlots } from '@presentation/canvas/painters/paint-chord-slots';
import { paintFrets } from '@presentation/canvas/painters/paint-frets';

const PAD_OF_HEIGHT = 0.03;
const NUT_WIDTH = 4;

/** Fingerboard, nut, then chord boxes or frets depending on the mode. */
export function paintNeck(pc: PaintContext): void {
  const { ctx, player } = pc;
  const l = player.layout;
  const pad = l.h * PAD_OF_HEIGHT;
  const top = (x: number) => l.centerY - spreadAt(l, x) - pad;
  const bottom = (x: number) => l.centerY + spreadAt(l, x) + pad;
  ctx.beginPath();
  ctx.moveTo(l.nutX, top(l.nutX));
  ctx.lineTo(l.neckEndX, top(l.neckEndX));
  ctx.lineTo(l.neckEndX, bottom(l.neckEndX));
  ctx.lineTo(l.nutX, bottom(l.nutX));
  ctx.closePath();
  ctx.fillStyle = rgba(Palette.shade, 0.5);
  ctx.fill();
  ctx.strokeStyle = rgba(Palette.ink, 0.12);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = rgba(Palette.ink, 0.5);
  ctx.fillRect(l.nutX - NUT_WIDTH / 2, top(l.nutX), NUT_WIDTH, bottom(l.nutX) - top(l.nutX));
  if (player.mode === PlayMode.chord) paintChordSlots(pc);
  else paintFrets(pc);
}
