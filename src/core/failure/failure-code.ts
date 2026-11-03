/** Every way an operation in the app can fail. */
export const FailureCode = {
  cameraUnavailable: 'camera-unavailable',
  trackingUnavailable: 'tracking-unavailable',
  audioUnavailable: 'audio-unavailable',
  invalidChart: 'invalid-chart',
} as const;

export type FailureCode = (typeof FailureCode)[keyof typeof FailureCode];
