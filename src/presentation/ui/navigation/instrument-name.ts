import { DRUMS_ID } from '@domain/drums/drums-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PIANO } from '@domain/keys/piano';
import { PIANO_ID } from '@domain/keys/piano-id';
import { t } from '@presentation/i18n/translator';

/** An instrument's name in the page's language — the fretted ones from the catalogue, the drum kit and piano by id. */
export function instrumentName(id: string): string {
  if (id === DRUMS_ID) return t('inst.drums');
  if (id === PIANO_ID) return t(PIANO.name);
  return t(instrumentById(id).name);
}
