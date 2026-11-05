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

describe('createCustomSong with a melody', () => {
  /** The shape melody tools export; null is a rest. */
  const pasted = JSON.stringify({
    tempo: 108, timeSignature: '4/4',
    notes: [{ note: 'G4', duration: 1 }, { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'D5', duration: 1 }, { note: 'C5', duration: 1 }, { note: 'A4', duration: 2 }, { note: null, duration: 1 }],
  }, null, 2);

  it('turns pasted melody JSON into a note-mode song with its own tempo and meter', () => {
    const r = createCustomSong({ ...base, bpm: 90, beatsPerBar: 3, chords: pasted }, []);
    expect(r.isOk).toBe(true);
    if (!r.isOk) return;
    expect(r.value).toMatchObject({ mode: 'note', bpm: 108, beatsPerBar: 4, notes: 'G4:1 A4:0.5 B4:0.5 D5:1 C5:1 A4:2 r:1' });
    expect(parseSong(r.value, false).isOk).toBe(true);
  });

  it('reads a melody typed in the song notation, with the form’s tempo', () => {
    const r = createCustomSong({ ...base, chords: 'E4:1 D4:1 r:1 G4+G2:2' }, []);
    expect(r.isOk && r.value).toMatchObject({ mode: 'note', bpm: 90, notes: 'E4:1 D4:1 r:1 G4+G2:2' });
  });

  it('still reads chords as chords (an Em is not a note)', () => {
    const r = createCustomSong({ ...base, chords: 'Em:4 C:4' }, []);
    expect(r.isOk && r.value.mode).toBe('chord');
  });

  it('names the note it cannot read, and refuses broken JSON', () => {
    const typed = createCustomSong({ ...base, chords: 'G4:1 H4:1' }, []);
    if (!typed.isOk) expect(typed.failure.detail).toBe('custom.error.note:H4:1');
    expect(typed.isOk).toBe(false);
    const json = createCustomSong({ ...base, chords: '{ "notes": [ { "note": "G4" } ] }' }, []);
    if (!json.isOk) expect(json.failure.detail).toBe('custom.error.json');
    expect(json.isOk).toBe(false);
    expect(createCustomSong({ ...base, chords: '{ not json' }, []).isOk).toBe(false);
  });
});
