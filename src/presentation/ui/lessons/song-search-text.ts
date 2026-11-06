import type { Song } from '@domain/lessons/catalog/song';
import { t } from '@presentation/i18n/translator';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';

/** What a search looks through for one song, in the page's language: title and other names, composer, instrument, about, chords. */
export function songSearchText(song: Song): string {
  const instrument = instrumentName(song.instrument);
  // Other names a song is known by (`alias.<id>` in the locales), e.g. its Turkish name.
  const aliasKey = `alias.${song.id}`;
  const alias = t(aliasKey) === aliasKey ? '' : t(aliasKey);
  return [song.title, alias, t(song.credit), instrument, t(song.about), t(`mode.${song.mode}`), song.chords ?? ''].join(' ');
}
