import { t } from '@presentation/i18n/translator';

/** Seconds without a visible hand before asking the player to show them. */
const NO_HANDS_HINT_AFTER = 2.5;

/** The one-line hint under the instrument: how to play without a camera, or a nudge to show both hands. */
export function stageHint(s: { isStarted: boolean; hasCamera: boolean; isDrums: boolean; secondsWithoutHands: number }): string | null {
  if (!s.isStarted) return null;
  if (!s.hasCamera) return t(s.isDrums ? 'app.mouseHintDrums' : 'app.mouseHint');
  return s.secondsWithoutHands > NO_HANDS_HINT_AFTER ? t('app.noHands') : null;
}
