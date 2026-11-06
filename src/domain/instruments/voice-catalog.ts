import type { Instrument } from '@domain/instruments/instrument';
import type { InstrumentVoice } from '@domain/instruments/instrument-voice';

const RECORDED: InstrumentVoice = { id: 'recorded', name: 'voice.recorded', isRecorded: true };
/** The synth with the instrument's catalogue parameters, fitted to the recordings. */
const FITTED: InstrumentVoice = { id: 'fitted', name: 'voice.fitted', isRecorded: false };

/**
 * Every voice of every instrument, best first. The order is the measured ranking: `tests/songs/
 * instruments-vs-real.audio.test.ts` scores each voice against recordings of the real instrument and
 * fails when this order no longer matches, so improving a voice means re-ranking it here.
 *
 * @remarks
 * - The first voice is the default; the rest stay selectable as the second and third option.
 * - `classic` keeps the hand-tuned decay the steel and nylon synths had before they were fitted.
 */
export const VOICES: Readonly<Record<string, readonly InstrumentVoice[]>> = {
  acoustic: [RECORDED, FITTED, { id: 'classic', name: 'voice.classic', isRecorded: false, synth: { t60: 4.5, t60Exponent: 0.45 } }],
  nylon: [RECORDED, FITTED, { id: 'classic', name: 'voice.classic', isRecorded: false, synth: { t60: 3.2, t60Exponent: 0.45 } }],
  clean: [RECORDED, FITTED],
  drive: [RECORDED, FITTED],
  bass: [RECORDED, FITTED],
  bass5: [RECORDED, FITTED],
  bass6: [RECORDED, FITTED],
  twelve: [RECORDED, FITTED],
  guitar7: [RECORDED, FITTED],
  banjo: [RECORDED, FITTED],
  // No freely licensed saz recordings yet (roadmap): the synth is its only voice.
  saz: [FITTED],
};

/** The instrument's voices, best first; empty for instruments without a choice (the drum kit). */
export function voicesFor(instrumentId: string): readonly InstrumentVoice[] {
  return VOICES[instrumentId] ?? [];
}

/** The instrument as it sounds with voice `voiceId` — or with its best voice when the id is unknown or absent. */
export function withVoice(instrument: Instrument, voiceId: string | undefined): Instrument {
  const voices = voicesFor(instrument.id);
  const voice = voices.find((v) => v.id === voiceId) ?? voices[0];
  if (!voice) return instrument;
  return { ...instrument, ...voice.synth, voice: voice.id, isRecorded: voice.isRecorded };
}
