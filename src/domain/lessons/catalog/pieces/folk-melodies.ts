import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';

/** One line of Frère Jacques, sung twice. */
const JACQUES = 'C4+C3:1 D4:1 E4:1 C4:1 C4+C3:1 D4:1 E4:1 C4:1 E4+C3:1 F4:1 G4:2 E4+C3:1 F4:1 G4:2 ' +
  'G4+C3:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 G4+C3:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 C4+C3:1 G3:1 C4:2 C4+C3:1 G3:1 C4:2';
/** Korobeiniki: its first line (four bars) and the answer that closes it, sung twice. */
const KORO_A = 'E5+E2:1 B4:0.5 C5:0.5 D5:1 C5:0.5 B4:0.5 A4+A2:1 A4:0.5 C5:0.5 E5:1 D5:0.5 C5:0.5 ' +
  'B4+E2:1.5 C5:0.5 D5:1 E5:1 C5+A2:1 A4:1 A4:2 ';
const KORO_B = 'r:0.5 D5+D3:1 F5:0.5 A5:1 G5:0.5 F5:0.5 E5+C3:1.5 C5:0.5 E5:1 D5:0.5 C5:0.5 ' +
  'B4+E2:1 B4:0.5 C5:0.5 D5:1 E5:1 C5+A2:1 A4:1 A4:2 ';
/** Sakura's opening call, heard at its start and its end. */
const SAKURA_CALL = 'A4+A2:1 A4:1 B4:2 A4+A2:1 A4:1 B4:2 ';
const SAKURA_MIDDLE = 'A4+A2:1 B4:1 C5:1 B4:1 A4+D3:1 B4:0.5 A4:0.5 F4:2 E4+A2:1 C4:1 E4:1 F4:1 E4+E2:1 E4:0.5 C4:0.5 B3:2 ';
/** Deck the Halls' first line, sung twice before the middle. */
const DECK = 'G4+C3:1.5 F4:0.5 E4:1 D4:1 C4+C3:1 D4:1 E4:1 C4:1 D4+G2:0.5 E4:0.5 F4:0.5 D4:0.5 E4+C3:1.5 D4:0.5 C4+F2:1 B3+G2:1 C4+C3:2 ';
/** Good King Wenceslas' first line, sung twice. */
const WENCESLAS = 'G4+G2:1 G4:1 G4:1 A4:1 G4+G2:1 G4:1 D4:2 E4+C3:1 D4:1 E4:1 F#4:1 G4+G2:2 G4:2 ';

/**
 * Folk songs, children's songs and carols everyone knows, all traditional or long in the public domain, each with
 * the bass of its harmony under the bar's first note — so a keyboard or a self-playing hand plays a small arrangement.
 */
