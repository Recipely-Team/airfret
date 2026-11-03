import { describe, expect, it } from 'vitest';
import { EN } from '@presentation/i18n/locales/en';
import { TR } from '@presentation/i18n/locales/tr';

const placeholders = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

describe('locale catalogues', () => {
  it('have the same keys', () => {
    expect(Object.keys(TR).sort()).toEqual(Object.keys(EN).sort());
  });

  it('keep every placeholder byte-identical and no string empty', () => {
    for (const [key, en] of Object.entries(EN)) {
      const tr = TR[key] ?? '';
      expect(tr, key).not.toBe('');
      expect(placeholders(tr), key).toEqual(placeholders(en));
    }
  });
});
