import { DRUMS_ID } from '@domain/drums/drums-id';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { isKeyboard } from '@domain/keys/keyboard-instruments';
import { t } from '@presentation/i18n/translator';

/** How to play each instrument without a camera, where it differs from the guitar's strumming. */
const MOUSE_HINTS: Readonly<Record<string, string>> = { [DRUMS_ID]: 'app.mouseHintDrums' };
/** Seconds without a visible hand before asking the player to show them. */
const NO_HANDS_HINT_AFTER = 2.5;

/** The one-line hint under the instrument: how to play without a camera, or a nudge to show both hands. */
export function stageHint(s: { isStarted: boolean; hasCamera: boolean; instrument: string; secondsWithoutHands: number }): string | null {
  if (!s.isStarted) return null;
  if (!s.hasCamera) return t(isKeyboard(s.instrument) ? 'app.mouseHintPiano' : handDrumFor(s.instrument) ? 'app.mouseHintHandDrum' : (MOUSE_HINTS[s.instrument] ?? 'app.mouseHint'));
  return s.secondsWithoutHands > NO_HANDS_HINT_AFTER ? t('app.noHands') : null;
}
