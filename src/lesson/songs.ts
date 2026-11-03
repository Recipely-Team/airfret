// Lesson library. Everything here is traditional / public domain or an
// original exercise, written in a compact text notation:
//   chords: "G:4 D:4"   → chord name : length in beats
//   pattern: "D.DU.UDU" → one bar of strums, `subdiv` slots per beat
//   notes:  "E4:1 r:1"  → pitch (or r = rest) : length in beats

import type { PlayMode } from '../audio/instruments';
import { midiToName, noteToMidi } from '../music/theory';

export interface Song {
  id: string;
  title: string;
  /** i18n key, or a literal credit. */
  credit: string;
  level: 1 | 2 | 3;
  bpm: number;
  beatsPerBar: number;
  mode: PlayMode;
  /** Suggested instrument id. */
  instrument: string;
  chords?: string;
  pattern?: string;
  subdiv?: number;
  notes?: string;
  /** i18n key for a one-line description. */
  about: string;
}

export const SONGS: Song[] = [
  {
    id: 'first-strums',
    title: 'Em – Am',
    credit: 'credit.exercise',
    level: 1,
    bpm: 70,
    beatsPerBar: 4,
    mode: 'chord',
    instrument: 'acoustic',
    chords: 'Em:8 Am:8 Em:8 Am:8 Em:4 Am:4 Em:4 Am:4 Em:4',
    pattern: 'D.D.D.D.',
    subdiv: 2,
    about: 'about.firstStrums',
  },
  {
    id: 'four-chords',
    title: 'G – D – Em – C',
    credit: 'credit.exercise',
    level: 1,
    bpm: 82,
    beatsPerBar: 4,
    mode: 'chord',
    instrument: 'acoustic',
    chords: 'G:4 D:4 Em:4 C:4 G:4 D:4 Em:4 C:4 G:4 D:4 Em:4 C:4 G:4 D:4 C:4 G:4',
    pattern: 'D.DU.UDU',
    subdiv: 2,
    about: 'about.fourChords',
  },
  {
    id: 'rising-sun',
    title: 'House of the Rising Sun',
    credit: 'credit.traditional',
    level: 2,
    bpm: 150,
    beatsPerBar: 6,
    mode: 'chord',
    instrument: 'clean',
    chords:
      'Am:6 C:6 D:6 F:6 Am:6 C:6 E:6 E:6 Am:6 C:6 D:6 F:6 Am:6 E:6 Am:6 E:6 ' +
      'Am:6 C:6 D:6 F:6 Am:6 C:6 E:6 E:6 Am:6 C:6 D:6 F:6 Am:6 E:6 Am:12',
    pattern: 'D.UD.U',
    subdiv: 1,
    about: 'about.risingSun',
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    credit: 'credit.traditional',
    level: 2,
    bpm: 92,
    beatsPerBar: 3,
    mode: 'chord',
    instrument: 'nylon',
    chords: 'G:3 G7:3 C:3 G:3 G:3 Em:3 D:6 G:3 G7:3 C:3 G:3 Em:3 D:3 G:6',
    pattern: 'D.D.DU',
    subdiv: 2,
    about: 'about.amazingGrace',
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    credit: 'credit.traditional',
    level: 2,
    bpm: 96,
    beatsPerBar: 3,
    mode: 'chord',
    instrument: 'nylon',
    chords: 'Am:3 G:3 Am:3 E:3 Am:3 G:3 Am:3 E:3 Am:3 C:3 G:3 Am:3 E:3 C:3 G:3 Am:3 E:3 Am:6',
    pattern: 'D.D.D.',
    subdiv: 2,
    about: 'about.greensleeves',
  },
  {
    id: 'blues-a',
    title: '12-Bar Blues in A',
    credit: 'credit.exercise',
    level: 2,
    bpm: 96,
    beatsPerBar: 4,
    mode: 'chord',
    instrument: 'clean',
    chords: 'A7:16 D7:8 A7:8 E7:4 D7:4 A7:4 E7:4 A7:4',
    pattern: 'D.DUD.DU',
    subdiv: 2,
    about: 'about.blues',
  },
  {
    id: 'power-riff',
    title: 'Power Chords',
    credit: 'credit.exercise',
    level: 3,
    bpm: 112,
    beatsPerBar: 4,
    mode: 'chord',
    instrument: 'drive',
    chords: 'E5:4 G5:4 A5:4 A5:4 E5:4 G5:4 D5:2 C5:2 E5:4 E5:4 G5:4 A5:4 A5:4 C5:4 B5:4 E5:4',
    pattern: 'DDDDDDDD',
    subdiv: 2,
    about: 'about.power',
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    credit: 'credit.traditional',
    level: 1,
    bpm: 80,
    beatsPerBar: 4,
    mode: 'note',
    instrument: 'nylon',
    notes:
      'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 ' +
      'G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 ' +
      'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
    about: 'about.twinkle',
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    credit: 'credit.beethoven',
    level: 2,
    bpm: 84,
    beatsPerBar: 4,
    mode: 'note',
    instrument: 'clean',
    notes:
      'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 ' +
      'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2',
    about: 'about.ode',
  },
  {
    id: 'bass-roots',
    title: 'Root Notes: G – D – Em – C',
    credit: 'credit.exercise',
    level: 1,
    bpm: 82,
    beatsPerBar: 4,
    mode: 'note',
    instrument: 'bass',
    notes: repeat('G1:2 G1:2 D2:2 D2:2 E1:2 E1:2 C2:2 C2:2', 3),
    about: 'about.bassRoots',
  },
  {
    id: 'bass-boogie',
    title: 'Boogie Bass in A',
    credit: 'credit.exercise',
    level: 3,
    bpm: 96,
    beatsPerBar: 4,
    mode: 'note',
    instrument: 'bass',
    notes: boogie(['A1', 'A1', 'A1', 'A1', 'D2', 'D2', 'A1', 'A1', 'E2', 'D2', 'A1', 'E2']),
    about: 'about.boogie',
  },
];

function repeat(s: string, n: number): string {
  return Array.from({ length: n }, () => s).join(' ');
}

/** Classic walking boogie: up the arpeggio + sixth, flat seventh back down. */
function boogie(bars: string[]): string {
  const up = [0, 4, 7, 9];
  const down = [10, 9, 7, 4];
  return bars
    .map((root, i) => {
      const steps = i % 2 === 0 ? up : down;
      return steps.map((s) => `${transpose(root, s)}:1`).join(' ');
    })
    .join(' ');
}

function transpose(note: string, semis: number): string {
  return midiToName(noteToMidi(note) + semis);
}

/** Free-play chord palettes, laid out on the neck in this order. */
export const CHORD_SETS: { id: string; name: string; chords: string[] }[] = [
  { id: 'pop', name: 'G · D · Em · C', chords: ['G', 'D', 'Em', 'C', 'Am', 'Bm', 'D7', 'Cadd9'] },
  { id: 'campfire', name: 'C · Am · F · G', chords: ['C', 'Am', 'F', 'G', 'Dm', 'Em', 'E', 'G7'] },
  { id: 'minor', name: 'Am · Dm · E', chords: ['Am', 'Dm', 'E', 'Am7', 'C', 'G', 'F', 'E7'] },
  { id: 'blues', name: 'A7 · D7 · E7', chords: ['A7', 'D7', 'E7', 'A', 'D', 'E'] },
  { id: 'rock', name: 'E5 · G5 · A5', chords: ['E5', 'G5', 'A5', 'D5', 'C5', 'B5', 'F5'] },
];
