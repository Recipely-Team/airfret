import { PlayMode } from '@domain/instruments/play-mode';
import { StrumMark } from '@domain/lessons/chart/strum-mark';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { findPosition } from '@domain/music/find-position';
import { midiToName } from '@domain/music/pitch';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { t } from '@presentation/i18n/translator';

const PANEL = { w: 560, h: 116, top: 64 } as const;
const DOT = 6;

/**
 * The lesson coach: what to play *now* in plain words, what comes *next* and when, and the beat.
 *
 * @remarks
 * - Chord songs: the current chord, this bar's strums as arrows (the next one highlighted), and a countdown to the change.
 * - Melodies: the current note with its string and fret, then the next few notes.
 * - Count-in shows big numbers; wait mode says what it is waiting for.
 */
export function paintCoach(pc: PaintContext): void {
  const { ctx, player, lesson, audioNow, now } = pc;
  if (!lesson) return;
  const l = player.layout;
  const beat = lesson.beatAt(audioNow);
  const x = (l.w - PANEL.w) / 2;
  const y = PANEL.top;
  ctx.beginPath();
  ctx.roundRect(x, y, PANEL.w, PANEL.h, 14);
  ctx.fillStyle = rgba(Palette.shade, 0.82);
  ctx.fill();
  ctx.strokeStyle = rgba(Palette.ink, 0.1);
  ctx.stroke();

  if (beat < 0) {
    ctx.font = `300 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(Palette.ink, 0.95);
    ctx.fillText(String(Math.ceil(-beat)), l.w / 2, y + 74);
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = rgba(Palette.ink, 0.55);
    ctx.fillText(t('coach.getReady'), l.w / 2, y + 100);
    return;
  }
  if (lesson.song.mode === PlayMode.chord) chordCoach(ctx, lesson, beat, x, y, now);
  else noteCoach(ctx, pc, lesson, x, y);
  beatDots(ctx, lesson, beat, x + PANEL.w - 24, y + PANEL.h - 18);
}

function chordCoach(ctx: CanvasRenderingContext2D, lesson: LessonSession, beat: number, x: number, y: number, now: number): void {
  const segs = lesson.chart.segments;
  const cur = [...segs].reverse().find((s) => s.beat <= beat + 1e-6) ?? segs[0];
  const next = segs.find((s) => s.beat > beat + 1e-6);
  if (!cur) return;
  label(ctx, t('coach.now'), x + 24, y + 26);
  ctx.font = `600 40px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = rgba(Palette.accent, 1);
  ctx.fillText(cur.chord, x + 22, y + 70);

  // This bar's strums.
  const bpb = lesson.song.beatsPerBar;
  const barStart = Math.floor(beat / bpb) * bpb;
  const inBar = lesson.chart.targets.filter((tg) => tg.beat >= barStart - 1e-6 && tg.beat < barStart + bpb - 1e-6);
  const nextT = lesson.nextTarget;
  ctx.font = `600 22px ${FONT}`;
  inBar.forEach((tg, i) => {
    const isNext = tg === nextT;
    const result = lesson.resultOf(tg);
    ctx.fillStyle = isNext ? rgba(Palette.accent, 0.75 + 0.25 * Math.sin(now * 8)) : result ? rgba(Palette.ink, 0.3) : rgba(Palette.ink, 0.75);
    ctx.fillText(tg.strum === StrumMark.up ? '↑' : '↓', x + 130 + i * 26, y + 66);
  });
  ctx.font = `500 13px ${FONT}`;
  ctx.fillStyle = rgba(Palette.ink, 0.6);
  const hint = lesson.isWaiting ? t('coach.wait', { chord: cur.chord }) : t('coach.strum', { n: inBar.length });
  ctx.fillText(hint, x + 130, y + 92);

  if (next) {
    const beatsLeft = Math.max(1, Math.ceil(next.beat - beat));
    const isSoon = next.beat - beat <= bpb;
    label(ctx, t('coach.next'), x + 400, y + 26);
    ctx.font = `600 28px ${FONT}`;
    ctx.fillStyle = isSoon ? rgba(Palette.ink, 0.95) : rgba(Palette.ink, 0.55);
    ctx.fillText(next.chord, x + 400, y + 64);
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = isSoon ? rgba(Palette.accent, 0.9) : rgba(Palette.ink, 0.45);
    ctx.fillText(isSoon ? t('coach.changeIn', { n: beatsLeft }) : t('coach.beatsLeft', { n: beatsLeft }), x + 400, y + 86);
  }
}

function noteCoach(ctx: CanvasRenderingContext2D, pc: PaintContext, lesson: LessonSession, x: number, y: number): void {
  const tuning = pc.player.instrument.tuning;
  const next = lesson.nextTarget;
  const upcoming = next ? lesson.chart.targets.slice(next.index, next.index + 5) : [];
  const [now, ...rest] = upcoming;
  if (!now || now.midi === undefined) return;
  label(ctx, t('coach.now'), x + 24, y + 26);
  ctx.font = `600 38px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = rgba(Palette.accent, 1);
  ctx.fillText(midiToName(now.midi), x + 22, y + 68);
  const pos = findPosition(now.midi, tuning, pc.player.layout.maxFret);
  ctx.font = `500 13px ${FONT}`;
  ctx.fillStyle = rgba(Palette.ink, 0.7);
  if (pos) ctx.fillText(t('coach.where', { string: tuning.length - pos.string, fret: pos.fret === 0 ? t('ui.open') : pos.fret }), x + 24, y + 94);
  label(ctx, t('coach.next'), x + 230, y + 26);
  rest.forEach((tg, i) => {
    ctx.font = `600 18px ${FONT}`;
    ctx.fillStyle = rgba(Palette.ink, 0.75 - i * 0.12);
    ctx.fillText(tg.midi === undefined ? '' : midiToName(tg.midi), x + 230 + i * 70, y + 62);
  });
}

function beatDots(ctx: CanvasRenderingContext2D, lesson: LessonSession, beat: number, right: number, y: number): void {
  const bpb = lesson.song.beatsPerBar;
  const cur = Math.floor(((beat % bpb) + bpb) % bpb);
  for (let i = 0; i < bpb; i++) {
    ctx.beginPath();
    ctx.arc(right - (bpb - 1 - i) * (DOT * 3), y, i === cur ? DOT : DOT * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = i === cur ? rgba(Palette.accent, 1) : rgba(Palette.ink, 0.25);
    ctx.fill();
  }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.font = `600 10px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = rgba(Palette.ink, 0.45);
  ctx.fillText(text.toUpperCase(), x, y);
}
