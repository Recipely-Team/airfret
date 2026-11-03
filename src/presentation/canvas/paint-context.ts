import type { Player } from '@application/play/player';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import type { GuitarLook } from '@presentation/canvas/guitar/guitar-look';

/** Everything a painter needs for one frame. */
export interface PaintContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly player: Player;
  readonly look: GuitarLook;
  readonly lesson: LessonSession | null;
  readonly audioNow: number;
  /** Wall clock, seconds. */
  readonly now: number;
  /** Animation phase for string vibration, seconds. */
  readonly phase: number;
  /** Chord or note the lesson wants next, if any. */
  readonly target: { readonly chord?: string; readonly midi?: number } | null;
}
