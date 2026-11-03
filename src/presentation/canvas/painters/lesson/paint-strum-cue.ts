import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { StrumMark } from '@domain/lessons/chart/strum-mark';
import { Grade } from '@domain/lessons/session/grade';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { t } from '@presentation/i18n/translator';

const APPROACH_SECONDS = 1.1;
const RING = { min: 16, max: 110 } as const;
const GHOST = { before: 0.05, sweep: 0.11 } as const;
const POPUP_MS = 800;

/**
 * Timing on the strings themselves: a ring that closes onto the strum arrow exactly on the beat,
 * the guide's ghost pick sweeping the strings in shadow mode, and grade popups by the bridge.
 */
export function paintStrumCue({ ctx, player, lesson, audioNow, now }: PaintContext): void {
  if (!lesson || lesson.beatAt(audioNow) < -lesson.song.beatsPerBar) return;
  const l = player.layout;
  const ys = strumStringYs(l);
  const top = (ys[0] ?? l.centerY) - 26;
  const bottom = (ys[ys.length - 1] ?? l.centerY) + 26;
  const cx = l.strumX0 + (l.strumX1 - l.strumX0) * 0.4;
  const cy = l.centerY;
  const next = lesson.nextTarget;
  if (next) {
    const dt = lesson.timeOfBeat(next.beat) - audioNow;
    const isUp = next.strum === StrumMark.up;
    if (lesson.isWaiting || (dt > 0 && dt < APPROACH_SECONDS)) {
      const k = lesson.isWaiting ? 0.5 + 0.5 * Math.sin(now * 6) : 1 - dt / APPROACH_SECONDS;
      const r = lesson.isWaiting ? RING.min + 6 : RING.min + (RING.max - RING.min) * (1 - k);
      ctx.strokeStyle = rgba(Palette.accent, 0.25 + 0.6 * k);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      arrow(ctx, cx, top, bottom, isUp, rgba(Palette.accent, 0.35 + 0.55 * k));
    }
  }
  if (lesson.opts.hasGuide) ghostPick(ctx, lesson, audioNow, cx, top, bottom);
  for (const j of lesson.judgements.filter((x) => now * 1000 - x.at < POPUP_MS).slice(-2)) {
    const age = (now * 1000 - j.at) / POPUP_MS;
    const isBad = j.grade === Grade.miss || j.grade === Grade.wrong;
    ctx.font = `600 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(isBad ? Palette.miss : Palette.accent, 1 - age);
    ctx.fillText(t(`grade.${j.grade}`), cx, top - 16 - age * 22);
  }
}

function arrow(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, isUp: boolean, color: string): void {
  const [from, to] = isUp ? [bottom, top] : [top, bottom];
  const d = isUp ? -1 : 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, from);
  ctx.lineTo(x, to);
  ctx.moveTo(x - 9, to - 12 * d);
  ctx.lineTo(x, to);
  ctx.lineTo(x + 9, to - 12 * d);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

/** The guide's pick: sweeps through the strings around each target time. */
function ghostPick(ctx: CanvasRenderingContext2D, lesson: PaintContext['lesson'] & object, audioNow: number, x: number, top: number, bottom: number): void {
  for (const tg of lesson.chart.targets) {
    const u = (audioNow - lesson.timeOfBeat(tg.beat) + GHOST.before) / GHOST.sweep;
    if (u < 0 || u > 1) continue;
    const isUp = tg.strum === StrumMark.up;
    const y = isUp ? bottom + (top - bottom) * u : top + (bottom - top) * u;
    ctx.beginPath();
    ctx.arc(x + 46, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = rgba(Palette.ink, 0.28);
    ctx.fill();
    ctx.strokeStyle = rgba(Palette.ink, 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
