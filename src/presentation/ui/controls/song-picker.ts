import { searchSongs } from '@application/lessons/search-songs';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import type { Song } from '@domain/lessons/catalog/song';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { songSearchText } from '@presentation/ui/lessons/song-search-text';

/** The panel is never wider than this, and keeps this margin from the screen's edge. */
const PANEL = { maxWidth: 380, margin: 12, gap: 6 } as const;

/**
 * The *Watch it play* song picker: a button showing the chosen song; it opens a panel with a search box and
 * every song the instrument can play, filtered as you type. Enter picks the first match; Escape or a click
 * elsewhere closes it.
 */
export class SongPicker {
  private readonly button = byId<HTMLButtonElement>('demoSong');
  private readonly panel = byId('songPicker');
  private readonly input = byId<HTMLInputElement>('songPickerSearch');
  private readonly list = byId('songPickerList');
  private songs: readonly Song[] = [];
  private chosenId = '';

  constructor(private readonly onPick: (song: Song) => void) {
    this.button.onclick = () => (this.panel.hidden ? this.open() : this.close());
    this.input.oninput = () => this.renderList();
    this.input.onkeydown = (e) => {
      const first = this.matches()[0];
      if (e.key === 'Enter' && first) this.pick(first);
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('pointerdown', (e) => {
      const target = e.target as Node;
      if (!this.panel.hidden && !this.panel.contains(target) && !this.button.contains(target)) this.close();
    });
  }

  set hidden(isHidden: boolean) {
    this.button.hidden = isHidden;
    if (isHidden) this.close();
  }

  /** The songs to offer and the chosen one (shown on the button). */
  show(songs: readonly Song[], chosen: Song | undefined): void {
    this.songs = songs;
    this.chosenId = chosen?.id ?? '';
    this.button.textContent = chosen?.title ?? t('demo.find');
    this.button.setAttribute('aria-label', `${t('demo.song')}: ${chosen?.title ?? ''}`);
    if (!this.panel.hidden) this.renderList();
  }

  private open(): void {
    const r = this.button.getBoundingClientRect();
    const width = Math.min(PANEL.maxWidth, window.innerWidth - 2 * PANEL.margin);
    this.panel.style.width = `${width}px`;
    this.panel.style.left = `${Math.max(PANEL.margin, Math.min(r.left, window.innerWidth - width - PANEL.margin))}px`;
    this.panel.style.top = `${r.bottom + PANEL.gap}px`;
    this.input.value = '';
    this.input.placeholder = t('lesson.searchHint');
    this.renderList();
    this.panel.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    this.input.focus();
  }

  private close(): void {
    this.panel.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
  }

  private matches(): Song[] {
    return searchSongs(this.songs, this.input.value, songSearchText);
  }

  private renderList(): void {
    const found = this.matches();
    if (!found.length) {
      const empty = document.createElement('p');
      empty.className = 'muted small empty';
      empty.textContent = t('lesson.noMatch', { query: this.input.value.trim() });
      this.list.replaceChildren(empty);
      return;
    }
    this.list.replaceChildren(...found.map((song) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'song-option';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(song.id === this.chosenId));
      const title = document.createElement('strong');
      title.textContent = song.title;
      const meta = document.createElement('small');
      const instrument = t(song.instrument === DRUMS_ID ? 'inst.drums' : instrumentById(song.instrument).name);
      meta.textContent = `${t(song.credit)} · ${instrument} · ${song.bpm} BPM`;
      b.append(title, meta);
      b.onclick = () => this.pick(song);
      return b;
    }));
  }

  private pick(song: Song): void {
    this.close();
    this.onPick(song);
  }
}
