import type { Point } from '@domain/fretboard/point';

/** Maps a normalised video point to screen px, matching `object-fit: cover` on the video element. */
export function videoToScreen(p: Point, frame: { width: number; height: number }, w: number, h: number): Point {
  const scale = Math.max(w / frame.width, h / frame.height);
  const dw = frame.width * scale;
  const dh = frame.height * scale;
  const x = (w - dw) / 2 + p.x * dw;
  const y = (h - dh) / 2 + p.y * dh;
  return p.z === undefined ? { x, y } : { x, y, z: p.z * dw };
}

/** The inverse of `videoToScreen`: a point on screen as shares (0–1) of the camera frame it covers. */
export function screenToVideo(p: Point, frame: { width: number; height: number }, w: number, h: number): Point {
  const scale = Math.max(w / frame.width, h / frame.height);
  const dw = frame.width * scale;
  const dh = frame.height * scale;
  return { x: (p.x - (w - dw) / 2) / dw, y: (p.y - (h - dh) / 2) / dh };
}
