import { describe, expect, it } from 'vitest';
import { INSTRUMENT_SLUGS, parseRoute, pathFor } from '@presentation/routing/route-paths';

describe('routes', () => {
  it('give every instrument its own path, and read it back', () => {
    for (const [slug, instrument] of INSTRUMENT_SLUGS) {
      expect(pathFor({ kind: 'instrument', instrument })).toBe(`/${slug}`);
      expect(parseRoute(`/${slug}`)).toEqual({ kind: 'instrument', instrument });
    }
  });

  it('round-trip home, lessons, a lesson and Explore', () => {
    for (const route of [{ kind: 'home' }, { kind: 'lessons' }, { kind: 'lesson', songId: 'c-em' }, { kind: 'explore' }] as const) {
      expect(parseRoute(pathFor(route))).toEqual(route);
    }
  });

  it('send unknown paths home', () => {
    expect(parseRoute('/nowhere')).toEqual({ kind: 'home' });
  });
});
