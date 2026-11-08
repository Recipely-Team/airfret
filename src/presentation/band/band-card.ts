import type { MemberChoice } from '@domain/band/member-choice';
import type { BandPattern } from '@domain/band/seating/band-pattern';
import type { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import type { InstrumentProfile } from '@domain/band/seating/instrument-profile';
import { patternsFor, rolesFor } from '@domain/band/seating/patterns-for';
import type { BandMember } from '@presentation/band/band-member';
import { StageRenderer } from '@presentation/canvas/stage-renderer';
import { t } from '@presentation/i18n/translator';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';

const MAX_DPR = 2;
const LEVEL = { min: 0, max: 1.5, step: 0.05 } as const;
const AUTO = '';

interface CardHandlers {
  /** Takes it out of the band. */
  remove(): void;
  /** The player changed its role, pattern or entry (null: back to the band's own choice). */
  choose(choice: MemberChoice | null): void;
  /** The player moved its level (heard at once; kept when let go). */
  level(level: number, isFinal: boolean): void;
}

/**
 * One band member's card: its icon and name, its part — a role the player can change, the band's own choice marked
 * "auto" — and, under *More*, how it plays (its pattern), its level and the section it comes in at; a note when a
 * choice had to be adjusted. Below, its own canvas, where it is drawn playing. Cards flow in a responsive grid.
 */
export class BandCard {
  readonly element = document.createElement('article');
  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d');
  private readonly renderer: StageRenderer | null;
  private readonly role = select('band-role-select');
  private readonly pattern = select('band-select');
  private readonly from = select('band-select');
  private readonly level = document.createElement('input');
  private readonly details = document.createElement('div');
  private readonly hint = document.createElement('p');
  private choice: MemberChoice = {};
  private size = { w: 0, h: 0 };

  constructor(readonly member: BandMember, private readonly profile: InstrumentProfile, private readonly on: CardHandlers) {
    this.element.className = 'band-card';
    const head = document.createElement('div');
    head.className = 'band-card-head';
    const icon = document.createElement('span');
    icon.className = 'band-icon';
    icon.innerHTML = INSTRUMENT_ICONS[member.id] ?? '';
    const name = document.createElement('strong');
    name.textContent = instrumentName(member.id);
    this.role.setAttribute('aria-label', t('band.members'));
    this.role.onchange = () => this.change({ role: (this.role.value || undefined) as BandRole | undefined, pattern: undefined });
    const more = iconButton('band-more', '⋯', t('band.more'));
    more.onclick = () => {
      this.details.hidden = !this.details.hidden;
      more.setAttribute('aria-expanded', String(!this.details.hidden));
    };
    const remove = iconButton('band-remove', '×', t('band.remove'));
    remove.onclick = () => on.remove();
    head.append(icon, name, this.role, more, remove);
    this.buildDetails();
    this.hint.className = 'band-hint';
    this.hint.hidden = true;
    this.element.append(head, this.details, this.hint, this.canvas);
    this.renderer = this.ctx ? new StageRenderer(this.canvas, this.ctx, document.createElement('video')) : null;
  }

  /** Shows its seat in the arrangement: its role (auto or chosen), pattern, level, entry and any note. */
  show(seat: BandSeat, choice: MemberChoice | undefined, sections: number): void {
    this.choice = choice ?? {};
    const autoLabel = t('band.role.auto', { role: t(`band.role.${seat.role}`) });
    this.role.replaceChildren(new Option(choice?.role ? t('band.auto') : autoLabel, AUTO), ...rolesFor(this.profile).map((r) => new Option(t(`band.role.${r}`), r)));
    this.role.value = choice?.role ?? AUTO;
    const patterns = patternsFor(seat.role, this.profile.kind);
    this.pattern.replaceChildren(new Option(t('band.pattern.auto'), AUTO), ...patterns.map((p) => new Option(t(`band.pattern.${p}`), p)));
    this.pattern.value = choice?.pattern && patterns.includes(choice.pattern) ? choice.pattern : AUTO;
    this.pattern.closest('label')?.toggleAttribute('hidden', patterns.length === 0);
    this.from.replaceChildren(new Option(t('band.from.auto'), AUTO), ...Array.from({ length: sections }, (_, k) => new Option(t('band.from.n', { n: k + 1 }), String(k))));
    this.from.value = choice?.from !== undefined ? String(choice.from) : AUTO;
    this.level.value = String(choice?.level ?? 1);
    this.hint.textContent = seat.hint ? t(seat.hint) : '';
    this.hint.hidden = !seat.hint;
    this.element.classList.toggle('is-off', seat.role === 'off');
  }

  /** Whether it has been sized to its place: until then it can neither play nor draw. */
  get isFitted(): boolean {
    return this.size.w > 0;
  }

  /** Sizes the canvas and the instrument to the card's place, when that changed (or first). */
  fit(): void {
    if (!this.ctx) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h || (w === this.size.w && h === this.size.h)) return;
    this.size = { w, h };
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.member.fit(w, h);
  }

  draw(audioNow: number, now: number): void {
    this.fit();
    if (this.renderer && this.isFitted) this.member.draw(this.renderer, audioNow, now);
  }

  private buildDetails(): void {
    this.details.className = 'band-details';
    this.details.hidden = true;
    this.pattern.onchange = () => this.change({ pattern: (this.pattern.value || undefined) as BandPattern | undefined });
    this.from.onchange = () => this.change({ from: this.from.value === AUTO ? undefined : Number(this.from.value) });
    Object.assign(this.level, { type: 'range', min: String(LEVEL.min), max: String(LEVEL.max), step: String(LEVEL.step) });
    this.level.oninput = () => this.on.level(Number(this.level.value), false);
    this.level.onchange = () => this.on.level(Number(this.level.value), true);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'btn ghost small';
    reset.textContent = t('band.reset');
    reset.onclick = () => this.on.choose(null);
    this.details.append(field(t('band.pattern'), this.pattern), field(t('band.level'), this.level), field(t('band.from'), this.from), reset);
  }

  /** The choice with these fields changed (undefined: left to the band). */
  private change(patch: { [K in keyof MemberChoice]?: MemberChoice[K] | undefined }): void {
    const next = Object.fromEntries(Object.entries({ ...this.choice, ...patch }).filter(([, v]) => v !== undefined)) as MemberChoice;
    this.on.choose(Object.keys(next).length ? next : null);
  }

}

function select(className: string): HTMLSelectElement {
  const s = document.createElement('select');
  s.className = className;
  return s;
}

function iconButton(className: string, text: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = text;
  b.setAttribute('aria-label', label);
  return b;
}

function field(label: string, control: HTMLElement): HTMLLabelElement {
  const l = document.createElement('label');
  l.className = 'band-field';
  const s = document.createElement('span');
  s.textContent = label;
  l.append(s, control);
  return l;
}
