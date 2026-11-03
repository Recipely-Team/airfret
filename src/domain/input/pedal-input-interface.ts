import type { InputBinding } from '@domain/input/input-binding';
import type { PedalInputEvent } from '@domain/input/pedal-input-event';

/**
 * **PedalInputInterface** — port for foot (and other assignable) inputs: keyboard, mouse buttons,
 * gamepads and MIDI.
 *
 * @remarks
 * - `listen` delivers every press and release.
 * - `capture` resolves with the next input pressed on any source — used to assign a new binding — or null if cancelled.
 */
export interface PedalInputInterface {
  /** The handler returns true when it used the input, so the browser's default (e.g. Space scrolling) is suppressed. */
  listen(handler: (e: PedalInputEvent) => boolean): void;
  capture(): Promise<InputBinding | null>;
  cancelCapture(): void;
  /** Asks for MIDI access (the browser may prompt); resolves false when unavailable. */
  enableMidi(): Promise<boolean>;
}
