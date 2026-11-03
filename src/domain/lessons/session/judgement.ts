import type { Grade } from '@domain/lessons/session/grade';

/** A grading event, kept for the UI's feedback popups. */
export interface Judgement {
  readonly grade: Grade;
  /** Wall-clock milliseconds when it happened. */
  readonly at: number;
}
