import { describe, expect, it } from 'vitest';
import { INSTRUMENT_SLUGS } from '@presentation/routing/route-paths';
import { HOME_GROUPS } from '@presentation/ui/navigation/home-groups';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';

describe('home page groups', () => {
  it('lists every instrument exactly once, so a new one cannot go missing from the home page', () => {
    const listed = HOME_GROUPS.flatMap((g) => g.ids);
    expect([...listed].sort()).toEqual(INSTRUMENT_SLUGS.map(([, id]) => id).sort());
  });

  it('has an icon for every instrument it lists', () => {
    for (const id of HOME_GROUPS.flatMap((g) => g.ids)) expect(INSTRUMENT_ICONS[id], id).toBeTruthy();
  });
});
