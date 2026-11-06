/** Paths of static runtime assets, relative to the site base URL. */
export const AssetPath = {
  stringWorklet: 'worklets/strings.js',
  /** Hand-drum recordings, one file per take (`<name>.m4a`). */
  handDrumSamples: 'samples/hand-drums/',
  mediapipeWasm: 'mediapipe',
  handModel: 'models/hand_landmarker.task',
} as const;
