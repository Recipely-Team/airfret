import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';

// Titles are proper names; the letters the structure rule keeps to the locale files are written as escapes.

/**
 * The national anthem's melody — the official voice part (Presidency of the Republic, voice and piano, Zeki Üngör),
 * checked bar by bar against an independent encoding. Bars 1–12 carry the first quatrain; the second sings the same.
 * Decree 2010/1126 (Resmî Gazete 27780) puts the anthem outside the economic rights of Law 5846: free to reproduce
 * and perform. Played as written, with the tonic and dominant under it.
 */
const ANTHEM_VERSE =
  'G4+G2:1 A4:1 Bb4:1 F#4:0.75 A4:0.25 G4+G2:3 G4:1 C5+C3:1 D5:1 Eb5:0.75 D5:0.25 B4:0.75 D5:0.25 ' +
  'C5+C3:3 D5:1/3 C#5:1/3 D5:1/3 A4+D3:1 A4:1.75 C5:0.25 Bb4:0.75 F#4:0.25 ' +
  'G4+G2:0.75 A4:0.25 Bb4:0.75 C5:0.25 D5:0.75 Eb5:0.25 F5:0.75 G5:0.25 F5+F2:1 F4:1/3 E4:1/3 F4:1/3 D5:1 C5:1 ' +
  'Bb4+Bb2:3 D4:1/3 C#4:1/3 D4:1/3 A4+D3:1 D4:1 D5:0.75 C5:0.25 Bb4:1/3 A4:1/3 Bb4:1/3 ' +
  'G4+G2:1 G5:1.75 F5:0.25 Eb5:0.75 D5:0.25 C5+C3:0.75 Bb4:0.25 A4:0.75 G4:0.25 D5+D3:1 D4:1 ';

/** Kâtibim's verse with its two endings, then its refrain — read from the CC0 score on Wikimedia Commons. */
const KATIBIM_VERSE = 'G4+G2:0.75 D5:0.25 D5:0.5 D5:0.5 Eb5+D3:0.25 D5:0.25 Eb5:0.25 F#5:0.25 D5:0.5 D5:0.5 ';
const KATIBIM_REFRAIN =
  'G4+G2:0.75 A4:0.25 Bb4:0.5 C5:0.5 D5+G2:0.25 Eb5:0.25 D5:0.25 C5:0.25 Bb4:0.25 A4:0.25 G4:0.5 ' +
  'A4+D3:0.25 C5:0.25 Bb4:0.25 A4:0.25 A4:0.25 G4:0.25 F#4:0.25 G4:0.25 A4+D3:2 ';

/**
 * One stanza of the Izmir March (the Commons MIDI, CC BY-SA 4.0): two lines on the same phrase, then the two that answer.
 * Every verse is sung to it; the full march — as in the public-domain recording on Commons — is four of them.
 */
const IZMIR_STANZA =
  'A4+A2:1 E5:0.5 E5:0.5 E5:0.5 E5:0.5 E5:0.5 E5:0.5 F5+D3:0.5 E5:0.5 D5:0.5 F5:0.5 E5+A2:2 ' +
  'A4+A2:1 E5:0.5 E5:0.5 E5:0.5 E5:0.5 E5:0.5 E5:0.5 F5+D3:0.5 E5:0.5 D5:0.5 F5:0.5 E5+A2:2 ' +
  'E5+A2:1 A5:0.5 A5:0.5 G5+C3:0.5 F5:0.5 E5:0.5 D5:0.5 E5+E2:0.5 D5:0.5 C5:0.5 B4:0.5 C5+A2:1 E5:1 ' +
  'A4+A2:1 E5:0.5 E5:0.5 D5+E2:0.5 C5:0.5 B4:0.5 A4:0.5 C5+E2:0.5 B4:0.5 A4:0.5 G#4:0.5 A4+A2:1.5 ';

/**
 * The Youth March's tune: Otto Lindblad's "Längtan till landet" ("Vintern rasat", 1839) — the top voice of the
 * Swedish Musical Heritage edition (Royal Swedish Academy of Music, 2019, public domain), in its D major, each chord's
 * root under it as its bass staff gives it. Two halves, each played twice, as written.
 */
const GENCLIK_A =
  'D5+D3:1 D5:1 F#5+E3:1.5 E5:0.5 E5+A2:0.75 D5:0.25 C#5:0.75 D5:0.25 E5:1 E5:1 ' +
  'F#5+D3:1 F#5:1 G5:1.5 F#5:0.5 F#5+E3:0.75 E5:0.25 E5:0.75 E5:0.25 E5+A2:1 r:1 ' +
  'D5+D3:1 D5:1 F#5+E3:1.5 E5:0.5 E5+A2:0.75 D5:0.25 C#5:0.75 D5:0.25 E5:1 E5:1 ' +
  'E5+E3:1 F#5+D3:1 F#5+A2:0.75 E5:0.25 B4+B2:0.75 B4:0.25 C#5+A2:1 B4+E3:1 A4+A2:1 r:1 ';
