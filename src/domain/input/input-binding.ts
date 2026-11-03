import type { InputSource } from '@domain/input/input-source';

/**
 * One physical input: a keyboard key (`KeyboardEvent.code`, e.g. "Space"), a mouse button ("1"),
 * a gamepad button ("3"), or a MIDI note number ("36").
 */
export interface InputBinding {
  readonly source: InputSource;
  readonly code: string;
}
