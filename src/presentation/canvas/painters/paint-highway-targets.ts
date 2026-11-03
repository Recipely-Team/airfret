import type { Player } from '@application/play/player';
import type { Target } from '@domain/lessons/chart/target';
import { StrumMark } from '@domain/lessons/chart/strum-mark';
import { Grade } from '@domain/lessons/session/grade';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { findPosition } from '@domain/music/find-position';
import { midiToName } from '@domain/music/pitch';
import { line } from '@presentation/canvas/draw-utils';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import { Highway } from '@presentation/canvas/painters/highway-geometry';
import { t } from '@presentation/i18n/translator';

const ARROW = { y: 46, half: 8, wing: 4 } as const;

/** Strum arrows (chord songs) or note blocks with string/fret hints (melodies). */
export function paintHighwayTargets(ctx: CanvasRenderingContext2D, lesson: LessonSession, player: Player, xOf: (beat: number) => number, ppb: number): void {
  const top = Highway.top;
  for (const tg of lesson.chart.targets) {
    const x = xOf(tg.beat);
    if (x < -60 || x > player.layout.w + 20) continue;
    const result = lesson.resultOf(tg);
    const col = result === Grade.miss ? rgba(Palette.miss, 0.8) : result ? rgba(Palette.accent, result === Grade.perfect ? 1 : 0.6) : rgba(Palette.ink, 0.85);
    if (tg.strum) paintArrow(ctx, x, top + ARROW.y, tg.strum, col);
    else if (tg.midi !== undefined) paintNote(ctx, player, { target: tg, midi: tg.midi, x, ppb, col, isJudged: result !== undefined });
  }
}

function paintArrow(ctx: CanvasRenderingContext2D, x: number, y: number, mark: StrumMark, col: string): void {
  const d = mark === StrumMark.down ? 1 : -1;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  line(ctx, x, y - ARROW.half * d, x, y + ARROW.half * d);
  ctx.beginPath();
  ctx.moveTo(x - ARROW.wing, y + ARROW.wing * d);
  ctx.lineTo(x, y + ARROW.half * d);
  ctx.lineTo(x + ARROW.wing, y + ARROW.wing * d);
  ctx.stroke();
}

interface NoteBlock {
  readonly target: Target;
  readonly midi: number;
  readonly x: number;
  readonly ppb: number;
  readonly col: string;
  readonly isJudged: boolean;
}

function paintNote(ctx: CanvasRenderingContext2D, player: Player, { target: tg, midi, x, ppb, col, isJudged }: NoteBlock): void {
  const top = Highway.top;
  const w = Math.max(10, tg.dur * ppb - 4);
  ctx.fillStyle = isJudged ? col.replace(/[\d.]+\)$/, '0.18)') : rgba(Palette.ink, 0.06);
  ctx.fillRect(x, top + 10, w, Highway.height - 20);
  ctx.strokeStyle = col;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, top + 10.5, w - 1, Highway.height - 21);
  ctx.font = `600 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = col;
  ctx.fillText(midiToName(midi), x + 7, top + 30);
  const pos = findPosition(midi, player.instrument.tuning, player.layout.maxFret);
  if (!pos) return;
  ctx.font = `500 10px ${FONT}`;
  ctx.fillStyle = rgba(Palette.ink, 0.55);
  const stringNo = player.instrument.tuning.length - pos.string;
  ctx.fillText(`${stringNo}.${t('ui.string')} · ${pos.fret === 0 ? t('ui.open') : pos.fret}`, x + 7, top + 45);
}
