import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import type { TrackedHand } from '@domain/tracking/tracked-hand';
import { AssetPath } from '@infrastructure/constants/assets';
import type { MotionGrid } from '@domain/tracking/motion-grid';
import { MotionSampler } from '@infrastructure/tracking/motion-sampler';

const CAMERA = { width: 1280, height: 720, frameRate: 60 } as const;
/**
 * Lower thresholds keep hands through the motion blur of fast strokes: on the owner's strumming recording, 0.3/0.2/0.2
 * found the strumming hand in 39 % of frames where 0.5/0.3/0.3 found it in 15 %; lower still gained nothing.
 */
const MODEL = { numHands: 2, detection: 0.3, presence: 0.2, tracking: 0.2 } as const;
const HAVE_CURRENT_DATA = 2;
/** The GPU backend gets this long to load before the CPU one is used, ms. */
const GPU_TIMEOUT_MS = 8000;

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
  private readonly sampler = new MotionSampler();

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
    this.sampler.reset();
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
    this.sampler.sample(v);
    return this.landmarker.detectForVideo(v, nowMs).landmarks.map((lm) => ({ landmarks: lm.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z })) }));
  }

  motion(): MotionGrid | null {
    return this.stream ? this.sampler.latest : null;
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
    // An old graphics card (or driver) can hang creating the GPU backend instead of failing: give up on it in time.
    const gpu = Promise.race([create('GPU'), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPU timeout')), GPU_TIMEOUT_MS))]);
    return gpu.catch(() => create('CPU'));
  }
}
