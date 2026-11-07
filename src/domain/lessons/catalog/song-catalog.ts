import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { BACH_PRELUDE } from '@domain/lessons/catalog/pieces/bach-prelude';
import { BACH_PRELUDE_BASS } from '@domain/lessons/catalog/pieces/bach-prelude-bass';
import { CLARO_DE_LUNA } from '@domain/lessons/catalog/pieces/claro-de-luna';
import { CLASSICAL_THEMES } from '@domain/lessons/catalog/pieces/classical-themes';
import { FOLK_MELODIES } from '@domain/lessons/catalog/pieces/folk-melodies';
import { TURKISH_MELODIES } from '@domain/lessons/catalog/pieces/turkish-melodies';
import { MELODIES } from '@domain/lessons/catalog/pieces/melodies';
import { midiToName } from '@domain/music/pitch';

/** Classic walking boogie: up the arpeggio plus the sixth, down from the flat seventh. */
const BOOGIE_UP = [0, 4, 7, 9];
const BOOGIE_DOWN = [10, 9, 7, 4];
const A1 = 33;
const D2 = 38;
const E2 = 40;
const STEADY = 'D.D.D.D.';
const WALTZ = 'D.D.D.';
/**
 * Tempo of the real pieces. The Prelude follows Pablo Casals' 1938 recording (public domain; 164 beats
 * from first note to last in 141.5 s ≈ 70 bpm), which `tests/songs` aligns the app's performance with.
 * Claro de Luna keeps its score's marking.
 */
const PRELUDE_BPM = 70;
const CLARO_BPM = 60;

/**
 * The lesson library — traditional / public-domain tunes and original exercises only.
 *
 * @remarks
 * - Real pieces (`pieces/`) are complete public-domain scores at their real tempo, every voice included:
 *   the player is graded on the melody, the guide plays the full arrangement.
 * - Course lessons (`course`) follow the order guitar teachers use: one chord with steady
 *   downstrokes, two easy chords and the change between them, more chords, then rhythm, then a song.
 */
