import type { ClipRecorderInterface } from '@domain/recording/clip-recorder-interface';
import { formatElapsed, MAX_CLIP_SECONDS } from '@domain/recording/clip-format';
import { t } from '@presentation/i18n/translator';
import type { ClipDialog } from '@presentation/ui/recording/clip-dialog';
import { byId } from '@presentation/ui/dom';

const TICK_MS = 250;
const MS = 1000;

interface RecordHost {
  readonly recorder: ClipRecorderInterface;
  readonly dialog: ClipDialog;
  isOnStage(): boolean;
  instrumentId(): string;
  /** A short message to the player (a failure, the time limit). */
  say(message: string): void;
}

/**
 * The record button in the top bar: press to record the stage with its sound, press again to stop; while it
 * records it shows the running time. The finished clip opens in the `ClipDialog`.
 *
 * @remarks
 * - Offered only on an instrument's stage, and only where the browser can record.
 * - Leaving the stage, or reaching `MAX_CLIP_SECONDS`, stops the recording and opens what was recorded.
 */
export class RecordButton {
  private readonly btn = byId<HTMLButtonElement>('recBtn');
  private readonly time = byId('recTime');
  private startedAt = 0;
  private timer = 0;

  constructor(private readonly host: RecordHost) {
    this.btn.onclick = () => void this.toggle();
  }

  async toggle(): Promise<void> {
    if (this.host.recorder.isRecording) {
      await this.stop();
      return;
    }
    const started = this.host.recorder.start();
    if (!started.isOk) {
      this.host.say(t('rec.failed'));
      return;
    }
    this.startedAt = performance.now();
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    this.render();
  }

  render(): void {
    const isRecording = this.host.recorder.isRecording;
    if (isRecording && !this.host.isOnStage()) {
      void this.stop();
      return;
    }
    this.btn.hidden = !this.host.recorder.isSupported || !this.host.isOnStage();
    const label = t(isRecording ? 'rec.stop' : 'rec.start');
    this.btn.setAttribute('aria-pressed', String(isRecording));
    this.btn.setAttribute('aria-label', label);
    this.btn.title = label;
    this.time.hidden = !isRecording;
    if (isRecording) this.tick();
  }

  private tick(): void {
    const seconds = (performance.now() - this.startedAt) / MS;
    this.time.textContent = formatElapsed(seconds);
    if (seconds >= MAX_CLIP_SECONDS) {
      this.host.say(t('rec.limit', { time: formatElapsed(MAX_CLIP_SECONDS) }));
      void this.stop();
    }
  }

  private async stop(): Promise<void> {
    clearInterval(this.timer);
    const clip = await this.host.recorder.stop();
    this.render();
    if (clip.isOk) this.host.dialog.show(clip.value, this.host.instrumentId());
    else this.host.say(t('rec.failed'));
  }
}
