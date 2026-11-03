import { TourHint } from '@application/tour/tour-hint';
import type { TourSession } from '@application/tour/tour-session';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { CHIP, chipPlacements } from '@presentation/canvas/painters/instrument/chip-geometry';
import { t } from '@presentation/i18n/translator';

const PANEL = { w: 560, h: 108, top: 64 } as const;

/** The tour card (step, what to do, why) and a pulsing pointer at *where* to do it. */
export function paintTour(pc: PaintContext, tour: TourSession): void {
  const { ctx, player, now } = pc;
  const l = player.layout;
  const step = tour.step;
  const x = (l.w - PANEL.w) / 2;
  ctx.beginPath();
  ctx.roundRect(x, PANEL.top, PANEL.w, PANEL.h, 14);
  ctx.fillStyle = rgba(Palette.shade, 0.85);
  ctx.fill();
  ctx.strokeStyle = rgba(Palette.accent, 0.35);
  ctx.stroke();
  const { at, of } = tour.progress;
  ctx.textAlign = 'left';
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = rgba(Palette.accent, 0.9);
  ctx.fillText(tour.isDone ? t('tour.finished') : t('tour.stepOf', { n: at, of }).toUpperCase(), x + 24, PANEL.top + 26);
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = rgba(Palette.ink, 0.96);
  ctx.fillText(t(`tour.${step.id}.title`), x + 24, PANEL.top + 56);
  ctx.font = `400 13.5px ${FONT}`;
  ctx.fillStyle = rgba(Palette.ink, 0.65);
  ctx.fillText(t(`tour.${step.id}.text`), x + 24, PANEL.top + 84);

  const pulse = 0.5 + 0.5 * Math.sin(now * 5);
  ctx.strokeStyle = rgba(Palette.accent, 0.4 + 0.6 * pulse);
  ctx.lineWidth = 2.5;
  if (step.hint === TourHint.chip && step.chord) {
    const chip = chipPlacements(l, player.chords.length).find((c) => player.chords[c.index] === step.chord);
    if (chip) {
      ctx.beginPath();
      ctx.roundRect(chip.cx - 44, chip.y - 8, 88, CHIP.h + 16, 22);
      ctx.stroke();
    }
  } else if (step.hint === TourHint.strings) {
    const ys = strumStringYs(l);
    const cx = l.strumX0 + (l.strumX1 - l.strumX0) * 0.4;
    const top = (ys[0] ?? 0) - 30;
    const bottom = (ys[ys.length - 1] ?? 0) + 30;
    const y = top + (bottom - top) * ((now * 0.9) % 1);
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = rgba(Palette.accent, 0.8);
    ctx.fill();
  } else if (step.hint === TourHint.neck) {
    const mid = l.nutX + (l.neckEndX - l.nutX) * 0.5;

    ctx.beginPath();
    ctx.ellipse(mid, l.centerY, Math.abs(l.neckEndX - l.nutX) * 0.18, l.spreadBody * 1.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}
