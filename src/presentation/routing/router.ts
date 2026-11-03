import type { Route } from '@presentation/routing/route';
import { parseRoute, pathFor } from '@presentation/routing/route-paths';

/**
 * **Router** — History API routing without a framework.
 *
 * @remarks
 * - `<a data-link href="/bass">` links navigate in place; Back/Forward work.
 * - `replace` updates the address when the app itself changes page (e.g. a lesson switching instrument).
 */
export class Router {
  private current: Route = parseRoute(location.pathname);

  constructor(private readonly onChange: (route: Route) => void) {
    window.addEventListener('popstate', () => this.apply(parseRoute(location.pathname)));
    document.addEventListener('click', (e) => {
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-link]');
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      this.navigate(parseRoute(new URL(link.href).pathname));
    });
  }

  get route(): Route {
    return this.current;
  }

  start(): void {
    this.apply(this.current);
  }

  navigate(route: Route): void {
    if (pathFor(route) !== location.pathname) history.pushState(null, '', pathFor(route));
    this.apply(route);
  }

  /** Updates the address without running the route (the app is already there). */
  replace(route: Route): void {
    this.current = route;
    if (pathFor(route) !== location.pathname) history.replaceState(null, '', pathFor(route));
  }

  private apply(route: Route): void {
    this.current = route;
    this.onChange(route);
  }
}
