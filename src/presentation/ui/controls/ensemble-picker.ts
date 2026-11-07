import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';

/** The panel is never wider than this, and keeps this margin from the screen's edge. */
const PANEL = { maxWidth: 340, margin: 12, gap: 6 } as const;
/** So many instruments can join at once — more blurs the song. */
const MAX_MEMBERS = 4;

/**
 * *Together* — beside the song list while an instrument plays by itself: a button showing how many instruments
 * join in, opening a list to tick them (those with real recordings, up to four). They play the same song with it.
 */
export class EnsemblePicker {
  private readonly button = byId<HTMLButtonElement>('ensembleBtn');
  private readonly panel = byId('ensemblePicker');
  private readonly list = byId('ensembleList');
  private choices: readonly string[] = [];
  private chosen: readonly string[] = [];

  constructor(private readonly onChange: (members: readonly string[]) => void) {
    this.button.onclick = () => (this.panel.hidden ? this.open() : this.close());
    document.addEventListener('pointerdown', (e) => {
      const target = e.target as Node;
      if (!this.panel.hidden && !this.panel.contains(target) && !this.button.contains(target)) this.close();
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && this.close());
  }

  set hidden(isHidden: boolean) {
    this.button.hidden = isHidden;
    if (isHidden) this.close();
  }

  /** The instruments that can join (not the one playing) and those chosen. */
  show(choices: readonly string[], chosen: readonly string[]): void {
    this.choices = choices;
    this.chosen = chosen.filter((id) => choices.includes(id));
    const n = this.chosen.length;
    this.button.textContent = n ? t('ensemble.count', { n }) : t('ensemble.add');
    this.button.setAttribute('aria-pressed', String(n > 0));
    if (!this.panel.hidden) this.render();
  }

  private open(): void {
    const r = this.button.getBoundingClientRect();
    const width = Math.min(PANEL.maxWidth, window.innerWidth - 2 * PANEL.margin);
    this.panel.style.width = `${width}px`;
    this.panel.style.left = `${Math.max(PANEL.margin, Math.min(r.left, window.innerWidth - width - PANEL.margin))}px`;
    this.panel.style.top = `${r.bottom + PANEL.gap}px`;
    this.render();
    this.panel.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
  }

  private close(): void {
    this.panel.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
  }

  private render(): void {
    const head = document.createElement('p');
    head.className = 'muted small ensemble-head';
    head.textContent = t('ensemble.help', { max: MAX_MEMBERS });
    this.list.replaceChildren(head, ...this.choices.map((id) => {
      const isOn = this.chosen.includes(id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'song-option ensemble-option';
      b.setAttribute('aria-pressed', String(isOn));
      b.disabled = !isOn && this.chosen.length >= MAX_MEMBERS;
      b.innerHTML = `<span class="ensemble-icon">${INSTRUMENT_ICONS[id] ?? ''}</span><strong></strong><span class="ensemble-tick" aria-hidden="true">${isOn ? '✓' : ''}</span>`;
      (b.querySelector('strong') as HTMLElement).textContent = instrumentName(id);
      b.onclick = () => this.onChange(isOn ? this.chosen.filter((x) => x !== id) : [...this.chosen, id]);
      return b;
    }));
  }
}
