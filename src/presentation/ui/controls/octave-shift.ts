import type { SettingsStore } from '@application/settings/settings-store';
import { computeKeyboardLayout, shiftLimits } from '@domain/keys/compute-keyboard-layout';
import { PIANO_ID } from '@domain/keys/piano-id';
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
      if (this.store.value.instrument !== PIANO_ID || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowLeft') this.shift(-1);
      if (e.key === 'ArrowRight') this.shift(1);
    });
  }

  render(isOnStage: boolean): void {
    const s = this.store.value;
    const isPiano = s.instrument === PIANO_ID && isOnStage;
    byId('octaves').hidden = !isPiano;
    if (!isPiano) return;
    const l = computeKeyboardLayout(window.innerWidth, window.innerHeight, s.pianoShift);
    const { down, up } = shiftLimits(window.innerWidth);
    byId('octRange').textContent = `${midiToName(l.firstMidi)}–${midiToName(l.lastMidi)}`;
    byId<HTMLButtonElement>('octDown').disabled = s.pianoShift <= down;
    byId<HTMLButtonElement>('octUp').disabled = s.pianoShift >= up;
  }

  private shift(by: number): void {
    const { down, up } = shiftLimits(window.innerWidth);
    const next = Math.max(down, Math.min(up, this.store.value.pianoShift + by));
    if (next !== this.store.value.pianoShift) this.store.update({ pianoShift: next });
  }
}
