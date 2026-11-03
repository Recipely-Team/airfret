import type { SettingsStore } from '@application/settings/settings-store';
import { StrumFilter } from '@domain/settings/strum-filter';
import { Language } from '@presentation/i18n/language';
import { currentLanguage, t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

/**
 * **SettingsPanel** — handedness, strum direction, volume, camera brightness, latency, language.
 */
export class SettingsPanel {
  constructor(private readonly store: SettingsStore) {
    const s = store.value;
    const lefty = byId<HTMLInputElement>('lefty');
    lefty.checked = s.isLefty;
    lefty.onchange = () => store.update({ isLefty: lefty.checked });
    this.slider('volume', s.volume, (v) => store.update({ volume: v }));
    this.slider('brightness', s.brightness, (v) => store.update({ brightness: v }));
    this.slider('latency', s.latencyMs, (v) => store.update({ latencyMs: v }));
  }

  render(): void {
    const s = this.store.value;
    byId('latencyVal').textContent = `${s.latencyMs} ms`;
    renderSegmented(
      byId('strumFilter'),
      Object.values(StrumFilter).map((f) => ({ value: f, label: t(`strum.${f}`) })),
      s.strumFilter,
      (strumFilter) => this.store.update({ strumFilter }),
    );
    renderSegmented(
      byId('langs'),
      Object.values(Language).map((l) => ({ value: l, label: t(`lang.${l}`) })),
      currentLanguage(),
      (language) => this.store.update({ language }),
    );
  }

  private slider(id: string, value: number, onInput: (v: number) => void): void {
    const input = byId<HTMLInputElement>(id);
    input.value = String(value);
    input.oninput = () => onInput(Number(input.value));
  }
}
