import { DRUMS_ID } from '@domain/drums/drums-id';
import { DARBUKA_ID } from '@domain/drums/hand/darbuka-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { keyboardFor } from '@domain/keys/keyboard-instruments';
import { t } from '@presentation/i18n/translator';

/** An instrument's name in the page's language — the fretted ones from the catalogue, the drum kit and piano by id. */
export function instrumentName(id: string): string {
  if (id === DRUMS_ID) return t('inst.drums');
  if (id === DARBUKA_ID) return t('inst.darbuka');
  const keys = keyboardFor(id);
  if (keys) return t(keys.instrument.name);
  return t(instrumentById(id).name);
}
