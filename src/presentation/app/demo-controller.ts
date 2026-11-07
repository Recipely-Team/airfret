import { DemoPerformer } from '@application/demo/demo-performer';
import { EnsemblePerformer } from '@application/demo/ensemble-performer';
import type { EnsembleOutputInterface } from '@domain/audio/ensemble-output-interface';
import { PlayMode } from '@domain/instruments/play-mode';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { EnsemblePicker } from '@presentation/ui/controls/ensemble-picker';
import { HOME_GROUPS } from '@presentation/ui/navigation/home-groups';
import { showPerformance } from '@application/demo/show-performance';
import { watchableSongs } from '@application/demo/watchable-songs';
import type { Player } from '@application/play/player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Instrument } from '@domain/instruments/instrument';
import type { Song } from '@domain/lessons/catalog/song';
import type { StagePerformance } from '@presentation/app/stages/stage-performance';
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
  /** How the current page plays by itself, when it isn't a fretted instrument (keys, hand drums). */
  performance(): StagePerformance | undefined;
}

/**
 * **Watch it play** — the mode in which the instrument plays by itself: pick a song (searchable, `SongPicker`)
 * beside the mode switch (the instrument's showcase piece first, then every song it can play, the player's own included),
 * play or stop it. The stage shows a hand playing it.
 *
 * @remarks
 * - The mode stays on when a song ends or is stopped; picking another mode leaves it.
 * - While it plays, the player can still strike the strings — mouse or strumming hand — and hears what its hand holds.
 * - Other pages (keys, winds, hand drums) play through their stage's own `StagePerformance`.
 */
export class DemoController {
  private readonly performer: DemoPerformer;
  private readonly button = byId<HTMLButtonElement>('demoBtn');
  private readonly picker: SongPicker;
  private on = false;
  private songId = '';
  private together: { performer: EnsemblePerformer; picker: EnsemblePicker; out: EnsembleOutputInterface; members: () => readonly string[] } | null = null;

  constructor(private readonly host: DemoHost) {
    this.performer = new DemoPerformer(host.sound);
    this.button.onclick = () => void (this.isPlaying ? this.stop() : this.playChosen());
    this.picker = new SongPicker((song) => {
      this.songId = song.id;
      void this.playChosen();
    });
  }

  get isPlaying(): boolean {
    return this.performer.isPlaying || (this.host.performance()?.isPlaying ?? false);
  }

  /** The *Watch it play* mode is on (where the instrument has songs to play). */
  get isOn(): boolean {
    return this.on && this.hasDemo;
  }

  /** The current instrument has songs it can play by itself. */
  get hasDemo(): boolean {
    return this.songs().length > 0;
  }

  /**
   * Lets other instruments join in (*Together*): their sound, and the chosen ones in the settings. They play the same
   * song as the instrument on screen, each in its own range, from their own recordings.
   */
  joinWith(out: EnsembleOutputInterface, members: () => readonly string[], setMembers: (ids: readonly string[]) => void): void {
    this.together = { performer: new EnsemblePerformer(out, this.host.sound), picker: new EnsemblePicker((ids) => setMembers(ids)), out, members };
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
    this.halt();
    this.changed();
  }

  stop(): void {
    if (!this.isPlaying) return;
    this.halt();
    this.changed();
  }

  /** One animation frame: advances the piece and shows it; notices when it has ended. */
  tick(now: number): void {
    this.together?.performer.update(this.host.sound.now);
    const stage = this.host.performance();
    if (stage) {
      if (stage.isPlaying && !stage.perform(this.host.sound.now)) this.changed();
      return;
    }
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
    if (!this.isOn) {
      if (this.together) this.together.picker.hidden = true;
      return;
    }
    const songs = this.songs();
    this.picker.show(songs, this.chosen(songs));
    this.renderTogether(this.chosen(songs));
    this.button.textContent = t(this.isPlaying ? 'demo.stop' : 'demo.start');
    this.button.setAttribute('aria-pressed', String(this.isPlaying));
  }

  private songs(): Song[] {
    const stage = this.host.performance();
    return stage ? stage.songs(this.host.songs()) : watchableSongs(this.host.songs(), this.host.instrumentId());
  }

  /** The chosen song if this instrument can play it, else its showcase piece. */
  private chosen(songs: readonly Song[]): Song | undefined {
    return songs.find((s) => s.id === this.songId) ?? songs[0];
  }

  private async playChosen(): Promise<void> {
    const song = this.chosen(this.songs());
    if (!song) return;
    this.songId = song.id;
    if (this.isPlaying) this.halt();
    this.host.prepare(song);
    if (!(await this.host.startAudio())) return;
    const stage = this.host.performance();
    if (stage) stage.play(song, this.host.sound.now);
    else this.performer.start(song, this.host.instrument(), this.host.sound.now);
    this.together?.performer.start(song, this.joining(), this.host.sound.now);
    this.changed();
  }

  private halt(): void {
    this.together?.performer.stop();
    this.performer.stop();
    this.host.performance()?.stop(this.host.sound.now);
  }

  /** The instruments joining in: those chosen, but not the one on screen. */
  private joining(): string[] {
    return (this.together?.members() ?? []).filter((id) => id !== this.host.instrumentId());
  }

  /** *Together* shows beside a melody (a drum rhythm has nothing to join), its members' recordings loading. */
  private renderTogether(song: Song | undefined): void {
    const t = this.together;
    if (!t) return;
    const isMelody = song?.mode === PlayMode.note || song?.mode === PlayMode.chord;
    t.picker.hidden = !isMelody;
    if (!isMelody) return;
    const here = this.host.instrumentId();
    // Every instrument with real recordings can join, and every drum: a drum plays the song's beat.
    t.picker.show(HOME_GROUPS.flatMap((g) => g.ids).filter((id) => id !== here && (t.out.canPlay(id) || id === DRUMS_ID || handDrumFor(id) !== undefined)), this.joining());
    t.out.prepare(this.joining());
  }

  private changed(): void {
    this.render();
    this.host.onChange(this.isPlaying);
  }
}
