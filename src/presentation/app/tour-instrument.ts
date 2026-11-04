import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';

const DEFAULT_TOUR_INSTRUMENT = 'acoustic';

/**
 * The instrument the guided tour runs on: the one being played when it is a six-string chord instrument
 * (the tour teaches Em, Am and strumming), otherwise the acoustic guitar.
 */
export function tourInstrument(current: string): string {
  const inst = instrumentById(current);
  const canTour = inst.id === current && inst.defaultMode === PlayMode.chord && inst.tuning.length === GUITAR_STRING_COUNT;
  return canTour ? current : DEFAULT_TOUR_INSTRUMENT;
}
