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
  ukulele: 'auld-lang-syne',
  mandolin: 'minuet-in-g',
  saz: 'greensleeves-melody',
  kopuz: 'sakura',
  kanun: 'fur-elise',
  balalaika: 'jingle-bells-melody',
  bouzouki: 'auld-lang-syne',
  greekBouzouki: 'fur-elise',
  piano: 'fur-elise',
  harpsichord: 'minuet-in-g',
  marimba: 'canon-in-d-melody',
  xylophone: 'jingle-bells-melody',
  glockenspiel: 'jingle-bells-melody',
  flute: 'greensleeves-melody',
  clarinet: 'greensleeves-melody',
  oboe: 'canon-in-d-melody',
  bassoon: 'minuet-in-g',
  trumpet: 'auld-lang-syne',
  horn: 'auld-lang-syne',
  trombone: 'auld-lang-syne',
  tuba: 'bass-boogie',
};
