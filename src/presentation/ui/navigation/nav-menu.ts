import { DRUMS_ID } from '@domain/drums/drums-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { t } from '@presentation/i18n/translator';
import type { Route } from '@presentation/routing/route';
import { INSTRUMENT_SLUGS, pathFor } from '@presentation/routing/route-paths';
import { byId } from '@presentation/ui/dom';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';

/**
 * **NavMenu** — the ☰ drawer: every instrument as its own page, then learning and settings.
 */
export class NavMenu {
  private readonly el = byId('nav');
  private readonly scrim = byId('navScrim');
  private readonly button = byId('menuBtn');

  constructor(private readonly actions: { readonly onTour: () => void; readonly onSettings: () => void }) {
    this.button.onclick = () => (this.el.hidden ? this.open() : this.close());
    this.scrim.onclick = () => this.close();
    this.el.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a, button')) this.close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open(): void {
    this.el.hidden = false;
    this.scrim.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    this.el.querySelector<HTMLElement>('a, button')?.focus();
  }

  close(): void {
    this.el.hidden = true;
    this.scrim.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
  }

  render(route: Route): void {
    const current = pathFor(route);
    const item = (path: string, icon: string, title: string, sub: string) => {
      const a = document.createElement('a');
      a.className = 'nav-item';
      a.href = path;
      a.dataset['link'] = '';
      if (path === current) a.setAttribute('aria-current', 'page');
      a.innerHTML = `<span class="nav-icon">${icon}</span><span><strong></strong><small></small></span>`;
      (a.querySelector('strong') as HTMLElement).textContent = title;
      (a.querySelector('small') as HTMLElement).textContent = sub;
      return a;
    };
    const action = (title: string, sub: string, onClick: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nav-item';
      b.innerHTML = '<span class="nav-icon"></span><span><strong></strong><small></small></span>';
      (b.querySelector('strong') as HTMLElement).textContent = title;
      (b.querySelector('small') as HTMLElement).textContent = sub;
      b.onclick = onClick;
      return b;
    };
    const label = (key: string) => {
      const d = document.createElement('div');
      d.className = 'nav-label';
      d.textContent = t(key);
      return d;
    };
    const head = document.createElement('div');
    head.className = 'nav-head';
    head.textContent = 'Airfret';
    this.el.replaceChildren(
      head,
      item('/', '', t('nav.home'), t('nav.homeSub')),
      label('home.instruments'),
      ...INSTRUMENT_SLUGS.map(([slug, id]) =>
        item(`/${slug}`, INSTRUMENT_ICONS[id] ?? '', t(id === DRUMS_ID ? 'inst.drums' : instrumentById(id).name), `/${slug}`),
      ),
      label('home.learn'),
      item('/lessons', '', t('lesson.course'), '/lessons'),
      action(t('tour.start'), t('nav.tourSub'), this.actions.onTour),
      item('/explore', '', t('explore.title'), '/explore'),
      label('ui.settings'),
      action(t('ui.settings'), t('nav.settingsSub'), this.actions.onSettings),
    );
  }
}
