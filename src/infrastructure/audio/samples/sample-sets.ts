/**
 * Which recorded sample set (folder under `public/samples/`) voices each instrument. Instruments not
 * listed keep the synthesised string model.
 *
 * @remarks
 * - The drive guitar plays the clean electric recordings through its amp chain.
 * - The 5-string bass shares the 4-string's recordings; its low B (B0–D#1) is re-pitched from E1 or synthesised.
 * - The saz plays the baglama recordings the kopuz plays (the same family); above them (past G4) the synth voices it.
 */
export const SAMPLE_SET_BY_INSTRUMENT: Readonly<Record<string, string>> = {
  acoustic: 'steel',
  nylon: 'nylon',
  clean: 'electric',
  drive: 'electric',
  bass: 'bass',
  bass5: 'bass',
  bass6: 'bass',
  twelve: 'steel',
  guitar7: 'electric',
  banjo: 'banjo',
  kopuz: 'kopuz',
  saz: 'kopuz',
  ukulele: 'ukulele',
  harpsichord: 'harpsichord',
  kanun: 'kanun',
  ney: 'ney',
  kemence: 'kemence',
  piano: 'piano',
  marimba: 'marimba',
  xylophone: 'xylophone',
  glockenspiel: 'glockenspiel',
  clarinet: 'clarinet',
  flute: 'flute',
  trumpet: 'trumpet',
  oboe: 'oboe',
  bassoon: 'bassoon',
  horn: 'horn',
  trombone: 'trombone',
  tuba: 'tuba',
};
