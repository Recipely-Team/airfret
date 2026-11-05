import type { PlayMode } from '@domain/instruments/play-mode';
import type { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import type { PedalBindings } from '@domain/input/pedal-bindings';
import type { Song } from '@domain/lessons/catalog/song';
import type { LessonMode } from '@domain/lessons/session/lesson-mode';
import type { StrumFilter } from '@domain/settings/strum-filter';

/** Everything the player can configure; persisted between sessions. */
export interface Settings {
  /** UI language code; empty = follow the browser. */
  readonly language: string;
  readonly instrument: string;
  /** Chosen voice per instrument id; an instrument not listed plays its best-ranked voice. */
  readonly voices: Readonly<Record<string, string>>;
  readonly mode: PlayMode;
  readonly chordSet: string;
  readonly isLefty: boolean;
  readonly strumFilter: StrumFilter;
  readonly tuning: string;
  /** Capo fret, 0 = none. */
  readonly capo: number;
  readonly volume: number;
  /** Lesson mix: your own playing, 0–1. Used only while a lesson runs. */
  readonly playerVolume: number;
  readonly brightness: number;
  /** Hands-only view: the camera picture is hidden and the hands are drawn as a skeleton. Tracking still runs. */
  readonly isCameraHidden: boolean;
  /** The player turned the camera off: no picture, no tracking; mouse or touch plays. */
  readonly isCameraOff: boolean;
  readonly latencyMs: number;
  readonly lessonTempo: number;
  readonly lessonMode: LessonMode;
  /** Lesson mix: the guide guitarist in shadow mode, 0–1. Used only while a lesson runs. */
  readonly guideVolume: number;
  readonly isLessonEasy: boolean;
  readonly hasLessonDrums: boolean;
  readonly pedalBindings: PedalBindings;
  /** Songs the player typed in themselves. */
  readonly customSongs: readonly Song[];
  readonly hihatMode: HiHatPedalMode;
  /** The first-run introduction has been offered (once: the guided tour on a six-string chord instrument; the name is historical). */
  readonly hasSeenExplore: boolean;
  /** Best accuracy (0–1) per song id. */
  readonly best: Readonly<Record<string, number>>;
}
