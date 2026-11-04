import { PlayMode } from '@domain/instruments/play-mode';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';
import { drawChordDiagram } from '@presentation/canvas/chord-diagram/draw-chord-diagram';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const CARD = { w: 150, h: 196, margin: 24, diagram: 96 } as const;
/** Below this screen width (phones held upright) the card is drawn smaller so the neck stays clear. */
const NARROW_PX = 600;
const NARROW_SCALE = 0.7;

/** Bottom corner card: the held chord's real-guitar chart, so air practice carries over. */
export function paintChordCard({ ctx, player }: PaintContext): void {
  const l = player.layout;
  const chord = player.mode === PlayMode.chord ? player.chord : player.mode === PlayMode.free ? player.lastChordName : '';
  if (!chord || l.strings !== GUITAR_STRING_COUNT) return;
  const k = l.w < NARROW_PX ? NARROW_SCALE : 1;
  const margin = CARD.margin * k;
  ctx.save();
  ctx.translate(l.isLefty ? l.w - CARD.w * k - margin : margin, l.h - CARD.h * k - margin);
  ctx.scale(k, k);
  const x = 0;
  const y = 0;
  ctx.beginPath();
  ctx.roundRect(x, y, CARD.w, CARD.h, 12);
  ctx.fillStyle = rgba(Palette.shade, 0.78);
  ctx.fill();
  ctx.strokeStyle = rgba(Palette.ink, 0.1);
  ctx.stroke();
  ctx.font = `600 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = rgba(Palette.ink, 0.95);
  ctx.fillText(chord, x + 16, y + 30);
  drawChordDiagram(ctx, chord, x + (CARD.w - CARD.diagram) / 2, y + 58, CARD.diagram, player.isMuted);
  ctx.restore();
}
