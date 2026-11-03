import type { SettingsStore } from '@application/settings/settings-store';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';

const MAX_LEVEL = 3;
const PERCENT = 100;
/** A course lesson counts as passed at this accuracy. */
const PASSED = 0.7;

/**
 * **LessonsDrawer** — the beginner course first (numbered, ticked when passed), then songs,
 * melodies and bass lines. Picking one opens its intro card.
 */
export class LessonsDrawer {
  private readonly el = byId('lessons');

  constructor(
    private readonly store: SettingsStore,
    private readonly onPick: (song: Song) => void,
    onTour: () => void,
    onClose: () => void,
  ) {
    byId('lessonsClose').onclick = () => {
      this.close();
      onClose();
    };
    byId('tourBtn').onclick = () => {
      this.close();
      onTour();
    };
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
    const groups: [string, readonly Song[]][] = [
      ['lesson.course', SONGS.filter((s) => s.course !== undefined)],
      ['lesson.songs', SONGS.filter((s) => s.course === undefined && s.mode === PlayMode.chord)],
      ['lesson.noteMode', SONGS.filter((s) => s.mode === PlayMode.note && s.instrument !== 'bass')],
      ['lesson.bass', SONGS.filter((s) => s.instrument === 'bass')],
    ];
    for (const [key, songs] of groups) {
      const label = document.createElement('div');
      label.className = 'group-label';
      label.textContent = t(key);
      list.append(label, ...songs.map((s) => this.row(s)));
    }
  }

  private row(song: Song): HTMLElement {
    const el = document.createElement('div');
    el.className = 'song';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    const best = this.store.value.best[song.id];
    const name = cell('name', '');
    if (song.course !== undefined) name.append(cell(best !== undefined && best >= PASSED ? 'step done' : 'step', best !== undefined && best >= PASSED ? '✓' : String(song.course)));
    name.append(document.createTextNode(song.title));
    const level = cell('meta', '');
    const dots = cell('dots', '●'.repeat(song.level));
    dots.append(cell('off', '●'.repeat(MAX_LEVEL - song.level)));
    level.append(dots);
    const meta = cell('meta wide', `${t(song.credit)} · ${song.bpm} BPM · ${t(instrumentById(song.instrument).name)}`);
    if (best !== undefined) meta.append(cell('best', ` · ${t('lesson.best')} ${Math.round(best * PERCENT)}%`));
    el.append(name, level, cell('about', t(song.about)), meta);
    el.onclick = () => this.onPick(song);
    el.onkeydown = (e) => {
      if (e.key === 'Enter') this.onPick(song);
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
