import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import type { TrackedHand } from '@domain/tracking/tracked-hand';
import { AssetPath } from '@infrastructure/constants/assets';

const CAMERA = { width: 1280, height: 720, frameRate: 60 } as const;
/** Lower presence/tracking thresholds keep hands through motion blur in fast strokes. */
const MODEL = { numHands: 2, detection: 0.5, presence: 0.3, tracking: 0.3 } as const;
const HAVE_CURRENT_DATA = 2;

/**
 * **MediaPipeHandTracker** — webcam + MediaPipe Hand Landmarker, entirely in the browser.
 *
 * @remarks
 * - Prefers the GPU delegate and falls back to CPU.
 * - Landmarks are mirrored on x so they line up with the mirrored video the player sees.
 * - `pause` stops the camera tracks outright (the camera light goes off) when no instrument is open.
 */
export class MediaPipeHandTracker implements HandTrackerInterface {
  private landmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  private stream: MediaStream | null = null;

  constructor(private readonly video: HTMLVideoElement) {}

  async start(): Promise<Result<void, Failure>> {
    const camera = await this.openCamera();
    if (!camera.isOk) return camera;
    try {
      this.landmarker = await this.load();
      return ok(undefined);
    } catch (e) {
      return fail(new Failure(FailureCode.trackingUnavailable, String(e)));
    }
  }

  pause(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
    this.video.srcObject = null;
  }

  async resume(): Promise<Result<void, Failure>> {
    return this.stream ? ok(undefined) : this.openCamera();
  }

  private async openCamera(): Promise<Result<void, Failure>> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: CAMERA.width }, height: { ideal: CAMERA.height }, frameRate: { ideal: CAMERA.frameRate }, facingMode: 'user' },
      });
      this.video.srcObject = this.stream;
      this.video.muted = true;
      this.video.playsInline = true;
      await this.video.play();
      return ok(undefined);
    } catch (e) {
      return fail(new Failure(FailureCode.cameraUnavailable, String(e)));
    }
  }

  detect(nowMs: number): TrackedHand[] | null {
    const v = this.video;
    if (!this.stream || !this.landmarker || v.readyState < HAVE_CURRENT_DATA || v.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = v.currentTime;
    return this.landmarker.detectForVideo(v, nowMs).landmarks.map((lm) => ({ landmarks: lm.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z })) }));
  }

  frameSize(): { width: number; height: number } {
    return { width: this.video.videoWidth || CAMERA.width, height: this.video.videoHeight || CAMERA.height };
  }

  private async load(): Promise<HandLandmarker> {
    const base = import.meta.env.BASE_URL;
    const fileset = await FilesetResolver.forVisionTasks(`${base}${AssetPath.mediapipeWasm}`);
    const create = (delegate: 'GPU' | 'CPU') =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${base}${AssetPath.handModel}`, delegate },
        runningMode: 'VIDEO',
        numHands: MODEL.numHands,
        minHandDetectionConfidence: MODEL.detection,
        minHandPresenceConfidence: MODEL.presence,
        minTrackingConfidence: MODEL.tracking,
      });
    return create('GPU').catch(() => create('CPU'));
  }
}
