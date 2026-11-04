import type { SettingsStore } from '@application/settings/settings-store';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { voicesFor, withVoice } from '@domain/instruments/voice-catalog';
import { tuningsFor } from '@domain/music/tuning-catalog';
import { StrumFilter } from '@domain/settings/strum-filter';
import { Language } from '@presentation/i18n/language';
import { currentLanguage, t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

/**
 * **SettingsPanel** — handedness, strum direction, sound (voice), tuning, capo, volume, camera brightness,
 * latency, language.
 *
 * @remarks
 * - Voices are listed best first with their rank, so the measured ranking is visible where the choice is made.
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
    this.slider('capo', s.capo, (v) => store.update({ capo: v }));
    byId<HTMLSelectElement>('tuning').onchange = (e) => store.update({ tuning: (e.target as HTMLSelectElement).value });
    byId<HTMLSelectElement>('voice').onchange = (e) => {
      const v = store.value;
      store.update({ voices: { ...v.voices, [v.instrument]: (e.target as HTMLSelectElement).value } });
    };
  }

  render(): void {
    const s = this.store.value;
    byId('latencyVal').textContent = `${s.latencyMs} ms`;
    byId('capoVal').textContent = s.capo === 0 ? t('ui.noCapo') : t('ui.capoAt', { n: s.capo });
    const voices = voicesFor(s.instrument);
    const chosen = withVoice(instrumentById(s.instrument), s.voices[s.instrument]).voice;
    byId('voiceRow').hidden = voices.length < 2;
    byId<HTMLSelectElement>('voice').replaceChildren(...voices.map((v, rank) => {
      const o = document.createElement('option');
      o.value = v.id;
      o.textContent = t('voice.ranked', { n: rank + 1, name: t(v.name) });
      o.selected = v.id === chosen;
      return o;
    }));
    const tuning = byId<HTMLSelectElement>('tuning');
    tuning.replaceChildren(...tuningsFor(instrumentById(s.instrument).tuning.length).map((tu) => {
      const o = document.createElement('option');
      o.value = tu.id;
      o.textContent = t(tu.name);
      o.selected = tu.id === s.tuning;
      return o;
    }));
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
