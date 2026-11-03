import { BASS_TUNING, GUITAR_TUNING } from '../music/theory';

export type ChainKind = 'acoustic' | 'nylon' | 'clean' | 'drive' | 'bass';
export type PlayMode = 'chord' | 'note';

export interface Instrument {
  id: string;
  /** i18n key for the display name. */
  name: string;
  tuning: number[];
  maxFret: number;
  /** Decay to -60 dB at 110 Hz, seconds; higher notes decay faster. */
  t60: number;
  /** 0 = dark/soft, 1 = bright/metallic. */
  bright: number;
  /** Pluck point as a fraction of string length (0.5 = middle, warm). */
  pick: number;
  /** Output level trim per pluck. */
  level: number;
  chain: ChainKind;
  defaultMode: PlayMode;
}

export const INSTRUMENTS: Instrument[] = [
  { id: 'acoustic', name: 'inst.acoustic', tuning: GUITAR_TUNING, maxFret: 12, t60: 4.5, bright: 0.62, pick: 0.12, level: 0.42, chain: 'acoustic', defaultMode: 'chord' },
  { id: 'nylon', name: 'inst.nylon', tuning: GUITAR_TUNING, maxFret: 12, t60: 3.2, bright: 0.3, pick: 0.2, level: 0.5, chain: 'nylon', defaultMode: 'chord' },
  { id: 'clean', name: 'inst.clean', tuning: GUITAR_TUNING, maxFret: 12, t60: 5.5, bright: 0.7, pick: 0.1, level: 0.38, chain: 'clean', defaultMode: 'chord' },
  { id: 'drive', name: 'inst.drive', tuning: GUITAR_TUNING, maxFret: 12, t60: 6, bright: 0.72, pick: 0.11, level: 0.3, chain: 'drive', defaultMode: 'chord' },
  { id: 'bass', name: 'inst.bass', tuning: BASS_TUNING, maxFret: 12, t60: 3.5, bright: 0.22, pick: 0.22, level: 0.85, chain: 'bass', defaultMode: 'note' },
];

export function instrumentById(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}
