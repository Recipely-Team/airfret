/** Starting never waits on the camera longer than this, ms: an old machine may take long (or hang) loading the model. */
const CAMERA_WAIT_MS = 10000;

/**
 * Resolves when `work` does, or after a while without it — the work goes on regardless (the camera comes on when it
 * can; the player plays with the mouse meanwhile).
 */
export function waitAtMost(work: Promise<void>, ms = CAMERA_WAIT_MS): Promise<void> {
  return Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, ms))]);
}
