import type { SettingsStore } from '@application/settings/settings-store';
import { PlayMode } from '@domain/instruments/play-mode';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { CHORD_SETS } from '@domain/lessons/catalog/chord-set-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

/**
 * **Toolbar** — page title and the current page's controls: play mode and chord set on guitars, pedals on drums,
 * and the hands-only view toggle (hide the camera picture, keep the hand skeleton).
 *
 * @remarks
 * - Mode and chord set are locked while a lesson runs (the song decides them).
 */
export class Toolbar {
  constructor(
    private readonly store: SettingsStore,
    private readonly isLessonActive: () => boolean,
    private readonly isOnStage: () => boolean,
  ) {
    byId<HTMLSelectElement>('chordSet').onchange = (e) => store.update({ chordSet: (e.target as HTMLSelectElement).value });
    byId('camBtn').onclick = () => store.update({ isCameraHidden: !store.value.isCameraHidden });
  }

  render(): void {
    const s = this.store.value;
    const isLocked = this.isLessonActive();
    const isDrums = s.instrument === DRUMS_ID;
    byId('barContext').hidden = !this.isOnStage();
    byId('modes').hidden = isDrums;
    byId('pedalsBtn').hidden = !isDrums;
    const cam = byId('camBtn');
    // The camera button only means something where the camera picture is: on an instrument's stage.
    cam.hidden = !this.isOnStage();
    const camLabel = t(s.isCameraHidden ? 'ui.showCamera' : 'ui.hideCamera');
    cam.setAttribute('aria-pressed', String(s.isCameraHidden));
    cam.dataset['i18nLabel'] = s.isCameraHidden ? 'ui.showCamera' : 'ui.hideCamera';
    cam.setAttribute('aria-label', camLabel);
    cam.title = camLabel;
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
    select.hidden = s.mode !== PlayMode.chord || isDrums;
  }
}
