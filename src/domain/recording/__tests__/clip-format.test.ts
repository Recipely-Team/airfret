import { describe, expect, it } from 'vitest';
import { clipExtension, clipFileName, formatElapsed, formatMegabytes, MAX_CLIP_SECONDS, pickMimeType } from '@domain/recording/clip-format';

describe('Recorded clips', () => {
  it('asks for MP4 first, so a clip opens on phones and in messaging apps', () => {
    expect(pickMimeType(() => true)).toMatch(/^video\/mp4/);
  });

  it('falls back to WebM where the browser can only write WebM', () => {
    expect(pickMimeType((m) => m === 'video/webm')).toBe('video/webm');
  });

  it('offers no format when the browser can record none, so the button can be hidden', () => {
    expect(pickMimeType(() => false)).toBeNull();
  });

  it('names the file after the format it was really recorded in', () => {
    expect(clipExtension('video/mp4;codecs=avc1')).toBe('mp4');
    expect(clipExtension('video/webm;codecs=vp9,opus')).toBe('webm');
    expect(clipExtension('video/x-matroska')).toBe('webm');
  });

  it('names a clip by instrument and local time, sortable and safe on every file system', () => {
    const at = new Date(2026, 10, 5, 9, 7);
    expect(clipFileName('bass-5', at, 'video/mp4')).toBe('airfret-bass-5-2026-11-05-0907.mp4');
    expect(clipFileName('Weird / Name', at, 'video/webm')).toBe('airfret-weird-name-2026-11-05-0907.webm');
    expect(clipFileName('', at, 'video/webm')).toBe('airfret-clip-2026-11-05-0907.webm');
  });

  it('shows the running time as minutes and seconds', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(7.9)).toBe('0:07');
    expect(formatElapsed(61)).toBe('1:01');
    expect(formatElapsed(MAX_CLIP_SECONDS)).toBe('10:00');
    expect(formatElapsed(-3)).toBe('0:00');
  });

  it('shows the size in megabytes', () => {
    expect(formatMegabytes(4.25 * 1024 * 1024)).toBe('4.3');
  });
});
