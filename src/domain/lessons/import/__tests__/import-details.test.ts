import { describe, expect, it } from 'vitest';
import { parseAbc } from '@domain/lessons/import/parse-abc';
import { parseMidi } from '@domain/lessons/import/parse-midi';
import { parseMusicXml } from '@domain/lessons/import/parse-musicxml';
import { scoreToNotes } from '@domain/lessons/import/score-to-notes';

const abc = (body: string, head = 'M:4/4\nL:1/8') => {
  const r = parseAbc(`X:1\n${head}\nK:C\n${body}`);
  return r.isOk ? scoreToNotes(r.value) : 'FAIL';
};

describe('ABC details', () => {
  it('reads chords, triplets, ties, octave marks, naturals and flats', () => {
    expect(abc('[CEG]4 (3cde c\'2 C,2 | =F2 _B2 B2- B2 |')).toBe('G4+C4:2 C5:1/3 D5:1/3 E5:1/3 C6:1 C3:1 F4:1 A#4:1 A#4:2');
  });
  it('reads a short pair the other way round (a<b), rests, and an unrelated line it skips', () => {
    expect(abc('A<B z2 c2 c2|\n%comment')).toBe('A4:0.25 B4:0.75 r:1 C5:1 C5:1');
  });
  it('takes common time, a default unit of a sixteenth in 2/4, and a bare tempo', () => {
    const c = parseAbc('X:1\nM:C\nL:1/4\nQ:100\nK:Gmix\nF G|');
    expect(c.isOk && c.value.beatsPerBar).toBe(4);
    expect(c.isOk && c.value.bpm).toBe(100);
    expect(c.isOk && scoreToNotes(c.value)).toBe('F4:1 G4:1');
    const two = parseAbc('X:1\nM:2/4\nK:Ador\nc4 B4|');
    expect(two.isOk && scoreToNotes(two.value)).toBe('C5:1 B4:1');
  });
  it('fails on a tune with no notes', () => {
    expect(parseAbc('X:1\nK:C\n| |').isOk).toBe(false);
  });
});

describe('MIDI details', () => {
  it('reads running status and a program change, and plays at 120 without a tempo', () => {
    const body = [0, 0xc0, 24, 0, 0x90, 62, 80, 96, 62, 0, 0, 0xf0, 2, 1, 2, 0, 0xff, 0x2f, 0];
    const file = new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96, 0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, body.length, ...body]);
    const r = parseMidi(file);
    expect(r.isOk && r.value.bpm).toBe(120);
    expect(r.isOk && scoreToNotes(r.value)).toBe('D4:1');
  });
  it('fails on a file with no notes', () => {
    const body = [0, 0xff, 0x2f, 0];
    expect(parseMidi(new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96, 0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 4, ...body])).isOk).toBe(false);
  });
});

describe('MusicXML details', () => {
  const note = (step: string, octave: number, dur: number, extra = '', alter = '') => `<note>${extra}<pitch><step>${step}</step>${alter}<octave>${octave}</octave></pitch><duration>${dur}</duration></note>`;
  it('reads a second voice after <backup>, skips grace notes, sharpens with <alter>, and leaves a leading rest', () => {
    const xml = `<score-partwise><movement-title>Two Voices</movement-title><part id="P1"><measure>
      <attributes><divisions>1</divisions></attributes><forward><duration>1</duration></forward>
      ${note('F', 4, 1, '', '<alter>1</alter>')}${note('A', 4, 0, '<grace/>')}${note('G', 4, 1)}<backup><duration>2</duration></backup>${note('C', 3, 2)}
      </measure></part></score-partwise>`;
    const r = parseMusicXml(xml);
    expect(r.isOk && r.value.title).toBe('Two Voices');
    expect(r.isOk && r.value.bpm).toBe(120);
    expect(r.isOk && scoreToNotes(r.value)).toBe('r:1 F#4+C3:1 G4:1');
  });
  it('fails on a score with no notes', () => {
    expect(parseMusicXml('<score-partwise><part id="P1"><measure></measure></part></score-partwise>').isOk).toBe(false);
  });
});
