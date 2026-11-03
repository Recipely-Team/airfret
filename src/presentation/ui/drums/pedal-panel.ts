import type { SettingsStore } from '@application/settings/settings-store';
import { assignBinding, removeBinding } from '@domain/input/binding-match';
import { DEFAULT_PEDAL_BINDINGS } from '@domain/input/default-pedal-bindings';
import { HiHatPedalMode } from '@domain/input/hihat-pedal-mode';
import { PedalAction } from '@domain/input/pedal-action';
import type { PedalInputInterface } from '@domain/input/pedal-input-interface';
import { t } from '@presentation/i18n/translator';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';
import { bindingLabel } from '@presentation/ui/drums/binding-label';
import { byId } from '@presentation/ui/dom';

/**
 * **PedalPanel** — assign any input (key, mouse button, controller button, MIDI pedal) to each foot action.
 *
 * @remarks
 * - "+ Assign" waits for the next input on any source; Esc cancels.
 * - An input belongs to one action: assigning it again moves it.
 */
export class PedalPanel {
  private readonly el = byId('pedals');
  private waitingFor: PedalAction | null = null;

  constructor(
    private readonly store: SettingsStore,
    private readonly input: PedalInputInterface,
  ) {
    byId('pedalsReset').onclick = () => store.update({ pedalBindings: DEFAULT_PEDAL_BINDINGS });
    byId('pedalsMidi').onclick = async () => {
      const isOn = await input.enableMidi();
      byId('pedalsStatus').textContent = t(isOn ? 'pedals.midiOn' : 'pedals.midiOff');
    };
    byId('pedalsClose').onclick = () => this.close();
  }

  open(): void {
    this.render();
    this.el.hidden = false;
  }

  close(): void {
    this.input.cancelCapture();
    this.el.hidden = true;
  }

  render(): void {
    const s = this.store.value;
    byId('pedalsList').replaceChildren(...Object.values(PedalAction).map((action) => {
      const row = document.createElement('div');
      row.className = 'pedal-row';
      const name = document.createElement('strong');
      name.textContent = t(`pedal.${action}`);
      const chips = document.createElement('div');
      chips.className = 'chips';
      for (const b of s.pedalBindings[action]) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = `${bindingLabel(b)}  ×`;
        chip.title = t('pedals.remove');
        chip.onclick = () => this.store.update({ pedalBindings: removeBinding(this.store.value.pedalBindings, action, b) });
        chips.append(chip);
      }
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn small';
      add.textContent = this.waitingFor === action ? t('pedals.waiting') : t('pedals.add');
      add.onclick = () => void this.assign(action);
      row.append(name, chips, add);
      return row;
    }));
    renderSegmented(
      byId('pedalsHat'),
      Object.values(HiHatPedalMode).map((m) => ({ value: m, label: t(`hihat.${m}`) })),
      s.hihatMode,
      (hihatMode) => this.store.update({ hihatMode }),
    );
  }

  private async assign(action: PedalAction): Promise<void> {
    this.waitingFor = action;
    byId('pedalsStatus').textContent = t('pedals.pressAny');
    this.render();
    const binding = await this.input.capture();
    this.waitingFor = null;
    byId('pedalsStatus').textContent = binding ? t('pedals.assigned', { input: bindingLabel(binding), action: t(`pedal.${action}`) }) : '';
    if (binding) this.store.update({ pedalBindings: assignBinding(this.store.value.pedalBindings, action, binding) });
    else this.render();
  }
}
