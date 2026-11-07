import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepPlayingWhileHidden } from '@presentation/app/keep-playing-hidden';

/** A document whose visibility the test flips. */
class FakeDocument {
  hidden = false;
  private listener: (() => void) | null = null;
  addEventListener(_type: string, listener: () => void): void {
    this.listener = listener;
  }
  flip(isHidden: boolean): void {
    this.hidden = isHidden;
    this.listener?.();
  }
}

describe('Switching to another tab', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps a self-playing song going while the tab is hidden, and hands it back to the frames when it shows', () => {
    vi.useFakeTimers();
    const doc = new FakeDocument();
    let ticks = 0;
    keepPlayingWhileHidden(doc as unknown as Document, () => ticks++);
    vi.advanceTimersByTime(1000);
    expect(ticks).toBe(0);
    doc.flip(true);
    vi.advanceTimersByTime(1000);
    // Often enough that the notes scheduled 0.2 s ahead never run out.
    expect(ticks).toBeGreaterThanOrEqual(10);
    const whileHidden = ticks;
    doc.flip(false);
    vi.advanceTimersByTime(1000);
    expect(ticks).toBe(whileHidden);
  });
});
