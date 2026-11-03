import { chordGrid, chordSlots } from '@domain/fretboard/chord-grid';
import { line } from '@presentation/canvas/draw-utils';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const LABEL = { above: 12, below: 24, number: 20, numberBelow: 15 } as const;
const INSET = 2;

/** Chord boxes: the held one filled, the lesson's target outlined; labels sit outside the strings. */
export function paintChordSlots({ ctx, player, target }: PaintContext): void {
  const l = player.layout;
  const slots = chordSlots(l, player.chords.length);
  const isTwoRows = chordGrid(player.chords.length).rows === 2;
  for (const s of slots) {
    const name = player.chords[s.index] ?? '';
    const isActive = s.index === player.slot;
    const isTarget = target?.chord === name;
    if (isActive) {
      ctx.fillStyle = rgba(Palette.accent, player.isMuted ? 0.06 : 0.16);
      ctx.fillRect(s.x0 + INSET, s.y0 + INSET, s.x1 - s.x0 - 2 * INSET, s.y1 - s.y0 - 2 * INSET);
    }
    if (isTarget) {
      ctx.strokeStyle = rgba(Palette.accent, 0.95);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x0 + 2.5, s.y0 + 2.5, s.x1 - s.x0 - 5, s.y1 - s.y0 - 5);
    }
    ctx.strokeStyle = rgba(Palette.ink, 0.16);
    ctx.lineWidth = 1;
    line(ctx, s.x1, s.y0, s.x1, s.y1);
    const isBelow = isTwoRows && s.y0 >= l.centerY - 1;
    const ly = isBelow ? s.y1 + LABEL.below : s.y0 - LABEL.above;
    const cx = (s.x0 + s.x1) / 2;
    ctx.font = isActive ? `600 20px ${FONT}` : `500 17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isTarget ? rgba(Palette.accent, 1) : rgba(Palette.ink, isActive ? 0.95 : 0.55);
    ctx.fillText(name, cx, ly);
    ctx.font = `500 10px ${FONT}`;
    ctx.fillStyle = rgba(Palette.ink, 0.3);
    ctx.fillText(String(s.index + 1), cx, isBelow ? ly + LABEL.numberBelow : ly - LABEL.number);
  }
  const first = slots[0];
  if (isTwoRows && first) {
    ctx.strokeStyle = rgba(Palette.ink, 0.1);
    ctx.setLineDash([3, 5]);
    line(ctx, first.x0, l.centerY, l.neckEndX, l.centerY);
    ctx.setLineDash([]);
  }
}
