import type { InputBinding } from '@domain/input/input-binding';

/** An input going down or up. Velocity is 0–1 (MIDI velocity; 0.8 for keys and buttons). */
export interface PedalInputEvent {
  readonly binding: InputBinding;
  readonly isDown: boolean;
  readonly velocity: number;
}
