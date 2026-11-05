import { describe, expect, it } from 'vitest';
import { FakeHandTracker } from '@application/__fixtures__/fake-hand-tracker';
import { CameraController } from '@application/camera/camera-controller';

function setup() {
  const tracker = new FakeHandTracker();
  const log: string[] = [];
  const camera = new CameraController(tracker, () => log.push('error'), () => log.push('off'));
  return { tracker, camera, log };
}

describe('Turning the camera off and on', () => {
  it('opens the camera and loads tracking the first time, then pauses and reopens it', async () => {
    const { tracker, camera, log } = setup();
    await camera.sync(true);
    expect(camera.isOn).toBe(true);
    await camera.sync(false);
    expect(camera.isOn).toBe(false);
    await camera.sync(true);
    expect(tracker.calls).toEqual(['start', 'pause', 'resume']);
    expect(log).toEqual(['off']);
  });

  it('does nothing while nothing changes (settings re-apply on every change)', async () => {
    const { tracker, camera } = setup();
    await camera.sync(true);
    await camera.sync(true);
    await camera.sync(false);
    await camera.sync(false);
    expect(tracker.calls).toEqual(['start', 'pause']);
  });

  it('never opens the camera while the player keeps it off', async () => {
    const { tracker, camera } = setup();
    await camera.sync(false);
    expect(tracker.calls).toEqual([]);
    expect(camera.isOn).toBe(false);
  });

  it('reports a camera that cannot open once, not on every settings change, and tries again after off and on', async () => {
    const { tracker, camera, log } = setup();
    tracker.canOpen = false;
    await camera.sync(true);
    await camera.sync(true);
    expect(log).toEqual(['error']);
    tracker.canOpen = true;
    await camera.sync(false);
    await camera.sync(true);
    expect(camera.isOn).toBe(true);
    expect(tracker.calls).toEqual(['start', 'start']);
  });

  it('settles on the latest wish when it changes while the camera is opening', async () => {
    const { tracker, camera } = setup();
    const opening = camera.sync(true);
    void camera.sync(false);
    await opening;
    expect(camera.isOn).toBe(false);
    expect(tracker.calls).toEqual(['start', 'pause']);
  });
});
