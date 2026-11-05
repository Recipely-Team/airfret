import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { Clip } from '@domain/recording/clip';
import { pickMimeType } from '@domain/recording/clip-format';
import type { ClipRecorderInterface } from '@domain/recording/clip-recorder-interface';
import type { StageCompositor } from '@infrastructure/recording/stage-compositor';

const FPS = 30;
const VIDEO_BPS = 4_000_000;
const AUDIO_BPS = 160_000;
/** The recorder hands over data this often, so a long clip isn't one buffer written at the very end. */
const SLICE_MS = 1000;
const MS = 1000;

/**
 * **BrowserClipRecorder** — the `ClipRecorderInterface` on `MediaRecorder`: the compositor's canvas (camera +
 * stage) as the picture, the audio engine's output as the sound.
 *
 * @remarks
 * - Nothing leaves the browser: the clip is an object URL until the player saves it.
 * - The sound stream belongs to the engine and is reused, so only the picture track is stopped after a clip.
 */
export class BrowserClipRecorder implements ClipRecorderInterface {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private readonly mimeType: string | null;

  constructor(
    private readonly compositor: StageCompositor,
    private readonly sound: () => MediaStream,
  ) {
    const canRecord = typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';
    this.mimeType = canRecord ? pickMimeType((m) => MediaRecorder.isTypeSupported(m)) : null;
  }

  get isSupported(): boolean {
    return this.mimeType !== null;
  }

  get isRecording(): boolean {
    return this.recorder !== null;
  }

  start(): Result<void, Failure> {
    if (this.recorder) return ok(undefined);
    if (!this.mimeType) return fail(new Failure(FailureCode.recordingUnavailable, 'MediaRecorder or canvas capture is missing'));
    try {
      this.compositor.begin();
      const picture = this.compositor.canvas.captureStream(FPS).getVideoTracks();
      const stream = new MediaStream([...picture, ...this.sound().getAudioTracks()]);
      const r = new MediaRecorder(stream, { mimeType: this.mimeType, videoBitsPerSecond: VIDEO_BPS, audioBitsPerSecond: AUDIO_BPS });
      this.chunks = [];
      r.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      r.start(SLICE_MS);
      this.recorder = r;
      this.startedAt = performance.now();
      return ok(undefined);
    } catch (e) {
      this.compositor.end();
      return fail(new Failure(FailureCode.recordingUnavailable, String(e)));
    }
  }

  stop(): Promise<Result<Clip, Failure>> {
    const r = this.recorder;
    if (!r) return Promise.resolve(fail(new Failure(FailureCode.recordingUnavailable, 'not recording')));
    this.recorder = null;
    const seconds = (performance.now() - this.startedAt) / MS;
    return new Promise((resolve) => {
      r.onstop = () => {
        this.compositor.end();
        r.stream.getVideoTracks().forEach((t) => t.stop());
        const mimeType = r.mimeType || this.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.chunks = [];
        if (blob.size === 0) {
          resolve(fail(new Failure(FailureCode.recordingUnavailable, 'the recorder wrote nothing')));
          return;
        }
        resolve(ok({ url: URL.createObjectURL(blob), mimeType, seconds, bytes: blob.size }));
      };
      r.stop();
    });
  }

  release(clip: Clip): void {
    URL.revokeObjectURL(clip.url);
  }
}
