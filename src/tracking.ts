// Camera + MediaPipe hand landmarks.

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface Point {
  x: number;
  y: number;
}

export interface TrackedHand {
  /** 21 landmarks in mirrored screen space (0–1, x flipped like a mirror). */
  landmarks: Point[];
  score: number;
}

export const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 } as const;

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  readonly video: HTMLVideoElement;
  delegate: 'GPU' | 'CPU' = 'GPU';

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  async startCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 }, facingMode: 'user' },
    });
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();
  }

  async loadModel(): Promise<void> {
    const base = import.meta.env.BASE_URL;
    const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe`);
    const options = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: `${base}models/hand_landmarker.task`, delegate },
      runningMode: 'VIDEO' as const,
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
    try {
      this.landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU'));
    } catch {
      this.delegate = 'CPU';
      this.landmarker = await HandLandmarker.createFromOptions(fileset, options('CPU'));
    }
  }

  /** Returns hands for a new camera frame, or null when the frame hasn't changed. */
  detect(now: number): TrackedHand[] | null {
    const v = this.video;
    if (!this.landmarker || v.readyState < 2 || v.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = v.currentTime;
    const res = this.landmarker.detectForVideo(v, now);
    return res.landmarks.map((lm, i) => ({
      landmarks: lm.map((p) => ({ x: 1 - p.x, y: p.y })),
      score: res.handedness[i]?.[0]?.score ?? 0,
    }));
  }
}

/**
 * One Euro filter (Casiez et al. 2012): heavy smoothing when still, almost
 * none when moving fast — exactly what a strumming hand needs.
 */
export class OneEuro {
  private x: number | null = null;
  private dx = 0;
  private t = 0;

  constructor(
    private minCutoff = 1.2,
    private beta = 0.03,
    private dCutoff = 1,
  ) {}

  reset(): void {
    this.x = null;
  }

  filter(value: number, t: number): number {
    if (this.x === null) {
      this.x = value;
      this.t = t;
      this.dx = 0;
      return value;
    }
    const dt = Math.max(1e-3, t - this.t);
    this.t = t;
    const ad = alpha(dt, this.dCutoff);
    const dx = (value - this.x) / dt;
    this.dx = ad * dx + (1 - ad) * this.dx;
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx) * 100;
    const a = alpha(dt, cutoff);
    this.x = a * value + (1 - a) * this.x;
    return this.x;
  }
}

function alpha(dt: number, cutoff: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

/** How many of the four fingers are extended (thumb ignored — it's unreliable). */
export function extendedFingers(lm: Point[]): number {
  const wrist = lm[0];
  let n = 0;
  for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
    if (dist(lm[tip], wrist) > dist(lm[pip], wrist) * 1.12) n++;
  }
  return n;
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
