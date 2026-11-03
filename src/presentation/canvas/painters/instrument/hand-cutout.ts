import type { Point } from '@domain/fretboard/point';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const MASK_SCALE = 0.5;
const PALM = [0, 1, 5, 9, 13, 17];
const FINGERS = [[0, 1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
/** Finger thickness as a fraction of the wrist → middle-knuckle distance. */
const FINGER_WIDTH = 0.26;
const EDGE_BLUR_PX = 2.5;

/**
 * **HandCutout** — draws the player's real hands from the camera image *in front of* the guitar,
 * so fingers sit on the strings instead of behind a drawing.
 *
 * @remarks
 * - A mask is built from the landmarks (palm polygon + thick rounded finger bones, softly blurred),
 *   the mirrored, cover-fitted video is composited into it, and the result is drawn over the scene.
 */
export class HandCutout {
  private readonly mask = document.createElement('canvas');

  draw(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, hands: readonly (readonly Point[])[], w: number, h: number, brightness: number): void {
    if (!hands.length || video.readyState < 2 || !video.videoWidth) return;
    const mw = Math.round(w * MASK_SCALE);
    const mh = Math.round(h * MASK_SCALE);
    if (this.mask.width !== mw || this.mask.height !== mh) {
      this.mask.width = mw;
      this.mask.height = mh;
    }
    const m = this.mask.getContext('2d');
    if (!m) return;
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, mw, mh);
    m.filter = `blur(${EDGE_BLUR_PX}px)`;
    m.fillStyle = '#fff';
    m.strokeStyle = '#fff';
    m.lineCap = 'round';
    m.lineJoin = 'round';
    for (const hand of hands) this.shape(m, hand);
    m.filter = 'none';
    m.globalCompositeOperation = 'source-in';
    const scale = Math.max(w / video.videoWidth, h / video.videoHeight);
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    m.save();
    m.scale(MASK_SCALE, MASK_SCALE);
    m.translate(w, 0);
    m.scale(-1, 1);
    m.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
    m.restore();
    ctx.save();
    ctx.filter = `brightness(${Math.min(1.2, brightness + 0.35)}) saturate(0.85)`;
    ctx.drawImage(this.mask, 0, 0, w, h);
    ctx.restore();
  }

  private shape(m: CanvasRenderingContext2D, hand: readonly Point[]): void {
    const at = (i: number) => hand[i];
    const wrist = at(HandLandmark.wrist);
    const knuckle = at(HandLandmark.middleMcp);
    if (!wrist || !knuckle) return;
    const size = Math.hypot(knuckle.x - wrist.x, knuckle.y - wrist.y) * MASK_SCALE;
    m.beginPath();
    PALM.forEach((i, k) => {
      const p = at(i);
      if (!p) return;
      if (k === 0) m.moveTo(p.x * MASK_SCALE, p.y * MASK_SCALE);
      else m.lineTo(p.x * MASK_SCALE, p.y * MASK_SCALE);
    });
    m.closePath();
    m.fill();
    m.lineWidth = size * FINGER_WIDTH * 1.4;
    m.stroke();
    for (const chain of FINGERS) {
      m.lineWidth = size * FINGER_WIDTH;
      m.beginPath();
      chain.forEach((i, k) => {
        const p = at(i);
        if (!p) return;
        if (k === 0) m.moveTo(p.x * MASK_SCALE, p.y * MASK_SCALE);
        else m.lineTo(p.x * MASK_SCALE, p.y * MASK_SCALE);
      });
      m.stroke();
    }
  }
}
