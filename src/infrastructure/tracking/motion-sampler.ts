import type { MotionGrid } from '@domain/tracking/motion-grid';

/** The motion grid is this many cells wide; tall enough to keep the frame's shape. Coarse is cheap and enough. */
const GRID_WIDTH = 96;
/** Luma weights of red, green and blue. */
const LUMA = [0.299, 0.587, 0.114] as const;
const RGBA = 4;

/**
 * **MotionSampler** — shrinks each camera frame to a small grey picture, mirrored like the stage, and keeps how much
 * every cell changed since the frame before.
 */
export class MotionSampler {
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private prev: Uint8Array | null = null;
  private grid: MotionGrid | null = null;

  /** The latest frame's changes, or null before two frames have been seen. */
  get latest(): MotionGrid | null {
    return this.grid;
  }

  sample(video: HTMLVideoElement): void {
    if (!video.videoWidth || !video.videoHeight) return;
    const w = GRID_WIDTH;
    const h = Math.max(1, Math.round((GRID_WIDTH * video.videoHeight) / video.videoWidth));
    const canvas = this.canvasOf(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.setTransform(-1, 0, 0, 1, w, 0);
    ctx.drawImage(video, 0, 0, w, h);
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const grey = new Uint8Array(w * h);
    for (let i = 0; i < grey.length; i++) grey[i] = (rgba[i * RGBA] ?? 0) * LUMA[0] + (rgba[i * RGBA + 1] ?? 0) * LUMA[1] + (rgba[i * RGBA + 2] ?? 0) * LUMA[2];
    const prev = this.prev;
    this.prev = grey;
    if (!prev || prev.length !== grey.length) return;
    const cells = new Uint8Array(grey.length);
    for (let i = 0; i < grey.length; i++) cells[i] = Math.abs((grey[i] ?? 0) - (prev[i] ?? 0));
    this.grid = { width: w, height: h, cells };
  }

  reset(): void {
    this.prev = null;
    this.grid = null;
  }

  private canvasOf(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
    if (this.canvas && this.canvas.width === w && this.canvas.height === h) return this.canvas;
    this.canvas = typeof OffscreenCanvas === 'undefined' ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : new OffscreenCanvas(w, h);
    return this.canvas;
  }
}
