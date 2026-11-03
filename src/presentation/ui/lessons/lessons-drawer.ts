import type { SettingsStore } from '@application/settings/settings-store';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

const MAX_LEVEL = 3;
const TEMPOS = [0.6, 0.8, 1];
const PERCENT = 100;

/**
 * **LessonsDrawer** — song list grouped by chords / melody, plus tempo, mode, strumming and drum options.
 */
export class LessonsDrawer {
  private selected: Song = SONGS[0] as Song;
  private readonly el = byId('lessons');

  constructor(
    private readonly store: SettingsStore,
    private readonly onStart: (song: Song) => void,
  ) {
    byId('lessonsBtn').onclick = () => this.open();
    byId('lessonsClose').onclick = () => this.close();
    byId('lessonStart').onclick = () => onStart(this.selected);
    const drums = byId<HTMLInputElement>('optDrums');
    drums.checked = store.value.hasLessonDrums;
    drums.onchange = () => store.update({ hasLessonDrums: drums.checked });
  }

  get song(): Song {
    return this.selected;
  }

  select(song: Song): void {
    this.selected = song;
  }

  open(): void {
    this.render();
    this.el.hidden = false;
  }

  close(): void {
    this.el.hidden = true;
  }

  render(): void {
    const list = byId('songList');
    list.replaceChildren();
    for (const mode of Object.values(PlayMode)) {
      const label = document.createElement('div');
      label.className = 'group-label';
      label.textContent = t(mode === PlayMode.chord ? 'lesson.chordMode' : 'lesson.noteMode');
      list.append(label, ...SONGS.filter((s) => s.mode === mode).map((s) => this.row(s)));
    }
    byId('optEasyRow').hidden = this.selected.mode !== PlayMode.chord;
    this.renderOptions();
  }

  private renderOptions(): void {
    const s = this.store.value;
    renderSegmented(byId('optTempo'), TEMPOS.map((v) => ({ value: v, label: `${Math.round(v * PERCENT)}%` })), s.lessonTempo, (lessonTempo) => this.store.update({ lessonTempo }));
    renderSegmented(byId('optWait'), [{ value: true, label: t('lesson.wait') }, { value: false, label: t('lesson.play') }], s.shouldLessonWait, (shouldLessonWait) => this.store.update({ shouldLessonWait }));
    renderSegmented(byId('optEasy'), [{ value: true, label: t('lesson.easy') }, { value: false, label: t('lesson.full') }], s.isLessonEasy, (isLessonEasy) => this.store.update({ isLessonEasy }));
  }

  private row(song: Song): HTMLElement {
    const el = document.createElement('div');
    el.className = 'song';
    el.tabIndex = 0;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', String(song === this.selected));
    const name = cell('name', song.title);
    const level = cell('meta', '');
    const dots = cell('dots', '●'.repeat(song.level));
    dots.append(cell('off', '●'.repeat(MAX_LEVEL - song.level)));
    level.append(dots);
    const meta = cell('meta wide', `${t(song.credit)} · ${song.bpm} BPM · ${t(instrumentById(song.instrument).name)}`);
    const best = this.store.value.best[song.id];
    if (best !== undefined) meta.append(cell('best', ` · ${t('lesson.best')} ${Math.round(best * PERCENT)}%`));
    el.append(name, level, cell('about', t(song.about)), meta);
    el.onclick = () => {
      this.selected = song;
      this.render();
    };
    el.ondblclick = () => this.onStart(song);
    el.onkeydown = (e) => {
      if (e.key === 'Enter') this.onStart(song);
    };
    return el;
  }
}

function cell(className: string, text: string): HTMLElement {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}
