import type { InputBinding } from '@domain/input/input-binding';
import { InputSource } from '@domain/input/input-source';
import { t } from '@presentation/i18n/translator';

const NAMED_KEYS: Readonly<Record<string, string>> = {
  Space: 'key.space', ShiftLeft: 'key.shiftLeft', ShiftRight: 'key.shiftRight', ControlLeft: 'key.ctrlLeft',
  ControlRight: 'key.ctrlRight', AltLeft: 'key.altLeft', AltRight: 'key.altRight', Enter: 'key.enter', Tab: 'key.tab',
};
const ARROWS: Readonly<Record<string, string>> = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };

/** Human name of an input: "Space", "Left Shift", "B", "Mouse 2", "Controller 3", "MIDI 36". */
export function bindingLabel(b: InputBinding): string {
  if (b.source === InputSource.midi) return `MIDI ${b.code}`;
  if (b.source === InputSource.mouse) return t('input.mouse', { n: Number(b.code) + 1 });
  if (b.source === InputSource.gamepad) return t('input.gamepad', { n: Number(b.code) + 1 });
  const named = NAMED_KEYS[b.code];
  if (named) return t(named);
  return ARROWS[b.code] ?? b.code.replace(/^Key|^Digit|^Numpad/, '');
}
