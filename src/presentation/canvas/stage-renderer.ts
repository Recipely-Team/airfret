import type { Player } from '@application/play/player';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { paintBody } from '@presentation/canvas/painters/paint-body';
import { paintChordDiagram } from '@presentation/canvas/painters/paint-chord-diagram';
import { paintHands } from '@presentation/canvas/painters/paint-hands';
import { paintHighway } from '@presentation/canvas/painters/paint-highway';
import { paintNeck } from '@presentation/canvas/painters/paint-neck';
import { paintStrings } from '@presentation/canvas/painters/paint-strings';

const MAX_DPR = 2;
const MAX_FRAME = 0.05;
const STRING_DECAY_PER_SECOND = 3.2;
/** A target this many beats away is too far ahead to highlight a note. */
const TARGET_LOOKAHEAD_BEATS = 2.5;
const HINT_GAP_OF_HEIGHT = 0.17;

/**
 * **StageRenderer** — draws one frame of the instrument overlay on the canvas.
 *
 * @remarks
 * - Each layer is a painter in `painters/`; this class owns sizing, timing and order.
 */
export class StageRenderer {
  private phase = 0;
  private lastT = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {}

  resize(w: number, h: number): void {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(player: Player, lesson: LessonSession | null, audioNow: number, now: number, hint: string | null): void {
    const dt = this.lastT ? Math.min(MAX_FRAME, now - this.lastT) : 0;
    this.lastT = now;
    this.phase += dt;
    player.energy.forEach((e, i) => (player.energy[i] = e * Math.exp(-dt * STRING_DECAY_PER_SECOND)));
    const pc: PaintContext = { ctx: this.ctx, player, lesson, audioNow, now, phase: this.phase, target: targetOf(lesson, audioNow) };
    const l = player.layout;
    this.ctx.clearRect(0, 0, l.w, l.h);
    this.shade(pc);
    [paintBody, paintNeck, paintStrings, paintHands, paintHighway, paintChordDiagram].forEach((paint) => paint(pc));
    if (hint) {
      this.ctx.font = `400 15px ${FONT}`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = rgba(Palette.ink, 0.6);
      this.ctx.fillText(hint, l.w / 2, l.centerY + l.spreadBody + l.h * HINT_GAP_OF_HEIGHT);
    }
  }

  /** Calms the camera image behind the instrument so the strings read. */
  private shade({ ctx, player }: PaintContext): void {
    const l = player.layout;
    const g = ctx.createLinearGradient(0, l.centerY - l.h * 0.35, 0, l.centerY + l.h * 0.4);
    g.addColorStop(0, rgba(Palette.shade, 0));
    g.addColorStop(0.5, rgba(Palette.shade, 0.35));
    g.addColorStop(1, rgba(Palette.shade, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);
  }
}

function targetOf(lesson: LessonSession | null, audioNow: number): PaintContext['target'] {
  const next = lesson?.nextTarget;
  if (!lesson || !next) return null;
  if (next.chord === undefined && next.beat - lesson.beatAt(audioNow) > TARGET_LOOKAHEAD_BEATS) return null;
  return next.chord === undefined ? (next.midi === undefined ? null : { midi: next.midi }) : { chord: next.chord };
}
