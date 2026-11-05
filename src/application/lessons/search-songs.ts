import type { Song } from '@domain/lessons/catalog/song';

/**
 * Turkish letters fold to plain Latin (dotless i, dotted capital I, s-cedilla, g-breve, c-cedilla), so a search
 * typed without a Turkish keyboard finds the same songs; other accents go through Unicode decomposition.
 */
const FOLD: Readonly<Record<string, string>> = { '\u0131': 'i', '\u0130': 'i', '\u015f': 's', '\u015e': 's', '\u011f': 'g', '\u011e': 'g' };

/** Lower case, Turkish letters and accents folded, punctuation as spaces. */
export function foldText(text: string): string {
  return text
    .replace(/[\u0130\u0131\u011e\u011f\u015e\u015f]/g, (c) => FOLD[c] ?? c)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}#]+/gu, ' ')
    .trim();
}

/**
 * The songs matching a search, in their original order: every word typed must appear somewhere in what is
 * said about the song (`describe` — title, composer, instrument, description, chords, in the page's language).
 * An empty search matches everything.
 */
export function searchSongs<S extends Song>(songs: readonly S[], query: string, describe: (song: S) => string): S[] {
  const words = foldText(query).split(' ').filter(Boolean);
  if (!words.length) return [...songs];
  return songs.filter((s) => {
    const text = foldText(describe(s));
    return words.every((w) => text.includes(w));
  });
}
