import { DRUMS_ID } from '@domain/drums/drums-id';
import type { Route } from '@presentation/routing/route';

/** URL slug per instrument id, in menu order. */
export const INSTRUMENT_SLUGS: readonly (readonly [slug: string, instrument: string])[] = [
  ['acoustic', 'acoustic'],
  ['classical', 'nylon'],
  ['electric', 'clean'],
  ['overdrive', 'drive'],
  ['bass', 'bass'],
  ['drums', DRUMS_ID],
];

const LESSONS = 'lessons';
const EXPLORE = 'explore';

/** Path for a route, e.g. `/bass`, `/lessons/c-em`. */
export function pathFor(route: Route): string {
  switch (route.kind) {
    case 'home': return '/';
    case 'lessons': return `/${LESSONS}`;
    case 'lesson': return `/${LESSONS}/${encodeURIComponent(route.songId)}`;
    case 'explore': return `/${EXPLORE}`;
    case 'instrument': return `/${INSTRUMENT_SLUGS.find(([, id]) => id === route.instrument)?.[0] ?? 'acoustic'}`;
  }
}

/** Route for a path; unknown paths go home. */
export function parseRoute(pathname: string): Route {
  const [first, second] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (!first) return { kind: 'home' };
  if (first === LESSONS) return second ? { kind: 'lesson', songId: second } : { kind: 'lessons' };
  if (first === EXPLORE) return { kind: 'explore' };
  const instrument = INSTRUMENT_SLUGS.find(([slug]) => slug === first)?.[1];
  return instrument ? { kind: 'instrument', instrument } : { kind: 'home' };
}
