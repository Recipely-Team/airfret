import { describe, expect, it } from 'vitest';
import { EN } from '@presentation/i18n/locales/en';
import { TR } from '@presentation/i18n/locales/tr';
import { HOME_GROUPS } from '@presentation/ui/navigation/home-groups';
import { SOUND_SOURCES } from '@presentation/ui/navigation/sound-sources';

const ALL = HOME_GROUPS.flatMap((g) => g.ids);
const PARTS = ['family', 'origin', 'history', 'timeline'];

describe('The info card of every instrument', () => {
  it('has its family, origin, history and timeline in English and Turkish', () => {
    for (const locale of [EN, TR] as Readonly<Record<string, string>>[]) {
      for (const id of ALL) for (const part of PARTS) expect(locale[`info.${id}.${part}`], `${id}.${part}`).toBeTruthy();
    }
  });

  it('writes each timeline step as "when — what", the same number of steps in both languages', () => {
    for (const id of ALL) {
      const en = (EN as Record<string, string>)[`info.${id}.timeline`]!.split('\n');
      const tr = (TR as Record<string, string>)[`info.${id}.timeline`]!.split('\n');
      expect(tr.length, id).toBe(en.length);
      for (const line of [...en, ...tr]) expect(line.split(' — ').length, `${id}: ${line}`).toBe(2);
    }
  });

  it('credits a recording source only for instruments on the home page', () => {
    for (const id of Object.keys(SOUND_SOURCES)) expect(ALL, id).toContain(id);
  });
});
