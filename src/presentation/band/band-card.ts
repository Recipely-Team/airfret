import type { BandMember } from '@presentation/band/band-member';
import { StageRenderer } from '@presentation/canvas/stage-renderer';
import { t } from '@presentation/i18n/translator';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';

const MAX_DPR = 2;

/**
 * One band member's card: its icon, name and part (tune, chords, bass…) over its own canvas, where it is drawn
 * playing; a button takes it out of the band. Cards flow in a responsive grid.
 */
export class BandCard {
  readonly element = document.createElement('article');
  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d');
  private readonly renderer: StageRenderer | null;
  private readonly role = document.createElement('span');
  private size = { w: 0, h: 0 };

  constructor(readonly member: BandMember, onRemove: () => void) {
    this.element.className = 'band-card';
    const head = document.createElement('div');
    head.className = 'band-card-head';
    const icon = document.createElement('span');
    icon.className = 'band-icon';
    icon.innerHTML = INSTRUMENT_ICONS[member.id] ?? '';
    const name = document.createElement('strong');
    name.textContent = instrumentName(member.id);
    this.role.className = 'band-role';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'band-remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', t('band.remove'));
    remove.onclick = onRemove;
    head.append(icon, name, this.role, remove);
    this.element.append(head, this.canvas);
    this.renderer = this.ctx ? new StageRenderer(this.canvas, this.ctx, document.createElement('video')) : null;
  }

  /** Shows its part, e.g. "chords". */
  showRole(text: string): void {
    this.role.textContent = text;
  }

  draw(audioNow: number, now: number): void {
    if (!this.ctx || !this.renderer) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    if (w !== this.size.w || h !== this.size.h) {
      this.size = { w, h };
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.member.fit(w, h);
    }
    this.member.draw(this.renderer, audioNow, now);
  }
}
