import type { Player } from '@application/play/player';
import type { TourSession } from '@application/tour/tour-session';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { GuitarArt } from '@presentation/canvas/guitar/guitar-art';
import { lookFor } from '@presentation/canvas/guitar/guitar-looks';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';
import { HandCutout } from '@presentation/canvas/painters/instrument/hand-cutout';
import { paintChordCard } from '@presentation/canvas/painters/instrument/paint-chord-card';
import { paintChordChips } from '@presentation/canvas/painters/instrument/paint-chord-chips';
import { paintFingering } from '@presentation/canvas/painters/instrument/paint-fingering';
import { paintPick } from '@presentation/canvas/painters/instrument/paint-pick';
import { paintStrings } from '@presentation/canvas/painters/instrument/paint-strings';
import { paintCoach } from '@presentation/canvas/painters/lesson/paint-coach';
import { paintStrumCue } from '@presentation/canvas/painters/lesson/paint-strum-cue';
import { paintTour } from '@presentation/canvas/painters/tour/paint-tour';

const MAX_DPR = 2;
const MAX_FRAME = 0.05;
const STRING_DECAY_PER_SECOND = 3.2;
/** A target this many beats away is too far ahead to highlight a note. */
const TARGET_LOOKAHEAD_BEATS = 2.5;
const HINT_GAP_OF_HEIGHT = 0.2;

/**
 * **StageRenderer** — draws one frame.
 *
 * @remarks
 * Order matters: guitar art → finger placement → strings → the player's real hands (cut from the
 * camera, so fingers sit on the strings) → labels, pick, chord chart → lesson coach and cues.
 */
export class StageRenderer {
  private phase = 0;
  private lastT = 0;
  private readonly art = new GuitarArt();
  private readonly hands = new HandCutout();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly video: HTMLVideoElement,
  ) {}

  resize(w: number, h: number): void {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(player: Player, lesson: LessonSession | null, tour: TourSession | null, audioNow: number, now: number, hint: string | null, brightness: number): void {
    const dt = this.lastT ? Math.min(MAX_FRAME, now - this.lastT) : 0;
    this.lastT = now;
    this.phase += dt;
    player.energy.forEach((e, i) => (player.energy[i] = e * Math.exp(-dt * STRING_DECAY_PER_SECOND)));
    const l = player.layout;
    const pc: PaintContext = { ctx: this.ctx, player, look: lookFor(player.instrument.chain), lesson, audioNow, now, phase: this.phase, target: targetOf(lesson, audioNow) };
    this.ctx.clearRect(0, 0, l.w, l.h);
    this.art.draw(this.ctx, l, player.instrument.chain);
    paintFingering(pc);
    paintStrings(pc);
    const hands = [player.fretHand, player.strumHand].filter((h): h is NonNullable<typeof h> => h !== null);
    this.hands.draw(this.ctx, this.video, hands, l.w, l.h, brightness);
    [paintChordChips, paintPick, paintChordCard, paintCoach, paintStrumCue].forEach((paint) => paint(pc));
    if (tour) paintTour(pc, tour);
    if (hint) {
      this.ctx.font = `400 15px ${FONT}`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = rgba(Palette.ink, 0.7);
      this.ctx.fillText(hint, l.w / 2, l.centerY + l.spreadBody + l.h * HINT_GAP_OF_HEIGHT);
    }
  }
}

function targetOf(lesson: LessonSession | null, audioNow: number): PaintContext['target'] {
  const next = lesson?.nextTarget;
  if (!lesson || !next) return null;
  if (next.chord === undefined && next.beat - lesson.beatAt(audioNow) > TARGET_LOOKAHEAD_BEATS) return null;
  return next.chord === undefined ? (next.midi === undefined ? null : { midi: next.midi }) : { chord: next.chord };
}
