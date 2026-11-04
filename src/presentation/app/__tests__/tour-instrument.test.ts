import { describe, expect, it } from 'vitest';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { tourInstrument } from '@presentation/app/tour-instrument';

describe('the guided tour instrument', () => {
  it('stays on the six-string chord instrument being played, so a first run on the banjo tours the banjo', () => {
    for (const id of ['acoustic', 'nylon', 'clean', 'drive', 'banjo']) expect(tourInstrument(id)).toBe(id);
  });

  it('falls back to the acoustic guitar where chord strumming cannot be taught', () => {
    for (const id of ['bass', 'bass5', DRUMS_ID, 'unknown']) expect(tourInstrument(id)).toBe('acoustic');
  });
});
