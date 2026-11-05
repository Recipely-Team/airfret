import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';

/** One bar of Für Elise's opening turn, in eighths (3/8: one beat per eighth). */
const ELISE_TURN = 'E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 ';
/** Its answer: A minor, then E, each with the bass under the melody's first note. */
const ELISE_ANSWER = 'A4+A2:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 B4+E2:1 r:0.5 E4:0.5 G#4:0.5 B4:0.5 ';
const ELISE_PHRASE = `${ELISE_TURN}${ELISE_ANSWER}C5+A2:1 r:0.5 E4:0.5 E5:0.5 D#5:0.5 ${ELISE_TURN}A4+A2:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 B4+E2:1 r:0.5 E4:0.5 C5:0.5 B4:0.5 `;

/** The Minuet's first four bars, the same in both halves. */
const MINUET_OPENING = 'D5+G2:1 G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5+B2:1 G4:1 G4:1 E5+C3:1 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5+B2:1 G4:1 G4:1 ';

/** The Canon's eight-chord ground, two beats each. */
const CANON_GROUND = 'D:2 A:2 Bm:2 F#m:2 G:2 D:2 G:2 A:2 ';

/** Jingle Bells' chorus opening ("Jingle bells, jingle bells, jingle all the way"). */
const JINGLE_OPENING = 'B4+G2:1 B4:1 B4:2 B4+G2:1 B4:1 B4:2 B4+G2:1 D5:1 G4:1.5 A4:0.5 B4+G2:4 C5+C3:1 C5:1 C5:1.5 C5:0.5 C5+C3:1 B4:1 B4:1 B4:0.5 B4:0.5 ';

/** Greensleeves' two lines share their first four bars. */
const GREEN_OPENING = 'C5+A2:2 D5:1 E5+C3:1.5 F5:0.5 E5:1 D5+G2:2 B4:1 G4+E2:1.5 A4:0.5 B4:1 ';

/**
 * Well-known public-domain melodies, each with the bass of its harmony under the bar's first note — so the
 * self-playing hand plays a small arrangement, not a bare line. Rests before a pickup put it on the right beat.
 */
export const MELODIES: readonly Song[] = [
  { id: 'fur-elise', title: 'Für Elise', credit: 'credit.beethoven', level: 3, bpm: 150, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: `r:2 E5:0.5 D#5:0.5 ${ELISE_PHRASE}A4+A2:1 r:1 E5:0.5 D#5:0.5 ${ELISE_PHRASE}A4+A2:3`,
    about: 'about.furElise' },
  { id: 'minuet-in-g', title: 'Minuet in G', credit: 'credit.petzold', level: 2, bpm: 112, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: `${MINUET_OPENING}C5+A2:1 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4+G2:1 C5:0.5 B4:0.5 A4:0.5 G4:0.5 F#4+D3:1 G4:0.5 A4:0.5 B4:0.5 G4:0.5 A4+D3:3 ` +
      `${MINUET_OPENING}C5+A2:1 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4+G2:1 C5:0.5 B4:0.5 A4:0.5 G4:0.5 A4+D3:1 B4:0.5 A4:0.5 G4:0.5 F#4:0.5 G4+G2:3`,
    about: 'about.minuet' },
  { id: 'canon-in-d', title: 'Canon in D', credit: 'credit.pachelbel', level: 2, bpm: 76, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: `${CANON_GROUND.repeat(4)}D:4`, pattern: 'D.DUD.DU', subdiv: 2, about: 'about.canon' },
  { id: 'canon-in-d-melody', title: 'Canon in D — melody', credit: 'credit.pachelbel', level: 2, bpm: 76, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'F#5+D3:2 E5+A2:2 D5+B2:2 C#5+F#2:2 B4+G2:2 A4+D3:2 B4+G2:2 C#5+A2:2 ' +
      'D5+D3:2 C#5+A2:2 B4+B2:2 A4+F#2:2 G4+G2:2 F#4+D3:2 G4+G2:2 E4+A2:2 D4+D3:4',
    about: 'about.canonMelody' },
  { id: 'auld-lang-syne', title: 'Auld Lang Syne', credit: 'credit.traditional', level: 1, bpm: 84, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'r:3 D4:1 G4+G2:1.5 G4:0.5 G4:1 B4:1 A4+D3:1.5 G4:0.5 A4:1 B4:1 G4+G2:1.5 G4:0.5 B4:1 D5:1 E5+C3:3 E5:1 ' +
      'D5+G2:1.5 B4:0.5 B4:1 G4:1 A4+D3:1.5 G4:0.5 A4:1 B4:1 G4+E2:1.5 E4:0.5 E4:1 D4:1 G4+G2:4',
    about: 'about.auldLangSyne' },
  { id: 'greensleeves-melody', title: 'Greensleeves — melody', credit: 'credit.traditional', level: 2, bpm: 96, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: `r:2 A4:1 ${GREEN_OPENING}C5+A2:2 A4:1 A4+E2:1.5 G#4:0.5 A4:1 B4+E2:2 G#4:1 E4+E2:2 A4:1 ` +
      `${GREEN_OPENING}C5+A2:1.5 B4:0.5 A4:1 G#4+E2:1.5 F#4:0.5 G#4:1 A4+A2:3`,
    about: 'about.greensleevesMelody' },
  { id: 'jingle-bells-melody', title: 'Jingle Bells — melody', credit: 'credit.pierpont', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'clean',
    notes: `${JINGLE_OPENING}B4+G2:1 A4:1 A4:1 B4:1 A4+D3:2 D5:2 ${JINGLE_OPENING}D5+D3:1 D5:1 C5:1 A4:1 G4+G2:4`,
    about: 'about.jingleMelody' },
];
