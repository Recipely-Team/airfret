import type { SettingsStore } from '@application/settings/settings-store';
import { PlayMode } from '@domain/instruments/play-mode';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { isKeyboard } from '@domain/keys/keyboard-instruments';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { CHORD_SETS } from '@domain/lessons/catalog/chord-set-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';
import type { SelfPlayControl } from '@presentation/ui/controls/self-play-control';

/** The mode switch's extra segment: the instrument plays by itself. */
const SELF_PLAY = 'self-play';

/**
 * **Toolbar** — page title and the current page's controls: play mode and chord set on guitars, pedals on drums,
 * the camera switch (off: no tracking, mouse or touch plays) and the hands-only view toggle (hide the camera
 * picture, keep the hand skeleton).
 *
 * @remarks
 * - Mode and chord set are locked while a lesson runs (the song decides them).
 * - Guitars and basses get a fourth mode, *Watch it play* (`DemoController`): a song list and Play / Stop.
 */
export class Toolbar {
  constructor(
    private readonly store: SettingsStore,
    private readonly isLessonActive: () => boolean,
    private readonly isOnStage: () => boolean,
    private readonly selfPlay: SelfPlayControl,
  ) {
    byId<HTMLSelectElement>('chordSet').onchange = (e) => store.update({ chordSet: (e.target as HTMLSelectElement).value });
    byId('camBtn').onclick = () => store.update({ isCameraHidden: !store.value.isCameraHidden });
    byId('camPowerBtn').onclick = () => store.update({ isCameraOff: !store.value.isCameraOff });
  }

  render(): void {
    const s = this.store.value;
    const isLocked = this.isLessonActive();
    const isDrums = s.instrument === DRUMS_ID;
    byId('barContext').hidden = !this.isOnStage();
    // Keyboards have no strumming modes or chord sets: every key is just a note.
    const hasModes = !isDrums && !isKeyboard(s.instrument);
    byId('modes').hidden = !hasModes;
    byId('pedalsBtn').hidden = !isDrums;
    const cam = byId('camBtn');
    // The camera button only means something where the camera picture is: on an instrument's stage.
    cam.hidden = !this.isOnStage() || s.isCameraOff;
    const power = byId('camPowerBtn');
    power.hidden = !this.isOnStage();
    const powerLabel = t(s.isCameraOff ? 'ui.cameraOn' : 'ui.cameraOff');
    power.setAttribute('aria-pressed', String(s.isCameraOff));
    power.dataset['i18nLabel'] = s.isCameraOff ? 'ui.cameraOn' : 'ui.cameraOff';
    power.setAttribute('aria-label', powerLabel);
    power.title = powerLabel;
    const camLabel = t(s.isCameraHidden ? 'ui.showCamera' : 'ui.hideCamera');
    cam.setAttribute('aria-pressed', String(s.isCameraHidden));
    cam.dataset['i18nLabel'] = s.isCameraHidden ? 'ui.showCamera' : 'ui.hideCamera';
    cam.setAttribute('aria-label', camLabel);
    cam.title = camLabel;
    // An instrument may offer fewer modes (a saz has no guitar chord shapes).
    const allowed = instrumentById(s.instrument).modes ?? Object.values(PlayMode);
    const modes: { value: PlayMode | typeof SELF_PLAY; label: string }[] = allowed.map((m) => ({ value: m, label: t(`mode.${m}`) }));
    if (this.selfPlay.isOffered()) modes.push({ value: SELF_PLAY, label: t('demo.play') });
    renderSegmented(byId('modes'), modes, this.selfPlay.isOn() ? SELF_PLAY : s.mode, (mode) => this.pick(mode), isLocked);
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
    select.hidden = s.mode !== PlayMode.chord || !hasModes || this.selfPlay.isOn();
  }

  private pick(mode: PlayMode | typeof SELF_PLAY): void {
    if (mode === SELF_PLAY) {
      if (!this.selfPlay.isOn()) this.selfPlay.enter();
      return;
    }
    this.selfPlay.leave();
    this.store.update({ mode });
  }
}
