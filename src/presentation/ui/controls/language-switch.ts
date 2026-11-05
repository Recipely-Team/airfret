import type { SettingsStore } from '@application/settings/settings-store';
import { Language } from '@presentation/i18n/language';
import { currentLanguage } from '@presentation/i18n/translator';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

/** Each language by its own short code, so a player who can't read the current one still finds theirs. */
const CODES: Readonly<Record<Language, string>> = { en: 'EN', tr: 'TR' };

/**
 * The TR / EN switch, shown where a player starts — the home page, the start card and the instrument menu —
 * besides Settings. Every switch on the page is a `.lang-switch` element; all show and set the same setting.
 */
export class LanguageSwitch {
  constructor(private readonly store: SettingsStore) {}

  render(): void {
    for (const host of document.querySelectorAll<HTMLElement>('.lang-switch')) {
      renderSegmented(host, Object.values(Language).map((l) => ({ value: l, label: CODES[l] })), currentLanguage(), (language) => this.store.update({ language }));
    }
  }
}
