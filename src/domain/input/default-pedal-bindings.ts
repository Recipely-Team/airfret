import { InputSource } from '@domain/input/input-source';
import type { PedalBindings } from '@domain/input/pedal-bindings';

/** General MIDI percussion notes used by e-drum pedals. */
const GM = { kick: '36', kickAlt: '35', hihatPedal: '44' } as const;

/**
 * Defaults: Space / B and MIDI 36 kick; N for a second kick; left Shift and MIDI 44 work the hi-hat pedal.
 */
export const DEFAULT_PEDAL_BINDINGS: PedalBindings = {
  kick: [{ source: InputSource.key, code: 'Space' }, { source: InputSource.key, code: 'KeyB' }, { source: InputSource.midi, code: GM.kick }],
  kick2: [{ source: InputSource.key, code: 'KeyN' }, { source: InputSource.midi, code: GM.kickAlt }],
  hihatPedal: [{ source: InputSource.key, code: 'ShiftLeft' }, { source: InputSource.midi, code: GM.hihatPedal }],
};
