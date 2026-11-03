import { t } from '@presentation/i18n/translator';

/** Fills every `[data-i18n]` element's text and every `[data-i18n-label]` element's accessible name. */
export function applyStaticCopy(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset['i18n'];
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach((el) => {
    const key = el.dataset['i18nLabel'];
    if (!key) return;
    el.setAttribute('aria-label', t(key));
    el.title = t(key);
  });
}
