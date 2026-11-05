import { describe, expect, it } from 'vitest';
import { foldText, searchSongs } from '@application/lessons/search-songs';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

const byTitle = (q: string) => searchSongs(SONGS, q, (s) => `${s.title} ${s.instrument}`).map((s) => s.id);

describe('Finding a song by typing', () => {
  it('finds a song from a few letters of its title, whatever the case', () => {
    expect(byTitle('BIRTH')).toEqual(expect.arrayContaining(['happy-birthday', 'happy-birthday-melody']));
  });

  it('needs every word typed, in any order', () => {
    expect(byTitle('melody birthday')).toEqual(['happy-birthday-melody']);
  });

  it('ignores Turkish letters and accents, so a Turkish keyboard or none finds the same songs', () => {
    // "Sarki Soyle IGNE cop" written with Turkish letters (S-cedilla, dotless i, o-umlaut, dotted I, G-breve, c-cedilla).
    expect(foldText('\u015earki S\u00f6yle \u0130\u011eNE \u00e7\u00f6p')).toBe('sarki soyle igne cop');
    expect(foldText('F\u00fcr \u00c9lise \u2014 Op. 25')).toBe('fur elise op 25');
    expect(foldText('\u0131i')).toBe(foldText('I\u0130'));
  });

  it('shows everything for an empty search and nothing for a word no song has', () => {
    expect(byTitle('  ')).toHaveLength(SONGS.length);
    expect(byTitle('zzqx')).toEqual([]);
  });

  it('keeps the original order', () => {
    const ids = byTitle('a');
    expect(ids).toEqual(SONGS.map((s) => s.id).filter((id) => ids.includes(id)));
  });
});