export const FOLK_MELODIES: readonly Song[] = [
  { id: 'frere-jacques', title: 'Frère Jacques', credit: 'credit.traditional', level: 1, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: JACQUES, about: 'about.frereJacques' },
  { id: 'mary-lamb', title: 'Mary Had a Little Lamb', credit: 'credit.traditional', level: 1, bpm: 110, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'E4+C3:1 D4:1 C4:1 D4:1 E4+C3:1 E4:1 E4:2 D4+G2:1 D4:1 D4:2 E4+C3:1 G4:1 G4:2 ' +
      'E4+C3:1 D4:1 C4:1 D4:1 E4+C3:1 E4:1 E4:1 E4:1 D4+G2:1 D4:1 E4:1 D4:1 C4+C3:4',
    about: 'about.maryLamb' },
  { id: 'row-boat', title: 'Row, Row, Row Your Boat', credit: 'credit.traditional', level: 1, bpm: 180, beatsPerBar: 6, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'C4+C3:3 C4:3 C4+C3:2 D4:1 E4:3 E4+C3:2 D4:1 E4:2 F4:1 G4+C3:6 C5+C3:1 C5:1 C5:1 G4:1 G4:1 G4:1 E4+C3:1 E4:1 E4:1 C4:1 C4:1 C4:1 ' +
      'G4+G2:2 F4:1 E4:2 D4:1 C4+C3:6',
    about: 'about.rowBoat' },
  { id: 'london-bridge', title: 'London Bridge', credit: 'credit.traditional', level: 1, bpm: 110, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'G4+C3:1.5 A4:0.5 G4:1 F4:1 E4+C3:1 F4:1 G4:2 D4+G2:1 E4:1 F4:2 E4+C3:1 F4:1 G4:2 ' +
      'G4+C3:1.5 A4:0.5 G4:1 F4:1 E4+C3:1 F4:1 G4:2 D4+G2:2 G4:2 E4+C3:1 C4:3',
    about: 'about.londonBridge' },
  { id: 'old-macdonald', title: 'Old MacDonald Had a Farm', credit: 'credit.traditional', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'G4+G2:1 G4:1 G4:1 D4:1 E4+C3:1 E4:1 D4:2 B4+G2:1 B4:1 A4+D3:1 A4:1 G4+G2:3 D4:1 ' +
      'G4+G2:1 G4:1 G4:1 D4:1 E4+C3:1 E4:1 D4:2 B4+G2:1 B4:1 A4+D3:1 A4:1 G4+G2:4',
    about: 'about.oldMacdonald' },
  { id: 'yankee-doodle', title: 'Yankee Doodle', credit: 'credit.traditional', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'clean',
    notes: 'G4+G2:1 G4:1 A4:1 B4:1 G4+G2:1 B4:1 A4+D3:1 D4:1 G4+G2:1 G4:1 A4:1 B4:1 G4+G2:2 F#4+D3:2 ' +
      'G4+G2:1 G4:1 A4:1 B4:1 C5+C3:1 B4:1 A4:1 G4:1 F#4+D3:1 D4:1 E4:1 F#4:1 G4+G2:2 G4:2',
    about: 'about.yankeeDoodle' },
  { id: 'this-old-man', title: 'This Old Man', credit: 'credit.traditional', level: 1, bpm: 112, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'G4+C3:1 E4:1 G4:2 G4+C3:1 E4:1 G4:2 A4+F2:1 G4:1 F4:1 E4:1 D4+G2:1 E4:1 F4:2 ' +
      'E4+C3:1 F4:1 G4:1 C4:1 C4+C3:0.5 C4:0.5 C4:1 C4:0.5 D4:0.5 E4:0.5 F4:0.5 G4+G2:1 G4:1 D4:1 D4:1 F4+G2:1 E4:1 D4:1 C4+C3:1',
    about: 'about.thisOldMan' },
  { id: 'camptown', title: 'Camptown Races', credit: 'credit.foster', level: 2, bpm: 132, beatsPerBar: 4, mode: PlayMode.note, instrument: 'clean',
    notes: 'D5+G2:0.5 D5:0.5 B4:0.5 D5:0.5 E5:0.5 D5:0.5 B4:1 B4+D3:0.5 A4:1.5 B4:0.5 A4:1.5 ' +
      'D5+G2:0.5 D5:0.5 B4:0.5 D5:0.5 E5:0.5 D5:0.5 B4:1 A4+D3:0.5 A4:0.5 B4:0.5 A4:0.5 G4+G2:2',
    about: 'about.camptown' },
  { id: 'clementine', title: 'Oh My Darling, Clementine', credit: 'credit.traditional', level: 1, bpm: 108, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: 'G4+G2:0.5 G4:0.5 G4:1 D4:1 B4+G2:0.5 B4:0.5 B4:1 G4:1 G4+G2:0.5 B4:0.5 D5:1.5 D5:0.5 C5+D3:0.5 B4:0.5 A4:2 ' +
      'A4+D3:0.5 B4:0.5 C5:1 C5:1 B4+G2:0.5 A4:0.5 B4:1 G4:1 G4+D3:0.5 B4:0.5 A4:1.5 D4:0.5 F#4+D3:0.5 A4:0.5 G4+G2:2',
    about: 'about.clementine' },
  { id: 'drunken-sailor', title: 'Drunken Sailor', credit: 'credit.traditional', level: 2, bpm: 126, beatsPerBar: 4, mode: PlayMode.note, instrument: 'drive',
    notes: 'A4+D3:1 A4:0.5 A4:0.5 A4:1 A4:0.5 A4:0.5 A4+D3:1 D4:1 F4:1 A4:1 G4+C3:1 G4:0.5 G4:0.5 G4:1 G4:0.5 G4:0.5 G4+C3:1 C4:1 E4:1 G4:1 ' +
      'A4+D3:1 A4:0.5 A4:0.5 A4:1 A4:0.5 A4:0.5 A4+D3:1 B4:1 C5:1 D5:1 C5+C3:1 A4:1 G4+A2:1 E4:1 D4+D3:2 D4:2',
    about: 'about.drunkenSailor' },
  { id: 'alouette', title: 'Alouette', credit: 'credit.traditional', level: 1, bpm: 116, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: 'C4+C3:1 D4:0.5 E4:0.5 E4:1 E4:1 D4+G2:0.5 C4:0.5 D4:0.5 E4:0.5 C4+C3:1 G3:1 ' +
      'C4+C3:1 D4:0.5 E4:0.5 E4:1 E4:1 D4+G2:0.5 C4:0.5 D4:0.5 E4:0.5 C4+C3:2',
    about: 'about.alouette' },
  { id: 'la-cucaracha', title: 'La Cucaracha', credit: 'credit.traditional', level: 2, bpm: 132, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: 'C4+F2:0.5 C4:0.5 C4:0.5 F4:1.5 A4:1 C4+F2:0.5 C4:0.5 C4:0.5 F4:1.5 A4:1 F4+C3:1 F4:0.5 E4:0.5 E4:0.5 D4:0.5 D4:0.5 C4:0.5 C4+C3:2 r:2 ' +
      'C4+C3:0.5 C4:0.5 C4:0.5 E4:1.5 G4:1 C4+C3:0.5 C4:0.5 C4:0.5 E4:1.5 G4:1 C5+C3:1 D5:0.5 C5:0.5 B4:0.5 A4:0.5 G4:0.5 A4:0.5 F4+F2:2',
    about: 'about.laCucaracha' },
  { id: 'sakura', title: 'Sakura Sakura', credit: 'credit.traditional', level: 2, bpm: 72, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: `${SAKURA_CALL}${SAKURA_MIDDLE}${SAKURA_MIDDLE}${SAKURA_CALL}E4+E2:1 F4:1 B4:0.5 A4:0.5 F4:1 E4+A2:4`,
    about: 'about.sakura' },
  { id: 'korobeiniki', title: 'Korobeiniki', credit: 'credit.traditional', level: 2, bpm: 144, beatsPerBar: 4, mode: PlayMode.note, instrument: 'drive',
    notes: `${KORO_A}${KORO_B}${KORO_A}${KORO_B}`.trim(), about: 'about.korobeiniki' },
  { id: 'deck-the-halls', title: 'Deck the Halls', credit: 'credit.traditional', level: 2, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: `${DECK}${DECK}D4+G2:1.5 E4:0.5 F4:1 D4:1 E4+C3:1.5 F4:0.5 G4:1 D4:1 E4+A2:0.5 F#4:0.5 G4:1 A4+D3:0.5 B4:0.5 C5:1 B4+G2:1 A4:1 G4:2 ` +
      'G4+C3:1.5 F4:0.5 E4:1 D4:1 C4+C3:1 D4:1 E4:1 C4:1 A4+F2:0.5 A4:0.5 A4:0.5 A4:0.5 G4+C3:1.5 F4:0.5 E4+G2:1 D4:1 C4+C3:2',
    about: 'about.deckTheHalls' },
  { id: 'merry-christmas', title: 'We Wish You a Merry Christmas', credit: 'credit.traditional', level: 1, bpm: 132, beatsPerBar: 3, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'r:2 D4:1 G4+G2:1 G4:0.5 A4:0.5 G4:0.5 F#4:0.5 E4+C3:1 E4:1 E4:1 A4+A2:1 A4:0.5 B4:0.5 A4:0.5 G4:0.5 F#4+D3:1 D4:1 D4:1 ' +
      'B4+B2:1 B4:0.5 C5:0.5 B4:0.5 A4:0.5 G4+C3:1 E4:1 D4:0.5 D4:0.5 E4+C3:1 A4+D3:1 F#4:1 G4+G2:3',
    about: 'about.merryChristmas' },
  { id: 'good-king', title: 'Good King Wenceslas', credit: 'credit.traditional', level: 1, bpm: 108, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: `${WENCESLAS}${WENCESLAS}D5+G2:1 C5:1 B4:1 A4:1 B4+G2:1 A4:1 G4:2 E4+C3:1 D4:1 E4:1 F#4:1 G4+G2:2 G4:2 ` +
      'D4+G2:1 D4:1 E4:1 F#4:1 G4+E2:1 G4:1 A4:2 D5+D3:1 C5:1 B4:1 A4:1 G4+E2:2 C5+C3:2 G4+G2:4',
    about: 'about.goodKing' },
  { id: 'joy-to-the-world', title: 'Joy to the World', credit: 'credit.mason', level: 2, bpm: 96, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'C5+C3:1 B4:0.75 A4:0.25 G4+E3:1.5 F4:0.5 E4+C3:1 D4+G2:1 C4+C3:1.5 G4:0.5 A4+F2:1.5 A4:0.5 B4+G2:1.5 B4:0.5 C5+C3:4',
    about: 'about.joyToTheWorld' },
  { id: 'hot-cross-buns', title: 'Hot Cross Buns', credit: 'credit.traditional', level: 1, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'E4+C3:1 D4:1 C4:2 E4+C3:1 D4:1 C4:2 C4+C3:0.5 C4:0.5 C4:0.5 C4:0.5 D4+G2:0.5 D4:0.5 D4:0.5 D4:0.5 E4+C3:1 D4+G2:1 C4+C3:2',
    about: 'about.hotCrossBuns' },
  { id: 'au-clair', title: 'Au clair de la lune', credit: 'credit.traditional', level: 1, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: 'C4+C3:1 C4:1 C4:1 D4:1 E4+C3:2 D4+G2:2 C4+C3:1 E4:1 D4+G2:1 D4:1 C4+C3:4 C4+C3:1 C4:1 C4:1 D4:1 E4+C3:2 D4+G2:2 C4+C3:1 E4:1 D4+G2:1 D4:1 C4+C3:4 ' +
      'D4+D3:1 D4:1 D4:1 D4:1 A3+A2:2 A3:2 D4+D3:1 C4:1 B3+G2:1 A3:1 G3+G2:4 C4+C3:1 C4:1 C4:1 D4:1 E4+C3:2 D4+G2:2 C4+C3:1 E4:1 D4+G2:1 D4:1 C4+C3:4',
    about: 'about.auClair' },
  { id: 'silent-night-melody', title: 'Silent Night — melody', credit: 'credit.gruber', level: 2, bpm: 84, beatsPerBar: 3, mode: PlayMode.note, instrument: 'nylon',
    notes: 'G4+C3:1.5 A4:0.5 G4:1 E4:3 G4+C3:1.5 A4:0.5 G4:1 E4:3 D5+G2:2 D5:1 B4:3 C5+C3:2 C5:1 G4:3 ' +
      'A4+F2:2 A4:1 C5:1.5 B4:0.5 A4:1 G4+C3:1.5 A4:0.5 G4:1 E4:3 A4+F2:2 A4:1 C5:1.5 B4:0.5 A4:1 G4+C3:1.5 A4:0.5 G4:1 E4:3 ' +
      'D5+G2:2 D5:1 F5:1.5 D5:0.5 B4:1 C5+C3:3 E5:3 C5+C3:1.5 G4:0.5 E4:1 G4+G2:1.5 F4:0.5 D4:1 C4+C3:6',
    about: 'about.silentNightMelody' },
];
