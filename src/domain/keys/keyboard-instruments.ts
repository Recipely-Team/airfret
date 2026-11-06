import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import type { KeyboardInstrument } from '@domain/keys/keyboard-instrument';
import { PIANO, PIANO_LOWEST_MIDI } from '@domain/keys/piano';
import { PIANO_ID } from '@domain/keys/piano-id';

/**
 * A harpsichord: strings plucked by quills, so the string synth voices it truly — bright, nasal (plucked near
 * the end), no dynamics, damped when the key rises. It shares the piano's 88 engine strings (key k = string k)
 * but its keyboard runs F1–F6, five octaves like the classic French double manual.
 */
const HARPSICHORD: Instrument = {
  ...PIANO, id: 'harpsichord', name: 'inst.harpsichord', t60: 7, t60Exponent: 0.55, bright: 0.96, pick: 0.05, level: 0.6,
  chain: ChainKind.harpsichord, defaultMode: PlayMode.note, voice: 'fitted', isRecorded: false,
};

/** The keyboard instruments, by id: each opens the keys page with its own sound, range and colours. */
export const KEYBOARDS: Readonly<Record<string, KeyboardInstrument>> = {
  [PIANO_ID]: { instrument: PIANO, low: PIANO_LOWEST_MIDI, high: 108, isTouchSensitive: true, isReversedColours: false },
  harpsichord: { instrument: HARPSICHORD, low: 29, high: 89, isTouchSensitive: false, isReversedColours: true },
};

/** The keyboard instrument with this id, if it is one. */
export function keyboardFor(id: string): KeyboardInstrument | undefined {
  return KEYBOARDS[id];
}

/** Whether the instrument is played from a keyboard (the keys page) rather than strings or pads. */
export function isKeyboard(id: string): boolean {
  return id in KEYBOARDS;
}
