import type { Fretting } from '@domain/fretboard/fretting/fretting';
import type { Point } from '@domain/fretboard/point';

/** What the instrument playing by itself shows this frame. */
export interface DemoFrame {
  /** What the fretting hand holds. */
  readonly fretting: Fretting;
  /** Strings that sounded since the last frame, and how hard. */
  readonly hits: readonly { readonly string: number; readonly amp: number }[];
  /** The strumming fingertip. */
  readonly pick: Point;
  readonly fretHand: readonly Point[];
  readonly strumHand: readonly Point[];
  /** The chord being played, or '' in a melody. */
  readonly chord: string;
}
