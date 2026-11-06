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

/**
 * A mallet instrument: struck bars laid out like a keyboard, voiced from VSCO 2 CE's recordings (CC0; the
 * names in that library are an octave low — measured, see CREDITS.md). The string synth is only the fallback
 * while they load: a short, bright decay standing in for a struck bar.
 */
function mallet(id: string, t60: number, bright: number): Instrument {
  return { ...PIANO, id, name: `inst.${id}`, t60, t60Exponent: 0.5, bright, pick: 0.5, level: 0.45, voice: 'recorded', isRecorded: true };
}

/**
 * A wind or brass instrument played from the keys: each note is a recording of the instrument holding it
 * (VSCO 2 CE, CC0; names an octave low, measured), sounding while the key is down and cut when it rises.
 * The string synth only fills in while the recordings load: a long, soft tone.
 */
function wind(id: string, bright: number): Instrument {
  return { ...PIANO, id, name: `inst.${id}`, t60: 6, t60Exponent: 0.3, bright, pick: 0.5, level: 0.5, voice: 'recorded', isRecorded: true };
}

/** The keyboard instruments, by id: each opens the keys page with its own sound, range and colours. */
export const KEYBOARDS: Readonly<Record<string, KeyboardInstrument>> = {
  [PIANO_ID]: { instrument: PIANO, low: PIANO_LOWEST_MIDI, high: 108, isTouchSensitive: true, look: 'ivory', isDamped: true },
  harpsichord: { instrument: HARPSICHORD, low: 29, high: 89, isTouchSensitive: false, look: 'reversed', isDamped: true },
  marimba: { instrument: mallet('marimba', 2.2, 0.4), low: 45, high: 96, isTouchSensitive: true, look: 'rosewood', isDamped: false },
  xylophone: { instrument: mallet('xylophone', 0.7, 0.85), low: 65, high: 108, isTouchSensitive: true, look: 'rosewood', isDamped: false },
  glockenspiel: { instrument: mallet('glockenspiel', 4, 0.95), low: 79, high: 108, isTouchSensitive: true, look: 'metal', isDamped: false },
  clarinet: { instrument: wind('clarinet', 0.5), low: 50, high: 91, isTouchSensitive: true, look: 'ivory', isDamped: true },
  flute: { instrument: wind('flute', 0.6), low: 60, high: 96, isTouchSensitive: true, look: 'ivory', isDamped: true },
  trumpet: { instrument: wind('trumpet', 0.8), low: 52, high: 84, isTouchSensitive: true, look: 'ivory', isDamped: true },
};

/** The keyboard instrument with this id, if it is one. */
export function keyboardFor(id: string): KeyboardInstrument | undefined {
  return KEYBOARDS[id];
}

/** Whether the instrument is played from a keyboard (the keys page) rather than strings or pads. */
export function isKeyboard(id: string): boolean {
  return id in KEYBOARDS;
}
