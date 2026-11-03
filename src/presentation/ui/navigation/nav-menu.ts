import { DRUMS_ID } from '@domain/drums/drums-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { t } from '@presentation/i18n/translator';
import type { Route } from '@presentation/routing/route';
import { INSTRUMENT_SLUGS, pathFor } from '@presentation/routing/route-paths';
import { byId } from '@presentation/ui/dom';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';

/**
 * **NavMenu** — the instrument picker. It does one thing: choose what to play. Learning and settings
 * live in their own places in the header, so each is easy to find.
 */
export class NavMenu {
  private readonly el = byId('nav');
  private readonly scrim = byId('navScrim');
  private readonly button = byId('menuBtn');

  constructor() {
    this.button.onclick = () => (this.el.hidden ? this.open() : this.close());
    this.scrim.onclick = () => this.close();
    this.el.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a')) this.close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open(): void {
    this.el.hidden = false;
    this.scrim.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    this.el.querySelector<HTMLElement>('[aria-current="page"], a')?.focus();
  }

  close(): void {
    this.el.hidden = true;
    this.scrim.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
  }

  /** Lists the instruments and updates the picker button to show the current one. */
  render(route: Route): void {
    const current = pathFor(route);
    const name = (id: string) => t(id === DRUMS_ID ? 'inst.drums' : instrumentById(id).name);
    const head = document.createElement('div');
    head.className = 'nav-head';
    head.textContent = t('nav.choose');
    this.el.replaceChildren(head, ...INSTRUMENT_SLUGS.map(([slug, id]) => {
      const a = document.createElement('a');
      a.className = 'nav-item';
      a.href = `/${slug}`;
      a.dataset['link'] = '';
      if (`/${slug}` === current) a.setAttribute('aria-current', 'page');
      a.innerHTML = `<span class="nav-icon">${INSTRUMENT_ICONS[id] ?? ''}</span><span><strong></strong><small></small></span>`;
      (a.querySelector('strong') as HTMLElement).textContent = name(id);
      (a.querySelector('small') as HTMLElement).textContent = t(`home.about.${slug}`);
      return a;
    }));
    const instrument = route.kind === 'instrument' ? route.instrument : null;
    byId('pickerIcon').innerHTML = instrument ? (INSTRUMENT_ICONS[instrument] ?? '') : '';
    byId('pageTitle').textContent = instrument ? name(instrument) : t('nav.choose');
  }
}
