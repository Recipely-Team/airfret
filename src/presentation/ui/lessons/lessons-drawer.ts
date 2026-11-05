import type { SettingsStore } from '@application/settings/settings-store';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { searchSongs } from '@application/lessons/search-songs';
import { songSearchText } from '@presentation/ui/lessons/song-search-text';

const MAX_LEVEL = 3;
const PERCENT = 100;
/** A course lesson counts as passed at this accuracy. */
const PASSED = 0.7;

/**
 * **LessonsDrawer** — the beginner course first (numbered, ticked when passed), then songs,
 * melodies and bass lines. Picking one opens its intro card. The search box above filters every group as you
 * type (`searchSongs`: title, composer, instrument, description; Turkish letters and accents don't matter).
 */
export class LessonsDrawer {
  private readonly el = byId('lessons');
  private readonly search = byId<HTMLInputElement>('songSearch');

  constructor(
    private readonly store: SettingsStore,
    private readonly onPick: (song: Song) => void,
    onTour: () => void,
    onClose: () => void,
    onAddSong: () => void,
  ) {
    byId('customBtn').onclick = () => {
      this.close();
      onAddSong();
    };
    byId('lessonsClose').onclick = () => {
      this.close();
      onClose();
    };
    this.search.oninput = () => this.render();
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
    const mine = this.store.value.customSongs;
    const groups: [string, readonly Song[]][] = [
      ...(mine.length ? [['lesson.mine', mine] as [string, readonly Song[]]] : []),
      ['lesson.course', SONGS.filter((s) => s.course !== undefined)],
      ['lesson.songs', SONGS.filter((s) => s.course === undefined && s.mode === PlayMode.chord)],
      ['lesson.noteMode', SONGS.filter((s) => s.mode === PlayMode.note && s.instrument !== 'bass')],
      ['lesson.bass', SONGS.filter((s) => s.instrument === 'bass')],
    ];
    this.search.placeholder = t('lesson.searchHint');
    const query = this.search.value;
    let shown = 0;
    for (const [key, all] of groups) {
      const songs = searchSongs(all, query, songSearchText);
      if (!songs.length) continue;
      shown += songs.length;
      const label = document.createElement('div');
      label.className = 'group-label';
      label.textContent = t(key);
      list.append(label, ...songs.map((s) => this.row(s)));
    }
    if (!shown) list.append(cell('empty muted', t('lesson.noMatch', { query: query.trim() })));
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
    const meta = cell('meta wide', song.id.startsWith('my-') ? `${song.bpm} BPM · ${song.chords ?? ''}` : `${t(song.credit)} · ${song.bpm} BPM · ${t(instrumentById(song.instrument).name)}`);
    if (best !== undefined) meta.append(cell('best', ` · ${t('lesson.best')} ${Math.round(best * PERCENT)}%`));
    el.append(name, level, cell('about', t(song.about)), meta);
    if (song.id.startsWith('my-')) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete';
      del.textContent = t('custom.delete');
      del.onclick = (e) => {
        e.stopPropagation();
        this.store.update({ customSongs: this.store.value.customSongs.filter((s) => s.id !== song.id) });
      };
      el.append(del);
    }
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
