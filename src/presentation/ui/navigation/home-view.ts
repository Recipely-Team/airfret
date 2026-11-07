import { t } from '@presentation/i18n/translator';
import { INSTRUMENT_SLUGS } from '@presentation/routing/route-paths';
import { byId } from '@presentation/ui/dom';
import { HOME_GROUPS } from '@presentation/ui/navigation/home-groups';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';

/** The home page: pick an instrument (each opens its own page) or start learning. */
export class HomeView {
  private readonly el = byId('home');

  constructor(private readonly onTour: () => void) {
    byId('homeTour').onclick = onTour;
  }

  show(isVisible: boolean): void {
    this.el.hidden = !isVisible;
  }

  render(): void {
    const slugOf = new Map(INSTRUMENT_SLUGS.map(([slug, id]) => [id, slug]));
    byId('homeInstruments').replaceChildren(...HOME_GROUPS.flatMap(({ label, ids }) => {
      const heading = document.createElement('h2');
      heading.className = 'home-label';
      heading.textContent = t(label);
      const grid = document.createElement('div');
      grid.className = 'instrument-grid';
      grid.append(...ids.map((id) => {
        const slug = slugOf.get(id) ?? id;
        const a = document.createElement('a');
        a.className = 'instrument-card';
        a.href = `/${slug}`;
        a.dataset['link'] = '';
        a.innerHTML = `${INSTRUMENT_ICONS[id] ?? ''}<strong></strong><span></span>`;
        (a.querySelector('strong') as HTMLElement).textContent = instrumentName(id);
        (a.querySelector('span') as HTMLElement).textContent = t(`home.about.${slug}`);
        return a;
      }));
      return [heading, grid];
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
      card(t('band.title'), t('home.bandText'), '/band'),
      card(t('explore.title'), t('home.exploreText'), '/explore'),
    );
  }
}
