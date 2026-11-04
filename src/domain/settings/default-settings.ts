import { PlayMode } from '@domain/instruments/play-mode';
import { DEFAULT_PEDAL_BINDINGS } from '@domain/input/default-pedal-bindings';
import { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import { LessonMode } from '@domain/lessons/session/lesson-mode';
import type { Settings } from '@domain/settings/settings';
import { StrumFilter } from '@domain/settings/strum-filter';

/** First-run settings. */
export const DEFAULT_SETTINGS: Settings = {
  language: '',
  instrument: 'acoustic',
  mode: PlayMode.chord,
  chordSet: 'pop',
  isLefty: false,
  strumFilter: StrumFilter.both,
  tuning: 'standard',
  capo: 0,
  volume: 0.8,
  playerVolume: 1,
  brightness: 0.55,
  isCameraHidden: false,
  latencyMs: 70,
  lessonTempo: 0.8,
  lessonMode: LessonMode.shadow,
  guideVolume: 0.6,
  isLessonEasy: true,
  hasLessonDrums: false,
  pedalBindings: DEFAULT_PEDAL_BINDINGS,
  customSongs: [],
  hihatMode: HiHatPedalMode.holdToOpen,
  hasSeenExplore: false,
  best: {},
};
