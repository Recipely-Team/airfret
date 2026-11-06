/**
 * The piece each instrument plays by itself, chosen to show what it is for: fingerstyle Bach on the steel
 * string, a waltz on nylon, an arpeggiated ballad on the clean electric, power chords on the drive, a
 * banjo song on the banjo, a walking line on the bass. All in standard tuning, so the demo plays on
 * whatever tuning the player hasn't changed.
 */
export const DEMO_SONG_BY_INSTRUMENT: Readonly<Record<string, string>> = {
  acoustic: 'bach-prelude',
  nylon: 'greensleeves',
  clean: 'rising-sun',
  drive: 'power-riff',
  banjo: 'susanna',
  bass: 'bass-boogie',
  bass5: 'bach-prelude-bass',
  bass6: 'bach-prelude-bass',
  twelve: 'canon-in-d',
  guitar7: 'rising-sun',
};
