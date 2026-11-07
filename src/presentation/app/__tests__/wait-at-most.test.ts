import { describe, expect, it, vi } from 'vitest';
import { waitAtMost } from '@presentation/app/wait-at-most';

describe('Starting on a slow machine', () => {
  it('stops waiting for a camera that hangs, so the player can play with the mouse', async () => {
    vi.useFakeTimers();
    let isDone = false;
    void waitAtMost(new Promise<void>(() => {}), 10000).then(() => (isDone = true));
    await vi.advanceTimersByTimeAsync(9000);
    expect(isDone).toBe(false);
    await vi.advanceTimersByTimeAsync(1500);
    expect(isDone).toBe(true);
    vi.useRealTimers();
  });

  it('goes on at once when the camera is ready', async () => {
    await expect(waitAtMost(Promise.resolve(), 10000)).resolves.toBeUndefined();
  });
});
