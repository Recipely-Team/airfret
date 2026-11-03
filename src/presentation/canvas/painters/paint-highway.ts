import { PlayMode } from '@domain/instruments/play-mode';
import { Grade } from '@domain/lessons/session/grade';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { midiToName } from '@domain/music/pitch';
import { line } from '@presentation/canvas/draw-utils';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { Highway } from '@presentation/canvas/painters/highway-geometry';
import { paintHighwayTargets } from '@presentation/canvas/painters/paint-highway-targets';
import { t } from '@presentation/i18n/translator';

const POPUP_MS = 700;
const POPUPS_SHOWN = 3;
const COUNT_IN_Y_OF_HEIGHT = 0.38;
const PULSE_HZ = 5;

/** The lesson timeline: chord blocks, targets, playhead, count-in, wait hint and grade popups. */
export function paintHighway(pc: PaintContext): void {
  const { ctx, player, lesson, audioNow } = pc;
  if (!lesson) return;
  const l = player.layout;
  const beat = lesson.beatAt(audioNow);
  const { top, height } = Highway;
  const headX = l.w * Highway.headOfWidth;
  const ppb = Math.max(Highway.minPixelsPerBeat, Math.min(Highway.maxPixelsPerBeat, l.w * Highway.pixelsPerBeatOfWidth));
  const xOf = (b: number) => headX + (b - beat) * ppb;

  ctx.save();
  ctx.fillStyle = rgba(Palette.shade, 0.55);
  ctx.fillRect(0, top, l.w, height);
  ctx.strokeStyle = rgba(Palette.ink, 0.08);
  line(ctx, 0, top + 0.5, l.w, top + 0.5);
  line(ctx, 0, top + height - 0.5, l.w, top + height - 0.5);
  paintBarLines(ctx, lesson, beat, xOf, l.w);
  ctx.beginPath();
  ctx.rect(0, top, l.w, height);
  ctx.clip();
  if (lesson.song.mode === PlayMode.chord) paintSegments(ctx, lesson, beat, xOf, headX, l.w);
  paintHighwayTargets(ctx, lesson, player, xOf, ppb);
  ctx.restore();

  ctx.strokeStyle = rgba(Palette.accent, 0.9);
  ctx.lineWidth = 2;
  line(ctx, headX, top - 4, headX, top + height + 4);
  paintOverlays(pc, lesson, beat, headX);
}

function paintBarLines(ctx: CanvasRenderingContext2D, lesson: LessonSession, beat: number, xOf: (b: number) => number, w: number): void {
  const bpb = lesson.song.beatsPerBar;
  ctx.strokeStyle = rgba(Palette.ink, 0.12);
  for (let b = Math.max(0, Math.floor(beat / bpb) * bpb); xOf(b) < w; b += bpb) {
    line(ctx, xOf(b), Highway.top + 6, xOf(b), Highway.top + Highway.height - 6);
  }
}

function paintSegments(ctx: CanvasRenderingContext2D, lesson: LessonSession, beat: number, xOf: (b: number) => number, headX: number, w: number): void {
  for (const s of lesson.chart.segments) {
    const xa = xOf(s.beat);
    const xb = xOf(s.beat + s.dur);
    if (xb < 0 || xa > w) continue;
    const isCurrent = beat >= s.beat && beat < s.beat + s.dur;
    ctx.fillStyle = isCurrent ? rgba(Palette.accent, 0.1) : rgba(Palette.ink, 0.04);
    ctx.fillRect(xa + 1, Highway.top + 8, xb - xa - 2, 22);
    ctx.font = `600 14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = isCurrent ? rgba(Palette.accent, 1) : rgba(Palette.ink, 0.85);
    ctx.fillText(s.chord, Math.max(xa + 8, Math.min(headX + 8, xb - 40)), Highway.top + 24);
  }
}

function paintOverlays({ ctx, player, now }: PaintContext, lesson: LessonSession, beat: number, headX: number): void {
  const below = Highway.top + Highway.height;
  if (beat < 0 && lesson.hasStarted) {
    ctx.font = `300 96px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(Palette.ink, 0.9);
    ctx.fillText(String(Math.ceil(-beat)), player.layout.w / 2, player.layout.h * COUNT_IN_Y_OF_HEIGHT);
  }
  const next = lesson.nextTarget;
  if (lesson.isWaiting && next) {
    ctx.font = `500 14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(Palette.accent, 0.5 + 0.4 * Math.sin(now * PULSE_HZ));
    const what = next.chord ?? (next.midi === undefined ? '' : midiToName(next.midi));
    ctx.fillText(`${t('lesson.waitHint')}: ${what}`, headX + 14, below + 22);
  }
  for (const j of lesson.judgements.filter((x) => now * 1000 - x.at < POPUP_MS).slice(-POPUPS_SHOWN)) {
    const age = (now * 1000 - j.at) / POPUP_MS;
    ctx.font = `600 13px ${FONT}`;
    ctx.textAlign = 'center';
    const isBad = j.grade === Grade.miss || j.grade === Grade.wrong;
    ctx.fillStyle = rgba(isBad ? Palette.miss : Palette.accent, 1 - age);
    ctx.fillText(t(`grade.${j.grade}`), headX, below + 44 - age * 14);
  }
}
