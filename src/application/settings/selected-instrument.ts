import type { Instrument } from '@domain/instruments/instrument';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { withVoice } from '@domain/instruments/voice-catalog';
import { effectiveTuning } from '@domain/music/tuning-catalog';
import type { Settings } from '@domain/settings/settings';

/** The selected instrument in its chosen voice, with the tuning and capo applied to its open strings. */
export function selectedInstrument(st: Settings): Instrument {
  const base = withVoice(instrumentById(st.instrument), st.voices[st.instrument]);
  return { ...base, tuning: effectiveTuning(base.tuning, st.tuning, st.capo) };
}
