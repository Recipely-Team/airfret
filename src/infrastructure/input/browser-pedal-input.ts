import type { InputBinding } from '@domain/input/input-binding';
import { InputSource } from '@domain/input/input-source';
import type { PedalInputEvent } from '@domain/input/pedal-input-event';
import type { PedalInputInterface } from '@domain/input/pedal-input-interface';

const KEY_VELOCITY = 0.8;
const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;
const MIDI_MAX = 127;
const LEFT_MOUSE = 0;
const CANCEL_KEY = 'Escape';

/**
 * **BrowserPedalInput** — keyboard, mouse buttons, gamepads and Web MIDI as one input stream.
 *
 * @remarks
 * - Key repeats are ignored; typing in a field never triggers a pedal.
 * - The left mouse button is left for strumming / clicking pads; other buttons are assignable.
 * - Gamepads are polled each animation frame; MIDI note-on velocity 0 counts as note-off.
 */
export class BrowserPedalInput implements PedalInputInterface {
  private handler: (e: PedalInputEvent) => boolean = () => false;
  private capturing: ((b: InputBinding | null) => void) | null = null;
  private readonly padState = new Map<string, boolean>();
  private hasMidi = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat || isTyping(e.target)) return;
      if (this.capturing && e.code === CANCEL_KEY) return this.cancelCapture();
      if (this.emit({ source: InputSource.key, code: e.code }, true, KEY_VELOCITY)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      if (!isTyping(e.target)) this.emit({ source: InputSource.key, code: e.code }, false, 0);
    });
    window.addEventListener('mousedown', (e) => {
      if (e.button !== LEFT_MOUSE && this.emit({ source: InputSource.mouse, code: String(e.button) }, true, KEY_VELOCITY)) e.preventDefault();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== LEFT_MOUSE) this.emit({ source: InputSource.mouse, code: String(e.button) }, false, 0);
    });
    requestAnimationFrame(this.pollGamepads);
  }

  listen(handler: (e: PedalInputEvent) => boolean): void {
    this.handler = handler;
  }

  capture(): Promise<InputBinding | null> {
    this.cancelCapture();
    return new Promise((resolve) => (this.capturing = resolve));
  }

  cancelCapture(): void {
    this.capturing?.(null);
    this.capturing = null;
  }

  async enableMidi(): Promise<boolean> {
    if (this.hasMidi) return true;
    if (!('requestMIDIAccess' in navigator)) return false;
    try {
      const access = await navigator.requestMIDIAccess();
      const attach = () => access.inputs.forEach((input) => (input.onmidimessage = (m) => this.onMidi(m.data)));
      attach();
      access.onstatechange = attach;
      this.hasMidi = true;
      return true;
    } catch {
      return false;
    }
  }

  private onMidi(data: Uint8Array | null): void {
    if (!data || data.length < 3) return;
    const kind = (data[0] ?? 0) & 0xf0;
    const note = String(data[1] ?? 0);
    const velocity = (data[2] ?? 0) / MIDI_MAX;
    if (kind === MIDI_NOTE_ON && velocity > 0) this.emit({ source: InputSource.midi, code: note }, true, velocity);
    else if (kind === MIDI_NOTE_OFF || kind === MIDI_NOTE_ON) this.emit({ source: InputSource.midi, code: note }, false, 0);
  }

  private pollGamepads = (): void => {
    for (const pad of navigator.getGamepads()) {
      pad?.buttons.forEach((b, i) => {
        const key = `${pad.index}:${i}`;
        const was = this.padState.get(key) ?? false;
        if (b.pressed !== was) {
          this.padState.set(key, b.pressed);
          this.emit({ source: InputSource.gamepad, code: String(i) }, b.pressed, b.pressed ? Math.max(KEY_VELOCITY, b.value) : 0);
        }
      });
    }
    requestAnimationFrame(this.pollGamepads);
  };

  private emit(binding: InputBinding, isDown: boolean, velocity: number): boolean {
    if (this.capturing) {
      if (!isDown) return true;
      const done = this.capturing;
      this.capturing = null;
      done(binding);
      return true;
    }
    return this.handler({ binding, isDown, velocity });
  }
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}
