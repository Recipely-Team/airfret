import { DEMO_SONG_BY_INSTRUMENT } from '@application/demo/demo-songs';
import { DemoPerformer } from '@application/demo/demo-performer';
import { showPerformance } from '@application/demo/show-performance';
import type { Player } from '@application/play/player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Instrument } from '@domain/instruments/instrument';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';

interface DemoHost {
  readonly player: Player;
  readonly sound: SoundOutputInterface;
  /** Unlocks audio if it isn't yet; false when it can't be. */
  startAudio(): Promise<boolean>;
  instrumentId(): string;
  instrument(): Instrument;
  /** Called when the demo starts or ends. */
  onChange(isPlaying: boolean): void;
}

/**
 * The instrument playing by itself, outside lessons: the "Watch it play" buttons start a piece chosen for
 * the instrument (`DEMO_SONG_BY_INSTRUMENT`) and stop it; the stage shows a hand playing it.
 *
 * @remarks
 * - The camera isn't needed — the demo can run before the player has pressed Start.
 * - While it plays, the tracked hands don't play the instrument (the app skips them).
 */
export class DemoController {
  private readonly performer: DemoPerformer;
  private readonly buttons = [byId<HTMLButtonElement>('demoBtn'), byId<HTMLButtonElement>('startDemo')];

  constructor(private readonly host: DemoHost) {
    this.performer = new DemoPerformer(host.sound);
    for (const b of this.buttons) b.onclick = () => void this.toggle();
  }

  get isPlaying(): boolean {
    return this.performer.isPlaying;
  }

  /** Whether the current instrument has a piece to play by itself. */
  get hasDemo(): boolean {
    return DEMO_SONG_BY_INSTRUMENT[this.host.instrumentId()] !== undefined;
  }

  async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    const song = SONGS.find((s) => s.id === DEMO_SONG_BY_INSTRUMENT[this.host.instrumentId()]);
    if (!song || !(await this.host.startAudio())) return;
    if (this.performer.start(song, this.host.instrument(), this.host.sound.now).isOk) this.changed();
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

  /** Button labels, and whether the stage's demo button is offered at all. */
  render(): void {
    const label = t(this.isPlaying ? 'demo.stop' : 'demo.play');
    for (const b of this.buttons) {
      b.textContent = label;
      b.setAttribute('aria-pressed', String(this.isPlaying));
    }
    this.buttons.forEach((b) => (b.hidden = !this.hasDemo));
  }

  private changed(): void {
    this.render();
    this.host.onChange(this.isPlaying);
  }
}
