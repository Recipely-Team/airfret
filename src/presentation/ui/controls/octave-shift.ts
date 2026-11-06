import type { SettingsStore } from '@application/settings/settings-store';
import { computeKeyboardLayout, shiftLimits } from '@domain/keys/compute-keyboard-layout';
import { isKeyboard, keyboardFor } from '@domain/keys/keyboard-instruments';
import { midiToName } from '@domain/music/pitch';
import { byId } from '@presentation/ui/dom';

/**
 * The piano's octave arrows in the top bar (and ← / → on the keyboard): slide the keys an octave at a time,
 * showing the range in view, so every one of the 88 keys can be reached on any screen.
 */
export class OctaveShift {
  constructor(private readonly store: SettingsStore) {
    byId('octDown').onclick = () => this.shift(-1);
    byId('octUp').onclick = () => this.shift(1);
    window.addEventListener('keydown', (e) => {
      if (!isKeyboard(this.store.value.instrument) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowLeft') this.shift(-1);
      if (e.key === 'ArrowRight') this.shift(1);
    });
  }

  render(isOnStage: boolean): void {
    const s = this.store.value;
    const keys = keyboardFor(s.instrument);
    byId('octaves').hidden = !keys || !isOnStage;
    if (!keys || !isOnStage) return;
    const l = computeKeyboardLayout(window.innerWidth, window.innerHeight, s.pianoShift, keys);
    const { down, up } = shiftLimits(window.innerWidth, keys);
    byId('octRange').textContent = `${midiToName(l.firstMidi)}–${midiToName(l.lastMidi)}`;
    byId<HTMLButtonElement>('octDown').disabled = s.pianoShift <= down;
    byId<HTMLButtonElement>('octUp').disabled = s.pianoShift >= up;
  }

  private shift(by: number): void {
    const { down, up } = shiftLimits(window.innerWidth, keyboardFor(this.store.value.instrument));
    const next = Math.max(down, Math.min(up, this.store.value.pianoShift + by));
    if (next !== this.store.value.pianoShift) this.store.update({ pianoShift: next });
  }
}
