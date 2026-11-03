import { describe, expect, it } from 'vitest';
import { createCustomSong } from '@application/lessons/create-custom-song';
import { parseSong } from '@domain/lessons/chart/parse-song';

const base = { title: 'Our Song', bpm: 90, beatsPerBar: 4, chords: 'G D Em C', pattern: 'D.D.D.D.' };

describe('createCustomSong', () => {
  it('turns bare chords into one bar each and makes a playable song', () => {
    const r = createCustomSong(base, []);
    expect(r.isOk).toBe(true);
    if (!r.isOk) return;
    expect(r.value.chords).toBe('G:4 D:4 Em:4 C:4');
    expect(parseSong(r.value, false).isOk).toBe(true);
  });

  it('keeps explicit lengths and accepts commas and bar lines as separators', () => {
    const r = createCustomSong({ ...base, chords: 'G:2, D:2 | Em C' }, []);
    expect(r.isOk && r.value.chords).toBe('G:2 D:2 Em:4 C:4');
  });

  it('names the chord it does not know', () => {
    const r = createCustomSong({ ...base, chords: 'G Xm7b5' }, []);
    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.failure.detail).toBe('custom.error.chord:Xm7b5');
  });

  it('rejects an empty title, an empty chart and an impossible tempo', () => {
    expect(createCustomSong({ ...base, title: ' ' }, []).isOk).toBe(false);
    expect(createCustomSong({ ...base, chords: '' }, []).isOk).toBe(false);
    expect(createCustomSong({ ...base, bpm: 900 }, []).isOk).toBe(false);
  });

  it('never reuses an id', () => {
    const first = createCustomSong(base, []);
    if (!first.isOk) throw new Error('first');
    const second = createCustomSong(base, [first.value.id]);
    expect(second.isOk && second.value.id).not.toBe(first.value.id);
  });
});
