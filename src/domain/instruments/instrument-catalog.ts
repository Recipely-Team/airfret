import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { BASS_TUNING, GUITAR_TUNING } from '@domain/music/tunings';

const MAX_FRET = 12;

/** Every instrument the app offers, in toolbar order. */
export const INSTRUMENTS: readonly Instrument[] = [
  { id: 'acoustic', name: 'inst.acoustic', tuning: GUITAR_TUNING, maxFret: MAX_FRET, t60: 4.5, bright: 0.62, pick: 0.12, level: 0.42, chain: ChainKind.acoustic, defaultMode: PlayMode.chord },
  { id: 'nylon', name: 'inst.nylon', tuning: GUITAR_TUNING, maxFret: MAX_FRET, t60: 3.2, bright: 0.3, pick: 0.2, level: 0.5, chain: ChainKind.nylon, defaultMode: PlayMode.chord },
  { id: 'clean', name: 'inst.clean', tuning: GUITAR_TUNING, maxFret: MAX_FRET, t60: 5.5, bright: 0.7, pick: 0.1, level: 0.38, chain: ChainKind.clean, defaultMode: PlayMode.chord },
  { id: 'drive', name: 'inst.drive', tuning: GUITAR_TUNING, maxFret: MAX_FRET, t60: 6, bright: 0.72, pick: 0.11, level: 0.3, chain: ChainKind.drive, defaultMode: PlayMode.chord },
  { id: 'bass', name: 'inst.bass', tuning: BASS_TUNING, maxFret: MAX_FRET, t60: 3.5, bright: 0.22, pick: 0.22, level: 0.85, chain: ChainKind.bass, defaultMode: PlayMode.note },
];

const FALLBACK: Instrument = INSTRUMENTS[0] as Instrument;

/** Looks up an instrument, falling back to the acoustic guitar for unknown ids. */
export function instrumentById(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? FALLBACK;
}
