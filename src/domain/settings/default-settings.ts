import { PlayMode } from '@domain/instruments/play-mode';
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
  volume: 0.8,
  brightness: 0.55,
  latencyMs: 70,
  lessonTempo: 0.8,
  shouldLessonWait: true,
  isLessonEasy: true,
  hasLessonDrums: false,
  best: {},
};
