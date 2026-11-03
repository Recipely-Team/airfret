import type { DrumPlayer } from '@application/drums/drum-player';
import type { SettingsStore } from '@application/settings/settings-store';
import { actionsFor } from '@domain/input/binding-match';
import type { PedalInputEvent } from '@domain/input/pedal-input-event';

/** Routes raw inputs to the pedal actions they are currently bound to. */
export class PedalRouter {
  constructor(
    private readonly store: SettingsStore,
    private readonly drums: DrumPlayer,
    private readonly clock: () => { audio: number; wall: number },
  ) {}

  handle(e: PedalInputEvent): boolean {
    const actions = actionsFor(this.store.value.pedalBindings, e.binding);
    const { audio, wall } = this.clock();
    for (const a of actions) this.drums.pedal(a, e.isDown, e.velocity, audio, wall);
    return actions.length > 0;
  }
}
