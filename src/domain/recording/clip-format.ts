/**
 * Choices about recorded clips that don't depend on the browser: the format to ask for, how long a clip may run,
 * how its length reads and what the saved file is called.
 */

/** A clip stops by itself after this long, so a forgotten recording can't fill the memory (≈ 300 MB at 4 Mb/s). */
export const MAX_CLIP_SECONDS = 600;

/**
 * Formats to ask the browser for, best first. MP4 plays and shares everywhere (phones, messaging apps); WebM is
 * what older Chrome and Firefox can write.
 */
export const CLIP_MIME_TYPES = [
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
] as const;

const SECONDS_PER_MINUTE = 60;
const PAD = 2;
const BYTES_PER_MB = 1024 * 1024;

/** The first format the browser can record, or null when it can record none. */
export function pickMimeType(canRecord: (mimeType: string) => boolean): string | null {
  return CLIP_MIME_TYPES.find((m) => canRecord(m)) ?? null;
}

/** File extension for a recorded format: `mp4` or `webm`. */
export function clipExtension(mimeType: string): string {
  return mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
}

/** `m:ss`, as a recording timer shows it. */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / SECONDS_PER_MINUTE)}:${String(s % SECONDS_PER_MINUTE).padStart(PAD, '0')}`;
}

/** Size in megabytes with one decimal, e.g. `4.2`. */
export function formatMegabytes(bytes: number): string {
  return (bytes / BYTES_PER_MB).toFixed(1);
}

/** `airfret-acoustic-2026-11-05-1432.mp4`: sorts by date, says which instrument, no characters a file system rejects. */
export function clipFileName(instrumentId: string, at: Date, mimeType: string): string {
  const p = (n: number) => String(n).padStart(PAD, '0');
  const stamp = `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}-${p(at.getHours())}${p(at.getMinutes())}`;
  const name = instrumentId.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'clip';
  return `airfret-${name}-${stamp}.${clipExtension(mimeType)}`;
}
