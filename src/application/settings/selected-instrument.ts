import type { Instrument } from '@domain/instruments/instrument';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { withVoice } from '@domain/instruments/voice-catalog';
import { effectiveTuning } from '@domain/music/tuning-catalog';
import type { Settings } from '@domain/settings/settings';
import { PIANO } from '@domain/keys/piano';
import { PIANO_ID } from '@domain/keys/piano-id';

/** The selected instrument in its chosen voice, with the tuning and capo applied to its open strings. */
export function selectedInstrument(st: Settings): Instrument {
  // The piano isn't one of the fretted instruments: no voices to choose, no tunings or capo.
  if (st.instrument === PIANO_ID) return PIANO;
  const base = withVoice(instrumentById(st.instrument), st.voices[st.instrument]);
  return { ...base, tuning: effectiveTuning(base.tuning, st.tuning, st.capo, base.tunings) };
}
