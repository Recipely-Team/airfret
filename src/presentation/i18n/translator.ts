import { EN } from '@presentation/i18n/locales/en';
import { TR } from '@presentation/i18n/locales/tr';
import { Language } from '@presentation/i18n/language';

const CATALOGUES: Readonly<Record<Language, Readonly<Record<string, string>>>> = { en: EN, tr: TR };
let active: Language = Language.en;

/** Resolves a stored preference ('' = follow the browser) to a supported language. */
export function resolveLanguage(preference: string): Language {
  if (preference === Language.en || preference === Language.tr) return preference;
  return navigator.language.toLowerCase().startsWith(Language.tr) ? Language.tr : Language.en;
}

/** Switches the UI language. */
export function setLanguage(lang: Language): void {
  active = lang;
  document.documentElement.lang = lang;
}

export function currentLanguage(): Language {
  return active;
}

/** Translates a key, filling `{name}` placeholders; falls back to English, then to the key. */
export function t(key: string, vars: Readonly<Record<string, string | number>> = {}): string {
  let s = CATALOGUES[active][key] ?? EN[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
