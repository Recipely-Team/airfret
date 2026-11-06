import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { PIANO_ID } from '@domain/keys/piano-id';

/** A0, the lowest of the 88 keys. */
export const PIANO_LOWEST_MIDI = 21;
const KEY_COUNT = 88;

/**
 * The piano as the sound engine sees it: 88 "strings", one per key, A0 to C8 — so key `k` is string `k`,
 * panned low left to high right as a pianist hears it, and each key keeps its own note ringing.
 *
 * @remarks
 * - Not in the guitar catalogue (`INSTRUMENTS`): it has no frets, chords shapes or strumming; the piano page
 *   plays it through `PianoPlayer`.
 * - The synth fallback rings long in the bass and short at the top, like a piano's strings.
 */
export const PIANO: Instrument = {
  id: PIANO_ID, name: 'inst.piano', tuning: Array.from({ length: KEY_COUNT }, (_, i) => PIANO_LOWEST_MIDI + i),
  maxFret: 0, frets: 0, t60: 14, t60Exponent: 0.6, bright: 0.5, pick: 0.12, level: 0.32,
  chain: ChainKind.piano, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true,
};
