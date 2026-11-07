import type { InstrumentProfile } from '@domain/band/instrument-profile';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { keyboardFor } from '@domain/keys/keyboard-instruments';
import { playableRange } from '@domain/music/fretted-range';

/**
 * An instrument's profile, read from the catalogues it is defined in — so an instrument added to them is arranged
 * for with no list to update: a keyboard's range (a wind is one held note at a time), a fretted neck's playable
 * range (chords, plucked), a drum.
 */
export function profileOf(id: string): InstrumentProfile {
  if (id === DRUMS_ID || handDrumFor(id)) return { id, low: 0, high: 0, isMonophonic: true, isSustained: false, isDrum: true };
  const kb = keyboardFor(id);
  if (kb) return { id, low: kb.low, high: kb.high, isMonophonic: kb.isMonophonic === true, isSustained: kb.isMonophonic === true, isDrum: false };
  const range = playableRange(instrumentById(id));
  return { id, low: range.low, high: range.high, isMonophonic: false, isSustained: false, isDrum: false };
}
