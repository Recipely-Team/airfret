import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { BASS_TUNING, GUITAR_TUNING } from '@domain/music/tunings';

const MAX_FRET = 12;
/** Fret counts of the professional instruments each voice models. */
const FRETS = { steel: 20, classical: 19, electric: 22, bass: 24 } as const;

/**
 * Every instrument the app offers, in menu order.
 *
 * @remarks
 * - Decay laws are measured from real recordings (fundamental T60, robust log fit): clean electric
 *   21.4 s·(110/f)^0.8 and bass 7.9 s·(110/f)^0.49 from FreePats; steel acoustic 9.4 s·(110/f)^0.42
 *   (102 notes) and nylon 8.6 s·(110/f)^0.73 (105 notes) from the sample sets in `public/samples/`.
 *   `tests/songs/instruments-vs-real.audio.test.ts` holds every instrument against those recordings.
 */
export const INSTRUMENTS: readonly Instrument[] = [
  { id: 'acoustic', name: 'inst.acoustic', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.steel, t60: 9.4, t60Exponent: 0.42, bright: 0.62, pick: 0.12, level: 0.42, chain: ChainKind.acoustic, defaultMode: PlayMode.chord },
  { id: 'nylon', name: 'inst.nylon', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.classical, t60: 8.6, t60Exponent: 0.73, bright: 0.3, pick: 0.2, level: 0.5, chain: ChainKind.nylon, defaultMode: PlayMode.chord },
  { id: 'clean', name: 'inst.clean', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.electric, t60: 21.4, t60Exponent: 0.8, bright: 0.7, pick: 0.1, level: 0.38, chain: ChainKind.clean, defaultMode: PlayMode.chord },
  { id: 'drive', name: 'inst.drive', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.electric, t60: 21.4, t60Exponent: 0.8, bright: 0.72, pick: 0.11, level: 0.3, chain: ChainKind.drive, defaultMode: PlayMode.chord },
  { id: 'bass', name: 'inst.bass', tuning: BASS_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.22, pick: 0.22, level: 0.85, chain: ChainKind.bass, defaultMode: PlayMode.note },
];

const FALLBACK: Instrument = INSTRUMENTS[0] as Instrument;

/** Looks up an instrument, falling back to the acoustic guitar for unknown ids. */
export function instrumentById(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? FALLBACK;
}
