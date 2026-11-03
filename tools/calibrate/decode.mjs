import { execFileSync } from 'node:child_process';
import { SR } from './analyze.mjs';

/** Decodes any audio file to mono Float32 at 48 kHz using ffmpeg. */
export function decode(path) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}