export const SONGS: readonly Song[] = [
  // Beginner course
  { id: 'c-em', course: 1, title: 'Em', credit: 'credit.exercise', level: 1, bpm: 60, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'Em:16', pattern: STEADY, subdiv: 2, about: 'about.cEm', tips: ['tip.emShape', 'tip.downOnBeat', 'tip.allStrings'] },
  { id: 'c-a-d', course: 2, title: 'A · D', credit: 'credit.exercise', level: 1, bpm: 60, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'A:8 D:8 A:8 D:8', pattern: STEADY, subdiv: 2, about: 'about.cAD', tips: ['tip.aShape', 'tip.dShape', 'tip.dSkip'] },
  { id: 'c-change', course: 3, title: 'A ↔ D', credit: 'credit.exercise', level: 1, bpm: 64, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'A:4 D:4 A:4 D:4 A:4 D:4 A:4 D:4', pattern: STEADY, subdiv: 2, about: 'about.cChange', tips: ['tip.changeEarly', 'tip.lookNext'] },
  { id: 'c-e', course: 4, title: 'E · A · D', credit: 'credit.exercise', level: 1, bpm: 66, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'E:4 A:4 D:4 A:4 E:4 A:4 D:4 E:4', pattern: STEADY, subdiv: 2, about: 'about.cE', tips: ['tip.eShape', 'tip.changeEarly'] },
  { id: 'c-em-am', course: 5, title: 'Em · Am', credit: 'credit.exercise', level: 1, bpm: 68, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'Em:4 Am:4 Em:4 Am:4 Em:4 Am:4 Em:4 Em:4', pattern: STEADY, subdiv: 2, about: 'about.cEmAm', tips: ['tip.amShape', 'tip.sameShape'] },
  { id: 'c-g-c', course: 6, title: 'G · C', credit: 'credit.exercise', level: 2, bpm: 68, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'G:4 C:4 G:4 C:4 G:4 C:4 G:8', pattern: STEADY, subdiv: 2, about: 'about.cGC', tips: ['tip.gShape', 'tip.cShape'] },
  { id: 'c-rhythm', course: 7, title: '↓ ↓ ↓↑ ↓↑', credit: 'credit.exercise', level: 2, bpm: 70, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'G:4 C:4 D:4 G:4 G:4 C:4 D:4 G:4', pattern: 'D.D.DUDU', subdiv: 2, about: 'about.cRhythm', tips: ['tip.handKeepsMoving', 'tip.upLight'] },

  // Songs
  { id: 'happy-birthday', title: 'Happy Birthday', credit: 'credit.traditional', level: 1, bpm: 100, beatsPerBar: 3, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'G:3 D7:3 D7:3 G:3 G7:3 C:3 G:3 D7:3 G:6', pattern: WALTZ, subdiv: 2, about: 'about.birthday' },
  // The tune itself, with the bass of each chord under the bar's first note; two beats' rest put the pickup on beat 3.
  { id: 'happy-birthday-melody', title: 'Happy Birthday — melody', credit: 'credit.traditional', level: 1, bpm: 100, beatsPerBar: 3, mode: PlayMode.note, instrument: 'acoustic',
    notes: 'r:2 D4:0.75 D4:0.25 E4+G2:1 D4:1 G4:1 F#4+D3:2 D4:0.75 D4:0.25 E4+D3:1 D4:1 A4:1 G4+G2:2 D4:0.75 D4:0.25 ' +
      'D5+G2:1 B4:1 G4:1 F#4+C3:1 E4:1 C5:0.75 C5:0.25 B4+G2:1 G4:1 A4+D3:1 G4+G2:3',
    about: 'about.birthdayMelody' },
  { id: 'jingle-bells', title: 'Jingle Bells', credit: 'credit.pierpont', level: 1, bpm: 112, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'G:16 C:4 G:4 A7:4 D7:4 G:16 C:4 G:4 D7:4 G:4', pattern: 'D.DUD.DU', subdiv: 2, about: 'about.jingle' },
  { id: 'silent-night', title: 'Silent Night', credit: 'credit.gruber', level: 1, bpm: 84, beatsPerBar: 3, mode: PlayMode.chord, instrument: 'nylon',
    chords: 'C:6 G7:3 C:3 F:3 C:3 F:3 C:3 G7:3 C:3 G7:3 C:3', pattern: 'D.D.D.', subdiv: 2, about: 'about.silentNight' },
  { id: 'saints', title: 'When the Saints Go Marching In', credit: 'credit.traditional', level: 2, bpm: 104, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'C:16 G7:8 C:8 C7:4 F:4 C:4 G7:4 C:8', pattern: STEADY, subdiv: 2, about: 'about.saints' },
  { id: 'susanna', title: 'Oh! Susanna', credit: 'credit.foster', level: 2, bpm: 100, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'C:8 G7:4 C:4 G7:4 C:4 F:8 C:8 G7:4 C:4', pattern: 'D.DUD.DU', subdiv: 2, about: 'about.susanna' },
  { id: 'four-chords', title: 'G – D – Em – C', credit: 'credit.exercise', level: 2, bpm: 82, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'acoustic',
    chords: 'G:4 D:4 Em:4 C:4 G:4 D:4 Em:4 C:4 G:4 D:4 Em:4 C:4 G:4 D:4 C:4 G:4', pattern: 'D.DU.UDU', subdiv: 2, about: 'about.fourChords' },
  { id: 'scarborough', title: 'Scarborough Fair', credit: 'credit.traditional', level: 2, bpm: 96, beatsPerBar: 3, mode: PlayMode.chord, instrument: 'nylon',
    chords: 'Am:6 G:3 Am:3 C:3 Am:3 D:3 Am:3 Am:3 C:3 G:3 F:3 Am:3 G:3 Am:6', pattern: WALTZ, subdiv: 2, about: 'about.scarborough' },
  { id: 'amazing-grace', title: 'Amazing Grace', credit: 'credit.traditional', level: 2, bpm: 92, beatsPerBar: 3, mode: PlayMode.chord, instrument: 'nylon',
    chords: 'G:3 G7:3 C:3 G:3 G:3 Em:3 D:6 G:3 G7:3 C:3 G:3 Em:3 D:3 G:6', pattern: 'D.D.DU', subdiv: 2, about: 'about.amazingGrace' },
  { id: 'greensleeves', title: 'Greensleeves', credit: 'credit.traditional', level: 2, bpm: 96, beatsPerBar: 3, mode: PlayMode.chord, instrument: 'nylon',
    chords: 'Am:3 G:3 Am:3 E:3 Am:3 G:3 Am:3 E:3 Am:3 C:3 G:3 Am:3 E:3 C:3 G:3 Am:3 E:3 Am:6', pattern: WALTZ, subdiv: 2, about: 'about.greensleeves' },
  { id: 'rising-sun', title: 'House of the Rising Sun', credit: 'credit.traditional', level: 3, bpm: 150, beatsPerBar: 6, mode: PlayMode.chord, instrument: 'clean',
    chords: 'Am:6 C:6 D:6 F:6 Am:6 C:6 E:6 E:6 Am:6 C:6 D:6 F:6 Am:6 E:6 Am:6 E:6 ' +
      'Am:6 C:6 D:6 F:6 Am:6 C:6 E:6 E:6 Am:6 C:6 D:6 F:6 Am:6 E:6 Am:12',
    pattern: 'D.UD.U', subdiv: 1, about: 'about.risingSun' },
  { id: 'blues-a', title: '12-Bar Blues in A', credit: 'credit.exercise', level: 2, bpm: 96, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'clean',
    chords: 'A7:16 D7:8 A7:8 E7:4 D7:4 A7:4 E7:4 A7:4', pattern: 'D.DUD.DU', subdiv: 2, about: 'about.blues' },
  { id: 'power-riff', title: 'Power Chords', credit: 'credit.exercise', level: 3, bpm: 112, beatsPerBar: 4, mode: PlayMode.chord, instrument: 'drive',
    chords: 'E5:4 G5:4 A5:4 A5:4 E5:4 G5:4 D5:2 C5:2 E5:4 E5:4 G5:4 A5:4 A5:4 C5:4 B5:4 E5:4', pattern: 'DDDDDDDD', subdiv: 2, about: 'about.power' },

  // Melodies
  { id: 'twinkle', title: 'Twinkle Twinkle Little Star', credit: 'credit.traditional', level: 1, bpm: 80, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon',
    notes: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 ' +
      repeat('G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2', 2) + ' C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
    about: 'about.twinkle' },
  { id: 'ode-to-joy', title: 'Ode to Joy', credit: 'credit.beethoven', level: 2, bpm: 84, beatsPerBar: 4, mode: PlayMode.note, instrument: 'clean',
    notes: 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 ' +
      'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2',
    about: 'about.ode' },
  ...MELODIES,
  ...CLASSICAL_THEMES,
  ...FOLK_MELODIES,
  ...TURKISH_MELODIES,

  // Real pieces — complete, at full tempo
  { id: 'bach-prelude', title: 'Cello Suite No. 1 — Prélude', credit: 'credit.bach', level: 3, bpm: PRELUDE_BPM, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic',
    notes: BACH_PRELUDE, about: 'about.bachPrelude' },
  { id: 'claro-de-luna', title: 'Claro de Luna', credit: 'credit.tarrega', level: 3, bpm: CLARO_BPM, beatsPerBar: 4, mode: PlayMode.note, instrument: 'nylon', tuning: 'dropD',
    notes: CLARO_DE_LUNA, about: 'about.claroDeLuna' },
  { id: 'bach-prelude-bass', title: 'Cello Suite No. 1 — Prélude (bass)', credit: 'credit.bach', level: 3, bpm: PRELUDE_BPM, beatsPerBar: 4, mode: PlayMode.note, instrument: 'bass',
    notes: BACH_PRELUDE_BASS, about: 'about.bachPreludeBass' },

  // Bass
  { id: 'bass-roots', title: 'Root Notes: G – D – Em – C', credit: 'credit.exercise', level: 1, bpm: 82, beatsPerBar: 4, mode: PlayMode.note, instrument: 'bass',
    notes: repeat('G1:2 G1:2 D2:2 D2:2 E1:2 E1:2 C2:2 C2:2', 3), about: 'about.bassRoots' },
  { id: 'bass-boogie', title: 'Boogie Bass in A', credit: 'credit.exercise', level: 3, bpm: 96, beatsPerBar: 4, mode: PlayMode.note, instrument: 'bass',
    notes: boogie([A1, A1, A1, A1, D2, D2, A1, A1, E2, D2, A1, E2]), about: 'about.boogie' },
];

function repeat(s: string, n: number): string {
  return Array.from({ length: n }, () => s).join(' ');
}

function boogie(roots: readonly number[]): string {
  return roots
    .map((root, bar) => (bar % 2 === 0 ? BOOGIE_UP : BOOGIE_DOWN).map((s) => `${midiToName(root + s)}:1`).join(' '))
    .join(' ');
}
