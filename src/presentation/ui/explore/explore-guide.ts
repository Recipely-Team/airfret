import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { EXPLORE_FEATURES } from '@presentation/ui/explore/explore-features';

/**
 * **ExploreGuide** — every feature on one page, in plain words: what it is, how to do it in up to
 * three steps, and a "Try it" button that sets the app up for that feature.
 */
export class ExploreGuide {
  private readonly el = byId('explore');

  constructor(private readonly onTry: (featureId: string) => void) {
    byId('exploreBtn').onclick = () => this.open();
    byId('exploreClose').onclick = () => this.close();
  }

  open(): void {
    this.render();
    this.el.hidden = false;
  }

  close(): void {
    this.el.hidden = true;
  }

  render(): void {
    byId('exploreGrid').replaceChildren(...EXPLORE_FEATURES.map(({ id, tag, steps }) => {
      const card = document.createElement('article');
      card.className = 'feature';
      const label = document.createElement('span');
      label.className = 'tag';
      label.textContent = t(`explore.tag.${tag}`);
      const title = document.createElement('h4');
      title.textContent = t(`explore.${id}.title`);
      const text = document.createElement('p');
      text.textContent = t(`explore.${id}.text`);
      const list = document.createElement('ol');
      for (let i = 1; i <= steps; i++) {
        const li = document.createElement('li');
        li.textContent = t(`explore.${id}.s${i}`);
        list.append(li);
      }
      const tryIt = document.createElement('button');
      tryIt.type = 'button';
      tryIt.className = 'btn small';
      tryIt.textContent = t('explore.try');
      tryIt.onclick = () => {
        this.close();
        this.onTry(id);
      };
      card.append(label, title, text, list, tryIt);
      return card;
    }));
  }
}
