import { DRUMS_ID } from '@domain/drums/drums-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { t } from '@presentation/i18n/translator';
import { INSTRUMENT_SLUGS } from '@presentation/routing/route-paths';
import { byId } from '@presentation/ui/dom';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';

/** The home page: pick an instrument (each opens its own page) or start learning. */
export class HomeView {
  private readonly el = byId('home');

  constructor(private readonly onTour: () => void) {}

  show(isVisible: boolean): void {
    this.el.hidden = !isVisible;
  }

  render(): void {
    byId('homeInstruments').replaceChildren(...INSTRUMENT_SLUGS.map(([slug, id]) => {
      const a = document.createElement('a');
      a.className = 'instrument-card';
      a.href = `/${slug}`;
      a.dataset['link'] = '';
      a.innerHTML = `${INSTRUMENT_ICONS[id] ?? ''}<strong></strong><span></span><code></code>`;
      (a.querySelector('strong') as HTMLElement).textContent = t(id === DRUMS_ID ? 'inst.drums' : instrumentById(id).name);
      (a.querySelector('span') as HTMLElement).textContent = t(`home.about.${slug}`);
      (a.querySelector('code') as HTMLElement).textContent = `/${slug}`;
      return a;
    }));
    const card = (title: string, text: string, href?: string, onClick?: () => void) => {
      const el = href ? document.createElement('a') : document.createElement('button');
      el.className = 'learn-card';
      if (href && el instanceof HTMLAnchorElement) {
        el.href = href;
        el.dataset['link'] = '';
      }
      if (onClick) el.onclick = onClick;
      el.innerHTML = '<strong></strong><span></span>';
      (el.querySelector('strong') as HTMLElement).textContent = title;
      (el.querySelector('span') as HTMLElement).textContent = text;
      return el;
    };
    byId('homeLearn').replaceChildren(
      card(t('tour.start'), t('home.tourText'), undefined, this.onTour),
      card(t('lesson.course'), t('home.courseText'), '/lessons'),
      card(t('explore.title'), t('home.exploreText'), '/explore'),
    );
  }
}
