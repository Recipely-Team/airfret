import type { PlayMode } from '@domain/instruments/play-mode';
import type { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import type { PedalBindings } from '@domain/input/pedal-bindings';
import type { Song } from '@domain/lessons/catalog/song';
import type { LessonMode } from '@domain/lessons/session/lesson-mode';
import type { StrumFilter } from '@domain/settings/strum-filter';
import type { BandStyle } from '@domain/band/band-style';
import type { MemberChoice } from '@domain/band/member-choice';

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
  /** How many octaves the piano keyboard is slid from its home position (negative = lower). */
  readonly pianoShift: number;
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
  /** Instruments that join in when one plays by itself: the same song, together (ids). */
  readonly ensemble: readonly string[];
  /** The band page's members (instrument ids), in the order they are shown. */
  readonly band: readonly string[];
  /** The band's texture (auto, full, quiet, folk, march) and level (1–5; null: building up over the song). */
  readonly bandStyle: BandStyle;
  readonly bandEnergy: number | null;
  /** What the player chose for each member (role, pattern, level, entry), by instrument id. */
  readonly bandChoices: Readonly<Record<string, MemberChoice>>;
  /** Best accuracy (0–1) per song id. */
  readonly best: Readonly<Record<string, number>>;
}