const GENCLIK_B =
  'A4+D3:0.75 B4:0.25 A4:0.75 B4:0.25 A4:1 F#5:1 F#5+D3:1 E5+A2:0.75 D5:0.25 D5+E3:1 C#5+A2:1 ' +
  'A4+A2:0.75 B4:0.25 A4:0.75 B4:0.25 A4:1 G5:1 G5:1 F#5:0.5 E5:0.5 D5+D3:1 r:1 ' +
  'A4+D3:0.75 B4:0.25 A4:0.75 B4:0.25 A4:1 F#5:1 E5+A2:1 F#5:0.5 G5:0.5 A5+D3:1 F#5:1 ' +
  'E5+E3:1.5 E5:0.5 E5:1.5 E5:0.5 F#5+D3:0.75 F#5:0.25 F#5+A2:0.75 E5:0.25 D5+D3:1 r:1 ';

/**
 * Turkish history in song: the national anthem, the Izmir March, and two of the oldest türküs — each from a score or
 * file whose rights are stated (docs/song-sources.md), never from memory.
 */
export const TURKISH_MELODIES: readonly Song[] = [
  { id: 'istiklal-marsi', isMarch: true, title: '\u0130stiklal Mar\u015f\u0131', credit: 'credit.ungor', level: 2, bpm: 80, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: `r:3 D4:1 ${ANTHEM_VERSE}G4+G2:3 D4:1 ${ANTHEM_VERSE}G4+G2:3`, about: 'about.istiklalMarsi' },
  { id: 'katibim', title: '\u00dcsk\u00fcdar\u2019a Gider \u0130ken (K\u00e2tibim)', credit: 'credit.traditional', level: 2, bpm: 72, beatsPerBar: 2, mode: PlayMode.note, instrument: 'nylon',
    notes: `${KATIBIM_VERSE}C5+C3:0.5 C5:0.5 Bb4:0.5 C5:0.5 D5+G2:0.25 Eb5:0.25 D5:0.25 C5:0.25 Bb4:0.25 A4:0.25 G4:0.5 ` +
      `${KATIBIM_VERSE}C5+C3:0.5 C5:0.5 Bb4:0.5 C5:0.5 D5+D3:0.5 r:0.5 D5:0.5 D5:0.5 ${KATIBIM_REFRAIN}` +
      'G4+G2:0.75 A4:0.25 Bb4:0.5 C5:0.5 D5+G2:0.25 Eb5:0.25 D5:0.25 C5:0.25 Bb4:0.25 A4:0.25 G4:0.5 ' +
      'A4+D3:0.25 C5:0.25 Bb4:0.25 A4:0.25 A4:0.25 G4:0.25 F#4:0.25 G4:0.25 G4+G2:2',
    about: 'about.katibim' },
  { id: 'izmir-marsi', isMarch: true, title: '\u0130zmir Mar\u015f\u0131', credit: 'credit.traditional', level: 1, bpm: 112, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: `${IZMIR_STANZA}r:0.5 ${IZMIR_STANZA}r:0.5 ${IZMIR_STANZA}r:0.5 ${IZMIR_STANZA}`.trim().replace(/A4\+A2:1\.5$/, 'A4+A2:4'),
    about: 'about.izmirMarsi' },
  { id: 'genclik-marsi', isMarch: true, title: 'Gen\u00e7lik Mar\u015f\u0131', credit: 'credit.lindblad', level: 2, bpm: 108, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: `${GENCLIK_A}${GENCLIK_A}${GENCLIK_B}${GENCLIK_B}`.trim().replace(/D5\+D3:1 r:1$/, 'D5+D3:2'),
    about: 'about.genclikMarsi' },
  { id: 'genc-osman', title: 'Gen\u00e7 Osman T\u00fcrk\u00fcs\u00fc', credit: 'credit.traditional', level: 2, bpm: 100, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: 'D#5:2/3 D#5:1/3 A#4:1/3 D#5:2/3 D#5:1/3 A#4:1/3 D#5:2/3 D#5:1/3 A#4:1/3 D#5:2/3 C5:2/3 D#5:1/3 D5:1/3 D#5:1/3 A#4:1/3 ' +
      'D#5:2/3 D#5:2/3 D#5:1/3 D5:1/3 C5:2/3 D#5:1/3 D5:1/3 C5:2/3 D5:2/3 F5:1/3 F#5:1/3 F#5:2/3 D#5:2/3 D5:2/3 D#5:1/3 A#4:1/3 ' +
      'D#5:1/3 D5:1/3 C5:1/3 A#4:1/3 D5:2/3 F5:1/3 F#5:1/3 F#5:2/3 D#5:2/3 D5:2/3 D#5:1/3 A#4:1/3 D#5:1/3 D5:2/3 C5:2',
    about: 'about.gencOsman' },
];
