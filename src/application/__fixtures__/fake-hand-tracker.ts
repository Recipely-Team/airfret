import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import type { TrackedHand } from '@domain/tracking/tracked-hand';

/** A hand tracker that records what was asked of it; `canOpen` decides whether the camera opens. */
export class FakeHandTracker implements HandTrackerInterface {
  canOpen = true;
  readonly calls: string[] = [];

  start(): Promise<Result<void, Failure>> {
    this.calls.push('start');
    return Promise.resolve(this.canOpen ? ok(undefined) : fail(new Failure(FailureCode.cameraUnavailable, 'denied')));
  }

  resume(): Promise<Result<void, Failure>> {
    this.calls.push('resume');
    return Promise.resolve(this.canOpen ? ok(undefined) : fail(new Failure(FailureCode.cameraUnavailable, 'denied')));
  }

  pause(): void {
    this.calls.push('pause');
  }

  detect(): TrackedHand[] | null {
    return null;
  }

  frameSize(): { width: number; height: number } {
    return { width: 640, height: 480 };
  }
}
