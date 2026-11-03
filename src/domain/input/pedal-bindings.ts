import type { InputBinding } from '@domain/input/input-binding';
import type { PedalAction } from '@domain/input/pedal-action';

/** Every action's inputs; an action may have several (a key and a MIDI pedal, say). */
export type PedalBindings = Readonly<Record<PedalAction, readonly InputBinding[]>>;
