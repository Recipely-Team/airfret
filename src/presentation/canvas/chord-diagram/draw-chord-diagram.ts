import { CHORD_FINGERS } from '@domain/music/chords/chord-fingers';
import { CHORD_SHAPES } from '@domain/music/chords/chord-shapes';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';

const FRETS_SHOWN = 5;
const OPEN_POSITION_MAX = 4;
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

/**
 * A standard chord chart: strings vertical (low E on the left, labelled underneath so it can't be
 * read backwards), frets horizontal, finger numbers 1–4 inside the dots, × muted, ○ open, barre as a
 * bar, and "Nfr" when the shape sits up the neck.
 */
export function drawChordDiagram(ctx: CanvasRenderingContext2D, chord: string, x0: number, y0: number, w: number, isDimmed = false): void {
  const shape = CHORD_SHAPES[chord];
  const fingers = CHORD_FINGERS[chord];
  if (!shape) return;
  const h = w * 1.15;
  const sx = w / (GUITAR_STRING_COUNT - 1);
  const sy = h / FRETS_SHOWN;
  const fretted = shape.filter((f): f is number => f !== null && f > 0);
  const base = Math.max(0, ...fretted) > OPEN_POSITION_MAX ? Math.min(...fretted) : 1;
  const r = Math.min(sx, sy) * 0.38;
  ctx.save();
  ctx.globalAlpha = isDimmed ? 0.35 : 1;
  ctx.strokeStyle = rgba(Palette.ink, 0.45);
  for (let i = 0; i < GUITAR_STRING_COUNT; i++) {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + i * sx, y0);
    ctx.lineTo(x0 + i * sx, y0 + h);
    ctx.stroke();
  }
  for (let j = 0; j <= FRETS_SHOWN; j++) {
    ctx.lineWidth = j === 0 && base === 1 ? 4 : 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + j * sy);
    ctx.lineTo(x0 + w, y0 + j * sy);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  if (base > 1) {
    ctx.font = `500 ${Math.round(r * 1.1)}px ${FONT}`;
    ctx.fillStyle = rgba(Palette.ink, 0.6);
    ctx.textAlign = 'left';
    ctx.fillText(`${base}fr`, x0 + w + r * 0.8, y0 + sy * 0.65);
    ctx.textAlign = 'center';
  }
  const barreStrings = shape.map((f, i) => (fingers?.[i] === 1 && f !== null && f > 0 ? i : -1)).filter((i) => i >= 0);
  if (barreStrings.length >= 2) {
    const f = shape[barreStrings[0] ?? 0] ?? base;
    const y = y0 + (f - base + 0.5) * sy;
    ctx.beginPath();
    ctx.roundRect(x0 + (barreStrings[0] ?? 0) * sx - r, y - r, ((barreStrings[barreStrings.length - 1] ?? 0) - (barreStrings[0] ?? 0)) * sx + 2 * r, 2 * r, r);
    ctx.fillStyle = rgba(Palette.accent, 0.95);
    ctx.fill();
  }
  shape.forEach((f, i) => {
    const x = x0 + i * sx;
    ctx.font = `600 ${Math.round(r * 1.15)}px ${FONT}`;
    if (f === null) {
      ctx.fillStyle = rgba(Palette.miss, 0.9);
      ctx.fillText('×', x, y0 - r * 0.7);
    } else if (f === 0) {
      ctx.strokeStyle = rgba(Palette.ink, 0.75);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y0 - r * 1.1, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const y = y0 + (f - base + 0.5) * sy;
      const isBarre = barreStrings.includes(i) && barreStrings.length >= 2;
      if (!isBarre || i === barreStrings[0]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(Palette.accent, 0.95);
        ctx.fill();
        ctx.fillStyle = '#1a1408';
        ctx.fillText(String(fingers?.[i] ?? ''), x, y + r * 0.42);
      }
    }
    ctx.font = `500 ${Math.round(r * 0.95)}px ${FONT}`;
    ctx.fillStyle = rgba(Palette.ink, 0.45);
    ctx.fillText(STRING_NAMES[i] ?? '', x, y0 + h + r * 1.6);
  });
  ctx.restore();
}
