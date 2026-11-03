import { t } from '@presentation/i18n/translator';

/** Fills every `[data-i18n]` element in the page with its translation. */
export function applyStaticCopy(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset['i18n'];
    if (key) el.textContent = t(key);
  });
}
