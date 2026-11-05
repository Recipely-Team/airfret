import type { Clip } from '@domain/recording/clip';
import { clipExtension, clipFileName, formatElapsed, formatMegabytes } from '@domain/recording/clip-format';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';

/** A saved file is read from the clip's URL after the click; freeing it at once can cut the download short. */
const RELEASE_AFTER_SAVE_MS = 10_000;

/**
 * The finished recording: a preview to watch, Save (a download named by instrument and time) and Discard.
 *
 * @remarks
 * - The clip stays in memory until it is saved or discarded; nothing is uploaded.
 * - Escape doesn't close it — a recording is only thrown away on purpose.
 */
export class ClipDialog {
  private readonly el = byId('clip');
  private readonly video = byId<HTMLVideoElement>('clipVideo');
  private readonly save = byId<HTMLAnchorElement>('clipSave');
  private clip: Clip | null = null;

  constructor(private readonly release: (clip: Clip) => void) {
    byId('clipDiscard').onclick = () => this.close(0);
    // The anchor's own download runs first; the dialog closes after it.
    this.save.addEventListener('click', () => this.close(RELEASE_AFTER_SAVE_MS));
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  show(clip: Clip, instrumentId: string): void {
    this.close(0);
    this.clip = clip;
    this.video.src = clip.url;
    this.save.href = clip.url;
    this.save.download = clipFileName(instrumentId, new Date(), clip.mimeType);
    byId('clipInfo').textContent = t('clip.info', {
      time: formatElapsed(clip.seconds),
      size: formatMegabytes(clip.bytes),
      format: clipExtension(clip.mimeType).toUpperCase(),
    });
    this.el.hidden = false;
  }

  private close(releaseAfterMs: number): void {
    const clip = this.clip;
    this.clip = null;
    this.el.hidden = true;
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
    if (clip) window.setTimeout(() => this.release(clip), releaseAfterMs);
  }
}
