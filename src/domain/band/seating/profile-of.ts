import { InstrumentKind } from '@domain/band/seating/instrument-kind';
import type { InstrumentProfile } from '@domain/band/seating/instrument-profile';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import type { KeyboardInstrument } from '@domain/keys/keyboard-instrument';
import { keyboardFor } from '@domain/keys/keyboard-instruments';
import { playableRange } from '@domain/music/fretted-range';

/**
 * Weight in the mix against one woodwind (Rimsky-Korsakov: in forte one trumpet = one trombone = one tuba = two
 * horns, one horn = two woodwinds). Plucked, struck and bowed instruments are placed between, as the research
 * report suggests until listening tests say otherwise.
 */
const WEIGHT: Readonly<Record<InstrumentKind, number>> = { brass: 4, wind: 1, bowed: 1.5, fretted: 1.5, keys: 1.5, mallet: 1.5, zither: 1.5, drum: 1 };
const HORN_WEIGHT = 2;
const HORN = 'horn';

/**
 * An instrument's profile, read from the catalogues it is defined in — so an instrument added to them is arranged
 * for with no list to update: a keyboard's range and body (a wind is one held note at a time), a fretted neck's
 * playable range (chords, plucked), a drum.
 */
export function profileOf(id: string): InstrumentProfile {
  if (id === DRUMS_ID || handDrumFor(id)) return { id, kind: InstrumentKind.drum, low: 0, high: 0, isMonophonic: true, isSustained: false, isDrum: true, weight: WEIGHT.drum };
  const kb = keyboardFor(id);
  if (kb) {
    const kind = keyboardKind(kb);
    const isMono = kb.isMonophonic === true;
    return { id, kind, low: kb.low, high: kb.high, isMonophonic: isMono, isSustained: isMono, isDrum: false, weight: id === HORN ? HORN_WEIGHT : WEIGHT[kind] };
  }
  const range = playableRange(instrumentById(id));
  return { id, kind: InstrumentKind.fretted, low: range.low, high: range.high, isMonophonic: false, isSustained: false, isDrum: false, weight: WEIGHT.fretted };
}

function keyboardKind(kb: KeyboardInstrument): InstrumentKind {
  if (kb.body === 'brass') return InstrumentKind.brass;
  if (kb.body === 'kemence') return InstrumentKind.bowed;
  if (kb.body === 'kanun') return InstrumentKind.zither;
  if (kb.isMonophonic) return InstrumentKind.wind;
  if (!kb.isDamped) return InstrumentKind.mallet;
  return InstrumentKind.keys;
}
