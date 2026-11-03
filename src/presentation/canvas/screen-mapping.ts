import type { Point } from '@domain/fretboard/point';

/** Maps a normalised video point to screen px, matching `object-fit: cover` on the video element. */
export function videoToScreen(p: Point, frame: { width: number; height: number }, w: number, h: number): Point {
  const scale = Math.max(w / frame.width, h / frame.height);
  const dw = frame.width * scale;
  const dh = frame.height * scale;
  return { x: (w - dw) / 2 + p.x * dw, y: (h - dh) / 2 + p.y * dh };
}
