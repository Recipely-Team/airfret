import { DemoPerformer } from '@application/demo/demo-performer';
import { showPerformance } from '@application/demo/show-performance';
import { watchableSongs } from '@application/demo/watchable-songs';
import type { Player } from '@application/play/player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Instrument } from '@domain/instruments/instrument';
import type { Song } from '@domain/lessons/catalog/song';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { SongPicker } from '@presentation/ui/controls/song-picker';

interface DemoHost {
  readonly player: Player;
  readonly sound: SoundOutputInterface;
  /** Unlocks audio if it isn't yet; false when it can't be. */
  startAudio(): Promise<boolean>;
  instrumentId(): string;
  instrument(): Instrument;
  /** Every song the player can open: the catalog and their own. */
  songs(): readonly Song[];
  /** Sets the instrument up for a song (its tuning) before it is played. */
  prepare(song: Song): void;
  /** Called when the mode or the playing changes. */
  onChange(isPlaying: boolean): void;
}

/**
 * **Watch it play** — the mode in which the instrument plays by itself: pick a song (searchable, `SongPicker`)
 * beside the mode switch (the instrument's showcase piece first, then every song it can play, the player's own included),
 * play or stop it. The stage shows a hand playing it.
 *
 * @remarks
 * - The mode stays on when a song ends or is stopped; picking another mode leaves it.
 * - While it plays, the player can still strike the strings — mouse or strumming hand — and hears what its hand holds.
 */
export class DemoController {
  private readonly performer: DemoPerformer;
  private readonly button = byId<HTMLButtonElement>('demoBtn');
  private readonly picker: SongPicker;
  private on = false;
  private songId = '';

  constructor(private readonly host: DemoHost) {
    this.performer = new DemoPerformer(host.sound);
    this.button.onclick = () => void (this.isPlaying ? this.stop() : this.playChosen());
    this.picker = new SongPicker((song) => {
      this.songId = song.id;
      void this.playChosen();
    });
  }

  get isPlaying(): boolean {
    return this.performer.isPlaying;
  }

  /** The *Watch it play* mode is on — never on the drums, which have nothing to play by themselves. */
  get isOn(): boolean {
    return this.on && this.hasDemo;
  }

  /** The current instrument has songs it can play by itself (not the drums). */
  get hasDemo(): boolean {
    return this.songs().length > 0;
  }

  /** Turns the mode on and plays `song`, or the chosen one (at first the instrument's showcase piece). */
  async enter(song?: Song): Promise<void> {
    this.on = true;
    if (song) this.songId = song.id;
    await this.playChosen();
  }

  /** Leaves the mode (another mode was picked, a lesson started, the page changed). */
  leave(): void {
    if (!this.on) return;
    this.on = false;
    this.performer.stop();
    this.changed();
  }

  stop(): void {
    if (!this.isPlaying) return;
    this.performer.stop();
    this.changed();
  }

  /** One animation frame: advances the piece and shows it; notices when it has ended. */
  tick(now: number): void {
    const wasPlaying = this.isPlaying;
    const p = this.host.player;
    const frame = wasPlaying ? this.performer.update(p.layout, p.instrument, p.capo, this.host.sound.now) : null;
    showPerformance(p, frame, now);
    // `update` returns null once the piece has ended.
    if (wasPlaying && frame === null) this.changed();
  }

  /** The song list and the Play / Stop button, shown only while the mode is on. */
  render(): void {
    this.picker.hidden = !this.isOn;
    this.button.hidden = !this.isOn;
    if (!this.isOn) return;
    const songs = this.songs();
    this.picker.show(songs, this.chosen(songs));
    this.button.textContent = t(this.isPlaying ? 'demo.stop' : 'demo.start');
    this.button.setAttribute('aria-pressed', String(this.isPlaying));
  }

  private songs(): Song[] {
    return watchableSongs(this.host.songs(), this.host.instrumentId());
  }

  /** The chosen song if this instrument can play it, else its showcase piece. */
  private chosen(songs: readonly Song[]): Song | undefined {
    return songs.find((s) => s.id === this.songId) ?? songs[0];
  }

  private async playChosen(): Promise<void> {
    const song = this.chosen(this.songs());
    if (!song) return;
    this.songId = song.id;
    if (this.isPlaying) this.performer.stop();
    this.host.prepare(song);
    if (!(await this.host.startAudio())) return;
    this.performer.start(song, this.host.instrument(), this.host.sound.now);
    this.changed();
  }

  private changed(): void {
    this.render();
    this.host.onChange(this.isPlaying);
  }
}
