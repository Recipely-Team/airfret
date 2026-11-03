import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import type { Settings } from '@domain/settings/settings';

/** Every playable song: the built-in catalogue plus the player's own. */
export function songLibrary(s: Settings): readonly Song[] {
  return [...SONGS, ...s.customSongs];
}
