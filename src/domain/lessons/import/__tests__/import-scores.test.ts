import { describe, expect, it } from 'vitest';
import { parseAbc } from '@domain/lessons/import/parse-abc';
import { parseMidi } from '@domain/lessons/import/parse-midi';
import { parseMusicXml } from '@domain/lessons/import/parse-musicxml';
import { scoreToNotes } from '@domain/lessons/import/score-to-notes';

/** A one-track Standard MIDI File: 96 ticks a beat, 100 bpm, 3/4; `events` as [delta ticks, status, a, b]. */
const midi = (events: [number, number, number, number][]) => {
  const vlq = (n: number) => {
    const out = [n & 0x7f];
    while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
    return out;
  };
  const tempo = 600000;
  const body = [
    ...vlq(0), 0xff, 0x51, 3, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff,
    ...vlq(0), 0xff, 0x58, 4, 3, 2, 24, 8,
    ...events.flatMap(([d, s, a, b]) => [...vlq(d), s, a, b]),
    ...vlq(0), 0xff, 0x2f, 0,
  ];
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96];
  const track = [0x4d, 0x54, 0x72, 0x6b, (body.length >>> 24) & 0xff, (body.length >> 16) & 0xff, (body.length >> 8) & 0xff, body.length & 0xff, ...body];
  return new Uint8Array([...head, ...track]);
};

describe('Importing a melody from a standard file', () => {
  it('reads a MIDI file: notes in beats, its tempo and meter, drums left out', () => {
    const file = midi([
      [0, 0x90, 60, 90], [0, 0x90, 48, 80], [96, 0x80, 60, 0], [0, 0x90, 64, 90], [48, 0x80, 64, 0], [0, 0x90, 67, 90],
      [0, 0x99, 38, 100], [48, 0x80, 67, 0], [0, 0x80, 48, 0], [0, 0x89, 38, 0],
    ]);
    const r = parseMidi(file);
    expect(r.isOk).toBe(true);
    if (!r.isOk) return;
    expect(r.value.bpm).toBe(100);
    expect(r.value.beatsPerBar).toBe(3);
    expect(r.value.notes.map((n) => [n.beat, n.midi])).toEqual([[0, 60], [0, 48], [1, 64], [1.5, 67]]);
    expect(scoreToNotes(r.value)).toBe('C4+C3:1 E4:0.5 G4:0.5');
    expect(parseMidi(new Uint8Array([1, 2, 3])).isOk).toBe(false);
  });

  it('reads an ABC tune: key, unit length, broken rhythm, accidentals to the bar line, repeats and endings', () => {
    const abc = ['X:1', 'T:Test Air', 'M:4/4', 'L:1/8', 'Q:1/4=90', 'K:G', '|: G2 A>B c2 ^c c | [1 d4 z4 :| [2 e8 |'].join('\n');
    const r = parseAbc(abc);
    expect(r.isOk).toBe(true);
    if (!r.isOk) return;
    expect(r.value.title).toBe('Test Air');
    expect(r.value.bpm).toBe(90);
    const notes = scoreToNotes(r.value);
    // G A. B/ c ^c (sharp) c (sharp still, same bar) | d — rest; the repeat, then e.
    expect(notes).toBe('G4:1 A4:0.75 B4:0.25 C5:1 C#5:0.5 C#5:0.5 D5:2 r:2 G4:1 A4:0.75 B4:0.25 C5:1 C#5:0.5 C#5:0.5 E5:4');
    expect(parseAbc('X:1\nT:none').isOk).toBe(false);
  });

  it('applies F# from G major and the flats of B♭ minor-ish keys', () => {
    const g = parseAbc('X:1\nM:3/4\nL:1/4\nK:G\nF G A|');
    const dm = parseAbc('X:1\nM:3/4\nL:1/4\nK:Dm\nB A ^F|');
    expect(g.isOk && scoreToNotes(g.value)).toBe('F#4:1 G4:1 A4:1');
    expect(dm.isOk && scoreToNotes(dm.value)).toBe('A#4:1 A4:1 F#4:1');
  });

  it('reads a MusicXML score: chords, ties, rests and the time signature', () => {
    const note = (step: string, octave: number, dur: number, extra = '') => `<note>${extra}<pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${dur}</duration></note>`;
    const xml = `<?xml version="1.0"?><score-partwise><work><work-title>Little Tune</work-title></work><part-list/><part id="P1"><measure number="1">
      <attributes><divisions>2</divisions><time><beats>3</beats><beat-type>4</beat-type></time></attributes><sound tempo="84"/>
      ${note('E', 4, 2)}${note('C', 3, 2, '<chord/>')}${note('G', 4, 2, '<tie type="start"/>')}${note('G', 4, 1, '<tie type="stop"/>')}<note><rest/><duration>1</duration></note>
      </measure></part></score-partwise>`;
    const r = parseMusicXml(xml);
    expect(r.isOk).toBe(true);
    if (!r.isOk) return;
    expect(r.value.title).toBe('Little Tune');
    expect(r.value.bpm).toBe(84);
    expect(r.value.beatsPerBar).toBe(3);
    expect(scoreToNotes(r.value)).toBe('E4+C3:1 G4:1.5');
    expect(parseMusicXml('<html/>').isOk).toBe(false);
  });
});
