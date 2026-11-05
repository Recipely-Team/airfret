import type { CompositorView } from '@infrastructure/recording/compositor-view';

/** The recording is at most this wide (or tall, in portrait): enough for a clear clip, light enough to encode live. */
const MAX_SIDE = 1280;
const GROUND = '#0b0b0c';
/** The camera picture's look on the stage (`#cam` in style.css): dimmed by the brightness setting, desaturated, soft. */
const CAMERA = { brightness: 0.7, saturate: 0.6, blurPx: 1 } as const;

/**
 * Draws what the player sees into one canvas a recorder can capture: the camera picture (mirrored, cropped to
 * fill, dimmed like the page shows it), then the stage canvas over it.
 *
 * @remarks
 * - On the page the camera is a `<video>` behind the stage canvas, so capturing the stage alone would lose it.
 * - Runs its own animation loop only while recording.
 */
export class StageCompositor {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null = this.canvas.getContext('2d');
  private frameId = 0;

  constructor(
    private readonly stage: HTMLCanvasElement,
    private readonly video: HTMLVideoElement,
    private readonly view: () => CompositorView,
  ) {}

  begin(): void {
    this.fit();
    cancelAnimationFrame(this.frameId);
    const loop = () => {
      this.draw();
      this.frameId = requestAnimationFrame(loop);
    };
    loop();
  }

  end(): void {
    cancelAnimationFrame(this.frameId);
  }

  /** The recording keeps the stage's shape, scaled down to `MAX_SIDE`; its size is fixed once recording starts. */
  private fit(): void {
    const w = this.stage.width || 1;
    const h = this.stage.height || 1;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    // Even sizes: H.264 encoders reject odd ones.
    this.canvas.width = Math.round((w * scale) / 2) * 2;
    this.canvas.height = Math.round((h * scale) / 2) * 2;
  }

  private draw(): void {
    const c = this.ctx;
    if (!c) return;
    const { width: w, height: h } = this.canvas;
    c.fillStyle = GROUND;
    c.fillRect(0, 0, w, h);
    const v = this.view();
    if (!v.isCameraHidden && this.video.videoWidth > 0) this.drawCamera(c, w, h, v.brightness);
    c.drawImage(this.stage, 0, 0, w, h);
  }

  /** `object-fit: cover` and `scaleX(-1)`, as the page shows it. */
  private drawCamera(c: CanvasRenderingContext2D, w: number, h: number, brightness: number): void {
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    const scale = Math.max(w / vw, h / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    c.save();
    c.filter = `brightness(${brightness * CAMERA.brightness}) saturate(${CAMERA.saturate}) blur(${CAMERA.blurPx}px)`;
    c.translate(w, 0);
    c.scale(-1, 1);
    c.drawImage(this.video, (w - dw) / 2, (h - dh) / 2, dw, dh);
    c.restore();
  }
}
