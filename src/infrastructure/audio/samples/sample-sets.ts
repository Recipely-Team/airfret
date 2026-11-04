/**
 * Which recorded sample set (folder under `public/samples/`) voices each instrument. Instruments not
 * listed keep the synthesised string model.
 *
 * @remarks
 * - The drive guitar plays the clean electric recordings through its amp chain.
 */
export const SAMPLE_SET_BY_INSTRUMENT: Readonly<Record<string, string>> = {
  acoustic: 'steel',
  nylon: 'nylon',
  clean: 'electric',
  drive: 'electric',
  bass: 'bass',
};
