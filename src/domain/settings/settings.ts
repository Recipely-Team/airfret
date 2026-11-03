import type { PlayMode } from '@domain/instruments/play-mode';
import type { StrumFilter } from '@domain/settings/strum-filter';

/** Everything the player can configure; persisted between sessions. */
export interface Settings {
  /** UI language code; empty = follow the browser. */
  readonly language: string;
  readonly instrument: string;
  readonly mode: PlayMode;
  readonly chordSet: string;
  readonly isLefty: boolean;
  readonly strumFilter: StrumFilter;
  readonly volume: number;
  readonly brightness: number;
  readonly latencyMs: number;
  readonly lessonTempo: number;
  readonly shouldLessonWait: boolean;
  readonly isLessonEasy: boolean;
  readonly hasLessonDrums: boolean;
  /** Best accuracy (0–1) per song id. */
  readonly best: Readonly<Record<string, number>>;
}
