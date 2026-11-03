import type { SettingsStore } from '@application/settings/settings-store';
import { INSTRUMENTS } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { CHORD_SETS } from '@domain/lessons/catalog/chord-set-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

/**
 * **Toolbar** — instrument, mode and chord-set pickers.
 *
 * @remarks
 * - Mode and chord set are locked while a lesson runs (the song decides them).
 */
export class Toolbar {
  constructor(
    private readonly store: SettingsStore,
    private readonly onInstrument: (id: string) => void,
    private readonly isLessonActive: () => boolean,
  ) {
    byId<HTMLSelectElement>('chordSet').onchange = (e) => store.update({ chordSet: (e.target as HTMLSelectElement).value });
  }

  render(): void {
    const s = this.store.value;
    const isLocked = this.isLessonActive();
    renderSegmented(byId('instruments'), INSTRUMENTS.map((i) => ({ value: i.id, label: t(i.name) })), s.instrument, this.onInstrument);
    renderSegmented(
      byId('modes'),
      Object.values(PlayMode).map((m) => ({ value: m, label: t(`mode.${m}`) })),
      s.mode,
      (mode) => this.store.update({ mode }),
      isLocked,
    );
    const select = byId<HTMLSelectElement>('chordSet');
    select.replaceChildren(
      ...CHORD_SETS.map((c) => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name;
        o.selected = c.id === s.chordSet;
        return o;
      }),
    );
    select.disabled = isLocked;
    select.hidden = s.mode !== PlayMode.chord;
  }
}
