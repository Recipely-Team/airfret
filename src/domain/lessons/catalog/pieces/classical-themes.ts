import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';

/** The Mountain King's creeping theme (A minor), heard twice before it ends. */
const KING = 'A3+A2:0.5 B3:0.5 C4:0.5 D4:0.5 E4:0.5 C4:0.5 E4:1 D#4+B2:0.5 B3:0.5 D#4:1 D4+A#2:0.5 A#3:0.5 D4:1 ' +
  'A3+A2:0.5 B3:0.5 C4:0.5 D4:0.5 E4:0.5 C4:0.5 E4:0.5 A4:0.5 G4+C3:0.5 E4:0.5 C4:0.5 E4:0.5 G4:2 ';
/** Morning Mood's flute call (C major here; Grieg wrote it in E), its two halves. */
const MORNING = 'G4+C3:1 E4:1 D4:1 C4:1 D4:1 E4:1 G4+C3:1 E4:1 D4:1 C4:1 D4:1 E4:1 G4+F2:1 E4:1 G4:1 A4:1 E4:1 A4:1 G4+C3:1 E4:1 D4:1 C4:3 ';
/** The Largo's "Goin' Home" line, its first half. */
const LARGO = 'E4+C3:1.5 G4:0.5 G4:2 E4+C3:1.5 D4:0.5 C4:2 D4+G2:1 E4:1 G4:1 E4:1 D4+G2:4 ';
/** The Gymnopédie's phrase over its rocking G and D chords. */
const GYMNO = 'r:1 F#4:1 A4:1 G4+D3:1 F#4:1 C#4:1 B3+G2:1 C#4:1 D4:1 A3+D3:3 F#3+G2:3 r:3 ';
/** Brahms' Lullaby: its first line and its answer. */
const LULLABY = 'G4+C3:2 E4:0.5 E4:0.5 G4+C3:2 E4:0.5 G4:0.5 C5+F2:1 B4:1.5 A4:0.5 A4+G2:1 G4:1 D4:0.5 E4:0.5 ' +
  'F4+G2:1 D4:1 D4:0.5 E4:0.5 F4+G2:2 D4:0.5 F4:0.5 B4+G2:0.5 A4:0.5 G4:1 B4:1 C5+C3:2 C4:0.5 C4:0.5 ' +
  'C5+F2:2 A4:0.5 F4:0.5 G4+C3:2 E4:0.5 C4:0.5 F4+F2:1 G4:1 A4:1 G4+C3:2 C4:0.5 C4:0.5 ' +
  'C5+F2:2 A4:0.5 F4:0.5 G4+C3:2 E4:0.5 C4:0.5 F4+G2:1 E4:1 D4:1 C4+C3:3';

/**
 * The themes of public-domain classical pieces everyone has heard — the tune with the bass of its harmony, in a key
 * that sits on a guitar (the self-playing keyboards and winds move it to their own range).
 */
export const CLASSICAL_THEMES: readonly Song[] = [
  { id: 'brahms-lullaby', title: 'Lullaby (Wiegenlied)', credit: 'credit.brahms', level: 2, bpm: 84, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: `r:2 E4:0.5 E4:0.5 ${LULLABY}`, about: 'about.brahmsLullaby' },
  { id: 'morning-mood', title: 'Morning Mood', credit: 'credit.grieg', level: 2, bpm: 168, beatsPerBar: 6, mode: PlayMode.note, instrument: 'nylon',
    notes: `${MORNING}${MORNING}`.trim(), about: 'about.morningMood' },
  { id: 'mountain-king', title: 'In the Hall of the Mountain King', credit: 'credit.grieg', level: 2, bpm: 132, beatsPerBar: 4, mode: PlayMode.note, instrument: 'drive',
    notes: `${KING}${KING}A3+A2:4`, about: 'about.mountainKing' },
  { id: 'goin-home', title: 'Largo — "Goin\' Home"', credit: 'credit.dvorak', level: 1, bpm: 60, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: `${LARGO}E4+C3:1.5 G4:0.5 G4:2 E4+C3:1.5 D4:0.5 C4:2 D4+G2:1 E4:1 D4:2 C4+C3:4`, about: 'about.goinHome' },
  { id: 'gymnopedie', title: 'Gymnopédie No. 1', credit: 'credit.satie', level: 2, bpm: 72, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: `${GYMNO}${GYMNO}D4+D3:3`, about: 'about.gymnopedie' },
  { id: 'eine-kleine', title: 'Eine kleine Nachtmusik', credit: 'credit.mozart', level: 2, bpm: 132, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: 'G4+G2:1 r:0.5 D4:0.5 G4:1 r:0.5 D4:0.5 G4+G2:0.5 D4:0.5 G4:0.5 B4:0.5 D5:2 C5+D3:1 r:0.5 A4:0.5 C5:1 r:0.5 A4:0.5 ' +
      'C5+D3:0.5 A4:0.5 F#4:0.5 A4:0.5 D4:2 G4+G2:4',
    about: 'about.eineKleine' },
];
