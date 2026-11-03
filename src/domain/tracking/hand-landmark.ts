/** MediaPipe hand landmark indices used by the app. */
export const HandLandmark = {
  wrist: 0,
  thumbIp: 3,
  thumbTip: 4,
  indexMcp: 5,
  indexPip: 6,
  indexDip: 7,
  indexTip: 8,
  middleMcp: 9,
  middlePip: 10,
  middleTip: 12,
  ringPip: 14,
  ringTip: 16,
  pinkyMcp: 17,
  pinkyPip: 18,
  pinkyTip: 20,
} as const;

export type HandLandmark = (typeof HandLandmark)[keyof typeof HandLandmark];

/** Fingertips drawn as dots. */
export const FINGERTIPS: readonly HandLandmark[] = [
  HandLandmark.thumbTip,
  HandLandmark.indexTip,
  HandLandmark.middleTip,
  HandLandmark.ringTip,
  HandLandmark.pinkyTip,
];
