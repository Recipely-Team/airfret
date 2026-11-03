import type { PlayMode } from '@domain/instruments/play-mode';
import type { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import type { PedalBindings } from '@domain/input/pedal-bindings';
import type { LessonMode } from '@domain/lessons/session/lesson-mode';
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
  readonly tuning: string;
  /** Capo fret, 0 = none. */
  readonly capo: number;
  readonly volume: number;
  /** Your own playing, relative to the guide, 0–1. */
  readonly playerVolume: number;
  readonly brightness: number;
  readonly latencyMs: number;
  readonly lessonTempo: number;
  readonly lessonMode: LessonMode;
  /** Guide guitarist volume in shadow mode, 0–1. */
  readonly guideVolume: number;
  readonly isLessonEasy: boolean;
  readonly hasLessonDrums: boolean;
  readonly pedalBindings: PedalBindings;
  readonly hihatMode: HiHatPedalMode;
  /** The Explore guide has been shown once. */
  readonly hasSeenExplore: boolean;
  /** Best accuracy (0–1) per song id. */
  readonly best: Readonly<Record<string, number>>;
}
