import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { HOME_GROUPS } from '@presentation/ui/navigation/home-groups';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';

/**
 * The band's instrument chooser: a sheet of small cards, grouped as on the home page (guitars, Turkish instruments,
 * winds, drums…), each with its drawing and name; tap to bring one in or take it out. It stays open while choosing.
 */
export class BandPicker {
  private readonly sheet = byId('bandPicker');
  private readonly list = byId('bandPickerList');
  private readonly note = byId('bandPickerNote');

  constructor(private readonly toggle: (id: string) => void) {
    byId('bandPickerDone').onclick = () => this.close();
    this.sheet.onclick = (e) => {
      if (e.target === this.sheet) this.close();
    };
  }

  get isOpen(): boolean {
    return !this.sheet.hidden;
  }

  open(candidates: readonly string[], chosen: readonly string[], max: number): void {
    this.sheet.hidden = false;
    this.render(candidates, chosen, max);
  }

  close(): void {
    this.sheet.hidden = true;
  }

  render(candidates: readonly string[], chosen: readonly string[], max: number): void {
    if (!this.isOpen) return;
    const isFull = chosen.length >= max;
    this.note.textContent = t('band.count', { n: String(chosen.length), max: String(max) });
    this.list.replaceChildren(...HOME_GROUPS.flatMap((g) => {
      const ids = g.ids.filter((id) => candidates.includes(id));
      if (!ids.length) return [];
      const label = document.createElement('h3');
      label.className = 'band-group';
      label.textContent = t(g.label);
      const grid = document.createElement('div');
      grid.className = 'band-options';
      grid.append(...ids.map((id) => {
        const isIn = chosen.includes(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'band-option';
        b.innerHTML = `${INSTRUMENT_ICONS[id] ?? ''}<span></span>`;
        (b.querySelector('span') as HTMLElement).textContent = instrumentName(id);
        b.setAttribute('aria-pressed', String(isIn));
        b.disabled = !isIn && isFull;
        b.onclick = () => this.toggle(id);
        return b;
      }));
      return [label, grid];
    }));
  }
}
